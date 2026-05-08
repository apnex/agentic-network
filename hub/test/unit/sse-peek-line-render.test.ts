/**
 * M-SSE-Peek-Line-Cleanup Phase 1 — render-function + auto-derivation
 * tests per Design v1.1 §3 test discipline.
 *
 * Pin contract via format-regex (per `feedback_format_regex_over_hardcoded_hash_tests.md`)
 * not specific values — less brittle to render-impl tuning.
 */

import { describe, expect, it } from "vitest";

import {
  deriveRenderContext,
  PEEK_LINE_BUDGET,
  PEEK_LINE_FORMAT_REGEX,
  renderPeekLineBody,
  renderUnknownFallback,
  shouldFilterPeekLine,
  SOURCE_CLASSES,
} from "../../src/policy/sse-peek-line-render.js";

describe("renderPeekLineBody", () => {
  it("renders the canonical §2.1 template format", () => {
    const body = renderPeekLineBody({
      sourceClass: "Engineer",
      actionVerb: "Replied to",
      entityRef: { type: "thread", id: "thread-487", title: "idea-252 cleanup" },
      bodyPreview: "Round-2 audit response. Concur on 7 design-asks",
      actionability: "your-turn",
    });
    // Format-regex contract pins canonical structure (§3 render contract test)
    expect(body).toMatch(PEEK_LINE_FORMAT_REGEX);
    // sourceClass-prefix in brackets
    expect(body).toMatch(/^\[Engineer\]/);
    // actionability-marker in brackets at end
    expect(body).toMatch(/\[your-turn\]$/);
    // entity-id present
    expect(body).toContain("thread-487");
  });

  it("respects the §2.3 ~200-char total budget when content fits", () => {
    const body = renderPeekLineBody({
      sourceClass: "Hub",
      actionVerb: "Activated",
      entityRef: { type: "mission", id: "mission-76", title: "M-Test" },
      actionability: "FYI",
    });
    // Short content → no truncation suffix
    expect(body).not.toContain("...");
    expect(body.length).toBeLessThanOrEqual(PEEK_LINE_BUDGET);
  });

  it("truncates body-preview first when over §2.3 budget", () => {
    const longPreview = "x".repeat(300); // overflow the 200-char budget
    const body = renderPeekLineBody({
      sourceClass: "Hub",
      actionVerb: "Replied to",
      entityRef: { type: "thread", id: "thread-1" },
      bodyPreview: longPreview,
      actionability: "FYI",
    });
    expect(body.length).toBeLessThanOrEqual(PEEK_LINE_BUDGET);
    // body-preview tail truncation marker per §2.3
    expect(body).toContain("...");
    // sourceClass + entity-id + actionability NEVER truncated
    expect(body).toMatch(/^\[Hub\]/);
    expect(body).toContain("thread-1");
    expect(body).toMatch(/\[FYI\]$/);
  });

  it("renders with no entityRef (bare system note)", () => {
    const body = renderPeekLineBody({
      sourceClass: "Hub",
      actionVerb: "Heartbeat",
      actionability: "FYI",
    });
    expect(body).toMatch(/^\[Hub\] Heartbeat/);
    expect(body).toMatch(/\[FYI\]$/);
  });
});

describe("renderUnknownFallback (§3 backward-compat)", () => {
  it("prefixes [unknown] for pre-Phase-1 records", () => {
    const body = renderUnknownFallback("legacy peek-line content");
    expect(body).toMatch(/^\[unknown\]/);
  });

  it("respects budget", () => {
    const body = renderUnknownFallback("x".repeat(300));
    expect(body.length).toBeLessThanOrEqual(PEEK_LINE_BUDGET);
  });
});

describe("shouldFilterPeekLine (§1.5 filter list — F4 fold)", () => {
  it("filters agent_state_changed (load-bearing default per §1.5)", () => {
    expect(shouldFilterPeekLine("agent_state_changed")).toBe(true);
  });

  it("filters touchAgent rate-limited updates", () => {
    expect(shouldFilterPeekLine("touchAgent")).toBe(true);
  });

  it("filters W1b replay-truncated synthetic SSE events", () => {
    expect(shouldFilterPeekLine("sse_replay_truncated")).toBe(true);
  });

  it("filters engineerPulse on standby-acknowledged state (template-carryover)", () => {
    expect(
      shouldFilterPeekLine("engineerPulse", { state: "standby", acknowledged: true }),
    ).toBe(true);
  });

  it("does NOT filter engineerPulse on non-standby states (still operator-relevant)", () => {
    expect(shouldFilterPeekLine("engineerPulse", { state: "active" })).toBe(false);
  });

  it("does NOT filter normal events (thread_message, mission_status_changed, etc.)", () => {
    expect(shouldFilterPeekLine("thread_message")).toBe(false);
    expect(shouldFilterPeekLine("mission_status_changed")).toBe(false);
    expect(shouldFilterPeekLine("pr-opened-notification")).toBe(false);
  });
});

describe("deriveRenderContext (§1.2 + §2.2 resolution table)", () => {
  it("maps thread_message → Engineer/Architect sourceClass per author", () => {
    const ctx = deriveRenderContext("thread_message", {
      author: "architect",
      threadId: "thread-1",
      title: "T",
    });
    expect(ctx).not.toBeNull();
    expect(ctx?.sourceClass).toBe("Architect");
    expect(ctx?.actionVerb).toBe("Replied to");
    expect(ctx?.entityRef?.type).toBe("thread");
    expect(ctx?.actionability).toBe("your-turn");
  });

  it("maps thread_convergence_finalized → Hub", () => {
    const ctx = deriveRenderContext("thread_convergence_finalized", {
      threadId: "thread-2",
    });
    expect(ctx?.sourceClass).toBe("Hub");
    expect(ctx?.actionVerb).toBe("Converged");
    expect(ctx?.actionability).toBe("FYI");
  });

  it("maps mission_status_changed:proposed→active to Activated verb", () => {
    const ctx = deriveRenderContext("mission_status_changed", {
      missionId: "mission-1",
      fromStatus: "proposed",
      toStatus: "active",
    });
    expect(ctx?.actionVerb).toBe("Activated");
    expect(ctx?.entityRef?.type).toBe("mission");
  });

  it("maps PR-events → System-PR sourceClass", () => {
    const ctx = deriveRenderContext("pr-opened-notification", {
      authorRole: "engineer",
      prNumber: 42,
      prTitle: "test PR",
    });
    expect(ctx?.sourceClass).toBe("System-PR");
    expect(ctx?.actionVerb).toContain("opened");
    expect(ctx?.entityRef?.id).toBe("PR #42");
    expect(ctx?.actionability).toBe("emitted");
  });

  it("maps pulse events → System-Pulse sourceClass", () => {
    const ctx = deriveRenderContext("engineerPulse", {
      missionId: "mission-1",
      state: "active",
    });
    expect(ctx?.sourceClass).toBe("System-Pulse");
    expect(ctx?.actionability).toBe("FYI");
  });

  it("returns null for filter-listed events (§1.5)", () => {
    expect(deriveRenderContext("agent_state_changed", {})).toBeNull();
    expect(
      deriveRenderContext("engineerPulse", { state: "standby", acknowledged: true }),
    ).toBeNull();
  });

  it("falls back to Hub sourceClass for unknown events", () => {
    const ctx = deriveRenderContext("custom_event", {});
    expect(ctx?.sourceClass).toBe("Hub");
    expect(ctx?.actionability).toBe("FYI");
  });
});

describe("Source-class enum contract (§3)", () => {
  it("includes exactly the 8 ratified classes (§1.2 + idea-255 System-Workflow)", () => {
    expect(SOURCE_CLASSES).toEqual([
      "Hub",
      "Director",
      "Engineer",
      "Architect",
      "System-PR",
      "System-Pulse",
      "System-Audit",
      "System-Workflow",
    ]);
  });
});
