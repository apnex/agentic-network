# Action-validator registry (Phase 2d CP2 C4, task-307)

Fail-fast state-reality check that runs at the **bilateral-convergence trigger**, right before staged actions promote to committed. Catches stale references (e.g. a `update_mission_status` action whose target mission was archived between stage-time and commit-time) with a structured `ThreadConvergenceGateError` so the LLM caller can self-correct without parsing the message string.

**Fail-fast philosophy:** this is a reject-early optimization, **NOT** a replacement for the cascade handler's own integrity checks. The cascade handler remains the final transactional arbiter. Handler guards must not be weakened on the assumption the gate already ran.

## Adding a validator for a new action type

1. Write a validator file: `<action-type>-validator.ts`. Follow the shape of `update-mission-status-validator.ts` (simplest) or `update-idea-validator.ts` (for no-op detection).

2. The validator implements `IActionValidator` (see `types.ts`):
   ```ts
   export const myValidator: IActionValidator = {
     validate: async (payload, ctx) => {
       // Read-only access to entity stores via `ctx.task`, `ctx.idea`, `ctx.mission`, ...
       // Never mutate. No dispatch/emit/metrics from inside a validator.
       return { ok: true };
       // Or on failure:
       // return {
       //   ok: false,
       //   error: "human-readable message",
       //   subtype: "stale_reference",         // see state.ts ConvergenceGateSubtype
       //   metadata: { entityType: "...", entityId: "..." },
       // };
       // Or on no-op (well-formed but would produce no state change):
       // return { ok: true, isNoOp: true };
     },
   };
   ```

3. Register it in `index.ts` via `registerActionValidator("<type>", myValidator)`. Import is side-effect only — no explicit bootstrap call from higher layers.

4. If the action type has no state-reality concern (pure creates with no parent-entity relationship), register `NULL_VALIDATOR` — it always returns `{ok: true}` and documents intent.

## Subtype selection

| Subtype | Use when |
|---|---|
| `stale_reference` | Target entity referenced by the payload no longer exists (deleted / archived) |
| `invalid_transition` | Target exists but the staged change is not a permitted FSM edge, or would spawn against a terminal-state container |
| `payload_validation` | Payload content is structurally present but semantically invalid (prefer this over `stale_reference` when the issue isn't about an entity missing) |

The first three (`stage_missing`, `summary_missing`, `authority`, etc.) are raised from other gate sites; validators shouldn't use them.

## Context shape: read-only, store-interfaces-only

`ValidationContext` (see `types.ts`) exposes the `I*Store` interfaces directly, not `IPolicyContext`:

```ts
export interface ValidationContext {
  task: ITaskStore;
  idea: IIdeaStore;
  mission: IMissionStore;
  thread: IThreadStore;
  proposal: IProposalStore;
  turn: ITurnStore;
  bug: IBugStore;
}
```

This means validators:
- **Can** call `ctx.mission.getMission(id)`, `ctx.idea.getIdea(id)`, etc.
- **Must not** call mutating methods on those interfaces (even though the TypeScript shape permits it — this is a convention, enforced by code review).
- **Cannot** dispatch events, emit, log audit entries, or increment metrics — those are gate-layer concerns handled by `thread-policy.ts` on the validator's return value.

## Centralized conventions

Cross-entity conventions (e.g. "a container mission must be non-terminal for new children to spawn") live in the entity module, not in validators. See `entities/mission.ts`:

```ts
export function isMissionCommittable(mission): boolean {
  return !TERMINAL_MISSION_STATUSES.has(mission.status);
}
```

Validators import and reuse these helpers. New container-relationship rules should follow the same pattern — define the predicate on the entity module, consume it from the validator.

## Integration point

Called from `thread-policy.ts` at the bilateral-convergence trigger (same scope as the per-action commit-authority check). See `validateActionsWithRegistry` in `registry.ts` for the short-circuit-on-first-failure semantics.

## Metrics

On failure: validator returns `{ok: false, subtype, ...}` → gate fires `convergence_gate.rejected` with `{subtype}` detail + `inv_th19.shadow_breach` audit entry.

On no-op detection: validator returns `{ok: true, isNoOp: true}` → gate fires `convergence_gate.noop_detected` telemetry.

## Related

- `docs/audits/phase-2d-cp2-report.md` — full CP2 audit report
- `docs/planning/m-cognitive-hypervisor.md` — mission spec with Phase 2d Extensions section
- thread-232 — architect brainstorm where the registry design was ratified
- `cascade-actions/` — the sibling pattern for cascade execution handlers (parallel shape: one file per action type + side-effect-import `index.ts`)
