/**
 * Cascade handler: update_idea (M24-T9, ADR-014).
 *
 * Mutates an existing Idea. Unlike spawn-type handlers, update_idea
 * doesn't create a new entity — the back-link metadata is carried on
 * the cascade audit entry rather than on the entity itself.
 *
 * Payload shape: { ideaId, changes }
 *   - `changes` is a partial update over the Idea's mutable-field set
 *     (status, missionId, tags, text). Unknown keys are dropped; if
 *     none are valid after filtering, we fail so the caller knows the
 *     payload produced nothing.
 *
 * Idempotency: update is idempotent by nature — setting status=X twice
 * produces the same end state as once. The pre-check `getIdea` only
 * guards against updating a non-existent idea (produces a proper
 * `failed` entry rather than silently no-op'ing).
 */

import { registerCascadeHandler } from "../cascade.js";
import type { IdeaStatus } from "../../entities/idea.js";

const UPDATABLE_IDEA_FIELDS = new Set(["status", "missionId", "tags", "text"]);

registerCascadeHandler("update_idea", async ({ ctx, thread, action, sourceThreadSummary }) => {
  if (action.type !== "update_idea") {
    return { status: "failed", error: `expected update_idea, got ${action.type}` };
  }
  const payload = action.payload;
  const ideaId = payload.ideaId;

  const existing = await ctx.stores.idea.getIdea(ideaId);
  if (!existing) {
    return { status: "failed", error: `idea ${ideaId} not found` };
  }

  // Filter `changes` down to the mutable-field set. Unknown keys are
  // dropped silently; the ADR-014 scope-of-commitment principle lives
  // at the autonomous/Director-gated boundary, not at the field level.
  const filtered: { status?: IdeaStatus; missionId?: string; tags?: string[]; text?: string } = {};
  for (const [k, v] of Object.entries(payload.changes ?? {})) {
    if (!UPDATABLE_IDEA_FIELDS.has(k)) continue;
    (filtered as Record<string, unknown>)[k] = v;
  }
  if (Object.keys(filtered).length === 0) {
    return { status: "failed", error: `update_idea produced no updatable fields from payload.changes` };
  }

  const updated = await ctx.stores.idea.updateIdea(ideaId, filtered);
  if (!updated) {
    return { status: "failed", error: `idea ${ideaId} update returned null` };
  }

  await ctx.stores.audit.logEntry(
    "hub",
    "thread_update_idea",
    `Idea ${ideaId} updated from thread ${thread.id}/${action.id}. Changes: ${JSON.stringify(filtered)}. Summary: ${sourceThreadSummary}.`,
    ideaId,
  );

  return { status: "executed", entityId: ideaId };
});
