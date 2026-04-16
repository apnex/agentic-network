/**
 * Turn Entity — A high-level execution cycle (like a sprint).
 *
 * State machine:
 *   planning → active → completed
 *
 * Groups Missions and Tasks. References Tele (teleological goals)
 * as guiding axioms for the cycle.
 */

// ── Types ────────────────────────────────────────────────────────────

export type TurnStatus = "planning" | "active" | "completed";

export interface Turn {
  id: string;
  title: string;
  scope: string;       // Free-text markdown description of objectives
  status: TurnStatus;
  missionIds: string[];
  taskIds: string[];
  tele: string[];       // Tele IDs — teleological goals for this turn
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Interface ────────────────────────────────────────────────────────

export interface ITurnStore {
  createTurn(
    title: string,
    scope: string,
    tele?: string[]
  ): Promise<Turn>;

  getTurn(turnId: string): Promise<Turn | null>;

  listTurns(statusFilter?: TurnStatus): Promise<Turn[]>;

  updateTurn(
    turnId: string,
    updates: { status?: TurnStatus; scope?: string; tele?: string[] }
  ): Promise<Turn | null>;

  /** Append a mission ID (idempotent) */
  linkMission(turnId: string, missionId: string): Promise<void>;

  /** Append a task ID (idempotent) */
  linkTask(turnId: string, taskId: string): Promise<void>;
}

// ── Memory Implementation ────────────────────────────────────────────

export class MemoryTurnStore implements ITurnStore {
  private turns = new Map<string, Turn>();
  private counter = 0;

  async createTurn(
    title: string,
    scope: string,
    tele?: string[]
  ): Promise<Turn> {
    this.counter++;
    const id = `turn-${this.counter}`;
    const now = new Date().toISOString();

    const turn: Turn = {
      id,
      title,
      scope,
      status: "planning",
      missionIds: [],
      taskIds: [],
      tele: tele || [],
      correlationId: id,
      createdAt: now,
      updatedAt: now,
    };

    this.turns.set(id, turn);
    console.log(`[MemoryTurnStore] Turn created: ${id} — ${title}`);
    return { ...turn, missionIds: [...turn.missionIds], taskIds: [...turn.taskIds], tele: [...turn.tele] };
  }

  async getTurn(turnId: string): Promise<Turn | null> {
    const turn = this.turns.get(turnId);
    return turn
      ? { ...turn, missionIds: [...turn.missionIds], taskIds: [...turn.taskIds], tele: [...turn.tele] }
      : null;
  }

  async listTurns(statusFilter?: TurnStatus): Promise<Turn[]> {
    const all = Array.from(this.turns.values());
    const filtered = statusFilter
      ? all.filter((t) => t.status === statusFilter)
      : all;
    return filtered.map((t) => ({
      ...t,
      missionIds: [...t.missionIds],
      taskIds: [...t.taskIds],
      tele: [...t.tele],
    }));
  }

  async updateTurn(
    turnId: string,
    updates: { status?: TurnStatus; scope?: string; tele?: string[] }
  ): Promise<Turn | null> {
    const turn = this.turns.get(turnId);
    if (!turn) return null;

    if (updates.status) turn.status = updates.status;
    if (updates.scope !== undefined) turn.scope = updates.scope;
    if (updates.tele) turn.tele = updates.tele;
    turn.updatedAt = new Date().toISOString();

    console.log(`[MemoryTurnStore] Turn updated: ${turnId} → status=${turn.status}`);
    return { ...turn, missionIds: [...turn.missionIds], taskIds: [...turn.taskIds], tele: [...turn.tele] };
  }

  async linkMission(turnId: string, missionId: string): Promise<void> {
    const turn = this.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    if (!turn.missionIds.includes(missionId)) {
      turn.missionIds.push(missionId);
      turn.updatedAt = new Date().toISOString();
      console.log(`[MemoryTurnStore] Linked mission ${missionId} to ${turnId}`);
    }
  }

  async linkTask(turnId: string, taskId: string): Promise<void> {
    const turn = this.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    if (!turn.taskIds.includes(taskId)) {
      turn.taskIds.push(taskId);
      turn.updatedAt = new Date().toISOString();
      console.log(`[MemoryTurnStore] Linked task ${taskId} to ${turnId}`);
    }
  }
}
