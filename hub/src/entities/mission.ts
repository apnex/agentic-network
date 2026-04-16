/**
 * Mission Entity — A committed arc of work grouping related tasks.
 *
 * Lightweight state machine:
 *   proposed → active → completed
 *                     → abandoned
 *
 * Links to Tasks and Ideas via arrays. Auto-linkage is handled
 * at the controller layer (Hub tool handlers), not in the store.
 */

// ── Types ────────────────────────────────────────────────────────────

export type MissionStatus = "proposed" | "active" | "completed" | "abandoned";

export interface Mission {
  id: string;
  title: string;
  description: string;
  documentRef: string | null;
  status: MissionStatus;
  tasks: string[];
  ideas: string[];
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Interface ────────────────────────────────────────────────────────

export interface IMissionStore {
  createMission(
    title: string,
    description: string,
    documentRef?: string
  ): Promise<Mission>;

  getMission(missionId: string): Promise<Mission | null>;

  listMissions(statusFilter?: MissionStatus): Promise<Mission[]>;

  updateMission(
    missionId: string,
    updates: { status?: MissionStatus; description?: string; documentRef?: string }
  ): Promise<Mission | null>;

  /** Append a task ID (idempotent — deduplicates) */
  linkTask(missionId: string, taskId: string): Promise<void>;

  /** Append an idea ID (idempotent — deduplicates) */
  linkIdea(missionId: string, ideaId: string): Promise<void>;
}

// ── Memory Implementation ────────────────────────────────────────────

export class MemoryMissionStore implements IMissionStore {
  private missions = new Map<string, Mission>();
  private counter = 0;

  async createMission(
    title: string,
    description: string,
    documentRef?: string
  ): Promise<Mission> {
    this.counter++;
    const id = `mission-${this.counter}`;
    const now = new Date().toISOString();

    const mission: Mission = {
      id,
      title,
      description,
      documentRef: documentRef || null,
      status: "proposed",
      tasks: [],
      ideas: [],
      correlationId: id, // Self-referencing for auto-linkage
      createdAt: now,
      updatedAt: now,
    };

    this.missions.set(id, mission);
    console.log(`[MemoryMissionStore] Mission created: ${id} — ${title}`);
    return { ...mission };
  }

  async getMission(missionId: string): Promise<Mission | null> {
    const mission = this.missions.get(missionId);
    return mission ? { ...mission, tasks: [...mission.tasks], ideas: [...mission.ideas] } : null;
  }

  async listMissions(statusFilter?: MissionStatus): Promise<Mission[]> {
    const all = Array.from(this.missions.values());
    const filtered = statusFilter
      ? all.filter((m) => m.status === statusFilter)
      : all;
    return filtered.map((m) => ({
      ...m,
      tasks: [...m.tasks],
      ideas: [...m.ideas],
    }));
  }

  async updateMission(
    missionId: string,
    updates: { status?: MissionStatus; description?: string; documentRef?: string }
  ): Promise<Mission | null> {
    const mission = this.missions.get(missionId);
    if (!mission) return null;

    if (updates.status) mission.status = updates.status;
    if (updates.description !== undefined) mission.description = updates.description;
    if (updates.documentRef !== undefined) mission.documentRef = updates.documentRef;
    mission.updatedAt = new Date().toISOString();

    console.log(`[MemoryMissionStore] Mission updated: ${missionId} → status=${mission.status}`);
    return { ...mission, tasks: [...mission.tasks], ideas: [...mission.ideas] };
  }

  async linkTask(missionId: string, taskId: string): Promise<void> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);
    if (!mission.tasks.includes(taskId)) {
      mission.tasks.push(taskId);
      mission.updatedAt = new Date().toISOString();
      console.log(`[MemoryMissionStore] Linked task ${taskId} to ${missionId}`);
    }
  }

  async linkIdea(missionId: string, ideaId: string): Promise<void> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);
    if (!mission.ideas.includes(ideaId)) {
      mission.ideas.push(ideaId);
      mission.updatedAt = new Date().toISOString();
      console.log(`[MemoryMissionStore] Linked idea ${ideaId} to ${missionId}`);
    }
  }
}
