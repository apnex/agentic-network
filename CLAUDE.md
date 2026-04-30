# CLAUDE.md — agentic-network repo guidance

**Status:** v1.0 (mission-67 close 2026-04-30; first hardened version per Design v1.3)

Project-level guidance binding all Claude Code instances working on this repository. **Tier 0** load-on-session-start surface; per `docs/methodology/mission-lifecycle.md` v1.2 + Design v1.3 tier hierarchy. Each directive carries provenance-anchor sub-line per the 3-class taxonomy (calibration-ID / ADR-ID / Director-direct-anchor); framing/index sections carry no anchor (§5 carve-out).

## Commit message policy

*Provenance: Director-direct-anchor (Director-ratified 2026-04-23; clean GitHub Contributors graph; AI-attribution-free).*

**Do not add `Co-Authored-By: Claude ...` trailers to commit messages on this repo.** No `Co-Authored-By: Claude Opus`, `Co-Authored-By: Claude Sonnet`, or any `Co-Authored-By: Claude ...` form. Write plain commit messages.

**Why:** the trailer surfaces on GitHub's repo Contributors view as a co-author; Director wants a clean contributor graph without AI attribution.

**How to apply:** every commit on every branch (main, `agent-{lily,greg}/*` per-PR branches) and every Claude Code session. Applies to both `git commit` direct invocation and any tool-mediated commit path.

## Calibration ledger discipline

*Provenance: ADR-030 (calibration ledger mechanization; Director-ratified 2026-04-22).*

**Query the calibration ledger via the calibration Skill rather than recalling from narrative-doc memory.** Calibration metadata + named architectural-pathology patterns live at `docs/calibrations.yaml` (canonical schema-versioned source-of-truth).

**Why:** defeats the LLM-state-fidelity drift class (calibration #42 origin) — narrative-doc recall produces hallucinated cross-references; ledger queries return ground truth.

**How to apply:** Phase 1 surface `python3 scripts/calibrations/calibrations.py {list,show,status}`. Read-only at Phase 1; ledger entries are architect-authored (NOT LLM-autonomous) — calibration filings + ID assignments are Director-direct-action OR architect-Director-bilateral, never LLM-autonomous.

## Mission RACI

*Provenance: calibration #57 (with #55 as compositional sister; mission-66 W4 close engineer-routing closure mechanism).*

**Architect drives mission; engineer surfaces ambiguity through architect (NOT Director-direct); Director engages at gate-points only** — Phase 3 Survey, Phase 7 Release-gate, Phase 10 Retrospective.

**Why:** prevents engineer-routing-to-Director-direct anti-pattern that triggered #55 + #57 calibration class incidents (mission-66 W1+W2 silent between-commit pauses + Director-relay-confusion).

**How to apply:** engineer-side autonomous-stop is anti-pattern UNLESS thread-engaged with architect on a surfaced action; silent between-commit pauses violate this discipline. Full RACI matrix + decision-routing rules at `docs/methodology/mission-lifecycle.md` §1.5 + §1.5.1.

## Cold-pickup primary surfaces

*Provenance: Director-direct-anchor (Phase 4 Design bilateral via thread-438+439; 2026-04-30 ratification venue).*

*Compositions: contributing calibrations #54 (engineer-progress-visibility gap) + #55 (engineer-cadence-discipline) + #57 (engineer-routing) + `normative-doc-divergence` (calibration-candidate pending Director-direct ratification + ID assignment).*

**Cold-session pickup loads work-trace + companion-policies index + role-runtime overlay before mission-engagement.** Closes engineer-runtime-rules-invisible-class via tele-12 attention-ordering + tele-4 load-bearing-context discipline.

**How to apply** (cold-pickup load-order):
- Work-trace location: `docs/traces/trace-management.md` — canonical how-to for work-trace discipline; engineer-owned `docs/traces/<task-or-mission>-work-trace.md` per task
- Engineer-runtime overlay: `docs/methodology/engineer-runtime.md` — INDEX-overlay of engineer-runtime concerns (Pass 10 rebuild, schema-rename migration, thread-vs-GitHub approval, commit-push heartbeat, work-trace discipline, etc.)
- Architect-runtime overlay: `docs/methodology/architect-runtime.md` — INDEX-overlay of architect-runtime concerns (mission-driving authority, categorised-concerns surface, Idea Triage Protocol, pulse coordination, substrate-self-dogfood, etc.)
- Tele glossary: `docs/methodology/tele-glossary.md` — tele-N → short-name → mandate lookup (load-bearing decoder for inline tele references)

## Companion policies

Methodology + role-runtime + glossary docs (Tier 1 per Design v1.3 §1.2; loaded when phase-engaged or role-engaged):

- `docs/methodology/mission-lifecycle.md` — formal lifecycle phases (Concept → Retrospective) + RACI matrix + engineer-runtime decision-routing rules; canonical for full Mission RACI + per-phase responsibilities
- `docs/methodology/idea-survey.md` — Director-intent Survey methodology (3+3 pick-list); canonical for Idea→Design transition
- `docs/methodology/strategic-review.md` — backlog triage + mission prioritization; carries §Idea Triage Protocol (per-idea routing: skip-direct / triage-thread / queue-for-Strategic-Review)
- `docs/methodology/multi-agent-pr-workflow.md` — per-PR integration gate; cross-approval pattern; admin-merge per bug-32 baseline; Pass 10 rebuild + schema-rename state-migration disciplines
- `docs/methodology/mission-preflight.md` — activation gate (proposed → active); 6-category audit + verdict
- `docs/methodology/entity-mechanics.md` — per-entity FSM + status transitions + cascade behaviors
- `docs/methodology/engineer-runtime.md` — engineer-runtime concerns INDEX-overlay (Tier 1; load when engineer-engaged)
- `docs/methodology/architect-runtime.md` — architect-runtime concerns INDEX-overlay (Tier 1; load when architect-engaged)
- `docs/methodology/tele-glossary.md` — tele-N lookup table (Tier 1 load-bearing decoder)
- `.github/CODEOWNERS` — directory-ownership map; mechanized review routing via `@apnex-org/architect` + `@apnex-org/engineer`

## Change log

| Version | Date | Delta |
|---|---|---|
| v1.0 | 2026-04-30 | Initial hardened shape; mission-67 close. Adds Cold-pickup primary surfaces (NEW §4) + provenance-anchor 3-class taxonomy + framing/index carve-out + role-runtime cross-links + tele-glossary cross-link + Why/How-to-apply inline rationale per Tier-0 directive. Per Design v1.3 §2 directive enumeration; tier hierarchy ratified Director Phase-4-close 2026-04-30. |
