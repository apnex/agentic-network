# M-Missioncraft-D2-Substrate — Design v5.0 DRAFT REVISED (Director-ratified bundle-revision)

**Status**: **v5.0 DRAFT REVISED** — Director-ratified bundle-revision applied 2026-05-12 (drop writer-lock primitive + revise cadence defaults + two read-only flavors + scope-as-pointer reframing + hybrid CLI verb grammar + no-backward-compat ship discipline). Architect-Director bilateral substrate-design completed via interactive operator-channel; W3-new wave issuance unblocked.

**Composed from**: mission-78 W0-W2 + W2-extension shipped artifacts (`a4453e9` on `apnex/missioncraft` main) + dogfood discoveries (Fix #1-#4 substrate-asymmetries) + 2026-05-12 Director-consult conversation + bundle-revision ratification.

**Supersedes for mission-78 scope**: original mission-78 W3-W5 plan. Path D2 native-substrate work (Fix #1-#4 at HEAD) STAYS — load-bearing prep that generalizes to the simplified architecture.

**Does NOT supersede**: `m-missioncraft-v1-design.md` v4.9 PATCH (mission-77 implementation-target for `@apnex/missioncraft@1.0.x`). v4.x reflects the dual-branch + multi-participant + coord-remote architecture that v5.0 simplifies away. v4.x stays as historical record of v1.0.x shipped state.

---

## §1 Director-direct disposition (2026-05-12 verbatim summary)

From operator-channel conversation 2026-05-12 (architect-Director bilateral substrate-design):

**Architectural target for `@apnex/missioncraft@1.2.0`**:

> Missioncraft will replace the "git dance" between Lily and Greg in production. The Hub / threads / network coordination layer all remain in place. Each agent will be a missioncraft participant on the same machine (current geometry) — though not always same-host long-term.

> We will use `mission/` not `wip/`.

> We probably don't need a lock — it's 1 branch per mission. Branches don't directly collide — that's the point. Single-writer-per-scope enforced at Hub layer.

> No coord-remote — just the repo URL that the reader and writer share.

> Read-write missions commit + push; read-only missions fetch + apply. No "multi-participant mode" toggle. Independent missions; cross-visibility via shared remote.

> Push cadence is config (`on-complete-only` / `every-Ns` / `on-demand`), not mode. Lily creating a markdown → push to github before Greg fetches it is essentially the "on complete" model. A regular interval (30 or 60 seconds) could also work.

> Lily can start a new read-only mission — same scope works because it's just a pointer/template to repos.

> Branch-level "read" syncs auto-close. Main-level reads stay open forever.

> CI is on `main` only — not branches.

> `--start` flag on create verb (decoupled from auto-start for Hub-integration scenarios). Mission-id-first grammar for post-create verbs.

> No backward compat. Perfection only.

---

## §2 Architecture target (v5.0 vs v4.x delta)

| Concept | v4.x (mission-77 / v1.0.x) | v5.0 (mission-78 re-scoped / v1.2.0) |
|---|---|---|
| Operator workflow | Flow A (`git add`+`git commit` manual) OR Flow B (daemon-wip transparency); ambiguous | **Flow B canonical**; operator never runs git commands; daemon handles all |
| Branches per mission per workspace | TWO: `mission/<id>` (HEAD) + `wip/<id>` (daemon sidecar) | **ONE**: `mission/<id>` (HEAD; daemon-commit target via bypass-HEAD/INDEX commitToRef) |
| Multi-participant mission | Shared mission entity with `mission.participants[]`; `msn join` joins shared mission | **Independent missions**; each agent owns its own mission entity; cross-visibility via shared repo URL + branch convention |
| In-flight sync mechanism | `coord-remote` URL (separate from upstream-repo) | **No coord-remote**; daemon pushes to shared repo URL (the upstream-repo); reader fetches from same URL |
| Push/fetch trigger | Multi-participant: wip-push at every daemon-tick. Solo-writer: no in-mission push (only at `complete`) | **`pushCadence` + `pullCadence` mission-config fields** ∈ {`on-complete-only`, `every-Ns`, `on-demand`} (push) / {`every-Ns`, `on-demand`} (pull); no "mode" toggle |
| Reader flavors | One: shared-mission-reader-role (multi-participant) | **Two**: branch-tracker (`msn join`; coupled lifetime to writer-mission) + persistent-tracker (`msn watch`; persistent against long-lived branch) |
| Single-writer-per-scope enforcement | Operator discipline; no substrate enforcement | **Hub-policy at mission-entity layer**: Hub refuses second active writer-mission against same scope. No git-substrate lock primitive. |
| Scope semantic | Mission OWNS scope; tight coupling | **Scope = pointer/template** (repos[] + metadata); multiple missions can reference same scope freely |
| CLI verb grammar | Verb-first universal (`msn start <id>`) | **Hybrid**: global + creation verbs verb-first; mission-targeted verbs id-first (`msn <id> start`) |
| `--start` on creation | Implicit (no opt-out) | **Explicit `--start` flag** opts into immediate daemon spawn; default = configured-but-not-started (Hub-integration friendly) |

---

## §3 Calibrations captured this session

1. **`feedback_substrate_extension_wire_flow_integration_test.md`** confirmed load-bearing — 466/466 unit/integration test net was necessary-but-insufficient at every step; architect-side scenario-02 dogfood was the dispositive gate. Surfaced Fix #3 + Fix #4 + Fix #5-debate + substrate-design ambiguity.
2. **Synthetic engine-isolation tests mask SDK-internal-call-pattern defects** (4th retrospective beat). Tests on engine-impl directly don't catch defects in caller's choice of inputs.
3. **Synthetic tests mask DEFECTS-IN-THE-CALLER** (5th retrospective beat). Tests with hand-crafted inputs don't catch when production caller passes different inputs.
4. **Fix-class-recursion pattern** — each substrate-fix exposes the next layer's defect. Suggests deeper architectural drift; incremental fixes hit recursion-limit at architectural level.
5. **Engineer-side framing-discipline for Director-consult is load-bearing** (calibration #6 v2). When engineer surfaces "this might be Director-scope", architect MUST verify substrate-target-state-vs-mechanism distinction before autonomously routing around. Architect's earlier autonomous-resolution was over-confident; operator-direct correction needed.
6. **Naming clarity at substrate boundaries**. `wip/<id>` was implementation-detail-leak; `mission/<id>` is operator-facing intent. Single-branch model + naming consolidation removes a cognitive load class.
7. **(NEW) Architectural-simplification via Director-progressive-question**. Director's questions ("why do we need both?", "why coord-remote?", "do we need a lock?") each collapsed a layer of accidental complexity. Lock primitive was substrate-level fix for a Hub-level policy concern; once reframed, dissolves. Pattern: when architect proposes substrate primitive, question whether the concern is substrate-layer or coordination-layer.

---

## §4 Wave structure (re-scoped mission-78; 7 waves total post-revision)

| Wave | Status | Notes |
|---|---|---|
| W0 — substrate-detect + msn version | ✓ shipped | Pre-Path-D2 prep |
| W1 — NativeGitEngine canonical | ✓ shipped | Fix #1 (resolveIdentity fallback) + Fix #2 (deleteBranch update-ref) shipped inline |
| W2 — Canonical-switch default | ✓ shipped | gitEngineProviderName 'native-git' default |
| W2-extension — Fix #3 + Fix #4 | ✓ shipped | commitToRef parent-linkage + squashCommit bypass-INDEX. Fix #5 ABANDONED (re-scope moots) |
| **W3-new** — Single-branch refactor | unissued | daemon commits to `mission/<id>`; drop `wip/<id>` |
| **W4-new** — Independent missions + two reader flavors | unissued | drop `msn join` v4.x multi-participant; introduce `msn join` (coupled) + `msn watch` (persistent). **Hub-policy single-writer-per-scope enforcement DEFERRED post-v1.2.0** per Director-direct 2026-05-13 (was wave-component; now forward-pointer — see §10.1 + §13). |
| **W5-new** — Drop coord-remote + push/pull cadence config | unissued | single repo URL + `pushCadence` + `pullCadence` mission-config; delete coord-remote code paths |
| **W6-new** — CLI verb grammar refactor + no-backward-compat | unissued | hybrid grammar (verb-first for global+creation; id-first for mission-targeted); `--start` flag on creation; old verb-first form removed (no dual-form support) |
| **W7-new** — IsoEng removal + isomorphic-git npm dep drop | unissued | was original W4; cleaner under new arch |
| **W8-new** — Closing audit + version bump 1.0.7 → v1.2.0 + tag + scenario doc reconciliation | unissued | pre-publish wire-flow rehearsal protocol gates release |

*(Note: original §4 included a W6-new writer-lock wave. DROPPED in bundle-revision.)*

---

## §5 Architect-proposed dispositions for §10 ratification questions

Original §5 open questions resolved in §10 below. §5 retained for traceability of which questions surfaced; §10 holds dispositions.

---

## §6 Implementation impact

Concrete change-set surface (informs W3-new through W8-new waves):

1. **`watcher-entry.ts:170`** — commitToRef target: `refs/heads/wip/<missionId>` → `refs/heads/mission/<missionId>`. HEAD-stability preserved by bypass-HEAD-bypass-INDEX commitToRef pattern.
2. **`missioncraft.ts:runPublishLoop`** — squashes from `mission/<id>` (already does); with W3-new, mission-branch has content. Fix #5 headRef debate dissolves.
3. **Mission config schema (schema-version bump 1 → 2)** — add: `readOnly` (bool), `sourceMissionId` (str|null, for branch-trackers), `sourceRemote` (str|null) + `sourceBranch` (str|null) (for persistent-trackers), `pushCadence` (enum), `pushIntervalSeconds` (int), `pullCadence` (enum), `pullIntervalSeconds` (int).
4. **Daemon push behavior** — reads `pushCadence` from mission-config; behaves accordingly. Read-only missions don't push.
5. **Hub-policy single-writer-per-scope** — Hub mission-entity create/activate refuses second writer-mission with same scope when one is active.
6. **`msn join` repurpose** — repurposed from v4.x multi-participant to "create branch-tracker reader mission against writer-mission's branch". Operator-DX: `msn join <writer-mission-id>` resolves source-remote + source-branch from Hub.
7. **`msn watch` NEW verb** — creates persistent-tracker reader mission against any long-lived branch. Operator-DX: `msn watch --repo <url> --branch <ref>`.
8. **CLI verb grammar refactor** — global verbs verb-first (`msn list`, `msn help`, `msn version`, etc.); creation verbs verb-first returning `<id>` (`msn create [-f <path>]`, `msn join`, `msn watch`); mission-targeted verbs id-first (`msn <id> start`, `msn <id> complete`, etc.). Parser disambiguates via known-verb-set priority. Slug-validation rejects mission-names matching verb-set. `msn apply` / `msn <id> tick` / `msn <id> resume` DROPPED per perfection-grade revision (`apply` overlapped with `create -f`; `tick` unimplemented; `resume` merged into idempotent `start`).
9. **`--start` flag on creation verbs** — opt-in immediate daemon spawn; default behavior = configured-but-not-started.
10. **Multi-participant code paths** — DELETE `missioncraft.ts:1390+` (coord-remote push) + related reader-mode Loop B coord-remote logic. Replace with simpler shared-repo fetch.
11. **IsoEng removal** at W7-new (was original W4; cleaner under v5.0).
12. **Scenario docs** — scenario-01 + scenario-02 + scenario-04 (multi-participant) reconciled to v5.0 model. Scenario-04 substantial rewrite.
13. **Tests** — bug-73 lifecycle tests refactored to Flow B; multi-participant tests refactored to independent-mission model; reader-mission tests added.

---

## §7 Open governance items

- [ ] **Engineer-runtime memory reconciliation** — `feedback_operator_never_runs_git_commands.md` says "operator does only `git add` + `git commit` inside workspace". Flow A documentation. Under Flow B canonical, retract or update post-v1.2.0 ship. Defer to W8-new closing-audit.
- [ ] **Scenario doc reconciliation** — scenario-02 doc Step 5 says "operator does NOT run git add/commit/branch" (Flow B). Aligned with v5.0; canonical. Scenario-04 (multi-participant) needs substantial rewrite.
- [ ] **calibrations.yaml ledger** — calibrations 4, 5, 6 v2, 7 captured in this design; need formal Director-direct or architect-Director-bilateral filing into `docs/calibrations.yaml` per CLAUDE.md calibration-ledger-discipline.
- [ ] **Phase 10 Retrospective beat**: when is informal-Director-consult acceptable vs full-Survey required? Mission-78 re-scoping bypassed formal Survey methodology; directional intent captured via interactive conversation. Worth a methodology beat.
- [ ] **CI workflow scope review** — confirm `.github/workflows/` for apnex/missioncraft is `on: push: branches: [main]` only (per Director-direct clarification). Any `pull_request` triggers OK; arbitrary-branch `push` triggers would burn CI on every daemon-tick. Architect-side verify pre-W5-new.

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
- **Engineer-side memory**: `feedback_test_caught_substrate_gap_default_disposition.md` (substrate-gap-vs-test-bug diagnostic).
- **Methodology references**: CLAUDE.md v1.1; `docs/methodology/mission-lifecycle.md`; `docs/methodology/idea-survey.md`; `docs/methodology/strategic-review.md`.

---

## §9 Next steps

1. Director-direct ratification of §10 + §11 dispositions (this revision)
2. Architect updates mission-78 entity plannedTasks to reflect 7-wave structure (W6-new writer-lock DROPPED)
3. W3-new wave-issuance via Hub task entity (per mission-77 formal-wave-issuance pattern)
4. Engineer Greg standby (Fix #5 patch discarded; main at `a4453e9`; 466/466 pass) until W3-new task issues

---

## §10 Architect-proposed ratification dispositions (Director-ratified bundle-revision applied)

### §10.1 Single-writer-per-scope coordination (was: writer-lock primitive)

**Disposition**: NO git-substrate lock primitive. Single-writer-per-scope ratified as **Hub-policy** semantic (NOT substrate primitive).

**v1.2.0 ship-scope** (Director-direct 2026-05-13 amendment):
- **Hub-integration mechanism DEFERRED post-v1.2.0**. v1.2.0 ships standalone-capable with **operator-discipline** for single-writer-per-scope (documented in operator-DX); no Hub-API call from `msn create`; missioncraft remains substrate-only at v1.2.0.
- W4-new wave-component for Hub-policy enforcement (originally slice (iv)) **DROPPED** from mission-78 scope. W4-new now ships 7 slices: schema-v2 + `msn watch` + `msn join` repurpose + Reader-daemon Loop B + multi-repo scope-inheritance + transparency-gate test + wave-close.
- Director-direct verbatim: "Hub means the Mission Hub (our agentic network and router/policyengine — separate to missioncraft). We don't need to perform integration with the Hub just yet... This integration will require careful end-to-end design once the full primitives have been tested."

**Rationale for "no substrate-lock" (still stands per Director-direct 2026-05-12)**:
- Each mission has its own branch (`mission/<id>`); branches don't collide at the git level
- The lock was substrate-level fix for a coordination concern that belongs at the Hub layer
- Hub mission-entity already tracks active/proposed/completed/abandoned lifecycle; adding "single active writer-mission per scope" is a natural extension
- Drops complexity: no lock-ref, no heartbeat, no TTL, no `--force-writer` flag, no stale-lock-recovery semantic

**Forward-pointer (post-v1.2.0 mission)**: Hub-policy mechanism design + integration end-to-end:
- `create_mission` Hub-API extension with `scope` and `readOnly: false` checks (refuse second active writer-mission against same scope)
- Stale-detection via cognitive-TTL → "writer-orphaned" mission state → operators take over via `msn abandon` + new `msn create`
- missioncraft `msn create` ↔ Hub MCP integration shape (Hub-coupling boundary; opt-in or required)
- Gated on v1.2.0 primitives (single-branch + readers) being proven via dogfood + operator usage

Filed as forward-pointer in §13. W6-new wave (writer-lock) DROPPED from mission-78 wave structure (still stands).

### §10.2 Push/pull cadence config

**Disposition (revised post-Director-clarification: CI-on-main-only mitigates noise concern)**:

| Field | Options | Default |
|---|---|---|
| `pushCadence` | `every-Ns` / `on-complete-only` / `on-demand` | `every-Ns` |
| `pushIntervalSeconds` | int ≥10 | `60` |
| `pullCadence` | `every-Ns` / `on-demand` | `every-Ns` |
| `pullIntervalSeconds` | int ≥5 | `30` |

**Asymmetric defaults**: reader fetches 2x more frequently than writer pushes (60s push + 30s pull = ~30-90s end-to-end visibility lag; reader catches new pushes promptly).

**Refs-namespace for non-final pushes**: standard `refs/heads/mission/<id>` (visible to git-tooling). Acceptable noise cost since CI is `on: push: branches: [main]` only. Custom namespace not needed for v1.2.0.

**Operator-override scenarios**:
- Solo-writer (no observer expected): `pushCadence: on-complete-only` for minimal noise
- Hub-integration (signal-triggered sync): `pushCadence: on-demand` via MCP tool

### §10.3 Read-only mission mechanics (two flavors)

**Disposition**: Two distinct verbs for two distinct flavors of read-only mission with different lifecycle semantics:

**Flavor A — Branch-tracker (`msn join <writer-mission-id>`)**:
- Tracks `mission/<writer-mission-id>` on the source-remote (inherited from writer-mission's repo URL via Hub)
- Lifecycle: COUPLED to source-branch existence
- Auto-detection of writer-terminal: reader-daemon's fetch fails (branch deleted) OR branch-tip stale-detected (no advance in T seconds + writer's Hub-pulse missed) → mission transitions to `writer-terminated` state
- Operator action at writer-terminal: `msn <reader-id> abandon` to clean up
- Multi-repo: inherits writer-mission's entire scope (all repos, all branches); replicates per-repo workspaces in reader's tree

**Flavor B — Persistent-tracker (`msn watch --repo <url> --branch <ref>`)**:
- Tracks an arbitrary long-lived branch (typically `main`, but any ref works)
- Lifecycle: PERSISTENT
- Stays `active` indefinitely; only terminal via operator-explicit `msn <id> abandon`
- Use case: long-running observer mission; "watching the project history"; only sees PR-merged work
- Multi-repo: operator-supplied `--repo` (could be repeated for multi-repo watch; deferred to W5-new)

**Reader-daemon Loop B pull mechanics** (both flavors):
- Periodic `git fetch <source-remote> <source-branch>:refs/remotes/source/<source-branch>` at `pullIntervalSeconds` cadence
- `git reset --hard refs/remotes/source/<source-branch>` on reader's local mission-branch
- Working-tree updates via reset
- Files filesystem-mode `0444` (read-only) per v4.x reader-mode invariant

**Working-tree updates on writer-complete**: writer's squashCommit force-pushes mission-branch (squash replaces wip-history). Reader's fetch sees force-update; `git reset --hard` handles it normally; reader's workspace shows the squashed terminal state.

**Reader terminal verb**: only `msn <id> abandon`. No `msn complete` for readers (read-only missions never publish).

### §10.4 Backward compatibility (substrate-config schema)

| Question | Architect disposition | Rationale |
|---|---|---|
| **Mission-config schema-version bump** | v1.0.x/v1.1.x = schema-version `1`. v1.2.0 = schema-version `2`. New fields per §6 implementation impact #3. | Standard schema-versioning. |
| **Cross-version interop** | v2-missioncraft refuses to open v1-mission-configs with explicit error "mission-config schema-version 1 unsupported in v1.2.0+; abandon + recreate". No migration tooling. | v1.x is throwaway-demonstrator. |
| **Engineer memory reconciliation** | RETRACT `feedback_operator_never_runs_git_commands.md` post-v1.2.0 closing-audit (W8-new). Replace with `feedback_operator_never_runs_git_commands_v2.md` reflecting Flow B canonical. | Memory hygiene. |

### §10.5 Reader-mode operational details (no coord-remote)

| Aspect | Architect disposition |
|---|---|
| **Source-remote URL** (branch-tracker) | Inherited from writer-mission's Hub entity (writer's repo URL); reader's Hub `msn join` query resolves it |
| **Source-remote URL** (persistent-tracker) | Operator-supplied via `--repo` flag |
| **Source-branch convention** (branch-tracker) | `mission/<writer-mission-id>` (e.g. `mission/msn-abc123`) |
| **Source-branch** (persistent-tracker) | Operator-supplied via `--branch` flag (typically `main`) |
| **Initial-clone** | Reader's mission creation clones source-remote; checks out source-branch as local `mission/<reader-mission-id>` |
| **Auth** | Reader needs READ access to source-remote. Same auth as normal `git fetch` (gh-CLI / credential-helper / SSH-keys). |

### §10.6 CLI verb grammar (NEW)

**Disposition**: Hybrid grammar — global + creation verbs are verb-first; mission-targeted verbs are id-first.

**Three verb categories**:

**Global verbs (verb-first; no `<id>` needed)**:
```
msn list [--status <s>] [--output json|yaml]
msn help [<verb>]
msn version
msn shell-init bash|zsh|fish
msn config get|set <key> [<value>]
msn scope create|list|show|update|delete [args]
```

**Creation verbs (verb-first; return new `<id>` to stdout)**:
```
msn create [--start] [--repo <url>] [--scope <id>] [--name <name>] [-f <path>]
msn join [--start] <writer-mission-id>
msn watch [--start] --repo <url> --branch <ref>
```

Note: `msn create -f <path>` is the only YAML-driven creation path. No separate `msn apply` verb (dropped per perfection-grade revision — single creation surface).

**Mission-targeted verbs (id-first; act on existing `<id>`)**:
```
msn <id> start                # idempotent: spawns daemon if not running; no-op if already running
msn <id> complete "<msg>"
msn <id> abandon ["<msg>"]
msn <id> show
msn <id> workspace [<repo>]
msn <id> cd [<repo>]
msn <id> update <sub-verb> <args>
```

Note: `msn <id> tick` and `msn <id> resume` DROPPED from v1.2.0 spec (tick unimplemented; resume merged into idempotent start). `msn <id> tick` candidate for v1.3+ if explicit-cadence-tick demand surfaces.

**Parser disambiguation**:
1. First-arg in known-verb-set (list/help/version/shell-init/config/scope/create/join/watch) → global or creation verb-first
2. First-arg matches mission-id pattern (`msn-*` prefix) → id-first; second-arg must be a mission-action verb
3. First-arg matches a known mission name (slug) → resolve to mission-id; id-first
4. Else: error

**Slug-validation guard**: at `msn create --name <slug>` time, reject slug-names matching the known-verb-set (`list`, `help`, `version`, `shell-init`, `config`, `scope`, `create`, `join`, `watch`, plus mission-action verbs `start`, `complete`, `abandon`, `show`, `workspace`, `cd`, `update`). Eliminates the slug-vs-verb collision footgun class at the source.

**`--start` flag**: opts into immediate daemon spawn on creation. Default behavior = `configured` lifecycle (no daemon). Applies to `msn create`, `msn join`, `msn watch`.

**No backward compat**: v1.2.0 ships clean grammar. Old verb-first form (`msn start <id>`, `msn show <id>`, etc.) REMOVED entirely. No dual-form parsing, no deprecation timeline. Operators learn new shape at v1.2.0 release.

---

## §11 Surfaced items for Director-direct ratification

Director ratifies §10 dispositions; items below specifically warrant ratification confirmation:

- **§10.1 Hub-mediated single-writer-per-scope policy** — alternative was git-substrate lock primitive. Architect-Director bilateral confirmed Hub-policy (no substrate lock). RATIFIED.
- **§10.2 Push/pull cadence defaults (`every-60s` push + `every-30s` pull)** — alternative was `on-complete-only` default. Director clarified CI-on-main-only mitigates noise; `every-Ns` default accepted. RATIFIED.
- **§10.3 Two read-only flavors (`join` + `watch`)** — alternatives were single verb with flags OR unified universal-create. Director confirmed verb-distinct shape is operator-DX clearer + matches lifecycle-distinction. RATIFIED.
- **§10.4 No migration tooling** — alternative was build `msn migrate`. RATIFIED (v1.x throwaway).
- **§10.5 Reader-mode using shared upstream-repo URL** — alternative was retain coord-remote. RATIFIED (dropped coord-remote).
- **§10.6 Hybrid CLI verb grammar + `--start` flag + no backward-compat** — alternatives were universal-create / two-verbs / dual-form with deprecation. Director ratified: hybrid grammar + clean ship ("perfection only"). RATIFIED.
- **§10.6 perfection-grade revisions** — 4 warts surfaced + resolved against the perfection standard: (a) dropped `msn apply` (overlapped with `msn create -f`; single creation surface); (b) dropped `msn <id> tick` from v1.2.0 spec (unimplemented; documentation-lie risk); (c) dropped `msn <id> resume` (merged into idempotent `msn <id> start`); (d) added slug-validation guard rejecting verb-collision-prone names at create-time. RATIFIED.

**Scope-as-pointer reframing**: scope is logical handle to (repos[], metadata); multiple missions reference same scope freely. Single-writer-per-scope is Hub-policy, not scope-property. RATIFIED via §10.1 + Director-clarification.

Director ratifies → architect updates mission-78 entity plannedTasks (drop W6-new; renumber); W3-new wave issues via Hub task entity post-ratification.

---

## §12 No-backward-compat ship discipline

Per Director-direct: **"No backward compat. Perfection only."**

**Applies to**:
- CLI verb grammar (§10.6): v1.2.0 ships hybrid grammar; v1.0.x/v1.1.x verb-first form REMOVED. No dual-form parsing during transition.
- Mission-config schema (§10.4): v2 schema; v1 mission-configs explicitly refused with operator-error.
- Reader-mode (§10.3 + §10.5): coord-remote code paths DELETED. No coord-remote-compat shim.
- Branch model (§2): `wip/<id>` namespace DELETED. No wip-branch in v1.2.0.

**Does NOT apply to**:
- mission-78 W0-W2 + W2-extension shipped artifacts (Fix #1-#4 at `a4453e9`) — these generalize to v5.0 architecture and stay on `main`
- Path D2 native-substrate work (NativeGitEngine canonical; argv-only) — load-bearing prep that survives

**Operator-DX implications**:
- v1.0.x operators upgrading to v1.2.0 learn new CLI grammar
- Scripts using `msn start <id>` form must be rewritten
- Mission configs in v1.x format abandoned + recreated under v2

**Architect-side ship discipline**:
- W6-new (CLI grammar refactor) ships the new grammar cleanly; no compat-shim code
- W8-new (closing audit) verifies no v1.x compat code remains
- v1.2.0 release notes prominently feature the breaking changes

---

## §13 Forward-pointers (post-v1.2.0)

Director-signaled directions for post-v1.2.0 substrate evolution. Captured here to avoid v5.0 design accidentally locking out these futures; out-of-scope for mission-78.

**Hub-missioncraft integration end-to-end design** (Director-direct 2026-05-13; NEW — was originally W4-new slice (iv) in-scope; now deferred):
- Hub-policy single-writer-per-scope enforcement at agentic-network Mission Hub layer (the router/policyengine; separate codebase from missioncraft)
- `create_mission` Hub-API extension with `scope` + `readOnly` parameters + policy check (refuse second active writer-mission against same scope) + cognitive-TTL stale-detection ("writer-orphaned" mission state)
- missioncraft ↔ Hub integration boundary design: where does `msn create` invoke Hub? Standalone-fallback semantics? Hub-coupling opt-in vs required?
- Operator-DX implications: Hub-running prerequisite for writer-missions? Reader-missions remain standalone?
- **Director-direct rationale**: "This integration will require careful end-to-end design once the full primitives have been tested." — i.e., gated on v1.2.0 primitives (single-branch + readers) being proven via dogfood + operator usage before integration design starts.
- Belongs in mission-79+ (post-v1.2.0); v1.2.0 ships standalone-capable with operator-discipline for single-writer-per-scope.

**Smart-attach mechanisms**:
- **Hub-driven auto-discovery**: Hub mission-entity broadcasts/publishes "active writer-missions per scope"; agents subscribe + auto-join relevant missions without operator-explicit `msn join <id>` invocation
- **Agent-default main-watchers**: agents implicitly maintain `msn watch --branch main` per repo at startup (no operator action needed); persistent-tracker is the default "background observability" mode for all agents
- **Mission auto-templates**: scope or repo-defaults trigger auto-creation of standard mission-shapes (e.g. "every read-write mission against `apnex/missioncraft` auto-spawns a paired Lily reader")

**Repo-introspection discovery**:
- `msn discover --repo <url>` candidate verb: queries the repo for `refs/heads/mission/*` branches; lists active writer-missions discoverable from the wire
- Doesn't require Hub coordination; just `git ls-remote` introspection
- Useful for "what's happening in this repo?" operator-DX

**Mission-template / scope-template**:
- Reusable scope-templates (e.g. "agentic-network-coordination" scope-template defines repos + default pushCadence + default reader-attachments)
- `msn create --from-template <template-id>` instantiates a mission from template

**v5.0 architecture supports all of these naturally** without lockouts:
- Hub-driven auto-discovery is just Hub-API automation against existing mission-entity create/join semantics
- Auto-attached main-watchers are policy at agent-init, not substrate change
- `msn discover` is a CLI-feature against existing branch-namespace convention (`mission/*`)
- Mission-templates are YAML-config defaults; substrate already supports `msn create -f <path>` from arbitrary YAML

These belong in mission-79+ (post-v1.2.0). Roadmap-marker, not v5.0 scope.

---

— Lily (architect; agent-40903c59)
- Original SCAFFOLD: 2026-05-12T06:10:00Z AEST
- §10+§11 added: 2026-05-12T06:25:00Z AEST
- Bundle-revision applied: 2026-05-12T06:50:00Z AEST (drop writer-lock + cadence revised + two read-only flavors + scope-as-pointer + hybrid CLI grammar + no-backward-compat ship discipline)
- Perfection-grade revisions + §13 forward-pointers added: 2026-05-12T07:10:00Z AEST (drop msn-apply + drop tick + drop resume / idempotent-start + add slug-validation + capture post-v1.2.0 smart-attach + auto-discovery directions)
- W4-new slice (iv) Hub-policy enforcement DEFERRED post-v1.2.0: 2026-05-13 AEST (Director-direct surfaced via thread-546 architect-consult; §4 wave-content amended + §10.1 disposition revised + §13 forward-pointer added; v1.2.0 ships standalone-capable with operator-discipline for single-writer-per-scope; Hub-missioncraft-integration end-to-end design gated on v1.2.0 primitives being proven)
