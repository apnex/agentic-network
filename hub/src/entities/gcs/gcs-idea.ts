/**
 * GCS-backed Idea Store.
 */

import {
  readJson,
  listFiles,
  getAndIncrementCounter,
  createOnly,
  updateExisting,
  GcsPathNotFound,
} from "../../gcs-state.js";
import type { Idea, IdeaStatus, IIdeaStore, CascadeBacklink } from "../idea.js";
import type { EntityProvenance } from "../../state.js";

/**
 * Migrate-on-read shim (task-305 C2). Legacy GCS JSON carries
 * `author: string` without `createdBy`. When such a legacy entity is
 * read, synthesize a `createdBy` from the legacy `author` field: the
 * string is treated as an agentId if it looks like an eng-* id, else
 * as a role. Placeholder agentId when only role is available.
 *
 * Transient — removable once the backfill script has swept the bucket
 * (C3). The shim guarantees the reader ALWAYS sees a populated
 * `createdBy`, so reader code can treat the field as required.
 */
function migrateIdeaOnRead(idea: Idea | null): Idea | null {
  if (!idea) return null;
  if (idea.createdBy) return idea;
  const legacy = (idea as unknown as { author?: string }).author;
  if (typeof legacy === "string" && legacy.length > 0) {
    const looksLikeAgentId = legacy.startsWith("eng-");
    const synth: EntityProvenance = looksLikeAgentId
      ? { role: "unknown", agentId: legacy }
      : { role: legacy, agentId: `anonymous-${legacy}` };
    return { ...idea, createdBy: synth };
  }
  return { ...idea, createdBy: { role: "unknown", agentId: "legacy-pre-provenance" } };
}

export class GcsIdeaStore implements IIdeaStore {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
    console.log(`[GcsIdeaStore] Using bucket: gs://${bucket}`);
  }

  async submitIdea(
    text: string,
    createdBy: EntityProvenance,
    sourceThreadId?: string,
    tags?: string[],
    backlink?: CascadeBacklink
  ): Promise<Idea> {
    const num = await getAndIncrementCounter(this.bucket, "ideaCounter");
    const id = `idea-${num}`;
    const now = new Date().toISOString();

    const idea: Idea = {
      id,
      text,
      createdBy,
      status: "open",
      missionId: null,
      sourceThreadId: backlink?.sourceThreadId ?? sourceThreadId ?? null,
      sourceActionId: backlink?.sourceActionId ?? null,
      sourceThreadSummary: backlink?.sourceThreadSummary ?? null,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await createOnly<Idea>(this.bucket, `ideas/${id}.json`, idea);
    console.log(`[GcsIdeaStore] Idea submitted: ${id}${backlink ? ` (cascade from ${backlink.sourceThreadId}/${backlink.sourceActionId})` : ""}`);
    return { ...idea };
  }

  async findByCascadeKey(key: Pick<CascadeBacklink, "sourceThreadId" | "sourceActionId">): Promise<Idea | null> {
    const files = await listFiles(this.bucket, "ideas/");
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await readJson<Idea>(this.bucket, file);
      const idea = migrateIdeaOnRead(raw);
      if (idea && idea.sourceThreadId === key.sourceThreadId && idea.sourceActionId === key.sourceActionId) {
        return idea;
      }
    }
    return null;
  }

  async getIdea(ideaId: string): Promise<Idea | null> {
    return migrateIdeaOnRead(await readJson<Idea>(this.bucket, `ideas/${ideaId}.json`));
  }

  async listIdeas(statusFilter?: IdeaStatus): Promise<Idea[]> {
    const files = await listFiles(this.bucket, "ideas/");
    const ideas: Idea[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const idea = migrateIdeaOnRead(await readJson<Idea>(this.bucket, file));
      if (idea) {
        if (statusFilter && idea.status !== statusFilter) continue;
        ideas.push(idea);
      }
    }
    return ideas;
  }

  async updateIdea(
    ideaId: string,
    updates: { status?: IdeaStatus; missionId?: string; tags?: string[]; text?: string }
  ): Promise<Idea | null> {
    const path = `ideas/${ideaId}.json`;
    try {
      const updated = await updateExisting<Idea>(this.bucket, path, (idea) => {
        if (updates.status) idea.status = updates.status;
        if (updates.missionId !== undefined) idea.missionId = updates.missionId;
        if (updates.tags) idea.tags = updates.tags;
        if (updates.text !== undefined) idea.text = updates.text;
        idea.updatedAt = new Date().toISOString();
        return idea;
      });
      console.log(`[GcsIdeaStore] Idea updated: ${ideaId} → status=${updated.status}`);
      return { ...updated };
    } catch (err) {
      if (err instanceof GcsPathNotFound) return null;
      throw err;
    }
  }
}
