# Mission: M-Workflow-Test-Harness

**Status:** DRAFT — Phase 4 mission brief (architect-side fields); engineer scope-decomposition in parallel at `agent/greg`; unified brief ratifiable post cross-review; files as `proposed` on Director final ratification per Phase 4 §10.6 protocol.
**Phase 4 pick:** #1 of 4 (L-class; foundational structural). Director-approved 2026-04-22.
**Mission brief shape:** per plan §Phase 4 (Name / Tele / Goal / Scope / Success / Dependencies / Effort / Concepts-Defects).

---

## Name

**M-Workflow-Test-Harness** (formal filing via `create_mission` — correlates to this brief via documentRef).

---

## Tele served

| Tele | Role | Why |
|---|---|---|
| tele-2 Isomorphic Specification | primary | Workflow tests verify spec-to-runtime isomorphism; `workflow-registry` FSMs become enforceable |
| tele-8 Gated Recursive Integrity | primary | Per-layer pass/fail gate becomes a mechanized gate (closes the Phase 1 reverse-gap on tele-8) |
| tele-9 Chaos-Validated Deployment | primary | Chaos paths gain test coverage; merge-gate automation becomes implementable |
| tele-7 Resilient Agentic Operations | secondary | Non-actionable failures become visible via test-output |
| tele-5 Perceptual Parity | secondary | Test outputs = perceivable system state for operator inspection |

**Tele-leverage score (Phase 4 §3.1): 5/5 (highest in pool).**

---

## Concept-grounding (Phase 3 register)

- **Manifest-as-Master (§2.4 of Phase 3 register)** — workflow-registry is the sovereign spec; test harness makes divergence detectable. Primary concept.
- **Layered Certification (§2.7)** — each workflow-FSM layer gains a certification gate. Primary concept.

---

## Goal

Close the workflow-registry §7.2 test-coverage gap. 28 documented invariants currently marked `Tested By: NONE` gain automated E2E coverage. Pool-foundational mission: once shipped, downstream Phase 4 winners (#6 Cascade Correctness, #5 idea-132 Cognitive-layer) use this harness to verify their fixes; post-review missions extend coverage.

**Shipping this mission first multiplies confidence on three downstream Phase 4 winners.** Dependency-root position per Phase 4 §4 graph.

---

## Scope (in / out)

### In scope

- **E2E harness infrastructure** under `hub/test/e2e/workflow-harness/` directory
- **High-value subset coverage** — ≥15 of the 28 `Tested By: NONE` invariants gain E2E test (engineer scope-decomposition picks the subset by impact × implementation cost; see engineer-authored task list)
- **PolicyLoopbackHub integration** — loopback helper parity audit; bug-12 (threads-2-smoke drift) resolution co-dependent
- **Chaos-path coverage** for at least WF-001 (Task Happy Path) + WF-005 (Thread Convergence) multi-actor workflows
- **CI gate** — merge blocked on workflow-test-harness failure
- **Telemetry hook** — test-pass/fail counts feed observability surface

### Out of scope

- Full 28-invariant coverage in v1 (that's XL effort; v1 targets ≥15 high-value subset per engineer-scope-decomposition)
- Per-entity FSM unit tests beyond what already exists in entity-policy test suites
- idea-104 Mock Harness scope (separate adapter-integration testing; concern-orthogonal)
- Production chaos-validation (this is test-harness construction; chaos-production is a tele-9 mission of its own)

### Engineer authoring handoff

Engineer scope-decomposition produces the task-list under this section. Architect fields (Goal, Scope-boundary, Success criteria, Dependencies) frame; engineer fills the task-level detail.

---

## Success criteria

1. **Coverage:** ≥15 of the 28 `Tested By: NONE` invariants in workflow-registry §7.2 gain E2E test cases in `hub/test/e2e/workflow-harness/`.
2. **Parity:** PolicyLoopbackHub parity audit complete — loopback semantics match real Hub on all workflow-harness test cases. bug-12 closure in fixCommits list.
3. **CI gate:** Merge-to-main gated on workflow-test-harness pass; documented in CI config + visible in PR checks.
4. **Chaos paths:** WF-001 + WF-005 chaos-path (entropy injection, delivery loss, stall scenarios) covered with ≥1 test case each.
5. **Suite health:** Workflow-test-harness runs at ≥90% pass rate on `main` over 7-day observation window.
6. **Spec alignment:** workflow-registry §7.2 updated to reflect new test-coverage annotations (specific `Tested By` references replace `NONE`).

---

## Dependencies

| Prerequisite | Status | Notes |
|---|---|---|
| none (pool root) | — | Foundational mission; no upstream Phase 4 dependency |

### Enables (downstream)

| Mission | How |
|---|---|
| #6 M-Cascade-Correctness-Hardening | Test harness verifies cascade-bug fixes (bug-22/23/27/28) |
| #5 M-Cognitive-Layer-Silence-Closure | Test harness verifies idea-132 mitigation effectiveness |
| #3 M-Tele-Retirement-Primitive | Test harness verifies retirement-semantics correctness (minor dependency; bug-24 can ship standalone) |

### Co-dependent

- **bug-12** (threads-2-smoke loopback helper drift) — resolution co-lands as part of PolicyLoopbackHub parity audit. Not a separate mission; absorbed as task.

---

## Effort class

**L** (per engineer Phase 4 parallel-pass; architect confirmed).

Breakdown contributing to L:
- 28 invariants × E2E coverage design + per-invariant test case = ~15 test cases in v1
- Chaos-path entropy-injection scaffolding
- PolicyLoopbackHub parity audit (cross-cutting)
- CI wiring
- Expected 3-4 engineer-weeks

---

## Related Concepts / Defects

### Concepts advanced (Phase 3 register §2)

- §2.4 Manifest-as-Master
- §2.7 Layered Certification

### Defects resolved (Phase 3 register §3 meta-clusters)

- sym-B-004 workflow-testing gap (Phase 2 top-scored symptom, observability cluster)
- 28 `Tested By: NONE` invariants from workflow-registry §7.2
- Foundation-of-Sand (§3.8 Integrity cluster) — high abstractions built on unverified substrate
- Debugging Quicksand (§3.8) — app-layer errors take weeks because kernel bug was never found
- Happy-Path Brittleness (§3.9 Chaos cluster) — system works in tests, collapses under real-world entropy
- Regression Leakage (§3.9) — race condition surfaces in prod that tests didn't explore
- Hope-Based Engineering (§3.9) — decisions on hunches instead of cycle-accurate data
- Non-Actionable Failure (§3.7 Resilience) — error surfaces but lacks info to fix or retry (partial)

**Concept × Defect matrix (Phase 3 §4):** this mission's scope-coverage on the integrity + chaos + resilience clusters is the structural reason it scored 5/5 Tele-leverage and 3/3 unblocking-power in Phase 4 §3.1.

---

## Filing metadata

- **Status at file:** `proposed` (Mission FSM default; Director release-gate per Phase 4 §10.6)
- **Document ref:** `docs/reviews/2026-04-phase-4-briefs/m-workflow-test-harness.md` (this file)
- **Director activation:** requires explicit Director "ready to release" signal per-mission; no architect auto-flip to `active`
- **Correlation:** Phase 4 winner #1; bundled with 3 sibling missions for Director final ratification

---

*End of M-Workflow-Test-Harness architect brief draft. Engineer scope-decomposition + task-list authoring at `agent/greg`. Cross-review on thread-254 before unified brief-set commits.*
