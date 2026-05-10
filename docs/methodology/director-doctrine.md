# Director Doctrine — substantive leans + pre-emption heuristics

**Status:** v0.1 DRAFT (architect-side; pending Director review). Empirically derived from M-Missioncraft V1 / V2 / V3 Phase 4 audit cycles (threads 510 / 511 / 512; 2026-05-08 → 2026-05-09). Tele-anchored against `tele-glossary.md` v1.0.
**Tier:** 1 (per `mission-lifecycle.md` v1.2 + Design v1.3 §1.2 tier-by-location rule)
**Scope:** the *substantive* layer beneath Director's tactical asks — recurring architectural pulls, unifying meta-doctrine, and architect-side pre-emption heuristics. Companion to `director-engagement-modes.md` (engagement-mode *recognition*; planned follow-on).
**Bound at runtime via:** `CLAUDE.md` §5 Companion policies index + `architect-runtime.md` INDEX entry (planned post-ratification)

---

## Purpose

When Director engages mid-cycle (Phase-3 Survey gate, mid-cycle observation, post-ratify revisitation), the *tactical* surface of the ask (frame-setting, quantitative critique, conceptual challenge, etc.) varies — but the *substantive* leans recur across topics, missions, and design-versions. This doc captures those recurring leans + their tele-anchors + architect-side pre-emption heuristics, so:

1. Architects can apply *pre-draft self-audit* before presenting designs (compresses R1 finding-counts in Phase 4 audit cycles).
2. Architects can recognize *which existing tele primitive(s)* a Director pull composes against — closes "free-floating concern" misclassification.
3. Tele-evolution candidates (gaps where doctrine outruns ratified tele) are surfaced explicitly for Director-direct ratification.

**Not in scope:** tactical engagement-mode recognition (frame-setting, quantitative critique, etc.) — that's `director-engagement-modes.md` (planned). This doc answers *"what is Director pulling toward?"*; that one will answer *"how do I recognize the surface of the ask in real-time?"*.

## Empirical source

| Cycle | Thread | Rounds | Trigger | Findings folded |
|---|---|---|---|---|
| M-Missioncraft V1 | thread-510 | 7 | Phase 3 Survey → Phase 4 Design | n=8 (per calibration #62 thread-510 14-instance audit-rubric trace) |
| M-Missioncraft V2 | thread-511 | 5 | Mid-cycle architectural extension | (per thread-511 audit trace) |
| M-Missioncraft V3 | thread-512 | 7 | **Post-ratify revisitation** of v2.5 RATIFIED via section-by-section walkthrough | 55 across 7 rounds (R1=22 → R7=0) |

V3 is the load-bearing source for this doc: the post-ratify walkthrough exposed the widest range of distinct Director leans in a single cycle, making the recurring leans extractable. V1/V2 confirmed continuity (same leans, different tactical surface).

## The 7 Director-leans

### Lean 1 — Substrate-invisibility

> The engineer does not operate on the substrate; the substrate operates beneath them.

**Diagnostic patterns:** *"Operators will not be using X directly ever"* / *"engineer doesn't think about Y"* / preference for filesystem-only / daemon-handles-it-autonomously.

**Tele anchor:** **tele-6** zero-friction (primary); **tele-11** cognitive-economy + **tele-7** resilient-ops (secondary).

**V3 instances:** DROP `msn git` namespace (engineer-git-less hypervisor framing); DROP `msn status`; DROP cooperative-tick (replaced by filesystem-watch); ADD `msn workspace` (path-only; no semantics-leak).

**Constraint:** substrate-invisibility must NOT trade against tele-7 (no silent failures) — substrate must still surface failures (e.g., RemoteAuthError) even though commit/push are otherwise invisible. Invisibility-of-mechanism, not invisibility-of-consequence.

### Lean 2 — Surface-area minimization (necessity-earned)

> New primitives must justify themselves against existing primitives + flags. Architect's natural mode is additive expansion; Director enforces the reductive counter-pull.

**Diagnostic patterns:** *"thats a lot of X"* / *"I'm concerned we are adding primitives that are not required"* / verb-count critique / SDK-method-count critique.

**Tele anchor:** **tele-3** Law-of-One (primary); **tele-11** right-context-density + **tele-12** attention-ordering (secondary).

**V3 instances:** Verb count 14 → 13; SDK methods 30 → 14 (~53% reduction via Refinement #7 k8s-shape); collapse `msn status` into `msn list` (one-verb-one-purpose).

**Architect-side anti-pattern:** defending additions on grounds of "*it's only one more verb*" / "*completeness*". Each primitive is a tax on the engineer's working memory; defense should be against necessity, not against parsimony.

### Lean 3 — Mission-as-atomic-unit (scope-purity at the boundary)

> A mission is one thing. Partial-completion across scope = scope-confusion = should be different missions.

**Diagnostic patterns:** *"that should be different missions"* / single-`<message>` grammar / atomic-only at v1 / mission-name uniqueness.

**Tele anchor:** **tele-3** Law-of-One (primary); **tele-2** isomorphic-spec + **tele-8** binary-cert (secondary).

**V3 instances:** Atomic-only complete-flow ("v1.x can extend with partial-completion if demand emerges"); single-message positional 2-arg grammar (`msn complete <id> <message>`); per-repo override deferred.

**Why it's tele-8 binary-cert:** partial-completion would violate binary pass/fail certification (mission either completes-as-spec'd or doesn't; "partially completed" creates a third state that breaks the binary).

### Lean 4 — Resource-uniformity via verb-polymorphism (k8s-shape)

> Prefer `verb<Resource>` polymorphism over `verbResource()` typed methods. Idiomatic-with-broader-ecosystem beats locally-clever ergonomics.

**Diagnostic patterns:** k8s-shape framing / kubectl-comparison / "uniform interface across resource-types" / verb-polymorphism critique of typed-method API.

**Tele anchor:** **tele-3** bit-perfect-interfaces (primary); **tele-5** cross-clone-consistency / ecosystem-idiomaticity + **tele-2** isomorphic-spec (secondary).

**V3 instances:** SDK Refinement #7 (`create<T>` / `get<T>` / `list<T>` / `update<T>` / `delete<T>` polymorphism); ResourceMap discriminated-union; type-narrowed `delete<T>` via DeletableResource.

**Tele-5 dimension:** k8s-shape isn't *just* about composition (tele-3) — it's also load-bearing for Director↔agent perceptual symmetry. Both humans and agents recognize k8s-shape verbs without out-of-band knowledge → reduces cross-clone interpretation delta. (Worth flagging: this exposes a tele-glossary refinement — `tele-5 ecosystem-idiomaticity` shorthand candidate; see *Gap B* below.)

### Lean 5 — Explicit attribution (no silent magic)

> Identity, auth, and state-mutation must be attributed visibly to a principal. Substrate does not silently impersonate.

**Diagnostic patterns:** *"will the commits see the engineer's identity?"* / identity-capture-timing questions / multi-org auth handling / attribution-of-state-change.

**Tele anchor:** **tele-1** sovereign-state-transparency (primary); **tele-4** load-bearing-context + **tele-7** no-silent-failures (secondary).

**V3 instances:** Refinement #8 commit+push auth semantics (NEW §2.6.6) — identity-capture-timing at commit-firing-time; AI-agent-provisioning discipline; RemoteAuthError surfaces; multi-org gh-cli auth via `gh auth login --hostname`; failure recovery via idempotent retry. Also: publishMessage immutability (the message is the operator's authored artifact; substrate doesn't fabricate); `--retain` semantics (operator-explicit, not substrate-default-magic).

### Lean 6 — YAGNI / future-deferral

> v1 commits to v1 demand only. Speculative scope is cost, not value.

**Diagnostic patterns:** *"if demand emerges"* / *"v1.x can extend"* / deferral-with-explicit-pointer-to-future-version / refusal to spec edge-cases without concrete-current-demand.

**Tele anchor:** *(no direct tele primitive)*. Composes weakly against **tele-11** cognitive-economy + **tele-2** isomorphic-spec (secondary). **Flagged as tele-evolution candidate; see *Gap A* below.**

**V3 instances:** atomic-only complete (partial deferred); `msn resume` deferred to v3.x; multi-RemoteProvider-per-mission deferred; per-repo complete-message-override deferred.

**Why it's a gap:** YAGNI is load-bearing as a Director discipline — it shapes scope-decisions across most refinements — but isn't directly anchored in the 12 ratified tele primitives. The closest fit (tele-11 cognitive-economy: speculative scope expands cognitive surface) is real but indirect. Worth raising.

### Lean 7 — Architectural target-state pull (not compromise-of-the-moment)

> Ratification is convergent for-now, not terminal for-target. Director may revisit ratified designs when target-state delta accumulates.

**Diagnostic patterns:** post-ratify revisitation / *"yes this is the v3 architectural target"* / preference for harder-but-cleaner framing over ergonomically-easier-but-impure / explicit "*I want to reshape v2.5*" stance.

**Tele anchor:** **tele-10** Autopoietic Evolution (primary); **tele-2** isomorphic-spec + **tele-8** gated-recursive-integrity (secondary).

**V3 instances:** the entire post-ratify walkthrough triggering V3 cycle is the load-bearing instance. v2.5 was substrate-correct but not target-state-pure; the 8 refinements were target-state-pulling moves that v2.5 had compromised on.

**Architect-side implication:** EXPECT post-ratify revisitation when target-state delta accumulates. v3.x ratification is itself convergent-for-now; future post-ratify revisitation is methodology-expected behavior, not anomaly. Don't treat ratify-clean as terminal.

## Unifying meta-doctrine

> **Substrate-as-hypervisor — engineer-amplifying, surface-minimal, atomically-scoped, ecosystem-idiomatic, attribution-explicit, target-state-converging.**

The substrate exists to make the engineer's day-to-day work *higher-leverage* by removing things they have to think about (substrate-invisibility), without expanding the surface they have to learn (minimization), without leaking magic (explicit attribution), and while being *idiomatic with broader practice* (k8s-shape, UNIX tradition) so what an engineer learns transfers.

The architect's natural mode is *additive expansion*. Director's natural mode is *reductive target-state-pulling*. The bilateral cycle is the convergence between them. Pre-emption discipline lets the architect compress the cycle by applying the reductive counter-pull to their own draft *before* presentation.

## Pre-emption heuristics (architect's pre-draft self-audit)

Apply these BEFORE first-drafting, not as Director-ask-counter. Each is tele-derived.

| # | Test | Tele basis | Question to ask of the draft |
|---|---|---|---|
| 1 | **Substrate-invisibility test** | tele-6 zero-friction | *"Does the engineer have to think about this in normal flow?"* If yes, push it down to substrate. |
| 2 | **Necessity-earned test** | tele-3 Law-of-One | *"Can existing primitives + flags cover this? What's the precise demand this earns its place against?"* If marginal, drop. |
| 3 | **Mission-boundary test** | tele-3 + tele-8 | *"Is the partial case actually a different mission?"* If yes, reject the partial-accommodation. |
| 4 | **k8s-shape test** | tele-3 + tele-5 | *"Does this break verb-polymorphism? Could `verb<T>` cover it?"* Default to verb-polymorphism. |
| 5 | **Explicit-attribution test** | tele-1 sovereign-state-transparency | *"Is this attributed visibly to a principal? Or is the substrate silently impersonating?"* Default to explicit attribution. |
| 6 | **YAGNI test** | tele-11 cognitive-economy *(weakly)* | *"Is this v1 demand or speculative?"* If speculative, defer to v1.x with a note. |
| 7 | **Target-state test** | tele-10 autopoietic-evolution | *"Is this the architectural target, or am I taking the easier framing?"* Prefer target-state with explicit cost-acknowledgement. |

**Empirical claim (pending validation):** if the architect runs all 7 tests pre-draft, R1 finding-counts in Phase 4 audit cycles compress materially. V3's R1=22 was disproportionately driven by SDK consolidation NOT propagating across CLI table + state-machine table — a target-state move (test 7) that should have been pre-empted via cross-fold render-gap discipline.

## Tele-evolution gap markers

Two doctrines outrun the existing tele primitives. Both are surfaced explicitly as tele-evolution candidates pending Director-direct ratification (tele creation is Director-RACI per `tele-glossary.md` v1.0 footnote).

### Gap A: YAGNI / future-deferral

**Status:** load-bearing in Director's pulls; not directly tele-anchored.

**Composes weakly against:** tele-11 cognitive-economy (speculative scope = cognitive-load tax); tele-2 isomorphic-spec (speculative scope creates spec-vs-reality drift).

**Resolution candidates:**
- **(a)** Refine tele-11 mandate to explicitly cover *"speculative scope is cognitive-load tax"* — minor refinement, not new tele.
- **(b)** Propose new tele candidate — *"Demand-Earned Surface"* / *"Concrete-Demand Discipline"* — explicit primitive.

**Recommendation:** raise to Director for option-pick. (a) is lower-cost; (b) is more explicit. Lean toward (a) unless Director sees demand-discipline as substrate-load-bearing enough for its own primitive.

### Gap B: Ecosystem-idiomaticity (k8s-shape, UNIX tradition, gh-cli convention)

**Status:** load-bearing in Refinement #4 (gh-cli convention) + Refinement #7 (k8s-shape) + general CLI verb-naming; partly captured by tele-5 cross-clone-consistency but not directly named.

**Composes against:** tele-5 perceptual-parity (cross-clone-consistency dimension).

**Resolution candidate:** methodology-glossary update only — refine `tele-glossary.md` shorthand-decoder to include `tele-5 ecosystem-idiomaticity` alongside `tele-5 cross-clone-consistency`. Not new tele; sub-aspect refinement.

**Recommendation:** PATCH bump on tele-glossary; no new tele needed.

## Cross-references

- **Tier 0:** `CLAUDE.md` §5 Companion policies index (planned cross-link in post-ratification)
- **Tier 1 sister overlays:** `architect-runtime.md` (planned INDEX entry); `director-engagement-modes.md` (planned follow-on companion — engagement-mode *recognition*)
- **Tele source:** `docs/methodology/tele-glossary.md` v1.0 (load-bearing decoder for tele-N references)
- **Empirical source:** docs/designs/m-missioncraft-v1-design.md @ `e581a21` (v3.6 BILATERAL RATIFIED); thread-510 / thread-511 / thread-512 audit traces
- **Calibration tie-in:** calibration #62 (architect-spec-level-recall pattern) — pre-emption heuristics compose against the same architect-runtime evolution surface

## Update protocol

- **Versioning:** MINOR bump for additive Director-lean (new lean extracted from later cycles); MAJOR bump for lean-removal or unifying-doctrine restatement; PATCH bump for diagnostic-pattern refinement / V3-instance updates / tele-anchor cross-map adjustment.
- **Empirical source maintenance:** new Phase 4 cycles that surface novel Director-leans should be appended to *Empirical source* table + leans extracted should be folded into the 7 (or beyond if a new lean emerges).
- **Tele-anchor refresh:** when `tele-glossary.md` updates (new tele ratified / mandate refined), re-validate the tele-anchor cross-map; PATCH bump.
- **Director-review cadence:** this doc is architect-drafted but Director-Accountable for substantive validation. Recommended cadence: Director review at v0.x → v1.0 ratification gate; subsequent reviews at MAJOR bumps.
