# M-Multi-Agent-Mission-Coordination-Architecture — Design v1.0 BILATERAL RATIFIED

**Status:** **v1.0 BILATERAL RATIFIED** (thread-507 round-5 engineer converged-close 2026-05-08T09:30:09Z + round-6 architect label-flip + bilateral-commit close 2026-05-08T09:31Z). v0.1 architect-draft → v0.2 engineer-round-1-folds → v1.0 PENDING-BILATERAL engineer-round-2-folds → v1.0 BILATERAL RATIFIED engineer-round-3-converge-close. Round-budget closed at 6/12 — first-canonical mission-of-missions audit-cadence validated. See §8 Status for full version-trajectory.
**Mission name:** M-Multi-Agent-Mission-Coordination-Architecture (idea-261; meta-mission)
**Mission-class:** structural-inflection (umbrella; meta-mission shape — deliverable = catalog of downstream sub-missions, not direct substrate); each sub-mission carries its own mission-class candidate (per §2 catalog)
**Source idea:** idea-261 (M-Multi-Agent-Mission-Coordination-Architecture)
**Survey:** `docs/surveys/m-multi-agent-mission-coordination-architecture-survey.md` v1.0 (Round-1 + Round-2 ratified 2026-05-08; composite intent envelope §3)
**Tele primaries (ratified):** tele-3 Sovereign Composition + tele-2 Isomorphic Specification (whole-mission primaries); tele-7 Resilient Operations + tele-8 Gated Recursive Integrity (whole-mission secondaries)
**Authors:** lily / architect (v0.1); bilateral round-1 audit with greg / engineer pending Phase 4 dispatch
**Lifecycle phase:** 4 Design (architect-led; Phase 4 round-1 audit dispatch to greg pending)
**First-canonical observations:**
- First-canonical **mission-of-missions** shape — deliverable IS the sub-mission catalog (Phase 5 Manifest will expand the catalog into individually-tracked Hub mission entities with their own lifecycles)
- First-canonical **multi-repo mission** shape — branchcraft sub-mission lives in `github.com/apnex/branchcraft` (new sovereign repo) while idea/mission/audit entities live in `github.com/apnex-org/agentic-network`

---

## §1 Goal + intent (echo Survey envelope §3)

**Goal:** Ratify the catalog of downstream sub-missions that operationalize Director's 2027 architectural vision for multi-agent code coordination, ordered + scoped + dependency-mapped + tele-anchored. Phase 5 Manifest converts this catalog into individual Hub mission entities; Phase 6+ executes them sequentially per Q2=c phased-incremental discipline.

**Architectural framing:** *"Build branchcraft v1 as architecturally-complete, OSS-from-day-1, category-contribution standalone tool at `github.com/apnex/branchcraft`. Build citation-validator second. Migrate OIS components 1:1 to repos via per-component sequential sub-missions, leaf-most components first, hub-repo last. Cross-repo breaking changes use lockstep-coordination + semver-major-bump signaling — clean-break posture; semver IS the spec; no deprecation-runway. Mission-of-missions deliverable IS this catalog."*

**Tele anchors (ratified):**
- **tele-3 Sovereign Composition** PRIMARY — full pluggable architecture from branchcraft v1; Law-of-One per pluggable interface; current OIS package boundaries preserved as sovereign-module boundaries during migration
- **tele-2 Isomorphic Specification** PRIMARY — branchcraft v1 API IS the spec; bit-perfect contracts published from day 1; semver IS the cross-repo truth-channel; symbol-chain citations enforce spec-as-runtime
- **tele-7 Resilient Operations** SECONDARY — phased-incremental migration = small blast radius per step; per-sub-mission failure doesn't cascade
- **tele-8 Gated Recursive Integrity** SECONDARY — each component-migration certified independently before next; binary pass/fail per sub-mission ascension

**Composition with pre-Survey ratification timeline (3 architectural-commitment ratifications 2026-05-08):**
- (R1) standalone-repo from start → branchcraft sub-mission lives in github.com/apnex/branchcraft (NEW sovereign repo)
- (R2) any-git-endpoint compatible → IsomorphicGit primary; pure-git fallback when no RemoteProvider configured
- (R3) gh CLI for GitHub-host (NOT Octokit; NOT hand-rolled HTTP) → lean dependency surface; single auth flow via `gh auth token`

---

## §2 Architecture

### §2.1 Sub-mission catalog (load-bearing deliverable)

**Catalog ordering principle:** dependency-driven topological order. Branchcraft v1 first (foundational substrate; everything else uses it). Citation-validator second (must exist before component-migrations to enforce citation-density at PR-time). Component-migrations leaf-most first (smallest blast-radius; proves migration playbook). Hub-repo last (every other component depends on it; failed extraction cascades). Agentic-network self-migration final (architect-repo extraction; idea/mission/audit substrate stays put until last).

**Catalog count:** **11 sub-missions** (engineer round-1 audit confirmed per-component-1-mission per F3; no natural batching boundary).

**Topology (v0.2 corrected via engineer round-1 substrate-currency walk of `packages/*/package.json` + `adapters/*/package.json`):**

```
Layer 0 (4 true leaves; zero @apnex/* runtime deps):
  - storage-provider, cognitive-layer, message-router, repo-event-bridge
  - (repo-event-bridge has devDep on storage-provider; nuance noted in §2.4.1)
Layer 1 (depends on Layer 0 only):
  - network-adapter ← (cognitive-layer, message-router)
Layer 2 (depends on Layer 0/1; mutually independent at this layer):
  - claude-plugin ← (cognitive-layer, message-router, network-adapter)
  - opencode-plugin ← (cognitive-layer, message-router, network-adapter)
  - hub ← (repo-event-bridge, storage-provider) ONLY
```

| # | Sub-mission | Mission-class | Source path → Target repo | Scope (1-line) | Dependencies (runtime) | Tele primaries |
|---|---|---|---|---|---|---|
| 1 | M-Branchcraft-V1 | substrate-introduction | NEW: `github.com/apnex/branchcraft` | Sovereign component: 5 pluggables (`IdentityProvider` / `ApprovalPolicy` / `StorageProvider` / `GitEngine` / `RemoteProvider`); 2 personas (standalone-CLI `brc` + library-SDK); IsomorphicGit primary; gh CLI GitHubRemoteProvider | none (foundational) | tele-3, tele-2 |
| 2 | M-Citation-Validator-Tooling | substrate-introduction | branchcraft repo (subcommand `brc citations validate`) per F1 | Cross-repo citation resolver + PR-time validator gate; symbol-chain format `<component> > <file-path> > <class.method/function/symbol/type>`; version-aware resolution | #1 | tele-2, tele-12 |
| 3 | M-Component-Repo-Extract-StorageProvider | structural-inflection | `packages/storage-provider/` → `github.com/apnex-org/storage-provider` | First migration playbook validation; TRUE-zero @apnex/* deps (runtime + dev); cleanest playbook-validation surface | #1, #2 | tele-3, tele-7 |
| 4 | M-Component-Repo-Extract-MessageRouter | structural-inflection | `packages/message-router/` → `github.com/apnex-org/message-router` | True-leaf extraction; zero @apnex/* deps; second playbook validation on simple-leaf | #1, #2 | tele-3, tele-7 |
| 5 | M-Component-Repo-Extract-CognitiveLayer | structural-inflection | `packages/cognitive-layer/` → `github.com/apnex-org/cognitive-layer` | True-leaf extraction; zero @apnex/* deps; third playbook validation on simple-leaf — playbook now battle-tested 3× before devDep complexity | #1, #2 | tele-3, tele-7 |
| 6 | M-Component-Repo-Extract-RepoEventBridge | structural-inflection | `packages/repo-event-bridge/` → `github.com/apnex-org/repo-event-bridge` | Runtime-leaf but devDep on storage-provider (test infra); tests playbook richer-shape with devDep cross-resolve at extraction-time (post-#3 storage-provider already extracted) | #1, #2, #3 (devDep cross-resolve) | tele-3, tele-7 |
| 7 | M-Component-Repo-Extract-NetworkAdapter | structural-inflection | `packages/network-adapter/` → `github.com/apnex-org/network-adapter` | Layer-1 extraction; deps cognitive-layer + message-router; folding candidate for idea-259 (Adapter-Sovereign-Import-Cycle-Resolution) per F4 | #1, #2, #4, #5 | tele-3, tele-7 |
| 8 | M-Component-Repo-Extract-ClaudePlugin | structural-inflection | `adapters/claude-plugin/` → `github.com/apnex-org/claude-plugin` | Layer-2 extraction; deps cognitive-layer + message-router + network-adapter (3-deps; Layer-2 cascade-source class — see §6.2 reframe) | #1, #2, #4, #5, #7 | tele-3, tele-7 |
| 9 | M-Component-Repo-Extract-OpencodePlugin | structural-inflection | `adapters/opencode-plugin/` → `github.com/apnex-org/opencode-plugin` | Layer-2 extraction; same dep-shape as #8; mutually independent of #8 at extraction-time | #1, #2, #4, #5, #7 | tele-3, tele-7 |
| 10 | M-Component-Repo-Extract-Hub | structural-inflection | `hub/` → `github.com/apnex-org/hub` | Hub runtime extraction; deps ONLY repo-event-bridge + storage-provider; **F13 RATIFIED v1.0:** package.json `"name": "hub"` → `"name": "@apnex/hub"` at extraction time (namespace consistency; Q5=ac compose with major-version-bump; npm registry sovereign-name) | #1, #2, #3, #6 | tele-3, tele-7 |
| 11 | **M-AgenticNetwork-Substrate-Purge** | structural-inflection | EXISTING repo `github.com/apnex-org/agentic-network` → architect-repo only | Final operation: PURGE component-substrate from agentic-network (not migration-to-new-repo); retains idea/mission/audit/calibration entities + methodology docs + scripts + traces | #1, #2, #3-#10 (all component extracts complete) | tele-3, tele-1 |

**Sub-mission ordering principle (v1.0 explicit):** **strict-simplicity progression** — true-leaves (zero @apnex/* deps runtime + dev) extracted first (#3-#5; 3 simple-leaves) → playbook battle-tested 3× before devDep-richer extraction (#6 repo-event-bridge with devDep on storage-provider) → Layer-1 (#7) → Layer-2 (#8 + #9 mutually-independent) → hub (#10; runtime-criticality cascade-source) → substrate-purge (#11 final).

**Sub-mission count rationale:** per-component-1-mission (8 component-extracts + branchcraft + citation-validator + agentic-network-substrate-purge) = 11 sub-missions. Q2=c phased-incremental philosophy + corrected dependency-graph confirms no natural batching boundary.

**Optional folding candidate (F4):** idea-259 (Adapter-Sovereign-Import-Cycle-Resolution) → architect-recommendation = fold into sub-mission #7 (M-Component-Repo-Extract-NetworkAdapter) as a Phase-4 Design scope expansion, since the import-cycle-resolution IS the network-adapter migration's core architectural challenge. Engineer round-1 may surface independence argument.

### §2.2 Branchcraft v1 internal architecture (sub-mission #1 detail)

This section sketches the v1 architectural shape — Phase 4 Design of M-Branchcraft-V1 (a separate sub-mission) will concretize. Here we lock the umbrella scope.

#### §2.2.1 Pluggable interfaces (5 — all v1-shipped per Q1=b full architectural)

| Interface | Concern | v1 default (architect-recommendation per F7) | Notes |
|---|---|---|---|
| `IdentityProvider` | Who is this agent (commit author + signing) | `LocalGitConfigIdentity` — read from `git config user.name/email`; signing optional | v2+ may add `OIDCIdentity`, `SigstoreIdentity`, etc. |
| `ApprovalPolicy` | Should this commit be auto-approved or held for human review | `TrustAllPolicy` — auto-approve everything (operator opts in to approval ceremony explicitly) | v2+ may add `RuleBasedPolicy`, `LLMReviewPolicy`, etc. |
| `StorageProvider` | Where do workspaces live (filesystem; S3; ephemeral) | `LocalFilesystemStorage` — per-mission `/missions/<id>/<repo>/` paths under configurable root | v2+ may add `S3Storage`, `MemoryStorage`, etc. |
| `GitEngine` | What library executes git wire-protocol | `IsomorphicGitEngine` — pure-TS; no native bindings; portable | v2+ may add `LibGit2Engine` for performance; `ShellGitEngine` for local-debug |
| `RemoteProvider` | How do we talk to a remote forge (GitHub / GitLab / Gitea / pure-git) | NONE (pure-git mode); gh-CLI opt-in via `GitHubRemoteProvider(ghCliPath)` | v2+ may add `GitLabRemoteProvider`, `GiteaRemoteProvider` |

**v1 default-stack composition:** `LocalGitConfigIdentity` + `TrustAllPolicy` + `LocalFilesystemStorage` + `IsomorphicGitEngine` + (no RemoteProvider; pure-git mode). Operator opts in to GitHub features via `brc remote add github --provider=gh-cli`.

#### §2.2.2 Personas (2 v1-shipped per Q1=b)

- **Standalone-CLI persona:** `brc <verb>` invocation surface. Verbs (v1 minimum): `init`, `clone`, `branch`, `commit`, `push`, `pull`, `merge`, `mission start`, `mission complete`, `citations validate` (per #2 sub-mission). Operator-friendly; `brc --help` documented.
- **Library-SDK persona:** `import { Branchcraft } from '@apnex/branchcraft'` consumption. Programmatic API mirrors CLI verbs. TypeScript-first; ships `.d.ts`.
- **OIS-orchestrated persona (POST-V1; per F8 architect-recommendation):** OIS-side integration code consumes branchcraft library-SDK. NOT branchcraft-internal. Built ON TOP via OIS-side adapter (post-v1 sub-mission, OR included in M-Component-Repo-Extract-Hub when hub gains branchcraft-orchestration capability).

#### §2.2.3 Mission shape (workspace contract)

- **Mission ID format:** `<id>` is the Hub mission entity ID (e.g., `mission-72`)
- **Workspace path:** `/missions/<id>/<repo>/` per Director ratification 2026-05-08
- **Single-writer-per-mission lock:** acquired at `brc mission start`; released at `brc mission complete` (or `brc mission abandon`); enforced by `ApprovalPolicy` if configured
- **One-active-mission-per-repo lock:** repo-level lock prevents two missions checking out conflicting branches simultaneously
- **Ephemeral by default:** mission workspaces destroyed at completion (operator opt-in to retain via `--retain` flag); long-lived workspaces only for ops-repos (per Director ratification)

#### §2.2.4 Auto-merge configurability (per F6 architect-recommendation)

- **Both surfaces:** CLI flag (`brc merge --auto`) for ad-hoc; mission-config-driven (declarative `auto-merge: true` in mission manifest) for governance-scope missions
- **Auto-merge ≠ auto-deploy:** Director ratification 2026-05-08; merge happens; deploy is operator-explicit downstream

#### §2.2.5 Periodic state durability (per F5 PROBE)

Mechanism PROBE-flagged for engineer-architect-bilateral resolution. Candidate options to consider in M-Branchcraft-V1 Design:
- **(a)** Per-repo `.git/` commits — every N seconds, dirty workspace state committed to a `wip/<mission-id>` branch
- **(b)** Out-of-band snapshot store — workspace state serialized to `StorageProvider` at intervals; recovery via deserialize
- **(c)** IsomorphicGit's `fs` adapter — leverage pluggable filesystem layer for journal-style durability

Architect has no recommendation; surface as Design-phase open-question.

### §2.3 Citation-validator architecture (sub-mission #2 detail)

#### §2.3.1 Citation format (canonical; spec-as-runtime per tele-2)

**Symbol-chain format:** `<component> > <file-path> > <class.method | function | symbol | type>`

**Examples:**
- `network-adapter > src/dispatcher.ts > Dispatcher.handleMessage`
- `hub > src/policy/session-policy.ts > sessionPolicy`
- `branchcraft > src/engine/isomorphic-git-engine.ts > IsomorphicGitEngine.commit`

#### §2.3.2 Resolution semantics

- **Cross-repo aware:** citation `<component>` segment resolves to a sovereign-component repo (e.g., `network-adapter` → `github.com/apnex-org/network-adapter`)
- **Version-aware:** citation may pin a version (`network-adapter@1.x > ...`); validator checks symbol existence at that version's published tag
- **PR-time enforcement:** validator runs as PR check in each consumer-repo; rejects PR if any citation resolves to a missing/renamed symbol
- **Migration-friendly:** during component-extraction sub-missions, validator can resolve citations against in-flight extraction state via configurable resolver-path

#### §2.3.3 Hosting (per F1 architect-recommendation = MEDIUM)

- **Architect-recommendation:** branchcraft CLI subcommand (`brc citations validate <pr-diff-or-file>`) — single sovereign tool surface; reuses branchcraft's `IsomorphicGit` + `RemoteProvider` for cross-repo resolution; avoids second sovereign-tool maintenance surface
- **Engineer round-1 audit ask:** challenge if scope balloons beyond branchcraft natural-fit (e.g., LSP-server-shaped resolver benefits from separate ops-repo)

### §2.4 Migration playbook (per-component-extraction sub-mission template)

Each component-extraction sub-mission (sub-missions #3-#10) follows this playbook. Phase 5 Manifest may codify as a methodology doc or as a sub-mission-template.

#### §2.4.1 Pre-extraction phase (Phase 1 — methodology)

1. **Dependency audit (runtime + test-time):** (a) which other components consume this component's exports (forward-edge / consumer-cardinality)? (b) which components does THIS component consume — runtime-deps AND devDeps including test infra? Validator-aware citation count; PR-impact estimate. **v0.2 fold:** test-time devDeps must be explicitly audited (not just runtime deps); engineer round-1 found repo-event-bridge has devDep on storage-provider not visible in runtime-only audit.
2. **Boundary audit:** is current package boundary clean enough to extract? OR does it leak internal types? If leaks: file Phase-1.5-cleanup sub-task before extraction
3. **Test surface audit:** what tests currently exercise this component? Plan migration of test suite to new repo

#### §2.4.2 Extraction phase (Phase 2 — substrate)

4. **NEW repo creation:** `github.com/apnex-org/<component>-repo` under apnex-org GitHub namespace
5. **Code migration:** copy source from `packages/<component>/` (sub-missions #3-#7, #10) OR from `adapters/<plugin>/` (sub-missions #8 + #9 per F18 substrate-location asymmetry) + tests + package.json. Current npm scope `@apnex/*` retained (Q4=a 1:1 source-path→repo mapping; npm-scope is NOT the migration variable per §6.5 v0.2 correction).
6. **Branchcraft mission orchestration:** use branchcraft to coordinate cross-repo branch + commit + push (this is the FIRST validation that branchcraft v1 + citation-validator work in production-extraction shape)
7. **CI setup:** GitHub Actions workflow per `.github/workflows/release-plugin.yml` precedent (mission-72)
8. **First publish:** `npm publish` to npmjs.com; tag as `v1.0.0` (this is a major-version-bump because import-paths change from `@apnex/<component>` to `@apnex-org/<component>` per Q5=ac semver-major-bump signaling)

#### §2.4.3 Consumer-update phase (Phase 3 — coordination)

9. **Consumer-repo PR fan-out:** all consumer repos open coordinated PRs updating their `package.json` to point at the new component-repo's `v1.0.0`. Per Q5=a lockstep-coordination, all consumer-PRs merged atomically (or as close as possible — TBD on Hub-orchestration mechanism per F-pending)
10. **Citation-validator PR-time enforcement:** validator confirms all citations to migrated component still resolve at v1.0.0
11. **Old-package deprecation:** `npm unpublish` 24h grace-period? OR DEPRECATE notice on npmjs? TBD per F-pending. (Director's clean-break posture per Q5=ac suggests deprecate-immediate.)

#### §2.4.4 Validation phase (Phase 4 — gate)

12. **Cross-repo CI green:** all consumer repos' CI passes against new component-repo
13. **Mission complete:** branchcraft `mission complete` releases lock; sub-mission Phase 9 close

### §2.5 Cross-sub-mission concerns

#### §2.5.1 Mission-execution workspace shape

- **Path convention:** `/missions/<id>/<repo>/` (repeated from §2.2.3 for cross-section reference)
- **One workspace per (mission, repo) tuple:** a multi-repo mission spans multiple workspaces; branchcraft coordinates
- **Ephemeral by default:** destroyed at mission complete; operator opt-in to retain

#### §2.5.2 Ops-repo treatment (long-lived workspace exception)

Ops-repos (e.g., monitoring scripts; infra-as-code; operator dashboards) are the ONLY long-lived workspace category per Director ratification 2026-05-08. Branchcraft supports `--ops` flag at workspace creation to mark long-lived; mission-lock semantics relaxed for ops-repos (no mission-bound lifecycle).

#### §2.5.3 GitHub org boundary discipline (tele-3 mechanism)

- **`github.com/apnex/branchcraft`** (sovereign personal namespace) — branchcraft is category-tool; OIS happens to use it
- **`github.com/apnex-org/<each-component>`** (OIS-org namespace) — OIS components remain in OIS-org during + after migration
- **`github.com/apnex-org/agentic-network`** — architect-repo final-state (post sub-mission #11)

This namespace separation operationalizes tele-3 Sovereign Composition at GitHub-infrastructure-level: branchcraft cannot accidentally couple to OIS-org-internal substrate because they're distinct GitHub orgs.

---

## §3 Engineer audit asks (Phase 4 round-1 audit; carry F1-F8 from Survey §6)

Architect-flags batched for engineer's round-1 content-level audit. Each flag carries an architect-recommendation to challenge. Per mission-67 + mission-68 audit-rubric precedent: CRITICAL / MEDIUM / MINOR / PROBE classifications.

| # | Flag | Classification | Architect-recommendation | Engineer-audit ask |
|---|---|---|---|---|
| F1 | Citation-validator host: branchcraft CLI subcommand vs separate ops-repo tool | MEDIUM | RATIFIED — brc subcommand (§2.3.3) — single sovereign tool surface; reuses IsomorphicGit + RemoteProvider; LSP-server-shape can come post-v1 if scope balloons. Engineer round-1 concur. |
| F2 | First-component-to-migrate canonical 1st-migration candidate | MEDIUM | **RATIFIED v0.2 SWAP — `storage-provider` first** (sub-mission #3); repo-event-bridge moved to #4. Engineer round-1 counter: storage-provider has TRUE-zero @apnex/* deps (runtime + dev); repo-event-bridge has devDep on storage-provider (test infra); cleanest playbook-validation surface = storage-provider first. |
| F3 | Sub-mission count + ordering | MEDIUM | RATIFIED — 11 sub-missions; per-component-1-mission. Engineer round-1 concur: corrected dependency-graph (Layer 0 = 4 leaves; Layer 1 = 1 component; Layer 2 = 3 mutually-independent) confirms no natural batching boundary. |
| F4 | idea-259 folding into sub-mission #7 (network-adapter) | MEDIUM | RATIFIED — fold-as-Phase-4-Design-scope-expansion. Engineer concur: import-cycle-resolution IS network-adapter-extraction's core challenge; will surface independence-argument only if sub-mission #7 Phase 4 reveals structurally-separable concern. |
| F5 | Workspace-state durability mechanism | PROBE | DEFER — to M-Branchcraft-V1 Phase 3 Survey (Director-intent question on failure-mode protection: process-crash vs disk-failure vs network-partition-during-push). Engineer round-1 concur. |
| F6 | Auto-merge configurability surface | MINOR | RATIFIED — both CLI flag + mission-config-driven (§2.2.4). Engineer concur: different operator-time-horizons; no single-source-of-truth argument applies. |
| F7 | Pluggable defaults for the 5 v1-pluggables | MEDIUM | RATIFIED — defaults per §2.2.1 table. Engineer concur: sane category-tool defaults; no ergonomic concerns surfaced. |
| F8 | OIS-orchestrated persona scope: branchcraft v1 internal OR post-v1 sub-mission | **CRITICAL** | **RATIFIED — post-v1 sub-mission** (per §2.2.2). Engineer concur: library-SDK persona (Q1=b) covers migration-playbook use case; OIS-internal coupling stays out of branchcraft v1; category-tool-shape preserved. |
| F9 | Sub-mission count rationale (11 vs 10 vs ~15) | MEDIUM | RATIFIED — 11 per §2.1 (1 branchcraft + 1 citation-validator + 8 component-extracts + 1 substrate-purge). Engineer concur. |
| F10 | Migration playbook codification | PROBE | RATIFIED — methodology doc at `docs/methodology/component-migration-playbook.md` + **mandatory calibration #62 audit checklist section** baked into structure. Engineer round-1 specifically recommended the calibration-checklist-as-mandatory-section refinement. |
| F11 | Old-package deprecation mechanism per Q5=ac clean-break | MEDIUM | RATIFIED — `npm deprecate` immediate (no runway). Engineer concur: clean-break + semver-major-bump signaling means consumers either upgrade or stay on old version. |
| F12 | Hub-orchestration mechanism for cross-repo lockstep PR-fan-out | PROBE | RATIFIED — branchcraft-CLI-driven (`brc cross-repo-pr fan-out --target=v1.0.0`); concrete design defers to M-Branchcraft-V1 Phase 4. Engineer round-1 concur architect-lean: same-tool-orchestrates-both pattern; Hub-MCP-tool-driven is heavier-weight + couples to OIS-internal. |
| F13 | Hub package unscoped name (`"hub"` not `@apnex/hub`) | MEDIUM | **RATIFIED v1.0 architect-call** — `hub` → `@apnex/hub` rename at sub-mission #10 extraction time. Reasoning: (1) namespace consistency — all OIS components stay `@apnex/*`; hub remaining unscoped creates topology-asymmetry; (2) Q5=ac compose — bundle scope-rename atomically with major-version-bump + repo-location change; single breaking change is operationally cleaner than two; (3) npm registry discoverability — unscoped `hub` likely collides with existing npm package; `@apnex/hub` is unambiguously sovereign; (4) operator-impact minimal — hub is operator-deployed (not import-consumed), so install command changes (`npm install @apnex/hub`) but no source-code import changes. Architect-call mechanism per `feedback_architect_call_not_director_decision.md`; surfaces at sub-mission #10 Phase 3 Survey for Director-intent visibility but doesn't open a Director-gate-point question (architectural-cleanup, not Director-intent). |
| F18 | NEW (engineer round-1): substrate-location asymmetry — claude-plugin + opencode-plugin live under `adapters/`, not `packages/` | MEDIUM | RATIFIED v0.2 fold — §2.1 column renamed "Source path → Target repo"; §2.4.2 step 5 amended to handle both source-roots; Q4=a "1:1 source-path→repo" framing clarified. |
| F19 | NEW (engineer round-1): sub-mission #11 terminology — "M-AgenticNetwork-Self-Migration" misnames the operation | MINOR | RATIFIED v0.2 fold — renamed to **M-AgenticNetwork-Substrate-Purge**. Cosmetic but clarifies operator-intent (purge component-substrate; not migration-to-new-repo). |

---

## §4 Anti-goals (carry from Survey §5)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Strukto-mirage-style VFS for code (read+write GitHub mount with semantic-region merging) — explicitly out-of-scope | Future research idea (post-2027) |
| AG-2 | CRDT / region-lock / semantic-merge for intra-mission concurrency — single-writer-per-mission lock eliminates the question | Future idea if multi-writer-per-mission ever surfaces |
| AG-3 | Director-chat ACP redesign + universal adapter rework — separate architectural arc | `project_director_chat_acp_redesign.md` memory; future idea |
| AG-4 | API v2.0 tool-surface scoping — defer to idea-121 | idea-121 (API v2.0) |
| AG-5 | Migration of agentic-network itself — covered by sub-mission #11 (the LAST sub-mission); deliberately last | Sub-mission #11 |
| AG-6 | Octokit dependency / hand-rolled HTTP for GitHub operations — explicit lean-dependency exclusion | Decision locked 2026-05-08 |
| AG-7 | Pre-migration re-architecting of current package boundaries — Q4=a 1:1 mapping locks today's boundaries | Future post-migration architectural mission |

---

## §5 Tele alignment per sub-mission (whole-mission roll-up)

| Sub-mission | Primary tele | Secondary tele | Rationale |
|---|---|---|---|
| #1 M-Branchcraft-V1 | tele-3, tele-2 | tele-11, tele-7 | Sovereign-composition (5 pluggables) + spec-as-runtime (v1 API IS spec) |
| #2 M-Citation-Validator-Tooling | tele-2, tele-12 | tele-4, tele-3 | Spec-as-runtime (citations enforce spec) + LLM-context-precision (validator preserves citation-density) |
| #3-#10 Component-Repo-Extracts | tele-3, tele-7 | tele-8, tele-1 | Per-component sovereign-module-boundary preservation + small-blast-radius migration |
| #11 M-AgenticNetwork-Self-Migration | tele-3, tele-1 | tele-7, tele-8 | Final sovereign-composition + state-transparency (architect-repo state-backplane queryable) |

**Whole-mission tele primaries (umbrella):** tele-3 + tele-2.
**Whole-mission tele secondaries (umbrella):** tele-7 + tele-8.

---

## §6 Risks + open questions (architect-side; pre-engineer-audit)

### §6.1 Composition risk: branchcraft v1 + citation-validator dual-substrate ship

Sub-missions #1 + #2 are both substrate-introduction (NEW substrate); shipping in close succession means both are simultaneously young + may surface integration defects only when consumed by sub-mission #3 (first component-extract). Architect-recommendation: ship #1 + #2 with extensive integration test surface (test sub-mission #3 against #1+#2 in sandbox before launching real #3). Engineer round-1 may surface alternative integration-validation strategy.

### §6.2 Composition risk: Layer-2 adapter-plugins are cascade-source (v0.2 reframe per engineer round-1 substrate-currency walk)

**v0.1 framing was empirically incorrect** — hub is NOT the highest-blast-radius extraction; hub depends on only 2 leaves (repo-event-bridge + storage-provider per corrected §2.1 dependency-graph). The actual highest-cardinality extracts are the **Layer-2 adapter-plugins** (claude-plugin + opencode-plugin; 3 deps each: cognitive-layer + message-router + network-adapter).

**Cascade-source class identification:** sub-missions #8 + #9 (adapter-plugin extracts) are at risk of cascade-failure if extracted while their Layer-1 dependency (network-adapter, sub-mission #7) is still in-flight OR if any of their Layer-0 dependencies (cognitive-layer, message-router; sub-missions #5 + #6) churn during their extraction window.

**Architect-recommendation v0.2:** stricter audit-rubric for sub-missions **#7 (M-Component-Repo-Extract-NetworkAdapter)** + **#8 + #9 (adapter-plugin extracts)** — these are the cascade-source surfaces. Sub-mission #10 (hub) retains some-stricter-rubric for empirical reason: hub is the central runtime + the substrate other operators depend on at deployment-time even if @apnex/* dependency-cardinality is only 2. But "everything depends on hub" framing is wrong — hub-extract is more about runtime-criticality than dependency-graph-cardinality. Engineer may surface additional safeguards for the corrected risk surface.

### §6.3 Composition risk: agentic-network-self-migration (#11) corner case

Sub-mission #11 migrates agentic-network itself, but agentic-network IS the substrate where idea/mission/audit entities live (including idea-261 + this Design doc). The migration must preserve all entities + their references. Architect-recommendation: sub-mission #11 is its own bilateral cycle with focused audit-rubric on entity-preservation. Engineer may surface specific preservation-mechanism (e.g., GraphQL export → GraphQL import via Hub MCP tools).

### §6.4 Open question: branchcraft v1 ship timeline (calendar vs deliverable-sized)

Q1=b (full architectural) means v1 ships 5 pluggables + 2 personas; this is non-trivial scope. Architect estimate (PROBE): 2-3 calendar weeks for full v1 if engineer-ratified scope holds. Engineer round-1 may surface scope-trim-or-extend discussion. Director may engage at v1-scope-ratification gate-point if scope materially exceeds estimate.

### §6.5 npm-scope retention through migration (v0.2 correction)

**v0.1 framing was incorrect** — conflated GitHub-org-name with npm-scope. Current npm scope `@apnex/*` (e.g., `@apnex/storage-provider`, `@apnex/network-adapter`) is RETAINED through migration; not changing. The migration variable is **GitHub repo location** (`github.com/apnex-org/<component>` for OIS components; `github.com/apnex/branchcraft` for sovereign-tool) + version (semver-major-bump per Q5=ac signaling).

`hub` package is currently UNSCOPED (`"name": "hub"` in `hub/package.json`) — see F13 NEW for sub-mission #10 scope-decision discussion.

Q5=ac major-version-bump signaling: each component's `v1.x` (post-extract) signals "import path resolution is now repo-based, not monorepo-workspace-based"; consumers update `package.json` deps to point at the new repo (still under `@apnex/*` scope). No scope-rename is required.

### §6.6 Phase 5 Manifest shape — RATIFIED (b) just-in-time per engineer round-1 reasoning

**v0.2 ratification:** **(b) just-in-time** — Phase 5 Manifest creates only sub-mission #1 (M-Branchcraft-V1) at meta-mission Phase 5; subsequent sub-missions created at execution-time-window (when their predecessor is closing OR their dependency-graph clears).

**This Design doc is the source-of-truth catalog** (markdown, version-controlled, easy-to-edit); Hub mission entities are created just-before-activation. Composes-with calibration #62 discipline: don't pre-commit substrate state for work that won't run for weeks.

**Engineer round-1 reasoning ratified:**
- Operator-tracking surface: 11 entities in `proposed` status creates dashboard noise; cognitive-load high
- Sub-mission scope evolves during execution; declarative-up-front entities require entity-mutation overhead when scope shifts
- Calibration #62 alignment: pre-creating entities for delayed work creates state-drift surface

**Methodology-evolution candidate:** post-meta-mission completion, retrospective should evaluate whether (b) just-in-time becomes the canonical mission-of-missions Manifest shape OR whether (a-modified) variants emerge (e.g., pre-create only foundational substrate-introductions). For THIS meta-mission: pure (b).

---

## §7 Composition with calibration ledger

### §7.1 Calibration #62 audit-rubric maturation arc (16 instances)

Calibration #62 (deferred-runtime-gate-becomes-silent-defect-surface) currently at 16 instances; methodology-promotion proposal pending strategic-review. This meta-mission's per-component-migration playbook (§2.4) should explicitly cite + apply calibration #62's audit-rubric closures (a/b/c/d) at each sub-mission's Phase 4 Design + Phase 6 audit. Architect-recommendation: each sub-mission #3-#11 carries a "calibration #62 audit checklist" as part of its Phase 4 Design template.

### §7.2 Calibration cross-refs (this mission)

- **Closures-applied:** none yet (Phase 4 Design v0.2 DRAFT; closures land at sub-mission ratification)
- **Candidates-surfaced (v0.2 augmented per engineer round-1 calibration #62 audit-rubric application):**
  - meta-Survey-pattern (per-question-budget + pre-Survey-ratification-timeline; flag for methodology-evolution review post-mission-of-missions completion)
  - Migration-playbook-codification at `docs/methodology/component-migration-playbook.md` with mandatory calibration #62 audit checklist section (F10 RATIFIED)
  - **NEW v0.2 deferred-surfaces enumerated for transparency** (each is a calibration #62 candidate; tracking explicitly to defeat substrate-described-but-not-substrate-tested pattern):
    - Workspace-state durability mechanism (§2.2.5 PROBE; defer to M-Branchcraft-V1 Phase 3 Survey)
    - Hub-orchestration mechanism for cross-repo lockstep PR-fan-out (F12 PROBE; defer to M-Branchcraft-V1 Phase 4)
    - Phase 5 Manifest shape ratified as (b) just-in-time (§6.6 v0.2 ratified) — methodology-evolution candidate; first-canonical mission-of-missions Manifest precedent
    - Migration playbook codification status (currently prose-described; v0.2 ratifies methodology-doc-as-deliverable but doc itself doesn't exist yet — calibration #62 surface until F10 deliverable lands)

---

## §8 Status / version-trajectory

| Version | Date | Trigger | Notes |
|---|---|---|---|
| v0.1 DRAFT | 2026-05-08 | architect-side draft post Director-approved-to-Design at SHA `b27781e` | pre-engineer-audit; pushed at SHA `b6b4a55` |
| v0.2 DRAFT | 2026-05-08 | engineer round-1 audit folds (thread-507) | CRITICAL §2.1 dependency-graph corrections; F2 swap; F18 NEW; F19 rename; §6.2 reframe; §6.6 ratify (b) just-in-time; §6.5 npm-scope correction; §7.2 deferred-surfaces enumerated; pushed at SHA `23371e3` |
| v1.0 PENDING-BILATERAL-RATIFICATION | 2026-05-08 | engineer round-2 audit folds (thread-507) | (1) §2.1 sub-mission ordering re-sequenced per engineer strict-simplicity-progression — true-leaves #3-#5 (storage-provider / message-router / cognitive-layer) before devDep-richer #6 (repo-event-bridge); (2) F13 RATIFIED architect-call — `hub` → `@apnex/hub` rename at sub-mission #10 extraction time; pushed at SHA `1ca56da` |
| **v1.0 BILATERAL RATIFIED** | **2026-05-08** | **engineer round-3 converge-close (thread-507 round 5/12) + architect label-flip + bilateral-commit close (round 6/12)** | **this version; label-flip only — no substantive content change from v1.0 PENDING-BILATERAL @ SHA `1ca56da`. Phase 5 Manifest unblocked: creates sub-mission #1 (M-Branchcraft-V1) Hub entity at execution-time-window per §6.6 (b) just-in-time discipline; downstream sub-missions per topological order** |

**Phase 4 thread:** thread-507 (post bug-57 + bug-58 substrate-corrected dispatch path; first canonical broadcast architect→engineer audit cycle on the corrected substrate); maxRounds=12; round-budget consumed at v1.0 dispatch: 4/12.

**Architect-side commit pins:** v0.1 → `b6b4a55`; v0.2 → `23371e3`; v1.0 PENDING-BILATERAL → THIS COMMIT (post-push). Per `feedback_narrative_artifact_convergence_discipline.md` atomic edit→commit→push→dispatch pattern.
