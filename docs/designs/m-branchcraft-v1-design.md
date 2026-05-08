# M-Branchcraft-V1 — Design v0.4 DRAFT

**Status:** **v0.4 DRAFT** (architect-side; post engineer round-3 audit folds). v0.3 → v0.4 folds: (§AAA CRITICAL) §2.6.2 IsomorphicGit `git.fetch` claim was 3rd consecutive instance of architect-spec-level-recall-misses-substrate-coupling pattern (IsomorphicGit fetch is HTTP(S)-only per issue #462 open since 2018; doesn't support file:// or local paths). **Architect-call: option (a) shell-out-to-native-git for bundle-ops** — pragmatic v1 ship; explicit pure-TS breach for disk-failure-recovery codepath only (composes with already-existing breach via `LocalGitConfigIdentity` shelling `git config`). (§DDD.1) blob-write efficiency — hash-skip-via-readObject-precheck spec for §2.6.1 wip-cadence; (§DDD.2) recovery-scope window spec (data-loss up to snapshot-cadence-ms stale; feature-branch commits between snapshots NOT in bundle); (§DDD.3) F22 changeset CI gate `--since=main` → `--since=${{ github.base_ref }}` parameterized. v0.1 → v0.2 → v0.3 → v0.4 (this version; engineer round-3 folds applied) → engineer round-4 audit → v1.0 BILATERAL RATIFIED. See §8 Status for version-trajectory.
**Mission name:** M-Branchcraft-V1 (idea-263; sub-mission #1 of meta-mission idea-261)
**Mission-class:** substrate-introduction (foundational; first sub-mission of 11-sub-mission catalog; everything else uses branchcraft)
**Source idea:** idea-263 (M-Branchcraft-V1)
**Survey:** `docs/surveys/m-branchcraft-v1-survey.md` (Round-1 + Round-2 ratified 2026-05-08; composite intent envelope §3)
**Tele primaries (ratified):** tele-3 Sovereign Composition + tele-2 Isomorphic Specification (whole-mission); tele-7 Resilient Operations + tele-11 Cognitive Minimalism (secondary)
**Authors:** lily / architect (v0.1); bilateral round-1 audit with greg / engineer pending Phase 4 dispatch (thread-509; maxRounds=20)
**Lifecycle phase:** 4 Design (architect-led)
**Repo location:** NEW sovereign repo `github.com/apnex/branchcraft` (under Director's personal namespace; NOT apnex-org); npm scope `@apnex/branchcraft`; OSS Apache 2.0 day-1; published to npmjs.com

---

## §1 Goal + intent (echo Survey §3)

**Goal:** Ship branchcraft v1.0.0 — sovereign, architecturally-complete sovereign component at `github.com/apnex/branchcraft`. 5 pluggable interfaces + 2 personas (standalone-CLI + library-SDK) + IsomorphicGit primary GitEngine + gh-CLI opt-in GitHubRemoteProvider. Strict 1.0 API stability commitment from day-1. Single-package shipping. Comprehensive 3-failure-mode durability. Patient ~6-8 week timeline. Bounded test (unit + integration) + doc (operator-onboarding) surface.

**Architectural framing:** *"branchcraft v1 ships comprehensive + strict + simple + patient + bounded. Comprehensive durability across process-crash + disk-failure + network-partition. Strict 1.0 API as committed contract from day-1. Single-package `@apnex/branchcraft` for simplest consumer DX. Patient timeline absorbs upfront substrate-investigation. Bounded test/doc surfaces — minimum viable validation + operator-onboarding-priority docs."*

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

**Default v1 implementation:** `TrustAllPolicy` — `{approved: true}` for every context. Operator opts in to ceremony explicitly via mission-config or alternative pluggable.

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

**Default v1 implementation:** `LocalFilesystemStorage` — workspaces under `${BRC_WORKSPACE_ROOT}/<missionId>/<repo-name>/` (default `~/.branchcraft/missions`); locks via `${BRC_WORKSPACE_ROOT}/<missionId>/.lock` + `${BRC_WORKSPACE_ROOT}/<repo-name>/.repo-lock` files (atomic create-via-`O_EXCL`); stale-lock recovery via `expiresAt` check + `releaseLock` on expired (per §H.2 v0.2 fold).

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

export type MergeStrategy = "ff" | "no-ff" | "squash" | "rebase"; // v0.2 fold per §C.1 — added rebase

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

**Default v1 implementation:** `IsomorphicGitEngine` — wraps `isomorphic-git` library; pure-TS; portable; no native bindings; works with any IsomorphicGit-compatible filesystem (default `node:fs`; pluggable for `memfs` or custom). `commitToRef` uses `isomorphic-git`'s low-level `git.writeTree` + `git.writeCommit` + `git.writeRef` plumbing to commit without moving HEAD.

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
 *  Methods are NOT optional; callers MUST check capabilities + branchcraft throws UnsupportedOperationError if mismatch. */
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

**Default v1 implementation:** NONE (pure-git mode; no RemoteProvider configured; `push`/`pull` work via plain git wire-protocol).

**Opt-in v1 implementation:** `GitHubRemoteProvider` via `gh` CLI subprocess invocation — `capabilities = { supportsPullRequests: true, supportsApi: true }`; `authenticate()` shells `gh auth status`; `getCurrentUser()` shells `gh api user --jq '{login, email}'`; `openPullRequest()` shells `gh pr create`; `listPullRequests()` shells `gh pr list --json`; `getRepoMetadata()` shells `gh repo view --json`. Clean dependency surface (no Octokit; no hand-rolled HTTP); single auth flow via `gh auth token`. `authenticate()` validates `gh` presence + version at startup; clear error if unavailable.

### §2.2 Default-stack composition (v1)

```typescript
import { Branchcraft, LocalGitConfigIdentity, TrustAllPolicy, LocalFilesystemStorage, IsomorphicGitEngine } from '@apnex/branchcraft';

const branchcraft = new Branchcraft({
  identity: new LocalGitConfigIdentity(),
  approval: new TrustAllPolicy(),
  storage: new LocalFilesystemStorage(),
  gitEngine: new IsomorphicGitEngine(),
  // remote: undefined — pure-git mode by default
});
```

Operator opts in to GitHub features:

```typescript
import { GitHubRemoteProvider } from '@apnex/branchcraft';
const branchcraft = new Branchcraft({
  /* ...defaults... */,
  remote: new GitHubRemoteProvider({ ghCliPath: 'gh' }),
});
```

OR via CLI: `brc remote add github --provider=gh-cli`.

### §2.3 Personas

#### §2.3.1 Standalone-CLI persona — `brc <verb>`

CLI verb taxonomy (v1 complete enumeration; per F5 Survey-flag architect-recommendation):

| Verb | Sub-verbs / Flags | Description |
|---|---|---|
| `brc init` | `[--workspace-root <path>]` | Initialize branchcraft config in current directory; creates `.branchcraft/` config dir |
| `brc clone <repo-url>` | `[--mission <id>] [--branch <name>]` | Clone repo into workspace |
| `brc branch <name>` | `[--from <branch>]` | Create branch from current HEAD or specified branch |
| `brc branch delete <name>` | `[--force]` | Delete branch; v0.3 fold per §EE — load-bearing for F16 wip-branch cleanup |
| `brc commit` | `-m <message> [--amend] [--auto-stage]` | Create commit; uses IdentityProvider for author |
| `brc push` | `[--branch <name>] [--force]` | Push to remote; uses RemoteProvider auth if configured |
| `brc pull` | `[--branch <name>]` | Pull from remote |
| `brc merge <source-branch>` | `[--strategy ff\|no-ff\|squash]` | Merge source-branch into current branch |
| `brc status` | (no flags) | Show workspace status |
| `brc mission start` | `<id> [--config <path>] [--retain]` | Start mission; allocates workspace; acquires single-writer lock |
| `brc mission status` | `[--id <id>]` | Show mission status; locks held; workspaces allocated |
| `brc mission complete` | `[--id <id>]` | Complete mission; release lock; destroy workspace unless `--retain` |
| `brc mission abandon` | `[--id <id>]` | Abandon mission; release lock; destroy workspace |
| `brc remote add <name>` | `--provider=<gh-cli\|...>` | Configure RemoteProvider |
| `brc remote list` | (no flags) | List configured remotes |
| `brc remote remove <name>` | (no flags) | Remove configured remote |
| `brc config get <key>` | (no flags) | Get config value |
| `brc config set <key> <value>` | (no flags) | Set config value |
| `brc fetch` | `[--branch <name>] [--remote <name>]` | Fetch from remote (without merge); v0.2 fold per §C.1 |
| `brc checkout <branch>` | (no flags) | Switch HEAD to branch; v0.2 fold per §C.1 |
| `brc tag <name>` | `[--ref <ref>] [--message <msg>]` | Create tag (annotated if `--message`); v0.2 fold per §C.1 (release-tag dogfood-gap closure) |
| `brc log` | `[--ref <ref>] [--max-count <n>]` | Show commit history; v0.2 fold per §C.1 |
| `brc revparse <ref>` | (no flags) | Resolve ref to SHA; v0.2 fold per §C.1 |
| `brc stage <paths...\|--all>` | (no flags) | Explicit staging primitive; v0.2 fold per §C.1 |
| `brc --help` / `<verb> --help` | (per-verb help) | Documentation |
| `brc --version` | (no flags) | Version output |

**v0.2 §A fold — REMOVED from v1 surface (calibration #62 catch):**
- ~~`brc citations validate`~~ — was a deferred-verb-without-impl violating Strict-1.0; sub-mission #2 (citation-validator-tooling) ships its own CLI extension OR plugins-into-branchcraft via separate add-on package
- ~~`brc cross-repo-pr fan-out`~~ — was a deferred-verb-without-impl violating Strict-1.0; sub-missions #3-#11 ship coordinated PR fan-out via their own CLI extension OR via OIS-side orchestration

**v1 minimum (25 verbs/sub-verbs after v0.3 +`brc branch delete`):** `init/clone/branch/branch-delete/checkout/fetch/commit/stage/push/pull/merge/tag/log/revparse/status/mission start/status/complete/abandon/remote add/list/remove/config get/set/--help/--version`. Strict-1.0 commitment: every verb here is final shape; post-v1 verb additions require major-bump.

#### §2.3.2 Library-SDK persona

Top-level export shape:

```typescript
// @apnex/branchcraft (single package; tree-shake-friendly named exports per F4)

// Core
export { Branchcraft } from './core/branchcraft';
export type { BranchcraftConfig, MissionHandle, MissionState } from './core/types';

// Pluggable interfaces (types)
export type { IdentityProvider, AgentIdentity } from './pluggables/identity';
export type { ApprovalPolicy, ApprovalContext, ApprovalDecision } from './pluggables/approval';
export type { StorageProvider, WorkspaceHandle } from './pluggables/storage';
export type { GitEngine, GitOptions, CommitOptions, GitStatus } from './pluggables/git';
export type { RemoteProvider, RemoteProviderCapabilities, PullRequestSpec, RepoMetadata } from './pluggables/remote';

// Default implementations
export { LocalGitConfigIdentity } from './defaults/local-git-config-identity';
export { TrustAllPolicy } from './defaults/trust-all-policy';
export { LocalFilesystemStorage } from './defaults/local-filesystem-storage';
export { IsomorphicGitEngine } from './defaults/isomorphic-git-engine';

// Opt-in implementations
export { GitHubRemoteProvider } from './providers/github-remote-provider';
```

Programmatic usage:

```typescript
import { Branchcraft, LocalGitConfigIdentity, /* ... */ } from '@apnex/branchcraft';

const brc = new Branchcraft({ /* config */ });

// Mission lifecycle
const mission = await brc.startMission('mission-77');
await mission.cloneRepo('https://github.com/apnex-org/storage-provider.git');
await mission.createBranch('feature/extract-storage-provider');
// ... edit files ...
await mission.commit({ message: 'Initial extraction' });
await mission.push();
await mission.complete();
```

**API stability commitment (Q2=a):** every signature shipped in v1.0.0 is committed contract. Any post-v1 breaking change requires major-version-bump (`v1.x` → `v2.x`). No `v0.x` ramp-up phase.

#### §2.3.3 OIS-orchestrated persona — POST-V1 (parent F8 CRITICAL)

NOT in v1 scope. Built post-v1 via OIS-side adapter consuming the library-SDK persona.

### §2.4 Workspace contract (per parent §2.2.3 + Survey §0; v0.2 folds per §H.1 + §H.2)

- **Mission ID format:** `<id>` is the Hub mission entity ID (e.g., `mission-77`); branchcraft itself is agnostic to ID source
- **Workspace path:** `${workspaceRoot}/<missionId>/<repo-name>/` — default `${workspaceRoot}=~/.branchcraft/missions`
- **Configuration precedence (v0.2 fold per §H.1):** **CLI flag > env-var > mission-config field > default**. So `--workspace-root /custom` (CLI) wins over `BRC_WORKSPACE_ROOT=/env-path` (env) wins over `workspace-root: /config-path` (mission-config) wins over `~/.branchcraft/missions` (default). Same precedence model applies to ALL configurable fields.
- **Single-writer-per-mission lock:** acquired via `StorageProvider.acquireMissionLock(missionId, { timeoutMs })` at `brc mission start`; lockfile at `${workspaceRoot}/<missionId>/.lock`; lock-timeout configurable (default 24h per F14)
- **One-active-mission-per-repo lock:** acquired via `StorageProvider.acquireRepoLock(repoUrl, missionId, { timeoutMs })`; lockfile at `${workspaceRoot}/<repo-name>/.repo-lock`; prevents two missions checking out conflicting branches
- **Lock-timeout recovery (v0.2 fold per §H.2):** at lock-acquire, if existing lock's `expiresAt` is in past → automatic `releaseLock` of stale lock + acquire fresh (fail-safe recovery); if `expiresAt` in future → `LockTimeoutError` thrown to caller. Mission-state at expiry: stale lock means prior holder process likely dead; mission-state derivable from wip-branch + snapshotRoot per §2.6
- **Ephemeral by default:** mission workspaces destroyed at `brc mission complete` (operator opt-in to retain via `--retain` flag); long-lived workspaces only for ops-repos (operator-explicit)
- **Auto-merge configurability (parent §2.2.4):** CLI flag (`brc merge --auto`) for ad-hoc; mission-config-driven (`auto-merge: true` field) for governance-scope; auto-merge ≠ auto-deploy

### §2.5 Mission-config schema (v0.2 fold per §E — 7 fields added)

YAML format (TypeScript-validated via zod at load-time). Per F6 Survey-flag + §E engineer round-1 audit:

```yaml
# branchcraft mission config
mission-config-schema-version: 1     # v0.3 fold per §FF + F20 — top-level field; additive-only schema model under Strict-1.0; v1.x ADDs optional fields; renames/removals require v2 + new schema-version
mission:
  id: mission-77
  description: "Extract storage-provider to sovereign repo"
  tags:                              # v0.2 fold per §E — mission-level metadata for cross-system correlation; Record<string,string> with no v1-validation (operator self-discipline)
    correlation-id: "ois-2026-05-08"
    ois.io/mission-id: "mission-77"

# Workspace
workspace-root: ~/.branchcraft/missions  # optional override
default-branch: main                 # v0.2 fold per §E — clone target default (main | master | trunk)

# Lock behavior
lock-timeout-ms: 86400000            # 24h default

# Pluggable overrides (all optional; defaults from Branchcraft constructor)
identity:
  provider: local-git-config         # OR custom resolver path
approval:
  provider: trust-all                # OR rule-based with rules array
  # rules: [...]                     # for rule-based provider
storage:
  provider: local-filesystem
git-engine:
  provider: isomorphic-git
remote:
  provider: gh-cli                   # OR null for pure-git mode
  # gh-cli-path: gh

# State durability config (per Q1=d comprehensive coverage; v0.2 fold per §B + §E)
state-durability:
  mechanism: layered                 # layered (default) | per-repo-git-commits | snapshot-store | fs-adapter-journal
  wip-cadence-ms: 30000              # 30s default — §2.6.1 wip-branch commit cadence
  snapshot-cadence-ms: 300000        # v0.2 fold per §E — 5min default — §2.6.2 bundle cadence
  snapshot-root: /var/branchcraft/snapshots  # v0.2 fold per §E — different fs from workspace-root for disk-failure recovery
  snapshot-retention:                # v0.2 fold per §E + F15 — keep last N OR last X-hours whichever larger
    min-count: 5
    min-age-hours: 24
  wip-branch-cleanup: delete-on-complete-retain-on-abandon  # v0.2 fold per §E + F16 — delete-on-complete-retain-on-abandon | always-delete | always-retain
  process-crash-recovery: true       # per Q1=d
  disk-failure-recovery: true        # per Q1=d
  network-partition-resilience: true # per Q1=d
  # Network-partition retry config (v0.2 fold per §E + §2.6.3)
  network-retry:
    max-attempts: 5                  # default
    backoff-ms: 1000                 # initial backoff; exponential

# Auto-merge (per parent §2.2.4)
auto-merge: false
auto-merge-strategy: squash          # squash | merge | rebase | ff
```

### §2.6 Periodic state durability mechanism (load-bearing per Q1=d + F1 CRITICAL)

**Q1=d comprehensive durability** mandates coverage of process-crash + disk-failure + network-partition equally. **Q5=b no chaos-testing** means validation-strategy is via design-discipline + targeted-integration-tests (per F1 architect-recommendation).

**Architect-design (v0.2 — engineer round-1 §B folds applied):** **layered durability mechanism** combining 3 sub-mechanisms with explicit cross-mechanism ordering invariants.

**Cross-mechanism ordering invariant (v0.2 fold per §B.2):** every §2.6.2 bundle-write happens AFTER its corresponding §2.6.1 wip-commit — bundle includes the wip-commit's tree state. Bundle-write failure leaves wip-commit landed (always-recoverable from §2.6.1). Atomic-bundle-write via write-to-temp-then-rename (POSIX `rename(2)` is atomic on same-fs); partial bundles never visible. **§2.6.1 → §2.6.2 dependency:** §2.6.2 bundles the WIP-BRANCH HISTORY (not "working tree state") — git-bundle operates on git objects in the object store, which §2.6.1 has populated.

#### §2.6.1 Process-crash recovery — per-repo `wip/<mission-id>` branch via `commitToRef` plumbing (v0.2 fold per §B.1)

- Every N seconds (cadence configurable; default 30s via `state-durability.wip-cadence-ms`), branchcraft uses `GitEngine.commitToRef(workspace, 'refs/heads/wip/<mission-id>', { message, autoStage: true })` to commit dirty workspace state to a wip-branch **without moving HEAD AND without polluting operator's INDEX** (v0.3 fold per §AA — implementation contract: filesystem-walk + per-file `git.writeBlob` + explicit-tree-construction via `git.writeTree({ tree: [...] })` overload, NOT the index-derived form; operator's feature-branch checkout + staging area both preserved)
- **Blob-write efficiency optimization (v0.4 fold per §DDD.1):** filesystem-walk hashes each file's content first (sha-1); checks if blob already exists in object-db via `git.readObject({ oid })`; SKIPS `writeBlob` if exists. Avoids re-writing unchanged blobs every cadence-tick (mitigates 100MB-working-tree × 30s = 100MB-disk-write-every-30s naive cost). Composes with git's content-addressable model — unchanged content = same SHA = no-op write
- Foreground/background race resolution (v0.2 fold per §B.1): wip-cadence task acquires the workspace's storage-lock briefly during `commitToRef` invocation; user-driven `commit()` operations also acquire the lock; operations serialize (no concurrent writes to refs)
- Wip-branch object accumulation (v0.2 fold per §B.1): after wip-cadence-tick N, branchcraft GCs wip-branch history older than retention-window (default: keep last 100 wip-commits); periodic `gc.auto` invocation for object pruning
- On `kill -9` / OOM / panic: process restart reads workspace; `refs/heads/wip/<mission-id>` carries last durable tree state; mission resumes from there
- Cost: minor disk I/O per cadence-tick; near-zero startup overhead
- Coverage: process-crash with workspace-disk intact

#### §2.6.2 Disk-failure recovery — out-of-band snapshot store (v0.2 fold per §B.2 + §B.3)

- Every M seconds (cadence configurable; default 5min via `state-durability.snapshot-cadence-ms` — coarser than wip-cadence), branchcraft creates a git-bundle of the wip-branch history: `git bundle create ${snapshotRoot}/<missionId>/snapshot-<timestamp>.bundle.tmp refs/heads/wip/<mission-id>` then atomic-renames to `snapshot-<timestamp>.bundle`
- **Bundle scope (v0.2 fold per §B.3):** wip-branch history (NOT "working tree state" — git-bundle operates on git objects in the object store; uncommitted dirty files are not bundleable directly; §2.6.1 wip-commits ensure dirty state IS in the object store before §2.6.2 bundles)
- `snapshotRoot` is a different filesystem path from `workspaceRoot` (operator configures cross-disk OR cross-mount); rejection at startup if same filesystem (defeats disk-failure resilience)
- Snapshot retention per `state-durability.snapshot-retention.{min-count, min-age-hours}`: keep last N OR last X-hours whichever-larger (default 5 + 24h)
- On disk-failure: workspace storage lost; branchcraft restores from latest valid bundle on snapshotRoot.
  - **Bundle ops mechanism (v0.4 fold per §AAA — architect-call option (a)):** branchcraft shells out to native `git` CLI for bundle create/verify/fetch operations. Rationale: IsomorphicGit's `fetch` is HTTP(S)-only (issue #462 open since 2018; no file:// or local-path support); pure-TS bundle-handling would require ~200-400 LOC hand-rolled bundle-format parser (option (b)) — out of scope for Q5=b bounded test surface + Q4=c patient timeline. **Pure-TS breach is explicit + bounded to disk-failure-recovery codepath only**; composes with already-existing breach via `LocalGitConfigIdentity` shelling `git config`. Operator-impact: requires `git` CLI installed (already required for `gh` CLI dependency at GitHubRemoteProvider; no new constraint). Library-SDK consumers in environments without `git` CLI MUST disable disk-failure-recovery via `state-durability.disk-failure-recovery: false` (process-crash + network-partition mechanisms remain pure-TS). Documented in branchcraft README + CLI `brc init` startup banner if git not on PATH.
  - **Bundle validity check (v0.3 fold per §DD):** iterate snapshotRoot/<missionId>/snapshot-*.bundle in newest-first order; for each candidate, shell `git bundle verify <path>` (exit-0 = valid); skip bundles failing verify (truncated mid-rename, corrupted) + try next-newest until first valid bundle found
  - **Restoration command (v0.3 fold per §DD; v0.4 corrected per §AAA):** shell out to native git: `cd ${freshWorkspace} && git init && git fetch <bundle-path> 'refs/heads/*:refs/heads/*' && git checkout wip/<mission-id>`. Avoids IsomorphicGit fetch limitation. Native git's `fetch` understands bundle-paths natively.
  - **Same-fs detection at startup (v0.3 fold per §DD):** `stat(snapshotRoot).dev !== stat(workspaceRoot).dev` (POSIX device-ID comparison via Node `fs.statSync().dev`); rejection at startup if same; defeats disk-failure resilience otherwise. Note minor edge: btrfs subvolumes can share dev IDs (rare; non-blocking; canonical Linux semantics still device-ID).
  - **Recovery-scope window spec (v0.4 fold per §DDD.2):** restored state = wip-branch state as of last successful bundle-write (= up to `snapshot-cadence-ms` stale; default 5min). Operator's commits to feature-branch (HEAD's actual branch) BETWEEN bundle-create and disk-failure are NOT in wip-branch → NOT in bundle → NOT recoverable. Data-loss window = up to 5min by default; configurable via `snapshot-cadence-ms`. Documented in branchcraft README disk-failure-recovery section so operators understand the window.
- Cost: bundle-create per cadence-tick (5min default); atomic-rename overhead negligible; snapshot disk-space proportional to workspace-size × retention
- Coverage: workspace-disk corruption / accidental delete (assuming snapshotRoot is cross-disk)

#### §2.6.3 Network-partition resilience — push retry-loop with exponential backoff (v0.2 fold per §B.4 — claim correction)

**v0.2 correction (§B.4):** v0.1 incorrectly claimed "IsomorphicGit's `push()` is resumable at protocol level (smart-HTTP supports range requests; native git/SSH supports pack-resumption)". **Both halves were wrong:** smart-HTTP push uses POST with full pack body; no Range-request resumption. IsomorphicGit doesn't speak SSH transport at all. The actual mechanism is **retry-on-failure with full-pack-restart**.

- branchcraft wraps `GitEngine.push()` in a `with-retry-on-network-error` wrapper: detect `ECONNRESET` / `ETIMEDOUT` / `ENOTFOUND` / `socket hang up`; retry with exponential backoff (`state-durability.network-retry.max-attempts`, default 5; initial backoff `network-retry.backoff-ms`, default 1000ms)
- Each retry attempts the FULL push (pack-restart). For mid-push partition: drop = restart; workspace state remains durable on disk via §2.6.1; push retries until success or `max-attempts` exceeded (then `NetworkRetryExhaustedError`)
- Cost: per-push retry-loop overhead (negligible on healthy network); full-pack-restart per attempt (proportional to push size; acceptable for typical mission cadence)
- Coverage: push/pull interrupted mid-flight; state survives partition (via §2.6.1); push completes when network returns OR operator-abort after retry-exhaustion

#### §2.6.4 Validation strategy (Q5=b bounded; per F1 architect-recommendation)

**Targeted-integration-tests** (within Q5=b "integration" tier; v0.2 expanded per §B + §H.3):
1. **Process-crash test:** spawn branchcraft mission; mid-commit `kill -9` the process; restart; assert mission state recovered from `wip/<mission-id>` branch
2. **Disk-failure test:** spawn branchcraft mission; `rm -rf` workspaceRoot mid-mission; assert snapshotRoot bundle restoration recovers state
3. **Network-partition test:** spawn branchcraft mission; mid-push toggle network (undici mock OR test-fixture HTTP server that drops connections); assert push retry-loop completes when network returns
4. **Cross-mechanism crash test (v0.2 fold per §B.2):** spawn branchcraft mission; mid-bundle-write `kill -9` the process while wip-cadence ticking; restart; assert wip-branch is intact + partial bundle was atomically-renamed-or-not (no half-bundle); assert recovery from wip/branch (snapshot restoration falls back to last valid bundle)
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
- **Lock semantics:** single-writer-per-mission (concurrent `brc mission start` on same mission → second fails); one-active-mission-per-repo (concurrent `brc mission start` on same repo from different missions → second fails)

#### §2.7.3 Test infrastructure choice

**vitest** per F10 Survey-flag architect-recommendation (OIS-substrate consistency).

### §2.8 Documentation surface (per Q6=b operator-onboarding-priority; bounded)

- **README.md** — what is branchcraft; quick install; quick example; link to getting-started + TypeDoc
- **TypeDoc auto-generated API reference** — published to `github.com/apnex/branchcraft/docs` via GitHub Pages
- **Getting-started tutorial** at `docs/getting-started.md` — step-by-step: install → init → first mission → push → complete

**NOT in v1 docs:** pluggable-extension guide (Q6=b excluded); migration-guide-from-OIS (Q6=b excluded; covered by `docs/methodology/component-migration-playbook.md` per parent F10); architecture-rationale-doc (Q6=b excluded; covered by parent Design + this Survey envelope).

### §2.9 Repo bootstrap

#### §2.9.1 `package.json`

```json
{
  "name": "@apnex/branchcraft",
  "version": "1.0.0",
  "description": "Sovereign git+workspace orchestration for multi-agent code coordination",
  "license": "Apache-2.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "brc": "dist/cli.js"
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "sideEffects": false,
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "docs": "typedoc",
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
    "node": ">=20"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/apnex/branchcraft.git"
  }
}
```

**v0.2 folds (per §D + §F):**
- `"sideEffects": false` (per §F — required signal for tree-shake-friendly bundling beyond named-exports alone)
- `zod ^3.x` → `^4.x` (current 4.4.3; minor breaking changes around `.parse()` defaults — Phase 6 implementation handles)
- `vitest ^1.x` → `^4.x` (current 4.1.5; multiple breaking-config changes — Phase 6 implementation handles)
- `typedoc ^0.25.x` → `^0.28.x` (current 0.28.19; mostly additive)
- `publishConfig.provenance: true` (per §H.4 — npm provenance attestation; OIDC-signed via GitHub Actions; supply-chain integrity for sub-mission #2-#11 consumers)

**Browser-shape note (per §F):** branchcraft v1 is **Node-only** (`engines.node >=20`); `LocalGitConfigIdentity` shells `git config` via `child_process` which is Node-only. Browser/edge consumers explicitly out-of-scope at v1; future v2+ MAY add browser-conditional exports if demand surfaces.

Lean dep surface: 3 runtime deps (`isomorphic-git` + `yaml` + `zod`); no Octokit; no hand-rolled HTTP.

#### §2.9.2 `tsconfig.json`

Standard strict TypeScript; ES2022 target; ESM module; declarations emitted.

#### §2.9.3 CI/CD (per F11 Survey-flag GitHub-Actions-only; v0.2 folds per §H.4 + §H.5 + §H.6)

`.github/workflows/ci.yml`:
- Trigger: push to `main` + PRs to `main`
- **OS matrix (v0.2 fold per §H.5):** ubuntu-latest + macos-latest (CLI tool tested on linux + macOS; Windows out-of-scope at v1)
- Node matrix: node 20.x + 22.x
- Steps: `npm ci` → `npm run build` → `npm test`
- Status check: `vitest (branchcraft)` + `tsc-build`

`.github/workflows/release.yml`:
- Trigger: tag matching `v*.*.*`
- **Permissions (v0.2 fold per §H.4 + F17):** `id-token: write` (OIDC for npm provenance) + `contents: read` + `pages: write` (TypeDoc deploy)
- Steps: `npm ci` → `npm run build` → `npm test` → `npm publish --provenance` (OIDC-signed; per `publishConfig.provenance: true`)
- Concurrent: TypeDoc deploy to GitHub Pages via `actions/setup-pages` + `actions/upload-pages-artifact`

**Release-tagging discipline (v0.2 fold per §H.6):** tags applied via `changesets` (`@changesets/cli` devDep) — operator runs `npx changeset` to create a changeset; merged changesets accumulate in `.changeset/`; `npx changeset version` bumps version + generates CHANGELOG.md; `npx changeset publish` creates the tag + triggers release.yml. Strict-1.0 commitment means EVERY breaking change emits a major-changeset (rejected at PR-time if not explicit).

**Changeset CI gate (v0.3 fold per §FF + F22; v0.4 fold per §DDD.3):** `.github/workflows/ci.yml` adds a build step `npx changeset status --since=${{ github.base_ref }}` which fails the build if any source-code-change PR lacks a changeset. **Parameterized to PR target branch (NOT hardcoded `main`)** — works correctly for repos using `master`/`trunk`/etc. Mechanized enforcement (no external bot dep). Operator manually selects patch-vs-minor-vs-major at changeset-creation time (CI doesn't auto-classify — strict-1.0 makes major a serious-decision-point so operator-explicit is correct).

#### §2.9.4 LICENSE

`LICENSE` file: full Apache 2.0 text. NO Contributor License Agreement (CLA) at v1 per F12 Survey-flag architect-recommendation.

#### §2.9.5 README.md skeleton

```markdown
# branchcraft

Sovereign git+workspace orchestration for multi-agent code coordination.

## Install

\`\`\`
npm install @apnex/branchcraft
\`\`\`

## CLI quick start

\`\`\`
brc init
brc clone https://github.com/example/repo.git
brc mission start mission-1
brc branch feature/example
# ... edit files ...
brc commit -m "Initial work"
brc push
brc mission complete
\`\`\`

## Library quick start

\`\`\`typescript
import { Branchcraft } from '@apnex/branchcraft';
const brc = new Branchcraft({ /* defaults */ });
const mission = await brc.startMission('mission-1');
// ...
\`\`\`

## Architecture

5 pluggable interfaces — IdentityProvider, ApprovalPolicy, StorageProvider, GitEngine, RemoteProvider.

See [docs/getting-started.md](docs/getting-started.md) and the [TypeDoc API reference](https://apnex.github.io/branchcraft/).

## License

Apache 2.0
```

---

## §3 Architect-flags / open questions for round-1 audit

12 architect-flags from Survey §6 carried forward. Engineer round-1 audit per mission-67/mission-68 audit-rubric precedent.

| # | Flag | Class | Architect-recommendation |
|---|---|---|---|
| F1 | Q1=d ↔ Q5=b validation-strategy gap — comprehensive durability promise without chaos-test | **CRITICAL** | Layered approach per §2.6: theoretical coverage proof in v0.1 + targeted-integration-tests (3 per-failure-mode tests within Q5=b "integration" tier) + chaos deferred to v1.x |
| F2 | Durability mechanism choice — per-repo `.git/` commits vs out-of-band snapshot store vs IsomorphicGit `fs` adapter | MEDIUM | Layered combination per §2.6.1-§2.6.3: per-repo `.git/` commits (process-crash) + out-of-band snapshot store (disk-failure) + IsomorphicGit resumable-push (network-partition). Engineer round-1 may surface refinement. |
| F3 | API surface completeness for strict 1.0 — Phase 4 Design must enumerate all interface methods + CLI verbs comprehensively | MEDIUM | §2.1 enumerates 5 pluggable interfaces with full method signatures; §2.3.1 enumerates 19+ CLI verbs. Engineer round-1 verifies completeness; flag any missing surface. |
| F4 | Single-package install footprint mitigation — Q3=a ships all 5 pluggables; tree-shake-friendly export shape | MEDIUM | §2.3.2 export structure uses named exports (no barrel-index re-exports of side-effect-laden modules); side-effect-free module-level code. Engineer round-1 verifies tree-shake test on synthetic consumer. |
| F5 | CLI verb taxonomy completeness | MEDIUM | §2.3.1 enumerates 19+ verbs; engineer round-1 verifies completeness against use-case scenarios |
| F6 | Mission-config schema | MEDIUM | §2.5 specifies full schema with workspace-root + lock-timeout-ms + pluggable overrides + state-durability-config + auto-merge fields. Engineer round-1 may surface additional fields. |
| F7 | Workspace path configurability | MEDIUM | §2.4 spec: `BRC_WORKSPACE_ROOT` env-var OR `--workspace-root` CLI flag OR `workspace-root` mission-config field; default `~/.branchcraft/missions`. Engineer round-1 verifies precedence rules |
| F8 | Versioning ramp pre-v1 | MINOR | §2.9.1 ships direct `v1.0.0` first-publish per Q2=a strict-1.0; no `v0.x` published to npm |
| F9 | Operator install path at v1 | PROBE | §2.9.1 npm-only via `npm install @apnex/branchcraft` + `npx brc`; standalone binary distribution deferred to v1.x or v2 |
| F10 | Test infrastructure choice | MINOR | §2.7.3 vitest per OIS-substrate consistency |
| F11 | CI/CD scope at v1 | MINOR | §2.9.3 GitHub Actions only |
| F12 | License + CLA | MINOR | §2.9.4 Apache 2.0; NO CLA at v1 |

**NEW v0.1 architect-flags (F13-F18 — engineer round-1 dispositions per §G):**

| # | Flag | Class | v0.2 Disposition |
|---|---|---|---|
| F13 | RemoteProvider opt-in pattern | MEDIUM | **RATIFIED v0.2 capabilities-gated throws-on-unsupported per §G engineer-counter**. Methods NOT optional; capabilities-flag check is caller-discipline; branchcraft throws `UnsupportedOperationError` if mismatch. Cleaner than redundant optional-method+capabilities-flag signal. §2.1.5 updated. |
| F14 | Lock-timeout default value | PROBE | **RATIFIED 24h per §G engineer concur**. §2.4 + §2.5 |
| F15 | Snapshot retention policy | MEDIUM | **RATIFIED keep last 5 OR last 24h whichever larger per §G engineer concur**. §2.5 schema fields: `snapshot-retention.{min-count: 5, min-age-hours: 24}`. |
| F16 | wip-branch cleanup post-mission | MEDIUM | **RATIFIED delete-on-complete + retain-on-abandon per §G engineer concur**. §2.5 schema field: `wip-branch-cleanup: delete-on-complete-retain-on-abandon`. |
| F17 | TypeDoc deploy mechanism | MINOR | **RATIFIED GitHub Pages from release.yml per §G engineer concur**. §2.9.3 updated with `permissions: pages: write` + `actions/setup-pages` per engineer pattern-recommendation. |
| F18 | Error class hierarchy | MEDIUM | **RATIFIED 10 classes (v0.3 count fix per §BB) — flat hierarchy under `BranchcraftError` base; all 9 specialized extend the base directly**: `BranchcraftError` (base; extends Error) + `LockTimeoutError` + `StorageAllocationError` + `RemoteAuthError` + `ApprovalDeniedError` + `MissionStateError` + `WorkspaceConflictError` + `ConfigValidationError` + `UnsupportedOperationError` + `NetworkRetryExhaustedError`. Total 10. Consumer can `instanceof BranchcraftError` for catch-all; specialized class for typed handling. No multi-level inheritance per v0.3 §BB. |

**NEW v0.2 architect-flags (F19-F23 surfaced during round-1 fold-pass; request engineer round-2 audit):**

| # | Flag | Class | Architect-recommendation |
|---|---|---|---|
| F19 | `commitToRef` plumbing primitive on GitEngine — does this break clean abstraction (commit + commitToRef as siblings)? OR is it a justified low-level primitive? | MEDIUM | Recommend keep as sibling primitive; `commit()` is the high-level surface (HEAD-aware); `commitToRef()` is plumbing-mode (HEAD-unaware) for §2.6.1 wip-mechanism. Engineer round-2 may argue alternative (e.g., commit() with options.targetRef discriminator). |
| F20 | Mission-config schema versioning — schema itself is committed contract under Strict-1.0; how do mission-config additions in v1.x ship without breaking? | MEDIUM | Recommend `mission-config-schema-version: 1` field; v1.x can ADD optional fields (additive-only); REMOVING or RENAMING fields requires v2 + new schema-version. Engineer round-2 may surface alternative. |
| F21 | StorageProvider interface bundles locking primitives — does this couple storage + lock concerns inappropriately? OR is it the cleanest spot? | MEDIUM | Recommend bundled per §G engineer-counter (vs 6th LockProvider pluggable). Workspace allocation + locking are tightly coupled (atomic). 6th pluggable would over-modularize. Engineer round-2 concur or argue extraction. |
| F22 | Changesets discipline ratification — `@changesets/cli` devDep adds CI ceremony; is the strict-1.0 enforcement worth the operator-friction? | MINOR | Recommend yes — strict-1.0 needs PR-time changeset discipline; alternative (manual semver bumps) drifts under load. Engineer concur or surface alternative. |
| F23 | Browser-shape post-v1 path — engineer §F flagged `LocalGitConfigIdentity` is Node-only; future browser support deferred. Should v1 explicitly REJECT browser usage at module-level? OR allow runtime shape detection? | PROBE | Recommend explicit Node-only at v1 (engines.node>=20 already constrains); browser-export consideration deferred to v2 if demand surfaces. No active rejection at module-level (operator gets natural import-error). |

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

Q2=a strict 1.0 from day-1 means v1.0.0 IS the committed contract. Any post-v1 breaking change requires major-version-bump. **Risk:** if the API has subtle issues not caught in v1 audit, v2 must launch to fix them — substantial cost vs `v0.x` ramp-up which would absorb minor fixes. **Mitigation:** thorough engineer round-1 + round-2 audit on §2.1 interface signatures + §2.3 personas; explicit completeness sweep per F3 + F5; field testing via sub-mission #2 (citation-validator) consuming branchcraft library-SDK before sub-missions #3-#11 commit to broader adoption.

### §6.2 Q1=d ↔ Q5=b validation-strategy gap (composes-with F1 CRITICAL)

Per F1 architect-recommendation: layered approach — design-time theoretical coverage + 3 targeted-integration-tests + chaos deferred. **Risk:** if the 3 targeted-integration-tests don't surface a subtle failure-mode interaction (e.g., process-crash mid-snapshot-write corrupts both `wip/` branch AND snapshot bundle), v1 ships with silent-defect surface. **Mitigation:** engineer round-1 audit specifically reviews per-failure-mode mechanism analysis; surface any cross-mechanism interaction concerns.

### §6.3 Patient timeline (Q4=c) absorbing scope-creep

6-8 week timeline gives runway BUT also expands the Phase 4 Design scope (this doc is already substantial; round-1 audit + folds + round-2 + folds will be substantial cycles). **Risk:** Phase 4 Design rounds consume 1-2 weeks of timeline; Phase 6 implementation gets compressed despite patient framing. **Mitigation:** thread-509 with maxRounds=20 (Director-ratified) absorbs extensive Phase 4 cycles; engineer round-1 audit can be rigorous without budget pressure.

### §6.4 IsomorphicGit version pinning

IsomorphicGit major-version churn would force branchcraft major-bump. **Mitigation:** pin IsomorphicGit to `^1.x` in v1; if IsomorphicGit ships `2.x`, branchcraft v2 absorbs the change.

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
| **v0.4 DRAFT** | **2026-05-08** | **engineer round-3 audit folds (thread-509 round 5/20)** | **this version; v0.4 fold: §AAA CRITICAL — IsomorphicGit fetch is HTTP(S)-only (issue #462 open since 2018; 3rd consecutive instance of architect-spec-level-recall-misses-substrate-coupling pattern); architect-call option (a) shell-out-to-native-git for bundle ops (explicit pure-TS breach for disk-failure-recovery codepath; composes with already-existing LocalGitConfigIdentity breach); §DDD.1 hash-skip-via-readObject blob-write efficiency; §DDD.2 recovery-scope window spec (data-loss up to snapshot-cadence-ms stale); §DDD.3 changeset CI gate parameterized to `github.base_ref` |
| v1.0 BILATERAL RATIFIED (planned) | TBD | engineer round-4 audit close-of-bilateral | architect-side commit pin + Phase 5 Manifest entry trigger |

**Phase 4 dispatch destination:** greg / engineer; round-1 bilateral audit thread-509; **maxRounds=20** per Director directive; semanticIntent=seek_rigorous_critique.

**Architect-side commit pins:** v0.1 → `e064f56`; v0.2 → THIS COMMIT (post-push). Per `feedback_narrative_artifact_convergence_discipline.md` atomic pattern.
