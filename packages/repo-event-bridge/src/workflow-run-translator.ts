/**
 * Workflow-run-event → message-shape translator.
 *
 * idea-255 / M-Workflow-Run-Events-Hub-Integration Design v1.0 §1.2 + F1
 * fold. Sibling to `./translator.ts` — keeps `translateGhEvent` clean for
 * the GitHub /events API path (PullRequestEvent / PushEvent / etc.); this
 * module handles the /repos/:owner/:repo/actions/runs response shape,
 * which is distinct from the WorkflowRunEvent webhook envelope.
 *
 * Per F3 fold: per-conclusion event-name split for filter-list granularity:
 *   - `workflow-run-in-progress` for status in (queued, in_progress)
 *   - `workflow-run-dispatched`  for event=workflow_dispatch (manual)
 *   - `workflow-run-completed`   for status=completed (conclusion split via
 *                                 data.conclusion at filter / handler layer)
 *
 * Output shape symmetric with translator.ts:translateGhEvent — both produce
 * `RepoEvent { kind: "repo-event", subkind, payload }`. Asymmetry hidden in
 * inputs (WorkflowRun vs GhEventEnvelope).
 */

import type { RepoEvent } from "./event-source.js";
import type { WorkflowRun } from "./gh-api-client.js";
import type { RepoEventSubkind } from "./translator.js";

/**
 * Translate a single WorkflowRun into a sink-ready RepoEvent. Pure;
 * never throws; unrecognized statuses fall through to `unknown`.
 */
export function translateWorkflowRun(
  run: WorkflowRun,
  repoId: string,
): RepoEvent {
  return {
    kind: "repo-event",
    subkind: dispatchWorkflowRunSubkind(run),
    payload: normalizeWorkflowRun(run, repoId),
  };
}

/**
 * Inspect a WorkflowRun and return the canonical subkind. Pure.
 */
export function dispatchWorkflowRunSubkind(
  run: WorkflowRun,
): RepoEventSubkind {
  if (run.status === "queued" || run.status === "in_progress") {
    return "workflow-run-in-progress";
  }
  if (run.event === "workflow_dispatch") {
    return "workflow-run-dispatched";
  }
  if (run.status === "completed") {
    return "workflow-run-completed";
  }
  return "unknown";
}

/**
 * Extract a stable, sink-friendly v1 payload from a WorkflowRun. Pulls
 * the operator-actionable fields plus head_sha (composes-with idea-256
 * build-info). Unknown shapes fall back gracefully.
 */
export function normalizeWorkflowRun(
  run: WorkflowRun,
  repoId: string,
): Record<string, unknown> {
  return {
    repo: repoId,
    runId: run.id,
    workflowName: typeof run.name === "string" ? run.name : "",
    status: run.status,
    conclusion: run.conclusion,
    event: run.event,
    headSha: typeof run.head_sha === "string" ? run.head_sha : "",
    headBranch: run.head_branch ?? null,
    htmlUrl: typeof run.html_url === "string" ? run.html_url : "",
    runStartedAt: run.run_started_at ?? null,
    updatedAt: run.updated_at,
    actor:
      run.triggering_actor?.login ??
      run.actor?.login ??
      null,
    runNumber: run.run_number ?? null,
    runAttempt: run.run_attempt ?? null,
  };
}
