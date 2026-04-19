/**
 * HubReturnedError — wraps an MCP isError envelope as a thrown Error.
 *
 * MCP tool calls can return two error shapes:
 *
 *   1. Transport-layer faults (network, 5xx, connection refused) —
 *      these throw naturally from the transport layer.
 *
 *   2. Hub-layer application errors (Zod validation, unknown tool,
 *      cascade-schema drift, authorization) — these come back as
 *      `{ isError: true, content: [{ type: "text", text: "..." }] }`
 *      envelopes. They do NOT throw by default — the legacy agent.call
 *      return path delivers them as typed values.
 *
 * The cognitive pipeline's `onToolError` only fires on thrown errors.
 * For ErrorNormalizer to observe Hub-layer application errors, the
 * envelope must be converted to a throw. `McpAgentClient` does this
 * in its cognitive path by wrapping the envelope in this error class
 * before propagating.
 *
 * Legacy callers (no cognitive pipeline) continue to see envelope-as-
 * return-value — unchanged contract.
 */

export class HubReturnedError extends Error {
  readonly name = "HubReturnedError";
  /** Original envelope `{ isError, content }` from the transport. */
  readonly envelope: unknown;

  constructor(envelope: unknown) {
    super(extractErrorMessage(envelope));
    this.envelope = envelope;
  }
}

/**
 * Type-guard: does this value look like an MCP isError envelope?
 * Deliberately narrow — only `isError === true` + `content[0].text`
 * shape qualifies. Avoids false positives on legitimate response
 * payloads that happen to carry an `error` field.
 */
export function isErrorEnvelope(value: unknown): value is {
  isError: true;
  content: Array<{ type?: string; text?: string }>;
} {
  if (!value || typeof value !== "object") return false;
  const v = value as {
    isError?: unknown;
    content?: unknown;
  };
  if (v.isError !== true) return false;
  if (!Array.isArray(v.content)) return false;
  return true;
}

/**
 * Extract a human-readable message from an isError envelope. If the
 * content[0].text is valid JSON with an `error` field, return that;
 * otherwise return the raw text. Falls back to a generic message
 * when the envelope lacks a text block.
 */
function extractErrorMessage(envelope: unknown): string {
  if (!envelope || typeof envelope !== "object") return "Hub returned an error";
  const content = (envelope as { content?: Array<{ text?: string }> }).content;
  const text = Array.isArray(content) && content[0]?.text;
  if (!text) return "Hub returned an error";
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.error === "string") return parsed.error;
    if (typeof parsed?.message === "string") return parsed.message;
    return text;
  } catch {
    return text;
  }
}
