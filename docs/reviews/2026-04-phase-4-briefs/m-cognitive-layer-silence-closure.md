# Mission: M-Cognitive-Layer-Silence-Closure

**Status:** DRAFT — Phase 4 mission brief (architect-side fields); engineer scope-decomposition in parallel; unified brief ratifiable post cross-review; files as `proposed` on Director final ratification per Phase 4 §10.6 protocol.
**Phase 4 pick:** #4 of 4 (M-class; CRITICAL severity gate per bug-11).

---

## Name

**M-Cognitive-Layer-Silence-Closure** (resolves bug-11; promotes idea-132 scope)

---

## Tele served

| Tele | Role | Why |
|---|---|---|
| tele-11 Cognitive Minimalism | primary | Completing idea-132's 7-mitigation scope empirically validates tele-11 success criteria |
| tele-7 Resilient Agentic Operations | secondary | Cognitive-layer silence is a resilience defect at the LLM-harness layer |
| tele-6 Frictionless Agentic Collaboration | secondary | Mitigation reduces false-positive escalations that disrupt architect-engineer flow |

**Tele-leverage score: 3.**

---

## Concept-grounding (Phase 3 register)

- **Substrate-First Logic (§2.2)** — primary (the 7 mitigations ARE the operational expression of substrate-first discipline: token-accounting, round-budget awareness, substrate primitives for recurring cognitive patterns)
- **Precision Context Engineering (§2.6)** — secondary (state pre-hydration mitigation directly advances tele-12's Hydration-as-Offload mechanism)

---

## Goal

Structurally close **bug-11** (Architect LLM tool-round exhaustion — cognitive-layer silence class remains live despite mission-38's 5 shipped mitigations). Per idea-132 scope: the full 7-mitigation captures the complete Cognitive Hypervisor abstraction. Mission-38 shipped 5; this mission ships the remaining 2 (tool-error elision v2 per-subtype rules + state pre-hydration).

**Blocker-group rationale:** bug-11 is CRITICAL-severity and RECURRING per Phase 2 scoring (12/25). The symptom class is live despite partial shipment of mitigations. Completing the 7-mitigation set is the empirical gate for tele-11 success-criteria verification.

---

## Scope (in / out)

### In scope (two remaining mitigations of idea-132's 7)

1. **Tool-Error Elision v2 (per-gate-subtype auto-correction).** Mission-38 task-310 shipped v1: `thread_reply_rejected_by_gate` telemetry captures CP2 C2 structured ThreadConvergenceGateError subtypes. v2: per-subtype auto-correction rules in the adapter — when the LLM stages a malformed cascade action, the adapter recognizes the specific subtype + auto-corrects the payload shape + retries silently; LLM never sees its own mistake. Per-subtype table (one mapping per ThreadConvergenceGateError subtype) + fault-injection tests.

2. **State Pre-Hydration.** Adapter preloads authoritative Hub state into prompt preamble before LLM invocation; LLM reads (cheap) rather than derives (expensive). Specific pre-hydration targets: current thread state, participant set, active tool surface, pending-action queue snapshot. Composes with tele-5 Perceptual Parity mandate at the mechanism level.

### In scope — telemetry verification

3. **Bug-11 resolution gate:** telemetry-driven verdict. Extend mission-38's 4 telemetry surfaces (`tool_rounds_exhausted`, `thread_reply_rejected_by_gate`, `thread_reply_chunked`, `llm_output_truncated`) with 2 more (`auto_correction_applied`, `state_pre_hydrated`). Verify over 7-day observation window that cognitive-layer silence incidence trends to zero.

### Out of scope

- **idea-107 M-Cognitive-Hypervisor** broader scope (phases beyond the 7-mitigation set; future post-review roadmap; idea-107 remains open)
- **Architecture-level LLM-harness replacement** (idea-152 Smart NIC Adapter; target-state; anti-goal per Phase 4 §6)
- **Per-user-prompt cognitive-layer routing** (cost-aware tier routing = idea-138; separate concern)
- **idea-116 Precision Context Engineering beyond state pre-hydration** (§2.6 concept broader; only the state pre-hydration mechanism is in this mission's scope)

### Engineer authoring handoff

Engineer scopes the two mission-38-style mitigation tasks + telemetry verification + bug-11 resolution-gate. Brief references 7-mitigation completion; engineer details the specific per-subtype rules + state-pre-hydration scope.

---

## Success criteria

1. **Tool-Error Elision v2 live:** per-subtype auto-correction rules for ThreadConvergenceGateError subtypes implemented + fault-injection tested. Per-subtype table documented in closing audit.
2. **State Pre-Hydration live:** adapter sandwich preloads thread state + participant set + tool surface + pending-action snapshot into prompt preamble.
3. **Telemetry verification:** 7-day observation window shows `tool_rounds_exhausted` + `thread_reply_rejected_by_gate` rates trending to zero (or at least substantially-below mission-38-baseline).
4. **Bug-11 resolved:** flipped `open → resolved` with `fixCommits` citing this mission's commits + `fixRevision: mission-N`.
5. **Architect reply-rate gate:** ≥95% of observed architect reply/review invocations complete within budget (no silent-LLM-death) in the observation window.
6. **Closing audit:** `docs/audits/m-cognitive-layer-silence-closure-closing-report.md` mirroring mission-38 shape; captures the per-subtype rule table + the 7-mitigation completion status + bug-11 verdict.

---

## Dependencies

| Prerequisite | Relationship | Notes |
|---|---|---|
| mission-38 (completed) | builds on | Shipped 5 of 7 idea-132 mitigations; this mission ships remaining 2 |
| task-310 (CP2 C2 ThreadConvergenceGateError structured format) | shipped | Subtype + remediation fields are Tool-Error Elision v2's input |
| #1 M-Workflow-Test-Harness | benefits from | Test infrastructure verifies mitigation effectiveness; not hard-block (mission-internal fault-injection tests suffice for v1) |

### Enables (downstream)

| Post-review work | How |
|---|---|
| idea-107 M-Cognitive-Hypervisor broader phases | This mission completes Phase 1 scope of the Hypervisor; enables post-review roadmap continuation |
| Tele-11 Cognitive Minimalism empirical validation | Success-criteria 5 = constitutional-layer verification |
| idea-155 AuditEntry typed payload (post-review) | Mission's telemetry extensions establish pattern for typed audit payloads |

---

## Effort class

**M** (engineer-authoritative per Phase 4 §10.1).

Rationale: two mitigation implementations + fault-injection test suite + telemetry extension + 7-day observation + closing audit authorship. Expected 1.5-2 engineer-weeks.

---

## Related Concepts / Defects

### Concepts advanced

- §2.2 Substrate-First Logic — primary (operational expression)
- §2.6 Precision Context Engineering — secondary (state pre-hydration mechanism)

### Defects resolved

- sym-A-011 (bug-11 Architect LLM tool-round exhaustion)
- **Cognitive Economy cluster (§3.11)** — primary class; all six defects partially or fully addressed:
  - LLM as Calculator (tool-error elision prevents LLM from re-deriving schema shapes it got wrong)
  - Substrate Leakage (auto-correction in adapter substrate; LLM doesn't learn about its own errors)
  - Token Fragility (state pre-hydration reduces context setup rounds)
  - Context Displacement (state pre-hydration keeps judgment-capacity free)
  - Economic Blindness (telemetry extension makes token-cost observable)
  - Prompt as Configuration (partial — adapter-side config absorbs some prompt-embedded behavior)
- Architect Amnesia (§3.2 Memory Loss cluster) — resolved by state pre-hydration
- Cognitive Friction (§3.5 Perception cluster) — resolved by reducing false-positive escalations
- Prompt Sprawl (§3.12 Precision Context cluster) — partial (pre-hydration is structured state, not prose dump)

---

## Filing metadata

- **Status at file:** `proposed` (Mission FSM default; Director release-gate per Phase 4 §10.6)
- **Document ref:** `docs/reviews/2026-04-phase-4-briefs/m-cognitive-layer-silence-closure.md`
- **Director activation:** requires explicit Director "ready to release" signal
- **Correlation:** Phase 4 winner #4; resolves bug-11; promotes idea-132

---

*End of M-Cognitive-Layer-Silence-Closure architect brief draft. Engineer task-decomposition (tool-error elision v2 per-subtype rules + state pre-hydration scope) at `agent/greg`. Cross-review on thread-254.*
