# M-Hypervisor-Adapter-Mitigations — Work Trace (live state)

**Mission scope.** Tracks all in-flight, queued, and recently-completed work under the M-Hypervisor-Adapter-Mitigations mission. Peer to M-Cognitive-Hypervisor. Target: close bug-11 at the adapter / cognitive layer.

**Mission brief:** `documents/missions/m-hypervisor-adapter-mitigations.md` (canonical scope + sequencing rationale + design decisions).
**Peer mission trace:** `docs/traces/m-cognitive-hypervisor-work-trace.md`.
**How to read + update this file:** see `docs/traces/trace-management.md`.

**Status legend:** ▶ in-flight · ✅ done this session · ○ queued / filed · ⏸ deferred

---

## Resumption pointer (cold-session brief)

If you're picking up cold:

1. **Read this file first, then** `documents/missions/m-hypervisor-adapter-mitigations.md` for the per-task scope + the three architect refinements absorbed on thread-235.
2. **Hub mission id:** mission-38 (with mission-37 as an apparent dup-on-creation — see the brief §7 for the drift note; architect cleanup pending).
3. **Current in-flight:** nothing claimed. task-310 `completed` at Hub (architect-reviewed). Next engineer action: await architect-issued directive for Task 2 (Parallel Dispatch + Caching) per the thread-233 / thread-235 locked sequence.
4. **Recent commits:** `git log --grep='task-310\|M-Hypervisor-Adapter-Mitigations' --oneline` for the code trail.

---

## In-flight

_(nothing claimed — task-312 (Task 1a) shipped + `in_review` at Hub. Awaiting Task 4 (Chunked Reply) directive per thread-235 locked sequence. Per bug-20 observed pattern, likely requires a nudge post-review.)_

---

## Queued / filed

- ✅ **Task 2 → task-311 (shipped; see Done-this-session).**
- ✅ **Task 1a → task-312 (shipped; see Done-this-session).**
- ○ **Task 4 (Chunked Reply Composition)** — detect when LLM-composed `create_thread_reply` args exceed safe output bounds; split across consecutive turns while preserving convergence intent. Unblocked. **Next in sequence post-task-312.**
- ○ **Task 1b (Graceful Exhaustion — Hub-side)** — new queue-item state `continuation_required`; resumption payload; adapter `[SAVE_STATE]` synthetic on critical-budget threshold. Sequenced last per thread-233 (introduces new Hub queue-item semantics).
- ○ **task-310 v2 follow-up** — per-gate-subtype auto-correction rules for Error Elision. task-310 v1 is measurement-only; auto-correct rules need per-subtype design + fault-injection tests. Not yet architect-directed; flagged in task-310 report.
- ○ **bug-20 + idea-144** — "Workflow engine: review → next-task advancement" pair. bug-20 is the observed-symptom record (reframed 2026-04-22 post joint director-engineer triage as "uncovered seam, not defect" — class was already correctly `missing-feature`; prose framing aligned; tags `feature-gap-not-defect` + `superseded-by:idea-144` added). **idea-144** is the implementation vehicle carrying Path A (adapter-side post-review handler) + Path B (Hub-side stateful sequencer) forward. Both open; joint triage pending when director schedule permits. Observable today: every multi-task mission stalls at each review→next-task handoff until manual nudge.
- ○ **Architect Cloud Run redeploy (adjacent to task-310)** — architect revision `architect-agent-00055-p8l` predates task-310's cognitive-layer + network-adapter tarballs. Rebuild + redeploy required before the `tool_rounds_exhausted` + `thread_reply_rejected_by_gate` telemetry actually fires in prod. Deploy-gap observation, not a separate bug; flagged in bug-20 "adjacent finding" section.

---

## Done this session

- ✅ **thread-233 → thread-235 → mission-38 kickoff** — idea-132 triage (thread-233, 2026-04-22 AEST early) locked the 5-task scope; mission-brief formalization (thread-235, 2026-04-22 AEST late) added three architect refinements (longitudinal `tool_rounds_exhausted` metadata, Task 2 dual-trigger cache invalidation, Task 1a dynamic budget reflection). Architect created mission-37 (stale; documentRef but no tasks) + mission-38 (live; carries task-310) within 2 minutes of each other on 2026-04-20 23:30Z; engineer proceeding against mission-38 with cleanup flagged for architect (see brief §7).
- ✅ **Mission brief — `documents/missions/m-hypervisor-adapter-mitigations.md`** — goal, scope, 5-task sequencing with architect refinements, test strategy, bug/idea/ADR linkage, duplicate-mission drift note. Authored under task-310.
- ✅ **task-312 (Task 1a — Adapter-side Budget Awareness)** — Commit `18e57e5`. Dynamic `[Thread Budget: round X/Y — converge when approaching to respect the thread-level round cap]` injection appended to the per-turn system instruction in `generateWithTools`, orthogonal to the pre-existing LLM-tool-call `[Cognitive Budget: …]` line. All three architect refinements from thread-237 absorbed: (1) round counting via `thread.roundCount + 1` (turn-about-to-commit); (2) prominent placement (system instruction, not user prompt); (3) dynamic `maxRounds` pulled fresh from `thread.maxRounds` at each sandwich invocation. `formatThreadBudget()` exported helper with conservative `""` fallback on invalid/missing inputs. `sandwich.ts` wired; `director-chat.ts` intentionally omitted (no thread convergence semantics there). 8 new tests pinning the string-shape contract. 54 vertex-cloudrun tests pass; tsc clean. Mission brief §3 Task 1a updated to reflect shipped status + refinements + director-chat omission rationale. Prereq for prod effect: architect Cloud Run redeploy (same deploy-gap as task-310 + task-311). **Architect review pending.**
- ✅ **task-311 (Task 2 — Parallel Dispatch + Caching)** — Commits `8322879` (implementation) + `bd8378b` (tarball/package-lock). Honest scope: the caching contract was already fully implemented by Phase 1 ckpt-4 (task-287) in `packages/cognitive-layer/src/middlewares/tool-result-cache.ts` — `ToolResultCache` + `FlushAllOnWriteStrategy` ship in `CognitivePipeline.standard()` with 30s default TTL and prefix-detected write-action invalidation (INV-COG-7 per-session scope). Parallel dispatch is also already tuned: sandwich.ts enables it for thread-reply (safe); director-chat keeps it false for synchronous chat (ordering matters). **task-311's value-add:** (a) first-class `cacheHit?` + `cacheFlushed?` fields on `TelemetryEvent` so hit/flush rates aggregate without tag-string parsing; (b) tightened `cacheFlushed` semantic — only true on REAL invalidation (cache non-empty AND cleared), not on every write-tool call; (c) TTL env var `HUB_ADAPTER_CACHE_TTL_MS` for operator affordance; (d) 5 new integration tests in `cache-telemetry-integration.test.ts` pinning the observable contract (cold/warm/flush/TTL/per-session-isolation); (e) mission brief §3 Task 2 rewritten to document the pre-existing scaffold + task-311 additions. 169 cognitive-layer + 46 vertex-cloudrun tests pass; tsc clean. **Architect review pending.** Blocker for effective prod measurement: architect Cloud Run redeploy (per bug-20 adjacent finding).
- ✅ **task-310 (Task 0/3 — Measurement + Error Elision v1)** — Commit `c74d069` (implementation) + `cfab717` (package-lock regen after tarball repack). Deliverables:
  - **Measurement:** `CognitiveTelemetry.emitToolRoundsExhausted()` + `tool_rounds_exhausted` event kind carrying `threadId`, `correlationId`, `finalRound`, `lastToolName`. Wired at sandwich's `MAX_TOOL_ROUNDS_SENTINEL` branch in vertex-cloudrun. Hub audit entry text also enriched with `finalRound` + `lastToolName`.
  - **Error Elision v1:** `CognitiveTelemetry.emitThreadReplyRejectedByGate()` + `thread_reply_rejected_by_gate` event kind carrying CP2 C2 structured fields (`subtype`, `remediation`, `metadata`). Sandwich's executeToolCall catch preserves `HubReturnedError.envelope`; `extractStructuredGateError()` helper parses both envelope-wrapped and already-parsed shapes. Measurement-only surface; per-subtype auto-correction deferred to a v2 follow-up.
  - **Tests:** 5 new cognitive-layer (`emitToolRoundsExhausted` + `emitThreadReplyRejectedByGate`: full shape, sparse info, metadata shallow-clone regression). 7 new vertex-cloudrun (`extractStructuredGateError`: null, unstructured, envelope-wrapped, already-unwrapped, partial shapes, invalid-JSON tolerance, non-object metadata). 164 cognitive-layer tests pass; 46 vertex-cloudrun tests pass; tsc clean across both. **Architect-reviewed ✓; task status = `in_review` (at time of writing).**

---

## Edges (dependency chains)

```
thread-233 (triage) ✅ → thread-235 (formalization) ✅ → mission-38 created → task-310 ✅ → task-311 ✅ (Task 2)
task-311 ✅ → task-312 ✅ (Task 1a)
task-312 ✅ → Task 4 (Chunked Reply) ○
Task 4 ○ → Task 1b (Graceful Exhaustion Hub-side) ○

task-310 v2 auto-correction (Error Elision v2) ○  [independent; post-v1 measurement-baseline]
```

---

## Session log (append-only)

- **2026-04-22 late (task-312 shipped; nudge→claim→execute cycle reprised)** — thread-237 opened as the second nudge per bug-20's proven pattern; architect responded in <1 min with task-312 issuance + three technical refinements (robust round counting, prominent system-instruction placement, dynamic maxRounds from thread metadata). Engineer sealed thread-237 bilaterally + claimed task-312. task-312 (Task 1a) shipped in commit `18e57e5`: `[Thread Budget: round X/Y …]` injection on per-turn system instruction; `CognitiveOptions.threadBudget` + `formatThreadBudget()` exported helper; `sandwich.ts` wired, `director-chat.ts` intentionally omitted. 8 new unit tests pinning the string-shape contract; 54 vertex-cloudrun tests pass; tsc clean. Mission brief §3 Task 1a updated. Task status `in_review`. The three architect refinements absorbed in full. Next per thread-235 sequence: Task 4 (Chunked Reply Composition) — bug-20 recurrence expected post-review; the nudge→claim→execute cycle is now the established protocol for multi-task mission advancement until idea-144's feature lands.
- **2026-04-22 late (bug-20 reframe + idea-144 filed)** — Director clarified that bug-20's "bug" framing doesn't fit — it's an uncovered seam in the workflow engine, not a defect. The Hub supports one-shot task issuance at thread-convergence time (that path works); the "continuous mission-sequence advancement via review signals" path was never built. The architect's code behaves correctly for what was asked of it. Actions taken (options 2 + 3 per director direction): (a) updated bug-20 description with a reframe preamble keeping the original prose preserved for forensic continuity; added `feature-gap-not-defect` + `superseded-by:idea-144` + `workflow-engine-review-advancement` tags. (b) Filed **idea-144** ("Workflow engine: review → next-task advancement") as the implementation vehicle carrying Path A (adapter-side post-review advancement handler) + Path B (Hub-side stateful mission sequencer). Joint director-engineer triage pending when director schedule permits. bug-20 stays open until idea-144 lands.
- **2026-04-22 late (bug-20 second observation — silent audit, no fix)** — Director flagged lack of SSE push post task-311 review; silent audit captured the cause WITHOUT nudging or triaging. **Timeline (UTC):** Hub `review_decision` task-311 approved at 02:58:58Z; architect `auto_review` wrote audit at 02:59:09Z; now 03:39:26Z → 40 min of silence and counting, zero architect audit entries post-review. **Not an SSE failure:** architect's event loop ran (review handler fired + audit written); my drain queue is empty (not stuck); no `comms_redispatch` for me; no `queue_item_escalated` in the window; both architect inbound (report→review) and outbound (earlier `task_issued` / `auto_thread_reply`) demonstrably worked today. The SSE push can't happen because NO architect-side code path emits anything post-review — `auto_review` runs, writes audit, returns to idle. This is **bug-20 recurring, second observation**. First stall (post-task-310 review) was 35 min before thread-236 nudge triggered advancement; current stall is already 40+ min. Consistent timing confirms the "no trigger to advance" structural theory over any retry-timing hypothesis. **Additional finding:** bug-20's architect ACK on thread-236 ("I'll keep this on the triage list") left no audit artifact — no `bug_status_changed`, no `idea_triaged`, nothing. Bug-20 stays `open` at Hub; the ACK was prose-only. That in itself is a symptom of bug-20 (post-conversation follow-through doesn't advance state). Updated bug-20 tags with `observed-twice` + `recurrence-confirmed` to mark the pattern is no longer theoretical. No nudge thread opened this round per director direction — evidence captured, no fix attempt.
- **2026-04-22 mid (task-311 shipped)** — **Task 2 landed with observability additions; directive materially pre-satisfied by Phase 1 ckpt-4.** On claim, scope exploration found `ToolResultCache` + `FlushAllOnWriteStrategy` already shipping in `CognitivePipeline.standard()` with 30s TTL + prefix-detected write invalidation + per-session scope (INV-COG-7), and parallel dispatch already correctly split between sandwich (true) / director-chat (false). task-311's actual deliverables: promoted `cacheHit` + `cacheFlushed` to first-class `TelemetryEvent` fields; tightened `cacheFlushed` to fire only on REAL flushes (not every write-tool call); wired `HUB_ADAPTER_CACHE_TTL_MS` env var for TTL tunability; added 5 integration tests in `cache-telemetry-integration.test.ts` pinning the observable contract. Mission brief §3 Task 2 rewritten to document the pre-existing scaffold + task-311 additions so future engineers don't duplicate the work. Committed `8322879` + `bd8378b`; 169 cognitive-layer + 46 vertex-cloudrun tests pass; report filed with honest scope-framing. Task status `in_review`.
- **2026-04-22 mid (task-311 claimed)** — **thread-236 nudge landed; architect issued task-311 (Task 2).** Architect reply on thread-236 acknowledged bug-20 (agreed on structural fix, kept on triage for a future mission), confirmed architect Cloud Run redeploy is director-coordinated alongside Task 2, and consolidated mission-38 as the canonical vehicle (documentRef attached post-facto; mission-37 implicitly stale). Engineer sealed thread-236 bilaterally and claimed task-311 (Task 2 Parallel Dispatch + Caching; `working`). Implementation scope unchanged from the thread-235 lock: dual-trigger cache invalidation + parallel dispatch where safe.
- **2026-04-22 mid (post-review stall investigation)** — **bug-20 filed; thread-236 passive check-in opened.** Director flagged that ~33 min had passed since task-310 `auto_review` (23:47:07Z) with no task-311 issuance. Audit-log investigation found: architect online + reachable (sessionEpoch 110; lastSeenAt heartbeats current); review handler ran cleanly; no `auto_thread_reply_failed` or cascade escalations since the review. **Root cause is structural, not cognitive:** the architect's event loop has no handler that advances to the next ratified-but-unissued task in a mission's sequence after reviewing a prior task. Filed **bug-20** (major severity, class=missing-feature, tags=mission-38/architect-loop/orchestration-gap) with two proposed fix paths. **Adjacent finding captured in bug-20 body (not a separate bug):** the architect Cloud Run image (`architect-agent-00055-p8l`) predates task-310's tarballs, so the new bug-11 measurement telemetry isn't firing in prod yet — rebuild + redeploy required. Opened thread-236 (unicast, inform, correlationId=mission-38) as a minimal-signal nudge so the architect's event loop re-enters.
- **2026-04-22 mid (continuation)** — **mission-38 formalized; task-310 shipped.** Thread-235 opened to architect (unicast, seek_approval, correlationId=idea-132) citing cleared gates (CP3 ✅ `8c14b65`, shim-cleanup ✅ `644c6e2`) and the thread-233 5-task scope. Architect ratified + created mission-37 at 23:30:16Z and mission-38 at 23:32:17Z (duplicate; mission-38 carries task-310 while mission-37 carries the documentRef). Engineer converged thread-235 first-party with close_no_action, flagging the dup for architect cleanup. Task-310 implementation shipped in commits `c74d069` + `cfab717`: adapter-side `tool_rounds_exhausted` telemetry + `thread_reply_rejected_by_gate` telemetry (Error Elision v1 measurement-only). 164 + 46 tests pass. Mission brief authored at `documents/missions/m-hypervisor-adapter-mitigations.md` per architect's task-310 directive.

---

## Canonical references

- Mission brief: `documents/missions/m-hypervisor-adapter-mitigations.md`
- Bug: bug-11 (the parent bug this mission targets; critical)
- Originating idea: idea-132 (status `triaged` at Hub; architect to flip → `incorporated` + link missionId=mission-38)
- Architect brainstorm threads: thread-233 (triage), thread-235 (formalization)
- Peer mission: M-Cognitive-Hypervisor (`docs/traces/m-cognitive-hypervisor-work-trace.md`)
- Downstream Hub prerequisite (consumed by Task 0/3 Error Elision): CP2 C2 `ThreadConvergenceGateError` structured format in `docs/audits/phase-2d-cp2-report.md` §3.
