/**
 * idea-252 §7 — recipient resolver unit tests.
 *
 * Pin contracts (per `feedback_format_regex_over_hardcoded_hash_tests.md`):
 *   - resolveRecipient output passes the agentId format-regex
 *   - error paths assert error-code match (not message text)
 *   - precedence rules: both-fields-match → success; both-fields-mismatch →
 *     recipient.conflict
 *   - bug-56-prevention regression: explicit-recipient with deleted-recipient
 *     name → recipient.unknown rejection (covers calibration #64 trap)
 */

import { describe, expect, it } from "vitest";
import { resolveRecipient } from "../../src/entities/recipient-resolver.js";
import { deriveAgentId } from "../../src/state.js";
import type { Agent } from "../../src/state.js";

const AGENT_ID_FORMAT = /^agent-[0-9a-f]{8}$/;

function makeRegistry(knownAgents: Set<string>) {
  return {
    getAgent: async (agentId: string): Promise<Agent | null> =>
      knownAgents.has(agentId) ? ({ id: agentId } as Agent) : null,
  };
}

describe("resolveRecipient — name-only path", () => {
  it("resolves a registered name to its derived agentId (format-regex pinned)", async () => {
    const expected = deriveAgentId("alice");
    const registry = makeRegistry(new Set([expected]));
    const r = await resolveRecipient(registry, { name: "alice" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.agentId).toMatch(AGENT_ID_FORMAT);
      expect(r.agentId).toBe(expected);
    }
  });

  it("rejects unknown name with recipient.unknown", async () => {
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, { name: "ghost" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.unknown");
  });

  it("trims whitespace; whitespace-only treated as absent", async () => {
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, { name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.required");
  });
});

describe("resolveRecipient — agentId-only path", () => {
  it("resolves a registered agentId pass-through (existence verified)", async () => {
    const id = deriveAgentId("bob");
    const registry = makeRegistry(new Set([id]));
    const r = await resolveRecipient(registry, { agentId: id });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.agentId).toBe(id);
  });

  it("rejects unknown agentId with recipient.unknown (closes calibration #64 — stale-agentId-trap)", async () => {
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, { agentId: "agent-deadbeef" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.unknown");
  });

  it("rejects pre-idea-251 legacy agentId form with recipient.unknown (post-cutover)", async () => {
    // Legacy form: eng-{12-char-hash} from idea-251 D-prime Phase 1 cutover.
    // After cutover all agents use agent-{8-char} prefix; old IDs are stale.
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, { agentId: "eng-0d2c690e7dd5" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.unknown");
  });
});

describe("resolveRecipient — both-fields precedence (Q2 ratification)", () => {
  it("both-fields-match → success (id matches name's deterministic derivation)", async () => {
    const id = deriveAgentId("carol");
    const registry = makeRegistry(new Set([id]));
    const r = await resolveRecipient(registry, { name: "carol", agentId: id });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.agentId).toBe(id);
  });

  it("both-fields-mismatch → recipient.conflict (name wins; mismatch detected)", async () => {
    const aliceId = deriveAgentId("alice");
    const bobId = deriveAgentId("bob");
    const registry = makeRegistry(new Set([aliceId, bobId]));
    // User claims name=alice + agentId=bob's-id — disagreement.
    const r = await resolveRecipient(registry, { name: "alice", agentId: bobId });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.conflict");
  });

  it("both-fields-match-but-agent-deleted → recipient.unknown (bug-56-prevention regression)", async () => {
    // Pre-deletion the name+id pair was internally-consistent. Post-deletion
    // the resolver MUST still reject — this is the calibration #64 + bug-56
    // class: explicit-recipient routing for a non-existent agent.
    const id = deriveAgentId("departed");
    const registry = makeRegistry(new Set()); // departed has been removed
    const r = await resolveRecipient(registry, { name: "departed", agentId: id });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.unknown");
  });
});

describe("resolveRecipient — neither path (boundary)", () => {
  it("rejects empty input with recipient.required", async () => {
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.required");
  });

  it("treats null fields as absent (not as falsy-but-present)", async () => {
    const registry = makeRegistry(new Set());
    const r = await resolveRecipient(registry, { name: null, agentId: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("recipient.required");
  });
});

describe("resolveRecipient — determinism contract (idea-251 composability)", () => {
  it("same name resolves to same agentId across calls (deterministic)", async () => {
    const id = deriveAgentId("dora");
    const registry = makeRegistry(new Set([id]));
    const r1 = await resolveRecipient(registry, { name: "dora" });
    const r2 = await resolveRecipient(registry, { name: "dora" });
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.agentId).toBe(r2.agentId);
  });

  it("different names resolve to different agentIds (no collision in test fixtures)", async () => {
    const aliceId = deriveAgentId("alice");
    const bobId = deriveAgentId("bob");
    expect(aliceId).not.toBe(bobId);
    const registry = makeRegistry(new Set([aliceId, bobId]));
    const r1 = await resolveRecipient(registry, { name: "alice" });
    const r2 = await resolveRecipient(registry, { name: "bob" });
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.agentId).not.toBe(r2.agentId);
  });
});
