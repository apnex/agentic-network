/**
 * Cascade ActionSpec: create_clarification.
 *
 * Audit-only — records a Director-review question raised in-thread.
 * No dedicated Clarification entity in current schema; the audit
 * entry IS the record. Idempotency: audit entries are append-only,
 * so a double-execute writes two entries (acceptable caveat — cascade
 * fires exactly once per convergence today). When a first-class
 * Clarification entity lands (future mission), convert to kind="spawn".
 */

import { registerActionSpec } from "../cascade-spec.js";
import { CreateClarificationActionPayloadSchema } from "../staged-action-payloads.js";

registerActionSpec({
  type: "create_clarification",
  kind: "audit_only",
  payloadSchema: CreateClarificationActionPayloadSchema,
  auditAction: "thread_create_clarification",
  execute: async () => null,
  auditDetails: (_entity, action, thread, summary) => {
    const p = action.payload as { question: string; context: string };
    return `Clarification raised from thread ${thread.id}/${action.id}. Question: ${p.question} Context: ${p.context} Summary: ${summary}.`;
  },
});
