/**
 * mission-75 (M-TTL-Liveliness-Design) v1.0 §3.3 — `transport_heartbeat`
 * MCP tool handler.
 *
 * Fired by the network-adapter substrate's poll-backstop second 30s timer
 * (W4/9). Lightweight no-payload — the call itself is the heartbeat.
 * Handler invokes existing `refreshHeartbeat(agent.id)` to bump
 * `lastHeartbeatAt`; the post-bump hook (W2/9) eagerly recomputes
 * `transportTTL` + `transportState`.
 *
 * Critical invariant (Design §3.3 v0.3):
 *
 *   This handler MUST NOT bump `lastSeenAt` (would collapse cognitive-vs-
 *   transport semantic separation). The dispatcher-entry cognitive-bump
 *   gate (`shouldTouchAgent` in hub-networking.ts) consults the tool's
 *   tier — `adapter-internal` here — and skips the standard `touchAgent`
 *   invocation. THIS handler likewise must not invoke `touchAgent`
 *   directly, only `refreshHeartbeat`.
 *
 * Tier annotation (Design §3.3 v1.0 fold):
 *
 *   Registered with `tier: "adapter-internal"`; the shim-side
 *   `list_tools` filter (W5/9) excludes this tool from the LLM-exposed
 *   catalogue. Interim solution; idea-240 Vision (agnostic-transport)
 *   makes the filter structurally unnecessary later.
 */

import type { IPolicyContext, PolicyResult } from "../policy/types.js";
import type { PolicyRouter } from "../policy/router.js";

export async function transportHeartbeat(
  _args: Record<string, unknown>,
  ctx: IPolicyContext,
): Promise<PolicyResult> {
  const agent = await ctx.stores.engineerRegistry.getAgentForSession(ctx.sessionId);
  if (!agent) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          ok: false,
          error: "no agent bound to session — register_role first",
        }),
      }],
      isError: true,
    };
  }

  // Touch only `lastHeartbeatAt` (NOT `lastSeenAt`) per §3.3 critical
  // invariant. The post-bump hook (W2/9) inside refreshHeartbeat
  // recomputes transportTTL + transportState alongside.
  await ctx.stores.engineerRegistry.refreshHeartbeat(agent.id);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        ok: true,
        agentId: agent.id,
        heartbeatAt: new Date().toISOString(),
      }),
    }],
  };
}

/**
 * Register the `transport_heartbeat` MCP tool on the PolicyRouter with
 * `tier: "adapter-internal"` annotation. Hub remains passive about
 * LLM-surface (annotates only); the shim-side `list_tools` filter
 * (W5/9) excludes adapter-internal tier from the LLM catalogue.
 */
export function registerTransportHeartbeatPolicy(router: PolicyRouter): void {
  router.register(
    "transport_heartbeat",
    "[Any] mission-75 v1.0 §3.3 — adapter-internal periodic transport-liveness signal. Invoked by network-adapter's poll-backstop second 30s timer (NOT by LLMs). Bumps the caller's `lastHeartbeatAt` (NOT `lastSeenAt`) so cognitive-vs-transport semantic separation is preserved per the §3.3 critical invariant (cognitiveState=alive requires LLM doing meaningful work, not adapter-side polling). Returns `{ok, agentId, heartbeatAt}`. Excluded from the LLM-exposed tool catalogue via shim-side tier filter (`tier: \"adapter-internal\"`).",
    {},
    transportHeartbeat,
    undefined,  // no deprecated alias
    "adapter-internal",  // §3.3 v1.0 fold tier annotation
  );
}

