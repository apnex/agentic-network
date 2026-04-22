# Mission: M-Tele-Retirement-Primitive

**Status:** DRAFT — Phase 4 mission brief (architect-side fields); engineer scope-decomposition in parallel; unified brief ratifiable post cross-review; files as `proposed` on Director final ratification per Phase 4 §10.6 protocol.
**Phase 4 pick:** #3 of 4 (S-class; quick-win).

---

## Name

**M-Tele-Retirement-Primitive** (resolves bug-24)

---

## Tele served

| Tele | Role | Why |
|---|---|---|
| tele-2 Isomorphic Specification | primary | Spec includes tele-lifecycle; retirement primitive completes the tele-entity API surface |
| tele-10 Autopoietic Evolution | secondary | Tele set becomes self-refining; future audits can cleanly retire superseded teles |

**Tele-leverage score: 2.**

---

## Concept-grounding (Phase 3 register)

- **Manifest-as-Master (§2.4)** — completes the tele-entity-lifecycle API; without retirement the tele surface has an incomplete CRUD (create-only, no supersede/retire). Post-mission, tele-lifecycle is isomorphic with other entity FSMs.

---

## Goal

Close bug-24 by adding lifecycle primitives (`supersede_tele`, `retire_tele`) to the tele-entity API surface. Current state: `create_tele` is the only ratified lifecycle tool; there is no supersession or retirement mechanism. Phase 1 tele-rewrite (idea-149) required `scripts/reset-teles.ts` direct-write workaround which cannot be the general pattern for ongoing tele-audit operations.

**Quick-win rationale:** S-class effort, bounded scope, unblocks idea-149-class future audits, eliminates the Phase 1 Direct-Write Backstop dependency for tele-set evolution.

---

## Scope (in / out)

### In scope

- **New MCP tool `supersede_tele(teleId, replacedByTeleId?, reason)`** — marks `teleId` as superseded; optional `replacedByTeleId` links to new tele (if retirement is a rename/split); `reason` documents the supersession rationale. Architect-role only (tele-set modification is Director/architect scope).
- **New MCP tool `retire_tele(teleId, reason)`** — marks `teleId` as retired (no replacement); for teles that are genuinely obsolete without successor. Architect-role only.
- **Tele entity schema extension** — new field `status: "active" | "superseded" | "retired"`, defaulting to `"active"` for existing + new teles; `supersededBy?: teleId` optional for supersession lineage; `retiredAt?: ISO-8601` optional for retirement timestamp.
- **Audit trail preservation** — both tools emit audit entries (`tele_superseded`, `tele_retired`); the superseded/retired teles persist in GCS with status-field update, not deletion (tele-lineage queryable forever).
- **Hub deploy + version bump** — new tools require Hub container redeploy.
- **Spec document update** — `docs/specs/teles.md` gains a §Tele Lifecycle section documenting the API + the active/superseded/retired state model.

### Out of scope

- Backfill-migration of the 5 pre-reset zombie teles — their replacements already active at tele-0..tele-10; zombie entries harmless; retirement cleanup is a separate operational task post-mission.
- `update_tele(teleId, fields)` general update tool — out of scope; teles are intentionally immutable except via the lifecycle verbs defined in this mission.
- Director-only vs architect-only gate policy beyond what other tele-surface tools already enforce (architect-role default; Director can invoke any architect-scope tool).
- Cross-workspace tele-lifecycle coordination (multi-Hub federation; not an active concern).

### Engineer authoring handoff

Engineer scopes the implementation tasks: tool signatures + Hub-side handlers + schema migration (additive field) + tests + spec update. Architect frames the architectural completeness requirements; engineer details implementation steps.

---

## Success criteria

1. **Tools live:** `supersede_tele` + `retire_tele` exposed on Hub via MCP, callable from architect role, audit-traced.
2. **Schema extension:** Tele entity has `status`, optional `supersededBy`, optional `retiredAt` fields; existing 13 teles default to `status: "active"` (idempotent migration — no backfill job, defensive on-read).
3. **idea-149 rerun-clean:** hypothetical rerun of Phase 1 tele-audit produces no zombie entries (retirement primitive replaces the direct-write workaround).
4. **Audit trail preserved:** `tele_superseded` + `tele_retired` audit actions emit on every transition; GCS tele records survive (no deletion).
5. **Hub deploy live:** new tools reachable in production adapter namespace.
6. **Spec updated:** `docs/specs/teles.md` gains §Tele Lifecycle section; `docs/specs/entities.md` audit matrix updated for Tele entity's new fields.

---

## Dependencies

| Prerequisite | Status | Notes |
|---|---|---|
| none | — | Standalone mission; no upstream Phase 4 dependency |

### Enables (downstream)

| Post-review work | How |
|---|---|
| Future tele-audit operations | Retirement/supersession becomes a primitive call, not a direct-write workaround |
| Eventual zombie cleanup of pre-reset teles | Once primitive is live, 5 pre-reset backup teles can be retired cleanly |
| idea-155 AuditEntry typed payload (post-review backlog) | Audit-schema precedent for tele_superseded/tele_retired typed entries |

---

## Effort class

**S** (engineer-authoritative per Phase 4 §10.1).

Rationale: two new tools (near-mechanical — existing tele-policy handlers as template) + schema additive field + audit actions + Hub deploy. Expected 2-3 engineer-days.

---

## Related Concepts / Defects

### Concepts advanced

- §2.4 Manifest-as-Master — completes tele-lifecycle in the Manifest layer

### Defects resolved

- sym-A-024 bug-24 (no retirement primitive for teles; major severity; currently-unaddressed)
- Snowflake Entropy (§3.3 Drift cluster) — partial (tele-lifecycle drift between docs spec and runtime behavior closes)
- Doc-Code Drift (§3.3) — partial (spec `Tele Lifecycle` section becomes isomorphic with runtime API)

---

## Filing metadata

- **Status at file:** `proposed` (Mission FSM default; Director release-gate per Phase 4 §10.6)
- **Document ref:** `docs/reviews/2026-04-phase-4-briefs/m-tele-retirement-primitive.md`
- **Director activation:** requires explicit Director "ready to release" signal
- **Correlation:** Phase 4 winner #3; resolves bug-24

---

*End of M-Tele-Retirement-Primitive architect brief draft. Engineer task-decomposition + tool-implementation scoping at `agent/greg`. Cross-review on thread-254.*
