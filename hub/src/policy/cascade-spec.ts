/**
 * Mission M-Cascade-Perfection Phase 1 (ADR-015): declarative
 * ActionSpec registry for the cascade runner.
 *
 * Replaces the ADR-014 procedural CascadeHandler shape where each
 * handler owned persistence + idempotency + audit + dispatch inline.
 * An ActionSpec declares only the entity-producing step; the runner
 * in cascade.ts:runCascade composes idempotency + audit + dispatch
 * around it in a fixed, inspectable order.
 *
 * Bug classes eliminated at the runner level (see ADR-015 §Context):
 * - A (parallel-paths-drift): runner always dispatches; handler can't skip
 * - C (silent partial function): missing spec = action can't be staged
 * - D (idempotency inconsistency): runner owns findByCascadeKey invocation
 * - G (name drift): audit / event / type all live in one spec object
 *
 * Depth bound (INV-TH25) + audit recoverability (INV-TH26) handled
 * by the runner, not the spec.
 */

import type { z } from "zod";
import type { IPolicyContext } from "./types.js";
import type {
  Thread,
  StagedAction,
  StagedActionType,
  CascadeBacklink,
} from "../state.js";

// ── Idempotency key (re-export shape from ADR-014) ──────────────────

/** Natural idempotency key per INV-TH20. Hub-globally unique because
 *  actionId is thread-local and threadId is Hub-global. */
export interface CascadeIdempotencyKey {
  sourceThreadId: string;
  sourceActionId: string;
}

export function cascadeIdempotencyKey(thread: Thread, action: StagedAction): CascadeIdempotencyKey {
  return { sourceThreadId: thread.id, sourceActionId: action.id };
}

// ── ActionSpec interface ────────────────────────────────────────────

/**
 * `kind` controls which pipeline stages the runner invokes:
 *
 * - "spawn":       idempotency pre-check → execute → audit → dispatch.
 *                  execute returns the new entity. findByCascadeKey required.
 * - "update":      execute → audit → dispatch (no idempotency pre-check;
 *                  update-by-nature operations are idempotent). execute
 *                  may return null to signal "no-op" (runner reports
 *                  skipped_idempotent for the action).
 * - "audit_only":  execute → audit (no dispatch, no idempotency).
 *                  execute returns null. Use for close_no_action,
 *                  create_clarification — actions that don't spawn or
 *                  mutate a queryable entity.
 */
export type ActionSpecKind = "spawn" | "update" | "audit_only";

export interface ActionSpec<TPayload = Record<string, unknown>, TEntity = unknown> {
  readonly type: StagedActionType;
  readonly kind: ActionSpecKind;
  /** Zod schema for payload shape. Used by the tool layer + the gate's
   *  validateStagedActions. The spec is the one-source-of-truth. */
  readonly payloadSchema: z.ZodType<TPayload>;
  /**
   * kind="spawn" only. Runner calls this BEFORE `execute` to detect
   * prior spawn via the natural key. On hit, runner skips with
   * skipped_idempotent and records action_already_executed audit.
   */
  findByCascadeKey?: (
    ctx: IPolicyContext,
    key: CascadeIdempotencyKey,
  ) => Promise<TEntity | null>;
  /**
   * Domain-specific execution. kind="spawn": create+persist the entity
   * and return it. kind="update": mutate the target entity and return
   * it (or null for no-op idempotent updates). kind="audit_only":
   * return null. Throwing here is caught by the runner and reported
   * as status="failed" in the ConvergenceReport — no entity state
   * escapes partial.
   */
  execute: (
    ctx: IPolicyContext,
    payload: TPayload,
    action: StagedAction,
    thread: Thread,
    backlink: CascadeBacklink,
  ) => Promise<TEntity | null>;
  /** Audit action name (e.g., "thread_create_task"). Runner emits
   *  post-execute with actor=hub. null = skip audit stage. */
  readonly auditAction: string | null;
  /**
   * Build the audit-entry `details` string. Receives the entity
   * produced by execute (null for audit_only / no-op updates), the
   * originating action, the thread, and the thread summary frozen at
   * commit. Default: generic "<type> executed for <thread>/<action>".
   */
  auditDetails?: (
    entity: TEntity | null,
    action: StagedAction,
    thread: Thread,
    summary: string,
  ) => string;
  /**
   * SSE dispatch — runner invokes after successful audit. Omit for
   * audit-only actions. Called unconditionally on successful execute
   * with a non-null entity; spec is responsible for any
   * event-conditional logic (e.g., fire mission_activated only on
   * proposed→active edge).
   */
  dispatch?: (ctx: IPolicyContext, entity: TEntity, thread: Thread) => Promise<void>;
}

// ── Registry ────────────────────────────────────────────────────────

const registry = new Map<StagedActionType, ActionSpec>();

/**
 * Idempotent registration — later calls for the same type supersede.
 * Registration happens at module-load time (via side-effect imports
 * in cascade-actions/index.ts); runtime re-registration is only used
 * in tests that swap in a failing spec to exercise the cascade_failed
 * terminal path (INV-TH19).
 */
export function registerActionSpec<TPayload, TEntity>(spec: ActionSpec<TPayload, TEntity>): void {
  registry.set(spec.type, spec as ActionSpec);
}

export function getActionSpec(type: StagedActionType): ActionSpec | undefined {
  return registry.get(type);
}

export function listActionSpecs(): StagedActionType[] {
  return Array.from(registry.keys());
}

/**
 * Test helper — clear a spec so the registry can be re-populated
 * with a failing variant for cascade_failed terminal tests. Not
 * used in production flows.
 */
export function unregisterActionSpec(type: StagedActionType): void {
  registry.delete(type);
}
