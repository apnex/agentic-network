/**
 * MCP Binding Layer — Bridges PolicyRouter (Layer 7) to MCP Transport (Layer 4).
 *
 * This adapter iterates all tools registered on the PolicyRouter and
 * creates matching `server.tool()` registrations on the MCP server.
 * A `ctxFactory` closure is called per-request to build a fresh
 * IPolicyContext with the connection-scoped sessionId, clientIp, and emit.
 *
 * Architectural invariants:
 *   - PolicyRouter is a stateless singleton (shared across all sessions)
 *   - ctxFactory captures per-connection state (sessionId, clientIp, notifyEvent)
 *   - Each handler invocation gets a fresh IPolicyContext
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PolicyRouter } from "./router.js";
import type { IPolicyContext } from "./types.js";

/**
 * Factory function that creates a fresh IPolicyContext per tool invocation.
 * Captures connection-scoped values (sessionId, clientIp, notifyEvent)
 * from the createMcpServer closure.
 */
export type PolicyContextFactory = () => IPolicyContext;

/**
 * Bind all tools registered on a PolicyRouter to an MCP server instance.
 *
 * Called once per MCP session (inside the CreateMcpServerFn factory).
 * The router is shared across all sessions; the ctxFactory is unique
 * to each session and provides per-request context.
 */
export function bindRouterToMcp(
  server: McpServer,
  router: PolicyRouter,
  ctxFactory: PolicyContextFactory
): void {
  for (const toolName of router.getAllToolNames()) {
    const reg = router.getToolRegistration(toolName);
    if (!reg) continue;

    server.tool(
      toolName,
      reg.description,
      reg.schema,
      async (args: Record<string, unknown>) => {
        const ctx = ctxFactory();
        return router.handle(toolName, args, ctx);
      }
    );
  }
}
