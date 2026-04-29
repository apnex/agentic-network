# Mission-65 (M-Calibration-Codification) Preflight Check

**Mission:** M-Calibration-Codification (mission-65 candidate; propose_mission assigns final ID at Phase 5)
**Brief:** `docs/designs/m-calibration-codification-design.md` v1.0 RATIFIED (bilateral architect+engineer thread-417 round 4 close-of-bilateral; round 5 architect-side commit 2026-04-29)
**Source idea:** idea-223 (Mechanize calibration ledger as first-class repo data + Skill access surface + CLAUDE.md pointer)
**Survey:** `docs/surveys/m-calibration-codification-survey.md` (Director Round 1 + Round 2 ratified 2026-04-29; composite intent envelope §14)
**Preflight author:** lily / architect
**Date:** 2026-04-29 UTC (~02:50Z; per Calibration #42 timezone discipline)
**Verdict:** **GREEN**
**Freshness:** current (until 2026-05-29; per `mission-preflight.md` 30-day stale-preflight trigger)

---

## Category A — Documentation integrity

- **A1. Brief file exists at `mission.documentRef` path and is committed:** **PASS** — `docs/designs/m-calibration-codification-design.md` v0.2 (390 lines) committed at `8d4e982` on `agent-lily/m-calibration-codification-survey` branch; force-pushed-with-lease to origin; bilateral-ratified as v1.0 via thread-417 round 4
- **A2. Local branch in sync with origin (no unpushed commits affecting brief):** **PASS** — `agent-lily/m-calibration-codification-survey` tip `8d4e982` is in sync with origin/agent-lily/m-calibration-codification-survey post-fixup-push; engineer fetched + verified
- **A3. Cross-referenced artifacts exist:**
  - `docs/surveys/m-calibration-codification-survey.md` (466 lines; same branch tip): **PASS**
  - `docs/methodology/idea-survey.md` v1.0: **PASS** (canonical Survey methodology referenced in Design §0 + Survey §10)
  - `docs/methodology/multi-agent-pr-workflow.md` v1.0: **PASS** (named architectural-pathology patterns subsection referenced in Design §2.4)
  - `docs/methodology/mission-lifecycle.md`: **PASS** (Phase 4 Design + Phase 9+10 retrospective referenced in Design §8)
  - `docs/methodology/mission-preflight.md` v1.0 (this doc references methodology): **PASS**

## Category B — Hub filing integrity

- **B1. Mission entity has correct `id`, `status=proposed`, `documentRef` populated:** **PENDING** — propose_mission to be invoked at Phase 5 (immediately following this Preflight commit); `documentRef` will resolve to `docs/designs/m-calibration-codification-design.md`; status=proposed at creation; expected mission-id `mission-65`
- **B2. `title` + `description` are faithful summary of brief:** **PENDING** — to be authored at propose_mission call; will mirror Design §1 Goal + Composite intent envelope (Survey §14)
- **B3. `tasks[]` + `ideas[]` are empty (unexpected for `proposed`):** **PENDING** — propose_mission seeds empty arrays; bug-31 plannedTasks bypass per established mission-64 precedent (per memory `feedback_plannedtasks_manual_create_mismatch.md`)

## Category C — Referenced-artifact currency

The "memory may be stale" check. Every claim in the brief must still be true *now*.

- **C1. Every file path cited in the brief exists:**
  - `docs/calibrations.yaml` (target ledger path): N/A — this is the deliverable, not a precondition
  - `docs/methodology/idea-survey.md` v1.0: **PASS**
  - `docs/methodology/multi-agent-pr-workflow.md` v1.0 ratified-with calibrations subsection: **PASS** (reference resolved)
  - `docs/methodology/mission-lifecycle.md`: **PASS**
  - `docs/audits/m-adapter-streamline-closing-audit.md` (M64 W4 audit; cited as canonical hallucination-drift surface): **PASS** (merged at PR #127)
  - `docs/reviews/m-adapter-streamline-retrospective.md` (M64 retrospective; cited): **PASS** (merged at PR #129)
  - `docs/reviews/m-wire-entity-convergence-retrospective.md` (M63 retrospective; cited as M62-M64 corpus reference): **PASS** (merged at PR #128)
- **C2. Every numeric claim verified against current state:**
  - "M62: 23 calibrations" cited in Design §2.2: **PASS** — verified against `docs/audits/m-agent-entity-revisit-w5-closing-audit.md` (M62 W5 closing audit; if path differs from convention, will be adjusted at W1+W2 seed migration)
  - "M64: 14 NEW + 1 bonus retire (#6) + 1 carryover closed (#25)" cited: **PASS** — verified against M64 retrospective + W4 audit on origin/main
  - "4 named architectural-pathology patterns from M64" cited: **PASS** — verified against `docs/methodology/multi-agent-pr-workflow.md` v1.0 ratified-with calibrations subsection on origin/main (post-PR #130 merge)
  - "~50-60 entry seed corpus": **PASS** — engineer round-1 audit Q4 STRONG CONCUR; corpus boundary M62/M63/M64 confirmed
- **C3. Every idea/bug/thread cited by ID still in the assumed state:**
  - idea-223 (this mission's source): **PASS** — open at filing 2026-04-29; status=open
  - idea-220 Phase 2 (Mission #6 successor): **PASS** — open at status=open
  - idea-121 (tool-surface authority; deferred-to scope): **PASS** — open at status=open per memory `feedback_defer_tool_surface_to_idea_121.md`
  - idea-222 (relax thread turn-taking; weakly composable): **PASS** — open at status=open
- **C4. Every dependency prerequisite in stated state:**
  - mission-64 (M-Adapter-Streamline; closed) — provides M64 close-arc as canonical hallucination-drift surface + 14 NEW calibrations + 4 named patterns: **PASS** (mission-64 status=completed; all 4 plannedTasks=completed; W4 audit + retrospective + cleanup PR #130 all merged on main)
  - mission-63 (M-Wire-Entity-Convergence; closed) — provides M63 calibration delta (#17/#18/#19/#20main/#22 retired + #25/#26 NEW): **PASS** (mission-63 status=completed; retrospective on main via PR #128)
  - mission-62 (M-Agent-Entity-Revisit; closed) — provides M62 baseline (23 calibrations): **PASS** (mission-62 status=completed; W5 closing audit on main)

## Category D — Scope-decision gating

The "Engineer-flagged for Director" section of the brief must be resolved before activation.

- **D1. Every engineer-flagged scope decision has a ratified answer:** **PASS**
  - All 7 engineer round-1 audit questions (Design §5.2) cleared GREEN-with-folds via thread-417 round 2 → 9 fold integrations applied at v0.2 → engineer ratified v1.0 round 4
  - Specific scope decisions ratified:
    - Q1 schema field completeness — `tele_alignment` field ADDED (optional)
    - Q2 pattern entity — `diagnostic_signature` Phase 2+ defer NAMED
    - Q3 Skill `show` polymorphic shape RATIFIED (id-or-slug)
    - Q4 migration scope — M62/M63/M64 boundary CONFIRMED
    - Q5 W3 dogfood gates — Gate-5 round-trip validation ADDED
    - Q6 risks register — R7 + R8 ADDED
    - Q7 sizing baseline — M holds; upper-bound flag ADDED to §3 prose
- **D2. Director + architect aligned on any mid-brief ambiguous decision point:** **PASS**
  - Director Phase 4 review pre-engineer-audit ratified 4 items (single-file path / YAML rationale / CLAUDE.md as behavioral-discipline directive / R5 Survey persist-path resolved); no residual ambiguity
  - Director ratified "calibrations" term retention post-15-alternative-brainstorm 2026-04-29
- **D3. Out-of-scope boundaries confirmed:** **PASS** — 7 anti-goals locked at Design §4 (NO scope creep into Phase 2+ items / NO LLM-side autonomous filing / NO methodology prose replacement / NO new tool-surface verbs without idea-121 / NO scope creep into idea-220 Phase 2 / NO retroactive earlier-mission migration / NO vertex-cloudrun engineer-side parity)

## Category E — Execution readiness

Engineer-facing checks — can work start cleanly on day 1?

- **E1. First task/wave sequence clear; engineer can scaffold day-1 work without re-reading brief:** **PASS**
  - W0 wave: this Preflight + ADR-030 SCAFFOLD; W0 bundle PR opens with Survey + Design v1.0 + Preflight + ADR-030 SCAFFOLD; admin-merge at Phase 7 Director Release-gate
  - W1+W2 atomic ship sequence ratified at Design §3:
    1. Schema authoring at `docs/calibrations.yaml` (schema_version=1; calibrations[] + patterns[] sections; empty data)
    2. Seed migration of M62/M63/M64 corpus (~50-60 calibration entries + 4 named patterns) — split into 3 ordered commits per R8 mitigation (M62 batch / M63 batch / M64 batch)
    3. Skill scaffolding for 3 read-only verbs (list / show / status; placeholder names)
    4. CLAUDE.md behavioral-discipline directive (~5 lines)
  - W3 dogfood gate: 5 verification gates per Design §3.2 (schema fidelity / cross-link discipline / Skill read-fidelity / multi-role accessibility / round-trip validation against existing audit/retrospective citations)
  - W4 closing: closing audit + ADR-030 RATIFIED + Phase 10 retrospective
- **E2. Deploy-gate dependencies explicit:** **PASS** — no Hub-source PR (Pass 10 §A); no SDK source PR (Pass 10 §B post-mission-64 deprecation: "Removed; npm package + script is canonical"); no schema rename PR (Pass 10 §C); no claude-plugin reinstall (Pass 10 §D bundled in npm package install.sh path). **Mission #5 is doc + Skill scaffolding only — Pass 10 protocol does NOT apply.** No coordinated restart required.
- **E3. Success-criteria metrics measurable from current baseline:** **PASS**
  - Schema fidelity: ~50-60 entries fit cleanly without shape-bumps (W3 Gate-1; binary)
  - Cross-link discipline: pattern_membership ↔ surfaced_by_calibrations references all resolve (W3 Gate-2; binary)
  - Skill read-fidelity: list / show / status return correct results (W3 Gate-3; binary per filter axis)
  - Multi-role accessibility: Skill works for architect + engineer + Director (W3 Gate-4; binary)
  - Round-trip validation: 5-10 calibration citations from M64 W4 audit + retrospective + cleanup PR + methodology subsections render correctly via `show <id>` (W3 Gate-5; binary)
  - Sizing-baseline tele-7 ROI: bilateral review-cycle on Phase 2+ missions stops burning rounds on number-drift fixes (measurable post-Mission #5; baseline = M64 close arc 5 stale-number-nit fixup commits)

## Category F — Coherence with current priorities

The "is this still the right mission?" check.

- **F1. Anti-goals from parent review (if any) still hold:** **PASS** — mission-64 retrospective (PR #129) elevated idea-220 Phase 2 to Mission #5 architect-lean; Director re-prioritized 2026-04-29 to idea-223 first ("compounding rationale: doing #5 first means idea-220 Phase 2's calibration outputs ride the mechanized surface from the outset"). Mission #5 = idea-223 + Mission #6 = idea-220 Phase 2 sequencing ratified.
- **F2. No newer missions filed that supersede or overlap this one:** **PASS** — only ideas open are idea-220 Phase 2 (Mission #6 follow-on; non-overlapping), idea-221 (Pass 10 cross-§ orchestration; non-overlapping), idea-222 (relax thread turn-taking; non-overlapping but weakly composable), idea-218 (adapter local cache; non-overlapping), idea-216 (bug-35 selectAgents semantic shift; non-overlapping). No mission filed post-mission-64.
- **F3. No recent bugs/ideas that materially change the scoping:** **PASS** — idea-222 (filed 2026-04-29) is composable but not blocking; methodology-doc fixup of `idea-survey.md` §5 (R5 closure) bundles into W4 closing per Design §5.1 R5 resolution path

---

## Verdict: GREEN

All categories PASS or PENDING-on-Phase-5-propose_mission-call. Director may flip `proposed → active` at Phase 7 Release-gate immediately following:
1. propose_mission call (this preflight commit + amend if assigned-id ≠ mission-65)
2. W0 bundle PR open (Survey + Design v1.0 + Preflight + ADR-030 SCAFFOLD; bilateral PR review per calibration #24 dual-surface; admin-merge per bug-32 baseline)
3. `update_mission(mission-65, status=active)` Director-issued

No Phase 7 Release-gate dependencies (no NPM_TOKEN posture / no `@apnex` org claim / no external credential). Director time-cost at Release-gate: ~5min (verdict ratification + status flip).

Mission #5 ready for Phase 7 Release-gate ratification.

---

## Cross-references

- **Source idea:** idea-223 (open 2026-04-29; status=open)
- **Brief:** `docs/designs/m-calibration-codification-design.md` v1.0 RATIFIED (8d4e982)
- **Survey:** `docs/surveys/m-calibration-codification-survey.md` (Director Round 1 + Round 2 ratified 2026-04-29)
- **ADR-030 SCAFFOLD:** `docs/decisions/030-calibration-ledger-mechanization.md` (this commit; W4 RATIFIES)
- **Methodology:**
  - `docs/methodology/mission-preflight.md` v1.0 (this preflight follows §Procedure)
  - `docs/methodology/idea-survey.md` v1.0 (Survey upstream)
  - `docs/methodology/mission-lifecycle.md` (Phase taxonomy)
  - `docs/methodology/multi-agent-pr-workflow.md` v1.0 (PR workflow + named architectural-pathology patterns)
- **Architectural-precedents:**
  - mission-64 M-Adapter-Streamline Preflight (M-class structural-inflection precedent)
  - mission-63 M-Wire-Entity-Convergence Preflight (ADR-RATIFIED protocol precedent)
  - mission-57 M-Mission-Pulse-Primitive Preflight (first canonical Survey-anchored Preflight execution per `idea-survey.md` v1.0 §12)

---

*Preflight authored 2026-04-29 ~02:50Z UTC lily / architect post-Design v1.0 bilateral ratify on thread-417 round 4 close-of-bilateral. Verdict GREEN. Director Phase 7 Release-gate awaited.*
