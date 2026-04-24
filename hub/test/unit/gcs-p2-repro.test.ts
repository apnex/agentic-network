/**
 * Mission-20 Phase 3 — P2 concurrency reproductions.
 *
 * For each P2 site catalogued in `docs/history/mission-20-phase1-audit.md`,
 * drive two concurrent mutations against the same object through the
 * store's public API and assert that BOTH mutations survive in the final
 * state. Under the pre-Phase-2 naked read-modify-write, the second write
 * would silently clobber the first (the lost-update bug). Under the
 * Phase-2 `updateExisting` CAS primitive, the second write fails on
 * `ifGenerationMatch`, retries, and re-applies its mutation on top of
 * the freshly-read state.
 *
 * These tests must be kept — they are regression coverage against
 * reintroducing naked RMWs.
 *
 * Audit reference: `docs/history/mission-20-phase1-audit.md` §3.
 * ADR: `docs/decisions/011-gcs-concurrency-model.md`.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GcsFakeStorage, installGcsFake, gcsFake } from "./_gcs-fake.js";

vi.mock("@google-cloud/storage", () => ({ Storage: GcsFakeStorage }));

// Imports must be AFTER vi.mock so the mocked Storage is picked up
// when `gcs-state.ts` constructs `new Storage()` at module init.
// Mission-47 W2/W4/W5: GcsIdeaStore + GcsMissionStore + GcsTaskStore +
// GcsProposalStore deleted — their concurrency is now exercised via
// the storage-provider conformance suite (CAS primitive) plus the
// Repository-class casUpdate loops. Obsolete reproduction blocks
// removed. GcsTurnStore + GcsThreadStore reproductions stay (W6).
const { GcsTurnStore } = await import("../../src/entities/gcs/gcs-turn.js");
const {
  GcsThreadStore,
} = await import("../../src/gcs-state.js");

const BUCKET = "test-bucket";

beforeEach(() => {
  installGcsFake();
});

// ── GcsTurnStore ────────────────────────────────────────────────────

describe("GcsTurnStore.updateTurn — lost-update reproduction", () => {
  it("preserves disjoint field mutations under concurrent writers", async () => {
    const missionStore = { listMissions: async () => [] } as any;
    const taskStore = { listTasks: async () => [] } as any;
    const store = new GcsTurnStore(BUCKET, missionStore, taskStore);
    gcsFake().put("turns/turn-1.json", {
      id: "turn-1",
      title: "seed",
      scope: "initial scope",
      status: "planning",
      missionIds: [],
      taskIds: [],
      tele: [],
      correlationId: "turn-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await Promise.all([
      store.updateTurn("turn-1", { scope: "revised scope" }),
      store.updateTurn("turn-1", { tele: ["tele-1"] }),
    ]);

    const final = await store.getTurn("turn-1");
    expect(final).not.toBeNull();
    expect(final!.scope).toBe("revised scope");
    expect(final!.tele).toEqual(["tele-1"]);
  });
});


// Mission-47 W5: GcsTaskStore + GcsProposalStore sections removed
// — those stores are now TaskRepository + ProposalRepository, exercised
// via the @ois/storage-provider conformance suite + Repository casUpdate
// loops. Sections kept: GcsTurnStore + GcsThreadStore (not yet migrated).

// ── GcsThreadStore per-file messages split (Phase 3 P1) ─────────────

describe("GcsThreadStore per-file messages — concurrent reply reproduction", () => {
  it("alternating-author concurrent calls: only current-turn author wins, no message corruption", async () => {
    const store = new GcsThreadStore(BUCKET);
    const thread = await store.openThread("t", "hello", "architect", 10);

    // After openThread, currentTurn=engineer. Fire engineer's reply
    // concurrently with architect's reply. Turn-gate rejects the
    // off-turn author (TransitionRejected → null); engineer wins.
    const [rEng, rArch] = await Promise.all([
      store.replyToThread(thread.id, "eng msg", "engineer"),
      store.replyToThread(thread.id, "arch msg", "architect"),
    ]);

    expect(rEng).not.toBeNull();
    expect(rArch).toBeNull();

    // Per-file hydration preserves both the opener and the winning
    // reply in sequence; no messages[] RMW means no corruption.
    const final = await store.getThread(thread.id);
    expect(final!.roundCount).toBe(2);
    expect(final!.messages.length).toBe(2);
    expect(final!.messages[0].text).toBe("hello");
    expect(final!.messages[1].text).toBe("eng msg");
  });

  it("sequential alternating replies hydrate per-file messages in order", async () => {
    const store = new GcsThreadStore(BUCKET);
    const thread = await store.openThread("t", "hello", "architect", 10);

    const r1 = await store.replyToThread(thread.id, "eng msg", "engineer");
    const r2 = await store.replyToThread(thread.id, "arch msg", "architect");

    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();

    const final = await store.getThread(thread.id);
    expect(final!.roundCount).toBe(3);
    expect(final!.messages.length).toBe(3);
    expect(final!.messages.map((m) => m.text)).toEqual(["hello", "eng msg", "arch msg"]);
  });

  it("two same-author concurrent replies — exactly one wins the turn gate", async () => {
    const store = new GcsThreadStore(BUCKET);
    const thread = await store.openThread("t", "hello", "architect", 10);

    // Both claim to be engineer; only one can pass the turn-gate in
    // its transform. The loser's retry sees currentTurn=architect and
    // TransitionRejected fires → null.
    const [a, b] = await Promise.all([
      store.replyToThread(thread.id, "first eng msg", "engineer"),
      store.replyToThread(thread.id, "second eng msg", "engineer"),
    ]);

    const winners = [a, b].filter((r) => r !== null);
    expect(winners).toHaveLength(1);

    const final = await store.getThread(thread.id);
    expect(final!.roundCount).toBe(2);
    expect(final!.messages.length).toBe(2);
  });

  it("convergence trips when two consecutive replies are both converged=true (with gate satisfied)", async () => {
    const store = new GcsThreadStore(BUCKET);
    const thread = await store.openThread("t", "hello", "architect", 10);

    // Mission-21 Phase 1: converged=true alone is not enough — the
    // gate requires at least one committed action and a non-empty
    // summary. Attach them on the first converging reply; the second
    // reply inherits the staged actions + summary and commits at the
    // turn transition.
    const r1 = await store.replyToThread(thread.id, "eng agrees", "engineer", {
      converged: true,
      stagedActions: [{ kind: "stage", type: "close_no_action", payload: { reason: "nothing to do" } }],
      summary: "Both agreed: no action required.",
    });
    expect(r1!.status).toBe("active"); // one converged flag not enough
    expect(r1!.lastMessageConverged).toBe(true);

    const r2 = await store.replyToThread(thread.id, "arch agrees", "architect", { converged: true });
    expect(r2!.status).toBe("converged");
    expect(r2!.convergenceActions.filter((a) => a.status === "committed").length).toBe(1);
  });
});

