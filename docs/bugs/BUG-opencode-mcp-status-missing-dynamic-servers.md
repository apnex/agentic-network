# BUG: MCP.status() does not include dynamically-added servers from mcp.add()

**Repository:** [anomalyco/opencode](https://github.com/anomalyco/opencode)
**Status:** Not yet filed
**Labels:** `bug`
**Discovered:** 2026-04-12

---

## Description

MCP servers added dynamically via the SDK's `client.mcp.add()` method are fully functional (tools are available and callable) but do not appear in the TUI sidebar or in the `GET /mcp` status endpoint. This means plugins that register MCP servers at runtime have no visible presence in the UI despite working correctly.

## Steps to Reproduce

1. Create a plugin that dynamically registers an MCP server:
   ```typescript
   export const MyPlugin: Plugin = async (ctx) => {
     // Start a local MCP proxy server
     const port = startServer()

     // Register it with OpenCode
     await ctx.client.mcp.add({
       body: {
         name: "my-plugin",
         config: {
           type: "remote",
           url: `http://127.0.0.1:${port}/mcp`,
         },
       },
     })
     return {}
   }
   ```
2. Start OpenCode with the plugin loaded.
3. Verify the tools from `my-plugin` are available and callable (they are).
4. Check the TUI sidebar or run `/mcps` -- the server does not appear.
5. Call `client.mcp.status()` -- the server is not in the response.

## Expected Behavior

Dynamically-added MCP servers should appear in the TUI sidebar and `GET /mcp` status response, reflecting their actual connection status (e.g., `"connected"`).

## Root Cause

In [`packages/opencode/src/mcp/index.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/mcp/index.ts), the `status()` function only iterates over servers defined in the config file:

```typescript
const status = Effect.fn("MCP.status")(function* () {
  const s = yield* InstanceState.get(state)
  const cfg = yield* cfgSvc.get()
  const config = cfg.mcp ?? {}
  const result: Record<string, Status> = {}

  for (const [key, mcp] of Object.entries(config)) {
    if (!isMcpConfigured(mcp)) continue
    result[key] = s.status[key] ?? { status: "disabled" }
  }

  return result
})
```

The `add()` function correctly stores the server in `s.status` and `s.clients`, and the `tools()` function correctly reads from `s.clients` (which is why tools work). But `status()` filters through `cfg.mcp` only, dropping any server that was added at runtime via `mcp.add()`.

### Why tools work but status doesn't

| Function   | Data source     | Includes dynamic servers? |
| ---------- | --------------- | ------------------------- |
| `tools()`  | `s.clients`     | Yes                       |
| `add()`    | `s.status`      | Yes (returns full map)    |
| `status()` | `cfg.mcp` keys  | **No**                    |

The TUI sidebar calls `status()` to populate the MCP server list, so dynamically-added servers are invisible.

## Suggested Fix

After the config iteration loop in `status()`, include any servers present in `s.status` that aren't already in the result:

```typescript
const status = Effect.fn("MCP.status")(function* () {
  const s = yield* InstanceState.get(state)
  const cfg = yield* cfgSvc.get()
  const config = cfg.mcp ?? {}
  const result: Record<string, Status> = {}

  for (const [key, mcp] of Object.entries(config)) {
    if (!isMcpConfigured(mcp)) continue
    result[key] = s.status[key] ?? { status: "disabled" }
  }

  // Include dynamically-added servers not in config
  for (const [key, st] of Object.entries(s.status)) {
    if (!(key in result)) {
      result[key] = st
    }
  }

  return result
})
```

## Impact

This affects any plugin that uses `client.mcp.add()` to register MCP servers at runtime. The servers work correctly but are invisible in the TUI, which is confusing from a user experience perspective. Users have no way to see the connection status of plugin-managed MCP servers.

## Environment

- OpenCode version: latest (as of Apr 2026)
- OS: Linux
- Plugin SDK: `@opencode-ai/plugin`

## Context

Discovered while building a plugin that acts as an MCP proxy -- intercepting MCP calls and managing push notifications transparently. The proxy MCP server is fully functional (28 tools available and working) but does not appear in the TUI sidebar alongside statically-configured MCP servers.
