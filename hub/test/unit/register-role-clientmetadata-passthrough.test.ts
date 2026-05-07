/**
 * register_role wire-boundary passthrough — calibration #62 14th instance.
 *
 * Closes the deferred-runtime-gate class for clientMetadata schema additions.
 * Earlier coverage (m-build-identity-advisory-tag.test.ts) tests
 * deriveAdvisoryTags with synthetic input that already has the new fields,
 * which BYPASSES the wire boundary where zod's default strip mode would drop
 * unknown fields. This file exercises the boundary explicitly:
 *
 *   1. Schema-level: z.object(reg.schema) parsing preserves the 4 build-identity
 *      fields (proxyCommitSha / proxyDirty / sdkCommitSha / sdkDirty). A schema
 *      regression here means the MCP transport strips them silently.
 *
 *   2. End-to-end: register_role tool call (router.handle) lands the fields in
 *      both agent.clientMetadata (raw) and agent.advisoryTags (projected).
 *
 * If either assertion fails, get-agents COMMIT columns will show "?" for live
 * agents — the symptom that drove this hot-fix.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { PolicyRouter } from "../../src/policy/router.js";
import { registerSessionPolicy } from "../../src/policy/session-policy.js";
import { createTestContext, type TestPolicyContext } from "../../src/policy/test-utils.js";

const noop = () => {};

const baseHandshake = {
  role: "engineer",
  name: "buildid-passthrough",
  clientMetadata: {
    clientName: "claude-code",
    clientVersion: "0.1.0",
    proxyName: "@apnex/claude-plugin",
    proxyVersion: "0.1.4",
    transport: "stdio-mcp-proxy",
    sdkVersion: "@apnex/network-adapter@0.1.2",
    proxyCommitSha: "bd32118",
    proxyDirty: true,
    sdkCommitSha: "bd32118",
    sdkDirty: false,
  },
};

describe("register_role schema-level passthrough — build-identity fields survive zod strip", () => {
  let router: PolicyRouter;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
  });

  it("z.object(reg.schema) preserves proxyCommitSha / proxyDirty / sdkCommitSha / sdkDirty", () => {
    const reg = router.getToolRegistration("register_role");
    expect(reg).toBeDefined();
    const argsSchema = z.object(reg!.schema);
    const parsed = argsSchema.parse(baseHandshake);
    expect(parsed.clientMetadata).toBeDefined();
    expect(parsed.clientMetadata!.proxyCommitSha).toBe("bd32118");
    expect(parsed.clientMetadata!.proxyDirty).toBe(true);
    expect(parsed.clientMetadata!.sdkCommitSha).toBe("bd32118");
    expect(parsed.clientMetadata!.sdkDirty).toBe(false);
  });

  it("'unknown' fallback shape (non-git extracted-tarball consumer) parses cleanly", () => {
    const reg = router.getToolRegistration("register_role");
    const argsSchema = z.object(reg!.schema);
    const parsed = argsSchema.parse({
      ...baseHandshake,
      clientMetadata: {
        ...baseHandshake.clientMetadata,
        proxyCommitSha: "unknown",
        proxyDirty: false,
        sdkCommitSha: "unknown",
        sdkDirty: false,
      },
    });
    expect(parsed.clientMetadata!.proxyCommitSha).toBe("unknown");
    expect(parsed.clientMetadata!.sdkCommitSha).toBe("unknown");
  });

  it("absent build-identity fields (legacy shim) still parse — fields are optional", () => {
    const reg = router.getToolRegistration("register_role");
    const argsSchema = z.object(reg!.schema);
    const legacyHandshake = {
      role: "engineer",
      name: "legacy-shim",
      clientMetadata: {
        clientName: "claude-code",
        clientVersion: "0.1.0",
        proxyName: "@apnex/claude-plugin",
        proxyVersion: "0.1.0",
      },
    };
    const parsed = argsSchema.parse(legacyHandshake);
    expect(parsed.clientMetadata!.proxyCommitSha).toBeUndefined();
    expect(parsed.clientMetadata!.proxyDirty).toBeUndefined();
    expect(parsed.clientMetadata!.sdkCommitSha).toBeUndefined();
    expect(parsed.clientMetadata!.sdkDirty).toBeUndefined();
  });
});

describe("register_role end-to-end — wire-parsed args land in agent.clientMetadata + agent.advisoryTags", () => {
  let router: PolicyRouter;
  let ctx: TestPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerSessionPolicy(router);
    ctx = createTestContext();
  });

  it("schema-parsed handshake persists build-identity into clientMetadata + projects into advisoryTags", async () => {
    // Mirror the MCP wire path: zod-parse the raw args first, then dispatch.
    // PolicyRouter.handle does NOT itself apply the schema (per
    // session-policy.ts:30 comment + router.ts:223); the MCP transport binding
    // does. Re-applying it here is what makes this test sensitive to a missing
    // field on the schema.
    const reg = router.getToolRegistration("register_role");
    const parsedArgs = z.object(reg!.schema).parse(baseHandshake);
    const result = await router.handle("register_role", parsedArgs, ctx);
    expect(result.isError).toBeUndefined();
    const body = JSON.parse(result.content[0].text);
    expect(body.ok).toBe(true);
    expect(body.agent).toBeDefined();

    // Raw clientMetadata round-trip — proves the strip didn't happen.
    expect(body.agent.clientMetadata.proxyCommitSha).toBe("bd32118");
    expect(body.agent.clientMetadata.proxyDirty).toBe(true);
    expect(body.agent.clientMetadata.sdkCommitSha).toBe("bd32118");
    expect(body.agent.clientMetadata.sdkDirty).toBe(false);

    // deriveAdvisoryTags projection — clientMetadata.* mirrored into
    // advisoryTags.* per Design v1.0 §1.5.
    expect(body.agent.advisoryTags.proxyCommitSha).toBe("bd32118");
    expect(body.agent.advisoryTags.proxyDirty).toBe(true);
    expect(body.agent.advisoryTags.sdkCommitSha).toBe("bd32118");
    expect(body.agent.advisoryTags.sdkDirty).toBe(false);
  });

  it("dirty=false (boolean) survives the wire boundary (not coerced to undefined)", async () => {
    const reg = router.getToolRegistration("register_role");
    const parsedArgs = z.object(reg!.schema).parse({
      ...baseHandshake,
      name: "dirty-false",
      clientMetadata: {
        ...baseHandshake.clientMetadata,
        proxyDirty: false,
        sdkDirty: false,
      },
    });
    const result = await router.handle("register_role", parsedArgs, ctx);
    const body = JSON.parse(result.content[0].text);
    expect(body.ok).toBe(true);
    expect("proxyDirty" in body.agent.advisoryTags).toBe(true);
    expect("sdkDirty" in body.agent.advisoryTags).toBe(true);
    expect(body.agent.advisoryTags.proxyDirty).toBe(false);
    expect(body.agent.advisoryTags.sdkDirty).toBe(false);
  });
});
