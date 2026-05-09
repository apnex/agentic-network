# M-Missioncraft-V1 — Design v1.8 BILATERAL RATIFIED

**Status:** **v1.8 BILATERAL RATIFIED** (architect-side label-flip + bilateral-commit close 2026-05-09; engineer round-8 ratify-clean on thread-510 round 15/20). 8-round substantive-reshape audit cycle: R1=24 → R2=15 → R3=14 → R4=14 → R5=11 → R6=10 → R7=5 → **R8=0 ratify-clean**. Total **93 findings folded** across 8 rounds. Pattern-decay tracks thread-509 empirics in convergence-zone tail (substantive-reshape envelope; 8-round closure within 6-9 thread-509 prediction range). Composes from **v1.7 PENDING-ROUND-7** at SHA `169b9cf` (engineer round-6 fold-pass; 10 findings dispositioned) → v1.8 PENDING-ROUND-8 at SHA `f48ee99` (engineer round-7 fold-pass; 5 findings dispositioned) → **v1.8 BILATERAL RATIFIED** (this version; engineer round-8 ratify-clean closure). Trajectory: v0.1 → v0.7 → v1.0 BILATERAL RATIFIED on prior branch (preserved as historical artifact under former M-Branchcraft-V1 name at SHA `7fb1643` on `agent-lily/m-branchcraft-v1-survey` branch) → v1.1 PENDING-BILATERAL (Director-direct refinement reshape via 6 architectural refinements) → v1.2 → v1.3 → v1.4 → v1.5 → v1.6 → v1.7 → v1.8 → **v1.8 BILATERAL RATIFIED**. Strict-1.0 contract committed for `@apnex/missioncraft@1.0.0` — implementation-ready; Phase 5 Manifest entry triggered.

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

// Runtime zod schemas (v1.3 fold per MEDIUM-R3.1 — adapter + 3rd-party consumers need .parse() at integration boundary)
export { MissionConfigSchema, RepoSpecSchema } from './core/mission-config-schema';
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
  | 'created'        // scaffolded config; no repos
  | 'configured'     // ≥1 repo declared; not yet started
  | 'started'        // transient transition state during configured→in-progress
  | 'in-progress'    // active mission; workspace allocated; locks held
  | 'completed'      // terminal; complete-event fired
  | 'abandoned';     // terminal; abandon-event fired

interface MissionHandle {
  readonly id: string;          // canonical msn-<8-char-hash>
  readonly name?: string;       // optional human-friendly slug
}

interface MissionState {
  readonly id: string;
  readonly name?: string;
  readonly hubId?: string;
  readonly description?: string;
  readonly tags: Record<string, string>;
  readonly repos: readonly RepoSpec[];
  readonly lifecycleState: MissionStatePhase;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // Symmetric pluggable-name exposure (v1.7 fold per MINOR-R6.1) — runtime-introspection without re-parsing config
  readonly identityProviderName: string;
  readonly approvalProviderName: string;
  readonly storageProviderName: string;
  readonly gitEngineProviderName: string;
  readonly remoteProviderName?: string;     // PROVIDER_REGISTRY string-name (e.g., 'gh-cli', 'pure-git'); optional only because remote pluggable itself is optional
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
  readonly tags?: Record<string, string>;   // all-must-match
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
class Missioncraft {
  constructor(config: MissioncraftConfig);

  // Mission resource ops (the primary resource — k8s-shape)
  createMission(opts?: { name?: string }): Promise<MissionHandle>;            // scaffolds config; nothing realized; validates `name` against slug-format + reserved-verbs + msn- prefix + name-uniqueness via MissionConfigSchema; throws ConfigValidationError on violation (v1.4 fold per MINOR-R3.2)
  getMission(id: string): Promise<MissionState>;                              // describe (k8s describe)
  listMissions(filter?: MissionFilter): Promise<MissionState[]>;              // get (k8s get)
  startMission(input: string | { config: MissionConfig }): Promise<MissionHandle>;  // realize the declared state
  applyMission(input: { id: string, config: MissionConfig }): Promise<MissionState>;  // upsert (additive-only mid-mission per refinement #3); returns updated state (v1.2 fold per MINOR-4)
  completeMission(id: string, opts?: { purgeConfig?: boolean }): Promise<void>;       // terminal: release lock; destroy workspace
  abandonMission(id: string, opts?: { purgeConfig?: boolean }): Promise<void>;        // terminal: release lock; destroy workspace
  // (getMissionStatus REMOVED in v1.2 fold per MINOR-3; getMission(id) returns full MissionState including runtime status; listMissions(filter) for multi-mission listing)

  // Mission-config mutation (pre-start; or additive post-start)
  addRepoToMission(id: string, repo: RepoSpec): Promise<MissionState>;
  removeRepoFromMission(id: string, repoName: string): Promise<MissionState>;  // pre-start only
  listMissionRepos(id: string): Promise<RepoSpec[]>;

  // Per-mission git ops (delegate to GitEngine pluggable; namespaced by mission + repo)
  branchInMission(id: string, repoName: string, branchName: string, opts?: { from?: string }): Promise<void>;
  commitInMission(id: string, repoName: string, opts: CommitOptions): Promise<string>;
  pushInMission(id: string, repoName: string, opts?: PushOptions): Promise<void>;
  // ... full set of GitEngine ops scoped to mission + repo

  // Non-mission resource ops (operator configuration only)
  configGet(key: string): Promise<string | undefined>;
  configSet(key: string, value: string): Promise<void>;

  // (v1.6 fold per HIGH-R5.1: remoteAdd / remoteList / remoteRemove REMOVED — v1.0 carryover not reconciled with v1.1+ PROVIDER_REGISTRY model;
  //  RemoteProvider is now singleton-per-mission via SDK constructor injection OR mission-config remote.provider field; engine instantiates from PROVIDER_REGISTRY.
  //  v1 doesn't ship multi-remote support; v1.x can add named-multi-remote model if demand emerges via additive registerProvider expansion.)

  // Platform-support pre-check (v1.6 fold per MINOR-R5.3 — adapter UX helper)
  static isPlatformSupported(): boolean;     // returns false on Windows; adapter implementer can use at MCP-tool-list-time
}
```

**API stability commitment (Q2=a):** every method signature here is committed v1.0.0 contract. Post-v1 breaking changes require major-version-bump (`v1.x` → `v2.x`). Strict-1.0 from day-1; no `v0.x` ramp-up phase.

**Programmatic usage example (declarative-mission per refinement #3):**

```typescript
import { Missioncraft, LocalGitConfigIdentity } from '@apnex/missioncraft';

const mc = new Missioncraft({ /* defaults */ });

// Declarative mission (k8s-resource-shape)
const handle = await mc.createMission({ name: 'storage-extract' });
await mc.addRepoToMission(handle.id, {
  url: 'file:///mnt/agentic-network',
  branch: 'extract-storage-provider-source',
  base: 'main',
});
await mc.addRepoToMission(handle.id, {
  url: 'https://github.com/apnex-org/storage-provider',
  branch: 'initial-extraction',
});
await mc.startMission(handle.id);

// Or single-shot from config
const handle2 = await mc.startMission({
  config: parsedYAML,  // mission-config object; e.g., from Hub-delivered manifest
});

// Per-mission ops
await mc.branchInMission(handle.id, 'storage-provider', 'feature/refactor');
await mc.commitInMission(handle.id, 'storage-provider', { message: 'Initial extraction' });
await mc.pushInMission(handle.id, 'storage-provider');

// Additive apply mid-mission (per refinement #3)
await mc.applyMission({
  id: handle.id,
  config: { ...originalConfig, repos: [...originalConfig.repos, additionalRepo] },
});

// Terminal
await mc.completeMission(handle.id);
```

#### §2.3.2 Standalone-CLI persona — sovereign-module SDK consumer

The CLI binary `msn` lives in `src/missioncraft-cli/` as a separate sovereign module. It depends on `src/missioncraft-sdk/` as if external (no internal-source-private cross-imports). Operator inputs (CLI flags + positional args + YAML files) are translated to SDK method calls.

**CLI verb taxonomy — k8s-resource-shape (per refinement #2 drop "mission" verb prefix):**

Mission is the implicit primary resource; non-mission ops keep explicit resource prefixes (`remote`, `config`).

| Verb | Sub-verbs / Flags | SDK method | Description |
|---|---|---|---|
| `msn create` | `[--name <name>]` | `createMission({name})` | Scaffold mission config at `<workspace>/config/<id>.yaml`; auto-generates `msn-<8-char-hash>` id; optional `--name` for human-friendly slug. **stdout output (v1.7 fold per MINOR-R6.5):** prints canonical id one-line (`msn-a3bd610c\n`); with `--name`: prints id + name tab-delimited (`msn-a3bd610c\tstorage-extract\n`). Operator-discoverability of auto-id. |
| `msn list` | `[--status <state>] [--output json\|yaml]` | `listMissions({status})` | Table view of all missions (k8s `get`) |
| `msn show <id\|name>` | `[--output json\|yaml]` | `getMission(id)` | Detail view (k8s `describe`) |
| `msn <id\|name> repo-add <file\|url>` | `[--name <local-name>] [--branch <name>] [--base <branch>]` | `addRepoToMission(id, repo)` | Add repo to mission's declared config; mutates `<workspace>/config/<id>.yaml`; auto-derives local-name from URL last segment unless `--name` override |
| `msn <id\|name> repo-remove <repo-name>` | (no flags) | `removeRepoFromMission(id, name)` | Remove repo (pre-start only) |
| `msn <id\|name> repo-list` | `[--output json\|yaml]` | `listMissionRepos(id)` | List repos in mission config |
| `msn start <id\|name>` | `[--retain]` | `startMission(id)` | Realize the declared state — clones repos in parallel; allocates workspace; acquires locks |
| `msn start -f <path>` | `[--retain]` | `startMission({config: parsedYAML})` | Start from explicit YAML path (OIS-adapter integration shape) |
| `msn apply -f <path>` | (no flags) | `applyMission({id, config})` | Upsert (per refinement #3); additive-only mid-mission (repo-add); non-additive errors |
| `msn complete <id\|name>` | `[--purge-config]` | `completeMission(id, {purgeConfig?})` | Terminal — release locks; destroy workspace unless mission was started with `--retain`. `--purge-config` also deletes `<workspace>/config/<id>.yaml` (default: config preserved for mission-history). **v1.7 fold per MINOR-R6.2:** if mission was started with `--retain` AND `--purge-config` is supplied at complete-time → reject with `MissionStateError("--retain (set at start) + --purge-config (at complete) would orphan workspace; choose one")`. v1.2 fold per HIGH-6. |
| `msn abandon <id\|name>` | `[--purge-config]` | `abandonMission(id, {purgeConfig?})` | Terminal — release locks; destroy workspace; `--purge-config` deletes config (default: preserved). **v1.7 fold per MINOR-R6.2:** if mission was started with `--retain` AND `--purge-config` is supplied → reject with `MissionStateError("--retain + --purge-config would orphan workspace; choose one")`. v1.2 fold per HIGH-6. |
| `msn status [<id\|name>]` | `[--output json\|yaml]` | `getMission(id)` if id given else `listMissions()` (v1.2 fold per MINOR-3) | Runtime status (single mission OR all if no id) — `getMission` returns full `MissionState` including runtime status; `getMissionStatus` removed |
| **Per-mission git ops (scoped by mission + repo)** | | | |
| `msn <id> <repo-name> branch <name>` | `[--from <branch>] [--delete] [--force]` | `branchInMission` / `deleteBranchInMission` | Branch ops within a mission's repo |
| `msn <id> <repo-name> checkout <branch>` | (no flags) | `checkoutInMission` | Switch HEAD in a mission's repo |
| `msn <id> <repo-name> stage <paths...\|--all>` | (no flags) | `stageInMission` | Stage paths |
| `msn <id> <repo-name> commit` | `-m <message> [--amend] [--auto-stage]` | `commitInMission` | Commit |
| `msn <id> <repo-name> push` | `[--branch <name>] [--remote <name>] [--force] [--tags]` | `pushInMission` | Push |
| `msn <id> <repo-name> pull / fetch / merge / tag / log / revparse / status` | (varied flags) | (corresponding `*InMission` methods) | Wire + read ops |
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
| `msn create` | 0 | 0 | `--name <slug>` + global |
| `msn list` | 0 | 0 | `--status <state>`, `--output json\|yaml` + global |
| `msn show` | 1 (`<id\|name>`) | 0 | `--output json\|yaml` + global |
| `msn start` | 0 (with `-f <path>`) OR 1 (`<id\|name>`) | 0 | `-f <path>`, `--retain` + global |
| `msn apply` | 0 | 0 | `-f <path>` (required) + global |
| `msn complete` | 1 (`<id\|name>`) | 0 | `--purge-config` + global |
| `msn abandon` | 1 (`<id\|name>`) | 0 | `--purge-config` + global |
| `msn status` | 0 | 1 (`<id\|name>`) | `--output json\|yaml` + global |
| `msn <id\|name> repo-add` | 1 (`<file\|url>`) | 0 | `--name <slug>` + global |
| `msn <id\|name> repo-remove` | 1 (`<repo-name>`) | 0 | global |
| `msn <id\|name> repo-list` | 0 | 0 | `--output json\|yaml` + global |
| `msn <id\|name> <repo-name> branch` | 1 (`<branch-name>`) | 0 | `--from <branch>`, `--delete`, `--force` + global |
| `msn <id\|name> <repo-name> checkout` | 1 (`<branch>`) | 0 | global |
| `msn <id\|name> <repo-name> commit` | 0 | 0 | `-m <msg>` (required) + global |
| `msn <id\|name> <repo-name> push` | 0 | 0 | `--force-with-lease` + global |
| `msn <id\|name> <repo-name> <other-git-verb>` | (per git-verb signature) | (per git-verb signature) | (per git-verb signature) + global |
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

1. **Reserved-verbs list (top-level):** `create / list / show / start / apply / complete / abandon / status / config / --help / --version` (v1.6 fold per HIGH-R5.1: `remote` removed). First positional matching this list = top-level verb dispatch. First positional NOT matching = mission-selector.

2. **Reserved sub-actions (3 scoped vocabularies; v1.4 fold per MEDIUM-R3.7 — distinct vocabularies per scope):**
   - **Mission-scoped sub-actions** (after mission-selector positional): `repo-add / repo-remove / repo-list` (only these; per Rule 3 git-op shape covers free-form repo-name)
   - **`config`-scoped sub-actions** (after `msn config` top-level verb): `get / set`
   - (`remote`-scoped sub-actions REMOVED v1.6 fold per HIGH-R5.1)
   - **(v1.3 fold per HIGH-R2.1: singular `repo` REMOVED from mission-scoped reserved-sub-actions list; per-mission git-op grammar picks Shape (b) — 4-positional `msn <mission-selector> <repo-name> <git-verb>` without literal `repo` keyword)**

3. **Per-mission git op selector (Shape (b) per HIGH-R2.1 v1.3 fold):** `msn <mission-selector> <repo-name> <git-verb> [args]` (4-positional pattern) where `<git-verb>` ∈ `{branch / branch delete / checkout / fetch / commit / stage / push / pull / merge / tag / log / revparse / status}`. Second positional (repo-name) is free-form (not in any reserved list); third positional is the git-verb. NO `repo` keyword as 2nd positional — k8s-shape resource-name-then-verb pattern (e.g., `kubectl logs <pod>` not `kubectl pod <pod> logs`).

4. **Disambiguation algorithm:**
   - 1 positional: error ("missing verb or mission-selector")
   - 2 positionals: if `[0]` ∈ top-level verbs → top-level dispatch; else → `mission=<sel>, action=<verb>` BUT ONLY if `[1]` ∈ mission-scoped reserved sub-actions; else error
   - 3+ positionals: if `[0]` ∈ top-level verbs (e.g., `remote add github`) → top-level + sub-action dispatch; else `[0]` is mission-selector; `[1]` is reserved-sub-action OR repo-name (resolved by membership in mission-scoped reserved list per Rule 2; if `[1]` ∈ reserved-sub-actions then mission-scoped action shape; else `<repo-name>` per Rule 3 git-op shape); `[2..]` is verb + args
   - Slug-format restriction: mission `--name <slug>` MUST match `[a-z0-9][a-z0-9-]{1,62}` (DNS-style) AND NOT match any reserved verb/sub-action AND NOT start with `msn-` prefix (auto-id namespace); reject at `msn create` time
   - Repo-name auto-derivation (`msn <id> repo-add <url>` derives repo-name from URL last-segment): MUST reject if derived name matches reserved-sub-actions list (`repo-add / repo-remove / repo-list`); operator must use `--name <override>` for collision cases (v1.3 fold per MEDIUM-R2.5)

5. **Reserved-words protection:** operator cannot create mission with name matching reserved-verb (e.g., `msn create --name list` → error "reserved verb"); cannot create mission with `--name msn-<anything>` (auto-id namespace; v1.3 fold per MEDIUM-R2.6); prevents future ambiguity if verb is added in v2.

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

**Algorithm walk-through on edge cases (v1.3 fold per round-2 ask 2; v1.4 fold extended per round-3 ask 4):**
- `msn list show` → `[0]=list ∈ top-level verbs` → top-level `list` dispatch with extra positional `show`. **Rule 6:** `msn list` is flag-only signature → error "unexpected positional `show` for `list`; use `--status <state>` / `--output ...`"
- `msn create show` → `[0]=create ∈ top-level` → top-level `create` with extra positional `show`. **Rule 6:** `msn create` is flag-only signature → error "unexpected positional `show` for `create`; use `--name <slug>`"
- `msn show` → 1 positional. **Rule 6:** `msn show <id|name>` requires selector → error "missing required arg `<id|name>` for `show`"
- `msn storage-extract storage-provider branch feature/foo` → `[0]=storage-extract` NOT in top-level verbs → mission-selector. `[1]=storage-provider` NOT in reserved-sub-actions → Rule 3 git-op shape; verb=`branch`; arg=`feature/foo`. Resolved (4-positional git-op valid).
- `msn storage-extract repo-add https://...` → `[0]=storage-extract` NOT in top-level → mission-selector. `[1]=repo-add` ∈ mission-scoped reserved-sub-actions → mission-scoped action; arg=`https://...`. Resolved.
- `msn storage-extract repo-add` → 2 positional. `[0]` mission-selector; `[1]=repo-add` reserved sub-action. **Rule 6:** `repo-add` requires `<file|url>` arg → error "missing required arg `<file|url>` for `repo-add`"
- `msn complete msn-a3bd610c` → 2 positional. `[0]=complete ∈ top-level` → top-level dispatch; arg=`msn-a3bd610c` matches `<id|name>` selector signature. Resolved (auto-id form passes through; uniform with name-form).
- `msn create` → 1 positional → top-level verb `create` (no mission-name; `--name` flag separate or auto-id assigned). Resolved.
- `msn config get identity.provider` → 3 positional. `[0]=config ∈ top-level` → `config` scope. `[1]=get ∈ config-scoped sub-actions` → `config get` dispatch; arg=`identity.provider`. Resolved.

This is the PARSER-LEVEL contract; v1.0 commits this disambiguation. Future v2 verb additions must avoid colliding with existing mission-name slugs (Strict-1.0 cross-version compat).

**Strict-1.0 commitment:** every verb + flag here is committed contract; post-v1 verb additions require major-bump.

**v1.1 §A carry-forward (calibration #62 catch from v1.0):** `msn citations validate` + `msn cross-repo-pr fan-out` REMAIN OUT-OF-SCOPE for v1. Sub-mission #2 (citation-validator) + sub-missions #3-#11 (component-extracts) ship their own CLI extensions OR via OIS-side orchestration; not in missioncraft v1 surface.

### §2.4 Workspace contract (v1.1 reshape — workspace path split per refinement #1+#2 k8s-shape)

**v1.1 workspace path split** (per Director-direct refinement; k8s-shape):

- `<workspace>/config/<id>.yaml` — declarative mission resource manifests (k8s-equivalent: `manifest.yaml`)
- `<workspace>/missions/<id>/<repo-name>/` — runtime workspaces (active mission state)
- `<workspace>/operator.yaml` — global operator-config (v1.7 fold per MEDIUM-R6.4)

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
- **`--purge-config` step-ordering on terminal-state transition (v1.6 fold per MEDIUM-R5.5 — Order A: locks-first, config-last):** `complete <id> --purge-config` from `started`/`in-progress` performs steps in order:
  1. **Persist `lifecycle-state: completed` to config** via read-modify-write under mission-lock (mission-lock already held throughout terminal transition per MEDIUM-R4.7; concurrency-safe — no second writer + no read-while-write race); atomic-write discipline applies to the rewrite (write-temp + zod-validate-roundtrip + rename per MEDIUM-11). Single source of truth — no separate state-file. (v1.7 fold per round-6 ask 4: option (c) RMW-under-mission-lock; survives crash; recoverable if subsequent steps fail)
  2. **Release mission-lock + repo-locks** via StorageProvider
  3. **Destroy runtime workspace** at `<workspace>/missions/<id>/` (per `--retain` not set)
  4. **(if `--purge-config`)** Delete `<id>.yaml` + `.names/<slug>.yaml` symlink (atomic — single transaction; both-or-neither)
  Crash anywhere after step 1 leaves mission in `completed` state on-disk — recoverable via `complete --purge-config <id>` retry. Config-purge is the LAST step so partial-completion preserves config (operator forensics not lost). Same ordering applies to `abandon --purge-config` substituting `lifecycle-state: abandoned`.
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
| (none) | `msn create` | `created` | Config scaffold; no repos; no workspace |
| `created` | `msn <id> repo-add` | `configured` | First repo added; config has at least 1 repo |
| `created` | `msn apply -f <path>` (config has 0 repos) | `created` | No-op effectively; full upsert preserves zero-repos state (v1.6 fold per MEDIUM-R5.3) |
| `created` | `msn apply -f <path>` (config has ≥1 repos) | `configured` | Full upsert + auto-state-promotion via repo-presence (v1.6 fold per MEDIUM-R5.3) |
| `configured` | `msn <id> repo-add` | `configured` (self) | Additional repos added; mutates config |
| `configured` | `msn <id> repo-remove` | `configured` (or `created` if last) | Pre-start mutation; allowed |
| `configured` | `msn start <id>` | `started` | Engine realizes declared state — clones repos in parallel; allocates workspace; acquires locks; cold-start bundle written; mission ready for work |
| `started` | (operator does work) | `in-progress` | Work-time state; per-mission git ops happen here |
| `started` / `in-progress` | `msn apply -f <path>` (additive: new repo in config) | `started` (self-loop) | Per refinement #3 — additive-only; engine clones-or-fails; rollback to original repos on clone failure; mission continues uninterrupted |
| `started` / `in-progress` | `msn apply -f <path>` (non-additive: repo-remove OR pluggable change) | ERROR `MissionStateError` | "non-additive change requires `msn complete <id>` + `msn create` + `msn start`; or use additive-only apply (repo-add)" |
| `started` / `in-progress` | `msn complete <id>` | `completed` | Terminal — locks released; runtime workspace destroyed (unless `--retain`); config preserved (unless `--purge-config`) |
| any non-terminal | `msn abandon <id>` | `abandoned` | Terminal — locks released; runtime workspace destroyed; config preserved (unless `--purge-config`) |
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

**Explicit mission-lock acquisition order in `configured → started` transition (v1.3 fold per MEDIUM-R2.8)**:
1. **Acquire mission-lock** via `acquireMissionLock(missionId, { waitMs: 0 })`; on failure → `LockTimeoutError`; mission stays `configured`
2. **Per declared repo (parallel):** acquire repo-lock + clone via GitEngine; if ANY clone OR repo-lock-acquire fails → release ALL repo-locks acquired so far; release mission-lock; mission stays `configured` (per MEDIUM-4 rollback-all)
3. **Create wip-branch** in each cloned repo via `gitEngine.branch(wipBranchName)` + `gitEngine.checkout(wipBranchName)`
4. **Write first bundle** to snapshotRoot per §2.6.2; on failure → release everything (repo-locks + mission-lock); mission stays `configured`
5. **Persist mission-state YAML** as `started` (atomic-write per MEDIUM-11)
6. **Release transition-pseudolock** (mission-lock RETAINED for the active mission for its full lifecycle until `complete`/`abandon`)
7. State = `started`

Lock-acquisition is the FIRST step; all rollback paths know whether the mission-lock has been acquired (always yes after step 1).
- Bundle-write is INSIDE the transition; if bundle-write fails, transition fails + rollback (mission stays `configured`)
- Closes window-of-vulnerability where disk-failure between `started`-entered and first-bundle-written has nothing to restore

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

**`applyMission` id-vs-`config.mission.id` mismatch (v1.5 fold per MEDIUM-R4.6):** SDK signature accepts both an `id` parameter AND `config` (which embeds its own `mission.id`). Mismatch → `ConfigValidationError("id parameter does not match config.mission.id")` (option (a) error; fail-fast on operator-input-error; safer than silently picking one over the other). Validated at SDK entry-point alongside zod-validate-at-entry (per MEDIUM-R2.3).

State transitions table extension:
- `created`/`configured` × `apply -f <path>` → `configured` (full upsert; non-additive allowed)
- `started`/`in-progress` × `apply -f <path>` (additive only) → existing post-start additive-apply behavior

**Mission-id derivation (v1.2 fold per MEDIUM-1)**:
- `msn-<8-char-hash>` where hash is `crypto.randomBytes(4).toString('hex')` (Node primitive; pure-random; 16^8 ≈ 4.3B space)
- On collision (existing-id check): regenerate-with-retry (cap 3 attempts; cap-exceeded → `StorageAllocationError` "id-generation collision")
- Birthday-collision threshold ~65k missions; cap-3-retries gives ~10^-30 effective collision probability at sane mission-counts
- Operator-supplied `--name <slug>` is independent — slug-format `[a-z0-9][a-z0-9-]{1,62}` (DNS-style); slug must NOT match any reserved verb (see §2.3.2 reserved-words list)

### §2.5 Mission-config schema (v1.1 reshape — extends with `repos: [...]` per refinement #3)

YAML format (TypeScript-validated via zod at load-time). v1.1 extends v1.0 schema with declarative `repos: [...]` field — operator declares mission INTENT once; engine realizes runtime state.

```yaml
# missioncraft mission config (manifest at <workspace>/config/<id>.yaml)
mission-config-schema-version: 1   # additive-only schema model under Strict-1.0; v1.x ADDs optional fields; renames/removals require v2 + new schema-version

mission:
  id: msn-a3bd610c                  # auto-generated by `msn create`; or operator-supplied
  name: storage-extract              # optional human-friendly slug; for `msn start storage-extract`
  hub-id: mission-77                 # optional; Hub-side mission entity id mapping (sovereignty preserved — missioncraft just stores)
  description: "Extract storage-provider to sovereign repo"
  lifecycle-state: configured        # v1.6 fold per MEDIUM-R5.1; v1.7 fold per MEDIUM-R6.1 — engine-controlled field; zod schema `.default('created')` so missing-on-input populates with default; engine ALWAYS overwrites on transitions (atomic-write per MEDIUM-11). Operator-set value via applyMission/YAML is OVERWRITTEN on first engine action — operator cannot mutate this field meaningfully (engine reads disk state on every transition; treats operator-supplied value as informational-only). enum: 'created' | 'configured' | 'started' | 'in-progress' | 'completed' | 'abandoned'; zod literal-string-union preserves wire-format kebab-case
  created-at: "2026-05-09T01:00:00Z"  # ISO-8601; auto-set at `msn create`; immutable
  updated-at: "2026-05-09T01:30:00Z"  # ISO-8601; initialized at `msn create` time to SAME value as `created-at` (v1.8 fold per MINOR-R7.1); mutated atomically by engine on every transition + every config-mutation; created-at is immutable (v1.7 fold per MEDIUM-R6.2 — symmetric with created-at; closes MissionState.updatedAt YAML-source gap)
  tags:                              # cross-system correlation; Record<string,string>; no v1-validation
    correlation-id: "ois-2026-05-08"

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
- **Atomic-write discipline for CLI mid-mission config mutations (v1.2 fold per MEDIUM-11):** every CLI mutation (`msn create`, `msn <id> repo-add`, `msn apply`) writes via `fs.writeFile(path + '.tmp')` + zod-validate-roundtrip the temp file (parse the temp; if parse fails, abort + emit `ConfigValidationError`) + `fs.rename(path + '.tmp', path)` (POSIX atomic on same-fs); never leaves partial-config visible. Prevents corruption if CLI crashes mid-mutation.

### §2.6 Periodic state durability mechanism (load-bearing per Q1=d + F1 CRITICAL)

**Q1=d comprehensive durability** mandates coverage of process-crash + disk-failure + network-partition equally. **Q5=b no chaos-testing** means validation-strategy is via design-discipline + targeted-integration-tests (per F1 architect-recommendation).

**Architect-design (v0.2 — engineer round-1 §B folds applied):** **layered durability mechanism** combining 3 sub-mechanisms with explicit cross-mechanism ordering invariants.

**Cross-mechanism ordering invariant (v0.2 fold per §B.2):** every §2.6.2 bundle-write happens AFTER its corresponding §2.6.1 wip-commit — bundle includes the wip-commit's tree state. Bundle-write failure leaves wip-commit landed (always-recoverable from §2.6.1). Atomic-bundle-write via write-to-temp-then-rename (POSIX `rename(2)` is atomic on same-fs); partial bundles never visible. **§2.6.1 → §2.6.2 dependency:** §2.6.2 bundles the WIP-BRANCH HISTORY (not "working tree state") — git-bundle operates on git objects in the object store, which §2.6.1 has populated.

#### §2.6.1 Process-crash recovery — per-repo `wip/<mission-id>` branch via `commitToRef` plumbing (v0.2 fold per §B.1)

- Every N seconds (cadence configurable; default 30s via `state-durability.wip-cadence-ms`), missioncraft uses `GitEngine.commitToRef(workspace, 'refs/heads/wip/<mission-id>', { message, autoStage: true })` to commit dirty workspace state to a wip-branch **without moving HEAD AND without polluting operator's INDEX** (v0.3 fold per §AA — implementation contract: filesystem-walk + per-file `git.writeBlob` + explicit-tree-construction via `git.writeTree({ tree: [...] })` overload, NOT the index-derived form; operator's feature-branch checkout + staging area both preserved)
- **Blob-write efficiency optimization (v0.4 fold per §DDD.1; v0.5 wording softened per §DDDD):** filesystem-walk hashes each file's content first (sha-1); checks if blob already exists in object-db via existence-probe (precise error/return semantics of `git.readObject` resolved at impl-time — IsomorphicGit docs are ambiguous on missing-OID behavior; either try/catch on NotFoundError OR null-check sentinel); SKIPS `writeBlob` if exists. Avoids re-writing unchanged blobs every cadence-tick (mitigates 100MB-working-tree × 30s = 100MB-disk-write-every-30s naive cost). Composes with git's content-addressable model — unchanged content = same SHA = no-op write
- Foreground/background race resolution (v0.2 fold per §B.1): wip-cadence task acquires the workspace's storage-lock briefly during `commitToRef` invocation; user-driven `commit()` operations also acquire the lock; operations serialize (no concurrent writes to refs)
- Wip-branch object accumulation (v0.5 fold per §AAAA — architect-call option (b) **DROP GC discipline at v1**): IsomorphicGit has no GC primitives (`git.gc`, `gc.auto`, prune/repack — none exist; IsomorphicGit alphabetic command index confirms absence). v0.2 spec claimed periodic GC; that claim was the 4th consecutive substrate-currency error in this Phase 4 cycle. **v0.5 design:** no mid-mission GC; rely on F16 `wip-branch-cleanup` (`delete-on-complete-retain-on-abandon` default) for terminal cleanup + §DDD.1 hash-skip-via-readObject precheck for blob-write deduplication. Long-running missions accumulate wip-branch history bounded by mission-duration; F16 cleanup destroys the wip-branch + its history at mission-complete. Disk-pressure surface for very-long missions (>1 week continuous) flagged for v1.x maturity if operator-feedback emerges (post-v1 GC mechanism candidate; deferred per Q5=b bounded scope).
- On `kill -9` / OOM / panic: process restart reads workspace; `refs/heads/wip/<mission-id>` carries last durable tree state; mission resumes from there
- Cost: minor disk I/O per cadence-tick; near-zero startup overhead
- Coverage: process-crash with workspace-disk intact

#### §2.6.2 Disk-failure recovery — out-of-band snapshot store (v0.2 fold per §B.2 + §B.3)

- **Cold-start: first bundle at mission-start (v0.5 fold per §EEEE).** First bundle written immediately after `mission start` allocates workspace + acquires lock + creates initial wip-branch (NOT deferred to first natural cadence-tick `snapshot-cadence-ms` later). Closes the cold-start window where disk-failure within first 5min has no bundle to restore.
- Every M seconds (cadence configurable; default 5min via `state-durability.snapshot-cadence-ms` — coarser than wip-cadence), missioncraft shells `git bundle create ${snapshotRoot}/<missionId>/snapshot-<timestamp>.bundle.tmp refs/heads/wip/<mission-id>` then atomic-renames to `snapshot-<timestamp>.bundle` (per §AAA architect-call option (a) shell-out-to-native-git for bundle ops)
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
- **`core/` 4-file boundary rationale (v1.5 fold per MINOR-R4.2; v1.8 fold per MINOR-R7.3 — extended for operator-config-schema):** four files split by concern:
  - `types.ts` — SDK-INTERNAL constructor types (MissioncraftConfig, StateDurabilityConfig); not mission-resource
  - `mission-types.ts` — mission RESOURCE types (the primary k8s-shape resource: MissionState, MissionHandle, MissionFilter, MissionStatePhase, MissionConfig)
  - `mission-config-schema.ts` — RUNTIME zod schemas for mission-config + RepoSpec (parse/validate primitives at YAML+JSON boundary)
  - `operator-config-schema.ts` — RUNTIME zod schema for operator-config (parse/validate at `${MSN_WORKSPACE_ROOT}/operator.yaml` boundary; configGet/configSet validation)
  Separation prevents future-implementer drift toward consolidating runtime + types in one file (zod imports drag runtime into type-only modules; clean separation enables type-only imports for consumers who don't need parse). Two zod-schema files split by concern (mission-resource vs operator-global) prevents cross-coupling. v1.x can move both schema files to `core/schemas/` directory if a 5th schema is added (consolidate by parallel-structure); v1 keeps flat layout.

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

Lean dep surface: 3 runtime deps (`isomorphic-git` + `yaml` + `zod`); no Octokit; no hand-rolled HTTP.

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

## §3 Architect-flags / open questions for round-1 audit

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
| **v1.8 BILATERAL RATIFIED** | **2026-05-09** | **engineer round-8 ratify-clean on thread-510 (round 15/20) + architect label-flip + bilateral-commit close** | **0 findings round-8; 8-round audit cycle close (R1=24 → R2=15 → R3=14 → R4=14 → R5=11 → R6=10 → R7=5 → R8=0); 93 findings folded; substantive-reshape envelope landed within thread-509 6-9 round prediction range. Strict-1.0 contract committed for `@apnex/missioncraft@1.0.0`. Implementation-ready; Phase 5 Manifest entry triggered. Architect-side commit pin: THIS COMMIT.** |

**Phase 4 dispatch destination (v1.1 cycle):** greg / engineer; new thread (TBD; thread-510 candidate); **maxRounds=20** per Director directive for substantive architectural reshapes; semanticIntent=seek_rigorous_critique. Realistic 6-9 rounds close per thread-509 pattern empirics for substantive reshapes.

**Architect-side commit pins:** v0.1 → `e064f56`; v0.2 → `4d585ad`; v0.3 → `4768ff8`; v0.4 → `f5946b5`; v0.5 → `8cd9afe`; v0.6 → `4ebbc69`; v0.7 → `8bcc789`; v1.0 BILATERAL RATIFIED → `7fb1643` (on `agent-lily/m-branchcraft-v1-survey` branch; historical artifact under former M-Branchcraft-V1 name); v1.1 PENDING-BILATERAL → `aa35be2` (on `agent-lily/m-missioncraft-v1-design` branch); v1.2 PENDING-ROUND-2 → `b27b579`; v1.3 PENDING-ROUND-3 → `5b43351`; v1.4 PENDING-ROUND-4 → `22f1778`; v1.5 PENDING-ROUND-5 → `8663f9e`; v1.6 PENDING-ROUND-6 → `dc24188`; v1.7 PENDING-ROUND-7 → `169b9cf`; v1.8 PENDING-ROUND-8 → `f48ee99`; **v1.8 BILATERAL RATIFIED → THIS COMMIT** (post-push on `agent-lily/m-missioncraft-v1-design` branch; bilateral-commit close per `feedback_narrative_artifact_convergence_discipline.md` atomic edit→commit→push→dispatch pattern). Per `feedback_narrative_artifact_convergence_discipline.md` atomic edit→commit→push→dispatch pattern.
