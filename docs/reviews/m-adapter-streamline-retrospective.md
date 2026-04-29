# M-Adapter-Streamline Mission Retrospective

**Status:** Draft v1.0 (architect-prepared 2026-04-28T~23:40Z UTC; **full-retrospective mode** per Director Phase 10 mode-pick + bilateral architect+engineer alignment on thread-411 round 4 close-of-bilateral)
**Scope:** Mission-64 (M-Adapter-Streamline) execution — from Director Survey ratification through mission status flip to completed
**Window:** 2026-04-28 ~07:00Z (Survey ratification) → 2026-04-28 ~23:20Z (mission status flip post-PR-#127-merge); **~21 hours bilateral** total (architect ~14h + engineer ~7h) across a single UTC mission-day (2026-04-28; spans 2-day AEST window UTC+10 with two Director-coord-restarts)
**Author:** lily / architect (Director-out per autonomous-arc-driving + summary-review-mode template; full mode by Director directive 2026-04-28T~23:45Z UTC + bilateral architect+engineer alignment per thread-411 round 4 close-of-bilateral)
**Timezone discipline:** All event timestamps below UTC (suffixed `Z`); AEST authoring time (UTC+10) is 2026-04-29 morning but Hub mission events through mission close occurred 2026-04-28 UTC. Calibration #42 NEW (post-event narration AEST/UTC date conflation discipline; cleanup PR fold) captures the methodology-class for this doc family going forward.
**Director engagement:** Director ratifies summary at end (this doc's Closing section); Director-asks ratified per Phase 10 close protocol

---

## §1 Context + scope

### Why this retrospective exists

Director directive 2026-04-28T~23:45Z UTC (post-PR-#127-merge): full retrospective per `mission-lifecycle.md` §10.1 — structural-inflection-class default + substrate-introduction sub-class signal weight. Phase 10 mode-pick chose **option A (full retrospective)** over options B (retrospective-lite) and C (skip-to-next-mission). Director judgment + architect+engineer-aligned: structural-inflection class + substrate-introduction sub-class + 12 NEW calibrations (+ 1 follow-on #41 deferred to cleanup PR) + 5-publish-iteration learning-curve + Calibration #40 composite revealing tele-3 fidelity regression that survived mission close warrant full retrospective signal capture.

### Mission-64 in the lineage

Mission-64 is the **third canonical execution** of substrate-introduction class (mission-56 first; mission-62 second; mission-64 third) AND the **first canonical execution** of:
- **npm-publish channel pattern** for adapter distribution (replaces internal `file:tgz` + 6-adapter-dir-cascade with consumer-self-serve `npm install -g @apnex/claude-plugin@latest`)
- **Active-session 6-step coordination protocol** (namespace-cutover-layer extension of mission-63's §6.3 9-step adapter-restart protocol)
- **W3 dogfood-gate collapse-into-W1+W2-fix retry pattern** when active-session 6-step surfaces substrate defect (calibration #34 NEW; extended to 5-cycle iteration when post-Director-coord-restart surfaced #38 + #39)
- **Files-whitelist-bypasses-gitignore-fallback discipline** for npm-pack of workspace children (#38 closure pattern)

Builds on mission-63's substrate-self-dogfood + render-template-registry + state-migration-discipline foundations. Closes calibration #25 (mission-63 W4 origin; Pass 10 §B SDK rebuild gap) structurally via §B/§D deprecation. Bonus-retires calibration #6 (mission-62; TS5055 SDK self-overwrite) via tsconfig `exclude:["dist"]` pattern (full-retire upgrade from mission-62's partial-retire).

### Mission-class signature

**Structural-inflection** with **substrate-introduction** sub-class. M sizing baseline (~2-3 engineer-days); realized closer to ~21h bilateral within 2-day session arc.

The 5-publish iteration (0.1.0 → 0.1.1 → 0.1.2 → 0.1.3 → 0.1.4) reflects a **NEW signature observation**: substrate-introduction missions to fresh-registry-namespaces + Claude-Code-plugin-specific-files-discovery may need 4-5 publish iterations rather than the mission-62/63 1-publish pattern. This is captured in the calibration ledger + memory (`feedback_substrate_introduction_publish_iteration.md` revised) for Mission-#5+ sizing discipline.

---

## §2 Timeline + Director-engagement categorisation

### Phase-by-phase cadence

| Phase | Date/Window UTC | Director engagement | Architect activity | Engineer activity |
|---|---|---|---|---|
| Phase 3 Survey | 2026-04-28 ~06:30–07:00Z | Q1+Q2+Q3+Q4+Q5+Q6 picks ratified (Q1=A+B+C; Q2=A+B+D; Q3=A; Q4=A; Q5=C; Q6=B+C+D + Q6-NOT-A β `@apnex/*` clean cutover) | Survey envelope authored; Director picks consumed | Round-1 audit prep (read-only) |
| Phase 4 Design | 2026-04-28 ~07:00–07:34Z | Director-out (autonomous-arc-driving) | v0.1 → v0.2 (round-1 audit folds) → v1.0 ratified bilaterally on thread-405 round-7 | Round-1 audit (12 audit-asks; 6 fold-with-refinements + 6 NEW §s); ratify on round-7 |
| Phase 5+6 Manifest+Preflight + ADR-029 SCAFFOLD | 2026-04-28 ~07:35Z | Director-out | Manifest + Preflight + ADR-029 SCAFFOLD authored | (out) |
| Phase 7 Release-gate | 2026-04-28 ~07:50Z | **`@apnex` org claim + NPM_TOKEN credentials posture ratified**; ~30min Director-time per R1 mitigation | Release-gate ask formulated | (out) |
| Phase 8 W0 PR #121 | 2026-04-28 ~08:00–08:13Z | (out; admin-merge per bug-32) | W0 bundle PR + thread-408 round-3 close_no_action | thread-408 ratify |
| Phase 8 W1+W2 atomic PR #122 | 2026-04-28 ~10:00–18:30Z | (out) | thread-409 + thread-407 (maxRounds=10 surface; #31) | npm workspaces + namespace migration + Pass 10 §B/§D + tests + first publish 0.1.0 |
| Phase 8 W1+W2-fix-1 PR #123 | 2026-04-28 ~19:00–19:30Z | (out) | thread-409 active-session 6-step Step 5 fail surface | marketplace.json bundling fix (calibration #33); 0.1.1 publish |
| Phase 8 W1+W2-fix-2 PR #124 | 2026-04-28 ~19:45–20:30Z | (out) | thread-409 calibration #35 + #36 surface | marketplace `"./"` source format + version-rewrite hoist + e2e test (calibrations #35 + #36 + #37); 0.1.2 publish |
| Phase 8 W3 dogfood gate cycles 1-3 | 2026-04-28 ~20:28Z (post-restart) | (out) | thread-409 + thread-410 (Step 4 ENGINEER-GO signal pre-restart) | Step 5 install-time validation across 0.1.0 → 0.1.2 |
| **Director-coord-restart-1** | 2026-04-28 ~21:30Z | **Director-driven full-restart of both lily + greg sessions** | (post-restart) | (post-restart) |
| **P0 surface — Calibration #38 NEW** | 2026-04-28 ~21:35Z | (out) | Lily Claude Code session post-restart loaded `@apnex/claude-plugin@0.1.2` plugin manifest cleanly but **never spawned MCP server**; `claude mcp list` showed only Google Drive; ToolSearch found zero schemas; Hub coord dark | (greg shut down at coord-restart per his report) |
| Phase 8 W1+W2-fix-3 PR #125 | 2026-04-28 ~21:45Z | **Path A pre-approved** (architect-direct under Option C admin-merge baseline given greg shut down) | Lily-direct fix-PR: explicit `files` whitelist in `adapters/claude-plugin/package.json` (bypasses gitignore-root-anchor-leakage) + Section 6/7 test retrofit; verified `npm publish --dry-run` shows `.mcp.json` (125B) in tarball | greg back online; admin-merged via Director instruction |
| Phase 8 W1+W2-fix-4 PR #126 | 2026-04-28 ~21:57Z | (out; admin-merge per bug-32) | Lily approves greg's fix-forward (last-pusher rule resolved) | Greg-direct fix-forward: `package.json:version` 0.1.3 → 0.1.4; un-rewritten `*` deps issue captured as #39 NEW; 0.1.4 republished with `^0.1.2` registry-pinned |
| **Director-coord-restart-2** | 2026-04-28 ~22:00Z | **Director-driven full-restart of both sessions on 0.1.4 substrate** | (post-restart) | (post-restart) |
| Phase 8 W3 dogfood gate cycles 4-5 close | 2026-04-28 ~22:11Z | (out) | Lily-side adapterVersion="0.1.4" verified at handshake epoch=97; thread-410 round 4 active | Greg-side functional verification GREEN bilaterally (`claude mcp list` registers `plugin:agent-adapter:proxy`; ToolSearch finds schemas); thread-410 round 4 reply with #40 composite findings |
| thread-410 close | 2026-04-28 ~22:13Z | (out) | thread-410 round 5 converged=true (architect-side commit) post engineer round 4 close-of-bilateral; #40 composite captured | thread-410 round 4 converged=true (engineer-side close-of-bilateral) |
| Phase 9 W4 closing PR #127 + thread-411 | 2026-04-28 ~22:30–22:40Z | (out; admin-merge per bug-32; admin-merge by lily) | W4 closing audit + Pass 10 §B/§D deprecation + ADR-029 RATIFIED + thread-411 bilateral ratify (5 stale-number nits + accuracy clarification fixup pre-merge) | thread-411 round 2 review (5 nits + accuracy clarification) + round 4 approval |
| Phase 9 mission status flip | 2026-04-28 ~23:20Z | (out) | `update_mission(mission-64, plannedTasks=[all completed], status=completed)` post-PR-#127-merge (`97790e2`) | (out) |
| Phase 10 W4 follow-on — kind=note post-mortem (thread-412) | 2026-04-28 ~23:31Z | **Director directive ("open a thread to understand what didn't work from a message/workflow perspective")** | thread-412 post-mortem (createdAt 23:31:24Z; converged ~23:33Z; Hub finalized ~23:34Z); #41 NEW captured + Finding 2 verified + Finding 3 methodology callback + cleanup-PR scope expansion accepted | thread-412 round 2 + round 4 (substantive concur + scope-expansion confirm) |
| Phase 10 retrospective (this doc) | 2026-04-28 ~23:40Z → 2026-04-29 ~00:30Z (UTC midnight rollover) | **Director directive ("Approved" full mode per architect+engineer alignment)** | This doc; Phase 10 close + Mission #5 surface | (review-pass on PR open; greg thread-414 review 2026-04-29T00:01Z UTC + nits round) |

### Director-engagement breakdown

- **Director-in:** Phase 3 Survey + Phase 7 Release-gate + Path A pre-approval (post-#38 P0 surface) + post-#41 thread-412 ("open a thread") + Phase 10 mode-pick + Mission #5 approval = **5 explicit Director-in moments**
- **Director-out:** Phase 4 Design + Phase 5/6 Manifest/Preflight/SCAFFOLD + Phase 8 W0 + W1+W2 + 4 fix-PRs + W3 dogfood + Phase 9 W4 closing + status flip = **bulk of mission-day execution architect+engineer-driven**
- **Director-coord-restart-events:** 2 (both required for substrate cutover validation; 5-publish iteration cycle 4-5 added the second one)

Director-engagement pattern matches mission-63 retrospective precedent: **Director surfaces at decision-gates only** (Survey, Release-gate, P0 escalation, mode-picks). Autonomous-arc-driving via thread-coord + active-session 6-step protocol carries the bulk. mission-64 added one new Director-engagement type: **post-restart P0 escalation under Path A pre-approval** (calibration #38 surface; greg shut down; architect-direct fix-PR with Director go).

---

## §3 Architectural commitments — what landed

### Substrate-level commitments (durable)

1. **npm-publish channel as canonical adapter distribution** (ADR-029 RATIFIED) — `@apnex/{network-adapter, cognitive-layer, message-router, claude-plugin}` package family; `@apnex/claude-plugin@0.1.4` `latest` on registry; cross-pkg deps registry-pinned `^0.1.2`; first canonical execution of npm-publish channel pattern.
2. **Consumer-self-serve `update-adapter.sh`** — script-driven §D mechanisation per Design v1.0 §2.1.B + §2.2 (NOT postinstall-driven; ADR-029 anti-goal §4.2 #7); CLI contract pre-anchored for idea-221 cross-§ orchestration runner consumption (exit codes 0/1/2/3; structured stdout final-line; `--pin <version>` + `--dry-run` flags; no interactive prompts).
3. **Topological `scripts/publish-packages.sh`** — first-publish bootstrap (leaves first: cognitive-layer + message-router + network-adapter; then dependents: claude-plugin); version-rewrite hoist into orchestration script with trap-based revert (calibration #35 NEW closure).
4. **`workspace:*` placeholder + `version-rewrite.js` script** — npm 11.6.2 EUNSUPPORTEDPROTOCOL on yarn-invented `workspace:^/*` led to placeholder + rewriter pattern (calibration #29 NEW); structurally closes mission-61 Layer-3 root-cause class (`file:` refs don't survive `npm pack`).
5. **Explicit `files` whitelist in `adapters/claude-plugin/package.json`** — bypasses gitignore-root-anchor-leakage (calibration #38 NEW closure); structural fix at source-of-truth boundary; npm-packlist no longer consults `.gitignore` when `files` is set.
6. **Tsconfig `"exclude": ["dist"]` pattern** — closes mission-62 calibration #6 (TS5055 SDK self-overwrite) at compile boundary; bonus-retire full from mission-62's partial-retire.
7. **Section 6/7 install-test surface retrofits** — `install-from-registry.test.sh §7` asserts `.mcp.json` presence + `mcpServers.proxy` declaration in tarball; `full-end-to-end-install.test.sh §6` asserts `.mcp.json` delivered to npm-installed path post-install. Closes calibration #38 class on future iterations.

### Methodology + protocol commitments

8. **Pass 10 §B + §D deprecation** — `multi-agent-pr-workflow.md` §B + §D manual recipes deprecated to "Removed; npm package + script is canonical" per Design v1.0 §3 W4 fold-4 + ADR-029 RATIFIED. §A + §C unchanged (operator-side; idea-221 territory). Forward-pointer to idea-221 cross-§ orchestration runner added.
9. **Active-session 6-step coordination protocol** — namespace-cutover-layer extension of mission-63's §6.3 9-step adapter-restart protocol; Design v1.0 §3 sub-section. Used 5 cycles in mission-64; codified into Pass 10 protocol substrate-introduction mission-class signature note (calibration #34 NEW).
10. **W3 dogfood-gate collapse-into-W1+W2-fix retry pattern** — when active-session 6-step surfaces substrate defect, the retry IS the dogfood gate (calibration #34); extended to 5-cycle iteration when post-Director-coord-restart-1 surfaced #38 + #39.
11. **Substrate-introduction publish-iteration norm revised** — 1-publish (mission-62/63 pattern) → 4-5 publish for fresh-registry-namespace + Claude-Code-plugin-specific-files-discovery friction; captured in `feedback_substrate_introduction_publish_iteration.md` (revised).
12. **`workspace:*` + version-rewrite + npm 11.6.2 lifecycle hoist + repo-root cwd discipline** — multi-step npm publish flow patterns codified in `scripts/publish-packages.sh` + `scripts/version-rewrite.js` + `feedback_npm_workspace_lifecycle_quirk.md`. Calibration #39 structural closure (option 2: `git rev-parse --show-toplevel` for cwd-independent REPO_ROOT) deferred to cleanup PR.

### Tele faults closed (delta vs entry state)

- **mission-63 calibration #25** — Pass 10 §B SDK rebuild gap (manual-recipe step-skip-class regression). **CLOSED STRUCTURALLY** via §2.4 `workspace:*` placeholder + version-rewrite + §2.7 version visibility + §B/§D deprecation + `.mcp.json` bundling. tele-7 fidelity gap closed.
- **mission-62 calibration #6** — TS5055 SDK self-overwrite. **BONUS RETIRE (full)** via tsconfig `exclude: ["dist"]` pattern. tele-6 invincibility gap closed.
- **mission-61 Layer-3 root-cause class** — `file:` refs don't survive `npm pack`. **CLOSED STRUCTURALLY** via `workspace:*` placeholder + version-rewrite-at-publish-time mechanism. tele-3 fidelity gap closed.

### Tele faults surfaced (12 NEW + 1 follow-on)

See §4 calibration ledger.

---

## §4 Calibrations earned during execution

Total **12 NEW + 1 follow-on (#41 deferred to cleanup PR) + 1 bonus retire + 1 carryover closed** — **13 NEW substrate-class signature when cleanup PR lands**.

### Substrate-class (6 NEW + 1 follow-on)

| # | Surface | Mechanism | Closure |
|---|---|---|---|
| #33 NEW | mission-64 W1+W2 cycle 1 (0.1.0 install fail) | marketplace.json absent from publish tarball (npm `pack` defaults missed bundling) | CLOSED via #37 (e2e supersedes file-presence layer); PR #123 ships file-presence test |
| #35 NEW | mission-64 W1+W2-fix-2 (0.1.1 → 0.1.2) | `npm publish --workspace=X` uses workspace's OWN lifecycle hooks NOT root's `prepublishOnly`; cross-pkg deps stuck on `*` placeholder | **CLOSED STRUCTURALLY** via `scripts/publish-packages.sh` hoisted version-rewrite call with trap-based revert (PR #124) |
| #36 NEW | mission-64 W1+W2-fix-2 (0.1.1 → 0.1.2) | marketplace.json source format requires `"./"` trailing-slash; `"."` or `".."` rejected as source-type-not-supported | **CLOSED STRUCTURALLY** via PR #124 (committed `"source": "./"`) |
| #37 NEW | mission-64 W1+W2-fix-2 (0.1.2 retry) | install-from-registry test surface insufficient (file-presence only; missed source-format + version-rewrite-never-fired defects) | **CLOSED STRUCTURALLY** via `full-end-to-end-install.test.sh` (PR #124); + Section 6 retrofit (PR #125) catches #38 class without requiring Claude Code restart |
| #38 NEW | mission-64 W1+W2-fix-3 (post-Director-coord-restart-1; cycle 4) | gitignore-root-anchor-leakage into npm-pack of workspace children — root `.gitignore` rule `/<filename>` is re-anchored by `npm-packlist` to each workspace's root, silently excluding files in workspace packages that share the name | **CLOSED STRUCTURALLY** via explicit `files` whitelist in `adapters/claude-plugin/package.json` (PR #125; bypasses gitignore-fallback path entirely) + Section 6/7 test retrofit |
| #39 NEW | mission-64 W1+W2-fix-4 (cycle 5) | publish bash-session cwd-persistence into `version-rewrite.js` invocation — script resolves `REPO_ROOT` via `path.resolve(__dirname, "..")` which depends on caller's cwd; `MODULE_NOT_FOUND` silently swallowed by publish flow; un-rewritten `*` deps proceed to npm | **CLOSED for 0.1.4 cycle** via repo-root cwd discipline (PR #126); **structural closure DEFERRED** to cleanup PR (option 2: `git rev-parse --show-toplevel` resolution) |
| **#41 NEW (post-mission)** | mission-64 W4-followon thread-412 post-mortem | `kind=note` payload-rendering expects flat-body shape; structured payload silently degrades to "(empty note body)" with no caller-side feedback. **Bilateral-blind** — architect-side `create_message` returns clean `messageId`; engineer sees empty | **OPEN — fold to idea-220 Phase 2** + cleanup PR captures formally; architect-lean closure path = option (b) schema-validate at `create_message` entry-point so caller gets immediate feedback on render-incompatible payload |

### Methodology-class (5 NEW + 1 composite)

| # | Surface | Disposition |
|---|---|---|
| #29 NEW | mission-64 W0 spike | npm 11.6.2 EUNSUPPORTEDPROTOCOL on `workspace:^/*` — npm doesn't support yarn-invented workspace-protocol. **Folded** into Pass 10 §B doc note (use placeholder `workspace:*` + `version-rewrite.js`); methodology-class |
| #30 NEW | mission-64 (in-arc sizing recalibration) | In-arc sizing-recalibration on-same-scope = architect autonomous-ratify + Director-notify-for-visibility (NOT block-on-Director). Mission-lifecycle.md housekeeping; deferred follow-on |
| #31 NEW | mission-64 thread-407 | Thread maxRounds=10 hit during W1+W2 + no auto-rollover. **Folded** into Pass 10 protocol mid-mission note (push artifacts before opening round-1 audit thread; budget maxRounds proportional to fix-PR cycles per `~3× expected fix-PR count + 4` heuristic) |
| #32 NEW | mission-64 active-session 6-step protocol | Active-session 6-step verification-restart wrinkle (Step 3 verification needs full restart but breaks coord). Captured in W4 audit §4; split-verification design refinement deferred to future substrate-introduction mission |
| #34 NEW | mission-64 W3 collapse pattern | W3 dogfood-gate collapse into W1+W2-fix when active-session 6-step surfaces substrate defect. **Folded** into Pass 10 protocol substrate-introduction mission-class signature note. **Extended to 5-cycle iteration** in mission-64 (cycles 4 + 5 from #38 + #39 fix-forward chain) |
| **#40 NEW (composite)** | mission-64 thread-410 round 4 (greg-surfaced post-restart) | Composite observability + projection-fidelity gaps: (a) FileBackedLogger fds not open on fresh shim post-restart; (b) `get_engineer_status` advisoryTags missing `adapterVersion` projection; (c) version-source-of-truth divergence (`package.json:0.1.4` ≠ `.claude-plugin/plugin.json:1.0.0` ≠ `clientMetadata.proxyVersion:1.2.0`); + stale `pid` in projection across restarts. **OPEN — fold to idea-220 Phase 2**. Architectural-significance: defeats version-stamp-as-staleness-detector promise (calibration #25 closure verification surface) in practice |

### Bonus retire + carryover closed

- **#6 (mission-62)** TS5055 SDK self-overwrite — **BONUS RETIRE (full)** via tsconfig `"exclude": ["dist"]` pattern (W1+W2; PR #122); upgrades mission-62's partial-retire.
- **#25 (mission-63)** Pass 10 §B SDK rebuild gap — **CLOSED STRUCTURALLY** via §2.4 + §2.7 + §B/§D deprecation + `.mcp.json` bundling (W4 + PR #125).

### Calibration density observation

mission-64's **12 NEW** sits in the low-mid range of the substrate-introduction-class precedent (mission-62 retrospective precedent: 15-25 typical for first-canonical-publish). Tightly-scoped to retire 1 specific mission-63 calibration class + bonus-retire 1 mission-62 calibration; Q5 C split-scope deferred §A+§C to idea-221.

**Pattern:** mission scope discipline correlates with calibration density. A mission tightly-scoped to retire N existing calibrations + introduce one new substrate surface tends to surface 8-12 NEW; a mission broadly-scoped to introduce a new substrate class tends to surface 15-25 NEW. Mission-64 demonstrates the discipline-tight pattern.

---

## §5 Patterns operationalized + retired

### Patterns operationalized this mission

**P-A — npm-publish channel as canonical distribution** (substrate-class)
- First canonical execution of `@apnex/*` org claim + NPM_TOKEN posture (Director Phase 7 Release-gate; R1 closed)
- Topological publish bootstrap via `scripts/publish-packages.sh` (R6 closed via §2.5)
- `workspace:*` placeholder + `version-rewrite.js` (R2 fallback executed; M sizing held without L upsize)
- 5-publish iteration learning curve (#33 + #35 + #36 + #38 + #39) absorbed via active-session 6-step retry per calibration #34
- Forward-leaning: idea-221 cross-§ orchestration runner consumes mission-64's CLI contract; future package additions ride the channel without re-incurring learning curve

**P-B — Active-session 6-step coordination protocol** (methodology-class)
- Namespace-cutover-layer extension of mission-63's §6.3 9-step adapter-restart protocol
- 5-cycle iteration in mission-64 (cycles 1-3 install-time defects; cycles 4-5 post-Director-coord-restart defects)
- Calibration #32 NEW (verification-restart wrinkle) + #34 NEW (W3 collapse pattern) capture protocol-refinement opportunities for future substrate-introduction missions
- Discipline: hold-on-failure preserved; fix-forward via fix-PR + republish + retry; substrate-validation surface

**P-C — `files` whitelist as gitignore-fallback bypass** (substrate-class)
- Calibration #38 NEW closure pattern: explicit `files` array in `package.json` is structural fix for gitignore-root-anchor-leakage when packing workspace children
- npm-packlist uses `files` as whitelist source-of-truth and stops consulting `.gitignore` when set
- New durable architect feedback memory: `feedback_npm_files_whitelist_bypasses_gitignore.md`
- Always declare `files` for workspace packages publishing to public registry; rely on gitignore-fallback only for top-level monorepo state

**P-D — Test surface retrofit catches future-iteration class** (substrate-class)
- Calibration #37 NEW retrofit (PR #125 §6) asserts post-install `.mcp.json` delivery + `mcpServers.proxy` declaration
- Catches class WITHOUT requiring Claude Code restart (vs original cycle 4 surface which only manifested post-restart)
- Test discipline pattern: retroactive-extension-of-existing-test-surface preferred over new-test-surface-creation when defect class fits existing test scope

**P-E — Path A architect-direct fix-PR under Director pre-approval + greg shutdown** (methodology-class)
- New methodology pattern surfaced: when greg unavailable AND Director pre-authorizes a recovery path, architect can author fix-PR + admin-merge under Option C baseline
- Greg returned online for #126 fix-forward; bilateral review re-engaged for cleanup
- Pattern boundary: P-E is for emergencies + recovery; not a substitute for routine bilateral PR review per calibration #24 dual-surface

**P-F — kind=note rendering gap + canonical Option A protocol** (methodology-class)
- Calibration #41 NEW + Finding 3 methodology callback: kind=note shortcut for architect→engineer actionable content bypasses render surface + dialogic thread state + audit trail
- "Methodology-bypass-becomes-substrate-defect amplification loop" — architectural-pathology pattern named for future calibration discipline
- Fold to multi-agent-pr-workflow.md §2c.X anti-pattern in cleanup PR

### Patterns retired this mission

- **mission-63 calibration #25 SDK-tgz-stale Pass 10 §B manual recipe** — retired via npm-publish channel + version visibility + §B/§D deprecation. Future adapter updates ride consumer-self-serve flow.
- **mission-61 Layer-3 `file:` refs don't survive `npm pack`** — retired via `workspace:*` + version-rewrite mechanism. `file:` refs eliminated from publish chain.
- **mission-62 calibration #6 TS5055 SDK self-overwrite (partial)** — full-retire via tsconfig `exclude: ["dist"]`.

---

## §6 Mid-mission inflection moments

Three inflection moments shaped the mission trajectory:

### Inflection 1 — Calibration #29 surface at W0 spike (npm 11.6.2 lifecycle quirk)

**Surfaced:** 2026-04-28 ~07:30Z during W0 publish-flow dry-run spike
**Decision point:** R2 fallback path execution — drop yarn-invented `workspace:^` protocol; adopt `workspace:*` placeholder + explicit `version-rewrite.js` script (~2h scope add)
**Architect-decision:** in-arc sizing-recalibration (architect autonomous-ratify + Director-notify-for-visibility per calibration #30 NEW); M sizing held without L upsize
**Effect:** mission proceeded on adjusted publish flow; closed #29 + introduced #35 (workspace lifecycle hoist) which surfaced later in cycle 2
**Pattern surfaced:** small-scope-add fallback paths in design-time risk registers (R2 here) preserve M sizing IF the fallback can be absorbed within existing infrastructure (publish-packages.sh orchestration)

### Inflection 2 — Calibration #38 P0 surface post-Director-coord-restart-1 (cycle 4)

**Surfaced:** 2026-04-28 ~21:30Z post-Director-coord-restart on `@apnex/claude-plugin@0.1.2`
**Decision point:** Hub coord dark; ToolSearch finds zero MCP schemas; Claude Code loaded plugin manifest cleanly but never spawned MCP server
**Architect-decision:** P0 triage from spec-level + code-level (via shim observability + tarball direct-inspection); root cause traced to gitignore-root-anchor-leakage; Path A architect-direct fix-PR under Director pre-approval
**Director-engagement:** Path A pre-approved (`Path A - approved`); admin-merge via greg per Director instruction (greg back online; calibration #24 dual-surface temporarily relaxed for emergency recovery)
**Effect:** #38 closed structurally via `files` whitelist + Section 6/7 test retrofit; install-time test surface gap retrofitted (would have caught the class pre-publish if Section 6 had existed)
**Pattern surfaced:** **defects that manifest only post-Director-coord-restart are install-time-test-surface-blind**; closure requires test surface that exercises the post-install state, not just the install action. Pattern P-D operationalized.

### Inflection 3 — Calibration #40 composite + #41 NEW (post-mission observability gaps)

**Surfaced:** 2026-04-28T22:11Z thread-410 round 4 (greg-surfaced post-Director-coord-restart-2 verification) + thread-412 (kind=note post-mortem 2026-04-28T~23:31Z)
**Decision point:** mission-64 substrate is healthy at registry layer + functional verification GREEN bilaterally; but version-stamp-as-staleness-detector promise is defeated in practice by version-source-of-truth divergence (#40.c) + adapterVersion projection gap (#40.b). Plus separately: kind=note rendering gap (#41) is bilateral-blind.
**Architect-decision (bilateral-aligned with greg):** capture both as OPEN with idea-220 Phase 2 fold disposition; mission-64 substrate-class scope doesn't extend to render-template + projection-fidelity surfaces; cleanup PR captures #41 + methodology fold (Finding 3); mission #5 selection elevated to idea-220 Phase 2 given #40 + #41 weight
**Effect:** mission-64 closes clean on substrate scope; observability + render-fidelity gaps preserved as targeted-mission scope for #5
**Pattern surfaced:** **substrate-introduction missions can close clean on their primary scope while exposing observability + projection-fidelity gaps that don't fit the primary scope** — compose into next-mission scope rather than expand current mission. Discipline pattern: scope-tight-substrate-introduction beats scope-creep-substrate-introduction.

---

## §7 Tele alignment retrospective

### Primary tele coverage delivered

**tele-2 Frictionless Agentic Collaboration** — consumer-self-serve npm install + script-driven `update-adapter.sh` reduces consumer adapter-update friction from "rebuild + tgz repack + reinstall in 6 adapter dirs + plugin cache reinstall + session restart" to "single command". Pass 10 §B + §D step-skip-class regression closed structurally — manual recipe deprecated; consumer can't skip steps because there are no manual steps to skip. Distribution channel established for external + future-pool consumers (tele-2 forward-leaning).

**tele-7 Resilient Operations** — Pass 10 §B + §D mechanisation embedded in published packages closes calibration #25 root-cause class (mission-63 W4 surface; SDK rebuild gap). Active-session 6-step coordination protocol provides substrate-validation surface during cutover; 5-publish-iteration learning-curve absorbed via tight-cycle merge cadence (PR #122 → #123 → #124 → #125 → #126 all merged within UTC mission-day 2026-04-28; spans 2-day AEST window UTC+10) rather than scope blowup. Hold-on-failure discipline preserved: each fix-PR holds engineer-side install until lily-side verifies 6-step Step 2-3 GREEN.

### Secondary tele coverage delivered

**tele-3 Absolute State Fidelity** — adapter version-stamp visible at 4 surfaces (handshake `agent.advisoryTags.adapterVersion`; npm-installed `npm ls -g`; runtime-stamped adapter.log; update-script self-report). Silent SDK staleness (calibration #25 root cause) becomes detectable end-to-end. Namespace migration α→β clean cutover (no `@ois/*` deprecation alias) preserves wire-shape coherence — single namespace, no ambiguity.

⚠ **tele-3 fidelity regression surfaced via Calibration #40 composite (greg post-restart):** version-source-of-truth divergence (3 different version strings for same artifact) + adapterVersion projection gap defeats the version-stamp-as-staleness-detector promise in practice. Captured for idea-220 Phase 2 closure.

**tele-6 Deterministic Invincibility** — mission-class structural-inflection with substrate-introduction sub-class; third canonical execution of substrate-introduction pattern (after mission-56 + mission-62). 12 NEW calibrations + 1 bonus retire + 1 closed = repeatable substrate-introduction signature; calibration #34 (W3 collapse extended to 5-cycle iteration) + #32 (split-verification) + #38 (gitignore-root-anchor-leakage; structural fix via `files` whitelist) are mission-class-signature additions that prep future substrate-introduction missions for tighter execution.

### Tele faults closed (delta vs entry state)

- mission-63 calibration #25 — Pass 10 §B SDK rebuild gap; manual-recipe step-skip-class regression. Closed structurally via §2.4 + §2.7 + §B/§D deprecation + `.mcp.json` bundling.
- mission-62 calibration #6 — TS5055 SDK self-overwrite. Full-retire via tsconfig `exclude: ["dist"]` pattern (upgrades mission-62's partial-retire).
- mission-61 Layer-3 root-cause class — `file:` refs don't survive `npm pack`. Closed structurally via `workspace:*` placeholder + version-rewrite-at-publish-time mechanism.

### Tele faults surfaced (12 NEW + 1 follow-on)

- 6 substrate-class calibrations (#33 [→#37] + #35 + #36 + #37 + #38 + #39) — most closed structurally in-mission via PR cycle 0.1.0 → 0.1.4; #39 structural closure deferred to cleanup PR.
- 5 methodology calibrations (#29 + #30 + #31 + #32 + #34) — folded into W4 docs + future-mission deferrals; mostly OPEN methodology-fold-in territory.
- 1 composite (#40 — observability + projection-fidelity gaps; greg-surfaced) — OPEN; fold to idea-220 Phase 2.
- 1 follow-on (#41 NEW; kind=note rendering gap) — captured in cleanup PR; closure path = option (b) schema-validate at create_message entry-point.

### Tele weight observation

The tele faults surfaced this mission are **2/3 substrate-class structurally closed in-mission** + **1/3 OPEN (methodology + observability + render)**. Pattern signal: substrate-introduction missions with rigorous test-retrofit discipline (Section 6/7 in mission-64) close substrate-class faults in-mission; observability + render-fidelity faults survive into next mission (here: idea-220 Phase 2). This matches mission-62 retrospective precedent (substrate-class closed in-mission; observability deferred to mission-63 + mission-64).

---

## §8 Tier 2 follow-ons + sequencing for next mission

### Cleanup PR (post-mission housekeeping; S sizing ~half-day)

Pre-titled: **`[mission-64] post-cleanup — #39 structural + #40/#41 triage + e2e rollback + methodology fold`**

5-item bundle (greg + lily aligned on thread-412 round 3):

1. **Calibration #39 structural closure** — `git rev-parse --show-toplevel` resolution in `version-rewrite.js`; closes cwd-persistence defect class regardless of caller cwd
2. **E2E test side-effect rollback discipline** — backup+restore user `~/.claude/settings.json:extraKnownMarketplaces` around `claude plugin marketplace add` invocation in `full-end-to-end-install.test.sh` (test-hygiene class)
3. **#40 composite triage scoping** — explicit cross-reference to idea-220 Phase 2 mission-brief draft territory (no closure in cleanup PR; just the scoping doc)
4. **#41 NEW capture + closure-path scoping** — capture the calibration formally + propose option (b) entry-point validation as architect-lean structural closure for idea-220 Phase 2
5. **Methodology fold (Finding 3 + named pattern)** — `multi-agent-pr-workflow.md §2c.X` anti-pattern language (greg's draft excellent; lifting verbatim) + naming "the methodology-bypass-becomes-substrate-defect amplification loop" as architectural-pathology pattern in v1.0 ratified-with calibrations

**Architect-lean disposition:** land before Mission #5 since #41 + methodology fold inform Mission #5's choice quality (idea-220 Phase 2 picks up #40 + #41 better with the cleanup work landed).

### Mission #5 — idea-220 Phase 2 (Director-approved 2026-04-28T~23:45Z UTC)

**Scope (per memory `reference_idea_219_220_post_mission_62.md` + #40 + #41 fold):**
- Shim observability formalization Phase 2 — addresses #40.a (FileBackedLogger fd-not-open on fresh shim) + builds on mission-62 W4-followon shim observability Phase 1
- Engineer-side Agent-record read parity — addresses calibration #21 (mission-63 carryover) + #40.b (advisoryTag projection gap)
- Version-source-of-truth consolidation — addresses #40.c (3 different version strings for same artifact)
- thread_message marker-protocol design — addresses calibration #26 (mission-63 carryover; silent ~250-char truncation marker missing)
- **#41 entry-point schema-validation for create_message** — addresses kind=note rendering bilateral-blind defect class

**Sizing baseline:** L (~3-5 engineer-days) — Phase 2 of mission-63's idea-220 envelope; multi-surface observability + projection-fidelity formalization
**Phase 7 Release-gate dependencies:** none (no new credentials or external posture); Director Survey + Phase 7 ratification only
**Architectural-precedents to lean on:** mission-62 W4-followon shim observability Phase 1 PR #115 (FileBackedLogger initial implementation); mission-63 W4 substrate-self-dogfood (calibration #26 origin); mission-64 W4 + cleanup PR (#40 + #41 origin)

### Other Tier 2 follow-ons (Mission #6+ candidates; not Mission #5)

- **idea-221** Pass 10 cross-§ orchestration runner (operator-side §A + §C + cross-§ runner) — consumes mission-64's CLI contract; companion future mission. Sizing: M; Director-engagement: full Phase 7 Release-gate
- **idea-218** adapter local cache (mission-62 deferral; consumer-emergence trigger) — sizing TBD post-consumer-emergence-signal
- **idea-216** bug-35 selectAgents semantic shift (mission-62 deferral; survey-needed) — sizing TBD post-Survey

### Sequencing guidance for Mission #5

**Architect-lean ordering for Mission #5 + immediate Mission #6:**
1. **Cleanup PR** (this mission post-housekeeping; lily-direct; ~half-day; greg light-review) — lands before Mission #5 startup
2. **Mission #5 = idea-220 Phase 2** (Director-approved) — Phase 3 Survey starts; full-mode mission per scope L
3. **Mission #6 candidate = idea-221** (Pass 10 cross-§ orchestration) — composability strong with mission-64's CLI contract + idea-220 Phase 2 observability surfaces

If Director picks Mission #5 = idea-221 instead (alternative), idea-220 Phase 2 follow-on. Either order works; lily-lean is idea-220 Phase 2 first because #40 + #41 closure unlocks tele-3 fidelity regression-class issues that #41 in particular surfaces as bilateral-blind today.

### Process improvements for next mission

From this retrospective:
- **Pre-publish file-presence + post-install MCP-server-registration tests** — Section 6/7 retrofit pattern; apply to every npm-publish-channel package addition going forward
- **Repo-root cwd discipline** in publish runbooks — calibration #39 workaround until structural closure lands
- **Option A canonical thread protocol** for ALL architect→engineer actionable content (no kind=note shortcut) — Finding 3 methodology fold; cleanup PR codifies
- **5-publish iteration sizing baseline** for fresh-registry-namespace + Claude-Code-plugin-specific-files-discovery missions — sizing-baseline header should include "publish-iteration count" field for substrate-introduction missions going forward

---

## Closing — for Director review

### Mission status

mission-64 (M-Adapter-Streamline) **closed clean** at 2026-04-28 ~23:20Z UTC via `update_mission(mission-64, plannedTasks=[all completed], status=completed)` after PR #127 merged at `97790e2` (mergedAt `2026-04-28T23:17:35Z`). ADR-029 SCAFFOLD → RATIFIED bilateral. All architectural commitments delivered. Substrate stable on `@apnex/claude-plugin@0.1.4` `latest` with `.mcp.json` bundled + cross-pkg deps registry-pinned `^0.1.2`.

### Calibration ledger summary

**12 NEW + 1 follow-on (#41 deferred to cleanup PR) + 1 bonus retire (#6 mission-62 full) + 1 carryover closed (#25 mission-63).** Effective signature: **13 NEW substrate-class** when cleanup PR lands.

### Director engagement summary

- **Phase 7 Release-gate** ratified `@apnex` org claim + NPM_TOKEN credentials posture — clean execution; ~30min Director-time
- **Path A pre-approval** for architect-direct fix-PR under Calibration #38 P0 surface — clean recovery; greg back online for #126 + #127 bilateral review re-engaged
- **Phase 10 mode-pick** confirmed full retrospective (this doc) — mission-class structural-inflection + 12 NEW calibrations + 5-publish-iteration learning-curve + #40 composite tele-3 regression weight aligned
- **Mission #5 = idea-220 Phase 2** approved 2026-04-28T~23:45Z UTC

### Director-asks (queued post-this-retrospective)

1. **PR (this doc) admin-merge** per bug-32 baseline precedent (after greg light review per Option A thread)
2. **Cleanup PR scope ratification** — pre-titled `[mission-64] post-cleanup — #39 structural + #40/#41 triage + e2e rollback + methodology fold`; S sizing ~half-day; architect-direct lily; greg light review
3. **Mission #5 (idea-220 Phase 2) Phase 3 Survey scheduling** — when Director ready; architect drafts Survey envelope post-cleanup-PR

### What worked

- **Director-out autonomous-arc-driving** with Phase 7 + Path A + Phase 10 surface-points worked cleanly
- **Active-session 6-step coordination protocol** scaled to 5-cycle iteration without breaking
- **Path A architect-direct fix-PR pattern** under Director pre-approval + greg shutdown handled the P0 #38 surface within ~15 minutes recovery + #125 admin-merged cleanly
- **Calibration #24 dual-surface bilateral ratification** for ADR-029 SCAFFOLD → RATIFIED via thread-411 round 4 close-of-bilateral (engineer-side converged=true) + round 5 architect-side commit — methodology canonical
- **W3 dogfood-gate collapse pattern** (calibration #34) extended to 5-cycle iteration; substrate-class faults closed in-mission

### What didn't work / surfaced for next mission

- **kind=note shortcut for architect→engineer actionable content** (Finding 3 methodology callback; calibration #41 NEW) — bilateral-blind defect class; Option A canonical thread protocol is mandatory going forward
- **Version-stamp-as-staleness-detector** (calibration #25 closure verification surface) defeated in practice by version-source-of-truth divergence (#40.c) — idea-220 Phase 2 closure
- **install-time tests blind to post-Director-coord-restart MCP-server-registration** (#38 origin) — Section 6/7 retrofit closes the class but the original test design needed extension. Pattern P-D operationalized for future missions
- **5-publish iteration was not in design-time risk register** — substrate-introduction missions to fresh-registry-namespaces should pre-budget 4-5 publish iterations; design-time R2 risk register should explicitly account

### Mission #5 priorities (architect+engineer-aligned)

**idea-220 Phase 2** (Director-approved): shim observability formalization + engineer-side Agent-record read parity + version-source-of-truth consolidation + thread_message marker-protocol + **#41 entry-point schema-validation for create_message**. Sizing L; Phase 7 Release-gate dependencies: none; Phase 3 Survey scheduling at Director discretion post-cleanup-PR.

---

*Retrospective v1.0 ratified by lily / architect 2026-04-28T~23:40Z UTC; Director Phase 10 mode-pick directive 2026-04-28T~23:45Z UTC ("Approved" full mode per architect+engineer alignment on thread-411 round 4 close-of-bilateral). Bilateral architect+engineer pre-aligned on §4 calibration ledger + §7 tele alignment + §8 Tier 2 follow-ons via thread-410 + thread-411 + thread-412 closures (all 2026-04-28 UTC). thread-414 review nits + greg-flagged Calibration #42 NEW (timezone conflation discipline) folded via fixup commit pre-merge + cleanup PR capture.*
