# task-316 — Review-Outcome Cascade (Closing Report)

**Task ID:** task-316 (supersedes canceled task-315).
**Scope artefact trail:** idea-144 (filed) → thread-240 (Option A: Mission.plannedTasks) → thread-241 (Option X: full 4-cell cascade + Review.decision) → thread-242 (v1 revision-loop FSMs).
**Originating gap:** bug-20 (observed 5× across mission-38; quantified cost ≥15 engineer tool-calls per mission in pure nudge overhead).
**Date:** 2026-04-21.
**Commits:** `36f8c10` (Hub-side implementation + 22 new tests).

---

## 1. Deliverable scorecard

| Deliverable | Source | Status | Evidence |
|---|---|---|---|
| Mission.plannedTasks schema extension | thread-240 Option A | ✅ | `hub/src/entities/mission.ts`; mirrored in GcsMissionStore |
| Review.decision enum (`approved` \| `revision_required`) | thread-241 | ✅ | Canonical `revision_required` + legacy `rejected` alias in review-policy.ts |
| 4-cell review-outcome cascade (no silent cells) | thread-241 Option X | ✅ | Tests cover all 4 cells (matrix below) |
| Dispatch intents (`review_available` / `address_feedback`) | thread-241 | ✅ | Tagged on `review_completed` + `revision_required` payloads |
| Revision-loop FSMs (v1) | thread-242 | ✅ | Task `in_review → working`; report replace-on-resubmit; review mutate-in-place |
| cascade_failed observability (criterion-5 compliance) | director framing | ✅ | Audit entry + Director notification on any cascade failure |
| Test coverage | engineer-owned | ✅ | 22 new tests; 608 total pass (prior 586 unchanged) |
| Closing audit report | engineer-owned | ✅ | This document |
| Hub report + bug-20 → resolved + idea-144 → incorporated | engineer-owned | pending | Next commit |

bug-23 (thread bilateral-seal race) remains `investigating` — surfaced independently during scope ratification; not blocking.

---

## 2. Mission goal + success framing

**Goal.** Eliminate the nudge-per-review pattern that mission-38 observed five consecutive times. Every multi-task mission prior to task-316 required an engineer or director nudge thread to prod the architect's event loop between `auto_review` and `task_issued` for the next-planned task. Closing-audit §7.7 of mission-38 quantified the cost: ~15 engineer tool-calls + ~30-40 min stall per review→next-task handoff.

**Director's framing principle ("no silent cells"):** if some next action needs to occur, the specific agent required to do it must be notified via the correct mechanism — through the Policy Engine from the Hub. The design explicitly rejects polling as an acceptable engineer fallback.

**Success criteria (derived from that framing):**
1. Every cell of the `{decision, mission-linkage}` matrix has a deterministic, FSM-enforced next action.
2. Zero cells leave an agent in the dark.
3. Cascade failure surfaces as `cascade_failed` + Director notification, never silently.
4. v1 FSMs are simple, deterministic, and explicitly transitional (idea-134 will supersede the Task-scoped Report model with a Mission-wide Report + Trace when that cluster matures).

All four met.

---

## 3. Per-component architecture recap

### 3.1 Mission.plannedTasks — schema + store

```typescript
export interface PlannedTask {
  sequence: number;           // Ordinal position in the plan
  title: string;              // Becomes spawned Task.title
  description: string;        // Becomes spawned Task.description
  status: "unissued" | "issued" | "completed";
  issuedTaskId?: string | null; // Bound spawned Task id when issued
}

export interface Mission {
  // ...existing fields unchanged...
  plannedTasks?: PlannedTask[];
}
```

**Invariants:**
- Additive: pre-task-316 missions have `plannedTasks === undefined` → no-op advancement (migrate-on-read semantics).
- Tool-surface normalisation: caller-supplied `status` / `issuedTaskId` are clamped to `unissued` / `null` at the tool boundary. Advancement bookkeeping belongs to the cascade, not callers.
- Store-level FSM: `markPlannedTaskIssued` → `unissued → issued` only; `markPlannedTaskCompleted` → `issued → completed` only; both no-op (return null) on wrong-state input.

**Helpers:**
- `findNextUnissuedPlannedTask(plannedTasks)` — pure function returning the lowest-sequence `unissued` slot, or `null`.

### 3.2 Review.decision enum — `revision_required` canonical + `rejected` alias

The existing Review layer accepted `decision: "approved" | "rejected"` with defaulting to `"approved"`. Thread-241 ratified `"revision_required"` as the canonical name. The policy layer accepts both:

```typescript
const rawDecision = (args.decision as string) || "approved";
const decision = rawDecision === "revision_required" ? "rejected" : rawDecision;
```

`rejected` is preserved as a back-compat alias so existing test corpora + prior-deploy architects continue to work.

### 3.3 The 4-cell cascade matrix

|  | Approved | Revision required |
|---|---|---|
| **Mission-linked task** | Cascade advances: mark `completed`, find next `unissued`, spawn Task with `correlationId = mission.id`, mark `issued`, dispatch `task_issued`. Mission-advancement audit logged. | Standard `revision_required` dispatch with `intent: "address_feedback"`. Task flips `in_review → working`. Advancement gate explicitly closed (plannedTask stays `issued`, never `completed`). |
| **Standalone task** | `review_completed` dispatch with `intent: "review_available"`. Task flips to `completed`. No advancement (no mission). | `revision_required` dispatch with `intent: "address_feedback"`. Task flips to `working`. |

**Where each cell lives in code:**
- Cell 1 (approved + mission-linked): `handleTaskCompleted` in `hub/src/policy/task-policy.ts` — added in this task.
- Cell 2 (approved + standalone): `createReview` in `hub/src/policy/review-policy.ts` — existing `review_completed` dispatch; intent tag added.
- Cell 3 (revision_required + mission-linked): `createReview` rejected branch in review-policy.ts — existing `revision_required` dispatch; intent tag added; advancement gate is implicit (cascade only fires on `task_completed` internal event, which the rejected branch doesn't push).
- Cell 4 (revision_required + standalone): same as cell 3.

### 3.4 Revision-loop FSMs (v1, transitional per thread-242)

Ratified on thread-242 with explicit idea-134 transitional framing.

- **FSM-1 (Task state):** pre-existing `in_review → working` transition (on `decision=revision_required`) + `in_review → completed` transition (on `decision=approved`) already in `TASK_FSM`. No code change required.
- **FSM-2 (Report semantics):** pre-existing `submitReport` is already replace-on-resubmit semantics — `task.report`, `task.reportSummary`, `task.reportRef` are overwritten on each call. 1:1 Task:Report invariant preserved. No code change required.
- **FSM-3 (Review entity mutation):** pre-existing `submitReview` mutates `task.reviewAssessment` + `task.reviewRef` in place. Review has no separate entity; the decision flips in place across iterations. No code change required.

The "major realization" during implementation was that these three FSMs were already correctly built; thread-242's ratification validated the existing behaviour rather than requiring new code.

### 3.5 Robustness — cascade_failed path

`handleTaskCompleted`'s mission-advancement block is wrapped in a `try`/`catch`:

```typescript
try {
  // ... advancement cascade ...
} catch (err) {
  console.error(...);
  try {
    await ctx.stores.audit.logEntry("hub", "cascade_failed", ..., taskId);
    await ctx.stores.directorNotification.create({
      severity: "warning",
      source: "cascade_failed",
      sourceRef: taskId,
      title: `Mission-advancement cascade failed on task ${taskId}`,
      details: `The review approval of ${taskId} completed, but ...`,
    });
  } catch (innerErr) {
    console.error(`Cascade-failure bookkeeping also errored: ${innerErr}`);
  }
}
```

Key properties:
- Primary review approval always succeeds — cascade failure never rolls back the task's `completed` status. The architect's review is independent of the advancement decoration.
- Director always notified via the existing `cascade_failed` notification source.
- Audit entry always written unless audit itself fails — and even then the error is swallowed rather than propagated (cascade advancement is best-effort).

---

## 4. New observability surface

### 4.1 Hub audit actions

| Action | Fires when | Introduced in |
|---|---|---|
| `mission_advancement_cascade` | Approved review on mission-linked task successfully auto-issues next plannedTask | task-316 |
| `cascade_failed` | Advancement cascade throws (any reason) | task-316 (expands existing vocabulary) |

### 4.2 New dispatch payload fields

All existing dispatch event names (`review_completed`, `revision_required`, `task_issued`) carry these new fields when emitted through task-316's code paths:

| Field | Set by | Semantics |
|---|---|---|
| `intent` | review-policy.ts | `"review_available"` for approved standalone; `"address_feedback"` for revision_required (any). Not set on `task_issued` (the task itself is the signal). |
| `decision` | review-policy.ts | Verbatim canonical enum value (`"approved"` or `"revision_required"`) on review dispatches. Engineer adapter can gate on this without string-matching `assessment`. |

### 4.3 Director notification source

Existing `cascade_failed` source gains a new ref-type: `sourceRef = taskId` with title `"Mission-advancement cascade failed on task X"`. Surfaces through `list_director_notifications` normally.

---

## 5. Test coverage

22 new tests in `hub/test/task-316-mission-advancement.test.ts`, organised into 7 describe blocks:

| Block | Tests | Covers |
|---|---|---|
| Mission.plannedTasks schema | 4 | create/update accept plannedTasks; legacy missions undefined; caller-supplied status normalisation |
| findNextUnissuedPlannedTask pure helper | 3 | null cases, lowest-sequence preference, all-done terminal |
| Store FSM transitions | 3 | markPlannedTaskIssued + markPlannedTaskCompleted + wrong-taskId no-op |
| Review decision enum alias | 4 | revision_required canonical, rejected back-compat, intent=address_feedback, intent=review_available |
| 4-cell cascade matrix | 4 | all 4 cells covered with dispatch + audit assertions |
| Multi-task end-to-end traversal | 1 | 3-task mission auto-traverses with zero nudges; exactly 2 mission_advancement_cascade audits fire |
| Revision-required remediation loop | 1 | revision_required → replace report → approved → advancement fires at the end |
| cascade_failed robustness | 2 | simulated cascade failure → Director notification + audit; no-plannedTasks mission → clean no-op |

All 608 hub tests pass (586 pre-existing unchanged + 22 new). `tsc --noEmit` clean. 62 vertex-cloudrun tests pass unchanged.

---

## 6. Mission-38 counterfactual

The closing audit for mission-38 quantified the nudge cost at 5 threads × ~3 tool-calls each = ~15 engineer tool-calls per mission, plus ~30-40 min stall per review→next-task handoff.

With task-316 landed, a counterfactual mission-38 run would have:
- 0 nudge threads
- 1 single architect review-approval per task → automatic next-task issuance
- Observability: 4 `mission_advancement_cascade` audit entries tracing the 5-task traversal (tasks 1→2, 2→3, 3→4, 4→5; no 5→? cascade since there's no 6th plannedTask)

Every future multi-task mission benefits on ship.

---

## 7. Findings flagged during implementation

### 7.1 Review is not a separate entity — review data lives on Task

The "Review.decision" field in thread-241 ratification implicitly assumed a stored Review entity. Reality: review assessments are transient state transitions; decision + assessment + reviewRef all persist on the Task (`task.reviewAssessment`, `task.reviewRef`). task-316 adapts accordingly: `decision` is a `create_review` tool argument, not a persisted field. The `get_review` tool reads from Task.

No scope impact — the 4-cell cascade dispatches on `decision` at invocation time, not on a persisted field. But worth flagging for future refactors that assume a Review entity exists.

### 7.2 FSM transitions already existed

The `in_review → working` (revision) and `in_review → completed` (approved) transitions were already in `TASK_FSM` pre-task-316. The existing review-policy.ts already called `submitReview` with the right decision value. Thread-242's FSM ratification was validation of existing behaviour, not a scope expansion. The task-316 delta shrank significantly as a result.

### 7.3 Intent tagging is additive on existing dispatches, not new dispatch types

Architect's thread-241 response suggested "two new `intent` values" — these are payload fields, not new `dispatch_type` enum values. The existing `review_completed` + `revision_required` event names already carried the semantic channels; task-316 added `intent` + `decision` payload fields for explicit discrimination. No changes to `PendingActionDispatchType` enum.

### 7.4 Engineer adapter requires no code changes

The existing SSE / pending-action infrastructure already delivers these dispatches to the engineer adapter. The engineer's LLM reads payload fields (`intent`, `decision`, `feedback`, `reviewRef`) directly in its tool-round context via `drain_pending_actions`. Adapter wiring is complete through infrastructure, not new code.

### 7.5 bug-23 (thread bilateral-seal race) — verified by thread-242 success

thread-242 was a controlled-comparison data point for bug-23 — architect's reply staged `close_no_action` with NO cascade-spawning action. Engineer's bilateral seal succeeded cleanly (thread-240 pattern), confirming H1 (race) over H2 (intentional asymmetry). bug-23 status flipped `open → investigating` with the verification data appended; severity stays minor pending scale observation.

---

## 8. Tele advancement

| Tele | Advancement from task-316 |
|---|---|
| **tele-2 (Frictionless Agentic Collaboration)** | Criterion 2 (Atomic Transitions) direct win — planning→execution now occurs atomically via Hub auto-scaffolding at the task-sequence layer. Criterion 3 (Role Purity) preserved — architect still governs mission scheduling; engineer still owns task execution; the cascade doesn't cross either boundary. |
| **tele-3 (FSM enforcement)** | New `mission_advancement_cascade` cascade dispatches through Policy Router with FSM-enforced transitions on both Task FSM (in_review→working/completed) and plannedTask FSM (unissued→issued→completed). `decision` is enum-validated at the router. Zero unhandled events; cascade is either dispatched + audited or rejected with actionable error. |
| **tele-4 (Resilient Agentic Operations)** | Criterion 5 ("actionable feedback for all failures") compliance: any cascade failure emits `cascade_failed` + Director notification. Primary review approval never silently loses work. |
| **tele-6 (Deterministic Invincibility)** | 22 new tests cover all 4 cells + multi-task traversal + remediation loop + cascade_failed path. Fully deterministic under unit-test harness. TestOrchestrator-style end-to-end simulation (3-task mission auto-traverse) proves the multi-agent graph resolves correctly. |
| **tele-7 (Perfect Contextual Hydration)** | `plannedTasks` is now a queryable field on the Mission entity. Future Phase E (pre-hydration) can pre-load plannedTasks into architect prompt context for review-time decisions. The engineer receives structured `intent` + `decision` + `feedback` at drain-time — no polling, no "what state is X in" followups. |
| **tele-8 (Autopoietic Evolution)** | plannedTasks is the data substrate that future branching logic + dynamic plan generation + mission-progress visualisation extends from. First structured step toward "architect composes mission plan, engineer self-advances through it autonomously." |

---

## 9. Non-scope / explicit v1 limitations

Named explicitly so future readers don't mistake incremental delivery for completion:

- **No rollback/reordering of plannedTasks post-issuance.** Write paths are create + mark-issued + mark-completed only. Re-work requires creating a new Mission.
- **No cross-mission dependencies.** A task in mission A blocking a task in mission B remains manual via `dependsOn` coordination.
- **No dynamic plan generation.** A task's outcome cannot add new plannedTasks to its parent mission. Candidate for idea-134 or a follow-up arc.
- **No revision-retry budget beyond the pre-existing `revisionCount >= 3` escalation.** Unbounded revision loops are bounded only by the existing escalation path; any scale-driven need for finer retry semantics folds into bug-22 (continuation retry gap) or a dedicated arc.
- **No Mission-close automation.** When all plannedTasks are `completed`, the mission's status does not auto-flip to `completed` — out-of-plan work may remain via direct `create_task`. Director/architect explicitly transitions via `update_mission`.
- **Transitional to idea-134.** Mission-wide Report + attached Trace is the target model; task-316's Task-scoped revision-loop FSMs are explicitly superseded when idea-134's cluster ships.

---

## 10. Prereqs cleared

### 10.1 bug-20 closes on ship

Filed 2026-04-22 after mission-38's first observation; 5× observed by mission close; task-316 is the direct fix. bug-20 flips `open → resolved` with `fixCommits: [36f8c10]` in the work-trace patch commit.

### 10.2 idea-144 → incorporated

Architect-authority transition; flagged in the upcoming work-trace patch for architect follow-up (engineer authority caps at `triaged`).

### 10.3 Downstream substrate for idea-134

plannedTasks is the Task-scoped precursor to idea-134's Mission-wide execution plan. When idea-134's cluster ratifies, plannedTasks migrates to the Trace entity's node structure — no data loss, additive refactor.

---

## 11. Key references

### Implementation
- `hub/src/entities/mission.ts` — PlannedTask type + IMissionStore extensions + findNextUnissuedPlannedTask + MemoryMissionStore
- `hub/src/entities/gcs/gcs-mission.ts` — GCS mirror
- `hub/src/entities/index.ts` — re-exports
- `hub/src/policy/mission-policy.ts` — tool-surface extension (create_mission + update_mission accept plannedTasks; output includes plannedTasks)
- `hub/src/policy/review-policy.ts` — decision enum alias; intent payload tags
- `hub/src/policy/task-policy.ts` — handleTaskCompleted mission-advancement cascade + cascade_failed robustness

### Tests
- `hub/test/task-316-mission-advancement.test.ts` — 22 tests, 7 describe blocks

### Commit
- `36f8c10` — [task-316] Hub-side review-outcome cascade + Mission.plannedTasks schema

### Ratification trail
- idea-144 (filed from mission-38 closing audit §7.7 / bug-20 triage)
- thread-240 — Mission.plannedTasks Option A (ratified over Option B markdown-parse)
- thread-241 — 4-cell cascade Option X; Review.decision enum
- thread-242 — v1 revision-loop FSMs
- bug-23 — bilateral-seal race (investigating; H1 verified by thread-242 controlled comparison)

### Adjacent
- mission-38 closing report (`docs/audits/m-hypervisor-adapter-mitigations-closing-audit.md`) — quantified the nudge cost this task eliminates
- idea-134 — Mission-wide Report + Trace (target model; task-316 is the transitional Task-scoped precursor)

---

## Close

task-316 lands the frictionless review-outcome cascade end-to-end. The scope originally directed as idea-144 Path A (advancement-only) was expanded via thread-241 to cover the full 4-cell matrix with zero silent cells, then refined via thread-242 to include v1 revision-loop FSMs — all pre-code, all ratified before implementation. The Hub-side delta was significantly smaller than initial estimates because existing FSMs, dispatch infrastructure, and review-policy branches already covered 3 of 4 cells; only the mission-advancement cell required new code.

608 hub tests pass; 62 vertex-cloudrun tests pass; tsc clean. bug-20 closes on ship. idea-144 awaits architect `triaged → incorporated` transition.

Next engineer-side opportunities (listed in mission-38 closing report §9): CP4 (`retry_cascade`) on M-Cognitive-Hypervisor; Phase E pre-hydration (gated on bug-11 verdict); bug-22 + idea-146 task-314 hardening gaps; bug-23 Hub-side investigation.
