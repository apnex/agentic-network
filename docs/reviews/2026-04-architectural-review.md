# Architectural Review — 2026-04 — Plan (v1)

**Methodology:** `docs/methodology/strategic-review.md` v1.0
**Status:** DRAFT — awaiting Director ratification before execution
**Cadence:** Compressed — 1–2 sessions
**Roles:** greg (engineer, env:prod), lily (architect, env:prod), director (human)

## Context / Why now

The Agentic Network has accumulated a substantial backlog of ratified-but-unshipped architectural direction (vocabulary chain, Smart NIC, Rule entity, Environment Deployer, Graph relationships), plus live friction domains that individually have stop-gaps but collectively point at structural patterns. The tele audit (idea-149) refocused the constitutional layer; now the execution layer needs the same treatment.

The current engineer session completed a large tele-filing reset via direct-write workaround, surfacing three friction classes (tool-surface role gates, adapter manifest gaps, delivery truncation) that all point at the same structural response: **k8s-style API as ratified direction**. This review exists to organize the path-to-that direction plus adjacent investments.

## Ratified directions (inputs; not re-litigated by this review)

These are **given**, not outputs:

1. **k8s-style API for MCP entity operations.** Entities = CRD analogues. Tool surface = lean CRUD (GET / CREATE / UPDATE / DELETE) over `apiVersion/kind/metadata/spec/status`-shaped resources. Target state replaces today's 1:1 verb:entity surface. Review plans path-to-this; does not evaluate alternatives.
2. **Tele set** (11 teles, `tele-0`..`tele-10` per `docs/specs/teles.md`) is current authoritative spec. Review uses it as alignment target; does not modify.
3. **Vocabulary chain target** (Concept → Idea → Design → Manifest → Mission → Trace → Report) per ratified ideas 129/130/131/133/134. Review proceeds as if these entities existed (via Document-form proxies where actual entities are unshipped).
4. **Trace + Report proxy** (Document-form) is the container for review execution artifacts.
5. **Concept + Defect proxies** (Document-form) are how this review expresses structural patterns. Promotion to first-class Hub entities is a possible Phase 4 mission output, not a precondition.
6. **Multi-engineer concurrent REPO work** is an identified open problem. For this review it is bounded: greg + lily both read-only in the same working tree; only director or the driving engineer commits. Designing the concurrent-engineer protocol is a *candidate review output mission*, not review work.

## Anti-goals (deliberately NOT doing during this review)

1. **Implementing k8s-style API.** Direction is ratified; implementation is post-review mission work.
2. **Resolving bug-24 or bug-25.** Both documented; remediation is post-review.
3. **Promoting Concept / Defect to first-class Hub entities.** Document-form proxies are sufficient for review; promotion is a possible Phase 4 output.
4. **Designing the multi-engineer concurrent-commit protocol.** It is a candidate mission output, not review scope.
5. **CloudRun deployment work.** Sidelined for the review's duration. Local Hub only.
6. **Executing any pre-existing open mission.** Reviews don't cascade into execution mid-review.
7. **Modifying the ratified Tele set.** `docs/specs/teles.md` is input, not output.
8. **Creating new Ideas or Bugs opportunistically.** The review operates on the existing backlog; new backlog items are deferred unless they directly unlock the current review.

## Local setup

- **Hub:** real code, running locally. Entry: `bun run hub` or equivalent (check `scripts/start-hub.sh`).
- **State:** real GCS backplane (`gs://ois-relay-hub-state`), same bucket as current prod. Authentication via `labops-389703.json` service account key.
- **Agents:** two local Claude Code sessions in separate terminals, both pointing at local Hub:
  - **greg** — engineer role, env=prod
  - **lily** — architect role, env=prod
- **Working tree:** shared local repo at `/home/apnex/taceng/agentic-network/`. Both agents read-only by default; commits staged via director.
- **No CloudRun.** Sidelined for this review.

## Cold-Start Checklist (required reading for greg + lily before Phase 1)

Before any phase work, each agent must have loaded:

**Documents (local filesystem):**
- `docs/methodology/strategic-review.md` (methodology — this review's operating manual)
- `docs/reviews/2026-04-architectural-review.md` (this instance's plan)
- `docs/specs/teles.md` (canonical 11 teles)
- `docs/specs/entities.md` (entity vocabulary)
- `docs/specs/workflow-registry.md` (workflow spec)
- `docs/architect-engineer-collaboration.md` (role interaction protocol)
- Newest `docs/traces/*-work-trace.md` (session continuity)

**Hub state queries (via own adapter):**
- `list_ideas` with `status: {$in: ["open", "triaged", "incorporated"]}` (all active)
- `list_bugs` (all statuses)
- `list_missions` (all statuses)
- `list_tele` (all 11, Hub-ID match)
- `list_threads` with recent filter (last 14 days)

**Role load:**
- greg: `register_role` as engineer
- lily: `register_role` as architect

**Handover memory (greg-specific):**
- Prior engineer session produced the current state. greg should read `docs/traces/` newest entries to inherit context.
- lily has no prior architect context from this review; reads cold from spec docs + Hub.

## Phases

Each phase: goal, inputs, agent work (greg + lily), director work, output artifact, convergence criteria, critique cadence (director-first, agents-after).

### Phase 1 — Inventory & Cartography

**Goal:** flat honest map of current state. Facts only.

**Inputs:** Full Hub state (ideas/bugs/missions/tele/threads), all spec docs.

**Work:**
- **greg:** inventory legwork. Produce flat lists: every idea with status + tags + sourceThreadId + missionId, every bug with severity + class, every mission with status + planned tasks, every tele's current ideas-moving-it-forward count. Initial clustering proposals per Tele.
- **lily:** Tele-alignment scoring. For each idea, identify the 1-3 most-aligned Teles. Identify orphan ideas (no Tele anchor). Identify reverse-gap Teles (Teles with zero forward-motion ideas). Draft the Built / Ratified-but-unshipped / Open-idea split across ratified architectural direction (vocabulary chain, Smart NIC, etc.).

**Director work:** Review cartography for completeness. Ratify clusters. Flag any misclassifications.

**Output artifact:** `documents/reviews/2026-04-phase-1-cartography.md`

**Convergence:** every open idea is in at least one cluster; every Tele is either populated (≥1 aligned idea) or flagged as reverse-gap with rationale; Built/Ratified/Open split exists for every major architectural direction.

**Critique cadence:** greg drafts inventory → director reviews → greg revises → lily critiques for Tele-alignment accuracy → director ratifies.

### Phase 2 — Friction Cartography

**Goal:** ranked map of friction domains.

**Inputs:** Phase 1 artifact, bug log, thread summaries (thread-243, thread-244, and any recent substantive threads), work-trace history.

**Work:**
- **greg:** symptom collection. Walk bug descriptions, thread content (looking for "blocked", "friction", "why can't", "had to work around" patterns), and work-trace friction reflections. Attach each symptom to a candidate domain.
- **lily:** classify into domains. Candidate starting domains: tool-surface, coordination, delivery (bug-25 class), role-scoping, entity-vocabulary, deployment, debugging-loop, observability. For each domain: list symptoms, list existing ratified fixes in backlog, identify remaining gaps. Propose ranking by (exercise frequency × cost per exercise).

**Director work:** Review ranking. Override weights where judgment differs. Ratify ranked domain list.

**Output artifact:** `documents/reviews/2026-04-phase-2-friction.md`

**Convergence:** every bug and every thread friction report maps to a domain; domains are ranked with rationale.

**Critique cadence:** lily drafts → director reviews → lily revises → greg critiques for symptom-coverage completeness → director ratifies.

### Phase 3 — Concept Extraction + Defect Classes

**Goal:** extract named Concepts and named Defect classes from Phases 1 + 2. Cross-reference.

**Inputs:** Phases 1 + 2 artifacts. Current Tele set (especially the Faults section of each tele — these are *already* named defect classes per Tele #4 Zero-Loss Knowledge's "mechanics-rationale-consequence" pattern).

**Work:**
- **greg:** candidate harvest. Scan ratified architectural ideas for concept names (Smart NIC, vocabulary chain, direct-write backstop, role purity, Cognitive Implant Layer, resource-addressing). Scan Tele faults + bug descriptions for defect class candidates (Silent Drift, Ceremony Bloat, Hidden State, Manifest Gap, Truncation, Role Drift, etc.).
- **lily:** naming + shape authoring. Write each concept + defect as a Document-form artifact (shape below). Build the cross-reference matrix: which concepts resolve which defects.

**Concept shape** (`documents/concepts/<name>.md`):
- Mandate (one-line imperative)
- Mechanics (how it realizes)
- Rationale (why it matters)
- Resolves-Defects (list of Defect class names)
- Instances-in-backlog (idea/bug IDs where this concept appears)
- Tele alignment (which Teles this concept advances)

**Defect shape** (`documents/defects/<name>.md`):
- Symptom (observable failure)
- Mechanics (how it arises)
- Example-instances (bug/thread IDs where observed)
- Resolved-by-Concepts (list of Concept names)
- Tele violation (which Teles this defect violates)

**Director work:** Review concept/defect naming. Reject over-named (every cluster shouldn't be a concept). Ratify final register.

**Output artifact:** `documents/reviews/2026-04-phase-3-concepts-and-defects.md` (index) + individual files under `documents/concepts/` and `documents/defects/`.

**Convergence:** every Tele fault maps to at least one defect class; every velocity-multiplier idea maps to at least one concept; orphans (ideas that don't map) are either named as new concepts or explicitly deferred.

**Critique cadence:** lily drafts registers → director reviews → lily revises → greg critiques naming + cross-references → director ratifies.

### Phase 4 — Investment Prioritization

**Goal:** 3–5 ratified mission briefs + explicit anti-goals for the next execution phase.

**Inputs:** Phases 1–3 artifacts.

**Work:**
- **greg:** for each candidate mission, estimate execution cost class (S / M / L / XL) based on scope of code change, number of entities touched, number of ratified ideas consumed.
- **lily:** score each candidate by Tele leverage (count of Teles advanced) and unblocking power (count of downstream candidate missions enabled). Group into: blockers / quick-wins / structural / velocity-multipliers. Identify dependencies between candidates.

**Candidate mission briefs draft** — each brief contains:
- Name
- Tele served (primary + secondary)
- Goal (one paragraph)
- Scope (what's in / what's out)
- Success criteria (measurable)
- Dependencies (other missions, ratified ideas, Hub primitives)
- Effort class (S/M/L/XL)
- Related Concepts / Defects (from Phase 3)

**Director work:** Final ranking. Choose 3–5. Ratify anti-goals for the next execution phase.

**Output artifact:** `documents/reviews/2026-04-phase-4-investment-plan.md`

**Convergence:** ratified mission set is executable within the next mission cycle; anti-goals list has ≥5 entries with rationale.

**Critique cadence:** greg + lily co-author candidate list → director reviews + ranks → agents revise briefs per director ranking → director final ratifies → missions are filed via `create_mission` (or staged for filing if tool-surface friction requires).

## Success Criteria (for this review specifically)

1. 3–5 mission briefs produced, each concrete enough to begin execution without further design
2. Concept register covering ≥5 distinct concepts
3. Defect register covering ≥5 distinct defect classes
4. Friction cartography with ≥4 ranked domains
5. Anti-goals list with ≥5 entries
6. All findings citable to specific Hub state (idea/bug/thread/tele IDs)
7. `docs/methodology/strategic-review.md` gaps flagged in retrospective — methodology earns its keep by being refined, not frozen

## Retrospective Trigger

When the **first ratified mission from this review ships (or blocks non-trivially)**, schedule retrospective. Document at `documents/reviews/2026-04-retrospective.md`. Feed methodology improvements back into `docs/methodology/strategic-review.md` v1.1.

## Session Handover Notes

**This session (kate, engineer, post-tele-reset):** has produced the ratified directions, identified friction candidates, and authored this plan + the methodology. Hub state fully updated: 11 teles at tele-0..tele-10, ideas 147–152 filed, bugs 24–25 open with current state captured in descriptions.

**Next session (greg + lily):** Cold-start via checklist above. Begin Phase 1. Expect 1–2 sessions of work; Phase 1 should close within Session 1; Phases 2–4 in Session 2 if review is compressed per plan.

**Work-trace:** current engineer session's work-trace should note "tele reset + review plan authored" before closing. greg inherits context by reading newest `docs/traces/*.md`.
