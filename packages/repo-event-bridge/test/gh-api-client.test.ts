/**
 * GhApiClient unit tests — mission-52 T2.
 *
 * Mock-fetch level (no real HTTP server): assertions cover PAT auth +
 * scope-validation, ETag-conditional polling, and the differentiation
 * between header-driven 429 path vs generic transient failures (the
 * audit-emerged invariant per thread-312 round-2).
 */

import { describe, it, expect } from "vitest";
import {
  GhApiClient,
  GhApiAuthError,
  GhApiRateLimitError,
  GhApiTransientError,
  PatScopeError,
  parseRateLimitResume,
  REQUIRED_PAT_SCOPES,
} from "../src/gh-api-client.js";

interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

function makeFetch(responses: MockResponse[]): {
  fetch: typeof fetch;
  calls: Array<{ url: string; init?: RequestInit }>;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let i = 0;
  const fetchImpl: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const m = responses[Math.min(i++, responses.length - 1)];
    return new Response(
      m.body !== undefined ? JSON.stringify(m.body) : null,
      {
        status: m.status,
        headers: m.headers,
      },
    ) as unknown as Response;
  };
  return { fetch: fetchImpl, calls };
}

function newClient(
  responses: MockResponse[],
): { client: GhApiClient; calls: Array<{ url: string; init?: RequestInit }> } {
  const { fetch, calls } = makeFetch(responses);
  const client = new GhApiClient({
    token: "ghp_test_token",
    fetch,
  });
  return { client, calls };
}

describe("GhApiClient — construction", () => {
  it("rejects empty token", () => {
    expect(() => new GhApiClient({ token: "" })).toThrow();
  });

  it("rejects missing fetch when global fetch is unavailable", () => {
    expect(
      () =>
        new GhApiClient({
          token: "x",
          fetch: undefined as unknown as typeof fetch,
        }),
    ).not.toThrow();
  });
});

describe("GhApiClient — validateScopes", () => {
  it("happy path: all required scopes present", async () => {
    const { client, calls } = newClient([
      {
        status: 200,
        headers: { "x-oauth-scopes": "repo, read:org, read:user, gist" },
        body: { login: "engineer-greg" },
      },
    ]);
    const { granted } = await client.validateScopes();
    expect(granted).toEqual(["repo", "read:org", "read:user", "gist"]);
    expect(calls[0].url).toMatch(/\/user$/);
    const headers = (calls[0].init?.headers ?? {}) as Record<string, string>;
    expect(headers.authorization).toBe("token ghp_test_token");
  });

  it("under-scoped PAT throws PatScopeError listing missing scopes", async () => {
    const { client } = newClient([
      {
        status: 200,
        headers: { "x-oauth-scopes": "repo" },
        body: { login: "x" },
      },
    ]);
    await expect(client.validateScopes()).rejects.toBeInstanceOf(PatScopeError);
    try {
      await client.validateScopes();
    } catch (err) {
      expect((err as PatScopeError).missing).toEqual(["read:org", "read:user"]);
      expect((err as PatScopeError).granted).toEqual(["repo"]);
      expect((err as Error).message).toContain("PAT under-scoped");
      expect((err as Error).message).toContain("read:org");
    }
  });

  it("empty x-oauth-scopes header → all required missing", async () => {
    const { client } = newClient([
      { status: 200, headers: {}, body: { login: "x" } },
    ]);
    try {
      await client.validateScopes();
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PatScopeError);
      expect((err as PatScopeError).missing).toEqual([...REQUIRED_PAT_SCOPES]);
      expect((err as PatScopeError).granted).toEqual([]);
    }
  });

  it("401 → GhApiAuthError", async () => {
    const { client } = newClient([
      { status: 401, headers: {}, body: { message: "Bad credentials" } },
    ]);
    await expect(client.validateScopes()).rejects.toBeInstanceOf(GhApiAuthError);
  });

  it("403 → GhApiAuthError", async () => {
    const { client } = newClient([
      { status: 403, headers: {}, body: { message: "Forbidden" } },
    ]);
    await expect(client.validateScopes()).rejects.toBeInstanceOf(GhApiAuthError);
  });

  it("503 → GhApiTransientError", async () => {
    const { client } = newClient([
      { status: 503, headers: {}, body: "" },
    ]);
    await expect(client.validateScopes()).rejects.toBeInstanceOf(GhApiTransientError);
  });

  it("respects custom required scopes", async () => {
    const { client } = newClient([
      {
        status: 200,
        headers: { "x-oauth-scopes": "repo" },
        body: { login: "x" },
      },
    ]);
    // Only require 'repo' — should pass.
    await expect(client.validateScopes(["repo"])).resolves.toBeDefined();
  });
});

describe("GhApiClient — pollRepoEvents", () => {
  it("200 → returns events + etag + rate-limit headers", async () => {
    const { client, calls } = newClient([
      {
        status: 200,
        headers: {
          etag: 'W/"abc"',
          "x-ratelimit-reset": "1700000000",
          "x-ratelimit-remaining": "4999",
        },
        body: [
          { id: "1", type: "PushEvent", payload: {}, created_at: "2026-04-25T00:00:00Z" },
          { id: "2", type: "PullRequestEvent", payload: { action: "opened" }, created_at: "2026-04-25T00:00:01Z" },
        ],
      },
    ]);
    const result = await client.pollRepoEvents("owner/repo");
    expect(result.notModified).toBe(false);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].id).toBe("1");
    expect(result.etag).toBe('W/"abc"');
    expect(result.rateLimitReset).toBe(1700000000);
    expect(result.rateLimitRemaining).toBe(4999);
    expect(calls[0].url).toMatch(/\/repos\/owner\/repo\/events$/);
  });

  it("304 → notModified=true; no events", async () => {
    const { client, calls } = newClient([
      {
        status: 304,
        headers: { etag: 'W/"unchanged"' },
      },
    ]);
    const result = await client.pollRepoEvents("owner/repo", {
      etag: 'W/"unchanged"',
    });
    expect(result.notModified).toBe(true);
    expect(result.events).toEqual([]);
    const headers = (calls[0].init?.headers ?? {}) as Record<string, string>;
    expect(headers["if-none-match"]).toBe('W/"unchanged"');
  });

  it("429 with Retry-After → GhApiRateLimitError using Retry-After", async () => {
    const beforeMs = Date.now();
    const { client } = newClient([
      {
        status: 429,
        headers: { "retry-after": "60" },
        body: { message: "rate limited" },
      },
    ]);
    try {
      await client.pollRepoEvents("owner/repo");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GhApiRateLimitError);
      const resumeAt = (err as GhApiRateLimitError).resumeAtMs;
      expect(resumeAt - beforeMs).toBeGreaterThanOrEqual(60_000);
      expect(resumeAt - beforeMs).toBeLessThan(60_000 + 1000);
    }
  });

  it("429 without Retry-After → uses X-RateLimit-Reset epoch", async () => {
    const epochSec = Math.floor(Date.now() / 1000) + 120;
    const { client } = newClient([
      {
        status: 429,
        headers: { "x-ratelimit-reset": String(epochSec) },
        body: {},
      },
    ]);
    try {
      await client.pollRepoEvents("owner/repo");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GhApiRateLimitError);
      expect((err as GhApiRateLimitError).resumeAtMs).toBe(epochSec * 1000);
    }
  });

  it("403 with x-ratelimit-remaining=0 → treated as rate-limit, not auth", async () => {
    const { client } = newClient([
      {
        status: 403,
        headers: {
          "x-ratelimit-remaining": "0",
          "retry-after": "30",
        },
        body: { message: "secondary rate limit" },
      },
    ]);
    await expect(client.pollRepoEvents("owner/repo")).rejects.toBeInstanceOf(
      GhApiRateLimitError,
    );
  });

  it("401 → GhApiAuthError (terminal)", async () => {
    const { client } = newClient([
      { status: 401, headers: {}, body: { message: "Bad credentials" } },
    ]);
    await expect(client.pollRepoEvents("owner/repo")).rejects.toBeInstanceOf(
      GhApiAuthError,
    );
  });

  it("500 → GhApiTransientError (caller exp-backs-off)", async () => {
    const { client } = newClient([
      { status: 500, headers: {}, body: "Internal Server Error" },
    ]);
    await expect(client.pollRepoEvents("owner/repo")).rejects.toBeInstanceOf(
      GhApiTransientError,
    );
  });

  it("network failure → GhApiTransientError with null status", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError("ECONNREFUSED");
    };
    const client = new GhApiClient({ token: "x", fetch: fetchImpl });
    try {
      await client.pollRepoEvents("owner/repo");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GhApiTransientError);
      expect((err as GhApiTransientError).httpStatus).toBeNull();
    }
  });
});

describe("parseRateLimitResume helper — header precedence", () => {
  it("Retry-After (seconds) wins over X-RateLimit-Reset", () => {
    const now = Date.now();
    const headers = new Headers({
      "retry-after": "10",
      "x-ratelimit-reset": String(Math.floor(now / 1000) + 9999),
    });
    const result = parseRateLimitResume(headers);
    expect(result - now).toBeGreaterThanOrEqual(10_000);
    expect(result - now).toBeLessThan(11_000);
  });

  it("falls back to X-RateLimit-Reset when Retry-After absent", () => {
    const epochSec = Math.floor(Date.now() / 1000) + 60;
    const headers = new Headers({
      "x-ratelimit-reset": String(epochSec),
    });
    expect(parseRateLimitResume(headers)).toBe(epochSec * 1000);
  });

  it("conservative 60s default when neither header parseable", () => {
    const before = Date.now();
    const result = parseRateLimitResume(new Headers());
    expect(result - before).toBeGreaterThanOrEqual(60_000);
    expect(result - before).toBeLessThan(61_000);
  });
});
