/**
 * Clarification Policy — Task clarification request/response lifecycle.
 *
 * Tools: create_clarification, resolve_clarification, get_clarification
 * Modifies task state: working ↔ input_required
 */

import { z } from "zod";
import type { PolicyRouter } from "./router.js";
import type { IPolicyContext, PolicyResult } from "./types.js";

// ── Handlers ────────────────────────────────────────────────────────

async function createClarification(args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
  const taskId = args.taskId as string;
  const question = args.question as string;

  const success = await ctx.stores.task.requestClarification(taskId, question);
  if (!success) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: `Task ${taskId} not found or not in working status` }) }],
      isError: true,
    };
  }

  await ctx.emit("clarification_requested", { taskId, question }, ["architect"]);

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: true, taskId, status: "input_required", question }) }],
  };
}

async function resolveClarification(args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
  const taskId = args.taskId as string;
  const answer = args.answer as string;

  const success = await ctx.stores.task.respondToClarification(taskId, answer);
  if (!success) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: `Task ${taskId} not found or not in input_required status` }) }],
      isError: true,
    };
  }

  await ctx.emit("clarification_answered", { taskId, answer: answer.substring(0, 200) }, ["engineer"]);

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: true, taskId, status: "working", answer }) }],
  };
}

async function getClarification(args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
  const taskId = args.taskId as string;

  const task = await ctx.stores.task.getTask(taskId);
  if (!task) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: `Task ${taskId} not found` }) }],
      isError: true,
    };
  }

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        taskId: task.id,
        status: task.status,
        question: task.clarificationQuestion,
        answer: task.clarificationAnswer,
        answered: task.clarificationAnswer !== null,
      }),
    }],
  };
}

// ── Registration ────────────────────────────────────────────────────

export function registerClarificationPolicy(router: PolicyRouter): void {
  router.register(
    "create_clarification",
    "[Engineer] Request clarification from the Architect on an active directive. Sets the task to 'input_required' status. The Architect will be notified via webhook.",
    {
      taskId: z.string().describe("The task ID to request clarification for"),
      question: z.string().describe("The clarification question for the Architect"),
    },
    createClarification,
  );

  router.register(
    "resolve_clarification",
    "[Architect] Respond to an Engineer's clarification request. Returns the task to 'working' status with the answer.",
    {
      taskId: z.string().describe("The task ID to respond to"),
      answer: z.string().describe("The answer to the Engineer's question"),
    },
    resolveClarification,
  );

  router.register(
    "get_clarification",
    "[Engineer] Check if the Architect has responded to a clarification request. Returns the answer if available.",
    {
      taskId: z.string().describe("The task ID to check"),
    },
    getClarification,
  );
}
