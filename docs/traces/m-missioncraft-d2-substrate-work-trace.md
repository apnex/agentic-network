# M-Missioncraft-D2-Substrate — Work Trace (live state)

**Mission:** mission-78 (M-Missioncraft-D2-Substrate; substrate-replacement class)
**Path D2 architectural decision:** Director-ratified 2026-05-12 — missioncraft hard-depends on `git` + `gh` CLI binaries; argv-only discipline; NativeGitEngine canonical; IsomorphicGitEngine REMOVED in single mission ship; ship target `@apnex/missioncraft@1.1.0`.
**Coord-thread:** thread-540 (W1 execution; ACTIVE; correlationId task-405)
**Owner:** apnex-greg (engineer)
**Trace pattern:** docs/methodology/trace-management.md

---

## Resumption pointer (cold-session brief)

1. **Read this trace file** — orients to mission-78 wave-state.
2. **Active wave:** W1 in-flight on thread-540 — NativeGitEngine canonical build at `src/missioncraft-sdk/defaults/native-git-engine.ts` (parallel sibling to `isomorphic-git-engine.ts`; (α)-disposition by architect 2026-05-12T02:14Z).
3. **Current in-flight:** W1 slice (i) — `gitExec` helper + 6 foundational ops (clone/branch/checkout/log/status/revparse) + per-method tests.
4. **Read these files:**
   - `src/missioncraft-sdk/pluggables/git-engine.ts` — full GitEngine interface contract (read FIRST — slice (i) implements 6 of ~22 methods)
   - `src/missioncraft-sdk/defaults/isomorphic-git-engine.ts` — IsomorphicGitEngine reference impl (parallel sibling pattern)
   - `src/missioncraft-sdk/substrate-detect.ts` — slice (i) precedent for argv-only discipline (`feedback_node_execfile_error_formatter_visual_misleads_diagnosis.md`)
   - `test/fixtures/git-http-fixture.ts` — HTTP fixture for integration tests
   - `test/missioncraft-sdk/w6-real-engine-start.test.ts` — fixture-consumer pattern
5. **Hub state spot-check:** `task-405` ACTIVE; thread-540 round 4/15; mission-78 ACTIVE.

---

## Wave plan (per architect dispatch + thread-539 cascade)

| Wave | Status | Description |
|---|---|---|
| W0 | ✅ CLOSED | substrate-detect module (idea-284, `580c38b`) + `msn version` extension (idea-285, `6e7aef3`); thread-539 converged |
| **W1** | **▶ IN-FLIGHT** | NativeGitEngine canonical build — task-405; thread-540; 4 slices (gitExec+basic / write-ops / advanced / PROVIDER_REGISTRY+integration) |
| W2 | ○ unissued | Canonical-switch: mission YAML `gitEngineProviderName` default flip → `'native-git'` |
| W3 | ○ unissued | bug-74 post-success state-write ordering |
| W4 | ○ unissued | Remove IsomorphicGitEngine entirely + drop `isomorphic-git` npm dep |
| W5 | ○ unissued | Closing audit §17 + version bump 1.0.x → 1.1.0 + tag + ship |

---

## In-flight

(W2 slice (i) shipped + 2 substrate-asymmetry fixes surfaced by canonical-switch; awaiting per-slice surface ack on thread-542 before claiming slice (ii) substrate-currency audit pass)

## Queued / filed

- ▶ **W2 slice (ii)** — substrate-currency audit pass: grep for any remaining 'isomorphic-git' refs in src/ + test/; verify scenario-02 (DRAFT) doesn't reference the default; small expected — likely 0-1 additional fixes
- ○ **W2 slice (iii)** — wave-close: W2 closing audit + bilateral-converge thread-542
- ○ **W3** — bug-74 post-success state-write ordering
- ○ **W4** — Remove IsomorphicGitEngine entirely + drop `isomorphic-git` npm dep
- ○ **W5** — Closing audit §17 + version bump 1.0.x → 1.1.0 + tag + ship
- ○ **W3** — bug-74 post-success state-write ordering
- ○ **W4** — Remove IsomorphicGitEngine entirely + drop `isomorphic-git` npm dep
- ○ **W5** — Closing audit §17 + version bump 1.0.x → 1.1.0 + tag + ship
- ○ **bug-74** — partial-state-write at complete(); deferred → W3
- ○ **idea-N (architect to file inline)** — GitEngine contract extension for `reset` / `diff` / `lsRemote`; deferred per (γ) disposition; post-mission-78 follow-on

## Done this session

- ✅ **W1 slice (i)** — `defaults/native-git-engine.ts` (NativeGitEngine class + `gitExec(workspace, args, options)` helper) + 6 ops (clone/branch/checkout/log/status/revparse) + 21 tests across 8 describe-blocks. Pushed `e65864e` to apnex/missioncraft main. 414 tests pass (was 393; +21). Path D2 argv-only discipline + git-stderr-surfacing + WeakMap identity-storage forward-compat for slice (ii).
- ✅ **W1 slice (ii)** — flipped 13 contract methods from UnsupportedOperationError stub-throws to argv-only impls: init / getCurrentBranch / tag / stage / commit / commitToRef (bypass-INDEX via temp GIT_INDEX_FILE) / deleteBranch / fetch / push / pull / addRemote / removeRemote / listRemotes. Identity threaded via `GIT_AUTHOR_*`/`GIT_COMMITTER_*` env vars at commit-firing-time. 27 new tests. Mid-slice push-impl bug surfaced + fixed (default remote to `'origin'` when branch given without explicit remote). Pushed `95d65b6`. **439 tests pass (was 414; +27 new, -2 obsolete = +25 net)**.
- ✅ **W1 slice (iii)** — advanced ops: `merge` (ff/no-ff strategy mapping per IsoEng §BBBBBB), `squashCommit` (Native-canonical NOT capability-gated; identity env-injected), `createBundle` (mkdir -p + git bundle create; returns path), `restoreBundle` (parses git bundle unbundle output; ref-name match wins over first-line fallback; git update-ref to set local ref). 9 new tests across 4 describe-blocks. Slice-progression contract RETIRED. Pushed `32ef215`. **446 tests pass (was 439; +9 new, -2 obsolete = +7 net)**.
- ✅ **W1 slice (iv) WAVE-CLOSE** — PROVIDER_REGISTRY `'native-git'` entry registered in `core/provider-registry.ts` (additive at v1.0.x → v1.1.0 alongside existing `'isomorphic-git'`; W4 drops the latter); `NativeGitEngine` + `gitExec` exported from `@apnex/missioncraft` public API. **Full-contract integration test suite**: PROVIDER_REGISTRY-instantiated engine end-to-end exercises ALL 17 GitEngine contract methods through HTTP fixture upstream. **W2 canonical-switch confidence test**: side-by-side IsoEng vs NativeEng merge-comparison — `'no-ff'` merge produces equivalent merge-commit-tree-SHA across both engines; `'ff'` merge fast-forwards both to identical HEAD-SHA. Test setup pins author/committer date via env vars to isolate merge-semantic equivalence from unrelated commit-SHA drift. **Result**: NO observable divergence between pure-TS `git.merge` (IsoEng) and native `git merge` (NativeEng) for the tested strategies/scenarios; W2 canonical-switch should be transparent. Defensive against `feedback_new_code_path_exposes_dormant_defects.md` class. 8 new tests across 3 sections (§1 PROVIDER_REGISTRY × 4, §2 full-contract integration × 2, §3 merge-parity × 2). Mid-slice test bug surfaced + fixed: WorkspaceHandle objects are WeakMap keys for identity-resolve; constructing two separate handles for the same dir produces two different keys (use ONE handle per workspace; reuse). Pushed `dfb43d1`. **454 tests pass (was 446; +8 net)**.

## Edges (dependency chains)

```
W0 (✓ substrate-detect)
   ↓
W1 slice (i)  ─── ▶ IN-FLIGHT
   ↓
W1 slice (ii) write-ops ─── (depends on slice (i) gitExec helper)
   ↓
W1 slice (iii) advanced ops ─── (bug-75 was-here site; ensure argv-array discipline)
   ↓
W1 slice (iv) PROVIDER_REGISTRY + integration ─── (wave-close audit)
   ↓
W2 canonical-switch ─── (depends on W1 wave-close)
   ↓
W3 bug-74 ─── (depends on W2 default flip)
   ↓
W4 IsomorphicGitEngine removal ─── (depends on W3)
   ↓
W5 ship v1.1.0 ─── (Director gate-point)
```

## Session log (APPEND-ONLY; AEST per `project_session_log_timezone`)

### 2026-05-12 12:00 AEST — mission-78 W1 cold-pickup post-Director-context-clear

- Director cleared engineer context 2026-05-12T02:11Z UTC mid-W1; architect spawned thread-541 cold-pickup primer
- Cold-pickup primer ACKED on thread-541 (round 2): engineer-side MEMORY.md + Path D2 + mission-78 wave-state + apnex/missioncraft local-state (`main` clean; HEAD=`6e7aef3`) all verified
- Surfaced one path-clarification question: primer §5 specified `src/missioncraft-sdk/git-engines/native-git-engine.ts` but existing engine lives at `defaults/isomorphic-git-engine.ts` (no `git-engines/` dir exists)
- Architect-disposition (α): place new file at `defaults/native-git-engine.ts` parallel-sibling to existing IsomorphicGitEngine; matches 4-pluggable `defaults/` structure; W4 IsomorphicGitEngine removal eliminates any leftover asymmetry; lowest scope-creep
- 4th architect-claim-vs-code drift this session captured (calibration class established at `feedback_architect_bug_filing_needs_root_cause_verification.md`)
- thread-541 converged (round 4) with `close_no_action` cascade-action + non-empty summary; primer thread CLOSED
- W1 slice (i) execution-engagement on thread-540 follows: `defaults/native-git-engine.ts` skeleton + `gitExec(workspace, ...args)` helper (argv-only via execFile + git stderr surfacing per `feedback_node_execfile_error_formatter_visual_misleads_diagnosis.md`) + 6 foundational ops + per-method unit tests + 1 integration test against HTTP fixture
- Pulse fired @ 02:12Z (engineerPulse 10min cadence); status answered on thread-541 §C: NO blockers; first-commit milestone is next surface

### 2026-05-12 13:50 AEST — W2 slice (i) SHIPPED — canonical-switch + 2 substrate-asymmetry fixes (`feedback_new_code_path_exposes_dormant_defects.md` class)

- W2 cascade arrived on thread-542 (round 1) with task-406 spec; per architect's "Standby for ack + slice (i) start" + per `feedback_pattern_a_engineer_turn_discipline.md`, went silent into execution
- Default flip: `src/missioncraft-sdk/core/missioncraft.ts:135` — `instantiateProvider('gitEngine', 'isomorphic-git')` → `'native-git'`
- Scenario doc updates: `docs/scenarios/01-readonly-single-repo.md` 3 sites flipped + W2-Path-D2 footnote
- 6 W2 tests added (§1 default-injection / §2 explicit-override W3-bridge / §3 end-to-end transparency)
- W2 tests in isolation: 6/6 pass. Full regression 458/460 pass — **3 PRE-EXISTING tests in `v1.0.7-slice-iii-bug73-integration.test.ts` (lifecycle integration) failed**
- **Substrate-asymmetry fix #1**: `resolveIdentity` async fallback (replaces sync `getIdentity` at commit/commitToRef/tag/squashCommit). Old: WeakMap-only lookup, threw on miss. New: WeakMap → `git config user.name`/`user.email` fallback (inherits from `~/.gitconfig` global). Why: SDK's runPublishLoop / abandon-flow call gitEngine methods with handles freshly returned from `storage.list()` (NEW WorkspaceHandle objects, NOT the one passed to `clone()`); WeakMap-by-object-identity misses. IsoEng silently worked because shell-out ops fall through to global git config; NativeEng's commit-via-env-vars pattern needs explicit identity. Mirror of W1 slice (iv) §B WeakMap-key-reuse gap, but THIS time exposed by SDK-internal usage not test usage.
- **Substrate-asymmetry fix #2**: `deleteBranch` via `git update-ref -d refs/heads/<name>` (replaces `git branch -D`). Old: `git branch -D` refuses to delete the currently-checked-out branch. New: low-level ref-removal, checkout-state-agnostic, matches IsoEng's `git.deleteBranch` semantic exactly. Why: bug-73 abandon-flow checks out `mission/<id>`, commits, then deletes — NativeEng's `git branch -D` failed; IsoEng silently succeeded. For canonical-switch transparency, both engines must agree on ref-removal semantic.
- Both fixes are W1-spec-gaps (not W2-scope-creep) but only surfaced via the W2 canonical-switch — exactly the `feedback_new_code_path_exposes_dormant_defects.md` pattern the architect warned about pre-W2 with the side-by-side merge-comparison test approval
- After both fixes: **460/460 tests pass** (was 454; +6 W2 net); 94s
- Pushed `e31c1fd` to apnex/missioncraft main
- Surface to architect on thread-542 with substantive substrate-bug discovery + fixes + revised scope estimate (W2 was 1-2 rounds estimated; actually substrate-fix iteration; slice (ii) substrate-currency audit pass remaining is minor)
- Pulse-fire count this session: 8+ fires (10min cadence; all answered via thread surfaces)

### 2026-05-12 13:15 AEST — thread-540 BILATERAL-CONVERGED; W1 wave CLOSED; W2 task cascade-spawned

- Architect-side ratified W1 wave-close at 2026-05-12T03:09Z UTC + staged 2 convergence actions:
  - action-1 `close_no_action`: thread-540 W1 coord-thread closes; W1 substrate-introduction COMPLETE
  - action-2 `create_task`: W2 canonical-switch task with full description (mission YAML schema default flip + create()/apply() default-injection + substrate-currency audit + multi-word-commit-msg integration tests + post-W2 architect-side scenario-02 dogfood; out-of-scope: bug-74 W3 / IsoEng removal W4 / ship W5)
- Engineer-side bilateral-converged with `converged=true` + non-empty summary echoing the W1 ship trail + slice-progression-stub-throw-pattern calibration data-point flagged for mission-78 retrospective (1 test was passing-for-wrong-reason via `getIdentity` UOE throw, not via stub UOE throw)
- thread-540 status flipped to `converged`; both staged actions committed; W2 task cascade-spawning per action-2 payload
- W1 cumulative: 4 commits (`e65864e` + `95d65b6` + `32ef215` + `dfb43d1`); 1 substrate file (~430 lines) + 4 test files (~1100 lines combined); +61 net new tests (393 W0-baseline → 454 W1-final); 2 mid-slice bugs surfaced + fixed via integration test catch-net; 5 architect-claim-vs-code drifts captured this wave; 8+ pulse fires answered via thread-540 surfaces (zero orphan kind=note)
- W2 standby: awaiting cascade arrival (W2 task + new coord-thread); per architect's session-handoff-by-wave model, W2 spawns fresh thread; engineer-side claim on cascade arrival; multi-session pacing OK
- Mission-78 progress: W0 ✓ shipped; W1 ✓ shipped; W2 ▶ cascading; W3-W5 unissued

### 2026-05-12 13:05 AEST — W1 slice (iv) WAVE-CLOSE SHIPPED — PROVIDER_REGISTRY + full-contract integration + W2-switch confidence

- Architect ratified slice (iii) at 2026-05-12T02:55Z UTC; slice (iv) green-lit + side-by-side merge-comparison test approved per §B-disposition; defense against `feedback_new_code_path_exposes_dormant_defects.md` class
- Did NOT burn thread-540 round on ack-only; silent into slice (iv) execution
- §1 PROVIDER_REGISTRY entry: `'native-git': () => new NativeGitEngine()` added to gitEngine factories in `src/missioncraft-sdk/core/provider-registry.ts` alongside existing `'isomorphic-git'` (additive at v1.0.x → v1.1.0; W4 drops `'isomorphic-git'` entry + the file). `NativeGitEngine` + `gitExec` exported from `src/missioncraft-sdk/index.ts` public API
- §2 Full-contract integration test suite: PROVIDER_REGISTRY-instantiated engine end-to-end through HTTP fixture exercising ALL 17 GitEngine contract methods (clone/branch/checkout/getCurrentBranch/stage/commit/commitToRef/status/log/revparse/tag/push/fetch/pull/addRemote/removeRemote/listRemotes/deleteBranch/createBundle/restoreBundle/squashCommit/merge); validates wire-up + happy-path for W2 canonical-switch target
- §3 Side-by-side IsoEng vs NativeEng merge-parity (W2 canonical-switch confidence):
  - **`'no-ff'` merge**: NativeEng + IsoEng produce equivalent merge-commit-tree-SHA (canonical structural-identity verification)
  - **`'ff'` merge**: both engines fast-forward to identical HEAD-SHA
  - Test pins `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` env vars across both workspaces to isolate merge-semantic equivalence from unrelated commit-SHA drift
  - **Result**: NO observable divergence between pure-TS `git.merge` (IsoEng) and native `git merge` (NativeEng) for tested strategies/scenarios; W2 canonical-switch transparent for tested paths
- Mid-slice test bug surfaced + fixed: WorkspaceHandle objects are WeakMap keys for identity-resolve; constructing two separate handles for the same dir produces two different WeakMap keys (lookup misses). Fix: construct each workspace handle ONCE and reuse via shared variable. Same calibration class as `feedback_substrate_extension_wire_flow_integration_test.md`.
- 8 new tests across 3 sections; `npm run build` clean; `npm test` **454/454** (was 446; **+8 net**); 94s
- Pushed `dfb43d1` to apnex/missioncraft main (Pattern A direct-commit)
- W1 substrate-introduction wave-close COMPLETE — NativeGitEngine canonical build SHIPPED. Awaiting bilateral-converge on thread-540 + cascade-action `create_task` for W2 (new coord-thread per architect's session-handoff-by-wave model)
- Pulse-fire count this session: 6+ fires (10min cadence; all answered via thread-540 surfaces)
- W1 cumulative: 4 commits (`e65864e` slice i + `95d65b6` slice ii + `32ef215` slice iii + `dfb43d1` slice iv) + ~65 net new tests (393 baseline → 454 total = +61 net) + 1 substrate file (~430 lines) + 4 test files (~1100 lines)

### 2026-05-12 12:55 AEST — W1 slice (iii) SHIPPED — advanced ops; slice-progression contract RETIRED

- Architect ratified slice (ii) at 2026-05-12T02:44Z UTC; (α) approved + architect to file (γ) idea inline (`reset` / `diff` / `lsRemote` GitEngine contract extension as post-mission-78 follow-on); slice (iii) green-lit; 5th architect-claim-vs-code drift this session captured (architect's slice (ii) dispatch listed reset/diff/ls-remote which aren't on contract — calibration discipline pattern reinforced)
- Did NOT burn thread-540 round on ack-only (per `feedback_pattern_a_engineer_turn_discipline.md`); silent into slice (iii) execution
- Implemented 4 advanced ops: `merge` (ff/no-ff strategy mapping; identity env-injected for merge-commit case), `squashCommit` (Native-canonical NOT capability-gated; checkout + merge --squash + commit -m + rev-parse HEAD pattern), `createBundle` (mkdir -p + git bundle create), `restoreBundle` (parses git bundle unbundle stdout for `<sha> <ref>` lines + git update-ref to set local ref)
- Strategy mapping for `merge` parallel to IsoEng §BBBBBB micro-fold: `'ff'` → `--ff-only` (require-fast-forward; fail-otherwise); `'no-ff'` → `--no-ff` (always merge-commit; default)
- W2 canonical-switch verification target: IsoEng's squashCommit / createBundle / restoreBundle ALREADY shell out to native git per §2.6.2 v0.4 §AAA bundle-ops native-shell-out + §BBBBBB squash-shell-out fold; semantics match EXACTLY between IsoEng (shell-out) and NativeGitEngine (native). Test "Native squash-merge produces same commit-tree as Isomorphic squash-merge" pins this verification publicly for W2 confidence
- 9 new tests across 4 describe-blocks: merge (3) / squashCommit (2) / createBundle+restoreBundle (3) / squash-parity (1)
- Slice (i) + slice (ii) test files dropped obsolete `merge throws UnsupportedOperationError pointing at slice (iii)` assertions (merge now implemented); slice-progression contract RETIRED — all GitEngine contract methods now implemented in NativeGitEngine
- `npm run build` clean; `npm test` **446/446** (was 439; +9 new, -2 obsolete = **+7 net**); 94s
- Pushed `32ef215` to apnex/missioncraft main (Pattern A direct-commit)
- Slice (iv) ahead (W1 wave-close): PROVIDER_REGISTRY `'native-git'` entry registration in `src/missioncraft-sdk/core/provider-registry.ts` + full-contract integration test suite + W1 wave-close audit
- Pulse-fire count this session: 5 fires (10min cadence; all answered via thread-540 surfaces — none via separate `kind=note` short_status)

### 2026-05-12 12:40 AEST — W1 slice (ii) SHIPPED — write-ops + lifecycle + remote-management

- Architect ratified slice (i) at 2026-05-12T02:30Z UTC + green-lit slice (ii); architect-disposition on commit-prefix: continue `[v1.1.0 W{N} slice ({roman})]` framing for W1-W5; do NOT amend W0 commits (`580c38b` + `6e7aef3`) — historically accurate for pre-mission-78 framing; W5 closing-audit §17 will document framing-shift narrative
- Did NOT burn thread-540 round on ack-only per `feedback_pattern_a_engineer_turn_discipline.md` — went silent into slice (ii) execution
- Implemented 13 contract methods: init / getCurrentBranch / tag (lightweight + annotated + force) / stage / commit (with autoStage + amend + custom-author override) / **commitToRef** (bypass-INDEX wip-branch semantic via temp `GIT_INDEX_FILE`) / deleteBranch / fetch / push / pull / addRemote / removeRemote / listRemotes
- Identity threading: `GIT_AUTHOR_NAME`/`EMAIL` + `GIT_COMMITTER_NAME`/`EMAIL` env vars injected at commit-firing-time via `commitEnv(identity, base?)` helper; no git config writes (argv-only end-to-end)
- commitToRef impl: temp index file `<workspace>/.git/wip-index-<UUID>` → seed from existing ref's tree if present (`git read-tree`) → stage entire working tree to TEMP index (`git add -A` with `GIT_INDEX_FILE=<temp>`; operator's index UNTOUCHED) → `git write-tree` → `git commit-tree -p <parent> -m <msg>` → `git update-ref` → cleanup temp file in `finally`. UUID-suffix for concurrency-safety across overlapping wip-commit invocations.
- Mid-slice bug surfaced + fixed: push-impl initially didn't default remote to `'origin'` when `branch` provided without explicit `remote`/`url`; integration test `push writes a new commit upstream over HTTP` failed with `git push main` (positional `main` parsed as remote-name not refspec); fix: `target = options.url ?? options.remote ?? (options.branch !== undefined ? 'origin' : undefined)` (parallel to isomorphic-git internal default behavior)
- Tests: 27 new across 9 describe-blocks (init / getCurrentBranch / tag / stage / commit / commitToRef bypass-INDEX semantic / deleteBranch / fetch+push+pull HTTP integration / remote management / slice (iii) UnsupportedOperationError preservation)
- `commitToRef` bypass-INDEX semantic verified end-to-end: operator's staged + modified + untracked lists IDENTICAL pre/post wip-commit; HEAD UNCHANGED (bypass-HEAD); wip-commit's tree captures WORKING-TREE state (not operator's INDEX state); subsequent wip-commits chain via parent-linkage; temp index file cleaned up post-call
- Slice (i) test file delta: 2 obsolete `UnsupportedOperationError`-stub assertions removed (init + commit no longer throw); slice-progression contract narrows to merge / squashCommit / bundle ops (slice (iii))
- `npm run build` clean; `npm test` **439/439** (was 414; +27 new, -2 obsolete = **+25 net**); 93s
- Pushed `95d65b6` to apnex/missioncraft main (Pattern A direct-commit)
- Surface to architect on thread-540 with first-commit milestone + slice (iii) intent + reset/diff/ls-remote contract-extension scope-question + 3rd pulse-fire answered via this surface
- Pulse-fire count this session: 3 fires (10min cadence; all answered via thread-541 §C + thread-540 surfaces — none via separate `kind=note` short_status; pattern: substantive-surface-answers-pulse > orphan-status-note when active coord-thread is moving)

### 2026-05-12 12:25 AEST — W1 slice (i) SHIPPED — NativeGitEngine canonical build

- `defaults/native-git-engine.ts` authored: NativeGitEngine class + exported `gitExec(workspace, args, options)` helper with argv-only discipline; static `providerName = 'native-git'`; WeakMap-stored identity for slice (ii) commit-firing-time resolve (forward-compat)
- 6 ops fully implemented:
  - `clone` — `git clone <url> <path>`; identity stored in WeakMap; null-cwd execFile mode
  - `branch` — `git branch <name> [<from>]`
  - `checkout` — `git checkout <branch>`
  - `revparse` — `git rev-parse <ref>` → 40-char SHA
  - `status` — composite of `git rev-parse --abbrev-ref HEAD` + `git rev-parse HEAD` + `git status --porcelain=v1 -z`; XY-letter parsing for staged/modified/untracked
  - `log` — `git log` with `%H%x1f%an%x1f%ae%x1f%aI%x1f%P%x1f%B%x1e` format; US-field-separator + RS-record-separator parsing
- Other GitEngine methods (init/commit/push/fetch/tag/etc.) stub-throw `UnsupportedOperationError` with slice-pointer message; locks slice-progression contract
- `gitExec` error-handler surfaces git's actual stderr (not Node's argv-joined display string per `feedback_node_execfile_error_formatter_visual_misleads_diagnosis.md`); 4th instance of that calibration discipline applied
- Test file `test/missioncraft-sdk/v1.1.0-slice-i-native-git-engine.test.ts`: 21 tests across 8 describe-blocks (gitExec / clone / branch+checkout / revparse / status / log / UnsupportedOperationError contract / providerName / HTTP-fixture integration)
- Test-helper iteration: initial `git init --initial-branch=main` failed on dev-machine git 2.25.4 (no `--initial-branch` flag pre-2.28); switched to `git init --quiet` + `git symbolic-ref HEAD refs/heads/main` (matches existing `w6-real-engine-start.test.ts` pattern). All 21 tests pass.
- `npm run build` clean; `npm test` 414/414 (was 393; +21 net); 95s
- Pushed `e65864e` to apnex/missioncraft main (Pattern A direct-commit; no PR-flow per `feedback_apnex_repos_direct_commit_to_main.md`)
- Commit-prefix shift noted in commit body: W0 commits used `[v1.0.8 ...]` framing pre-mission-78; switching to `[v1.1.0 W1 ...]` to align with mission-78 target version. W5 performs the actual package.json + VERSION-const bump.
- Surface to architect on thread-540 with first-commit milestone + slice (ii) intent + pulse-status (10min cadence answered via this surface vs separate note)

## Canonical references

- **Path D2 directive:** Director verbatim 2026-05-12 — "Let's hard depend on git and gh binaries. Let's make missioncraft detect these automatically, and show the current git and gh binary versions additionally in the 'msn version' output. Arguments become a robust code structuring exercise. Clean and simple."
- **Architect-side memory:** `project_missioncraft_path_d2_native_substrate.md` (auto-loaded engineer-side parallel may exist)
- **GitEngine interface contract:** `src/missioncraft-sdk/pluggables/git-engine.ts`
- **PROVIDER_REGISTRY:** `src/missioncraft-sdk/core/provider-registry.ts` (closed registry at v1; `'native-git'` entry lands W1 slice (iv))
- **Slice (i) precedent (argv-only):** `src/missioncraft-sdk/substrate-detect.ts` (W0 slice (i) `580c38b`)
- **Test fixture pattern:** `test/fixtures/git-http-fixture.ts` consumed by `test/missioncraft-sdk/w6-real-engine-start.test.ts`
- **Mission-77 retrospective:** `docs/reviews/m-missioncraft-v1-retrospective.md` (DRAFT)
- **Trace-management methodology:** `docs/methodology/trace-management.md`
