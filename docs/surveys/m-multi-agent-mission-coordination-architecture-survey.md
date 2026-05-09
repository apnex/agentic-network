---
mission-name: M-Multi-Agent-Mission-Coordination-Architecture
source-idea: idea-261
methodology-source: docs/methodology/idea-survey.md v1.0
director-picks:
  round-1:
    Q1: b
    Q1-rationale: Full architectural — all 5 pluggables ship v1; standalone-CLI + library-SDK first-class personas
    Q2: c
    Q2-rationale: Phased-incremental — missioncraft v1 ships first; per-component OIS migrations are SEPARATE sub-missions afterward
    Q3: a
    Q3-rationale: Public OSS day-1 + Apache 2.0 + npmjs.com — with Director modification 2026-05-08 to use `github.com/apnex/missioncraft` (sovereign personal namespace) NOT `apnex-org/missioncraft` (OIS-org namespace); this is a-modified per idea-survey.md §6 multi-pick discipline (single-letter pick + parameter modification)
  round-2:
    Q4: a
    Q4-rationale: 1:1 mapping — today's 8+ packages each become own engineer-repo; preserve current package boundaries
    Q5: ac
    Q5-rationale: Multi-pick — lockstep coordination (a) + major-version-bump signaling (c); clean-break posture; no deprecation-runway
    Q6: a
    Q6-rationale: Pre-migration validator gate — build citation-validator BEFORE migration starts; PR-time enforcement
mission-class: structural-inflection
tele-alignment:
  primary: [tele-3, tele-2]
  secondary: [tele-7, tele-8]
  round-1:
    primary: [tele-3, tele-2]
    secondary: [tele-7, tele-11]
  round-2:
    primary: [tele-8, tele-2]
    secondary: [tele-3, tele-12]
anti-goals-count: 7
architect-flags-count: 8
skill-meta:
  skill-version: survey-v1.0
  tier-1-status: implemented
  tier-2-status: stubbed
  tier-3-status: stubbed
calibration-data:
  director-time-cost-minutes: 3
  comparison-baseline: prior surveys (M-Message-Structure-Cleanup; M-SSE-Peek-Line-Cleanup; mission-69 idea-228)
  notes: |
    First-canonical mission-of-missions Survey — deliverable is a catalog of downstream sub-missions, not direct substrate.
    First-canonical multi-repo mission shape — missioncraft sub-mission lives in github.com/apnex/missioncraft (new sovereign repo) while idea/mission/audit entities live in agentic-network.
    Methodology-evolution candidates surfaced:
    (1) per-question-budget for meta-Surveys may differ from substrate-Surveys (this Survey ratified 6 questions cleanly with ~3min Director-time despite ratifying ~8 sub-missions worth of architectural posture — cost-efficiency suggests meta-Survey-as-pattern is viable);
    (2) pre-Survey ratification timeline (3 architectural-commitment ratifications captured in idea-261 ratification timeline) reduced Survey-round scope to genuinely-open dimensions only — pattern: when discussion has surfaced architectural-commitments before Survey opens, capture them in the source-idea body + ratification-timeline THEN Survey only the open dimensions. This is meta-Survey-friendly.
    No contradictory multi-pick detected; Q5=ac is natural composition (lockstep + semver-major-bump are coordination-mechanism + signaling-mechanism respectively, not contradictory).
contradictory-constraints:
  # No contradictory multi-pick detected. Q5=ac is natural composition (coordination + signaling); not contradictory per idea-survey.md §7.
calibration-cross-refs:
  closures-applied: []
  candidates-surfaced:
    - meta-Survey-pattern (per-question-budget + pre-Survey-ratification-timeline; flag for methodology-evolution review post-mission-of-missions completion)
---

# M-Multi-Agent-Mission-Coordination-Architecture — Phase 3 Survey envelope

**Methodology:** `docs/methodology/idea-survey.md` v1.0 (3+3 Director-intent pick-list)
**Source idea:** idea-261
**Mission-class candidate:** structural-inflection (mission-of-missions; multi-week strategic arc; first-canonical mission-of-missions shape; first-canonical multi-repo mission shape — missioncraft sub-mission lives in missioncraft-repo while idea/mission/audit entities live in agentic-network)
**Branch:** `agent-lily/m-multi-agent-mission-coord-survey` (pushed pre-bilateral round-1 audit per calibration #59 closure mechanism (a))

---

## §0 Context

This Survey opens the Phase 3 gate for **idea-261** (M-Multi-Agent-Mission-Coordination-Architecture) — strategic-architectural anchor for the 2027 shape of multi-agent code coordination. Origin: Director discussion 2026-05-08 (architecturally-meta session post-thread-501 close) articulating friction with current git-worktree+PR-cross-approval workflow (2-agent ceiling, ceremony overhead, context wastage, worktree fragility). Conversation surfaced a coherent 2027 architectural shape across multiple decision axes; this is a **mission-of-missions** with deliverable = catalog of downstream sub-missions, not direct substrate.

Architectural commitments locked in pre-Survey via Director-direct ratification 2026-05-08 (3 ratification points captured in idea-261 ratification timeline): missioncraft sovereign SDK+CLI as foundational substrate (standalone-repo from start; npm-package; CLI binary `msn`; TypeScript primary; any-git-endpoint compatible via pure-TS IsomorphicGitEngine; OPTIONAL pluggable RemoteProvider; gh CLI for GitHubRemoteProvider — NOT Octokit; NOT hand-rolled HTTP; lean dependency surface; pure-git fallback when no RemoteProvider configured); polyrepo target topology (architect-repo + N engineer-component-repos + integration-repos + ops-repos); mission-as-collection-of-branches (`/missions/<id>/<repo>/`); single-writer-per-mission + one-active-mission-per-repo lock; symbol-chain code citations; auto-merge-not-deploy (configurable); periodic state durability; long-lived workspaces only for ops-repos (mission-execution always ephemeral). Subsumes idea-258 (npm-publish-strategy + auto-release; folded as downstream sub-mission of this meta-mission). References idea-259 (Adapter-Sovereign-Import-Cycle-Resolution; Phase-4-Design call whether to fold). idea-260 (cold-start audit-rubric extension; methodology-class) stays parallel. Composes-with calibration #62 audit-rubric maturation arc (16 instances; methodology-promotion proposal pending strategic-review).

Survey purpose: capture Director-intent along the 3 highest-leverage strategic dimensions still open post-pre-Survey-commitments. Output: ratified Survey envelope → Phase 4 Design enumerates downstream sub-missions with scope + ordering + dependencies; first sub-mission shipped is missioncraft v1 (foundational substrate; standalone-repo; the migration USES missioncraft, not ad-hoc tooling).

---

## §1 Round 1 picks

### §1.0 Round-1 questions (as dispatched to Director)

**Q1 — Missioncraft v1 architectural completeness (HOW MUCH):** How much of the architectural surface ships in v1 vs deferred to v2+?

- (a) Minimum-viable v1 — `msn init/clone/branch/commit/push` only; pluggables stubbed; defer architectural completeness to v2
- (b) Full architectural v1 — all 5 pluggables shipped with sensible defaults; standalone-CLI + library-SDK personas first-class
- (c) Rich-default v1 — missioncraft ships full pluggables but with strong opinions baked-in (no sovereignty-over-defaults until v2)
- (d) Spike-then-ratify — ship a 2-week spike v0.1; learn; then ratify v1 scope based on spike findings

**Q2 — Sub-mission ordering within meta-mission (WHEN):** How do downstream sub-missions sequence?

- (a) Big-bang — missioncraft v1 + all OIS migration in one mega-mission
- (b) Mostly-parallel — missioncraft v1 first; then all OIS migrations launched in parallel
- (c) Phased-incremental — missioncraft v1 first; per-component OIS migrations as separate sequential sub-missions; each its own bilateral cycle
- (d) Spike-first — spike a 1-component-migration to validate playbook; then ramp

**Q3 — Open-source posture + repo-organization (WHO):** How is missioncraft positioned?

- (a) Public OSS day-1 + Apache 2.0 + npmjs.com + `apnex-org/missioncraft`
- (b) Internal-first → OSS-later — start private OIS-internal; promote to public once v1 stabilizes
- (c) Always-internal — private repo; not published; OIS-internal substrate only
- (d) Other — architect surfaces alternative posture

### §1.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q1 — Missioncraft v1 architectural completeness (HOW MUCH) | **(b)** Full architectural | All 5 pluggables shipped v1 with sensible defaults; standalone-CLI + library-SDK first-class personas |
| Q2 — Sub-mission ordering within meta-mission (WHEN) | **(c)** Phased-incremental | Missioncraft v1 ships first; per-component OIS migrations are SEPARATE sub-missions afterward (each its own bilateral cycle); slowest end-to-end but smallest-blast-radius per step |
| Q3 — Open-source posture + repo-organization (WHO) | **(a) modified** | Public OSS day-1; Apache 2.0; **`github.com/apnex/missioncraft` (NOT apnex-org)** per Director modification 2026-05-08; published to npmjs.com; community contributions welcomed |

### §1.Q1 — Per-question interpretation

**Original-Idea reading:** Idea-261's body specifies missioncraft as foundational sovereign-component with 5 pluggable interfaces (`IdentityProvider`, `ApprovalPolicy`, `StorageProvider`, `GitEngine`, `RemoteProvider`) — three personas of consumption (standalone-CLI, library-consumer, OIS-orchestrated). Q1=b ("full architectural") locks in the v1 deliverable as the FULL scope of these 5 pluggables — NOT a minimum-viable that punts pluggables to v2. Standalone + SDK personas are first-class from v1; OIS-orchestrated is integration work post-v1.

**Tele-mapping:** primary tele-3 Sovereign Composition (full pluggable architecture from v1 = clean module boundaries enforced from birth; Law-of-One per pluggable interface); secondary tele-2 Isomorphic Specification (the v1 API IS the spec; bit-perfect contracts published from day 1; no interface-shape-drift between v1 and v2). Tertiary tele-11 Cognitive Minimalism (substrate-feature-rich v1 = deterministic primitives ready from day 1; no LLM-side workarounds for missing pluggables).

**Aggregate-Surface read:** Director is signaling architectural-purity over scope-discipline-shortcut. The cost (more upfront work; longer v1) is accepted in exchange for cleanliness (no v2 retrofit on the architectural-shape; no "we'll add IdentityProvider later" surface). Composes-with Director's earlier explicit commitment to standalone-repo-from-start + sovereign-component-discipline — these are the same posture: "do the architectural-correct thing first; iterate on tactical details after."

### §1.Q2 — Per-question interpretation

**Original-Idea reading:** Idea-261 enumerates 8 plannedTask candidates (missioncraft-build + adapter integration + migration sub-missions per-component + architect-repo extraction + ops-repo extraction + citation-tooling). Q2=c ("phased-incremental") signals these post-missioncraft-v1 sub-missions ship as INDIVIDUAL bilateral cycles — each its own Phase-3-Survey through Phase-9-close. Reading Q2=c composably with Q1=b: missioncraft v1 itself is full-architectural (Q1=b); the OIS-side migration AFTER v1 is phased-per-component (Q2=c). The "minimum-viable" wording in Q2=c is overridden by Q1=b for v1-scope; spirit is "OIS migration goes incrementally."

**Tele-mapping:** primary tele-7 Resilient Operations (phased = small blast radius per step; failure of one component-migration doesn't cascade to others; recovery boundaries clean). Secondary tele-8 Gated Recursive Integrity (each component-migration certified independently before next; binary pass/fail per layer N before N+1 ascension). Tertiary tele-1 Sovereign State Transparency (per-step migration leaves intermediate state queryable; no "in-flight massive migration" opacity surface).

**Aggregate-Surface read:** Director is signaling appetite for slowness over coordination-cost. Phased-incremental is the longest end-to-end timeline of the four options; chosen because each step is auditable + reversible + small-radius. Composes-with audit-rubric maturation arc (calibration #62) — phased-incremental missions naturally surface substrate-currency issues at audit-time per-step rather than accumulating across a big-push. This is operational-conservatism-by-design: trade calendar-time for confidence at each gate.

### §1.Q3 — Per-question interpretation

**Original-Idea reading:** Idea-261's "Standalone-repo posture" section flagged repo-organization as Phase-3 question candidate (apnex-org vs strukto-style standalone org). Q3=a (Public OSS day-1; Apache 2.0; npmjs.com) is the open-posture lock-in. Director's modification — `github.com/apnex` (NOT `apnex-org`) — signals the repo lives at the Director's personal/sovereign namespace, distinct from the OIS-org namespace where agentic-network lives. This is architecturally meaningful: missioncraft is positioned as a category-contribution Director-owned-and-published, with OIS being one consumer of it (rather than missioncraft being an OIS-org-internal project that happens to be public).

**Tele-mapping:** primary tele-3 Sovereign Composition (the apnex-vs-apnex-org separation enforces architectural sovereignty at the GitHub-org boundary; missioncraft's module-of-one cannot accidentally couple to OIS-org-internal substrate because they're distinct GitHub orgs). Secondary tele-2 Isomorphic Specification (public API IS the spec; OSS-from-day-1 forces public-API discipline; no "internal API drifts then we publish" surface).

**Aggregate-Surface read:** Director is signaling category-contribution intent for missioncraft, not just OIS-internal substrate. The github.com/apnex namespace separation operationalizes this — missioncraft is published from Director's personal sovereign space; OIS uses it as a consumer; external operators can use it without OIS dependency. This composes-with Q1=b (full architectural; ecosystem-friendly) and Q2=c (phased; OIS migration is one consumer's adoption journey, not missioncraft's primary purpose). The aggregate signal: **build missioncraft as a category-tool; OIS happens to use it.**

**Round-1 composite read:** The three picks compose into a clear strategic posture — **build missioncraft v1 as an architecturally-complete, OSS-from-day-1, category-contribution standalone tool at github.com/apnex/missioncraft; once v1 ships standalone-stable, migrate OIS components incrementally (per-component sub-missions; each its own bilateral cycle).** No tension surfaces between picks; the constraint envelope is consistent with Director's pre-Survey ratification timeline (3 architectural-commitment ratifications 2026-05-08).

---

## §2 Round 2 picks

### §2.0 Round-2 questions (as dispatched to Director)

**Q4 — Component boundary granularity for OIS migration (WHAT):** How finely do we split OIS components into repos?

- (a) 1:1 mapping — today's 8+ npm packages each become own engineer-repo; preserve current boundaries
- (b) Coarser grouping — 3-4 themed group-repos (e.g., adapter-group, hub-group, etc.)
- (c) Finer split — break each package into multiple smaller repos
- (d) Re-architect first — boundary-revision before migration

**Q5 — Cross-repo refactor protocol (HOW):** How do we coordinate breaking changes across repos?

- (a) Lockstep coordination — atomic across consumer repos in same release
- (b) Deprecation runway — ship v1.x with both old + new for N versions; then drop
- (c) Major-version-bump signaling — semver major-bump tells consumers; clean break
- (d) Mixed-by-change-class — different mechanism per change-class (e.g., API additions = soft; removals = lockstep)

**Q6 — Citation-tooling investment timing (WHEN):** When do we build citation-validator?

- (a) Pre-migration validator gate — build BEFORE migration starts; PR-time enforcement
- (b) Validator co-shipped with first migration — bootstrap validator + first-component-migration together
- (c) Validator post-migration — manual citation discipline through migration; validator as cleanup-tool
- (d) No automated validator — methodology-discipline only; no PR-time gate

### §2.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q4 — Component boundary granularity for OIS migration (WHAT) | **(a)** 1:1 mapping | Today's 8+ npm packages each become own engineer-repo; preserve current boundaries; no pre-migration re-architecting |
| Q5 — Cross-repo refactor protocol (HOW) | **(a) + (c) multi-pick** | **Lockstep coordination + major-version-bump signaling**; no deprecation-runway; clean-break posture; semver IS the spec |
| Q6 — Citation-tooling investment timing (WHEN) | **(a)** Pre-migration validator gate | Build citation-validator BEFORE migration starts; PR-time gate; highest upfront cost; lowest defect rate during migration |

### §2.Q4 — Per-question interpretation

**Original-Idea reading:** Idea-261's open Survey questions flagged "Component boundary granularity" as Q1-candidate. Round-2 Q4=a (1:1 mapping; today's 8+ packages each become own engineer-repo) preserves current package boundaries as the migration target. No re-architecting before migration. Today's package layout (hub, network-adapter, message-router, cognitive-layer, storage-provider, repo-event-bridge, claude-plugin, opencode-plugin) was Director-ratified through prior mission cycles + reflects organic-but-considered architectural choices; treating it as authoritative for repo-boundaries means the migration mechanics are simpler (mechanical 1:1 split) and architectural-decisions stay scoped to subsequent missions.

**Tele-mapping:** primary tele-3 Sovereign Composition (current package boundaries are the sovereign-module boundary already; preserve them). Secondary tele-1 Sovereign State Transparency (each package's state-backplane becomes per-repo-queryable independently). Tertiary tele-7 Resilient Operations (1:1 mapping = smallest migration-unit blast-radius per sub-mission).

**Round-1 carry-forward:** Q2=c (phased per-component) → Q4=a directly determines sub-mission count: ~8 component-migration sub-missions enumerated in idea-261's plannedTasks Phase 5 Manifest. Q1=b (full architectural missioncraft v1) means each component-migration sub-mission has the full pluggable substrate to target. Q3=a-modified (apnex namespace) means OIS components migrate to apnex-org namespace remaining (not the apnex personal namespace where missioncraft lives) — the org-boundary preserves architectural sovereignty between missioncraft (substrate-tool) and OIS (consumer).

**Aggregate Round-2 Surface:** Q4=a + Q5=ac + Q6=a compose into "preserve-package-boundaries + clean-break-via-semver + tooling-first" — strong architectural-discipline posture. No re-architecting before migration; semver as truth-channel for breaking changes; validator-gate guarantees citation-density through migration.

### §2.Q5 — Per-question interpretation

**Original-Idea reading:** Multi-pick (a)+(c) = "lockstep coordination + major-version-bump signaling". The two compose naturally — (a) is the COORDINATION mechanism (atomic across consumer repos in same release); (c) is the SIGNALING mechanism (semver major-version-bump tells consumers "incompatible change"). Director rejected (b) deprecation-runway entirely; rejected (d) mixed-by-change-class. Net: clean-break posture. When a component's interface changes incompatibly, the new version is a major-bump + all consumer repos coordinate atomically to consume the new major.

**Tele-mapping:** primary tele-8 Gated Recursive Integrity (lockstep = full certification at each cross-repo step; no partial-state-transitive surface; binary pass/fail per breaking-change ascension). Secondary tele-2 Isomorphic Specification (semver IS the spec; major-version-number tells consumers everything they need to know about compat; declarative truth-channel). Tertiary tele-1 Sovereign State Transparency (atomic state transition across multiple repos = no in-flight inconsistency window).

**Round-1 + Round-2 carry-forward:** Q1=b (full architectural v1) means breaking changes during missioncraft v2-and-beyond development will use this protocol. Q2=c (phased per-component) + Q4=a (1:1 mapping) means each component-migration sub-mission is its own breaking-change-class candidate when the migration itself changes import paths from `@apnex/X` to `@apnex/X-repo`. Q5=ac means those import-path changes happen via major-bump + lockstep across all consumer repos in same release.

**Aggregate Round-2 Surface:** semver-as-truth-channel + lockstep-coordination is consistent with Director's pre-Survey commitment to gh CLI for GitHub-host (single auth flow; clean dependency surface) — both are "use the standard tool's intended pattern; don't invent ceremony." Director is signaling preference for declarative-clarity over runway-flexibility.

### §2.Q6 — Per-question interpretation

**Original-Idea reading:** Q6=a (Pre-migration validator gate) sequences citation-tooling investment BEFORE the migration sub-missions start. Validator catches broken citations at PR-time; no citation-rot accumulates during the migration arc. Highest upfront cost (build validator before any migration value lands); lowest defect rate during migration. This composes with Q1=b (full architectural v1; build the right thing first) + Q6=a (build the right tooling first) — same posture: pay upfront for cleanliness.

**Tele-mapping:** primary tele-2 Isomorphic Specification (validator enforces spec-as-runtime; citation-format IS the spec; broken citations are spec-drift defects). Secondary tele-12 Precision Context Engineering (citations are LLM-context surface; validator preserves citation-density through migration; no LLM hallucination of "I think this code lives at..."). Tertiary tele-4 Zero-Loss Knowledge (zero citation-rot through migration = zero corporate-amnesia surface).

**Round-1 + Round-2 carry-forward:** Q1=b (full architectural missioncraft v1) means the validator can be built as an opt-in part of missioncraft's CLI surface (`msn citations validate`) OR as a separate ops-repo tool. Q2=c + Q4=a + Q5=ac (phased migration with semver-driven breaking-changes) means the validator must understand cross-repo citation resolution at specific package versions — citation `@apnex/network-adapter@1.x > src/foo.ts > bar` is valid at v1; not at v2 if `bar` was renamed. Validator must be version-aware. This is non-trivial scope; Q6=a's "highest upfront cost" framing was honest.

**Aggregate Round-2 Surface:** the validator-first commitment elevates citation-tooling from "nice-to-have" to "blocking-substrate-for-migration". This adds a sub-mission to idea-261's catalog: M-Citation-Validator-Tooling (likely sub-mission #1.5 — between missioncraft v1 ship and first-component-migration). Worth flagging in Phase 4 Design.

**Round-2 composite read:** The Round-2 picks compose into **"build the right tools first (missioncraft v1 + citation-validator); migrate cleanly with semver-driven coordination; preserve current package boundaries as the migration target"**. Strong architectural-discipline posture; no shortcuts; pay upfront for cleanliness. Cross-question coherence: Q4=a (preserve boundaries) + Q5=ac (semver-driven coordination) + Q6=a (validator-first) all align with the "do it right, not slow about it" posture established in Round-1 (Q1=b full architectural; Q2=c phased; Q3=a OSS day-1).

---

## §3 Composite intent envelope

**Aggregate posture (both rounds composed):** Build missioncraft v1 as an architecturally-complete, OSS-from-day-1, category-contribution standalone tool at `github.com/apnex/missioncraft` (Q1=b + Q3=a-modified). All 5 pluggable interfaces (`IdentityProvider`, `ApprovalPolicy`, `StorageProvider`, `GitEngine`, `RemoteProvider`) ship in v1 with sensible defaults; standalone-CLI (`msn`) + library-SDK personas first-class from day 1; OIS-orchestrated persona is integration work post-v1. After missioncraft v1 ships standalone-stable, build the citation-validator as the second sub-mission (Q6=a — pre-migration validator gate; PR-time citation enforcement; version-aware cross-repo resolution). THEN migrate OIS components incrementally — one per sub-mission, each its own bilateral cycle (Q2=c phased-incremental + Q4=a 1:1 mapping; today's 8+ packages each become own engineer-repo preserving current package boundaries). Cross-repo breaking changes use lockstep-coordination + semver-major-bump signaling (Q5=ac); no deprecation-runway, no mixed-by-change-class — clean-break posture with semver as the truth-channel.

**Primary outcome:** ratified catalog of downstream sub-missions (mission-of-missions deliverable shape) with scope + ordering + dependencies + per-sub-mission Phase-3-Survey-readiness — Phase 4 Design enumerates, Phase 5 Manifest binds. Sub-mission ordering: (1) missioncraft v1; (2) M-Citation-Validator-Tooling; (3..N) per-component OIS-migration sub-missions in dependency order (likely hub-repo last, since all other components depend on it). First-canonical multi-repo mission shape — missioncraft sub-mission lives in `github.com/apnex/missioncraft` while idea/mission/audit entities live in agentic-network. First-canonical mission-of-missions shape — deliverable is a catalog, not direct substrate.

**Secondary outcomes:** (1) sovereignty-discipline reinforcement at the GitHub-org boundary — missioncraft (substrate-tool) at `github.com/apnex` is namespace-distinct from OIS components remaining at `github.com/apnex-org`, operationalizing tele-3 Sovereign Composition at infrastructure level; (2) calibration-#62-companion methodology emergence — phased-per-component migration with per-step audit naturally surfaces substrate-currency issues at each gate rather than accumulating across a big-push; (3) external-operator-onboarding pathway — OSS-from-day-1 + npmjs.com publishing means non-OIS operators can adopt missioncraft without OIS dependency; (4) workspace-shape ratification — mission-as-collection-of-branches under `/missions/<id>/<repo>/` with ephemeral workspaces (mission-execution) + long-lived workspaces only for ops-repos.

**Key design constraints surfaced:**
- Missioncraft v1 = full pluggable surface (no v2 retrofit on architectural shape); IsomorphicGit for wire ops; gh CLI (NOT Octokit) for GitHubRemoteProvider; auth via `gh auth token`; pure-git fallback when no RemoteProvider configured.
- Citation-validator must be version-aware (cross-repo citations resolve at specific package versions); integrates as missioncraft CLI subcommand OR separate ops-repo tool — Phase 4 Design call.
- Single-writer-per-mission + one-active-mission-per-repo lock eliminates intra-mission + cross-mission concurrency questions; CRDT/region-lock/semantic-merge research not needed.
- Symbol-chain code-citation format: `<component> > <file-path> > <class.method | function | symbol | type>` — validator enforces at PR-time.
- Auto-merge configurable (not auto-deploy); periodic state durability; mission-execution workspaces always ephemeral.

---

## §4 Mission scope summary

| Axis | Bound |
|---|---|
| Mission name | M-Multi-Agent-Mission-Coordination-Architecture |
| Mission class | structural-inflection |
| Substrate location | Multi-repo: missioncraft sub-mission in `github.com/apnex/missioncraft` (new sovereign repo); citation-validator + per-component-migration sub-missions span `github.com/apnex-org/agentic-network` + each extracted `github.com/apnex-org/<component>-repo`; idea/mission/audit entities remain in `agentic-network` |
| Primary outcome | Ratified catalog of downstream sub-missions (mission-of-missions deliverable) — missioncraft v1, citation-validator, ~8 per-component OIS-migration sub-missions enumerated with scope + ordering + dependencies |
| Secondary outcomes | Sovereignty discipline at GitHub-org boundary (apnex vs apnex-org); calibration-#62 companion methodology; external-operator onboarding pathway; workspace-shape ratification |
| Tele alignment (primary, whole-mission) | tele-3 Sovereign Composition; tele-2 Isomorphic Specification |
| Tele alignment (secondary, whole-mission) | tele-7 Resilient Operations; tele-8 Gated Recursive Integrity |
| Tele alignment (Round-1) | primary: tele-3, tele-2; secondary: tele-7, tele-11 |
| Tele alignment (Round-2) | primary: tele-8, tele-2; secondary: tele-3, tele-12 |

---

## §5 Anti-goals (out-of-scope; deferred)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Strukto-mirage-style VFS for code (read+write GitHub mount with semantic-region merging) — explicitly out-of-scope; missioncraft uses real git wire-protocol via IsomorphicGit + real branches + real PRs | Future research idea (post-2027); strukto-mirage is read-only-VFS for service-heterogeneity, not a code-coordination substrate |
| AG-2 | CRDT / region-lock / semantic-merge for intra-mission concurrency — not needed; single-writer-per-mission lock eliminates the question entirely | Future idea if multi-writer-per-mission ever surfaces (currently no path to this) |
| AG-3 | Director-chat ACP redesign + universal adapter rework — separate architectural arc; this mission does NOT touch chat/adapter substrate | `project_director_chat_acp_redesign.md` memory; future idea |
| AG-4 | API v2.0 tool-surface scoping (verbs/envelopes/naming) — defer to idea-121 per `feedback_defer_tool_surface_to_idea_121.md` | idea-121 (API v2.0); this mission's missioncraft CLI surface is sovereign + separate from Hub MCP tool surface |
| AG-5 | Migration of agentic-network itself (the architect-repo) — final sub-mission in catalog or its own meta-mission; deliberately last; agentic-network keeps idea/mission/audit substrate during migration of all other components | Final per-component sub-mission OR a follow-on architect-repo-extraction mission |
| AG-6 | Octokit dependency / hand-rolled HTTP for GitHub operations — explicit lean-dependency exclusion per Director ratification 2026-05-08 | N/A (decision locked) |
| AG-7 | Pre-migration re-architecting of current package boundaries — Q4=a 1:1 mapping locks today's boundaries as migration target; any boundary-revision is a separate post-migration mission | Future post-migration architectural mission |

---

## §6 Architect-flags / open questions for Phase 4 Design round-1 audit

Architect-flags batched for engineer's round-1 content-level audit (per mission-67 + mission-68 audit-rubric precedent: CRITICAL / MEDIUM / MINOR / PROBE classifications). Each flag carries an architect-recommendation to challenge.

| # | Flag | Classification | Architect-recommendation |
|---|---|---|---|
| F1 | Citation-validator host: missioncraft CLI subcommand (`msn citations validate`) vs separate ops-repo tool | MEDIUM | Recommend missioncraft CLI subcommand — single sovereign tool surface; reuses missioncraft's IsomorphicGit + RemoteProvider for cross-repo resolution; avoids second sovereign-tool maintenance surface. Engineer may surface ops-repo argument if validator scope balloons beyond missioncraft natural-fit. |
| F2 | First-component-to-migrate: which OIS component is the canonical 1st-migration candidate (proves the migration playbook) | MEDIUM | Recommend `repo-event-bridge` or `storage-provider` — leaf-most dependencies; lowest cross-component coupling; smallest blast-radius for playbook validation. AVOID hub-repo first (everything depends on it; failed migration cascades). Engineer may surface alternative ordering. |
| F3 | Sub-mission count + ordering: ~8 component-migration sub-missions enumerated in Phase 5 Manifest? Or batched into "wave 1 / wave 2" larger-grained missions? | MEDIUM | Recommend per-component-1-mission (8 sub-missions) — Q2=c phased-incremental signal favors smallest blast-radius per sub-mission; batching wave-style violates the spirit of Q2=c. Engineer may surface batching argument if dependency-graph favors waves. |
| F4 | idea-259 (Adapter-Sovereign-Import-Cycle-Resolution) folding — sub-mission of this meta-mission OR independent? | MEDIUM | Recommend folding as sub-mission — adapter-sovereign-import is structurally part of multi-repo migration shape (adapter is a component being extracted; its import-cycle resolution is part of its migration). Engineer may surface independence argument if scope incompatible. |
| F5 | Workspace-state durability mechanism for periodic state — per-repo `.git/` commits? out-of-band snapshot store? IsomorphicGit's `fs` adapter? | PROBE | No architect-recommendation; surface as Phase 4 Design open-question for engineer-architect-bilateral resolution. |
| F6 | Auto-merge configurability surface — missioncraft CLI flag (`msn merge --auto`) OR mission-config-driven OR both? | MINOR | Recommend both — CLI flag for ad-hoc; mission-config for declarative-mission-shape governance. Engineer may surface single-source-of-truth argument. |
| F7 | Pluggable defaults: which `IdentityProvider` / `ApprovalPolicy` / `StorageProvider` / `GitEngine` / `RemoteProvider` ship as v1 defaults? | MEDIUM | Recommend: IdentityProvider=local-git-config; ApprovalPolicy=trust-all; StorageProvider=local-filesystem; GitEngine=IsomorphicGit; RemoteProvider=NONE (pure-git mode default; gh-CLI opt-in). Engineer may surface alternative defaults per ergonomic considerations. |
| F8 | OIS-orchestrated persona integration: separate post-v1 sub-mission OR included in missioncraft v1 scope? | CRITICAL | Recommend separate post-v1 sub-mission — Q1=b "full architectural" scope is the 5 pluggables + 2 personas (standalone-CLI + library-SDK); OIS-orchestration is the 3rd persona built ON TOP via OIS-side integration code (not missioncraft-internal). This keeps missioncraft sovereign + category-tool-shaped. Engineer should challenge if interpretation differs. |

---

## §7 Sequencing / cross-mission considerations

### §7.1 Branch + PR strategy

<branch handle + PR cadence; cumulative-fold pattern per mission-68 M6 if applicable>

### §7.2 Composability with concurrent / pending work

<list of related ideas / missions / methodology docs and how they compose with this mission>

### §7.3 Same-day compressed-lifecycle candidate?

<compressed-lifecycle assessment per mission-67 + mission-68 precedent; risk-flag if scope-vs-precedent expansion warrants Director awareness at Phase 7>

---

## §calibration — Calibration data point

Per `idea-survey.md` §5 (Survey output element) + §15 schema. Captures empirical baseline for methodology-evolution loop per §13 Forward Implications.

- **Director time-cost (minutes):** <integer> (across both Survey rounds)
- **Comparison baseline:** <prior methodology reference OR prior Survey reference>
- **Notes:** <free text — methodology-evolution candidates; novel constraint surfaces; multi-pick observations>

---

## §contradictory — Contradictory multi-pick carry-forward

(Required per `idea-survey.md` §7 + §15 schema **only when contradictory multi-pick detected during architect interpretation**. Otherwise omit this section entirely.)

| Round | Question(s) | Picks | Constraint envelope description |
|---|---|---|---|
| <1\|2> | <Q-N, Q-M> | <letter, letter> | <description of common-satisfiable constraint Director is signaling per §7> |

---

## §8 Cross-references

- **`docs/methodology/idea-survey.md`** v1.0 — canonical Survey methodology (NOT modified by this mission per AG-9 IF applicable; spec-enrichment additions IS in-scope per AG-9 carve-out from mission-69)
- **`docs/methodology/strategic-review.md`** — Idea Triage Protocol (route-(a) skip-direct rationale if applicable)
- **`docs/calibrations.yaml`** — calibration ledger cross-refs (closures-applied + candidates-surfaced)
- **idea-261** — source idea
- **<related ideas / missions>**

---

— Architect: <name> / <YYYY-MM-DD> (Phase 3 Survey envelope; Director-ratified <N> picks across 2 rounds; <branch-pushed pre-bilateral round-1 audit per calibration #59 closure mechanism (a) — <N>th-canonical>)
