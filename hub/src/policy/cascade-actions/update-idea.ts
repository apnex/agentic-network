/**
 * Cascade ActionSpec: update_idea.
 *
 * Mutates an existing Idea. Kind "update" — runner treats null return
 * from execute as a no-op idempotent skip (triggers
 * `cascade.idempotent_update_skip` + `action_already_executed` audit
 * entry instead of a redundant write). Phase 2d CP2 C4 (task-307,
 * bug-14): execute now computes the diff vs current state and returns
 * null when all fields already match. Matches the pattern in
 * update_mission_status.ts.
 *
 * Payload: { ideaId, changes } — changes is a partial over the mutable
 * field set {status, missionId, tags, text}. Unknown keys dropped;
 * empty effective update throws → reported as failed.
 */

import { registerActionSpec } from "../cascade-spec.js";
import { UpdateIdeaActionPayloadSchema } from "../staged-action-payloads.js";
import type { Idea, IdeaStatus } from "../../entities/idea.js";

const UPDATABLE_IDEA_FIELDS = new Set(["status", "missionId", "tags", "text"]);

function shallowArrayEqual(a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

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

    // Bug-14 (CP2 C4): no-op detection. If every filtered field already
    // matches the existing idea's value, return null so the runner emits
    // `cascade.idempotent_update_skip` instead of writing a redundant
    // audit entry + store call.
    const existingRec = existing as unknown as Record<string, unknown>;
    const allMatch = Object.entries(filtered).every(([k, v]) => {
      if (Array.isArray(v) || Array.isArray(existingRec[k])) return shallowArrayEqual(existingRec[k], v);
      return existingRec[k] === v;
    });
    if (allMatch) return null;

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
