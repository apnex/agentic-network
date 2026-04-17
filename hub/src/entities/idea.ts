/**
 * Idea Entity — Lightweight backlog item for unrefined thoughts.
 *
 * No complex state machine. Status transitions:
 *   open → triaged → incorporated (linked to Mission)
 *   open → dismissed
 */

// ── Types ────────────────────────────────────────────────────────────

export type IdeaStatus = "open" | "triaged" | "dismissed" | "incorporated";

export interface Idea {
  id: string;
  text: string;
  author: string;
  status: IdeaStatus;
  missionId: string | null;
  sourceThreadId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Interface ────────────────────────────────────────────────────────

export interface IIdeaStore {
  submitIdea(
    text: string,
    author: string,
    sourceThreadId?: string,
    tags?: string[]
  ): Promise<Idea>;

  getIdea(ideaId: string): Promise<Idea | null>;

  listIdeas(statusFilter?: IdeaStatus): Promise<Idea[]>;

  updateIdea(
    ideaId: string,
    updates: { status?: IdeaStatus; missionId?: string; tags?: string[]; text?: string }
  ): Promise<Idea | null>;
}

// ── Memory Implementation ────────────────────────────────────────────

export class MemoryIdeaStore implements IIdeaStore {
  private ideas = new Map<string, Idea>();
  private counter = 0;

  async submitIdea(
    text: string,
    author: string,
    sourceThreadId?: string,
    tags?: string[]
  ): Promise<Idea> {
    this.counter++;
    const id = `idea-${this.counter}`;
    const now = new Date().toISOString();

    const idea: Idea = {
      id,
      text,
      author,
      status: "open",
      missionId: null,
      sourceThreadId: sourceThreadId || null,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.ideas.set(id, idea);
    console.log(`[MemoryIdeaStore] Idea submitted: ${id}`);
    return { ...idea };
  }

  async getIdea(ideaId: string): Promise<Idea | null> {
    const idea = this.ideas.get(ideaId);
    return idea ? { ...idea } : null;
  }

  async listIdeas(statusFilter?: IdeaStatus): Promise<Idea[]> {
    const all = Array.from(this.ideas.values());
    const filtered = statusFilter
      ? all.filter((i) => i.status === statusFilter)
      : all;
    return filtered.map((i) => ({ ...i }));
  }

  async updateIdea(
    ideaId: string,
    updates: { status?: IdeaStatus; missionId?: string; tags?: string[]; text?: string }
  ): Promise<Idea | null> {
    const idea = this.ideas.get(ideaId);
    if (!idea) return null;

    if (updates.status) idea.status = updates.status;
    if (updates.missionId !== undefined) idea.missionId = updates.missionId;
    if (updates.tags) idea.tags = updates.tags;
    if (updates.text !== undefined) idea.text = updates.text;
    idea.updatedAt = new Date().toISOString();

    console.log(`[MemoryIdeaStore] Idea updated: ${ideaId} → status=${idea.status}`);
    return { ...idea };
  }
}
