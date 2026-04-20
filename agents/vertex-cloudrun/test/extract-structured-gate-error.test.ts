/**
 * M-Hypervisor-Adapter-Mitigations Task 0/3 (Error Elision v1) —
 * extractStructuredGateError helper.
 *
 * Pins the parsing contract for CP2 C2's `ThreadConvergenceGateError`
 * structured shape as it flows back from Hub through the sandwich's
 * executeToolCall wrapper. Two inbound shapes must be accepted:
 *
 *   1. Cognitive-path HubReturnedError throws, wrapped at the catch
 *      site into `{error, envelope: {isError, content:[{text}]}}` —
 *      the envelope's text block is JSON.
 *   2. Legacy non-cognitive path where downstream code has already
 *      parsed the envelope into `{success:false, error, subtype,
 *      remediation, metadata?}`.
 */

import { describe, it, expect } from "vitest";
import { extractStructuredGateError } from "../src/sandwich.js";

describe("extractStructuredGateError — Task 0/3", () => {
  it("returns null for null rejection", () => {
    expect(extractStructuredGateError(null)).toBeNull();
  });

  it("returns null for an unstructured error payload (no subtype/remediation)", () => {
    expect(extractStructuredGateError({ error: "generic failure" })).toBeNull();
  });

  it("parses shape 1 — envelope-wrapped HubReturnedError JSON payload", () => {
    const rejection = {
      error: "Convergence gate rejected: summary_missing",
      envelope: {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Convergence gate rejected: summary_missing",
              subtype: "summary_missing",
              remediation: "Provide a non-empty summary narrating the thread's agreed outcome.",
              metadata: { entityType: "thread", entityId: "thread-99" },
            }),
          },
        ],
      },
    };
    const out = extractStructuredGateError(rejection);
    expect(out).not.toBeNull();
    expect(out!.subtype).toBe("summary_missing");
    expect(out!.remediation).toBe("Provide a non-empty summary narrating the thread's agreed outcome.");
    expect(out!.metadata).toEqual({ entityType: "thread", entityId: "thread-99" });
    expect(out!.error).toBe("Convergence gate rejected: summary_missing");
  });

  it("parses shape 2 — already-unwrapped JSON", () => {
    const rejection = {
      success: false,
      error: "Stale reference",
      subtype: "stale_reference",
      remediation: "The target entity mission-42 no longer exists; retract the staged action.",
      metadata: { entityType: "mission", entityId: "mission-42" },
    };
    const out = extractStructuredGateError(rejection);
    expect(out).not.toBeNull();
    expect(out!.subtype).toBe("stale_reference");
    expect(out!.remediation).toContain("mission-42");
    expect(out!.metadata).toEqual({ entityType: "mission", entityId: "mission-42" });
  });

  it("tolerates missing remediation when subtype is present (shape 1)", () => {
    const rejection = {
      envelope: {
        isError: true,
        content: [{ text: JSON.stringify({ success: false, subtype: "authority" }) }],
      },
    };
    const out = extractStructuredGateError(rejection);
    expect(out).not.toBeNull();
    expect(out!.subtype).toBe("authority");
    expect(out!.remediation).toBeUndefined();
  });

  it("tolerates missing subtype when remediation is present (shape 2)", () => {
    const rejection = {
      remediation: "Retry with the corrected action payload.",
    };
    const out = extractStructuredGateError(rejection);
    expect(out).not.toBeNull();
    expect(out!.subtype).toBeUndefined();
    expect(out!.remediation).toBe("Retry with the corrected action payload.");
  });

  it("returns null when envelope text is invalid JSON AND top-level has no fields", () => {
    const rejection = {
      envelope: {
        isError: true,
        content: [{ text: "not JSON at all" }],
      },
    };
    expect(extractStructuredGateError(rejection)).toBeNull();
  });

  it("ignores non-object metadata gracefully", () => {
    const rejection = {
      subtype: "payload_validation",
      metadata: "not an object",
    } as Record<string, unknown>;
    const out = extractStructuredGateError(rejection);
    expect(out!.subtype).toBe("payload_validation");
    expect(out!.metadata).toBeUndefined();
  });
});
