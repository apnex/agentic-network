---
mission-name: M-Missioncraft-V1
source-idea: idea-263
methodology-source: docs/methodology/idea-survey.md v1.0
director-picks:
  round-1:
    Q1: d
    Q1-rationale: All three failure-modes equally — comprehensive durability across process-crash + disk-failure + network-partition; no single-failure-mode optimization
    Q2: a
    Q2-rationale: Strict 1.0 from day-1 — every breaking change post-v1 is a major-version-bump; semver IS the spec for sub-mission #2-#11 consumers
    Q3: a
    Q3-rationale: Single package `@apnex/missioncraft` — CLI + library-SDK + all 5 pluggables in one; simplest consumer DX; one-version-bump-per-breaking-change. **v1.1-evening Director-direct refinement:** preserved as Shape B HYBRID — single npm package + internal sovereign-module separation (`src/missioncraft-sdk/`, `src/missioncraft-cli/`); CLI imports SDK as if external. Q3=a substrate (single package shipping) preserved; internal sovereign-module discipline added.
  round-2:
    Q4: c
    Q4-rationale: Patient ~6-8 weeks — quality-over-calendar; absorbs upfront substrate-investigation for durability + API-getting-right + boundary design
    Q5: b
    Q5-rationale: Unit + integration — round-trip mission lifecycle tests; NO chaos NO cross-version-compat; minimum viable validation (cross-round coherence flag with Q1=d captured at §6 F1 CRITICAL)
    Q6: b
    Q6-rationale: README + TypeDoc + getting-started tutorial — operator-onboarding-priority; pluggable-extension + migration-guide + architecture-rationale all deferred
mission-class: substrate-introduction
tele-alignment:
  primary: [tele-3, tele-2]
  secondary: [tele-7, tele-11]
  round-1:
    primary: [tele-7, tele-2]
    secondary: [tele-11, tele-8]
  round-2:
    primary: [tele-7, tele-2]
    secondary: [tele-8, tele-11]
anti-goals-count: 10
architect-flags-count: 12
skill-meta:
  skill-version: survey-v1.0
  tier-1-status: implemented
  tier-2-status: stubbed
  tier-3-status: stubbed
calibration-data:
  director-time-cost-minutes: 4
  comparison-baseline: parent meta-mission Survey (idea-261 / M-Multi-Agent-Mission-Coordination-Architecture; thread-507 Phase 4 audit cadence)
  notes: |
    First-canonical sub-mission Phase 3 Survey spawned via parent meta-mission Phase 5 Manifest entry per §6.6 (b) just-in-time discipline.
    Pre-Survey ratification timeline (3 architectural-commitments at parent meta-mission level) reduced sub-mission Survey-round scope to genuinely-open dimensions only (failure-mode protection / API stability commitment / packaging boundary / timeline / test-depth / docs-surface).
    Cross-round coherence flag surfaced: Q1=d (comprehensive durability promise) ↔ Q5=b (no chaos validation) — validation-strategy gap captured as §6 F1 CRITICAL architect-flag for Phase 4 Design v0.1 attention.
    Methodology observation: parent-mission-pre-Survey-ratifications + sub-mission-tighter-scope Survey is a clean meta-Survey-pattern instance (composes-with parent meta-mission's Survey calibration notes). The pattern-validation: when parent has captured architectural-commitments, sub-mission Survey scopes to remaining-genuinely-open dimensions; ~4min Director-time captures 6 picks cleanly.
    No contradictory multi-pick detected within rounds; cross-round coherence flag is a validation-strategy gap NOT contradictory pick per idea-survey.md §7 framing.
contradictory-constraints:
  # No contradictory multi-pick detected within rounds. Cross-round coherence flag (Q1=d ↔ Q5=b validation-strategy gap) captured as §6 F1 CRITICAL architect-flag for Phase 4 Design v0.1 attention; not a contradictory-pick per §7 framing.
calibration-cross-refs:
  closures-applied: []
  candidates-surfaced:
    - meta-Survey-pattern instance (sub-mission Survey post parent-Phase-5-just-in-time spawn; pre-Survey-architectural-commitments-narrow-the-scope)
    - cross-round coherence flag pattern (Q1-Round-1 vs Q5-Round-2 validation-strategy gap; not contradictory-pick but architect-flag-capture surface)
---

# M-Missioncraft-V1 — Phase 3 Survey envelope

**Methodology:** `docs/methodology/idea-survey.md` v1.0 (3+3 Director-intent pick-list)
**Source idea:** idea-263
**Mission-class candidate:** substrate-introduction (foundational; first-sub-mission of meta-mission idea-261's 11-sub-mission catalog; everything else uses missioncraft as substrate)
**Branch:** `agent-lily/m-missioncraft-v1-design` (renamed from `agent-lily/m-branchcraft-v1-survey` per Director-direct refinement #1 2026-05-08-evening; survey envelope was on prior branch as historical artifact at v1.0 RATIFIED state; this v1.1 cosmetic-rename fold preserves Director-picks substantively unchanged)

**v1.1 cosmetic-rename fold (2026-05-08-evening):** Director-direct rename branchcraft → missioncraft + brc → msn. Q1-Q6 Director-picks preserved substantively (Q1=d / Q2=a / Q3=a-refined-to-Shape-B-hybrid / Q4=c / Q5=b / Q6=b). Q3 refinement: Shape B (hybrid single-package + internal sovereign-module separation) — substrate of Q3=a "single package shipping" preserved; internal sovereign-module discipline added per refinement #5.

---

## §0 Context

This Survey opens the Phase 3 gate for **idea-263 (M-Missioncraft-V1)** — sub-mission #1 spawned via Phase 5 Manifest entry of parent meta-mission **idea-261 (M-Multi-Agent-Mission-Coordination-Architecture)** per §6.6 (b) just-in-time discipline. Director directive 2026-05-08 "keen to start on missioncraft" authorized Phase 5 launch of sub-mission #1 immediately post Phase 4 Design v1.0 BILATERAL RATIFIED + v1.1 Director-direct cosmetic fold (parent Design @ SHA `7c859d4`).

**Pre-Survey architectural commitments locked at parent meta-mission level (per parent Design §2.2):**
- 5 pluggable interfaces (`IdentityProvider` / `ApprovalPolicy` / `StorageProvider` / `GitEngine` / `RemoteProvider`) — all v1-shipped per parent Q1=b full architectural
- 2 personas (standalone-CLI `msn` + library-SDK `import { Missioncraft } from '@apnex/missioncraft'`) — v1-shipped first-class
- OIS-orchestrated persona POST-V1 (parent F8 CRITICAL ratified) — keeps missioncraft sovereign + category-tool-shaped
- Repo location: `github.com/apnex/missioncraft` (NEW sovereign repo under Director's personal namespace; OSS day-1 + Apache 2.0 + npmjs.com)
- 3 architectural commitments ratified pre-Survey: (R1) standalone-repo from start; (R2) any-git-endpoint compatible (IsomorphicGit primary; pure-git fallback); (R3) gh CLI for GitHub-host (NOT Octokit; lean dep surface)
- v1 default-stack: `LocalGitConfigIdentity` + `TrustAllPolicy` + `LocalFilesystemStorage` + `IsomorphicGitEngine` + (no RemoteProvider; gh-CLI opt-in)
- Mission-shape contract: workspace path `/missions/<id>/<repo>/`; single-writer-per-mission lock; one-active-mission-per-repo lock; ephemeral by default; auto-merge configurable

**Survey purpose:** capture Director-intent along the highest-leverage strategic dimensions still open post-pre-Survey-commitments. Parent Design deferred 3 Director-intent questions to this Phase 3 Survey: F5 PROBE (periodic state durability mechanism — failure-mode protection priority); §6.4 (v1 ship timeline window); API stability commitment + packaging boundary additions emerged via architect-judgment as load-bearing for sub-mission #2 + #3-#11 consumer-discipline. Output: ratified Survey envelope → Phase 4 Design v0.1 concretizes the 5 pluggable interface signatures + default implementations + CLI verb specifics + workspace contract details + durability mechanism design.

---

## §1 Round 1 picks

### §1.0 Round-1 questions (as dispatched to Director)

**Q1 — Periodic state durability primary failure-mode (WHY):** What failure-mode is the durability mechanism primarily protecting against? (Determines mechanism choice between per-repo `.git/` commits / out-of-band snapshot store / IsomorphicGit `fs` adapter — F5 PROBE from parent Design.)

- (a) Process-crash recovery — missioncraft process dies mid-operation; restart resumes from last durable state; covers `kill -9` / OOM / panic
- (b) Disk-failure recovery — workspace storage lost (disk corruption / accidental delete); state recoverable from out-of-band snapshot
- (c) Network-partition resilience — push/pull interrupted mid-flight; state survives the partition + completes when network returns
- (d) All three equally — comprehensive durability

**Q2 — API stability commitment at v1 (HOW STRICT):** What's the public-API stability promise at v1.0.0? Sub-mission #2 (citation-validator) + sub-missions #3-#11 (component-extracts) ALL consume missioncraft library-SDK; their stability depends on this commitment.

- (a) Strict 1.0 from day-1 — every breaking change post-v1 is a major-version-bump (semver discipline; aligns with Q5=ac clean-break posture)
- (b) Phase-locked — v1.x stable for 6-12 months; v2.x signaled when next architectural phase requires breaking changes
- (c) Pre-1.0 (`v0.x`) for first N months — APIs may break in minors during stabilization period; promote to 1.0 when ready
- (d) Mixed-tier — pluggable interfaces strict-1.0; CLI flags pre-1.0 (operator-side wiggle room)

**Q3 — Packaging boundary at v1 (WHAT shape):** How do we package missioncraft for npm publish?

- (a) Single package `@apnex/missioncraft` — CLI + library-SDK + all 5 pluggables in one; simplest consumer-facing import; biggest install footprint
- (b) Multi-package — `@apnex/missioncraft-core` + `@apnex/missioncraft-cli` + `@apnex/missioncraft-providers` (per-pluggable provider packages); finer-grained consumer dep selection
- (c) Hybrid — single package with sub-path imports (`import { Missioncraft } from '@apnex/missioncraft'`; `import { GitHubRemoteProvider } from '@apnex/missioncraft/providers/github'`); cleaner DX than (a); no separate-publish discipline
- (d) Defer — Phase 4 Design ratifies based on package-size analysis post-implementation

### §1.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q1 — Periodic state durability failure-mode priority (WHY) | **(d)** All three equally | Comprehensive durability across process-crash + disk-failure + network-partition; no single-failure-mode optimization |
| Q2 — API stability commitment at v1 (HOW STRICT) | **(a)** Strict 1.0 from day-1 | Every breaking change post-v1 is a major-version-bump; semver IS the spec; consumer repos can pin v1.x and trust no-breaks within major |
| Q3 — Packaging boundary at v1 (WHAT shape) | **(a)** Single package | CLI + library-SDK + all 5 pluggables in one `@apnex/missioncraft`; simplest consumer DX; one-version-bump-per-breaking-change |

### §1.Q1 — Per-question interpretation

**Original-Idea reading:** idea-263 §F5 PROBE listed 3 candidate mechanisms for periodic state durability (per-repo `.git/` commits / out-of-band snapshot store / IsomorphicGit `fs` adapter). Q1=d (all three failure-modes equally) signals the mechanism MUST protect against process-crash + disk-failure + network-partition. No single-failure-mode optimization is acceptable; either a single comprehensive mechanism, OR a layered approach combining mechanisms. Phase 4 Design must enumerate per-failure-mode coverage gaps + close all three explicitly.

**Tele-mapping:** primary tele-7 Resilient Operations (comprehensive resilience across all failure-modes; no single-point-of-failure in durability surface). Secondary tele-1 Sovereign State Transparency (state recoverable + queryable across all failure scenarios; no opacity-when-degraded surface). Tertiary tele-8 Gated Recursive Integrity (durability is binary pass/fail per failure-mode; either covers all or fails one — no partial-coverage allowed).

**Aggregate-Surface:** Director signaling **resilience-completeness over scope-discipline**. Cost: more upfront work on durability mechanism design (combining/layering mechanisms; non-trivial substrate-investigation in Phase 4); benefit: no surprise failure-mode escapes the v1 durability surface. Composes-with Q2=a (strict 1.0 — durability promise at v1 is comprehensive, not "we'll add disk-failure recovery in v1.1") and Q3=a (single package — durability mechanism is single sovereign-component-internal, not split across multi-package).

### §1.Q2 — Per-question interpretation

**Original-Idea reading:** idea-263 noted v1 ships as architecturally-complete; sub-missions #2-#11 consume missioncraft library-SDK at versioned dependency. Q2=a (strict 1.0 from day-1) is the strongest stability commitment — every breaking change post-v1 is a major-version-bump (`msn@1.x` → `msn@2.x` for any breaking change). Aligns with parent Q5=ac clean-break posture (semver IS the truth-channel for cross-repo coordination). No `v0.x` ramp-up; no "phase-locked" (Q2=b); no mixed-tier (Q2=d).

**Tele-mapping:** primary tele-2 Isomorphic Specification (v1 API IS the spec; bit-perfect contracts published from day 1; no spec-drift in 1.x; declarative truth-channel). Secondary tele-8 Gated Recursive Integrity (each major-bump certified; binary pass/fail per ascension). Tertiary tele-7 Resilient Operations (consumer repos can pin v1.x and trust no-breaking-changes within major; downstream sub-missions #3-#11 inherit stability).

**Aggregate-Surface:** Director signaling **strict-discipline-from-day-1 over flexibility**. Cost: more architect-side work upfront getting v1 API right (no "we'll fix it in 1.1" escape; v1 release IS final shape); benefit: every consumer (sub-missions #2-#11; external operators) gets bit-perfect contract from v1.0.0 release. Composes-with Q1=d (comprehensive durability AND strict API stability — both are completeness commitments) and Q3=a (single package — single version-bump-per-breaking-change, cleaner than N-package per-bump-cadence-coordination).

### §1.Q3 — Per-question interpretation

**Original-Idea reading:** idea-263 §2.2 enumerated 5 pluggables + 2 personas. Q3=a (single package `@apnex/missioncraft`) ships everything in one npm package. Consumer-facing import: `import { Missioncraft, IsomorphicGitEngine, GitHubRemoteProvider, ... } from '@apnex/missioncraft'`. Biggest install footprint (all 5 pluggables present even if consumer uses 2); eliminates per-package version-coordination complexity (one package = one version = one breaking change = one major-bump). No multi-package (Q3=b); no hybrid sub-path imports (Q3=c); no defer (Q3=d).

**Tele-mapping:** primary tele-11 Cognitive Minimalism (single import surface; deterministic primitives; no LLM-side workarounds for "which package has X?"). Secondary tele-2 Isomorphic Specification (single package = single API surface = single spec; no cross-package interface drift surface). Tertiary tele-3 Sovereign Composition (single sovereign-component published as single npm package; matches the "module of one" Law-of-One per pluggable interface — composed at the package level).

**Aggregate-Surface:** Director signaling **simplicity-over-modularity at v1**. Cost: install footprint includes all 5 pluggables even for thin consumers; potential dead-code in consumer bundles (mitigatable via tree-shaking IF library-SDK exports are tree-shake-friendly — Phase 4 Design call). Benefit: simplest possible consumer DX; no cross-package version-coordination tax; matches Q2=a strict-1.0 (one package = one version-bump cadence; simpler semver discipline than N-packages-each-with-own-cadence). Composes-with Q1=d + Q2=a — all three picks favor completeness + simplicity over modular flexibility.

**Round-1 composite read:** All three picks (Q1=d + Q2=a + Q3=a) compose into a coherent posture: **"missioncraft v1 ships comprehensive + strict + simple — comprehensive durability across all failure-modes; strict 1.0 API stability commitment from day-1; single-package shipping for simplest consumer DX."** No tension between picks; consistent "completeness + discipline + simplicity" architectural intent. Cross-question coherence: Q1=d expects comprehensive substrate work upfront (durability); Q2=a expects strict spec discipline upfront (API); Q3=a expects single sovereign-tool packaging discipline (shipping) — all three are upfront-investment-for-downstream-cleanliness choices, consistent with parent Q1=b "full architectural" posture inherited.

---

---

## §2 Round 2 picks

### §2.0 Round-2 questions (as dispatched to Director)

**Q4 — v1 ship timeline window (WHEN):** What's the calendar window for v1 ship?

- (a) Aggressive (~1-2 weeks; minimum-viable-architectural-completeness; tightly scoped)
- (b) Moderate (~3-4 weeks; architect estimate; reasonable buffer for substrate-investigation + durability mechanism design)
- (c) Patient (~6-8 weeks; comprehensive testing + documentation + tutorials; quality-over-calendar)
- (d) No-deadline — ship-when-ready posture

**Q5 — Test surface depth at v1 (HOW THOROUGH):** What test pyramid does v1 ship? Composes-with Q1=d comprehensive durability — chaos-testing is the natural validation surface for the 3 failure-mode coverage.

- (a) Unit-only — IsomorphicGit-engine unit tests; pluggable interface contract tests; minimal viable
- (b) Unit + integration — adds end-to-end mission lifecycle tests (init → branch → commit → push → merge round-trip)
- (c) Unit + integration + cross-version compatibility — adds tests against 2-3 git versions + 2-3 GitHub API versions
- (d) Unit + integration + chaos — adds fault-injection (network-partition / disk-full / process-kill) per Q1=d failure-mode coverage

**Q6 — Documentation surface at v1 (WHAT):** What docs ship with v1? Composes-with OSS-from-day-1 + Q2=a strict API stability — docs are the committed-contract publication surface for external operators + sub-mission consumers.

- (a) README + auto-generated TypeDoc API reference — minimum viable
- (b) README + TypeDoc + getting-started tutorial — adds operator-onboarding path
- (c) README + TypeDoc + getting-started + pluggable-extension guide — adds developer-extension path
- (d) Full suite — README + TypeDoc + getting-started + pluggable-extension + migration-guide-from-OIS-monorepo + architecture-rationale-doc

### §2.1 Director picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q4 — v1 ship timeline window (WHEN) | **(c)** Patient ~6-8 weeks | Quality-over-calendar; absorbs substrate-investigation time for durability + API-getting-right + boundary design |
| Q5 — Test surface depth at v1 (HOW THOROUGH) | **(b)** Unit + integration | Round-trip mission lifecycle tests; NO chaos NO cross-version-compat; minimum viable validation |
| Q6 — Documentation surface at v1 (WHAT) | **(b)** README + TypeDoc + getting-started | Operator-onboarding path priority; pluggable-extension + migration-guide deferred |

### §2.Q4 — Per-question interpretation

**Original-Idea reading:** idea-263 §6.4 noted v1 timeline as architect-estimate ~2-3 weeks. Q4=c (patient ~6-8 weeks) signals appetite for quality-over-calendar — Director DOUBLES the architect-estimate window. The 6-8 week window absorbs: substrate-investigation for durability mechanism design (Q1=d non-trivial — combining/layering 3 failure-mode coverages); strict API-getting-right discipline (Q2=a no-fix-in-1.1 escape; v1 release IS final shape); single-package boundary care (Q3=a tree-shaking + dead-code analysis for thin-consumer DX); plus test + doc work (Q5 + Q6).

**Tele-mapping:** primary tele-7 Resilient Operations (no rushed substrate; quality-driven cadence; substrate-investigation has time to surface edge cases). Secondary tele-8 Gated Recursive Integrity (each phase certified before next; no time-pressure-shortcuts at gate-points).

**Round-1 carry-forward:** Q1=d comprehensive durability + Q2=a strict 1.0 + Q3=a single package — all three demand substantial upfront investment. Q4=c patient timeline gives that investment room to land cleanly. Architect-estimate of 2-3 weeks was likely under-scoped given Round-1's ambition; Director's 6-8 week pick is empirically calibrated.

**Aggregate Round-2 Surface:** Director signaling patient-investment posture for v1 substrate. Composes with Q5=b (don't pad timeline with chaos-testing-theatre) + Q6=b (don't pad timeline with pluggable-extension-doc-theatre). Patient timeline + bounded per-cycle scope = quality-driven discipline within bounded deliverable.

### §2.Q5 — Per-question interpretation

**Original-Idea reading:** parent Design noted v1 needs test surface for v1.0.0 contract validation. Q5=b (unit + integration; NOT chaos NOT cross-version-compat) signals minimum-viable-validation posture. Round-trip mission lifecycle integration tests (init → branch → commit → push → merge) prove the substrate end-to-end on the happy path. Chaos testing (fault-injection) explicitly DROPPED despite Q1=d's comprehensive durability promise.

**Tele-mapping:** primary tele-7 Resilient Operations (integration-tested round-trip proves substrate works as designed). Secondary tele-11 Cognitive Minimalism (test-surface bounded; no over-engineering at v1; chaos-testing is v1.x maturity concern OR engineer-driven-discretionary).

**Round-1 carry-forward — CROSS-ROUND COHERENCE FLAG:** Q1=d (comprehensive durability across process-crash + disk-failure + network-partition) and Q5=b (NO chaos testing) create a **validation-strategy gap**. How does Phase 4 Design validate the 3-failure-mode durability promise without chaos-test rubric? Reading Director's intent: durability is a DESIGN-discipline concern (mechanism gets the design right; integration tests prove the happy path; failure-mode validation is theoretical-coverage-via-design-review OR single-failure-mode targeted-integration-tests). Phase 4 Design v0.1 architect-flag candidate: surface explicit validation-strategy for the 3 failure-modes (theoretical coverage proof / targeted-integration-tests / defer-chaos-to-v1.x / engineer round-1 audit identifies gap).

**Aggregate Round-2 Surface:** Director signaling tested-substrate-not-validation-theatre. Pragmatic test-discipline at v1; richer chaos surface emerges later. Composes with Q4=c (patient timeline absorbs the design-discipline work; doesn't need chaos-test-theatre to fill calendar).

### §2.Q6 — Per-question interpretation

**Original-Idea reading:** parent Design + idea-263 noted v1 needs docs for OSS-day-1 publication + sub-mission consumer enablement. Q6=b (README + TypeDoc + getting-started tutorial; NOT pluggable-extension NOT migration-from-OIS NOT architecture-rationale) signals operator-onboarding-priority + scope-discipline. Skips: (i) pluggable-extension guide — extensions ARE Q3=a single-package internal surface; v2 expansion territory; not v1 priority; (ii) migration-guide-from-OIS — likely ships WITHIN sub-missions #3-#11 themselves (each component-extract contributes its own migration narrative); OR as `docs/methodology/component-migration-playbook.md` (parent F10 ratified deliverable); (iii) architecture-rationale-doc — covered by parent Design + this Survey envelope; not duplicated at missioncraft-repo.

**Tele-mapping:** primary tele-2 Isomorphic Specification (operator-facing docs match published API; getting-started tutorial validates API-as-spec via running examples). Secondary tele-11 Cognitive Minimalism (minimum docs surface for v1 entry; no over-documenting; documentation-debt has zero benefit at v1 if extensions/migrations aren't yet in operator scope).

**Round-1 carry-forward:** Q3=a single package + Q2=a strict API stability mean docs are committed-contract — what ships at v1 is what consumers depend on. Q6=b minimum viable operator-onboarding (README + TypeDoc + getting-started) gets external operators productive on the happy path WITHOUT promising extensions/migrations as v1 docs. Sub-mission #2 (citation-validator) + #3-#11 (component-extracts) get migration narrative via parent F10 methodology playbook + their own per-sub-mission docs.

**Aggregate Round-2 Surface:** Director signaling operator-onboarding-priority + scope-discipline at doc-level. Composes with Q5=b (bounded test surface) + Q4=c (patient timeline) — patient cycle absorbs the operator-onboarding doc work cleanly without expanding to extension/migration territory.

**Round-2 composite read:** Round-2 picks (Q4=c + Q5=b + Q6=b) compose into **"patient-but-bounded"**: time-investment is upfront (Q4=c 6-8 weeks) but per-cycle deliverable scope stays disciplined (Q5=b minimum-viable testing; Q6=b operator-onboarding docs only). Quality-driven cadence with v1 deliverable scoped narrowly to operator-onboarding + integration-tested-substrate. Pluggable-extension docs + chaos validation + OIS-migration-guide all deferred to downstream cycles (v1.x for chaos validation; sub-missions #3-#11 for migration narrative; v2+ for pluggable-extension guide).

**Cross-round coherence concern (architect-flag carry):** Q1=d (comprehensive durability promise) ↔ Q5=b (no chaos validation) — validation-strategy gap; Phase 4 Design must surface explicit validation approach (theoretical coverage / targeted-integration-tests / defer-chaos / engineer-round-1-surfaces).

---

---

## §3 Composite intent envelope

**Aggregate posture (both rounds composed):** Build missioncraft v1 as **comprehensive + strict + simple + patient** sovereign component. Comprehensive durability (Q1=d) covers process-crash + disk-failure + network-partition equally. Strict 1.0 API stability (Q2=a) commits every breaking change post-v1 to a major-version-bump. Single-package shipping (Q3=a) puts CLI + library-SDK + all 5 pluggables in one `@apnex/missioncraft` for simplest consumer DX. Patient timeline (Q4=c ~6-8 weeks) absorbs upfront substrate-investigation + API-getting-right + boundary design. Bounded test surface (Q5=b unit + integration; NOT chaos NOT cross-version-compat). Bounded docs (Q6=b operator-onboarding-priority; NOT extension/migration/rationale). Pluggable-extension guide + chaos validation + OIS-migration-guide deferred to downstream cycles.

**Primary outcome:** ratified v1 architectural shape ready for Phase 4 Design concretization — pluggable interface signatures + default implementations + CLI verb specifics + workspace contract details + 3-failure-mode durability mechanism design + integration test surface + operator-onboarding docs. v1.0.0 publishable to npmjs.com under `@apnex/missioncraft` scope; consumed by sub-mission #2 (citation-validator) + #3-#11 (component-extracts) at strict-1.0 versioned dependencies.

**Secondary outcomes:** (1) sovereign-component category-tool established at `github.com/apnex/missioncraft` — external operators can adopt without OIS dependency; OSS day-1 + Apache 2.0; (2) 11-sub-mission catalog substrate-validated (#3-#11 each consume missioncraft library-SDK at v1.0.0); (3) bug-57+58-corrected dispatch substrate (Hub-side) + missioncraft sovereign substrate (tool-side) compose for the 2027 multi-agent code-coordination architecture.

**Key design constraints surfaced:**
- 5 pluggables + 2 personas all v1-shipped (parent Q1=b inherited)
- v1 default-stack: `LocalGitConfigIdentity` + `TrustAllPolicy` + `LocalFilesystemStorage` + `IsomorphicGitEngine` + (no RemoteProvider; gh-CLI opt-in)
- 3 failure-mode durability mechanism (Q1=d) — design-time architectural completeness; validation-strategy via design-review + targeted integration tests (NOT chaos-testing per Q5=b — architect-flag for Phase 4)
- Strict 1.0 API stability from day-1 (Q2=a) — Phase 4 Design must surface API surface comprehensively; no escape-hatch for "we'll fix in 1.1"
- Single-package shipping (Q3=a) — Phase 4 Design must surface tree-shake-friendly export structure to mitigate install-footprint cost for thin consumers
- Patient timeline (Q4=c ~6-8 weeks) — Phase 4 Design + Phase 6 implementation has runway; no time-pressure-shortcut at gate-points
- Operator-onboarding doc surface (Q6=b README + TypeDoc + getting-started) — pluggable-extension + migration-guide deferred

**Cross-round coherence flag:** Q1=d (comprehensive durability promise) ↔ Q5=b (no chaos validation) — validation-strategy gap. Phase 4 Design v0.1 architect-flag F1 (PROBE) must surface explicit validation approach.

---

## §4 Mission scope summary

| Axis | Bound |
|---|---|
| Mission name | M-Missioncraft-V1 |
| Mission class | substrate-introduction |
| Substrate location | NEW sovereign repo `github.com/apnex/missioncraft` (under Director's personal namespace; NOT apnex-org); npm scope `@apnex/missioncraft`; published OSS day-1 to npmjs.com |
| Primary outcome | v1 architecturally-complete sovereign component shipped — 5 pluggables + 2 personas + IsomorphicGit + gh-CLI; strict 1.0 API stability; single-package; comprehensive 3-failure-mode durability; operator-onboarding-doc surface |
| Secondary outcomes | OSS category-tool established (external operators can adopt without OIS dependency); 11-sub-mission catalog substrate-validated (sub-missions #2-#11 consume missioncraft library-SDK at v1.0.0); composes with bug-57+58-corrected Hub dispatch substrate for 2027 multi-agent code-coordination architecture |
| Tele alignment (primary, whole-mission) | tele-3 Sovereign Composition + tele-2 Isomorphic Specification |
| Tele alignment (secondary, whole-mission) | tele-7 Resilient Operations + tele-11 Cognitive Minimalism |
| Tele alignment (Round-1) | primary: [tele-7, tele-2]; secondary: [tele-11, tele-8] |
| Tele alignment (Round-2) | primary: [tele-7, tele-2]; secondary: [tele-8, tele-11] |

---

## §5 Anti-goals (out-of-scope; deferred)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | OIS-orchestrated persona — 3rd persona built ON TOP via OIS-side adapter; NOT missioncraft v1 internal | Parent F8 CRITICAL ratification; post-v1 sub-mission OR included in M-Component-Repo-Extract-Hub when hub gains missioncraft-orchestration capability |
| AG-2 | Chaos / fault-injection testing at v1 — explicit Q5=b exclusion | Future v1.x patch validation cycle OR engineer-driven-discretionary in Phase 4 Design audit |
| AG-3 | Cross-version compatibility testing (multi-git-version + multi-GitHub-API-version matrix) — explicit Q5=b exclusion | Future v1.x or v2 maturity cycle |
| AG-4 | Pluggable-extension developer guide (third-party extending missioncraft pluggables) — explicit Q6=b exclusion | v2 ecosystem-maturity territory; only when external pluggable-extension demand surfaces |
| AG-5 | Migration-guide-from-OIS-monorepo — explicit Q6=b exclusion at missioncraft repo | Sub-missions #3-#11 each contribute migration narrative; parent F10 methodology playbook (`docs/methodology/component-migration-playbook.md`) is the canonical surface |
| AG-6 | Architecture-rationale-doc at missioncraft repo — explicit Q6=b exclusion | Already covered by parent Design + this Survey envelope; no duplication |
| AG-7 | Multi-package npm publishing (`@apnex/missioncraft-core` + `-cli` + `-providers`) — explicit Q3=a exclusion | Future v2+ if ecosystem-modularity demand surfaces; not v1 |
| AG-8 | Pre-1.0 (`v0.x`) ramp-up phase — explicit Q2=a exclusion | N/A; v1.0.0 is the first published release |
| AG-9 | Octokit / hand-rolled HTTP for GitHub operations | Parent AG-6 inherited; gh-CLI is the sole GitHub-host mechanism |
| AG-10 | CRDT / region-lock / semantic-merge for intra-mission concurrency | Parent AG-2 inherited; single-writer-per-mission lock eliminates question |

---

## §6 Architect-flags / open questions for Phase 4 Design round-1 audit

Architect-flags batched for engineer's round-1 content-level audit (per mission-67 + mission-68 audit-rubric precedent: CRITICAL / MEDIUM / MINOR / PROBE classifications). Each flag carries an architect-recommendation to challenge.

| # | Flag | Classification | Architect-recommendation |
|---|---|---|---|
| F1 | Q1=d ↔ Q5=b validation-strategy gap — comprehensive durability promise without chaos-test validation. How does Phase 4 Design validate the 3-failure-mode durability without chaos-test rubric? | **CRITICAL** | Recommend layered approach: (i) theoretical coverage proof in Phase 4 Design v0.1 (per-failure-mode mechanism analysis); (ii) single-failure-mode targeted-integration-tests at v1 (e.g., `kill -9 mid-commit` integration test; `mock-disk-fail-during-snapshot` integration test; `mock-network-partition-during-push` integration test — these stay within Q5=b "integration" tier without crossing into chaos); (iii) chaos-testing deferred to v1.x maturity cycle as separate substrate work. Engineer round-1 audit may surface alternative validation-strategy. |
| F2 | Durability mechanism choice — per-repo `.git/` commits vs out-of-band snapshot store vs IsomorphicGit `fs` adapter (parent F5 PROBE) | MEDIUM | Recommend layered design — likely combination: per-repo `.git/` commits for cheap-frequent durability (process-crash recovery); out-of-band snapshot for disk-failure recovery (IsomorphicGit `fs` adapter abstraction makes this pluggable); network-partition handled via IsomorphicGit's resumable-push semantics. Phase 4 Design substrate-investigation refines. |
| F3 | API surface completeness for strict 1.0 — Phase 4 Design must enumerate ALL pluggable interface methods + ALL CLI verbs comprehensively before v1 ship | MEDIUM | Recommend Phase 4 Design v0.1 contains exhaustive API enumeration (every method signature on every pluggable interface; every CLI verb with full flag taxonomy); engineer round-1 audit verifies completeness; no escape-hatch for "we'll add this method in 1.1". |
| F4 | Single-package install footprint mitigation — Q3=a ships all 5 pluggables; consumer bundles include dead code unless tree-shake-friendly | MEDIUM | Recommend Phase 4 Design v0.1 specifies export structure as `import { Missioncraft, IsomorphicGitEngine, GitHubRemoteProvider, ... } from '@apnex/missioncraft'` (named exports; tree-shake-friendly); side-effect-free module-level code; barrel-file index.ts re-exports cleanly. Engineer round-1 verifies tree-shake test on synthetic consumer. |
| F5 | CLI verb taxonomy completeness — `init/clone/branch/commit/push/pull/merge/mission start/mission complete/citations validate` (parent §2.2.2). Are these complete for v1, OR are there missing verbs? | MEDIUM | Architect-recommendation: also need `mission abandon`, `mission status`, `remote add`, `remote list`, `remote remove`, `config get`, `config set`, `--help` per verb. Engineer round-1 audit may surface additional verbs. |
| F6 | Mission-config schema — declarative `auto-merge: true` etc. (parent §2.2.4). What's the full schema shape at v1? | MEDIUM | Recommend Phase 4 Design v0.1 specifies mission-config schema (YAML or JSON); fields: auto-merge / approval-policy / identity-override / storage-override / git-engine-override / remote-override / lock-timeout-ms / state-durability-config (mechanism + cadence). Engineer round-1 may surface additional fields. |
| F7 | Workspace path configurability — `/missions/<id>/<repo>/` (parent §2.2.3). Is the root configurable per-operator? | MEDIUM | Recommend root configurable via `BRC_WORKSPACE_ROOT` env-var OR `--workspace-root` CLI flag OR `workspace-root` mission-config field; default `~/.missioncraft/missions/<id>/<repo>/`. Engineer round-1 may surface alternative. |
| F8 | Versioning ramp pre-v1 — does v1 ship as the FIRST published release, OR does missioncraft go through `v0.x` internal pre-release before v1.0.0? | MINOR | Recommend single direct `v1.0.0` first-publish per Q2=a strict-1.0 commitment. Internal pre-releases on local dev cadence are fine but no `v0.x` published to npm. Engineer concur or surface alternative. |
| F9 | Operator install path at v1 — npm-only? OR also standalone binary distribution (e.g., via `pkg` / `nexe`)? | PROBE | No architect-recommendation; defer to Phase 4 Design surface. Lean: npm-only at v1; standalone binary deferred to v1.x or v2 if external-operator demand surfaces. |
| F10 | Test infrastructure choice — vitest (matches OIS substrate) vs jest vs node:test? | MINOR | Recommend vitest for OIS-substrate consistency. Engineer round-1 may surface preference. |
| F11 | CI/CD scope at v1 — GitHub Actions only OR platform-agnostic? | MINOR | Recommend GitHub Actions only at v1 (Q3=a-modified ratified github.com/apnex namespace; consistent with parent ratifications). Platform-agnostic CI deferred to v2 if external-operator demand surfaces. |
| F12 | License + CLA — Apache 2.0 ratified at parent Survey level. Does v1 require a Contributor License Agreement (CLA) for external contributors? | MINOR | Recommend NO CLA at v1 (lighter-weight OSS adoption posture); Apache 2.0 grant is sufficient for typical contribution flows. Engineer round-1 may surface alternative if Director-intent on commercial-licensing-future emerges. |

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
- **idea-263** — source idea
- **<related ideas / missions>**

---

— Architect: <name> / <YYYY-MM-DD> (Phase 3 Survey envelope; Director-ratified <N> picks across 2 rounds; <branch-pushed pre-bilateral round-1 audit per calibration #59 closure mechanism (a) — <N>th-canonical>)
