/**
 * WorkflowRunPollSource — sibling EventSource for /repos/:owner/:repo/actions/runs.
 *
 * idea-255 / M-Workflow-Run-Events-Hub-Integration Design v1.0 §1.1 + F1
 * fold. Distinct from the existing PollSource (which polls /events) because
 * workflow_run is NOT in the GitHub /events API surface — it's webhook-only
 * there; the REST equivalent is the /actions/runs endpoint with a different
 * response shape and no ETag-conditional flow.
 *
 * Key differences from PollSource:
 *   - No ETag conditional polling. Cursor is timestamp-based: track
 *     `lastPolledIsoTime` per repo; on each poll, query
 *     `?created=>=<lastPolledIsoTime>&per_page=50`.
 *   - LRU dedupe on `run.id` to handle the small overlap window when the
 *     bridge restarts mid-cycle.
 *   - Distinct `pathPrefix` on its CursorStore so the cursor namespace
 *     doesn't collide with the /events poll-source.
 *
 * Same constants + lifecycle as PollSource (start/stop/health, async-iterator,
 * abort-aware sleep, terminal-on-auth-failure). Per F5 fold: rate-limit fits
 * easily within 4000 req/hr budget; pagination cap is single-page-per-poll
 * (subsequent runs caught next cycle).
 */

import {
  GhApiClient,
  GhApiAuthError,
  GhApiRateLimitError,
  GhApiTransientError,
  PatScopeError,
  REQUIRED_PAT_SCOPES,
  type WorkflowRun,
} from "./gh-api-client.js";
import { CursorStore, type CursorStoreOptions } from "./cursor-store.js";
import { translateWorkflowRun } from "./workflow-run-translator.js";
import type {
  EventSource,
  EventSourceCapabilities,
  EventSourceHealth,
  RepoEvent,
} from "./event-source.js";
import {
  GH_PAT_RATE_LIMIT_PER_HOUR,
  DEFAULT_CADENCE_SECONDS,
  DEFAULT_BUDGET_FRACTION,
  type Logger,
  type PollOutcome,
} from "./poll-source.js";

// ── Constants ─────────────────────────────────────────────────────────

/** Backoff schedule (seconds) for generic transient failures. */
const TRANSIENT_BACKOFF_S = [1, 2, 5, 10, 30] as const;

/** Default per-page page size for /actions/runs (max 100; lean 50 per F5 fold). */
const DEFAULT_PER_PAGE = 50;

/** Cursor-store path prefix; distinct from the /events PollSource namespace. */
const WORKFLOW_RUN_PATH_PREFIX = "repo-event-bridge-workflow-runs";

/**
 * Initial cursor lookback when no cursor exists. Bounds the first-poll
 * historical-backlog flood per F4 fold. 10 minutes is enough to catch
 * recent activity around a Hub restart without pulling weeks of runs.
 */
const INITIAL_LOOKBACK_MS = 10 * 60 * 1000;

// ── Types ─────────────────────────────────────────────────────────────

export interface WorkflowRunPollSourceOptions {
  /** Repo identifiers in `owner/name` form. */
  readonly repos: readonly string[];
  /** GitHub PAT. */
  readonly token: string;
  /** Cadence per repo (seconds). Default 30s. */
  readonly cadenceSeconds?: number;
  /** Budget fraction of GH PAT rate limit. Default 0.8. */
  readonly budgetFraction?: number;
  /** GitHub API base URL (override for testing / GH Enterprise). */
  readonly baseUrl?: string;
  /** Storage backend for cursor + dedupe state. */
  readonly storage: CursorStoreOptions["storage"];
  /** Bounded LRU capacity for the dedupe set. Default 1000. */
  readonly dedupeCapacity?: number;
  /** Required PAT scopes. */
  readonly requiredScopes?: readonly string[];
  /** Per-page size for /actions/runs. Default 50. */
  readonly perPage?: number;
  /** Override fetch (for tests). */
  readonly fetch?: typeof fetch;
  /** Override sleep (for tests). Default `setTimeout`. */
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Override clock (for tests). Default `Date.now`. */
  readonly now?: () => number;
  /** Logger. Defaults to console. */
  readonly logger?: Logger;
}

interface RepoState {
  /** ISO-8601 of the upper bound of the last successful poll window. */
  cursorIsoTime: string;
  /** Storage-token for atomic cursor writes. */
  cursorToken: string | null;
  dedupeToken: string | null;
  transientBackoffIndex: number;
}

// ── WorkflowRunPollSource ─────────────────────────────────────────────

export class WorkflowRunPollSource implements EventSource {
  readonly capabilities: EventSourceCapabilities = Object.freeze({
    transport: "poll",
    latency: "periodic",
    mode: "pull",
    dedupe: true,
    persistedCursor: true,
  });

  private readonly repos: readonly string[];
  private readonly cadenceMs: number;
  private readonly budgetFraction: number;
  private readonly client: GhApiClient;
  private readonly cursorStore: CursorStore;
  private readonly requiredScopes: readonly string[];
  private readonly perPage: number;
  private readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  private readonly now: () => number;
  private readonly logger: Logger;

  private readonly state = new Map<string, RepoState>();
  private readonly queue: RepoEvent[] = [];
  private readonly waiters: Array<(value: IteratorResult<RepoEvent>) => void> = [];

  private started = false;
  private stopped = false;
  private abort?: AbortController;
  private loops: Promise<void>[] = [];

  private healthSnapshot: EventSourceHealth = {
    paused: false,
    lastSuccessfulPoll: new Date(0).toISOString(),
  };

  constructor(options: WorkflowRunPollSourceOptions) {
    this.repos = [...options.repos];
    this.cadenceMs =
      (options.cadenceSeconds ?? DEFAULT_CADENCE_SECONDS) * 1000;
    this.budgetFraction = options.budgetFraction ?? DEFAULT_BUDGET_FRACTION;
    this.requiredScopes = options.requiredScopes ?? REQUIRED_PAT_SCOPES;
    this.perPage = options.perPage ?? DEFAULT_PER_PAGE;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.logger = options.logger ?? defaultLogger();

    this.client = new GhApiClient({
      token: options.token,
      baseUrl: options.baseUrl,
      fetch: options.fetch,
    });
    this.cursorStore = new CursorStore({
      storage: options.storage,
      dedupeCapacity: options.dedupeCapacity,
      pathPrefix: WORKFLOW_RUN_PATH_PREFIX,
    });

    const initialIso = new Date(this.now() - INITIAL_LOOKBACK_MS).toISOString();
    for (const repoId of this.repos) {
      this.state.set(repoId, {
        cursorIsoTime: initialIso,
        cursorToken: null,
        dedupeToken: null,
        transientBackoffIndex: 0,
      });
    }
  }

  // ── EventSource lifecycle ──────────────────────────────────────

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.stopped = false;
    this.abort = new AbortController();

    try {
      await this.client.validateScopes(this.requiredScopes);
    } catch (err) {
      if (err instanceof PatScopeError || err instanceof GhApiAuthError) {
        this.setHealth({
          paused: true,
          pausedReason: "auth-failure",
        });
      }
      this.started = false;
      throw err;
    }

    this.logBudget();

    // Hydrate cursors from storage (recovery after restart). When no
    // committed cursor exists, the constructor's INITIAL_LOOKBACK_MS
    // window stays in effect — bounds the first-poll backlog.
    for (const repoId of this.repos) {
      const cursor = await this.cursorStore.readCursor(repoId);
      const state = this.state.get(repoId)!;
      state.cursorToken = cursor.token;
      if (cursor.value?.lastEventId) {
        // We stash the last-iso time in the cursor's `lastEventId` slot
        // since RepoCursor.shape doesn't have a dedicated timestamp
        // field; the stash is opaque to CursorStore (per its contract).
        state.cursorIsoTime = cursor.value.lastEventId;
      }
    }

    this.loops = this.repos.map((repoId) => this.runLoop(repoId));
  }

  async stop(): Promise<void> {
    if (!this.started || this.stopped) return;
    this.stopped = true;
    this.abort?.abort();
    await Promise.allSettled(this.loops);
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.({ value: undefined as never, done: true });
    }
  }

  health(): EventSourceHealth {
    return this.healthSnapshot;
  }

  [Symbol.asyncIterator](): AsyncIterator<RepoEvent> {
    return {
      next: (): Promise<IteratorResult<RepoEvent>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.stopped) {
          return Promise.resolve({ value: undefined as never, done: true });
        }
        return new Promise((resolve) => {
          this.waiters.push(resolve);
        });
      },
      return: (): Promise<IteratorResult<RepoEvent>> => {
        return Promise.resolve({ value: undefined as never, done: true });
      },
    };
  }

  // ── Public test seam: single-poll cycle for one repo ───────────

  async pollOnce(
    repoId: string,
  ): Promise<{ emitted: number; outcome: PollOutcome; resumeAtMs?: number }> {
    const state = this.state.get(repoId);
    if (!state) {
      throw new Error(`WorkflowRunPollSource: unknown repoId=${repoId}`);
    }

    let result;
    try {
      result = await this.client.pollWorkflowRuns(repoId, {
        createdSince: state.cursorIsoTime,
        perPage: this.perPage,
      });
    } catch (err) {
      if (err instanceof GhApiAuthError) {
        this.setHealth({ paused: true, pausedReason: "auth-failure" });
        return { emitted: 0, outcome: "auth-failure" };
      }
      if (err instanceof GhApiRateLimitError) {
        this.setHealth({ paused: true, pausedReason: "rate-limit" });
        return {
          emitted: 0,
          outcome: "rate-limit",
          resumeAtMs: err.resumeAtMs,
        };
      }
      if (err instanceof GhApiTransientError) {
        return { emitted: 0, outcome: "transient" };
      }
      throw err;
    }

    state.transientBackoffIndex = 0;
    this.setHealth({
      paused: false,
      lastSuccessfulPoll: new Date(this.now()).toISOString(),
    });

    if (result.workflow_runs.length === 0) {
      // No new runs since the cursor; advance cursor anyway to bound
      // the next query window.
      await this.advanceCursor(repoId, state, /*lastSeenRunId*/ null);
      return { emitted: 0, outcome: "ok" };
    }

    // Dedupe by run.id (string-coerced for CursorStore LRU).
    const candidateIds = result.workflow_runs.map((r) => String(r.id));
    const { unseen, token: dedupeToken } = await this.cursorStore.filterUnseen(
      repoId,
      candidateIds,
    );
    state.dedupeToken = dedupeToken;
    const unseenSet = new Set(unseen);
    const fresh: WorkflowRun[] = result.workflow_runs.filter((r) =>
      unseenSet.has(String(r.id)),
    );

    let emitted = 0;
    for (const run of fresh) {
      const repoEvent = translateWorkflowRun(run, repoId);
      this.push(repoEvent);
      emitted++;
    }

    if (fresh.length > 0) {
      try {
        state.dedupeToken = await this.cursorStore.markSeen(
          repoId,
          fresh.map((r) => String(r.id)),
          state.dedupeToken,
        );
      } catch {
        state.dedupeToken = null;
      }
    }

    // Advance cursor to the latest updated_at in this batch (server returns
    // newest-first; but be defensive — pick max).
    const maxUpdatedAt = result.workflow_runs.reduce<string>((acc, r) => {
      return r.updated_at && r.updated_at > acc ? r.updated_at : acc;
    }, state.cursorIsoTime);
    await this.advanceCursor(repoId, state, maxUpdatedAt);

    return { emitted, outcome: "ok" };
  }

  // ── Internals ──────────────────────────────────────────────────

  private async advanceCursor(
    repoId: string,
    state: RepoState,
    nextIsoTime: string | null,
  ): Promise<void> {
    if (nextIsoTime === null || nextIsoTime <= state.cursorIsoTime) return;
    state.cursorIsoTime = nextIsoTime;
    try {
      state.cursorToken = await this.cursorStore.writeCursor(
        repoId,
        {
          // Stash the iso-time in the lastEventId slot per the RepoCursor
          // contract (cursor-store doesn't interpret these fields).
          lastEventId: nextIsoTime,
          updatedAt: new Date(this.now()).toISOString(),
        },
        state.cursorToken,
      );
    } catch {
      state.cursorToken = null;
    }
  }

  private async runLoop(repoId: string): Promise<void> {
    while (!this.stopped) {
      const state = this.state.get(repoId)!;

      try {
        const { outcome, resumeAtMs } = await this.pollOnce(repoId);
        if (outcome === "auth-failure") {
          this.logger.error(
            `[workflow-run-poll-source] PAT auth-failure on ${repoId}; halting source`,
          );
          return;
        }
        if (outcome === "rate-limit") {
          const waitMs = Math.max(
            0,
            (resumeAtMs ?? this.now() + 60_000) - this.now(),
          );
          this.logger.warn(
            `[workflow-run-poll-source] rate-limited on ${repoId}; pausing ${Math.ceil(
              waitMs / 1000,
            )}s`,
          );
          await this.sleepUnlessStopped(waitMs);
          continue;
        }
        if (outcome === "transient") {
          state.transientBackoffIndex = Math.min(
            state.transientBackoffIndex + 1,
            TRANSIENT_BACKOFF_S.length - 1,
          );
          const backoff = TRANSIENT_BACKOFF_S[state.transientBackoffIndex];
          if (backoff > 30) {
            this.setHealth({ paused: true, pausedReason: "network" });
          }
          await this.sleepUnlessStopped(backoff * 1000);
          continue;
        }
      } catch (err) {
        this.logger.error(
          `[workflow-run-poll-source] poll error on ${repoId}: ${
            (err as Error)?.message ?? String(err)
          }`,
        );
      }

      await this.sleepUnlessStopped(this.cadenceMs);
    }
  }

  private push(event: RepoEvent): void {
    if (this.stopped) return;
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value: event, done: false });
    } else {
      this.queue.push(event);
    }
  }

  private setHealth(next: Partial<EventSourceHealth>): void {
    this.healthSnapshot = {
      ...this.healthSnapshot,
      ...next,
    };
  }

  private async sleepUnlessStopped(ms: number): Promise<void> {
    if (this.stopped) return;
    await this.sleep(ms, this.abort?.signal);
  }

  private logBudget(): void {
    const cadenceS = this.cadenceMs / 1000;
    const requestsPerHour = (this.repos.length * 3600) / cadenceS;
    const budgetCap = Math.floor(
      GH_PAT_RATE_LIMIT_PER_HOUR * this.budgetFraction,
    );
    const headroomPct =
      budgetCap > 0
        ? Math.max(0, Math.round((1 - requestsPerHour / budgetCap) * 100))
        : 0;
    const line =
      `[workflow-run-poll-source] Polling ${this.repos.length} repos × ${cadenceS}s ` +
      `cadence = ${Math.round(requestsPerHour)} req/hr ` +
      `(budget cap: ${budgetCap} req/hr; ${headroomPct}% headroom)`;
    if (requestsPerHour > budgetCap) {
      this.logger.warn(`${line} — OVER BUDGET; reduce repos or increase cadence`);
    } else {
      this.logger.info(line);
    }
  }
}

// ── Default helpers ───────────────────────────────────────────────────

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function defaultLogger(): Logger {
  return {
    info: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg),
  };
}
