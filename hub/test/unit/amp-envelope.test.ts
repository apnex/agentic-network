import { describe, it, expect } from "vitest";
import { createEnvelope, isLegacyCursor } from "../../src/amp/envelope.js";

describe("AMP Envelope", () => {
  it("creates envelope with ULID id", () => {
    const env = createEnvelope("test_event", { key: "value" });
    expect(env.id).toBeTruthy();
    expect(env.id.length).toBe(26); // ULID is 26 chars
    expect(env.type).toBe("test_event");
    expect(env.payload).toEqual({ key: "value" });
  });

  it("timestamp is decoded from ULID (parity)", () => {
    const before = Date.now();
    const env = createEnvelope("test", {});
    const after = Date.now();
    expect(env.timestamp).toBeGreaterThanOrEqual(before);
    expect(env.timestamp).toBeLessThanOrEqual(after);
  });

  it("consecutive ULIDs are monotonically increasing", () => {
    const e1 = createEnvelope("a", {});
    const e2 = createEnvelope("b", {});
    expect(e2.id > e1.id).toBe(true);
  });

  it("defaults sourceRole to hub", () => {
    const env = createEnvelope("test", {});
    expect(env.sourceRole).toBe("hub");
  });

  it("accepts custom sourceRole and correlationId", () => {
    const env = createEnvelope("test", {}, {
      sourceRole: "architect",
      correlationId: "mission-1",
    });
    expect(env.sourceRole).toBe("architect");
    expect(env.correlationId).toBe("mission-1");
  });

  it("isLegacyCursor detects integers", () => {
    expect(isLegacyCursor("592")).toBe(true);
    expect(isLegacyCursor("0")).toBe(true);
    expect(isLegacyCursor("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(false);
    expect(isLegacyCursor("")).toBe(false);
  });
});
