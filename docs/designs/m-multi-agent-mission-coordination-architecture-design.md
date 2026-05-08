# M-Multi-Agent-Mission-Coordination-Architecture — Design v0.1 DRAFT

**Status:** **v0.1 DRAFT** (architect-side; pre-engineer-audit). Director-approved-to-Design 2026-05-08 post Survey envelope ratification at SHA `b27781e`. v0.1 architect-draft → engineer round-1 audit folds → v0.2 → engineer round-2 audit folds → v1.0 BILATERAL RATIFIED. See §8 Status for version-trajectory.
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

**Catalog count:** **11 sub-missions** (architect-recommendation; engineer round-1 audit may surface batching argument per F3).

| # | Sub-mission | Mission-class | Substrate location | Scope (1-line) | Dependencies | Tele primaries |
|---|---|---|---|---|---|---|
| 1 | M-Branchcraft-V1 | substrate-introduction | NEW repo `github.com/apnex/branchcraft` | Sovereign component: 5 pluggables (`IdentityProvider` / `ApprovalPolicy` / `StorageProvider` / `GitEngine` / `RemoteProvider`); 2 personas (standalone-CLI `brc` + library-SDK); IsomorphicGit primary; gh CLI GitHubRemoteProvider | none (foundational) | tele-3, tele-2 |
| 2 | M-Citation-Validator-Tooling | substrate-introduction | branchcraft repo (subcommand `brc citations validate`) per F1 architect-recommendation | Cross-repo citation resolver + PR-time validator gate; symbol-chain format `<component> > <file-path> > <class.method/function/symbol/type>`; version-aware resolution (citation valid at v1.x but not v2.x if symbol renamed) | M-Branchcraft-V1 (#1) | tele-2, tele-12 |
| 3 | M-Component-Repo-Extract-RepoEventBridge | structural-inflection | NEW repo `github.com/apnex-org/repo-event-bridge` | First migration playbook validation; leaf-most component (architect-recommendation per F2; engineer to validate dependency-graph); proves per-component-extraction pattern | M-Branchcraft-V1 (#1), M-Citation-Validator-Tooling (#2) | tele-3, tele-7 |
| 4 | M-Component-Repo-Extract-StorageProvider | structural-inflection | NEW repo `github.com/apnex-org/storage-provider` | Storage abstraction extraction; depends-on by hub | M-Branchcraft-V1 (#1), M-Citation-Validator-Tooling (#2), [optionally #3 to absorb playbook-refinement folds] | tele-3, tele-7 |
| 5 | M-Component-Repo-Extract-MessageRouter | structural-inflection | NEW repo `github.com/apnex-org/message-router` | Message routing extraction; depends-on by hub | #1, #2, #3, #4 | tele-3, tele-7 |
| 6 | M-Component-Repo-Extract-CognitiveLayer | structural-inflection | NEW repo `github.com/apnex-org/cognitive-layer` | Cognitive layer extraction; depends-on by hub; depends-on message-router | #1, #2, #5 | tele-3, tele-7 |
| 7 | M-Component-Repo-Extract-NetworkAdapter | structural-inflection | NEW repo `github.com/apnex-org/network-adapter` | Network adapter extraction; depends on hub-types; folding candidate for idea-259 (Adapter-Sovereign-Import-Cycle-Resolution) per F4 | #1, #2, #5 (preferred batching with this) | tele-3, tele-7 |
| 8 | M-Component-Repo-Extract-ClaudePlugin | structural-inflection | NEW repo `github.com/apnex-org/claude-plugin` | Claude adapter plugin extraction; depends on network-adapter | #1, #2, #7 | tele-3, tele-7 |
| 9 | M-Component-Repo-Extract-OpencodePlugin | structural-inflection | NEW repo `github.com/apnex-org/opencode-plugin` | OpenCode adapter plugin extraction; depends on network-adapter | #1, #2, #7 | tele-3, tele-7 |
| 10 | M-Component-Repo-Extract-Hub | structural-inflection | NEW repo `github.com/apnex-org/hub` | Hub runtime extraction; depends on all upstream components (#3 + #4 + #5 + #6); LAST component-extract to minimize cascading-failure surface | #1, #2, #3, #4, #5, #6 | tele-3, tele-7 |
| 11 | M-AgenticNetwork-Self-Migration | structural-inflection | EXISTING repo `github.com/apnex-org/agentic-network` (becomes architect-repo only) | Final migration: agentic-network purges component-substrate; retains idea/mission/audit/calibration entities + methodology docs + scripts + traces; becomes pure architect-repo | #1, #2, #3-#10 (all component extracts complete) | tele-3, tele-1 |

**Sub-mission count rationale (architect-recommendation per F3):** per-component-1-mission (8 component-extracts + branchcraft + citation-validator + agentic-network-self) = 11 sub-missions. Q2=c phased-incremental favors smallest blast-radius per sub-mission; batching wave-style (e.g., "wave 1 = leaf components; wave 2 = adapters; wave 3 = hub") would violate spirit of Q2=c. Engineer round-1 may surface batching argument if dependency-graph favors waves (e.g., #5+#6+#7 batched as "hub-dependency-cohort").

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

1. **Dependency audit:** which other components consume this component's exports? Validator-aware citation count; PR-impact estimate
2. **Boundary audit:** is current package boundary clean enough to extract? OR does it leak internal types? If leaks: file Phase-1.5-cleanup sub-task before extraction
3. **Test surface audit:** what tests currently exercise this component? Plan migration of test suite to new repo

#### §2.4.2 Extraction phase (Phase 2 — substrate)

4. **NEW repo creation:** `github.com/apnex-org/<component>-repo` under apnex-org GitHub namespace
5. **Code migration:** copy `packages/<component>/` source + tests + package.json (renamed scope or kept-same TBD per F-pending)
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
| F1 | Citation-validator host: branchcraft CLI subcommand vs separate ops-repo tool | MEDIUM | branchcraft CLI subcommand (§2.3.3) — single sovereign tool surface; reuses branchcraft's IsomorphicGit + RemoteProvider for cross-repo resolution | Challenge if validator scope balloons beyond branchcraft natural-fit (LSP-server-shaped) |
| F2 | First-component-to-migrate canonical 1st-migration candidate | MEDIUM | `repo-event-bridge` (sub-mission #3) — leaf-most dependencies; lowest cross-component coupling; smallest blast-radius for playbook validation | Validate dependency-graph; surface alternative if `storage-provider` or another leaf is more decoupled |
| F3 | Sub-mission count + ordering: ~8 component-migration sub-missions OR batched into wave-style larger-grained missions | MEDIUM | Per-component-1-mission (11 sub-missions total per §2.1) — Q2=c phased-incremental favors smallest blast-radius; batching violates spirit of Q2=c | Surface batching argument if dependency-graph favors waves (e.g., #5+#6+#7 as "hub-dependency-cohort") |
| F4 | idea-259 (Adapter-Sovereign-Import-Cycle-Resolution) folding | MEDIUM | Fold into sub-mission #7 (M-Component-Repo-Extract-NetworkAdapter) — import-cycle-resolution IS the network-adapter migration's core architectural challenge | Surface independence argument if scope incompatible |
| F5 | Workspace-state durability mechanism | PROBE | No recommendation; 3 candidates sketched at §2.2.5 (per-repo `.git/` commits / out-of-band snapshot store / IsomorphicGit `fs` adapter) | Surface preferred mechanism + rationale |
| F6 | Auto-merge configurability surface | MINOR | Both — CLI flag + mission-config-driven (§2.2.4) | Surface single-source-of-truth argument if applicable |
| F7 | Pluggable defaults for the 5 v1-pluggables | MEDIUM | Per §2.2.1 table: `LocalGitConfigIdentity` + `TrustAllPolicy` + `LocalFilesystemStorage` + `IsomorphicGitEngine` + (no RemoteProvider; gh-CLI opt-in) | Surface alternative defaults per ergonomic considerations |
| F8 | OIS-orchestrated persona scope: branchcraft v1 internal OR post-v1 sub-mission | **CRITICAL** | Post-v1 sub-mission (per §2.2.2) — OIS-orchestration is built ON TOP via OIS-side integration code; NOT branchcraft-internal; keeps branchcraft sovereign + category-tool-shaped | Challenge if interpretation differs — load-bearing for branchcraft v1 scope |
| F9 | New: Sub-mission count rationale (11 vs 10 vs ~15) | MEDIUM | 11 sub-missions per §2.1 (1 branchcraft + 1 citation-validator + 8 component-extracts + 1 agentic-network-self) | Surface count adjustment if dependency-graph or batching changes ordering |
| F10 | New: Migration playbook codification — methodology doc OR sub-mission template | PROBE | Phase 5 Manifest decision; architect-lean = methodology doc at `docs/methodology/component-migration-playbook.md` (reusable across all 8 component-extracts) | Surface preferred codification |
| F11 | New: Old-package deprecation mechanism per Q5=ac clean-break (npm unpublish 24h vs deprecate notice vs immediate-remove) | MEDIUM | Deprecate-immediate via `npm deprecate` (per Director's Q5=ac clean-break posture); 24h grace optional but not required | Surface preferred mechanism with consumer-impact rationale |
| F12 | New: Hub-orchestration mechanism for cross-repo lockstep PR-fan-out (Q5=a lockstep coordination) | PROBE | No recommendation; Hub-side mechanism TBD; could be branchcraft-CLI-driven OR Hub-MCP-tool-driven | Surface mechanism candidates |

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

### §6.2 Composition risk: hub-extract LAST cascade

Sub-mission #10 (M-Component-Repo-Extract-Hub) is the highest-blast-radius extraction (everything depends on hub). Architect-recommendation: stricter audit-rubric for sub-mission #10 (e.g., maxRounds=20+; multiple bilateral cycles; dry-run-extract simulations before live extract). Engineer may surface additional safeguards.

### §6.3 Composition risk: agentic-network-self-migration (#11) corner case

Sub-mission #11 migrates agentic-network itself, but agentic-network IS the substrate where idea/mission/audit entities live (including idea-261 + this Design doc). The migration must preserve all entities + their references. Architect-recommendation: sub-mission #11 is its own bilateral cycle with focused audit-rubric on entity-preservation. Engineer may surface specific preservation-mechanism (e.g., GraphQL export → GraphQL import via Hub MCP tools).

### §6.4 Open question: branchcraft v1 ship timeline (calendar vs deliverable-sized)

Q1=b (full architectural) means v1 ships 5 pluggables + 2 personas; this is non-trivial scope. Architect estimate (PROBE): 2-3 calendar weeks for full v1 if engineer-ratified scope holds. Engineer round-1 may surface scope-trim-or-extend discussion. Director may engage at v1-scope-ratification gate-point if scope materially exceeds estimate.

### §6.5 Open question: namespace migration for OIS components

`@apnex/<component>` (current monorepo scope) → `@apnex-org/<component>` (post-migration repo scope). This is a major-version-bump per Q5=ac. Sub-mission #3-#10 each carry this version-bump. Architect-recommendation per §2.4.2 step 5: rename scope at extraction time (not pre-migration). Engineer round-1 may surface alternative (e.g., keep `@apnex/<component>` scope; only repo location changes).

### §6.6 Open question: Phase 5 Manifest shape for mission-of-missions

Methodology silent on first-canonical mission-of-missions Manifest shape. Candidate options:
- **(a)** Phase 5 Manifest creates ALL 11 sub-mission Hub entities upfront with `proposed` status; activates one at a time
- **(b)** Phase 5 Manifest creates only sub-mission #1; subsequent sub-missions created as predecessor closes
- **(c)** Phase 5 Manifest creates a "catalog idea" that itself spawns sub-mission ideas + missions per execution

Architect-recommendation: **(a)** — declarative-up-front catalog; matches Q1=b "full architectural" posture; methodology-evolution candidate (per Survey calibration notes). Engineer round-1 may surface alternative.

---

## §7 Composition with calibration ledger

### §7.1 Calibration #62 audit-rubric maturation arc (16 instances)

Calibration #62 (deferred-runtime-gate-becomes-silent-defect-surface) currently at 16 instances; methodology-promotion proposal pending strategic-review. This meta-mission's per-component-migration playbook (§2.4) should explicitly cite + apply calibration #62's audit-rubric closures (a/b/c/d) at each sub-mission's Phase 4 Design + Phase 6 audit. Architect-recommendation: each sub-mission #3-#11 carries a "calibration #62 audit checklist" as part of its Phase 4 Design template.

### §7.2 Calibration cross-refs (this mission)

- **Closures-applied:** none yet (Phase 4 Design DRAFT; closures land at sub-mission ratification)
- **Candidates-surfaced:** meta-Survey-pattern (per-question-budget + pre-Survey-ratification-timeline; flag for methodology-evolution review post-mission-of-missions completion); migration-playbook-codification (potential `docs/methodology/component-migration-playbook.md` per F10)

---

## §8 Status / version-trajectory

| Version | Date | Trigger | Notes |
|---|---|---|---|
| v0.1 DRAFT | 2026-05-08 | architect-side draft post Director-approved-to-Design at SHA `b27781e` | this version; pre-engineer-audit |
| v0.2 (planned) | TBD | engineer round-1 audit folds | engineer surfaces F1-F12 challenges + new architect-flags (if any) |
| v1.0 BILATERAL RATIFIED (planned) | TBD | engineer round-2 audit close-of-bilateral | architect-side commit pin + Phase 5 Manifest entry trigger |

**Phase 4 dispatch destination:** greg / engineer; round-1 bilateral audit thread (Hub thread entity); maxRounds candidate = 12 (per `feedback_director_direct_scope_expansion_maxrounds.md` — first-canonical mission-of-missions warrants higher round budget vs typical 5/8 bug-fix; mission-of-missions audit-cycle naturally surfaces methodology questions worth thread budget).

**Architect-side commit pin:** v0.1 DRAFT will be committed + pushed to `agent-lily/m-multi-agent-mission-coord-survey` branch in same dispatch step (per `feedback_narrative_artifact_convergence_discipline.md` atomic pattern).
