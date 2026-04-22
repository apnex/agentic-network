# Strategic Architectural Review — Methodology

**Status:** v1.0 (2026-04-21). Treat as engineered component — version, critique, evolve.
**Scope:** reusable template for high-level architectural reviews on the Agentic Network.

## Purpose

A strategic architectural review is a **deliberate, time-boxed pass over the system's current state to re-align trajectory with Tele**. It produces a prioritized investment plan, a ratified set of anti-goals, and a cleaned-up backlog — not code changes. It is the "run slow to run fast" counterweight to mission execution.

## When to use this methodology

- Accumulated backlog of ideas + bugs has outpaced coherent prioritization
- Architectural direction feels ambiguous across the team
- Tele set has recently changed (ratified audit, new concepts)
- Multiple competing target-state architectures are in play
- Velocity of evolution is slowing relative to backlog growth
- Before committing to a large structural mission, to validate it's the right one

## When NOT to use

- For tactical bug triage (use per-bug update flow)
- For single-mission planning (use per-mission Design + Manifest)
- When there are <5 open ideas or <3 active friction domains (insufficient surface for review overhead)
- Mid-mission — do not pause execution for a review; review between missions

## Roles

| Role | Responsibility | Default loading |
|---|---|---|
| **Director** | Ratifies each phase output. Provides strategic judgment. Owns anti-goal list. Owns final mission prioritization. | Human |
| **Engineer agent** | Inventory legwork. Data collection from Hub state. Symptom cataloguing. Cost estimation. | Claude Code session registered as engineer |
| **Architect agent** | Tele-alignment scoring. Naming (Concept / Defect extraction). Dependency mapping. Mission brief structure. | Claude Code session registered as architect |

Director-first critique protocol per phase:
1. Author agent drafts phase artifact
2. Director reviews + annotates
3. Author revises against Director annotations
4. Other agent critiques for logic, completeness, Tele alignment
5. Author integrates critique
6. Director ratifies → phase closes

## Four-Phase Structure

Each phase produces exactly one durable artifact. Phases are sequential; no phase starts before the prior one is ratified.

### Phase 1 — Inventory & Cartography

**Goal:** honest flat map of current state. No prioritization, no interpretation — facts only.

**Inputs:** Hub state (all entity types), spec docs, recent work-traces.

**Sub-outputs bundled into one document:**
- Ideas clustered by Tele alignment (and orphans: ideas with no Tele anchor)
- Built / Ratified-but-unshipped / Open-idea split (reality check on the backlog)
- Bugs clustered by severity + domain
- Missions (active, completed, cancelled)
- Concepts (proto-documented from already-ratified architectural ideas — Smart NIC, vocabulary chain, etc.)
- Tele with zero inbound ideas or zero forward motion (reverse gaps)

**Artifact:** `documents/reviews/<date>-phase-1-cartography.md`

**Convergence:** every open idea appears in at least one cluster; every Tele is either populated or flagged as reverse-gap.

### Phase 2 — Friction Cartography

**Goal:** ranked map of where the system hurts in use.

**Inputs:** Phase 1 artifact, bug log, thread summaries, commit history if relevant.

**Sub-outputs:**
- Friction domains enumeration (tool-surface, coordination, delivery, role-scoping, deployment, etc.)
- For each domain: symptoms (cite specific bugs/threads), existing ratified fixes in backlog, remaining gaps
- Ranking by (exercise frequency × cost per exercise)

**Artifact:** `documents/reviews/<date>-phase-2-friction.md`

**Convergence:** every significant bug and every major in-thread friction report maps to a domain; domains are ranked with rationale.

### Phase 3 — Concept Extraction + Defect Classes

**Goal:** pull implicit patterns out of the backlog into **named Concepts** and **named Defect classes**. Cross-reference which concepts resolve which defect classes.

**Approach:** use lightweight Document-form proxies (`documents/concepts/*.md`, `documents/defects/*.md`) rather than first-class Hub entities. Minimal shape:
- Concept: name, mandate, mechanics, rationale, resolves-defects, instances-in-backlog
- Defect: name, symptom, mechanics, example-instances, resolved-by-concepts

**Inputs:** Phases 1 + 2 artifacts, current Tele set.

**Artifact:** `documents/reviews/<date>-phase-3-concepts-and-defects.md` (or split across `documents/concepts/` + `documents/defects/` directory structures).

**Convergence:** every Tele fault (from the 4-section template) maps to at least one defect class; every velocity-multiplier idea maps to at least one concept. Orphans are either named as new concepts/defects or explicitly deferred.

### Phase 4 — Investment Prioritization

**Goal:** ratified small set of mission briefs + explicit anti-goals.

**Inputs:** Phases 1–3 artifacts.

**Sub-outputs:**
- Mission candidates grouped into: blockers / quick-wins / structural / velocity-multipliers
- Ranking: Tele leverage (how many Teles advanced) × execution cost × unblocking power (how many downstream candidates enabled)
- 3–5 ratified mission briefs, each with: name, Tele served, scope, success criteria, dependencies, estimated effort class (S/M/L/XL)
- Explicit anti-goals: what this review *deliberately did not* commit to, with rationale

**Artifact:** `documents/reviews/<date>-phase-4-investment-plan.md`

**Convergence:** ratified mission set is achievable within the next mission cycle; anti-goals list is non-empty and specific.

## Cold-Start Handover Pattern

Review spans sessions. New sessions must pick up cold. Every review instance document includes a **Cold-Start Checklist** at the top: the exact list of Hub entities + documents + local files the incoming agent must load before any phase work.

Minimum checklist includes:
- Methodology document (this file)
- Instance document
- Current canonical Tele spec
- Entity vocabulary spec
- Workflow-registry spec
- Latest work-trace
- Hub state queries: `list_ideas`, `list_bugs`, `list_missions`, `list_tele`, `list_threads` (recent)

Agent identity loads via `register_role` at session start.

## Artifact Conventions

- All review artifacts authored in 4-section shape where applicable (Mandate / Mechanics / Rationale / Faults) — this IS the Zero-Loss Knowledge Tele applied to its own artifacts
- Document-form concepts and defects are forward-compatible with eventual first-class Hub entities (idea-133 Concept, class-of-Bug Defect) — file structure should mirror expected entity schema
- Each phase artifact cross-links its inputs (phase N-1) and outputs (phase N+1 inputs)

## Success Criteria for a Review

A review is successful if:

1. 3–5 mission briefs produced, each concrete enough to start execution without additional design
2. Concept register + Defect register documents exist, each entry cross-referenced
3. Friction cartography with ranked domains exists
4. Anti-goals list has ≥5 items with rationale
5. All findings tie back to specific Hub state (idea/bug/thread/tele citations)
6. Methodology gaps (places this template failed) captured in retrospective

## Review-of-the-Review (Retrospective)

A review is not complete until it has a retrospective.

**Trigger:** when the first ratified mission output ships (or blocks on something non-trivial).

**Questions the retrospective answers:**
- Did the prioritization hold up once we started executing?
- What did we miss in friction cartography?
- What was easier than predicted? Harder?
- Did Concept + Defect proxies earn their keep?
- What should change in the methodology for next time?

**Artifact:** `documents/reviews/<date>-retrospective.md`. Feed any methodology edits back into this document (versioned).

## Anti-patterns (do not do)

- **Review as backlog dump** — listing every idea with no clustering or ranking
- **Review as design session** — drafting implementations mid-review rather than producing briefs
- **Skipping Phase 2** — jumping from inventory to prioritization without friction analysis loses the reality-check step
- **Unbounded phases** — no convergence criteria means phases never close; agent time compounds into ceremony
- **Concept proliferation** — naming every bug cluster as a "concept" dilutes the vocabulary; Concepts are structural, not symptomatic (symptoms are Defects)
- **Missing anti-goals** — without explicit deferrals, the review's consensus gets re-litigated by the next session
