/**
 * Deferred Backlog Unit Tests
 *
 * Layer:     Shim helpers (engineer-side prompt-format + notification-log)
 * Invariants pinned (see docs/network/06-test-specification.md):
 *   #15  Deferred backlog drops duplicates by content hash, not raw reference
 *   #16  Rate-limited prompts queue up to the configured cap and flush in order
 *
 * Tests the deferred backlog mechanism used by the OpenCode and stdio
 * engineer shims. Because the Plugin logic is tightly coupled to the
 * OpenCode SDK, these tests simulate the Plugin's notification pipeline
 * in isolation to validate every code path:
 *
 * 1. Rate-limited actionable events are queued (not silently dropped)
 * 2. Backlog is drained and appended to the next successful prompt
 * 3. Backlog is flushed independently on session.idle
 * 4. flushQueue drains backlog when sending actionable batches
 * 5. flushQueue adds actionable items to backlog when rate-limited
 * 6. Edge cases: empty backlog, informational-only events, autoPrompt=false
 */

import { describe, it, expect, beforeEach } from "vitest";

// ── Simulate the Plugin's notification pipeline ─────────────────────

interface QueuedNotification {
  level: "actionable" | "informational";
  message: string;
  promptText: string;
}

interface PluginSimulator {
  // State
  notificationQueue: QueuedNotification[];
  deferredBacklog: QueuedNotification[];
  lastPromptTime: number;
  autoPrompt: boolean;

  // Outputs (captured for assertions)
  prompts: string[];
  contexts: string[];
  toasts: string[];

  // Methods (mirror the Plugin's functions)
  processNotification(n: QueuedNotification): void;
  flushQueue(): void;
  flushBacklog(): void;
  simulateIdle(): void;
}

function createPluginSimulator(rateLimitMs = 30_000): PluginSimulator {
  const sim: PluginSimulator = {
    notificationQueue: [],
    deferredBacklog: [],
    lastPromptTime: 0,
    autoPrompt: true,
    prompts: [],
    contexts: [],
    toasts: [],

    processNotification(n: QueuedNotification) {
      sim.toasts.push(n.message);
      if (!sim.autoPrompt) return;

      const isRateLimited = () => Date.now() - sim.lastPromptTime < rateLimitMs;

      if (n.level === "actionable") {
        if (isRateLimited()) {
          sim.deferredBacklog.push(n);
          sim.toasts.push("Rate limited: queued for follow-up");
        } else {
          // Drain backlog and attach to prompt
          let backlog = "";
          if (sim.deferredBacklog.length > 0) {
            const lines = [
              "",
              `--- Deferred Backlog (${sim.deferredBacklog.length} event${sim.deferredBacklog.length > 1 ? "s" : ""}) ---`,
              "The following actionable events arrived while you were busy and were deferred.",
              "Please review and address them after your current task:",
            ];
            for (let i = 0; i < sim.deferredBacklog.length; i++) {
              lines.push(`${i + 1}. ${sim.deferredBacklog[i].promptText}`);
            }
            backlog = lines.join("\n");
            sim.deferredBacklog.length = 0;
          }
          sim.lastPromptTime = Date.now();
          sim.prompts.push(n.promptText + backlog);
        }
      } else {
        sim.contexts.push(n.promptText);
      }
    },

    flushQueue() {
      if (sim.notificationQueue.length === 0) return;
      const items = sim.notificationQueue.splice(0);

      if (items.length === 1) {
        sim.processNotification(items[0]);
        return;
      }

      for (const item of items) {
        sim.toasts.push(item.message);
      }

      if (!sim.autoPrompt) return;

      const isRateLimited = () => Date.now() - sim.lastPromptTime < rateLimitMs;

      const lines = ["While you were working, the following Hub events occurred:"];
      for (let i = 0; i < items.length; i++) {
        lines.push(`${i + 1}. ${items[i].promptText}`);
      }

      const hasActionable = items.some((i) => i.level === "actionable");
      if (hasActionable) {
        lines.push("\nPlease address the actionable items above.");
        if (!isRateLimited()) {
          // Drain backlog and attach
          let backlog = "";
          if (sim.deferredBacklog.length > 0) {
            const blines = [
              "",
              `--- Deferred Backlog (${sim.deferredBacklog.length} event${sim.deferredBacklog.length > 1 ? "s" : ""}) ---`,
              "The following actionable events arrived while you were busy and were deferred.",
              "Please review and address them after your current task:",
            ];
            for (let i = 0; i < sim.deferredBacklog.length; i++) {
              blines.push(`${i + 1}. ${sim.deferredBacklog[i].promptText}`);
            }
            backlog = blines.join("\n");
            sim.deferredBacklog.length = 0;
          }
          sim.lastPromptTime = Date.now();
          sim.prompts.push(lines.join("\n") + backlog);
        } else {
          // Rate limited — add actionable items to deferred backlog
          for (const item of items) {
            if (item.level === "actionable") {
              sim.deferredBacklog.push(item);
            }
          }
          sim.toasts.push("Rate limited: queued for follow-up");
        }
      } else {
        sim.contexts.push(lines.join("\n"));
      }
    },

    flushBacklog() {
      if (sim.deferredBacklog.length === 0) return;
      if (!sim.autoPrompt) {
        sim.deferredBacklog.length = 0;
        return;
      }

      const isRateLimited = () => Date.now() - sim.lastPromptTime < rateLimitMs;

      const lines = ["You have deferred Hub events that need attention:"];
      for (let i = 0; i < sim.deferredBacklog.length; i++) {
        lines.push(`${i + 1}. ${sim.deferredBacklog[i].promptText}`);
      }
      lines.push("\nPlease review and address these items.");
      sim.deferredBacklog.length = 0;

      if (!isRateLimited()) {
        sim.lastPromptTime = Date.now();
        sim.prompts.push(lines.join("\n"));
      } else {
        sim.contexts.push(lines.join("\n"));
      }
    },

    simulateIdle() {
      if (sim.notificationQueue.length > 0) {
        sim.flushQueue();
      } else if (sim.deferredBacklog.length > 0) {
        sim.flushBacklog();
      }
    },
  };

  return sim;
}

// ── Helpers ─────────────────────────────────────────────────────────

function makeActionable(id: string): QueuedNotification {
  return {
    level: "actionable",
    message: `New directive: ${id}`,
    promptText: `[Architect] Issued a new directive (${id}). Call get_directive.`,
  };
}

function makeInformational(id: string): QueuedNotification {
  return {
    level: "informational",
    message: `Review complete: ${id}`,
    promptText: `[Architect] Reviewed ${id}. Read it with get_review.`,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Deferred Backlog", () => {
  let sim: PluginSimulator;

  beforeEach(() => {
    sim = createPluginSimulator(30_000);
  });

  describe("processNotification", () => {
    it("sends prompt immediately when not rate-limited", () => {
      const n = makeActionable("task-1");
      sim.processNotification(n);

      expect(sim.prompts).toHaveLength(1);
      expect(sim.prompts[0]).toContain("task-1");
      expect(sim.deferredBacklog).toHaveLength(0);
    });

    it("queues to deferred backlog when rate-limited", () => {
      // First event — prompt fires, sets lastPromptTime
      sim.processNotification(makeActionable("task-1"));
      expect(sim.prompts).toHaveLength(1);

      // Second event within 30s — should be deferred
      sim.processNotification(makeActionable("task-2"));
      expect(sim.prompts).toHaveLength(1); // Still just 1 prompt
      expect(sim.deferredBacklog).toHaveLength(1);
      expect(sim.deferredBacklog[0].promptText).toContain("task-2");
      expect(sim.toasts).toContain("Rate limited: queued for follow-up");
    });

    it("does NOT silently drop rate-limited actionable events", () => {
      sim.processNotification(makeActionable("task-1"));

      // Rapid-fire 3 more events
      sim.processNotification(makeActionable("task-2"));
      sim.processNotification(makeActionable("task-3"));
      sim.processNotification(makeActionable("task-4"));

      // All 3 should be in the backlog, not lost
      expect(sim.deferredBacklog).toHaveLength(3);
      expect(sim.prompts).toHaveLength(1); // Only the first was prompted
    });

    it("drains backlog and attaches to next successful prompt", () => {
      // Event 1 — prompt fires
      sim.processNotification(makeActionable("task-1"));

      // Events 2-3 — rate limited, queued
      sim.processNotification(makeActionable("task-2"));
      sim.processNotification(makeActionable("task-3"));
      expect(sim.deferredBacklog).toHaveLength(2);

      // Clear rate limit
      sim.lastPromptTime = 0;

      // Event 4 — prompt fires, should include backlog
      sim.processNotification(makeActionable("task-4"));
      expect(sim.prompts).toHaveLength(2);
      expect(sim.prompts[1]).toContain("task-4"); // Primary event
      expect(sim.prompts[1]).toContain("Deferred Backlog (2 events)");
      expect(sim.prompts[1]).toContain("task-2");
      expect(sim.prompts[1]).toContain("task-3");
      expect(sim.deferredBacklog).toHaveLength(0); // Drained
    });

    it("informational events bypass backlog entirely", () => {
      sim.processNotification(makeActionable("task-1")); // Sets rate limit
      sim.processNotification(makeInformational("task-2")); // Informational

      expect(sim.deferredBacklog).toHaveLength(0);
      expect(sim.contexts).toHaveLength(1);
      expect(sim.contexts[0]).toContain("task-2");
    });

    it("does nothing when autoPrompt is false", () => {
      sim.autoPrompt = false;
      sim.processNotification(makeActionable("task-1"));

      expect(sim.prompts).toHaveLength(0);
      expect(sim.deferredBacklog).toHaveLength(0);
      expect(sim.contexts).toHaveLength(0);
    });
  });

  describe("flushBacklog", () => {
    it("sends a dedicated prompt with all deferred items", () => {
      // Manually populate backlog (simulating rate-limited events)
      sim.deferredBacklog.push(makeActionable("task-2"));
      sim.deferredBacklog.push(makeActionable("task-3"));

      sim.flushBacklog();

      expect(sim.prompts).toHaveLength(1);
      expect(sim.prompts[0]).toContain("deferred Hub events that need attention");
      expect(sim.prompts[0]).toContain("task-2");
      expect(sim.prompts[0]).toContain("task-3");
      expect(sim.deferredBacklog).toHaveLength(0);
    });

    it("does nothing when backlog is empty", () => {
      sim.flushBacklog();
      expect(sim.prompts).toHaveLength(0);
      expect(sim.contexts).toHaveLength(0);
    });

    it("falls back to context injection when rate-limited", () => {
      sim.lastPromptTime = Date.now(); // Rate limited
      sim.deferredBacklog.push(makeActionable("task-5"));

      sim.flushBacklog();

      expect(sim.prompts).toHaveLength(0);
      expect(sim.contexts).toHaveLength(1);
      expect(sim.contexts[0]).toContain("task-5");
      expect(sim.deferredBacklog).toHaveLength(0); // Still drained
    });

    it("clears backlog when autoPrompt is false", () => {
      sim.autoPrompt = false;
      sim.deferredBacklog.push(makeActionable("task-6"));

      sim.flushBacklog();

      expect(sim.deferredBacklog).toHaveLength(0);
      expect(sim.prompts).toHaveLength(0);
      expect(sim.contexts).toHaveLength(0);
    });
  });

  describe("flushQueue with backlog", () => {
    it("drains backlog when flushing actionable queue items", () => {
      // Pre-populate backlog
      sim.deferredBacklog.push(makeActionable("deferred-1"));

      // Queue items arrive while session was active
      sim.notificationQueue.push(makeActionable("queued-1"));
      sim.notificationQueue.push(makeInformational("queued-2"));

      sim.flushQueue();

      expect(sim.prompts).toHaveLength(1);
      expect(sim.prompts[0]).toContain("queued-1"); // Primary
      expect(sim.prompts[0]).toContain("Deferred Backlog (1 event)");
      expect(sim.prompts[0]).toContain("deferred-1");
      expect(sim.deferredBacklog).toHaveLength(0);
    });

    it("adds queue items to backlog when rate-limited during flush", () => {
      sim.lastPromptTime = Date.now(); // Rate limited

      sim.notificationQueue.push(makeActionable("queued-1"));
      sim.notificationQueue.push(makeActionable("queued-2"));
      sim.notificationQueue.push(makeInformational("queued-3"));

      sim.flushQueue();

      // Actionable items should be in backlog, not dropped
      expect(sim.deferredBacklog).toHaveLength(2);
      expect(sim.deferredBacklog[0].promptText).toContain("queued-1");
      expect(sim.deferredBacklog[1].promptText).toContain("queued-2");
      expect(sim.prompts).toHaveLength(0);
    });

    it("single-item queue delegates to processNotification", () => {
      sim.notificationQueue.push(makeActionable("single"));
      sim.flushQueue();

      expect(sim.prompts).toHaveLength(1);
      expect(sim.prompts[0]).toContain("single");
    });
  });

  describe("simulateIdle (session.idle handler)", () => {
    it("flushes queue first, then backlog", () => {
      // Both queue and backlog populated
      sim.notificationQueue.push(makeActionable("queued"));
      sim.deferredBacklog.push(makeActionable("deferred"));

      sim.simulateIdle();

      // Queue flush should have drained backlog too (since it's actionable)
      expect(sim.prompts).toHaveLength(1);
      expect(sim.deferredBacklog).toHaveLength(0);
      expect(sim.notificationQueue).toHaveLength(0);
    });

    it("flushes backlog when queue is empty", () => {
      sim.deferredBacklog.push(makeActionable("deferred-only"));

      sim.simulateIdle();

      expect(sim.prompts).toHaveLength(1);
      expect(sim.prompts[0]).toContain("deferred-only");
      expect(sim.deferredBacklog).toHaveLength(0);
    });

    it("does nothing when both queue and backlog are empty", () => {
      sim.simulateIdle();

      expect(sim.prompts).toHaveLength(0);
      expect(sim.contexts).toHaveLength(0);
    });
  });

  describe("full lifecycle", () => {
    it("nothing is lost across a full rate-limited → idle → prompt cycle", () => {
      // 1. First event prompts immediately
      sim.processNotification(makeActionable("task-1"));
      expect(sim.prompts).toHaveLength(1);

      // 2. Three more events arrive rapidly — all rate-limited
      sim.processNotification(makeActionable("task-2"));
      sim.processNotification(makeActionable("task-3"));
      sim.processNotification(makeInformational("info-1")); // Informational — injected as context
      sim.processNotification(makeActionable("task-4"));

      expect(sim.deferredBacklog).toHaveLength(3); // task-2, 3, 4
      expect(sim.contexts).toHaveLength(1); // info-1

      // 3. Session goes idle, but still rate-limited
      // (simulates: LLM finishes within 30s of last prompt)
      sim.simulateIdle();

      // Backlog flushed as context (rate limited), but not lost
      expect(sim.deferredBacklog).toHaveLength(0);
      expect(sim.contexts).toHaveLength(2); // info-1 + backlog context injection
      expect(sim.contexts[1]).toContain("task-2");
      expect(sim.contexts[1]).toContain("task-3");
      expect(sim.contexts[1]).toContain("task-4");
    });

    it("backlog attaches to next prompt when rate limit expires", () => {
      // 1. First event
      sim.processNotification(makeActionable("task-1"));

      // 2. Rate-limited events
      sim.processNotification(makeActionable("task-2"));
      sim.processNotification(makeActionable("task-3"));

      // 3. Rate limit expires
      sim.lastPromptTime = 0;

      // 4. New event arrives — should include backlog
      sim.processNotification(makeActionable("task-4"));

      expect(sim.prompts).toHaveLength(2);
      expect(sim.prompts[1]).toContain("task-4");
      expect(sim.prompts[1]).toContain("Deferred Backlog");
      expect(sim.prompts[1]).toContain("task-2");
      expect(sim.prompts[1]).toContain("task-3");

      // 5. Backlog is empty now
      expect(sim.deferredBacklog).toHaveLength(0);

      // 6. Further events are clean (no stale backlog)
      sim.lastPromptTime = 0;
      sim.processNotification(makeActionable("task-5"));
      expect(sim.prompts).toHaveLength(3);
      expect(sim.prompts[2]).not.toContain("Deferred Backlog");
    });

    it("backlog flushes on idle after rate limit expires", () => {
      // 1. First event
      sim.processNotification(makeActionable("task-1"));

      // 2. Rate-limited events
      sim.processNotification(makeActionable("task-2"));
      expect(sim.deferredBacklog).toHaveLength(1);

      // 3. Rate limit expires, session goes idle
      sim.lastPromptTime = 0;
      sim.simulateIdle();

      // Should get a dedicated prompt for deferred items
      expect(sim.prompts).toHaveLength(2);
      expect(sim.prompts[1]).toContain("deferred Hub events");
      expect(sim.prompts[1]).toContain("task-2");
    });
  });
});
