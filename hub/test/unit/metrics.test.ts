import { describe, it, expect } from "vitest";
import { createMetricsCounter, RECENT_DETAILS_CAP } from "../../src/observability/metrics.js";

describe("MetricsCounter", () => {
  it("starts empty", () => {
    const m = createMetricsCounter();
    expect(m.snapshot()).toEqual({});
  });

  it("increments buckets independently", () => {
    const m = createMetricsCounter();
    m.increment("a");
    m.increment("a");
    m.increment("b");
    expect(m.snapshot()).toEqual({ a: 2, b: 1 });
  });

  it("snapshot is a copy — mutation does not affect internal state", () => {
    const m = createMetricsCounter();
    m.increment("a");
    const snap = m.snapshot();
    snap.a = 99;
    expect(m.snapshot().a).toBe(1);
  });

  it("records details when provided", () => {
    const m = createMetricsCounter();
    m.increment("x", { reason: "first" });
    m.increment("x", { reason: "second" });
    m.increment("x"); // no details
    expect(m.snapshot().x).toBe(3);
    const recent = m.recentDetails("x");
    expect(recent).toHaveLength(2);
    expect(recent[0].details).toEqual({ reason: "first" });
    expect(recent[1].details).toEqual({ reason: "second" });
    expect(recent[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("recentDetails returns empty for unseen bucket", () => {
    const m = createMetricsCounter();
    expect(m.recentDetails("nope")).toEqual([]);
  });

  it("recentDetails buffer is bounded at RECENT_DETAILS_CAP", () => {
    const m = createMetricsCounter();
    const over = RECENT_DETAILS_CAP + 8;
    for (let i = 0; i < over; i++) {
      m.increment("y", { i });
    }
    const recent = m.recentDetails("y");
    expect(recent).toHaveLength(RECENT_DETAILS_CAP);
    // Buffer is FIFO; the oldest retained entry is i = over - CAP.
    expect(recent[0].details).toEqual({ i: over - RECENT_DETAILS_CAP });
    expect(recent[recent.length - 1].details).toEqual({ i: over - 1 });
  });

  it("recentDetails respects caller-supplied limit", () => {
    const m = createMetricsCounter();
    m.increment("z", { n: 1 });
    m.increment("z", { n: 2 });
    m.increment("z", { n: 3 });
    const two = m.recentDetails("z", 2);
    expect(two).toHaveLength(2);
    expect(two.map((e) => e.details)).toEqual([{ n: 2 }, { n: 3 }]);
  });

  it("counter increments even when no details are provided", () => {
    const m = createMetricsCounter();
    for (let i = 0; i < 10; i++) m.increment("silent");
    expect(m.snapshot().silent).toBe(10);
    expect(m.recentDetails("silent")).toEqual([]);
  });
});
