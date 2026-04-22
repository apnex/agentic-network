# Mission: M-Cascade-Correctness-Hardening

**Status:** DRAFT — Phase 4 mission brief (architect-side fields); engineer scope-decomposition in parallel; unified brief ratifiable post cross-review; files as `proposed` on Director final ratification per Phase 4 §10.6 protocol.
**Phase 4 pick:** #2 of 4 (M-class; reliability blocker — best composite × cost ratio in pool).

---

## Name

**M-Cascade-Correctness-Hardening**

---

## Tele served

| Tele | Role | Why |
|---|---|---|
| tele-7 Resilient Agentic Operations | primary | Cascade correctness IS resilience at the orchestration layer |
| tele-2 Isomorphic Specification | secondary | Cascade behavior matches spec (bug-27 documentRef drop is spec-reality divergence) |
| tele-6 Frictionless Agentic Collaboration | secondary | Cascade failures disrupt flow between agents |

**Tele-leverage score: 3.**

---

## Concept-grounding (Phase 3 register)

- **Hub-as-Conductor (§2.3)** — primary (cascade IS the Hub substrate that drives work between actors)
- **Uniform Adapter Contract (§2.1)** — partial (cascade handlers cross adapter boundary)

---

## Goal

Resolve the four cascade-execution drift bugs clustered in Phase 2 as recurring reliability-friction in the Hub cascade layer. Each bug is bounded; the class is concentrated; resolving all four closes a reliability-gate for multi-task mission execution and enables downstream idea-144 Path A workflow-advancement.

**Best composite × cost ratio in Phase 4 pool (5/8 composite at M effort).** Blocker group because the four underlying drift bugs are production-observable today and compound with other missions' reliability concerns.

---

## Scope (in / out)

### In scope (four bounded bug-fix tasks)

1. **bug-22 — PendingActionItem retry-count schema + terminal escalation.** Continuation-sweep lacks retry limit; infinite re-dispatch loop on persistent failure. Fix: extend PendingActionItem with `attemptCount` + enforce terminal escalation to `errored` or `escalated` state after N retries.
2. **bug-23 — bilateral-seal race.** Engineer reply rejected after architect cascade-converge beats the seal. Fix: explicit state-transition protocol preventing inter-party race at convergence-moment.
3. **bug-27 — propose_mission cascade drops `documentRef`.** Silent payload-field drop between staged action and entity creation. Fix: cascade-handler payload-passthrough audit across all 8 cascade-action types; no silent field drops; mission-40 `propose_mission` specifically.
4. **bug-28 — DAG dep-eval against already-completed task → blocked.** `dependsOn` evaluation is reactive-only; ignores already-satisfied dependencies at creation time. Fix: create-time dep-evaluation checks each depId against current task-state; if all deps completed, initial status = `pending` not `blocked`.

### Out of scope

- idea-94 cascade audit replay-queue (separate post-review hardening; M-Cascade-Perfection Phase extension)
- CP4 `retry_cascade` (post-architectural-review hardening; gated on deprecation-runway data)
- Mission-cascade drift / mission-numbering deduplication (anti-goal #2 per Phase 4 §6; post-review)
- bug-20 workflow-advancement (superseded by idea-144 Path A; #7 non-winner this phase)

### Engineer authoring handoff

Four task decompositions — one per bug. Engineer scopes individual bug-fix tasks including test cross-links to #1 Workflow Test Harness. Brief references four tasks + their test-harness dependencies; engineer details the implementation.

---

## Success criteria

1. **Four bugs resolved:** bug-22, bug-23, bug-27, bug-28 all flipped `open → resolved` with `fixCommits` list citing commits + `fixRevision: mission-N` (mission-N = this mission's Hub ID after filing).
2. **Cross-test coverage:** each bug-fix has ≥1 test case in #1 Workflow Test Harness covering the specific class.
3. **Telemetry verification:** post-fix 7-day observation window shows zero re-occurrences of each bug's class (cascade retry loop; bilateral-seal race; documentRef drop; DAG dep-eval lag).
4. **Audit completeness:** payload-passthrough audit (for bug-27 scope) produces a matrix of all 8 cascade-action types × payload-field preservation; matrix committed to `docs/audits/` as a closing-audit artifact.
5. **No new bugs from fix:** post-fix integration suite (full `hub/test/e2e/`) stays green.

---

## Dependencies

| Prerequisite | Relationship | Notes |
|---|---|---|
| #1 M-Workflow-Test-Harness | benefits from | Test harness infrastructure verifies bug-fixes; not hard-block — can ship with mission-internal tests if #1 lags |
| task-310 + mission-38 CP2 C2 (ThreadConvergenceGateError) | benefits from (shipped) | Structured error format makes bug-23 bilateral-seal race investigation tractable |

### Enables (downstream)

| Mission | How |
|---|---|
| #7 idea-144 Path A (non-winner this phase) | Cascade correctness is precondition for workflow-advancement cascade reliability |
| CP4 `retry_cascade` (post-review) | Requires resolved bug-14 (already shipped) + this mission's bug-22 retry-count foundation |

---

## Effort class

**M** (engineer-authoritative per Phase 4 §10.1).

Rationale: four bounded bugs, each S-class individually; combined M because of (a) shared cross-cutting audit work (bug-27 passthrough sweep), (b) test-harness integration (depends on #1's shape), (c) 7-day observation verification. Expected 2 engineer-weeks.

---

## Related Concepts / Defects

### Concepts advanced (Phase 3 register §2)

- §2.3 Hub-as-Conductor (primary — this mission IS Hub-as-Conductor hardening)
- §2.1 Uniform Adapter Contract (partial — cascade handlers cross adapter boundary)

### Defects resolved (Phase 3 register §3)

- sym-A-022 bug-22 (Silent Collapse class; cascade retry lacks terminal escalation)
- sym-A-023 bug-23 (Race Condition; bilateral-seal ordering)
- sym-A-027 bug-27 (Doc-Code Drift; silent payload-field drop in cascade)
- sym-A-028 bug-28 (Schedule Drift; DAG dep-eval reactive-only)
- Cascade Bomb (§3.7 Resilience cluster)
- Silent Collapse (§3.7) — partial (this mission addresses the specific cascade-retry case)
- Race Condition (§3.14 bug-class defect)
- Schedule Drift (§3.14)
- Boundary Blocking (§3.6 Collaboration cluster) — partial

---

## Filing metadata

- **Status at file:** `proposed` (Mission FSM default; Director release-gate per Phase 4 §10.6)
- **Document ref:** `docs/reviews/2026-04-phase-4-briefs/m-cascade-correctness-hardening.md`
- **Director activation:** requires explicit Director "ready to release" signal
- **Correlation:** Phase 4 winner #2

---

*End of M-Cascade-Correctness-Hardening architect brief draft. Engineer 4-task decomposition + test cross-links at `agent/greg`. Cross-review on thread-254.*
