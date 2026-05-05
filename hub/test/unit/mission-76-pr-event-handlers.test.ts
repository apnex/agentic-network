/**
 * mission-76 W1 — PR-event handler tests (bug-46 closure).
 *
 * Pins per Design v1.0 §6.1:
 *   - Helper: synthesizePrNotification — extract → resolve-role → emit
 *     across the 3 PR-event handlers via opts (subkind + intentValue +
 *     extractPayload + extractAuthorLogin + bodyTemplate +
 *     buildPayloadFields)
 *   - Per-handler: thin wrapper invokes helper with subkind-specific opts
 *   - §3.1 m2 fold director-skip + null-skip enumeration verified
 *   - §3.4 symmetric routing — engineer-author → architect peer; architect-
 *     author → engineer peer
 *   - §3.5 m1 fold per-subkind intents (pr-opened-notification /
 *     pr-merged-notification / pr-review-notification)
 *   - mission-76 γ fold — null-lookup-skip is EXPECTED behavior
 *     (console.info not console.warn) per bug-47 scenario-B reframing
 */

import { describe, expect, it } from "vitest";
import type { Message } from "../../src/entities/index.js";
import type { IPolicyContext } from "../../src/policy/types.js";
import type { Agent, AgentRole } from "../../src/state.js";
import { GITHUB_LOGIN_LABEL } from "../../src/policy/repo-event-author-lookup.js";
import {
  synthesizePrNotification,
  type PrNotificationOpts,
} from "../../src/policy/repo-event-pr-handler-helpers.js";
import { PR_OPENED_HANDLER } from "../../src/policy/repo-event-pr-opened-handler.js";
import { PR_MERGED_HANDLER } from "../../src/policy/repo-event-pr-merged-handler.js";
import { PR_REVIEW_SUBMITTED_HANDLER } from "../../src/policy/repo-event-pr-review-submitted-handler.js";

// ── Helper: minimal IPolicyContext + agent fixtures ──────────────────

function makeAgent(id: string, role: AgentRole, ghLogin?: string): Agent {
  return {
    id,
    fingerprint: `fp-${id}`,
    role,
    status: "online",
    archived: false,
    sessionEpoch: 1,
    currentSessionId: null,
    clientMetadata: {
      clientName: "test",
      clientVersion: "0.0.0",
      proxyName: "test",
      proxyVersion: "0.0.0",
    },
    advisoryTags: {},
    labels: ghLogin ? { [GITHUB_LOGIN_LABEL]: ghLogin } : {},
    firstSeenAt: "2026-05-01T00:00:00Z",
    lastSeenAt: "2026-05-01T00:00:00Z",
    livenessState: "online",
    lastHeartbeatAt: "2026-05-01T00:00:00Z",
    receiptSla: 60_000,
    wakeEndpoint: null,
    name: id,
    activityState: "online_idle",
    sessionStartedAt: null,
    lastToolCallAt: null,
    lastToolCallName: null,
    idleSince: null,
    workingSince: null,
    quotaBlockedUntil: null,
    adapterVersion: "test@0.0.0",
    ipAddress: null,
    restartCount: 0,
    recentErrors: [],
    restartHistoryMs: [],
    cognitiveTTL: null,
    transportTTL: null,
    cognitiveState: "unknown",
    transportState: "unknown",
  };
}

function makeCtx(agents: Agent[]): IPolicyContext {
  return {
    stores: {
      engineerRegistry: {
        listAgents: async () => agents,
      },
    },
    metrics: { increment: () => {} },
    emit: async () => {},
    dispatch: async () => {},
    sessionId: "test",
    clientIp: "127.0.0.1",
    role: "system",
    internalEvents: [],
    config: { storageBackend: "memory", gcsBucket: "" },
  } as unknown as IPolicyContext;
}

function makeRepoEventMessage(payload: unknown): Message {
  return {
    id: "01TESTMISSION76",
    kind: "external-injection",
    authorRole: "architect",
    authorAgentId: "anonymous-architect",
    target: null,
    delivery: "push-immediate",
    payload,
    status: "new",
    createdAt: "2026-05-01T00:00:00Z",
  } as unknown as Message;
}

// ── synthesizePrNotification helper tests (Design §6.1 P1 fold) ──────

describe("synthesizePrNotification helper (mission-76 W1 P1 DRY concur)", () => {
  // Minimal fixture opts for helper isolation tests
  interface FixturePayload {
    author: string;
    n: number;
  }
  const FIXTURE_OPTS: PrNotificationOpts<FixturePayload> = {
    subkind: "pr-opened",
    intentValue: "fixture-intent",
    extractPayload: (raw) => {
      if (typeof raw.author !== "string" || typeof raw.n !== "number") return null;
      return { author: raw.author, n: raw.n };
    },
    extractAuthorLogin: (p) => p.author || null,
    bodyTemplate: (role, p) => `${role} did thing #${p.n}`,
    buildPayloadFields: (p) => ({ n: p.n, author: p.author }),
  };

  it("emits 1 dispatch for engineer-author (target.role=architect; symmetric routing)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "apnex-greg", n: 42 },
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "architect" });
    expect(dispatches[0].intent).toBe("fixture-intent");
    const payload = dispatches[0].payload as Record<string, unknown>;
    expect(payload.body).toBe("engineer did thing #42");
    expect(payload.n).toBe(42);
    expect(payload.author).toBe("apnex-greg");
    expect(payload.sourceMessageId).toBe("01TESTMISSION76");
  });

  it("emits 1 dispatch for architect-author (target.role=engineer; symmetric routing per §3.4)", async () => {
    const ctx = makeCtx([makeAgent("arch-A", "architect", "apnex-lily")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "apnex-lily", n: 7 },
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "engineer" });
    const payload = dispatches[0].payload as Record<string, unknown>;
    expect(payload.body).toBe("architect did thing #7");
  });

  it("emits 0 dispatches for null-lookup (mission-76 γ — EXPECTED behavior)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "apnex", n: 1 }, // unregistered (Director's personal account per bug-47 scenario-B)
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(0);
  });

  it("emits 0 dispatches for director-author (§3.1 m2 fold — no peer-role)", async () => {
    const ctx = makeCtx([
      makeAgent("eng-A", "engineer", "apnex-greg"),
      makeAgent("dir-A", "director", "director-bot"),
    ]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "director-bot", n: 99 },
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(0);
  });

  it("emits 0 dispatches for malformed payload.payload (defensive skip)", async () => {
    const ctx = makeCtx([]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      // payload nested missing
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(0);
  });

  it("emits 0 dispatches when extractPayload returns null (malformed shape)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "apnex-greg" }, // missing `n`
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(0);
  });

  it("emits 0 dispatches when extractAuthorLogin returns null (missing author)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: { author: "", n: 3 },
    });
    const dispatches = await synthesizePrNotification(msg, ctx, FIXTURE_OPTS);
    expect(dispatches).toHaveLength(0);
  });
});

// ── PR_OPENED_HANDLER tests (Design §6.1) ─────────────────────────────

describe("PR_OPENED_HANDLER (mission-76 W1 §3.1)", () => {
  const baseMsg = (author: string) =>
    makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-opened",
      payload: {
        repo: "apnex-org/agentic-network",
        action: "opened",
        number: 167,
        title: "[mission-75] M-TTL-Liveliness-Design",
        url: "https://github.com/apnex-org/agentic-network/pull/167",
        author,
        merged: false,
        base: "main",
        head: "agent-greg/m-ttl-liveliness-design",
      },
    });

  it("engineer-opens-PR → architect notification with full payload", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_OPENED_HANDLER.handle(baseMsg("apnex-greg"), ctx);
    expect(dispatches).toHaveLength(1);
    const d = dispatches[0];
    expect(d.kind).toBe("note");
    expect(d.target).toEqual({ role: "architect" });
    expect(d.intent).toBe("pr-opened-notification");
    const payload = d.payload as Record<string, unknown>;
    expect(payload.body).toBe("Engineer opened PR #167: [mission-75] M-TTL-Liveliness-Design");
    expect(payload.prNumber).toBe(167);
    expect(payload.prTitle).toBe("[mission-75] M-TTL-Liveliness-Design");
    expect(payload.prAuthor).toBe("apnex-greg");
    expect(payload.prUrl).toBe("https://github.com/apnex-org/agentic-network/pull/167");
    expect(payload.prBaseRef).toBe("main");
    expect(payload.prHeadRef).toBe("agent-greg/m-ttl-liveliness-design");
    expect(payload.sourceMessageId).toBe("01TESTMISSION76");
  });

  it("architect-opens-PR → engineer notification (symmetric routing per §3.4)", async () => {
    const ctx = makeCtx([makeAgent("arch-A", "architect", "apnex-lily")]);
    const dispatches = await PR_OPENED_HANDLER.handle(baseMsg("apnex-lily"), ctx);
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "engineer" });
    expect((dispatches[0].payload as Record<string, unknown>).body).toBe(
      "Architect opened PR #167: [mission-75] M-TTL-Liveliness-Design",
    );
  });

  it("unknown-author → skip (lookup returns null; mission-76 γ)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_OPENED_HANDLER.handle(baseMsg("apnex"), ctx);
    expect(dispatches).toHaveLength(0);
  });

  it("director-author → skip (§3.1 m2 fold)", async () => {
    const ctx = makeCtx([makeAgent("dir-A", "director", "apnex-director")]);
    const dispatches = await PR_OPENED_HANDLER.handle(baseMsg("apnex-director"), ctx);
    expect(dispatches).toHaveLength(0);
  });

  it("missing payload.payload → skip (defensive)", async () => {
    const ctx = makeCtx([]);
    const msg = makeRepoEventMessage({ kind: "repo-event", subkind: "pr-opened" });
    const dispatches = await PR_OPENED_HANDLER.handle(msg, ctx);
    expect(dispatches).toHaveLength(0);
  });
});

// ── PR_MERGED_HANDLER tests (Design §6.1) ─────────────────────────────

describe("PR_MERGED_HANDLER (mission-76 W1 §3.1)", () => {
  const baseMsg = (author: string) =>
    makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-merged",
      payload: {
        repo: "apnex-org/agentic-network",
        action: "merged",
        number: 168,
        title: "[mission-75] Phase 9 closing audit + Phase 10 retrospective",
        url: "https://github.com/apnex-org/agentic-network/pull/168",
        author,
        merged: true,
        base: "main",
        head: "agent-lily/m-ttl-liveliness-design-phase9-10",
      },
    });

  it("engineer-merges-PR → architect notification", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_MERGED_HANDLER.handle(baseMsg("apnex-greg"), ctx);
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "architect" });
    expect(dispatches[0].intent).toBe("pr-merged-notification");
    const payload = dispatches[0].payload as Record<string, unknown>;
    expect(payload.body).toBe(
      "Engineer merged PR #168: [mission-75] Phase 9 closing audit + Phase 10 retrospective",
    );
    expect(payload.prNumber).toBe(168);
  });

  it("architect-merges-PR → engineer notification (symmetric per §3.4)", async () => {
    const ctx = makeCtx([makeAgent("arch-A", "architect", "apnex-lily")]);
    const dispatches = await PR_MERGED_HANDLER.handle(baseMsg("apnex-lily"), ctx);
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "engineer" });
    expect((dispatches[0].payload as Record<string, unknown>).body).toBe(
      "Architect merged PR #168: [mission-75] Phase 9 closing audit + Phase 10 retrospective",
    );
  });

  it("unknown-author → skip", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_MERGED_HANDLER.handle(baseMsg("apnex"), ctx);
    expect(dispatches).toHaveLength(0);
  });
});

// ── PR_REVIEW_SUBMITTED_HANDLER tests (Design §6.1) ───────────────────

describe("PR_REVIEW_SUBMITTED_HANDLER (mission-76 W1 §3.1)", () => {
  const baseMsg = (reviewer: string, state: string) =>
    makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-review-submitted",
      payload: {
        repo: "apnex-org/agentic-network",
        prNumber: 167,
        reviewer,
        state,
        body: "LGTM with one nit",
        url: "https://github.com/apnex-org/agentic-network/pull/167#pullrequestreview-1",
      },
    });

  it("engineer-reviews-PR (changes_requested) → architect notification", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_REVIEW_SUBMITTED_HANDLER.handle(
      baseMsg("apnex-greg", "changes_requested"),
      ctx,
    );
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "architect" });
    expect(dispatches[0].intent).toBe("pr-review-notification");
    const payload = dispatches[0].payload as Record<string, unknown>;
    expect(payload.body).toBe("Engineer reviewed PR #167 (changes_requested)");
    expect(payload.prNumber).toBe(167);
    expect(payload.reviewer).toBe("apnex-greg");
    expect(payload.reviewState).toBe("changes_requested");
    expect(payload.reviewBody).toBe("LGTM with one nit");
  });

  it("architect-reviews-PR (commented) → engineer notification (symmetric per §3.4)", async () => {
    const ctx = makeCtx([makeAgent("arch-A", "architect", "apnex-lily")]);
    const dispatches = await PR_REVIEW_SUBMITTED_HANDLER.handle(
      baseMsg("apnex-lily", "commented"),
      ctx,
    );
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].target).toEqual({ role: "engineer" });
    expect((dispatches[0].payload as Record<string, unknown>).body).toBe(
      "Architect reviewed PR #167 (commented)",
    );
  });

  it("review without state → omits state clause from body (defensive)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_REVIEW_SUBMITTED_HANDLER.handle(
      baseMsg("apnex-greg", ""),
      ctx,
    );
    expect(dispatches).toHaveLength(1);
    expect((dispatches[0].payload as Record<string, unknown>).body).toBe(
      "Engineer reviewed PR #167",
    );
  });

  it("unknown-reviewer → skip", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const dispatches = await PR_REVIEW_SUBMITTED_HANDLER.handle(
      baseMsg("apnex", "approved"),
      ctx,
    );
    expect(dispatches).toHaveLength(0);
  });

  it("missing prNumber → skip (extractPayload null guard)", async () => {
    const ctx = makeCtx([makeAgent("eng-A", "engineer", "apnex-greg")]);
    const msg = makeRepoEventMessage({
      kind: "repo-event",
      subkind: "pr-review-submitted",
      payload: { reviewer: "apnex-greg", state: "approved" }, // missing prNumber
    });
    const dispatches = await PR_REVIEW_SUBMITTED_HANDLER.handle(msg, ctx);
    expect(dispatches).toHaveLength(0);
  });
});

// ── Handler-shape contract assertions ─────────────────────────────────

describe("PR-event handler RepoEventHandler-interface conformance (mission-76 W1)", () => {
  it("PR_OPENED_HANDLER conforms to {subkind, name, handle}", () => {
    expect(PR_OPENED_HANDLER.subkind).toBe("pr-opened");
    expect(PR_OPENED_HANDLER.name).toBe("pr_opened_bilateral");
    expect(typeof PR_OPENED_HANDLER.handle).toBe("function");
  });

  it("PR_MERGED_HANDLER conforms to {subkind, name, handle}", () => {
    expect(PR_MERGED_HANDLER.subkind).toBe("pr-merged");
    expect(PR_MERGED_HANDLER.name).toBe("pr_merged_bilateral");
    expect(typeof PR_MERGED_HANDLER.handle).toBe("function");
  });

  it("PR_REVIEW_SUBMITTED_HANDLER conforms to {subkind, name, handle}", () => {
    expect(PR_REVIEW_SUBMITTED_HANDLER.subkind).toBe("pr-review-submitted");
    expect(PR_REVIEW_SUBMITTED_HANDLER.name).toBe("pr_review_submitted_bilateral");
    expect(typeof PR_REVIEW_SUBMITTED_HANDLER.handle).toBe("function");
  });
});
