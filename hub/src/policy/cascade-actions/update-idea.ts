/**
 * Cascade ActionSpec: update_idea.
 *
 * Mutates an existing Idea. Kind "update" — no idempotency pre-check;
 * the update store call is idempotent by nature. Runner treats null
 * return from execute as a no-op idempotent skip.
 *
 * Payload: { ideaId, changes } — changes is a partial over the mutable
 * field set {status, missionId, tags, text}. Unknown keys dropped;
 * empty effective update throws → reported as failed.
 */

import { registerActionSpec } from "../cascade-spec.js";
import { UpdateIdeaActionPayloadSchema } from "../staged-action-payloads.js";
import type { Idea, IdeaStatus } from "../../entities/idea.js";

const UPDATABLE_IDEA_FIELDS = new Set(["status", "missionId", "tags", "text"]);

registerActionSpec({
  type: "update_idea",
  kind: "update",
  payloadSchema: UpdateIdeaActionPayloadSchema,
  auditAction: "thread_update_idea",
  execute: async (ctx, payload, _action, _thread, _backlink): Promise<Idea | null> => {
    const p = payload as { ideaId: string; changes: Record<string, unknown> };
    const existing = await ctx.stores.idea.getIdea(p.ideaId);
    if (!existing) throw new Error(`idea ${p.ideaId} not found`);

    const filtered: { status?: IdeaStatus; missionId?: string; tags?: string[]; text?: string } = {};
    for (const [k, v] of Object.entries(p.changes ?? {})) {
      if (!UPDATABLE_IDEA_FIELDS.has(k)) continue;
      (filtered as Record<string, unknown>)[k] = v;
    }
    if (Object.keys(filtered).length === 0) {
      throw new Error(`update_idea produced no updatable fields from payload.changes`);
    }

    const updated = await ctx.stores.idea.updateIdea(p.ideaId, filtered);
    if (!updated) throw new Error(`idea ${p.ideaId} update returned null`);
    return updated;
  },
  auditDetails: (entity, action, thread, summary) => {
    const p = action.payload as { ideaId: string; changes: Record<string, unknown> };
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p.changes ?? {})) {
      if (UPDATABLE_IDEA_FIELDS.has(k)) filtered[k] = v;
    }
    return `Idea ${(entity as Idea).id} updated from thread ${thread.id}/${action.id}. Changes: ${JSON.stringify(filtered)}. Summary: ${summary}.`;
  },
});
