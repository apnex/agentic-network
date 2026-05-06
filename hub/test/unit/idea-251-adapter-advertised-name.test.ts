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
  globalInstanceId: "test-gid-idea-251",
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

  it("payload.name='lily' wins over globalInstanceId at first-contact create", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("lily");
    expect(parsed.agent.id).not.toBe("lily"); // agentId is fingerprint-derived, not name
  });

  it("payload.name absent → falls back to globalInstanceId (current semantic preserved)", async () => {
    const result = await router.handle("register_role", baseHandshake, ctx);
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("test-gid-idea-251");
  });

  it("payload.name as empty/whitespace → treated as absent (fallback path)", async () => {
    const result = await router.handle("register_role", { ...baseHandshake, name: "   " }, ctx);
    // Empty after trim → handler treats as undefined → fallback to globalInstanceId
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent.name).toBe("test-gid-idea-251");
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

describe("idea-251 — reconnect-refresh (audit-fold A)", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  it("reconnect with new name overwrites stored name", async () => {
    // First registration with name="oldname"
    await router.handle("register_role", { ...baseHandshake, name: "oldname" }, ctx);
    // Reconnect with a new name
    const second = await router.handle("register_role", { ...baseHandshake, name: "newname" }, ctx);
    expect(second.isError).toBeUndefined();
    const parsed = JSON.parse(second.content[0].text);
    expect(parsed.agent.name).toBe("newname");
  });

  it("reconnect with no name preserves stored name (CP3 C5 semantic)", async () => {
    // First register with name="lily"
    await router.handle("register_role", { ...baseHandshake, name: "lily" }, ctx);
    // Reconnect omitting name (e.g. operator unset OIS_AGENT_NAME)
    const second = await router.handle("register_role", baseHandshake, ctx);
    expect(second.isError).toBeUndefined();
    const parsed = JSON.parse(second.content[0].text);
    // Stored name preserved — same CP3 C5 semantic as labels
    expect(parsed.agent.name).toBe("lily");
  });

  it("reconnect heals existing agent created before name was wired (greg/lily real-world case)", async () => {
    // First register with NO name field → name persists as globalInstanceId
    // (reproduces the pre-idea-251 state of greg/lily registrations)
    const first = await router.handle("register_role", baseHandshake, ctx);
    const firstParsed = JSON.parse(first.content[0].text);
    expect(firstParsed.agent.name).toBe("test-gid-idea-251");
    // Operator now sets OIS_AGENT_NAME and restarts the adapter — reconnect
    // sends name="greg" in the handshake. Without audit-fold A this would
    // be a no-op; with the fold it heals on first reconnect.
    const second = await router.handle("register_role", { ...baseHandshake, name: "greg" }, ctx);
    const secondParsed = JSON.parse(second.content[0].text);
    expect(secondParsed.agent.name).toBe("greg");
  });
});
