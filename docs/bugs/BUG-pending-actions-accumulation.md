# BUG: get_pending_actions accumulates stale items indefinitely

**Discovered:** 2026-04-12
**Status:** Documented — to be addressed in next Turn
**Severity:** Medium — causes the Architect's event loop to process 56+ phantom items per cycle without resolving any

## Description

The `get_pending_actions` tool returns a growing count of pending items that are never cleared. As of 2026-04-12, it returns 56 items (14 unread reports + 42 converged threads), none of which require action. The Architect's event loop polls this every 5 minutes, finds 56 items, "completes processing" them (by iterating and doing nothing), and repeats.

## Root Causes

### 1. Unread Reports Never Cleared (14 items)

The `unreadReports` filter in `get_pending_actions` returns any task where `status === "completed" || status === "failed"` and `report !== null`. However, it does not check whether a review has already been submitted via `submit_review`.

```typescript
// Current (broken):
const unreadReports = tasks.filter(
  (t) => (t.status === "completed" || t.status === "failed") && t.report !== null
);

// Should be:
const unreadReports = tasks.filter(
  (t) => (t.status === "completed" || t.status === "failed") && t.report !== null && !t.reviewAssessment
);
```

Note: `unreviewedTasks` already checks `!t.reviewAssessment` — the `unreadReports` filter is missing the same check. These two filters likely overlap and should be consolidated.

### 2. Converged Threads Never Closed (42 items)

The `convergedThreads` filter returns all threads with `status === "converged"`. There is no mechanism to transition converged threads to `"closed"`:

- **Historical threads (thread-3 through thread-33):** These converged during previous phases and were already acted upon (directives issued, work completed). But they were never explicitly closed because `close_thread` was not called.
- **The `sourceThreadId` fix (task-34):** New directives can auto-close their source thread, but this only applies going forward. All historical converged threads remain in the accumulating count.
- **The `thread_converged` notification (task-34):** The Hub correctly emits this notification, but the Architect's notification handler logs it as `Unhandled event: thread_converged` because the Architect agent's code was not updated.

### 3. Architect Event Loop Doesn't Act on Pending Items

The event loop calls `get_pending_actions`, counts the items, logs "Found N pending items" and "Completed processing N pending items" — but doesn't actually resolve any of them. The "processing" appears to be a count-and-log operation, not a resolution loop.

## Impact

- **Architect event loop noise:** 56 phantom items processed every 5 minutes
- **Masked real issues:** A genuine pending action (e.g., a new unread report) is buried in 56 stale items
- **Growing count:** Every new converged thread adds permanently to the count unless explicitly closed

## Proposed Fixes (Next Turn)

### Fix 1: Unread Reports Filter
Add `!t.reviewAssessment` check to the `unreadReports` filter. Consider consolidating with `unreviewedTasks`.

### Fix 2: Historical Thread Cleanup
One-time migration: close all converged threads from previous phases (thread-3 through thread-43) that have already been acted upon. This can be done via a script calling `close_thread` on each.

### Fix 3: Architect Notification Handler
Add `thread_converged` to the Architect agent's notification handler so it processes convergence events and issues follow-up directives.

### Fix 4: Event Loop Resolution
The Architect's event loop should actually act on pending items — not just count them. For `convergedThreads` with `intent: implementation_ready`, it should issue directives. For `unreadReports`, it should trigger reviews.

## Related

- Thread-45: "Workflow Gap: Thread Convergence Follow-Through" — designed the `thread_converged` notification
- Task-34: Implemented Hub-side convergence notification and `sourceThreadId` on `submit_directive`
- The Architect agent's event loop and notification handler are in `architect-agent/src/`
