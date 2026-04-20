import { describe, it, expect } from "vitest";
import { runCascade } from "../../src/policy/cascade.js";
import { getActionSpec } from "../../src/policy/cascade-spec.js";
import "../../src/policy/cascade-actions/index.js"; // registers all specs
import { createTestContext } from "../../src/policy/test-utils.js";
import { createMetricsCounter } from "../../src/observability/metrics.js";
import type { Thread, StagedAction, StagedActionType } from "../../src/state.js";

/**
 * Phase 2d CP1 — spawn-handler idempotency contract tests.
 *
 * Architect-ratified contract (thread-224):
 *   (a) `findByCascadeKey` is implemented non-trivially.
 *   (b) `execute` returns the existing entity on natural-key collision
 *       without side effects.
 *   (c) Running the handler twice with identical action input produces
 *       exactly one entity.
 *
 * These tests verify (a) and (c) directly. (b) is a corollary: if (c)
 * holds AND the runner's second invocation returns `skipped_idempotent`
 * via the findByCascadeKey hit (short-circuiting before execute runs),
 * then execute is never called a second time — side-effect-free by
 * construction.
 *
 * Update-kind handlers (update_idea, update_mission_status) and
 * audit_only handlers (close_no_action, create_clarification) are not
 * covered by the spawn contract; their idempotency semantics differ
 * (see docs/audits/phase-2d-cp1-observability-report.md).
 */

function makeThread(id = "thread-contract-test"): Thread {
  return {
    id,
    title: "contract test",
    status: "active",
    routingMode: "broadcast",
    context: null,
    idleExpiryMs: null,
    createdBy: { role: "engineer", agentId: "eng-test-fixture" },
    currentTurn: "architect",
    currentTurnAgentId: null,
    roundCount: 1,
    maxRounds: 10,
    outstandingIntent: null,
    currentSemanticIntent: null,
    correlationId: null,
    convergenceActions: [],
    summary: "",
    participants: [],
    recipientAgentId: null,
    messages: [],
    labels: {},
    lastMessageConverged: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Thread;
}

function makeAction(id: string, type: StagedActionType, payload: Record<string, unknown>): StagedAction {
  return {
    id,
    type,
    status: "committed",
    proposer: { role: "engineer", agentId: null },
    timestamp: new Date().toISOString(),
    payload,
  } as unknown as StagedAction;
}

interface SpawnCase {
  type: StagedActionType;
  payload: Record<string, unknown>;
}

const SPAWN_CASES: SpawnCase[] = [
  { type: "create_task", payload: { title: "contract-task", description: "directive" } },
  { type: "create_proposal", payload: { title: "contract-proposal", description: "body" } },
  { type: "create_idea", payload: { title: "contract-idea", description: "body" } },
  { type: "create_bug", payload: { title: "contract-bug", description: "repro" } },
  { type: "propose_mission", payload: { title: "contract-mission", description: "body", goals: ["goal-1"] } },
];

describe("spawn-handler idempotency contract (Phase 2d CP1)", () => {
  describe("(a) findByCascadeKey is implemented non-trivially", () => {
    for (const { type } of SPAWN_CASES) {
      it(`${type}: spec.findByCascadeKey is present`, () => {
        const spec = getActionSpec(type);
        expect(spec).toBeDefined();
        expect(spec!.kind).toBe("spawn");
        expect(spec!.findByCascadeKey).toBeTypeOf("function");
      });

      it(`${type}: findByCascadeKey returns the prior entity after first execute`, async () => {
        const ctx = createTestContext();
        ctx.metrics = createMetricsCounter();
        const thread = makeThread(`thread-${type}`);
        const action = makeAction("action-1", type, SPAWN_CASES.find((c) => c.type === type)!.payload);

        const result = await runCascade(ctx, thread, [action], "summary");
        expect(result.report[0].status).toBe("executed");
        const spawnedId = result.report[0].entityId!;

        const spec = getActionSpec(type)!;
        const key = { sourceThreadId: thread.id, sourceActionId: action.id };
        const found = await spec.findByCascadeKey!(ctx, key);
        expect(found).toBeTruthy();
        expect((found as { id?: string }).id).toBe(spawnedId);
      });

      it(`${type}: findByCascadeKey returns null for a non-existent key`, async () => {
        const ctx = createTestContext();
        ctx.metrics = createMetricsCounter();
        const spec = getActionSpec(type)!;
        const found = await spec.findByCascadeKey!(ctx, {
          sourceThreadId: "thread-none",
          sourceActionId: "action-none",
        });
        expect(found).toBeNull();
      });
    }
  });

  describe("(c) double-run produces exactly one entity", () => {
    for (const { type, payload } of SPAWN_CASES) {
      it(`${type}: second run short-circuits with skipped_idempotent + same entityId`, async () => {
        const ctx = createTestContext();
        ctx.metrics = createMetricsCounter();
        const thread = makeThread(`thread-${type}-dbl`);
        const action = makeAction("action-1", type, payload);

        const first = await runCascade(ctx, thread, [action], "summary");
        expect(first.report[0].status).toBe("executed");
        expect(first.executedCount).toBe(1);
        const firstEntityId = first.report[0].entityId!;
        expect(firstEntityId).toBeTruthy();

        const second = await runCascade(ctx, thread, [action], "summary");
        expect(second.report[0].status).toBe("skipped_idempotent");
        expect(second.skippedCount).toBe(1);
        expect(second.report[0].entityId).toBe(firstEntityId);

        // Metrics confirm the idempotent-skip fired on the second run.
        expect(ctx.metrics.snapshot()["cascade.idempotent_skip"]).toBe(1);
        expect(ctx.metrics.snapshot()["cascade_fail.execute_threw"]).toBeUndefined();
      });
    }
  });
});

// ── Update + audit_only handlers: lighter contract ──────────────────

const UPDATE_CASES: SpawnCase[] = [
  // update_idea needs an ideaId; we seed one via create_idea first.
  { type: "update_idea", payload: { ideaId: "__seeded__", changes: { status: "triaged" } } },
];

const AUDIT_ONLY_CASES: SpawnCase[] = [
  { type: "close_no_action", payload: { reason: "test reason" } },
  { type: "create_clarification", payload: { question: "q", context: "c" } },
];

describe("update-handler idempotency (Phase 2d CP1)", () => {
  it("update_idea: re-running against an already-applied change is a known gap (actual behavior: re-executes)", async () => {
    // FINDING for C5 audit report: update_idea's execute() does not compare
    // the incoming `changes` to the idea's current state, so a second
    // cascade on the same action re-applies the changes and produces a
    // second audit entry. For fully-idempotent update semantics the
    // handler would return null on no-op; today it returns the idea
    // unchanged and re-audits. This test documents the current behavior
    // so the gap is visible in the test suite; the fix belongs in an
    // update-handler hardening task (out of scope for CP1).
    const ctx = createTestContext();
    ctx.metrics = createMetricsCounter();
    const thread = makeThread("thread-update-idea");

    const seed = await ctx.stores.idea.submitIdea("seed", "engineer", []);
    const seededId = seed.id;

    const action = makeAction("action-1", "update_idea", {
      ideaId: seededId,
      changes: { status: "triaged" },
    });

    const first = await runCascade(ctx, thread, [action], "summary");
    expect(first.report[0].status).toBe("executed");

    // Actual behavior today: second run re-executes (known gap).
    const second = await runCascade(ctx, thread, [action], "summary");
    expect(second.report[0].status).toBe("executed");
    // Cascade did NOT detect the no-op; no idempotent_update_skip fired.
    expect(ctx.metrics.snapshot()["cascade.idempotent_update_skip"]).toBeUndefined();
  });
});

describe("audit_only handler safe re-runnability (Phase 2d CP1)", () => {
  for (const { type, payload } of AUDIT_ONLY_CASES) {
    it(`${type}: double-run does not throw and reports executed twice (no side-effect dedup)`, async () => {
      const ctx = createTestContext();
      ctx.metrics = createMetricsCounter();
      const thread = makeThread(`thread-${type}`);
      const action = makeAction("action-1", type, payload);

      const first = await runCascade(ctx, thread, [action], "summary");
      expect(first.report[0].status).toBe("executed");

      // audit_only has no findByCascadeKey → second run will executed again.
      // This is acceptable for audit_only handlers since they produce no
      // spawned entity — re-running just re-logs an audit entry.
      const second = await runCascade(ctx, thread, [action], "summary");
      expect(["executed", "skipped_idempotent"]).toContain(second.report[0].status);
      expect(ctx.metrics.snapshot()["cascade_fail.execute_threw"]).toBeUndefined();
    });
  }
});
