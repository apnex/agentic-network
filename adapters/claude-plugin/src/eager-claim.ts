/**
 * eager-claim.ts — M-Session-Claim-Separation (mission-40) T3 helpers.
 *
 * Extracted from shim.ts main()'s onHandshakeComplete callback for unit
 * testability. Two pure helpers:
 *
 *   - isEagerWarmupEnabled(env): determines whether the OIS_EAGER_SESSION_CLAIM
 *     env hint is set (declarative "I'm a real session" intent expression
 *     per T3 brief §3 + HC #2).
 *
 *   - parseClaimSessionResponse(wrapper): defensively unwraps the MCP tool-call
 *     response shape and extracts engineerId / sessionEpoch / sessionClaimed
 *     / displacedPriorSession. Per HC #1, takeover detection MUST key on
 *     sessionClaimed + displacedPriorSession from this response, NOT on
 *     epoch delta against any prior register_role response.
 */

export interface ClaimSessionParsed {
  engineerId?: string;
  sessionEpoch?: number;
  sessionClaimed?: boolean;
  displacedPriorSession?: { sessionId: string; epoch: number };
}

/**
 * Returns true when OIS_EAGER_SESSION_CLAIM is set to the literal string "1".
 * Any other value (unset, "0", "true", "false", whitespace, etc.) is treated
 * as lazy-mode. Kept strict so a typo doesn't accidentally land on eager mode.
 */
export function isEagerWarmupEnabled(env: NodeJS.ProcessEnv | Record<string, string | undefined>): boolean {
  return env.OIS_EAGER_SESSION_CLAIM === "1";
}

/**
 * Defensively parse the claim_session MCP tool-call response. Handles three
 * wrapper shapes seen in the wild:
 *   - string (JSON-encoded payload)
 *   - { content: [{ text: JSON_STRING }] } (canonical MCP tool-call result)
 *   - already-parsed object
 * Returns an empty object on any parse failure (callers fall back to
 * "unknown" / "none" when emitting the [Handshake] log line).
 */
export function parseClaimSessionResponse(wrapper: unknown): ClaimSessionParsed {
  if (wrapper === null || wrapper === undefined) return {};
  try {
    if (typeof wrapper === "string") {
      const out = JSON.parse(wrapper);
      return typeof out === "object" && out !== null ? (out as ClaimSessionParsed) : {};
    }
    if (typeof wrapper === "object") {
      const w = wrapper as { content?: Array<{ text?: string }> };
      if (Array.isArray(w.content) && w.content[0]?.text && typeof w.content[0].text === "string") {
        const out = JSON.parse(w.content[0].text);
        return typeof out === "object" && out !== null ? (out as ClaimSessionParsed) : {};
      }
      // Already-parsed: trust the shape (may be a mock from a test rig).
      return wrapper as ClaimSessionParsed;
    }
  } catch {
    // Fall through to empty
  }
  return {};
}

/**
 * Format the [Handshake] Session claimed log line per T3 HC #5
 * (structured-parseable for dashboard consumption).
 *
 *   `[Handshake] Session claimed: epoch=<N> (displaced prior: <session-id|none>)`
 *
 * Used in eager-mode after claim_session returns. Lazy-mode does not log
 * this line (the Hub-side auto-claim happens server-side and the adapter
 * has no synchronous response to format).
 */
export function formatSessionClaimedLogLine(parsed: ClaimSessionParsed): string {
  const epoch = parsed.sessionEpoch ?? "unknown";
  const displacedPrior = parsed.displacedPriorSession?.sessionId ?? "none";
  return `[Handshake] Session claimed: epoch=${epoch} (displaced prior: ${displacedPrior})`;
}
