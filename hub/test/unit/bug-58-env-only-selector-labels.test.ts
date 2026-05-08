import { describe, it, expect, beforeEach } from "vitest";
import { PolicyRouter } from "../../src/policy/router.js";
import { registerThreadPolicy } from "../../src/policy/thread-policy.js";
import { createTestContext, type TestPolicyContext } from "../../src/policy/test-utils.js";
import { scopeLabels } from "../../src/policy/labels.js";

/**
 * bug-58 — broadcast/multicast selector matchLabels must auto-inherit
 * ONLY scope-class labels (env), not identity-class (ois.io/github/login)
 * or custom-class labels.
 *
 * Director-ratified at thread-505: cross-tenant broadcast (architect at
 * tenant A, engineer at tenant B) was silently dropping dispatch because
 * the broadcast openSelector auto-copied ALL caller labels — including
 * the identity-class ois.io/github/login — narrowing the pool to the
 * creator's own tenant. mission-of-missions Phase 4 audit (thread-502)
 * stalled silently for this reason; thread-504 smoke-test post-bug-57-
 * merge captured the dispatch log evidence (matched=0 agent(s)).
 *
 * Fix: scopeLabels() helper at hub/src/policy/labels.ts filters to a
 * hardcoded allowlist (currently `["env"]`). Applied at thread-policy.ts
 * broadcast openSelector matchLabels assignment.
 */

const CLIENT = {
  clientName: "claude-code",
  clientVersion: "0.1.0",
  proxyName: "@apnex/claude-plugin",
  proxyVersion: "1.0.0",
};

describe("bug-58 — broadcast selector matchLabels filters to env-only (scope-class) labels", () => {
  let archCtx: TestPolicyContext;
  let engCtxLily: TestPolicyContext;
  let engCtxGreg: TestPolicyContext;
  let router: PolicyRouter;
  let lilyEngId: string;
  let gregEngId: string;

  beforeEach(async () => {
    archCtx = createTestContext();
    router = new PolicyRouter(() => {});
    registerThreadPolicy(router);

    // Architect — tenant A (apnex-lily). Carries identity-class label.
    await archCtx.stores.engineerRegistry.registerAgent(
      archCtx.sessionId,
      "architect",
      {
        name: `inst-arch-${archCtx.sessionId}`,
        role: "architect",
        clientMetadata: CLIENT,
        labels: { env: "prod", "ois.io/github/login": "apnex-lily" },
      } as any,
    );

    // Engineer in tenant A (matches architect's tenant).
    engCtxLily = createTestContext({ stores: archCtx.stores, role: "engineer" });
    const lilyRes = await archCtx.stores.engineerRegistry.registerAgent(
      engCtxLily.sessionId,
      "engineer",
      {
        name: `inst-eng-lily-${engCtxLily.sessionId}`,
        role: "engineer",
        clientMetadata: CLIENT,
        labels: { env: "prod", "ois.io/github/login": "apnex-lily" },
      } as any,
    );
    if (!lilyRes.ok) throw new Error("lily-eng register failed");
    lilyEngId = lilyRes.agentId;

    // Engineer in tenant B (cross-tenant — the bug-58 surface).
    engCtxGreg = createTestContext({ stores: archCtx.stores, role: "engineer" });
    const gregRes = await archCtx.stores.engineerRegistry.registerAgent(
      engCtxGreg.sessionId,
      "engineer",
      {
        name: `inst-eng-greg-${engCtxGreg.sessionId}`,
        role: "engineer",
        clientMetadata: CLIENT,
        labels: { env: "prod", "ois.io/github/login": "apnex-greg" },
      } as any,
    );
    if (!gregRes.ok) throw new Error("greg-eng register failed");
    gregEngId = gregRes.agentId;
  });

  it("scopeLabels() helper: keeps env, drops identity-class + custom-class labels", () => {
    const filtered = scopeLabels({
      env: "prod",
      "ois.io/github/login": "apnex-lily",
      team: "billing",
      region: "us-east-1",
    });
    expect(filtered).toEqual({ env: "prod" });
  });

  it("scopeLabels() helper: returns empty object when no scope-class labels present", () => {
    const filtered = scopeLabels({
      "ois.io/github/login": "apnex-lily",
      team: "billing",
    });
    expect(filtered).toEqual({});
  });

  it("create_thread broadcast: cross-tenant pool resolves correctly via env match (was: 0 members pre-fix)", async () => {
    const result = await router.handle(
      "create_thread",
      {
        title: "cross-tenant broadcast — bug-58 fix surface",
        message: "audit dispatch from lily-architect to engineer pool",
        routingMode: "broadcast",
      },
      archCtx,
    );
    const body = JSON.parse((result.content[0] as any).text);
    const threadId = body.threadId as string;

    // Both engineers (lily-tenant + greg-tenant) should have an enqueued item.
    // Pre-fix, only the same-tenant engineer (lily) would resolve.
    const lilyItems = await archCtx.stores.pendingAction.listForAgent(lilyEngId, { state: "enqueued" });
    const gregItems = await archCtx.stores.pendingAction.listForAgent(gregEngId, { state: "enqueued" });

    expect(lilyItems).toHaveLength(1);
    expect(gregItems).toHaveLength(1);
    expect(lilyItems[0].entityRef).toBe(threadId);
    expect(gregItems[0].entityRef).toBe(threadId);

    // SSE selector matchLabels: only env, NOT ois.io/github/login.
    const evt = archCtx.dispatchedEvents.find((e) => e.event === "thread_message");
    expect(evt).toBeDefined();
    const selector = evt!.selector as Record<string, unknown>;
    expect(selector.roles).toEqual(["engineer"]);
    expect(selector.matchLabels).toEqual({ env: "prod" });
    // Identity-class label MUST NOT be in the selector — that's the bug-58 fix.
    expect((selector.matchLabels as any)["ois.io/github/login"]).toBeUndefined();
  });

  it("create_thread broadcast: env mismatch still narrows the pool (regression guard for env-class filtering)", async () => {
    // Register a third engineer in dev env (different scope-class).
    const devCtx = createTestContext({ stores: archCtx.stores, role: "engineer" });
    const devRes = await archCtx.stores.engineerRegistry.registerAgent(
      devCtx.sessionId,
      "engineer",
      {
        name: `inst-eng-dev-${devCtx.sessionId}`,
        role: "engineer",
        clientMetadata: CLIENT,
        labels: { env: "dev", "ois.io/github/login": "apnex-greg" },
      } as any,
    );
    if (!devRes.ok) throw new Error("dev-eng register failed");
    const devEngId = devRes.agentId;

    // Architect (env=prod) opens broadcast — dev engineer should NOT be in pool.
    await router.handle(
      "create_thread",
      {
        title: "env-scope broadcast",
        message: "prod-only audit",
        routingMode: "broadcast",
      },
      archCtx,
    );

    const lilyItems = await archCtx.stores.pendingAction.listForAgent(lilyEngId, { state: "enqueued" });
    const gregItems = await archCtx.stores.pendingAction.listForAgent(gregEngId, { state: "enqueued" });
    const devItems = await archCtx.stores.pendingAction.listForAgent(devEngId, { state: "enqueued" });

    expect(lilyItems).toHaveLength(1); // env=prod ✓
    expect(gregItems).toHaveLength(1); // env=prod ✓ (cross-tenant; bug-58 fix permits)
    expect(devItems).toHaveLength(0);  // env=dev — env scope-class mismatch correctly excludes
  });
});
