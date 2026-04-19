/**
 * ErrorNormalizer unit tests.
 *
 * Pins INV-COG-10: deterministic-only rewrite set.
 * - Zod type mismatch, missing required, cascade-drift (6 variants),
 *   unknown-tool with edit-distance suggestion — ALL rewrite.
 * - Application / business-logic errors pass through untouched.
 */

import { describe, it, expect } from "vitest";
import {
  ErrorNormalizer,
  NormalizedError,
} from "../src/middlewares/error-normalizer.js";
import type { ToolErrorContext } from "../src/contract.js";

function errCtx(overrides: Partial<ToolErrorContext> = {}): ToolErrorContext {
  return {
    tool: "update_idea",
    args: {},
    sessionId: "sess-A",
    error: new Error("default"),
    durationMs: 10,
    startedAt: 0,
    tags: {},
    ...overrides,
  };
}

describe("ErrorNormalizer — tryRewrite returns null for non-matching errors", () => {
  it("passes through plain business errors (Thread not found)", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "get_thread",
        error: new Error("Thread not found: thread-999"),
      }),
    );
    expect(result).toBeNull();
  });

  it("passes through permission errors", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        error: new Error("Authorization denied: role architect required"),
      }),
    );
    expect(result).toBeNull();
  });

  it("passes through semantic state errors", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        error: new Error("Thread already converged"),
      }),
    );
    expect(result).toBeNull();
  });
});

describe("ErrorNormalizer — Zod type mismatch", () => {
  it("rewrites 'Expected string, received number'", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "create_task",
        args: { title: 42 },
        error: new Error(
          'Validation failed: [{"code":"invalid_type","expected":"string","received":"number","path":["title"],"message":"Expected string, received number"}]',
        ),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("zod-type-mismatch");
    expect(result!.message).toContain("'title'");
    expect(result!.message).toContain("expects string");
    expect(result!.message).toContain("got number");
    expect(result!.message).toContain("Example:");
  });

  it("rewrites without field name when path is absent", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        error: new Error("Expected object, received string"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("zod-type-mismatch");
    expect(result!.message).toContain("field expects object");
  });
});

describe("ErrorNormalizer — missing required field", () => {
  it("rewrites Zod Required-at-path errors", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "create_task",
        error: new Error(
          '[{"code":"invalid_type","expected":"string","received":"undefined","path":["assigneeRole"],"message":"Required"}]',
        ),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-required");
    expect(result!.message).toContain("'assigneeRole'");
    expect(result!.message).toContain("Retry with args including");
  });

  it("recognizes 'field X is required' prose form", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        error: new Error("field 'title' is required"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("missing-required");
    expect(result!.message).toContain("'title'");
  });
});

describe("ErrorNormalizer — cascade-drift: update_idea flat → wrapped", () => {
  it("rewrites flat-shape update_idea with 'changes' reference in error", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_idea",
        args: { ideaId: "idea-1", tags: ["foo"], status: "triaged" },
        error: new Error(
          "ZodError: Required at path ['changes']",
        ),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:update_idea");
    expect(result!.message).toContain("update_idea requires");
    expect(result!.message).toContain("changes: {");
    expect(result!.message).toContain("tags, status");
    expect(result!.message).toContain("flat shape");
  });

  it("does not match if args already have wrapper", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_idea",
        args: { ideaId: "idea-1", changes: { status: "triaged" } },
        error: new Error("changes key invalid"),
      }),
    );
    // Cascade-drift rule doesn't fire since `changes` is present.
    expect(result?.rule).not.toBe("cascade-drift:update_idea");
  });
});

describe("ErrorNormalizer — cascade-drift: update_mission, update_bug", () => {
  it("update_mission flat → wrapped", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_mission",
        args: { missionId: "mission-1", status: "active" },
        error: new Error("Required at changes"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:update_mission");
    expect(result!.message).toContain("update_mission requires");
    expect(result!.message).toContain("status");
  });

  it("update_bug flat → wrapped", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_bug",
        args: { bugId: "bug-1", severity: "critical" },
        error: new Error("validation: missing 'changes' wrapper"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:update_bug");
    expect(result!.message).toContain("update_bug requires");
  });
});

describe("ErrorNormalizer — cascade-drift: create_idea title/description", () => {
  it("rewrites title+description form with missing 'text' field", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "create_idea",
        args: { title: "my idea", description: "details" },
        error: new Error("Required: text"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:create_idea");
    expect(result!.message).toContain("create_idea requires { text");
    expect(result!.message).toContain("'title' and 'description' are not part of the schema");
  });
});

describe("ErrorNormalizer — cascade-drift: update_mission_status + close_no_action", () => {
  it("update_mission_status missing statusMessage", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_mission_status",
        args: { missionId: "m-1", status: "completed" },
        error: new Error('Required: statusMessage at path ["statusMessage"]'),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:update_mission_status");
    expect(result!.message).toContain("statusMessage");
  });

  it("close_no_action direct-call → suggest stagedAction form", () => {
    const normalizer = new ErrorNormalizer();
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "close_no_action",
        args: { reason: "done" },
        error: new Error("Unknown tool: close_no_action not found"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("cascade-drift:close_no_action");
    expect(result!.message).toContain("staged action");
    expect(result!.message).toContain("create_thread_reply");
  });
});

describe("ErrorNormalizer — unknown-tool with edit-distance suggestion", () => {
  const KNOWN = [
    "get_thread",
    "create_thread",
    "create_thread_reply",
    "list_ideas",
    "get_mission",
  ];

  it("suggests correct tool within edit-distance budget", () => {
    const normalizer = new ErrorNormalizer({ knownTools: KNOWN });
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "get_thred",
        args: { threadId: "t-1" },
        error: new Error("Unknown tool: get_thred"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("unknown-tool");
    expect(result!.message).toContain("get_thred");
    expect(result!.message).toContain("Did you mean 'get_thread'");
  });

  it("shows top-3 similar tools", () => {
    const normalizer = new ErrorNormalizer({ knownTools: KNOWN });
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "creat_thread",
        error: new Error("Unknown tool: creat_thread"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.message).toContain("Similar tools");
    expect(result!.message).toContain("'create_thread'");
  });

  it("degrades to plain 'not found' when edit-distance > budget", () => {
    const normalizer = new ErrorNormalizer({
      knownTools: KNOWN,
      maxToolEditDistance: 2,
    });
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "xyz_blahblah",
        error: new Error("Unknown tool: xyz_blahblah"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.message).toContain("xyz_blahblah");
    expect(result!.message).not.toContain("Did you mean");
  });

  it("handles empty knownTools list gracefully", () => {
    const normalizer = new ErrorNormalizer({ knownTools: [] });
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "foo",
        error: new Error("Unknown tool: foo"),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.message).toBe("Tool 'foo' not found.");
  });
});

describe("ErrorNormalizer — onToolError integration", () => {
  it("throws NormalizedError on rewrite", async () => {
    const normalizer = new ErrorNormalizer({ knownTools: ["get_thread"] });
    const ctx = errCtx({
      tool: "get_thred",
      error: new Error("Unknown tool: get_thred"),
    });

    await expect(
      normalizer.onToolError(ctx, async () => { throw ctx.error; }),
    ).rejects.toBeInstanceOf(NormalizedError);
  });

  it("NormalizedError preserves raw error + rule tag", async () => {
    const normalizer = new ErrorNormalizer({ knownTools: ["get_thread"] });
    const rawError = new Error("Unknown tool: get_thred");
    const ctx = errCtx({ tool: "get_thred", error: rawError });

    try {
      await normalizer.onToolError(ctx, async () => { throw rawError; });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(NormalizedError);
      const ne = err as NormalizedError;
      expect(ne.rule).toBe("unknown-tool");
      expect(ne.rawError).toBe(rawError);
      expect(ne.message).toContain("get_thread");
    }
  });

  it("passes through to next() for non-matching errors", async () => {
    const normalizer = new ErrorNormalizer();
    const rawError = new Error("Thread already converged");
    const ctx = errCtx({ tool: "create_thread_reply", error: rawError });

    let nextCalled = false;
    const result = await normalizer.onToolError(ctx, async () => {
      nextCalled = true;
      throw rawError;
    }).catch((e) => e);

    expect(nextCalled).toBe(true);
    expect(result).toBe(rawError); // re-thrown untouched
  });
});

describe("ErrorNormalizer — custom rules", () => {
  it("custom rules fire after built-ins", () => {
    const normalizer = new ErrorNormalizer({
      customRules: [
        {
          name: "my_domain_rule",
          apply: (ctx) =>
            ctx.tool === "my_tool" ? "custom hint for my_tool" : null,
        },
      ],
    });
    const result = normalizer.tryRewrite(
      errCtx({ tool: "my_tool", error: new Error("some obscure error") }),
    );
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("custom:my_domain_rule");
    expect(result!.message).toBe("custom hint for my_tool");
  });

  it("custom rule does not override built-in match", () => {
    const normalizer = new ErrorNormalizer({
      customRules: [
        {
          name: "override_attempt",
          apply: () => "custom took over",
        },
      ],
    });
    const result = normalizer.tryRewrite(
      errCtx({
        tool: "update_idea",
        args: { ideaId: "i-1", tags: ["x"] },
        error: new Error("Required at changes"),
      }),
    );
    expect(result!.rule).toBe("cascade-drift:update_idea");
  });
});

describe("ErrorNormalizer — .standard() integration", () => {
  it(".standard() composes ErrorNormalizer at position 5 (innermost)", async () => {
    const { CognitivePipeline } = await import("../src/pipeline.js");
    const p = CognitivePipeline.standard();
    const names = p.getMiddlewares().map((m) => m.name);
    expect(names.indexOf("ErrorNormalizer")).toBe(5);
    expect(names.length).toBe(6); // full Phase 1 middleware set
  });
});
