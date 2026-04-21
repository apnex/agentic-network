# Mission M-Hypervisor-Adapter-Mitigations — Closing Report

**Hub mission id:** mission-38 (with mission-37 as an apparent duplicate-on-creation at formalization time; see §7 finding).
**Mission brief:** `documents/missions/m-hypervisor-adapter-mitigations.md` (canonical scope + sequencing rationale).
**Live state trace:** `docs/traces/m-hypervisor-adapter-mitigations-work-trace.md`.
**Dates:** Proposed via idea-132 on 2026-04-20; triaged bilaterally on thread-233; formalized on thread-235; task execution 2026-04-20 → 2026-04-21; final redeploy + closing report 2026-04-21.
**Scope:** 5-task adapter-side bug-11 mitigation suite (Error Elision, Cache Observability, Budget Awareness, Chunked Reply Composition, Graceful Exhaustion).

---

## 1. Deliverable scorecard

| Deliverable | Source directive | Status | Evidence |
|---|---|---|---|
| Task 0/3 — Measurement + Error Elision v1 | task-310 | ✅ Complete | Commits `c74d069` + `cfab717` · 5 new cognitive-layer tests + 7 new vertex-cloudrun tests · Architect-reviewed |
| Task 2 — Parallel Dispatch + Caching (observability) | task-311 | ✅ Complete | Commits `8322879` + `bd8378b` · 5 new integration tests · Architect-reviewed · Honest scope framing: scaffold was pre-existing from Phase 1 ckpt-4 |
| Task 1a — Adapter-side Budget Awareness | task-312 | ✅ Complete | Commit `18e57e5` · 8 new vertex-cloudrun tests · Architect-reviewed |
| Task 4 — Chunked Reply Composition | task-313 | ✅ Complete | Commits `d8c8279` + `1488eed` · 8 new chunk-reply tests + 3 new emitter tests · Architect-reviewed |
| Task 1b — Graceful Exhaustion (Hub-side) | task-314 | ✅ Complete | Commit `17ede9c` · 6 new hub-side FSM tests · Architect review pending |
| Final architect + hub redeploy | Director-approved | ✅ Complete | hub `hub-00037-h9t` → `hub-00040-5wn` (auto-rollforward after my `hub-00039-57v`); architect `architect-agent-00056-m6c` → `architect-agent-00058-4nn`. Both 100% traffic as of 2026-04-21 ~07:05Z |
| Mission brief | Architect-requested on thread-235 | ✅ Complete | `documents/missions/m-hypervisor-adapter-mitigations.md` · Updated per-task as tasks landed; §7 drift note captured the mission-37/38 duplication artifact |
| Closing audit report (this document) | Engineer-owned | ✅ Complete | This file |

All 5 ratified tasks shipped + deployed. Two additional Hub entities filed capturing v1 limitations (bug-20, bug-21) + two ideas capturing v2 feature gaps (idea-144, idea-145) — joint architect-director triage pending.

---

## 2. Mission goal + success framing

**Parent bug-11** (critical severity): "cognitive-layer silence class" — the `auto_thread_reply_failed` class fired 10× during M-Ideas-Audit (2026-04-19 retrospective). bug-10's fix was transport-only (ADR-017 persist-first queue); bug-11 is the sibling cognitive-layer class where the LLM exhausts its tool-call round budget without converging.

**Mission-38 goal:** reduce bug-11 frequency via the 7 mitigations enumerated in bug-11's body (grouped into 5 tasks after the thread-233 triage refinement, + one deferred to Phase E for pre-hydration). Success is **rate-reduction, not elimination** — LLM cognitive exhaustion is a behavioral problem with no silver bullet.

**Verdict mechanism:** telemetry-driven, gated on a 24–48h observation window post-deploy. Compare `tool_rounds_exhausted` / `thread_reply_rejected_by_gate` / `thread_reply_chunked` / `llm_output_truncated` event rates against pre-mitigation baseline.

**Observation window start:** 2026-04-21 07:05Z (final redeploy landed).

---

## 3. Per-task architecture recap

Full detail in each task's Hub report + commit messages. Summarized here for the mission-close reader.

### 3.1 task-310 — Measurement + Error Elision v1

Two deliverables combined because measurement is a prerequisite for quantifying every other mitigation:

- **`tool_rounds_exhausted` telemetry event** with `threadId`, `correlationId`, `finalRound`, `lastToolName`. Fires in sandwich.ts at the `MAX_TOOL_ROUNDS_SENTINEL` branch alongside the existing Hub audit.
- **`thread_reply_rejected_by_gate` telemetry event** with the CP2 C2 structured error fields (subtype, remediation, metadata). Parses the envelope-wrapped HubReturnedError via `extractStructuredGateError` helper in sandwich.ts. v1 is measurement-only; per-subtype auto-correction is a documented v2 follow-up.

### 3.2 task-311 — Parallel Dispatch + Caching (observability)

Honest scope framing: the caching contract was already fully implemented in Phase 1 ckpt-4 (task-287) — `ToolResultCache` ships in `CognitivePipeline.standard()` at position 4 with 30s default TTL and `FlushAllOnWriteStrategy` (prefix-detected write-action invalidation) per-session (INV-COG-7). Parallel dispatch was also already correctly split (sandwich=true, director-chat=false).

task-311's actual value-add:
- First-class `cacheHit` + `cacheFlushed` fields on `TelemetryEvent` (promoted from `tags`).
- Tightened `cacheFlushed` semantic — only fires on REAL flushes, not every write-tool call.
- `HUB_ADAPTER_CACHE_TTL_MS` env var for operator affordance.
- 5 new integration tests pinning the observable contract.
- Mission brief §3 Task 2 rewritten to document pre-existing scaffold + task-311 additions (future-proofs against duplicate work).

### 3.3 task-312 — Adapter-side Budget Awareness

Per-turn dynamic `[Thread Budget: round X/Y — converge when approaching to respect the thread-level round cap]` injection on the system instruction, orthogonal to the pre-existing `[Cognitive Budget: round N/M]` LLM-tool-round injection. Both measure different budgets with different timeouts:

- Cognitive Budget: LLM-tool-call iteration cap within ONE `generateWithTools` invocation.
- Thread Budget (new): committed thread-reply cap (`thread.roundCount` / `thread.maxRounds`) tracked by the Hub — the convergence pressure the architect must respect or the thread auto-abandons via the reaper.

Architect refinements absorbed: numerator = `currentRound + 1` (turn about to commit); prominent system-instruction placement; `maxRounds` pulled fresh from thread metadata per invocation (not cached).

`formatThreadBudget()` exported helper with conservative `""` fallback on invalid inputs. `director-chat.ts` intentionally NOT wired — no thread convergence semantics there.

### 3.4 task-313 — Chunked Reply Composition

Oversized `create_thread_reply.message` values (> `ARCHITECT_MAX_REPLY_CHUNK_SIZE`, default 100,000 chars) split into chunks and delivered across consecutive architect turns. Architect refinements absorbed:

- **State management:** module-level `pendingChunksByThread` Map in sandwich.ts with 30-min TTL. Pre-invoke drain at `attemptThreadReply` top; final chunk restores original `converged`/`stagedActions`/`summary`.
- **LLM truncation detection:** sandwich's `onUsage` callback checks `u.finishReason === "MAX_TOKENS"` → emits `llm_output_truncated` — distinct from `tool_rounds_exhausted` (single-turn output cut vs loop exhaustion).
- **Telemetry:** `thread_reply_chunked` event carries threadId, correlationId, totalChunks, totalSize, chunkRound.

Two v1 limitations captured as Hub entities:
- **bug-21** — raw-slice splits on arbitrary UTF-16 code units (surrogate-pair corruption possible). Minor severity; `superseded-by:idea-145` tag.
- **idea-145** — bundled v2: semantic-boundary splitting + Hub-persisted chunk continuation (scope overlap with task-314) + chunk-delivery throughput decoupling.

### 3.5 task-314 — Graceful Exhaustion (Hub-side + adapter)

First Hub-side change in the mission. Architect refinements absorbed on thread-239:

**Hub-side:**
- `PendingActionItem` schema extension: `continuationState?: Record<string, unknown>` + `continuationSavedAt?: string | null` + new `continuation_required` state enum value.
- `IPendingActionStore.saveContinuation` / `listContinuationItems` / `resumeContinuation` on Memory + GCS with auth + FSM guards.
- New `[Any]` MCP tool `save_continuation(queueItemId, payload)` in pending-action-policy.ts.
- `runContinuationSweepTick` at 15s interval (env-configurable) in index.ts — re-dispatches `continuation_required` items with snapshot embedded.

**Adapter-side:**
- `SAVE_STATE_MARKER` detection after `generateWithTools` returns. On detection: calls `save_continuation` with `{kind: "llm_state", snapshot (truncated 10k), currentRound, threadId}` and returns graceful success.

**idea-145 Path 2 unification:** `continuationState` payload is caller-opaque JSON. v1 conventions: `{kind: "llm_state", ...}` (graceful exhaustion) and `{kind: "chunk_buffer", ...}` (task-313 durability migration). Future kinds compose.

---

## 4. New observability surface (cross-task inventory)

### 4.1 New Hub audit actions

| Action | Fires when | Introduced |
|---|---|---|
| `auto_thread_reply_save_state` | Sandwich detected `[SAVE_STATE]` marker + persisted continuation | task-314 |
| `queue_item_continuation_saved` | `save_continuation` MCP tool transitioned item to `continuation_required` | task-314 |
| `queue_item_continuation_resumed` | Continuation sweep re-dispatched the item with embedded state | task-314 |

### 4.2 New CognitiveTelemetry event kinds

Flow through `architectTelemetrySink` → Cloud Run console.log in prod. Extractable via `gcloud logging read architect-agent` for longitudinal analysis.

| Kind | Fires when | Key fields | Introduced |
|---|---|---|---|
| `tool_rounds_exhausted` | LLM loop hit MAX_TOOL_ROUNDS sentinel | threadId, correlationId, finalRound, lastToolName | task-310 |
| `thread_reply_rejected_by_gate` | Hub rejected create_thread_reply with CP2 C2 structured error | threadId, gateSubtype, gateRemediation, gateMetadata | task-310 |
| `thread_reply_chunked` | Oversized reply split into chunks | threadId, totalChunks, totalSize, chunkRound | task-313 |
| `llm_output_truncated` | Gemini finishReason === MAX_TOKENS | threadId, chunkRound, errorMessage | task-313 |

### 4.3 New first-class fields on existing `tool_call` events

| Field | Set by | Observability value |
|---|---|---|
| `cacheHit?: boolean` | ToolResultCache middleware | Cache effectiveness metric (hit rate per sliding window) |
| `cacheFlushed?: boolean` | ToolResultCache middleware | Real invalidation frequency (only set on actual flushes, not every write-call) |

### 4.4 Cross-correlation opportunities

With all four telemetry kinds firing + the cache fields on every `tool_call` event, the architect telemetry stream now supports:

- **Oversize-reply rate:** count(`thread_reply_chunked`) / count(`auto_thread_reply`) over a sliding window.
- **Truncation-without-chunking:** `llm_output_truncated` AND NOT `thread_reply_chunked` on the same `threadId+round` — the LLM hit Gemini's max_output_tokens on a non-oversized reply (different failure class).
- **Tool-round-exhaustion correlation:** `tool_rounds_exhausted` + simultaneous cache churn (`cacheFlushed=true` on many preceding events) — cache-invalidation cascade causing re-fetches.
- **Gate-rejection cost:** `thread_reply_rejected_by_gate` subtype distribution → which CP2 C2 subtypes are most frequent, which v2 auto-correction rules to prioritize.

---

## 5. Mission + deploy timeline

Captured for forensic reconstruction of the mission arc.

```
2026-04-19  bug-11 filed from M-Ideas-Audit retrospective (10× observed failures).
2026-04-20  idea-132 filed capturing the 7 mitigations (director-driven).
            thread-233 triage: architect ratified Option A (dedicated peer mission)
              with 4-task grouping; engineer refinements logged (1a/1b split, cache
              brainstorm flag, T3→T2→T1a→T4→T1b sequence).
            thread-235 formalization: architect created mission-37 (artifact; no tasks)
              + mission-38 (live; task-310). Engineer flagged dup for architect cleanup;
              proceeded against mission-38.

2026-04-21 (UTC; AEST +10):
  00:23Z    thread-235 sealed; task-310 issued.
  [pre-deploy]
  01:30Z    task-310 (c74d069) + package-lock (cfab717) shipped.
  02:59Z    task-310 reviewed; 40+ min silence (bug-20 observation #2).
  ~03:00Z   engineer nudge → thread-236 → task-311 issued.
  03:44Z    task-311 (8322879) + package-lock (bd8378b) shipped.
  03:55Z    task-312 issued via thread-237 (third nudge cycle).
  03:56+58Z auto_thread_reply_failed × 2 (bug-11 firing pre-deploy on thread-237).
  03:59Z    task-312 (18e57e5) shipped.
  04:05Z    task-312 reviewed; 40+ min silence (bug-20 observation #3).

  04:18Z    First deploy: architect-agent-00056-m6c (task-310/311/312 active in prod).
            Engineer hit "invalid_grant" gotcha; fixed via GOOGLE_APPLICATION_CREDENTIALS.

  04:25Z    task-313 issued via thread-238 (fourth nudge cycle).
  05:36Z    task-313 (d8c8279) + package-lock (1488eed) shipped.
  05:46Z    task-313 reviewed; bug-11 silent-post-review pattern (observation #4) —
            though now un-measured by new telemetry against old architect revision.
  05:55Z    engineer audited logs: 0 auto_thread_reply_failed events in the
              post-04:18Z deploy window (~1.7h); tiny sample but initial signal positive.
  06:00Z    task-314 issued via thread-239 (fifth nudge cycle) with brainstorm round
              on design questions (PendingActionItem shape, new tool vs overload,
              re-dispatch trigger, idea-145 Path 2 unification).
  06:11Z    task-314 (17ede9c) shipped.

  ~07:05Z   Final redeploy: hub-00037-h9t → hub-00040-5wn; architect-agent-00056-m6c
              → architect-agent-00058-4nn. sessionEpoch 115→121 on reconnect;
              CP5 handshake label refresh exercised + verified (env=prod preserved).
              Observation window for bug-11 verdict officially begins.

  [this report landed]
```

**Cumulative nudge pattern:** 5 thread-nudges required to drive mission-38 through 5 tasks. Each post-review stall averaged ~30-40 min. bug-20 confirmed observed-5-times by mission close; nudge pattern is the current operating protocol until idea-144 (workflow engine review→next-task advancement) lands.

---

## 6. Bug-11 verdict framework (deferred — observation window)

**Verdict timeline:** 24–48h post-deploy with meaningful thread traffic.

**Data sources:**
1. **Hub audit log** — `list_audit_entries` with filter on actor=architect, action matching the bug-11 class. Key signals: count of `auto_thread_reply_failed` events; distribution across threads.
2. **Architect Cloud Run logs** — `gcloud logging read` filtered on `[ArchitectTelemetry]` prefix. Extract JSON events for `tool_rounds_exhausted`, `thread_reply_chunked`, `llm_output_truncated`, `thread_reply_rejected_by_gate` counts.
3. **Pre-mitigation baseline** — from M-Ideas-Audit retrospective: 10 events across ~90 minutes under stressful workload. Not a direct apples-to-apples comparison (different workload distribution), but the order-of-magnitude anchor.

**Decision criteria (proposed):**
- If `auto_thread_reply_failed` rate drops to < 20% of baseline under comparable stressful workload: **bug-11 flipped `open → resolved`** with `fixCommits` referencing the 5 mission-38 task commits + the deploy revisions.
- If rate is unchanged or higher: filing follow-up analysis bug + keeping bug-11 `open` pending Phase E (pre-hydration / idea-114) which is the mitigation most expected to dent the remaining frequency.
- Mid-case (meaningful but not dramatic reduction): keep bug-11 `open` with a `partial-mitigation` tag + accumulate a longer observation window before final judgment.

**Not in this closing report's scope:** the actual verdict. Deferred to follow-up trace session once the observation window accumulates.

---

## 7. Findings surfaced in mission-38 (resolved / deferred / flagged)

### 7.1 bug-20 — Workflow engine lacks review→next-task advancement

**Observed 5 times during mission-38** (post-task-310, -311, -312, -313, -314 reviews). Every multi-task mission stalls between review and next-task issuance until an engineer or director nudges the architect.

**Resolution path:** reframed on joint triage (director direction 2026-04-21) as an uncovered seam in the workflow engine, not a defect. Class already correctly `missing-feature` at filing. **idea-144** ("Workflow engine: review → next-task advancement") filed as the implementation vehicle with Path A (adapter-side) + Path B (Hub-side) fix options. Tagged `superseded-by:idea-144` on bug-20.

**Status:** bug-20 + idea-144 both `open`; joint director-engineer triage pending when schedule permits.

### 7.2 bug-21 — task-313 chunkReplyMessage surrogate-pair splitting

**Observed at code review** of task-313 (not yet fired in prod; rare codepoint-alignment edge case). Raw-slice `chunkReplyMessage` can cut between UTF-16 surrogate halves, producing invalid Unicode at chunk boundaries.

**Resolution path:** filed on director direction ("File both, update trace, and remember for eventual report") alongside **idea-145** ("task-313 Chunked Reply v2 — semantic-boundary splitting + Hub-persisted buffer durability"). idea-145 bundles three v1 deferrals: (1) semantic-boundary cutting (absorbs bug-21), (2) Hub-persisted chunk continuation (scope-overlap with task-314 `continuationState`), (3) chunk-delivery throughput decoupling. Tagged `superseded-by:idea-145` on bug-21.

**Status:** bug-21 + idea-145 both `open`; joint triage pending.

### 7.3 mission-37 / mission-38 duplicate

On thread-235 formalization, the architect's adapter hit bug-11 (tool-round exhaustion) twice during the `propose_mission` + `create_task` cascade. Each retry ran the mission-creation path; result: mission-37 created at 23:30:16Z (with documentRef, no tasks), mission-38 created at 23:32:17Z (with task-310, no documentRef).

**Resolution path:** engineer proceeded against mission-38 as the canonical vehicle (since it carried the live task); flagged the duplication for architect cleanup in the task-310 Hub report. On thread-238 the architect acknowledged + attached documentRef to mission-38 post-facto, implicitly stalewalling mission-37.

**Status:** mission-38 canonical; mission-37 is a stale artifact in the Hub. Cleanup transitions (archive or repurpose) are architect-only per the current Hub ACL. Not a blocker; low-priority housekeeping.

### 7.4 Deploy-script ADC vs gcloud-CLI credential gotcha

First observed at the 04:18Z deploy. `./deploy/build.sh` invokes `terraform apply` for Cloud Run service updates; terraform uses Application Default Credentials (separate auth path from `gcloud auth activate-service-account`). Without `GOOGLE_APPLICATION_CREDENTIALS` set for the subprocess, terraform fails with `oauth2: "invalid_grant"` even when `gcloud auth list` shows the service account active.

**Resolution path:** documented in both deploys' trace entries + commit bodies. No script patch landed (declined scope expansion during mission-38). Recommended follow-up (not in this mission's scope): auto-export `GOOGLE_APPLICATION_CREDENTIALS=$REPO_ROOT/labops-389703.json` at the top of build.sh if the file exists + env var is unset. 8-line addition with backward-compat semantics.

**Status:** operator-knowable gotcha; documented but not fixed.

### 7.5 task-313 in-memory chunk buffer not migrated to Hub-persisted

task-313's `pendingChunksByThread` module-level Map is lost on Cloud Run restart. Full durability requires Hub-side continuation semantics — which task-314 shipped as a primitive. Migration path is now unblocked.

**Resolution path:** covered by idea-145 Path 2 ("Hub-persisted chunk continuation"). Additive-first migration recommended: new code path stores chunks to both Hub (via `save_continuation` with `{kind: "chunk_buffer", ...}`) AND in-memory; remove in-memory path only after the Hub path proves reliable in prod.

**Status:** unblocked by task-314; scheduled under idea-145.

### 7.6 task-314 marker detection is reactive-only

v1 doesn't actively prompt the LLM to emit `[SAVE_STATE]` when budget is critical. Adapter is ready the moment the LLM learns the convention, but today the LLM has no incentive to emit it.

**Resolution path:** future extension of task-312 (Task 1a thread-budget injection). When `round_count ≥ maxRounds - 2`, inject a system-prompt hint suggesting `[SAVE_STATE]` instead of a full reply. Not in mission-38 scope; documented as v2 work.

**Status:** documented; not filed as separate bug/idea (covered by the "Task 1a extension" line in the task-314 Hub report + trace).

### 7.7 Mission nudge cost via bug-20 recurrence

5 nudge threads required for 5 tasks. Each nudge thread consumed ~1 engineer LLM turn (planning) + 1 thread-open tool call + 1 architect response (post-wake-up) + 1 thread-reply seal. Cumulative engineer-side cost: ~15 tool calls + context for nudge management overhead that would not exist if idea-144 landed.

**Resolution path:** idea-144 is the fix. Documented here as the real cost estimate for operator-triage prioritization.

**Status:** deferred to idea-144 joint triage.

---

## 8. Test coverage added across mission-38

| Package | Baseline | Mission-38 delta | End | Key new coverage |
|---|---|---|---|---|
| `packages/cognitive-layer` | 159 | +13 | 172 | `emitToolRoundsExhausted`, `emitThreadReplyRejectedByGate`, `emitThreadReplyChunked`, `emitLlmOutputTruncated`; cache-telemetry integration flow; TTL expiry + per-session isolation; extractStructuredGateError parsing contract |
| `agents/vertex-cloudrun` | 39 | +23 | 62 | `extractStructuredGateError` shape parsing; `chunkReplyMessage` slice contract + buffer test hooks; `formatThreadBudget` string-shape pin |
| `hub` | 580 | +6 | 586 | Pending-action FSM transitions: `saveContinuation` + `listContinuationItems` + `resumeContinuation` (auth guard, terminal-state guard, oldest-first ordering, no-op on non-continuation items) |

**Total new tests shipped in mission-38: 42.** All green; tsc clean across all packages on every commit.

---

## 9. Prereqs cleared for downstream scope

### 9.1 Phase E (state hydration, idea-114, ADR-020)

Phase E's pre-hydration mitigation (bug-11 #7) was explicitly deferred out of mission-38 scope. mission-38 has made Phase E more measurable:

- `tool_rounds_exhausted` telemetry will help quantify the rounds-spent-on-setup-tool-calls that pre-hydration would eliminate. Pre-hydration's value prop becomes quantifiable.
- `cacheHit` rate gives a view of what proportion of tool calls are already reducible via existing cache; Phase E can target the cache-miss long tail.
- `save_continuation` primitive is general enough to support Phase E's `verify_thread_state` pre-flight drift-reconciliation if needed — the `continuationState` payload can carry a hydrated-state snapshot that the adapter validates against current Hub state on resume.

### 9.2 CP4 (retry_cascade tool)

Unchanged by mission-38. Still independent + engineer-claimable. Prerequisites closed back in CP2. Ordering the engineer-side backlog: CP4 → Phase E feels natural once bug-11 verdict lands.

### 9.3 idea-144 (workflow engine review advancement)

Unblocked for implementation via Path A (adapter-side post-review advancement handler) — modest change in `agents/vertex-cloudrun/src/event-loop.ts`. Could ship standalone; doesn't require mission-38 infrastructure.

### 9.4 idea-145 (task-313 v2)

Unblocked — task-314 `continuationState` primitive is the storage layer. Implementation is additive on top of existing task-313 code.

---

## 10. Key references

### Mission artifacts

- Mission brief: `documents/missions/m-hypervisor-adapter-mitigations.md`
- Work-trace: `docs/traces/m-hypervisor-adapter-mitigations-work-trace.md`
- This closing report: `docs/audits/m-hypervisor-adapter-mitigations-closing-report.md`

### Thread history

- thread-233 — idea-132 triage → mission structure ratification
- thread-234 — CP3 (peer mission) brainstorm; included for context on sequencing
- thread-235 — mission-38 formalization + task-310 issuance
- thread-236/237/238/239 — nudge cycles (five bug-20 observations); task-311/312/313/314 issuance

### Hub entities touched or filed

- **Mission:** mission-38 (canonical), mission-37 (duplicate artifact)
- **Tasks:** task-310, task-311, task-312, task-313, task-314
- **Ideas filed:** idea-144 (workflow engine review advancement), idea-145 (task-313 v2 — semantic boundary + Hub persistence)
- **Bugs filed:** bug-20 (reframed as feature-gap via idea-144), bug-21 (surrogate-pair splits, superseded by idea-145)
- **Bug verdict pending:** bug-11 (24–48h observation window)

### Code commits (mission-38 range)

```
17ede9c [task-314] Task 1b — Graceful Exhaustion (mission-38)
1488eed [chore] Regenerate vertex-cloudrun package-lock after task-313 tgz repack
d8c8279 [task-313] Task 4 — Chunked Reply Composition (mission-38)
bd8378b [chore] Regenerate vertex-cloudrun package-lock after task-311 tgz repack
8322879 [task-311] Task 2 — Parallel Dispatch + Caching (mission-38) observability
18e57e5 [task-312] Task 1a — Adapter-side thread-budget injection (mission-38)
cfab717 [chore] Regenerate vertex-cloudrun package-lock after task-310 tgz repack
c74d069 [task-310] Task 0/3 — Measurement + Error Elision (mission-38)
```

### Prod revisions

- hub: `hub-00040-5wn` (task-314 schema + save_continuation tool + continuation sweep live)
- architect: `architect-agent-00058-4nn` (task-310/311/312/313/314 adapter primitives live)

### Adjacent missions + phases

- **M-Cognitive-Hypervisor** — parent Hub-side mission; CP3 closed concurrently with mission-38 formalization
- **Phase E / idea-114 / ADR-020** — pre-hydration (bug-11 mitigation #7); deferred from mission-38 scope

---

## Mission close

All 5 ratified tasks shipped + deployed + covered by tests. Observability surface is comprehensive across 3 Hub audit actions + 4 CognitiveTelemetry event kinds + 2 first-class event fields. Two v1-limitation bugs + two v2-feature ideas filed for joint architect-director triage. bug-11 verdict is the only outstanding mission-close item, deferred to the 24–48h post-deploy observation window.

Next engineer-side scope when director redirects: CP4 (`retry_cascade`) on M-Cognitive-Hypervisor, OR Phase E pre-hydration (also on M-Cognitive-Hypervisor), OR idea-144 Path A (workflow engine review advancement — standalone quick win). All three are unblocked.
