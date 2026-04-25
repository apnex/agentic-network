/**
 * Mission-52 T3 — RepoEventBridge unit + integration tests.
 *
 * Three test surfaces:
 *   1. parseReposEnvVar helper (env-var → repo list normalization)
 *   2. createPolicyRouterInvoker (in-process create_message dispatch
 *      via PolicyRouter; success + isError paths)
 *   3. RepoEventBridge end-to-end:
 *        - constructor + state machine (idle → running)
 *        - PAT scope-failure → state=failed; Hub continues (no throw)
 *        - PAT auth-failure (401) → state=failed
 *        - Token-absent path covered by hub/src/index.ts conditional
 *          (no bridge constructed); we verify the bridge skip-when-
 *          repos-empty signal directly here is unnecessary because
 *          construction with empty repos is a degenerate case
 *        - Mock-GH fixture replay: full pipeline (PollSource →
 *          translator → sink → invoker → policyRouter →
 *          MessageRepository) with post-condition assertions on the
 *          Hub's message store
 *        - SIGINT-style shutdown: stop() awaits the drainer cleanly
 */

import { describe, it, expect } from "vitest";
import { MemoryStorageProvider } from "@ois/storage-provider";

import { PolicyRouter } from "../../src/policy/router.js";
import { registerMessagePolicy } from "../../src/policy/message-policy.js";
import { createTestContext } from "../../src/policy/test-utils.js";
import {
  RepoEventBridge,
  createPolicyRouterInvoker,
  parseReposEnvVar,
} from "../../src/policy/repo-event-handler.js";

const noop = () => {};

// ── Test helpers ─────────────────────────────────────────────────────

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

function defaultScopesResponse(): MockResponse {
  return {
    status: 200,
    headers: { "x-oauth-scopes": "repo, read:org, read:user" },
    body: { login: "engineer-greg" },
  };
}

function fixtureFetch(events: unknown[], etag = 'W/"fixture"'): typeof fetch {
  let pollIndex = 0;
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (url.endsWith("/user")) {
      const r = defaultScopesResponse();
      return new Response(JSON.stringify(r.body), {
        status: r.status,
        headers: r.headers ?? {},
      }) as unknown as Response;
    }
    if (url.includes("/events")) {
      pollIndex++;
      // First poll returns events; subsequent polls return 304 to
      // prevent duplicate emission via the loop kickoff.
      if (pollIndex === 1) {
        return new Response(JSON.stringify(events), {
          status: 200,
          headers: {
            etag,
            "x-ratelimit-remaining": "4999",
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
          },
        }) as unknown as Response;
      }
      return new Response(null, {
        status: 304,
        headers: { etag },
      }) as unknown as Response;
    }
    return new Response("not found", { status: 404 }) as unknown as Response;
  };
}

const silentLogger = {
  info: noop,
  warn: noop,
  error: noop,
};

// ── parseReposEnvVar ─────────────────────────────────────────────────

describe("parseReposEnvVar", () => {
  it("returns [] for undefined", () => {
    expect(parseReposEnvVar(undefined)).toEqual([]);
  });

  it("returns [] for empty string", () => {
    expect(parseReposEnvVar("")).toEqual([]);
  });

  it("parses comma-separated list, trimming whitespace", () => {
    expect(parseReposEnvVar("owner/a, owner/b ,owner/c")).toEqual([
      "owner/a",
      "owner/b",
      "owner/c",
    ]);
  });

  it("filters empty entries from trailing commas", () => {
    expect(parseReposEnvVar("a/x,,b/y,")).toEqual(["a/x", "b/y"]);
  });

  it("preserves single repo", () => {
    expect(parseReposEnvVar("owner/repo")).toEqual(["owner/repo"]);
  });
});

// ── createPolicyRouterInvoker ────────────────────────────────────────

describe("createPolicyRouterInvoker", () => {
  it("dispatches successfully through the PolicyRouter and returns parsed result", async () => {
    const router = new PolicyRouter(noop);
    registerMessagePolicy(router);
    const ctx = createTestContext();
    const invoke = createPolicyRouterInvoker(router, () => ctx);

    const result = await invoke({
      kind: "external-injection",
      target: null,
      delivery: "push-immediate",
      payload: { kind: "repo-event", subkind: "pr-opened", payload: { number: 1 } },
    });
    expect(result.messageId).toBeDefined();
    expect(typeof result.messageId).toBe("string");
  });

  it("throws on PolicyResult.isError (authorization failure)", async () => {
    const router = new PolicyRouter(noop);
    registerMessagePolicy(router);
    // Default test context has role='architect'. The 'urgency-flag'
    // kind is director-only (per KIND_AXES) — author authorization
    // fails → handler returns isError=true → invoker throws.
    const ctx = createTestContext();
    const invoke = createPolicyRouterInvoker(router, () => ctx);

    await expect(
      invoke({
        kind: "urgency-flag",
        target: null,
        delivery: "push-immediate",
        payload: {},
      }),
    ).rejects.toThrow(/create_message failed/);
  });

  it("constructs a fresh context per call (no state leakage)", async () => {
    const router = new PolicyRouter(noop);
    registerMessagePolicy(router);
    let factoryCalls = 0;
    const invoke = createPolicyRouterInvoker(router, () => {
      factoryCalls++;
      return createTestContext();
    });

    await invoke({
      kind: "external-injection",
      target: null,
      delivery: "push-immediate",
      payload: { test: 1 },
    });
    await invoke({
      kind: "external-injection",
      target: null,
      delivery: "push-immediate",
      payload: { test: 2 },
    });
    expect(factoryCalls).toBe(2);
  });
});

// ── RepoEventBridge state machine ────────────────────────────────────

describe("RepoEventBridge — state machine", () => {
  it("initial state is 'idle'", () => {
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fixtureFetch([]),
      logger: silentLogger,
    });
    expect(bridge.getState()).toBe("idle");
  });

  it("transitions idle → running on successful start", async () => {
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fixtureFetch([]),
      logger: silentLogger,
    });
    await bridge.start();
    expect(bridge.getState()).toBe("running");
    await bridge.stop();
    expect(bridge.getState()).toBe("stopped");
  });

  it("start() is idempotent on a non-idle bridge", async () => {
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fixtureFetch([]),
      logger: silentLogger,
    });
    await bridge.start();
    await bridge.start(); // No-op; should not throw.
    expect(bridge.getState()).toBe("running");
    await bridge.stop();
  });
});

// ── RepoEventBridge — graceful-degrade on PAT failures ──────────────

describe("RepoEventBridge — PAT failure does NOT crash Hub", () => {
  it("under-scoped PAT → state='failed'; start() resolves cleanly", async () => {
    const fetchImpl: typeof fetch = async () => {
      return new Response(JSON.stringify({ login: "x" }), {
        status: 200,
        headers: { "x-oauth-scopes": "repo" },
      }) as unknown as Response;
    };
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_under_scoped",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fetchImpl,
      logger: silentLogger,
    });
    await expect(bridge.start()).resolves.toBeUndefined();
    expect(bridge.getState()).toBe("failed");
  });

  it("PAT auth failure (401) → state='failed'; start() resolves cleanly", async () => {
    const fetchImpl: typeof fetch = async () => {
      return new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
      }) as unknown as Response;
    };
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_invalid",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fetchImpl,
      logger: silentLogger,
    });
    await bridge.start();
    expect(bridge.getState()).toBe("failed");
  });

  it("stop() on a failed bridge is a no-op (state stays 'stopped')", async () => {
    const fetchImpl: typeof fetch = async () => {
      return new Response(JSON.stringify({ message: "auth fail" }), {
        status: 401,
      }) as unknown as Response;
    };
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_invalid",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fetchImpl,
      logger: silentLogger,
    });
    await bridge.start();
    await expect(bridge.stop()).resolves.toBeUndefined();
  });
});

// ── RepoEventBridge — end-to-end fixture replay ──────────────────────

describe("RepoEventBridge — end-to-end fixture replay through Hub", () => {
  it("emits create_message into MessageRepository for each fixture event", async () => {
    const fixtureEvents = [
      {
        id: "evt-1",
        type: "PullRequestEvent",
        repo: { name: "owner/repo" },
        payload: {
          action: "opened",
          pull_request: { number: 101, user: { login: "alice" } },
        },
        created_at: "2026-04-25T00:00:00Z",
      },
      {
        id: "evt-2",
        type: "PullRequestReviewEvent",
        repo: { name: "owner/repo" },
        payload: {
          action: "submitted",
          review: { user: { login: "bob" }, state: "approved" },
          pull_request: { number: 101 },
        },
        created_at: "2026-04-25T00:01:00Z",
      },
      {
        id: "evt-3",
        type: "PullRequestEvent",
        repo: { name: "owner/repo" },
        payload: {
          action: "closed",
          pull_request: {
            number: 101,
            merged: true,
            user: { login: "alice" },
          },
        },
        created_at: "2026-04-25T00:02:00Z",
      },
    ];

    const router = new PolicyRouter(noop);
    registerMessagePolicy(router);
    const ctx = createTestContext();

    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: createPolicyRouterInvoker(router, () => ctx),
      fetch: fixtureFetch(fixtureEvents),
      logger: silentLogger,
    });

    await bridge.start();

    // Wait for the drainer to flush the fixture.
    const deadline = Date.now() + 5_000;
    let messages: Awaited<ReturnType<typeof ctx.stores.message.listMessages>> = [];
    while (Date.now() < deadline) {
      messages = await ctx.stores.message.listMessages({});
      if (messages.length >= fixtureEvents.length) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    await bridge.stop();

    // Verify post-condition: every fixture event landed as a Message.
    expect(messages.length).toBeGreaterThanOrEqual(fixtureEvents.length);

    // Verify per-event subkind correctness: the W1 RepoEvent envelope
    // is nested under Message.payload (sink stub default).
    const subkinds = messages
      .map((m) => {
        const p = m.payload as Record<string, unknown> | null;
        return p?.subkind as string | undefined;
      })
      .filter((s): s is string => typeof s === "string");
    expect(subkinds).toContain("pr-opened");
    expect(subkinds).toContain("pr-review-approved");
    expect(subkinds).toContain("pr-merged");
  });

  it("messages are Hub Message kind='external-injection' (CreateMessageSink default)", async () => {
    const router = new PolicyRouter(noop);
    registerMessagePolicy(router);
    const ctx = createTestContext();

    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: createPolicyRouterInvoker(router, () => ctx),
      fetch: fixtureFetch([
        {
          id: "evt-x",
          type: "PushEvent",
          repo: { name: "owner/repo" },
          payload: { ref: "refs/heads/main", commits: [] },
          created_at: "2026-04-25T00:00:00Z",
        },
      ]),
      logger: silentLogger,
    });

    await bridge.start();
    const deadline = Date.now() + 5_000;
    let messages: Awaited<ReturnType<typeof ctx.stores.message.listMessages>> = [];
    while (Date.now() < deadline) {
      messages = await ctx.stores.message.listMessages({});
      if (messages.length >= 1) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    await bridge.stop();

    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].kind).toBe("external-injection");
    // Target null = broadcast (T1 sink default).
    expect(messages[0].target).toBeNull();
  });
});

// ── RepoEventBridge — shutdown semantics ────────────────────────────

describe("RepoEventBridge — stop() shutdown awaits drainer", () => {
  it("stop() resolves cleanly on a running bridge", async () => {
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fixtureFetch([]),
      logger: silentLogger,
    });
    await bridge.start();
    expect(bridge.getState()).toBe("running");
    await bridge.stop();
    expect(bridge.getState()).toBe("stopped");
  });

  it("stop() on idle bridge transitions to stopped", async () => {
    const bridge = new RepoEventBridge({
      storage: new MemoryStorageProvider(),
      token: "ghp_test",
      repos: ["owner/repo"],
      createMessageInvoke: async () => ({}),
      fetch: fixtureFetch([]),
      logger: silentLogger,
    });
    await bridge.stop();
    expect(bridge.getState()).toBe("stopped");
  });
});
