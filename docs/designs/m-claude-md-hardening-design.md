# M-CLAUDE-MD-Hardening — Design v1.3

**Status:** v1.3 (architect-authored 2026-04-30; engineer round-1 + content-level round-1 + round-2 + Director Phase-4-close tier-restructure ratification folded; ratified pre-Phase-5)
**Methodology:** Phase 4 Design per `mission-lifecycle.md` v1.2 §1 (RACI: C=Director / R=Architect+Engineer)
**Survey envelope:** `docs/surveys/m-claude-md-hardening-survey.md` (Director-ratified 6 picks; composite intent envelope)
**Source idea:** idea-226 M-CLAUDE-MD-Hardening (status=triaged via route-(a) skip-direct)
**Bilateral threads:** thread-438 (Phase 4 Design shape-level audit; sealed) → thread-439 (Phase 4 Design content-level audit + bilateral converge)

---

## §0 Document orientation

This Design concretizes the Survey envelope (6 Director picks) into operational decisions; current version v1.2 reflects bilateral architect-engineer converge through threads 438 + 439. Reading order:
- §1 Tier definitions — establishes the tier-frame Round-1 audit assesses against (per engineer C2)
- §2 Directive enumeration — what goes in CLAUDE.md after hardening, with tier-assignment + provenance-anchor
- §3 Cross-link discipline — bidirectional cross-link rules + companion-policies index shape
- §4 Role-overlay companion-doc shape — `engineer-runtime.md` + `architect-runtime.md` INDEX-pattern (D4 row template)
- §5 Ratification protocol — versioning + provenance-anchor 3-class taxonomy + sub-line placement (D3)
- §6 Structural-improvement folds — surfaced under Q5d Director-license; size-budget tracking (D2)
- §7 Anti-goals + Phase-N revisit-axes — explicit out-of-scope + forward composition pointers

---

## §1 Tier definitions

The hardened-CLAUDE.md surface composes a 3-tier progressive-disclosure hierarchy. Each tier has explicit role + binding-strength + content-shape + tier-membership criteria so directive-assignment is unambiguous (audit-rubric §1 probe per engineer C2).

### §1.1 Tier 0 — Universal runtime-binding directives

**Role:** load-on-session-start; non-negotiable directives; the artifact every Claude Code session in this repo loads first.

**Binding strength:** maximum. Text-shape positioned at attention-strong context positions per tele-12 attention-ordering discipline (per Q4b "for now"). Binding via context-precision, not enforcement (Q6d defers enforcement to idea-227).

**Content-shape:** ≤80 lines (Q5b default; Q5d flex permitted for Director-license-eligible structural improvements). Each directive carries provenance-anchor sub-line (per §5; D3 sub-line placement). Inline rationale-summary mirrors Mission RACI shape (per engineer P1.3 fold).

**Tier-membership criteria** (ALL 3 must hold):
1. **Universal applicability** — directive applies to ALL roles (architect + engineer + Director-session); not role-specific
2. **Cross-mission impact on failure-to-bind** — failure to apply this directive has consequences spanning multiple missions OR breaks one of the named structural-invariant classes: (i) external-state irreversibility (e.g., commit-policy violation pollutes Contributors graph permanently), (ii) calibration-class incidents (e.g., routing-rule violation triggers #57-class engineer-routing failures), (iii) cross-mission-coordination breakdowns (e.g., bilateral-seal discipline absent → mission-lifecycle gates degrade), (iv) tele-alignment drift detectable at retrospective gates (e.g., directives that contradict ratified Tele set)
3. **Inlinable** — directive + provenance-anchor + 1-2 line rationale fits in ~5-15 lines without losing semantic completeness; deep-dive offloaded to Tier 1 cross-link

**Examples (full Tier-0 enumeration; see §2.1 directive table for canonical list):** `## Commit message policy` · `## Calibration ledger discipline` · `## Mission RACI` · `## Cold-pickup primary surfaces` (NEW per §2 fold) · `## Companion policies` (index-section; framing/index carve-out per §5.3)

**Counter-example (NOT Tier 0):** Pass 10 rebuild discipline — engineer-specific (fails criterion 1); belongs in `engineer-runtime.md` Tier 2 INDEX-overlay.

### §1.2 Tier 1 — Canonical methodology + lifecycle docs

**Role:** loaded when agent engages mission-lifecycle work OR specific phase mechanics; not session-start universal.

**Binding strength:** high. Consulted when phase-engaged; reference-canonical for the methodology-domain it covers. Cross-linked from Tier 0 + cross-linked into Tier 2.

**Content-shape:** emergent; versioned per the v1.x discipline already established in `mission-lifecycle.md` v1.2.

**Tier-membership criteria:**
1. **Methodology-domain ownership** — doc owns one methodology domain (lifecycle phases / Survey methodology / multi-agent PR workflow / preflight / strategic review / entity mechanics)
2. **Phase-engaged binding** — binding when agent enters the phase/mechanism the doc covers
3. **Cross-references compose into Tier 2 detail** — Tier 1 doc surfaces cross-links into Tier 2 deep-dives (ADRs, specs, glossaries) rather than carrying full depth inline

**Examples (full Tier 1 enumeration; canonical methodology + role-runtime navigation surfaces + methodology-vocabulary decoders):** `mission-lifecycle.md` · `idea-survey.md` · `multi-agent-pr-workflow.md` · `mission-preflight.md` · `strategic-review.md` · `entity-mechanics.md` · `engineer-runtime.md` (NEW; engineer INDEX-overlay) · `architect-runtime.md` (NEW; architect INDEX-overlay) · `tele-glossary.md` (NEW; tele lookup table)

**Director-ratified Phase-4-close tier-rule (v1.3 restructure):** all `docs/methodology/<doc>.md` files = Tier 1. Single rule; operationally testable; non-author reviewer can assign tier from path alone. Role-runtime overlays + tele-glossary are Tier 1 (not Tier 2 as v1.2 specified) because: (i) role-overlay is the role-specific entry-vector to canonical methodology — load-bearing at engineer/architect cold-start; (ii) tele-glossary is load-bearing decoder for inline tele-N references at Tier 0; (iii) physical structure mirrors load semantics (folder = `docs/methodology/` ↔ Tier 1).

### §1.3 Tier 2 — Deep-dive companions + role-overlays + glossaries

**Role:** loaded when agent navigates to specific concern from Tier 1 cross-link OR role-overlay TOC.

**Binding strength:** depth-of-detail; informational at runtime; load only on-demand per tele-11 Cognitive Minimalism extensive-margin discipline.

**Content-shape:** emergent per concern. Role-overlays follow D4 row template (§4). ADRs follow ADR-style. Specs follow spec-style. Glossaries follow lookup-table style.

**Tier-membership criteria:**
1. **Deep-dive content** — depth-of-detail beyond what Tier 1 carries inline
2. **Navigated-to**, not load-by-default — accessed via one of: (i) Tier 1 cross-link OR (ii) role-overlay TOC entry OR (iii) Tier 0 cold-pickup primary surface direct cross-link (per §4 Cold-pickup primary surfaces — `docs/traces/trace-management.md` is the canonical example); cold-session does NOT load by default
3. **Composes upward** — content composable into Tier 1 docs (cross-link target) OR role-overlay (INDEX entry) OR Tier 0 cold-pickup surface (direct cross-link target)

**Examples (Tier 2 = deep-dive per-artifact content; everything NOT in `docs/methodology/`):** `docs/decisions/<adr>.md` (ADRs) · `docs/specs/<spec>.md` (entity specs) · `docs/audits/<mission>-*-audit.md` (closing audits) · `docs/reviews/<mission>-retrospective.md` (retrospectives) · `docs/surveys/<mission>-survey.md` (Phase 3 artifacts) · `docs/designs/<mission>-design.md` (Phase 4 artifacts) · `docs/traces/trace-management.md` + `docs/traces/<task-or-mission>-work-trace.md` (work-traces) · `docs/calibrations.yaml` (calibration ledger; queried via Skill)

**Director-ratified Phase-4-close tier-rule (v1.3 restructure):** Tier 2 = everything NOT in `docs/methodology/`. Role-runtime overlays + tele-glossary REMOVED from Tier 2 (now Tier 1 per §1.2 restructure). `docs/methodology/entity-mechanics.md` REMOVED from Tier 2 example list (it was always Tier 1 per file location; was example-list inconsistency in v1.2).

### §1.4 Tier criteria operational test (per engineer audit rubric §1)

A reviewer uses §1.1-§1.3 criteria to assign a fresh directive without architect input. Mix of POSITIVE (assignment confirmed) + NEGATIVE (rejection-from-tier with reason) test cases — negative cases prove the criteria discriminate, per engineer round-1 audit (without them criteria can be ex-post-fitted to anything).

**POSITIVE test cases (tier-assignment confirmed):**

| Test directive | Tier assignment | Reasoning |
|---|---|---|
| "Don't add Co-Authored-By trailer" | Tier 0 | Universal (all roles) ✓ + cross-mission (commit policy) ✓ + inlinable ✓ |
| "Per-class default cadence template" | Tier 1 (mission-lifecycle.md §4.1) | Methodology-domain ✓ (pulse coordination); phase-engaged binding ✓; cross-links into ADR-027 Tier 2 |
| "ADR-027 PulseSweeper class implementation" | Tier 2 (`docs/decisions/027-*.md`) | Deep-dive ✓ + navigated-to from mission-lifecycle.md §4 cross-link ✓ |

**NEGATIVE test cases (rejection-from-tier; demonstrates criteria discriminate):**

| Test directive | Proposed tier | REJECTED — reason |
|---|---|---|
| "Pass 10 rebuild after hub/src PRs" | Tier 0 (proposed) | **Rejected**: fails Tier 0 criterion 1 (universal applicability) — engineer-only directive. Belongs in Tier 2 `engineer-runtime.md` INDEX-overlay |
| "Detailed per-FSM transition rules for Task entity" | Tier 0 (proposed) | **Rejected**: fails Tier 0 criterion 3 (inlinable) — full FSM table is ~40 lines; cannot inline at Tier 0. Belongs in Tier 1 `entity-mechanics.md` or Tier 2 `docs/specs/<entity>.md` |
| "Survey methodology pick-list discipline" | Tier 0 (proposed) | **Rejected**: fails Tier 0 criterion 2 (cross-mission impact on failure-to-bind is concentrated at Idea→Design transition only — not all-roles-all-times). Belongs in Tier 1 `idea-survey.md` |
| "Mission-lifecycle Phase + RACI matrix (full inline)" | Tier 0 (proposed) | **Rejected**: criteria 1+2 hold (universal ✓; cross-mission ✓) but criterion 3 fails — full RACI matrix + phase enumeration is >80 lines; cannot inline. Belongs in Tier 1 `mission-lifecycle.md`; Tier 0 carries Mission RACI summary + cross-link only |

**Boundary case (POSITIVE assignment; NOT Tier 0):**

| Test directive | Proposed tier | Reasoning |
|---|---|---|
| "Specific commit-push thread-heartbeat wording" | Tier 1 (proposed; mission-lifecycle.md §1.5.1) | **Confirmed Tier 1** (NOT Tier 0). Engineer-runtime concern; binding when phase-engaged. Methodology-domain: engineer-runtime decision-routing. Tier 2 `engineer-runtime.md` overlay surfaces it via INDEX |

Net: 4 positive (3 base cases above + 1 boundary case) + 4 negative test cases. Operationally testable; audit rubric §1 probe satisfied; criteria discriminate via positive AND negative cases.

---

## §2 Directive enumeration (hardened CLAUDE.md content)

The post-hardening CLAUDE.md ships the following directives at Tier 0. Each line in the table maps to a section heading + provenance-anchor + tier-membership-justification.

### §2.0 Engineer P1 surfaces — fold-distribution table (per engineer round-1 audit clarification)

Per engineer round-1 N1 surface: P1 5 surfaces fold across §2.x sections (NOT all into one new §). Explicit fold-distribution avoids audit ambiguity:

| P1 surface | Fold target | Type |
|---|---|---|
| Work-trace location + cold-pickup | §4 (NEW Cold-pickup primary surfaces) | New Tier-0 section |
| Engineer-runtime operational rules | §4 cross-link → `engineer-runtime.md` Tier-2 INDEX-overlay | New Tier-0 cross-link |
| Calibration ledger rationale-summary inline | §2 (existing Calibration ledger discipline) — refinement; adds `Why:` + `How to apply:` lines | Refinement of existing §2 |
| `mission-lifecycle.md` + `idea-survey.md` companion-policies index entries | §5 (existing Companion policies) — list expansion | Already shipped via commit `a57b2ca` |
| Tele-glossary cross-link | §5 + §4 (cross-link) | New Tier-0 cross-link + companion list entry |

### §2.1 Tier-0 directive table

| § | Directive | Provenance-anchor | Tier-membership justification (vs §1.1 criteria) |
|---|---|---|---|
| Header | repo guidance preamble | (no anchor; framing line) | Header (not directive) |
| §1 | Commit message policy | Director-direct-anchor (Director-ratified 2026-04-23; clean GitHub Contributors graph; AI-attribution-free) | (1) all roles ✓ (2) cross-mission impact (Contributors graph) ✓ (3) inlinable ✓ |
| §2 | Calibration ledger discipline | ADR-ID (ADR-030 calibration ledger mechanization; Director-ratified 2026-04-22) | (1) all roles ✓ (2) cross-mission impact (state-fidelity) ✓ (3) inlinable ✓ |
| §3 | Mission RACI | calibration-ID (#57; with #55 as compositional sister) | (1) all roles ✓ (2) cross-mission impact (engineer-routing class) ✓ (3) inlinable ✓ |
| §4 | Cold-pickup primary surfaces (NEW) | Director-direct-anchor (Phase 4 Design bilateral via thread-438+439; 2026-04-30 ratification venue) | (1) all roles ✓ (2) cross-mission (load-bearing-context failures cold-session-class) ✓ (3) inlinable ✓ |
| §5 | Companion policies index | §5.3 framing/index carve-out (no provenance-anchor required; index-section carries no normative content) | (1) all roles ✓ (2) discoverability hierarchy primary surface ✓ (3) inlinable ✓ |

Net 5 sections + header. Projected line count breakdown in §6 size-budget tracking.

**§4 provenance-anchor architect-decision (per engineer round-1 §2 probe + content-level audit C2/C3 reconciliation):** Director-direct-anchor SOLE provenance per §5.3 "EXACTLY ONE" rule. Compositional context (contributing calibrations #54 + #55 + #57 + `normative-doc-divergence` pending-ratification) lives as a separate `*Compositions:*` informational sub-line in §2.2 directive details — NOT provenance. Preserves §5.3 strict-class invariant.

### §2.2 Directive details (Tier 0 content)

**§1 Commit message policy** (current shape; minor format-update only)
- Rule: no `Co-Authored-By: Claude ...` trailer in any form
- Provenance sub-line: `*Provenance: Director-ratified 2026-04-23 (clean GitHub Contributors graph; AI-attribution-free).*`
- Inline rationale: ~3 lines on Why
- Cross-link: none (self-contained directive)

**§2 Calibration ledger discipline** (engineer P1.3 fold: add Why + How-to-apply inline)
- Rule: query ledger via Skill, NOT narrative-doc memory recall
- Provenance sub-line: `*Provenance: ADR-030 (calibration ledger mechanization, mission-65 W4 close); Director-ratified 2026-04-22.*`
- Inline rationale: ~3 lines (defeats LLM-state-fidelity drift class per calibration #42)
- How-to-apply: `python3 scripts/calibrations/calibrations.py {list,show,status}` (Phase 1 surface)
- Cross-link: `docs/calibrations.yaml` + `docs/decisions/030-*.md`

**§3 Mission RACI** (current shape; preserved)
- Rule: architect drives; engineer surfaces through architect (NOT Director-direct); Director gate-points only
- Provenance sub-line: `*Provenance: calibration #57 + #55 (mission-66 W4 close, engineer-routing closure mechanism).*`
- Inline rationale: ~5 lines (engineer-side autonomous-stop anti-pattern; thread-engagement requirement)
- Cross-link: `docs/methodology/mission-lifecycle.md` §1.5 + §1.5.1

**§4 Cold-pickup primary surfaces** (NEW; engineer P1 fold)
- Rule: cold-session pickup loads work-trace + companion-policies index + role-runtime overlay before mission-engagement
- Provenance sub-line: `*Provenance: Director-direct-anchor (Phase 4 Design bilateral via thread-438+439; 2026-04-30 ratification venue).*`
- Compositions sub-line (informational; NOT provenance per §5.3 strict-class rule): `*Compositions: contributing calibrations #54 (engineer-progress-visibility gap) + #55 (engineer-cadence-discipline) + #57 (engineer-routing) + `normative-doc-divergence` (calibration-candidate pending Director Phase-4-close ratification).*`
- Inline rationale: ~3 lines (closes engineer-runtime-rules-invisible-class; tele-12 attention-ordering)
- Cross-links:
  - Work-trace location: `docs/traces/trace-management.md` (Tier 2; direct cross-link from Tier 0 per §3.1 Tier 0 ↔ Tier 2 cold-pickup discipline)
  - Engineer-runtime overlay: `docs/methodology/engineer-runtime.md`
  - Architect-runtime overlay: `docs/methodology/architect-runtime.md`
  - Tele glossary: `docs/methodology/tele-glossary.md` (IN-SCOPE per §6.2 upgrade)

**§5 Companion policies** (existing structure; expanded list)
- Lists ALL Tier 1 docs + role-overlays + glossaries:
  1. `docs/methodology/mission-lifecycle.md` — formal lifecycle phases + RACI matrix + engineer-runtime decision-routing rules; canonical reference for full Mission RACI + per-phase responsibilities
  2. `docs/methodology/idea-survey.md` — Director-intent Survey methodology (3+3 pick-list); canonical for Idea→Design transition
  3. `docs/methodology/strategic-review.md` — backlog triage + mission prioritization; carries §Idea Triage Protocol (per-idea routing: skip-direct / triage-thread / queue-for-Strategic-Review)
  4. `docs/methodology/multi-agent-pr-workflow.md` — per-PR integration gate (v1.0 DRAFT; supersedes sovereign-branch model)
  5. `docs/methodology/mission-preflight.md` — activation gate (proposed → active)
  6. `docs/methodology/entity-mechanics.md` — per-entity FSM + status transitions + cascade behaviors
  7. `docs/methodology/engineer-runtime.md` — engineer-runtime concerns INDEX-overlay (NEW; this mission)
  8. `docs/methodology/architect-runtime.md` — architect-runtime concerns INDEX-overlay (NEW; this mission)
  9. `docs/methodology/tele-glossary.md` — tele lookup table (if scoped in; see §6)
  10. `.github/CODEOWNERS` — directory-ownership map; mechanized review routing via `@apnex-org/architect` + `@apnex-org/engineer`

---

## §3 Cross-link discipline

### §3.1 Bidirectional cross-link invariant — single-mention-per-side (universal default + tier-pair clauses)

Per engineer round-1 audit §3 ambiguity: bidirectional has two readings. **(a) Single-mention-per-side** = source cites target once + target cites source once (one-touch on both sides). **(b) Full cross-link maintenance** = every link has reciprocal link, all kept in sync (high maintenance; recursion-prone).

**Architect-decision: (a) single-mention-per-side as universal default**, with tier-pair-specific clauses below. Lower maintenance; sufficient for back-reference-drift protection.

#### §3.1.1 Tier 0 ↔ Tier 1 (default case)

- CLAUDE.md `## Companion policies` index lists each Tier 1 doc once
- Each Tier 1 doc carries a `## Companion docs` (or equivalent) section with a single back-reference to CLAUDE.md (e.g., `**Bound at runtime via CLAUDE.md §<X>**`)

#### §3.1.2 Tier 0 ↔ Tier 2 (cold-pickup direct cross-link)

§4 Cold-pickup primary surfaces direct-cross-links select Tier 2 docs (e.g., `docs/traces/trace-management.md`). Single-mention-per-side applies:
- CLAUDE.md §4 cites Tier 2 doc once
- Tier 2 doc back-references CLAUDE.md §4 once (e.g., `**Bound at runtime via CLAUDE.md §4 cold-pickup primary surfaces**`)

This is a Tier 2 direct cross-link case (§1.3 criterion 2 case (iii)); does NOT violate "Tier 2 navigated-to-not-load-by-default" because the Tier 0 cross-link IS the navigation path.

#### §3.1.3 Tier 1 ↔ Tier 2 (multi-hop default)

Tier 1 docs (e.g., `mission-lifecycle.md`) reference Tier 2 docs (e.g., `docs/decisions/<adr>.md`) per existing methodology-doc convention. Single-mention-per-side: Tier 1 cites Tier 2 once; Tier 2 (ADR) cites Tier 1 in its provenance/companion-doc section once. No CLAUDE.md involvement (multi-hop reach via Tier 0 → Tier 1 → Tier 2).

#### §3.1.4 Tier 2 → Tier 0 self-reference (role-overlay edge case)

Per engineer P3 probe: role-overlay rows (Tier 2) may cite CLAUDE.md (Tier 0) as canonical-source when CLAUDE.md IS the canonical-source for the rule (e.g., `## Calibration ledger discipline` lives in CLAUDE.md §2; architect-runtime.md row 7 cites it). Valid INDEX-overlay shape; self-reference is consistent with INDEX-only invariant ("rule body lives in canonical doc"; CLAUDE.md §2 IS the canonical doc).

**Audit-rubric §3 probe response:** bidirectional single-mention-per-side discipline specified across all 4 tier-pair clauses; companion-policies index covers ALL methodology docs (per §2.1 §5 enumeration above).

### §3.2 Cross-link target stability

Cross-links target specific section anchors (e.g., `mission-lifecycle.md§1.5` not just `mission-lifecycle.md`) when the target is a section, not a whole doc. Anchor-stability invariant: if a target heading is renamed, the citing doc updates within the same PR.

### §3.3 Companion-policies index ordering

Order from most-load-bearing to least:
1. mission-lifecycle.md (canonical lifecycle + RACI; first cross-link in cold-session navigation)
2. idea-survey.md (Phase 3 Survey methodology; high-frequency at idea→design transition)
3. strategic-review.md (Phase-2 triage protocol + heavy-event review methodology)
4. multi-agent-pr-workflow.md (per-PR mechanics; high-frequency at Phase 8 execution)
5. mission-preflight.md (Phase-6 mechanics; phase-specific)
6. entity-mechanics.md (per-entity FSM; reference depth)
7. engineer-runtime.md (engineer-overlay; role-specific)
8. architect-runtime.md (architect-overlay; role-specific)
9. tele-glossary.md (lookup; on-demand)
10. .github/CODEOWNERS (ownership routing; CI-engaged not session-start)

---

## §4 Role-overlay companion-doc shape (D4 row template)

Per Q2d + engineer P2 INDEX-overlay-not-content-fork shape: role-runtime overlays are curated tables-of-contents with deep-link anchors. Rules live in canonical sources; overlays are entry-vectors.

### §4.1 Row template (D4 column-set)

| Concern | Why it matters at runtime | Canonical source | Heading anchor |
|---|---|---|---|
| (rule name; short) | (1-line "why this matters to <role> at runtime") | (canonical-doc relative path) | (deep-link fragment) |

**Maintenance-cost protection:** broken heading-anchor = visible failure at canonical-doc-edit-time (PR review catches anchor-rename without overlay-update; mechanizes via doc-graph linting in idea-227 future scope).

### §4.2 `docs/methodology/engineer-runtime.md` initial content

| Concern | Why it matters at runtime | Canonical source | Heading anchor |
|---|---|---|---|
| Pass 10 rebuild after `hub/src` PRs | Hub container rebuild + restart REQUIRED for hub/src PRs; silent break otherwise | `multi-agent-pr-workflow.md` | `#pass-10-rebuild` (TBD; needs heading creation) |
| Schema-rename PRs require state-migration | Code-only renames break silently when persisted state has old field name | `multi-agent-pr-workflow.md` | `#schema-rename-state-migration` (TBD; needs heading creation) |
| Thread-side approval ≠ GitHub-side | Branch protection blocks merge without `gh pr review --approve` | `multi-agent-pr-workflow.md` | `#cross-approval-pattern` |
| Commit-push thread-heartbeat | Per-commit thread ping for architect visibility (calibrations #54/#55) | `mission-lifecycle.md` | `#15-1-engineer-runtime-decision-moment-routing-calibration-57-codification` |
| Work-trace discipline | `docs/traces/<task-or-mission>-work-trace.md` per task; engineer-owned | `mission-lifecycle.md` | `#7-2-trace-discipline-engineer-owned` |
| Cross-package vitest baseline (admin-merge convention) | Engineer must recognize when cross-package test failures warrant admin-merge per established 35-PR-consecutive lineage (bug-32) vs when test-fix is required; canonical decision criteria + lineage context lives in canonical source | `mission-lifecycle.md` | `#7-4-cross-approval-pattern-mission-execution-discipline` |
| Commit message format | No `Co-Authored-By:` trailer | `CLAUDE.md` | `#commit-message-policy` |
| Hub thread protocol | `drain_pending_actions` on session-start; thread maxRounds discipline; bilateral seal via `close_no_action` + summary | `mission-lifecycle.md` | `#7-5-per-wave-bilateral-seal-discipline` |

**Note on (TBD; needs heading creation) entries:** PR 1 (binding-artifact) creates the anchor headings in canonical source where missing (audit confirms maintenance-cost protection at content-creation-time, not deferred).

### §4.3 `docs/methodology/architect-runtime.md` initial content

| Concern | Why it matters at runtime | Canonical source | Heading anchor |
|---|---|---|---|
| Mission-driving authority | Architect drives mission; engineer surfaces through architect (#57 closure) | `mission-lifecycle.md` | `#15-1-engineer-runtime-decision-moment-routing-calibration-57-codification` |
| Categorised-concerns surface table | When to surface to Director vs handle autonomously | `mission-lifecycle.md` | `#5-1-categorised-concerns-table` |
| Idea Triage Protocol | Per-idea routing (skip-direct / triage-thread / queue-for-Strategic-Review) | `strategic-review.md` | `#idea-triage-protocol` |
| Pulse-driven coordination | Mission entity pulses; precondition + cadence | `mission-lifecycle.md` | `#4-pulse-coordination` |
| Substrate-self-dogfood discipline | Substrate vs enrichment evaluation | `mission-lifecycle.md` | `#6-substrate-self-dogfood-discipline` |
| Phase 3 Survey methodology | 3+3 pick-list; NO pre-picks; Director Accountability for picks | `idea-survey.md` | (top of doc) |
| Calibration ledger discipline | Architect-authored entries; LLM read-only at Phase 1 | `CLAUDE.md` | `#calibration-ledger-discipline` |
| Coordinated-upgrade discipline | Substrate-introduction class anti-goal #8 | `mission-lifecycle.md` | `#3-1-1-coordinated-upgrade-discipline-calibration-48` |
| Structural-anchor discipline | Schema-validate at canonical write-path (sister to coordinated-upgrade) | `mission-lifecycle.md` | `#3-1-2-structural-anchor-discipline-calibration-49-sister-to-48` |
| Three-mode retrospective taxonomy | Walkthrough / summary-review / skip per mission-class | `mission-lifecycle.md` | `#10-retrospective` (TBD; needs section creation) |

### §4.4 INDEX-only invariant (audit-rubric §4 probe)

INDEX-only invariant preserved: every overlay row cites canonical source; rule body lives ONLY in canonical doc; overlay carries the entry-vector + 1-line motivation only. Maintenance-cost protection: see §4.1 heading-anchor stability.

---

## §5 Ratification protocol

### §5.1 Versioning mechanism + semver-bump triggers (per engineer round-1 audit §5 probe)

CLAUDE.md adopts **semver-style versioning** matching `mission-lifecycle.md` v1.2 precedent. Without explicit bump-triggers version-drift is inevitable; engineer flagged. Triggers:

| Bump | Trigger | Examples |
|---|---|---|
| **MAJOR** (vN.0 → v(N+1).0) | Tier-0 directive add/remove OR tier-restructure (Tier 0 → Tier 1 demotion etc.) OR provenance-anchor taxonomy REMOVE-or-REINTERPRET (e.g., dropping ADR-ID class; redefining Director-direct-anchor semantics) | Adding a new Tier-0 section; removing Mission RACI; collapsing Tier 0+1; dropping ADR-ID anchor class |
| **MINOR** (vN.M → vN.(M+1)) | Companion-policies index expansion OR new cross-link OR tier-internal section refinement (e.g., §2 Calibration ledger getting Why/How-to-apply lines) OR new role-overlay doc OR provenance-anchor taxonomy ADDITION (e.g., adding 4th anchor class for framing/index per §5.3 carve-out) OR archive-sidecar creation (`CLAUDE-md-revisions.md` per §5.2) | Adding `engineer-runtime.md` to Tier 2; companion-index entry add; rationale-line additions; framing/index 4th-class carve-out add |
| **PATCH** (vN.M.P → vN.M.(P+1)) | Format clarification OR typo fix OR cross-link target heading-rename OR provenance-anchor spell-out OR calibration-ID assigned post-ratification (filling `#X` placeholder per §2.2 §4 Cold-pickup primary surfaces sub-line note) | Sub-line `**Provenance:**` format spelling; fixing a broken anchor; companion-doc rename absorbed; `normative-doc-divergence` calibration-ID post-ratification fill |

Director re-ratification REQUIRED at MAJOR bumps; architect-autonomous at MINOR + PATCH (architect surfaces MINOR + PATCH log to Director at retrospective gates per `mission-lifecycle.md` v1.2 retrospective discipline).

**Version declared at top of CLAUDE.md** in `Status:` line (currently absent; Design v1.0 specifies inclusion).

### §5.2 Revision-history location + line-budget impact

**In-CLAUDE.md trailer section** (`## Change log`) — same shape as `mission-lifecycle.md` v1.2 trailer table:

```markdown
## Change log

| Version | Date | Delta |
|---|---|---|
| v1.0 | 2026-04-30 | Initial hardened shape; mission idea-226 close. Adds tier hierarchy + cold-pickup primary surfaces + role-overlays + provenance-anchor 3-class taxonomy. |
| v1.1 | TBD | TBD |
```

Git-log-as-source-of-truth secondary; in-CLAUDE.md trailer is canonical (matches existing methodology-doc convention).

**Line-budget impact** (per engineer round-1 §5 probe): trailer adds ~6 lines (heading + table-header + 1 row per version-delta); the §6.4 projected-62-line total INCLUDES the v1.0 trailer (= 7 lines: heading + header + v1.0 row + spacer). Each subsequent revision adds 1 row. Q5d-trigger from change-log growth alone: ~12-15 revisions before trailer-driven growth pushes total above 80 lines (assuming no Tier-0 section additions in interim). At that point: archive older revisions to a sidecar `docs/methodology/CLAUDE-md-revisions.md` Tier 2 doc; trailer keeps last N=5 versions inline.

### §5.3 Provenance-anchor 3-class taxonomy + framing/index carve-out (per engineer C3 fold + content-level M2 fold)

Every Tier 0 **normative directive** carries provenance from EXACTLY ONE of three valid anchor classes. **Framing/index sections** that carry NO normative content are exempt from provenance-anchor requirement (carve-out per content-level audit M2):

| Class | Format | Use when |
|---|---|---|
| **calibration ledger ID** | `*Provenance: calibration #N (<short-name>, <surfaced-at>).*` | Directive closes a calibration data-point |
| **ADR ID** | `*Provenance: ADR-NNN (<short-name>); Director-ratified <date>.*` | Directive operationalizes an architectural decision |
| **Director-direct-anchor** | `*Provenance: Director-ratified <date> (<context>; <ratification venue>).*` | Directive is direct Director-pref without calibration / ADR origin |
| **(carve-out) framing/index — NO ANCHOR** | (no `*Provenance:*` sub-line; section structure self-evident as framing/index) | Section is index-only / framing-only with NO normative content (e.g., `## Companion policies` lists canonical docs without prescribing rules) |

**Strict-class invariant:** the 3 normative-directive classes are mutually exclusive; a directive uses EXACTLY ONE. Compositional context (multiple contributing sources) goes in a separate `*Compositions:*` informational sub-line — NOT provenance. The carve-out is structurally distinct (no anchor at all); architect/engineer-judgment determines section-class at authoring-time per §1.1 criteria (normative directive → 1 of 3 anchor classes; framing/index → carve-out).

**Sub-line placement (per engineer D3):** anchor lives on its own line immediately below the section heading (italic format). Example:

```markdown
## Mission RACI

*Provenance: calibration #57 + #55 (mission-66 W4 close, engineer-routing closure mechanism).*

**Architect drives mission; engineer surfaces ambiguity through architect...**
```

NOT `## Mission RACI [calibration #57]` (heading-bracket; rejected per D3 cold-scan-TOC concern).

### §5.4 Calibration-trace mechanism (per audit-rubric §5)

**Per-directive anchor** (above) handles per-directive trace.

**Aggregate-trace** lives in `## Change log` trailer: each version delta narrates which calibration / ADR / Director-direct-anchor sources contributed. Composes with `docs/calibrations.yaml` ledger queries (Calibration Skill) for full provenance lookup.

**No backfill of ledger entries** for existing Director-direct-ratified directives (per engineer C3). Director-direct-anchor is valid traceability source.

---

## §6 Structural-improvement folds (Q5d Director-license at use)

Per Q5d "if there are structural improvements available to our protocols/methodologies — can explore", this mission absorbs the following structural improvements:

### §6.1 Surveys-folder discipline (Director-flagged 2026-04-30)

**Scope:**
- Fix `mission-lifecycle.md` Phase artifact table row 3: `docs/designs/<mission>-survey.md` → `docs/surveys/<mission>-survey.md`
- Migrate 3 misplaced surveys via `git mv` (preserves history): `m-mission-pulse-primitive-survey.md` + `m-wire-entity-convergence-survey.md` + `m-agent-entity-revisit-survey.md` → `docs/surveys/`
- Cross-reference audit + repair (in-repo only; per engineer D1)

**Rationale-for-fold (in-scope reasoning):** Director directly flagged this gap during Phase 4 opening discussion; gap is class-instance of `normative-doc-divergence` calibration-candidate; fix lands cleanly as PR 2 (housekeeping; lands FIRST per engineer C1).

**Rationale-for-not-defer:** This mission's own Survey artifact landing location depends on the discipline being established. Deferring creates "is this here because we just fixed it or because of broken practice" ambiguity for THIS mission's Survey landing.

**Sequencing:** PR 2 (housekeeping) lands FIRST → PR 1 (binding-artifact) lands AFTER.

### §6.2 Tele-glossary (engineer P1.5 + IN-SCOPE per round-1 audit upgrade)

**Scope:** New `docs/methodology/tele-glossary.md` Tier 2 doc; lookup table (tele-N → short-name → 1-line mandate); cross-link from CLAUDE.md companion-policies index.

**Rationale-for-fold (in-scope reasoning):** Low-effort doc-substrate aligns with hardening goal; closes engineer cold-start gap (tele-12 / tele-4 references previously required out-of-band knowledge to decode); composes cleanly with progressive-disclosure tier hierarchy.

**Rationale-for-not-defer:** If deferred, every CLAUDE.md tele-reference (existing + new) requires ad-hoc context for cold-readers; closing as part of THIS mission delivers the binding-mechanism (text-shape attention-ordering exploits tele names as anchors) at correct strength from-shipment.

**Engineer round-1 audit upgrade (NOT parked → IN-SCOPE):** engineer-side parking decision UPGRADED to IN-SCOPE because Tier 0 §4 Cold-pickup primary surfaces + §2 Calibration ledger discipline reference tele-N inline (e.g., "tele-12 attention-ordering"). Per engineer round-1 §6.2 probe: "tele-references inline at Tier 0 → tele-glossary becomes Tier-0-binding-dependency (cold-session can't decode tele-12 without it = tele-4 violation)." Architect-accept: tele-glossary upgrades from "decorative reference" to "load-bearing decoder"; IN-SCOPE for THIS mission's PR 1 binding-artifact.

**v1.3 tier-restructure consequence:** tele-glossary classified as Tier 1 (NOT Tier 2 as v1.2 specified). Director Phase-4-close ratification 2026-04-30: load-bearing-decoder semantics + `docs/methodology/` placement → Tier 1 by physical-structure-mirrors-load-semantics rule.

**Architect-flag for Phase 4 close (RESOLVED 2026-04-30):** Director Phase-4-close ratification: tele-glossary IN-SCOPE confirmed; tier-restructure to Tier 1 also ratified (composes with v1.3 restructure).

### §6.3 Calibration ledger filing — `normative-doc-divergence` class

**Scope:** Architect-flag for Director ratification; engineer-renamed class-level naming (supersedes architect surface-instance naming); composes with calibration #42.

**Rationale-for-fold:** First-canonical example (surveys-folder discrepancy) lives in this mission's PR 2 scope; class-level naming closes pattern-recognition gap; pattern composes with #42 LLM-state-fidelity drift family.

**Phase 4 close architect-flag:** Director-ratify class-level name "normative-doc-divergence" + assign calibration ID (architect cannot autonomously file per CLAUDE.md ledger discipline).

### §6.4 Size-budget tracking (per engineer D2)

**Projected-line-count breakdown** for hardened CLAUDE.md (post-PR-1):

**Per-section breakdown** (heading + provenance sub-line + spacer + rationale + cross-link rows; ±2-line tolerance per element):

| Section | Element decomposition | Projected lines | Cumulative |
|---|---|---|---|
| Header + framing | title + 1 framing line + spacer | 4 | 4 |
| ## Status + Change log trailer | status (1) + change-log heading (1) + table-header (1) + v1.0 row (1) + spacer (1) + future v1.x rows (~3) | 8 | 12 |
| ## §1 Commit message policy | heading + provenance + spacer + rule (~3) + rationale (~2) | 8 | 20 |
| ## §2 Calibration ledger discipline | heading + provenance + spacer + rule (~2) + Why (~2) + How-to-apply (~1) + cross-link (~1) | 9 | 29 |
| ## §3 Mission RACI | heading + provenance + spacer + rule (~3) + rationale (~3) + cross-link (~1) | 10 | 39 |
| ## §4 Cold-pickup primary surfaces | heading + provenance + compositions + spacer + rule (~2) + 4 cross-links (~4) | 12 | 51 |
| ## §5 Companion policies index | heading + (carve-out: no provenance) + spacer + index-list intro (~1) + 10 entries (~10) | 14 | 65 |

**Projected total: ~65 lines** (revised from v1.0's 62 to account for §4 compositions sub-line + per-element tolerance) — within 50-80 line target (Q5b default; Q5d flex unused this iteration).

**Q5d-trigger conditions** (flag for Director surprise-avoidance at Phase 4 close; **scope clarified: applies to round-1 + round-2 audit folds AT-v0.1→v1.x stage; post-ratification revisions track via §5.1 semver-bump triggers separately**):
- If round-1 + round-2 audit folds CUMULATIVE add >15 lines (final >80) → Q5d Director-license trigger AT Phase 4 close
- If §6.2 tele-glossary cross-link expands (multi-line context block) → Q5d trigger
- If post-ratification revisions trigger trailer-driven growth (~12-15 v1.x revisions) → archive-sidecar mechanism per §5.2 (MINOR bump per §5.1; NOT Q5d-trigger)
- Otherwise: no Q5d trigger; default size budget honored

---

## §7 Anti-goals + Phase-N revisit-axes

### §7.1 Anti-goals (explicit out-of-scope)

| # | Anti-goal | Reviewer-test (audit-rubric §7) | Composes-with |
|---|---|---|---|
| AG-1 | NOT runtime-enforcement | Future-PR adds session-start hook validating CLAUDE.md state → flag scope-creep | idea-227 (M-Hook-Design-End-to-End) |
| AG-2 | NOT fetch-cadence + stale-clone-detection | Future-PR adds pre-session `git fetch` automation OR stale-detection warning → flag scope-creep | idea-227 |
| AG-3 | NOT per-role memory-system overhaul | Future-PR mechanizes cross-clone memory consistency → flag scope-creep | future-mission (separate concern; not idea-227) |
| AG-4 | NOT tool-surface scope | Future-PR proposes new tool verbs / envelope shapes → flag scope-creep | idea-121 (API v2.0) |
| AG-5 | NOT CODEOWNERS / GitHub-side enforcement redesign | Future-PR rewrites CODEOWNERS / branch-protection → flag scope-creep | future-mission (separate concern) |
| AG-6 | NOT ledger entry backfill for existing directives | Future-PR backfills ledger entries for existing Director-direct-ratified directives → flag scope-creep (Director-direct-anchor is valid; per §5.3) | future-mission OR Phase-N retrospective fold |
| AG-7 | NOT content-fork in role-overlays | Future-PR introduces normative content (rule statement, threshold, condition, exception clause) in `engineer-runtime.md` OR `architect-runtime.md` body that exceeds the 4-column INDEX row template (per §4.1) OR diverges in normative content from the canonical-source heading body → flag content-fork violation. The "Why it matters at runtime" 1-line column is permitted to paraphrase canonical rationale; the rule body itself MUST live in canonical source. | (sustained at maintenance gates) |

### §7.2 Phase-N revisit-axes (preserved for forward composition)

| Axis | Phase-N venue |
|---|---|
| Runtime enforcement (Q4a/c/d candidates) | idea-227 future mission |
| Engineering quality content size (Q5d trigger conditions) | This mission's structural-improvement folds OR follow-on |
| Cross-clone state-fidelity layer (fetch-cadence; stale-detection; pre-session validation) | idea-227 future mission |
| Per-role memory-system cross-clone consistency | Separate forward concern (not idea-227) |
| `normative-doc-divergence` mechanization (doc-graph linting) | idea-227 future mission scope |

---

## §8 PR sequencing + content map

### §8.1 PR 2 (housekeeping; lands FIRST)

**Branch:** `agent-lily/idea-226-housekeeping-surveys` (or equivalent)
**Base:** `origin/main`
**Scope:**
- `mission-lifecycle.md` Phase artifact table row 3 fix (one-line edit)
- `git mv` migrations (3 surveys: `m-mission-pulse-primitive-survey.md` + `m-wire-entity-convergence-survey.md` + `m-agent-entity-revisit-survey.md` → `docs/surveys/`)
- Cross-reference audit + repair (in-repo only per engineer D1)

**Description boundary statement (per D1):** "Cross-ref audit covers in-repo only (ADR + retrospective + mission audit + traces + memory entries naming old path). External-cache (GitHub-rendered pages, Wiki, etc.) out-of-scope; `git mv` preserves history → stale-clone resolves on `git pull`."

**Approval gate:** bilateral architect-engineer cross-approval per `multi-agent-pr-workflow.md` v1.0.

### §8.2 PR 1 (binding-artifact; lands AFTER PR 2)

**Branch:** `agent-lily/idea-226-claude-md-hardening` (or equivalent)
**Base:** `origin/main` (post-PR-2 merge)
**Scope:**
- `docs/surveys/m-claude-md-hardening-survey.md` (Survey artifact; already authored)
- `docs/designs/m-claude-md-hardening-design.md` (Design v1.x ratified; converged through bilateral threads 438 + 439)
- `CLAUDE.md` (new hardened version per §2 directive enumeration)
- `docs/methodology/engineer-runtime.md` (NEW; per §4.2)
- `docs/methodology/architect-runtime.md` (NEW; per §4.3)
- `docs/methodology/tele-glossary.md` (NEW; per §6.2 if Director-confirmed at Phase 4 close)
- Anchor-heading creation in canonical sources where TBD entries in §4.2 + §4.3 require (per §4.2 note)

**Approval gate:** bilateral architect-engineer cross-approval; Director Phase 7 release-gate ratification on Mission entity status flip (proposed → active per Phase 5 Manifest creation).

---

## §9 Round-1 + Round-2 audit summary (engineer responses folded; probes resolved)

**Historical record** (per engineer round-2 verify R4 fold; preserves Phase 4 Design audit-history for retrospective trace). All 6 probes were surfaced for engineer Step-3 round-1 audit; all received content-level engineer responses + folded into v1.1 + v1.2 architect-revision passes. Probes archived below for retrospective record:

1. **Tier-membership criteria operational test** — §1.4 test cases sufficient? Edge cases that break the criteria? (audit-rubric §1)
2. **Provenance-anchor format consistency** — §5.3 3-class taxonomy + §5.4 sub-line placement collide / compose cleanly with existing methodology-doc-convention? (audit-rubric §2)
3. **Role-overlay heading-anchor stability** — TBD entries in §4.2 + §4.3 — full list of canonical-source heading creations needed for PR 1; missing any? (audit-rubric §4)
4. **Companion-policies index ordering** — §3.3 ordering reflect actual cold-pickup priority? Engineer-side ordering preference? (audit-rubric §3)
5. **Tele-glossary scope-fold** — §6.2 architect-tentative IN-SCOPE. Engineer agrees? Concerns about PR 1 scope-bloat? (audit-rubric §6)
6. **Anti-goal AG-7 (no content-fork in role-overlays) reviewer-test** — §7.1 specific enough that future-PR violation flags without methodology-author input? (audit-rubric §7)

---

## §10 Cross-references

- **`docs/surveys/m-claude-md-hardening-survey.md`** v1.0 — Survey envelope (composite intent envelope this Design concretizes)
- **`docs/methodology/idea-survey.md`** v1.0 — Phase 3 Survey methodology canonical reference
- **`docs/methodology/mission-lifecycle.md`** v1.2 — Phase 4 Design RACI; companion-doc target for hardened CLAUDE.md
- **`docs/methodology/strategic-review.md`** v1.x — §Idea Triage Protocol (Phase 2 → Phase 3 mechanism)
- **idea-226** Hub Idea entity (status=triaged) — concept-level scope this Design operationalizes
- **idea-227** M-Hook-Design-End-to-End (parked) — runtime-mechanism follow-on; composes Phase-N revisit-axes (AG-1, AG-2, AG-3 candidates)
- **calibration #57 + #55** — Mission RACI directive provenance
- **calibration #42** — `normative-doc-divergence` composition class (LLM-state-fidelity drift family)
- **thread-438** — Phase 4 Design bilateral (shape-level audit; sealed; round-budget exhausted at 9/10)
- **thread-439** — Phase 4 Design bilateral (content-level audit + bilateral converge to ratified v1.x; opened post-Director-directive branch-push 2026-04-30)

---

— Architect: lily / 2026-04-30 (Design v1.3; ratified pre-Phase-5 per Director Phase-4-close gate-engagement)
