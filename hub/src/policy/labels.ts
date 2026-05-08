/**
 * Mission-19: caller-labels resolver.
 * Returns the Agent.labels for the session bound to ctx, or {} if the
 * session has not yet completed the M18 handshake (legacy `register_role`).
 */

import type { IPolicyContext } from "./types.js";

export async function callerLabels(ctx: IPolicyContext): Promise<Record<string, string>> {
  const agent = await ctx.stores.engineerRegistry.getAgentForSession(ctx.sessionId);
  return agent?.labels ?? {};
}

/**
 * bug-58: scope-class label allowlist for selector-matchLabels derivation.
 *
 * Director-ratified at thread-505: only `env` labels auto-inherit as
 * broadcast/multicast matchLabels filter; identity-class labels (e.g.,
 * `ois.io/github/login`) and custom-class labels (`team`, etc.) are NOT
 * delivery filters — they're filing/auditing properties.
 *
 * Auto-copy of all caller labels into selector matchLabels narrows
 * broadcast pools to creator's own tenant, silently dropping cross-
 * tenant dispatch (bug-58 surface; mission-of-missions Phase 4 stall).
 *
 * Use `scopeLabels(allLabels)` at any selector-derivation site that
 * inherits labels from a thread/entity. Unicast / agentIds-pinpoint
 * dispatches should NOT use matchLabels at all (per bug-18) — this
 * helper is specifically for pool-discovery selectors.
 */
const SCOPE_LABEL_KEYS = ["env"] as const;

export function scopeLabels(allLabels: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SCOPE_LABEL_KEYS) {
    if (key in allLabels) out[key] = allLabels[key];
  }
  return out;
}
