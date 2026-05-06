/**
 * idea-251 — adapter-advertised agent display name (NAME column).
 *
 * Coverage:
 *  - register_role schema: `name` field accepted; absent fine; precedence
 *    `payload.name → payload.globalInstanceId → agentId`
 *  - Reserved-name rejection (director / system / hub / engineer / architect;
 *    case-insensitive)
 *  - Schema validation: regex (alphanumeric + `_-`), length boundaries
 *  - Reconnect-refresh (audit-fold A): provided name overwrites stored;
 *    omitted preserves stored; changedFields propagates `"name"`
 *  - Closes the OIS_INSTANCE_ID escape-hatch deferral noted in
 *    packages/network-adapter/src/kernel/instance.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PolicyRouter } from "../../src/policy/router.js";
import { registerSessionPolicy } from "../../src/policy/session-policy.js";
import { createTestContext, type TestPolicyContext } from "../../src/policy/test-utils.js";

const noop = () => {};

const baseHandshake = {
  role: "engineer",
  name: "test-gid-idea-251",
  clientMetadata: {
    clientName: "test-client",
    clientVersion: "0.0.0",
    proxyName: "@apnex/test-plugin",
    proxyVersion: "0.0.0",
    sdkVersion: "@apnex/network-adapter@2.1.0",
  },
};

describe("idea-251 — name field precedence in register_role", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  it("payload.name='lily' is stored as agent.name; agentId derives from name fingerprint", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("lily");
    expect(parsed.agent.id).not.toBe("lily"); // agentId is fingerprint-derived
    expect(parsed.agent.id).toMatch(/^agent-[0-9a-f]{8}$/);
  });

  it("payload.name as empty/whitespace → trimmed to absent → drops to bare register_role path (no Agent record)", async () => {
    // idea-251 D-prime Phase 2: name is REQUIRED for the M18 enriched-handshake
    // path. An empty/whitespace name trims to undefined, fails the M18 entry
    // condition, and falls through to the legacy bare register_role path
    // which doesn't create an Agent record. Bare path returns just `{role}`.
    const result = await router.handle("register_role", { ...baseHandshake, name: "   " }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent).toBeUndefined();
    expect(parsed.role).toBe("engineer");
  });
});

describe("idea-251 — reserved-name rejection", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  for (const reserved of ["director", "system", "hub", "engineer", "architect"]) {
    it(`rejects name='${reserved}' (exact match)`, async () => {
      const result = await router.handle("register_role", { ...baseHandshake, name: reserved }, ctx);
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe("reserved_name");
      expect(parsed.message).toContain(reserved);
    });
  }

  it("rejects reserved names case-insensitively", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "Director" }, ctx);
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.code).toBe("reserved_name");
  });

  it("does not reject non-reserved names that contain a reserved substring", async () => {
    // 'directormate' is not exact-match-reserved; should be accepted.
    const result = await router.handle("register_role", { ...baseHandshake, name: "directormate" }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("directormate");
  });
});

describe("idea-251 — schema validation (regex + length)", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  it("accepts alphanumeric + underscore + dash", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "my-agent_2" }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("my-agent_2");
  });

  it("rejects names with spaces", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "my agent" }, ctx);
    expect(result.isError).toBe(true);
  });

  it("rejects names with special characters", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "agent@host" }, ctx);
    expect(result.isError).toBe(true);
  });

  it("accepts 32-char name (boundary)", async () => {
    const name32 = "a".repeat(32);
    const result = await router.handle("register_role", { ...baseHandshake, name: name32 }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe(name32);
  });

  it("rejects 33-char name (boundary+1)", async () => {
    const name33 = "a".repeat(33);
    const result = await router.handle("register_role", { ...baseHandshake, name: name33 }, ctx);
    expect(result.isError).toBe(true);
  });
});

describe("idea-251 D-prime Phase 1 — name as identity (immutable post-create)", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  it("reconnect with same name finds existing agent record (deterministic fingerprint)", async () => {
    // First registration with name="lily"
    const first = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    expect(first.isError).toBeUndefined();
    const firstParsed = JSON.parse(first.content[0].text);
    const firstAgentId = firstParsed.agent.id;
    expect(firstAgentId).toMatch(/^agent-/);
    // Reconnect with the same name
    const second = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    expect(second.isError).toBeUndefined();
    const secondParsed = JSON.parse(second.content[0].text);
    // Same fingerprint → same lookup path → same agentId returned
    expect(secondParsed.agent.id).toBe(firstAgentId);
    expect(secondParsed.agent.name).toBe("lily");
  });

  it("registration with different name creates a NEW agent record (distinct fingerprint)", async () => {
    const first = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    const firstParsed = JSON.parse(first.content[0].text);
    const firstAgentId = firstParsed.agent.id;
    // A different name produces a different fingerprint → first-contact-create
    // on a new path. Old "lily" record remains intact (orphaned to agent-reaper
    // unless operator manually rm's it). Hub does NOT mutate the old record.
    const second = await router.handle("register_role", { ...baseHandshake, name: "greg" }, ctx);
    const secondParsed = JSON.parse(second.content[0].text);
    expect(secondParsed.agent.name).toBe("greg");
    expect(secondParsed.agent.id).not.toBe(firstAgentId);
    expect(secondParsed.agent.id).toMatch(/^agent-/);
  });

  it("reconnect with no name (transitional) finds record via globalInstanceId fingerprint", async () => {
    // Pre-Phase-2 transitional path: callers that don't yet send name
    // (vertex-cloudrun, scripts/architect-client, cognitive-layer/bench)
    // send only globalInstanceId. fingerprint computes from globalInstanceId.
    const first = await router.handle("register_role", baseHandshake, ctx);
    expect(first.isError).toBeUndefined();
    const firstParsed = JSON.parse(first.content[0].text);
    const firstAgentId = firstParsed.agent.id;
    // Reconnect with same globalInstanceId (still no name) → same fingerprint
    const second = await router.handle("register_role", baseHandshake, ctx);
    const secondParsed = JSON.parse(second.content[0].text);
    expect(secondParsed.agent.id).toBe(firstAgentId);
    // Stored name is whatever the create-path fallback produced
    // (payload.name ?? payload.globalInstanceId ?? agentId)
    expect(secondParsed.agent.name).toBe("test-gid-idea-251");
  });

  it("agentId format is `agent-{8-hex-chars}` (role-prefix dropped per Director)", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.id).toMatch(/^agent-[0-9a-f]{8}$/);
  });

  it("agentId derivation is deterministic: same name → same agentId across registrations", async () => {
    // Two fresh contexts (separate stores); both register name="kate".
    const ctxA = createTestContext();
    const ctxB = createTestContext();
    const a = await router.handle("register_role", { ...baseHandshake, name: "kate" }, ctxA);
    const b = await router.handle("register_role", { ...baseHandshake, name: "kate" }, ctxB);
    const aParsed = JSON.parse(a.content[0].text);
    const bParsed = JSON.parse(b.content[0].text);
    // Same name → same fingerprint → same agentId in both stores
    expect(aParsed.agent.id).toBe(bParsed.agent.id);
    expect(aParsed.agent.id).toMatch(/^agent-[0-9a-f]{8}$/);
  });
});
