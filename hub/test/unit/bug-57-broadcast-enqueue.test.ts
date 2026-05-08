import { describe, it, expect, beforeEach } from "vitest";
import { PolicyRouter } from "../../src/policy/router.js";
import { registerThreadPolicy } from "../../src/policy/thread-policy.js";
import { createTestContext, type TestPolicyContext } from "../../src/policy/test-utils.js";

/**
 * bug-57 — broadcast routing must enqueue pending-action per pool-resolved
 * recipient (was: silent skip per "phase-2 scope" comment at thread-policy.ts:280).
 *
 * Closes the calibration #62 8th-instance surface: the dispatch path between
 * thread-state and pending-action-queue was broken for broadcast threads —
 * SSE fired but no queue persistence, so engineers couldn't discover the
 * work via drain after a session restart. Mission-of-missions Phase 4 audit
 * (thread-502) was the first canonical workload to surface the gap.
 */

const CLIENT = {
  clientName: "claude-code",
  clientVersion: "0.1.0",
  proxyName: "@apnex/claude-plugin",
  proxyVersion: "1.0.0",
};

describe("bug-57 — broadcast routing enqueues pending-action per pool-resolved recipient", () => {
  let archCtx: TestPolicyContext;
  let engACtx: TestPolicyContext;
  let engBCtx: TestPolicyContext;
  let router: PolicyRouter;
  let engAId: string;
  let engBId: string;

  beforeEach(async () => {
    archCtx = createTestContext();
    router = new PolicyRouter(() => {});
    registerThreadPolicy(router);

    await archCtx.stores.engineerRegistry.registerAgent(
      archCtx.sessionId,
      "architect",
      {
        name: `inst-arch-${archCtx.sessionId}`,
        role: "architect",
        clientMetadata: CLIENT,
        labels: { env: "prod" },
      } as any,
    );

    // Two engineers in the same pool. Shared stores so the architect's
    // dispatch can resolve them via selectAgents().
    engACtx = createTestContext({ stores: archCtx.stores, role: "engineer" });
    const engARes = await archCtx.stores.engineerRegistry.registerAgent(
      engACtx.sessionId,
      "engineer",
      {
        name: `inst-engA-${engACtx.sessionId}`,
        role: "engineer",
        clientMetadata: CLIENT,
        labels: { env: "prod" },
      } as any,
    );
    if (!engARes.ok) throw new Error("engA register failed");
    engAId = engARes.agentId;

    engBCtx = createTestContext({ stores: archCtx.stores, role: "engineer" });
    const engBRes = await archCtx.stores.engineerRegistry.registerAgent(
      engBCtx.sessionId,
      "engineer",
      {
        name: `inst-engB-${engBCtx.sessionId}`,
        role: "engineer",
        clientMetadata: CLIENT,
        labels: { env: "prod" },
      } as any,
    );
    if (!engBRes.ok) throw new Error("engB register failed");
    engBId = engBRes.agentId;
  });

  it("create_thread broadcast: enqueues one pending-action per pool member (was: skipped entirely)", async () => {
    const result = await router.handle(
      "create_thread",
      {
        title: "broadcast enqueue test",
        message: "audit dispatch",
        routingMode: "broadcast",
      },
      archCtx,
    );
    const body = JSON.parse((result.content[0] as any).text);
    const threadId = body.threadId as string;

    // Each engineer's queue should contain a thread_message item targeting them.
    const engAItems = await archCtx.stores.pendingAction.listForAgent(engAId, { state: "enqueued" });
    const engBItems = await archCtx.stores.pendingAction.listForAgent(engBId, { state: "enqueued" });

    expect(engAItems).toHaveLength(1);
    expect(engBItems).toHaveLength(1);
    expect(engAItems[0].entityRef).toBe(threadId);
    expect(engBItems[0].entityRef).toBe(threadId);
    expect(engAItems[0].dispatchType).toBe("thread_message");
    expect(engBItems[0].dispatchType).toBe("thread_message");

    // SSE dispatch payload carries the array of queueItemIds inline.
    const evt = archCtx.dispatchedEvents.find((e) => e.event === "thread_message");
    expect(evt).toBeDefined();
    const ids = (evt!.data as any).queueItemIds as string[];
    expect(ids).toBeDefined();
    expect(new Set(ids)).toEqual(new Set([engAItems[0].id, engBItems[0].id]));

    // Drain visibility — bug-57's user-observable surface: engineer-A
    // calling drain MUST see the broadcast item (was empty pre-fix).
    const drainA = await archCtx.stores.pendingAction.listForAgent(engAId, { state: "enqueued" });
    expect(drainA).toHaveLength(1);
    expect(drainA[0].id).toBe(engAItems[0].id);
  });

  it("create_thread_reply: broadcast→unicast coerce sweeps peer queue items as superseded_by_peer_claim", async () => {
    const result = await router.handle(
      "create_thread",
      {
        title: "broadcast coerce-sweep test",
        message: "first claimer wins",
        routingMode: "broadcast",
      },
      archCtx,
    );
    const body = JSON.parse((result.content[0] as any).text);
    const threadId = body.threadId as string;

    // Sanity: both engineers have an enqueued item pre-reply.
    const beforeA = await archCtx.stores.pendingAction.listForAgent(engAId, { state: "enqueued" });
    const beforeB = await archCtx.stores.pendingAction.listForAgent(engBId, { state: "enqueued" });
    expect(beforeA).toHaveLength(1);
    expect(beforeB).toHaveLength(1);
    const engBItemId = beforeB[0].id;

    // Engineer-A claims first via reply on its own ctx.
    const replyResult = await router.handle(
      "create_thread_reply",
      { threadId, message: "claiming this audit" },
      engACtx,
    );
    expect((replyResult as any).isError).not.toBe(true);

    // Engineer-B's queue item should now be in errored / superseded_by_peer_claim.
    const engBItem = await archCtx.stores.pendingAction.getById(engBItemId);
    expect(engBItem).toBeDefined();
    expect(engBItem!.state).toBe("errored");
    expect(engBItem!.escalationReason).toBe("superseded_by_peer_claim");

    // Engineer-A's queue item should not be abandoned — its lifecycle
    // proceeds normally (the existing auto-match completion-ack flow
    // settles it on the reply landing).
    const afterA = await archCtx.stores.pendingAction.listForAgent(engAId);
    expect(afterA).toHaveLength(1);
    expect(afterA[0].state).not.toBe("errored");
  });

  it("create_thread unicast: still enqueues exactly one item (regression guard for the unicast path)", async () => {
    const result = await router.handle(
      "create_thread",
      {
        title: "unicast regression guard",
        message: "single recipient",
        routingMode: "unicast",
        recipientAgentId: engAId,
      },
      archCtx,
    );
    const body = JSON.parse((result.content[0] as any).text);
    const threadId = body.threadId as string;

    const engAItems = await archCtx.stores.pendingAction.listForAgent(engAId, { state: "enqueued" });
    const engBItems = await archCtx.stores.pendingAction.listForAgent(engBId, { state: "enqueued" });
    expect(engAItems).toHaveLength(1);
    expect(engBItems).toHaveLength(0);
    expect(engAItems[0].entityRef).toBe(threadId);

    // SSE payload carries the singular queueItemId (legacy unicast shape).
    const evt = archCtx.dispatchedEvents.find((e) => e.event === "thread_message");
    expect(evt).toBeDefined();
    expect((evt!.data as any).queueItemId).toBe(engAItems[0].id);
    expect((evt!.data as any).queueItemIds).toBeUndefined();
  });
});
