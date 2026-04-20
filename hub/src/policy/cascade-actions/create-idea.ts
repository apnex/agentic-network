/**
 * Cascade ActionSpec: create_idea.
 *
 * Spawns an Idea with cascade back-link metadata. Idempotent via
 * {sourceThreadId, sourceActionId}. Provenance is the action proposer
 * (Mission-24 idea-120 / task-305). Payload: { title, description,
 * tags? } — text composed as title\n\ndescription.
 */

import { registerActionSpec } from "../cascade-spec.js";
import { CreateIdeaActionPayloadSchema } from "../staged-action-payloads.js";
import { dispatchIdeaSubmitted } from "../dispatch-helpers.js";
import type { Idea } from "../../entities/idea.js";
import type { EntityProvenance } from "../../state.js";

registerActionSpec({
  type: "create_idea",
  kind: "spawn",
  payloadSchema: CreateIdeaActionPayloadSchema,
  auditAction: "thread_create_idea",
  findByCascadeKey: (ctx, key) => ctx.stores.idea.findByCascadeKey(key),
  execute: async (ctx, payload, action, thread, backlink): Promise<Idea> => {
    const p = payload as { title: string; description: string; tags?: string[] };
    const text = `${p.title}\n\n${p.description}`;
    // Proposer staged this action; their identity is the createdBy for
    // the spawned Idea. agentId may be null for pre-M18 threads — fall
    // back to a role-only placeholder rather than storing null.
    const createdBy: EntityProvenance = {
      role: action.proposer.role,
      agentId: action.proposer.agentId ?? `anonymous-${action.proposer.role}`,
    };
    return ctx.stores.idea.submitIdea(text, createdBy, thread.id, p.tags, backlink);
  },
  auditDetails: (entity, action, thread, summary) => {
    const p = action.payload as { title: string };
    return `Idea ${(entity as Idea).id} spawned from thread ${thread.id}/${action.id}. Title: ${p.title}. Summary: ${summary}.`;
  },
  dispatch: async (ctx, entity, _thread) => {
    const idea = entity as Idea;
    await dispatchIdeaSubmitted(ctx, idea, idea.createdBy.role);
  },
});
