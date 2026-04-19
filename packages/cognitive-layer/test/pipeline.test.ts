/**
 * CognitivePipeline unit tests — chain-of-responsibility invariants.
 *
 * Pins INV-COG-1 (insertion-order layering), INV-COG-3 (errors
 * propagate via throw, not via next()), and the short-circuit
 * mechanism.
 */

import { describe, it, expect, vi } from "vitest";
import { CognitivePipeline } from "../src/pipeline.js";
import type {
  CognitiveMiddleware,
  ToolCallContext,
  ListToolsContext,
  ToolErrorContext,
  Tool,
} from "../src/contract.js";

function ctx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    tool: "get_thread",
    args: { threadId: "thread-1" },
    sessionId: "sess-1",
    startedAt: 0,
    tags: {},
    ...overrides,
  };
}

function listCtx(overrides: Partial<ListToolsContext> = {}): ListToolsContext {
  return {
    sessionId: "sess-1",
    startedAt: 0,
    tags: {},
    ...overrides,
  };
}

function errCtx(overrides: Partial<ToolErrorContext> = {}): ToolErrorContext {
  return {
    tool: "create_thread",
    args: {},
    sessionId: "sess-1",
    error: new Error("boom"),
    durationMs: 0,
    startedAt: 0,
    tags: {},
    ...overrides,
  };
}

describe("CognitivePipeline — tool-call phase", () => {
  it("invokes terminal when no middleware registered", async () => {
    const p = new CognitivePipeline();
    const terminal = vi.fn().mockResolvedValue("ok");
    const result = await p.runToolCall(ctx(), terminal);
    expect(result).toBe("ok");
    expect(terminal).toHaveBeenCalledTimes(1);
  });

  it("composes middlewares outer-to-inner per insertion order (INV-COG-1)", async () => {
    const order: string[] = [];
    const outer: CognitiveMiddleware = {
      name: "outer",
      async onToolCall(c, next) {
        order.push("outer-before");
        const r = await next(c);
        order.push("outer-after");
        return r;
      },
    };
    const middle: CognitiveMiddleware = {
      name: "middle",
      async onToolCall(c, next) {
        order.push("middle-before");
        const r = await next(c);
        order.push("middle-after");
        return r;
      },
    };
    const inner: CognitiveMiddleware = {
      name: "inner",
      async onToolCall(c, next) {
        order.push("inner-before");
        const r = await next(c);
        order.push("inner-after");
        return r;
      },
    };

    const p = new CognitivePipeline().use(outer).use(middle).use(inner);
    const terminal = async () => {
      order.push("terminal");
      return "done";
    };
    const result = await p.runToolCall(ctx(), terminal);

    expect(result).toBe("done");
    expect(order).toEqual([
      "outer-before",
      "middle-before",
      "inner-before",
      "terminal",
      "inner-after",
      "middle-after",
      "outer-after",
    ]);
  });

  it("short-circuit — middleware returns without next()", async () => {
    const shortCircuit: CognitiveMiddleware = {
      name: "shortCircuit",
      async onToolCall() {
        return "from-cache";
      },
    };
    const terminal = vi.fn().mockResolvedValue("from-hub");
    const p = new CognitivePipeline().use(shortCircuit);
    const result = await p.runToolCall(ctx(), terminal);
    expect(result).toBe("from-cache");
    expect(terminal).not.toHaveBeenCalled();
  });

  it("skips middlewares that don't implement onToolCall", async () => {
    const order: string[] = [];
    const listOnly: CognitiveMiddleware = {
      name: "listOnly",
      async onListTools(c, next) {
        return next(c);
      },
    };
    const callOnly: CognitiveMiddleware = {
      name: "callOnly",
      async onToolCall(c, next) {
        order.push("call-only");
        return next(c);
      },
    };
    const p = new CognitivePipeline().use(listOnly).use(callOnly);
    const terminal = async () => {
      order.push("terminal");
      return "ok";
    };
    await p.runToolCall(ctx(), terminal);
    expect(order).toEqual(["call-only", "terminal"]);
  });

  it("errors from terminal propagate as throws (INV-COG-3)", async () => {
    const err = new Error("terminal failed");
    const seen: string[] = [];
    const mw: CognitiveMiddleware = {
      name: "mw",
      async onToolCall(c, next) {
        try {
          return await next(c);
        } catch (e) {
          seen.push("caught");
          throw e;
        }
      },
    };
    const p = new CognitivePipeline().use(mw);
    await expect(p.runToolCall(ctx(), async () => { throw err; })).rejects.toBe(err);
    expect(seen).toEqual(["caught"]);
  });

  it("middleware can mutate args seen by downstream chain", async () => {
    const rewriter: CognitiveMiddleware = {
      name: "rewriter",
      async onToolCall(c, next) {
        c.args = { ...c.args, rewritten: true };
        return next(c);
      },
    };
    let observed: Record<string, unknown> | null = null;
    const terminal = async (c: ToolCallContext) => {
      observed = c.args;
      return null;
    };
    const p = new CognitivePipeline().use(rewriter);
    await p.runToolCall(ctx({ args: { threadId: "t" } }), terminal);
    expect(observed).toEqual({ threadId: "t", rewritten: true });
  });
});

describe("CognitivePipeline — list-tools phase", () => {
  it("returns terminal result unchanged when no middleware registered", async () => {
    const tools: Tool[] = [{ name: "get_thread" }];
    const p = new CognitivePipeline();
    const result = await p.runListTools(listCtx(), async () => tools);
    expect(result).toBe(tools);
  });

  it("middleware can decorate tool descriptions", async () => {
    const enricher: CognitiveMiddleware = {
      name: "enricher",
      async onListTools(c, next) {
        const tools = await next(c);
        return tools.map((t) => ({ ...t, description: `${t.description ?? ""} [ID]` }));
      },
    };
    const p = new CognitivePipeline().use(enricher);
    const result = await p.runListTools(listCtx(), async () => [{ name: "create_thread", description: "open thread" }]);
    expect(result[0].description).toBe("open thread [ID]");
  });
});

describe("CognitivePipeline — tool-error phase", () => {
  it("middleware can transform an error into a recovered result", async () => {
    const recover: CognitiveMiddleware = {
      name: "recover",
      async onToolError() {
        return { content: [{ type: "text", text: "recovered" }] };
      },
    };
    const p = new CognitivePipeline().use(recover);
    const result = await p.runToolError(errCtx(), async () => { throw new Error("unreachable"); });
    expect(result).toEqual({ content: [{ type: "text", text: "recovered" }] });
  });
});

describe("CognitivePipeline.standard() factory", () => {
  it("returns a pipeline containing CognitiveTelemetry (task-287 scope)", () => {
    const p = CognitivePipeline.standard();
    const names = p.getMiddlewares().map((m) => m.name);
    expect(names).toContain("CognitiveTelemetry");
  });

  it("accepts and forwards middleware configs", () => {
    const sink = vi.fn();
    const p = CognitivePipeline.standard({ telemetry: { sink } });
    // Grows with each Phase 1 checkpoint — asserting names not count so
    // the test stays stable across middleware additions.
    const names = p.getMiddlewares().map((m) => m.name);
    expect(names[0]).toBe("CognitiveTelemetry"); // outermost per ADR-018
  });

  it("independent instances are isolated", () => {
    const a = CognitivePipeline.standard();
    const b = CognitivePipeline.standard();
    expect(a).not.toBe(b);
    expect(a.getMiddlewares()[0]).not.toBe(b.getMiddlewares()[0]);
  });
});
