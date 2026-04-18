/**
 * Cascade handler: create_clarification (M24-T9, ADR-014).
 *
 * Records a clarification request raised during the thread. Unlike
 * task-scoped clarifications (ITaskStore.requestClarification), these
 * are thread-scoped and captured as audit entries for Director review
 * — no dedicated Clarification entity exists in the Phase 2 schema.
 *
 * Payload shape: { question, context }
 *
 * Idempotency: audit-only means no queryable entity to dedupe against.
 * A double-execute would write two audit entries. Acceptable because
 * cascade runs exactly once per convergence today; if future retry
 * machinery lands, a Clarification entity + findByCascadeKey will be
 * needed. Tracked as a follow-up.
 */

import { registerCascadeHandler } from "../cascade.js";

registerCascadeHandler("create_clarification", async ({ ctx, thread, action, sourceThreadSummary }) => {
  if (action.type !== "create_clarification") {
    return { status: "failed", error: `expected create_clarification, got ${action.type}` };
  }
  const payload = action.payload;

  await ctx.stores.audit.logEntry(
    "hub",
    "thread_create_clarification",
    `Clarification raised from thread ${thread.id}/${action.id}. Question: ${payload.question} Context: ${payload.context} Summary: ${sourceThreadSummary}.`,
    thread.id,
  );

  // No spawned entity — audit-only. Return null entityId so consumers
  // (ConvergenceReport readers) can distinguish audit-only executed
  // actions from entity-spawning ones.
  return { status: "executed", entityId: null };
});
