# M-Workflow-Test-Harness — Work Trace (live state)

**Mission scope.** Tracks all in-flight, queued, and recently-completed work under mission-41 (M-Workflow-Test-Harness). Goal: close the workflow-registry §7.2 test-coverage gap — bring ≥10 of 28 `Tested By: NONE` invariants under automated coverage so spec↔runtime divergence becomes mechanically detectable. Pool-foundational; downstream Phase 4 winners (#3/#5/#6) consume this harness.

**Mission brief:** `docs/reviews/2026-04-phase-4-briefs/m-workflow-test-harness.md` (on agent/lily; read via `git show agent/lily:<path>`).
**Kickoff decisions (ratified 2026-04-23):** `docs/missions/mission-41-kickoff-decisions.md` (agent/lily).
**Preflight (GREEN):** `docs/missions/mission-41-preflight.md` (agent/lily).
**Activation thread:** thread-255 (converged 2026-04-23 AEST, 6 actions cascade-executed).
**How to read + update this file:** `docs/traces/trace-management.md`.

**Status legend:** ▶ in-flight · ✅ done this session · ○ queued / filed · ⏸ deferred

---

## Resumption pointer (cold-session brief)

If you're picking up cold:

1. **Read this file first**, then the brief (`git show agent/lily:docs/reviews/2026-04-phase-4-briefs/m-workflow-test-harness.md`) and kickoff decisions (`git show agent/lily:docs/missions/mission-41-kickoff-decisions.md`). Briefs + kickoff live on agent/lily — do not merge; read via `git show`.
2. **Hub mission id:** mission-41 (status=active, correlationId="mission-41").
3. **Current in-flight:** nothing claimed. task-327 (T4) shipped `294d599` — `MockOpenCodeClient` module + 4-test smoke suite + README under `adapters/opencode-plugin/test/mocks/`. opencode-plugin 32/32 (was 28; +4); claude-plugin 71/71 regression-clean; hub 649/649 regression-clean; tsc clean. Filed `in_review` 2026-04-23 AEST mid. Wave 1: 4/5 complete. Next engineer action: claim task-328 (T5 — coverage-report tooling + CI merge-gate, LAST Wave 1 task) after architect opens T4-approval mini-thread (expected as thread-259).
4. **Ratified scope inputs (do NOT re-litigate):**
   - Wave 2 invariant subset (10 exactly): INV-TH18, INV-TH19, INV-T4, INV-P1, INV-P2, INV-P4, INV-TH6, INV-TH7, INV-I2, INV-M4
   - Wave 1 adapter scope: shim-side IN (absorbs idea-104 partial)
   - vertex-cloudrun: OUT
5. **Anti-goals (hold firm):** no touch on missions 42/43/44; no cross-mission coupling; no brief-scope re-litigation; tool-surface scope belongs in idea-121, not this mission.
6. **Deploy gate:** Wave 1 = Hub-test-infra only; no Hub redeploy, no architect Cloud Run redeploy required. Re-flag at Wave 3 if coverage-report tool grows a Hub-side audit-entry type.

---

## In-flight

_(nothing claimed — task-327 shipped; awaiting architect review via thread-259 mini-thread cadence (expected). T5 is the LAST Wave 1 task.)_

---

## Queued / filed

- ▶ **task-328 (T5 — Coverage-report tooling + CI merge-gate)** — NEXT-UP. LAST Wave 1 task. Scan `assertInv*` call-sites → emit `docs/audits/workflow-test-coverage.md`; vitest → GitHub Actions gate; deliberate-fail PR verification. With T2/T3/T4 shipped, the scanner has real call-sites to scan across both adapters. Awaiting architect task-327 review before claim.
- ○ **Wave 2 task filings** — DEFERRED until full Wave 1 merges. 8 entity-invariant tests already claim-eligible (T2 shipped); 2 workflow tests (TH18/TH19) now unblocked too (T3+T4 shipped). Wave 2 tasks will be filed as a separate round post-T5.
- ○ **Wave 3 scope** — `workflow-registry.md §7 Tested By` column updates + remaining-gap follow-up-idea filings. Post-Wave-2.

---

## Done this session

- ✅ **thread-255 convergence (mission-41 activation scaffolding)** — architect briefed activation 2026-04-23 01:36:23Z; engineer replied 2026-04-23 01:41:28Z with 5-task Wave 1 decomposition + 5 `create_task` staged actions + non-empty summary; bilateral convergence at 2026-04-23 01:48:26Z; cascade committed 6 actions (executed=6, failed=0) spawning tasks 324-328. Thread closed.
- ✅ **Task filings — tasks 324 → 328 cascade-spawned under mission-41 correlationId** — 5 tasks with engineer-authored dependency ordering: T1 (bug-12 + parity) → T2 (FSM-invariant helpers) → {T3 MockClaude | T4 MockOpenCode parallel} → T5 (coverage-report + CI gate). All 5 carry sourceThreadId=thread-255 + sourceActionId=action-1..5 for back-link provenance.
- ✅ **task-324 (T1 — PolicyLoopbackHub parity audit + bug-12 fix)** — shipped as verify + audit + status-flip closure. Report filed `reports/task-324-v1-report.md`; architect review APPROVED at `reviews/task-324-v1-review.md`; task `completed` at 2026-04-23 AEST mid. **Discovery:** bug-12 was already code-fixed in commit `635a58e [bug-12] Wire ADR-017 stores into PolicyLoopbackHub` (pre-mission-41, pre-worktree). Verified fix is live: `threads-2-smoke.test.ts` 11/11 PASS in 890ms. **Parity audit verdict: CLEAN.** PolicyLoopbackHub vs TestOrchestrator at full structural parity on all three surfaces — 12 `AllStores` entries ✓, 13 policy registrations ✓, 9 `IPolicyContext` fields ✓. Two semantic differences in `dispatch`/`emit` noted but by design (TestOrchestrator does ADR-014 engineer→role resolution for assertion ergonomics; PolicyLoopbackHub broadcasts to LoopbackTransport sessions for L7 E2E tests). No drifts to file as new bugs. **Hub state hygiene:** bug-12 flipped `open → resolved` with `fixCommits=["635a58e"]`, `linkedTaskIds=["task-324"]`, `linkedMissionId="mission-41"`. **Architect assessment:** load-bearing parity finding for Wave 2 — named semantic differences prevent downstream spurious bug filings.
- ✅ **task-325 (T2 — Hub testbed FSM-invariant assertion helpers)** — shipped commit `b0208d3`. New module `hub/test/e2e/invariant-helpers.ts` exports 10 `assertInv*` helpers (T4, P1, P2, P4, TH6, TH7, I2, M4, TH18-stub, TH19-stub); 10-test self-validation suite in `hub/test/e2e/invariant-helpers.test.ts`. Helper names match INV-id exactly for T5 coverage-report auto-mapping. Each helper takes `(TestOrchestrator, mode?)` with `InvariantMode = "all" | "positive" | "negativeReject" | "edge"`. **INV-P2 negativeReject intentionally gap-surfacing** — throws until proposal-policy adds the status-guard (per kickoff-decisions §Decision 1 spec-correct behavior; ratchet for Wave 2). **TH18/TH19 stubbed** via `InvariantNotYetTestable` pending T3+T4 mock-harness; Wave 2 graduates. **Verification:** full hub suite 649/649 pass (was 639; +10 new; 5 skipped unchanged); tsc clean. **Exit criteria all met.** Report `reports/task-325-v1-report.md`; architect review at `reviews/task-325-v1-review.md`; task `completed`. **Findings documented inline** (not filed as bugs): proposal-policy actor roles (engineer submits, architect reviews), proposal ID prefix is `prop-N` (not `proposal-N`), mission create returns `missionId` field. All discoveries are docs-clarifications, not drift.
- ✅ **task-326 (T3 — MockClaudeClient scaffold)** — shipped commit `590e969`. New module `adapters/claude-plugin/test/mocks/MockClaudeClient.ts` (~275 LOC) + 4-test smoke suite + 1-page README. `createMockClaudeClient()` factory builds PolicyLoopbackHub + architect `McpAgentClient` + engineer `McpAgentClient` + real `createDispatcher` + MCP `InMemoryTransport` pair simulating Claude Code. All substitutions are transport-layer only; dispatcher + shim + network-adapter are real production code. Exports: `ActorHandle`/`EngineerActorHandle` types; `mock.claude.callTool` sugar; `mock.waitFor(cond, timeoutMs?)` 5ms-cadence poller; `mock.playTape(steps)` declarative runner with `${capture.path}` string interpolation + step kinds `architect`/`claude`/`waitFor`/`assert`; `mock.stop()` idempotent teardown. **Verification:** claude-plugin suite 71/71 pass (was 67; +4 new); hub suite 649/649 regression-clean; tsc clean. **Exit criteria all met.** Report `reports/task-326-v1-report.md`; architect review at `reviews/task-326-v1-review.md`; task `completed`. **Finding (docs-drift):** brief references `adapters/claude-plugin/src/proxy.ts` but actual file is `shim.ts` + `dispatcher.ts`; mock drives dispatcher (the testable core). Not filed as bug — noted for mission closing audit.
- ✅ **task-327 (T4 — MockOpenCodeClient scaffold)** — shipped commit `294d599`. New module `adapters/opencode-plugin/test/mocks/MockOpenCodeClient.ts` (~290 LOC) + 4-test smoke suite + 1-page README. Mirror of T3 for the opencode backend. `createMockOpenCodeClient()` factory wires PolicyLoopbackHub + architect + engineer-with-dispatcher using opencode-specific patterns: `dispatcher.createMcpServer()` factory (vs claude's `.server` property), late-binding `getAgent()` callback (vs forward-reference), `queueMapCallbacks` composition (matches production shim.ts subset; OpenCode-runtime toast/prompt callbacks intentionally excluded as runtime-dependent). **Tape spec aligned with T3** — same step vocabulary (`architect`/`waitFor`/`assert`) + same `${capture.path}` interpolation; host step is `opencode` (mirrors T3's `claude`). **Tape runner per-backend** (~80 LOC duplicated) — judged scope-preserving vs extracting shared helper to `packages/network-adapter/test/helpers/mock-tape.ts` (would require touching T3 ship). Future consolidation candidate; documented in both READMEs. **Verification:** opencode-plugin suite 32/32 pass (was 28; +4 new); claude-plugin 71/71 regression-clean; hub 649/649 regression-clean; tsc clean. **Finding (docs-drift, same class as T3):** brief references `adapters/opencode-plugin/hub-notifications.ts` but actual files are `shim.ts` + `dispatcher.ts`; mock drives dispatcher. Not filed as bug — noted for closing audit. **Onboarding note:** opencode-plugin node_modules was empty in this worktree; `npm install` (150 packages) was required once. Not bug-worthy; worktree-setup concern. Report filed `reports/task-327-v1-report.md`; task status → `in_review`. **Architect review pending** via thread-259 mini-thread cadence (expected). **Wave 1: 4 of 5 tasks shipped. T5 is the last.**

---

## Edges (dependency chains)

```
thread-255 (activation scaffolding) ✅ → mission-41 tasks 324-328 cascade-created
task-324 ✅ (T1 completed) → thread-256 ✅ (T1 approval + T2 green-light)
task-325 ✅ (T2 completed; Wave 2 unblocked) → thread-257 ✅ (T2 approval + T3/T4 parallel-ready)
task-326 ✅ (T3 completed; MockClaudeClient shipped 590e969) → thread-258 ✅ (T3 approval + T4 green-light)
task-327 ✅ (T4 in_review; MockOpenCodeClient shipped 294d599) → task-328 ▶ (T5: coverage + CI gate — LAST Wave 1 task)

Wave 2 fully unblocked now (T2+T3+T4 shipped):
  - 8 entity-invariant tests: claim-eligible via assertInv{T4/P1/P2/P4/TH6/TH7/I2/M4}
  - 2 workflow-invariant tests: claim-eligible via Mock*Client harness — INV-TH18/TH19
    helper graduation PR (remove InvariantNotYetTestable stub) lives in Wave 2 scope
T5 ○ → Wave 3 coverage-report fold + §7 spec-column updates (post-Wave-2)
```

---

## Session log (append-only)

- **2026-04-23 mid** — Mission-41 activated. Architect (eng-40903c59d19f) briefed scaffolding kickoff on thread-255 at 2026-04-23 01:36:23Z with pointers to brief + kickoff + preflight + methodology (all on agent/lily; read via `git show` — no merge per worktree-isolation discipline). Loaded all four docs; confirmed `get_mission(mission-41)` → status=active. Replied to thread with 5-task Wave 1 decomposition (T1 bug-12+parity → T2 assertion helpers → T3/T4 parallel mock clients → T5 coverage+CI) + 5 staged `create_task` actions + summary; converged=true. Architect converged back at 01:48:26Z; cascade executed 6 actions spawning tasks 324-328. Claimed T1 via `get_task` (task-324 pending → working). Bug-12 scope (RCA verified via `get_bug`): ~10 LOC wiring two ADR-017 stores into `packages/network-adapter/test/helpers/policy-loopback.ts`. All 3 ratified kickoff decisions held as non-negotiable inputs — not re-litigated. Trace file filed per user instruction (durable trace-maintenance obligation acknowledged).
- **2026-04-23 mid (continuation)** — task-324 executed and shipped as verify + audit + status-flip closure rather than a code-change task. **Discovery:** the bug-12 fix was already landed in commit `635a58e [bug-12] Wire ADR-017 stores into PolicyLoopbackHub` (pre-mission-41, pre-agent/greg worktree head). Ran `vitest` against `threads-2-smoke.test.ts` → 11/11 PASS in 890ms; verified fix live. Executed the parity audit: PolicyLoopbackHub vs TestOrchestrator at full structural parity on `AllStores` (12/12), policy registrations (13/13), and `IPolicyContext` fields (9/9). Two semantic differences in `dispatch`/`emit` noted but documented as by-design distinct test affordances (TestOrchestrator engineer→role resolution for ADR-014 assertion ergonomics; PolicyLoopbackHub broadcasts to LoopbackTransport sessions). No new bugs filed. Hub state hygiene: bug-12 flipped `open → resolved` with `fixCommits=["635a58e"]`, `linkedTaskIds=["task-324"]`, `linkedMissionId="mission-41"`. Task report filed (`reports/task-324-v1-report.md`); task status pending → working → in_review. Architect review pending. T2 becomes next-up (no structural blocker; parity clean).
- **2026-04-23 mid (T1→T2 approval + T2 scaffold + ship)** — architect approved task-324 (review at `reviews/task-324-v1-review.md`) and opened thread-256 "Mission-41 T1 approved → T2 ready" as the T2 green-light + approval-cadence channel. Architect noted that tasks were filed with `dependsOn: []`, so Hub DAG cascade won't auto-flip downstream — he'll keep mini-thread-per-completion cadence for the remaining T3/T4/T5 approvals (workflow gap acknowledged by Director; idea-108 Hub-as-Conductor territory for a future mission). Claimed task-325 via `get_task`; implemented 10 `assertInv*` helpers in new module `hub/test/e2e/invariant-helpers.ts` (sibling to orchestrator.ts — cleaner than inline extension; keeps orchestrator.ts focused on the facade). Each helper supports `InvariantMode = "all" | "positive" | "negativeReject" | "edge"`. INV-P2 negativeReject is intentionally gap-surfacing (ratchet per kickoff-decisions §Decision 1). TH18/TH19 stubbed via `InvariantNotYetTestable` throw pending T3+T4 mock-harness; Wave 2 graduates them. Three inline discoveries during implementation (documented in task report, not filed as bugs): create_proposal is Engineer-only, proposal ID prefix is `prop-N`, create_mission returns `missionId` field. 10-test self-validation suite in `invariant-helpers.test.ts` — all 10 pass. Full hub suite: 649/649 pass (was 639; +10 new; 5 skipped unchanged); tsc clean. Committed as `b0208d3 [mission-41] T2 — FSM-invariant assertion helpers (hub/test/e2e)`. Task report filed at `reports/task-325-v1-report.md`; task flipped pending → working → in_review. **Wave 2 partial-start (8 entity-invariant tests) UNBLOCKED.** Closed thread-256 with `close_no_action` (bilateral convergence — 2 actions executed).
- **2026-04-23 mid (T2 approval + T3 ship)** — architect approved task-325 (review at `reviews/task-325-v1-review.md`) and opened thread-257 "Mission-41 T2 approved → T3 + T4 parallel-ready". Elected serial T3 → T4 over parallel execution (rationale: T4 mirrors T3 so pattern-first cheaper; single-task focus keeps report quality). Claimed task-326 via `get_task`. **Discovery:** `shim.e2e.test.ts` already had the harness pattern as internal helpers `createArchitect` + `createEngineerWithShim` — T3's value-add is public-API extraction + `playTape` abstraction. **Second discovery (docs-drift):** brief references `adapters/claude-plugin/src/proxy.ts` but actual files are `shim.ts` (platform wiring) + `dispatcher.ts` (testable core); mock drives dispatcher. Noted for closing audit; not a bug. Implemented `adapters/claude-plugin/test/mocks/MockClaudeClient.ts` (~275 LOC) — factory `createMockClaudeClient()` wires `PolicyLoopbackHub` + architect + engineer-with-dispatcher + MCP `InMemoryTransport` simulating Claude Code. Exports direct actor handles (`mock.architect`, `mock.engineer`, `mock.claude.callTool`) plus declarative `playTape(steps)` with 4 step kinds + `${capture.path}` interpolation. 4 smoke tests in `MockClaudeClient.test.ts` cover: 3-actor wiring, round-trip via direct API, round-trip via tape API with capture interpolation, `stop()` idempotency. Claude-plugin suite: 71/71 (was 67; +4); hub: 649/649 regression-clean; tsc clean. 1-page README documents architecture, when-to-use, tape API, Wave 2 relationship, relationship to `shim.e2e.test.ts`. Committed as `590e969 [mission-41] T3 — MockClaudeClient scaffold (adapters/claude-plugin)`. Task report filed at `reports/task-326-v1-report.md`; task flipped pending → working → in_review. Closed thread-257 with `close_no_action` (bilateral convergence — 2 actions executed). T4 next-up; T5 also unblocked anytime.
- **2026-04-23 mid (T3 approval + T4 ship)** — architect approved task-326 (review at `reviews/task-326-v1-review.md`) and opened thread-258 "Mission-41 T3 approved → T4 ready". Architect flagged parallel mission-42 bug-23 ADR work as informational-only; cross-mission anti-goal held (no touch on 42/43/44). Claimed task-327 via `get_task`. Onboarding discovery: opencode-plugin `node_modules` was empty in this worktree; `npm install` (150 packages) needed once. Not a bug. Mirrored T3's pattern for opencode backend at `adapters/opencode-plugin/test/mocks/MockOpenCodeClient.ts` (~290 LOC) with opencode-specific wiring: `dispatcher.createMcpServer()` factory (vs claude's `.server` property), late-binding `getAgent()` callback, `queueMapCallbacks` composition (matches production shim.ts subset; OpenCode-runtime toast/prompt callbacks intentionally excluded as runtime-dependent). Tape vocabulary intentionally aligned with T3 (architect/waitFor/assert + `${capture.path}`) — host step is `opencode` (vs T3's `claude`). Tape runner duplicated ~80 LOC per-backend rather than extracted to shared helper — judged scope-preserving to keep T3 untouched. Future consolidation candidate; documented in both READMEs. **Docs-drift (same class as T3):** brief references `hub-notifications.ts`; actual is `shim.ts` + `dispatcher.ts`. Not filed as bug — closing-audit note. 4 smoke tests in `MockOpenCodeClient.test.ts` (wiring + direct-API round-trip + tape round-trip + stop idempotency). opencode-plugin: 32/32 (was 28; +4); claude-plugin + hub regression-clean; tsc clean. Committed as `294d599 [mission-41] T4 — MockOpenCodeClient scaffold (adapters/opencode-plugin)`. Task report at `reports/task-327-v1-report.md`; status → in_review. Closed thread-258 with `close_no_action` (bilateral convergence — 2 actions executed). **Wave 1: 4 of 5 tasks shipped.** T5 is the LAST Wave 1 task; Wave 2 now fully unblocked (both entity- and workflow-invariant tests have their harnesses).

---

## Canonical references

- **Brief** — `docs/reviews/2026-04-phase-4-briefs/m-workflow-test-harness.md` on agent/lily (`6625c24` architect draft, `732b6b5` engineer fold, `4ff0f6b` engineer-side on agent/greg's parallel path).
- **Kickoff decisions (ratified 2026-04-23)** — `docs/missions/mission-41-kickoff-decisions.md` on agent/lily (`e359b2d`).
- **Preflight GREEN** — `docs/missions/mission-41-preflight.md` on agent/lily (`e359b2d`).
- **Preflight methodology v1.0** — `docs/methodology/mission-preflight.md` on agent/lily (`136e8bc`).
- **Parent spec** — `docs/specs/workflow-registry.md` §7.2 (28 NONE invariants) + §7.3 (immediate-coverage recommendation).
- **Activation thread** — thread-255 (correlationId=mission-41; closed 2026-04-23 01:48:26Z; 6 actions executed).
- **T1 approval / T2 green-light thread** — thread-256 (closed bilateral, 2 actions executed).
- **T2 approval / T3+T4 green-light thread** — thread-257 (closed bilateral, 2 actions executed).
- **T3 approval / T4 green-light thread** — thread-258 (closed bilateral, 2 actions executed).
- **T4 approval / T5 green-light thread** — thread-259 (open as of this entry).
- **Architect review of T1** — `reviews/task-324-v1-review.md`.
- **Architect review of T2** — `reviews/task-325-v1-review.md`.
- **Architect review of T3** — `reviews/task-326-v1-review.md`.
- **T2 ship commit** — `b0208d3 [mission-41] T2 — FSM-invariant assertion helpers (hub/test/e2e)`.
- **T3 ship commit** — `590e969 [mission-41] T3 — MockClaudeClient scaffold (adapters/claude-plugin)`.
- **T4 ship commit** — `294d599 [mission-41] T4 — MockOpenCodeClient scaffold (adapters/opencode-plugin)`.
- **T4 engineer report** — `reports/task-327-v1-report.md` (architect review via thread-259).
- **Bug closed-by T1** — bug-12 (`packages/network-adapter/test/helpers/policy-loopback.ts` ADR-017 store drift).
- **Idea partially-absorbed** — idea-104 (Mock Harness; shim-side portion folded into Wave 1 per kickoff-decision #2).
- **Trace management guide** — `docs/traces/trace-management.md`.
- **Peer traces** — `docs/traces/m-cognitive-hypervisor-work-trace.md`, `docs/traces/m-hypervisor-adapter-mitigations-work-trace.md`.
