---
mission-name: M-Message-Structure-Cleanup
source-idea: idea-253
methodology-source: docs/methodology/idea-survey.md v1.0
director-picks:
  round-1:
    Q1: abcd
    Q1-rationale: comprehensive value-driver intent (all 4 drivers compose; no narrow scope)
    Q2: d
    Q2-rationale: all-equal audience priority (no weighting; operator + agents + LLM-context each equivalent attention)
    Q3: d
    Q3-rationale: phased delivery (split into 2-3 sequential missions; gradient ship)
  round-2:
    Q4: a
    Q4-rationale: §1 SSE peek-line first — fastest operator-visible win + minimal substrate + sets prefix taxonomy that §3 cross-refs build on
    Q5: a
    Q5-rationale: substrate-feature boundary — each phase independently-deployable; clean release boundary
    Q6: b
    Q6-rationale: soft initially → hard if drift recurs (instrument first; promote based on evidence)
mission-class: substrate-cleanup-wave
tele-alignment:
  primary: [tele-2, tele-3]
  secondary: [tele-6, tele-7]
  round-1:
    primary: [tele-2]
    secondary: [tele-3]
  round-2:
    primary: [tele-7]
    secondary: [tele-2]
anti-goals-count: 4
architect-flags-count: 3
skill-meta:
  skill-version: survey-v1.0
  tier-1-status: implemented
  tier-2-status: stubbed
  tier-3-status: stubbed
calibration-data:
  director-time-cost-minutes: 1
  comparison-baseline: idea-228 Survey (mission-69; first-canonical Survey skill execution; ~5 min reference)
  notes: |
    Cleanest possible 3+3 capture — Director picks tight (Q1=a+b+c+d / Q2=d / Q3=d / Q4=a / Q5=a / Q6=b). No
    contradictory multi-picks. Round-1 multi-pick on Q1 surfaced "comprehensive value" intent without ambiguity.
    Round-2 single-picks each refined HOW within Round-1 envelope cleanly. Director time-cost ≪ 5min target —
    likely sub-minute Director engagement. Methodology-evolution candidate: 3+3 may be over-budget for clean
    sub-cycles like this; future-canonical opportunity to test 2+2 truncation when Round-1 picks are
    architecturally-coherent (no ambiguity surface to refine in Round-2). Filed-and-deferred for next strategic
    review.
contradictory-constraints: []
calibration-cross-refs:
  closures-applied: []
  candidates-surfaced:
    - "3+3 over-budget for clean sub-cycles — investigate 2+2 truncation when Round-1 picks coherent"
---

# M-Message-Structure-Cleanup — Phase 3 Survey envelope

**Methodology:** `docs/methodology/idea-survey.md` v1.0 (3+3 Director-intent pick-list)
**Source idea:** idea-253
**Mission-class candidate:** substrate-cleanup-wave (multi-phase substrate cleanup; per `mission-lifecycle.md` §3 taxonomy)
**Branch:** `agent-lily/m-message-structure-cleanup-survey` (push pre-bilateral round-1 audit per calibration #59 closure mechanism (a))

---

## §0 Context

idea-253 emerged 2026-05-06 during the bug-49 → bug-56 cascade closure cycle. Director's framing question on the SSE event-text format ("← proxy: [Hub] Thread \"...\" converged") surfaced the broader observation: operator-facing message structure has accumulated drift across three layers (SSE peek-line, message body conventions, cross-reference syntax). idea-253 originally scoped the SSE peek-line layer (§1); Director directive 2026-05-06 scoped-up to A+C (§1 + §2 message body conventions + §3 cross-reference standardization).

The idea composes-with idea-251 (name-as-identity collapse; just shipped) + idea-252 (API-surface cleanup using name; just shipped) + idea-254 (LLM-facing thread engagement surface; filed; uses §3 cross-ref schema as foundation). idea-253 closes the operator-facing rendering-quality surface as the sister twin of idea-254's LLM-facing context-quality surface.

---

## §1 Round 1 picks

### §1.0 Round-1 questions (as dispatched to Director)

**Q1 — Primary value driver (WHY):** What operational pain is the load-bearing motivation for this cleanup?

- (a) Reduce Director-operator cognitive load
- (b) Improve debug-friendliness (entity-IDs grep-able; cross-refs queryable)
- (c) Enforce methodology discipline (canonical message body shapes)
- (d) Foundation for LLM-context-quality (cross-ref schema + structured bodies feed idea-254)

**Q2 — Audience target (WHO):** Whose experience is the priority surface?

- (a) Director-operator (terminal-visible SSE rendering)
- (b) Architect + engineer agents (message body conventions)
- (c) Future-LLM-context (cross-ref schema + entity-state pull)
- (d) All-equal (each surface gets equivalent attention)

**Q3 — Cadence/scope (HOW big):** How much architectural lift?

- (a) Small — operator-visible only; ~1-2 day mission
- (b) Medium — §1 + §3 with substrate cross-ref schema; ~3-5 day mission
- (c) Large — full §1+§2+§3; ~1 week mission
- (d) Phased — split into 2-3 sequential missions

### §1.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q1 — Primary value driver (WHY) | **abcd** ALL drivers | Comprehensive value capture — every driver matters; no narrow scope |
| Q2 — Audience target (WHO) | **d** All-equal | No priority weighting — operator + agents + future-LLM each equivalent attention |
| Q3 — Cadence/scope (HOW big) | **d** Phased | Split into 2-3 sequential missions; gradient delivery |

### §1.Q1 — Per-question interpretation

Director picked all 4 drivers (a+b+c+d). Per `idea-survey.md` §6 multi-pick discipline, orthogonal answers all picked = each adds a constraint. The intent envelope is **comprehensive cleanup across all motivation axes** — operator cognitive-load reduction (a) + debug-friendliness (b) + methodology-discipline enforcement (c) + LLM-context-foundation (d). No driver-narrowing; the cleanup must serve all four use cases, not optimize for one.

This connects to Original-Idea framing (idea-253 covers all 3 layers per Director scope-up directive) + tele-2 (Frictionless Agentic Collaboration; primary) + tele-3 (Sovereign Composition; canonical-form discipline supports both debug + LLM-foundation) + tele-6 (Deterministic Invincibility; methodology-discipline = canonical-shape). The aggregate-surface signal: Phase 4 Design must NOT carry a single-driver bias (e.g., "this is just operator-UX cleanup"); the substrate work must be valued against all 4 dimensions.

### §1.Q2 — Per-question interpretation

Director picked (d) all-equal. Per `idea-survey.md` §6, (d) is exclusive (all-equal pick excludes priority-weighting picks). The intent envelope is **no audience-priority weighting** — Director-operator + architect/engineer agents + future-LLM-context each receive equivalent attention in design phasing.

This is architecturally significant: it constrains the Phase 4 Design to deliver each of §1+§2+§3 with comparable quality investment, NOT to ship §1 (operator) at high quality and §2 (agents) + §3 (LLM-foundation) as afterthoughts. Tele anchor: tele-2 (operator-friction) + tele-3 (canonical-composition serves all audiences equally) + tele-6 (deterministic structure is audience-agnostic). The aggregate-surface signal: prioritization in scoping must be cadence-driven (Q3=phased) NOT audience-driven.

### §1.Q3 — Per-question interpretation

Director picked (d) phased. Per `idea-survey.md` §6, (d) signals "split into 2-3 sequential missions" — not one-big-mission, not skip-direct. The intent envelope is **gradient delivery via mission sequence**, with each mission shipping a coherent slice rather than the full A+C scope at once.

Critical interaction with Q1+Q2: comprehensive value (Q1) + all-equal audience (Q2) means the phasing CANNOT be "just operator-UX first" or "just LLM-foundation first" — each phase must deliver value across all 4 drivers + all 3 audiences. This pushed phasing toward LAYER-based splitting, refined further in Round-2. Tele anchor: tele-pragmatic (sizing-discipline) + tele-7 (resilient delivery — each phase is independently shippable; failure of phase-N doesn't block N-1). The aggregate-surface signal: Round-2 captures Director's preferred phase-split semantic (which layer first / what counts as a "phase" boundary).

**Round-1 composite read:** Director's picks compose to "comprehensive cleanup across all 3 layers, all-equal audiences, phased delivery in 2-3 sequential missions." The load-bearing constraint is **phasing strategy** (Q3=d) — Round-2 captures which layer ships first + what counts as an inter-mission boundary. No contradictions detected; multi-pick on Q1 + single-pick on Q2 + single-pick on Q3 compose cleanly.

---

## §2 Round 2 picks

### §2.0 Round-2 questions (as dispatched to Director)

**Q4 — Phase-1 layer priority (which ships FIRST):** Round-1 Q3=phased + Q1=all-drivers + Q2=all-audiences. Which layer is the right first slice?

- (a) §1 SSE peek-line first — fastest operator-visible win; minimal substrate; sets prefix taxonomy
- (b) §3 cross-reference schema first — foundation for everything else; enables idea-254 sooner
- (c) §2 body conventions first — methodology discipline lands; canonical templates seed peek-line excerpts
- (d) Hybrid Phase-1 — small slice from each layer shipped together; subsequent phases deepen

**Q5 — Inter-phase boundary semantic:** What counts as a "phase" closing point?

- (a) Substrate-feature boundary (each phase ships independently-deployable feature)
- (b) Audience-coverage boundary (each phase reaches a new audience)
- (c) Defect-class-prevention boundary (each phase closes a calibration/bug class)
- (d) Time-cadence boundary (each phase fits ~1-week scope)

**Q6 — §2 body convention enforcement (how strict):**

- (a) Soft — memory-rule + agent discipline; no Hub validation
- (b) Soft initially → hard if drift recurs (instrument first; promote later)
- (c) Hard — Hub schema validation rejects malformed bodies
- (d) Hybrid — warn-on-write; reject only at convergence-time

### §2.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q4 — Phase-1 layer priority | **a** §1 SSE peek-line first | Fastest operator-visible win + minimal substrate + seeds prefix taxonomy for §3 |
| Q5 — Inter-phase boundary semantic | **a** Substrate-feature boundary | Each phase independently-deployable; clean release boundary |
| Q6 — §2 body convention enforcement | **b** Soft → hard if drift recurs | Instrument first; promote to hard based on evidence |

### §2.Q4 — Per-question interpretation

Director picked (a) §1 SSE peek-line first. Per `idea-survey.md` §6, (a) is single-pick exclusive of (b)/(c)/(d). The intent envelope is **Phase 1 = §1 SSE peek-line standardization** — fastest visible win for operator + minimal substrate change + seeds the prefix taxonomy that §3 cross-refs will build on.

This connects to Round-1 Q1 (comprehensive value; §1 still serves all 4 drivers since prefix taxonomy = debug-friendliness + methodology-discipline + LLM-foundation, not just operator-UX) + Round-1 Q2 (all-equal audience; §1's source-class prefix benefits all audiences equally, just visible-first to operator) + tele-2 (primary; visible operator-friction reduction first). The aggregate-surface signal: Phase 4 Design v0.1 for the FIRST mission concretizes §1 SSE peek-line standardization as substrate scope; subsequent missions concretize §3 then §2 in sequence.

### §2.Q5 — Per-question interpretation

Director picked (a) substrate-feature boundary. Per `idea-survey.md` §6, (a) is single-pick exclusive of (b)/(c)/(d). The intent envelope is **each phase ships an independently-deployable substrate feature with clean release boundary** — not audience-coverage (b) or defect-class-prevention (c) or time-cadence (d) framing.

This is architecturally significant: phase boundaries are determined by substrate-feature coherence, NOT by which audience is reached or which calibration is closed. Phase 1 = §1 SSE peek-line schema + adapter rendering (one shippable feature). Phase 2 = §3 cross-ref schema + auto-extraction + back-pointer (another shippable feature). Phase 3 = §2 body conventions + soft-enforcement (another shippable feature). Each phase reaches a release-able state; subsequent phase doesn't depend on prior-phase being "complete" in any audience-coverage sense. Tele anchor: tele-7 (resilient delivery; each phase independently rollback-able + verifiable). The aggregate-surface signal: mission scoping discipline at Phase 4 Design must produce CLEAN substrate-feature slices — no half-shipped features carrying across mission boundaries.

### §2.Q6 — Per-question interpretation

Director picked (b) soft initially → hard if drift recurs. Per `idea-survey.md` §6, (b) is single-pick (excludes pure-soft (a) / pure-hard (c) / convergence-time-only-hard (d)). The intent envelope is **§2 body conventions ship as memory-rule + architect/engineer discipline (soft) FIRST; promote to Hub-side schema validation (hard) only if drift recurs**.

This signals **measure-then-promote** discipline — instrument the soft-enforcement state; if architect/engineer cleanly maintain conventions without Hub validation, soft is sufficient (no substrate complexity). If drift recurs (multiple instances of malformed bodies surfaced), promote to hard. Composes-with calibration #62 (deferred-runtime-gate-becomes-silent-defect-surface) — soft-first-with-instrumentation is exactly the kind of "promote when evidence warrants" discipline that closes the deferred-runtime-gate class. Tele anchor: tele-7 (resilient — soft is the cheapest mechanism that might suffice; only escalate when justified). The aggregate-surface signal: §2 Phase 3 mission scope is INTENTIONALLY LIGHT (memory-rule + audit-rubric promotion + drift-instrumentation); the heavy substrate-validation work is deferred-and-conditional.

**Round-2 composite read:** Phase 1 = §1 SSE peek-line (substrate-feature-bounded); Phase 2 = §3 cross-ref schema (substrate-feature-bounded); Phase 3 = §2 body conventions soft-enforcement (substrate-feature-bounded; light mission scope; promote-if-drift discipline). Each phase independently shippable. No contradictions detected.

---

## §3 Composite intent envelope

**Mission shape (M-Message-Structure-Cleanup as umbrella → 3 sequential sub-missions):**

| Phase | Mission | Scope | Sizing |
|---|---|---|---|
| **Phase 1** | M-SSE-Peek-Line-Cleanup | §1 SSE notification text structure: source-class prefix taxonomy + entity-ID inclusion + truncation policy + actionability marker; substrate-side schema (Hub adds source-class field; adapter renders) | S/M (~1-3 days) |
| **Phase 2** | M-Cross-Reference-Schema | §3 canonical cross-reference syntax (`[bug-NN]` / `[PR #N]` / `[idea-NN]` / `[calibration #N]` / etc.) + auto-extraction-on-persist + back-pointer maintenance + entity-state inline-pull foundation for idea-254 | M (~3-5 days) |
| **Phase 3** | M-Message-Body-Conventions | §2 message body templates (architect-dispatch / engineer-audit / ratify-merge / etc.); SOFT enforcement initially (memory-rule + audit-rubric); drift-instrumentation; promote to hard if drift recurs | S (~1-2 days) |

**Load-bearing design constraints:**

1. **Comprehensive value across all phases** — each phase must demonstrably serve all 4 Q1 drivers (operator-UX + debug + methodology + LLM-foundation), even if visible to operator first
2. **All-equal audience weighting** — no phase optimizes for one audience at expense of others; quality investment proportional across operator/agents/LLM
3. **Substrate-feature boundary** — each phase ships an independently-deployable + rollback-able + verifiable feature; no half-shipped features cross mission boundaries
4. **Soft-first-discipline for §2** — Phase 3 INTENTIONALLY LIGHT; instrument-then-promote pattern preferred over pre-emptive hard validation
5. **Phase 1 seeds Phase 2 + Phase 3** — §1 SSE peek-line establishes source-class taxonomy + entity-ID format that §3 cross-ref schema standardizes + §2 body conventions reference

**Phase 4 Design v0.1 will concretize Phase 1 first** (M-SSE-Peek-Line-Cleanup); subsequent Designs ship per-phase as Phase 1 closes.

---

## §4 Mission scope summary

| Axis | Bound |
|---|---|
| Mission name | M-Message-Structure-Cleanup (umbrella) |
| Mission class | substrate-cleanup-wave |
| Substrate location | hub/src/policy/notification-helpers.ts + hub-networking.ts (Phase 1); hub/src/entities/* + recipient-resolver.ts pattern (Phase 2); docs/methodology/* + memory-rules (Phase 3) |
| Primary outcome | Operator-facing message structure standardized across SSE peek-line + cross-references + body conventions; no legacy-debt drift across the 3 layers |
| Secondary outcomes | Foundation for idea-254 LLM-context-quality cleanup (Phase 2 cross-ref schema reusable); calibration #62 reinforcement closure path (Phase 3 instrumentation); operator cognitive-load reduction at SSE surface (Phase 1) |
| Tele alignment (primary, whole-mission) | tele-2 (Frictionless Agentic Collaboration), tele-3 (Sovereign Composition) |
| Tele alignment (secondary, whole-mission) | tele-6 (Deterministic Invincibility), tele-7 (Resilient Operations) |
| Tele alignment (Round-1) | primary: tele-2; secondary: tele-3 |
| Tele alignment (Round-2) | primary: tele-7; secondary: tele-2 |

---

## §5 Anti-goals (out-of-scope; deferred)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Don't fold §2 body conventions into Phase 1 — Q4=a pinned §1 first; Q6=b pinned soft-enforcement; bundling Phase 1 + Phase 3 violates substrate-feature-boundary (Q5=a) | Phase 3 follow-on mission |
| AG-2 | Don't pre-emptively ship hard Hub-side body validation in Phase 3 — Q6=b pinned soft-first; promote-on-evidence not promote-pre-emptive | Phase 3 promote-trigger; future-canonical instance when drift recurs |
| AG-3 | Don't subsume idea-254 (LLM-facing thread engagement) into this idea — sister scope; Phase 2 cross-ref schema is FOUNDATION for idea-254 but progressive-disclosure thread surface stays separate Mission | idea-254 (filed; Mission-class; future strategic review) |
| AG-4 | Don't include adapter-side cognitive-pipeline rendering changes — operator-visible rendering only at adapter wire-output; cognitive-pipeline surface stays out of scope for clean substrate-feature boundary | future cognitive-pipeline mission (idea-152 territory) |

---

## §6 Architect-flags / open questions for Phase 4 Design round-1 audit

| # | Flag | Architect-recommendation |
|---|---|---|
| F1 (PROBE) | Phase-1 source-class taxonomy granularity — should `System-Repo-Event` be split (System-PR-Open / System-PR-Merge / System-Push)? Or kept coarse-grained (single `System-PR`)? | Lean coarse-grained per Round-1 simplicity preference; let Phase 4 audit confirm against actual emit-site coverage |
| F2 (PROBE) | Phase-2 cross-ref auto-extraction — regex-on-persist (light) vs full markdown-AST parser (robust)? | Lean regex-on-persist with format-pinning per `feedback_format_regex_over_hardcoded_hash_tests.md` discipline |
| F3 (MINOR) | Phase-3 drift-instrumentation mechanism — log-warning-on-malformed-body? Audit-trail entry? Operator-visible drift-counter? | Lean log-warning-with-counter; review at promote-trigger evaluation |

---

## §7 Sequencing / cross-mission considerations

### §7.1 Branch + PR strategy

**Phase 1** (M-SSE-Peek-Line-Cleanup): branch `agent-greg/m-sse-peek-line-cleanup` off main; single PR scope.

**Phase 2** (M-Cross-Reference-Schema): branch `agent-greg/m-cross-reference-schema` off Phase-1-merged main; single PR scope. Composes-with idea-254 §3 entity-link extraction (idea-254 inherits Phase-2 schema).

**Phase 3** (M-Message-Body-Conventions): branch `agent-greg/m-message-body-conventions` off Phase-2-merged main; smaller PR (memory-rule + audit-rubric + log-warning instrumentation).

### §7.2 Composability with concurrent / pending work

- **idea-254** (LLM-facing thread engagement; filed) — Phase 2 cross-ref schema is foundation; idea-254 Mission consumes Phase 2 schema for §3 entity-link extraction
- **calibration #62** (deferred-runtime-gate-becomes-silent-defect-surface; 8 instances) — Phase 3 drift-instrumentation discipline composes-with §6.4 verification gate promotion
- **`feedback_format_regex_over_hardcoded_hash_tests.md`** — Phase 2 cross-ref auto-extraction tests pin format-regex per discipline
- **idea-251 + idea-252** (just shipped) — Phase 1 prefix taxonomy uses post-idea-252 entity-ID format (agent-XXXXXXXX) per name-as-identity model

### §7.3 Same-day compressed-lifecycle candidate?

NO — Q3=phased pinned multi-mission scope. Each phase warrants its own bilateral cycle (architect dispatch / engineer audit / Design v1.0 / implement / merge / converge). Realistic per-phase: 5/8 round-budget close per established empirical pattern. Total cycle time ~3-5 days per phase × 3 phases = ~2 weeks calendar (if sequential). Phase 1 may compress if §1 scope is tight + audit surfaces no folds.

---

## §calibration — Calibration data point

Per `idea-survey.md` §5 + §15 schema. Captures empirical baseline for methodology-evolution loop per §13 Forward Implications.

- **Director time-cost (minutes):** ~1 (across both Survey rounds; sub-minute Director engagement; tighter than 5-min target)
- **Comparison baseline:** idea-228 Survey (mission-69; first-canonical Survey skill execution; ~5 min reference)
- **Notes:** Cleanest possible 3+3 capture — Director picks tight (Q1=a+b+c+d / Q2=d / Q3=d / Q4=a / Q5=a / Q6=b). No contradictory multi-picks. Round-1 multi-pick on Q1 surfaced "comprehensive value" intent without ambiguity. Round-2 single-picks each refined HOW within Round-1 envelope cleanly. Director time-cost ≪ 5min target — likely sub-minute Director engagement. **Methodology-evolution candidate: 3+3 may be over-budget for clean sub-cycles like this; future-canonical opportunity to test 2+2 truncation when Round-1 picks are architecturally-coherent (no ambiguity surface to refine in Round-2).** Filed-and-deferred for next strategic review.

---

## §contradictory — Contradictory multi-pick carry-forward

(None detected. Round-1 multi-pick on Q1 was orthogonal-additive per §6, not contradictory per §7. Round-1 Q2/Q3 + Round-2 Q4/Q5/Q6 all single-pick. No constraint-envelope to carry forward.)

---

## §8 Cross-references

- **`docs/methodology/idea-survey.md`** v1.0 — canonical Survey methodology
- **`docs/methodology/strategic-review.md`** — Idea Triage Protocol
- **`docs/methodology/mission-lifecycle.md`** §3 — Mission-class taxonomy (substrate-cleanup-wave)
- **`docs/calibrations.yaml`** — calibration ledger (#62 reinforcement composes-with Phase 3)
- **idea-253** — source idea (scope: SSE peek-line + message body conventions + cross-reference standardization)
- **idea-254** — LLM-facing thread engagement surface (sister scope; uses §3 cross-ref schema as foundation)
- **idea-252** — name-based dispatch + retire list_available_peers (just shipped; this idea closes operator-rendering twin)
- **idea-251** — name-as-identity collapse (just shipped; foundation for idea-252 + idea-253)

---

— Architect: lily / 2026-05-06 (Phase 3 Survey envelope; Director-ratified 6 picks across 2 rounds; sub-minute Director time-cost; ~5min architect-side envelope authoring; pending architect branch-push pre-bilateral round-1 audit per calibration #59 closure mechanism (a))
