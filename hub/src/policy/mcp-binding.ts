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
/**
 * mission-75 v1.0 §3.3 — tier-annotation marker prepended to the
 * description for `tier: "adapter-internal"` tools. The shim-side
 * `list_tools` consumer (mcp-agent-client.ts:listTools) parses this
 * marker to filter adapter-internal-tier tools out of the LLM
 * catalogue surface. Hub remains passive (annotates only); shim is
 * the active filter. Interim solution per Design §3.3 v1.0 fold;
 * idea-240 Vision (agnostic-transport Adapter↔Hub) makes this filter
 * structurally unnecessary later (RPC methods replace MCP-tool surface
 * for adapter-internal calls).
 *
 * Marker is a description-prefix because the MCP `ToolAnnotations`
 * schema is a fixed-shape object (title/readOnlyHint/etc.) with no
 * extension surface — descriptions are the only string surface that
 * round-trips cleanly through the protocol.
 */
export const TIER_ANNOTATION_MARKER = "[tier:adapter-internal]";

export function bindRouterToMcp(
  server: McpServer,
  router: PolicyRouter,
  ctxFactory: PolicyContextFactory
): void {
  for (const toolName of router.getAllToolNames()) {
    const reg = router.getToolRegistration(toolName);
    if (!reg) continue;

    // mission-75 v1.0 §3.3 — prepend tier marker for adapter-internal
    // tools so shim-side list_tools filter can identify them.
    const description = reg.tier === "adapter-internal"
      ? `${TIER_ANNOTATION_MARKER} ${reg.description}`
      : reg.description;

    server.tool(
      toolName,
      description,
      reg.schema,
      async (args: Record<string, unknown>) => {
        const ctx = ctxFactory();
        return router.handle(toolName, args, ctx);
      }
    );
  }
}
