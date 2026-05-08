# M-Branchcraft-V1 — Design v0.1 DRAFT

**Status:** **v0.1 DRAFT** (architect-side; pre-engineer-audit). Director-approved-to-Design 2026-05-08 post Phase 3 Survey envelope ratification at SHA `efbc5ad`. v0.1 architect-draft → engineer round-1 audit folds → v0.2 → engineer round-2 audit folds → v1.0 BILATERAL RATIFIED. See §8 Status for version-trajectory.
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
export interface AgentIdentity {
  readonly name: string;
  readonly email: string;
  readonly signingKey?: string; // GPG fingerprint or SSH public-key handle; optional
}

export interface IdentityProvider {
  /** Resolve the agent identity for commits + signed operations. Called once per mission start. */
  resolve(): Promise<AgentIdentity>;
}
```

**Default v1 implementation:** `LocalGitConfigIdentity` — reads `git config user.name` + `git config user.email`; signing-key from `git config user.signingkey` if set.

#### §2.1.2 `ApprovalPolicy`

```typescript
export interface ApprovalContext {
  readonly missionId: string;
  readonly repoUrl: string;
  readonly branch: string;
  readonly action: "commit" | "push" | "merge" | "mission-complete";
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

export interface StorageProvider {
  /** Allocate workspace for mission + repo. Idempotent on re-allocate. */
  allocate(missionId: string, repoUrl: string): Promise<WorkspaceHandle>;
  /** Release workspace (destroy unless retained). */
  release(handle: WorkspaceHandle, options?: { retain?: boolean }): Promise<void>;
  /** List active workspaces for a mission. */
  list(missionId: string): Promise<WorkspaceHandle[]>;
}
```

**Default v1 implementation:** `LocalFilesystemStorage` — workspaces live under `${BRC_WORKSPACE_ROOT}/<missionId>/<repo-name>/` (default root `~/.branchcraft/missions`); release destroys directory unless `retain: true`.

#### §2.1.4 `GitEngine`

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
}

export interface GitEngine {
  init(workspace: WorkspaceHandle, options: GitOptions): Promise<void>;
  clone(workspace: WorkspaceHandle, repoUrl: string, options: GitOptions): Promise<void>;
  branch(workspace: WorkspaceHandle, branchName: string, options?: { from?: string }): Promise<void>;
  commit(workspace: WorkspaceHandle, options: CommitOptions): Promise<string /* sha */>;
  push(workspace: WorkspaceHandle, options?: { branch?: string; force?: boolean }): Promise<void>;
  pull(workspace: WorkspaceHandle, options?: { branch?: string }): Promise<void>;
  merge(workspace: WorkspaceHandle, sourceBranch: string, options?: { strategy?: "ff" | "no-ff" | "squash" }): Promise<void>;
  status(workspace: WorkspaceHandle): Promise<GitStatus>;
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

**Default v1 implementation:** `IsomorphicGitEngine` — wraps `isomorphic-git` library; pure-TS; portable; no native bindings; works with any IsomorphicGit-compatible filesystem (default `node:fs`; pluggable for `memfs` or custom).

#### §2.1.5 `RemoteProvider`

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

export interface RemoteProvider {
  readonly capabilities: RemoteProviderCapabilities;
  /** Authenticate with the remote (token retrieval + validation). */
  authenticate(): Promise<void>;
  /** Open a pull request (only if capabilities.supportsPullRequests). */
  openPullRequest?(repoUrl: string, spec: PullRequestSpec): Promise<{ url: string; number: number }>;
  /** Read repo metadata via API (only if capabilities.supportsApi). */
  getRepoMetadata?(repoUrl: string): Promise<RepoMetadata>;
}

export interface RepoMetadata {
  readonly defaultBranch: string;
  readonly visibility: "public" | "private";
  readonly description?: string;
}
```

**Default v1 implementation:** NONE (pure-git mode; no RemoteProvider configured; `push`/`pull` work via plain git wire-protocol).

**Opt-in v1 implementation:** `GitHubRemoteProvider` via `gh` CLI subprocess invocation — `authenticate()` shells `gh auth status`; `openPullRequest()` shells `gh pr create`; `getRepoMetadata()` shells `gh repo view --json`. Clean dependency surface (no Octokit; no hand-rolled HTTP); single auth flow via `gh auth token`.

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
| `brc commit` | `-m <message> [--amend]` | Create commit; uses IdentityProvider for author |
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
| `brc citations validate` | `[<file-or-glob>]` | (sub-mission #2 deliverable; F-pending) Validate citations |
| `brc cross-repo-pr fan-out` | `--target=<version>` | (sub-missions #3-#11 deliverable; parent F12 PROBE; defer to ratification) Coordinate cross-repo PR fan-out |
| `brc --help` / `<verb> --help` | (per-verb help) | Documentation |
| `brc --version` | (no flags) | Version output |

**v1 minimum:** `init/clone/branch/commit/push/pull/merge/status/mission start/status/complete/abandon/remote add/list/remove/config get/set/--help/--version` (19 verbs/sub-verbs). `citations validate` is sub-mission #2's contribution. `cross-repo-pr fan-out` defers to parent F12 PROBE ratification.

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

### §2.4 Workspace contract (per parent §2.2.3 + Survey §0)

- **Mission ID format:** `<id>` is the Hub mission entity ID (e.g., `mission-77`); branchcraft itself is agnostic to ID source
- **Workspace path:** `${workspaceRoot}/<missionId>/<repo-name>/` — default `${workspaceRoot}=~/.branchcraft/missions`; configurable via `BRC_WORKSPACE_ROOT` env-var OR `--workspace-root` CLI flag OR `workspace-root` mission-config field (per F7 Survey-flag architect-recommendation)
- **Single-writer-per-mission lock:** acquired at `brc mission start`; lockfile at `${workspaceRoot}/<missionId>/.lock`; lock-timeout configurable (default 24h; Phase 4 design call)
- **One-active-mission-per-repo lock:** repo-level lock at `${workspaceRoot}/<repo-name>/.repo-lock`; prevents two missions checking out conflicting branches
- **Ephemeral by default:** mission workspaces destroyed at `brc mission complete` (operator opt-in to retain via `--retain` flag); long-lived workspaces only for ops-repos (operator-explicit)
- **Auto-merge configurability (parent §2.2.4):** CLI flag (`brc merge --auto`) for ad-hoc; mission-config-driven (`auto-merge: true` field) for governance-scope; auto-merge ≠ auto-deploy

### §2.5 Mission-config schema

YAML format (TypeScript-validated via zod or equivalent at load-time). Per F6 Survey-flag architect-recommendation:

```yaml
# branchcraft mission config
mission:
  id: mission-77
  description: "Extract storage-provider to sovereign repo"

# Workspace
workspace-root: ~/.branchcraft/missions  # optional override

# Lock behavior
lock-timeout-ms: 86400000  # 24h default

# Pluggable overrides (all optional; defaults from Branchcraft constructor)
identity:
  provider: local-git-config  # OR custom resolver path
approval:
  provider: trust-all  # OR rule-based with rules array
  # rules: [...]  # for rule-based provider
storage:
  provider: local-filesystem
git-engine:
  provider: isomorphic-git
remote:
  provider: gh-cli  # OR null for pure-git mode
  # gh-cli-path: gh

# State durability config (per Q1=d comprehensive coverage)
state-durability:
  mechanism: layered  # layered | per-repo-git-commits | snapshot-store | fs-adapter-journal
  cadence-ms: 30000  # 30s default
  process-crash-recovery: true  # per Q1=d
  disk-failure-recovery: true   # per Q1=d
  network-partition-resilience: true  # per Q1=d

# Auto-merge (per parent §2.2.4)
auto-merge: false
auto-merge-strategy: squash  # squash | merge | rebase
```

### §2.6 Periodic state durability mechanism (load-bearing per Q1=d + F1 CRITICAL)

**Q1=d comprehensive durability** mandates coverage of process-crash + disk-failure + network-partition equally. **Q5=b no chaos-testing** means validation-strategy is via design-discipline + targeted-integration-tests (per F1 architect-recommendation).

**Architect-design (v0.1):** **layered durability mechanism** combining 3 sub-mechanisms:

#### §2.6.1 Process-crash recovery — per-repo `.git/` commits

- Every N seconds (cadence configurable; default 30s), branchcraft commits dirty workspace state to a `wip/<mission-id>` branch (commit-only; no push)
- On `kill -9` / OOM / panic: process restart reads workspace; `wip/<mission-id>` branch carries last durable state; mission resumes from there
- Cost: minor disk I/O per cadence-tick; near-zero startup overhead
- Coverage: process-crash with workspace-disk intact

#### §2.6.2 Disk-failure recovery — out-of-band snapshot store

- Every M seconds (cadence configurable; default 5min — coarser than per-repo cadence), branchcraft serializes workspace state (`git bundle create` of working tree) to `${snapshotRoot}/<missionId>/snapshot-<timestamp>.bundle`
- `snapshotRoot` is a different filesystem path from `workspaceRoot` (operator configures cross-disk OR cross-mount snapshot path)
- On disk-failure: workspace storage lost; branchcraft restores from latest bundle on snapshotRoot
- Cost: bundle-create per cadence-tick (M=5min default reduces frequency); snapshot disk-space proportional to workspace-size × snapshot-retention
- Coverage: workspace-disk corruption / accidental delete (assuming snapshotRoot is on different disk)

#### §2.6.3 Network-partition resilience — IsomorphicGit resumable-push semantics

- IsomorphicGit's `push()` is resumable at protocol level (smart-HTTP supports range requests; native git/SSH supports pack-resumption)
- branchcraft wraps push in `with-retry-on-network-error`: detect `ECONNRESET` / `ETIMEDOUT` / `ENOTFOUND`; retry with exponential backoff up to N attempts (configurable; default 5)
- Mid-push partition: workspace state remains durable on disk via §2.6.1; push retries until success or operator-abort
- Cost: per-push retry-loop overhead (negligible on healthy network); no separate substrate
- Coverage: push/pull interrupted mid-flight; state survives partition; completes when network returns

#### §2.6.4 Validation strategy (Q5=b bounded; per F1 architect-recommendation)

**Targeted-integration-tests** (one per failure-mode; stays within Q5=b "integration" tier):
1. **Process-crash test:** spawn branchcraft mission; mid-commit `kill -9` the process; restart; assert mission state recovered from `wip/<mission-id>` branch
2. **Disk-failure test:** spawn branchcraft mission; `rm -rf` workspaceRoot mid-mission; assert snapshotRoot bundle restoration recovers state
3. **Network-partition test:** spawn branchcraft mission; mid-push toggle network (mock `iptables -A OUTPUT -j DROP` equivalent OR use undici mock); assert push retry-loop completes when network returns

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
- **3 targeted-failure-mode tests** (per §2.6.4): process-crash + disk-failure + network-partition recovery
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
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "typescript": "^5.x",
    "vitest": "^1.x",
    "typedoc": "^0.25.x",
    "memfs": "^4.x"
  },
  "engines": {
    "node": ">=20"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/apnex/branchcraft.git"
  }
}
```

Lean dep surface: 3 runtime deps (`isomorphic-git` + `yaml` + `zod`); no Octokit; no hand-rolled HTTP.

#### §2.9.2 `tsconfig.json`

Standard strict TypeScript; ES2022 target; ESM module; declarations emitted.

#### §2.9.3 CI/CD (per F11 Survey-flag GitHub-Actions-only)

`.github/workflows/ci.yml`:
- Trigger: push to `main` + PRs to `main`
- Matrix: node 20.x + 22.x
- Steps: `npm ci` → `npm run build` → `npm test`
- Status check: `vitest (branchcraft)` + `tsc-build`

`.github/workflows/release.yml`:
- Trigger: tag matching `v*.*.*`
- Steps: `npm ci` → `npm run build` → `npm test` → `npm publish` (requires `NODE_AUTH_TOKEN` secret)
- Concurrent: TypeDoc deploy to GitHub Pages

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

**NEW v0.1 architect-flags surfaced during Design draft (request engineer round-1 audit):**

| # | Flag | Class | Architect-recommendation |
|---|---|---|---|
| F13 | RemoteProvider opt-in pattern — `?` optional methods on interface vs throws-on-unsupported | MEDIUM | §2.1.5 uses optional `?` methods + `capabilities.supportsPullRequests` flag. Caller checks capabilities before calling optional method. Engineer round-1 may prefer `throws { code: 'UNSUPPORTED' }` pattern instead. |
| F14 | Lock-timeout default value | PROBE | §2.5 specifies 24h default; aggressive enough to recover from typical mission cycles; tight enough to release stale locks. Engineer round-1 may surface alternative (1h? 4h? 1 week?) |
| F15 | Snapshot retention policy | MEDIUM | §2.6.2 doesn't specify how many bundle snapshots are retained per mission. Need policy: keep last N? keep last N OR last 24h whichever larger? Engineer round-1 audit. Architect-lean: keep last 5 OR last 24h whichever larger. |
| F16 | `wip/<mission-id>` branch cleanup post-mission-complete | MEDIUM | §2.6.1 doesn't specify. Architect-lean: `mission complete` deletes the wip branch (workspace destroyed anyway). `mission abandon` retains wip-branch for forensics? Engineer audit. |
| F17 | TypeDoc deploy mechanism — GitHub Pages? OR npm-package-shipped HTML? | MINOR | §2.9.3 GitHub Pages from `release.yml`. Engineer concur or alternative. |
| F18 | Error class hierarchy — branchcraft-specific error classes (`BranchcraftError`, `LockTimeoutError`, etc.)? | MEDIUM | §2.1 doesn't surface error-shape. Architect-recommendation: ship `BranchcraftError` base + 4-6 specialized classes (`LockTimeoutError` / `StorageAllocationError` / `RemoteAuthError` / `ApprovalDeniedError` / `MissionStateError`). Engineer round-1 may surface alternative. |

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
| **v0.1 DRAFT** | **2026-05-08** | **architect-side draft post Survey envelope ratification @ SHA `efbc5ad`** | **this version; pre-engineer-audit** |
| v0.2 (planned) | TBD | engineer round-1 audit folds | engineer surfaces F1-F18 challenges + new architect-flags (if any) |
| v1.0 BILATERAL RATIFIED (planned) | TBD | engineer round-2 audit close-of-bilateral | architect-side commit pin + Phase 5 Manifest entry trigger |

**Phase 4 dispatch destination:** greg / engineer; round-1 bilateral audit thread thread-509; **maxRounds=20** per Director directive ("ensure thread has 20 turns available for extensive discussion"); semanticIntent=seek_rigorous_critique.

**Architect-side commit pin v0.1:** committed + pushed in same dispatch step per `feedback_narrative_artifact_convergence_discipline.md` atomic pattern.
