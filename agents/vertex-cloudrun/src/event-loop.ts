/**
 * Event Loop — 300s catch-up polling via get_pending_actions.
 *
 * Backup mechanism for SSE. Discovers items that were missed during
 * disconnection or transport failures.
 */

import { HubAdapter } from "./hub-adapter.js";
import { ContextStore } from "./context.js";
import {
  sandwichReviewReport,
  sandwichReviewProposal,
  sandwichThreadReply,
  sandwichClarification,
  sandwichThreadConverged,
} from "./sandwich.js";

const POLL_INTERVAL = parseInt(process.env.EVENT_LOOP_INTERVAL || "300", 10) * 1000;
const INITIAL_DELAY = 30_000; // 30s after startup

let loopTimer: ReturnType<typeof setInterval> | null = null;

export function startEventLoop(hub: HubAdapter, context: ContextStore): void {
  console.log(`[EventLoop] Starting (interval=${POLL_INTERVAL / 1000}s)`);

  // Initial delay
  setTimeout(() => {
    pollAndProcess(hub, context);

    loopTimer = setInterval(() => {
      pollAndProcess(hub, context);
    }, POLL_INTERVAL);
  }, INITIAL_DELAY);
}

export function stopEventLoop(): void {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
    console.log("[EventLoop] Stopped");
  }
}

/**
 * Reset the event loop timer. Called after a state sync to restart
 * the 300s countdown from now (so we don't poll again immediately).
 */
export function resetEventLoopTimer(hub: HubAdapter, context: ContextStore): void {
  if (!loopTimer) return; // Event loop not running
  clearInterval(loopTimer);
  loopTimer = setInterval(() => {
    pollAndProcess(hub, context);
  }, POLL_INTERVAL);
  console.log("[EventLoop] Timer reset after state sync");
}

/**
 * Trigger an immediate poll cycle. Used during state sync to discover
 * pending work after a reconnect.
 */
export async function triggerImmediatePoll(hub: HubAdapter, context: ContextStore): Promise<void> {
  await pollAndProcess(hub, context);
}

async function pollAndProcess(
  hub: HubAdapter,
  context: ContextStore
): Promise<void> {
  if (!hub.isConnected) {
    console.log("[EventLoop] Hub not connected, skipping poll");
    return;
  }

  console.log("[EventLoop] Polling for pending actions...");

  try {
    // ADR-017: drain the authoritative queue first. thread_message items
    // feed directly to sandwichThreadReply with sourceQueueItemId so the
    // Hub can completion-ACK atomically on reply. Track handled thread
    // IDs so the legacy get_pending_actions path below doesn't
    // double-fire on the same thread.
    const drainedThreadIds = new Set<string>();
    try {
      const drained = await hub.drainPendingActions();
      if (drained.items.length > 0) {
        console.log(`[EventLoop] Drained ${drained.items.length} queue item(s)`);
      }
      for (const item of drained.items) {
        if (item.dispatchType === "thread_message") {
          drainedThreadIds.add(item.entityRef);
          console.log(`[EventLoop] Drain → sandwichThreadReply ${item.entityRef} (queueItem=${item.id})`);
          await sandwichThreadReply(hub, context, item.entityRef, item.id);
        }
        // Other dispatch types (task_issued, proposal_submitted, etc.)
        // will be wired in ADR-017 Phase 1 follow-ups (idea-99).
      }
    } catch (err) {
      console.warn("[EventLoop] drainPendingActions failed:", err);
    }

    const pending = await hub.getPendingActions();
    const total = (pending.totalPending || 0) as number;

    if (total === 0) {
      console.log("[EventLoop] No pending actions.");
      return;
    }

    console.log(`[EventLoop] Found ${total} pending items`);

    // Process unreviewed tasks
    const unreviewedTasks = (pending.unreviewedTasks || []) as Array<
      Record<string, unknown>
    >;
    for (const task of unreviewedTasks) {
      const taskId = task.taskId as string;
      const reportRef = task.reportRef as string;
      if (taskId && reportRef) {
        console.log(`[EventLoop] Reviewing task ${taskId}`);
        await sandwichReviewReport(hub, context, taskId, reportRef);
      }
    }

    // Process pending proposals
    const pendingProposals = (pending.pendingProposals || []) as Array<
      Record<string, unknown>
    >;
    for (const proposal of pendingProposals) {
      const proposalId = proposal.proposalId as string;
      const title = (proposal.title || "") as string;
      const summary = (proposal.summary || "") as string;
      const proposalRef = proposal.proposalRef as string;
      if (proposalId && proposalRef) {
        console.log(`[EventLoop] Reviewing proposal ${proposalId}`);
        await sandwichReviewProposal(
          hub,
          context,
          proposalId,
          title,
          summary,
          proposalRef
        );
      }
    }

    // Process threads awaiting reply (legacy backup path — drain above
    // is authoritative for ADR-017 queue items). Dedup against drained.
    const threadsAwaitingReply = (pending.threadsAwaitingReply || []) as Array<
      Record<string, unknown>
    >;
    for (const thread of threadsAwaitingReply) {
      const threadId = thread.threadId as string;
      if (threadId && !drainedThreadIds.has(threadId)) {
        console.log(`[EventLoop] Replying to thread ${threadId} (legacy path)`);
        await sandwichThreadReply(hub, context, threadId);
      }
    }

    // Process clarifications
    const clarificationsPending = (
      pending.clarificationsPending || []
    ) as Array<Record<string, unknown>>;
    for (const task of clarificationsPending) {
      const taskId = task.taskId as string;
      const question = (task.question || "") as string;
      if (taskId && question) {
        console.log(`[EventLoop] Answering clarification for ${taskId}`);
        await sandwichClarification(hub, context, taskId, question);
      }
    }

    // Process converged threads (polling backup for thread_converged SSE)
    const convergedThreads = (
      pending.convergedThreads || []
    ) as Array<Record<string, unknown>>;
    for (const thread of convergedThreads) {
      const threadId = thread.threadId as string;
      const intent = (thread.outstandingIntent || null) as string | null;
      if (threadId) {
        console.log(`[EventLoop] Processing converged thread ${threadId} (intent: ${intent})`);
        await sandwichThreadConverged(hub, context, threadId, intent);
      }
    }

    console.log(`[EventLoop] Completed processing ${total} pending items`);
  } catch (err) {
    console.error("[EventLoop] Poll failed:", err);
  }
}
