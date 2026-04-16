/**
 * State sync — called on entry to the `synchronizing` phase.
 *
 * Runs `get_task` + `get_pending_actions` in parallel, then calls
 * `completeSync()` to transition to `streaming` and flush buffered events.
 *
 * The enriched handshake is NOT called here — `McpAgentClient.runHandshake`
 * invokes it before this function runs, so `state-sync.ts` can assume the
 * engineer has its canonical engineerId by the time it queries pending state.
 */

import type { ILogger, LegacyStringLogger } from "./logger.js";
import { normalizeToILogger } from "./logger.js";

export interface StateSyncContext {
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  completeSync: () => void;
  /** Structured logger. A legacy `(msg: string) => void` is auto-bridged. */
  log: ILogger | LegacyStringLogger;
  /** Optional hook for per-engineer logging of pending directives. */
  onPendingTask?: (task: Record<string, unknown>) => void;
}

export async function performStateSync(ctx: StateSyncContext): Promise<void> {
  const log = normalizeToILogger(ctx.log, "StateSync");
  log.log("agent.sync.start", undefined, "[StateSync] Starting state sync...");

  try {
    const [directive, pendingActions] = await Promise.all([
      ctx.executeTool("get_task", {}).catch((err: unknown) => {
        log.log(
          "agent.sync.get_task.failed",
          { error: String(err) },
          `[StateSync] get_task: ${err}`
        );
        return null;
      }),
      ctx.executeTool("get_pending_actions", {}).catch((err: unknown) => {
        log.log(
          "agent.sync.get_pending_actions.failed",
          { error: String(err) },
          `[StateSync] get_pending_actions: ${err}`
        );
        return null;
      }),
    ]);

    if (directive && typeof directive === "object") {
      const d = directive as Record<string, unknown>;
      if (d.task && typeof d.task === "object") {
        const task = d.task as Record<string, unknown>;
        log.log(
          "agent.sync.pending_task",
          { taskId: String(task.taskId ?? "unknown") },
          `[StateSync] Pending task: ${task.taskId ?? "unknown"}`
        );
        if (ctx.onPendingTask) ctx.onPendingTask(task);
      }
    }

    if (pendingActions && typeof pendingActions === "object") {
      const pa = pendingActions as Record<string, unknown>;
      log.log(
        "agent.sync.pending_actions",
        { totalPending: Number(pa.totalPending ?? 0) },
        `[StateSync] Pending actions: ${pa.totalPending ?? 0}`
      );
    }

    ctx.completeSync();
    log.log("agent.sync.complete", undefined, "[StateSync] Sync complete — now streaming");
  } catch (err) {
    log.log(
      "agent.sync.failed",
      { error: String(err) },
      `[StateSync] Failed: ${err}`
    );
    try {
      ctx.completeSync();
    } catch {
      log.log(
        "agent.sync.complete_failed",
        undefined,
        "[StateSync] completeSync() also failed"
      );
    }
  }
}
