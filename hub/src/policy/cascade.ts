/**
 * Mission-24 Phase 2 (M24-T4, ADR-014): cascade execute-phase
 * infrastructure.
 *
 * Handler registry + runner invoked by thread-policy's internal
 * convergence handler after the gate has promoted staged → committed.
 * Per ADR-014 §139 INV-TH19: "committed means committed" — no rollback.
 * Handler failures transition the thread to `cascade_failed`.
 *
 * Task M24-T5/T7 populates the registry with per-action-type handlers
 * (create_task, create_proposal, create_idea, update_idea,
 * update_mission_status, propose_mission, create_clarification). This
 * file ships the close_no_action handler inline — it has no spawned
 * entity and no idempotency surface, so it's the smallest possible
 * end-to-end proof that the infrastructure works.
 */

import type { StagedAction, StagedActionType, Thread } from "../state.js";
import type { IPolicyContext } from "./types.js";

// ── Handler types ───────────────────────────────────────────────────

/**
 * What the executor hands every handler. Handlers pull the source
 * thread summary from here (INV-TH23 Summary-as-Living-Record) and
 * stamp `sourceThreadId` / `sourceActionId` / `sourceThreadSummary`
 * on any spawned entity for later provenance / idempotency checks.
 */
export interface CascadeExecuteContext {
  ctx: IPolicyContext;
  thread: Thread;
  action: StagedAction;
  /** Frozen at commit; see INV-TH23. Handlers that spawn entities
   * copy this onto the entity verbatim (e.g., `sourceThreadSummary`
   * on a newly-created Task). */
  sourceThreadSummary: string;
}

export type CascadeExecuteStatus = "executed" | "failed" | "skipped_idempotent";

export interface CascadeExecuteOutcome {
  status: CascadeExecuteStatus;
  /** ID of the spawned entity when `status === "executed"` and the
   * action creates one; null for actions like `close_no_action`. */
  entityId?: string | null;
  /** Present when `status === "failed"`; short caller-readable message. */
  error?: string;
}

export type CascadeHandler = (input: CascadeExecuteContext) => Promise<CascadeExecuteOutcome>;

// ── Registry ────────────────────────────────────────────────────────

const handlers = new Map<StagedActionType, CascadeHandler>();

/**
 * Register the handler for a given action type. Idempotent-by-type:
 * a later registration overrides an earlier one (simplifies test
 * isolation and allows bootstrap ordering flexibility). Not thread-safe
 * for concurrent registration; we assume registration happens at
 * module-load time before any router.handle() fires.
 */
export function registerCascadeHandler(type: StagedActionType, handler: CascadeHandler): void {
  handlers.set(type, handler);
}

export function getCascadeHandler(type: StagedActionType): CascadeHandler | undefined {
  return handlers.get(type);
}

// ── Idempotency (INV-TH20) ──────────────────────────────────────────

/**
 * Natural idempotency key for cascade-spawned entities. Handlers
 * query their respective store for an existing entity with this pair
 * BEFORE creating; on hit, they return `skipped_idempotent`. The pair
 * `{sourceThreadId, sourceActionId}` is Hub-globally unique because
 * `actionId` is thread-local and `threadId` is Hub-global, so no
 * caller-supplied key is needed.
 */
export interface CascadeIdempotencyKey {
  sourceThreadId: string;
  sourceActionId: string;
}

export function cascadeIdempotencyKey(thread: Thread, action: StagedAction): CascadeIdempotencyKey {
  return { sourceThreadId: thread.id, sourceActionId: action.id };
}

// ── Report + runner ─────────────────────────────────────────────────

export interface ConvergenceReportEntry {
  actionId: string;
  type: StagedActionType;
  status: CascadeExecuteStatus;
  entityId?: string | null;
  error?: string;
}

export interface CascadeRunResult {
  report: ConvergenceReportEntry[];
  executedCount: number;
  failedCount: number;
  skippedCount: number;
  anyFailure: boolean;
}

/**
 * Iterate committed actions in array order, invoke the registered
 * handler for each, and build the per-action ConvergenceReport.
 * Catches per-handler errors so one failure doesn't abort the rest —
 * this matches the ADR-014 §65 design principle "committed means
 * committed" (every committed action gets its execute attempt even
 * when an earlier one failed).
 */
export async function runCascade(
  ctx: IPolicyContext,
  thread: Thread,
  committed: StagedAction[],
  sourceThreadSummary: string,
): Promise<CascadeRunResult> {
  const report: ConvergenceReportEntry[] = [];

  for (const action of committed) {
    const handler = handlers.get(action.type);
    if (!handler) {
      report.push({
        actionId: action.id,
        type: action.type,
        status: "failed",
        error: `no cascade handler registered for action type "${action.type}"`,
      });
      continue;
    }
    try {
      const outcome = await handler({ ctx, thread, action, sourceThreadSummary });
      report.push({
        actionId: action.id,
        type: action.type,
        status: outcome.status,
        entityId: outcome.entityId ?? null,
        ...(outcome.error !== undefined ? { error: outcome.error } : {}),
      });
    } catch (err: any) {
      report.push({
        actionId: action.id,
        type: action.type,
        status: "failed",
        error: err?.message ?? String(err),
      });
    }
  }

  const executedCount = report.filter((r) => r.status === "executed").length;
  const failedCount = report.filter((r) => r.status === "failed").length;
  const skippedCount = report.filter((r) => r.status === "skipped_idempotent").length;

  return {
    report,
    executedCount,
    failedCount,
    skippedCount,
    anyFailure: failedCount > 0,
  };
}

// ── Built-in handlers: close_no_action ──────────────────────────────

/**
 * Close the thread with no spawned entity. Writes an audit entry
 * including the negotiated summary so Director digests surface the
 * actors' narrative without looking up the thread separately.
 *
 * No idempotency surface — audit entries are append-only and a
 * duplicate execute (theoretical; Phase 2 gate guarantees once)
 * just produces a second audit entry. Cheap, visible, correct.
 */
registerCascadeHandler("close_no_action", async ({ ctx, thread, action, sourceThreadSummary }) => {
  if (action.type !== "close_no_action") {
    return { status: "failed", error: `expected close_no_action, got ${action.type}` };
  }
  const reason = action.payload.reason?.trim() || "(no reason provided)";
  await ctx.stores.audit.logEntry(
    "hub",
    "thread_close_no_action",
    `Thread ${thread.id} closed (close_no_action). Summary: ${sourceThreadSummary}. Reason: ${reason}`,
    thread.id,
  );
  return { status: "executed", entityId: null };
});
