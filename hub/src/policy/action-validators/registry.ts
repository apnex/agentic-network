/**
 * Phase 2d CP2 C4 (task-307) — Action-validator registry.
 *
 * Module-level singleton mapping `ActionType → IActionValidator`. Mirrors
 * the `registerActionSpec` pattern in `cascade-actions/index.ts`: each
 * per-action validator file side-effect-registers on import. The thread
 * policy layer calls `validateActionsWithRegistry` at the convergence
 * gate right before the staged→committed promotion.
 *
 * Design boundaries (architect-ratified thread-232):
 *   - Validators receive a read-only `ValidationContext` — no IPolicyContext,
 *     no dispatch/emit/metrics, no mutation paths.
 *   - This is a fail-fast gate optimization, NOT a replacement for the
 *     cascade handler's own integrity checks. The cascade runner remains
 *     the final transactional arbiter.
 *   - Action types without a state-reality concern register the
 *     `NULL_VALIDATOR` (always ok).
 */
import type { IActionValidator, ValidationContext, ValidationResult } from "./types.js";
import { NULL_VALIDATOR } from "./types.js";
import type { ConvergenceGateSubtype } from "../../state.js";

const REGISTRY = new Map<string, IActionValidator>();

export function registerActionValidator(type: string, validator: IActionValidator): void {
  REGISTRY.set(type, validator);
}

export function getActionValidator(type: string): IActionValidator {
  return REGISTRY.get(type) ?? NULL_VALIDATOR;
}

export function allRegisteredActionValidators(): ReadonlyMap<string, IActionValidator> {
  return REGISTRY;
}

/** Shape of a per-action validation failure or no-op observation, with
 *  the action it refers to so the caller can correlate in the staged
 *  set. */
export interface ActionValidationOutcome {
  actionId: string;
  type: string;
  result: ValidationResult;
}

/**
 * Run the registered validator against every staged action in the set.
 * Returns:
 *   - `{ok: true, noOpActionIds: [...]}` when all validators pass. The
 *     `noOpActionIds` list enumerates action ids the gate should tag
 *     with `isNoOp=true` at commit time (for bug-14 idempotent skip).
 *   - `{ok: false, error, subtype, metadata}` on the FIRST failure.
 *     Gate caller raises a ThreadConvergenceGateError with these fields.
 *
 * Validators are called in staged-array order. First failure short-
 * circuits — the caller only needs one structured error to return.
 */
export interface ActionsValidatedOk {
  ok: true;
  noOpActionIds: string[];
}

export interface ActionsValidatedFail {
  ok: false;
  actionId: string;
  type: string;
  error: string;
  subtype: ConvergenceGateSubtype;
  metadata?: Record<string, unknown>;
}

export type ActionsValidationResult = ActionsValidatedOk | ActionsValidatedFail;

export async function validateActionsWithRegistry(
  actions: ReadonlyArray<{ id: string; type: string; status?: string; payload: unknown }>,
  context: ValidationContext,
): Promise<ActionsValidationResult> {
  const noOpActionIds: string[] = [];
  for (const a of actions) {
    // Only validate actions in the staged set — committed/retracted/revised
    // entries are past the gate or out of the promotion set.
    if (a.status && a.status !== "staged") continue;
    const validator = getActionValidator(a.type);
    const result = await validator.validate(a.payload, context);
    if (!result.ok) {
      return {
        ok: false,
        actionId: a.id,
        type: a.type,
        error: result.error ?? "validation failed with no message",
        subtype: result.subtype ?? "payload_validation",
        metadata: (result as { metadata?: Record<string, unknown> }).metadata,
      };
    }
    if (result.isNoOp) {
      noOpActionIds.push(a.id);
    }
  }
  return { ok: true, noOpActionIds };
}
