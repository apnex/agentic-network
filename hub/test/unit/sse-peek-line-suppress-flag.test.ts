/**
 * Phase-1.5 #1 (M-SSE-Filter-List-Adapter-Consumption) — Hub-side
 * suppress_peek_line flag setting tests per Design v1.0 §2.1.
 *
 * Pins:
 * - Filter-listed events (per §1.5 of parent Design v1.1) get
 *   `suppress_peek_line: true` on augmented data
 * - Non-filter events do NOT have `suppress_peek_line` (undefined; wire
 *   minimization per §1.2 of Phase-1.5 #1 Design v1.0)
 * - Original data fields preserved verbatim (no field removal)
 * - Filter-listed events skip render-context derivation (no body/sourceClass
 *   added; saves Hub work on suppressed events)
 *
 * Note (per round-2 audit F2.b): of the 4 §1.5 filter classes, only
 * `agent_state_changed` actually fires at the notifyEvent/dispatchEvent
 * layer in current production. The pulse-on-standby check works in
 * isolation (when called with event="engineerPulse") but pulses fire as
 * `message_arrived` on the wire — so the flag isn't set there. Coverage
 * here pins the operational case (`agent_state_changed`) and the unit-
 * level filter behavior; pulse-via-message_arrived is Phase-1.5 #1.1.
 */

import { describe, expect, it } from "vitest";

import { augmentDataWithRenderFields } from "../../src/hub-networking.js";

describe("augmentDataWithRenderFields — suppress_peek_line (Phase-1.5 #1)", () => {
  it("sets suppress_peek_line=true for agent_state_changed (operator-visible filter case)", () => {
    const augmented = augmentDataWithRenderFields("agent_state_changed", {
      agent: { id: "a-1", role: "engineer" },
      cause: "sse_subscribe",
    });
    expect(augmented.suppress_peek_line).toBe(true);
  });

  it("preserves original data fields verbatim when suppressed", () => {
    const original = {
      agent: { id: "a-1", role: "engineer", livenessState: "alive" },
      cause: "sse_subscribe",
      changed: ["livenessState"],
    };
    const augmented = augmentDataWithRenderFields("agent_state_changed", original);
    // All original fields preserved
    expect(augmented.agent).toEqual(original.agent);
    expect(augmented.cause).toBe(original.cause);
    expect(augmented.changed).toEqual(original.changed);
    // Plus suppress flag
    expect(augmented.suppress_peek_line).toBe(true);
  });

  it("does NOT set sourceClass/entityRef/actionability/body on suppressed events (Hub work-saving)", () => {
    const augmented = augmentDataWithRenderFields("agent_state_changed", {
      agent: { id: "a-1", role: "engineer" },
    });
    expect(augmented.sourceClass).toBeUndefined();
    expect(augmented.entityRef).toBeUndefined();
    expect(augmented.actionability).toBeUndefined();
    expect(augmented.body).toBeUndefined();
  });

  it("omits suppress_peek_line for non-filter events (wire-shape minimization per §1.2)", () => {
    const augmented = augmentDataWithRenderFields("thread_message", {
      author: "architect",
      threadId: "thread-1",
      title: "T",
      message: "preview",
    });
    // Per §1.2: emit undefined (= omit) for non-suppressed; keeps wire compact
    expect(augmented.suppress_peek_line).toBeUndefined();
    // Phase-1 render fields still populated
    expect(augmented.sourceClass).toBe("Architect");
    expect(augmented.body).toMatch(/^\[Architect\]/);
  });

  it("omits suppress_peek_line for mission_status_changed", () => {
    const augmented = augmentDataWithRenderFields("mission_status_changed", {
      missionId: "mission-1",
      fromStatus: "proposed",
      toStatus: "active",
    });
    expect(augmented.suppress_peek_line).toBeUndefined();
  });

  it("omits suppress_peek_line for PR-events", () => {
    const augmented = augmentDataWithRenderFields("pr-opened-notification", {
      authorRole: "engineer",
      prNumber: 42,
      prTitle: "test PR",
    });
    expect(augmented.suppress_peek_line).toBeUndefined();
    expect(augmented.sourceClass).toBe("System-PR");
  });

  it("does NOT silently drop the Message — augmented data still flows for state-machine consumption", () => {
    // Per §1.5 implementation note: "Filtered events still flow to
    // adapter-internal state-machine ... they just don't surface to
    // terminal." The augment helper does NOT drop the data; it only
    // marks suppress_peek_line=true so adapter routes accordingly.
    const augmented = augmentDataWithRenderFields("agent_state_changed", {
      agent: { id: "a-1" },
    });
    expect(augmented).toBeDefined();
    expect(augmented.agent).toBeDefined();
  });
});
