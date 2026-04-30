# Architect Runtime — INDEX-overlay

**Status:** v1.0 (mission-67 close 2026-04-30; first hardened version per Design v1.3 §4.3)
**Tier:** 1 (per `mission-lifecycle.md` v1.2 + Design v1.3 §1.2 tier-by-location rule)
**Scope:** curated table-of-contents of architect-specific runtime concerns — rules architects MUST know at runtime for mission-driving authority + decision-routing + pulse coordination + substrate-self-dogfood evaluation.
**Bound at runtime via:** `CLAUDE.md` §4 Cold-pickup primary surfaces + §5 Companion policies (single-mention-per-side bidirectional invariant per Design v1.3 §3.1)

---

## Purpose

Architect-role cold-pickup navigation surface. Each row is an entry-vector to a canonical source via deep-link; **overlay carries NO normative content** (per `Design v1.3 §4.4` INDEX-only invariant + AG-7 anti-content-fork). Three-hops-max guarantee: `CLAUDE.md` → `architect-runtime.md` → canonical source = max 3 hops to any architect-runtime rule.

## Architect-runtime concerns (INDEX)

| Concern | Why it matters at runtime | Canonical source | Heading anchor |
|---|---|---|---|
| Mission-driving authority | Architect drives mission; engineer surfaces ambiguity through architect (NOT Director-direct); silent autonomous-stop is anti-pattern; #57 closure mechanism | `mission-lifecycle.md` | [§1.5.1 Engineer-runtime decision-moment routing](mission-lifecycle.md#15-1-engineer-runtime-decision-moment-routing-calibration-57-codification) |
| Categorised-concerns surface table | When to surface to Director vs handle architect-autonomously (PR-merge / cross-approval / mission-status flip = autonomous; out-of-scope risks / strategic scope-flex / bug discovery / methodology calibration = surface) | `mission-lifecycle.md` | [§5.1 Categorised-concerns table](mission-lifecycle.md#51-categorised-concerns-table) |
| Idea Triage Protocol | Per-idea routing decision (skip-direct route-(a) / triage-thread route-(b) / queue-for-Strategic-Review route-(c)); 5-criteria checklist for skip-direct | `strategic-review.md` | [§Idea Triage Protocol](strategic-review.md#idea-triage-protocol) |
| Pulse-driven coordination | Mission entity pulses (engineerPulse + architectPulse); per-class default cadence templates; precondition + missed-threshold semantics; ScheduleWakeup boundary | `mission-lifecycle.md` | [§4 Pulse coordination](mission-lifecycle.md#4-pulse-coordination) |
| Substrate-self-dogfood discipline | Substrate vs enrichment evaluation at dispatch time; 5-requirement pattern when applicable; defer-when-reasoned acceptable per substrate-vs-enrichment refinement | `mission-lifecycle.md` | [§6 Substrate-self-dogfood discipline](mission-lifecycle.md#6-substrate-self-dogfood-discipline) |
| Phase 3 Survey methodology | 3+3 pick-list discipline; NO architect pre-picks; Director-Accountable for picks; per-question multi-dim-context interpretation; composite intent envelope bounds Phase 4 Design | `idea-survey.md` | (top of doc; full methodology) |
| Calibration ledger discipline | Architect-authored entries; LLM read-only at Phase 1; query Skill rather than narrative-doc memory recall; defeats LLM-state-fidelity drift class | `CLAUDE.md` (Tier 0; canonical source IS Tier 0 per Design v1.3 §3.1.4 self-reference clause) | [§Calibration ledger discipline](../../CLAUDE.md#calibration-ledger-discipline) |
| Coordinated-upgrade discipline | Substrate-introduction class anti-goal #8; ship-right-solution + atomic-upgrade-all-consumers when consumer pool fully owned; warn-then-reject grace-period anti-pattern | `mission-lifecycle.md` | [§3.1.1 Coordinated upgrade discipline (calibration #48)](mission-lifecycle.md#311-coordinated-upgrade-discipline-calibration-48) |
| Structural-anchor discipline | Schema-validate at canonical write-path NOT only at MCP-entry; sister to coordinated-upgrade; closes bilateral-blind class for Hub-internal emitters per #49 | `mission-lifecycle.md` | [§3.1.2 Structural-anchor-discipline (calibration #49; sister to #48)](mission-lifecycle.md#312-structural-anchor-discipline-calibration-49-sister-to-48) |
| Three-mode retrospective taxonomy | Walkthrough (structural-inflection / substrate-introduction; Director-paced 30-60min) / Summary-review (coordination-primitive-shipment / saga-substrate-completion; ~5-10min Director-time) / Skip (spike / substrate-cleanup-wave / bug-fix-as-mission); architect surfaces mode-pick options at mission-close moment | `mission-lifecycle.md` | [§Phase 10 Retrospective](mission-lifecycle.md#phase-10-retrospective) |

## Cross-references

- **Tier 0:** `CLAUDE.md` §4 Cold-pickup primary surfaces (cross-link in to this overlay) + §5 Companion policies index
- **Tier 1 sister:** `engineer-runtime.md` (parallel-structure for engineer-runtime concerns)
- **Companion docs (Tier 1):** `mission-lifecycle.md` v1.2 + `idea-survey.md` v1.0 + `strategic-review.md` + `multi-agent-pr-workflow.md` v1.0 + `mission-preflight.md` + `entity-mechanics.md`
- **Design source:** `docs/designs/m-claude-md-hardening-design.md` v1.3 §4.3 (this overlay's row enumeration + §4.4 INDEX-only invariant + §4.1 D4 4-column row template + §3.1 single-mention-per-side cross-link discipline)

## Maintenance discipline (per Design v1.3 §4.4 + AG-7)

**INDEX-only invariant:** rule body lives in canonical source; this overlay carries entry-vector + 1-line "why this matters" + heading-anchor only. Future-PR introducing normative content (rule statement, threshold, condition, exception clause) in this overlay's body that exceeds the 4-column INDEX row template OR diverges in normative content from the canonical-source heading body → flag content-fork violation per Design v1.3 §7.1 AG-7.

**Heading-anchor maintenance protection:** broken heading-anchor = visible failure at canonical-doc-edit-time (PR review catches anchor-rename without overlay-update). Future mechanization candidate: doc-graph linting per idea-227 hook scope.
