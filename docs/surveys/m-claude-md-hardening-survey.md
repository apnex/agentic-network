# M-CLAUDE-MD-Hardening — Director-intent Survey (pre-Design input)

**Status:** Ratified 2026-04-30
**Methodology:** `idea-survey.md` v1.0 — first-class binding Idea→Design triage methodology
**Source idea:** idea-226 M-CLAUDE-MD-Hardening (Hub-stored; Director-originated 2026-04-30)
**Triage route:** (a) skip-direct-to-Survey per `strategic-review.md` §Idea Triage Protocol — all 5 skip-criteria satisfied; first canonical execution of the just-codified protocol on a Director-originated well-scoped idea.

---

## Survey methodology recap

Per `idea-survey.md` v1.0 §3-§4: 3+3 Director-pick session across two rounds; architect interprets per multi-dim context (original idea + tele mapping + aggregate Director response surface); composite intent envelope bounds Phase 4 Design scope.

Director time-cost: ~5 minutes across 2 picking rounds. Architect-interpretation discipline forced enumeration of 6 picks across 18 distinct option-points.

---

## Round 1 — Guide intent space

### Q1 — Primary outcome priority for the hardening initiative (WHY axis)

**Director pick: c (primary) + b + a (multi-pick; priority-ordered)**

- ✅ **(c) Runtime-binding strength** — directives ARE actually binding at runtime (not just documented); CLAUDE.md becomes load-bearing, not reference-only
- ✅ **(b) Discoverability hierarchy** — agent loading CLAUDE.md at session-start navigates to the right depth-of-context efficiently (Tier 0 → 1 → 2 progressive disclosure)
- ✅ **(a) Cross-clone consistency invariant** — both agents (+ Director-session) see identical CLAUDE.md at runtime; structural closure of the divergence class observed 2026-04-30
- ❌ (d) Tele alignment audit-trail — single-axis; not picked

### Q2 — Content shape across role-context (WHO axis)

**Director pick: a + c + d (multi-pick; layered composition)**

- ✅ **(a) Identical content; role-agnostic** — single canonical text; agents read whichever sections apply per their role + current task
- ❌ (b) Identical text; role-tagged sections — not picked
- ✅ **(c) Role-aware progressive disclosure** — Tier 0 universal; Tier 1+ has role-specific sub-pointers (architect → mission-lifecycle.md §5; engineer → §7)
- ✅ **(d) Single canonical CLAUDE.md + per-role companion overlays** — primary doc + small role-specific overlays at known paths (e.g., `docs/methodology/<role>-runtime.md`)

### Q3 — Evolution + ratification protocol (HOW-cadence axis)

**Director pick: a + d (multi-pick; dual-gated ratification)**

- ✅ **(a) Versioned + retrospective-folded** — same discipline as `mission-lifecycle.md` v1.x: explicit version number, changelog table, deltas folded at retrospective gates
- ❌ (b) Per-PR organic evolution — not picked
- ❌ (c) Hybrid — minor changes ad-hoc; major changes versioned — not picked
- ✅ **(d) Calibration-ledger-driven** — every change traceable to a calibration ID; ledger entry mandatory for any directive-level change

---

## Round 1 — Architect interpretation (per-question multi-dim context)

### Q1 (WHY axis) — c primary + b + a

**Original Idea grounding:** idea-226 explicitly calls CLAUDE.md "a precision persistent engineered artifact that strongly aligns to our overall lifecycle and tele". Director's word-choice (precision + engineered + persistent + aligns-to-tele) anchors the seed concept.

**Tele mapping for Q1:**
- (c) Runtime-binding strength → tele-4 Zero-Loss Knowledge + tele-12 Precision Context Engineering
- (b) Discoverability hierarchy → tele-11 Cognitive Minimalism (intensive margin: don't load Tier 1+ when Tier 0 suffices) + tele-6 Frictionless Agentic Collaboration
- (a) Cross-clone consistency → tele-5 Perceptual Parity

**Aggregate-context interpretation:** Director's pick-order (c > b > a) signals build-for-runtime-binding-first; discoverability + cross-clone consistency follow as second-order effects of doing runtime-binding correctly. Q1c is the load-bearing axis. CLAUDE.md transitions from "documentation of policy" → "load-bearing runtime substrate that enforces policy via structural means". Reinforced by Q3d (calibration-ledger-driven): runtime-binding directives MUST trace to a calibration data-point — that's structural binding, not policy hand-wave.

### Q2 (WHO axis) — a + c + d (composite layered)

**Original Idea grounding:** Director said "Identical content - agnostic of actual agent role" AND "companion deep dives... are linked from there, and are role specific" AND "A hierarchy of context should be designed for efficient and effective progressive disclosure". The three picks compose into a coherent layered model, NOT contradictory.

**Tele mapping for Q2:**
- (a) Identical content → tele-5 Perceptual Parity (cross-clone perceptual symmetry); tele-2 Isomorphic Specification (single source of truth)
- (c) Role-aware progressive disclosure → tele-11 Cognitive Minimalism (extensive margin: only load context warranted); tele-6 Frictionless Agentic Collaboration
- (d) Per-role companion overlays → tele-3 Sovereign Composition (one concern per module; role-overlay docs are sovereign role-specific surfaces composing under CLAUDE.md primary)

**Aggregate-context interpretation:** Q1c (runtime-binding) reinforces: the CLAUDE.md text MUST be identical because runtime-binding requires it; otherwise different agents bind to different rules = behavioral divergence class. Q2c progressive-disclosure resolves the apparent tension between "identical content" and "role-specific deep-dives" — the identical CLAUDE.md text contains role-agnostic universal directives + cross-links into role-aware Tier 1+ companions. Q2d per-role overlays codify role-specific deep-dives that cross-link FROM CLAUDE.md but live as separate sovereign docs (one concern per doc). **Composite: ONE CLAUDE.md, MANY targets, ROLE-AWARE navigation, NO content forks.**

### Q3 (HOW-cadence axis) — a + d (composite dual-gated ratification)

**Original Idea grounding:** idea-226 said "Engineering quality — versioned (v1.0+), changelog-tracked, retrospective-folded. Same discipline as `mission-lifecycle.md` v1.2 today."

**Tele mapping for Q3:**
- (a) Versioned + retrospective-folded → tele-2 Isomorphic Specification (spec IS system; spec evolves through formal refactor); tele-4 Zero-Loss Knowledge (changelog preserves rationale across versions); tele-8 Gated Recursive Integrity (binary pass/fail per version)
- (d) Calibration-ledger-driven → tele-2 (declared intent auto-reconciles); tele-10 Autopoietic Evolution (every change traceable to a friction surfacing → calibration data-point → directive change); tele-1 Sovereign State Transparency (every directive traces to a sovereign ledger entry)

**Aggregate-context interpretation:** Q1c (runtime-binding) + Q3a + Q3d compose into a triply-strong ratification protocol — runtime-binding directives MUST come from formal version + MUST trace to provenance anchor. (Q3a) Every CLAUDE.md change goes through formal versioning per the v1.x discipline already shipped in `mission-lifecycle.md` v1.2. (Q3d) Every directive-level change ALSO traces to a calibration-ledger entry (or equivalent provenance anchor — see Round 2 C3 fold) — the ledger is the systemic memory of WHY this directive exists; an orphan-directive (no provenance anchor) is a Fault. **Together: changes are version-locked AND provenance-traced.**

**Cross-question coherence check:** ✓ All 3 Round 1 dimensions cleanly confirmed; no contradictions; picks compose into a substrate-grade artifact-spec aligned to tele-2 + tele-4 + tele-5 + tele-12 primarily.

---

## Round 2 — Refine architect interpretation (drill into HOW)

Round 1 cleanly confirmed all 3 dimensions → per `idea-survey.md` §4 strategy table, Round 2 drills deeper into HOW. Three orthogonal HOW-axes.

### Q4 — Runtime-binding mechanism (HOW Q1c lands)

**Director pick: b "for now" (single)**

- ❌ (a) Structural directive enforcement at session-start
- ✅ **(b) Soft binding via prompt structure** — CLAUDE.md text positioned at attention-strong context positions per tele-12; binding strength comes from text-shape, not enforcement
- ❌ (c) Tooling-level binding
- ❌ (d) Hybrid — soft binding default + enforcement for critical directives

**"For now" qualifier signals Phase-1 scope decision, not forever-decision** — Phase N may revisit enforcement (Q4a/c/d) when idea-227 ratifies.

### Q5 — Tier 0 content shape (HOW Q2a lands)

**Director pick: b + d (multi-pick; target-with-flex)**

- ❌ (a) Maximally minimal pointer doc (~30 lines)
- ✅ **(b) Curated essential** — 50-80 lines: top-level directives + condensed RACI matrix + cross-links; deep-dive mechanics in companions
- ❌ (c) Comprehensive pointer-with-payload (~100-150 lines)
- ✅ **(d) No size cap; let engineering quality determine size** — size is emergent from tele-alignment + directive-density; not pre-budgeted

**Director's bracketed direction: "if there are structural improvements available to our protocols/methodologies - can explore"** — explicit Phase-4-Design license to propose structural protocol/methodology refinements that compose with CLAUDE.md hardening (not just doc-text edits).

### Q6 — Mechanise-vs-document boundary (HOW Q1c + Q3d compose)

**Director pick: d (single)**

- ❌ (a) Mechanise everything binding-critical
- ❌ (b) Mechanise the high-leakage directives
- ❌ (c) Mechanise engineer-routing only
- ✅ **(d) Defer mechanisation to follow-on** — this mission is doc-hardening only; runtime mechanism work composes via parked **idea-227 (M-Hook-Design-End-to-End)** in a separate future mission

---

## Round 2 — Architect interpretation (per-question multi-dim context)

### Q4 (Runtime-binding mechanism) — b "for now"

**Tele mapping:** Q4b → tele-12 Precision Context Engineering (attention-ordering as binding mechanism); tele-4 Zero-Loss Knowledge (load-bearing context).

**Aggregate-context interpretation:** Q4b composes with Q1c (runtime-binding strength as primary outcome): runtime-binding ≠ runtime-enforcement; the binding mechanism for Phase 1 is precision-engineered context that exploits tele-12 attention-strength patterns. Director's "for now" preserves Phase-N revisit-axis (Q4a/c/d) when idea-227 hooks ratify. Implication for Phase 4 Design: directive ordering + structural shape (lists / tables / inline-citations) carry the binding load; companion-doc cross-links protect against context-budget bloat.

### Q5 (Tier 0 content shape) — b + d composite

**Tele mapping:** Q5b → tele-11 Cognitive Minimalism (curated essential = right-context-density at session-start) + tele-12 Precision Context Engineering (precision-engineered size). Q5d (engineering-quality flex) → tele-4 Zero-Loss Knowledge (volume exceeds raw intent; expansionist bias when warranted) + tele-2 Isomorphic Specification (specification-fitness over arbitrary size cap).

**Aggregate-context interpretation:** Director combination signals: target curated essential 50-80 lines AS DEFAULT, but if Design-phase work surfaces structural protocol/methodology improvements that warrant deeper content, size flexes. Director's bracket gives Phase 4 Design **explicit license to propose structural protocol/methodology refinements** composing with CLAUDE.md hardening. Phase 4 candidates may surface new methodology folds, new RACI codifications, new tier-structure proposals; size budget is emergent from those decisions, not pre-locked. **First-canonical-example of Q5d license usage:** docs/surveys vs docs/designs methodology-doc-internal-contradiction surfaced 2026-04-30 by Director — folds into Phase 4 scope as structural improvement (PR 2 housekeeping).

### Q6 (Mechanise-vs-document boundary) — d

**Tele mapping:** Q6d → tele-3 Sovereign Composition (one concern per module — doc-hardening + runtime-mechanism are separate concerns; ship separately) + tele-8 Gated Recursive Integrity (Phase 1 = doc layer; Phase N = mechanism layer; layered ratification).

**Aggregate-context interpretation:** Q6d composes with Q4b: Phase-1 binding mechanism is text-shape only; mechanism enforcement composes via idea-227 (hook design) in a separate future mission. The architectural cleanness here matters: this mission ships an atomic doc-hardening; idea-227 ships an atomic mechanism layer; neither cross-couples. **Idea-226 mission-class candidate: substrate-introduction** (ships new doc-substrate; foundational for downstream missions; idea-227 + future agent runtime work consume).

**Cross-question coherence check (Round 1 + Round 2):** ✓ All 6 picks compose coherently. Q1c (runtime-binding) + Q4b (text-shape) = binding via tele-12 attention-economy. Q2acd (single canonical + role-aware + per-role overlays) + Q5bd (curated essential + structural-flex) = canonical text bounded by curated-essential discipline; companions absorb depth. Q3ad (versioned + ledger-traced) + Q6d (defer mechanisation) = ratification protocol applies at doc layer; mechanism layer waits.

---

## Composite intent envelope (the "solved matrix")

Bounds Phase 4 Design scope:

| Axis | Director-ratified bound |
|---|---|
| **Mission scope** | Doc-hardening only (Q6d); substrate-introduction class candidate; runtime-mechanism work composes via parked **idea-227** (hook design) in separate future mission |
| **Primary outcome** | Runtime-binding strength via text-shape (Q1c primary + Q4b "for now"); cross-clone consistency + discoverability hierarchy as second-order outcomes (Q1a+b) |
| **Content principle** | Single canonical role-agnostic text (Q2a) + role-aware progressive-disclosure cross-links (Q2c) + per-role companion overlays (Q2d) — INDEX-overlay-not-content-fork shape per engineer round-1 input; ONE doc, MANY targets, NO content forks |
| **Size target** | Curated essential 50-80 lines DEFAULT (Q5b); flex permitted if Design surfaces structural protocol/methodology improvements (Q5d Director-license) |
| **Binding mechanism** | Soft binding via tele-12 attention-ordering + tele-4 load-bearing-context shape (Q4b "for now"); enforcement deferred to idea-227 |
| **Ratification protocol** | Versioned + retrospective-folded (Q3a, same discipline as `mission-lifecycle.md` v1.2) + 3-anchor-class provenance taxonomy (Q3d operationalized; see Round-1 fold) — calibration-ID OR ADR-ID OR Director-direct-anchor |
| **Tele alignment (primary)** | tele-2 Isomorphic Specification + tele-4 Zero-Loss Knowledge + tele-5 Perceptual Parity + tele-12 Precision Context Engineering |
| **Tele alignment (secondary)** | tele-3 Sovereign Composition + tele-6 Frictionless Agentic Collaboration + tele-11 Cognitive Minimalism + tele-8 Gated Recursive Integrity |

---

## Anti-goals (explicit out-of-scope)

1. **NOT runtime-enforcement** — Q4b "for now"; structural directive enforcement deferred to idea-227
2. **NOT fetch-cadence + stale-clone-detection** — composes via idea-227; idea-226 scope = fetched-content runtime-binding only (per engineer C4 round-1 audit fold)
3. **NOT per-role memory-system overhaul** — `~/.claude/projects/.../memory/` is per-agent-clone today; cross-clone-consistency mechanism is separate concern; can compose later
4. **NOT tool-surface scope** — defer to idea-121 per memory `feedback_defer_tool_surface_to_idea_121.md`
5. **NOT CODEOWNERS / GitHub-side enforcement** — mention but don't redesign; stays as-is
6. **NOT ledger entry backfill for existing directives** — 3-anchor-class provenance taxonomy permits Director-direct-anchor as valid traceability source for pre-existing Director-direct-ratified directives (per engineer C3 round-1 audit fold)

## Phase-N revisit-axes (preserved for forward composition)

1. **Runtime enforcement** (Q4a/c/d) → composes idea-227 (hook design) future mission
2. **Engineering quality content size** → composes structural-improvement candidates surfaced during this mission's Design phase OR follow-on (Q5d license)
3. **Cross-clone state-fidelity layer** (fetch-cadence; stale-detection; pre-session validation) → composes idea-227
4. **Per-role memory-system cross-clone consistency** → separate forward concern

---

## Structural-improvement folds (Q5d Director-license at use)

Surfaced during Phase 4 Design scoping; absorbed under Q5d Director-license:

### Fold 1: Surveys-folder discipline (Director-flagged 2026-04-30)

**Gap:** `idea-survey.md` v1.0 §5 specifies `docs/surveys/<mission>-survey.md`; `mission-lifecycle.md` Phase artifact table row 3 specifies `docs/designs/<mission>-survey.md`. Practice split: 6 surveys exist; 3 at correct `docs/surveys/`, 3 misplaced at `docs/designs/`.

**Resolution (PR 2 housekeeping; lands FIRST):**
- Fix `mission-lifecycle.md` Phase artifact table row 3 (`docs/designs/` → `docs/surveys/`)
- Migrate 3 misplaced surveys via `git mv` (preserves history): `m-mission-pulse-primitive-survey.md` + `m-wire-entity-convergence-survey.md` + `m-agent-entity-revisit-survey.md` → `docs/surveys/`
- Cross-reference audit + repair (any docs linking to old paths)
- This Survey artifact lands at correct `docs/surveys/m-claude-md-hardening-survey.md` from-start (sets the precedent post-PR-2)

### Fold 2: Tele-glossary surfacing (engineer round-1 input)

**Gap:** Tele numbers (tele-12 / tele-4 / etc.) referenced across methodology docs without an in-repo index. Engineer cold-start can't decode `tele-12 attention-ordering` without out-of-band knowledge.

**Resolution candidate (in-scope pending Director Phase-4-close confirm):**
- Light tele-glossary doc (e.g., `docs/methodology/tele-glossary.md`) — cross-link from CLAUDE.md companion-policies index
- Inline-expansion convention in CLAUDE.md (tele-N → "tele-N (short-name)" first-use)
- Architect-judgment: tentative IN-SCOPE; low-effort doc-substrate aligns with hardening goal

---

## Calibration-candidate flag (architect-flag for Director ratification at Phase 4 close)

**Pattern: `normative-doc-divergence`** (engineer-reframed class-level naming; supersedes architect's surface-instance naming "methodology-doc-internal-contradiction")

**Definition:** Two normative docs canonicalize different paths/values for the same artifact/concept; both claim canonicality; neither knows about the other; practice splits per-implementer reading.

**Composition:** with calibration #42 (LLM-state-fidelity drift) frame — both calibrations describe state-fidelity divergence classes at different surfaces (LLM-narrative-recall vs methodology-doc cross-reference).

**First-canonical example:** docs/surveys vs docs/designs Survey-artifact path discrepancy (this mission's Phase 4 Design fold).

**Closure mechanism (forward):** systematic cross-reference audit across methodology-doc family at retrospective gates; possibly mechanise via doc-graph linting in idea-227 hook scope.

---

## Provenance

- **Director ratification:** Survey envelope at idea-226 (6 picks; 2026-04-30 ~12:00Z UTC; both rounds same-session)
- **Triage route:** (a) skip-direct via just-codified `strategic-review.md` §Idea Triage Protocol (commit `a57b2ca`)
- **Phase 4 Design opening:** thread-438 architect↔engineer bilateral (greg round-1 input absorbed in Round-1 + Round-2 architect-interpretation folds + structural-improvement fold list)
- **Composes with:** idea-227 (parked; runtime-mechanism follow-on); calibration #57 (engineer-routing closure mechanism); calibration #42 (LLM-state-fidelity drift composition)

---

## Cross-references

- **`docs/methodology/idea-survey.md`** v1.0 — methodology canonical reference for Survey methodology
- **`docs/methodology/mission-lifecycle.md`** v1.2 — formal lifecycle phases + RACI matrix + companion target for hardened-CLAUDE.md cross-link
- **`docs/methodology/strategic-review.md`** §Idea Triage Protocol — triage skip-direct route used to enter Phase 3 Survey
- **`docs/calibrations.yaml`** — calibration ledger (target for `normative-doc-divergence` ratification at Phase 4 close)
- **idea-226** Hub Idea entity — concept-level scope this Survey anchors
- **idea-227** M-Hook-Design-End-to-End (parked) — runtime-mechanism follow-on; composes Phase-N revisit-axes
- **idea-224** M-Pulse-Mechanism-Phase-2 (PAUSED) — separate Director-paused mission; resumes when Director directs

— Architect: lily / 2026-04-30
