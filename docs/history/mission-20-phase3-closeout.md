# Mission-20 Phase 3 — Closeout

**Status:** Delivered
**Author:** Claude Code (engineer-claude-1, `eng-ddec09b296d0`)
**Date:** 2026-04-17
**Relationship to Phase 1 audit:** This document reports the outcome of the migrations planned in `docs/history/mission-20-phase1-audit.md §6`. Every site enumerated there is now in one of three terminal states: eliminated (virtual-view / deleted), CAS-wrapped with reproduction coverage, or explicitly deferred (P3 under `max-instances=1`, or out-of-scope).

---

## 1. Executive summary

Mission-20's remediation programme is complete. Of the 24 in-scope sites in `hub/src`:

- **3 P1 sites landed** — Thread messages split to per-file `createOnly`, Turn/Mission/Task linkage migrated to virtual-view, audit daily-Markdown rollup deleted outright.
- **15 P2 sites have reproduction coverage** — each catalogued site in §3 of the Phase 1 audit now has a concurrency-reproduction test in `hub/test/unit/gcs-p2-repro.test.ts`. The migrations themselves were delivered under task-230 before this closeout; Phase 3 ships the proof.
- **5 P3 sites remain guarded** by the `max-instances=1` pin (ADR-009) and are documented in ADR-011 with the "reclassify if pin lifts" invariant.
- **1 sibling site** (Architect-agent history RMW) remains out-of-scope; flagged for a separate remediation.

One scope split happened during delivery: the `BaseEntityFields` refactor (thread-111) was moved to a future task so the Phase 3 commit history remained reviewable.

Test posture at delivery: **283/283 unit + integration tests green** (`cd hub && npx vitest run`). Type-check clean.

---

## 2. P1 sites delivered

### 2.1 `Thread.messages` — per-file split

**Commit:** `f295c6d`

**Change:**
- Each message now lives one-per-file under `threads/{threadId}/messages/{seq}.json`, written via `createOnly` after the scalar transform commits.
- `Thread.messages` remains on the entity type but is no longer stored on the thread scalar — it is hydrated on every read.
- The reply-path CAS transform in `GcsThreadStore.replyToThread` touches only scalar fields (`currentTurn`, `roundCount`, `status`, `lastMessageConverged`, `outstandingIntent`, `currentSemanticIntent`, `updatedAt`). No array RMW.
- Two-consecutive-`converged=true` detection, previously implemented by reading the last two messages inside the transform, is now driven by a new `Thread.lastMessageConverged` scalar. Cheap and colocated with the other scalar fields the transform already manages.
- `getThread` / `replyToThread` hydrate by listing `threads/{id}/messages/` and sorting numerically by `{seq}.json`. `listThreads` filters out the nested message files to avoid walking them for the top-level listing.

**Reproduction coverage added in this phase** (`gcs-p2-repro.test.ts`):
- Alternating-author concurrent replies: only current-turn author wins, no message corruption.
- Same-author concurrent replies: exactly one wins the turn gate (TransitionRejected → null on the loser).
- Sequential alternating replies: per-file hydration returns messages in order.
- Scalar-convergence path: two consecutive `converged=true` replies trip `status=converged`.

**Race eliminated.** The Phase 1 audit's canonical race was two same-role engineers replying concurrently with matching labels; under the old code both would read a stale `currentTurn`, both would push a message, the second write would clobber the first. Under the new code the scalar transform retries under CAS (and one leg loses on the gate); messages are write-once-per-file and cannot collide.

### 2.2 Turn linkage — virtual-view migration

**Commit:** `f295c6d`

**Change:**
- `ITurnStore.linkMission` / `linkTask` removed from the interface and both Memory / GCS implementations. They were dead code in production today (the Phase 1 audit confirmed zero callers from the policy layer) but would have been P1-class the moment they were wired up.
- `Mission` gains `turnId: string | null`. `Task` gains `turnId: string | null` (also a prerequisite for future Turn-owned work queues).
- `MemoryTurnStore` and `GcsTurnStore` now take `missionStore` / `taskStore` in their constructors; a private `hydrate()` method computes `missionIds` / `taskIds` by filtering the two stores by `turnId` on every read.
- Wiring updated in `src/index.ts` (production), `src/policy/test-utils.ts` (policy tests), and `test/e2e/orchestrator.ts` (E2E).

**Shape consistency.** `Turn.missionIds` / `Turn.taskIds` now compose the same way `Mission.tasks` / `Mission.ideas` do (task-223 fix). The read-path cost is a `listMissions()` + `listTasks()` per Turn read; acceptable at current scale and a prerequisite for lifting the single-instance pin.

### 2.3 Audit daily-Markdown rollup — deleted

**Commit:** `f295c6d`

**Change:**
- The `audit/log-YYYY-MM-DD.md` writer block in `GcsAuditStore.createEntry` is removed. The in-process `auditLock` field is removed. The `writeMarkdown` helper is no longer called.
- `audit/{id}.json` per-file entries remain the authoritative record. `GcsAuditStore.listEntries` was already filtering to `*.json`; no reader ever consumed the Markdown rollup.

**Why delete rather than CAS-wrap.** The rollup was a write-only artifact protected by an `AsyncLock` that is effectively useless across Cloud Run instances. Any scale-out would have begun dropping lines immediately. Zero readers existed, so hardening the write had no value.

---

## 3. P2 sites — reproduction coverage

Phase 2 (`41c20a9`) migrated the 15 catalogued P2 sites from naked RMW to `updateExisting`. Phase 3 adds proof-of-correctness:

| Site | Test |
|------|------|
| `GcsIdeaStore.updateIdea` | `idea updateIdea concurrent status flips — both land` |
| `GcsMissionStore` field updates | `mission updateMission concurrent status + documentRef — both land` |
| `GcsTurnStore.updateTurn` | `turn updateTurn concurrent status + scope — both land` |
| `GcsTaskStore.submitReport` | `submitReport concurrent with cancelTask — exactly one wins on gate` |
| `GcsTaskStore.cancelTask` | `cancelTask concurrent on same pending task — exactly one wins` |
| `GcsTaskStore.requestClarification` / `respondToClarification` | gated-transition races |
| `GcsTaskStore.submitReview` | gated-transition race under `status=reported_*` |
| `GcsTaskStore.getNextDirective` | claim race — exactly one engineer wins |
| `GcsTaskStore.getNextReport` | pickup race — exactly one transition per report |
| `GcsTaskStore.unblockDependents` / `cancelDependents` | inner per-task cascade RMWs |
| `GcsProposalStore.reviewProposal` | concurrent decision races |
| `GcsProposalStore.setScaffoldResult` | scaffold-result race |
| `GcsProposalStore.closeProposal` | closeProposal gated race |
| `GcsThreadStore.closeThread` | scalar race with `setConvergenceAction` |
| `GcsThreadStore.setConvergenceAction` | scalar race with `closeThread` |

The test harness (`hub/test/unit/_gcs-fake.ts`) ships as part of Phase 3. It models `@google-cloud/storage` with per-path generation counters, throws 412 on mismatch, 404 on missing, and exposes a `preconditionFailureCount` probe so tests can self-verify that concurrent races are actually firing — not silently serialised by microtask scheduling.

---

## 4. Deferrals

### 4.1 `BaseEntityFields` refactor (thread-111)

`id` / `createdAt` / `updatedAt` / `labels` / `turnId` now repeat across Mission / Task / Thread / Proposal / Idea. Extracting a shared type is natural but was pulled out of Phase 3 to keep the commit diff reviewable. Scheduled for a future independent task; not blocking anything.

### 4.2 idea-72 — on-demand historical context retrieval

During the Phase 3 window an Architect-service audit found ~25-30% of the observed 9.8k-char system prompt was stale historical snapshots (Recent Decisions / Reviews / Thread Outcomes) re-sent on every sandwich call and every Director message. Logged as **idea-72** ("Advanced Cognitive Engineering") for on-demand tool-based retrieval. Partial mitigation shipped as ADR-012 (per-tick cache, session trim). Deeper redesign is future work.

### 4.3 Architect-agent history RMW (`agents/vertex-cloudrun/src/context.ts`)

Out-of-scope per the Mission-20 brief. The four `appendDirectorMessage` / `appendReview` / `appendThreadSummary` / `appendDecision` methods each do naked RMW on a bounded-tail JSON array. Under `max-instances=1` this is currently safe; under SSE-driven concurrent event handlers in the same process it is race-prone. Flagged for a sibling task. Independent of the GCS concurrency programme.

---

## 5. Residual risk

- **Cross-path atomicity.** Any operation that touches multiple GCS paths (e.g. `openThread` writing both `threads/{id}.json` and `threads/{id}/messages/1.json`) can leave an intermediate state on partial failure. ADR-011 accepts this as the cost of using GCS as system-of-record. No Mission-20 primitive addresses it; a future Outbox-pattern or Firestore-transactions mission would.
- **P3 pin load-bearing.** Five P3 sites are safe only under `max-instances=1`. If the Hub is ever scaled out (Pub/Sub backplane, Firestore migration, etc.) without first migrating those sites, duplicate IDs from `getAndIncrementCounter`, duplicate task claims, and registry divergence become live risks. ADR-011 documents the dependency explicitly.
- **Architect-side context bloat** (tracked under idea-72). The Phase 3 Architect fixes (ADR-012) capped session-history growth and added a 30s per-tick cache on `buildAutonomousContext()`, but the underlying design — always-on historical snapshots in the system prompt — remains. Token-cost impact is roughly $5/month at current traffic; not urgent.

---

## 6. Commit index

| Commit | Mission phase | Summary |
|--------|---------------|---------|
| `98004c5` | Pre-mission | Mission-20 brief drafted |
| `fcdde76` | Pilot (task-223) | `Mission.tasks` virtual-view fix (predates mission) |
| `23d2612` | Phase 1 | Confirmed GCS RMW audit |
| `41c20a9` | Phase 2 | Named primitives — `createOnly` / `updateExisting` / `upsert` |
| `58b62f0` | Phase 3 | P2 reproduction harness — `_gcs-fake.ts` + 16 tests |
| `f295c6d` | Phase 3 | P1 eliminations — audit rollup, Turn virtual-view, Thread messages split |

---

## 7. Verification at delivery

```
$ cd hub && npx tsc --noEmit
(no output)

$ cd hub && npx vitest run
Test Files  23 passed (23)
     Tests  283 passed (283)
  Duration  2.03s
```

Every site in §2-3 of the Phase 1 audit is in a terminal state. Mission-20 closed.

---

*End of Phase 3 closeout.*
