/**
 * PolicyRouter — Registry-based command router for Layer 7.
 *
 * Domain policies register their handlers during initialization.
 * The router dispatches tool calls, drains internal events, and
 * provides observability.
 */

import type { ZodType } from "zod";
import type { IPolicyContext, PolicyHandler, PolicyResult, DomainEvent } from "./types.js";

type RoleTag = "architect" | "engineer" | "any";

interface RegisteredTool {
  description: string;
  schema: Record<string, ZodType>;
  handler: PolicyHandler;
  deprecatedAlias?: string;
  roleTag: RoleTag;
}

/**
 * Parse the role tag from a tool description.
 * Looks for [Architect], [Engineer], or [Any] at the start.
 */
function parseRoleTag(description: string): RoleTag {
  if (description.startsWith("[Architect]")) return "architect";
  if (description.startsWith("[Engineer]")) return "engineer";
  return "any";
}

// Internal event handler type
type InternalEventHandler = (event: DomainEvent, ctx: IPolicyContext) => Promise<void>;

export class PolicyRouter {
  private tools = new Map<string, RegisteredTool>();
  private internalHandlers = new Map<string, InternalEventHandler[]>();
  private log: (msg: string) => void;

  constructor(logger?: (msg: string) => void) {
    this.log = logger || ((msg) => console.log(`[PolicyRouter] ${msg}`));
  }

  // ── Registration ──────────────────────────────────────────────────

  register(
    name: string,
    description: string,
    schema: Record<string, ZodType>,
    handler: PolicyHandler,
    deprecatedAlias?: string
  ): void {
    const roleTag = parseRoleTag(description);
    this.tools.set(name, { description, schema, handler, deprecatedAlias, roleTag });
  }

  /**
   * Register a deprecated alias that delegates to the canonical handler.
   */
  registerAlias(aliasName: string, canonicalName: string): void {
    const canonical = this.tools.get(canonicalName);
    if (!canonical) {
      throw new Error(`Cannot create alias '${aliasName}': canonical tool '${canonicalName}' not registered`);
    }
    this.tools.set(aliasName, {
      ...canonical,
      deprecatedAlias: canonicalName,
      roleTag: canonical.roleTag,
      handler: async (args, ctx) => {
        this.log(`[DEPRECATION] Tool '${aliasName}' invoked. Consumers must migrate to '${canonicalName}'.`);
        return canonical.handler(args, ctx);
      },
    });
  }

  /**
   * Register a handler for internal domain events.
   */
  onInternalEvent(eventType: string, handler: InternalEventHandler): void {
    const handlers = this.internalHandlers.get(eventType) || [];
    handlers.push(handler);
    this.internalHandlers.set(eventType, handlers);
  }

  // ── Execution ─────────────────────────────────────────────────────

  async handle(toolName: string, args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }],
        isError: true,
      };
    }

    // RBAC enforcement: resolve caller's role and check against tool's role tag
    const callerRole = ctx.stores.engineerRegistry.getRole(ctx.sessionId);
    if (tool.roleTag !== "any" && callerRole !== "unknown") {
      if (tool.roleTag !== callerRole) {
        this.log(`[RBAC] Rejected ${toolName}: requires [${tool.roleTag}], caller is [${callerRole}]`);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Authorization denied: tool '${toolName}' requires role '${tool.roleTag}', but caller is '${callerRole}'` }) }],
          isError: true,
        };
      }
    }

    const startTime = Date.now();
    let result: PolicyResult;
    let emittedCount = 0;
    let cascadeCount = 0;

    // Wrap ctx.emit to count emissions
    const originalEmit = ctx.emit;
    ctx.emit = async (event, data, roles) => {
      emittedCount++;
      return originalEmit(event, data, roles);
    };

    try {
      // Execute the primary handler
      result = await tool.handler(args, ctx);

      // Drain internal events synchronously
      let safety = 0;
      while (ctx.internalEvents.length > 0 && safety < 100) {
        const event = ctx.internalEvents.shift()!;
        try {
          await this.dispatchInternalEvent(event, ctx);
        } catch (cascadeErr) {
          this.log(`[CRITICAL] Cascade failure for ${event.type}: ${cascadeErr}`);
          // Emit cascade_failure notification but don't fail the primary request
          try {
            await ctx.emit("cascade_failure", {
              originalTool: toolName,
              failedEvent: event.type,
              error: String(cascadeErr),
            }, ["architect"]);
          } catch {
            // Best effort — don't let notification failure crash the request
          }
        }
        safety++;
      }
      cascadeCount = safety;

      if (safety >= 100) {
        this.log(`[WARN] Internal event drain hit safety limit (100 events) for tool ${toolName}`);
      }

    } catch (err) {
      const elapsed = Date.now() - startTime;
      this.log(`[ERROR] ${toolName} failed after ${elapsed}ms (role: ${ctx.role}): ${err}`);
      throw err;
    }

    // Observability
    const elapsed = Date.now() - startTime;
    this.log(`[EXEC] ${toolName} completed in ${elapsed}ms (role: ${ctx.role}, emitted: ${emittedCount}, cascades: ${cascadeCount})`);

    // Restore original emit
    ctx.emit = originalEmit;

    return result;
  }

  // ── Internal Event Dispatch ───────────────────────────────────────

  private async dispatchInternalEvent(event: DomainEvent, ctx: IPolicyContext): Promise<void> {
    const handlers = this.internalHandlers.get(event.type);
    if (!handlers || handlers.length === 0) {
      this.log(`[WARN] No handler registered for internal event: ${event.type}`);
      return;
    }
    for (const handler of handlers) {
      await handler(event, ctx);
    }
  }

  // ── Introspection ─────────────────────────────────────────────────

  /**
   * Get the list of registered tool names (excluding deprecated aliases).
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.entries())
      .filter(([_, t]) => !t.deprecatedAlias)
      .map(([name]) => name);
  }

  /**
   * Get all registered tool names including aliases.
   */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get the total number of registered tools.
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Check if a tool is registered.
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get a tool's registration for MCP binding.
   */
  getToolRegistration(toolName: string): RegisteredTool | undefined {
    return this.tools.get(toolName);
  }
}
