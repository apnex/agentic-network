/**
 * Phase 2d CP2 C4 (task-307) — Validator for `update_idea`.
 *
 * Fails the convergence gate when the target Idea:
 *   - does not exist (→ `stale_reference`)
 *   - has no net changes vs current state (→ ok, `isNoOp=true`, bug-14 absorption)
 *
 * Mirrors the updatable-field filter from `cascade-actions/update-idea.ts`
 * so the no-op detection uses the same field set the cascade handler
 * will actually apply. Ignored / unknown keys in `changes` are dropped
 * before the diff — matching handler semantics.
 */
import type { IActionValidator, ValidationContext, ValidationResult } from "./types.js";

const UPDATABLE_IDEA_FIELDS = new Set(["status", "missionId", "tags", "text"]);

interface UpdateIdeaPayload {
  ideaId: string;
  changes: Record<string, unknown>;
}

function shallowArrayEqual(a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export const updateIdeaValidator: IActionValidator = {
  validate: async (payload: unknown, ctx: ValidationContext): Promise<ValidationResult> => {
    const p = payload as UpdateIdeaPayload;
    const idea = await ctx.idea.getIdea(p.ideaId);
    if (!idea) {
      return {
        ok: false,
        error: `Idea ${p.ideaId} referenced by update_idea no longer exists.`,
        subtype: "stale_reference",
        metadata: { entityType: "idea", entityId: p.ideaId },
      };
    }
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p.changes ?? {})) {
      if (UPDATABLE_IDEA_FIELDS.has(k)) filtered[k] = v;
    }
    if (Object.keys(filtered).length === 0) {
      // No applicable fields — handler will reject at execute time. Keep
      // consistent with the payload-validation family.
      return {
        ok: false,
        error: `update_idea payload.changes contains no updatable fields (allowed: ${[...UPDATABLE_IDEA_FIELDS].join(", ")}).`,
        subtype: "payload_validation",
        metadata: { entityType: "idea", entityId: p.ideaId },
      };
    }
    // No-op detection: every filtered field already equals current state.
    const current = idea as unknown as Record<string, unknown>;
    const allMatch = Object.entries(filtered).every(([k, v]) => {
      if (Array.isArray(v) || Array.isArray(current[k])) return shallowArrayEqual(current[k], v);
      return current[k] === v;
    });
    if (allMatch) {
      return { ok: true, isNoOp: true };
    }
    return { ok: true };
  },
};
