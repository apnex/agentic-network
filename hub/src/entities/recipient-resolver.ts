/**
 * Recipient resolver — idea-252 §1.
 *
 * Single helper used at API boundary (create_thread / create_message /
 * migrate_agent_queue) to resolve a `{ name?, agentId? }` input pair to a
 * canonical agentId. Closes calibration #64 (stale-agentId architectural-trap)
 * and prevents future bug-56-class silent-dispatch defects for explicit-
 * recipient operations by failing loud at request-time rather than silently
 * persisting orphan notifications.
 *
 * Q8 namespace hygiene (Design v1.0 §5): error codes use the `recipient.*`
 * namespace — `recipient.unknown` (not found), `recipient.conflict` (name+id
 * mismatch), `recipient.required` (neither provided when caller required one).
 */

import type { IEngineerRegistry } from "../state.js";
import { deriveAgentId } from "../state.js";

export type RecipientInput = {
  name?: string | null;
  agentId?: string | null;
};

export type RecipientErrorCode =
  | "recipient.unknown"
  | "recipient.conflict"
  | "recipient.required";

export type RecipientResolution =
  | { ok: true; agentId: string }
  | { ok: false; code: RecipientErrorCode; message: string };

/**
 * Resolve a `{ name?, agentId? }` input to an existing agentId.
 *
 * - name only       → derive via `deriveAgentId(name)` (post-idea-251 deterministic)
 *                     + verify agent exists; reject with `recipient.unknown` if not
 * - agentId only    → verify agent exists; reject with `recipient.unknown` if not
 * - both provided   → resolve `name` to agentId; if mismatch with provided
 *                     agentId → reject with `recipient.conflict`; if match,
 *                     verify existence
 * - neither         → reject with `recipient.required` (caller-side validation
 *                     should normally prevent reaching this branch; included
 *                     for completeness so the resolver is total)
 *
 * Whitespace-only strings are treated as absent (trim + empty-check). Only
 * requires `getAgent` from the registry — unit tests can stub a minimal
 * registry shape.
 */
export async function resolveRecipient(
  registry: Pick<IEngineerRegistry, "getAgent">,
  input: RecipientInput,
): Promise<RecipientResolution> {
  const name = (input.name ?? "").trim() || undefined;
  const agentId = (input.agentId ?? "").trim() || undefined;

  if (!name && !agentId) {
    return {
      ok: false,
      code: "recipient.required",
      message: "either recipientName or recipientAgentId is required",
    };
  }

  if (name && agentId) {
    const derived = deriveAgentId(name);
    if (derived !== agentId) {
      return {
        ok: false,
        code: "recipient.conflict",
        message:
          `recipientName="${name}" resolves to agentId="${derived}" ` +
          `but recipientAgentId="${agentId}" was provided`,
      };
    }
    const existing = await registry.getAgent(agentId);
    if (!existing) {
      return {
        ok: false,
        code: "recipient.unknown",
        message: `recipientName="${name}" (agentId="${agentId}") not found`,
      };
    }
    return { ok: true, agentId };
  }

  if (name) {
    const derived = deriveAgentId(name);
    const existing = await registry.getAgent(derived);
    if (!existing) {
      return {
        ok: false,
        code: "recipient.unknown",
        message: `recipientName="${name}" (resolved to agentId="${derived}") not found`,
      };
    }
    return { ok: true, agentId: derived };
  }

  // agentId only
  const existing = await registry.getAgent(agentId!);
  if (!existing) {
    return {
      ok: false,
      code: "recipient.unknown",
      message: `recipientAgentId="${agentId}" not found`,
    };
  }
  return { ok: true, agentId: agentId! };
}
