# Phase 2d Checkpoint 1 — Observability + Invariant Audit Report

**Mission:** M-Cognitive-Hypervisor
**Task:** task-304 (Phase 2d CP1)
**Date:** 2026-04-20
**Scope of this report:** the CP1 deliverables defined in thread-224 (Phase 2d Robustness Audit brainstorm) and task-304 directive:

- Hub-side logging/metrics for INV-TH* invariants and cascade failures
- Audit of handler idempotency (per-handler certification against the architect-ratified contract)
- Baseline measurement of the current gap surface

All code changes landed in commits `eab52be`, `9b69cb1`, `fbaa917`, `0d3e4d6` on `main`.

---

## 1. INV-TH inventory + instrumentation map

Thirteen INV-TH identifiers are documented in ADR-014 (§134–143) and ADR-016. CP1 instruments the enforcement sites for the invariants that produce runtime failures today. Invariants that are design constants (e.g., TH22 shape coercion) or purely architectural (TH24 registry discipline) do not require observability.

| Invariant | Concern | Enforcement site(s) | Shadow-breach instrumentation |
|---|---|---|---|
| **INV-TH16** | Phase-1 participant-scoped dispatch | `thread-policy.ts` (dispatch selectors) | No direct throw; selector filters in dispatch path. Not instrumented — not a violation site. |
| **INV-TH17** | Turn pinning by `agentId` | `state.ts`, `gcs-state.ts` (replyToThread) | Throws `TransitionRejected("not this agent's turn")`. Not currently CP1-instrumented — wrapped in a broader transition-rejected class. Recommended follow-up: dedicated shadow emit. |
| **INV-TH18** | Routing mode ↔ mode-specific field consistency | `thread-policy.ts:96–102` (`validateRoutingModeArgs`) | ✅ `logShadowInvariantBreach("INV-TH18", …)` + `create_thread.routing_mode_rejected` counter. |
| **INV-TH19** | Validate-then-execute convergence gate | `state.ts:1373, 1387, 1559, 1564, 1582, 1587`; `gcs-state.ts:1545, 1558`. Propagates via `ThreadConvergenceGateError`. Caught at `thread-policy.ts:281`. | ✅ `logShadowInvariantBreach("INV-TH19", …)` with error-message-parse subtype tag (`stage_missing` / `summary_missing` / `payload_validation` / `revise_invalid` / `retract_invalid`) + `convergence_gate.rejected` counter (umbrella) and `convergence_gate.authority_rejected` counter at the authority-check path. |
| **INV-TH20** | Per-pair cascade idempotency | `cascade.ts:154–165` (`findByCascadeKey` gate) | ✅ `cascade.idempotent_skip` counter fires on hit; no shadow-breach emission since this is the intended path, not a violation. |
| **INV-TH21** | Thread reaper (idle-expiry) | (not in CP1 scope; D-CP3) | Deferred to CP3. |
| **INV-TH22** | Proposer widening (role-only → {role,agentId}) | `gcs-state.ts` (read-side coercion) | Not a violation site. |
| **INV-TH23** | Summary-as-Living-Record | `state.ts`, `gcs-state.ts` (summary write-through) | Not a violation site — assertion, not a throw. |
| **INV-TH24** | ActionSpec registry discipline | `cascade.ts:136–143` (missing-spec guard) | ✅ `cascade_fail.unknown_spec` counter on missing-spec path (class C per ADR-015 — eliminated but still guard-protected). |
| **INV-TH25** | MAX_CASCADE_DEPTH bound | `cascade.ts:81–92` | ✅ `logShadowInvariantBreach("INV-TH25", kind: "breach")` at depth = MAX; `kind: "near_miss"` at depth = MAX-1. `cascade_fail.depth_exhausted` counter on breach. |
| **INV-TH26** | Audit-write recoverability | `cascade.ts:224–235` (`safeAudit`) | ✅ `cascade_fail.audit_failed` counter on audit throw; does not block entity commit. |
| **INV-TH27** | No role-fallback dispatch | `thread-policy.ts` (reply dispatch selector) | Enforced implicitly via selector shape; throw site absent — architectural invariant, not a runtime check. Not CP1-instrumented. |
| **INV-TH28** | Unicast requires `recipientAgentId` | `thread-policy.ts:51–58` (validateRoutingModeArgs) | Covered by INV-TH18 shadow (same enforcement path). |

### Metric bucket taxonomy (final, as of this commit)

Shadow-breach buckets (from `logShadowInvariantBreach`):
```
inv_th18.shadow_breach
inv_th19.shadow_breach
inv_th25.shadow_breach
inv_th25.near_miss
```

Convergence-gate buckets (from thread-policy.ts):
```
convergence_gate.rejected                — umbrella, subtype in detail payload
convergence_gate.authority_rejected      — per-action commit authority denial (task-303)
create_thread.routing_mode_rejected      — INV-TH18 rejection at create_thread
```

Cascade-failure / idempotency buckets (from cascade.ts):
```
cascade_fail.depth_exhausted    — runCascade hit MAX_CASCADE_DEPTH (INV-TH25)
cascade_fail.unknown_spec       — no ActionSpec registered for type (INV-TH24)
cascade_fail.execute_threw      — spec.execute threw
cascade_fail.dispatch_failed    — spec.dispatch threw (non-blocking, SSE best-effort)
cascade_fail.audit_failed       — safeAudit logEntry threw (non-blocking, INV-TH26)
cascade.idempotent_skip         — spawn handler findByCascadeKey hit (intended path)
cascade.idempotent_update_skip  — update handler returned null = no-op
```

Each bucket records `{ threadId, actionId, type, error, subtype, … }` structured details via the ring-buffer-bounded `recentDetails` channel (cap 32 per bucket).

---

## 2. Idempotency contract certification

Architect-ratified contract (thread-224):

> Every spawn handler registered via `registerActionSpec` must satisfy:
> (a) `findByCascadeKey` implemented non-trivially
> (b) `execute` returns existing entity on natural-key collision without side effects
> (c) Running handler twice with identical action input produces exactly one entity

Status per handler (verified by `hub/test/unit/contract-idempotency.test.ts`, 23 tests):

| Action type | kind | (a) findByCascadeKey | (b) side-effect-free collision | (c) exactly-one-entity double-run | Certification |
|---|---|---|---|---|---|
| `create_task` | spawn | ✅ Non-trivial — delegates to `task.findByCascadeKey` | ✅ (corollary of c) | ✅ Second run returns `skipped_idempotent` + same `entityId`; `cascade.idempotent_skip` fires | **Certified** |
| `create_proposal` | spawn | ✅ Non-trivial — delegates to `proposal.findByCascadeKey` | ✅ (corollary of c) | ✅ Second run returns `skipped_idempotent` + same `entityId`; `cascade.idempotent_skip` fires | **Certified** |
| `create_idea` | spawn | ✅ Non-trivial — delegates to `idea.findByCascadeKey` | ✅ (corollary of c) | ✅ Second run returns `skipped_idempotent` + same `entityId`; `cascade.idempotent_skip` fires | **Certified** |
| `create_bug` | spawn | ✅ Non-trivial — delegates to `bug.findByCascadeKey` | ✅ (corollary of c) | ✅ Second run returns `skipped_idempotent` + same `entityId`; `cascade.idempotent_skip` fires | **Certified** |
| `propose_mission` | spawn | ✅ Non-trivial — delegates to `mission.findByCascadeKey` | ✅ (corollary of c) | ✅ Second run returns `skipped_idempotent` + same `entityId`; `cascade.idempotent_skip` fires | **Certified** |
| `update_idea` | update | N/A (update-kind does not use `findByCascadeKey`) | ⚠️ **Partial** — execute does not compare `changes` to current state; re-applies on double-run | ⚠️ **Partial** — produces two audit entries; target entity unchanged post-first-run but audit side-effect occurs | **Gap — see §4.2** |
| `update_mission_status` | update | N/A | Not specifically tested (similar shape to update_idea; likely same gap) | Not specifically tested | Gap (inferred; test coverage follow-up) |
| `close_no_action` | audit_only | N/A | Re-runnable (audit-only: each run just writes an audit entry; no entity to dedupe) | N/A (no entity spawned) | Not applicable — audit-only, safe to re-run |
| `create_clarification` | audit_only | N/A | Re-runnable | N/A | Not applicable — audit-only, safe to re-run |

**Bottom line:** all 5 spawn handlers (`create_task`, `create_proposal`, `create_idea`, `create_bug`, `propose_mission`) are certified against the full spawn idempotency contract. They are safe substrate for CP4 (`retry_cascade`).

---

## 3. Baseline measurement: gap-surface

### 3.1 `ThreadConvergenceGateError` frequency

**Production signal:** today the Hub emits `ThreadConvergenceGateError` through the policy-layer catch at `thread-policy.ts:281`, which returns a JSON error response to the caller. **No audit entry is written on the gate-reject path.**

With the CP1 shadow-breach instrumentation now live, every INV-TH19 rejection increments:
- `inv_th19.shadow_breach` counter (with structured `subtype` detail)
- `convergence_gate.rejected` counter (umbrella)
- An `inv_th19_shadow_breach` audit entry (via `audit.logEntry`) — first-class persistence

**Baseline method going forward:**
- Counter snapshot via `ctx.metrics.snapshot()` reachable from an admin/debug endpoint (not yet exposed — CP2 work).
- Audit-log scan via `list_audit_entries` filtered on `action = inv_th19_shadow_breach` (available today via policy tool).

**Historical baseline:** since the shadow-breach audit entry did not exist before commit `9b69cb1` (2026-04-20T~18:24 UTC), the audit log has no retroactive signal. Historical gate-reject frequency must be reconstructed from console logs scraped from Cloud Run (pattern: `Thread convergence rejected:`). Recommended next step: a one-off log-mining script (CP5-adjacent) to produce pre-instrumentation baseline.

### 3.2 Cascade-failure rate

Similar shape: no pre-existing telemetry for cascade failure types. `cascade_failed` terminal already emits an audit entry (`thread_cascade_failed`), so coarse-grain cascade-fail frequency IS reconstructable pre-instrumentation. Per-reason breakdown (depth-exhausted vs execute-threw vs audit-failed vs dispatch-failed) is only available forward from commit `fbaa917` (2026-04-20T~18:30 UTC).

### 3.3 Observed breach counts (this session)

Running the full Hub test suite (503 tests) exercises the instrumented paths repeatedly. Counter state is per-process, so test-run counts don't reflect production frequency — they are a smoke-check that the wiring fires. All CP1 observability code paths are exercised:
- INV-TH18 shadow breach: fires on routing-mode validation tests.
- INV-TH19 shadow breach: fires on empty-staged, empty-summary, validation-failed, revise/retract-invalid tests.
- INV-TH25 shadow breach + near-miss: fires on depth-exhaustion test and depth = MAX-1 test.
- `cascade_fail.*`: fires on execute-threw, unknown-spec, depth-exhausted tests.
- `cascade.idempotent_skip`: fires on every spawn handler double-run.

---

## 4. Findings

### 4.1 `update_idea` no-op detection gap (CP1-surfaced)

**Finding:** `update_idea.execute` applies the provided `changes` unconditionally — no comparison against the idea's current state. A second cascade on the same action re-applies the changes and produces a second `thread_update_idea` audit entry, even when the target is already at the desired state.

**Contract consequence:** fails spawn-contract element (b) side-effect-freeness on collision. Produces audit side-effects (not entity mutation, since the idea's field is already at the target value).

**Severity:** minor — the entity's state is correct after both runs; the audit log gets a redundant entry. Affects forensic log hygiene more than correctness.

**Fix sketch:** before calling `stores.idea.updateIdea`, read the current idea, compute the diff between `changes` and current; if empty, return `null` (which the runner already handles as `skipped_idempotent` via `cascade.idempotent_update_skip`).

**Recommendation:** not a CP1 scope item. Log as a deferred update-handler hardening follow-up. Test `contract-idempotency.test.ts:update_idea` documents current behavior and asserts it explicitly so a future fix will flip that test.

### 4.2 `update_mission_status` — not specifically tested

**Finding:** `update_mission_status` has the same `kind: "update"` shape as `update_idea`; likely shares the no-op-detection gap, but CP1 did not write a dedicated contract test.

**Recommendation:** add a parallel test when the update-handler hardening follow-up (§4.1) lands; the two handlers should share a common "return null when diff is empty" helper.

### 4.3 INV-TH17 instrumentation gap

**Finding:** INV-TH17 (turn pinning by `agentId`) throws `TransitionRejected` inside `state.ts` / `gcs-state.ts` store code — a broader class used across several Phase-1 invariants. CP1 did not add per-invariant shadow instrumentation here; the throws propagate up as generic transition errors.

**Recommendation:** dedicated shadow emit inside each store-layer INV-TH17 throw site. Design detail: a `logShadowInvariantBreach` call needs access to `ctx` (for metrics + audit), which is policy-layer concern. Either (a) plumb the metrics counter into the store layer, or (b) instrument at the policy-layer catch site (similar to how INV-TH19 was handled in CP1). Option (b) is cheaper and keeps stores pure.

### 4.4 No admin/debug endpoint exposes `ctx.metrics.snapshot()`

**Finding:** the metrics counter is per-process in-memory with no read-side tool. Forward-looking baseline analysis requires either (a) adding a `get_metrics` policy tool, or (b) exporting via a plain HTTP admin route.

**Recommendation:** add a read-only MCP tool (`get_metrics`, architect-only) in D-CP2 Protocol Standardization. Until then, metrics are test-only; audit-log remains the operational query surface.

### 4.5 Pre-instrumentation baseline cannot be recovered from audit log

**Finding:** gate-reject and cascade-failure-taxonomy telemetry did not exist before CP1 commits. Historical baseline must come from Cloud Run console logs.

**Recommendation:** schedule a one-off log-mining script as a baseline-establishment task (light effort; not blocking D-CP2 through D-CP4). Target: 14-day historical window of `Thread convergence rejected:` console-log pattern frequency.

---

## 5. Recommendations for D-CP2, D-CP3, D-CP4

### 5.1 D-CP2 Protocol Standardization (gated on CP1 — this report)

- Add `get_metrics` read-only MCP tool (architect-only) to expose `ctx.metrics.snapshot()` + recent details. Closes Finding §4.4.
- `ThreadConvergenceGateError` → instructional format: include `subtype` + `remediation` fields in the returned JSON error so the LLM can self-correct. Subtype enumeration is already established by CP1 (`stage_missing`, `summary_missing`, `payload_validation`, `revise_invalid`, `retract_invalid`).
- Universal `_ois_query_unmatched` sentinel on all `list_*` tools (idea-119 scope; partially shipped for `list_tasks`).
- Stale-staged-action revalidation at convergence gate: re-run `validateStagedActions` + re-check entity existence references right before the staged→committed promotion, so stale references don't spawn cascade-fail.

### 5.2 D-CP3 Reaper + Lifecycle GC

- Thread reaper (INV-TH21): instrument with `thread.reaped` and `thread.reap_failed` counters.
- On thread GC, emit `pending_action.abandon` for each associated queue item (queue-thread bidirectional integrity per thread-224 consensus).
- Summary-only truncation on thread close (first-3 + last-3 messages + stagedActions + summary). Keep the trimmed messages as an audit snapshot.
- Queue-side `prune_stuck_queue_items` → emit a thread-side event so `list_threads` reflects reality (the reverse observability gap flagged during thread-224).

### 5.3 D-CP4 `retry_cascade` (gated on CP1 handler-idempotency certification)

- **Prerequisite met:** all 5 spawn handlers are certified against the spawn idempotency contract (§2). `retry_cascade` can call `runCascade` against the original committed actions and rely on per-pair `findByCascadeKey` short-circuits to avoid double-spawn.
- Caveat: `update_idea` + `update_mission_status` non-idempotency (§4.1) means `retry_cascade` on a thread with update actions will re-apply the update. For CP4's initial scope, either (a) restrict retry to spawn-only actions, or (b) ship the update-handler hardening (§4.1 fix) in parallel. Recommend (b) — small scope, clean fix.

### 5.4 Cross-cutting: audit-log query enhancements (absorbable into F/idea-119 Phase 2)

- Filter `list_audit_entries` by `action` (prefix or exact) to make shadow-breach frequency queryable without scanning.
- This is already an idea-119-shaped extension; fold into F's scope rather than open a separate idea.

---

## 6. CP1 scorecard

| CP1 deliverable (from task-304 directive) | Status | Evidence |
|---|---|---|
| Hub-side logging for INV-TH* near-breaches | ✅ Complete | `hub/src/observability/shadow-invariants.ts`; wired at INV-TH18, TH19, TH25 sites |
| Hub-side metrics for cascade failure types | ✅ Complete | `cascade_fail.*` + `convergence_gate.*` buckets on every failure path; 4 integration tests in `cascade-metrics.test.ts` |
| Idempotency audit of spawn handlers | ✅ Complete | 5/5 spawn handlers certified against full contract; 23 tests in `contract-idempotency.test.ts` |
| Contract tests for spawn handler idempotency | ✅ Complete | Parameterized over all 5 spawn action types; (a), (b) via corollary, and (c) each asserted |
| Baseline measurement of gap surface | ⚠️ Forward-only | Instrumentation live from commit `9b69cb1`+; historical baseline requires log-mining (§4.5) |
| Audit report | ✅ This document |

CP1 unblocks CP2 (Protocol Standardization can use the observability primitives) and CP4 (`retry_cascade` can rely on the certified idempotency contract). CP3 has no hard dependency on CP1 output.
