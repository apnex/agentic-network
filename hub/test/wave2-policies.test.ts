/**
 * Wave 2 Policy Tests — Idea, Mission, Turn
 *
 * Tests the CRUD + Events domain policies extracted in
 * The Great Decoupling T3.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PolicyRouter } from "../src/policy/router.js";
import { registerIdeaPolicy } from "../src/policy/idea-policy.js";
import { registerMissionPolicy } from "../src/policy/mission-policy.js";
import { registerTurnPolicy } from "../src/policy/turn-policy.js";
import { createTestContext } from "../src/policy/test-utils.js";
import type { IPolicyContext } from "../src/policy/types.js";

const noop = () => {};

// ── Idea Policy ─────────────────────────────────────────────────────

describe("IdeaPolicy", () => {
  let router: PolicyRouter;
  let ctx: IPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerIdeaPolicy(router);
    registerMissionPolicy(router); // needed for auto-linkage tests
    ctx = createTestContext();
  });

  it("registers all idea tools", () => {
    expect(router.has("create_idea")).toBe(true);
    expect(router.has("list_ideas")).toBe(true);
    expect(router.has("update_idea")).toBe(true);
  });

  it("create_idea creates and emits idea_submitted", async () => {
    const result = await router.handle("create_idea", {
      text: "We should add dark mode",
      tags: ["ui", "feature"],
    }, ctx);

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.ideaId).toBeDefined();
    expect(parsed.status).toBe("open");

    const emitted = (ctx as any).emittedEvents.find((e: any) => e.event === "idea_submitted");
    expect(emitted).toBeDefined();
  });

  it("list_ideas returns ideas", async () => {
    await router.handle("create_idea", { text: "Idea 1" }, ctx);
    await router.handle("create_idea", { text: "Idea 2" }, ctx);

    const result = await router.handle("list_ideas", {}, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(2);
  });

  it("list_ideas filters by status", async () => {
    await router.handle("create_idea", { text: "Open idea" }, ctx);

    const result = await router.handle("list_ideas", { status: "triaged" }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(0);
  });

  it("update_idea changes status", async () => {
    const createResult = await router.handle("create_idea", { text: "Update me" }, ctx);
    const { ideaId } = JSON.parse(createResult.content[0].text);

    const result = await router.handle("update_idea", {
      ideaId,
      status: "triaged",
    }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("triaged");
  });

  it("update_idea with missionId auto-incorporates and links", async () => {
    // Create a mission first
    const missionResult = await router.handle("create_mission", {
      title: "Test Mission",
      description: "A mission for testing",
    }, ctx);
    const { missionId } = JSON.parse(missionResult.content[0].text);

    // Create an idea
    const ideaResult = await router.handle("create_idea", { text: "Link me" }, ctx);
    const { ideaId } = JSON.parse(ideaResult.content[0].text);

    // Update with missionId — should auto-set status to incorporated
    const result = await router.handle("update_idea", {
      ideaId,
      missionId,
    }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("incorporated");
    expect(parsed.missionId).toBe(missionId);
  });

  it("update_idea returns error for non-existent idea", async () => {
    const result = await router.handle("update_idea", {
      ideaId: "idea-999",
      status: "triaged",
    }, ctx);
    expect(result.isError).toBe(true);
  });
});

// ── Mission Policy ──────────────────────────────────────────────────

describe("MissionPolicy", () => {
  let router: PolicyRouter;
  let ctx: IPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerMissionPolicy(router);
    ctx = createTestContext();
  });

  it("registers all mission tools", () => {
    expect(router.has("create_mission")).toBe(true);
    expect(router.has("update_mission")).toBe(true);
    expect(router.has("get_mission")).toBe(true);
    expect(router.has("list_missions")).toBe(true);
  });

  it("create_mission creates and emits mission_created", async () => {
    const result = await router.handle("create_mission", {
      title: "Decoupling Phase 1",
      description: "Extract all policies",
    }, ctx);

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.missionId).toBeDefined();
    expect(parsed.status).toBe("proposed");

    const emitted = (ctx as any).emittedEvents.find((e: any) => e.event === "mission_created");
    expect(emitted).toBeDefined();
  });

  it("update_mission to active emits mission_activated", async () => {
    const createResult = await router.handle("create_mission", {
      title: "Test", description: "Desc",
    }, ctx);
    const { missionId } = JSON.parse(createResult.content[0].text);

    const result = await router.handle("update_mission", {
      missionId,
      status: "active",
    }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("active");

    const emitted = (ctx as any).emittedEvents.find((e: any) => e.event === "mission_activated");
    expect(emitted).toBeDefined();
  });

  it("get_mission returns a created mission", async () => {
    const createResult = await router.handle("create_mission", {
      title: "Get me", description: "Desc",
    }, ctx);
    const { missionId } = JSON.parse(createResult.content[0].text);

    const result = await router.handle("get_mission", { missionId }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe("Get me");
  });

  it("get_mission returns error for non-existent", async () => {
    const result = await router.handle("get_mission", { missionId: "mission-999" }, ctx);
    expect(result.isError).toBe(true);
  });

  it("list_missions filters by status", async () => {
    await router.handle("create_mission", { title: "M1", description: "D1" }, ctx);

    const result = await router.handle("list_missions", { status: "active" }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(0); // newly created missions are "proposed"
  });
});

// ── Turn Policy ─────────────────────────────────────────────────────

describe("TurnPolicy", () => {
  let router: PolicyRouter;
  let ctx: IPolicyContext;

  beforeEach(() => {
    router = new PolicyRouter(noop);
    registerTurnPolicy(router);
    ctx = createTestContext();
  });

  it("registers all turn tools", () => {
    expect(router.has("create_turn")).toBe(true);
    expect(router.has("update_turn")).toBe(true);
    expect(router.has("get_turn")).toBe(true);
    expect(router.has("list_turns")).toBe(true);
  });

  it("create_turn creates and emits turn_created", async () => {
    const result = await router.handle("create_turn", {
      title: "Sprint 1",
      scope: "Build the core platform",
    }, ctx);

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.turnId).toBeDefined();
    expect(parsed.status).toBe("planning");

    const emitted = (ctx as any).emittedEvents.find((e: any) => e.event === "turn_created");
    expect(emitted).toBeDefined();
  });

  it("update_turn changes status and emits turn_updated", async () => {
    const createResult = await router.handle("create_turn", {
      title: "Test Turn", scope: "Testing",
    }, ctx);
    const { turnId } = JSON.parse(createResult.content[0].text);

    const result = await router.handle("update_turn", {
      turnId,
      status: "active",
    }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("active");

    const emitted = (ctx as any).emittedEvents.find((e: any) => e.event === "turn_updated");
    expect(emitted).toBeDefined();
  });

  it("get_turn returns a created turn", async () => {
    const createResult = await router.handle("create_turn", {
      title: "Get me", scope: "Scope",
    }, ctx);
    const { turnId } = JSON.parse(createResult.content[0].text);

    const result = await router.handle("get_turn", { turnId }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe("Get me");
  });

  it("get_turn returns error for non-existent", async () => {
    const result = await router.handle("get_turn", { turnId: "turn-999" }, ctx);
    expect(result.isError).toBe(true);
  });

  it("create_turn with tele IDs", async () => {
    const result = await router.handle("create_turn", {
      title: "Guided Turn",
      scope: "With goals",
      tele: ["tele-1", "tele-2"],
    }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.turnId).toBeDefined();
  });

  it("list_turns filters by status", async () => {
    await router.handle("create_turn", { title: "T1", scope: "S1" }, ctx);

    const result = await router.handle("list_turns", { status: "active" }, ctx);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(0); // newly created turns are "planning"
  });
});
