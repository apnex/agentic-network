# M-Missioncraft-D2-Substrate — Design v5.0 DRAFT SCAFFOLD (Director-direct substrate-design simplification)

**Status**: **v5.0 DRAFT — ARCHITECT-DISPOSITIONS PROPOSED** (was: v5.0 DRAFT SCAFFOLD). Survey-capture of Director-direct 2026-05-12 substrate-design directional disposition + architect-proposed ratification dispositions for §5 open questions (see §10). Architect-Director bilateral or Director-direct ratification of §10 dispositions unblocks W3-new wave issuance.

**Composed from**: mission-78 W0-W2 + W2-extension shipped artifacts (`a4453e9` on `apnex/missioncraft` main) + dogfood discoveries (Fix #1-#4 substrate-asymmetries) + this 2026-05-12 Director-consult conversation.

**Supersedes for mission-78 scope**: the original mission-78 W3-W5 plan (bug-74 fix + IsoEng-removal-only + v1.1.0 ship). Path D2 native-substrate work (Fix #1-#4 at HEAD) STAYS — it generalizes to the simplified architecture and is load-bearing prep.

**Does NOT supersede**: `m-missioncraft-v1-design.md` v4.9 PATCH (mission-77 implementation-target for `@apnex/missioncraft@1.0.x`). v4.x reflects the dual-branch + multi-participant + coord-remote architecture that v5.0 simplifies away. v4.x stays as historical record of v1.0.x shipped state.

---

## §1 Director-direct disposition (2026-05-12 verbatim summary)

From operator-channel conversation 2026-05-12 (architect-Director bilateral substrate-design):

**Architectural target for `@apnex/missioncraft@1.2.0`**:

> Missioncraft will replace the "git dance" between Lily and Greg in production. The Hub / threads / network coordination layer all remain in place. Each agent will be a missioncraft participant on the same machine (current geometry) — though not always same-host long-term.

> We will use `mission/` not `wip/`.

> Missioncraft should commit/push a lock to the shared GIT repo on first writer latch. Any future missions default to read unless overridden.

> No coord-remote — just the repo URL that the reader and writer share.

> Read-write missions commit + push; read-only missions fetch + apply. No "multi-participant mode" toggle. Independent missions; cross-visibility via shared remote.

> Push cadence is config (`on-complete-only` / `every-Ns` / `on-demand`), not mode.

---

## §2 Architecture target (v5.0 vs v4.x delta)

| Concept | v4.x (mission-77 / v1.0.x) | v5.0 (mission-78 re-scoped / v1.2.0) |
|---|---|---|
| Operator workflow | Flow A (`git add` + `git commit` manual) OR Flow B (daemon-wip transparency); ambiguous | **Flow B canonical**; operator never runs git commands; daemon handles all |
| Branches per mission per workspace | TWO: `mission/<id>` (HEAD; operator-commit target) + `wip/<id>` (daemon-snapshot sidecar) | **ONE**: `mission/<id>` (HEAD; daemon-commit target; bypass-HEAD bypass-INDEX) |
| Multi-participant mission | Shared mission entity with `mission.participants[]` (writer + readers); `msn join` semantic | **Independent missions**; each agent owns its own mission; cross-visibility via shared repo URL + branch convention |
| In-flight sync mechanism | `coord-remote` (separate URL from upstream-repo) | **No coord-remote**; daemon pushes to shared repo URL (the upstream-repo); reader fetches from same URL |
| Push trigger | Multi-participant: wip-push to coord-remote at every daemon-tick. Solo-writer: no in-mission push (only at `complete`) | **`pushCadence` mission-config field** ∈ {`on-complete-only`, `every-Ns`, `on-demand`}; no "mode" toggle |
| Writer coordination across missions | None at substrate level; user-discipline | **Writer-lock primitive**: `refs/missioncraft/lock/<scope>` committed/pushed by writer at first-latch; heartbeat TTL refresh; `--force-writer` override |
| Read-only mode | Reader role in multi-participant mission; filesystem 0444; sync via coord-remote | **Read-only mission flag**; reader-daemon Loop B pulls from shared repo URL on source-branch; filesystem 0444 preserved |

---

## §3 Calibrations captured this session

1. **`feedback_substrate_extension_wire_flow_integration_test.md`** confirmed load-bearing — 466/466 unit/integration test net was necessary-but-insufficient at every step; architect-side scenario-02 dogfood was the dispositive gate. Surfaced Fix #3 + Fix #4 + Fix #5-debate + ultimately the substrate-design ambiguity.
2. **Synthetic engine-isolation tests mask SDK-internal-call-pattern defects** (4th retrospective beat). Tests on engine-impl directly don't catch defects in caller's choice of inputs.
3. **Synthetic tests mask DEFECTS-IN-THE-CALLER** (5th retrospective beat). Tests with hand-crafted inputs (e.g. squashCommit with wip-branch) don't catch when production caller passes different inputs (e.g. mission-branch).
4. **Fix-class-recursion pattern** — each substrate-fix exposes the next layer's defect. Pattern observable: Fix #3 (wip-orphan) → Fix #4 (untracked-overwrite) → Fix #5 (publish-headRef) → substrate-design ambiguity (dual-flow). Suggests deeper architectural drift; incremental fixes hit recursion-limit at architectural level.
5. **Engineer-side framing-discipline for Director-consult is load-bearing** (calibration #6 v2). When engineer surfaces "this might be Director-scope" on substrate-design ambiguity, architect MUST verify substrate-target-state-vs-mechanism distinction before autonomously routing around. Architect's earlier autonomous-resolution was over-confident; operator-direct correction needed.
6. **(NEW) Naming clarity at substrate boundaries**. `wip/<id>` was implementation-detail-leak; `mission/<id>` is operator-facing intent. Single-branch model + naming consolidation removes a cognitive load class.

---

## §4 Wave structure (re-scoped mission-78)

| Wave | Status | Notes |
|---|---|---|
| W0 — substrate-detect + msn version | ✓ shipped | Pre-Path-D2 prep |
| W1 — NativeGitEngine canonical | ✓ shipped | Fix #1 (resolveIdentity fallback) + Fix #2 (deleteBranch update-ref) shipped inline |
| W2 — Canonical-switch default | ✓ shipped | gitEngineProviderName 'native-git' default |
| W2-extension — Fix #3 + Fix #4 | ✓ shipped | commitToRef parent-linkage + squashCommit bypass-INDEX. Fix #5 ABANDONED (re-scope moots) |
| W3-new — Single-branch refactor | unissued | daemon commits to `mission/<id>`; drop `wip/<id>` |
| W4-new — Independent missions | unissued | drop `msn join` multi-participant; read-only mission + source-remote |
| W5-new — Drop coord-remote | unissued | single repo URL + push-cadence config |
| W6-new — Writer-lock primitive | unissued | `refs/missioncraft/lock/<scope>` + heartbeat TTL + `--force-writer` override |
| W7-new — IsoEng removal | unissued | drop isomorphic-git npm dep (was original W4) |
| W8-new — Closing audit + v1.2.0 ship | unissued | scenario doc reconciliation + npm publish |

---

## §5 Open questions for Design v5.0 ratification

Before W3-new wave issuance, architect-side resolves:

### §5.1 Writer-lock primitive details
- **Granularity**: per-scope (default Director-intent), per-repo, or per-base-branch? Default scope per Director-disposition; need to verify scope semantics under shared-repo case.
- **Lock-namespace**: `refs/missioncraft/lock/<scope>` is the proposed format. Alternatives: git-tag (`refs/tags/missioncraft-lock-<scope>`), git-notes, special-branch (`missioncraft-lock-<scope>`). Refs are atomic via push-with-lease; tags and branches have other semantics. Refs win on cleanliness.
- **TTL value**: 5 minutes proposed. Trade-off: too short → frequent heartbeat traffic; too long → stale-lock recovery slow. Resolve via Director-direct or default-with-config.
- **Heartbeat cadence**: how often does daemon refresh the lock-ref? Probably TTL / 3 (so 100s for 5min TTL). 
- **Override mechanism**: `--force-writer` flag + warning UX. UX: prompt operator to confirm via stdin? Or just emit stderr warning + proceed? Or require an additional `--i-understand-the-stale-lock-risk` ack?
- **Migration**: how do existing mission-78 sessions (no lock today) interact with the new lock at v1.2.0 release? Probably: locks are mission-config-versioned; pre-v1.2 missions don't acquire locks; v1.2+ missions do.

### §5.2 Push-cadence config defaults
- Default `pushCadence` for solo-writer (no reader expected): `on-complete-only` (matches v4.x solo-writer behavior; no GitHub-noise).
- Default for multi-participant scenarios: `every-Ns` with N = wip-cadence-ms (existing knob; default 30s). Or operator-config.
- Refs-namespace for non-final pushes: `refs/missioncraft/wip/<id>` (custom namespace) vs `refs/heads/mission/<id>` (visible to GitHub-CI). Custom namespace avoids CI/webhook noise but requires git-server-side config; visible namespace gets free git-tooling but pays noise. Resolve at Design ratification.

### §5.3 Read-only mission mechanics
- `msn start --read-only --source-remote <url> --source-branch <ref>`: explicit form
- OR: `msn join <mission-id>` → resolves source-remote + source-branch from Hub mission entity (Hub knows the writer-mission's repo URL + branch name from convention `mission/<missionId>`). This is cleaner.
- Reader-daemon Loop B pull mechanics: today fetches from coord-remote + applies via custom mechanism. Under v5.0: just `git fetch <repo-url> mission/<writer-mission-id>` periodically + `git reset --hard FETCH_HEAD` on the reader's local mission-branch. Need to verify working-tree-update semantics.

### §5.4 Backward compatibility
- mission-77's `@apnex/missioncraft@1.0.x` released as v1.0.0-v1.0.7 (deprecated). v1.1.0 SKIPPED (re-scope). v1.2.0 ships v5.0 architecture.
- Operators on v1.0.x stay on v1.0.x until they upgrade. No mid-mission migration support; missions started on v1.0.x complete on v1.0.x or get abandoned + restarted on v1.2.0.
- Engineer-runtime memory `feedback_operator_never_runs_git_commands.md` — retract or update post-v1.2.0 release.

### §5.5 Reader-mode without coord-remote: details
- Today coord-remote was the bulletin board. Under v5.0: shared repo URL is the bulletin board.
- Writer's daemon pushes `mission/<missionId>` to shared repo at cadence.
- Reader's `msn join <writer-mission-id>` creates reader-mission with source-remote=shared-repo + source-branch=`mission/<writer-mission-id>`.
- Reader's daemon polls + fetches; updates reader's local working tree.
- Push from reader: BLOCKED (read-only flag; daemon doesn't push; CLI refuses).

---

## §6 Implementation impact

Concrete change-set surface (informs W3-new through W8-new waves):

1. **`watcher-entry.ts:170`** — commitToRef target: `refs/heads/wip/<missionId>` → `refs/heads/mission/<missionId>`. Verify HEAD-stability semantics under this change.
2. **`missioncraft.ts:runPublishLoop`** — already squashes from `mission/<id>`; with W3-new, mission-branch actually has content. headRef debate dissolves.
3. **Mission config schema** — add `pushCadence`, `readOnly`, `sourceRemote`, `sourceBranch`, `scope` (if not already present) fields.
4. **Daemon push behavior** — read `pushCadence` from mission-config; behave accordingly.
5. **Lock-acquire primitive** — new mechanism in `msn start` (writer-flow): push `refs/missioncraft/lock/<scope>` with mission-id + agent-id + timestamp.
6. **Lock-release primitive** — in `msn complete` + `msn abandon`: delete `refs/missioncraft/lock/<scope>`.
7. **Lock-heartbeat** — daemon refreshes lock periodically.
8. **`msn join` semantic** — repurpose to: detect writer-mission via Hub; create read-only mission with source-remote+branch derived from writer-mission's repo URL.
9. **Multi-participant code paths** — DELETE `missioncraft.ts:1390+` (coord-remote push) + related reader-mode Loop B coord-remote logic. Replace with simpler shared-repo fetch.
10. **IsoEng** — drop entirely at W7-new (was original W4; cleaner under v5.0).
11. **Scenario docs** — scenario-01 + scenario-02 + scenario-04 (multi-participant) reconciled to v5.0 model.
12. **Tests** — bug-73 lifecycle tests refactored to Flow B; multi-participant tests refactored to independent-mission model; lock-primitive tests added.

---

## §7 Open governance items

- [ ] **Engineer-runtime memory reconciliation** — `feedback_operator_never_runs_git_commands.md` says "operator does only `git add` + `git commit` inside workspace". This is Flow A documentation. Under Flow B canonical, retract or update post-v1.2.0 ship. Defer to W8-new closing-audit.
- [ ] **Scenario doc reconciliation** — scenario-02 doc Step 5 says "operator does NOT run git add/commit/branch" (Flow B). Aligned with v5.0; remains canonical. Scenario-04 (multi-participant) needs substantial rewrite.
- [ ] **calibrations.yaml ledger** — calibrations 4, 5, 6 v2 captured in this design; need formal Director-direct or architect-Director-bilateral filing into `docs/calibrations.yaml` per CLAUDE.md calibration-ledger-discipline.
- [ ] **Survey skill engagement** — Phase 3 Survey methodology (`docs/methodology/idea-survey.md`) normally engaged at Idea→Design transition. Mission-78 re-scoping bypassed formal Survey (Director-direct directional intent given via conversation). Capture this in Phase 10 Retrospective: when is informal-Director-consult acceptable vs full-Survey required?

---

## §8 References

- **Mission entity**: `mission-78` (Hub) — re-scoped 2026-05-12; plannedTasks W0-W2 completed; W3-new through W8-new unissued.
- **Hub threads**:
  - thread-539 W0/W1 (closed)
  - thread-540 W1 cascade (closed)
  - thread-542 W2 (converged)
  - thread-543 W2-extension (closing pending engineer-turn; Fix #5 NOT shipping per re-scope)
  - thread-544 HALT/re-scope (bilateral-converged 2026-05-12T06:07:48Z)
- **apnex/missioncraft `main` SHA**: `a4453e9` (Fix #4 wave-close ship; LAST pushed; v5.0 work begins from here)
- **Architect-side memory**: `project_missioncraft_path_d2_native_substrate.md` (Path D2 directional); this design supersedes/extends for v1.2.0 substrate-design.
- **Engineer-side memory**: `feedback_test_caught_substrate_gap_default_disposition.md` (substrate-gap-vs-test-bug diagnostic; pair with architect-side `feedback_architect_bug_filing_needs_root_cause_verification.md`).
- **Methodology references**: CLAUDE.md v1.1; `docs/methodology/mission-lifecycle.md`; `docs/methodology/idea-survey.md`; `docs/methodology/strategic-review.md`.

---

## §9 Next steps

1. Architect-side flesh-out of §5 open questions → see §10 (dispositions proposed)
2. Director ratification of §10 dispositions (or override individual items per §11)
3. W3-new wave-issuance via Hub task entity (per mission-77 formal-wave-issuance pattern) post-§10/§11 ratification
4. Engineer Greg standby (Fix #5 patch discarded; main at `a4453e9`; 466/466 pass) until W3-new task issues

---

## §10 Architect-proposed ratification dispositions

Architect proposes the following dispositions for §5 open questions. Director ratifies as-is OR overrides individual items per §11 surfaced choices.

### §10.1 Writer-lock primitive

| Question | Architect disposition | Rationale |
|---|---|---|
| **Granularity** | **Per-repo** (one writer-lock per repo URL) | Simplest predictable semantic: "this repo is being written to by one mission at a time." Cross-repo missions acquire lock on each repo. Per-scope adds entity-coupling unnecessarily; per-base-branch adds complexity for negligible production benefit. If parallel-branch-writers become a need, evolve granularity then. |
| **Lock-namespace** | **`refs/missioncraft/lock`** (single ref per repo) | Ref-based (atomic via push-with-lease). Custom namespace (`refs/missioncraft/*`) keeps lock-refs out of `refs/heads/` (no clutter in `git branch` output). Single-ref-per-repo simpler than sub-pathed-by-scope. |
| **Lock-commit content** | Small commit-object with metadata: `{ missionId, agentId, host, principalId, acquiredAt, lastHeartbeatAt }` as commit-message YAML payload; tree pointing at empty-tree | Lock is metadata-only; no working-tree content needed. Commit-message-YAML is git-native + grep-able by external tools. |
| **TTL value** | **300 seconds (5 minutes)** default; operator-config override via mission-config `lockTtlSeconds` | Long enough that brief network blips or daemon GC pauses don't expire locks; short enough that crashed-writer recovery is fast. |
| **Heartbeat cadence** | **TTL / 3 = 100 seconds** default; operator-config override via `lockHeartbeatSeconds` | TTL/3 gives 2x margin for missed heartbeats before expiry. Daemon refreshes lock-commit's `lastHeartbeatAt` + force-pushes to advance the ref. |
| **Override mechanism** | **`--force-writer` flag** to `msn start`. Single-flag form (no `--i-acknowledge-stale-lock-risk` companion); UX: prints stderr warning with stale-lock-holder's agentId + acquiredAt + lastHeartbeat; proceeds. | KISS. If operator passes `--force-writer`, they accept the risk. Multi-flag forms are over-engineered for the rare manual-recovery case. |
| **Stale-lock detection** | When `now - lastHeartbeatAt > TTL`, lock is considered STALE. Implicit-takeover (without `--force-writer`) is BLOCKED by default; operator must use `--force-writer` to acquire the stale lock. | Conservative default avoids ambiguous "did the writer really crash?" race. Explicit operator-intent required. Could relax to auto-takeover post-TTL in future if operator-DX feedback requests. |
| **Migration** | v1.0.x and v1.1.x missions don't acquire/release locks. v1.2.0+ missions acquire on `msn start`. Cross-version interop: mission-config schema-version bumps to `2` at v1.2.0; pre-v2 missions skip lock-acquire; v2 missions push lock-ref. v1-writer + v2-reader-attempting-start: v2 sees no lock → proceeds (no protection against v1 concurrent writer; acceptable since v1 is deprecated). | Schema-version-based gating; no special migration tooling. |

### §10.2 Push-cadence config defaults

| Question | Architect disposition | Rationale |
|---|---|---|
| **Default for read-write missions** | `pushCadence: 'on-complete-only'` (matches v4.x solo-writer behavior; no in-mission noise) | Conservative default. Operators who need reader-visibility set `every-Ns` explicitly. |
| **Default for read-only missions** | `pushCadence: null` / not-applicable (read-only missions never push) | Read-only is push-disabled by definition. |
| **`every-Ns` value range** | Default N=30 seconds (matches existing `wipCadenceMs` default of 30s). Operator-config override via `pushIntervalSeconds`. Minimum N=10 to prevent abuse. | Aligned with existing daemon-tick cadence. |
| **`on-demand` mechanism** | Hub-triggered: external signal via MCP tool (e.g. `request_mission_sync(missionId)`) sets a flag in mission-lockfile; daemon picks it up + pushes once. | Hub becomes the trigger surface; clean MCP-tool surface. Defer impl to W5-new; provision config field at W3-W4. |
| **Refs-namespace for non-final pushes** | **`refs/heads/mission/<id>`** (standard branch namespace; visible to GitHub-tooling) | Accept GitHub-noise cost; mitigations (custom namespace) require git-server-side config which complicates deployment. If noise becomes prohibitive, address in v1.3+. |

### §10.3 Read-only mission mechanics

| Question | Architect disposition | Rationale |
|---|---|---|
| **`msn start --read-only` form** | Support BOTH: <br>**(a)** Explicit: `msn start --read-only --source-remote <url> --source-branch <ref>` (no Hub dependency) <br>**(b)** Hub-resolved: `msn join <writer-mission-id>` → Hub mission entity resolves source-remote (writer-mission's repo URL) + source-branch (`mission/<writer-mission-id>` convention) | (a) covers offline/no-Hub cases; (b) covers normal coordination flow (cleaner operator-DX). |
| **`msn join` repurpose** | YES — repurpose to mean "start a read-only mission tracking the named writer-mission". Preserves operator muscle-memory; deprecates the multi-participant-shared-mission v4.x semantic. Stderr deprecation-note for one minor-version, then removed. | Operator-DX continuity. |
| **Reader-daemon Loop B pull mechanics** | Periodic `git fetch <source-remote> <source-branch>:refs/remotes/source/<source-branch>` + `git reset --hard refs/remotes/source/<source-branch>` on reader's local mission-branch. Working-tree updated by reset. | Standard git mechanism. |
| **Working-tree filesystem mode** | Reader's workspace files mode `0444` (read-only) per v4.x reader-mode invariant (idea-265 spec). Editor refuses writes; filesystem-level enforcement complements CLI-level. | Preserve v4.x guarantee. |
| **Reader-daemon pull cadence** | Mission-config field `pullIntervalSeconds`; default 30s. | Symmetric defaults. |
| **Reader mission terminal-state** | Reader never runs `msn complete`. `msn abandon` is the only terminal verb for read-only. Workspace destroyed at abandon per existing semantic. | Aligned with "read-only never publishes" invariant. |

### §10.4 Backward compatibility

| Question | Architect disposition | Rationale |
|---|---|---|
| **Mission-config schema-version bump** | v1.0.x/v1.1.x = schema-version `1`. v1.2.0 = schema-version `2`. Schema-v2 adds: `readOnly`, `sourceRemote`, `sourceBranch`, `pushCadence`, `pushIntervalSeconds`, `pullIntervalSeconds`, `lockTtlSeconds`, `lockHeartbeatSeconds`. | Standard schema-versioning. |
| **Cross-version interop** | v2-missioncraft refuses to open v1-mission-configs with explicit error "mission-config schema-version 1 unsupported in v1.2.0+; abandon + recreate". No migration tooling. | v1.x is throwaway-demonstrator. |
| **Engineer memory reconciliation** | RETRACT `feedback_operator_never_runs_git_commands.md` post-v1.2.0 closing-audit (W8-new). Replace with `feedback_operator_never_runs_git_commands_v2.md` reflecting Flow B canonical (operator does NOTHING git-related; daemon handles all). | Memory hygiene; audit trail preserved. |
| **`msn join` deprecation timeline** | v1.2.0: repurposed semantic + stderr note. v1.3.0: note removed. v2.0.0: consider rename to `msn read` or `msn watch`, but `join` muscle-memory probably worth preserving long-term. | Minimal disruption. |

### §10.5 Reader-mode without coord-remote (operational details)

| Aspect | Architect disposition |
|---|---|
| **Source-remote URL** | The shared upstream-repo URL (e.g. `https://github.com/apnex/missioncraft.git`). Same URL writer pushes to + reader fetches from. |
| **Source-branch convention** | `mission/<writer-mission-id>` (e.g. `mission/msn-abc123`). |
| **Initial-clone** | Reader's `msn start --read-only` clones upstream-repo (same as writer); checks out source-branch as local `mission/<reader-mission-id>`. |
| **Auth** | Reader needs READ access to upstream. Same auth as normal `git fetch` (gh-CLI / credential-helper / SSH-keys). No additional surface. |
| **Reader picks up post-writer-complete** | Writer's `mission/<id>` branch may be deleted post-publish (existing Step-6 cleanup). Reader's daemon sees fetch-error → mission enters "writer-terminated" lifecycle state (NEW state). Reader can abandon. |

---

## §11 Open items requiring Director-direct ratification

Architect proposes §10 as the ratification baseline. Items below specifically warrant Director-direct review:

- **§10.1 Lock granularity (per-repo)** — alternative is per-scope or per-base-branch. Architect recommends per-repo for v1.2.0 launch simplicity.
- **§10.1 TTL value (300s)** — operator-DX trade-off between fast crash-recovery vs heartbeat-traffic. Operator-config override available.
- **§10.1 Stale-lock takeover policy (`--force-writer` required)** — alternative is auto-takeover post-TTL. Architect recommends conservative (explicit-intent).
- **§10.2 Refs-namespace for non-final pushes (`refs/heads/mission/<id>`)** — accepts GitHub-noise cost.
- **§10.3 `msn join` verb repurposing** — alternative is `msn read` / `msn watch` for semantic-clarity. Architect recommends repurposing for muscle-memory continuity.
- **§10.4 v1→v2 migration policy (no migration tooling)** — alternative is build `msn migrate` verb. Architect recommends no-migration given v1.x's throwaway status.

Director ratifies §10 + §11 dispositions; architect bumps status to **Design v5.0 RATIFIED**; W3-new wave issues to Greg via Hub task entity.

— Lily (architect; agent-40903c59; 2026-05-12T06:10:00Z AEST; §10+§11 added 2026-05-12T06:25:00Z AEST)
