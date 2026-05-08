/**
 * Workflow-run translator unit tests — idea-255 / M-Workflow-Run-Events-
 * Hub-Integration v1.0 §2.3.
 *
 * Pin contract per `feedback_format_regex_over_hardcoded_hash_tests.md`:
 * format-regex on run.id (^\d+$); no hardcoded version values; shape +
 * dispatch logic only.
 *
 * Test fixtures use the /actions/runs response shape (NOT WorkflowRunEvent
 * webhook envelope) per F7 fold.
 */

import { describe, it, expect } from "vitest";
import {
  translateWorkflowRun,
  dispatchWorkflowRunSubkind,
  normalizeWorkflowRun,
} from "../src/workflow-run-translator.js";
import { REPO_EVENT_SUBKINDS } from "../src/translator.js";
import type { WorkflowRun } from "../src/gh-api-client.js";

function makeRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
    id: 25529674489,
    name: "release-plugin",
    status: "completed",
    conclusion: "success",
    event: "push",
    head_sha: "8244c096b5f7d5a171aae118a7a53b4ad31fb7e3",
    head_branch: "main",
    html_url: "https://github.com/apnex-org/agentic-network/actions/runs/25529674489",
    run_started_at: "2026-05-08T00:30:00Z",
    updated_at: "2026-05-08T00:32:01Z",
    created_at: "2026-05-08T00:30:00Z",
    actor: { login: "apnex-lily" },
    triggering_actor: { login: "apnex-lily" },
    run_number: 1,
    run_attempt: 1,
    ...overrides,
  };
}

describe("translateWorkflowRun — envelope shape", () => {
  it("always returns kind='repo-event'", () => {
    expect(translateWorkflowRun(makeRun(), "apnex-org/agentic-network").kind).toBe(
      "repo-event",
    );
  });

  it("returns subkind from REPO_EVENT_SUBKINDS taxonomy", () => {
    const ev = translateWorkflowRun(makeRun(), "apnex-org/agentic-network");
    expect(REPO_EVENT_SUBKINDS).toContain(ev.subkind);
  });
});

describe("dispatchWorkflowRunSubkind — per-conclusion split (F3 fold)", () => {
  it("queued → workflow-run-in-progress", () => {
    expect(dispatchWorkflowRunSubkind(makeRun({ status: "queued", conclusion: null }))).toBe(
      "workflow-run-in-progress",
    );
  });

  it("in_progress → workflow-run-in-progress", () => {
    expect(
      dispatchWorkflowRunSubkind(makeRun({ status: "in_progress", conclusion: null })),
    ).toBe("workflow-run-in-progress");
  });

  it("workflow_dispatch event → workflow-run-dispatched (in-progress branch wins for queued state)", () => {
    expect(
      dispatchWorkflowRunSubkind(
        makeRun({ status: "completed", event: "workflow_dispatch" }),
      ),
    ).toBe("workflow-run-dispatched");
  });

  it("status=completed + push event → workflow-run-completed", () => {
    expect(dispatchWorkflowRunSubkind(makeRun({ status: "completed", event: "push" }))).toBe(
      "workflow-run-completed",
    );
  });

  it("conclusion=failure with status=completed still routes to completed", () => {
    expect(
      dispatchWorkflowRunSubkind(
        makeRun({ status: "completed", conclusion: "failure", event: "push" }),
      ),
    ).toBe("workflow-run-completed");
  });

  it("unknown status → unknown subkind (graceful degrade)", () => {
    expect(
      dispatchWorkflowRunSubkind(makeRun({ status: "weird-state", event: "push" })),
    ).toBe("unknown");
  });
});

describe("normalizeWorkflowRun — payload shape (F6 head_sha composability)", () => {
  it("preserves head_sha for idea-256 build-info composition", () => {
    const run = makeRun({ head_sha: "abc1234abc1234abc1234abc1234abc1234abc12" });
    const out = normalizeWorkflowRun(run, "apnex-org/agentic-network");
    expect(out.headSha).toBe("abc1234abc1234abc1234abc1234abc1234abc12");
  });

  it("preserves run_id with format-regex /^\\d+$/", () => {
    const out = normalizeWorkflowRun(makeRun(), "apnex-org/agentic-network");
    expect(typeof out.runId).toBe("number");
    expect(String(out.runId)).toMatch(/^\d+$/);
  });

  it("uses triggering_actor.login when present, else actor.login, else null", () => {
    expect(
      normalizeWorkflowRun(
        makeRun({ triggering_actor: { login: "trig" }, actor: { login: "act" } }),
        "r",
      ).actor,
    ).toBe("trig");
    expect(
      normalizeWorkflowRun(
        makeRun({ triggering_actor: undefined, actor: { login: "act" } }),
        "r",
      ).actor,
    ).toBe("act");
    expect(
      normalizeWorkflowRun(
        makeRun({ triggering_actor: undefined, actor: undefined }),
        "r",
      ).actor,
    ).toBeNull();
  });

  it("preserves conclusion (success/failure/null) verbatim", () => {
    expect(normalizeWorkflowRun(makeRun({ conclusion: "success" }), "r").conclusion).toBe(
      "success",
    );
    expect(normalizeWorkflowRun(makeRun({ conclusion: "failure" }), "r").conclusion).toBe(
      "failure",
    );
    expect(normalizeWorkflowRun(makeRun({ conclusion: null }), "r").conclusion).toBeNull();
  });

  it("propagates html_url for failure-link surfacing", () => {
    const out = normalizeWorkflowRun(makeRun(), "apnex-org/agentic-network");
    expect(typeof out.htmlUrl).toBe("string");
    expect(out.htmlUrl).toMatch(/^https:\/\/github\.com\//);
  });

  it("preserves repo identifier as-passed", () => {
    expect(normalizeWorkflowRun(makeRun(), "apnex-org/agentic-network").repo).toBe(
      "apnex-org/agentic-network",
    );
  });
});
