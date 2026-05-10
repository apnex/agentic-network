# M-Missioncraft-V1 — Design v4.5 PENDING-ROUND-7

**Status:** **v4.5 PENDING-ROUND-7** (architect-side; engineer round-6 audit fold on thread-513 — 8 findings: 0 META + 0 HIGH + 4 MEDIUM + 4 MINOR — over architect's predicted 0-2 envelope; substrate-mechanism precision-issues from load-bearing v4.4 SUBSTANTIAL fold per `feedback_refactor_introduces_regression_during_fold.md` — R6 catch-net pattern; all bounded-scope corrections). v4.5 commits substrate-mechanism precision corrections: R6.1 push-refspec source-vs-destination + R6.2 Loop B git-archive|tar mechanism + R6.3 'joined' state atomic-write Step 3.5 + R6.4 zod schema-factory pattern; all 4 MINOR fixes inline. Composes from **v4.4 SUBSTANTIAL** at SHA `62d5a9a`. Cumulatively from v4.4 PARTIAL → v4.3 → v4.2 → v4.1 → v4.0 → v3.6 BILATERAL RATIFIED at SHA `e581a21`.

**12 scope items (idea-265; bilateral architect↔Director walkthrough 2026-05-10):**

The cumulative refinement is **multi-participant missions with read-only role + cross-host workspace sync** — eliminates substrate-leakage of git mechanics into engineer-experience for cross-host design-share + analysis flows. Reader-role principal's workspace auto-syncs from writer's wip-branch via shared coordination point. Topology-uniform: same-host (local bare repo coord) and cross-host (network remote coord) use identical substrate-architecture.

1. **Mission-wide participant granularity (NEW concept):** `mission.participants[]` field with role-typed entries (`writer` / `reader`). Each principal runs concurrent missions with separate workspaces; participant-set is mission-scoped. Per-mission daemon-watcher continues per-principal.

2. **Strict-enforce reader workspace mode (filesystem 0444):** reader's per-principal workspace files are filesystem-mode `0444` (read-only). Reader's editor refuses writes; missioncraft enforces at filesystem-level not just msn-CLI-level.

3. **Sync cadence reuses `wip-cadence-ms`:** single knob; reader's daemon polls writer's wip-branch on shared coord at same cadence as writer's debounce-window (default 30s).

4. **Reader-side actions = pure-read at v1:** comment / annotate / line-tied-thread deferred to v1.x per Lean 6 YAGNI + concrete demand.

5. **Wip-push to coordination remote conditional on readers:** wip-cadence-tick fires wip-commits to local wip-branch (existing v3.6 baseline) AND pushes to shared coordination remote IFF `mission.participants[]` contains at least one `role: reader`. Solo writer-only missions stay local-only (zero needless network/disk traffic; matches v3.6 baseline).

6. **Coordination-point configurable per topology:** NEW `mission.coordination-remote` field. Default per-topology resolution: same-host = local bare repo at `<shared-coord-root>/<mission-id>.git`; cross-host = network remote (typically GitHub). Cross-host architecture subsumes same-host; substrate is uniform (coordination-remote is just a git remote URL).

7. **Workspace-root principal-scoped per-agent:** existing v3.6 `configSet workspace-root <path>` mechanism preserved; default-resolution behavior on multi-principal hosts TBD per Director-pick during round-1 audit (working-tree-derived `<working-tree>/.missioncraft/workspace/` vs principal-id-suffixed `~/.missioncraft-<principal-id>/workspace/` vs explicit-required). Each principal's workspace MUST be distinct on multi-principal hosts.

8. **Substrate-coordinate addressing convention (NEW):** `<mission-id>:<repo>/<path>` single-string format; principal-portable; resolved per-host to local workspace path. gsutil-style ecosystem-idiomaticity (tele-5 perceptual-parity / cross-clone-consistency). Composes uniformly across `msn workspace`, `msn show`, `msn list`.

9. **`msn workspace` extends to substrate-coordinate granularity:** existing `msn workspace <id> [<repo>]` extends to accept colon-notation single-arg form for file-level resolution: `msn workspace m-foo:design-repo/docs/foo.md` → absolute file path. Path-resolution semantic only at v1 (substrate-noun addressing preserved; verb-name describes addressed-resource not resolution-operation).

10. **Substrate-coordinate addressing applies uniformly across all verbs that take a resource-id:** `msn show <coord>`, `msn list <coord>`, `msn workspace <coord>`. Engineer learns addressing-syntax once.

11. **`msn list <coord>` drill-down semantics:** row-per-resource at coordinate-granularity. `msn list` (row-per-mission); `msn list m-foo` (row-per-repo with columns role | sync-state | remote | ...); `msn list m-foo:design-repo` (row-per-file at v1.x). Each granularity uses different columns; verb-shape uniform.

12. **v1.x deferrals (per Lean 6 YAGNI):** file-level `msn list <coord>/<dir>/`; coordinate-versioning `<coord>@<sha>`; force-sync `msn sync`; existence-check primitive; content-display verbs (`msn cat` / `msn ls`); reader-side annotation/comment/line-tied-thread; co-writer mode; multi-writer atomic transactions; per-repo participation. All compose with v1 substrate; defer until concrete demand.

**Cumulative architectural shift:**
- Mission concept extends from single-principal-per-workspace to multi-principal with role-scoped permissions
- Daemon-watcher gains reader-mode (remote-watch + 0444 enforcement) alongside existing writer-mode
- Coordination-remote field decouples wip-coordination-point from publish-flow's remote (PR-target remote)
- Substrate-coordinate addressing is the NEW principal-portable resource-addressing primitive

**Tele alignment** (per `tele-glossary.md` v1.0 + `director-doctrine.md` v0.1):
- tele-1 sovereign-state-transparency (writer's wip is sovereign-state across hosts)
- tele-3 sovereign-composition (`participants[]` bit-perfect uniform interface; substrate-coordinate as addressing primitive)
- tele-5 perceptual-parity (architect↔engineer perception delta minimized via auto-sync; gsutil-style ecosystem-idiomaticity)
- tele-6 zero-friction (engineer's read-flow carries zero git-ceremony — primary lean)
- tele-11 cognitive-economy (engineer's working-memory holds zero substrate-mechanics; one addressing-syntax)

**Director-doctrine alignment** (per `director-doctrine.md` v0.1):
- Lean 1 substrate-invisibility (PRIMARY) — engineer never invokes git
- Lean 4 k8s-shape — `participants[]` resource via existing `update<T>` polymorphism (no new verb); substrate-coordinate uniform across verbs
- Lean 5 explicit-attribution — writer/reader principals attribution-explicit
- Lean 7 target-state-pull — post-ratify revisitation of v3.6 (the trigger-pattern Lean 7 explicitly authorizes)

**v3.6 RATIFIED preserved:** architecturally-clean preservation; v4.0 is additive (extends mission-config schema; extends daemon-watcher modes; extends CLI verb argument-shapes) without breaking v3.6 contracts. Solo writer-only missions on v4.0 behave identically to v3.6 baseline.

---

**ARCHIVED — v3.6 BILATERAL RATIFIED status (preserved historical context for v3.x → v4.0 transition):**

v3.6 was ratified via 7-round Phase 4 audit cycle on thread-512: 55 findings folded across rounds (R1=22 → R2=11 → R3=9 → R4=6 → R5=4 → R6=3 → R7=0 ratify-clean) — pattern matches thread-510 v1.x envelope shape (substrate-shift cycle). Composes from **v3.5 PENDING-ROUND-6** at SHA `fa2f6b4` + **v3.6 PENDING-ROUND-7** at SHA `12408b8`. v3.6 SUPERSEDED v2.5 as implementation-target Strict-1.0 contract; v4.0 SUPERSEDES v3.6 as new implementation-target.

**8 Director-direct architectural refinements (Round-3; approved 2026-05-09-late post v2.5 RATIFIED):**

The cumulative refinement is **engineer-git-less code workspace hypervisor framing** — Engineer interacts with code via filesystem only; missioncraft handles all git operations (commits, branches, pushes, PRs, cleanup) invisibly. Engineer's CLI surface collapses to 4-6 verbs total.

1. **DROP `msn git` namespace + `*InMission` SDK methods (BREAKING + simplification):** engineer-git-less framing makes per-mission git-op wrapping unnecessary. ~13 SDK methods removed (`branchInMission`/`commitInMission`/`pushInMission`/etc.); 5-positional `msn git <id> <repo> <verb>` grammar pattern removed; reserved-verb `git` removed. Engineer uses workspace path via `msn workspace` (NEW); engine handles all git ops internally via GitEngine pluggable.

2. **DROP `msn status` verb (simplification):** redundant with `msn list` (no-arg) + `msn show <id>` (with-arg). `list` becomes unified tabular default; `show` covers per-mission detail. Reserved-verb `status` removed.

3. **DROP cooperative-tick on operator-CLI-op-activity (substrate model shift):** engineer never invokes per-op CLI commands; cooperative-tick model from v2.5 §2.6.5 is invalidated. Replaced with **filesystem-watch cadence-tick** + per-mission daemon-watcher process spawned at `msn start`.

4. **ADD `msn complete <id|name> <message>` 2-positional + atomic PR-set publish-flow:** mission completion is a HEAVY publish-action, not just lifecycle-state mutation. Per-repo: squash wip-commits → push to remote → openPullRequest. Atomic across mission's repos; partial-failure recovery via idempotent retry. `--message` is required positional (audit-record + PR-title). `msn abandon <id|name> <message>` symmetric.

5. **CHANGE cadence-tick model to filesystem-watch (substrate model shift):** §2.6.1 + §2.6.2 + §2.6.5 substantively re-spec'd. Engine spawns per-mission daemon-watcher process at `start`; watcher uses Node `fs.watch` API + debounce-window (default 30s) to fire `commitToRef` on filesystem-modify events. Watcher dies on `complete`/`abandon`. Per-mission daemon-mode at v1 (no global daemon).

6. **ADD `msn workspace <id|name> [<repo-name>]` verb (path resolution):** replaces `msn git`'s implicit workspace discovery. Engineer obtains absolute path: `cd $(msn workspace <id> <repo>)`. Composable with shell. Engine-side: SDK exposes via `workspace(id, repoName?): Promise<string>`.

7. **SDK API consolidation — verb-polymorphism over resource-type (k8s-shape at SDK level; resource-uniformity tele):** SDK class shifts from per-resource-typed methods (`createMission`/`createScope`/`getMission`/`getScope`/etc.) to **universal generic verbs parameterized by ResourceType**: `create<T>(type, opts)` / `get<T>(type, id, opts?)` / `list<T>(type, filter?, opts?)` / `update<T>(type, id, mutation: MutationOf<T>)` / `delete<T>(type, id)`. Mission-specific verbs (`start`/`apply`/`complete`/`abandon`/`tick`/`workspace`) retained at top-level for genuine functional differences. Per-resource last-mile logic stays internal (private dispatchers). MissionMutation + ScopeMutation are discriminated-unions per-resource. **Method count: 30 → 14 (~53% reduction).** Adding new resource-type at v3.x (e.g., `release`, `task`) just extends ResourceMap interface; no new method-exposure required.

8. **Commit + push authentication semantics — clarification-fold (NEW §2.6.6):** explicitly pins identity-capture timing (at commit-firing-time, NOT startMission-time); wip-commit vs squash-commit attribution divergence (best-practice: same actor runs `msn start` + `msn complete`); single-RemoteProvider-per-mission constraint at v1; multi-org same-host gh-cli auth handling; multi-host gh-cli auth requirements; AI-agent-provisioning discipline (operator-side); identity uniformity across mission's repos; failure modes + recovery via RemoteAuthError + idempotent `msn complete` retry. v1.x additive evolution paths (per-repo auth override; multi-RemoteProvider; per-mission identity override) noted. Closes substrate-currency surface that prior v1.x → v2.5 versions left under-spec'd.

**Cumulative shift in CLI surface:**
- Reserved-verbs count: 14 (v2.5) → 13 (v3.0) [drop `status` + `git`; add `workspace`]
- Sub-action vocabularies: 5 (v2.5) → 4 (v3.0) [drop `git`-scoped; retain `update` + `scope` + `scope update` + `config`]
- Engineer's typical CLI vocabulary: 4-6 verbs (`scope create`, `create`, `start`, `complete`, `abandon`, `workspace`)

**Cumulative shift in SDK surface:**
- Method count: 30 (v2.5) → 14 (v3.0) [universal verbs collapse 15 typed-update + 6 typed-CRUD; mission-specific verbs preserved]
- 5 universal verbs (`create` / `get` / `list` / `update` / `delete`) parameterized by ResourceType
- 6 mission-specific verbs (`start` / `apply` / `complete` / `abandon` / `tick` / `workspace`)
- 2 operator-config (`configGet` / `configSet`)
- 1 static (`isPlatformSupported`)
- New types: `ResourceType`, `ResourceMap`, `MissionMutation`, `ScopeMutation` (discriminated-unions)

**Cumulative shift in mission tele:** explicit ENGINEER COGNITIVE-LOAD MINIMIZATION as primary value-prop. Missioncraft is invisible substrate; engineer focuses purely on code changes; every git operation, branch, PR, push, cleanup is engine-handled. Architect-engineer separation of concerns: architect drives mission via brief; engineer executes; missioncraft is the substrate that bridges.

**v2.5 RATIFIED preserved as historical artifact at `agent-lily/m-missioncraft-v2-design` SHA `5984334`.** v3.0 reshape inherits all v2.5 substrate-currency contracts (5 pluggables; PROVIDER_REGISTRY closed-set; symlink name-mechanism; 8-step lock-acquisition order; preserve-config invariant; lifecycle-state engine-controlled; operator-config schema; precedence chain; OS-support boundary; cross-resource lock-ordering; scope template + hybrid resolution; effective-repos compatibility; `update`-scoped + `scope`-scoped sub-action vocabularies) — v3.0 deltas are CLI grammar simplification (drop git+status; add workspace) + complete-as-publish-flow + filesystem-watch cadence-tick model. Strict-1.0 contract committed for `@apnex/missioncraft@1.0.0` (SDK still ships at 1.0.0 — design-doc v3.0 indicates audit-cycle iteration; implementation hasn't started).

**Trajectory:** v0.1 → v0.7 → v1.0 BILATERAL RATIFIED on prior `agent-lily/m-branchcraft-v1-survey` branch → v1.x → v1.8 BILATERAL RATIFIED on `agent-lily/m-missioncraft-v1-design` → v2.x (Round-2 of refinements; 3 architectural refinements) → v2.5 BILATERAL RATIFIED at SHA `5984334` → **v3.0 PENDING-BILATERAL-RATIFICATION** (this version; Round-3 of Director-direct refinements; 6 architectural refinements; engineer-git-less workspace-hypervisor framing) → engineer round-1 audit per comprehensive-sweep methodology → v3.0 BILATERAL RATIFIED.

**3 Director-direct architectural refinements (Round-2; approved 2026-05-09-late post v1.8 RATIFIED):**

1. **Verb-first grammar (BREAKING):** all first positionals are reserved verbs; no implicit mission-selector at first position. Eliminates v1.8 §2.3.2 Rule 4 disambiguation algorithm complexity. Cleaner k8s-shape (matches `kubectl <verb> <resource> <name>` exactly per refinement #2 trajectory).

2. **`update` verb (additive; composes with #1):** new top-level verb for field-targeted mutations. Complements `apply -f <path>` (declarative full-config-upsert) — Model 2 boundary: `apply` for full-upsert (k8s-style declarative); `update` for field-targeted programmatic mutations (k8s `kubectl edit`-shape but programmatic-with-args, NOT interactive-editor). Verb-name picked over `edit` per modern-CLI convention (kubectl reserves `edit` for interactive-editor; `update` is programmatic-mutation per `npm update` / `helm upgrade`-equivalent).

3. **`scope` template (additive; new first-class resource):** reusable repo-collection that multiple missions reference via `--scope <id>`. Scope = template-shape; mission instantiates with copy-on-startMission (option (c) hybrid resolution model per k8s-ConfigMap analogy). New SDK class methods (createScope/getScope/listScopes/updateScope/deleteScope/addRepoToScope/removeRepoFromScope) + new CLI verb namespace (`msn scope <verb>`) + new schema (ScopeConfig + ScopeState + ScopeStatePhase) + new workspace path (`<workspace>/scopes/<scope-id>.yaml` + `<workspace>/scopes/.names/<slug>.yaml` symlink) + new lifecycle (no `started`/`in-progress` — scopes are templates, not active resources).

**v1 trajectory preserved as historical artifact at `agent-lily/m-missioncraft-v1-design` SHA `226aa46`.** v2.0 reshape inherits all v1.8 substrate-currency contracts (5 pluggables; PROVIDER_REGISTRY closed-set; mission resource type interfaces; symlink name-mechanism; 7-step lock-acquisition order; preserve-config invariant; lifecycle-state engine-controlled; operator-config schema; precedence chain; OS-support boundary; etc.) — v2.0 deltas are CLI grammar reshape + SDK API extension + new Scope resource. Strict-1.0 contract committed for `@apnex/missioncraft@1.0.0` (SDK still ships at 1.0.0 — design-doc v2.0 indicates audit-cycle iteration; implementation hasn't started; pre-implementation cost is design-only).

**Trajectory:** v0.1 → v0.7 → v1.0 BILATERAL RATIFIED on prior `agent-lily/m-branchcraft-v1-survey` branch → v1.1 PENDING-BILATERAL (Round-1 of Director-direct refinements; 6 architectural refinements) → v1.2 → ... → v1.8 BILATERAL RATIFIED at SHA `226aa46` → **v2.0 PENDING-BILATERAL-RATIFICATION** (this version; Round-2 of Director-direct refinements; 3 architectural refinements pre-Phase-6) → engineer round-1 audit per comprehensive-sweep methodology → v2.0 BILATERAL RATIFIED.

**v1.1 Director-direct architectural refinements 2026-05-08-evening:**

1. **Rename branchcraft → missioncraft + CLI binary `brc` → `msn`** — captures mission-orchestration-as-primary-surface identity; npm scope `@apnex/missioncraft`; repo `github.com/apnex/missioncraft`
2. **Drop "mission" verb prefix** — CLI is `msn <verb>` not `msn mission <verb>`; mission is the implicit primary resource; non-mission ops keep explicit prefixes (`msn remote`, `msn config`)
3. **`apply` mid-mission additive-only** — `msn apply -f <path>` allows ADDING repos to a started mission; non-additive mutations (remove repo / change pluggable) error with "complete+restart required"
4. **SDK-primary contract surface** — Strict-1.0 commits SDK type signatures; CLI is sovereign-module SDK consumer; OIS adapter is also an SDK consumer (NOT a separate persona — OIS-orchestrated persona collapses)
5. **Shape B hybrid single-package + internal sovereign-module separation** (Q3 refinement) — single npm package `@apnex/missioncraft` with internal sovereign-module directory boundaries (`src/missioncraft-sdk/`, `src/missioncraft-cli/`); CLI imports SDK as if external
6. **`-sdk` / `-cli` / `-api` suffix convention on modules** — internal directory naming + future-spinout-package naming follow suffix convention; future REST-shim attaches as `src/missioncraft-api/` internal OR `@apnex/missioncraft-api` separate package

v1.1 fold cycle on new thread (TBD; thread-510 candidate) at maxRounds=20 per Director directive for substantive architectural reshapes; realistic 6-9 rounds close per thread-509 pattern empirics. See §8 Status for full version-trajectory + comprehensive-sweep methodology empirical baseline (n=6 across library-API + runtime-platform dimensions; rate-decay 1→6→1→0 across rounds 4-7).
**Mission name:** M-Missioncraft-V1 (idea-263; sub-mission #1 of meta-mission idea-261)
**Mission-class:** substrate-introduction (foundational; first sub-mission of 11-sub-mission catalog; everything else uses missioncraft)
**Source idea:** idea-263 (M-Missioncraft-V1)
**Survey:** `docs/surveys/m-missioncraft-v1-survey.md` (Round-1 + Round-2 ratified 2026-05-08; composite intent envelope §3)
**Tele primaries (ratified):** tele-3 Sovereign Composition + tele-2 Isomorphic Specification (whole-mission); tele-7 Resilient Operations + tele-11 Cognitive Minimalism (secondary)
**Authors:** lily / architect (v0.1); bilateral round-1 audit with greg / engineer pending Phase 4 dispatch (thread-509; maxRounds=20)
**Lifecycle phase:** 4 Design (architect-led)
**Repo location:** NEW sovereign repo `github.com/apnex/missioncraft` (under Director's personal namespace; NOT apnex-org); npm scope `@apnex/missioncraft`; OSS Apache 2.0 day-1; published to npmjs.com

---

## §1 Goal + intent (echo Survey §3)

**Goal:** Ship missioncraft v1.0.0 — sovereign, architecturally-complete sovereign component at `github.com/apnex/missioncraft`. 5 pluggable interfaces + 2 personas (standalone-CLI + library-SDK) + IsomorphicGit primary GitEngine + gh-CLI opt-in GitHubRemoteProvider. Strict 1.0 API stability commitment from day-1. Single-package shipping. Comprehensive 3-failure-mode durability. Patient ~6-8 week timeline. Bounded test (unit + integration) + doc (operator-onboarding) surface.

**Architectural framing:** *"missioncraft v1 ships comprehensive + strict + simple + patient + bounded. Comprehensive durability across process-crash + disk-failure + network-partition. Strict 1.0 API as committed contract from day-1. Single-package `@apnex/missioncraft` for simplest consumer DX. Patient timeline absorbs upfront substrate-investigation. Bounded test/doc surfaces — minimum viable validation + operator-onboarding-priority docs."*

**Tele anchors (ratified):**
- **tele-3 Sovereign Composition** PRIMARY — 5 pluggables; Law-of-One per interface; sovereign sovereign-component as category-tool
- **tele-2 Isomorphic Specification** PRIMARY — v1 API IS the spec; strict-1.0 from day-1; semver IS the cross-repo truth-channel; symbol-chain citations enforce spec-as-runtime
- **tele-7 Resilient Operations** SECONDARY — 3-failure-mode durability; integration-tested round-trip; patient timeline absorbs substrate-investigation
- **tele-11 Cognitive Minimalism** SECONDARY — single-package import surface; bounded test/doc; deterministic primitives; no over-engineering

---

## §2 Architecture

### §2.1 Pluggable interfaces (5 — full TypeScript signatures)

All 5 interfaces ship in v1.0.0 per parent Q1=b full architectural posture. Strict 1.0 stability commitment per Q2=a — every signature here is committed contract; breaking changes post-v1 are major-version-bumps.

#### §2.1.1 `IdentityProvider`

```typescript
export type SigningKey =
  | { type: 'gpg'; fingerprint: string }
  | { type: 'ssh'; publicKey: string }; // public-key path or base64-encoded handle

export interface AgentIdentity {
  readonly name: string;
  readonly email: string;
  readonly signingKey?: SigningKey; // discriminated union (v0.2 fold per §C.5); optional
}

export interface IdentityProvider {
  /** Resolve the agent identity for commits + signed operations. Called once per mission start. */
  resolve(): Promise<AgentIdentity>;
}
```

**Default v1 implementation:** `LocalGitConfigIdentity` — reads `git config user.name` + `git config user.email`; if `git config user.signingkey` set: GPG fingerprint detected by hex-format match (40-char hex), else SSH public-key path resolution.

#### §2.1.2 `ApprovalPolicy`

```typescript
export type ApprovalAction =
  | "commit"
  | "push"
  | "force-push"          // v0.2 fold per §C.2 — distinct from regular push
  | "pull"                // v0.2 fold per §C.2
  | "merge"
  | "branch-create"       // v0.2 fold per §C.2 — F16 wip-branch needs approval surface
  | "branch-delete"       // v0.2 fold per §C.2 — wip-branch cleanup gate
  | "mission-start"       // v0.2 fold per §C.2 — operator lifecycle gate
  | "mission-complete"
  | "mission-abandon";    // v0.2 fold per §C.2

export interface ApprovalContext {
  readonly missionId: string;
  readonly repoUrl: string;
  readonly branch: string;
  readonly action: ApprovalAction;
  readonly metadata: Record<string, unknown>;
}

export interface ApprovalDecision {
  readonly approved: boolean;
  readonly reason?: string;
}

export interface ApprovalPolicy {
  /** Decide whether an action proceeds. Called at each gated action. */
  decide(context: ApprovalContext): Promise<ApprovalDecision>;
}
```

**Default v1 implementation:** `TrustAllPolicy` — `{approved: true}` for every context. Operator opts in to ceremony explicitly via mission-config or alternative pluggable. **`static readonly providerName = 'trust-all'`** (v1.6 fold per MINOR-R5.1; required for SDK-injection vs mission-config string-name validation per MEDIUM-R4.2).

#### §2.1.3 `StorageProvider`

```typescript
export interface WorkspaceHandle {
  readonly missionId: string;
  readonly repoUrl: string;
  readonly path: string; // absolute filesystem path
}

export interface LockHandle {
  readonly id: string;            // unique identifier for the lock
  readonly missionId: string;
  readonly acquiredAt: Date;
  readonly expiresAt: Date;
}

export interface StorageProvider {
  /** Allocate workspace for mission + repo. Idempotent on re-allocate. */
  allocate(missionId: string, repoUrl: string): Promise<WorkspaceHandle>;
  /** Release workspace (destroy unless retained). */
  release(handle: WorkspaceHandle, options?: { retain?: boolean }): Promise<void>;
  /** List active workspaces for a mission. */
  list(missionId: string): Promise<WorkspaceHandle[]>;
  /** Bulk-release for mission cleanup. v0.2 fold per §C.4. */
  cleanup(missionId: string): Promise<void>;

  // Lock primitives (v0.2 fold per §C.4 — surfaced into interface contract for 3rd-party StorageProvider implementations;
  //                  v0.3 fold per §CC — `timeoutMs` split into `waitMs` + `validityMs` (separate concepts);
  //                  inspect surface generalized to `inspectLocks`)
  /** Acquire mission-lock (single-writer-per-mission). Throws LockTimeoutError if waitMs exceeded; auto-releases stale locks where Date.now() > existing.expiresAt. */
  acquireMissionLock(missionId: string, options: {
    waitMs?: number;        // wait-timeout (how long to wait if held by another); default 0 (fail-fast)
    validityMs?: number;    // lock TTL (auto-expiry for stale-recovery); default 86400000 (24h per F14)
  }): Promise<LockHandle>;
  /** Acquire repo-lock (one-active-mission-per-repo). Throws WorkspaceConflictError if held by different mission. */
  acquireRepoLock(repoUrl: string, missionId: string, options: {
    waitMs?: number;        // default 0 (fail-fast)
    validityMs?: number;    // default 86400000 (24h)
  }): Promise<LockHandle>;
  /** Release lock (idempotent on already-released). */
  releaseLock(lock: LockHandle): Promise<void>;
  /** Check lock state without acquiring. v0.3 fold per §CC — generalized over both lock-types. */
  inspectLocks(filter?: { missionId?: string; repoUrl?: string }): Promise<LockHandle[]>;
}
```

**Default v1 implementation:** `LocalFilesystemStorage` — **`static readonly providerName = 'local-filesystem'`** (v1.6 fold per MINOR-R5.1) — under `${MSN_WORKSPACE_ROOT}` (default `~/.missioncraft`):
- Mission configs at `${MSN_WORKSPACE_ROOT}/config/<missionId>.yaml` (declarative manifests; preserved across `complete` unless `--purge-config`)
- Mission runtime workspaces at `${MSN_WORKSPACE_ROOT}/missions/<missionId>/<repo-name>/` (ephemeral; destroyed at `complete` unless `--retain`)
- Mission-locks at `${MSN_WORKSPACE_ROOT}/locks/missions/<missionId>.lock` (single-writer-per-mission; per-mission scope)
- **Repo-locks (cross-mission scope; v1.2 fold per HIGH-5):** at `${MSN_WORKSPACE_ROOT}/locks/repos/<sha256(repoUrl)>.lock` (one-active-mission-per-repo invariant; cross-mission resource — does NOT live under any specific mission's workspace because it's globally-scoped). Lockfile contents reference the active mission-id for diagnostics.
- Atomic create via `O_EXCL`; stale-lock recovery via `expiresAt` check + `releaseLock` on expired (per §H.2 v0.2 fold).

#### §2.1.4 `GitEngine` (v0.2 fold per §C.1 — comprehensive API)

```typescript
export interface GitOptions {
  readonly fs: unknown; // filesystem abstraction (IsomorphicGit-compatible)
  readonly identity: AgentIdentity;
  readonly remote?: RemoteProvider;
}

export interface CommitOptions {
  readonly message: string;
  readonly author?: AgentIdentity;
  readonly amend?: boolean;
  readonly autoStage?: boolean; // v0.2 fold — explicit stage-everything-tracked vs caller-controlled
}

export type MergeStrategy = "ff" | "no-ff"; // v0.6 fold per §AAAAA — dropped `squash` + `rebase` (IsomorphicGit only supports ff/no-ff per official docs; v1.x can add via major-bump if substrate evolves OR via shell-out fold)

export interface PushOptions {
  readonly branch?: string;
  readonly remote?: string;        // v0.2 fold per §C.1 — explicit remote (default 'origin')
  readonly force?: boolean;
  readonly tags?: boolean;         // v0.2 fold — push tags
}

export interface LogEntry {
  readonly sha: string;
  readonly author: AgentIdentity;
  readonly message: string;
  readonly timestamp: Date;
  readonly parents: string[];
}

export interface GitEngine {
  // Lifecycle
  init(workspace: WorkspaceHandle, options: GitOptions): Promise<void>;
  clone(workspace: WorkspaceHandle, repoUrl: string, options: GitOptions): Promise<void>;

  // Refs (branches + tags)
  branch(workspace: WorkspaceHandle, branchName: string, options?: { from?: string }): Promise<void>;
  checkout(workspace: WorkspaceHandle, branchName: string): Promise<void>;                       // v0.2 fold per §C.1 — branch-switch primitive
  getCurrentBranch(workspace: WorkspaceHandle): Promise<string>;                                  // v0.2 fold per §C.1
  tag(workspace: WorkspaceHandle, name: string, options?: { ref?: string; message?: string; force?: boolean }): Promise<void>; // v0.2 fold per §C.1 — release-tag primitive; v0.3 fold per §EE — +force for re-tag scenarios
  revparse(workspace: WorkspaceHandle, ref: string): Promise<string>;                             // v0.2 fold per §C.1 — ref→sha resolution

  // Working tree + commit
  stage(workspace: WorkspaceHandle, paths: string[] | "all"): Promise<void>;                      // v0.2 fold per §C.1 — explicit staging primitive
  commit(workspace: WorkspaceHandle, options: CommitOptions): Promise<string /* sha */>;
  /** v0.3 fold per §AA — commit-to-ref WITHOUT moving HEAD AND WITHOUT polluting operator's INDEX (staging area).
   *  Implementation contract: filesystem-walk of working-tree → per-file `git.writeBlob` → explicit tree-construction
   *  via `git.writeTree({ tree: [...] })` overload (NOT the index-derived form) → `git.writeCommit` → `git.writeRef`.
   *  Operator's `git status` post-call shows no staged paths from the wip-commit operation.
   *  Load-bearing for §2.6.1 wip-branch mechanism. */
  commitToRef(workspace: WorkspaceHandle, ref: string, options: CommitOptions): Promise<string /* sha */>;
  /** v0.3 fold per §EE — branch-delete primitive; load-bearing for F16 wip-branch cleanup on mission-complete */
  deleteBranch(workspace: WorkspaceHandle, branchName: string, options?: { force?: boolean }): Promise<void>;

  // Wire
  fetch(workspace: WorkspaceHandle, options?: { remote?: string; branch?: string; prune?: boolean }): Promise<void>; // v0.3 fold per §EE — +prune
  push(workspace: WorkspaceHandle, options?: PushOptions): Promise<void>;
  pull(workspace: WorkspaceHandle, options?: { branch?: string; remote?: string }): Promise<void>;
  merge(workspace: WorkspaceHandle, sourceBranch: string, options?: { strategy?: MergeStrategy }): Promise<void>;
  /** v3.3 fold per HIGH-R3.1 — squash-merge primitive for atomic PR-set publish-flow (§2.4.1 v3.0 Refinement #4).
   *  3rd-party engines MAY implement; if not implemented, throw `UnsupportedOperationError`;
   *  engine falls back to internal shell-out to `git merge --squash` + `git commit -m <message>` (parallel to §2.6.2 bundle-ops native-git breach pattern).
   *  Returns squashed-commit-sha. Capabilities-gated per F13 throws-on-unsupported pattern. */
  squashCommit?(workspace: WorkspaceHandle, baseRef: string, headRef: string, message: string): Promise<string /* squashed-commit-sha */>;

  // Read
  status(workspace: WorkspaceHandle): Promise<GitStatus>;
  log(workspace: WorkspaceHandle, options?: { ref?: string; maxCount?: number; since?: Date; path?: string }): Promise<LogEntry[]>; // v0.3 fold per §EE — +since +path

  // Remote management
  addRemote(workspace: WorkspaceHandle, name: string, url: string): Promise<void>;       // v0.2 fold per §C.1
  removeRemote(workspace: WorkspaceHandle, name: string): Promise<void>;                  // v0.2 fold per §C.1
  listRemotes(workspace: WorkspaceHandle): Promise<{ name: string; url: string }[]>;      // v0.2 fold per §C.1
}

export interface GitStatus {
  readonly branch: string;
  readonly head: string; // sha
  readonly clean: boolean;
  readonly staged: string[];
  readonly modified: string[];
  readonly untracked: string[];
}
```

**Default v1 implementation:** `IsomorphicGitEngine` — **`static readonly providerName = 'isomorphic-git'`** (v1.6 fold per MINOR-R5.1) — wraps `isomorphic-git` library; pure-TS; portable; no native bindings; works with any IsomorphicGit-compatible filesystem (default `node:fs`; pluggable for `memfs` or custom). `commitToRef` uses `isomorphic-git`'s low-level `git.writeBlob` + `git.writeTree({tree:[...]})` + `git.writeCommit` + `git.writeRef` plumbing to commit without moving HEAD AND without polluting INDEX (per §2.6.1 implementation contract).

**IsomorphicGitEngine implementation-mapping (v0.6 fold per §BBBBB — for 3rd-party engine implementers):**

| GitEngine method | isomorphic-git function | Notes |
|---|---|---|
| `stage(paths)` | `git.add({ filepath })` | missioncraft naming follows git-CLI convention; isomorphic-git uses `add` (lower-level) |
| `revparse(ref)` | `git.resolveRef({ ref })` | git-CLI vs library-canonical naming |
| `removeRemote(name)` | `git.deleteRemote({ remote })` | git-CLI uses `remove`, isomorphic-git uses `delete` |
| `log(options.path)` | `git.log({ filepath })` | missioncraft option name `path` mapped internally to isomorphic-git's `filepath` |
| `tag(name, options.message?)` | `git.tag(...)` (lightweight) + `git.annotatedTag(...)` (annotated) | single missioncraft method dispatches based on whether `message` is provided |
| `merge(strategy: "ff"\|"no-ff")` | `git.merge({ ours, theirs, fastForward, fastForwardOnly })` | v0.7 fold per §BBBBBB micro: strategy `"ff"` → `fastForwardOnly: true` + `fastForward: true` (require ff; fail otherwise); strategy `"no-ff"` → `fastForwardOnly: false` + `fastForward: false` (always create merge-commit). v1 enum is intentionally limited per §AAAAA — IsomorphicGit doesn't support `squash`/`rebase` |
| `deleteBranch(name)` | `git.deleteBranch({ ref })` | **Limitation:** isomorphic-git only deletes loose branches (not packed). For wip-branch cleanup (F16): wip-branches are typically loose (created mid-mission), so this works at v1. Long-running missions where wip-branch gets packed (no longer relevant since GC dropped per §AAAA) would have stale-cleanup. |
| `commitToRef(workspace, ref, options)` | `git.writeBlob` + `git.writeTree({tree:[...]})` + `git.writeCommit` + `git.writeRef` (composed; bypass-INDEX per §AA) | Plumbing-mode primitive; HEAD-unaware AND index-unaware |
| `squashCommit(workspace, baseRef, headRef, message)` | shell-out: `git checkout <baseRef>` + `git merge --squash <headRef>` + `git commit -m <message>` + `git rev-parse HEAD` (capture sha) | **Pure-TS breach** (parallel to §2.6.2 bundle-ops native-git breach pattern; v3.3 fold per HIGH-R3.1). IsomorphicGit doesn't support squash-merge per §2.1.4 v0.6 fold §AAAAA; default impl shells out to native git CLI. **3rd-party engines MAY override** with pure-TS variant via low-level git primitives (writeBlob + writeTree + writeCommit collapsing wip-history). Throws `UnsupportedOperationError` if `git` CLI unavailable. **Precondition:** workspace working-tree must be clean (no uncommitted changes; engine ensures via publish-flow Step 1 daemon-flush per MINOR-R4.1); if dirty (rare race) → `MissionStateError("workspace dirty post-flush; retry msn complete to refresh state")`. |

#### §2.1.5 `RemoteProvider` (v0.2 fold per §G F13 — capabilities-gated throws-on-unsupported)

```typescript
export interface RemoteProviderCapabilities {
  readonly supportsPullRequests: boolean;
  readonly supportsApi: boolean; // can query repo metadata, list PRs, etc.
}

export interface PullRequestSpec {
  readonly title: string;
  readonly body: string;
  readonly head: string; // branch
  readonly base: string; // target branch
  readonly draft?: boolean;
}

export interface PullRequestSummary {
  readonly url: string;
  readonly number: number;
  readonly state: "open" | "closed" | "merged";
  readonly title: string;
  readonly head: string;
  readonly base: string;
}

export interface PullRequestFilter {
  readonly state?: "open" | "closed" | "merged" | "all";
  readonly head?: string;
  readonly base?: string;
}

export interface RepoMetadata {
  readonly defaultBranch: string;
  readonly visibility: "public" | "private";
  readonly description?: string;
}

export interface RemoteUser {
  readonly login: string;
  readonly email?: string;
}

/** v0.2 fold per §G F13 — capabilities-gated throws-on-unsupported pattern.
 *  Methods are NOT optional; callers MUST check capabilities + missioncraft throws UnsupportedOperationError if mismatch. */
export interface RemoteProvider {
  readonly capabilities: RemoteProviderCapabilities;
  /** Authenticate with the remote (token retrieval + validation). */
  authenticate(): Promise<void>;
  /** Get authenticated user identity. v0.2 fold per §C.3. Throws UnsupportedOperationError if !capabilities.supportsApi. */
  getCurrentUser(): Promise<RemoteUser>;
  /** Open a pull request. Throws UnsupportedOperationError if !capabilities.supportsPullRequests. */
  openPullRequest(repoUrl: string, spec: PullRequestSpec): Promise<PullRequestSummary>;
  /** List pull requests. v0.2 fold per §C.3. Throws UnsupportedOperationError if !capabilities.supportsPullRequests. */
  listPullRequests(repoUrl: string, filter?: PullRequestFilter): Promise<PullRequestSummary[]>;
  /** Read repo metadata via API. Throws UnsupportedOperationError if !capabilities.supportsApi. */
  getRepoMetadata(repoUrl: string): Promise<RepoMetadata>;
}
```

**Default v1 implementation:** `PureGitRemoteProvider` — null-object pattern (v1.5 fold per HIGH-R4.1(3)); `capabilities = { supportsPullRequests: false, supportsApi: false }`; `authenticate()` no-op succeeds; `getCurrentUser()` returns `null`; `openPullRequest()` / `listPullRequests()` / `getRepoMetadata()` throw `UnsupportedOperationError` (per F13 capabilities-gated throws-on-unsupported). `push`/`pull` semantics flow through GitEngine plain git wire-protocol (RemoteProvider not invoked for push/pull; only for PR + API operations). Enables uniform PROVIDER_REGISTRY dispatch (`'pure-git'` factory at §2.3.1) without special-case handling for `remote: undefined`.

Operators who explicitly want no RemoteProvider can either inject `new PureGitRemoteProvider()` OR omit the field entirely (engine substitutes `PureGitRemoteProvider` at construction; `remote: undefined` in mission-config behaves identically to `remote.provider: pure-git`).

**Opt-in v1 implementation:** `GitHubRemoteProvider` (registry string-name `'gh-cli'`) via `gh` CLI subprocess invocation — `capabilities = { supportsPullRequests: true, supportsApi: true }`; `authenticate()` shells `gh auth status`; `getCurrentUser()` shells `gh api user --jq '{login, email}'`; `openPullRequest()` shells `gh pr create`; `listPullRequests()` shells `gh pr list --json`; `getRepoMetadata()` shells `gh repo view --json`. Clean dependency surface (no Octokit; no hand-rolled HTTP); single auth flow via `gh auth token`. `authenticate()` validates `gh` presence + **minimum version `gh >= 2.40.0`** (v0.7 fold per §CCCCCC micro — current major; covers all referenced subcommands stably); clear error if unavailable or version-stale.

**Provider-name static-property contract (v1.5 fold per MEDIUM-R4.2):** every provider class MUST expose `static readonly providerName: string` matching the canonical PROVIDER_REGISTRY string-name. Engine reads `instance.constructor.providerName` to validate mission-config `<pluggable>.provider:` against the SDK-injected instance (mismatch → `ConfigValidationError`). Same convention applies to all 5 pluggable interface implementations (§2.1.1 - §2.1.5) + 3rd-party providers. Examples:
```typescript
class LocalGitConfigIdentity implements IdentityProvider {
  static readonly providerName = 'local-git-config';
  // ...
}
class GitHubRemoteProvider implements RemoteProvider {
  static readonly providerName = 'gh-cli';
  // ...
}
class PureGitRemoteProvider implements RemoteProvider {
  static readonly providerName = 'pure-git';
  // ...
}
```
Class-name reflection (`instance.constructor.name`) NOT used (brittle to minified builds); instance property NOT used (bloats per-instance); static property is the canonical mechanism.

### §2.2 Default-stack composition (v1)

```typescript
import { Missioncraft, LocalGitConfigIdentity, TrustAllPolicy, LocalFilesystemStorage, IsomorphicGitEngine } from '@apnex/missioncraft';

const missioncraft = new Missioncraft({
  identity: new LocalGitConfigIdentity(),
  approval: new TrustAllPolicy(),
  storage: new LocalFilesystemStorage(),
  gitEngine: new IsomorphicGitEngine(),
  // remote: undefined — pure-git mode by default
});
```

Operator opts in to GitHub features:

```typescript
import { GitHubRemoteProvider } from '@apnex/missioncraft';
const missioncraft = new Missioncraft({
  /* ...defaults... */,
  remote: new GitHubRemoteProvider({ ghCliPath: 'gh' }),
});
```

OR via mission-config YAML `remote.provider: gh-cli` (engine instantiates `GitHubRemoteProvider` from PROVIDER_REGISTRY at start-time). (v1.6 fold per HIGH-R5.1: `msn remote add` CLI surface removed; per-mission RemoteProvider configured via SDK constructor injection OR mission-config field.)

### §2.3 Personas (v1.1 reshape — SDK-primary; CLI as sovereign-module-consumer; OIS-orchestrated persona collapsed)

**v1.1 architectural shift:** the v1.0 design treated SDK + CLI as co-equal first-class personas with a separate POST-V1 OIS-orchestrated persona. v1.1 collapses to **2 personas with explicit primary/secondary distinction** + the OIS adapter recognized as just-another-SDK-consumer (NOT a separate persona):

- **Persona 1 — Library-SDK (PRIMARY contract surface)** — Strict-1.0 commits SDK type signatures; canonical contract that every consumer (CLI, OIS adapter, custom tooling, future REST-API shim) wraps
- **Persona 2 — Standalone-CLI (sovereign-module SDK consumer)** — `msn <verb>` invocation surface; thin SDK consumer that translates operator inputs (CLI args + flags + YAML files) into SDK method calls; built as a separate sovereign module under `src/missioncraft-cli/`
- ~~Persona 3 — OIS-orchestrated~~ — COLLAPSED. OIS adapter is an SDK consumer (same shape as CLI); not a separate persona. Sovereignty preserved (missioncraft doesn't know about Hub; only the SDK API surface). F8 CRITICAL still satisfied — OIS-orchestration code is not missioncraft-internal.

#### §2.3.1 Library-SDK persona — PRIMARY contract surface

The SDK is the load-bearing committed-contract surface. Every consumer (CLI binary, OIS adapter, REST-API shim future, custom tooling) wraps the SDK. Strict-1.0 commits the SDK type signatures; CLI flag-naming + REST-shim endpoint shapes are downstream of SDK (can evolve more freely under presentation/transport concerns).

**Top-level SDK export shape (`src/missioncraft-sdk/index.ts`):**

```typescript
// @apnex/missioncraft (Shape B single-package; SDK is the default export)

// Core
export { Missioncraft } from './core/missioncraft';
export type { MissioncraftConfig, StateDurabilityConfig } from './core/types';

// Mission resource (k8s-shape primary resource of missioncraft)
export type {
  MissionConfig, MissionState, MissionHandle, MissionFilter,
  RepoSpec, MissionStatePhase
} from './core/mission-types';

// Scope resource (v2.0 NEW per Refinement C — multi-mission composition primitive)
export type {
  ScopeConfig, ScopeState, ScopeHandle, ScopeFilter, ScopeStatePhase
} from './core/scope-types';

// Runtime zod schemas (v1.3 fold per MEDIUM-R3.1 — adapter + 3rd-party consumers need .parse() at integration boundary)
export { MissionConfigSchema, RepoSpecSchema } from './core/mission-config-schema';
export { ScopeConfigSchema } from './core/scope-config-schema';   // v2.0 fold per Refinement C — scope-config validation at SDK + adapter integration boundary
export { OperatorConfigSchema } from './core/operator-config-schema';   // v1.7 fold per MEDIUM-R6.4 — operator-config validation at configGet/configSet boundary

// Pluggable interfaces (types)
export type { IdentityProvider, AgentIdentity, SigningKey } from './pluggables/identity';
export type { ApprovalPolicy, ApprovalContext, ApprovalDecision, ApprovalAction } from './pluggables/approval';
export type { StorageProvider, WorkspaceHandle, LockHandle } from './pluggables/storage';
export type { GitEngine, GitOptions, CommitOptions, GitStatus, MergeStrategy, LogEntry } from './pluggables/git';
export type { RemoteProvider, RemoteProviderCapabilities, PullRequestSpec, PullRequestSummary, PullRequestFilter, RepoMetadata, RemoteUser } from './pluggables/remote';

// Default implementations
export { LocalGitConfigIdentity } from './defaults/local-git-config-identity';
export { TrustAllPolicy } from './defaults/trust-all-policy';
export { LocalFilesystemStorage } from './defaults/local-filesystem-storage';
export { IsomorphicGitEngine } from './defaults/isomorphic-git-engine';

// Opt-in implementations
export { GitHubRemoteProvider } from './providers/github-remote-provider';
export { PureGitRemoteProvider } from './providers/pure-git-remote-provider';   // v1.5 fold per HIGH-R4.1(3) — null-object default for pure-git mode

// Errors
export { MissioncraftError, LockTimeoutError, StorageAllocationError,
         RemoteAuthError, ApprovalDeniedError, MissionStateError,
         WorkspaceConflictError, ConfigValidationError,
         UnsupportedOperationError, NetworkRetryExhaustedError } from './errors';
```

**`MissioncraftConfig` SDK constructor shape (Strict-1.0 commit; v1.3 fold per MEDIUM-R2.9):**

```typescript
interface MissioncraftConfig {
  readonly identity: IdentityProvider;                    // required (no SDK-default; explicit-injection)
  readonly approval: ApprovalPolicy;                      // required (no SDK-default)
  readonly storage: StorageProvider;                      // required (no SDK-default)
  readonly gitEngine: GitEngine;                          // required (no SDK-default)
  readonly remote?: RemoteProvider;                       // optional (mission-config can override; per-mission)
  readonly workspaceRoot?: string;                        // optional; default ~/.missioncraft
  readonly stateDurability?: StateDurabilityConfig;       // optional; SDK-default if omitted
  readonly lockTimeoutWaitMs?: number;                    // optional; default 0 (fail-fast); applies to BOTH mission-lock + repo-lock per-acquire defaults (v1.3 fold per MEDIUM-R3.9)
  readonly lockTimeoutValidityMs?: number;                // optional; default 86_400_000 (24h); applies to BOTH mission-lock + repo-lock per-acquire defaults
}

interface StateDurabilityConfig {                         // v1.3 fold per MEDIUM-R3.2
  readonly mechanism?: 'layered';                          // v1: 'layered' only (single mechanism in v1)
  readonly wipCadenceMs?: number;                          // default 30_000 (per F4)
  readonly snapshotCadenceMs?: number;                     // default 300_000 (5min) per F4
  readonly snapshotRoot?: string;                          // required when diskFailureRecovery=true; default `<workspaceRoot>/snapshots`
  readonly snapshotRetention?: { minCount?: number; minAgeHours?: number };  // default {minCount:5, minAgeHours:24} per F15
  readonly wipBranchCleanup?: 'delete-on-complete-retain-on-abandon' | 'always-delete' | 'always-retain';  // default 'delete-on-complete-retain-on-abandon' per F16
  readonly processCrashRecovery?: boolean;                 // default true
  readonly diskFailureRecovery?: boolean;                  // default true
  readonly networkPartitionResilience?: boolean;           // default true
  readonly networkRetry?: { maxAttempts?: number; backoffMs?: number };  // default {maxAttempts:5, backoffMs:1000} (v1.5 fold per MEDIUM-R4.3 — aligned with §2.5 + §2.6.3)
}
```

**Mission resource type interfaces (v1.6 fold per MEDIUM-R5.2 — Strict-1.0 commits all SDK return-type shapes):**

```typescript
type MissionStatePhase =
  // Writer-side (existing v3.6)
  | 'created'        // scaffolded config; no repos
  | 'configured'     // ≥1 repo declared; not yet started
  | 'started'        // transient transition state during configured→in-progress
  | 'in-progress'    // active mission; workspace allocated; locks held
  | 'completed'      // terminal; complete-event fired
  | 'abandoned'      // terminal; abandon-event fired
  // Reader-side (v4.0 NEW per idea-265 multi-participant + HIGH-R2.3 — additive enum extension)
  // Per HIGH-R1.2 partition-spec: each principal holds own per-principal config with own lifecycle-state field; reader-side states orthogonal to writer-side
  | 'joined'              // transient transition state during reader-side msn join
  | 'reading'             // active reader-side mission; per-principal workspace allocated; coord-remote sync running
  | 'readonly-completed'  // terminal reader-side; writer terminated (coord-remote tag refs/tags/missioncraft/<id>/terminated detected); reader transitioned to read-only-archive mode
  | 'leaving';            // transient transition state during reader-side msn leave

interface MissionHandle {
  readonly id: string;          // canonical msn-<8-char-hash>
  readonly name?: string;       // optional human-friendly slug
}

// v4.0 NEW per idea-265 multi-participant + MEDIUM-R1.4 — MissionParticipant resource interface
interface MissionParticipant {
  readonly principal: string;                  // opaque-string at v1; format <user>@<host> per MINOR-R1.4
  readonly role: 'writer' | 'reader';
  readonly addedAt: Date;
}

// v4.0 NEW per idea-265 + MINOR-R1.2 — MissionRepoState extends RepoSpec with engine-derived runtime-state for `msn show <id>:<repo>` columns
interface MissionRepoState {
  readonly name: string;                       // existing v3.6 (from RepoSpec)
  readonly url: string;                        // existing v3.6
  readonly base: string;                       // existing v3.6
  readonly branch?: string;                    // existing v3.6
  readonly commitSha?: string;                 // existing v3.6
  // v4.0 NEW per-repo runtime-state (engine-derived; not config-persisted)
  readonly role?: 'writer' | 'reader';         // role of CURRENT principal viewing this state (derived from MissionState.participants[] lookup)
  readonly syncState?: 'synced' | 'fetching' | 'stale' | 'no-coord';   // reader-side sync-state; writer-side always 'no-coord' if no readers
  readonly remoteRef?: string;                 // coord-remote ref name (if applicable; e.g., 'refs/heads/design-repo/wip/m-foo')
  readonly lastSyncAt?: Date;                  // ISO-8601; reader-side last successful coord-fetch
}

interface MissionState {
  readonly id: string;
  readonly name?: string;
  readonly hubId?: string;
  readonly description?: string;
  readonly tags: Record<string, string>;
  readonly repos: readonly MissionRepoState[];           // v4.0 fold per MINOR-R1.2 — type widened from RepoSpec[] to MissionRepoState[] to surface per-repo runtime-state
  // v4.0 NEW per idea-265 multi-participant
  readonly participants?: readonly MissionParticipant[]; // absent OR contains exactly 1 writer + 0 readers = solo writer-only mission (v3.6 baseline preserved)
  readonly coordinationRemote?: string;                  // git remote URL for wip-coordination; required IFF participants[] contains a reader
  readonly lastPushSuccessAt?: Date;                     // v4.0 fold per MEDIUM-R2.8 + MEDIUM-R1.9 — operator-DX visibility for coord-remote push-cadence health
  readonly lifecycleState: MissionStatePhase;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // Symmetric pluggable-name exposure (v1.7 fold per MINOR-R6.1) — runtime-introspection without re-parsing config
  readonly identityProviderName: string;
  readonly approvalProviderName: string;
  readonly storageProviderName: string;
  readonly gitEngineProviderName: string;
  readonly remoteProviderName?: string;     // PROVIDER_REGISTRY string-name (e.g., 'gh-cli', 'pure-git'); optional only because remote pluggable itself is optional
  // v3.2 fold per MEDIUM-R2.6 — publish-message persisted at first `complete`; immutable post-write; ensures homogeneous PR titles across mission's PR-set on idempotent retry.
  readonly publishMessage?: string;
  // v3.3 fold per round-3 ask 3 — abandon-message persisted at first `abandon`; immutable post-write; symmetric with publishMessage.
  readonly abandonMessage?: string;
  // v3.4 fold per MEDIUM-R4.1 — abandon-step partial-failure recovery; symmetric with publishStatus discipline.
  // v3.5 fold per MEDIUM-R5.1 — added 'message-persisted' value (Step 3 progress-marker; lifecycle-state DOES NOT advance at Step 3 — stays 'in-progress' until atomic Step 8).
  // v3.5 fold per MINOR-R5.1 — final-value lifecycle-semantics:
  //   - undefined: no abandon attempted; OR config purged (--purge-config terminal)
  //   - 'workspace-handled': abandon Step 6 completed; lifecycle-state advanced to 'abandoned' atomically (workspace destroyed if --retain not set; preserved if --retain set; v3.6 fold per MINOR-R6.2 renamed from 'workspace-destroyed' for retain-aware semantic)
  //   - 'config-purged': transient — written just before Step 7 config-delete; never observed in stable terminal state since config + field both deleted
  //   - any other value (tick-fired/daemon-killed/message-persisted/locks-released/branches-cleaned): abandon-flow failed at this step; mission stays 'in-progress'; idempotent retry resumes from this step
  readonly abandonProgress?: 'tick-fired' | 'daemon-killed' | 'message-persisted' | 'locks-released' | 'branches-cleaned' | 'workspace-handled' | 'config-purged';
  // v3.5 fold per MEDIUM-R5.2 — abandon-flow Step 5 per-repo cleanup state; symmetric with publishStatus discipline; granular operator-visibility.
  // 'pending': cleanup not yet attempted (initial state at Step 5 entry)
  // 'cleaned': local mission-branch successfully deleted
  // 'failed': delete failed (e.g., permission error); idempotent retry re-attempts only repos with 'failed' or 'pending' status
  // abandonProgress advances to 'branches-cleaned' ONLY when ALL repos = 'cleaned'.
  readonly abandonRepoStatus?: Record<string, 'pending' | 'cleaned' | 'failed'>;
  // v3.1 fold per MEDIUM-R1.9 — per-repo publish-state during/after `complete` execution; populated during atomic PR-set publish-flow (per §2.4.1); used for partial-failure idempotent retry. Populated post-`started`; persists post-terminal as forensic-history (cleared only on `--purge-config`).
  readonly publishStatus?: Record<string, 'pending' | 'squashed' | 'pushed' | 'pr-opened' | 'failed'>;
  // v3.1 fold — per-repo PR URLs after successful complete-publish-flow; populated only when publishStatus[repo] === 'pr-opened' AND PR was actually opened (not skipped due to no-changes OR pure-git mode).
  readonly publishedPRs?: readonly { repoName: string; prUrl: string }[];
  // workspacePath state-gating (v1.7 fold per MEDIUM-R6.3): populated ONLY when workspace exists on-disk;
  //   - lifecycleState='in-progress' → ALWAYS populated
  //   - lifecycleState='completed' OR 'abandoned' WITH --retain → populated
  //   - lifecycleState='completed' OR 'abandoned' WITHOUT --retain → undefined (workspace destroyed)
  //   - lifecycleState='created' OR 'configured' → undefined (no workspace allocated yet)
  //   - lifecycleState='started' (transient transition) → caller is mission-lock-guarded so getMission waits or fails; no race
  readonly workspacePath?: string;
}

interface MissionFilter {
  readonly status?: MissionStatePhase | readonly MissionStatePhase[];
  readonly name?: string;                   // exact match (case-sensitive)
  readonly nameLike?: string;               // case-insensitive plain substring match (UNIX-CLI convention; v1.7 fold per MINOR-R6.3 — `String.prototype.toLowerCase().includes(...)` semantic; NOT glob, NOT regex)
  readonly hubId?: string;
  readonly scopeId?: string;                // v2.0 fold per Refinement C — filter missions referencing a specific scope
  readonly tags?: Record<string, string>;   // all-must-match
}

// Scope resource type interfaces (v2.0 NEW per Refinement C — multi-mission composition primitive)
type ScopeStatePhase =
  | 'created'         // scaffolded scope config; mutable until deleted
  | 'deleted';        // terminal; cascade-protection rejected non-terminal mission references at delete-time

interface ScopeHandle {
  readonly id: string;          // canonical scp-<8-char-hash>
  readonly name?: string;       // optional human-friendly slug
}

interface ScopeState {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly tags: Record<string, string>;
  readonly repos: readonly RepoSpec[];
  readonly lifecycleState: ScopeStatePhase;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // Cascade-protection support: which missions reference this scope by id?
  // Engine maintains via reverse-index OR computed-on-getScope by scanning mission-configs.
  // Used by `deleteScope` to enforce cascade-protection invariant.
  readonly referencedByMissions: readonly string[];   // mission-ids
}

interface ScopeFilter {
  readonly name?: string;                   // exact match
  readonly nameLike?: string;               // case-insensitive plain substring (same semantic as MissionFilter.nameLike)
  readonly tags?: Record<string, string>;
}

// ScopeConfig is the parse-result of ScopeConfigSchema (§2.5); see schema definition there.
interface ScopeConfig {
  readonly scopeConfigSchemaVersion: 1;
  readonly scope: {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly lifecycleState: ScopeStatePhase;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly tags?: Record<string, string>;
  };
  readonly repos: readonly RepoSpec[];
}

// MissionConfig is the parse-result of MissionConfigSchema (§2.5); see schema definition there.
// Includes mission.{id, name, hubId?, description?, lifecycleState, createdAt, tags},
// repos: RepoSpec[], pluggable-overrides, state-durability, etc.
interface MissionConfig {
  readonly missionConfigSchemaVersion: 1;
  readonly mission: {
    readonly id: string;
    readonly name?: string;
    readonly hubId?: string;
    readonly description?: string;
    readonly lifecycleState: MissionStatePhase;
    readonly createdAt: Date;
    readonly tags?: Record<string, string>;
  };
  readonly repos: readonly RepoSpec[];
  readonly identity?: { provider: string };           // PROVIDER_REGISTRY string-name
  readonly approval?: { provider: string };
  readonly storage?: { provider: string };
  readonly gitEngine?: { provider: string };
  readonly remote?: { provider: string };
  readonly workspaceRoot?: string;
  readonly stateDurability?: StateDurabilityConfig;
  readonly autoMerge?: { strategy: 'ff' | 'no-ff' };
  readonly lockTimeout?: { waitMs?: number; validityMs?: number };
}
```

The 4 required pluggables (identity/approval/storage/gitEngine) MUST be explicitly injected; v1 ships default-implementations that operators import + pass (e.g., `new Missioncraft({ identity: new LocalGitConfigIdentity(), ... })`). Future v1.x may add a `Missioncraft.withDefaults({ overrides? })` static-helper for ergonomics; out-of-scope v1.

**Provider string-name registry mechanism (v1.3 fold per HIGH-R3.1 — closed registry at v1, option (a)):**

Mission-config YAML specifies pluggables by string-name (e.g., `identity.provider: gh-cli`). When mission-config overrides SDK-constructor's instance-injection (per precedence chain), engine must instantiate from string-name. v1 ships a **closed registry** with built-in factory dispatch:

```typescript
// Internal factory map (NOT exported; not extensible at v1)
// v1.5 fold per HIGH-R4.1: drop 'trust-all' from identity (TrustAllIdentity doesn't exist; was incorrect duplicate of approval-class string-name);
// rename remote 'github' → 'gh-cli' for cross-section consistency with §2.5 + §2.3.1 SDK + §2.3.2 CLI;
// spec PureGitRemoteProvider as null-object at §2.1.5 (uniform registry dispatch).
const PROVIDER_REGISTRY = {
  identity: {
    'local-git-config': () => new LocalGitConfigIdentity(),
    // v1 ships single default; future: 'gh-cli-identity' / 'oauth-identity' (additive-only under Strict-1.0)
  },
  approval: {
    'trust-all': () => new TrustAllPolicy(),
    // future: 'always-approve', 'always-deny', 'pr-required', etc.
  },
  storage: {
    'local-filesystem': (config) => new LocalFilesystemStorage(config),
  },
  gitEngine: {
    'isomorphic-git': () => new IsomorphicGitEngine(),
  },
  remote: {
    'gh-cli': (config) => new GitHubRemoteProvider(config),    // v1.5 fold per HIGH-R4.1(2): renamed from 'github' to match §2.5 + SDK + CLI usage
    'pure-git': () => new PureGitRemoteProvider(),             // null-object per §2.1.5; uniform registry dispatch
  },
};
```

**3rd-party providers must be injected via SDK-constructor INSTANCE only** (mission-config string-name CANNOT reference custom providers at v1). Operator uses `new Missioncraft({ identity: new MyCustomIdentity(), ... })` for 3rd-party providers; mission-config `identity.provider:` field is OPTIONAL when SDK constructor injects an instance directly (mission-config's string-name MUST match the injected instance's identifying name OR be omitted; mismatch → `ConfigValidationError`).

v2.x can open the registry via `Missioncraft.registerProvider('my-custom', factory)` if 3rd-party-string-name demand emerges (additive). Strict-1.0 commits the closed-registry-at-v1 model + the canonical string-names for built-in providers.

**Config precedence chain (v1.3 fold per MEDIUM-R2.10):**

```
CLI flag  >  env-var  >  mission-config field  >  SDK constructor (MissioncraftConfig)  >  operator-config (v1.7 fold per MEDIUM-R6.4)  >  built-in default
```

Highest-precedence wins. Example: `wipCadenceMs`:
- CLI invocation `msn start --wip-cadence-ms=5000` → 5000 (CLI flag wins)
- else `MSN_WIP_CADENCE_MS=10000` env-var → 10000
- else mission-config `wip-cadence-ms: 30000` → 30000
- else SDK constructor `stateDurability.wipCadenceMs: 60000` → 60000 (SDK-consumer-injected default for missions instantiated through this SDK)
- else built-in default 60000 (matches SDK constructor default)

SDK constructor sets DEFAULTS for missions instantiated through this SDK; mission-config = PER-MISSION OVERRIDE; CLI flag = PER-INVOCATION OVERRIDE; env-var = PER-PROCESS OVERRIDE.

**SDK API shape (k8s-resource-shape applied to TypeScript):**

```typescript
// v3.0 fold per Round-3 Refinement #7 — verb-polymorphism over resource-type (k8s-shape at SDK level).
// Universal verbs (create / get / list / update / delete) parameterized by ResourceType.
// Per-resource last-mile logic stays internal (private dispatchers); public surface uniform.
// Method count: 14 (down from 30 at v2.5; ~53% reduction).

type ResourceType = 'mission' | 'scope';

interface ResourceMap {
  mission: {
    handle: MissionHandle;
    state: MissionState;
    config: MissionConfig;
    filter: MissionFilter;
    createOpts: { name?: string; repo?: string | string[]; scope?: string };
    getOpts: { principal?: string };       // v4.4 fold per MEDIUM-R4.1 option (a) — extends from v3.1 `undefined` to allow per-call current-principal override (Step 1 of M-R3.1 4-step precedence chain). Backward-compat: opts is optional; `undefined` continues to work; only callers explicitly typing-as-undefined break (rare).
    listOpts: { principal?: string };      // v4.4 fold per MEDIUM-R4.1 — symmetric extension; per-call current-principal override for list queries.
    deletable: false;            // v3.1 fold per HIGH-7: mission-side termination is complete/abandon; delete<T> type-narrows out 'mission'
    mutation: MissionMutation;
  };
  scope: {
    handle: ScopeHandle;
    state: ScopeState;
    config: ScopeConfig;
    filter: ScopeFilter;
    createOpts: { name?: string; description?: string; repo?: string | string[] };
    getOpts: { includeReferences?: boolean };
    listOpts: { includeReferences?: boolean };
    deletable: true;             // v3.1 fold per HIGH-7: scope-delete is generic verb (cascade-protected at last-mile)
    mutation: ScopeMutation;
  };
}

// v3.1 fold per HIGH-7: type-narrows `delete<T>` to resources where deletable: true
type DeletableResource = { [K in ResourceType]: ResourceMap[K]['deletable'] extends true ? K : never }[ResourceType];

class Missioncraft {
  constructor(config: MissioncraftConfig);

  // ─── Universal resource verbs (k8s-shape; v3.0 fold per Round-3 Refinement #7) ─────────
  // Each verb dispatches to per-resource last-mile (private methods) based on type-param.

  create<T extends ResourceType>(
    type: T,
    opts?: ResourceMap[T]['createOpts']
  ): Promise<ResourceMap[T]['handle']>;
  // Scaffolds resource. mission: {name?, repo?, scope?} → MissionHandle. scope: {name?, description?, repo?} → ScopeHandle.

  get<T extends ResourceType>(
    type: T,
    id: string,
    opts?: ResourceMap[T]['getOpts']
  ): Promise<ResourceMap[T]['state']>;
  // Detail view (k8s `describe`). scope opts: { includeReferences? } for cascade-protection-relevant query.

  list<T extends ResourceType>(
    type: T,
    filter?: ResourceMap[T]['filter'],
    opts?: ResourceMap[T]['listOpts']
  ): Promise<ResourceMap[T]['state'][]>;
  // Tabular view (k8s `get`). Filter shape is per-resource (MissionFilter vs ScopeFilter).

  update<T extends ResourceType>(
    type: T,
    id: string,
    mutation: ResourceMap[T]['mutation']
  ): Promise<ResourceMap[T]['state']>;
  // Field-targeted mutation via discriminated-union mutation-type (last-mile per-resource validation).
  // Replaces v2.5's 15 typed-update methods (8 mission + 7 scope).

  delete<T extends DeletableResource>(type: T, id: string): Promise<void>;
  // Removes resource. v3.1 fold per HIGH-7: type-narrows to DeletableResource (currently only 'scope'); compile-time-error for `delete('mission', id)` per ResourceMap.deletable: false. Plus runtime guard: throws MissionStateError("delete on mission not supported; use complete/abandon instead") if invoked dynamically. Mission uses complete/abandon (mission-specific verbs below).

  // ─── Mission-specific verbs (genuine functional differences; no scope analog) ─────────

  start(input: string | { config: MissionConfig }): Promise<MissionHandle>;
  // Realize declared state; engine spawns daemon-watcher (per §2.6.5 v3.0); inlines scope.repos if mission references scope (snapshot per §2.4.2 hybrid resolution).

  apply(config: MissionConfig): Promise<MissionState>;
  // Mission full-config-upsert (additive-only mid-mission per refinement #3); returns updated state.
  // (Scope-apply deferred to v3.x as additive evolution if demand emerges.)

  complete(id: string, message: string, opts?: { purgeConfig?: boolean }): Promise<MissionState>;
  // **v3.0 atomic PR-set publish-flow (per Round-3 Refinement #4):** per-repo squash → push → openPullRequest; mission becomes `completed`. Returns final state with `publishedPRs[]`. `message` REQUIRED. Partial-failure → mission stays `in-progress` for idempotent retry.

  abandon(id: string, message: string, opts?: { purgeConfig?: boolean }): Promise<MissionState>;
  // **v3.0 cleanup-only (per Round-3 Refinement #4):** NO PR creation; per-repo cleanup local mission-branch (no push); mission becomes `abandoned`. `message` REQUIRED.

  tick(id: string): Promise<{ wipCommitSha?: string; snapshotPath?: string }>;
  // Explicit operator-trigger of cadence-tick (overrides debounce-window; forces fire). Composes with §2.6.5 filesystem-watch model — daemon fires automatically; this is operator-explicit override.
  // Three return-shapes: pre-`started` missions → both undefined (graceful no-op per MINOR-R3.2); started/in-progress + cadence-fired → either/both populated; cadence-not-due → both undefined (nothing-to-do).
  // Partial-success: wip-tick succeeds + snapshot-tick fails → `{wipCommitSha: <sha>, snapshotPath: undefined}` + logs warning (per MINOR-R4.4). ERRORs on terminal-state missions.

  // v4.3 fold per MEDIUM-R3.1; v4.4 fold per MEDIUM-R4.1 + MEDIUM-R4.2 — current-principal SDK context-dependency.
  // SDK queries that return per-principal-perspective state (e.g., MissionRepoState.role) need to know "current principal".
  //
  // Resolution precedence (highest to lowest):
  //   1. Explicit per-call override: get('mission', id, { principal: 'lily@apnex' }) — supported via ResourceMap.mission.getOpts.principal extension (v4.4 per MEDIUM-R4.1 option (a))
  //   2. Missioncraft constructor: new Missioncraft({ principal: 'lily@apnex', ... }) — applies to all queries from this instance
  //   3. Engine-internal IdentityProvider.resolve() composing email field → principal-id (v4.4 per MEDIUM-R4.2):
  //      Pick: full-email-verbatim (e.g., IdentityProvider returns {email: 'greg@apnex.com.au'} → principal-id = 'greg@apnex.com.au'). Substrate doesn't munge; operator who wants short-form principals supplies via constructor or --principal flag explicitly. Match against participants[].principal is full-string-equality.
  //      Invocation-context broadening note: v3.6 §2.6.6 invariant pinned IdentityProvider.resolve() to commit-firing-time only; v4.0 multi-participant broadens to query-time invocation. Composability: idempotent + side-effect-free; safe at any time.
  //   4. Engine-internal MSN_PRINCIPAL_ID env-var (per MEDIUM-R1.7 multi-principal extension; v4.4 inline at §2.4 OperatorConfigSchema)
  //
  // SDK is platform-agnostic; substrate-engine derives current-principal at query-time per precedence chain.
  // Applies to all current-principal-aware methods (get / list / workspace; future: any read-API returning per-principal projection).

  workspace(idOrCoordinate: string, repoName?: string): Promise<string>;
  // **v3.0 NEW (per Round-3 Refinement #6); v4.0 EXTENDED (per idea-265 + MEDIUM-R1.4 — accepts substrate-coordinate via colon-notation):** absolute path to mission workspace (root if repoName undefined; specific repo subdir otherwise). v4.0: idOrCoordinate accepts colon-notation `<mission-id>:<repo>[/<path>]` per Rule N — engine parses internally; granularity follows coordinate (mission/repo/file). Composes with shell: `cd $(msn workspace m-foo:design-repo)` OR `cat $(msn workspace m-foo:design-repo/docs/foo.md)`. Errors on pre-`started` (no workspace yet) OR terminal-with-no-`--retain` (workspace destroyed).

  // ─── Multi-participant reader-side verbs (v4.0 NEW per idea-265 — HIGH-R2.2 architect-pick: SDK-top-level methods for sovereignty-discipline) ─────────

  join(id: string, coordRemote: string, principal?: string): Promise<MissionState>;
  // Reader-side mission-engagement. Spawns 7-step `joined → reading` transition per §2.4.1: validates authorization (writer must have `add-participant` for this principal first; coord-remote tag confirms); allocates per-principal workspace; clones repos from coord-remote (`git clone --branch <repo>/wip/<id> <coord-remote> <local-path>` per MEDIUM-R2.3 substrate-mechanism correction); sets filesystem-mode `0444` on all files (strict-enforce per F-V4.3); spawns reader-daemon-watcher. principal default = IdentityProvider.resolve(); operator-overridable via --principal flag. Returns reader-side MissionState.

  leave(id: string, opts?: { purgeWorkspace?: boolean }): Promise<void>;
  // Reader-side mission-disengagement. SIGTERM reader-daemon; releases reader's per-principal lockfile (`<id>.<principal>.lock` per HIGH-R1.3 per-principal naming); preserves per-principal workspace by default (forensic-history); `--purge-workspace` removes workspace. Reader-side state-machine transition: `reading → leaving → (terminal removed)`.

  // ─── Operator-config (key-value namespace; not resource-shaped) ─────────

  configGet(key: string): Promise<string | undefined>;
  configSet(key: string, value: string): Promise<void>;
  // Operator-config validation per OperatorConfigSchema (zod); unknown-key → ConfigValidationError.

  // ─── Static helpers ─────────

  static isPlatformSupported(): boolean;
  // Returns false on Windows; adapter implementer uses at MCP-tool-list-time (v1.6 fold per MINOR-R5.3).
}

// ─── Mutation discriminated-unions (per-resource last-mile typed) ─────────

type MissionMutation =
  | { kind: 'add-repo'; repo: RepoSpec }                                   // pre-start full upsert OR post-start additive (per refinement #3)
  | { kind: 'remove-repo'; repoName: string }                              // pre-start only
  | { kind: 'rename'; newName: string }                                    // triggers symlink-rename flow per §2.4
  | { kind: 'set-description'; description: string }
  | { kind: 'set-hub-id'; hubId: string }                                  // informational-only at v1
  | { kind: 'set-scope'; scopeId: string | null }                          // pre-start only; null clears scope-reference
  | { kind: 'set-tag'; key: string; value: string }
  | { kind: 'remove-tag'; key: string }
  // v4.0 NEW per idea-265 multi-participant + MEDIUM-R1.4 — participant-mutation via existing update<T> polymorphism (no new SDK verb)
  | { kind: 'add-participant'; principal: string; role: 'writer' | 'reader' }     // allowed created/configured/started/in-progress; ERROR on completed/abandoned (per §2.4.1 matrix)
  | { kind: 'remove-participant'; principal: string }                              // allowed created/configured/started/in-progress; ERROR on terminal
  | { kind: 'set-coordination-remote'; remote: string };                           // allowed created/configured ONLY; post-start change would orphan readers

type ScopeMutation =
  | { kind: 'add-repo'; repo: RepoSpec }                                   // propagates to NOT-YET-STARTED missions referencing scope (per §2.4.2 hybrid resolution)
  | { kind: 'remove-repo'; repoName: string }
  | { kind: 'rename'; newName: string }                                    // triggers symlink-rename flow
  | { kind: 'set-description'; description: string }
  | { kind: 'set-tag'; key: string; value: string }
  | { kind: 'remove-tag'; key: string };
```

**Programmatic usage example (v3.0 generic-verb shape; engineer-git-less hypervisor model):**

```typescript
import { Missioncraft, LocalGitConfigIdentity, TrustAllPolicy, LocalFilesystemStorage, IsomorphicGitEngine, GitHubRemoteProvider } from '@apnex/missioncraft';

const mc = new Missioncraft({
  identity: new LocalGitConfigIdentity(),
  approval: new TrustAllPolicy(),
  storage: new LocalFilesystemStorage(),
  gitEngine: new IsomorphicGitEngine(),
  remote: new GitHubRemoteProvider({ ghCliPath: 'gh' }),
});

// ─── Architect setup: scope template + mission scaffold (one-shot) ─────────
const scopeHandle = await mc.create('scope', {
  name: 'claude-plugin',
  description: 'Adapter component-set',
  repo: ['https://github.com/example/adapter-kernel', 'https://github.com/example/claude-plugin-shim'],
});

const missionHandle = await mc.create('mission', {
  name: 'update-adapter-code',
  scope: scopeHandle.id,
});

// ─── Engineer flow: start → cd to workspace → edit → complete ─────────
await mc.start(missionHandle.id);                                  // engine spawns daemon-watcher; clones repos; allocates workspace
const workspacePath = await mc.workspace(missionHandle.id);        // path to mission root: <workspace>/missions/<id>/
// engineer cd's into workspacePath/<repo-name>; edits files via filesystem-tools (no git knowledge)
// ... time passes; daemon-watcher fires wip-commits + bundle-snapshots transparently ...

// Atomic PR-set publish-flow on completion
const completed = await mc.complete(missionHandle.id, 'Refactor adapter kernel for v2.0');
// completed.publishedPRs[] contains { repoName, prUrl } per repo with changes

// ─── Field-targeted updates (k8s-shape generic verb; per-resource discriminated mutation) ─────────
await mc.update('mission', id, { kind: 'rename', newName: 'updated-feature-name' });
await mc.update('scope', scopeHandle.id, { kind: 'add-repo', repo: { url: 'https://...', name: 'extra' } });
await mc.update('mission', id, { kind: 'set-tag', key: 'correlation-id', value: 'ois-2026-05-09' });

// ─── Read ops (universal verbs) ─────────
const list = await mc.list('mission', { status: 'started' });
const detail = await mc.get('mission', id);
const scopeWithRefs = await mc.get('scope', scopeHandle.id, { includeReferences: true });

// ─── Single-shot from Hub-delivered config (OIS adapter integration) ─────────
const handle = await mc.start({ config: parsedYAML });             // mission auto-created if id-not-present + started
```

**API stability commitment (Q2=a):** every method signature + mutation-type-shape committed v1.0.0 contract. Post-v1 breaking changes require major-version-bump (`v1.x` → `v2.x`). Strict-1.0 from day-1; no `v0.x` ramp-up phase. **v3.0 SDK shape**: 14 methods on Missioncraft class (5 universal verbs + 6 mission-specific verbs + 2 operator-config + 1 static); ~53% reduction from v2.5's 30-method surface.

#### §2.3.2 Standalone-CLI persona — sovereign-module SDK consumer

The CLI binary `msn` lives in `src/missioncraft-cli/` as a separate sovereign module. It depends on `src/missioncraft-sdk/` as if external (no internal-source-private cross-imports). Operator inputs (CLI flags + positional args + YAML files) are translated to SDK method calls.

**CLI verb taxonomy — k8s-resource-shape (per refinement #2 drop "mission" verb prefix):**

Mission is the implicit primary resource; non-mission ops keep explicit resource prefixes (`remote`, `config`).

| Verb | Sub-verbs / Flags | SDK method | Description |
|---|---|---|---|
| `msn create` | `[--name <slug>] [--repo <url>...] [--scope <id\|name>]` | `create('mission', {name?, repo?, scope?})` (v3.0 generic verb) | Scaffold mission config at `<workspace>/config/<id>.yaml`; auto-generates `msn-<8-char-hash>` id. Flag-driven one-liner support: if no `--name`, auto-id only; `--repo` repeatable for multi-repo at create-time; `--scope <id>` references scope (engine inlines repos at startMission per §2.4.2 hybrid resolution). For additional repos post-create use `msn update <id> repo-add`. **stdout:** prints canonical id one-line; with `--name`: id + name tab-delimited. |
| `msn list` | `[--status <state>] [--output json\|yaml]` | `list('mission', {status?})` (v3.0 generic verb) | Table view of all missions (k8s `get`) |
| `msn show <id\|name>` | `[--repos] [--output json\|yaml]` | `get('mission', id)` (v3.0 generic verb) | Detail view (k8s `describe`); `--repos` flag shows just the repo-list |
| `msn update <id\|name> repo-add <file\|url>` | `[--name <local-name>] [--branch <name>] [--base <branch>]` | `update('mission', id, { kind: 'add-repo', repo })` (v3.0 generic verb) | Add repo to mission's declared config; mutates `<workspace>/config/<id>.yaml`. Pre-start: full upsert allowed. Post-start: additive-only per refinement #3. |
| `msn update <id\|name> repo-remove <repo-name>` | (no flags) | `update('mission', id, { kind: 'remove-repo', repoName })` (v3.0) | Remove repo (pre-start only); post-start error per refinement #3 |
| `msn update <id\|name> name <new-name>` | (no flags) | `update('mission', id, { kind: 'rename', newName })` (v3.0) | Rename mission's `--name` slug; triggers symlink-rename flow per §2.4 |
| `msn update <id\|name> description <text>` | (no flags) | `update('mission', id, { kind: 'set-description', description })` (v3.0) | Set description field |
| `msn update <id\|name> hub-id <hub-id>` | (no flags) | `update('mission', id, { kind: 'set-hub-id', hubId })` (v3.0) | Set hub-id field (informational-only at v1) |
| `msn update <id\|name> scope-id <scope-id\|name\|"">` | (no flags) | `update('mission', id, { kind: 'set-scope', scopeId })` (v3.0; null clears) | Set/change scope reference (pre-start only); empty string clears scope-reference; post-start error |
| `msn update <id\|name> tags-set <key> <value>` | (no flags) | `update('mission', id, { kind: 'set-tag', key, value })` (v3.0) | Set single tag |
| `msn update <id\|name> tags-remove <key>` | (no flags) | `update('mission', id, { kind: 'remove-tag', key })` (v3.0) | Remove single tag |
| `msn start <id\|name>` | `[--retain]` | `start(id)` (v3.0 mission-specific verb) | Realize the declared state — engine spawns daemon-watcher; clones repos; allocates workspace; acquires locks. If mission references scope, engine inlines scope.repos into mission-config (snapshot per §2.4.2 hybrid resolution) |
| `msn start -f <path>` | `[--retain]` | `start({config: parsedYAML})` (v3.0 mission-specific verb) | Start from explicit YAML path (OIS-adapter integration shape) |
| `msn apply -f <path>` | (no flags) | `apply(config)` (v3.0 mission-specific verb) | Upsert (per refinement #3); additive-only mid-mission (repo-add); non-additive errors. config.mission.id is the truth-source (v3.0 fold per MEDIUM-R1.5 — supersedes v1.5 MEDIUM-R4.6 id-vs-config.mission.id mismatch check; single-source-of-truth). |
| `msn complete <id\|name> <message>` | `[--purge-config]` | `complete(id, message, opts?)` (v3.0 mission-specific verb) | **Terminal — atomic PR-set publish-flow (v3.0 per Refinement #4):** per repo with changes — squash wip-commits → push to remote → openPullRequest. Single message → all PRs' titles + commit messages. Atomic across mission's repos; partial-failure preserves PRs already opened; engine resumes via mission.publishStatus persistent state (per MEDIUM-R1.9). Then: persist `lifecycle-state: completed`; release locks; destroy workspace unless `--retain`. `--purge-config` deletes config. Mutual-exclusion: `--retain` + `--purge-config` rejects. **`<message>` required positional**. |
| `msn abandon <id\|name> <message>` | `[--purge-config]` | `abandon(id, message, opts?)` (v3.0 mission-specific verb) | **Terminal — cleanup-only, NO PR creation (v3.0):** abandon means "mission failed/cancelled; do not publish". Per repo: cleanup local mission-branch. Then: persist `lifecycle-state: abandoned`; release locks; destroy workspace; cleanup local branches. `--purge-config` deletes config. Mutual-exclusion with `--retain` preserved. `<message>` required positional (audit-record reason). |
| `msn tick <id\|name>` | (no flags) | `tick(id)` (v3.0 mission-specific verb) | Explicit cadence-tick trigger; fires wip-tick + snapshot-tick on demand. Coordinates with daemon-watcher (per MEDIUM-R1.7) — CLI signals daemon via lockfile-state-watch; daemon flushes pending debounce-buffer + fires tick atomically. Graceful no-op on pre-`started` missions; errors on terminal. |
| `msn workspace <id\|name> [<repo-name>]` | (no flags) | `workspace(id, repoName?)` (v3.0 mission-specific verb) | **(v3.0 per Refinement #6)** Returns absolute path to mission workspace. Composable: `cd $(msn workspace msn-deadbeef adapter-kernel)`. Errors with `MissionStateError` on pre-`started` (no workspace) OR terminal-without-`--retain` (workspace destroyed). |
| `msn workspace <id>:<repo>[/<path>]` | (no flags) | `workspace(idOrCoord)` v4.0 colon-notation | **(v4.0 NEW per idea-265 multi-participant + MEDIUM-R1.3)** Substrate-coordinate addressing per Rule N. Granularity follows coordinate; file-level returns absolute file path. Composable: `cat $(msn workspace m-foo:design-repo/docs/foo.md)`. |
| `msn show <id>:<repo>` | (no flags) | `get('mission', idOrCoord)` v4.0 coord-form | **(v4.0 NEW per idea-265)** Substrate-coordinate addressing per Rule N. Repo-granularity coord returns per-repo state including `role`/`syncState`/`remoteRef`/`lastSyncAt` (per `MissionRepoState` extension). |
| `msn list <id\|name>` | (no flags) | `list('repo', {missionId})` v4.0 coord-drill-down | **(v4.0 NEW per idea-265)** Drill-down: row-per-repo within mission. Columns: `name` / `role` / `sync-state` / `remote-ref` / `last-sync-at`. v1.x extends with `msn list <id>:<repo>` for row-per-file. |
| `msn join <id\|name>` | `--coord-remote <url>` (REQUIRED), `--principal <id>` (optional; defaults to IdentityProvider.resolve) | `join(id, coordRemote, principal?)` v4.0 mission-specific verb | **(v4.0 NEW per idea-265 multi-participant + HIGH-R2.2)** Reader-side mission-engagement. Spawns 7-step `joined → reading` transition per §2.4.1: validates authorization (writer must have `add-participant` for this principal first; coord-remote tag confirms); allocates per-principal workspace; clones repos from coord-remote; sets `0444` strict-enforce; spawns reader-daemon. Returns `MissionState`. |
| `msn leave <id\|name>` | `--purge-workspace` (optional; default = preserve for forensic-history) | `leave(id, opts?)` v4.0 mission-specific verb | **(v4.0 NEW per idea-265 multi-participant + HIGH-R2.2)** Reader-side mission-disengagement. SIGTERM reader-daemon; releases reader's per-principal lockfile (`<id>.<principal>.lock`); preserves per-principal workspace by default; `--purge-workspace` removes workspace. Reader-side state-machine: `reading → leaving → (terminal)`. |
| **(v3.0: per-mission git-ops `msn git` namespace REMOVED — engineer-git-less workspace-hypervisor framing per Round-3 Refinement #1; engine handles git internally; engineer uses native filesystem-tools inside the workspace path returned by `msn workspace`)** | | | |
| **Scope resource ops (v2.0 NEW per Refinement C — multi-mission composition primitive)** | | | |
| `msn scope create` | `[--name <slug>] [--description <text>] [--repo <url>...]` | `create('scope', {name?, description?, repo?})` (v3.0 generic verb) | Scaffold scope config at `<workspace>/scopes/<scope-id>.yaml`; auto-generates `scp-<8-char-hash>`; `--repo` repeatable for multi-repo at create-time. **stdout:** prints canonical id one-line; with `--name`: tab-delimited |
| `msn scope show <id\|name>` | `[--include-references] [--output json\|yaml]` | `get('scope', id, {includeReferences})` (v3.0) | Detail view; default omits `referencedByMissions` scan (O(1)); `--include-references` triggers O(N) scan |
| `msn scope list` | `[--include-references] [--output json\|yaml]` | `list('scope', filter?, {includeReferences})` (v3.0) | Table view of all scopes |
| `msn scope update <id\|name> repo-add <file\|url>` | `[--name <local-name>] [--branch <name>] [--base <branch>]` | `update('scope', id, { kind: 'add-repo', repo })` (v3.0 generic verb) | Add repo to scope; mutates `<workspace>/scopes/<id>.yaml`. Propagates to NOT-YET-STARTED missions referencing this scope; does NOT propagate to STARTED missions (snapshot inlined per §2.4.2 hybrid resolution) |
| `msn scope update <id\|name> repo-remove <repo-name>` | (no flags) | `update('scope', id, { kind: 'remove-repo', repoName })` (v3.0) | Remove repo from scope; same propagation discipline |
| `msn scope update <id\|name> name <new-name>` | (no flags) | `update('scope', id, { kind: 'rename', newName })` (v3.0) | Rename scope's `--name` slug; triggers symlink-rename flow per §2.4 |
| `msn scope update <id\|name> description <text>` | (no flags) | `update('scope', id, { kind: 'set-description', description })` (v3.0) | Set scope description |
| `msn scope update <id\|name> tags-set <key> <value>` | (no flags) | `update('scope', id, { kind: 'set-tag', key, value })` (v3.0) | Set single tag |
| `msn scope update <id\|name> tags-remove <key>` | (no flags) | `update('scope', id, { kind: 'remove-tag', key })` (v3.0) | Remove single tag |
| `msn scope delete <id\|name>` | (no flags) | `delete('scope', id)` (v3.0 generic verb) | Terminal — removes scope config + symlink. **Cascade-protection:** rejects with `MissionStateError("scope referenced by N non-terminal missions; update mission scope-ids OR delete missions first")` if any mission state ∈ `created/configured/started/in-progress` references this scope. Terminal missions (`completed`/`abandoned`) don't block (they've inlined snapshot). |
| **Non-mission resource ops (explicit resource prefix)** | | | |
| ~~`msn remote add` / `list` / `remove`~~ | (REMOVED v1.6 fold per HIGH-R5.1) | — | RemoteProvider configured per-mission via SDK constructor injection OR mission-config `remote.provider` field; no separate CLI surface for multi-remote management at v1 |
| `msn config get <key>` / `msn config set <key> <value>` | (no flags) | `configGet` / `configSet` | Operator config |
| **Help + version** | | | |
| `msn --help` / `<verb> --help` | (per-verb help) | — | Documentation |
| `msn --version` | (no flags) | — | Version output |

**Normalized arg-count grammar (v1.5 fold per MEDIUM-R4.11; parser-implementation contract):**

Per-verb required/optional positional + flag spec for Rule 6 post-dispatch arg-count validation. Strict-1.0 commits this normalized table.

| Verb path | Required positional | Optional positional | Allowed flags (verb-specific) |
|---|---|---|---|
| `msn create` | 0 | 0 | `--name <slug>`, `--repo <url>`, `--scope <id\|name>` + global (v2.0 flag-driven one-liner support per Refinement A+C) |
| `msn list` | 0 | 0 | `--status <state>`, `--output json\|yaml` + global |
| `msn show` | 1 (`<id\|name>`) | 0 | `--output json\|yaml` + global |
| `msn start` | 0 (with `-f <path>`) OR 1 (`<id\|name>`) | 0 | `-f <path>`, `--retain` + global |
| `msn apply` | 0 | 0 | `-f <path>` (required) + global |
| `msn complete` | 2 (`<id\|name> <message>`) | 0 | `--purge-config` + global (v3.0: message required positional per Round-3 Refinement #4) |
| `msn abandon` | 2 (`<id\|name> <message>`) | 0 | `--purge-config` + global (v3.0: message required positional) |
| `msn tick` | 1 (`<id\|name>`) | 0 | global |
| `msn workspace` | 1 (`<id\|name>`) OR 1 (`<coord>` per Rule N) | 1 (`<repo-name>`) | global (v3.0 NEW per Round-3 Refinement #6; v4.0 extended per Rule N) |
| `msn join` | 1 (`<id\|name>`) | (none) | `--coord-remote <url>` (REQUIRED), `--principal <id>` (optional), global (v4.0 NEW per idea-265) |
| `msn leave` | 1 (`<id\|name>`) | (none) | `--purge-workspace` (optional), global (v4.0 NEW per idea-265) |
| `msn show` | 1 (`<id\|name>`) OR 1 (`<coord>` per Rule N) | (none) | global (v4.0 extended per Rule N for repo-granularity) |
| `msn list` | 0 (lists missions) OR 1 (`<id\|name>` for drill-down) | (none) | `--status <state>`, global (v4.0 extended for drill-down) |
| **`update` namespace (v2.0 NEW per Refinement B)** | | | |
| `msn update <id\|name> repo-add` | 2 (`<id> <file\|url>`) | 0 | `--name <slug>`, `--branch <name>`, `--base <branch>` + global |
| `msn update <id\|name> repo-remove` | 2 (`<id> <repo-name>`) | 0 | global |
| `msn update <id\|name> name` | 2 (`<id> <new-name>`) | 0 | global |
| `msn update <id\|name> description` | 2 (`<id> <text>`) | 0 | global |
| `msn update <id\|name> hub-id` | 2 (`<id> <hub-id>`) | 0 | global |
| `msn update <id\|name> scope-id` | 2 (`<id> <scope-id\|name\|"">`) | 0 | global |
| `msn update <id\|name> tags-set` | 3 (`<id> <key> <value>`) | 0 | global |
| `msn update <id\|name> tags-remove` | 2 (`<id> <key>`) | 0 | global |
| **(v3.0: `git` namespace REMOVED per Round-3 Refinement #1 — engineer-git-less workspace-hypervisor framing)** | | | |
| **`scope` namespace (v2.0 NEW per Refinement C)** | | | |
| `msn scope create` | 0 | 0 | `--name <slug>`, `--description <text>` + global |
| `msn scope show` | 1 (`<id\|name>`) | 0 | `--output json\|yaml` + global |
| `msn scope list` | 0 | 0 | `--output json\|yaml` + global |
| `msn scope update <id\|name> repo-add` | 2 (`<id> <file\|url>`) | 0 | `--name <slug>`, `--branch <name>`, `--base <branch>` + global |
| `msn scope update <id\|name> repo-remove` | 2 (`<id> <repo-name>`) | 0 | global |
| `msn scope update <id\|name> name` | 2 (`<id> <new-name>`) | 0 | global |
| `msn scope update <id\|name> description` | 2 (`<id> <text>`) | 0 | global |
| `msn scope update <id\|name> tags-set` | 3 (`<id> <key> <value>`) | 0 | global (v2.1 fold per MEDIUM-R1.1) |
| `msn scope update <id\|name> tags-remove` | 2 (`<id> <key>`) | 0 | global (v2.1 fold per MEDIUM-R1.1) |
| `msn scope delete` | 1 (`<id\|name>`) | 0 | global |
| ~~`msn remote add` / `list` / `remove`~~ | — | — | (REMOVED v1.6 fold per HIGH-R5.1) |
| `msn config get` | 1 (`<key>`) | 0 | `--output json\|yaml` + global |
| `msn config set` | 2 (`<key> <value>`) | 0 | global |

Rule 6 algorithm reads this table for arg-count validation; reference implementation in `src/missioncraft-cli/grammar/arg-spec.ts` (machine-readable spec). CLI table (above) is the operator-facing rendering of the same data.

**Global flags (apply to all verbs; v1.4 fold per MINOR-R3.1):**

| Global flag | Purpose | Precedence |
|---|---|---|
| `--workspace-root <path>` | Override workspace-root for this invocation | CLI flag wins over env-var `MSN_WORKSPACE_ROOT` + mission-config + SDK constructor + default `~/.missioncraft` |
| `--wip-cadence-ms <ms>` | Override WIP commit cadence for this invocation | Same precedence chain |
| `--snapshot-cadence-ms <ms>` | Override snapshot cadence | Same |
| `--lock-wait-ms <ms>` | Override lock-acquire wait timeout | Same |
| `--lock-validity-ms <ms>` | Override lock-validity TTL | Same |
| `--output <json\|yaml>` | Override default output format (text→json/yaml; for read-verbs only) | Same |

Global flags apply UNIFORMLY across all verbs; per-verb flags shown in CLI table (e.g., `--name`, `--retain`, `--purge-config`) are verb-specific. Strict-1.0 commits global-flag list; additive-only post-v1.

**Mission resource selector + parser disambiguation rules (v1.2 fold per MEDIUM-2):**

CLI grammar tokenization rules (parser-disambiguation):

1. **Reserved-verbs list (top-level; v3.0 fold per Round-3 refinements; v4.0 fold per idea-265 multi-participant — adds `join` + `leave` reader-side verbs):** `create / list / show / start / apply / update / complete / abandon / tick / scope / workspace / config / join / leave / --help / --version` (15 reserved verbs at v4.0; was 13 at v3.0; was 14 at v2.5). **First positional MUST match this list** — there is NO implicit-mission-selector shape. First-positional-not-matching → error `"unknown verb '<positional>'; use 'msn --help' for verb list"`. Strict-1.0 commits this list; v4.x can ADD verbs (additive-only); REMOVING verbs requires v5.x.

   **v3.0 changes** (vs v2.5): `git` REMOVED (per Round-3 refinement #1 — engineer-git-less workspace-hypervisor framing); `status` REMOVED (per Round-3 refinement #2 — collapse to `list`+`show`); `workspace` ADDED (per Round-3 refinement #6 — path-resolution surface).

   **v2.5 → v3.0 grammar shift cascade:**
   - v2.5 `msn git <id> <repo> <git-verb>` → v3.0 (REMOVED) — engineer cd's via `msn workspace` + uses native filesystem-tools; engine handles git internally via GitEngine pluggable
   - v2.5 `msn status [<id|name>]` → v3.0 `msn list` (no-arg) OR `msn show <id|name>` (with-arg)
   - v2.5 implicit-workspace-discovery → v3.0 `msn workspace <id> [<repo>]` (returns absolute path; composable: `cd $(msn workspace <id> <repo>)`)

   **v3.0 engineer-git-less invariant:** at v3.0, no CLI verb performs git operations directly. Engine performs all git operations (commits, branches, pushes, PRs, cleanup) invisibly via GitEngine pluggable + RemoteProvider. Engineer interacts with code via filesystem-tools only (Edit/Write/native shell tools; no `git` knowledge required).

2. **Reserved sub-actions (4 verb-scoped vocabularies at v3.0; was 5 at v2.5):**
   - **`update`-scoped sub-actions** (after `msn update <mission-id|name>`): `repo-add / repo-remove / name / description / hub-id / scope-id / tags-set / tags-remove`. Field-targeted mutations + sub-action mutations under the `update` umbrella.
   - **`scope`-scoped sub-actions** (after `msn scope`): `create / show / list / update / delete`.
   - **`scope update`-scoped sub-actions** (after `msn scope update <scope-id|name>`): `repo-add / repo-remove / name / description / tags-set / tags-remove`.
   - **`config`-scoped sub-actions** (after `msn config`): `get / set`.
   - (v3.0 fold per Refinement #1: `git`-scoped per-mission per-repo positionals REMOVED — engineer-git-less workspace-hypervisor framing makes per-op git-wrapping unnecessary; engine handles git internally.)
   - (v1.6 fold HIGH-R5.1: `remote`-scoped sub-actions REMOVED — RemoteProvider is per-mission singleton via SDK constructor injection OR mission-config field.)
   - (v2.0 fold per Refinement A: `mission-scoped sub-actions` REMOVED entirely — v1.8's implicit `msn <id> repo-add` shape replaced by `msn update <id> repo-add` under the `update` umbrella.)

3. **Verb-first grammar (v3.0 update of v2.0 Refinement A; `git` namespace REMOVED + `complete`/`abandon` 2-positional + `workspace` ADD):** all top-level dispatches start with a reserved-verb. Subsequent positional shape depends on the verb:
   - **0-arg verbs:** `msn list` / `msn --help` / `msn --version`
   - **1-positional verbs:** `msn show <id|name>`; `msn start <id|name>`; `msn tick <id|name>`
   - **0-or-1-positional verbs:** `msn create` (flag-driven; optional positional)
   - **2-positional verbs (v3.0 NEW shape):** `msn complete <id|name> <message>`; `msn abandon <id|name> <message>` (message required for audit-record + PR-title; per Round-3 refinement #4)
   - **2-positional + sub-action verbs:** `msn update <id|name> <sub-action> [args]`
   - **`workspace` 1-or-2-positional (v3.0 NEW per Refinement #6; v4.0 fold per idea-265 — extends to substrate-coordinate granularity):** `msn workspace <id|name> [<repo-name>]` (returns absolute path); v4.0 NEW colon-notation form: `msn workspace <id>:<repo>[/<path>]` (single-positional containing `:` per Rule N — file-level resolution returns absolute file path)
   - **`join` reader-side 1-positional (v4.0 NEW per idea-265 multi-participant):** `msn join <id|name> --coord-remote <url> [--principal <id>]` (reader-side; spawns 7-step `joined → reading` transition per §2.4.1; allocates per-principal workspace; clones from coord-remote; spawns reader-daemon)
   - **`leave` reader-side 1-positional (v4.0 NEW per idea-265 multi-participant):** `msn leave <id|name>` (reader-side; SIGTERM reader-daemon; releases reader's per-principal lockfile; preserves workspace for forensic-history unless `--purge-workspace` set)
   - **Disjunctive verbs:** `msn start` accepts `<id|name>` OR `-f <path>` (mutually-exclusive)
   - **`scope` namespace** (verb-then-sub-verb pattern): `msn scope <sub-verb> [<id|name>] [args]`
   - **`config` namespace:** `msn config <get|set> <key> [<value>]`
   - (v3.0: `git` namespace REMOVED; `status` verb REMOVED — collapsed to `list` + `show`)

4. **Disambiguation algorithm (v2.0 fold per Refinement A — simplified vs v1.8 since first positional is always verb):**
   - **0 positionals:** error ("no command specified; use `msn --help`")
   - **`[0]` ∉ top-level reserved-verbs list:** error ("unknown verb '<positional>'; use `msn --help` for verb list")
   - **`[0]` ∈ top-level reserved-verbs list:** dispatch to verb-handler; verb-handler validates remaining positionals + flags per per-verb spec (normalized arg-count table at §2.3.2)
   - **Verb-handler dispatch:** verbs with sub-action vocabularies (`update`, `scope`, `config`) MUST validate `[1]` (or `[2]` for scope) against their reserved-sub-actions list per Rule 2; non-matching → error
   - **Slug-format restriction:** mission/scope `--name <slug>` MUST match `[a-z0-9][a-z0-9-]{1,62}` (DNS-style) AND NOT match any reserved-verb/sub-action AND NOT start with `msn-` OR `scp-` prefix (auto-id namespaces); reject at `create` time
   - **Repo-name auto-derivation** (`msn update <id> repo-add <url>` derives repo-name from URL last-segment; same for `msn scope update <id> repo-add <url>`): MUST reject if derived name matches `update`-scoped reserved sub-actions list (`repo-add / repo-remove / name / description / hub-id / scope-id / tags-set / tags-remove`); operator must use `--name <override>` for collision cases.
   - **Resource-selector resolution:** verb-handler resolves `<id|name>` positional via §2.4 symlink-fast-path mechanism (regex `^msn-[a-f0-9]{8}$` → mission id-form; `^scp-[a-f0-9]{8}$` → scope id-form; else → name-form via symlink target). Each verb-handler dispatches to mission-namespace OR scope-namespace based on its own verb.

5. **Reserved-words protection (v2.0 extended; v4.0 fold per idea-265 — adds `join` + `leave`; v4.0 fold per MEDIUM-R1.3 — colon-protection):** operator cannot create mission/scope with name matching reserved-verb (e.g., `msn create --name list` → error "reserved verb"; v4.0 adds `join` + `leave` to the protected-list); cannot create mission with `--name msn-<anything>` OR `--name scp-<anything>` (auto-id namespaces; v2.0 fold per Refinement C extends to scope namespace); **v4.0 NEW:** mission/scope `--name <slug>` MUST NOT contain `:` (collision with substrate-coordinate parsing per Rule N below); prevents future ambiguity if verb is added in v2.x.

6. **Post-dispatch arg-count validation (v1.4 fold per MEDIUM-R3.6; v1.6 fold per MEDIUM-R5.4 — disjunctive arg-shape):** after Rules 1-3 land a dispatch (top-level verb / mission-scoped action / scope-sub-action / git-op), validate per-CLI-table arg-count + flag signatures. Four error-classes:
   - **missing-verb**: 0 positionals → "no command specified; use `msn --help`"
   - **missing-arg**: verb dispatched; required positional missing → "missing required arg `<arg-name>` for `<verb>`"
   - **extra-positional**: verb dispatched; unexpected positional after flag-only signature → "unexpected positional `<arg>` for `<verb>`; use `--<flag>` for inputs"
   - **mutually-exclusive**: verb's disjunctive arg-shape received both branches → "mutually-exclusive: use `<branch-A>` OR `<branch-B>`, not both"
   - Per-verb arg-count tables anchor in §2.3.2 normalized arg-count table (`msn show <id|name>` requires 1 selector; `msn list` is flag-only; etc.)
   - **Disjunctive arg-shape grammar:** when normalized arg-count table cell uses "OR" (e.g., `msn start | 0 (with -f <path>) OR 1 (<id|name>)`), Rule 6 algorithm:
     1. Check flag-presence FIRST (`-f <path>` for `msn start`)
     2. If matching flag present → validate against alternate arg-count (0 positional); reject extra positionals as mutually-exclusive
     3. If matching flag absent → validate against default arg-count (1 positional); reject 0 positionals as missing-arg
     4. Optional positional shape (`[<id|name>]` for `msn status`): accept 0 OR 1; reject 2+ as extra-positional
   - Disjunctive walk-through traces:
     - `msn start -f /tmp/m.yaml` → flag present → 0 positional expected → valid
     - `msn start storage-extract` → flag absent → 1 positional expected → valid
     - `msn start -f /tmp/m.yaml storage-extract` → flag present + extra positional → "mutually-exclusive: use `-f <path>` OR `<id|name>`, not both"
     - `msn start` → flag absent + 0 positional → "missing required arg `<id|name>` for `start` (or use `-f <path>`)"
     - `msn status` → 0 positional acceptable (lists all missions); valid
     - `msn status storage-extract extra-arg` → extra-positional error

7. **Rule N — Substrate-coordinate parsing (v4.0 NEW per idea-265 multi-participant + MEDIUM-R1.3 + F-V4.5):** any single positional containing `:` is parsed as a substrate-coordinate (`<mission-id>:<repo>[/<path>]`). Format: `<mission-id-or-name>:<repo-name>[/<path-within-repo>]`. Whitespace WITHIN a coordinate is rejected (`ConfigValidationError`). Mission/scope `--name <slug>` MUST NOT contain `:` (per Rule 5 reserved-words extension). Coordinate-form is **interchangeable** with whitespace-separated form for backward-compat where granularity allows: `msn workspace m-foo design-repo` ≡ `msn workspace m-foo:design-repo`.
   - **Rule N applies to verbs that take a resource-id positional:** `msn show <coord>`, `msn list <coord>`, `msn workspace <coord>`. Engineer learns addressing-syntax once; same shape across verbs.
   - **Granularity ladder:** `m-foo` (mission) | `m-foo:design-repo` (per-repo) | `m-foo:design-repo/docs/` (directory; v1.x DEFERRED) | `m-foo:design-repo/docs/foo.md` (file)
   - **Walk-through:**
     - `msn workspace m-foo:design-repo/docs/foo.md` → 1 positional with `:` → coordinate-form → file-level resolution → absolute file path
     - `msn workspace m-foo design-repo` → 2 positionals (no `:`) → equivalent whitespace-separated form → repo-dir path
     - `msn list m-foo` → 1 positional (no `:`) → coordinate-form mission-granularity → row-per-repo within mission (per §2.10.6 drill-down)
     - `msn show m-foo:design-repo` → 1 positional with `:` → coordinate-form repo-granularity → per-repo state including role/syncState/remoteRef/lastSyncAt
     - `msn workspace m-foo:design repo` → 2 positionals; first contains `:` (`m-foo:design`); second is `repo` → ambiguous; **resolution:** if Rule N matches first positional as coordinate-form, second positional is extra-positional → error `"extra positional 'repo' for 'workspace'; coordinate-form already specifies repo via colon-notation"`

**Algorithm walk-through on edge cases (v3.0 fold per Round-3 refinements; verb-first grammar):**

Engineer-typical flow (most common; all 4-6 verbs):
- `msn scope create --name claude-plugin --repo url1 --repo url2` → flag-driven scope-template setup with multi-repo (repeatable `--repo` flag pattern; v3.0 confirmed at MEDIUM-R3.x discussion). Resolved.
- `msn create --name update-adapter --scope claude-plugin` → flag-driven mission scaffold; mission references scope-id; auto-generates `msn-<8-char-hash>`. Resolved.
- `msn start msn-deadbeef` → 1 positional. `[0]=start ∈ top-level` → `start` dispatch with `<id|name>` arg. 8-step transition fires (per §2.4.1); engine spawns daemon-watcher (per §2.6.5 v3.0 NEW). Returns workspace path. Resolved.
- `msn workspace msn-deadbeef adapter-kernel` → 3 positional. `[0]=workspace` → `workspace` dispatch with mission-selector + repo-name. Returns absolute path; composable: `cd $(msn workspace msn-deadbeef adapter-kernel)`. Resolved.
- `msn complete msn-deadbeef "Refactor adapter kernel for v2.0"` → 3 positional. `[0]=complete ∈ top-level` → `complete` dispatch. `[1]=msn-deadbeef` mission-selector. `[2]="Refactor adapter kernel for v2.0"` message (required positional v3.0 NEW). Atomic PR-set publish-flow fires (per §2.4.1 NEW complete-step-sequence). Resolved.
- `msn abandon msn-deadbeef "stuck on issue X; restarting"` → 3 positional. Symmetric with complete; abandon-cleanup without PR creation. Resolved.

Architect / setup flow:
- `msn list` → 0 positional. `[0]=list` → tabular list of all missions (v3.0 unified default; was `msn status` in v2.5). Resolved.
- `msn list --status started` → flag filter; tabular output. Resolved.
- `msn show msn-deadbeef` → 1 positional. Detail view of mission. Resolved.
- `msn update msn-deadbeef name new-name` → 4 positional. `[0]=update ∈ top-level`; `[1]` mission-selector; `[2]=name` ∈ update-scoped sub-actions; `[3]` new-name arg. Triggers symlink-rename flow. Resolved.

Edge / error cases:
- `msn list show` → `[0]=list` → `list` dispatch with extra positional `show`. **Rule 6:** flag-only signature → error "unexpected positional `show` for `list`; use `--status <state>` / `--output ...`"
- `msn create show` → `[0]=create` → `create` dispatch with extra positional `show`. **Rule 6:** flag-only signature → error "unexpected positional `show` for `create`; use `--name <slug>` / `--repo <url>` / `--scope <id>`"
- `msn show` → 1 positional. **Rule 6:** requires selector → error "missing required arg `<id|name>` for `show`"
- `msn storage-extract storage-provider branch feature/foo` → `[0]=storage-extract` NOT in reserved-verbs → error "unknown verb 'storage-extract'; use 'msn --help'". (v3.0 has no `git` namespace; engineer should not be running git ops via missioncraft at all per workspace-hypervisor framing.)
- `msn complete msn-deadbeef` → 2 positional. **Rule 6:** `complete` requires `<message>` positional → error "missing required arg `<message>` for `complete`"
- `msn workspace` → 1 positional. **Rule 6:** requires `<id|name>` → error "missing required arg `<id|name>` for `workspace`"
- `msn status msn-deadbeef` → `[0]=status` NOT in reserved-verbs (REMOVED v3.0) → error "unknown verb 'status'; use `msn list` for tabular OR `msn show <id>` for detail"
- `msn git msn-deadbeef adapter-kernel commit -m "msg"` → `[0]=git` NOT in reserved-verbs (REMOVED v3.0) → error "unknown verb 'git'; missioncraft handles git operations internally; engineer interacts via filesystem-tools only. Use `msn workspace <id> <repo>` to obtain workspace path."

Common-case + error coverage. v3.0 algorithm is simpler than v2.5 (4 sub-action vocabularies vs 5; no 5-positional pattern; no `git`/`status` verbs).

This is the PARSER-LEVEL contract; v1.0 commits this disambiguation. Future v2 verb additions must avoid colliding with existing mission-name slugs (Strict-1.0 cross-version compat).

**Strict-1.0 commitment:** every verb + flag here is committed contract; post-v1 verb additions require major-bump.

**v1.1 §A carry-forward (calibration #62 catch from v1.0):** `msn citations validate` + `msn cross-repo-pr fan-out` REMAIN OUT-OF-SCOPE for v1. Sub-mission #2 (citation-validator) + sub-missions #3-#11 (component-extracts) ship their own CLI extensions OR via OIS-side orchestration; not in missioncraft v1 surface.

### §2.4 Workspace contract (v1.1 reshape — workspace path split per refinement #1+#2 k8s-shape)

**v1.1 workspace path split** (per Director-direct refinement; k8s-shape):

- `<workspace>/config/<id>.yaml` — declarative mission resource manifests (k8s-equivalent: `manifest.yaml`)
- `<workspace>/missions/<id>/<repo-name>/` — runtime workspaces (active mission state)
- `<workspace>/scopes/<scope-id>.yaml` — scope template manifests (v2.0 NEW per Refinement C; parallel structure to mission-config)
- `<workspace>/scopes/.names/<slug>.yaml` — scope name-symlinks (parallel to mission name-symlinks at `<workspace>/config/.names/`)
- `<workspace>/locks/scopes/<scope-id>.lock` — scope-locks (concurrent-update protection; mirrors mission-lock pattern at `<workspace>/locks/missions/`)
- `<workspace>/operator.yaml` — global operator-config (v1.7 fold per MEDIUM-R6.4)

**Cross-resource lock-ordering rule (v2.1 fold per MEDIUM-R1.4 — multi-resource invariant for v2.0):**

When acquiring multiple locks in a single operation, ALWAYS acquire in this order:

```
mission-lock → scope-lock → repo-locks
```

**Acquisition order is STRICT** (must be respected when acquiring multiple locks). **Release order semantic depends on holding-pattern (v2.2 fold per MINOR-R2.3 clarification):**

- **Sequentially-held locks (lock acquired, used, released BEFORE next lock acquired):** release order is unrestricted. Example: Step 2 of 8-step transition acquires scope-lock briefly + releases BEFORE Step 3 repo-locks acquired — this is sequential; no deadlock-cycle risk.
- **Simultaneously-held locks (multiple locks held concurrently):** release in REVERSE order:
  ```
  repo-locks → scope-lock → mission-lock
  ```
  Reverse-release prevents ordering-cycle deadlock under cross-operation contention (e.g., operator-A holds mission-lock+scope-lock; operator-B holds scope-lock+repo-locks; deadlock-cycle risk if release order is non-monotonic).

**Rationale:** prevents circular-wait deadlock between concurrent operators. Single-resource lock acquisition (only mission-lock OR only scope-lock OR only repo-locks) is unrestricted. Multi-resource scenarios:

- `startMission` with scope reference: acquires mission-lock → scope-lock (Step 1.5; for inline-read-then-release) → repo-locks (Step 2). Scope-lock released BEFORE repo-locks acquired (no overlap; ordering preserved).
- `applyMission` mid-mission with new scope-id: acquires mission-lock → scope-lock (for scope-existence cross-validate per MEDIUM-R1.5) → release scope-lock → atomic-write mission-config → release mission-lock.
- `deleteScope`: acquires scope-lock only (single-resource).
- `addRepoToScope` / other scope-mutations: acquires scope-lock only (single-resource).
- `setMissionScope`: acquires mission-lock only (single-resource); cross-validates scope-existence at write-time via fs.access (NOT lock-acquisition; per MEDIUM-R1.5 optimistic concurrency model).

Strict-1.0 commits this ordering; v2.x evolution can extend if new resource-types emerge (insert ordered before/after existing tiers per impact analysis).

Both rooted under `${MSN_WORKSPACE_ROOT}` (default `~/.missioncraft`). Clean separation of declarative config vs runtime state.

**Operator-config schema (v1.7 fold per MEDIUM-R6.4 — global preferences distinct from per-mission config):**

File location: `${MSN_WORKSPACE_ROOT}/operator.yaml` (default `~/.missioncraft/operator.yaml`). Schema versioned + atomic-write disciplined per MEDIUM-11.

```yaml
operator-config-schema-version: 1

defaults:                                # operator-side defaults (lower-precedence than mission-config + CLI flag + env-var)
  identity-provider: local-git-config    # default IdentityProvider string-name (PROVIDER_REGISTRY)
  approval-provider: trust-all           # default ApprovalPolicy string-name
  storage-provider: local-filesystem     # default StorageProvider string-name
  git-engine-provider: isomorphic-git    # default GitEngine string-name
  remote-provider: pure-git              # default RemoteProvider string-name (or 'gh-cli' if operator opts in)

  workspace-root: "~/.missioncraft"      # operator-default; CLI/env override per precedence chain
  snapshot-root: "~/.missioncraft/snapshots"  # default snapshotRoot for state-durability

  # v4.0 NEW per idea-265 multi-participant + v4.4 fold per MEDIUM-R1.7 — multi-principal extension
  # Resolves on multi-principal hosts (per HIGH-R1.2 partition-spec — workspace-root MUST be principal-distinct)
  # Optional: if absent, single-principal-on-host behavior preserved (uses `workspace-root` above; v3.6 baseline)
  workspace-root-by-principal:
    lily@apnex: "~/.missioncraft-lily/workspace"     # per-principal workspace-root override
    greg@apnex: "~/.missioncraft-greg/workspace"
  # Engine resolution (current-principal precedence chain Step 4 per §2.3.1):
  #   1. CLI flag --workspace-root <path>
  #   2. Env-var MSN_WORKSPACE_ROOT
  #   3. mission-config workspace-root field (per-mission override)
  #   4. SDK constructor workspaceRoot
  #   5. v4.4 NEW: workspace-root-by-principal[<current-principal>]  (looked up via current-principal precedence chain Steps 1-4 per §2.3.1)
  #   6. defaults.workspace-root (single-principal default)
  #   7. built-in default `~/.missioncraft`
  # Multi-principal-host detection: if MULTIPLE principals invoke missioncraft on same OS-user host AND `workspace-root-by-principal` is unset → engine emits MissionStateError("multi-principal host detected; configure workspace-root-by-principal in operator.yaml OR set MSN_PRINCIPAL_ID per-invocation"). Detection mechanism: principal-id mismatch on existing lockfile in workspace.

  state-durability:                      # per-key override of built-in defaults
    wip-cadence-ms: 30000
    snapshot-cadence-ms: 300000
    snapshot-retention:
      min-count: 5
      min-age-hours: 24
    wip-branch-cleanup: delete-on-complete-retain-on-abandon
    network-retry:
      max-attempts: 5
      backoff-ms: 1000

  lock-timeout:
    wait-ms: 0
    validity-ms: 86400000

provider-config:                         # per-provider config (e.g., gh-cli path); v1.8 fold per MINOR-R7.2 — provider-context-implicit naming
  gh-cli:
    path: gh                             # PATH-resolved by default; operator can override to absolute path. Provider-context implicit from parent key (`gh-cli`); same convention applies to future v1.x provider-configs (e.g., `provider-config.gitlab-cli.path`)
```

**OperatorConfigSchema** (zod runtime; exported alongside MissionConfigSchema per MEDIUM-R3.1) commits the closed key-namespace; v1.x can ADD optional keys (additive-only). `configGet`/`configSet` zod-validate key-name against schema; unknown-key → `ConfigValidationError`.

**`configGet` / `configSet` semantics:**
- `configGet(key)`: dot-notation key (e.g., `defaults.identity-provider`); reads `${MSN_WORKSPACE_ROOT}/operator.yaml`; returns `string | undefined`. Hydrate-with-zod-validate on read.
- `configSet(key, value)`: dot-notation key; mutation via atomic-write discipline (write-temp + zod-validate-roundtrip + rename); throws `ConfigValidationError` on key-namespace violation OR value-format violation.
- Operator-config is global (one file per workspace); separate from per-mission config (one file per mission).

**Precedence chain (extended; v1.7 fold per MEDIUM-R6.4):**

```
CLI flag > env-var > mission-config field > SDK constructor (MissioncraftConfig) > operator-config > built-in default
```

Operator-config sits BETWEEN SDK constructor + built-in default — operator-side persistent preferences override built-in defaults but are overridden by SDK-consumer-supplied + per-invocation overrides.

**Operator-config consultation boundary (v1.8 fold per MEDIUM-R7.1 — sovereignty discipline):**

- **CLI-internal Missioncraft construction consults operator-config:** when CLI scaffolds an SDK instance to invoke methods (e.g., `msn start <id>` internally constructs `new Missioncraft({...})`), CLI MUST source REQUIRED pluggable defaults (identity/approval/storage/gitEngine) from operator-config when not overridden by mission-config or CLI flags. CLI failure-mode: if operator-config is missing AND no mission-config provider override AND no CLI flag → error `ConfigValidationError("operator-config missing required pluggable default; run 'msn config set defaults.identity-provider <value>'")`.
- **SDK-direct consumers (OIS adapter, custom tooling) DO NOT consult operator-config for required pluggables.** SDK-direct callers MUST inject required pluggables via `MissioncraftConfig` directly; explicit-injection-only contract per §2.3.1. Sovereignty: SDK-direct caller manages own config; missioncraft does NOT silently inherit operator-config preferences the caller didn't request.
- **Optional fields apply uniformly across BOTH CLI + SDK-direct paths** via the precedence chain — operator-config is consulted for `remote`, `workspaceRoot`, `stateDurability`, `snapshotRoot`, `lockTimeoutWaitMs`, `lockTimeoutValidityMs` regardless of caller-path. Optional fields are not sovereignty-sensitive; precedence-chain defaults are appropriate.

This boundary closes the silent-inheritance attack surface: SDK-direct consumers explicit about identity/approval/storage/gitEngine; missioncraft transparent about which fields it consults from where.

**Env-var mapping (v1.8 fold per MEDIUM-R7.2 — closed env-var list aligned with §2.3.2 global flags):**

| Env-var | Operator-config key | Global-flag equivalent |
|---|---|---|
| `MSN_WORKSPACE_ROOT` | `defaults.workspace-root` | `--workspace-root <path>` |
| `MSN_WIP_CADENCE_MS` | `defaults.state-durability.wip-cadence-ms` | `--wip-cadence-ms <ms>` |
| `MSN_SNAPSHOT_CADENCE_MS` | `defaults.state-durability.snapshot-cadence-ms` | `--snapshot-cadence-ms <ms>` |
| `MSN_LOCK_WAIT_MS` | `defaults.lock-timeout.wait-ms` | `--lock-wait-ms <ms>` |
| `MSN_LOCK_VALIDITY_MS` | `defaults.lock-timeout.validity-ms` | `--lock-validity-ms <ms>` |
| `MSN_OUTPUT` | (no operator-config equivalent; per-invocation only) | `--output json\|yaml` |

Strict-1.0 commits these 6 env-vars (1:1 mapping with global flags from §2.3.2). Other operator-config keys (provider selection, snapshot-retention, network-retry, provider-config.*) are operator-config-only at v1 (no env-var override). v1.x can ADD env-vars (additive-only).

Per-precedence-chain: env-var > mission-config > SDK constructor > operator-config > built-in default. Env-var override is a per-process tactical override; operator-config is the persistent operator-default.

**Workspace contract details:**

- **Mission ID format (per refinement #1+#2; v1.5 fold per MEDIUM-R4.9 wording-clarification):** `msn-<8-char-hash>` is ALWAYS auto-generated by `msn create` (canonical id; never replaced). Operator can ADDITIONALLY assign a human-friendly slug via `--name <slug>`; the slug becomes a name-symlink ALIAS at `<workspace>/config/.names/<slug>.yaml` → `<id>.yaml` (NOT a replacement for the id). SDK methods accept the canonical id only; CLI accepts `<id|name>` and resolves via symlink. Composes with idea-251 agent-id format (`agent-XXXXXXXX`); sovereign-component-internal-id namespace.
- **id-vs-name resolution boundary (v1.3 fold per MEDIUM-R2.4; v1.4 fold per MEDIUM-R3.5 — symlink-fast-path):** SDK signatures accept `id: string` ONLY (canonical `msn-<hash>` form); CLI accepts `<id|name>` and performs the resolution before invoking SDK.
  - **v1 mechanism (symlink-fast-path):** name→id resolution = `fs.readlink(<workspace>/config/.names/<name>.yaml)` (O(1); no parse); id-passthrough = `fs.access(<workspace>/config/<id>.yaml)` existence check. Linear-scan only required for `msn list` (which is intrinsically O(N)).
  - **Symlink-mechanism doubles as race-resolution primitive (per MEDIUM-R3.3):** `O_EXCL` failure-on-exists at create-time enforces uniqueness; symlink target at lookup-time enables O(1) resolution.
  - **v1 documented operator-targeting limit:** designed for ~1000s of missions per workspace; performance characteristics linear with file-count for `msn list`. v1.x can add cached-index file `<workspace>/config/.index.yaml` (additive; safe under Strict-1.0) if scale demands; symlink mechanism remains the create-path primitive.
  - **Filename pattern locked at v1:** `<id>.yaml` for configs; `.names/<name>.yaml` for name-symlinks (operator-supplied --name only; auto-id-only missions have no symlink). Strict-1.0 commits filename contract.
  - SDK is id-only contract; CLI does the human-friendly translation. Matches k8s pattern (`kubectl` resolves resource-name to UID before kubelet call).
- **Name-uniqueness invariant (v1.3 fold per MEDIUM-R2.4):** `msn create --name <slug>` MUST reject if any existing mission-config has same name (CLI scans `<workspace>/config/*.yaml` for collision pre-create); without uniqueness, name→id resolution is ambiguous. Auto-generated `msn-<8-char-hash>` ids have collision-detection per MEDIUM-1 (regenerate-with-retry-cap-3); name-collision detection is the operator-input variant of the same invariant.
- **Concurrent create race-resolution (v1.4 fold per MEDIUM-R3.3):** name-uniqueness scan + scaffold-write are non-atomic; two concurrent `msn create --name foo` operators could both pass scan + both write. **Mechanism:** POSIX `O_EXCL` create on a name-index symlink at `<workspace>/config/.names/<slug>.yaml` → `<id>.yaml` (file-system enforces failure-on-exists; atomic; cheap). Sequence:
  1. Generate `msn-<hash>` id (per MEDIUM-1)
  2. Atomic-write `<workspace>/config/<id>.yaml` (per MEDIUM-11 atomic-write discipline)
  3. Attempt `fs.symlink(<id>.yaml, <workspace>/config/.names/<slug>.yaml)` with `O_EXCL` semantic — if symlink exists → name-collision → DELETE the just-written `<id>.yaml` + emit `MissionStateError("name '<slug>' already taken")` to operator
  4. Mission persisted with both id + name uniqueness enforced
  - Symlink approach avoids workspace-level create-lock (faster; lock-free for the create-path); also enables fast name→id resolution at CLI invocation (read symlink target instead of scanning all configs).
- **OS-support boundary (v1.5 fold per MEDIUM-R4.1):** v1 supports **Linux + macOS only** (POSIX symlink + `O_EXCL` mechanism). Windows operators receive clear platform-rejection at SDK constructor (`new Missioncraft({...})` runtime-checks `os.platform()`; throws `UnsupportedOperationError("missioncraft v1 requires Linux or macOS; Windows support deferred")` if `process.platform === 'win32'`). v1.x can add Windows support via lock-file alternative (NDB-style; `<slug>.lock` file with PID + checked at create-time) OR junction-points fallback. CI matrix per §2.9.3 already restricted to `ubuntu-latest + macos-latest`.
- **Name-rename flow (v1.5 fold per MEDIUM-R4.4; v1.6 fold per MEDIUM-R5.6 — explicit rollback boundary; reordered config-write FIRST for cleaner failure semantics):** `applyMission` pre-start with mutated `mission.name` triggers symlink-rename. Two-step (delete + create) on its own is non-atomic. **Mechanism:** acquire mission-lock for the entire rename sequence (per MEDIUM-R4.7 applyMission pre-start mission-lock requirement); within the lock — **config-write FIRST then symlink swap** (per v1.6 fold; if config-write fails before any symlink mutation, original state preserved):
  1. **Atomic-write updated `<id>.yaml`** with new name to temp file (`<id>.yaml.tmp`); on failure → `ConfigValidationError`; original config + symlink preserved (no rollback needed)
  2. **`O_EXCL` on new symlink** `fs.symlink(<id>.yaml, <workspace>/config/.names/<bar>.yaml)` — on collision → `MissionStateError("name 'bar' already taken")`; **rollback:** delete `<id>.yaml.tmp`; original config + symlink preserved
  3. **`fs.unlink` old symlink** `<workspace>/config/.names/<foo>.yaml` — on failure (e.g., concurrent unlink, fs error) → **rollback:** unlink new symlink (restore single-name state); delete `<id>.yaml.tmp`; original config + symlink preserved; emit `StorageAllocationError`
  4. **`fs.rename` temp config → final config** (`<id>.yaml.tmp` → `<id>.yaml`; POSIX atomic on same-fs) — on failure → **rollback:** recreate old symlink at `<workspace>/config/.names/<foo>.yaml` pointing to `<id>.yaml`; unlink new symlink; emit `StorageAllocationError`
  Mission-lock guards concurrent-applyMission on same mission; `O_EXCL` guards concurrent create-or-rename collision on `bar`. Rollback invariant: ALL failure modes preserve operator-observable state (either old name fully intact OR new name fully active; never partial).
- **`complete` step-sequence (v3.0 NEW per Round-3 Refinement #4 — atomic PR-set publish-flow; supersedes v2.5 simpler cleanup-only flow):** `msn complete <id> "<message>"` from `started`/`in-progress` performs steps in order under existing mission-lock:
  0. **Final cadence-tick** (filesystem-watch flush): capture any pending workspace edits as wip-commits on `mission/<id>` branch. Single lock-cycle invariant per v2.4 fold MINOR-R4.3 — under existing mission-lock.
  1. **Per-repo publish-loop** (atomic across mission's repos):
     For each `repo` in mission.repos[]:
     - **(v3.0):** if no wip-commits beyond start-branch creation → SKIP (no-changes; just cleanup local branch); log `[no changes in <repo>]`
     - **Squash wip-commits** (per `defaults.complete-strategy: squash` operator-config; default squash; opt-in `preserve-history` keeps N commits): produce final commit with `<message>` text on `mission/<id>` branch
     - **Push** `mission/<id>` to remote (fast-forward push; no force). On push-failure: mission stays `in-progress`; partial state preserved; engineer retries `msn complete`. On base-diverged (non-fast-forward): reject with `MissionStateError("base diverged for <repo>; mission cannot complete cleanly; abandon and create new mission off updated base")` — NO auto-rebase at v1; operator-recovery via mission-recreation (per workspace-hypervisor framing — engineer never resolves rebase conflicts).
     - **Open PR** via `RemoteProvider.openPullRequest({head: 'mission/<id>', base: <RepoSpec.base>, title: <message>, body: <auto-generated>})`. Capability-gated: if `RemoteProvider.capabilities.supportsPullRequests = false` (e.g., `pure-git` mode) → SKIP PR-creation (push only); log `[push-only; no PR for <repo>]`. PR-creation failure (gh-cli auth expired, etc.) → mission stays `in-progress`; partial-success preserved (PRs already opened are durable); engineer retries.
  2. **Persist `lifecycle-state: completed` to config + `published-prs[]`** via RMW under mission-lock (atomic-write per MEDIUM-11). Returns `MissionState.publishedPRs[]: { repoName, prUrl }[]` to operator (CLI prints; SDK returns).
  3. **Release mission-lock + repo-locks** via StorageProvider.
  4. **Daemon-watcher signaled to terminate** (per §2.6.5 v3.0 NEW — daemon dies on mission-terminal).
  5. **Cleanup local mission-branches** in each repo workspace (delete local branch; remote branch persists for PR-merge).
  6. **Destroy runtime workspace** at `<workspace>/missions/<id>/` (per `--retain` not set).
  7. **(if `--purge-config`)** Delete `<id>.yaml` + `.names/<slug>.yaml` symlink (atomic; both-or-neither).
  Idempotent retry: per-repo state tracked in `<workspace>/config/<id>.yaml.publishStatus[<repoName>]` (NEW v3.0 field). If `complete` fails partway (e.g., 3 of 5 PRs opened then push-fails), retry resumes from where it failed. Crash anywhere after step 2 leaves mission in `completed` state on-disk; recoverable. Same step-sequence applies to `abandon` MINUS the publish-loop (steps 1.0 + 1.4 only — final tick + cleanup local branches; NO push; NO PR creation).
  - **Mutual-exclusion preserved (v1.7 fold MINOR-R6.2):** if mission was started with `--retain` AND `--purge-config` supplied at terminal-time → reject with `MissionStateError("--retain (set at start) + --purge-config (at complete) would orphan workspace; choose one")`.
  - **Engineer-git-less invariant (v3.0):** engineer's CLI invocation is just `msn complete <id> "<msg>"`; engine performs all squash + push + PR-creation invisibly. No git knowledge required from engineer.
- **`--purge-config` on auto-id-only mission (no name-symlink) (v1.6 fold per MEDIUM-R5.7):** auto-id-only missions (operator didn't supply `--name`) have no `.names/<slug>.yaml` symlink. `--purge-config` step 4 gracefully no-ops the symlink-unlink if absent (existence-check before unlink); only deletes `<id>.yaml`. Operator-observable behavior identical regardless of name-presence.
- **Terminal-state name-symlink retention (v1.5 fold per MEDIUM-R4.5; option (c) preserve both):** `complete`/`abandon` WITHOUT `--purge-config` flag (default) PRESERVES BOTH `<id>.yaml` AND `.names/<slug>.yaml` symlink. Name-namespace blocks reuse: `msn create --name <slug>` MUST reject if any TERMINAL mission with same name exists (until operator invokes `complete --purge-config` or `abandon --purge-config` to free the name). This:
  - Composes with mission-history-preservation default (config retained for forensics + replay)
  - Enables `msn list` to show terminal missions by-name (uniform UX)
  - Operator must explicitly opt-in to name-reuse via `--purge-config`
  - `complete`/`abandon --purge-config` removes BOTH `<id>.yaml` AND `.names/<slug>.yaml` symlink atomically (single transaction under mission-lock)
- **CLI lookup id-vs-name prefix-detection (v1.5 fold per MEDIUM-R4.8):** CLI receives `<id|name>` selector; dispatch via regex prefix-detection:
  1. Match `^msn-[a-f0-9]{8}$` (auto-id strict pattern) → id-form; `fs.access(<workspace>/config/<id>.yaml)`
  2. Else → name-form; `fs.readlink(<workspace>/config/.names/<name>.yaml)` → resolves to `<id>.yaml`
  3. ENOENT on either path → `MissionStateError("mission not found: <selector>")`
  - Strictly disjoint (regex match-or-not); no fallback ambiguity. Operator-supplied `--name` MUST NOT match auto-id regex (per parser rule 5 reject-on-create).
- These mechanisms together (symlink + uniqueness + rename-under-lock + terminal-retention + prefix-detection) form the **name-mechanism contract** committed under Strict-1.0.
- **Concurrent races between create-with-name and complete-with-purge resolution (v1.6 fold per MINOR-R5.2):** concurrent `msn create --name foo` + `msn complete <other-id> --purge-config` (where `<other-id>` had name `foo`) resolves cleanly under `O_EXCL` semantics:
  - Operator-A's create check sees foo-symlink → reject A with `MissionStateError("name 'foo' already taken")`; OR
  - Operator-A's create sees no symlink (B's purge already unlinked it) → A scaffold + `O_EXCL` succeeds
  No silent-corruption window per `O_EXCL` atomicity. Operator-A retry (after seeing transient "name taken" error) is safe.
- **Hub-side mission ID mapping:** Hub-delivered mission-config carries Hub's `mission-77`-style id as a field (`mission.hub-id: "mission-77"`); missioncraft keeps its own `msn-<hash>` internal id. Mapping recorded in mission-config metadata. Sovereignty preserved (missioncraft doesn't know what Hub IDs mean; just stores the mapping).
- **Hub-id integrity boundary (v1.2 fold per MEDIUM-12):** `hub-id` is INFORMATIONAL ONLY at v1; missioncraft never queries by hub-id (only by `msn-<hash>` internal id). Hub-id rename (Hub-side mission rename) is operator's responsibility to fold via `applyMission` with updated config; missioncraft does NOT bidirectionally sync. Hub doesn't observe missioncraft's `msn-<hash>` either — Hub→missioncraft is one-way config-delivery; missioncraft→Hub is operator-invocation (e.g., `gh pr create` if RemoteProvider is gh-cli, but that's GitHub-side, not Hub-side).
- **OIS adapter integration shape (v1.2 fold per MEDIUM-13; v1.3 fold per MEDIUM-R2.11 wire-format):** OIS adapter integrates via SDK-DIRECT method calls, NOT CLI shell-out. Canonical contract:

  **Hub→adapter wire format:** JSON payload with **kebab-case keys** (matches operator-facing YAML; single canonical wire-format across YAML disk + JSON wire). MCP tool result delivers `event.payload.missionConfig` as JSON-decoded object with kebab-case keys.

  **Adapter responsibility:** zod-parse the payload via the SAME `MissionConfigSchema` used for YAML hydration; the schema's transform turns kebab-case keys into camelCase TS object before SDK call. Composes with §2.3.1 SDK-side zod-validate-at-entry (defense-in-depth; not redundancy).

  ```typescript
  // Inside the OIS adapter (claude-plugin / opencode-plugin):
  import { Missioncraft, MissionConfigSchema } from '@apnex/missioncraft';
  const mc = new Missioncraft({ /* operator-config */ });

  // Hub delivers mission-config as JSON object with kebab-case keys (matches YAML wire-format)
  hub.on('mission_dispatched', async (event) => {
    // Adapter zod-parses (kebab→camelCase transform applied at parse-time)
    const missionConfig = MissionConfigSchema.parse(event.payload.missionConfig);

    // v2.2 fold per MEDIUM-R2.4 — validate scope-id reference if present (Hub may reference operator-pre-configured scope)
    if (missionConfig.mission.scopeId) {
      try {
        await mc.getScope(missionConfig.mission.scopeId);  // verify exists; default {includeReferences: false}
      } catch (err) {
        throw new MissionStateError(
          `Hub-delivered mission references uncreated scope ${missionConfig.mission.scopeId}; ` +
          `operator must pre-configure scope first via 'msn scope create'`
        );
      }
    }

    try {
      await mc.startMission({ config: missionConfig });
    } catch (err) {
      if (err instanceof MissionStateError) {
        // Mission may already exist; try applyMission for additive changes
        await mc.applyMission({ id: missionConfig.mission.id, config: missionConfig });
      } else {
        throw err;
      }
    }
  });
  ```
  Adapter handles transport (Hub→adapter via MCP); missioncraft is transport-agnostic. NO `msn` CLI shell-out from adapter (per refinement #4 SDK-primary). The CLI binary `msn` is for OPERATOR use; the adapter is a separate SDK consumer.

  **Scope is missioncraft-internal-only at v1 (v2.2 fold per MEDIUM-R2.4 — option (a) sovereignty boundary):** Hub does NOT deliver scope-configs. Operator pre-configures scopes via CLI/SDK direct (`msn scope create` + `msn scope update <id> repo-add ...`). Hub-delivered mission-configs may REFERENCE pre-configured scope-ids via `mission.scope-id` field; adapter validates scope-existence at mission_dispatched time (per code above). If Hub references uncreated scope → adapter rejects + emits actionable error. v1.x can extend if Hub-side scope-delivery demand emerges (additive — Hub starts shipping ScopeConfig payloads; adapter adds parse-and-create-scope handler; ScopeConfigSchema runtime export already supports this).
- **Configuration precedence (v0.2 carry-forward):** **CLI flag > env-var > mission-config field > default**. So `--workspace-root /custom` (CLI) wins over `MSN_WORKSPACE_ROOT=/env-path` (env) wins over `workspace-root: /config-path` (mission-config) wins over `~/.missioncraft` (default). Same precedence model applies to ALL configurable fields.
- **Single-writer-per-mission lock:** acquired via `StorageProvider.acquireMissionLock(missionId, { waitMs?, validityMs? })` at mission start; lockfile at `<workspace>/locks/missions/<missionId>.lock` (per-mission scope); `validityMs` default 24h per F14
- **One-active-mission-per-repo lock:** acquired via `StorageProvider.acquireRepoLock(repoUrl, missionId, { waitMs?, validityMs? })`; lockfile at `<workspace>/locks/repos/<sha256(repoUrl)>.lock` (cross-mission scope; v1.2 fold per HIGH-5 — repo-locks are globally-scoped resources, NOT per-mission, so live in their own directory); lockfile contents reference active mission-id for diagnostics; prevents two missions checking out conflicting branches
- **Lock-timeout recovery (v0.2 carry-forward):** stale-`expiresAt` auto-release; mission-state derivable from wip-branch + snapshotRoot per §2.6
- **Ephemeral by default:** mission runtime workspaces destroyed at `msn complete <id>` (operator opt-in to retain via `--retain` flag at start-time); long-lived workspaces only for ops-repos (operator-explicit). **Mission CONFIG (`<workspace>/config/<id>.yaml`) is NOT destroyed by default at complete** — preserves mission-history for operator inspection; operator opt-in deletion via `msn complete <id> --purge-config`.
- **Auto-merge configurability:** CLI flag for ad-hoc; mission-config-driven for governance-scope; auto-merge ≠ auto-deploy

### §2.4.1 Mission state machine (NEW v1.1 — declarative-mission shape per refinement #3)

5-state lifecycle for the mission resource:

```
created ─[repo-add]─> configured ─[start]─> started ──[work...]──> in-progress ──[complete]──> completed
   │                       │                   │           │                  │
   │                       │                   │           │                  └─[abandon]─> abandoned
   │                       │                   │           │
   │                       │                   └─[apply additive]─┐
   │                       │                                       │
   │                       │                              still in started/in-progress
   │                       │                              (self-loop on additive apply)
   │                       │
   └──[abandon]──> abandoned (terminal — config preserved unless --purge-config)
                       ▲
                       │
                       └─[abandon]─ from any non-terminal state
```

**State lifetimes (v1.6 fold per MEDIUM-R5.3):**
- `created` is a STABLE state; operator can leave a mission in `created` indefinitely (e.g., scaffolded config awaiting first repo-add). NOT instantaneous; NOT collapsed to `configured`.
- `configured` is reached upon first repo entering the mission-config (via `repo-add` OR via `apply` with config containing ≥1 repos)
- All states except `started` (transient transition) + `in-progress` (active) + `completed`/`abandoned` (terminal) are stable persistence states queryable via `getMission(id)`.

**State transitions:**

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `msn create` (no flags) | `created` | Config scaffold; no repos; no scope; no workspace |
| (none) | `msn create --repo <url>` | `configured` | v2.1 fold per HIGH-1 — combined create + first-repo-add atomic; persists initial config with single repo; final state = `configured` since config has ≥1 repo |
| (none) | `msn create --scope <id\|name>` | `configured` IF scope.repos has ≥1 repo at create-time (live hybrid resolution per §2.4.2 pre-start); ELSE `created` | v2.1 fold per HIGH-1 — combined create + scope-reference atomic; mission references scope; pre-start hybrid resolution means mission.repos view is live from scope; if scope is empty at create-time, mission stays `created` until scope gets a repo OR mission gets a directly-added repo |
| (none) | `msn create --name <slug> --repo <url>` | `configured` | One-liner shape per Director example; equivalent to `msn create --repo <url>` + name |
| (none) | `msn create --repo <url> --scope <id\|name>` | `configured` | v2.2 fold per MEDIUM-R2.1 — `--repo` + `--scope` are COMPATIBLE (option b). Mission's effective repos = mission.repos[] (containing --repo url) UNION scope.repos[] (inlined at startMission). Conflict-resolution: if mission.repos[] and scope.repos[] both contain repo with same name but different url/branch → error `MissionStateError("repo name conflict between mission and scope: <name>")` at applyMission/startMission validation; operator must rename one. **Dedup-by-name precedence (v2.5 fold per MINOR-R5.1): mission-side wins** — if name matches across mission.repos[] and scope.repos[] (same-name-same-url-and-branch; pure duplicate or `commitSha` differs), dedup keeps mission-side entry; scope-side discarded for that name. Operator-explicit-mission authoritative over scope-template-defaults. Composes with conflict-resolution rejection (different-url-or-branch errors before reaching dedup). v1.x can extend if scope-as-authority demand emerges (additive; opt-in via `mission.scope-precedence: scope-wins` field). Pre-start: `getMission(id).repos` returns the merged set with mission-side-wins dedup. |
| `created` | `msn update <id> repo-add` | `configured` | First repo added; config has at least 1 repo |
| `created` | `msn apply -f <path>` (config has 0 repos) | `created` | No-op effectively; full upsert preserves zero-repos state (v1.6 fold per MEDIUM-R5.3) |
| `created` | `msn apply -f <path>` (config has ≥1 repos) | `configured` | Full upsert + auto-state-promotion via repo-presence (v1.6 fold per MEDIUM-R5.3) |
| `configured` | `msn update <id> repo-add` | `configured` (self) | Additional repos added; mutates config (v2.2 fold per HIGH-R2.2 — verb-first grammar applied) |
| `configured` | `msn update <id> repo-remove` | `configured` (or `created` if last) | Pre-start mutation; allowed |
| `configured` | `msn start <id>` | `started` | Engine realizes declared state — clones repos in parallel; allocates workspace; acquires locks; cold-start bundle written; mission ready for work |
| `started` | (operator does work) | `in-progress` | Work-time state; per-mission git ops happen here |
| `started` / `in-progress` | `msn apply -f <path>` (additive: new repo in config) | `started` (self-loop) | Per refinement #3 — additive-only; engine clones-or-fails; rollback to original repos on clone failure; mission continues uninterrupted |
| `started` / `in-progress` | `msn apply -f <path>` (non-additive: repo-remove OR pluggable change) | ERROR `MissionStateError` | "non-additive change requires `msn complete <id>` + `msn create` + `msn start`; or use additive-only apply (repo-add)" |
| `started` / `in-progress` | `msn complete <id\|name> <message>` | `completed` | **Terminal — atomic PR-set publish-flow (v3.0 per Refinement #4):** per repo with changes — squash wip-commits → push → openPullRequest. Single message → all PRs' titles + commit messages. Daemon-watcher signaled to terminate (per §2.6.5). Locks released; workspace destroyed unless `--retain`; config preserved unless `--purge-config`. Partial-failure preserves PRs already opened; engine resumes via mission.publishStatus persistent state. `<message>` REQUIRED. |
| any non-terminal | `msn abandon <id\|name> <message>` | `abandoned` | **Terminal — cleanup-only NO PR creation (v3.0):** per repo: cleanup local mission-branch (no push; no PR). Daemon-watcher signaled to terminate. Locks released; workspace destroyed unless `--retain`; config preserved unless `--purge-config`. `<message>` REQUIRED (audit-record reason). |
| `completed` / `abandoned` | any mutation | ERROR `MissionStateError` | Terminal states are immutable; create new mission for further work |

**Pre-start mutations only** (per refinement #3 boundary):
- `repo-add` allowed in `configured` AND `started`/`in-progress` (additive-apply self-loop)
- `repo-remove` + pluggable changes (identity / approval / storage / git-engine / remote) allowed in `created` + `configured` ONLY
- Post-start: complete + recreate is the only path for non-additive changes

**Atomicity for additive `apply` mid-mission** (per refinement #3):
- Engine attempts to clone the new repo into the mission workspace
- On success: mission state extends; lock acquired on new repo; durability snapshot tick (composes with §2.6 cold-start invariant)
- On failure: rollback partial workspace state; mission continues with original repo set; error returned to caller
- No partial-state-mid-mission
- **Concurrent `apply` serialization (v1.2 fold per MEDIUM-3):** `applyMission` MUST hold `acquireMissionLock(missionId)` for the FULL apply duration (read-config → clone-new-repo → write-extended-config → release-lock). Two operators concurrent-apply on same mission → second waits per `waitMs` (default 0 fail-fast → second errors with `LockTimeoutError`). Mission-lock is the serialization primitive.

**Atomicity for `startMission` (v1.2 fold per MEDIUM-4 — partial-success semantics)**:
- Engine clones N declared repos in parallel
- All-or-nothing semantic: if ANY clone fails, rollback ALL partial workspaces; release any acquired locks; mission stays in `configured` state; error returned to caller
- No partial-success at v1 (operator's `msn start` either succeeds atomically OR mission stays declared-but-unrealized)
- Failed-repo retry: operator can re-run `msn start <id>` after fixing the cause (network restored / auth fixed / etc.)

**Cold-start bundle ordering (v1.2 fold per MEDIUM-7)**:
- The `configured → started` transition is atomic — engine performs (in order, all under mission-lock): clone-all-repos-in-parallel → wait-all-success-or-rollback → acquire repo-locks → create wip-branch → **write first bundle to snapshotRoot** → release transition-lock → state = `started`

**Mission-lock acquisition order in `configured → started` transition (9-step at v3.1; v1.3 fold per MEDIUM-R2.8; v2.1 fold per HIGH-3 — Step 2 scope-inline insertion; v2.2 fold per MINOR-R2.2 — renumbered to clean 8-step; v3.1 fold per HIGH-4 — daemon-watcher spawn-step inserted at Step 7 (was 9-step renumber)):**
1. **Acquire mission-lock** via `acquireMissionLock(missionId, { waitMs: 0 })`; on failure → `LockTimeoutError`; mission stays `configured`
2. **Scope-inline (v2.2 NEW; conditional — if mission references scope per `mission.scope-id` field; ELSE skip to Step 3):** Acquire scope-lock via `acquireScopeLock(scopeId, { waitMs: 0 })` AFTER mission-lock (cross-resource lock-ordering rule per MEDIUM-R1.4); read scope.repos; merge with mission.repos[] per MEDIUM-R2.1 effective-repos union (deduplicated by name; conflict-resolution rejects on same-name-different-url-or-branch with `MissionStateError("repo name conflict between mission and scope: <name>")`); INLINE merged set into mission-config.repos[] (atomic-write per MEDIUM-11) under both scope-lock + mission-lock; release scope-lock immediately (do NOT retain through subsequent steps). Mission-config now has snapshot of effective-repos at this moment; subsequent scope updates do NOT propagate (k8s-ConfigMap analog per §2.4.2 hybrid resolution). On scope-lock-acquire failure → `LockTimeoutError`; release mission-lock; mission stays `configured`. On scope-not-found (e.g., concurrent deleteScope per HIGH-2 race) → `MissionStateError("scope-id <X> deleted concurrently; startMission failed")`; release mission-lock; mission stays `configured`.
3. **Per declared repo (parallel; using mission-config.repos[] which now includes inlined scope.repos if applicable):** acquire repo-lock + clone via GitEngine; if ANY clone OR repo-lock-acquire fails → release ALL repo-locks acquired so far; release mission-lock; mission stays `configured` (per MEDIUM-4 rollback-all)
4. **Create wip-branch** in each cloned repo via `gitEngine.branch(wipBranchName)` + `gitEngine.checkout(wipBranchName)`
5. **Write first bundle** to snapshotRoot per §2.6.2; on failure → release everything (repo-locks + mission-lock); mission stays `configured`
6. **Spawn daemon-watcher (v3.2 fold per MEDIUM-R2.4 — REORDERED before state-yaml-persist for clean rollback):** `child_process.spawn('node', ['<sdk-path>/watcher.js', missionId], { detached: true, stdio: ['ignore', logFd, logFd] })` where `logFd` is `fs.openSync('<workspace>/missions/<id>/.daemon.log', 'a')` (per MEDIUM-R2.3 daemon log-path); daemon writes its pid + startTime (epoch-ms) to lockfile + extends TTL; daemon enters watch-loop (chokidar per §2.6.5 + debounce-window). On spawn-failure → rollback: release all locks + repo-locks; mission stays `configured` (YAML never advanced). Daemon-pid + startTime persisted for crash-detection (per HIGH-6) + pid-reuse mitigation (per round-2 ask 3 fold). **Bundle from Step 5 PRESERVED on rollback** as forensic-artifact (per round-2 ask 2 — bundle-rollback-discipline; bundle is durable; rollback only releases locks + workspace, not snapshot artifacts).
7. **Persist mission-state YAML** as `started` (atomic-write per MEDIUM-11) — only AFTER daemon proven-alive (Step 6 spawn confirmed). Single-atomic-write; no two-phase complexity.
8. **Release transition-pseudolock** (mission-lock RETAINED in lockfile with daemon-pid + startTime recorded; daemon holds advisory lock per HIGH-5; cooperative coordination with operator-CLI ops)
9. State = `started`

Lock-acquisition is the FIRST step; all rollback paths know whether the mission-lock has been acquired (always yes after step 1).
- Bundle-write is INSIDE the transition; if bundle-write fails, transition fails + rollback (mission stays `configured`)
- Closes window-of-vulnerability where disk-failure between `started`-entered and first-bundle-written has nothing to restore
- Scope-inline is BEFORE clone (Step 2 < Step 3); ensures snapshot is committed under mission-lock atomicity guarantee (v2.3 fold per MINOR-R3.1 — renumber commentary aligned with v2.2 8-step renumber per MINOR-R2.2)

**`startMission` entry-condition (v2.2 fold per MEDIUM-R2.5 — effective-repos gate; relaxed state-string requirement):**

`startMission(id)` accepts mission in `created` OR `configured` state IF effective-repos has ≥1 entry. **Effective-repos** = mission.repos[] UNION scope.repos[] (resolved live pre-start; deduplicated by name; conflict-resolution rejects on same-name-different-url-or-branch).

Rationale: state-string is mission-config-event-driven (transitions on explicit mission.repos mutations). When mission references EMPTY scope at create-time → state stays `created`. Operator later does `msn scope update <scope-id> repo-add Y` → scope.repos = [Y]; mission's effective-repos via hybrid resolution becomes [Y]. Mission state stays `created` (no mission-config event fired) but effective-repos is non-empty.

`startMission` checks effective-repos (truth-source) NOT state-string. Eliminates UX-friction of forcing operator to fire a mission-config event just to bump state for entry-gate satisfaction.

If effective-repos is empty (no mission.repos AND no scope OR empty-scope) → reject with `MissionStateError("startMission requires ≥1 effective repo; mission has 0 mission.repos AND 0 scope.repos. Add a repo via 'msn update <id> repo-add' OR add to referenced scope via 'msn scope update <scope-id> repo-add'")`.

**Effective-repos conflict-resolution validation timing (v2.3 fold per MEDIUM-R3.2 — option (a) validate-at-every-mutation; defense-in-depth; fails-fast):**

Conflict-resolution check fires at EVERY effective-repos mutation point (not just startMission). Trigger-points:

1. **`addRepoToMission(id, repo)`:** pre-write, if mission references scope-id, scan scope.repos for name-conflict with new repo → reject if same-name-different-url-or-branch with `MissionStateError("repo name conflict: <name> exists in scope <scope-id>; use --name <override> OR remove from scope first")`
2. **`addRepoToScope(id, repo)`:** pre-write, scan mission-configs (computed-on-demand reverse-index per MEDIUM-R1.2; non-terminal missions only) for missions referencing this scope; for each, check if mission.repos[] has name-conflict with new scope-repo → reject with `MissionStateError("repo name <name> conflicts in mission <msn-id>; remove from mission first")`
3. **`setMissionScope(id, scopeId)`:** pre-write, scan new-scope.repos for name-conflict with mission.repos[] → reject if conflict; operator's scope-id mutation refused
4. **`applyMission`/`createMission`:** zod-schema-level effective-repos conflict check on supplied config (mission.repos vs scope.repos if scope-id present)
5. **`startMission` Step 2 scope-inline:** redundant defense-in-depth check (catches anything missed by mutation-time validation; rare path under correct discipline)

**Operator recovery path on conflict-rejected mutation:**
- `msn update <mission-id> repo-remove <conflicting-name>` (resolve via mission-side)
- OR `msn scope update <scope-id> repo-remove <conflicting-name>` (resolve via scope-side)
- OR `msn update <mission-id> repo-add <url> --name <override>` (resolve via rename)
- OR `msn scope update <scope-id> repo-add <url> --name <override>` (resolve via rename on scope-side)

**Cross-validation lock-discipline (v2.4 fold per MEDIUM-R4.1 — asymmetric: strict for mission-side; optimistic for scope-side):**

- **`addRepoToMission` cross-validation (STRICT; acquires both locks per cross-resource lock-ordering):**
  1. Acquire mission-lock (per existing rule)
  2. If mission references scope-id → acquire scope-lock (cross-resource lock-ordering: mission → scope)
  3. Read scope.repos under scope-lock; validate name-conflict against new repo
  4. If conflict → release scope-lock; release mission-lock; reject with `MissionStateError("repo name conflict: <name> exists in scope <scope-id>; use --name <override> OR remove from scope first")`
  5. Else → atomic-write mission-config; release scope-lock; release mission-lock

- **`addRepoToScope` cross-validation (OPTIMISTIC; scope-lock only; mission-config read-only):**
  1. Acquire scope-lock (per existing rule)
  2. Scan mission-configs read-only (computed-on-demand reverse-index per MEDIUM-R1.2; non-terminal missions only); for each referencing mission, check if mission.repos[] has name-conflict with new scope-repo
  3. If conflict → release scope-lock; reject with `MissionStateError("repo name <name> conflicts in mission <msn-id>; remove from mission first")`
  4. Else → atomic-write scope-config; release scope-lock
  5. **Race-resolution:** mission-config scan is read-only without per-mission-lock acquisition (would violate cross-resource lock-ordering scope-after-mission). If concurrent `addRepoToMission` committed during scan → second-read at startMission Step 2 inline catches conflict + rejects (defense-in-depth per MEDIUM-R3.2 trigger-point 5)

- **`setMissionScope` cross-validation (STRICT; acquires both locks):**
  1. Acquire mission-lock
  2. If new scope-id non-null → acquire scope-lock (cross-resource ordering)
  3. Validate scope-existence + scan new-scope.repos for name-conflict with mission.repos[]
  4. If conflict → release locks; reject
  5. Else → atomic-write mission-config (canonical scp-<hash> per HIGH-4); release scope-lock; release mission-lock

**Asymmetry rationale:** mission-side mutations (addRepoToMission / setMissionScope) are CONSUMER-side (mission-config drives effective-repos at startMission); strict cross-validation worth the lock-pair cost. scope-side mutations (addRepoToScope) are TEMPLATE-side (multiple consumers; lock-fanout would be expensive); optimistic with race-resolution at startMission Step 2 inline.

Strict-1.0 commits the asymmetric lock-discipline; v1.x can adjust if scale-pressure on scope-side surfaces (e.g., cached-reverse-index materialization per MEDIUM-R1.2 v1.x evolution path).

**Idempotency contract for `startMission` (v1.2 fold per MEDIUM-5; v1.3 fold per MEDIUM-R2.2 extended for `{config}` form)**:
- `startMission(id)` on already-`started` mission → `MissionStateError` ("mission already started; use `applyMission` for additive changes; or `complete` then re-create for non-additive")
- `startMission({config})` semantics depend on `config.mission.id`:
  - if `config.mission.id` NOT present in workspace → scaffold config at `<workspace>/config/<id>.yaml` + acquire mission-lock + clone repos + transition to `started` (single-call create+configure+start; OIS adapter integration shape)
  - if `config.mission.id` present BUT mission state is `configured` (not yet started) → start the existing mission (transition `configured → started`)
  - if `config.mission.id` present AND mission is already `started`/`in-progress` → `MissionStateError` ("mission already exists + started; use `applyMission` for additive changes; or `startMission(id)` to start a `configured` mission")

**Case-1 (id-not-present) partial-failure rollback boundary (v1.4 fold per MEDIUM-R3.4 — preserve-config model):**

Case-1 is multi-step: name-uniqueness check → scaffold YAML → acquire mission-lock → clone repos → bundle-write → state=started. Step-ordering + rollback boundary:

1. **Name-uniqueness check FIRST** (per MEDIUM-R3.3 symlink mechanism) — name-collision rejected BEFORE any disk-state-write; no rollback needed
2. **Scaffold `<workspace>/config/<id>.yaml`** + name-symlink (atomic-write per MEDIUM-11; symlink per MEDIUM-R3.3)
3. **Acquire mission-lock** (waitMs=0; per MEDIUM-R2.8 step 1) — on failure → `LockTimeoutError`; **PRESERVE config + symlink** (mission ends in `configured` state; operator retries via `startMission(id)`); rollback boundary = "post-config-scaffold partial-failure preserves config"
4. Steps 4-7 per MEDIUM-R2.8 (per-repo clone + locks + wip-branch + bundle-write + state-transition); each rollback path **PRESERVES config + symlink** — mission ends in `configured` state on any step-4+ failure (v1.5 fold per MEDIUM-R4.10 explicit-scope clarification):
   - Step 4 (per-repo clone-or-acquire-locks) failure → release any acquired repo-locks; release mission-lock; **config + symlink PRESERVED**; mission stays `configured`
   - Step 5 (wip-branch creation) failure → undo cloned-repo workspace-allocation; release locks; **config + symlink PRESERVED**
   - Step 6 (bundle-write to snapshotRoot) failure → undo wip-branch + clones + locks; **config + symlink PRESERVED**
   - Step 7 (mission-state-yaml persist as `started`) failure → undo bundle + wip-branch + clones + locks; **config + symlink PRESERVED** (state-yaml stays at `configured`)

Rollback model: **(a) preserve-config** (operator's config-input not lost; case-1 decomposes to "create succeeded; start retryable"). Avoids leaking partial state under concurrent retry. Invariant: case-1 partial-failure NEVER deletes scaffold + symlink; only `complete --purge-config` / `abandon --purge-config` removes them.

**Orphan-config operator workflow (v1.5 fold per MINOR-R4.1):** preserve-config model creates orphan-config surface (configs that exist in `configured` state but never started; e.g., from case-1 rollback). v1 operator-flow uses existing primitives — NO separate `--cleanup-orphans` workflow needed:
- `msn list --status configured` shows all configured-but-not-started missions
- Orphan-suspicion heuristic: `MissionState.createdAt > 24h` AND no recent activity (per `msn show <id>` last-modified-time)
- `msn abandon <id> --purge-config` releases name-symlink + config for reuse
- Bounded operator-surface per Q5=b; v1.x can add `--cleanup-orphans` convenience-wrapper if demand surfaces.
- NOT idempotent at v1 (operator-intent ambiguous on repeat-start; safer to make explicit)
- `applyMission(id, config)` is the idempotent re-shape primitive

**SDK-side zod-validate at API entry-points (v1.3 fold per MEDIUM-R2.3)**:
- `startMission({config})` zod-parses `config` against `MissionConfigSchema` at entry; rejects with `ConfigValidationError` on parse-fail
- `applyMission({id, config})` zod-parses `config` at entry
- Defense-in-depth: TypeScript types are erasable at runtime; `as MissionConfig` cast can pass invalid data through. SDK boundary validates regardless of caller-source.
- Same zod schema reused for YAML hydration (CLI path; per MEDIUM-11 atomic-write discipline) + object validation (SDK direct path; this fold). Single canonical schema; no divergence risk.
- Composes with adapter pattern (per §2.4 OIS adapter): adapter zod-parses Hub-delivered payload; SDK zod-parses again at entry — defense-in-depth not redundancy.

**`applyMission` on non-existent id (v1.2 fold per MEDIUM-6)**:
- `applyMission({id, config})` where mission doesn't exist → `MissionStateError` ("mission not found; use `createMission` first")
- Composes with refinement #3 boundary: `apply` is for ADD-to-existing (or upsert against existing-id); `create` is for SCAFFOLD-NEW
- For Hub→adapter integration: adapter checks via `getMission(id)` first OR catches `MissionStateError` + falls back to `createMission` + `applyMission`

**`applyMission` state-dependent semantics (v1.4 fold per MEDIUM-R3.10):**

`applyMission` behavior depends on current mission state:
- **`created` / `configured` (pre-start):** **FULL UPSERT allowed** — non-additive changes (repo-remove, pluggable change, etc.) are SAFE because no workspace has been realized yet; nothing to roll back. Mission stays in `created`/`configured` state post-apply. Operator can use `applyMission` as the upsert primitive pre-start (alternative to `addRepoToMission` + `removeRepoFromMission` SDK calls).
- **`started` / `in-progress` (post-start):** **ADDITIVE-ONLY** (per refinement #3 atomicity boundary) — non-additive mutations error with `MissionStateError("non-additive mutation on started mission; complete + re-create required")`; additive mutations (repo-add only) clone-or-fail with rollback per MEDIUM-R2.8.
- **`completed` / `abandoned` (terminal):** **ERROR** — `MissionStateError("apply on terminal mission")`.

**`applyMission` mission-lock requirement (v1.5 fold per MEDIUM-R4.7):** `applyMission` MUST acquire mission-lock for the FULL apply duration in ALL states (pre-start + post-start). Pre-start lock guards against lost-update race (concurrent applyMission on `configured` mission where both operators read pre-mutation config + write conflicting mutations). Post-start lock guards against concurrent additive-apply (per MEDIUM-3 fold). Single concurrency-discipline applies uniformly across applyMission state-dependent semantics.

**`applyMission` scope-id mutation lock-acquisition (v2.2 fold per MEDIUM-R2.2 — asymmetric model option (c)):**

When `applyMission`'s new config has different `mission.scope-id` than current config:
1. Acquire mission-lock unconditionally (per existing rule)
2. **If scope-id mutated to non-null value:** acquire scope-lock (cross-resource lock-ordering: mission → scope per §2.4 rule)
3. Resolve scope-id (id-form vs name-form per MEDIUM-R1.7 prefix-detection)
4. Verify `<workspace>/scopes/<resolved-id>.yaml` exists via fs.access; if missing → `MissionStateError("scope-id <X> does not exist; create scope first")`; release locks
5. Persist canonical scp-<hash> (not name) in mission-config (per HIGH-4 canonical-id-persistence)
6. Release scope-lock
7. Atomic-write mission-config; release mission-lock

Asymmetric vs `setMissionScope`: `applyMission` is full-config-upsert (multi-field; expensive operation; worth scope-lock cost for stronger consistency); `setMissionScope` is field-targeted (cheap; optimistic-concurrency via fs.access suffices per MEDIUM-R1.5). Spec'd asymmetry intentional — different operation-cost tiers warrant different concurrency-discipline tiers.

**`applyMission` id-vs-`config.mission.id` mismatch (v1.5 fold per MEDIUM-R4.6):** SDK signature accepts both an `id` parameter AND `config` (which embeds its own `mission.id`). Mismatch → `ConfigValidationError("id parameter does not match config.mission.id")` (option (a) error; fail-fast on operator-input-error; safer than silently picking one over the other). Validated at SDK entry-point alongside zod-validate-at-entry (per MEDIUM-R2.3).

State transitions table extension:
- `created`/`configured` × `apply -f <path>` → `configured` (full upsert; non-additive allowed)
- `started`/`in-progress` × `apply -f <path>` (additive only) → existing post-start additive-apply behavior

**Per-field update state-restriction matrix (v3.1 fold per HIGH-3 — generic-verb mutation dispatch; `update<T>` + `MissionMutation` discriminated-union):**

Each `MissionMutation.kind` value has its own state-restriction. Terminal states (`completed`/`abandoned`) → most field updates ERROR (terminal immutable per existing §2.4.1 invariant; `set-hub-id` allowed in terminal for forensic Hub-rename record).

| MissionMutation.kind (CLI: `msn update <id> <kind>`) | created | configured | started | in-progress | completed | abandoned |
|---|---|---|---|---|---|---|
| `add-repo` | ✓ full upsert | ✓ full upsert | ✓ additive only | ✓ additive only | ✗ error | ✗ error |
| `remove-repo` | ✓ | ✓ | ✗ error | ✗ error | ✗ error | ✗ error |
| `rename` | ✓ | ✓ | ✓ | ✓ | ✗ error | ✗ error |
| `set-description` | ✓ | ✓ | ✓ | ✓ | ✗ error | ✗ error |
| `set-hub-id` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `set-scope` | ✓ | ✓ | ✗ error | ✗ error | ✗ error | ✗ error |
| `set-tag` | ✓ | ✓ | ✓ | ✓ | ✗ error | ✗ error |
| `remove-tag` | ✓ | ✓ | ✓ | ✓ | ✗ error | ✗ error |

**Rationale per row:**
- `add-repo` / `remove-repo`: per refinement #3 atomicity — pre-start full upsert; post-start additive-only (add-repo); remove-repo rejected post-start
- `rename`: any pre-terminal state (just symlink-update; no semantic state change)
- `set-description`: any pre-terminal state (informational metadata)
- `set-hub-id`: ANY state including terminal (informational-only at v1; Hub-rename can update post-mission-completion for forensic record)
- `set-scope`: pre-start ONLY — post-start, scope.repos already inlined (snapshot per §2.4.2 hybrid resolution); changing scope-id wouldn't have effect
- `set-tag` / `remove-tag`: any pre-terminal state (cross-system correlation can update mid-mission)

**Type-system + runtime composition (v3.1 fold per MEDIUM-R1.6):** `MissionMutation` discriminated-union commits the mutation-shape at type-level; runtime per-state-restriction validation per this matrix; SDK throws `MissionStateError("update <kind> not allowed on <state> mission")` on state-violation. Type-system ensures shape-correctness (e.g., can't pass scope-mutation as mission-mutation); runtime ensures state-correctness (e.g., can't `remove-repo` post-start). Defense-in-depth per MEDIUM-R2.3 zod-validate-at-entry pattern.

CLI dispatcher reads this matrix; SDK `update<'mission'>` enforces same restrictions internally. Same pattern applies to `ScopeMutation` (no state-restrictions at scope-level since scope has 2-state lifecycle; only `deleted` blocks mutations).

**Atomic PR-set publish-flow step-sequence (v3.1 fold per MEDIUM-R1.1 + MEDIUM-R1.2 + MEDIUM-R1.9 — `complete` heavy publish-flow):**

`complete(missionId, message, opts?)` step-sequence under existing mission-lock + daemon-watcher signaled to flush + die:

**Message immutability (v3.2 fold per MEDIUM-R2.6):** at FIRST `complete` invocation, `mission.publishMessage` field is persisted to mission-config (atomic-write); becomes immutable post-write. Idempotent retry uses persisted `publishMessage`; new message-arg supplied by retry-invocation is IGNORED with operator-warning logged: `"NOTE: complete already initiated for <id> with message '<original>'; retry uses original message; new message arg ignored. To use a different message, abandon + re-create mission."`. Strict-1.0 commits message-immutability-post-first-complete invariant. This ensures homogeneous PR titles across mission's PR-set (per round-2 ask original-message-preserved option (a)).

1. **Trigger daemon flush via lockfile-state-watch (v3.2 fold per MEDIUM-R2.1 — distinct from Step 4 SIGTERM):** CLI sets `pendingFlushBeforeComplete: true` JSON field in lockfile; daemon detects via lockfile-mtime-watch + flushes pending debounce-buffer + commits to wip-branch + clears `pendingFlushBeforeComplete` field; CLI polls daemon-acknowledgment (timeout 30s; on timeout → fallback to SIGTERM). Daemon STAYS ALIVE during Step 2 (publish-loop) for partial-failure retry without daemon-respawn cost.
2. **Per-repo publish-loop** (atomic across mission's repos; preserves partial state via `mission.publishStatus[<repoName>]` per MEDIUM-R1.9 schema):
   For each `repo` in mission.repos[] where `publishStatus[repo.name] !== 'pr-opened'`:
   - **Skip if no wip-commits beyond start-branch creation** → mark `publishStatus[repo.name] = 'pr-opened'` (no-changes; nothing to publish; cleanup local branch); log `[no changes in <repo>]`
   - **Squash wip-commits** (per `defaults.complete-strategy: squash` operator-config; default squash; opt-in `preserve-history` keeps N commits): **dispatch via `gitEngine.squashCommit(workspace, baseRef, headRef, publishMessage)`** (v3.3 fold per HIGH-R3.1 — pluggable-abstraction discipline). **Dispatch chain handles BOTH method-undefined AND throws-on-invocation cases** (v3.4 fold per MEDIUM-R4.3):
     ```typescript
     async function squashViaEngineOrFallback(workspace, baseRef, headRef, message) {
       if (typeof gitEngine.squashCommit === 'function') {
         try {
           return await gitEngine.squashCommit(workspace, baseRef, headRef, message);
         } catch (err) {
           if (err instanceof UnsupportedOperationError) {
             // Fall through to engine-internal fallback
           } else {
             throw err;
           }
         }
       }
       // Engine-internal fallback shell-out
       return await internalSquashShellOut(workspace, baseRef, headRef, message);
     }
     ```
     Handles all 3rd-party engine variations: didn't implement at all (method undefined); implemented as no-op-throws (UnsupportedOperationError); implemented properly (returns commit-sha). Engine-internal fallback shells out to `git merge --squash` + `git commit -m <message>` per MINOR-R4.1 default impl mechanism. Mark `publishStatus[repo.name] = 'squashed'`.
   - **Push** `mission/<id>` to remote (fast-forward push; no force). On push-failure (network/auth) → mark status `'failed'`; mission stays `in-progress`; engineer retries `msn complete`; engine resumes from this repo. On base-diverged (non-fast-forward push rejection) → reject with `MissionStateError("base diverged for <repo>; mission cannot complete cleanly; abandon and create new mission off updated base")`. Mark `publishStatus[repo.name] = 'pushed'`.
   - **Open PR** via `RemoteProvider.openPullRequest({head: 'mission/<id>', base: <RepoSpec.base>, title: <message>, body: <auto-generated>})`. Capability-gated: `RemoteProvider.capabilities.supportsPullRequests = false` → SKIP PR-creation (push-only); log `[push-only; no PR for <repo>]`; mark `publishStatus[repo.name] = 'pr-opened'` regardless. PR-creation failure (gh-cli auth expired, etc.) → mark status `'failed'`; mission stays `in-progress`; partial-success preserved. Mark `publishStatus[repo.name] = 'pr-opened'`.
3. **Persist `lifecycle-state: completed` to config + finalize `publishStatus`** via RMW under mission-lock (atomic-write per MEDIUM-11). Returns `MissionState.publishedPRs[]: { repoName, prUrl }[]` to operator.
4. **Terminate daemon-watcher via SIGTERM (v3.2 fold per MEDIUM-R2.1 — distinct from Step 1 flush + per MEDIUM-R2.2 timeout):** `process.kill(daemonPid, 'SIGTERM')`; daemon's signal-handler does graceful-shutdown (final cleanup + lockfile release + exit). **Shutdown timeout:** CLI waits up to `MSN_DAEMON_SHUTDOWN_TIMEOUT_MS` (default 60s; configurable via env-var); polls `process.kill(pid, 0)` for daemon-death detection. **Force-kill fallback:** on timeout → `process.kill(daemonPid, 'SIGKILL')` + emit `MissionStateError("daemon-shutdown timeout; mission may have unflushed edits; manual recovery via msn tick <id> on next start; force-kill leaves stale lockfile-pid; engine auto-detects + cleans up on next CLI invocation per HIGH-6 immediate dead-pid detection")`.
5. **Release mission-lock + repo-locks** via StorageProvider.
6. **Cleanup local mission-branches** in each repo workspace (delete local branch; remote branch persists for PR-merge).
7. **Destroy runtime workspace** at `<workspace>/missions/<id>/` (per `--retain` not set).
8. **(if `--purge-config`)** Delete `<id>.yaml` + `.names/<slug>.yaml` symlink (atomic).

**Idempotent retry semantics:** if `complete` fails partway (e.g., 3 of 5 PRs opened then push-fails on repo-4), `mission.publishStatus[<repo-4>] = 'failed'` + earlier repos remain `'pr-opened'`. On retry `msn complete <id> "<msg>"`: engine reads publishStatus; resumes from first non-`'pr-opened'` repo; respects already-opened-PRs (queries `gh pr view` to confirm idempotent — no double-open).

**`abandon` step-sequence (v3.4 fold per MEDIUM-R4.1 — symmetric partial-failure recovery model with publish-flow):**

`abandon(missionId, message, opts?)` step-sequence under existing mission-lock; persists per-step progress via `mission.abandonProgress` field for idempotent retry. **v3.5 fold per MEDIUM-R5.1:** lifecycle-state `'abandoned'` advances ATOMICALLY at terminal Step 8 (NOT Step 3); mission stays `'in-progress'` throughout cleanup-flow per symmetric discipline with publish-flow (publishStatus tracks partial-state until ALL repos `'pr-opened'`; lifecycle-state advances to `'completed'` ONCE atomically after final cleanup succeeds). **v3.5 fold per MEDIUM-R5.2:** Step 5 per-repo cleanup tracked via NEW `mission.abandonRepoStatus: Record<string, 'pending' | 'cleaned' | 'failed'>` field — symmetric with publishStatus discipline; granular operator-visibility into per-repo cleanup state.

abandonProgress field values: `'tick-fired' | 'daemon-killed' | 'message-persisted' | 'locks-released' | 'branches-cleaned' | 'workspace-handled' | 'config-purged'` (v3.5 fold renamed Step 3 progress-marker to `'message-persisted'`; v3.6 fold per MINOR-R6.2 renamed Step 6 progress-marker `'workspace-destroyed'` → `'workspace-handled'` for `--retain`-aware semantic — Step 6 marks completion regardless of whether workspace was destroyed (default) OR preserved (--retain)).

1. **Final cadence-tick** (daemon-flush via lockfile-state-watch; same as publish-flow Step 1 but no publish-message persisted; tick captures pre-abandon state for forensic-history). Mark `abandonProgress = 'tick-fired'`.
2. **Terminate daemon-watcher via SIGTERM** (per MEDIUM-R2.1 distinct event); 60s timeout + SIGKILL fallback per MEDIUM-R2.2. Mark `abandonProgress = 'daemon-killed'`. **v3.5 fold per MINOR-R5.2:** at Step 2 entry, set `lockfile.abandonInProgress = true` (transient flag); cleared at Step 4 lock-release (when lockfile is deleted).
3. **Persist `abandonMessage` ONLY** to config via RMW under mission-lock (atomic-write per MEDIUM-11); **lifecycle-state STAYS `'in-progress'`** (v3.5 fold per MEDIUM-R5.1 — was `lifecycle-state: abandoned` advance at Step 3 in v3.4; reverted because it created idempotent-retry contradiction with terminal-immutability rule at state-machine table). abandonMessage immutable post-write per v3.3 fold. Mark `abandonProgress = 'message-persisted'`.
4. **Release mission-lock + repo-locks** via StorageProvider. Mark `abandonProgress = 'locks-released'`. (lockfile deleted; abandonInProgress flag implicitly cleared.) **v3.6 fold per MEDIUM-R6.1 — post-Step-4 dispatch signal handoff:** lockfile-based `abandonInProgress` flag covers Steps 2-4 window only; for Steps 5-8 window (post-lock-release), concurrent-CLI dispatch logic checks **mission-config `abandonProgress`** field as the in-flight signal (see post-Step-4 dispatch logic spec below + §2.6.5 dead-pid detection 6-step).
5. **Cleanup local mission-branches** in each repo workspace (delete local branch; NO push; NO remote-branch creation; NO PR-open). **v3.5 fold per MEDIUM-R5.2 — per-repo state tracking:** for each repo, attempt cleanup; on success mark `abandonRepoStatus[repoName] = 'cleaned'`; on per-repo failure mark `abandonRepoStatus[repoName] = 'failed'` and continue (NOT abort); mission-state stays `'in-progress'`. abandonProgress advances to `'branches-cleaned'` ONLY when ALL repos = `'cleaned'`; if any repo = `'failed'`, abandonProgress stays at prior value (`'locks-released'`) and idempotent retry re-attempts only repos with `'failed'` or `'pending'` status. Operator-visible granular partial-state via `getMission(id).abandonRepoStatus`.
6. **Handle runtime workspace** (v3.6 fold per MINOR-R6.2 renamed from "Destroy"; semantic: destroy if `--retain` NOT set; preserve if `--retain` set). **v3.6 fold per MINOR-R6.1 — atomic single-lock-cycle (option b — integrate into Step 6/7 transaction):** re-acquire mission-lock briefly; perform workspace handling (destroy at `<workspace>/missions/<id>/` OR preserve per `--retain`); **AND atomic-write `lifecycle-state: 'abandoned'` + `abandonProgress = 'workspace-handled'` to mission-config under SAME lock-cycle**; release lock. Mission is now terminal (atomic write of lifecycle-state advances to `'abandoned'`).
7. **(if `--purge-config`)** Re-acquire mission-lock briefly; delete `<id>.yaml` + `.names/<slug>.yaml` symlink (atomic); release lock. Mark `abandonProgress = 'config-purged'` transient. (Lifecycle-state already advanced at Step 6; Step 7 deletes the config artifact entirely; mission no longer queryable post-Step-7.)
8. **Marker step (v3.6 fold per MINOR-R6.1 — lifecycle-advance integrated into Step 6/7):** Step 8 is now a marker step only — lifecycle-state was atomically advanced at Step 6 (single-lock-cycle integration); no separate Step 8 lock-acquisition needed. Eliminates race-window between Step 7 release-lock and Step 8 re-acquire-lock; matches existing single-lock-cycle invariant per MINOR-R4.3 (cadence-tick under existing lock).

**v3.6 fold per MEDIUM-R6.1 — concurrent-CLI dispatch logic for missions in abandon-flow Steps 5-8 (post-lock-release):**

Mission-config-based `abandonProgress` field is the durable in-flight signal that survives lockfile-delete (Step 4). Combined with `lockfile.abandonInProgress` (Steps 2-4 window), full coverage achieved across all abandon-flow steps:

```typescript
// CLI dispatch preflight for missions with lifecycle-state === 'in-progress':
const missionConfig = await loadMissionConfig(missionId);
if (missionConfig.mission.lifecycleState === 'in-progress' &&
    missionConfig.mission.abandonProgress !== undefined) {
  // Mission is in abandon-flow Steps 2-7 (Steps 2-4 also detected via lockfile.abandonInProgress;
  // Steps 5-7 detected only via this mission-config check)
  if (currentVerb === 'abandon') {
    return resumeAbandonFlow(missionConfig);  // idempotent retry
  } else if (isReadOnlyOp(currentVerb)) {
    // 'show', 'list', 'workspace' — allowed; report current abandonProgress + abandonRepoStatus
    return executeReadOnly(missionConfig);
  } else {
    // mutating ops ('update', 'complete', 'apply') — rejected
    throw new MissionStateError(
      `mission ${missionId} in abandon-flow at step '${missionConfig.mission.abandonProgress}'; ` +
      `concurrent operation rejected; retry 'msn abandon ${missionId} "<msg>"' to resume cleanup OR wait for terminal state`
    );
  }
}
```

Composability with HIGH-R3.1 dead-pid detection: post-Step-4 lockfile is absent (no daemon-pid; no abandonInProgress flag); CLI sees mission-config has `lifecycle-state: 'in-progress'` + `abandonProgress: 'locks-released'`/`'branches-cleaned'` → recognized as abandon-flow-in-flight → daemon-respawn SKIPPED. Closes the post-Step-4 race surface where engine ongoing-cleanup-steps would conflict with respawned daemon.

**Idempotent retry semantics:** if `abandon` fails partway, mission stays `'in-progress'` with `abandonProgress` reflecting where it failed; abandonMessage already persisted if reaching Step 4+ (Step 3 succeeded). On retry `msn abandon <id> "<msg>"`: engine reads abandonProgress + abandonRepoStatus; resumes from failed step; new message-arg IGNORED with operator-warning per v3.3 abandonMessage immutability. Final state advances to `'abandoned'` ATOMICALLY at Step 6 (v3.6 fold per MINOR-R6.1 — was Step 8 in v3.5; integrated into Step 6 single-lock-cycle). **Composability with terminal-immutability rule (state-machine table):** mission stays `'in-progress'` throughout abandon-flow Steps 1-5 → idempotent-retry never hits `MissionStateError("Terminal states are immutable")` because lifecycle-state never advances mid-flow → discipline closes the v3.4 contradiction.

**Distinction from complete partial-failure:** publish-flow has per-repo state (publishStatus) AND atomic terminal lifecycle-advance; abandon-flow now matches BOTH disciplines (abandonRepoStatus per-repo + atomic Step 6 lifecycle-advance, integrated v3.6) per v3.5+v3.6 fold. Both flows use same forensic-history persistence discipline + same atomic-terminal-advance discipline + same single-lock-cycle invariant.

**Mission-id derivation (v1.2 fold per MEDIUM-1)**:
- `msn-<8-char-hash>` where hash is `crypto.randomBytes(4).toString('hex')` (Node primitive; pure-random; 16^8 ≈ 4.3B space)
- On collision (existing-id check): regenerate-with-retry (cap 3 attempts; cap-exceeded → `StorageAllocationError` "id-generation collision")
- Birthday-collision threshold ~65k missions; cap-3-retries gives ~10^-30 effective collision probability at sane mission-counts
- Operator-supplied `--name <slug>` is independent — slug-format `[a-z0-9][a-z0-9-]{1,62}` (DNS-style); slug must NOT match any reserved verb (see §2.3.2 reserved-words list)

#### §2.4.1.v4 Multi-participant state machine extensions (v4.0 NEW + v4.4 substrate-fixes; INLINE-FLATTEN of §2.10.10 anchor-prose)

**Reader-side state machine (v4.0 NEW per idea-265 multi-participant; v4.4 fold per MEDIUM-R1.8 inline-flatten):**

Reader-side state machine is parallel to writer-side but distinct (per HIGH-R1.2 partition-spec — each principal holds own per-principal config with own `lifecycle-state` field):

```
joined ──[7-step msn-join transition]──> reading ──[writer-terminated coord-tag detected]──> readonly-completed (terminal; preserves last-synced state)
                                            │
                                            └──[msn-leave operator-action]──> leaving ──[7-step msn-leave transition]──> (workspace removed if --purge-workspace; else preserved for forensic-history)
```

**7-step `joined → reading` transition (reader-side; spawned via `msn join <id> --coord-remote <url> [--principal <id>]`):**

1. **Validate authorization**: read coord-remote at `<coord-remote>/refs/heads/config/<id>` (mission-config branch); verify `participants[]` contains current-principal (per §2.3.1 precedence-chain) with `role: reader`. Reject with `MissionStateError("not authorized as reader for mission <id>; ask writer to add participant via msn update <id> add-participant <principal> reader first")` if not. v4.4 substrate-mechanism: writer pushes mission-config to coord-remote on participant-add per §2.6.5.v4 immediate-push backfill; reader's `msn join` reads it from there.
2. **Allocate reader's per-principal workspace** at `<reader-workspace-root>/missions/<id>/` (reader-workspace-root resolved per §2.3.1 current-principal precedence chain Step 5 → §2.4 OperatorConfigSchema `workspace-root-by-principal[<current-principal>]`).
3. **Initialize mission-config from coord-remote**: `git fetch <coord-remote> 'refs/heads/config/<id>:refs/remotes/coord/config/<id>'` + extract mission-config blob from fetched-tree to `<reader-workspace>/config/<id>.yaml` (per HIGH-R1.2 partition-spec — config is per-principal). Subsequent config-changes propagate via coord-remote tag-event `refs/tags/missioncraft/<id>/config-update` (per MINOR-R1.3 tag-namespace; v4.5 fold per MINOR-R6.2 — writer pushes mission-config to dedicated `refs/heads/config/<id>` branch on every mutation; tag fires same commit; reader fetches branch + tag together).
3.5. **Atomic-write `lifecycle-state: joined`** to per-principal `<reader-workspace>/config/<id>.yaml` (v4.5 fold per MEDIUM-R6.3 — parallel-discipline with writer-side `'started'` transient state per v3.6 §2.4.1 9-step transition Step 7; captures in-flight state for crash-recovery; if reader-side `msn join` crashes mid-transition Steps 4-7, on-disk state shows `'joined'` so subsequent recovery via `msn join` retry knows it's mid-flow).
4. **Clone per-repo workspaces from coord-remote** (per MEDIUM-R2.3 substrate-fix):
   ```bash
   git clone --branch '<repo-name>/wip/<id>' '<coord-remote-url>' '<reader-workspace>/missions/<id>/<repo-name>'
   ```
   Post-clone: set filesystem-mode `0444` recursively (engine-controlled; preserves strict-enforce per scope-item #2 + F-V4.3 hard-error).
5. **Acquire reader-side mission-lock** at `<reader-workspace>/locks/missions/<id>.<principal>.lock` (per HIGH-R1.3 per-principal lockfile naming).
6. **Spawn detached reader-daemon-watcher** (per §2.6.5.v4 reader-mode 2-loop spec — Loop A chokidar fs-watch + Loop B Node setInterval timer-poll); daemon writes pid + reader-mode flag + startTime to lockfile.
7. **Persist mission-state-yaml as `lifecycle-state: reading`** (atomic-write per MEDIUM-11) — reader-side lifecycle-state distinct from writer-side `started`/`in-progress`. Per HIGH-R2.3 + M-R3.2 zod superRefine role-based state-validation: reader-side config rejects writer-side enum-values + vice versa (engine determines config's owning-principal from file-path mapping per HIGH-R1.2 partition-spec).

**State-machine cascade-mechanism (v4.4 fold per HIGH-R2.3):** reader-daemon's coord-poll Loop B detects writer-pushed `refs/tags/missioncraft/<id>/terminated` tag → fires reader-side state-transition `reading → readonly-completed` engine-internally. No operator-action required. Reader-daemon enters quiescent mode (no further fetches; lockfile preserved with `terminated-at` timestamp). Operator can then `msn leave <id>` to fully clean-up reader-side workspace.

**`leaving → terminal` transition (`msn leave <id> [--purge-workspace]`):** symmetric with abandon-flow; SIGTERM reader-daemon; release reader's lockfile; preserve workspace by default for forensic-history (operator can re-`msn join` to resume); `--purge-workspace` removes workspace entirely.

**Per-field state-restriction matrix extension (v4.4 fold per MEDIUM-R1.5):** 3 NEW MissionMutation rows added to existing matrix (per §2.3.1 SDK MissionMutation discriminated-union v4.0 extension). Per F-V4.6 lock-discipline: all under mission-lock; `add-participant` reader triggers immediate wip-push backfill via writer-daemon config-mtime-watch (per §2.6.5.v4 + MEDIUM-R2.4):

| MissionMutation.kind | created | configured | started | in-progress | completed | abandoned | reading (reader-side) |
|---|---|---|---|---|---|---|---|
| `add-participant` | ✓ (writer-side) | ✓ | ✓ | ✓ | ERROR | ERROR | ERROR (reader can't mutate participants[]) |
| `remove-participant` | ✓ | ✓ | ✓ | ✓ | ERROR | ERROR | ERROR |
| `set-coordination-remote` | ✓ | ✓ | ERROR (post-start change orphans readers) | ERROR | ERROR | ERROR | ERROR |

Reader-side state-restriction: ALL mutations ERROR (reader is read-only per scope-item #4); CLI `msn update <id> ...` rejected when invoked by reader-principal with `MissionStateError("read-only participant; mutation rejected")`.

### §2.4.2 Scope state machine + lifecycle (NEW v2.0 — multi-mission composition primitive per Refinement C)

Scope is a NEW first-class resource at v2.0 — a reusable repo-collection template that multiple missions reference via `--scope <id>`. Scope's lifecycle is simpler than Mission's (scopes are templates, not active resources; no `started`/`in-progress` state).

**Scope state machine (2 states; NOT 6 like Mission):**

```
created ──[update-events ...]──> created (self-loop on update)
   │
   └─[delete (cascade-protected)]─> deleted (terminal; config + symlink removed atomically; no `--retain-config` flag at v1 — scopes are templates with no forensic-value to retain post-delete; v2.1 fold per HIGH-5 dropped earlier mention)
```

**State transitions:**

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `msn scope create` | `created` | Config scaffold at `<workspace>/scopes/<scope-id>.yaml`; auto-generates `scp-<8-char-hash>` |
| `created` | `msn scope update <id> repo-add` | `created` | Self-loop; mutates scope.repos; updates updated-at timestamp; propagates to NOT-YET-STARTED missions per hybrid resolution |
| `created` | `msn scope update <id> repo-remove` | `created` | Self-loop |
| `created` | `msn scope update <id> name <new-name>` | `created` | Self-loop; symlink-rename flow per §2.4 |
| `created` | `msn scope update <id> description <text>` | `created` | Self-loop |
| `created` | `msn scope delete <id>` | `deleted` | Terminal; cascade-protected (rejects if any non-terminal mission references this scope) |

**Scope is mutable until deleted** — unlike missions which transition through immutable lifecycle states, scopes accept update-events as long as they exist. No `started` state because scopes don't have runtime workspaces.

**Scope-id derivation:** `scp-<8-char-hash>` via `crypto.randomBytes(4).toString('hex')` (parallel to msn-id mechanism per §2.4 MEDIUM-1). Collision-detection regenerate-with-retry-cap-3.

**Scope-name uniqueness invariant** (parallel to mission-name): `msn scope create --name <slug>` MUST reject if existing scope-config has same name. Race-resolution via POSIX `O_EXCL` symlink at `<workspace>/scopes/.names/<slug>.yaml` (mirrors §2.4 mission-name mechanism). Concurrent races between scope-create + mission-create with same slug DO NOT collide — separate namespaces (`<workspace>/config/.names/` for missions vs `<workspace>/scopes/.names/` for scopes).

**Hybrid resolution model (option (c) per Director-approved 2026-05-09-late):**

When mission references scope via `mission.scope-id: <scope-id>`:

- **Pre-start (mission state ∈ {`created`, `configured`}):** scope-reference is LIVE. `getMission(id)` returns repos from current scope state. Updates to scope (`addRepoToScope` / `removeRepoFromScope` / etc.) propagate immediately to mission.repos view.
- **At `startMission` (transition `configured → started`):** engine **INLINES** scope.repos into mission-config snapshot — copies current scope.repos into mission-config.repos (atomic-write per MEDIUM-11 within mission-lock per §2.4.1 7-step). Subsequent scope updates DO NOT propagate to this started mission.
- **Post-start (mission state ∈ {`started`, `in-progress`, `completed`, `abandoned`}):** mission.repos is the inlined snapshot; scope-id field stays as informational reference.

K8s-ConfigMap analog: ConfigMap mounted into Pod is snapshot-on-Pod-creation; subsequent ConfigMap updates only propagate on Pod-recreate. Same semantic for missioncraft scope.

**Cascade-protection invariant (scope-delete):**

`deleteScope(id)` rejects with `MissionStateError("scope referenced by N non-terminal missions: <msn-id-1>, <msn-id-2>, ... [+M more]; update mission scope-ids OR delete missions first")` if any mission state ∈ {`created`, `configured`, `started`, `in-progress`} has `mission.scope-id === <id>`. **v2.1 fold per MINOR-R1.1:** error message includes first-5 mission-ids; with `+N more` suffix if >5 missions blocking. Terminal missions (`completed`/`abandoned`) DON'T block — they've inlined scope.repos as snapshot; the scope-id field is informational-only post-start.

**Cascade-protection atomicity (v2.1 fold per HIGH-2 — race-resolution model (c) + scope-lock-held-during-scan-and-delete):**

`deleteScope` execution protocol:
1. Acquire scope-lock (`acquireScopeLock(scopeId, { waitMs: 0 })`); on failure → `LockTimeoutError`
2. **Scan mission-configs UNDER scope-lock** — engine reads `<workspace>/config/*.yaml` filtering on `mission.scope-id === <scopeId>` AND state ∈ non-terminal
3. If any non-terminal mission references → reject with `MissionStateError(...)`; release scope-lock; scope preserved
4. Else → delete scope-config + symlink atomic (single transaction); release scope-lock

Concurrent-`setMissionScope` race-resolution: `setMissionScope` does NOT acquire scope-lock (single-resource — only mission-lock per cross-resource lock-ordering rule). Under mission-lock, `setMissionScope` re-validates scope-existence via `fs.access(<workspace>/scopes/<resolved-scope-id>.yaml)` BEFORE persistence (optimistic concurrency model (c)):

- T0: `deleteScope('scp-foo')`. Acquires scope-lock. Scans missions → none reference. Proceeds to delete.
- T1: `setMissionScope('msn-bar', 'scp-foo')`. Acquires mission-lock. Validates `<workspace>/scopes/scp-foo.yaml` existence-check.
  - If `setMissionScope` validation runs BEFORE `deleteScope` deletes scope-config → setMissionScope succeeds; mission-bar references scope-foo. But cascade-protection should have caught this... wait, T1 starts AFTER T0's scan completed. So mission-bar wasn't in T0's scan-set. Race exists: scope deleted between T0-scan and T1-write.
- **Resolution:** T1's `setMissionScope` re-validates scope-existence under mission-lock; if T0's deleteScope already removed scope-config, T1 sees ENOENT → `MissionStateError("scope-id <X> deleted concurrently; setMissionScope failed; create scope first OR check spelling")`. T1 rejects; mission-bar NOT mutated.

Closes the silent-corruption surface. Strict-1.0 commits the optimistic-concurrency model with re-validation-at-write-time.

**`setMissionScope` re-validation discipline (v2.1 fold per MEDIUM-R1.5):**
1. Acquire mission-lock
2. Resolve scopeId (id-form vs name-form per regex prefix-detection per MEDIUM-R1.7)
3. Verify `<workspace>/scopes/<resolved-scope-id>.yaml` exists via fs.access
4. If missing → `MissionStateError("scope-id <X> does not exist; create scope first OR check spelling")` (covers concurrent-deleteScope race + operator-typo)
5. Atomic-write mission-config with `mission.scope-id = <canonical scp-<hash>>` (per HIGH-4 canonical-id persistence)
6. Release mission-lock

**Reverse-index discipline (v2.1 fold per MEDIUM-R1.2 — computed-on-demand at v1):**

Engine computes `referencedByMissions` field on `ScopeState` via linear scan of `<workspace>/config/*.yaml` filtering on `mission.scope-id` field at every `getScope() / deleteScope()` call. O(N) per query. v1 documented operator-targeting limit ~1000s missions; computed-on-demand acceptable for cascade-protection (rare operation; deleteScope-frequency low). v1.x can materialize cached index at `<workspace>/scopes/.references/<scope-id>.json` if scale demands.

Spec at §2.3.1 ScopeState docstring (already states "Engine maintains via reverse-index OR computed-on-getScope by scanning mission-configs" — locks to computed-on-demand per v2.1).

**Scope-config schema versioning under Strict-1.0:**

`scope-config-schema-version: 1` REQUIRED at top of YAML; zod type `z.literal(1)` (number); v1.x can ADD optional fields (additive-only); REMOVING/RENAMING requires v2 + new schema-version. Engine rejects unknown schema-version with `ConfigValidationError`. Same discipline as mission-config schema versioning per MEDIUM-14.

**Independent schema-version coupling (v2.1 fold per MEDIUM-R1.6):** `scope-config-schema-version` + `mission-config-schema-version` are INDEPENDENTLY versioned. v1.x can ADD optional fields to either schema without affecting the other (e.g., `mission-config-schema-version` stays 1 while `scope-config-schema-version` advances to 2 if scope-schema diverges). Major-version bumps re-anchor BOTH schema-versions together at major-version boundaries (full-reshape semantic).

**Scope-rename flow (v2.1 fold per HIGH-4 — canonical-id persistence resolves orphan-reference concern):**

`renameScope(id, newName)` mirrors mission-rename per §2.4 MEDIUM-R5.6 — under scope-lock; 4-step config-write-FIRST flow:
1. Atomic-write updated `<scope-id>.yaml.tmp` with new name
2. `O_EXCL` on new symlink at `<workspace>/scopes/.names/<new-name>.yaml`
3. Unlink old symlink (if old name existed)
4. Atomic-rename temp config → final config

**Mission-config field `mission.scope-id` persists CANONICAL `scp-<hash>` only (per HIGH-4):** CLI `msn update <id> scope-id <scope-id|name>` accepts EITHER form; SDK `setMissionScope(id, scopeIdOrName)` resolves name→id via name-symlink lookup BEFORE persistence; mission-config persists canonical scp-<hash> always. **Scope-rename does NOT break mission-config references** — missions reference canonical id, not name. Symmetric with `mission.id` (always canonical msn-<hash>).

CLI lookup pattern (parallel to mission-id-lookup at §2.4):
- `msn create --scope <foo>` → CLI resolves `foo` to canonical scp-<hash> via name-symlink; persists scp-<hash>
- `msn create --scope <scp-7a9b2e1c>` → CLI validates scope exists by id; persists as-is
- `msn update <id> scope-id <foo>` → SDK resolves; persists canonical
- `msn update <id> scope-id ""` → clears scope-reference (null/undefined; pre-start only per per-field state-restriction matrix)

**Orphan-config workflow for scope** mirrors mission-orphan workflow (MINOR-R4.1): `msn scope list` shows all scopes; `msn scope delete <id>` releases name + config (terminal action). No separate `--cleanup-orphans` workflow.

**Scope CLI lookup id-vs-name prefix-detection (v2.1 fold per MEDIUM-R1.7; parallel to mission per MEDIUM-R4.8):** CLI receives `<scope-id|name>` selector; dispatch via regex prefix-detection:
1. Match `^scp-[a-f0-9]{8}$` (auto-id strict pattern) → id-form; `fs.access(<workspace>/scopes/<id>.yaml)`
2. Else → name-form; `fs.readlink(<workspace>/scopes/.names/<name>.yaml)` → resolves to `<id>.yaml`
3. ENOENT on either path → `MissionStateError("scope not found: <selector>")`
- Strictly disjoint (regex match-or-not); no fallback ambiguity. Operator-supplied scope `--name` MUST NOT match auto-id regex (per §2.3.2 Rule 5 reject-on-create).
- **Mission-vs-scope namespace error-message disambiguation hint (v2.1 fold per MINOR-R1.2):** if `msn show <name>` is invoked with name that doesn't exist as mission BUT DOES exist as scope → error includes hint: `MissionStateError("mission '<name>' not found. Did you mean 'msn scope show <name>'?")` (engine cross-checks scope-name-symlink at `<workspace>/scopes/.names/<name>.yaml` for hint generation). Same pattern for inverse case (`msn scope show <name>` where name only exists as mission). Operator-DX surface; cheap-to-implement; closes namespace-confusion surface.

**Scope-lock acquisition order on mutate:**

1. Acquire scope-lock via `acquireScopeLock(scopeId, { waitMs: 0 })`; on failure → `LockTimeoutError`
2. Read-modify-write scope-config (atomic-write per MEDIUM-11)
3. Release scope-lock

Concurrent scope-update operators serialize via scope-lock. Concurrent `addRepoToScope` from two operators → second waits per `waitMs` (default 0 fail-fast).

**Scope-mutation SDK methods explicit list (v2.2 fold per MINOR-R2.1):** All scope-mutation SDK methods acquire scope-lock per the protocol above:
- `addRepoToScope` / `removeRepoFromScope` / `renameScope` / `setScopeDescription` / `setScopeTag` / `removeScopeTag` / `deleteScope`

Read-only methods do NOT acquire scope-lock:
- `getScope` (computed-on-demand reverse-index; reads mission-configs without lock per MEDIUM-R1.2)
- `listScopes` (same; computed-on-demand)
- `getScope({includeReferences: true})` (still no lock; reads mission-configs read-only)

### §2.5 Mission-config schema (v1.1 reshape — extends with `repos: [...]` per refinement #3)

YAML format (TypeScript-validated via zod at load-time). v1.1 extends v1.0 schema with declarative `repos: [...]` field — operator declares mission INTENT once; engine realizes runtime state.

```yaml
# missioncraft mission config (manifest at <workspace>/config/<id>.yaml)
mission-config-schema-version: 1   # additive-only schema model under Strict-1.0; v1.x ADDs optional fields; renames/removals require v2 + new schema-version

mission:
  id: msn-a3bd610c                  # auto-generated by `msn create`; or operator-supplied
  name: storage-extract              # optional human-friendly slug; for `msn start storage-extract`
  hub-id: mission-77                 # optional; Hub-side mission entity id mapping (sovereignty preserved — missioncraft just stores)
  scope-id: scp-7a9b2e1c             # v2.0 fold per Refinement C — optional; references scope template; engine inlines scope.repos at startMission per §2.4.2 hybrid resolution; pre-start updates to scope propagate live; post-start scope-id is informational-only
  description: "Extract storage-provider to sovereign repo"
  lifecycle-state: configured        # v1.6 fold per MEDIUM-R5.1; v1.7 fold per MEDIUM-R6.1; v4.2 fold per MEDIUM-R2.5 — engine-controlled field; zod schema `.default('created')` so missing-on-input populates with default; engine ALWAYS overwrites on transitions (atomic-write per MEDIUM-11). Operator-set value via applyMission/YAML is OVERWRITTEN on first engine action — operator cannot mutate this field meaningfully (engine reads disk state on every transition; treats operator-supplied value as informational-only). enum (v4.2 extended for reader-side states): writer-side: 'created' | 'configured' | 'started' | 'in-progress' | 'completed' | 'abandoned'; reader-side (v4.0+ NEW): 'joined' | 'reading' | 'readonly-completed' | 'leaving'. zod literal-string-union accepts all 10 values; preserves wire-format kebab-case. Per-principal config holds principal-specific lifecycle-state.
  created-at: "2026-05-09T01:00:00Z"  # ISO-8601; auto-set at `msn create`; immutable
  updated-at: "2026-05-09T01:30:00Z"  # ISO-8601; initialized at `msn create` time to SAME value as `created-at` (v1.8 fold per MINOR-R7.1); mutated atomically by engine on every transition + every config-mutation; created-at is immutable (v1.7 fold per MEDIUM-R6.2 — symmetric with created-at; closes MissionState.updatedAt YAML-source gap)
  publish-message: "Refactor adapter kernel for v2.0"   # v3.2 fold per MEDIUM-R2.6 — persisted at FIRST `complete` invocation; immutable post-write; reused by idempotent retry; new message-arg from retry IGNORED with operator-warning
  abandon-message: "Stuck on issue X; restart needed"   # v3.3 fold per round-3 ask 3 — populated at FIRST `msn abandon` invocation; immutable post-write; symmetric with publish-message; separate field for distinct lifecycle event (complete-attempt vs abandon-action)
  abandon-progress: 'workspace-handled'                # v3.4 fold per MEDIUM-R4.1 — abandon-step partial-failure recovery; values: 'tick-fired' | 'daemon-killed' | 'message-persisted' | 'locks-released' | 'branches-cleaned' | 'workspace-handled' | 'config-purged'; mission stays 'in-progress' until reaches terminal step; idempotent retry resumes from failed step. v3.5 fold added 'message-persisted' (Step 3 progress-marker; lifecycle-state does NOT advance at Step 3); v3.6 fold per MINOR-R6.2 renamed 'workspace-destroyed' → 'workspace-handled' (--retain-aware semantic).
  publish-status:                    # v3.1 fold per MEDIUM-R1.9 — per-repo publish-state for atomic PR-set publish-flow partial-failure recovery; only present during/after `complete` execution; values per-repo: 'pending' | 'squashed' | 'pushed' | 'pr-opened' | 'failed'
    adapter-kernel: 'pr-opened'
    claude-plugin-shim: 'pr-opened'
  published-prs:                     # v3.3 fold per MEDIUM-R3.3 — per-repo PR URLs persisted post-publish-flow; forensic-history; cleared only on --purge-config; eliminates runtime gh-cli round-trips on getMission() of completed-missions
    - repo-name: adapter-kernel
      pr-url: https://github.com/example/adapter-kernel/pull/42
    - repo-name: claude-plugin-shim
      pr-url: https://github.com/example/claude-plugin-shim/pull/17
  tags:                              # cross-system correlation; Record<string,string>; no v1-validation
    correlation-id: "ois-2026-05-08"
  participants:                      # v4.0 NEW per idea-265 multi-participant — mission-wide participant granularity; absent OR contains exactly 1 writer + 0 readers = solo writer-only mission (v3.6 baseline behavior preserved)
    - principal: lily@apnex          # opaque-string identity reference; format <user>@<host> or <user>@<org> at v1 (v4.1 fold per MINOR-R1.4); operator-supplied; principal-equality via string-comparison
      role: writer                   # v1: exactly 1 writer per mission; co-writer mode (multi-writer with atomic-tx discipline) deferred to v1.x per Lean 6 YAGNI
      added-at: 2026-05-10T12:00:00Z # ISO-8601; audit-trail
    - principal: greg@apnex
      role: reader                   # ≥0 readers; pure-read at v1 (annotation/comment/line-tied-thread deferred to v1.x)
      added-at: 2026-05-10T12:05:00Z
  coordination-remote: file:///home/apnex/.missioncraft-coordination/msn-a3bd610c.git   # v4.0 NEW per idea-265; required IFF participants[] contains a reader (zod superRefine conditional-validation per F-V4.2). One bare repo per mission; engine derives per-repo refs as `refs/heads/<repo-name>/wip/<id>` (v4.1 fold per MEDIUM-R1.10 option (a) gsutil-bucket granularity). Cross-host topology = network remote URL (typically github); same-host topology = local bare repo file:// URL.
  abandon-repo-status:               # v3.5 fold per MEDIUM-R5.2 — abandon-flow Step 5 per-repo cleanup state; symmetric with publishStatus discipline
    adapter-kernel: 'cleaned'
  # NOTE (v4.4 fold per MEDIUM-R3.3 + MINOR-R4.2): `last-push-success-at` removed from MissionConfig YAML schema; field now lives in NEW `<workspace>/missions/<id>/.daemon-state.yaml` (separate file) to preserve mission-config atomic-write discipline (no per-cadence config-mutation). Engine merges into MissionState response at `msn show <id>` query-time. See §2.6.5.v4 `.daemon-state.yaml` mechanism. The field REMAINS on `MissionState` interface (engine-derived; not config-persisted).

# Declarative repo list (NEW v1.1 — per refinement #3)
repos:
  - url: file:///mnt/agentic-network # source monorepo (file:// for offline mission-start scenarios)
    name: agentic-network-source     # optional override; auto-derived from URL last segment if omitted
    branch: extract-storage-provider-source
    base: main                       # optional; defaults to repo's default-branch
  - url: https://github.com/apnex-org/storage-provider
    name: storage-provider
    branch: initial-extraction
    # base: main (auto-derived)

# Workspace
workspace-root: ~/.missioncraft      # optional override (default ~/.missioncraft)
default-branch: main                 # default base-branch for repos that don't specify

# Lock behavior (v0.3 carry-forward — split waitMs + validityMs)
lock-timeout:
  wait-ms: 0                         # 0 = fail-fast (CI-style); operator-UX may prefer 30s-5min
  validity-ms: 86400000              # 24h default per F14

# Pluggable overrides (all optional; defaults from Missioncraft constructor)
identity:
  provider: local-git-config
approval:
  provider: trust-all
storage:
  provider: local-filesystem
git-engine:
  provider: isomorphic-git
remote:
  provider: gh-cli                   # OR null for pure-git mode

# State durability config (per Q1=d comprehensive coverage; v0.2-v0.7 carry-forward)
state-durability:
  mechanism: layered
  wip-cadence-ms: 30000
  snapshot-cadence-ms: 300000
  snapshot-root: /var/missioncraft/snapshots   # MUST be on different fs from workspace-root for disk-failure resilience
  snapshot-retention:
    min-count: 5
    min-age-hours: 24
  wip-branch-cleanup: delete-on-complete-retain-on-abandon
  process-crash-recovery: true
  disk-failure-recovery: true
  network-partition-resilience: true
  network-retry:
    max-attempts: 5
    backoff-ms: 1000

# Auto-merge
auto-merge: false
auto-merge-strategy: ff               # ff | no-ff (per v0.6 §AAAAA — IsomorphicGit only supports ff/no-ff)
```

**RepoSpec type (TypeScript camelCase; YAML serialization uses kebab-case via zod transform — v1.2 fold per HIGH-4):**

```typescript
interface RepoSpec {
  readonly url: string;             // git URL (HTTPS, SSH, file://)
  readonly name?: string;           // local-name override; auto-derived from URL last segment if omitted; MUST NOT match reserved-sub-actions list (`repo-add`, `repo-remove`, `repo-list`); MUST match DNS-style slug `[a-z0-9][a-z0-9-]{1,62}` (v1.3 fold per MEDIUM-R2.5)
  readonly branch?: string;         // mission's working branch; default: create `mission/<missionId>` from base; v1.7 fold per MINOR-R6.6 — default DERIVED AT RUNTIME-CLONE-TIME (not parse-time): engine substitutes if RepoSpec.branch undefined when `startMission` clones; missionId is known at create-time but parse-time-substitution would persist the derived branch into the YAML config which loses the "default" semantic on v1.x branch-policy evolution
  readonly base?: string;           // base-branch to branch from; default: repo's default-branch
  readonly commitSha?: string;      // optional pin to specific commit for reproducibility (YAML: `commit-sha:`)
}
```

**Naming-convention contract (v1.2 fold per HIGH-4; v1.3 fold per MEDIUM-R2.7 + MINOR-R2.2 — values + tags exemption):**

- **Property names:** TypeScript camelCase ↔ YAML kebab-case. zod schema transforms at parse-time. Same pattern applies throughout: `mission-config-schema-version` (YAML) ↔ `missionConfigSchemaVersion` (TS); `wip-cadence-ms` (YAML) ↔ `wipCadenceMs` (TS); etc.
- **Values:** PRESERVE wire-format as-typed (kebab-case literal-strings preserved; NO transform on values). Examples:
  - YAML `wip-branch-cleanup: delete-on-complete-retain-on-abandon` → TS `wipBranchCleanup: 'delete-on-complete-retain-on-abandon'` (literal-string-union; kebab preserved)
  - YAML `auto-merge-strategy: ff` → TS `autoMergeStrategy: 'ff' | 'no-ff'`
  - YAML `state-durability.mechanism: layered` → TS `stateDurability.mechanism: 'layered'`
  - YAML `identity.provider: local-git-config` → TS `identity.provider: 'local-git-config' | 'trust-all' | 'gh-cli'`
- **Tags Record-keys exemption (per MINOR-R2.2):** `tags: Record<string, string>` keys are operator-supplied; PRESERVED as-is (no kebab→camelCase transform). E.g., YAML `correlation-id: "ois-2026-05-08"` → TS `tags['correlation-id'] = 'ois-2026-05-08'`.
- **Date round-trip discipline (v1.7 fold per MINOR-R6.4):** Date fields serialize as ISO-8601 strings on YAML wire (e.g., `created-at: "2026-05-09T01:00:00Z"`); zod transform `z.string().datetime().transform((s) => new Date(s))` converts to TS `Date` object on parse; engine writes back via `Date.prototype.toISOString()` for atomic-write. Round-trip preserves UTC timezone (Z suffix); local-tz inputs are accepted but normalized to UTC on first engine-write.
- **Nested-property kebab→camelCase transform (round-6 ask 3 verification):** the kebab↔camelCase transform applies RECURSIVELY through all nested object fields. E.g., YAML `mission.created-at` → TS `mission.createdAt`; YAML `state-durability.wip-cadence-ms` → TS `stateDurability.wipCadenceMs`; YAML `snapshot-retention.min-count` → TS `snapshotRetention.minCount`. zod schema's `.transform()` operates per-level via nested object schemas; depth is unbounded but practically ≤3 levels at v1.
- Strict-1.0 commits BOTH the TS-side type signatures + the YAML-side kebab-case wire-format. zod schema codifies which fields transform vs preserve.

**Mission-config schema versioning under Strict-1.0:**
- `mission-config-schema-version: 1` is REQUIRED at top of YAML (parser-side version-dispatch); **zod type `z.literal(1)` (number) NOT `z.literal("1")` (string)** — YAML 1.2 parses unquoted `1` as number (v1.3 fold per MINOR-R2.1)
- v1.x can ADD optional fields (additive-only); REMOVING or RENAMING fields requires v2 + new schema-version
- Engine rejects YAML with unknown `mission-config-schema-version` via `ConfigValidationError` (v1.2 fold per MEDIUM-14 — explicit error class for forward-compat reject)
- **Name-validation enforced at every config-load via `MissionConfigSchema` (v1.4 fold per MEDIUM-R3.11):** the zod schema includes `mission.name` validation (regex `[a-z0-9][a-z0-9-]{1,62}` + reserved-verbs check + `msn-` prefix rejection); applies UNIFORMLY at every parse-site:
  - `createMission({name})` SDK call (operator-input via SDK)
  - CLI `msn create --name <slug>` (operator-input via CLI)
  - `applyMission({id, config})` SDK call (config-mutation parse)
  - `startMission({config})` SDK call (full-config parse; case-1 single-call path)
  - YAML hydration (CLI reads existing `<workspace>/config/<id>.yaml`)
  - Adapter `MissionConfigSchema.parse(event.payload.missionConfig)` (Hub-delivered payload)
- Single canonical schema; no validation-bypass surface even for manually-edited YAML or Hub-delivered configs.
- **Atomic-write discipline for CLI mid-mission config mutations (v1.2 fold per MEDIUM-11):** every CLI mutation (`msn create`, `msn update <id> repo-add`, `msn apply`) writes via `fs.writeFile(path + '.tmp')` + zod-validate-roundtrip the temp file (parse the temp; if parse fails, abort + emit `ConfigValidationError`) + `fs.rename(path + '.tmp', path)` (POSIX atomic on same-fs); never leaves partial-config visible. Prevents corruption if CLI crashes mid-mutation. v2.0: same discipline applies to scope-config mutations.

**v4.0+ multi-participant zod schema extensions (v4.2 fold per MEDIUM-R1.1 + F-V4.2 — inline-flatten from v4.1 §2.10.10):**

```typescript
const MissionParticipantSchema = z.object({
  principal: z.string(),                            // opaque-string at v1; format <user>@<host> per MINOR-R1.4
  role: z.enum(['writer', 'reader']),
  addedAt: z.string().datetime(),
});

const MissionConfigSchema = z.object({
  // ... all existing v3.6 fields preserved (mission, repos, workspaceRoot, lockTimeout, identity, approval, storage, gitEngine, remote, stateDurability, autoMerge, etc.)
  participants: z.array(MissionParticipantSchema).optional(),
  coordinationRemote: z.string().url().optional(),
  // lastPushSuccessAt REMOVED v4.4 fold per MEDIUM-R3.3 + MINOR-R4.2 — moved to .daemon-state.yaml; not in MissionConfigSchema. Engine merges from .daemon-state.yaml at MissionState read-time.
}).superRefine((config, ctx) => {
  // F-V4.2 conditional-validation: coordinationRemote required IFF participants[] contains a reader
  const hasReader = config.participants?.some(p => p.role === 'reader') ?? false;
  if (hasReader && !config.coordinationRemote) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'coordinationRemote required when participants[] contains a reader', path: ['coordinationRemote'] });
  }
  // v1: exactly 1 writer; co-writer mode deferred to v1.x
  const writerCount = config.participants?.filter(p => p.role === 'writer').length ?? 0;
  if (config.participants && writerCount !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'exactly 1 writer required at v1; co-writer mode deferred to v1.x', path: ['participants'] });
  }
});
```

Validation enforced UNIFORMLY at all parse-sites enumerated above (createMission / msn create / applyMission / startMission / YAML hydration / adapter parse). Parse-fail → `ConfigValidationError`. **No schema-version bump** required (additive-only; participants/coordinationRemote are optional fields; lastPushSuccessAt moved to .daemon-state.yaml per MEDIUM-R3.3 v4.4 fold).

**v4.4 fold per MEDIUM-R3.2 — zod superRefine role-based state-validation (option (a) inline-flatten); v4.5 fold per MEDIUM-R6.4 — schema-factory pattern correction:**

Per HIGH-R1.2 partition-spec, each principal holds own per-principal `<workspace>/config/<id>.yaml`; engine knows config's owning-principal from file-path mapping. **v4.5 fold per MEDIUM-R6.4 picks schema-factory pattern** — `MissionConfigSchema(owningPrincipalRole)` is a factory returning a closure-captured-context schema; engine constructs role-aware schema per parse-site (file-path → role → schema-instance):

```typescript
function makeMissionConfigSchema(owningPrincipalRole: 'writer' | 'reader') {
  return z.object({...}).superRefine((config, ctx) => {
    // ... existing F-V4.2 conditional + writer-count refinements
    // v4.5 fold per MEDIUM-R6.4 — role-based state-validation via factory-closure
    const writerStates = new Set(['created', 'configured', 'started', 'in-progress', 'completed', 'abandoned']);
    const readerStates = new Set(['joined', 'reading', 'readonly-completed', 'leaving']);
    if (owningPrincipalRole === 'writer' && !writerStates.has(config.mission.lifecycleState)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `writer-side config rejects reader-side lifecycle-state '${config.mission.lifecycleState}'`, path: ['mission', 'lifecycleState'] });
    }
    if (owningPrincipalRole === 'reader' && !readerStates.has(config.mission.lifecycleState)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `reader-side config rejects writer-side lifecycle-state '${config.mission.lifecycleState}'`, path: ['mission', 'lifecycleState'] });
    }
  });
}

// Engine-side parse-site dispatch:
const role = engine.deriveOwningPrincipalRole(configFilePath);  // 'writer' | 'reader' from file-path mapping
const schema = makeMissionConfigSchema(role);                    // factory yields role-aware schema
const config = schema.parse(yaml.parse(fs.readFileSync(configFilePath, 'utf8')));
```

Schema-factory closure-captures `owningPrincipalRole`; superRefine accesses via closure (no need to inject into config-object). Engine resolves role at parse-site dispatch (each file-load-path knows its own role-context). Backward-compat: existing parse-sites that don't pass role default to writer-role for v3.6-baseline-compatible behavior (legacy single-principal missions never reach reader-states; default-writer-validation is no-op for them). Operator/Hub-delivered malformed-config rejected at parse-time per existing zod discipline.

### §2.5.1 Scope-config schema (v2.0 NEW per Refinement C — multi-mission composition primitive)

YAML format (TypeScript-validated via `ScopeConfigSchema` zod at load-time). Parallel structure to mission-config schema; simpler (no pluggable overrides; no state-durability config; no lock-timeout fields — scopes are templates, not active resources).

```yaml
scope-config-schema-version: 1   # additive-only schema model under Strict-1.0; v1.x ADDs optional fields; renames/removals require v2 + new schema-version

scope:
  id: scp-7a9b2e1c                  # auto-generated by `msn scope create`
  name: claude-plugin                # optional human-friendly slug
  description: "Claude Code plugin adapter component-set"
  lifecycle-state: created           # 'created' | 'deleted' (v2.0 fold per Refinement C — engine-controlled; .default('created'))
  created-at: "2026-05-09T01:00:00Z" # ISO-8601; immutable
  updated-at: "2026-05-09T01:30:00Z" # ISO-8601; mutated atomically on every scope-update event
  tags:                              # cross-system correlation; Record<string,string>; keys preserved as-is
    correlation-id: "ois-2026-05-09"

# Declarative repo list (parallel to mission-config repos:[])
repos:
  - url: https://github.com/example-org/adapter-core.git
    name: adapter-core               # optional; auto-derived from URL last segment
    branch: main
    base: main
  - url: https://github.com/example-org/adapter-extension.git
    name: adapter-extension
    branch: main
    base: main
```

**ScopeConfigSchema validates:**

- `scope-config-schema-version` zod literal-1 (number; same discipline as mission per MINOR-R2.1)
- `scope.name` slug-format `[a-z0-9][a-z0-9-]{1,62}` + reserved-verbs check + `scp-` prefix rejection (parallel to mission's `msn-` prefix rejection per MEDIUM-R2.6)
- `scope.lifecycle-state` zod literal-string-union (engine-controlled; `.default('created')`; operator-set value OVERWRITTEN on first engine action — same discipline as mission per MEDIUM-R6.1)
- `scope.created-at` immutable; `scope.updated-at` initialized = `created-at` at create-time (parallel to mission per MINOR-R7.1)
- `repos` array of `RepoSpec` (reuses mission's RepoSpec interface; same naming-convention contract)

**Validation enforced at every scope-config-load via `ScopeConfigSchema`** (parallel to mission per MEDIUM-R3.11):
- `createScope({name?, description?})` SDK call
- CLI `msn scope create [--name <slug>]`
- `addRepoToScope` / `removeRepoFromScope` / `renameScope` / `setScopeDescription` (mutation-write through ScopeConfigSchema validation)
- YAML hydration (CLI reads existing `<workspace>/scopes/<id>.yaml`)
- Adapter `ScopeConfigSchema.parse(event.payload.scopeConfig)` (Hub-delivered payload; if Hub ships scope-templates over MCP)

Single canonical schema; no validation-bypass surface.

### §2.6 Periodic state durability mechanism (load-bearing per Q1=d + F1 CRITICAL)

**Q1=d comprehensive durability** mandates coverage of process-crash + disk-failure + network-partition equally. **Q5=b no chaos-testing** means validation-strategy is via design-discipline + targeted-integration-tests (per F1 architect-recommendation).

**Architect-design (v0.2 — engineer round-1 §B folds applied):** **layered durability mechanism** combining 3 sub-mechanisms with explicit cross-mechanism ordering invariants.

**Cross-mechanism ordering invariant (v0.2 fold per §B.2):** every §2.6.2 bundle-write happens AFTER its corresponding §2.6.1 wip-commit — bundle includes the wip-commit's tree state. Bundle-write failure leaves wip-commit landed (always-recoverable from §2.6.1). Atomic-bundle-write via write-to-temp-then-rename (POSIX `rename(2)` is atomic on same-fs); partial bundles never visible. **§2.6.1 → §2.6.2 dependency:** §2.6.2 bundles the WIP-BRANCH HISTORY (not "working tree state") — git-bundle operates on git objects in the object store, which §2.6.1 has populated.

#### §2.6.1 Process-crash recovery — per-repo `wip/<mission-id>` branch via `commitToRef` plumbing (v0.2 fold per §B.1)

- **On operator-activity** (per §2.6.5 cooperative-tick model; NOT background-daemon-driven), if last wip-commit > N seconds ago (cadence configurable; default 30s via `state-durability.wip-cadence-ms`), missioncraft uses `GitEngine.commitToRef(workspace, 'refs/heads/wip/<mission-id>', { message, autoStage: true })` to commit dirty workspace state to a wip-branch **without moving HEAD AND without polluting operator's INDEX** (v0.3 fold per §AA — implementation contract: filesystem-walk + per-file `git.writeBlob` + explicit-tree-construction via `git.writeTree({ tree: [...] })` overload, NOT the index-derived form; operator's feature-branch checkout + staging area both preserved). v2.3 fold per MEDIUM-R3.1 — wording aligned with §2.6.5 cooperative-tick semantic (idle missions DO NOT auto-tick; operator-explicit tick via `msn tick <id>` for forced cadence-trigger).
- **Blob-write efficiency optimization (v0.4 fold per §DDD.1; v0.5 wording softened per §DDDD):** filesystem-walk hashes each file's content first (sha-1); checks if blob already exists in object-db via existence-probe (precise error/return semantics of `git.readObject` resolved at impl-time — IsomorphicGit docs are ambiguous on missing-OID behavior; either try/catch on NotFoundError OR null-check sentinel); SKIPS `writeBlob` if exists. Avoids re-writing unchanged blobs every cadence-tick (mitigates 100MB-working-tree × 30s = 100MB-disk-write-every-30s naive cost). Composes with git's content-addressable model — unchanged content = same SHA = no-op write
- Foreground/background race resolution (v0.2 fold per §B.1): wip-cadence task acquires the workspace's storage-lock briefly during `commitToRef` invocation; user-driven `commit()` operations also acquire the lock; operations serialize (no concurrent writes to refs)
- Wip-branch object accumulation (v0.5 fold per §AAAA — architect-call option (b) **DROP GC discipline at v1**): IsomorphicGit has no GC primitives (`git.gc`, `gc.auto`, prune/repack — none exist; IsomorphicGit alphabetic command index confirms absence). v0.2 spec claimed periodic GC; that claim was the 4th consecutive substrate-currency error in this Phase 4 cycle. **v0.5 design:** no mid-mission GC; rely on F16 `wip-branch-cleanup` (`delete-on-complete-retain-on-abandon` default) for terminal cleanup + §DDD.1 hash-skip-via-readObject precheck for blob-write deduplication. Long-running missions accumulate wip-branch history bounded by mission-duration; F16 cleanup destroys the wip-branch + its history at mission-complete. Disk-pressure surface for very-long missions (>1 week continuous) flagged for v1.x maturity if operator-feedback emerges (post-v1 GC mechanism candidate; deferred per Q5=b bounded scope).
- On `kill -9` / OOM / panic: process restart reads workspace; `refs/heads/wip/<mission-id>` carries last durable tree state; mission resumes from there
- Cost: minor disk I/O per cadence-tick; near-zero startup overhead
- Coverage: process-crash with workspace-disk intact

#### §2.6.2 Disk-failure recovery — out-of-band snapshot store (v0.2 fold per §B.2 + §B.3)

- **Cold-start: first bundle at mission-start (v0.5 fold per §EEEE).** First bundle written immediately after `mission start` allocates workspace + acquires lock + creates initial wip-branch (NOT deferred to first natural cadence-tick `snapshot-cadence-ms` later). Closes the cold-start window where disk-failure within first 5min has no bundle to restore.
- **On operator-activity** (per §2.6.5 cooperative-tick model), if last bundle-write > M seconds ago (cadence configurable; default 5min via `state-durability.snapshot-cadence-ms` — coarser than wip-cadence), missioncraft shells `git bundle create ${snapshotRoot}/<missionId>/snapshot-<timestamp>.bundle.tmp refs/heads/wip/<mission-id>` then atomic-renames to `snapshot-<timestamp>.bundle` (per §AAA architect-call option (a) shell-out-to-native-git for bundle ops). v2.3 fold per MEDIUM-R3.1 — wording aligned with §2.6.5 cooperative-tick semantic.
- **Bundle scope (v0.2 fold per §B.3):** wip-branch history (NOT "working tree state" — git-bundle operates on git objects in the object store; uncommitted dirty files are not bundleable directly; §2.6.1 wip-commits ensure dirty state IS in the object store before §2.6.2 bundles)
- `snapshotRoot` is a different filesystem path from `workspaceRoot` (operator configures cross-disk OR cross-mount); rejection at startup if same filesystem (defeats disk-failure resilience)
- Snapshot retention per `state-durability.snapshot-retention.{min-count, min-age-hours}`: keep last N OR last X-hours whichever-larger (default 5 + 24h)
- On disk-failure: workspace storage lost; missioncraft restores from latest valid bundle on snapshotRoot.
  - **Bundle ops mechanism (v0.4 fold per §AAA — architect-call option (a)):** missioncraft shells out to native `git` CLI for bundle create/verify/fetch operations. Rationale: IsomorphicGit's `fetch` is HTTP(S)-only (issue #462 open since 2018; no file:// or local-path support); pure-TS bundle-handling would require ~200-400 LOC hand-rolled bundle-format parser (option (b)) — out of scope for Q5=b bounded test surface + Q4=c patient timeline. **Pure-TS breach is explicit + bounded to disk-failure-recovery codepath only**; composes with already-existing breach via `LocalGitConfigIdentity` shelling `git config`. Operator-impact: requires `git` CLI installed (already required for `gh` CLI dependency at GitHubRemoteProvider; no new constraint). Library-SDK consumers in environments without `git` CLI MUST disable disk-failure-recovery via `state-durability.disk-failure-recovery: false` (process-crash + network-partition mechanisms remain pure-TS). Documented in missioncraft README + CLI `msn init` startup banner if git not on PATH.
  - **Bundle validity check (v0.3 fold per §DD):** iterate snapshotRoot/<missionId>/snapshot-*.bundle in newest-first order; for each candidate, shell `git bundle verify <path>` (exit-0 = valid); skip bundles failing verify (truncated mid-rename, corrupted) + try next-newest until first valid bundle found
  - **Restoration command (v0.3 fold per §DD; v0.4 corrected per §AAA):** shell out to native git: `cd ${freshWorkspace} && git init && git fetch <bundle-path> 'refs/heads/*:refs/heads/*' && git checkout wip/<mission-id>`. Avoids IsomorphicGit fetch limitation. Native git's `fetch` understands bundle-paths natively.
  - **Same-fs detection at startup (v0.3 fold per §DD):** `stat(snapshotRoot).dev !== stat(workspaceRoot).dev` (POSIX device-ID comparison via Node `fs.statSync().dev`); rejection at startup if same; defeats disk-failure resilience otherwise. Note minor edge: btrfs subvolumes can share dev IDs (rare; non-blocking; canonical Linux semantics still device-ID).
  - **Recovery-scope window spec (v0.4 fold per §DDD.2):** restored state = wip-branch state as of last successful bundle-write (= up to `snapshot-cadence-ms` stale; default 5min). Operator's commits to feature-branch (HEAD's actual branch) BETWEEN bundle-create and disk-failure are NOT in wip-branch → NOT in bundle → NOT recoverable. Data-loss window = up to 5min by default; configurable via `snapshot-cadence-ms`. Documented in missioncraft README disk-failure-recovery section so operators understand the window.
- Cost: bundle-create per cadence-tick (5min default); atomic-rename overhead negligible; snapshot disk-space proportional to workspace-size × retention
- Coverage: workspace-disk corruption / accidental delete (assuming snapshotRoot is cross-disk)

#### §2.6.3 Network-partition resilience — push retry-loop with exponential backoff (v0.2 fold per §B.4 — claim correction)

**v0.2 correction (§B.4):** v0.1 incorrectly claimed "IsomorphicGit's `push()` is resumable at protocol level (smart-HTTP supports range requests; native git/SSH supports pack-resumption)". **Both halves were wrong:** smart-HTTP push uses POST with full pack body; no Range-request resumption. IsomorphicGit doesn't speak SSH transport at all. The actual mechanism is **retry-on-failure with full-pack-restart**.

- missioncraft wraps `GitEngine.push()` in a `with-retry-on-network-error` wrapper: detect `ECONNRESET` / `ETIMEDOUT` / `ENOTFOUND` / `socket hang up`; retry with exponential backoff (`state-durability.network-retry.max-attempts`, default 5; initial backoff `network-retry.backoff-ms`, default 1000ms)
- Each retry attempts the FULL push (pack-restart). For mid-push partition: drop = restart; workspace state remains durable on disk via §2.6.1; push retries until success or `max-attempts` exceeded (then `NetworkRetryExhaustedError`)
- Cost: per-push retry-loop overhead (negligible on healthy network); full-pack-restart per attempt (proportional to push size; acceptable for typical mission cadence)
- Coverage: push/pull interrupted mid-flight; state survives partition (via §2.6.1); push completes when network returns OR operator-abort after retry-exhaustion

#### §2.6.4 Validation strategy (Q5=b bounded; per F1 architect-recommendation)

**Targeted-integration-tests** (within Q5=b "integration" tier; v0.2 expanded per §B + §H.3):
1. **Process-crash test:** spawn missioncraft mission; mid-commit `kill -9` the process; restart; assert mission state recovered from `wip/<mission-id>` branch
2. **Disk-failure test:** spawn missioncraft mission; `rm -rf` workspaceRoot mid-mission; assert snapshotRoot bundle restoration recovers state
3. **Network-partition test:** spawn missioncraft mission; mid-push toggle network (undici mock OR test-fixture HTTP server that drops connections); assert push retry-loop completes when network returns
4. **Cross-mechanism crash test (v0.2 fold per §B.2):** spawn missioncraft mission; mid-bundle-write `kill -9` the process while wip-cadence ticking; restart; assert wip-branch is intact + partial bundle was atomically-renamed-or-not (no half-bundle); assert recovery from wip/branch (snapshot restoration falls back to last valid bundle)
5. **Lock-timeout-recovery test (v0.2 fold per §H.3):** acquire lock; force `expiresAt` to past; concurrent acquire from second mission attempt; assert second acquire succeeds + first lock auto-released

**NO chaos / fault-injection tests.** **NO cross-version-compatibility tests.** Q5=b boundary respected.

#### §2.6.5 Engine runtime model (v3.0 substantive reshape per Round-3 Refinement #5 — filesystem-watch + per-mission daemon-watcher; supersedes v2.2 cooperative-tick model)

**v3.0 substrate model: on-disk POSIX-style locks with TTL + per-mission daemon-watcher process via Node `fs.watch` API.** Per-mission daemon (NOT global daemon).

**Why the model shifted v2.5 → v3.0:** v2.5 cooperative-tick model assumed operator runs CLI ops; cadence-tick fired AFTER each op under the existing mission-lock. Round-3 refinements established **engineer-git-less workspace-hypervisor framing** — engineer interacts with workspace via filesystem only; never invokes CLI ops mid-mission. Cooperative-tick has no operator-op-activity to wrap. Filesystem-watch model fills the gap: engine watches workspace edits + fires wip-commits + bundle-snapshots on debounce.

**Lock semantics:**
- `<workspace>/locks/missions/<missionId>.lock` is a stateful marker file: JSON-encoded LockfileState (v3.3 fold per MEDIUM-R3.4 — schema updated for v3.x daemon-watcher + IPC fields):
  ```typescript
  interface LockfileState {
    readonly pid: number;                          // daemon-watcher pid (or operator-CLI pid for brief acquires)
    readonly startTime: number;                    // v3.2 fold per pid-reuse mitigation; epoch-ms; verified via `ps -p <pid> -o etimes=` per MEDIUM-R3.1
    readonly acquiredAt: string;                   // ISO-8601
    readonly expiresAt: string;                    // ISO-8601 (TTL-sliding; default 24h validity-ms)
    readonly pendingFlushBeforeComplete?: boolean; // v3.2 fold per MEDIUM-R2.1; CLI sets to trigger Step 1 daemon-flush before publish-loop
    readonly pendingTick?: boolean;                // v3.1 fold per MEDIUM-R1.7; CLI sets to trigger explicit `msn tick` flush
    readonly abandonInProgress?: boolean;          // v3.5 fold per MINOR-R5.2; set at abandon-flow Step 2 entry; cleared at Step 4 lock-release (lockfile deleted). Concurrent CLI invocation against this mission MUST detect this flag + skip dead-pid daemon-respawn (avoids spawning daemon mid-abandon-flow).
  }
  ```
- Lockfile persists between operator-CLI invocations as the **active-mission marker** during `started`/`in-progress` lifecycle states.
- Each operator-CLI invocation that needs to mutate mission state acquires the mission-lock briefly (extends `expiresAt` via TTL-sliding-window per acquire); releases on operation-completion. "Retained for lifecycle" is the LOCKFILE PERSISTENCE semantic — NOT a long-held active-process hold.
- Lock-acquire mechanism: POSIX `O_EXCL` create on the lockfile if absent; if present, read its `expiresAt`; if expired → atomic-takeover via POSIX `link(2)` primitive (v2.3 fold per MEDIUM-R3.3 — closes lost-update race under concurrent expired-detection):
  1. Process writes proposed-takeover state (new pid + extended expiresAt) to `<lockfile>.<pid>.tmp`
  2. POSIX `link(2)` atomic-creates the lockfile (link target → tmp file inode); same atomicity guarantee as `O_EXCL`
  3. On link success → takeover complete; clean up `<lockfile>.<pid>.tmp` (now hard-linked from final lockfile)
  4. On EEXIST → another concurrent expired-detection won the race; clean up tmp + retry per `waitMs` (respect existing holder)
- If not expired → respect existing holder; respect `waitMs` per `acquireMissionLock` API.
- Default TTL: 24h sliding window (`MSN_LOCK_VALIDITY_MS` per §2.4 precedence chain). Each acquire extends expiresAt = now + 24h.
- Same model applies to scope-locks + repo-locks.

**Cadence-tick semantics (v3.0 — filesystem-watch model):**

- §2.6.1 wip-cadence (default 30s) + §2.6.2 snapshot-cadence (default 5min) are **filesystem-watch-debounced** — fired by per-mission daemon-watcher process listening on workspace via Node `fs.watch` API.
- **Daemon-watcher lifecycle (v3.1 fold per HIGH-4 + HIGH-5 + HIGH-6 + MEDIUM-R1.4):**
  - **Spawn (NEW Step 7' inserted into 8-step transition; v3.1 fold per HIGH-4):** AFTER Step 6 (mission-state-yaml-persist as `started`), BEFORE Step 7 (release transition-pseudolock): engine spawns detached daemon-watcher process via `child_process.spawn({ detached: true, stdio: 'ignore' })`; daemon writes its pid to lockfile (extends TTL); enters watch-loop. On spawn-failure → rollback: release locks; mission stays `configured` (per existing preserve-config invariant). Step 7 then releases transition-pseudolock (mission-lock RETAINED in lockfile with daemon-pid recorded). 8-step renumbers to **9-step** for v3.1 (Step 1 → Step 9).
  - **Lock-holder model (v3.1 fold per HIGH-5 — advisory coordination, not blocking-hold):** lockfile is shared metadata; daemon's pid identifies active holder for crash-detection. Operator-CLI ops (e.g., `msn update <id> tag-set`) co-exist via advisory coordination — daemon detects CLI-acquire (lockfile-mtime-watch); yields briefly during CLI-mutation; resumes after. Lockfile is NOT a long-held active-process hold; daemon writes pid for liveness-check only.
  - **Dead-pid detection (v3.1 fold per HIGH-6 — immediate detection, not 24h TTL):** every operator-CLI invocation against a `started`/`in-progress` mission performs:
    1. **v3.6 fold per MEDIUM-R6.1 — mission-config preflight (covers Steps 5-8 post-lock-release):** read mission-config; if `lifecycle-state === 'in-progress'` AND `abandonProgress` is SET (any non-undefined value) → mission is in abandon-flow; dispatch per concurrent-CLI dispatch logic at §2.4.1 abandon-flow (allow `msn abandon` retry; allow read-only ops; reject mutating ops with MissionStateError); skip remaining lockfile-based detection steps (lockfile may be deleted post-Step-4).
    2. Read lockfile; extract daemon-pid + expiresAt + abandonInProgress (v3.5 fold per MINOR-R5.2)
    3. Check pid alive via `process.kill(pid, 0)` (POSIX kill-with-0; returns 0 if alive; throws ESRCH if dead)
    4. **v3.5 fold per MINOR-R5.2 — abandon-flow Steps 2-4 concurrent-CLI race guard:** if `lockfile.abandonInProgress === true` AND pid is dead → **DO NOT respawn daemon**; emit `MissionStateError("mission <id> is in abandon-flow; concurrent operation rejected; wait for abandon to complete OR retry msn abandon to resume")` + exit. Closes the abandon-mid-flow concurrent-CLI race where Step 2 (SIGTERM) leaves dead-pid in lockfile until Step 4 (lock-release); without this guard, concurrent CLI invocation between Step 2 and Step 4 would respawn daemon mid-abandon-flow + conflict with cleanup-steps. (v3.6 fold per MEDIUM-R6.1: lockfile-based check covers Steps 2-4 only; mission-config-based check at Step 1 covers Steps 5-8.)
    5. If pid dead AND abandonInProgress is not set AND abandonProgress is not set → **immediate take-over**: respawn daemon (or operator-prompt "daemon died; respawn? [Y/n]"); reset lockfile pid; mission resumes; logged as "daemon-respawned-after-crash" event
    6. If pid alive but expiresAt > now → respect existing holder; CLI yields per cooperative-coordination
    7. If expiresAt < now → take-over per existing TTL-expired path (link(2) atomic per v2.3 MEDIUM-R3.3)
    Engineer doesn't wait 24h; crash-detection is sub-second.
  - **Lifetime:** watcher runs for mission's started/in-progress duration; dies on `complete`/`abandon` via SIGTERM signal (per MEDIUM-R1.4 IPC mechanism — see below).
  - **TTL-keepalive:** watcher periodically (every `validityMs / 4`; default 6h for 24h TTL) extends lockfile expiresAt; prevents stale-lock-takeover during active long-running missions.

- **Daemon ↔ CLI IPC mechanism (v3.1 fold per MEDIUM-R1.4):**
  - **Shutdown (complete/abandon):** CLI reads daemon-pid from lockfile; sends SIGTERM. Daemon registers signal-handler for graceful-shutdown: flush pending wip-commits + bundle-snapshot; release lockfile; exit. CLI proceeds with publish-flow (per §2.4.1 complete-step-sequence).
  - **Tick-trigger (`msn tick <id>` explicit):** CLI updates lockfile state-field (e.g., adds `pendingTick: true` JSON field); daemon polls lockfile-mtime-watch; detects + flushes pending debounce-buffer + fires tick atomically + clears `pendingTick`. Lockfile-state-watch is the IPC channel.
  - SIGTERM is standard for daemon-shutdown (well-understood; standard Unix); lockfile-state-watch handles nuanced tick-trigger where signal-based would be too coarse.
- **Watcher loop:**
  1. `fs.watch(workspaceRoot, { recursive: true })` for filesystem-modify events
  2. Debounce-window (`wip-cadence-ms` default 30s): collect modify events; suppress noise (file-save-storms; editor-tmp-file churn)
  3. On debounce-fire: acquire mission-lock briefly; check `last-wip-commit-time`; if > `wip-cadence-ms` ago → fire `commitToRef` per §2.6.1; release lock.
  4. Snapshot-cadence (`snapshot-cadence-ms` default 5min): fire `git bundle create` per §2.6.2 on similar debounce-pattern.
  5. Continue until terminal-signal received.
- **Single lock-cycle invariant (v3.0 retained from v2.4 MINOR-R4.3):** wip-commit + snapshot-write fire UNDER mission-lock acquired briefly; release after; not held continuously by watcher.

**Filesystem-watch debounce details:**
- File-modify events that match `.gitignore` patterns → ignored (don't trigger debounce-fire)
- `.git/` directory writes → ignored (engine's own writes don't recursively trigger)
- Editor temp-files (`.swp`, `.tmp`, `~` suffix) → ignored
- Default debounce: 30s of "no events" before firing wip-commit (`wip-cadence-ms` operator-config-overridable)
- **Filesystem-watch primitives via chokidar (v3.1 fold per MEDIUM-R1.3):** v1 ships with `chokidar` runtime-dependency (~300KB; battle-tested cross-platform fs-watch wrapper used by webpack/vite/etc.) instead of raw Node `fs.watch`. Reasoning:
  - Node 22+ `fs.watch({recursive: true})` has caveats on Linux (event-coalescing under high churn; max-user-watches sysctl tuning for very-large workspaces); chokidar handles these edge cases
  - Cross-platform inotify (Linux) / FSEvents (macOS) parity already provided by chokidar
  - De-facto standard; engineers familiar with debounce + ignore-pattern semantics
  - Adds chokidar to runtime-deps in §2.9.1 package.json (small dep cost; substrate-currency win)
  Daemon-watcher uses `chokidar.watch(workspaceRoot, { ignored: [/.git/, /\.swp$/, /\.tmp$/, /~$/], persistent: true, awaitWriteFinish: { stabilityThreshold: 30000, pollInterval: 100 } })`; `awaitWriteFinish.stabilityThreshold = wip-cadence-ms` (30s default) provides built-in debounce.

**Operator-explicit tick (`msn tick <id>` retained from v2.0):**
- Fires wip-tick + snapshot-tick on-demand, regardless of debounce-window state
- Useful when watcher-debounce hasn't fired yet but operator wants explicit-capture (pre-Phase-X-checkpoint, etc.)
- Composes with v3.0 daemon: tickMission CLI signals daemon (via lockfile-state-watch OR Unix domain socket); daemon performs tick + acks

**Mid-mission state-mutation (`msn update <id> <field>` invocations DURING started state):**
- CLI invocation acquires mission-lock briefly; daemon-watcher temporarily yields lock; CLI mutates config; releases; daemon resumes
- Lockfile-coordination: CLI-side acquire bumps lockfile expiresAt; daemon detects lock-acquire-by-other-pid (lockfile-mtime-watch); daemon waits + re-acquires after CLI releases
- Concurrent CLI + daemon under same TTL window — coordination via lockfile (advisory; not adversarial)

**Daemon-watcher robustness:**
- **Watcher crash recovery:** if daemon process crashes mid-mission, lockfile TTL eventually expires; next `msn` invocation against the mission detects expired lock + can take-over (via `link(2)` primitive per v2.3 MEDIUM-R3.3) OR operator explicitly restarts via... TBD spec — NEW reserved-verb candidate `msn resume <id>` for operator-explicit watcher-respawn?
- **OS-shutdown / system-reboot:** daemon dies; mission-state on-disk is durable (wip-branch + bundle-snapshot per §2.6); on next operator session, mission shows `lifecycle-state: started` (was active); daemon can be respawned via `msn resume <id>` (NEW; deferred to round-1 audit ask)
- **Multiple concurrent missions:** N missions started → N daemon-watcher processes running concurrently; each holds its own mission-lock; resource cost: N × small Node process per active mission (acceptable for v1 operator-targeting envelope ~10-100 concurrent missions)

**v3.x evolution path (deferred):**
- v3.x can add `msn resume <id>` reserved-verb for daemon-watcher respawn after crash/reboot
- v3.x can add push-cadence to operator-config (`defaults.push-cadence-ms`) for continuous-remote-backup; daemon-watcher fires `git push mission/<id>` on push-cadence
- v3.x can add system-level daemon-mode (`msn daemon start` global-process) for adapter-driven-multi-mission concurrent management; supersedes per-mission daemon if scale demands
- Strict-1.0 commits the v1 per-mission daemon-watcher model; system-daemon would be ADDITIVE evolution

**Reserved-verbs at v3.0 (Round-3 changes):** `tick` (v2.0 added; retained — explicit operator-trigger for forced cadence); `git` REMOVED (Refinement #1 engineer-git-less); `status` REMOVED (Refinement #2 list+show collapse); `workspace` ADDED (Refinement #6 path-resolution).

**v3.1 fold composability notes:**

- **`tick` + daemon coordination (v3.1 fold per MEDIUM-R1.7):** explicit `msn tick <id>` invocation signals daemon via lockfile-state-watch (sets `pendingTick: true` JSON field); daemon detects via lockfile-mtime-watch + flushes pending debounce-buffer + fires tick atomically + clears `pendingTick`. Closes race-window where explicit tick + daemon-watcher could double-fire OR conflict. Composes with MEDIUM-R1.4 IPC mechanism.

- **`--retain` + daemon-death on terminal (v3.1 fold per MINOR-R1.2):** `--retain` preserves workspace bytes for forensic-history; daemon dies on terminal-state via SIGTERM regardless. Engine treats retained workspace as read-only artifact post-terminal; no daemon spawned for read-only inspection; operator-edits to retained workspace not auto-captured (no daemon firing wip-commits). For continued mission work, operator must create new mission. Documented as v1 operator-targeting boundary.

- **`apply(config)` SDK supersedes v1.5 MEDIUM-R4.6 id-validation (v3.1 fold per MEDIUM-R1.5):** v3.0 SDK signature `apply(config: MissionConfig)` drops the `id` parameter from v1.5's `applyMission({ id, config })`. `config.mission.id` is the single truth-source. v1.5 MEDIUM-R4.6 id-vs-config.mission.id mismatch-check is SUPERSEDED by v3.0 SDK-shape (no two-source-of-truth ambiguity to mismatch). Migration impact for v2.5 → v3.0 SDK consumers: object-shape change in addition to method-name change (`applyMission({id, config})` → `apply(config)`).

- **`workspace()` error class (v3.1 fold per MEDIUM-R1.8):** errors with `MissionStateError("workspace not available; mission is in <state> state. Workspaces are accessible during 'started'/'in-progress' states; or in terminal states with --retain set at start.")` on pre-`started` (no workspace allocated) OR terminal-without-`--retain` (workspace destroyed). Composes with existing pattern for state-violations.

- **`MissionMutation` runtime state-restriction enforcement (v3.1 fold per MEDIUM-R1.6):** `MissionMutation` discriminated-union commits the mutation-shape at TYPE-level; runtime per-state-restriction validation per §2.4.1 per-field state-restriction matrix; SDK throws `MissionStateError("update <kind> not allowed on <state> mission")` on state-violation. Type-system ensures shape-correctness; runtime ensures state-correctness. Defense-in-depth.

- **`tick` 3-return-shape under daemon-model (v3.1 fold per MINOR-R1.4):** v2.x 3-return-shape semantics retained at v3.0 — pre-`started` → both undefined (no-op gracefully); started/in-progress + cadence-fired → either/both populated; cadence-not-due → both undefined. Under daemon-model, "cadence-not-due" means daemon already handling cadence; explicit `tick` flushes pending debounce-buffer + fires regardless (operator-override semantic); composes with MEDIUM-R1.7 daemon-IPC.

- **`msn resume <id>` reserved-verb DEFERRED to v3.x (v3.1 fold per MINOR-R1.1):** auto-detection (per HIGH-R1.6 immediate dead-pid check at every operator-CLI invocation) covers most crash-recovery; explicit `resume` verb adds CLI complexity. v3.x can add if explicit-control demand emerges. Reserved-verb count stays at 13 at v3.0.

- **Verb count verification (v3.1 fold per MINOR-R1.5):** `create / list / show / start / apply / update / complete / abandon / tick / scope / workspace / config / --help / --version` = 12 verbs + 2 flags = 13 entries. v3.0 status header confirmed 13.

**v3.2 fold composability notes:**

- **Daemon log-path (v3.2 fold per MEDIUM-R2.3):** daemon redirects stdout/stderr to `<workspace>/missions/<id>/.daemon.log` via `fs.openSync(logPath, 'a')` + pass fd as stdio to spawn. Logs: spawn-event; debounce-fires; wip-commit-events; snapshot-events; signal-receipt; shutdown-event. Operator-DX: `tail -f <workspace>/missions/<id>/.daemon.log` for live monitoring. Log-rotation deferred to v3.x (operator-targeting note: log-size growth on long-running missions; rotate manually OR rely on v3.x).

- **Pid-reuse mitigation via lockfile-startTime (v3.2 fold + v3.3 fold per MEDIUM-R3.1 — POSIX-portable primitive):** lockfile carries `daemon.startTime` (epoch-ms; recorded at daemon-spawn). HIGH-6 dead-pid detection extends: after `process.kill(pid, 0)` returns 0 (pid alive), engine verifies process-start-time via **POSIX-portable `ps -p <pid> -o etimes=`** (elapsed-time in seconds since process-start; works uniformly on Linux + macOS):
  ```javascript
  const etimes = parseInt(execSync(`ps -p ${pid} -o etimes=`).trim(), 10);
  const processStartMs = Date.now() - etimes * 1000;
  const tolerance = 5000; // 5sec for clock-skew + ps-rounding
  if (Math.abs(processStartMs - lockfileStartTime) > tolerance) {
    // pid was reused; treat as dead → respawn
  }
  ```
  Single subprocess-spawn (~10ms); cross-platform-uniform; no `/proc` parsing or platform-specific date-parsing. Closes pid-reuse edge case under v1 OS-support boundary Linux+macOS. (v3.3 fold simpler than original `/proc/<pid>/stat` Linux + `ps -o lstart` macOS approach per MEDIUM-R3.1.)

- **GitEngine.squashCommit interface extension (v3.2 fold per round-2 ask 4):** GitEngine pluggable interface (§2.1.4) gains optional `squashCommit(repoPath, baseRef, headRef, message): Promise<string>` method. Default `IsomorphicGitEngine` implementation shells out to `git merge --squash` (parallel to §2.6.2 bundle-ops native-git breach pattern). 3rd-party GitEngine implementations CAN override with pure-TS squash-via-low-level-primitives if desired. Engine-internal squash-step calls `gitEngine.squashCommit(...)` per pluggable-abstraction discipline; bypass-of-pluggable only if 3rd-party returns `UnsupportedOperationError` → fallback to engine-internal shell-out.

- **Advisory yield semantic (v3.2 fold per round-2 ask 6):** "yield" means daemon DOES NOT fire NEW debounce-flush during CLI-acquire window; in-flight wip-commit (if any) completes (cannot abort mid-write per atomicity). Specifically: daemon detects lockfile-mtime-change (CLI acquires); daemon's chokidar event-handler queues new events but does NOT trigger commitToRef while lockfile-state shows CLI-acquire-active; daemon resumes flush-eligibility post-CLI-release. Cooperative-coordination via lockfile-state, not adversarial lock-contention.

- **publishStatus field-lifecycle (v3.2 fold per round-2 ask 7):** populated during `complete` execution; persists in mission-config indefinitely post-terminal-success (forensic-history; aligns with v1.5 MEDIUM-R4.5 terminal-state preserve-config-and-symlink default). Cleared only on `--purge-config` (along with config + symlink). v3.x can add `publishStatus-history` for multi-attempt audit-trail if demand emerges.

- **publishMessage field-immutability (v3.2 fold per MEDIUM-R2.6):** `mission.publishMessage` persisted at first `complete` invocation; immutable post-write; idempotent retry uses persisted message; new message-arg ignored with operator-warning. Add to §2.5 mission-config schema.

- **--retain + Step 6 local-branch preservation (v3.2 fold per MINOR-R2.1):** if `--retain` set at start, publish-flow Step 6 PRESERVES local mission-branch in retained workspace (engineer can `git log mission/<id>` for forensic-history). Default behavior (no --retain): local branch deleted post-publish.

- **SIGINT operator-cancellation mid-publish-loop (v3.2 fold per MINOR-R2.2):** CLI catches SIGINT; updates `publishStatus[<current-repo>]` to `'failed'` (not `'pending'`); exits with code 130 (standard SIGINT). Mission stays `in-progress` (NOT `completed`); operator retries `msn complete <id>` (uses persisted publishMessage per MEDIUM-R2.6). Daemon stays running (no SIGTERM).

- **publish-status zod validation (v3.2 fold per MINOR-R2.3):** `publishStatus: z.record(z.string(), z.enum(['pending', 'squashed', 'pushed', 'pr-opened', 'failed'])).optional()` in MissionConfigSchema. Additive-only schema; no schema-version bump.

- **apply mid-mission interaction with publishStatus (v3.2 fold per MINOR-R2.4):** `apply(config)` mid-mission with new repo added to `mission.repos[]`: applyMission DOES NOT clear publishStatus; retry processes ALL repos in mission.repos[] including newly-added (added to publishStatus as `'pending'` at retry-time). Composes with refinement #3 additive-only post-start.

- **workspace() warning on terminal-retain (v3.2 fold per MINOR-R2.5):** SDK + CLI log warning on `workspace()` invocation for `completed`/`abandoned`-with-`--retain` missions: `"WARNING: workspace returned for terminal mission <id>; daemon no longer watches; edits will NOT be auto-captured. Use this workspace as read-only artifact."`. Closes operator-confusion surface; UX hint only.

**v3.3 fold composability notes:**

- **GitEngine.squashCommit interface added at §2.1.4 (v3.3 fold per HIGH-R3.1):** optional method `squashCommit?(workspace, baseRef, headRef, message): Promise<string>` declared on GitEngine interface; capabilities-gated per F13 throws-on-unsupported pattern. Default `IsomorphicGitEngine` implementation: shells out to `git merge --squash` + `git commit -m <message>` returning new commit-sha (parallel to §2.6.2 bundle-ops native-git breach pattern). 3rd-party engines MAY implement pure-TS variant via low-level git primitives (writeBlob + writeTree + writeCommit collapsing wip-history). Engine-internal squash-step at §2.4.1 publish-flow Step 2 dispatches via `gitEngine.squashCommit(...)`; on `UnsupportedOperationError` falls back to engine-internal shell-out.

- **Step 1 lockfile-state-watch flush timeout fallback (v3.3 fold per round-3 ask 1):** if Step 1 daemon-flush-acknowledgment timeout (30s) expires, CLI logs warning + proceeds to Step 2 publish-loop without daemon-flush-confirmation. Publish-loop is idempotent; can retry. On Step 4 SIGTERM, daemon may be dead → CLI sends SIGKILL fallback per MEDIUM-R2.2 timeout path. Spec at §2.4.1 Step 1 + Step 4 timeout-handling.

- **Step 5 bundle orphan-cleanup (v3.3 fold per round-3 ask 2):** preserved bundle on Step 6 spawn-failure rollback persists indefinitely as forensic-artifact; mission stays `configured`; engine does NOT auto-cleanup. Operator-cleanup paths: (a) `msn abandon <id> "<reason>"` — preserves bundle in retention-window per §2.6.2 default-window (5 + 24h); (b) `msn abandon <id> "<reason>" --purge-config` — deletes config + ALL bundles in `<snapshotRoot>/<missionId>/`. Spec at §2.4.1 Step 6 spawn-failure rollback. **Bundle proliferation (per MINOR-R3.1):** repeated failed-start retries write multiple bundles within retention-window; retention-policy GCes per §2.6.2; operator-targeting note documented.

- **abandonMessage field (v3.3 fold per round-3 ask 3 — separate from publishMessage):** `mission.abandon-message` field added to YAML schema; populated at FIRST `msn abandon` invocation; immutable post-write; symmetric with publishMessage. Two distinct fields for distinct lifecycle events (complete-attempt vs abandon-action). Composes with v1 audit-record discipline. If operator runs `msn complete` (partial-failure; publishMessage persisted) then `msn abandon` (abandonMessage persisted), both fields persist for forensic-history.

- **Daemon-log-path destruction on Step 7 workspace-destroy (v3.3 fold per round-3 ask 4):** `<workspace>/missions/<id>/.daemon.log` is INSIDE the workspace; workspace-destroy deletes log-file. Operator wanting log-history for forensic: use `--retain` flag at `msn start <id> --retain`. Spec at §2.4.1 publish-flow Step 7 + MINOR-R2.5 workspace warning.

- **GitEngine.squashCommit default impl mechanism (v3.3 fold per round-3 ask 6):** `IsomorphicGitEngine.squashCommit` shells out via:
  1. `cd <workspace.path>` → `git checkout <baseRef>`
  2. `git merge --squash <headRef>` (creates index changes; doesn't commit)
  3. `git commit -m <message>` (creates squashed commit with message)
  4. Capture commit-sha via `git rev-parse HEAD`; return.
  Parallel to §2.6.2 bundle-ops native-git breach pattern. Spec at §2.1.4 IsomorphicGitEngine implementation-mapping table.

- **Advisory-yield event-queue OS-bounded (v3.3 fold per MEDIUM-R3.2):** at v1, daemon's chokidar event-buffer is OS-bounded by V8 heap; OOM is the natural cap; no explicit max-queue-size mechanism. Operator-targeting note: "publish-flow > 5min on actively-edited workspace may cause daemon-OOM; restart daemon via `msn tick <id>` post-OOM-recovery + retry complete". v1.x can add explicit max-queue-size + forced-flush during long CLI ops if operator-feedback demands.

- **publishedPRs YAML-persisted (v3.3 fold per MEDIUM-R3.3):** `mission.published-prs[]` field added to mission-config YAML; populated post-PR-open in publish-flow Step 2; persists post-terminal as forensic-history; cleared only on `--purge-config`. zod schema: `publishedPRs: z.array(z.object({ repoName: z.string(), prUrl: z.string().url() })).optional()`. `getMission(id)` reads from persisted-state; no gh-cli round-trip needed.

- **publishStatus / publishedPRs field-lifecycle (v3.3 fold per MINOR-R3.3):**
  - **Pre-`complete`:** both undefined (no publish has occurred)
  - **Mid-`complete`:** publishStatus populated per-repo as steps progress; publishedPRs populated as PRs open
  - **Post-`complete` success:** both fully populated; persist forever (until `--purge-config`)
  - **Post-`complete` partial-failure (mission stays `in-progress`):** publishStatus partial; publishedPRs partial; persists across retry
  - **Post-`abandon`:** publishedPRs undefined OR partial (if abandon hit after partial-complete-attempt); publishStatus may have `'pending'`/`'failed'` for incomplete-publish-attempts that ran before abandon, OR undefined if abandon hit before any complete-attempt
  Operator can inspect via `msn show <id> --output json|yaml` for full state-history.

- **`msn list --status completed` publishStatus column (v3.3 fold per MINOR-R3.2):** default-omit publishStatus from table-view (keeps compact); operator opt-in via `--include-publish-status` flag for tabular OR `--output json|yaml` for structured-output (always includes full publishStatus). Spec at §2.3.2 CLI table for `msn list`.

- **Step 7 atomic-write-failure rollback (v3.3 fold per MINOR-R3.4):** on Step 7 (state-yaml-persist as `started`) atomic-write failure (rare; disk-full): SIGTERM daemon (spawned in Step 6); wait shutdown 60s timeout per MEDIUM-R2.2; release all locks + repo-locks; mission stays `configured`. Partial bundle from Step 5 PRESERVED as forensic-artifact (per round-2 ask 2). Spec at §2.4.1 Step 7 failure-handling.

**v3.4 fold composability notes:**

- **abandon partial-failure recovery model (v3.4 fold per MEDIUM-R4.1; v3.5+v3.6 refined):** symmetric with publish-flow per-repo recovery; uses `mission.abandonProgress` field with values `'tick-fired' | 'daemon-killed' | 'message-persisted' | 'locks-released' | 'branches-cleaned' | 'workspace-handled' | 'config-purged'` per-step state-tracking. Mission stays `'in-progress'` until reaches terminal step; idempotent retry via `msn abandon <id> "<msg>"` resumes from failed step (uses persisted abandonMessage; new arg ignored). abandonProgress field added to MissionState interface + mission-config YAML schema.

- **squashCommit dispatch chain handles both undefined-method AND throws-on-invocation (v3.4 fold per MEDIUM-R4.3):** publish-flow Step 2 squash-step checks `typeof gitEngine.squashCommit === 'function'` AND catches `UnsupportedOperationError` from invocation; falls back to engine-internal shell-out in EITHER case. Handles all 3rd-party engine variations: not-implemented (undefined); implemented-as-throws (UnsupportedOperationError); implemented-properly (returns sha).

- **squashCommit precondition: clean working-tree (v3.4 fold per MINOR-R4.1):** workspace must have no uncommitted changes (engine ensures via publish-flow Step 1 daemon-flush). Race-edge-case: operator-edit lands DURING Step 1 flush + BEFORE Step 2 squash → working-tree dirty → checkout fails → `MissionStateError("workspace dirty post-flush; retry msn complete to refresh state")`. Operator-retry flushes new edits + retries squash. Documented at §2.1.4 implementation-mapping table squashCommit row.

- **publish-message + abandon-message coexistence (v3.4 fold per MINOR-R4.2):** clean lifecycle has only ONE field populated (completed-success → publishMessage; abandoned-only → abandonMessage). Mixed lifecycle: BOTH fields populated when operator partial-fail-completes then abandons. Both preserved as forensic-history; cleared only on `--purge-config`. Documented at §2.5 schema docstring.

- **Step-sequence cross-section reference precision (v3.4 fold per MINOR-R4.3):** §2.4.1 contains TWO step-sequences with overlapping numbering — 9-step `configured → started` transition + 8-step publish-flow. Cross-section references prefix with sequence-name explicitly: "9-step transition Step 5" / "publish-flow Step 5". Reader-DX improvement; cosmetic.

- **IsomorphicGitEngine implementation-mapping table updated (v3.4 fold per MEDIUM-R4.2):** added row for `squashCommit` per cross-fold render-gap closure. 3rd-party engines see explicit dispatch + override-mechanism documentation.

**v3.5 fold composability notes:**

- **abandon-flow atomic terminal lifecycle-advance (v3.5 fold per MEDIUM-R5.1):** v3.4 had `lifecycle-state: 'abandoned'` advance at Step 3 alongside abandonMessage persist; this contradicted the terminal-immutability rule (state-machine table: `'completed'/'abandoned'` reject all mutations including idempotent-retry of `msn abandon`). v3.5 reverts: Step 3 persists abandonMessage ONLY (renamed progress-marker `'message-persisted'`); mission stays `'in-progress'` throughout cleanup-flow; lifecycle-state advances ATOMICALLY at NEW terminal Step 8 (after final cleanup-step succeeds). Symmetric with publish-flow (publishStatus tracks per-repo partial-state until ALL succeed; lifecycle-state advances to `'completed'` ONCE atomically). Closes the v3.4 contradiction → idempotent-retry never hits terminal-immutability error mid-flow.

- **abandon-flow per-repo cleanup granularity (v3.5 fold per MEDIUM-R5.2):** v3.4 abandon-flow Step 5 had per-step `abandonProgress = 'branches-cleaned'` granularity but no per-repo state — operator couldn't see which repo cleanup failed. v3.5 adds `mission.abandonRepoStatus: Record<string, 'pending' | 'cleaned' | 'failed'>` field — symmetric with publishStatus discipline. Step 5 attempts cleanup per-repo; on failure marks `'failed'` and continues (NOT abort); abandonProgress advances to `'branches-cleaned'` only when ALL repos = `'cleaned'`. Idempotent retry re-attempts only `'failed'` or `'pending'` repos. Granular operator-DX visibility via `getMission(id).abandonRepoStatus`.

- **abandonProgress final-value lifecycle documentation (v3.5 fold per MINOR-R5.1; v3.6 marker rename per MINOR-R6.2):** added MissionState docstring enumerating final-value semantics (undefined / 'workspace-handled' / 'config-purged' / mid-flow values). Closes operator-DX confusion on retrieved-state interpretation; clarifies that `'config-purged'` is transient (never observed in stable terminal state because config + field both deleted at Step 7). v3.6 renamed `'workspace-destroyed'` → `'workspace-handled'` for `--retain`-aware semantic (Step 6 marker indicates completion regardless of destroy vs preserve).

- **abandonInProgress lockfile flag (v3.5 fold per MINOR-R5.2):** NEW transient field on LockfileState set at abandon-flow Step 2 entry; cleared at Step 4 lock-release (lockfile deleted). Concurrent CLI invocation between Step 2 (SIGTERM-leaves-dead-pid) and Step 4 (lock-release) detects this flag + skips dead-pid daemon-respawn with `MissionStateError("mission <id> is in abandon-flow; concurrent operation rejected")`. Closes the abandon-mid-flow concurrent-CLI race; composes with HIGH-R3.1-style dead-pid detection without conflict.

**v3.6 fold composability notes:**

- **Concurrent-CLI dispatch logic for abandon-flow Steps 5-8 post-lock-release (v3.6 fold per MEDIUM-R6.1):** v3.5 abandonInProgress lockfile flag covers Steps 2-4 only (lockfile deleted at Step 4 release). Steps 5-8 window (post-lock-release) needs a durable in-flight signal; mission-config `abandonProgress` field serves this purpose — survives lockfile-delete; signals "abandon-flow in progress; do not respawn daemon; route per abandon-flow dispatch logic". Dead-pid detection extended to 7-step ordered checks: Step 1 mission-config preflight (covers Steps 5-8); Steps 2-4 lockfile preflight (covers Steps 2-4 + crashed-daemon); Steps 5-7 existing TTL/respawn logic. Concurrent-CLI dispatch: `msn abandon` retry → idempotent resume; read-only ops → allowed; mutating ops → rejected with MissionStateError. Together with abandonInProgress lockfile flag, full coverage achieved across all abandon-flow steps. Closes post-Step-4 race surface where engine's ongoing cleanup-steps would conflict with respawned daemon.

- **Atomic single-lock-cycle integration for terminal lifecycle-advance (v3.6 fold per MINOR-R6.1):** v3.5 had separate Step 8 "atomic-advance lifecycle-state" with disjunctive "OR persist within Step 6/7 transaction" — implementation-choice ambiguous + race-window between Step 7 release and Step 8 re-acquire. v3.6 commits to integrate: Step 6 (workspace-handle) re-acquires mission-lock briefly + workspace-handle + atomic-write `lifecycle-state: 'abandoned'` + `abandonProgress = 'workspace-handled'` under SAME lock-cycle. Step 7 (`--purge-config`) re-acquires lock briefly for config-delete (lifecycle moot — config gone). Step 8 demoted to marker-only (lifecycle already advanced at Step 6). Eliminates separate Step 8 lock-cycle; matches existing single-lock-cycle invariant (cadence-tick under existing lock).

- **`'workspace-handled'` marker semantic (v3.6 fold per MINOR-R6.2):** v3.5 had `'workspace-destroyed'` marker but `--retain` preserves workspace despite the marker name; operator inspection of `getMission(id).abandonProgress === 'workspace-destroyed'` AND seeing workspace exist on-disk caused confusion. v3.6 renamed to `'workspace-handled'` for `--retain`-aware semantic — Step 6 marker indicates step-completion regardless of destroy (default) vs preserve (`--retain`). Cross-fold rename across MissionState interface + §2.5 YAML schema example + §2.4.1 abandon-flow + §2.6.5 fold-notes; §8 historical status rows preserved unchanged for record integrity.

##### §2.6.5.v4 Multi-participant daemon-watcher extensions (v4.0 NEW + v4.4 substrate-fixes; INLINE-FLATTEN of §2.10.10 anchor-prose)

**v4.0 reader-daemon mode (v4.4 fold per MEDIUM-R1.2 inline-flatten):**

Reader-side daemon-watcher process model is parallel to writer-side (k8s-shape uniformity per Lean 4) but runs **TWO distinct loops** (v4.4 fold per MEDIUM-R2.1 — closes chokidar conflation):

**Loop A — Filesystem-watch (chokidar) — reader-variant:**
- `chokidar.watch(<reader-workspace>, { ignored: ['**/.git/**', '**/.daemon.log', '**/.daemon-state.yaml', '**/.daemon-tx-active', 'locks/**'] })` on the reader's per-principal workspace (v4.5 fold per MINOR-R6.1 — glob patterns explicitly anchored with `'**/'` prefix for unambiguous match across chokidar versions; `.daemon-tx-active` sentinel-file added per MEDIUM-R2.1 fold to suppress fs-events during engine-internal Loop B extract-window)
- Trigger-action: detect operator tamper of 0444 files (mtime change OR mode change). On fire → emit `MissionStateError("read-only participant; reject")` to operator-DX; rollback workspace to last-synced wip-state via Loop B fetch + checkout-index re-application (force-restore 0444 mode on all files)
- Distinct from writer-mode trigger-action (writer fires wip-commits on debounce); reader fires rollback on tamper-detect

**Loop B — Coordination-remote timer-poll:**
- Node `setInterval(<wipCadenceMs>, ...)` — default 30s per scope-item #3 single-knob (`wip-cadence-ms`)
- Each tick: `git fetch --tags <coord-remote> 'refs/heads/<repo>/wip/<id>:refs/remotes/coord/<repo>/wip/<id>'` (fetches into refs-only; no working-tree write; `--tags` per MINOR-R6.2 to fetch tag-objects for cascade-mechanism + config-update detection)
- If fetched ref differs from current → apply via **engine-internal tree-extraction** (v4.5 fold per MEDIUM-R6.2 — replaces v4.0 anchor-prose `git pull --ff-only` which fails against 0444; replaces v4.4 `git checkout-index` mechanism which operated on INDEX not on fetched ref):
  ```bash
  git archive --format=tar refs/remotes/coord/<repo>/wip/<id> | \
    tar -xC <reader-workspace>/missions/<id>/<repo>/ --mode=0444
  ```
  Cleanest tree-extraction: `git archive` materializes the tree from a fetched ref (no INDEX manipulation; no working-tree git-state); pipe through `tar -x` with `--mode=0444` engine-controlled file-mode; preserves strict-enforce invariant atomically. **Prerequisite:** chmod working-tree to writable (`chmod -R u+w`) BEFORE tar-extract (tar can't overwrite 0444 files); engine sets back to 0444 via tar's `--mode` flag. Brief writable-window inside engine-internal step is acceptable (chokidar Loop A ignores writes within engine-internal step via `<workspace>/missions/<id>/.daemon-tx-active` sentinel-file marker — engine creates before extract; removes after; Loop A ignores fs-events while sentinel exists).
- On fetched terminal-tag detection (`refs/tags/missioncraft/<id>/terminated`): fire reader-side state-transition `reading → readonly-completed` per HIGH-R2.3 cascade-mechanism; reader-daemon enters quiescent mode (no further fetches; preserves last-synced state for forensic-history)
- On fetched config-update tag (`refs/tags/missioncraft/<id>/config-update`): re-fetch mission-config from coord-remote; apply to per-principal config-file. **v4.5 fold per MINOR-R6.2 — tag-mechanism spell-out:**
  ```bash
  # Step 1 (already in tick): git fetch --tags <coord-remote> (fetches tag-objects + pointed-to commits)
  # Step 2 (on tag-mtime change detected): writer pushes mission-config to dedicated branch refs/heads/config/<id>
  # AND fires config-update tag pointing to same commit; reader fetches branch + tag together; reads from branch's tip
  git fetch <coord-remote> 'refs/heads/config/<id>:refs/remotes/coord/config/<id>'
  # Step 3: extract mission-config blob from fetched-tree
  git show 'refs/remotes/coord/config/<id>:config/<id>.yaml' > <reader-workspace>/config/<id>.yaml.tmp
  # Step 4: atomic-write per MEDIUM-11
  fs.rename('<reader-workspace>/config/<id>.yaml.tmp', '<reader-workspace>/config/<id>.yaml')
  ```
- Fetch-failure: log warning to `<workspace>/missions/<id>/.daemon.log`; retry-on-next-cadence (transient network-failures recover automatically)

**Reader-side dead-pid detection 7-step sequence:** parallel to writer-side per HIGH-R1.3 per-principal lockfile naming (`<workspace>/locks/missions/<id>.<principal>.lock`). Reader-CLI runs detection against reader's lockfile only; no cross-principal lockfile-read.

**Reader-side spawn (7-step `joined → reading` transition):** per `msn join <id> --coord-remote <url>` — see §2.4.1.v4 fold below for full step-sequence.

**v4.0 writer-side push-on-cadence-conditional (v4.4 fold per MEDIUM-R1.9 + MEDIUM-R2.4):**

Writer-side daemon-watcher loop (existing v3.6 §2.6.5) extended with conditional coord-remote push **OUTSIDE the brief lock-cycle**:

1. wip-cadence-tick fires: acquire mission-lock briefly; check `lastWipCommitTime`; if > `wip-cadence-ms` ago → fire `commitToRef` per §2.6.1; **release lock**
2. **(NEW v4.0; v4.5 fold per MEDIUM-R6.1 — refspec source-vs-destination correction):** if `mission.participants[]` contains ≥1 reader → fire `git push <coord-remote> 'refs/heads/wip/<id>:refs/heads/<repo-name>/wip/<id>'` async **outside lock-cycle** (push duration unbounded by network-latency does NOT block concurrent CLI ops on the lockfile). **Note source ≠ destination**: local writer-repo's wip-branch lives at `refs/heads/wip/<mission-id>` per v3.6 §2.6.1 (no `<repo-name>/` prefix; repo implicit from .git/ context); coord-remote namespace is `refs/heads/<repo-name>/wip/<id>` per MEDIUM-R1.10 fold option (a) (`<repo-name>/` prefix added because coord-remote is shared across mission's repos).
3. **(NEW v4.4 per MEDIUM-R2.4; v4.5 fold per MINOR-R6.4 — generalized to ALL config-mutations):** writer-daemon polls mission-config on every cadence-tick to detect ANY config-mutation (config-mtime-watch via `fs.statSync(<config-path>).mtimeMs`); preserves v3.6 LockfileState schema (no `pendingParticipantAdd` field needed; closes the IPC contradiction surfaced at HIGH-R1.3). **On ANY mutation detection** → fire push to coord-remote `refs/heads/config/<id>` branch + fire `refs/tags/missioncraft/<id>/config-update` tag (same commit). This propagates ALL config mutations (`set-tag`, `set-description`, `set-hub-id`, `add-repo`, `set-scope`, `add-participant`, `remove-participant`, `set-coordination-remote`) to readers via single mechanism. **Special-case for `add-participant` reader:** also fire immediate-push backfill of all per-repo wip-branches (out-of-cadence push) so new reader has starting-point on first daemon-poll. Reader-side `msn show <id>` returns current writer-side description/tags/etc. via this propagation discipline (cross-principal config-currency preserved).
4. **Push-failure semantics**: best-effort with retry-on-next-cadence (transient network-failures recover automatically); persistent-failure → emit warning to `<workspace>/missions/<id>/.daemon.log` + update `<workspace>/missions/<id>/.daemon-state.yaml` `lastPushAttemptError` field (engine reads at query-time; merges into MissionState response). Operator-DX visibility via `msn show <id>` reporting `lastPushSuccessAt` field (per M-R3.3 `.daemon-state.yaml` mechanism below)
5. **Durability guarantee**: if writer's OS shuts down with unpushed wip-commits, recovery on next-start re-attempts push; lock-held duration is bounded by local-write only

**v4.4 fold per MEDIUM-R3.3 — `.daemon-state.yaml` mechanism (NEW separate file):**

Daemon-state is persisted in NEW `<workspace>/missions/<id>/.daemon-state.yaml` (separate from mission-config to preserve atomic-write discipline per MEDIUM-11; no per-cadence config-mutation):

```yaml
# .daemon-state.yaml (engine-managed; per-principal; reset on workspace-allocation; cleared on terminal-with-no-retain)
last-push-success-at: "2026-05-10T01:30:45Z"     # writer-daemon updates on successful coord-remote push
last-push-attempt-at: "2026-05-10T01:30:46Z"     # writer-daemon updates on every push attempt (success OR failure)
last-push-attempt-error: "fatal: unable to access 'https://...': SSL connect error"   # absent on success
last-fetch-success-at: "2026-05-10T01:30:48Z"    # reader-daemon updates on successful coord-remote fetch
last-fetch-attempt-at: "2026-05-10T01:30:49Z"
last-fetch-attempt-error: "fatal: unable to access ..."   # absent on success
```

Engine reads `.daemon-state.yaml` at `msn show <id>` query-time + merges into `MissionState` response. Trade-off (per M-R3.3 architect-pick rationale): lost forensic-history post-terminal (file destroyed with workspace per `--retain` semantics) for lighter-weight write-discipline (no mission-config atomic-write overhead per cadence-tick). Operator-DX preserved during in-progress lifetime; post-terminal status acceptable.

**v4.4 fold per MEDIUM-R2.3 — git-clone arg-syntax fix:**

Reader-side spawn Step 4 (clone repos from coord-remote): substrate-mechanism corrected to:

```bash
git clone --branch '<repo-name>/wip/<id>' '<coord-remote-url>' '<reader-workspace>/missions/<id>/<repo-name>'
```

(v4.0 anchor-prose had `git clone --reference <coord-remote> <repo-name>/wip/<id>` which is wrong — `--reference` is for object-database sharing assuming both repos exist locally; the intended operation is clone-with-named-branch from coord-remote URL).

Post-clone: engine sets file-mode `0444` on all working-tree files (recursive `chmod` OR via `git checkout-index --prefix` with engine-overridable mode per MEDIUM-R2.2 mechanism); `0444` strict-enforce invariant established before reader-daemon-watcher spawns.

#### §2.6.6 Commit + push authentication semantics (v3.0 NEW per Round-3 Refinement #8 — clarification-fold)

This section explicitly pins the **temporal + actor semantics** of identity-capture and credential-use across mission lifecycle. Closes implicit-substrate surface that prior versions left under-spec'd.

**Identity-capture timing:**
- `IdentityProvider.resolve()` is invoked AT EACH GIT-OPERATION'S COMMIT-FIRING-TIME — NOT at startMission-time.
- For `LocalGitConfigIdentity` default: reads OS-user's `git config user.name` + `git config user.email` from the calling-process's git-config-resolution-chain (`~/.gitconfig` + repo-local `.git/config` + `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` env-vars per git's standard precedence).
- For 3rd-party IdentityProvider implementations: implementer-specific resolve() semantics; documented as commit-firing-time invocation.

**Wip-commit vs squash-commit attribution divergence:**
- **Wip-commits** fire from per-mission daemon-watcher process (spawned at `msn start`; per §2.6.5). Daemon-watcher process inherits env-vars from `msn start` invocation (OS-user + git-config-resolution-chain). Each wip-commit author = `msn start`-invoker's IdentityProvider-resolved-identity at commit-time.
- **Squash-commit** fires from `msn complete` invocation (per §2.4.1 Order A complete-step-sequence). Squash-commit author = `msn complete`-invoker's IdentityProvider-resolved-identity at commit-time.
- **Divergence case:** if actor-A runs `msn start` and actor-B runs `msn complete`, wip-commit history attributes to A; squash-commit attributes to B. Under default `complete-strategy: squash` (per MINOR-R5.1 dedup-precedence), only B's authorship visible in PR (squash collapses history). Under operator-config `complete-strategy: preserve-history`, A's wip-commits visible alongside B's squash-commit.
- **Best practice:** same actor runs `msn start` + `msn complete`. Engineer's natural workflow takes ownership of mission start-to-finish. Architect-runs-start + engineer-runs-complete creates split-attribution; not recommended at v1.

**Push + PR-creation authentication:**
- All git pushes for a mission use the same `RemoteProvider` instance (per `MissioncraftConfig.remote` OR mission-config `remote.provider` field). **Single RemoteProvider per mission.**
- For `GitHubRemoteProvider` (gh-cli mode): pushes + PR-creation use `gh auth token` from the calling-process's gh-cli config (`~/.config/gh/hosts.yml`). PR-opener attribution = whoever's gh-auth was used.
- For `PureGitRemoteProvider` (null-object; no PR support): pushes use git's native HTTPS-token-helper / SSH-key. No PR-creation.
- PR-creation invocation timing = `msn complete` invocation; PR-opener = `msn complete`-invoker's gh-auth.

**Multi-repo same-credential constraint at v1:**
- All repos in a mission share the same RemoteProvider + same credentials.
- Acceptable for missions within a single GitHub org OR a single operator-accessible-credential-scope.
- For missions spanning **multiple orgs same host** (e.g., `github.com/orgA/*` + `github.com/orgB/*`): operator's gh-cli auth covers both orgs IF operator has access to both — gh-cli's per-host token typically grants access to all orgs the operator is a member of. NO multi-host complexity required for same-host multi-org.
- For missions spanning **multiple hosts** (e.g., `github.com/*` + `git.internal.example.com/*`): operator runs `gh auth login --hostname <host>` per host BEFORE startMission; gh-cli holds tokens for all configured hosts; missioncraft uses whichever host's token matches the repo URL.
- For unauthenticated repos (`file://` OR public-HTTPS-without-auth): no credential needed; works regardless of RemoteProvider config.

**Failure modes:**
- Push fails for repo with no credential access (push-403 OR push-401) → mission stays `in-progress` per partial-failure recovery (per §2.4.1 Order A); engineer fixes credential + retries `msn complete`. Idempotent retry resumes from where it failed.
- PR-creation fails (gh-cli auth expired; gh-cli not authenticated for target repo's org) → same recovery model.
- Authentication errors emit `RemoteAuthError` (existing v1 error class); operator gets actionable error message indicating which repo + auth-state.

**AI-agent-provisioning discipline (operator-side; not missioncraft substrate):**
- AI agents (Claude Code / opencode / etc.) running missioncraft on behalf of an engineer-identity should be provisioned with their own:
  - `git config user.name` + `git config user.email` (set in agent's `~/.gitconfig` OR per-process via `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` env-vars)
  - `gh auth login` resulting in agent-specific token in agent's `~/.config/gh/hosts.yml`
- Agents running as separate OS-users have isolated configs naturally.
- Agents running under the same OS-user need env-var-overrides OR per-process git-config-files (`GIT_CONFIG_GLOBAL=<path>`).
- Existing `LocalGitConfigIdentity.resolve()` already does the right thing — captures the calling-process-context's git-config; no missioncraft substrate change needed for agent-attribution.

**Identity uniformity across mission's repos:**
- Same IdentityProvider invoked for all repos in mission → same commit-author across all repos in single mission.
- Same RemoteProvider invoked for all PR-creations → same PR-opener across all PRs in single mission.
- If divergent attribution is needed (different commit-authors per repo OR different PR-openers per repo), that's two missions. Mission-as-atomic-unit-of-work tele preserved.

**v1.x evolution path (deferred; additive):**
- `RepoSpec.auth?: { provider, ...}` per-repo credential override — for missions spanning credential-scopes that single RemoteProvider can't cover
- Multi-RemoteProvider via named-registry (`MissioncraftConfig.remotes?: Record<string, RemoteProvider>`) — for adapter-driven multi-credential workflows
- Per-mission identity override (`MissionConfig.identity?: { provider, ... }`) — for missions that should attribute to a non-OS-user-default identity

Strict-1.0 commits the v1 single-credential-per-mission + commit-firing-time-identity-capture model; v1.x evolution paths additive.

##### §2.6.6.v4 Multi-participant auth extensions (v4.0 NEW + v4.4 substrate-fixes; INLINE-FLATTEN of §2.10.10 anchor-prose)

**Coord-remote auth (v4.4 fold per HIGH-R1.1 + MEDIUM-R1.6):** Coordination-remote push/pull goes through **GitEngine plain-git wire-protocol** (per §2.1.5 PureGitRemoteProvider clause); RemoteProvider is NOT in coord-remote substrate-path.

- **Cross-host coord-remote (e.g., `https://github.com/<org>/<bare>.git`):** auth via git-native HTTPS-token-helper (typically gh-cli's stored token if installed; OR `git credential.helper` config). Same auth-mechanism as `PureGitRemoteProvider` push/pull.
- **Same-host coord-remote (`file:///path/to/bare.git`):** no auth required; filesystem-permissions only. Operator-side concern: bare repo's parent directory must be writable by writer-principal AND readable by reader-principal.
- **Reader-principal credential-helper config:** reader's daemon does `git fetch` from coord-remote (no commit-author needed since reader doesn't author commits) BUT may need credential-helper config for HTTPS coord-remote. Operator-side concern (consistent with AI-agent-provisioning discipline above).

"Single RemoteProvider per mission" v3.6 invariant PRESERVED — coord-remote isn't a RemoteProvider concern.

**IdentityProvider invocation-context broadening (v4.4 fold per MEDIUM-R4.2):** v3.6 §2.6.6 invariant pinned `IdentityProvider.resolve()` to commit-firing-time only. v4.0 multi-participant broadens this to **query-time invocation** (current-principal precedence-chain Step 3 per §2.3.1 — invoked when SDK queries `MissionRepoState.role` / per-principal projection). Composability:
- **Idempotent + side-effect-free**: v3.6 reference impl `LocalGitConfigIdentity` reads `git config user.name/email` from disk; safe at any time
- **3rd-party `IdentityProvider` implementers SHOULD observe this invariant**: `resolve()` must remain idempotent + side-effect-free + safe to invoke at any time (commit-firing-time, query-time, future-call-sites). Implementers that perform side-effects (e.g., interactive credential prompt) violate this invariant; substrate documents the requirement
- **Email→principal-id coercion**: substrate uses **full-email-verbatim** (per M-R4.2 architect-pick); `IdentityProvider.resolve()` returns `{name, email}`; engine uses `email` field as principal-id directly. No munging. Operator who wants short-form principal supplies via `Missioncraft` constructor or `--principal` flag (per §2.3.1 precedence-chain Steps 1-2)

### §2.7 Test surface (per Q5=b unit + integration; bounded)

#### §2.7.1 Unit tests

- `IsomorphicGitEngine` unit tests — every method (init/clone/branch/commit/push/pull/merge/status); use `memfs` for test isolation
- Pluggable interface contract tests — every default implementation passes the interface contract (e.g., `LocalGitConfigIdentity.resolve()` returns valid `AgentIdentity`)
- Mission-config schema validation tests — valid configs parse cleanly; invalid configs fail with precise error
- CLI argument parser tests — every verb's flag taxonomy parsed correctly

#### §2.7.2 Integration tests

- **End-to-end mission lifecycle:** init → clone (test fixture repo) → branch → commit → push → pull → merge → mission complete; verify workspace destroyed unless `--retain`
- **Mission-config integration:** load YAML config; verify pluggable overrides applied
- **5 targeted-failure-mode tests (v0.2 fold per §B + §H.3):** process-crash + disk-failure + network-partition recovery + cross-mechanism crash (mid-bundle-write while wip-cadence) + lock-timeout-recovery (stale-lock auto-release)
- **Lock semantics:** single-writer-per-mission (concurrent `msn mission start` on same mission → second fails); one-active-mission-per-repo (concurrent `msn mission start` on same repo from different missions → second fails)

#### §2.7.3 Test infrastructure choice

**vitest** per F10 Survey-flag architect-recommendation (OIS-substrate consistency).

### §2.8 Documentation surface (per Q6=b operator-onboarding-priority; bounded)

- **README.md** — what is missioncraft; quick install; quick example; link to getting-started + TypeDoc
- **TypeDoc auto-generated API reference** — published to `github.com/apnex/missioncraft/docs` via GitHub Pages
- **Getting-started tutorial** at `docs/getting-started.md` — step-by-step: install → init → first mission → push → complete

**NOT in v1 docs:** pluggable-extension guide (Q6=b excluded); migration-guide-from-OIS (Q6=b excluded; covered by `docs/methodology/component-migration-playbook.md` per parent F10); architecture-rationale-doc (Q6=b excluded; covered by parent Design + this Survey envelope).

### §2.9 Repo bootstrap

#### §2.9.1 `package.json` (v1.1 reshape — Shape B hybrid + sovereign-module separation per refinements #5+#6)

**Source layout** (per refinements #5 + #6 — internal sovereign-module directories with `-sdk`/`-cli`/`-api` suffix convention):

```
@apnex/missioncraft (single npm package — Shape B hybrid)
├── src/
│   ├── missioncraft-sdk/          ← SDK sovereign module (PRIMARY contract surface)
│   │   ├── index.ts               ← top-level SDK exports (per §2.3.1)
│   │   ├── core/missioncraft.ts   ← Missioncraft class (the SDK class itself)
│   │   ├── core/types.ts          ← SDK-INTERNAL constructor types (MissioncraftConfig, StateDurabilityConfig)
│   │   ├── core/mission-types.ts  ← Mission RESOURCE types (MissionConfig, MissionState, RepoSpec, MissionStatePhase)
│   │   ├── core/mission-config-schema.ts  ← Runtime zod schemas (MissionConfigSchema, RepoSpecSchema) — PARSE/VALIDATE primitives
│   │   ├── core/scope-types.ts    ← Scope RESOURCE types (ScopeConfig, ScopeState, ScopeHandle, ScopeFilter, ScopeStatePhase) — v2.0 NEW per Refinement C
│   │   ├── core/scope-config-schema.ts    ← Runtime zod schema (ScopeConfigSchema) — v2.0 NEW per Refinement C
│   │   ├── core/operator-config-schema.ts ← Runtime zod schema (OperatorConfigSchema) — v1.7 fold per MEDIUM-R6.4
│   │   ├── pluggables/            ← interface types
│   │   ├── defaults/              ← LocalGitConfigIdentity, TrustAllPolicy, etc.
│   │   ├── providers/             ← GitHubRemoteProvider, PureGitRemoteProvider
│   │   ├── errors.ts              ← 10-class error hierarchy
│   │   ├── durability/            ← §2.6 layered mechanism implementation
│   │   └── state-machine/         ← §2.4.1 mission state machine
│   ├── missioncraft-cli/          ← CLI sovereign module (depends on SDK as if external)
│   │   ├── bin.ts                 ← `msn` entry point (shebang + arg-parse + SDK delegation)
│   │   ├── commands/              ← per-verb handlers (create, list, show, start, apply, etc.)
│   │   └── lib/                   ← CLI-specific helpers (output formatters, YAML scaffolding, prompts)
│   └── (future) missioncraft-api/ ← REST shim sovereign module (out-of-scope v1)
├── test/
│   ├── missioncraft-sdk/          ← SDK unit + integration tests (vitest)
│   └── missioncraft-cli/          ← CLI integration tests (spawn `msn` binary; verify SDK delegation)
├── dist/
│   ├── missioncraft-sdk/          ← compiled SDK
│   └── missioncraft-cli/          ← compiled CLI
└── package.json
```

**Sovereign-module discipline (v1.2 fold per MEDIUM-9 + MEDIUM-10):**

- **CLI imports SDK via package self-reference** (Node 12.16+ feature; satisfied by `engines.node>=22`): `import { Missioncraft } from '@apnex/missioncraft'` works inside the same package because Node resolves the package's own `exports.".":` entry. Cleanest sovereign-module discipline; CLI sees SDK as if it were external. **NOT relative path** (relative would bypass `exports` gate + see internal SDK source paths).
- **Linter rule enforces zone-restriction** via `eslint-plugin-import` `no-restricted-paths`:
  ```json
  "import/no-restricted-paths": ["error", {
    "zones": [{
      "target": "./src/missioncraft-cli",
      "from": "./src/missioncraft-sdk",
      "except": ["./src/missioncraft-sdk/index.ts"]
    }]
  }]
  ```
  Add `eslint-plugin-import` to devDependencies. typescript-eslint alone doesn't have an equivalent rule.
- **Resolver-chain composition spec (v1.3 fold per MEDIUM-R2.1):** the linter rule + package-self-reference compose ONLY if the resolver maps `@apnex/missioncraft` → `./src/missioncraft-sdk/index.ts` (source path) at lint-time. `dist/` doesn't exist pre-compile; default node-resolver would FAIL. Required substrate:
  1. **`tsconfig.json` paths field** — adds source-path mapping:
     ```json
     "compilerOptions": {
       "paths": {
         "@apnex/missioncraft": ["./src/missioncraft-sdk/index.ts"]
       }
     }
     ```
  2. **`eslint-import-resolver-typescript`** in devDependencies + ESLint config:
     ```json
     "settings": {
       "import/resolver": {
         "typescript": { "project": "./tsconfig.json" }
       }
     }
     ```
     The TypeScript resolver honors `tsconfig.paths`, mapping `@apnex/missioncraft` → `./src/missioncraft-sdk/index.ts` at lint-time.
  3. **Path-string match invariant:** the `except` entry path-string in `no-restricted-paths` MUST equal the resolver's output path (`./src/missioncraft-sdk/index.ts`; not `@apnex/missioncraft`; not `./src/missioncraft-sdk/`). If resolver output drifts, `except` no longer matches → linter blocks the legitimate SDK index.ts import.
- CLI is an SDK consumer, same shape as a 3rd-party consumer would be; ensures CLI doesn't accidentally couple to SDK internals.
- **`core/` 6-file boundary rationale (v1.5 fold per MINOR-R4.2; v1.8 fold per MINOR-R7.3 + v2.0 fold per Refinement C — extended for scope-types + scope-config-schema):** six files split by concern:
  - `types.ts` — SDK-INTERNAL constructor types (MissioncraftConfig, StateDurabilityConfig); not resource-types
  - `mission-types.ts` — mission RESOURCE types (the primary k8s-shape resource: MissionState, MissionHandle, MissionFilter, MissionStatePhase, MissionConfig)
  - `scope-types.ts` — scope RESOURCE types (v2.0 per Refinement C — ScopeState, ScopeHandle, ScopeFilter, ScopeStatePhase, ScopeConfig); separate file from mission-types per parallel-resource-shape discipline
  - `mission-config-schema.ts` — RUNTIME zod schemas for mission-config + RepoSpec (parse/validate primitives at YAML+JSON boundary)
  - `scope-config-schema.ts` — RUNTIME zod schema for scope-config (v2.0 per Refinement C — parse/validate at `<workspace>/scopes/<id>.yaml` boundary; SDK + adapter integration)
  - `operator-config-schema.ts` — RUNTIME zod schema for operator-config (parse/validate at `${MSN_WORKSPACE_ROOT}/operator.yaml` boundary; configGet/configSet validation)
  Separation prevents future-implementer drift toward consolidating runtime + types in one file (zod imports drag runtime into type-only modules; clean separation enables type-only imports for consumers who don't need parse). Three zod-schema files split by concern (mission-resource vs scope-resource vs operator-global) prevents cross-coupling. **v2.0 evolution path:** with 6 files in `core/`, consolidation candidate emerges — if v2.x adds a 7th schema (e.g., for v2.x manifest-template or runtime-policy), MOVE all schema files to `core/schemas/` directory (parallel-structure consolidation); MOVE all type-only files to `core/types/` directory. v2.0 keeps flat layout to avoid mid-cycle reshape; v2.x can adopt directory-consolidation as additive (additive doesn't break Strict-1.0 since it's source-internal).

**Multi-module TypeScript build (v1.2 fold per MEDIUM-8):**

Single `tsconfig.json` with `rootDir: ./src` + `outDir: ./dist`. TypeScript naturally preserves directory structure — `src/missioncraft-sdk/` compiles to `dist/missioncraft-sdk/`; same for `-cli`. Single `tsc` invocation. Both modules use identical compiler options (ES2022 / ESM / strict). Project references (`composite: true`) NOT used at v1 — over-engineered for single-package; both modules share build settings. v1.x can adopt project references if SDK + CLI need divergent compiler options (e.g., CLI targets a different ES version).

**tsc preserve-imports invariant for runtime self-reference (v1.4 fold per MEDIUM-R3.8):**

- **tsc default behavior:** PRESERVES import strings as-typed in compiled output. The `paths` field in `tsconfig.json` is for TYPE-RESOLUTION ONLY (lint-time + compile-time type-check); does NOT rewrite import statements in emitted JS. Compiled `dist/missioncraft-cli/bin.js` retains `import ... from '@apnex/missioncraft'` literal.
- **Runtime resolution:** Node sees the literal `@apnex/missioncraft` import; resolves via `package.json exports` field. When CLI runs from installed `node_modules/@apnex/missioncraft/dist/missioncraft-cli/bin.js`, the import resolves to the same installed package (standard `node_modules` lookup). Self-reference (Node 12.16+) only matters during local development / source-tree tests.
- **Substrate hazard:** post-tsc bundlers (esbuild, rollup, webpack) MAY rewrite imports under aggressive optimization. **v1 build pipeline MUST NOT rewrite `@apnex/missioncraft` imports post-tsc** — would break sovereign-module discipline at runtime (would couple CLI to internal SDK paths instead of resolving via package's exports). v1 ships tsc-only build (no bundler in CLI dist-pipeline; `bin.js` shebang + tsc output is the published artifact).
- 3rd-party consumers bundling `@apnex/missioncraft` for their own deployment (e.g., adapter-side esbuild) is fine — they're consuming the SDK like any external dep; their bundler's choices don't affect missioncraft's published artifact.

**`package.json`:**

```json
{
  "name": "@apnex/missioncraft",
  "version": "1.0.0",
  "description": "Sovereign mission-orchestration substrate — declarative mission resources spanning 1+ git repos",
  "license": "Apache-2.0",
  "type": "module",
  "main": "./dist/missioncraft-sdk/index.js",
  "types": "./dist/missioncraft-sdk/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/missioncraft-sdk/index.d.ts",
      "import": "./dist/missioncraft-sdk/index.js"
    }
  },
  "bin": {
    "msn": "./dist/missioncraft-cli/bin.js"
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "sideEffects": false,
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:sdk": "vitest run test/missioncraft-sdk",
    "test:cli": "vitest run test/missioncraft-cli",
    "test:watch": "vitest",
    "docs": "typedoc src/missioncraft-sdk/index.ts",
    "prepublishOnly": "npm run build && npm test"
  },
  "dependencies": {
    "chokidar": "^4.x",
    "isomorphic-git": "^1.x",
    "yaml": "^2.x",
    "zod": "^4.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "typescript": "^5.x",
    "vitest": "^4.x",
    "typedoc": "^0.28.x",
    "memfs": "^4.x"
  },
  "engines": {
    "node": ">=22"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/apnex/missioncraft.git"
  }
}
```

**Key v1.1 fold details:**
- `main` + `exports` point at SDK (`./dist/missioncraft-sdk/index.js`); SDK is the default consumer-import target
- `bin: { msn: "./dist/missioncraft-cli/bin.js" }` — CLI is a separate compiled artifact in its own directory
- `tsc` builds both `src/missioncraft-sdk/` + `src/missioncraft-cli/` to `dist/missioncraft-sdk/` + `dist/missioncraft-cli/` respectively (multi-module TypeScript build)
- Tree-shake-friendliness preserved: SDK consumer imports from `@apnex/missioncraft` and gets ONLY SDK bytes; CLI binary pulls CLI module directly via bin entry
- Future REST-shim attaches as additional internal module (`src/missioncraft-api/`) OR spin-out to `@apnex/missioncraft-api` separate package — naming convention preserves spin-out path

**v0.2 folds (per §D + §F):**
- `"sideEffects": false` (per §F — required signal for tree-shake-friendly bundling beyond named-exports alone)
- `zod ^3.x` → `^4.x` (current 4.4.3; minor breaking changes around `.parse()` defaults — Phase 6 implementation handles)
- `vitest ^1.x` → `^4.x` (current 4.1.5; multiple breaking-config changes — Phase 6 implementation handles)
- `typedoc ^0.25.x` → `^0.28.x` (current 0.28.19; mostly additive)
- `publishConfig.provenance: true` (per §H.4 — npm provenance attestation; OIDC-signed via GitHub Actions; supply-chain integrity for sub-mission #2-#11 consumers)

**Browser-shape note (per §F):** missioncraft v1 is **Node-only** (`engines.node >=22`); `LocalGitConfigIdentity` shells `git config` via `child_process` which is Node-only. Browser/edge consumers explicitly out-of-scope at v1; future v2+ MAY add browser-conditional exports if demand surfaces.

Lean dep surface: 4 runtime deps (`chokidar` + `isomorphic-git` + `yaml` + `zod`); no Octokit; no hand-rolled HTTP. (v3.2 fold per MEDIUM-R2.5: chokidar added per v3.1 MEDIUM-R1.3 daemon-watcher cross-platform fs-watch; previously 3 runtime deps at v2.5.)

#### §2.9.2 `tsconfig.json`

Standard strict TypeScript; ES2022 target; ESM module; declarations emitted.

#### §2.9.3 CI/CD (per F11 Survey-flag GitHub-Actions-only; v0.2 folds per §H.4 + §H.5 + §H.6)

`.github/workflows/ci.yml`:
- Trigger: push to `main` + PRs to `main`
- **OS matrix (v0.2 fold per §H.5):** ubuntu-latest + macos-latest (CLI tool tested on linux + macOS; Windows out-of-scope at v1)
- Node matrix: node 22.x + 24.x (v0.7 fold per §AAAAAA — Node 20 EOL'd 2026-04-30; current LTS = Node 22 maintenance + Node 24 active)
- Steps: `npm ci` → `npm run build` → `npm test`
- Status check: `vitest (missioncraft)` + `tsc-build`

`.github/workflows/release.yml`:
- Trigger: tag matching `v*.*.*`
- **Permissions (v0.2 fold per §H.4 + F17):** `id-token: write` (OIDC for npm provenance) + `contents: read` + `pages: write` (TypeDoc deploy)
- Steps: `npm ci` → `npm run build` → `npm test` → `npm publish --provenance` (OIDC-signed; per `publishConfig.provenance: true`)
- Concurrent: TypeDoc deploy to GitHub Pages via `actions/setup-pages` + `actions/upload-pages-artifact`

**Release-tagging discipline (v0.2 fold per §H.6):** tags applied via `changesets` (`@changesets/cli` devDep) — operator runs `npx changeset` to create a changeset; merged changesets accumulate in `.changeset/`; `npx changeset version` bumps version + generates CHANGELOG.md; `npx changeset publish` creates the tag + triggers release.yml. Strict-1.0 commitment means EVERY breaking change emits a major-changeset (rejected at PR-time if not explicit).

**Changeset CI gate (v0.3 fold per §FF + F22; v0.4 fold per §DDD.3; v0.5 fix per §BBBB):** `.github/workflows/ci.yml` adds a build step gated by `if: github.event_name == 'pull_request'` (event-conditional — `github.base_ref` is empty-string on `push` / `workflow_dispatch` events, only populated on `pull_request` / `pull_request_target`):

```yaml
- name: Changeset gate
  if: github.event_name == 'pull_request'
  run: npx changeset status --since=${{ github.base_ref }}
```

Fails the build if any source-code-change PR lacks a changeset. Parameterized to PR target branch (works for repos using `master`/`trunk`/etc.). Push-to-main (post-merge event) skips the gate — already ran during PR review cycle. Mechanized enforcement (no external bot dep). Operator manually selects patch-vs-minor-vs-major at changeset-creation time (CI doesn't auto-classify — strict-1.0 makes major a serious-decision-point so operator-explicit is correct).

#### §2.9.4 LICENSE

`LICENSE` file: full Apache 2.0 text. NO Contributor License Agreement (CLA) at v1 per F12 Survey-flag architect-recommendation.

#### §2.9.5 README.md skeleton

```markdown
# missioncraft

Sovereign git+workspace orchestration for multi-agent code coordination.

## Install

\`\`\`
npm install @apnex/missioncraft
\`\`\`

## CLI quick start (k8s-resource-shape per v1.1 refinement #2)

\`\`\`
# Create + configure a mission
msn create --name storage-extract
msn storage-extract repo-add https://github.com/example/repo.git

# Start the mission (engine clones; allocates workspace; acquires locks)
msn start storage-extract

# Per-mission git ops (mission-selector → repo-name → verb; Shape (b) v1.3 fold per HIGH-R2.1)
msn storage-extract storage-provider branch feature/example
# ... edit files in the workspace ...
msn storage-extract storage-provider commit -m "Initial work"
msn storage-extract storage-provider push

# Complete the mission (release locks; destroy workspace; preserve config)
msn complete storage-extract
\`\`\`

## Declarative quick start (single-call from manifest)

\`\`\`
msn start -f mission-77.yaml      # full manifest: declares + starts in one call
\`\`\`

## Library quick start (SDK-primary per v1.1 refinement #4)

\`\`\`typescript
import { Missioncraft } from '@apnex/missioncraft';
const mc = new Missioncraft({ /* defaults */ });
const handle = await mc.createMission({ name: 'storage-extract' });
await mc.addRepoToMission(handle.id, { url: 'https://github.com/example/repo.git' });
await mc.startMission(handle.id);
// ... per-mission git ops ...
await mc.completeMission(handle.id);
\`\`\`

## Architecture

5 pluggable interfaces — IdentityProvider, ApprovalPolicy, StorageProvider, GitEngine, RemoteProvider.

See [docs/getting-started.md](docs/getting-started.md) and the [TypeDoc API reference](https://apnex.github.io/missioncraft/).

## License

Apache 2.0
```

---

## §2.10 Multi-participant extension (NEW v4.0 — idea-265 12 scope items rolled up)

**Source:** post-ratify revisitation of v3.6 BILATERAL RATIFIED (SHA `e581a21`) per Director-doctrine Lean 7. Bilateral architect↔Director walkthrough 2026-05-10 captured 12 scope items. This section consolidates the architectural extension; downstream sections (§2.5 schema, §2.6.5 daemon-watcher, §2.3.2 CLI table) carry targeted edits referencing this anchor.

### §2.10.1 Concrete pain + target-state

**Today (v3.6 baseline):** architect (lily) authors design artifacts; engineer (greg) on a different working-tree (and target-state: different host) reads them. Forces engineer to invoke git mechanics (`git fetch && git checkout && cat`) or shell-copy (`cp /tmp/...`) — substrate-leakage of git into engineer-experience.

**Target-state (v4.0):** reader-role principal's per-principal workspace auto-syncs from writer's wip-branch via shared coordination point. Engineer runs `cd $(msn workspace m-foo)` + reads files. Zero git CLI invocation. Topology-uniform: same-host (local bare repo coord) and cross-host (network remote coord) use identical substrate-architecture.

### §2.10.2 Multi-participant mission-config schema extension

`MissionConfig` extends with two NEW fields (additive; v3.6 contracts preserved when fields absent — solo writer-only mission baseline):

```typescript
// Added to MissionConfig (zod schema; persisted to YAML)
export interface MissionConfig {
  // ... all existing v3.6 fields preserved
  readonly participants?: readonly MissionParticipant[];  // v4.0 NEW; absent = solo writer-only (v3.6 baseline)
  readonly coordinationRemote?: string;                    // v4.0 NEW; git remote URL for wip-coordination; required IFF participants[] contains a reader; default per-topology resolution
}

export interface MissionParticipant {
  readonly principal: string;                              // identity reference (e.g., 'lily@apnex', 'greg@apnex'); resolution mechanism = identity-provider concern
  readonly role: 'writer' | 'reader';                      // v1: exactly one writer; ≥0 readers; co-writer mode deferred to v1.x per Lean 6 YAGNI
  readonly addedAt: string;                                // ISO-8601; audit-trail for participant-add events
}
```

YAML-schema example:

```yaml
mission:
  id: msn-a1b2c3d4
  participants:                                            # v4.0 NEW
    - principal: lily@apnex
      role: writer
      added-at: 2026-05-10T12:00:00Z
    - principal: greg@apnex
      role: reader
      added-at: 2026-05-10T12:05:00Z
  coordination-remote: file:///home/apnex/.missioncraft-coordination/msn-a1b2c3d4.git   # v4.0 NEW; same-host topology; cross-host would be https://github.com/...
```

**Invariants:**
- `participants[]` absent OR contains 1 writer + 0 readers → solo writer-only mission (v3.6 baseline behavior; no coordination-remote needed; no wip-push)
- `participants[]` contains 1 writer + ≥1 readers → multi-participant mission (coordination-remote REQUIRED; wip-push enabled)
- Exactly 1 writer per mission at v1 (multi-writer / co-writer mode deferred to v1.x)
- Reader-list mutation via `update<T>('mission', id, {kind: 'add-participant', principal, role: 'reader'})` discriminated-union extension (no new SDK verb)

### §2.10.3 Substrate-coordinate addressing convention (NEW)

**Format:** `<mission-id>:<repo>/<path>` single-string; principal-portable; resolved per-host to local workspace path.

**Granularity ladder** (uniform across `msn show` / `msn list` / `msn workspace`):

| Coordinate | Granularity | Example |
|---|---|---|
| `<mission-id>` | mission | `msn show m-foo` → mission-state |
| `<mission-id>:<repo>` | repo within mission | `msn list m-foo:design-repo` → row-per-file (v1.x) |
| `<mission-id>:<repo>/<dir>/` | directory within repo | `msn list m-foo:design-repo/docs/` (v1.x) |
| `<mission-id>:<repo>/<path>/<file>` | file | `msn workspace m-foo:design-repo/docs/foo.md` → absolute file path |

**Resolution semantic:** principal-portable single-string resolves to the principal's LOCAL filesystem path. Two principals on same host resolve the same coordinate to DIFFERENT local paths (per-principal workspace-root).

**Worked example** (lily writer + greg reader, same-host topology):

```
Coordination point (shared local bare repo):
  /home/apnex/.missioncraft-coordination/m-foo/design-repo.git
    └── refs/heads/wip/m-foo            ← lily's daemon pushes here on cadence
                                          greg's daemon pulls from here on cadence

Lily's per-principal workspace:
  /home/apnex/.missioncraft-lily/workspace/missions/m-foo/design-repo/
    └── docs/foo.md                     ← lily edits HERE (writable; daemon fs-watches)

Greg's per-principal workspace:
  /home/apnex/.missioncraft-greg/workspace/missions/m-foo/design-repo/
    └── docs/foo.md                     ← greg reads HERE (0444; auto-synced from coord)
```

Both invoke `msn workspace m-foo:design-repo/docs/foo.md` and the substrate resolves to THEIR local path. The coordinate string is identical; the resolved path is principal-scoped.

**Path-resolution semantic only at v1:** `msn workspace <coord>` returns a path string (composable via `cat $(msn workspace ...)` etc.). Content-display verbs (`msn cat`, `msn ls`) deferred to v1.x per Lean 6 YAGNI.

### §2.10.4 Reader-daemon mode + writer push-on-cadence-conditional

**Writer-side (mostly v3.6 unchanged; ONE conditional addition):**
- Wip-cadence-tick fires wip-commits to local wip-branch (existing v3.6 §2.6.5)
- **NEW v4.0:** if `mission.participants[]` contains ≥1 reader → daemon ALSO pushes wip-branch to `mission.coordinationRemote` on same cadence-tick. **v4.1 fold per HIGH-R1.1 substrate-path correction:** push goes through **GitEngine plain-git wire-protocol** (NOT RemoteProvider). Per §2.1.5 PureGitRemoteProvider clause — *"`push`/`pull` semantics flow through GitEngine plain git wire-protocol; RemoteProvider not invoked for push/pull; only for PR + API operations"*. Coordination-remote push/pull is a `git push`/`git fetch` against a remote URL; auth flows through git-native (HTTPS-token-helper / SSH-key for cross-host; no auth for `file://` same-host). Coordination-remote is decoupled from publish-flow's PR-target remote (different substrate-paths; different auth-mechanisms).
- Solo writer-only mission: NO push (v3.6 baseline preserved; zero needless network/disk traffic)
- **v4.1 fold per MEDIUM-R1.9 push-cadence error-handling:** `git push` to coord-remote is fired OUTSIDE the brief lock-cycle (lock released after wip-commit; push fires async). Push-failure semantics: best-effort with retry-on-next-cadence (transient network failures recover automatically; persistent failures emit warning to `<workspace>/missions/<id>/.daemon.log`); operator-DX visibility via `msn show <id>` reporting `lastPushSuccessAt` field. Durability guarantee: if writer's OS shuts down with unpushed wip-commits, recovery on next-start re-attempts push. Lock-held duration is bounded by local-write only (network-flaky push doesn't block concurrent CLI ops).

**Reader-side (NEW v4.0 daemon-watcher mode):**
- Same per-mission daemon-watcher process model (k8s-shape uniformity per Lean 4)
- **Remote-watch sub-mode (NEW):** daemon polls writer's wip-branch on `mission.coordinationRemote` at cadence (default = `wip-cadence-ms`; same single knob per scope item #3)
- On wip-branch advance: fetch + apply to reader's local workspace (`git pull --ff-only` against shared coord)
- **Filesystem-watch sub-mode (existing; reader-variant):** if reader-edits detected on filesystem (mtime change in workspace) → `MissionStateError("read-only participant; reject")` + rollback to writer-state (re-fetch + apply); operator-DX warning logged at `<workspace>/missions/<id>/.daemon.log`
- Reader CLI rejects mutating-ops: `msn complete`, `msn abandon`, `msn update <id>` (mutation-types other than participant-list-mutation), `msn apply <id>` — all gated on principal-role-write check via mission-config

**Strict-enforce reader workspace mode (filesystem 0444):**
- All files in reader's per-principal workspace are filesystem-mode `0444` (read-only) — set at workspace-allocation-time + maintained on every `git pull`
- Reader's editor refuses writes (filesystem-level enforcement per Lean 5 explicit-attribution)
- Filesystem-watch reader-variant catches operator-side `chmod` bypass attempts + rolls back

**Cross-host coordination = git-as-coordination:**
- Writer + readers share a common git remote (file://path for same-host; https://... for cross-host)
- No new coordination service; leverages git refs as sovereign-state-store (tele-1 sovereign-state-transparency)
- Substrate-architecture is uniform across topologies; ONLY `mission.coordinationRemote` value differs

### §2.10.5 Workspace-root principal-scoping

**v3.6 baseline:** `configSet workspace-root <path>` mechanism (operator-config field). Default `~/.missioncraft/workspace`.

**v4.0 extension:** workspace-root MUST be principal-distinct on multi-principal hosts. Default-resolution behavior on multi-principal hosts is **TBD per Director-pick during round-1 audit** — three candidate options:

| Option | Default-resolution mechanism | Tradeoff |
|---|---|---|
| **(a)** Working-tree-derived | `<working-tree>/.missioncraft/workspace/` | Composes with existing identity-determined-by-working-tree pattern (per `feedback_user_agent_identity` memory); workspace adjacent to engineer's git-clone for DX |
| **(b)** Principal-id-suffixed | `~/.missioncraft-<principal-id>/workspace/` | Doesn't depend on working-tree convention; explicit principal-scoping in path |
| **(c)** Explicit-required | NO default; error if unset on multi-principal hosts | Forces operator-explicit configuration; safest but adds friction |

Architect-recommendation: **(a)** — composes with existing convention; minimizes new operator-friction; keeps workspace adjacent to git-clone for DX.

Final pick: **Director-Accountable; surface during round-1 audit per F-flag below.**

### §2.10.6 CLI surface extension

**`msn workspace` extends to substrate-coordinate granularity (scope item #9):**

| CLI invocation | Returns | Notes |
|---|---|---|
| `msn workspace <id>` | mission workspace root | existing v3.6 behavior preserved |
| `msn workspace <id> <repo>` | per-repo workspace dir | existing v3.6 behavior preserved |
| `msn workspace <id>:<repo>` | per-repo workspace dir | NEW v4.0 — colon-notation alias |
| `msn workspace <id>:<repo>/<path>` | absolute file path | NEW v4.0 — file-level resolution |

**`msn show` accepts substrate-coordinate (scope item #10):**

| CLI invocation | Returns | Notes |
|---|---|---|
| `msn show <id>` | mission-state full-detail (existing v3.6) | |
| `msn show <id>:<repo>` | per-repo state within mission | NEW v4.0 — repo-state including role / sync-state / remote |

**`msn list` extends with drill-down semantics (scope item #11):**

| CLI invocation | Returns (tabular) | Notes |
|---|---|---|
| `msn list` | row-per-mission | existing v3.6 behavior preserved |
| `msn list <id>` | row-per-repo within mission | NEW v4.0 — columns: name / role / sync-state / remote |
| `msn list <id>:<repo>` | row-per-file within repo | v1.x DEFERRED per Lean 6 YAGNI |

### §2.10.7 v1.x deferrals (per Lean 6 YAGNI; scope item #12)

All compose with v4.0 substrate; defer until concrete demand emerges:

- **File-level `msn list <coord>/<dir>/`** — directory-listing within repo
- **Coordinate-versioning `<coord>@<sha>`** — historical-version addressing (e.g., `m-foo:r1/foo.md@a1b2c3d`)
- **Force-sync `msn sync <id>`** — explicit sync trigger bypassing cadence
- **Existence-check primitive** — SDK-only `exists(coord): boolean`
- **Content-display verbs** — `msn cat <coord>`, `msn ls <coord>`
- **Reader-side actions** — annotation, comment, line-tied-thread
- **Co-writer mode** — multi-writer with conflict-resolution
- **Multi-writer atomic transactions**
- **Per-repo participation** — partial-participant within a mission (some repos read; some hidden)

### §2.10.8 Architect-flags for round-1 audit (v4.0-specific)

| F-flag | Description | Severity | Architect disposition |
|---|---|---|---|
| **F-V4.1** | Workspace-root default-resolution mechanism on multi-principal hosts (option a/b/c per §2.10.5) | MEDIUM | Architect-recommendation: option (a). Director-Accountable pick during round-1 audit. |
| **F-V4.2** | `msn.coordinationRemote` field-required-when validation: triggered on `participants[]` containing reader; how is this validated at mission-config write-time vs SDK-construct time vs first-invocation? | MEDIUM | Architect-recommendation: zod conditional-validation at config-write-time + SDK-construct-time defense-in-depth. |
| **F-V4.3** | Reader workspace strict-enforce 0444 — what happens if operator manually `chmod`s files? Daemon detects + rollback (per §2.10.4); but is this advisory or hard-error? | MEDIUM | Architect-recommendation: hard-error (`MissionStateError("workspace mode tampered; reset by daemon"); rollback`). Director-Accountable. |
| **F-V4.4** | Reader-daemon shutdown sequence on `msn complete`/`msn abandon` — only writer's daemon participates in publish-flow Steps 1-8 / abandon-flow Steps 1-8; reader-daemons receive what signal? | MEDIUM | Architect-recommendation: writer's daemon broadcasts terminal-state via coordination-remote tag (`msn-<id>-terminated`); readers' daemons detect + auto-shut-down. Spec at §2.10.4 round-1 fold. |
| **F-V4.5** | Substrate-coordinate parsing grammar formalization at §2.3.2 Rule N (mirror v2.5 Rule 6 disjunctive arg-shape grammar; how does parser distinguish `m-foo:r1/foo.md` from `m-foo` `:` `r1/foo.md` 3-positional?) | MEDIUM | Architect-recommendation: single positional containing colon → coordinate-form; no whitespace splits within coordinate. Spec at §2.3.2 round-1 fold. |
| **F-V4.6** | `participants[]` mutation while mission `in-progress` — does adding/removing readers mid-mission require any state-transition / lock acquisition? | MINOR | Architect-recommendation: participants[] mutation under mission-lock; reader-add triggers wip-push backfill (push current state to coord-remote so new reader has starting-point). Spec at §2.5 round-1 fold. |
| **F-V4.7** | Coordination-remote auth handling — separate from publish-flow's RemoteProvider auth, OR shared? | MINOR | **v4.1 reframe per HIGH-R1.1**: coord-remote auth flows through git-native (HTTPS-token-helper / SSH-key); RemoteProvider is NOT in coord-remote substrate-path. Reframed F-V4.7 question: "git-credential-helper config for cross-host coord-remote — operator-side concern OR substrate-prescription?" Architect-recommendation: operator-side concern (consistent with v3.6 §2.6.6 AI-agent-provisioning discipline); substrate documents the requirement at §2.6.6. |

### §2.10.9 v4.1 fold additions — substantive resolution of HIGH-class round-1 findings

**v4.1 fold per HIGH-R1.2 — Workspace partition-spec table:**

v3.6 §2.4 workspace contract structures workspace-root as a tree with multiple per-mission shared subdirectories. v4.0 spec'd only the `missions/<id>/<repo>/` per-principal partition. v4.1 commits the full partition-spec:

| Subdirectory | Disposition | Mechanism |
|---|---|---|
| `<workspace>/missions/<id>/<repo>/` | **per-principal** | Each principal has own copy (cloned from coord-remote at reader-join-time; sync'd via wip-branch on cadence) |
| `<workspace>/config/<id>.yaml` | **per-principal** | Initialized from coord-remote at reader-join-time; subsequent participant-mutation propagates via coord-remote tag-event (writer pushes `refs/tags/missioncraft/<id>/config-update` on participant mutation per MINOR-R1.3; reader-daemon detects + re-fetches config) |
| `<workspace>/scopes/<scope-id>.yaml` | **per-principal (operator-side concern)** | Scopes are template-manifests; operator-side concern (not mission-state-coupled). Each principal manages own scope-collection independently; cross-principal scope-sharing out-of-scope at v1. |
| `<workspace>/locks/missions/<id>.<principal>.lock` | **per-principal** (NAME-EXTENDED per HIGH-R1.3) | Per-principal lockfile naming. Each principal's daemon writes own lockfile. Cross-principal IPC via coord-remote tags (per F-V4.4 mechanism). Inside-principal lockfile-mtime-watch IPC unchanged from v3.6 §2.6.5. |
| `<workspace>/locks/repos/<sha256(repoUrl)>.<principal>.lock` | **per-principal** | Per-principal repo-locks; cross-mission scope on same principal (per v3.6 HIGH-5); cross-host topology cannot share filesystem-locks anyway. |
| `<workspace>/locks/scopes/<scope-id>.<principal>.lock` | **per-principal** | Same logic as mission-locks; per-principal naming. |
| `<workspace>/operator.yaml` | **per-OS-user** | Already implicit in v3.6; v4.1 extends with multi-principal override mechanism per §2.10.5 + MEDIUM-R1.7 fold. |

**v4.1 fold per HIGH-R1.3 — Reader-daemon lockfile composition:**

Pick: **option (a) per-principal lockfile naming** — `<workspace>/locks/missions/<id>.<principal>.lock`. Writer-daemon writes own lockfile; reader-daemon writes own lockfile. Both follow v3.6 LockfileState schema (no structural change; principal-id encoded in filename). Cross-principal IPC via coord-remote tag-events (per F-V4.4 mechanism), NOT via lockfile-watch. Inside-principal lockfile-mtime-watch IPC unchanged (writer-CLI signals writer-daemon; reader-CLI signals reader-daemon).

Rationale: (a) preserves v3.6 LockfileState schema (no backward-incompat structural change to dead-pid detection 7-step sequence at §2.6.5); (b) cross-host topology naturally supports per-principal lockfiles (filesystem-lock can't span hosts anyway); (c) k8s-shape uniformity preserved (each principal's daemon-process model is identical to v3.6 single-principal model; multi-principal compose at coord-remote layer, not lockfile layer).

**v4.1 fold per MEDIUM-R1.10 — Coordination-remote granularity:**

Pick: **option (a) one bare repo per mission, with per-repo branches**. `mission.coordinationRemote` is a single git remote URL pointing to a bare repo. Engine derives per-repo refs at the bare repo as `refs/heads/<repo-name>/wip/<id>`. Multi-repo missions share the bare repo; each repo's wip-branch lives at its own ref-namespace.

Rationale: gsutil-bucket-style — single bucket per mission, multiple objects (per-repo branches) within. Cleaner than per-mission-per-repo (which would need parent-dir URL parsing). Substrate-coordinate addressing (§2.10.3) maps cleanly: `m-foo:design-repo` → `coordinationRemote/refs/heads/design-repo/wip/m-foo`.

§2.10.2 YAML example corrected:

```yaml
mission:
  id: msn-a1b2c3d4
  participants:
    - principal: lily@apnex
      role: writer
      added-at: 2026-05-10T12:00:00Z
    - principal: greg@apnex
      role: reader
      added-at: 2026-05-10T12:05:00Z
  coordination-remote: file:///home/apnex/.missioncraft-coordination/msn-a1b2c3d4.git   # ONE bare repo per mission; engine derives per-repo refs
```

§2.10.3 worked example corrected (v4.5 fold per MINOR-R6.3 — adds config-branch + tag-namespace):

```
Coordination point (single local bare repo; multi-repo via per-repo refs + dedicated config-branch + tag-namespace):
  /home/apnex/.missioncraft-coordination/msn-a1b2c3d4.git
    └── refs/heads/design-repo/wip/m-foo            ← lily's daemon pushes wip-cadence here per repo
    └── refs/heads/other-repo/wip/m-foo             (if mission has multiple repos)
    └── refs/heads/config/m-foo                     ← lily pushes mission-config here on every config-mutation (NEW v4.5 per MINOR-R6.2)
    └── refs/tags/missioncraft/m-foo/config-update  ← lily fires on every config-mutation; reader-daemon Loop B detects via fetch --tags
    └── refs/tags/missioncraft/m-foo/terminated     ← lily fires on complete/abandon; reader-daemon Loop B detects → reading → readonly-completed cascade

Per-principal workspaces (unchanged from v4.0):
  /home/apnex/.missioncraft-lily/workspace/missions/m-foo/design-repo/  ← writable; daemon fs-watches
  /home/apnex/.missioncraft-greg/workspace/missions/m-foo/design-repo/  ← 0444; auto-synced from coord
```

### §2.10.10 v4.1 fold additions — MEDIUM-class cross-fold render-gaps

**v4.2 STRUCTURAL-FLATTEN STATUS (per META-HIGH-R2.1 fold-discipline correction):** v4.1 anchored all R1 dispositions here; v4.2 inline-flattens the highest-leverage entries into target sections + acknowledges partial flatten with provenance preserved for R3 audit-traceability.

| R1 disposition | v4.2 status |
|---|---|
| MEDIUM-R1.1 §2.5 schema body | ✓ INLINE-FLATTENED — see §2.5 (zod schema extensions + MissionParticipant + MissionConfig fields + lifecycle-state enum extension) |
| MEDIUM-R1.3 §2.3.2 CLI grammar Rule N | ✓ INLINE-FLATTENED — see §2.3.2 Rule 1 verb-count update (13 → 15) + Rule 5 reserved-words colon-protection + NEW Rule 7 (Rule N) substrate-coordinate parsing + CLI table msn join/leave/coord-form rows + arg-count grammar table |
| MEDIUM-R1.4 §2.3.1 SDK class | ✓ INLINE-FLATTENED — see §2.3.1 (workspace() signature extension + join()/leave() top-level methods + MissionMutation 3 new kinds + MissionState fields + MissionRepoState interface + MissionParticipant interface + MissionStatePhase reader-side enum extension) |
| MEDIUM-R1.5 §2.4.1 state-restriction matrix | ✓ INLINE-FLATTENED v4.4 — see §2.4.1.v4 multi-participant state machine extensions sub-section (3 new mutation rows + reader-side ALL-mutation-rejected row) |
| MEDIUM-R1.2 §2.6.5 daemon-watcher body | ✓ INLINE-FLATTENED v4.4 — see §2.6.5.v4 multi-participant daemon-watcher extensions sub-section (reader-mode 2-loop spec per MEDIUM-R2.1 + writer push-on-cadence-conditional + per-principal lockfile naming + dead-pid 7-step parallel) |
| MEDIUM-R1.6 §2.6.6 coord-remote auth | ✓ INLINE-FLATTENED v4.4 — see §2.6.6.v4 multi-participant auth extensions sub-section (cross-host = git-native HTTPS-token-helper / SSH-key; same-host = filesystem-permissions; reader credential-helper = operator-side) |
| MEDIUM-R1.7 §2.4 OperatorConfigSchema | ✓ INLINE-FLATTENED v4.4 — see §2.4 operator.yaml `defaults.workspace-root-by-principal` map + multi-principal-host detection note inline in OperatorConfigSchema YAML example |
| MEDIUM-R1.8 §2.4.1 reader-side `msn start` flow | ✓ INLINE-FLATTENED v4.4 — see §2.4.1.v4 7-step `joined → reading` transition spec + state-machine cascade-mechanism (refs/tags/missioncraft/<id>/terminated detection per HIGH-R2.3); msn join/leave SDK + CLI surface inline at §2.3.1 + §2.3.2 (v4.2) |
| MEDIUM-R1.9 push-cadence error-handling | ✓ INLINE-FLATTENED v4.4 — see §2.6.5.v4 writer-side push-on-cadence-conditional (push outside lock-cycle; best-effort retry-on-next-cadence; persistent-failure to .daemon-state.yaml `lastPushAttemptError` field) |

**Per engineer's META-HIGH-R2.1 R3-prediction:** v4.2 partial-flatten + v4.3 completes-flatten + substrate-fixes (R2.1-R2.4) + HIGH-R2.2/R2.3 picks. R3 finding-count predicted to drop substantially as flatten progresses; total close envelope still 5-7 rounds per pattern empirics.

**v4.3 fold additions — R3 architect-picks (engineer R3 audit on thread-513; 6 findings):**

| R3 finding | v4.3 disposition | Anchor |
|---|---|---|
| **MEDIUM-R3.1** current-principal SDK context-dependency | ✓ INLINE-FLATTENED at §2.3.1 SDK class — 4-step precedence chain (per-call override → constructor → IdentityProvider.resolve email-derived → MSN_PRINCIPAL_ID env-var) | §2.3.1 |
| **MEDIUM-R3.2** MissionStatePhase 10-value enum role-discrimination | **Pick option (a) zod superRefine role-based state-validation**: rejects writer-side config containing `'reading'` enum-value; rejects reader-side config containing `'in-progress'` enum-value. Validation requires "principal-where-this-config-lives" determination (engine knows from config-file path mapping per HIGH-R1.2 partition-spec). Less API surface than discriminator-union split (option b). v4.4 fold inline at §2.5 zod schema | §2.5 v4.4 work-item |
| **MEDIUM-R3.3** lastPushSuccessAt write-discipline conflicts with daemon-no-config-write invariant | **Pick: persist in NEW `<workspace>/missions/<id>/.daemon-state.yaml` separate file** — keeps mission-config atomic-write discipline intact (no per-cadence config-mutation); engine reads `.daemon-state.yaml` at `msn show <id>` and merges into MissionState response. Trade: lost forensic-history post-terminal (file destroyed with workspace); operator-DX preserves visibility during in-progress lifetime. Lighter-weight than lockfile-JSON (lockfile cleared on every restart). v4.4 fold spec at §2.6.5 + §2.5 + remove from MissionConfig YAML schema | §2.5 + §2.6.5 v4.4 work-item |
| **MEDIUM-R3.4** abandon-repo-status incidental v3.6-baseline render-gap closure | ✓ ACKNOWLEDGED in v4.3 — see §8 v4.2 status-row addendum below | §8 |
| **MINOR-R3.1** lastPushSuccessAt lifecycle docstring at §2.3.1 | ✓ INLINE-FLATTENED v4.4 — `MissionState.lastPushSuccessAt` is engine-derived from `<workspace>/missions/<id>/.daemon-state.yaml` (not config-persisted); merged into MissionState response at query-time per §2.6.5.v4 .daemon-state.yaml mechanism. Field-lifecycle: absent until first successful push; persists across daemon-restart (via .daemon-state.yaml file); cleared on workspace-destroy (NOT --purge-config since field never lived in mission-config) | §2.3.1 |
| **MINOR-R3.2** msn list 2-positional walk-through | ✓ ACKNOWLEDGED v4.4 — `msn list <id> show` 2-positional case: per Rule 6 (post-dispatch arg-count validation), `msn list` accepts 0 OR 1 positional (v4.0 extension); 2nd positional `show` is extra-positional → error `"unexpected positional 'show' for 'list'; coordinate-form for repo-granularity uses colon-notation 'msn list <id>:<repo>' per Rule N"`. Walk-through edge case symmetric with `msn workspace m-foo:design repo` ambiguity case spec'd at §2.3.2 Rule N walk-through | §2.3.2 |
| **MINOR-R4.1** M-R3.1 comment-block placement (cosmetic) | ✓ ACKNOWLEDGED v4.4 — placement-scope addressed inline via comment-block trailer "Applies to all current-principal-aware methods (get / list / workspace; future: any read-API returning per-principal projection)". Cosmetic; future v1.x can promote to dedicated §2.3.1 sub-section if SDK surface grows | §2.3.1 |
| **MINOR-R4.2** lastPushSuccessAt v4.4 fold-correctness | ✓ INLINE-FLATTENED v4.4 — REMOVED from §2.5 YAML schema body + zod block; RETAINED on `MissionState` interface at §2.3.1 (engine merges from .daemon-state.yaml); ADDED `.daemon-state.yaml` schema spec at §2.6.5.v4. Single-source-of-truth: `<workspace>/missions/<id>/.daemon-state.yaml` | §2.5 + §2.3.1 + §2.6.5 |

---

**v4.1 fold per MEDIUM-R1.1 — §2.5 mission-config schema body extensions:** ✓ INLINE-FLATTENED at §2.5; original v4.1 anchor-prose preserved here for R3 audit-traceability.

`MissionConfigSchema` (zod) extended with v4.0 fields + F-V4.2 conditional-validation:

```typescript
const MissionParticipantSchema = z.object({
  principal: z.string(),
  role: z.enum(['writer', 'reader']),
  addedAt: z.string().datetime(),
});

const MissionConfigSchema = z.object({
  // ... all existing v3.6 fields preserved
  participants: z.array(MissionParticipantSchema).optional(),
  coordinationRemote: z.string().url().optional(),
}).superRefine((config, ctx) => {
  // F-V4.2 conditional-validation: coordinationRemote required IFF participants[] contains a reader
  const hasReader = config.participants?.some(p => p.role === 'reader') ?? false;
  if (hasReader && !config.coordinationRemote) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'coordinationRemote required when participants[] contains a reader', path: ['coordinationRemote'] });
  }
  const writerCount = config.participants?.filter(p => p.role === 'writer').length ?? 0;
  if (config.participants && writerCount !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'exactly 1 writer required at v1; co-writer mode deferred to v1.x', path: ['participants'] });
  }
});
```

Validation enforced at all parse-sites enumerated in §2.5 (createMission / msn create / applyMission / startMission / YAML hydration / adapter parse). Parse-fail → `ConfigValidationError`. No schema-version bump (additive-only per §2.5 v1.x evolution rule).

**v4.1 fold per MEDIUM-R1.2 — §2.6.5 daemon-watcher body extensions:**

Reader-daemon mode + writer push-on-cadence-conditional spec'd at §2.10.4; cross-folded into §2.6.5 body:

- LockfileState structurally unchanged; per-principal naming via filename (per HIGH-R1.3); reader-daemon writes own LockfileState
- Reader-daemon `chokidar.watch` config: ignore-patterns identical to writer-mode; coord-remote-poll interval = `wip-cadence-ms` (single knob); on poll fires `git fetch <coord-remote>` + `git pull --ff-only`
- Dead-pid detection 7-step per-principal (reader's CLI runs detection against reader's lockfile; no cross-principal lockfile-read)
- Writer's push-on-cadence OUTSIDE brief lock-cycle (per MEDIUM-R1.9; lock released after wip-commit; push fires async best-effort with retry-on-next-cadence)

**v4.1 fold per MEDIUM-R1.3 — §2.3.2 CLI grammar Rule N:**

Rule N (NEW disambiguation rule for substrate-coordinate parsing):

> **Rule N (v4.0):** any single positional containing `:` is parsed as a substrate-coordinate (`<mission-id>:<repo>[/<path>]`). Whitespace within a coordinate is rejected (`ConfigValidationError`). Mission/scope `--name <slug>` MUST NOT contain `:` (collision with coordinate-form parsing). Coordinate-form interchangeable with whitespace-separated form: `msn workspace m-foo design-repo` ≡ `msn workspace m-foo:design-repo`.

§2.3.2 CLI table rows for `msn workspace` / `msn show` / `msn list` extend with coordinate-form variants per §2.10.6. Reserved-verbs count: 13 (v3.6) → **15 (v4.1 with `join`/`leave` reader-side verbs per MEDIUM-R1.8)**.

**v4.1 fold per MEDIUM-R1.4 — §2.3.1 SDK class extensions:**

`MissionMutation` discriminated-union extended with NEW kinds:

```typescript
type MissionMutation =
  // ... 8 existing v3.6 kinds preserved
  | { kind: 'add-participant'; principal: string; role: 'writer' | 'reader' }
  | { kind: 'remove-participant'; principal: string }
  | { kind: 'set-coordination-remote'; remote: string };
```

Mutation flows through existing `update<T>('mission', id, mutation)` polymorphism — NO new top-level SDK verb added for mutation. Engine-side last-mile dispatch validates state-restriction per §2.4.1 matrix (per MEDIUM-R1.5).

`workspace()` SDK signature accepts coordinate-form via colon-notation in `id` arg:

```typescript
// v4.1: id arg accepts colon-notation; engine parses internally
workspace(idOrCoordinate: string, repoName?: string): Promise<string>;
//   'm-foo'                    → mission workspace root
//   'm-foo:design-repo'        → per-repo dir
//   'm-foo:design-repo/path'   → file path
```

`get('mission', id)` and `list('mission', filter?)` accept coordinate-form for repo-granularity per §2.10.6.

**v4.1 fold per MEDIUM-R1.5 — §2.4.1 per-field state-restriction matrix extensions:**

Three new MissionMutation rows added to per-field matrix:

| Mutation | `created` | `configured` | `started` | `in-progress` | `completed` | `abandoned` |
|---|---|---|---|---|---|---|
| `add-participant` | ✓ | ✓ | ✓ | ✓ | ERROR | ERROR |
| `remove-participant` | ✓ | ✓ | ✓ | ✓ | ERROR | ERROR |
| `set-coordination-remote` | ✓ | ✓ | ERROR | ERROR | ERROR | ERROR |

Rationale: participant-mutations allowed mid-mission (operator may add/remove readers during in-progress); coord-remote-change allowed only pre-`started` (post-start change would orphan readers). All under mission-lock per F-V4.6; reader-add triggers immediate wip-push backfill (writer's daemon receives participant-add IPC signal via lockfile-mtime-watch; fires immediate-push to coord-remote; new reader has starting-point on first daemon-poll).

**v4.1 fold per MEDIUM-R1.6 — §2.6.6 commit+push auth coord-remote auth case:**

§2.6.6 extended with NEW sub-section:

> **Coord-remote auth (v4.1 fold per HIGH-R1.1 + MEDIUM-R1.6):** Coordination-remote push/pull goes through GitEngine plain-git wire-protocol (per §2.1.5 PureGitRemoteProvider clause); RemoteProvider is NOT in coord-remote substrate-path.
> - **Cross-host coord-remote (e.g., `https://github.com/<org>/<bare>.git`):** auth via git-native HTTPS-token-helper (typically gh-cli's stored token if installed; OR `git credential.helper` config). Same auth-mechanism as `PureGitRemoteProvider` push/pull.
> - **Same-host coord-remote (`file:///path/to/bare.git`):** no auth required; filesystem-permissions only. Operator-side concern: bare repo's parent directory must be writable by writer-principal AND readable by reader-principal.
> - **Reader-principal credential-helper config:** reader's daemon does `git fetch` from coord-remote (no commit-author needed since reader doesn't author commits) BUT may need credential-helper config for HTTPS coord-remote. Operator-side concern (consistent with AI-agent-provisioning discipline).

"Single RemoteProvider per mission" v3.6 invariant PRESERVED — coord-remote isn't a RemoteProvider concern.

**v4.1 fold per MEDIUM-R1.7 — §2.4 OperatorConfigSchema multi-principal extension:**

If §2.10.5 default-resolution picks option (a) working-tree-derived → OperatorConfigSchema unchanged. If option (b)/(c), OperatorConfigSchema extends:

```yaml
defaults:
  workspace-root: "~/.missioncraft"   # legacy-default (v3.6 single-principal)
  workspace-root-by-principal:        # v4.1 NEW (option (b)/(c))
    lily@apnex: "~/.missioncraft-lily/workspace"
    greg@apnex: "~/.missioncraft-greg/workspace"
```

Env-var `MSN_WORKSPACE_ROOT` mapping unchanged for option (a). For option (b)/(c): NEW env-var `MSN_PRINCIPAL_ID` selects principal-id; engine derives workspace-root from per-principal config.

**v4.1 fold per MEDIUM-R1.8 — §2.4.1 reader-side `msn start` flow:**

NEW reader-side state-machine overlay (parallel to v3.6 9-step writer-side `configured → started` transition):

7-step `joined → reading` transition (reader-side; spawned via `msn join <id> --coord-remote <url>`):

1. Validate mission-id + coord-remote URL; verify reader-principal authorized (writer-principal must have run `msn update <id> add-participant <principal> reader` first; coord-remote tag confirms)
2. Allocate reader's per-principal workspace at `<reader-workspace-root>/missions/<id>/`
3. Initialize mission-config from coord-remote (`git fetch <coord-remote> <config-ref>` + apply); subsequent config-changes propagate via coord-remote tag-event
4. Clone per-repo workspaces from coord-remote (`git clone --reference <coord-remote> <repo-name>/wip/<id>`); set filesystem-mode `0444` on all files
5. Acquire reader-side mission-lock at `<reader-workspace>/locks/missions/<id>.<principal>.lock`
6. Spawn detached reader-daemon-watcher (per §2.10.4 reader-mode); daemon writes pid + reader-mode flag to lockfile
7. Persist mission-state-yaml as `reading` (reader-side lifecycle-state; distinct from writer-side `started`/`in-progress`)

Reader-side terminal transitions: `reading → readonly-completed` (writer terminated; readers transition to read-only-archive mode) OR `reading → leaving` (operator-explicit `msn leave <id>` to disengage).

NEW reserved-verbs at v4.1: `msn join` + `msn leave` (reader-side only). Reserved-verbs count: 13 (v3.6) → **15 (v4.1)**.

Alternative considered + rejected: reader-side spawn auto-triggered by writer's participant-add. Rejected because cross-host topology requires reader to know coord-remote URL out-of-band; explicit `msn join` is the natural information-injection moment.

### §2.10.11 v4.1 fold additions — MINOR cross-fold

**MINOR-R1.1 — §2.10.7 deferral list clarification:**

"Co-writer mode" + "multi-writer atomic transactions" collapsed to single deferral:
> **Co-writer mode (multi-writer with atomic-transaction discipline)** — extension of `MissionParticipant.role` enum to allow `'writer'` count > 1; requires conflict-resolution + atomic-transaction discipline; both concerns deferred to v1.x as a single feature-bundle.

**MINOR-R1.2 — `MissionState` interface per-repo runtime-state extension:**

`MissionState.repos[]` array entries extended (engine-derived; not config-persisted):

```typescript
interface MissionRepoState {
  readonly name: string;                       // existing v3.6
  readonly url: string;                        // existing v3.6
  readonly base: string;                       // existing v3.6
  // v4.1 NEW per-repo runtime-state for `msn show <id>:<repo>` columns
  readonly role?: 'writer' | 'reader';         // role of CURRENT principal viewing this state
  readonly syncState?: 'synced' | 'fetching' | 'stale' | 'no-coord';
  readonly remoteRef?: string;                 // coord-remote ref name
  readonly lastSyncAt?: string;                // ISO-8601; reader-side last successful coord-fetch
}
```

`msn show <id>:<repo>` reads these fields for tabular display.

**MINOR-R1.3 — F-V4.4 tag-namespace disambiguation:**

Coord-remote tag-namespace formalized as `refs/tags/missioncraft/<id>/<event>`:
- `refs/tags/missioncraft/<id>/terminated` — writer-daemon broadcasts on `msn complete`/`msn abandon`
- `refs/tags/missioncraft/<id>/config-update` — writer pushes on participant mutation; readers re-fetch config

Disambiguates from mission-id namespace `msn-<8-char-hash>`.

**MINOR-R1.4 — `MissionParticipant.principal` IdentityProvider relationship:**

Principal-id format spec'd: `<user>@<host>` or `<user>@<org>` (operator-supplied opaque-string; principal-equality via string-comparison at v1).

At writer-side `msn start`, engine calls `IdentityProvider.resolve()` → returns `{name, email}`; engine stores `principal: <email>` (or operator-overridable via `--principal <id>` flag) in `participants[]` writer entry. Reader-principal supplied at `msn join <id> --coord-remote <url> --principal <id>` (operator-side responsibility for cross-host consistency).

Cross-host principal-id consistency: operator-side concern. Substrate uses principal-id as opaque-string for participants[] membership.

`IdentityProvider` interface unchanged at v4.1 (no extension needed).

**MINOR-R1.5 — Option (a) apnex-org-specificity decoupling:**

§2.10.5 architect-recommendation reframed:

> **Architect-recommendation (v4.1 fold):** working-tree-derived path is the **recommended operator-pattern** (composes with apnex-style sibling-trees per `feedback_user_agent_identity`); substrate-engine doesn't enforce working-tree-naming. Substrate-default behavior: option (c) explicit-required when multi-principal-on-host detected (engine emits `MissionStateError("multi-principal host detected; configure workspace-root via configSet workspace-root <path> OR derive from working-tree per feedback pattern")`); operator-side configures via OperatorConfigSchema multi-principal extension OR working-tree-derived script.

This decouples v1.0 contract from apnex-org-specific operator-pattern; substrate stays operator-agnostic.

---

---

12 architect-flags from Survey §6 carried forward. Engineer round-1 audit per mission-67/mission-68 audit-rubric precedent.

**v1.2 fold note (per MINOR-1):** §3 reflects Phase-3-Survey + Phase-4-round-1 architect-flag enumeration. Refinement #1-#6 (cosmetic-rename + k8s-resource-shape + apply-additive + SDK-primary + Shape B + suffix-convention) ratified by Director outside the architect-flag mechanism (Phase-4-pre-design Director-direct). Future-version protocol: §3 architect-flags should re-audit on each major-version Survey-cycle (e.g., v2.0 Survey cycle would re-enumerate §3 flags from scratch). v1.x point-releases would surface ADDITIVE flags (Fnn+1) without disturbing prior dispositions.

| # | Flag | Class | Architect-recommendation |
|---|---|---|---|
| F1 | Q1=d ↔ Q5=b validation-strategy gap — comprehensive durability promise without chaos-test | **CRITICAL** | Layered approach per §2.6: theoretical coverage proof in v0.1 + targeted-integration-tests (3 per-failure-mode tests within Q5=b "integration" tier) + chaos deferred to v1.x |
| F2 | Durability mechanism choice — per-repo `.git/` commits vs out-of-band snapshot store vs IsomorphicGit `fs` adapter | MEDIUM | Layered combination per §2.6.1-§2.6.3: per-repo `.git/` commits (process-crash) + out-of-band snapshot store (disk-failure) + IsomorphicGit resumable-push (network-partition). Engineer round-1 may surface refinement. |
| F3 | API surface completeness for strict 1.0 — Phase 4 Design must enumerate all interface methods + CLI verbs comprehensively | MEDIUM | §2.1 enumerates 5 pluggable interfaces with full method signatures; §2.3.1 enumerates 19+ CLI verbs. Engineer round-1 verifies completeness; flag any missing surface. |
| F4 | Single-package install footprint mitigation — Q3=a ships all 5 pluggables; tree-shake-friendly export shape | MEDIUM | §2.3.2 export structure uses named exports (no barrel-index re-exports of side-effect-laden modules); side-effect-free module-level code. Engineer round-1 verifies tree-shake test on synthetic consumer. |
| F5 | CLI verb taxonomy completeness | MEDIUM | §2.3.1 enumerates 19+ verbs; engineer round-1 verifies completeness against use-case scenarios |
| F6 | Mission-config schema | MEDIUM | §2.5 specifies full schema with workspace-root + lock-timeout-ms + pluggable overrides + state-durability-config + auto-merge fields. Engineer round-1 may surface additional fields. |
| F7 | Workspace path configurability | MEDIUM | §2.4 spec: `MSN_WORKSPACE_ROOT` env-var OR `--workspace-root` CLI flag OR `workspace-root` mission-config field; default `~/.missioncraft` (root; sub-paths `config/` + `missions/<id>/`). Engineer round-1 verifies precedence rules |
| F8 | Versioning ramp pre-v1 | MINOR | §2.9.1 ships direct `v1.0.0` first-publish per Q2=a strict-1.0; no `v0.x` published to npm |
| F9 | Operator install path at v1 | PROBE | §2.9.1 npm-only via `npm install @apnex/missioncraft` + `npx msn`; standalone binary distribution deferred to v1.x or v2 |
| F10 | Test infrastructure choice | MINOR | §2.7.3 vitest per OIS-substrate consistency |
| F11 | CI/CD scope at v1 | MINOR | §2.9.3 GitHub Actions only |
| F12 | License + CLA | MINOR | §2.9.4 Apache 2.0; NO CLA at v1 |

**NEW v0.1 architect-flags (F13-F18 — engineer round-1 dispositions per §G):**

| # | Flag | Class | v0.2 Disposition |
|---|---|---|---|
| F13 | RemoteProvider opt-in pattern | MEDIUM | **RATIFIED v0.2 capabilities-gated throws-on-unsupported per §G engineer-counter**. Methods NOT optional; capabilities-flag check is caller-discipline; missioncraft throws `UnsupportedOperationError` if mismatch. Cleaner than redundant optional-method+capabilities-flag signal. §2.1.5 updated. |
| F14 | Lock-timeout default value | PROBE | **RATIFIED 24h per §G engineer concur**. §2.4 + §2.5 |
| F15 | Snapshot retention policy | MEDIUM | **RATIFIED keep last 5 OR last 24h whichever larger per §G engineer concur**. §2.5 schema fields: `snapshot-retention.{min-count: 5, min-age-hours: 24}`. |
| F16 | wip-branch cleanup post-mission | MEDIUM | **RATIFIED delete-on-complete + retain-on-abandon per §G engineer concur**. §2.5 schema field: `wip-branch-cleanup: delete-on-complete-retain-on-abandon`. |
| F17 | TypeDoc deploy mechanism | MINOR | **RATIFIED GitHub Pages from release.yml per §G engineer concur**. §2.9.3 updated with `permissions: pages: write` + `actions/setup-pages` per engineer pattern-recommendation. |
| F18 | Error class hierarchy | MEDIUM | **RATIFIED 10 classes (v0.3 count fix per §BB) — flat hierarchy under `MissioncraftError` base; all 9 specialized extend the base directly**: `MissioncraftError` (base; extends Error) + `LockTimeoutError` + `StorageAllocationError` + `RemoteAuthError` + `ApprovalDeniedError` + `MissionStateError` + `WorkspaceConflictError` + `ConfigValidationError` + `UnsupportedOperationError` + `NetworkRetryExhaustedError`. Total 10. Consumer can `instanceof MissioncraftError` for catch-all; specialized class for typed handling. No multi-level inheritance per v0.3 §BB. **v1.2 + v1.3 fold:** explicit invocation sites for `ConfigValidationError` are §2.5 unknown-schema-version reject + §2.5 atomic-write zod-validate-roundtrip failure + §2.3.1 SDK-side zod-validate-at-entry on `startMission({config})`/`applyMission({id, config})` (defense-in-depth per MEDIUM-R2.3). |

**NEW v0.2 architect-flags (F19-F23 surfaced during round-1 fold-pass; request engineer round-2 audit):**

| # | Flag | Class | Architect-recommendation |
|---|---|---|---|
| F19 | `commitToRef` plumbing primitive on GitEngine — does this break clean abstraction (commit + commitToRef as siblings)? OR is it a justified low-level primitive? | MEDIUM | Recommend keep as sibling primitive; `commit()` is the high-level surface (HEAD-aware); `commitToRef()` is plumbing-mode (HEAD-unaware) for §2.6.1 wip-mechanism. Engineer round-2 may argue alternative (e.g., commit() with options.targetRef discriminator). |
| F20 | Mission-config schema versioning — schema itself is committed contract under Strict-1.0; how do mission-config additions in v1.x ship without breaking? | MEDIUM | Recommend `mission-config-schema-version: 1` field; v1.x can ADD optional fields (additive-only); REMOVING or RENAMING fields requires v2 + new schema-version. Engineer round-2 may surface alternative. |
| F21 | StorageProvider interface bundles locking primitives — does this couple storage + lock concerns inappropriately? OR is it the cleanest spot? | MEDIUM | Recommend bundled per §G engineer-counter (vs 6th LockProvider pluggable). Workspace allocation + locking are tightly coupled (atomic). 6th pluggable would over-modularize. Engineer round-2 concur or argue extraction. |
| F22 | Changesets discipline ratification — `@changesets/cli` devDep adds CI ceremony; is the strict-1.0 enforcement worth the operator-friction? | MINOR | Recommend yes — strict-1.0 needs PR-time changeset discipline; alternative (manual semver bumps) drifts under load. Engineer concur or surface alternative. |
| F23 | Browser-shape post-v1 path — engineer §F flagged `LocalGitConfigIdentity` is Node-only; future browser support deferred. Should v1 explicitly REJECT browser usage at module-level? OR allow runtime shape detection? | PROBE | Recommend explicit Node-only at v1 (engines.node>=22 already constrains; v1.0 bumped from >=20 per §AAAAAA Node 20 EOL fold); browser-export consideration deferred to v2 if demand surfaces. No active rejection at module-level (operator gets natural import-error). |

---

## §4 Anti-goals (carry from Survey §5)

10 anti-goals. See Survey §5 for full table.

---

## §5 Tele alignment (echo Survey §4)

| Tier | Tele |
|---|---|
| Whole-mission primary | tele-3 Sovereign Composition + tele-2 Isomorphic Specification |
| Whole-mission secondary | tele-7 Resilient Operations + tele-11 Cognitive Minimalism |

---

## §6 Risks + open questions (architect-side; pre-engineer-audit)

### §6.1 Strict-1.0 commitment risk

Q2=a strict 1.0 from day-1 means v1.0.0 IS the committed contract. Any post-v1 breaking change requires major-version-bump. **Risk:** if the API has subtle issues not caught in v1 audit, v2 must launch to fix them — substantial cost vs `v0.x` ramp-up which would absorb minor fixes. **Mitigation:** thorough engineer round-1 + round-2 audit on §2.1 interface signatures + §2.3 personas; explicit completeness sweep per F3 + F5; field testing via sub-mission #2 (citation-validator) consuming missioncraft library-SDK before sub-missions #3-#11 commit to broader adoption.

### §6.2 Q1=d ↔ Q5=b validation-strategy gap (composes-with F1 CRITICAL)

Per F1 architect-recommendation: layered approach — design-time theoretical coverage + 3 targeted-integration-tests + chaos deferred. **Risk:** if the 3 targeted-integration-tests don't surface a subtle failure-mode interaction (e.g., process-crash mid-snapshot-write corrupts both `wip/` branch AND snapshot bundle), v1 ships with silent-defect surface. **Mitigation:** engineer round-1 audit specifically reviews per-failure-mode mechanism analysis; surface any cross-mechanism interaction concerns.

### §6.3 Patient timeline (Q4=c) absorbing scope-creep

6-8 week timeline gives runway BUT also expands the Phase 4 Design scope (this doc is already substantial; round-1 audit + folds + round-2 + folds will be substantial cycles). **Risk:** Phase 4 Design rounds consume 1-2 weeks of timeline; Phase 6 implementation gets compressed despite patient framing. **Mitigation:** thread-509 with maxRounds=20 (Director-ratified) absorbs extensive Phase 4 cycles; engineer round-1 audit can be rigorous without budget pressure.

### §6.4 IsomorphicGit version pinning

IsomorphicGit major-version churn would force missioncraft major-bump. **Mitigation:** pin IsomorphicGit to `^1.x` in v1; if IsomorphicGit ships `2.x`, missioncraft v2 absorbs the change.

### §6.5 gh-CLI dependency at runtime

`GitHubRemoteProvider` shells out to `gh` CLI. **Risk:** gh-CLI not installed; gh-CLI version-incompatibility. **Mitigation:** `authenticate()` validates `gh` presence + version at startup; clear error if unavailable. Pure-git mode is the always-available fallback.

---

## §7 Composition with calibration ledger

### §7.1 Calibration #62 audit-rubric application

Per parent F10 ratification (mandatory calibration #62 audit checklist in `docs/methodology/component-migration-playbook.md`), this Design's Phase 4 round-1 audit MUST apply the rubric. Specifically:
- Is any deferred-runtime-gate present in the Design that lacks integration-test coverage? (engineer round-1 substrate-walk audit)
- Are there inline `TODO` / `phase-2 scope` / `deferred` comments in the proposed code structure that need paired idea-link + integration-test gate?

### §7.2 Calibration cross-refs

- **Closures-applied:** none yet (Phase 4 Design v0.1)
- **Candidates-surfaced:** the layered-durability-mechanism-design pattern (§2.6) is itself a calibration candidate — first-canonical layered-3-mechanism approach for sovereign-component durability. Worth filing post-v1 ship as calibration-evolution.

---

## §8 Status / version-trajectory

| Version | Date | Trigger | Notes |
|---|---|---|---|
| v0.1 DRAFT | 2026-05-08 | architect-side draft post Survey envelope ratification @ SHA `efbc5ad` | pushed at SHA `e064f56` |
| v0.2 DRAFT | 2026-05-08 | engineer round-1 audit folds (thread-509 round 1/20) | substantial fold; pushed at SHA `4d585ad` |
| v0.3 DRAFT | 2026-05-08 | engineer round-2 audit folds (thread-509 round 3/20) | §AA index-pollution + §BB count fix + §CC waitMs/validityMs + §DD bundle-restoration + §EE deleteBranch + §FF F22 CI gate + §GG 5 refinements; pushed at SHA `4768ff8` |
| v0.4 DRAFT | 2026-05-08 | engineer round-3 audit folds (thread-509 round 5/20) | §AAA CRITICAL shell-out-to-native-git for bundle ops; §DDD.1+§DDD.2+§DDD.3; pushed at SHA `f5946b5` |
| v0.5 DRAFT | 2026-05-08 | engineer round-4 audit folds (thread-509 round 7/20) | §AAAA CRITICAL drop-GC-discipline; §BBBB HIGH event-conditional gate; §DDDD/§EEEE/§FFFF; pushed at SHA `8cd9afe` |
| v0.6 DRAFT | 2026-05-08 | engineer round-5 audit folds (thread-509 round 9/20) | §AAAAA CRITICAL drop-squash-rebase; §BBBBB mapping table; §GGGGG compositional folds; pushed at SHA `4ebbc69` |
| v0.7 DRAFT | 2026-05-08 | engineer round-6 audit folds (thread-509 round 11/20) | §AAAAAA CRITICAL Node EOL bump; §BBBBBB merge-row mapping; §CCCCCC gh CLI minimum-version; pushed at SHA `8bcc789` |
| v1.0 BILATERAL RATIFIED | 2026-05-08 | engineer round-7 ratify-clean (thread-509 round 15/20) + architect round-19 label-flip + bilateral-commit close | trivial doc-micro fold per §EEEEEE engineer round-7; pattern empirical-baseline LOCKED at n=6 with 7-round closure; pushed at SHA `7fb1643` on `agent-lily/m-branchcraft-v1-survey` branch (preserved as historical artifact under former M-Branchcraft-V1 name) |
| **v1.1 PENDING-BILATERAL-RATIFICATION** | **2026-05-08-evening** | **6 Director-direct architectural refinements (post v1.0 RATIFIED; pre-Phase-6)** | **this version; substantial reshape covering: (1) rename branchcraft→missioncraft + brc→msn; (2) drop "mission" verb prefix (k8s-resource-shape); (3) `apply` mid-mission additive-only; (4) SDK-primary contract surface (CLI demoted to consumer; OIS-orchestrated persona collapsed); (5) Shape B hybrid single-package + internal sovereign-module separation (Q3 refinement); (6) `-sdk`/`-cli`/`-api` suffix convention. New branch `agent-lily/m-missioncraft-v1-design`. New §2.4.1 mission state machine; new §2.5 declarative `repos: [...]` schema field; rewritten §2.3 personas + §2.3.2 CLI verb taxonomy in k8s-resource-shape; §2.9 package.json restructured for sovereign-module directory layout. Pending engineer round-1 audit on new thread (TBD; thread-510 candidate; maxRounds=20)** |
| **v1.2 PENDING-ROUND-2** | **2026-05-09** | **engineer round-1 audit fold (thread-510 round 1/20; 24 findings: 6 HIGH + 14 MEDIUM + 4 MINOR)** | **HIGH-1 duplicate §2.5 carryover deleted; HIGH-2 BRC_WORKSPACE_ROOT→MSN_WORKSPACE_ROOT remaining 3 touch-points; HIGH-3 README skeleton k8s-shape rewrite; HIGH-4 RepoSpec camelCase + naming-convention contract; HIGH-5 cross-mission repo-lock path; HIGH-6 --purge-config flag; MEDIUM-1 mission-id derivation (crypto.randomBytes); MEDIUM-2 parser disambiguation 5-rule grammar; MEDIUM-3 concurrent apply mission-lock; MEDIUM-4 startMission rollback; MEDIUM-5 startMission idempotency; MEDIUM-6 applyMission on non-existent id; MEDIUM-7 cold-start bundle ordering; MEDIUM-8 single tsconfig + rootDir build; MEDIUM-9 eslint-plugin-import zone-restrict; MEDIUM-10 package self-reference for CLI→SDK; MEDIUM-11 atomic-write discipline; MEDIUM-12 hub-id integrity boundary informational-only; MEDIUM-13 OIS adapter SDK-direct canonical; MEDIUM-14 ConfigValidationError class; MINOR-1 §3 architect-flags annotation; MINOR-3 getMissionStatus removed (getMission + listMissions cover); MINOR-4 applyMission returns MissionState. Pending engineer round-2 audit on thread-510.** |
| **v1.3 PENDING-ROUND-3** | **2026-05-09** | **engineer round-2 audit fold (thread-510 round 3/20; 15 findings: 1 HIGH + 11 MEDIUM + 3 MINOR)** | **HIGH-R2.1 grammar-inconsistency picks Shape (b) (4-positional `msn <mission> <repo-name> <git-verb>`; drop `repo` keyword + sub-action; README + parser + CLI table aligned); MEDIUM-R2.1 linter resolver-chain spec (tsconfig paths + eslint-import-resolver-typescript); MEDIUM-R2.2 startMission({config}) extended semantics (3-case branch on id-existence + state); MEDIUM-R2.3 SDK-side zod-validate-at-entry on startMission/applyMission (defense-in-depth); MEDIUM-R2.4 id-vs-name resolution boundary (CLI-side; SDK is id-only) + name-uniqueness invariant; MEDIUM-R2.5 repo-name auto-derivation reserved-words rejection; MEDIUM-R2.6 msn- prefix rejection on operator --name; MEDIUM-R2.7 naming-convention values preserved as wire-format (no transform on values); MEDIUM-R2.8 explicit mission-lock acquisition order in configured→started transition (7 steps); MEDIUM-R2.9 MissioncraftConfig SDK constructor shape committed; MEDIUM-R2.10 config precedence chain extended (CLI > env > mission-config > SDK constructor > built-in default); MEDIUM-R2.11 OIS adapter wire-format spec (Hub→adapter JSON kebab-case keys + zod-parse via MissionConfigSchema); MINOR-R2.1 mission-config-schema-version z.literal(1) number not string; MINOR-R2.2 tags Record-keys exempt from kebab→camelCase transform; MINOR-R2.3 F18 ConfigValidationError invocation-sites annotated. Pending engineer round-3 audit on thread-510.** |
| **v1.4 PENDING-ROUND-4** | **2026-05-09** | **engineer round-3 audit fold (thread-510 round 5/20; 14 findings: 1 HIGH + 11 MEDIUM + 2 MINOR)** | **HIGH-R3.1 provider string-name registry — closed registry at v1 (option a); built-in factory map for canonical 6 string-names; 3rd-party providers via SDK INSTANCE injection only; v2.x can open via Missioncraft.registerProvider; MEDIUM-R3.1 MissionConfigSchema + RepoSpecSchema added to SDK exports; MEDIUM-R3.2 StateDurabilityConfig interface committed (10 fields); MEDIUM-R3.3 concurrent create race-resolution via POSIX O_EXCL symlink at `<workspace>/config/.names/<slug>.yaml`; MEDIUM-R3.4 case-1 partial-failure rollback PRESERVE-CONFIG model (operator's config-input not lost); name-uniqueness check FIRST (BEFORE scaffold); MEDIUM-R3.5 id-vs-name resolution symlink-fast-path (O(1) name→id; linear-scan only for `msn list`); v1 documented operator-targeting limit ~1000s missions; MEDIUM-R3.6 algorithm Rule 6 post-dispatch arg-count validation (3 error-classes: missing-verb / missing-arg / extra-positional); MEDIUM-R3.7 algorithm Rule 2 extension (3 distinct sub-action vocabularies: mission-scoped + remote-scoped + config-scoped); MEDIUM-R3.8 tsc preserve-imports invariant (paths is type-resolution-only; no rewrite of `@apnex/missioncraft` imports post-tsc; v1 build pipeline tsc-only no bundler); MEDIUM-R3.9 lockTimeout single-shared-default (applies to BOTH mission-lock + repo-lock; per-acquire override at call-site); MEDIUM-R3.10 applyMission state-dependent semantics (created/configured = full upsert; started/in-progress = additive-only; terminal = error); MEDIUM-R3.11 mission.name validation enforced at every config-load via MissionConfigSchema (uniform across createMission + applyMission + startMission({config}) + YAML hydration + adapter MCP-payload-parse); MINOR-R3.1 Global flags table (workspace-root + wip-cadence-ms + snapshot-cadence-ms + lock-wait-ms + lock-validity-ms + output); MINOR-R3.2 createMission validation responsibility annotated. Pending engineer round-4 audit on thread-510.** |
| **v1.5 PENDING-ROUND-5** | **2026-05-09** | **engineer round-4 audit fold (thread-510 round 7/20; 14 findings: 1 HIGH cluster of 3 sub-issues + 11 MEDIUM + 2 MINOR)** | **HIGH-R4.1 PROVIDER_REGISTRY substrate-inconsistency cluster — (1) drop `'trust-all'` from identity sub-registry (TrustAllIdentity doesn't exist; was incorrect duplicate); (2) rename remote `'github'` → `'gh-cli'` for cross-section consistency with §2.5+SDK+CLI usage; (3) spec PureGitRemoteProvider as null-object at §2.1.5 (capabilities.supportsPullRequests=false; throws UnsupportedOperationError on PR/API ops); MEDIUM-R4.1 OS-support boundary v1=Linux+macOS only (POSIX symlink); Windows runtime-rejection at SDK constructor; v1.x can add lock-file alternative; MEDIUM-R4.2 `static readonly providerName: string` contract on all provider classes (engine reads instance.constructor.providerName for SDK-injection vs mission-config string-name validation); MEDIUM-R4.3 networkRetry default aligned to 5 (was inconsistent 3 in §2.3.1 vs 5 in §2.5+§2.6.3); MEDIUM-R4.4 applyMission name-rename flow under mission-lock (O_EXCL on new + unlink old + atomic-write); MEDIUM-R4.5 terminal-state symlink retention option (c) preserve both — name-namespace blocks reuse until --purge-config; create-vs-terminal-mission name-collision rejected; MEDIUM-R4.6 applyMission id-vs-config.mission.id mismatch → ConfigValidationError (option a fail-fast); MEDIUM-R4.7 applyMission mission-lock requirement uniformly across pre-start + post-start (lost-update race protection); MEDIUM-R4.8 CLI lookup id-vs-name regex prefix-detection (^msn-[a-f0-9]{8}$ → id-form; else name-form); MEDIUM-R4.9 mission-id wording-fix (id ALWAYS auto-generated; --name is ADDITIONAL alias not replacement); MEDIUM-R4.10 case-1 step-4+ explicit rollback boundary (preserve config + symlink across all step-4-7 failures); MEDIUM-R4.11 normalized arg-count grammar table at §2.3.2 (parser-implementation contract; 21 verb-paths spec'd); MINOR-R4.1 orphan-config workflow concur (msn list --status configured + abandon --purge-config sufficient at v1; no separate --cleanup-orphans); MINOR-R4.2 core/ 3-file boundary rationale (types.ts SDK-internal vs mission-types.ts resource vs mission-config-schema.ts runtime-zod). Pending engineer round-5 audit on thread-510.** |
| **v1.6 PENDING-ROUND-6** | **2026-05-09** | **engineer round-5 audit fold (thread-510 round 9/20; 11 findings: 1 HIGH + 7 MEDIUM + 3 MINOR)** | **HIGH-R5.1 v1.0-carryover SDK surface mismatch — DROP `remoteAdd / remoteList / remoteRemove` from SDK + CLI surfaces (option a); per-mission RemoteProvider configured via SDK constructor injection OR mission-config `remote.provider` field; `remote` removed from top-level reserved-verbs + remote-scoped sub-actions vocabulary; v1 doesn't ship multi-remote support (additive-evolution path open for v1.x); MEDIUM-R5.1 mission state persistence — single source of truth via `mission.lifecycle-state` field in mission-config YAML (option a); zod literal-string-union; mutated atomically on transitions; MEDIUM-R5.2 mission resource type interfaces committed at §2.3.1 — MissionStatePhase / MissionHandle / MissionState / MissionFilter / MissionConfig (Strict-1.0 SDK return-type shapes pinned); MEDIUM-R5.3 `created` × `apply` state-transition rows added (zero-repos no-op self-loop; ≥1-repo auto-promotion to `configured`); `created` is STABLE state confirmed (NOT instantaneous); MEDIUM-R5.4 Rule 6 disjunctive arg-shape grammar — flag-presence-first algorithm + 4 walk-through traces; mutually-exclusive error class added; MEDIUM-R5.5 `--purge-config` step-ordering Order A (lifecycle-state-persist FIRST, locks-release SECOND, workspace-destroy THIRD, config-purge LAST); crash-recovery preserves config; MEDIUM-R5.6 applyMission rename failure rollback boundary — config-write-FIRST reordering for cleaner failure semantics; ALL failure modes preserve operator-observable state; MEDIUM-R5.7 `--purge-config` on auto-id-only mission gracefully no-ops symlink-unlink if absent; MINOR-R5.1 static `providerName` examples added for 3 missing default-impls (TrustAllPolicy + LocalFilesystemStorage + IsomorphicGitEngine); MINOR-R5.2 concurrent create-with-name + complete-with-purge race composability note added; MINOR-R5.3 `Missioncraft.isPlatformSupported(): boolean` static helper added to SDK class for adapter UX. Pending engineer round-6 audit on thread-510.** |
| **v1.7 PENDING-ROUND-7** | **2026-05-09** | **engineer round-6 audit fold (thread-510 round 11/20; 10 findings: 0 HIGH + 4 MEDIUM + 6 MINOR; tail-of-decay zone)** | **MEDIUM-R6.1 lifecycleState `.default('created')` zod field; engine-controlled (operator-set value overwritten on first transition); MEDIUM-R6.2 mission.updated-at YAML field added (symmetric with created-at; mutated atomically on every transition + config-mutation); MEDIUM-R6.3 MissionState.workspacePath state-gating (populated only when workspace exists on-disk: in-progress; OR completed/abandoned with --retain); MEDIUM-R6.4 operator-config schema spec at §2.4 (file: ${MSN_WORKSPACE_ROOT}/operator.yaml; OperatorConfigSchema zod; closed key-namespace: defaults.* + provider-config.*; precedence chain extended: CLI > env > mission-config > SDK constructor > operator-config > built-in default; configGet/configSet zod-validate keys); MINOR-R6.1 MissionState symmetric pluggable-name exposure (5 fields: identityProviderName + approvalProviderName + storageProviderName + gitEngineProviderName + remoteProviderName?); MINOR-R6.2 --retain (set at start) + --purge-config (at complete/abandon) mutually-exclusive (orphan-workspace prevention); MINOR-R6.3 MissionFilter.nameLike case-insensitive plain substring (UNIX-CLI convention; not glob; not regex); MINOR-R6.4 Date round-trip discipline (ISO-8601 wire ↔ Date object TS via zod transform); nested kebab→camelCase transform recursive; MINOR-R6.5 msn create stdout (canonical id one-line; tab-delimited id+name with --name); MINOR-R6.6 RepoSpec.branch default derived AT RUNTIME-CLONE-TIME (not parse-time; preserves default-semantic on v1.x evolution); ROUND-6-ASK-4: lifecycle-state-persist via RMW-under-mission-lock (option c). Pending engineer round-7 audit on thread-510. ratify-clean predicted next round per thread-509 empirics. |
| **v1.8 PENDING-ROUND-8** | **2026-05-09** | **engineer round-7 audit fold (thread-510 round 13/20; 5 findings: 0 HIGH + 2 MEDIUM + 3 MINOR; convergence zone R7=5; ratify-clean predicted)** | **MEDIUM-R7.1 operator-config consultation boundary spec — CLI-internal Missioncraft construction consults operator-config for required pluggables; SDK-direct consumers DO NOT (sovereignty discipline; explicit-injection-only); optional fields uniform across both via precedence chain; MEDIUM-R7.2 env-var mapping closed list — 6 env-vars aligned 1:1 with §2.3.2 global flags (MSN_WORKSPACE_ROOT + MSN_WIP_CADENCE_MS + MSN_SNAPSHOT_CADENCE_MS + MSN_LOCK_WAIT_MS + MSN_LOCK_VALIDITY_MS + MSN_OUTPUT); other operator-config keys are operator-config-only at v1; MINOR-R7.1 updated-at initial value at create-time = same as created-at (created-at immutable); MINOR-R7.2 provider-config naming cleanup — `gh-cli.path` (provider-context-implicit); MINOR-R7.3 core/ 4-file boundary rationale extended (operator-config-schema.ts added). Pending engineer round-8 audit on thread-510. Ratify-clean predicted per thread-509 empirics convergence-zone behavior.** |
| **v1.8 BILATERAL RATIFIED** | **2026-05-09** | **engineer round-8 ratify-clean on thread-510 (round 15/20) + architect label-flip + bilateral-commit close** | **0 findings round-8; 8-round audit cycle close (R1=24 → R2=15 → R3=14 → R4=14 → R5=11 → R6=10 → R7=5 → R8=0); 93 findings folded; substantive-reshape envelope landed within thread-509 6-9 round prediction range. Strict-1.0 contract committed for `@apnex/missioncraft@1.0.0`. Implementation-ready; Phase 5 Manifest entry triggered. Architect-side commit pin: SHA `226aa46`.** |
| **v2.0 PENDING-BILATERAL-RATIFICATION** | **2026-05-09-late** | **3 Director-direct architectural refinements (Round-2; post v1.8 RATIFIED; pre-Phase-6)** | **this version; substantial reshape covering: (A) verb-first grammar (BREAKING — all first positionals are reserved verbs; eliminates v1.8 implicit-mission-selector shape); (B) `update` verb (additive — field-targeted mutations complementing `apply -f`; new typed SDK methods: renameMission/setMissionDescription/setMissionHubId/setMissionScope/setMissionTag/removeMissionTag); (C) `scope` template (additive — new first-class resource for multi-mission composition; hybrid resolution model option (c) snapshot-on-startMission per k8s-ConfigMap analogy; new SDK class methods + new CLI verb namespace + new schema + new state-machine + new workspace path). New branch `agent-lily/m-missioncraft-v2-design` off v1.8 RATIFIED at SHA `226aa46`. NEW §2.4.2 Scope state machine; NEW §2.5.1 Scope-config schema; rewritten §2.3.2 grammar (verb-first; 13 reserved-verbs; 5 sub-action vocabularies); extended §2.3.1 SDK class (renameMission/setMissionDescription/etc.; createScope/getScope/listScopes/updateScope/deleteScope/etc.; ScopeHandle/ScopeState/ScopeFilter/ScopeConfig/ScopeStatePhase interfaces); new core/scope-types.ts + core/scope-config-schema.ts source files. Pending engineer round-1 audit on new thread (TBD; thread-511 candidate; maxRounds=20).** |
| **v2.1 PENDING-ROUND-2** | **2026-05-09-late** | **engineer round-1 audit fold (thread-511 round 1/20; 15 findings: 5 HIGH + 7 MEDIUM + 3 MINOR; within predicted 10-18 envelope)** | **HIGH-1 createMission({repo}/{scope}) state-transition rows added (combined create + first-repo-add atomic; final state = configured); HIGH-2 cascade-protection atomicity model (c) optimistic concurrency at setMissionScope + scope-lock-held during deleteScope-scan; HIGH-3 Step 1.5 NEW (scope-inline under both scope-lock + mission-lock; scope-lock released BEFORE Step 2 clones); HIGH-4 mission.scope-id persists CANONICAL scp-<hash> only (CLI resolves name→id at write-time; scope-rename does NOT break mission-config refs); HIGH-5 --retain-config flag dropped from §2.4.2 (scopes are templates; no forensic value); MEDIUM-R1.1 setScopeTag/removeScopeTag SDK methods + CLI rows added (symmetric with mission tag-ops); MEDIUM-R1.2 reverse-index computed-on-demand at v1 (linear scan; v1.x can materialize); MEDIUM-R1.3 per-field state-restriction matrix (8 fields × 6 states); MEDIUM-R1.4 cross-resource lock-ordering rule (mission → scope → repos); MEDIUM-R1.5 setMissionScope re-validation discipline at write-time; MEDIUM-R1.6 schema-version independence; MEDIUM-R1.7 scope CLI prefix-detection (^scp-[a-f0-9]{8}$); MINOR-R1.1 deleteScope error message includes mission-id list (first-5 + +N more); MINOR-R1.2 namespace error-message disambiguation hint (msn vs scope cross-check); MINOR-R1.3 listMissionRepos removal annotation. Pending engineer round-2 audit on thread-511.** |
| **v2.2 PENDING-ROUND-3** | **2026-05-09-late** | **engineer round-2 audit fold (thread-511 round 3/20; 10 findings: 2 HIGH + 5 MEDIUM + 3 MINOR; pattern-decay R1=15 → R2=10 tracking thread-510 envelope)** | **HIGH-R2.1 NEW §2.6.5 Engine runtime model committed (option (c) on-disk POSIX-style locks with TTL + cooperative-tick at v1; no daemon; cadence-tick on operator-activity; new `tick` reserved-verb at §2.3.2 Rule 1 list now 14 verbs; daemon-mode deferred to v1.x as additive); HIGH-R2.2 state-machine table verb-first cross-fold cleanup (msn <id> repo-add/repo-remove rows updated to msn update <id> form); MEDIUM-R2.1 createMission --repo + --scope COMPATIBLE (option b; effective-repos union with conflict-resolution); MEDIUM-R2.2 applyMission scope-id mutation acquires scope-lock asymmetric vs setMissionScope optimistic (option c — different operation-cost tiers); MEDIUM-R2.3 getScope/listScopes opt-in `includeReferences` flag (default false; deleteScope always computes); MEDIUM-R2.4 OIS adapter integration shape — Scope is missioncraft-internal-only at v1 (option a); adapter validates scope-id reference exists via getScope; rejects on uncreated scope; MEDIUM-R2.5 startMission entry-condition relaxed to effective-repos truth-source (mission.repos UNION scope.repos ≥1 entry; state-string informational); MINOR-R2.1 explicit scope-mutation SDK methods list at scope-lock subsection (7 mutating + 3 read-only); MINOR-R2.2 8-step transition renumber (Step 1.5 → Step 2; clean numbering); MINOR-R2.3 cross-resource lock-ordering release-order semantic clarification (sequentially-held unrestricted; simultaneously-held reverse). Pending engineer round-3 audit on thread-511.** |
| **v2.3 PENDING-ROUND-4** | **2026-05-09-late** | **engineer round-3 audit fold (thread-511 round 5/20; 7 findings: 1 HIGH + 4 MEDIUM + 2 MINOR; pattern-decay R1=15 → R2=10 → R3=7 convergence-zone)** | **HIGH-R3.1 `tick` verb propagation — tickMission(id) SDK method added; CLI table row + arg-count row added; graceful no-op on pre-`started` missions per MINOR-R3.2; MEDIUM-R3.1 §2.6.1/§2.6.2 cooperative-tick wording aligned ("On operator-activity, if last X > N seconds ago"); MEDIUM-R3.2 effective-repos conflict-resolution validation timing (option a — every-mutation defense-in-depth; 5 trigger-points + operator recovery paths); MEDIUM-R3.3 stale-lock-takeover atomicity via POSIX link(2) primitive (closes lost-update race under concurrent expired-detection); MEDIUM-R3.4 cooperative-tick activity boundary (after-only; mutating-ops trigger; read-only ops don't); MINOR-R3.1 commentary renumber Step 1.5→Step 2 < Step 3; MINOR-R3.2 tickMission graceful no-op on pre-`started` missions. Pending engineer round-4 audit on thread-511. Ratify-clean predicted next round per pattern empirics. |
| **v2.4 PENDING-ROUND-5** | **2026-05-09-late** | **engineer round-4 audit fold (thread-511 round 7/20; 5 findings: 0 HIGH + 1 MEDIUM + 4 MINOR; pattern-decay R1=15 → R2=10 → R3=7 → R4=5 convergence-zone tail; ratify-clean predicted)** | **MEDIUM-R4.1 cross-validation lock-discipline asymmetric — addRepoToMission/setMissionScope STRICT (acquires mission-lock + scope-lock per cross-resource ordering); addRepoToScope OPTIMISTIC (scope-lock only; race-resolution at startMission Step 2 inline); MINOR-R4.1 tickMission return-type `?:` idiomatic (string | undefined; not null); MINOR-R4.2 cadence-tick trigger list extended (msn git tag + msn complete + msn abandon); MINOR-R4.3 cadence-tick lock-acquisition under existing mission-lock (single-cycle; closes race-window); MINOR-R4.4 tickMission partial-success semantics (wip-tick succeeds + snapshot-tick fails → return partial; no rollback; operator-retry via msn tick). Pending engineer round-5 audit on thread-511. Ratify-clean predicted per pattern empirics. |
| **v2.5 PENDING-ROUND-6** | **2026-05-09-late** | **engineer round-5 audit fold (thread-511 round 9/20; 2 micro findings: 0 HIGH + 0 MEDIUM + 2 MINOR; pattern-decay R5=2 convergence-zone tail; ratify-clean imminent)** | **MINOR-R5.1 effective-repos dedup-by-name precedence — mission-side wins (operator-explicit authoritative over scope-template-defaults; v1.x evolution path noted for opt-in scope-precedence); MINOR-R5.2 cadence-tick step-0 in terminal step-sequence (NEW pre-step-0 BEFORE lifecycle-state-persist; under existing mission-lock per MINOR-R4.3 single-cycle invariant; same step-0 for msn complete + msn abandon). Pending engineer round-6 audit on thread-511. Ratify-clean imminent per pattern empirics. |
| **v2.5 BILATERAL RATIFIED** | **2026-05-09-late** | **engineer round-6 ratify-clean on thread-511 (round 11/20) + architect label-flip + bilateral-commit close** | **0 findings round-6; 6-round audit cycle close (R1=15 → R2=10 → R3=7 → R4=5 → R5=2 → R6=0); 39 findings folded; substantive-reshape envelope landed within architect's predicted "Realistic 4-7 rounds close" range; smaller than thread-510's 8-round v1.x envelope per smaller refinement-count (3 vs 6) + mature v1.8 substrate carry-forward. v2.x SUPERSEDES v1.8 as implementation-target Strict-1.0 contract for `@apnex/missioncraft@1.0.0`. Implementation-ready; Phase 5 Manifest entry RE-TRIGGERED. Architect-side commit pin: SHA `5984334`.** |
| **v3.0 PENDING-BILATERAL-RATIFICATION** | **2026-05-09-late** | **8 Director-direct architectural refinements (Round-3; post v2.5 RATIFIED; pre-Phase-6)** | **this version; substantial reshape covering: (1) DROP `msn git` namespace + `*InMission` SDK methods (engineer-git-less workspace-hypervisor framing); (2) DROP `msn status` verb; (3) DROP cooperative-tick on operator-CLI-op-activity; (4) ADD `msn complete <id> <message>` 2-positional + atomic PR-set publish-flow; (5) CHANGE cadence-tick to filesystem-watch + per-mission daemon-watcher; (6) ADD `msn workspace <id> [<repo>]` verb; (7) SDK API consolidation — verb-polymorphism over resource-type per k8s-shape (resource-uniformity tele); 14 SDK methods (down from 30; ~53% reduction); MissionMutation + ScopeMutation discriminated-unions; ResourceMap interface for type-parameterized verb dispatch; **(8) Commit + push authentication semantics clarification-fold (NEW §2.6.6) — identity-capture timing at commit-firing-time; wip-commit vs squash-commit attribution divergence; single-RemoteProvider-per-mission constraint at v1; multi-org auth handling; AI-agent-provisioning discipline; failure modes + RemoteAuthError recovery.** Cumulative refinement: engineer-git-less code workspace hypervisor framing + k8s-shape resource-uniformity at SDK level + explicit operator-attribution semantics. Reserved-verbs: 14 → 13. Sub-action vocabularies: 5 → 4. SDK methods: 30 → 14. Engineer's typical CLI: 4-6 verbs. New branch `agent-lily/m-missioncraft-v3-design`. NEW §2.6.5 (filesystem-watch + per-mission daemon); NEW §2.6.6 (commit+push auth semantics); §2.4.1 NEW complete-step-sequence (8-step publish-flow); §2.3.1 SDK class consolidation; §2.3.2 CLI table updated. Pending engineer round-1 audit on new thread (TBD; thread-512 candidate; maxRounds=20). Realistic 5-8 rounds close per pattern empirics.** |
| **v3.1 PENDING-ROUND-2** | **2026-05-09-late** | **engineer round-1 audit fold (thread-512 round 1/20; 22 findings: 8 HIGH + 9 MEDIUM + 5 MINOR; within predicted 15-25 envelope)** | **HIGH-1 §2.3.2 CLI table SDK column updated for v3.0 generic-verb dispatch (~20 rows; mass replace v2.5 typed-method references); HIGH-2 §2.4.1 state-machine table updated for `complete`/`abandon` `<message>` required positional + publish-flow narrative; HIGH-3 per-field state-restriction matrix reshaped for MissionMutation discriminated-union; HIGH-4 NEW Step 7 daemon-watcher spawn inserted (8-step → 9-step transition); HIGH-5 lock-holder model reconciled (advisory coordination + crash-detection; not blocking-hold); HIGH-6 immediate dead-pid detection at every CLI invocation (sub-second; not 24h TTL); HIGH-7 delete<T> type-narrowed to DeletableResource (compile-time-error for delete('mission', id)); HIGH-8 ResourceMap.getOpts changed never→undefined (TS-idiomatic; no call-site ambiguity); MEDIUM-R1.1 NEW §2.4.1 atomic PR-set publish-flow step-sequence (8-step complete-flow with idempotent retry via mission.publishStatus); MEDIUM-R1.2 squash via shell-out to `git merge --squash` (parallel to §2.6.2 native-git breach); MEDIUM-R1.3 chokidar runtime-dep adopted for cross-platform fs-watch; MEDIUM-R1.4 SIGTERM shutdown + lockfile-state-watch tick-trigger IPC; MEDIUM-R1.5 apply(config) supersedes v1.5 MEDIUM-R4.6 id-validation (single source of truth); MEDIUM-R1.6 MissionMutation runtime state-restriction enforcement; MEDIUM-R1.7 tick + daemon coordination (lockfile-state-watch IPC); MEDIUM-R1.8 workspace error class = MissionStateError with actionable message; MEDIUM-R1.9 mission.publishStatus + MissionState.publishedPRs schema fields added; MINOR-R1.1 msn resume verb deferred to v3.x (auto-detection covers); MINOR-R1.2 --retain + daemon-death on terminal documented; MINOR-R1.3 apply migration impact noted (v2.5→v3.0 shape change); MINOR-R1.4 tick 3-return-shape under daemon-model nuance; MINOR-R1.5 verb count verified at 13. Pending engineer round-2 audit on thread-512.** |
| **v3.2 PENDING-ROUND-3** | **2026-05-09-late** | **engineer round-2 audit fold (thread-512 round 3/20; 11 findings: 0 HIGH + 6 MEDIUM + 5 MINOR; pattern-decay R1=22 → R2=11 tracking thread-510 envelope)** | **MEDIUM-R2.1 daemon shutdown ordering — Step 1 lockfile-state-watch flush (daemon stays alive); Step 4 SIGTERM terminate (distinct events); MEDIUM-R2.2 daemon shutdown timeout 60s default + SIGKILL fallback + auto-recovery via dead-pid detect; MEDIUM-R2.3 daemon log-path at <workspace>/missions/<id>/.daemon.log (operator-DX visibility); MEDIUM-R2.4 Step 6/7 reorder — daemon-spawn FIRST, state-yaml-persist AFTER (clean atomic rollback); bundle from Step 5 PRESERVED on rollback as forensic-artifact; MEDIUM-R2.5 §2.9.1 chokidar runtime-dep added (4 deps total; verified cross-fold); MEDIUM-R2.6 publishMessage immutability — persisted at first complete; immutable post-write; idempotent retry uses original; new message ignored with warning; MINOR-R2.1 --retain preserves local mission-branch in Step 6; MINOR-R2.2 SIGINT operator-cancellation mid-publish-loop graceful exit (publishStatus = 'failed'); MINOR-R2.3 publish-status zod validation primitive; MINOR-R2.4 apply mid-mission interaction with publishStatus; MINOR-R2.5 workspace() warning on terminal-retain. Plus round-2-asks responses folded: pid-reuse mitigation via lockfile-startTime (cross-platform via /proc/<pid>/stat Linux + ps -p macOS); GitEngine.squashCommit interface extension (3rd-party-overridable; default shells out); advisory yield semantic spec'd (queue-not-fire during CLI-window); publishStatus field-lifecycle (persist as forensic-history; cleared on --purge-config). Pending engineer round-3 audit on thread-512.** |
| **v3.3 PENDING-ROUND-4** | **2026-05-09-late** | **engineer round-3 audit fold (thread-512 round 5/20; 9 findings: 1 HIGH + 4 MEDIUM + 4 MINOR; pattern-decay R3=9 convergence-zone start)** | **HIGH-R3.1 GitEngine.squashCommit interface declared at §2.1.4 (cross-fold render-gap closure; capabilities-gated; default IsomorphicGitEngine shells out to git merge --squash + git commit); MEDIUM-R3.1 pid-reuse mitigation primitive simplified to POSIX-portable `ps -p <pid> -o etimes=` (cross-platform; no /proc parsing); MEDIUM-R3.2 advisory-yield event-queue OS-bounded at v1 (operator-targeting note for OOM under long-running publish-flow); MEDIUM-R3.3 publishedPRs YAML-persisted (mission.published-prs[] field; eliminates runtime gh-cli round-trips on getMission); MEDIUM-R3.4 lockfile schema updated with new fields (startTime + pendingFlushBeforeComplete + pendingTick); MINOR-R3.1 Step 6 spawn-failure bundle proliferation note (retention-policy GCes per §2.6.2); MINOR-R3.2 msn list publishStatus column default-omit + opt-in flag; MINOR-R3.3 publishStatus/publishedPRs lifecycle-state documentation; MINOR-R3.4 Step 7 atomic-write-failure rollback (SIGTERM daemon + release locks); abandon-message field added (separate from publish-message); §2.4.1 Step 1 timeout fallback (proceed to Step 2 with warning); GitEngine.squashCommit default impl mechanism (git merge --squash + git commit); daemon-log-path destruction on workspace-destroy. Pending engineer round-4 audit on thread-512.** |
| **v3.4 PENDING-ROUND-5** | **2026-05-09-late** | **engineer round-4 audit fold (thread-512 round 7/20; 6 findings: 0 HIGH + 3 MEDIUM + 3 MINOR; pattern-decay R1=22 → R2=11 → R3=9 → R4=6 convergence-zone deepening)** | **MEDIUM-R4.1 abandon partial-failure recovery model (NEW 7-step abandon step-sequence with mission.abandonProgress field — values: tick-fired/daemon-killed/locks-released/branches-cleaned/workspace-destroyed/config-purged; symmetric with publishStatus discipline; idempotent retry resumes from failed step; mission stays 'in-progress' until terminal step); MEDIUM-R4.2 IsomorphicGitEngine implementation-mapping table updated with squashCommit row (cross-fold render-gap closure from HIGH-R3.1; documents shell-out + 3rd-party pure-TS override mechanism + UnsupportedOperationError fallback); MEDIUM-R4.3 squashCommit dispatch chain handles BOTH method-undefined AND throws-on-invocation cases (typeof check + try/catch UnsupportedOperationError → engine-internal fallback shell-out); MINOR-R4.1 squashCommit precondition (clean working-tree; engine ensures via publish-flow Step 1 daemon-flush; race-edge MissionStateError("workspace dirty post-flush; retry msn complete")); MINOR-R4.2 publish-message + abandon-message coexistence semantics (both preserved as forensic-history; clean lifecycle has only one populated; cleared on --purge-config); MINOR-R4.3 step-sequence cross-section reference precision (prefix with "9-step transition Step N" / "publish-flow Step N" / "abandon-flow Step N"). Pending engineer round-5 audit on thread-512.** |
| **v3.5 PENDING-ROUND-6** | **2026-05-09-late** | **engineer round-5 audit fold (thread-512 round 9/20; 4 findings: 0 HIGH + 2 MEDIUM + 2 MINOR; pattern-decay R1=22 → R2=11 → R3=9 → R4=6 → R5=4 convergence-zone tail; tracks thread-510 envelope shape)** | **MEDIUM-R5.1 abandon-flow atomic terminal lifecycle-advance (Step 3 persists abandonMessage ONLY — NOT lifecycle-state; mission stays 'in-progress' throughout cleanup-flow; NEW Step 8 atomic-advance lifecycle-state to 'abandoned' after final cleanup; closes v3.4 contradiction with terminal-immutability rule; abandonProgress value-set extended with 'message-persisted' for Step 3 progress-marker; symmetric with publish-flow atomic terminal advance discipline); MEDIUM-R5.2 abandon-flow Step 5 per-repo cleanup granularity (NEW mission.abandonRepoStatus: Record<string, 'pending' | 'cleaned' | 'failed'> field added to MissionState interface + YAML schema; Step 5 attempts per-repo cleanup; per-repo failure marks 'failed' and continues (not abort); abandonProgress advances to 'branches-cleaned' only when ALL repos = 'cleaned'; idempotent retry re-attempts 'failed'+'pending' repos; symmetric with publishStatus discipline); MINOR-R5.1 abandonProgress final-value lifecycle docstring (MissionState interface enumerates final-values: undefined / 'workspace-destroyed' / 'config-purged' transient / mid-flow values; closes operator-DX confusion); MINOR-R5.2 abandonInProgress lockfile flag (NEW LockfileState transient field set at Step 2 entry; cleared at Step 4 lock-release; concurrent CLI invocation between Step 2 SIGTERM-dead-pid and Step 4 lock-release detects flag + skips dead-pid daemon-respawn with MissionStateError; closes abandon-mid-flow concurrent-CLI race). Pending engineer round-6 audit on thread-512.** |
| **v3.6 PENDING-ROUND-7** | **2026-05-09-late** | **engineer round-6 audit fold (thread-512 round 11/20; 3 findings: 0 HIGH + 1 MEDIUM + 2 MINOR; pattern-decay R1=22 → R2=11 → R3=9 → R4=6 → R5=4 → R6=3 convergence-zone deep tail; round-7 ratify-clean predicted per pattern empirics; matches thread-510 R8=0 envelope)** | **MEDIUM-R6.1 concurrent-CLI dispatch logic for abandon-flow Steps 5-8 post-lock-release (mission-config-based abandonProgress signal — survives lockfile-delete at Step 4; CLI dispatch preflight checks lifecycleState='in-progress' + abandonProgress!==undefined → routes per abandon-flow logic: msn abandon retry idempotent-resume; read-only ops allowed; mutating ops rejected with MissionStateError; daemon-respawn SKIPPED; full coverage Steps 2-7 via lockfile.abandonInProgress + mission.abandonProgress); dead-pid detection extended 6→7 ordered checks (Step 1 mission-config preflight added). MINOR-R6.1 atomic single-lock-cycle integration (Step 8 lifecycle-advance integrated into Step 6 transaction — eliminates v3.5 disjunctive "OR" + race-window between Step 7 release and Step 8 re-acquire; matches single-lock-cycle invariant; Step 8 demoted to marker-only). MINOR-R6.2 'workspace-handled' marker rename (renamed 'workspace-destroyed' → 'workspace-handled' across MissionState interface + §2.5 YAML schema + §2.4.1 abandon-flow + §2.6.5 fold-notes; --retain-aware semantic; §8 historical rows preserved). Pending engineer round-7 audit on thread-512 — ratify-clean target.** |
| **v3.6 BILATERAL RATIFIED** | **2026-05-09-late** | **engineer round-7 ratify-clean on thread-512 (round 13/20; 0 findings; converged=true + close_no_action staged); 7-round Phase 4 audit cycle closed; 55 total findings folded; pattern matches thread-510 v1.x envelope shape** | **NO new edits this commit; label-flip ONLY (header v3.6 PENDING-ROUND-7 → v3.6 BILATERAL RATIFIED + §8 status row + commit-pin trail). v3.x SUPERSEDES v2.5 as implementation-target Strict-1.0 contract for `@apnex/missioncraft@1.0.0`. Phase 5 Manifest entry trigger fires post-thread (re-trigger on v3.x close; v2.5 trigger superseded). Architect-side post-ratification: bilateral-commit close on thread-512; v3.6 BILATERAL RATIFIED commit pin on `agent-lily/m-missioncraft-v3-design` branch.** |
| **v4.0 PENDING-BILATERAL-RATIFICATION** | **2026-05-10** | **12 scope items rolled up from idea-265 multi-participant Concept (post v3.6 BILATERAL RATIFIED; bilateral architect↔Director walkthrough 2026-05-10; Director-doctrine Lean 7 post-ratify revisitation)** | **this version; substantial reshape covering: (1) mission-wide participant granularity (NEW `mission.participants[]` field with role-typed entries: writer/reader); (2) strict-enforce reader workspace mode (filesystem 0444); (3) sync cadence reuses `wip-cadence-ms` (single knob); (4) reader-side actions = pure-read at v1 (comment/annotate/line-tied-thread deferred to v1.x); (5) wip-push to coordination remote conditional on readers (solo writer-only missions stay local-only; matches v3.6 baseline); (6) coordination-point configurable per topology (`mission.coordination-remote` field; same-host = local bare repo; cross-host = network remote); (7) workspace-root principal-scoped per-agent (existing `configSet workspace-root` mechanism preserved; default-resolution TBD per Director-pick); (8) substrate-coordinate addressing convention NEW (`<mission-id>:<repo>/<path>` single-string format; principal-portable; gsutil-style); (9) `msn workspace` extends to substrate-coordinate granularity (file-level resolution); (10) substrate-coordinate addressing applies uniformly across all verbs that take resource-id (`msn show`/`msn list`/`msn workspace`); (11) `msn list <coord>` drill-down semantics (row-per-resource at coordinate-granularity); (12) v1.x deferrals codified per Lean 6 YAGNI. Cumulative refinement: multi-participant missions with read-only role + cross-host workspace sync. New branch `agent-lily/m-missioncraft-v4-design` off v3.6 RATIFIED at SHA `e581a21`. NEW §2.10 multi-participant extension section (interfaces + schema + reader-daemon spec + coord-remote spec + substrate-coordinate addressing); §2.5 mission-config schema extended (participants + coordination-remote fields); §2.6.5 daemon-watcher extended (reader-mode + push-on-cadence-conditional); §2.3.2 CLI table updated (substrate-coordinate addressing on workspace + show + list verbs). Pending engineer round-1 audit on new thread (TBD; predicted 5-7 round close envelope per pattern empirics for additive-extension cycles; substantive-but-additive extensions track tighter than substrate-shifts).** |
| **v4.1 PENDING-ROUND-2** | **2026-05-10** | **engineer round-1 audit fold (thread-513 round 1/20; 18 findings: 0 CRITICAL + 3 HIGH + 10 MEDIUM + 5 MINOR; within architect's predicted 15-20 envelope)** | **HIGH-R1.1 push attribution substrate-path correction (coord-remote push goes through GitEngine plain-git wire-protocol NOT RemoteProvider per §2.1.5 PureGitRemoteProvider clause; F-V4.7 reframed); HIGH-R1.2 workspace partition-spec table NEW §2.10.9 (7 subdirectories × disposition mapping; per-principal vs per-OS-user; coord-remote-sync mechanism for config); HIGH-R1.3 reader-daemon lockfile composition pick option (a) per-principal lockfile naming `<id>.<principal>.lock` (preserves v3.6 LockfileState schema; no structural change; cross-principal IPC via coord-remote tags); MEDIUM-R1.1 §2.5 mission-config schema body extensions (zod conditional-validation: coordinationRemote required IFF participants[] contains reader; exactly-1-writer at v1; MissionConfig interface extension); MEDIUM-R1.2 §2.6.5 daemon-watcher body extensions (per-principal lockfile naming; reader-mode chokidar config; coord-poll interval = wip-cadence-ms; push outside lock-cycle); MEDIUM-R1.3 §2.3.2 CLI grammar Rule N (single-positional-with-colon → coordinate-form; whitespace-in-coordinate rejected; reserved-verbs 13→15 with join/leave); MEDIUM-R1.4 §2.3.1 SDK class extensions (MissionMutation 3 new kinds: add-participant/remove-participant/set-coordination-remote via existing update<T> polymorphism); MEDIUM-R1.5 §2.4.1 per-field state-restriction matrix (3 new mutation rows; participant-mutations allowed mid-mission; coord-remote-change pre-started only); MEDIUM-R1.6 §2.6.6 commit+push auth coord-remote auth case (cross-host = git-native HTTPS-token-helper / SSH-key; same-host = filesystem-permissions); MEDIUM-R1.7 §2.4 OperatorConfigSchema multi-principal extension (workspace-root-by-principal map for option b/c; MSN_PRINCIPAL_ID env-var); MEDIUM-R1.8 §2.4.1 reader-side `msn join` 7-step `joined → reading` transition NEW (coord-clone + 0444 enforcement + reader-daemon-spawn); MEDIUM-R1.9 writer push-on-cadence outside brief lock-cycle (best-effort with retry-on-next-cadence; persistent-failure to .daemon.log); MEDIUM-R1.10 coord-remote granularity pick option (a) one bare repo per mission with per-repo refs; MINOR-R1.1 deferral list co-writer + multi-writer-tx collapsed; MINOR-R1.2 MissionState repos[] runtime-state extension (role/syncState/remoteRef/lastSyncAt); MINOR-R1.3 tag-namespace formalized as refs/tags/missioncraft/<id>/<event>; MINOR-R1.4 principal-id format `<user>@<host>` opaque-string at v1; IdentityProvider unchanged; MINOR-R1.5 working-tree-derived decoupled from substrate (recommended operator-pattern; substrate-default = explicit-required for multi-principal). Pending engineer round-2 audit on thread-513.** |
| **v4.2 PENDING-ROUND-3** | **2026-05-10** | **engineer round-2 audit fold (thread-513 round 3/20; 14 findings: 1 META-HIGH + 2 HIGH + 8 MEDIUM + 3 MINOR; over architect's predicted 8-12 envelope by ~17% per META-HIGH-R2.1 cascade)** | **STRUCTURAL-FLATTEN PASS per engineer's META-HIGH-R2.1 fix-recommendation. v4.2 commits inline-flatten of HIGHEST-LEVERAGE v4.1 anchored prose into target sections: §2.5 mission-config schema body (zod schema + MissionParticipant + MissionConfig fields + lifecycle-state enum extension to 10 values; HIGH-R2.3 reader-side enum + MEDIUM-R1.1 + MEDIUM-R2.5 + lastPushSuccessAt field per MEDIUM-R2.8); §2.3.2 CLI grammar (Rule 1 reserved-verbs 13→15 with msn join + msn leave; Rule 5 colon-protection; NEW Rule 7 substrate-coordinate parsing per Rule N; CLI table extends with msn join/leave rows + msn workspace/show/list coord-form rows; arg-count grammar table extended; HIGH-R2.2 + MEDIUM-R1.3 + MEDIUM-R2.7 + F-V4.5 inline); §2.3.1 SDK class (workspace() signature accepts coordinate-form; NEW join() + leave() top-level methods per HIGH-R2.2 architect-pick; MissionMutation 3 new kinds: add-participant/remove-participant/set-coordination-remote; NEW MissionParticipant + MissionRepoState interfaces; MissionState extended with participants/coordinationRemote/lastPushSuccessAt; MissionStatePhase enum extended with 4 reader-side states: joined/reading/readonly-completed/leaving; MEDIUM-R1.4 + MEDIUM-R2.6 + MINOR-R1.2 inline). §2.10.10 marked with v4.2 STRUCTURAL-FLATTEN STATUS table — flattened entries annotated; remaining anchored entries (§2.6.5 daemon-watcher body / §2.6.6 commit+push auth / §2.4 OperatorConfigSchema / §2.4.1 state-restriction matrix + reader-side 7-step / push-cadence error-handling daemon-side) flagged as v4.3 work-items per partial-flatten approach. SDK method-count: 14 (v3.0) + 2 (v4.0 join/leave) = 16. **Substrate-mechanism contradictions (HIGH-R2.2 SDK-side surface partially resolved via SDK-top-level join/leave methods; MEDIUM-R2.1 chokidar conflation / MEDIUM-R2.2 0444+pull EACCES / MEDIUM-R2.3 git-clone arg-syntax / MEDIUM-R2.4 lockfile IPC contradiction NOT yet resolved — v4.3 work-items deferred per engineer's structural-flatten-only recommendation).** Pending engineer round-3 audit on thread-513.** |
| **v4.3 PENDING-ROUND-4** | **2026-05-10** | **engineer round-3 audit fold (thread-513 round 5/20; 6 findings: 0 META + 0 HIGH + 4 MEDIUM + 2 MINOR; within architect's predicted 3-6 envelope; META-HIGH-R2.1 CLOSED at v4.2)** | **R3 architect-picks committed: MEDIUM-R3.1 current-principal SDK context-dependency 4-step precedence chain INLINE-FLATTENED at §2.3.1 (per-call override → Missioncraft constructor → IdentityProvider.resolve email-derived → MSN_PRINCIPAL_ID env-var); MEDIUM-R3.2 picked option (a) zod superRefine role-based state-validation (less API surface than discriminator-union split; v4.4 inline at §2.5 zod schema); MEDIUM-R3.3 picked separate `<workspace>/missions/<id>/.daemon-state.yaml` for `lastPushSuccessAt` field (preserves mission-config atomic-write discipline; trade lost forensic-history post-terminal for lighter-weight write-discipline; v4.4 fold spec at §2.6.5 + §2.5 + remove from MissionConfig YAML schema); MEDIUM-R3.4 fold-provenance acknowledged inline at this status-row (v4.2 §2.5 YAML inline-flatten incidentally closes v3.5-baseline render-gap on `abandon-repo-status` field — was added to MissionState interface in v3.5 MEDIUM-R5.2 fold + §2.4.1 abandon-flow prose but never to §2.5 YAML schema example body in v3.5/v3.6; v4.2 closure improves doc-currency; provenance preserved via this addendum). MINOR-R3.1 lastPushSuccessAt lifecycle docstring at §2.3.1 + MINOR-R3.2 msn list 2-positional walk-through bundled into v4.4 work-items. v4.4 substantial work-items honestly tracked: §2.6.5 daemon-watcher body inline-flatten with substrate-mechanism fixes (R2.1 chokidar 2-loop + R2.2 0444+pull EACCES via git-fetch+checkout-index + R2.3 git-clone arg-syntax + R2.4 lockfile IPC contradiction via writer-daemon polls config on cadence-tick + M-R3.3 daemon-state.yaml mechanism + lastPushSuccessAt write-discipline); §2.6.6 commit+push auth coord-remote case; §2.4 OperatorConfigSchema multi-principal extension; §2.4.1 state-restriction matrix + reader-side 7-step `joined → reading` transition + state-machine cascade-mechanism (refs/tags/missioncraft/<id>/terminated detection); MINOR cleanup (M-R3.1/R3.2/R3.4 already inline; MINOR-R3.1/R3.2 + MINOR-R2.1/R2.2/R2.3 cleanup). Per engineer R3 §5 R4-prediction: v4.4 fold completes flatten + substrate-fixes; R4 finding-count predicted 2-4 (clean residual); v4.4 BILATERAL RATIFIED at R5 likely. Pending engineer round-4 audit on thread-513.** |
| **v4.4 PENDING-ROUND-5 (PARTIAL — R4 architect-picks only)** | **2026-05-10** | **engineer round-4 audit fold (thread-513 round 7/20; 4 findings: 0 META + 0 HIGH + 2 MEDIUM + 2 MINOR; within architect's predicted 2-4 envelope ✓)** | **R4 architect-picks committed: MEDIUM-R4.1 ResourceMap.mission.getOpts/listOpts extended from `undefined` → `{ principal?: string }` (option (a); per-call current-principal override now type-supported); MEDIUM-R4.2 IdentityProvider.resolve email-verbatim coercion + invocation-context broadening note (full-email used as principal-id; substrate doesn't munge; v4.0 broadens IdentityProvider.resolve() invocation from commit-firing-time to query-time — composability: idempotent + side-effect-free). Both inline-flattened at §2.3.1 SDK class current-principal precedence-chain comment-block. **Substantial v4.4 bundle DEFERRED to subsequent v4.4 commit (architect-side context-budget separation; v4.4 will be 2-commit fold)**: §2.6.5 daemon-watcher body inline-flatten with substrate-mechanism fixes (R2.1 chokidar 2-loop; R2.2 0444+pull EACCES via git-fetch+checkout-index; R2.3 git-clone arg-syntax; R2.4 lockfile IPC contradiction via writer-daemon polls config on cadence-tick; M-R3.3 .daemon-state.yaml mechanism); §2.6.6 commit+push auth coord-remote case (+ M-R4.2 invocation-context broadening fold inline); §2.4 OperatorConfigSchema multi-principal extension; §2.4.1 state-restriction matrix (3 new mutation rows) + reader-side 7-step transition + state-machine cascade-mechanism; MINOR-R3.1 + MINOR-R3.2 + MINOR-R4.1 + MINOR-R4.2 cleanup; §2.10.10 STATUS table closeout to all-rows `INLINE-FLATTENED ✓`. Per engineer R4 §4 R5-prediction: substantial v4.4 fold completes the bundle; R5 finding-count predicted 0-2 (ratify-clean target); v4.x BILATERAL RATIFIED at R5 OR R6 per pattern empirics. Pending engineer round-5 audit on thread-513.** |
| **v4.4 PENDING-ROUND-6 (SUBSTANTIAL)** | **2026-05-10** | **architect-side substantial v4.4 fold completion (post engineer R5 picks-correctness clean-pass; 0 findings); 2-commit v4.4 pattern complete** | **SUBSTANTIAL v4.4 fold INLINE-FLATTENS all remaining anchored entries from §2.10.10 STATUS table into target sections: NEW §2.6.5.v4 multi-participant daemon-watcher extensions sub-section (reader-mode 2-loop spec per MEDIUM-R2.1 chokidar fs-watch Loop A + Node setInterval timer-poll Loop B; writer push-on-cadence-conditional outside lock-cycle per MEDIUM-R1.9; writer-daemon polls config on cadence-tick to detect participant-list-change per MEDIUM-R2.4; .daemon-state.yaml mechanism per MEDIUM-R3.3; git-clone --branch arg-syntax fix per MEDIUM-R2.3; git fetch + checkout-index --prefix mechanism per MEDIUM-R2.2 closing 0444+pull EACCES; per-principal lockfile naming per HIGH-R1.3 preserved); NEW §2.6.6.v4 multi-participant auth extensions sub-section (cross-host = git-native HTTPS-token-helper / SSH-key per HIGH-R1.1 substrate-path correction; same-host = filesystem-permissions; reader credential-helper = operator-side; IdentityProvider invocation-context broadening from commit-firing-time to query-time per MEDIUM-R4.2 + idempotent-side-effect-free invariant; full-email-verbatim coercion); §2.4 OperatorConfigSchema extended with `defaults.workspace-root-by-principal` map + multi-principal-host detection note per MEDIUM-R1.7; NEW §2.4.1.v4 multi-participant state machine extensions sub-section (7-step `joined → reading` transition spec per MEDIUM-R1.8; state-machine cascade-mechanism via refs/tags/missioncraft/<id>/terminated per HIGH-R2.3; per-field state-restriction matrix extension with 3 new mutation rows per MEDIUM-R1.5 + reader-side ALL-mutations-rejected); §2.5 lastPushSuccessAt YAML field REMOVED per MINOR-R4.2 (lives in .daemon-state.yaml; field RETAINED on MissionState interface engine-derived); §2.5 NEW zod superRefine role-based state-validation block per MEDIUM-R3.2 (rejects writer-side enum-values in reader-side config + vice versa); §2.10.10 STATUS table closeout — ALL ENTRIES marked `INLINE-FLATTENED ✓` (META-HIGH-R2.1 fold-discipline regression FULLY CLOSED); MINOR-R3.1/R3.2/R4.1 dispositions inline-acknowledged in STATUS table. Substantial-bundle complete; no v4.5 work-items deferred. Per engineer R4 §4 R5-prediction + R5 §1 close-projection: predicted close v4.4 BILATERAL RATIFIED at R6 OR R7 per pattern empirics; R6 finding-count predicted 0-2 (load-bearing fold lands clean OR small-residual fold cycle). Pending engineer round-6 audit on thread-513.** |
| **v4.5 PENDING-ROUND-7** | **2026-05-10** | **engineer round-6 audit fold (thread-513 round 11/20; 8 findings: 0 META + 0 HIGH + 4 MEDIUM + 4 MINOR; over architect's predicted 0-2 envelope per substrate-mechanism re-spec catch-net pattern)** | **R6 substrate-mechanism precision corrections committed: MEDIUM-R6.1 push-refspec source-vs-destination correction (`refs/heads/wip/<id>:refs/heads/<repo-name>/wip/<id>`; local writer-repo wip is unprefixed; coord-remote namespace uses `<repo-name>/` prefix per MEDIUM-R1.10 fold); MEDIUM-R6.2 Loop B engine-internal tree-extraction pick `git archive | tar -xC --mode=0444` (replaces v4.4 git-checkout-index INDEX-operation; cleanest tree-extraction with mode-override; brief writable-window managed via `.daemon-tx-active` sentinel-file suppressing chokidar Loop A during extract); MEDIUM-R6.3 NEW Step 3.5 atomic-write `lifecycle-state: joined` to per-principal config (parallel-discipline with writer-side `'started'` transient state per v3.6 §2.4.1 9-step Step 7; captures in-flight state for crash-recovery on mid-flow `msn join` failure); MEDIUM-R6.4 zod schema-factory pattern correction (`makeMissionConfigSchema(role)` returns closure-captured-context schema; replaces v4.4 incoherent `engine.deriveOwningPrincipalRole(file-path)` pseudocode; backward-compat: parse-sites without role default to writer-role for v3.6-baseline behavior). MINOR-R6.1 chokidar `ignored` glob-patterns explicitly anchored with `'**/'` prefix + `.daemon-tx-active` sentinel-file; MINOR-R6.2 config-update tag-mechanism spell-out (writer pushes mission-config to dedicated `refs/heads/config/<id>` branch + fires tag pointing same commit; reader fetches branch+tag together; reads from branch tip via `git show '<branch>:config/<id>.yaml'`); MINOR-R6.3 §2.10.3 worked-example extended with config-branch + tag-namespace (refs/heads/config/m-foo + refs/tags/missioncraft/m-foo/config-update + refs/tags/missioncraft/m-foo/terminated); MINOR-R6.4 non-participant config-mutation propagation generalized (writer-daemon polls config; on ANY mutation detection → push branch + fire config-update tag; cross-principal config-currency preserved). Per engineer R6 §4 R7-prediction: bounded-scope substrate-mechanism corrections; R7 finding-count predicted 0-2 (ratify-clean target); v4.5 BILATERAL RATIFIED at R7 OR R8 (small-residual fold cycle). Pending engineer round-7 audit on thread-513.** |
| v4.x BILATERAL RATIFIED (planned) | TBD (predicted v4.5 BILATERAL RATIFIED at R7 OR R8 per pattern empirics; tracks within original 5-7 close envelope upper bound) | engineer round-N converge-close on thread-513 + architect label-flip + bilateral-commit close | architect-side commit pin + Phase 5 Manifest entry trigger (re-trigger on v4.x close; v3.6 trigger preserved as implementation-target until v4.x close) |

**Phase 4 dispatch destination (v1.1 cycle):** greg / engineer; new thread (TBD; thread-510 candidate); **maxRounds=20** per Director directive for substantive architectural reshapes; semanticIntent=seek_rigorous_critique. Realistic 6-9 rounds close per thread-509 pattern empirics for substantive reshapes.

**Architect-side commit pins:** v0.1 → `e064f56`; v0.2 → `4d585ad`; v0.3 → `4768ff8`; v0.4 → `f5946b5`; v0.5 → `8cd9afe`; v0.6 → `4ebbc69`; v0.7 → `8bcc789`; v1.0 BILATERAL RATIFIED → `7fb1643` (on `agent-lily/m-branchcraft-v1-survey` branch; historical artifact under former M-Branchcraft-V1 name); v1.1 PENDING-BILATERAL → `aa35be2` (on `agent-lily/m-missioncraft-v1-design` branch); v1.2 → `b27b579`; v1.3 → `5b43351`; v1.4 → `22f1778`; v1.5 → `8663f9e`; v1.6 → `dc24188`; v1.7 → `169b9cf`; v1.8 PENDING-ROUND-8 → `f48ee99`; v1.8 BILATERAL RATIFIED → `226aa46` (on `agent-lily/m-missioncraft-v1-design` branch; preserved as historical artifact); v2.0 PENDING-BILATERAL → `7edd81a` (on `agent-lily/m-missioncraft-v2-design` branch); v2.1 PENDING-ROUND-2 → `94644bc`; v2.2 PENDING-ROUND-3 → `746f011`; v2.3 PENDING-ROUND-4 → `9bb6488`; v2.4 PENDING-ROUND-5 → `fa39830`; v2.5 PENDING-ROUND-6 → `77df359`; v2.5 BILATERAL RATIFIED → `5984334` (preserved as historical artifact); v3.0 PENDING-BILATERAL initial draft → `d534f4e` (6 Round-3 refinements); v3.0 Refinement #7 fold → `3652f65` (SDK API consolidation); v3.0 Refinement #8 fold → `afc56e4`; v3.1 PENDING-ROUND-2 → `b23ded3`; v3.2 PENDING-ROUND-3 → `aa75be4`; v3.3 PENDING-ROUND-4 → `269f226`; v3.4 PENDING-ROUND-5 → `3a2f7df`; v3.5 PENDING-ROUND-6 → `fa2f6b4`; v3.6 PENDING-ROUND-7 → `12408b8`; v3.6 BILATERAL RATIFIED → `e581a21` (architect-side label-flip post engineer round-7 ratify-clean on thread-512; on `agent-lily/m-missioncraft-v3-design` branch); v4.0 PENDING-BILATERAL → `59c7489` (12 scope items rolled up from idea-265 multi-participant Concept; on `agent-lily/m-missioncraft-v4-design` branch off v3.6 RATIFIED); v4.1 PENDING-ROUND-2 → `77bac38` (engineer round-1 fold; 18 findings dispositioned); v4.2 PENDING-ROUND-3 → `fdcf498` (engineer round-2 fold; META-HIGH-R2.1 structural-flatten of HIGHEST-LEVERAGE entries: §2.5 / §2.3.2 / §2.3.1; partial-flatten with v4.3 work-items honestly tracked); v4.3 PENDING-ROUND-4 → `97b9014` (engineer round-3 fold; M-R3.1 inline + M-R3.2/R3.3 architect-picks committed for v4.4 inline + M-R3.4 fold-provenance acknowledged); v4.4 PENDING-ROUND-5 (PARTIAL) → `efa18fd` (engineer round-4 fold; R4 architect-picks committed: M-R4.1 ResourceMap.mission.getOpts/listOpts extension + M-R4.2 IdentityProvider.resolve email-verbatim + invocation-context broadening); v4.4 PENDING-ROUND-6 (SUBSTANTIAL) → `62d5a9a` (substantial-bundle commit complete; full structural-flatten of all remaining anchored entries; META-HIGH-R2.1 fully closed; §2.10.10 STATUS table all-rows INLINE-FLATTENED ✓); **v4.5 PENDING-ROUND-7 → THIS COMMIT** (R6 substrate-mechanism precision corrections: push-refspec + Loop B git-archive|tar mechanism + 'joined' atomic-write Step 3.5 + zod schema-factory pattern + 4 MINOR fixes inline). Per `feedback_narrative_artifact_convergence_discipline.md` atomic edit→commit→push→dispatch pattern.

**Phase 4 dispatch destination (v3.0 cycle):** greg / engineer; new thread (TBD; thread-512 candidate); **maxRounds=20** per Director directive for substantive architectural reshapes; semanticIntent=seek_rigorous_critique. Realistic 5-8 rounds close per pattern empirics — **substantive substrate-shift envelope** (filesystem-watch model + complete-as-publish-flow are NEW substrate; comparable to v1.1 reshape's substrate-introduction surface; expect higher round-1 catch-rate ~15-20). Per `feedback_narrative_artifact_convergence_discipline.md` atomic edit→commit→push→dispatch pattern.

**Phase 4 dispatch destination (v2.0 cycle):** greg / engineer; new thread (TBD; thread-511 candidate); **maxRounds=20** per Director directive for substantive architectural reshapes; semanticIntent=seek_rigorous_critique. Realistic 4-7 rounds close per thread-509 + thread-510 pattern empirics for substantive reshapes (smaller envelope than v1.1 reshape since v1.8 substrate is mature; 3 refinements vs 6).
