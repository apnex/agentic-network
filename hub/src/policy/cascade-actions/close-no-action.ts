/**
 * Cascade ActionSpec: close_no_action (Phase 1 retained).
 *
 * Audit-only action — marks a thread as concluding without spawning
 * a follow-up entity. Audit detail includes the negotiated thread
 * summary so the Director-digest surfaces actors' narrative without
 * having to re-read the thread. No dispatch; thread closure lives
 * in the thread-policy finalized handler.
 */

import { registerActionSpec } from "../cascade-spec.js";
import { CloseNoActionPayloadSchema } from "../staged-action-payloads.js";

registerActionSpec({
  type: "close_no_action",
  kind: "audit_only",
  payloadSchema: CloseNoActionPayloadSchema,
  auditAction: "thread_close_no_action",
  execute: async () => null,
  auditDetails: (_entity, action, thread, summary) => {
    const reason = (action.payload as { reason?: string }).reason?.trim() || "(no reason provided)";
    const summaryText = summary.trim() || "(no summary provided)";
    return `Thread ${thread.id} closed (close_no_action). Summary: ${summaryText}. Reason: ${reason}.`;
  },
});
