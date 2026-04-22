/**
 * Dispatcher integration tests for the T4 cache fallback in ListTools.
 *
 * Pins the load-bearing T4 contracts at the dispatcher layer:
 *   - cached-catalog served when identityReady unresolved + cache valid
 *   - bootstrap-on-cache-miss falls through to live agent.listTools
 *   - cache stale (Hub version mismatch) → re-bootstrap
 *   - identityReady resolved → live path (cache fallback skipped)
 *   - persistCatalog hook called on live fetch
 *   - persistCatalog hook NEVER throws even when caller's persist throws
 *   - all-T4-callbacks-omitted = T3 behavior preserved (back-compat)
 */

import { describe, it, expect, vi } from "vitest";
import type { McpAgentClient } from "@ois/network-adapter";
import { createDispatcher } from "../src/dispatcher.js";
import { CATALOG_SCHEMA_VERSION, type CachedCatalog } from "../src/tool-catalog-cache.js";

function fakeAgent(): McpAgentClient {
  return {
    call: vi.fn().mockResolvedValue("ok"),
    getTransport: vi.fn().mockReturnValue({ listToolsRaw: vi.fn().mockResolvedValue([]) }),
    setCallbacks: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  } as unknown as McpAgentClient;
}

function makeListToolsHandler(opts: Parameters<typeof createDispatcher>[0]) {
  const dispatcher = createDispatcher(opts);
  const handlers = (dispatcher.server as unknown as { _requestHandlers: Map<string, (req: unknown) => Promise<unknown>> })._requestHandlers;
  const handler = handlers.get("tools/list");
  if (!handler) throw new Error("tools/list handler not registered");
  return { handler, dispatcher };
}

const LIVE_CATALOG = [{ name: "live_tool", description: "[Any] live" }];
const CACHED_CATALOG = [{ name: "cached_tool", description: "[Any] from cache" }];
const CACHED: CachedCatalog = {
  schemaVersion: CATALOG_SCHEMA_VERSION,
  hubVersion: "1.0.0",
  fetchedAt: "2026-04-22T05:00:00.000Z",
  catalog: CACHED_CATALOG,
};

describe("dispatcher T4 cache fallback — ListTools", () => {
  it("serves from cache when identityReady unresolved AND cache valid", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);
    const log: string[] = [];

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      log: (m) => log.push(m),
      getCachedCatalog: () => CACHED,
      getIsIdentityReady: () => false,    // probe scenario
      getCurrentHubVersion: () => "1.0.0", // matches cache
      persistCatalog: vi.fn(),
    });

    const result = await handler({ method: "tools/list", params: {} });
    expect(result).toEqual({ tools: CACHED_CATALOG });
    // Live fetch NOT called.
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).not.toHaveBeenCalled();
    expect(log.some((l) => l.includes("served from cache"))).toBe(true);
  });

  it("bootstraps from Hub when identityReady unresolved AND no cache (fresh install)", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);
    const persist = vi.fn();
    const log: string[] = [];
    let identityReadyResolved = false;

    // Bootstrap also requires the identityReady gate to eventually resolve
    // (the ListTools handler awaits handshakeComplete after the cache miss).
    let resolveHandshake!: () => void;
    const handshakeComplete = new Promise<void>((res) => { resolveHandshake = res; });
    handshakeComplete.then(() => { identityReadyResolved = true; });

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      log: (m) => log.push(m),
      handshakeComplete,
      getCachedCatalog: () => null,                       // fresh install
      getIsIdentityReady: () => identityReadyResolved,
      getCurrentHubVersion: () => "1.0.0",
      persistCatalog: persist,
    });

    // Resolve handshake after a tick so the handler can wait + then proceed.
    queueMicrotask(() => resolveHandshake());
    const result = await handler({ method: "tools/list", params: {} });

    expect(result).toEqual({ tools: LIVE_CATALOG });
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).toHaveBeenCalledOnce();
    expect(persist).toHaveBeenCalledWith(LIVE_CATALOG);
    expect(log.some((l) => l.includes("no cache"))).toBe(true);
  });

  it("re-bootstraps when cache is stale (Hub version mismatch)", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);
    const persist = vi.fn();
    const log: string[] = [];

    let resolveHandshake!: () => void;
    const handshakeComplete = new Promise<void>((res) => { resolveHandshake = res; });

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      log: (m) => log.push(m),
      handshakeComplete,
      getCachedCatalog: () => CACHED,             // hubVersion=1.0.0
      getIsIdentityReady: () => false,
      getCurrentHubVersion: () => "2.0.0",        // current is newer → stale
      persistCatalog: persist,
    });

    queueMicrotask(() => resolveHandshake());
    const result = await handler({ method: "tools/list", params: {} });

    expect(result).toEqual({ tools: LIVE_CATALOG });
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).toHaveBeenCalledOnce();
    expect(persist).toHaveBeenCalledWith(LIVE_CATALOG);
    expect(log.some((l) => l.includes("cache stale") && l.includes("1.0.0") && l.includes("2.0.0"))).toBe(true);
  });

  it("cached path skipped when identityReady is resolved (live session — always live fetch)", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);
    const persist = vi.fn();

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      handshakeComplete: Promise.resolve(),       // already resolved
      getCachedCatalog: () => CACHED,             // cache exists
      getIsIdentityReady: () => true,             // identity ready → skip cache fallback
      getCurrentHubVersion: () => "1.0.0",
      persistCatalog: persist,
    });

    const result = await handler({ method: "tools/list", params: {} });
    expect(result).toEqual({ tools: LIVE_CATALOG });
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).toHaveBeenCalledOnce();
    expect(persist).toHaveBeenCalledWith(LIVE_CATALOG);  // live path still persists for next time
  });

  it("persistCatalog throwing does NOT propagate as a ListTools error (best-effort)", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);
    const log: string[] = [];

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      log: (m) => log.push(m),
      handshakeComplete: Promise.resolve(),
      getCachedCatalog: () => null,
      getIsIdentityReady: () => true,
      getCurrentHubVersion: () => "1.0.0",
      persistCatalog: () => { throw new Error("disk full"); },
    });

    const result = await handler({ method: "tools/list", params: {} });
    expect(result).toEqual({ tools: LIVE_CATALOG });   // primary response unaffected
    expect(log.some((l) => l.includes("persistCatalog hook threw"))).toBe(true);
  });

  it("trusts cache (probe-friendly) when currentHubVersion is null — fast probe path preserved", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn();
    const log: string[] = [];

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      log: (m) => log.push(m),
      getCachedCatalog: () => CACHED,
      getIsIdentityReady: () => false,
      getCurrentHubVersion: () => null,    // /health fetch in flight
      persistCatalog: vi.fn(),
    });

    const result = await handler({ method: "tools/list", params: {} });
    expect(result).toEqual({ tools: CACHED_CATALOG });
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).not.toHaveBeenCalled();
  });

  it("legacy / no-T4-callbacks: ListTools falls back to T3 behavior (live fetch only)", async () => {
    const agent = fakeAgent();
    (agent as unknown as { listTools: () => Promise<unknown[]> }).listTools = vi.fn().mockResolvedValue(LIVE_CATALOG);

    const { handler } = makeListToolsHandler({
      agent,
      proxyVersion: "test-1.0.0",
      handshakeComplete: Promise.resolve(),
      // No T4 callbacks — back-compat with all existing tests.
    });

    const result = await handler({ method: "tools/list", params: {} });
    expect(result).toEqual({ tools: LIVE_CATALOG });
    expect((agent as unknown as { listTools: ReturnType<typeof vi.fn> }).listTools).toHaveBeenCalledOnce();
  });
});
