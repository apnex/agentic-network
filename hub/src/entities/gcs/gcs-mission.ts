/**
 * GCS-backed Mission Store.
 */

import { readJson, writeJson, listFiles, getAndIncrementCounter } from "../../gcs-state.js";
import type { Mission, MissionStatus, IMissionStore } from "../mission.js";

export class GcsMissionStore implements IMissionStore {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
    console.log(`[GcsMissionStore] Using bucket: gs://${bucket}`);
  }

  async createMission(
    title: string,
    description: string,
    documentRef?: string
  ): Promise<Mission> {
    const num = await getAndIncrementCounter(this.bucket, "missionCounter");
    const id = `mission-${num}`;
    const now = new Date().toISOString();

    const mission: Mission = {
      id,
      title,
      description,
      documentRef: documentRef || null,
      status: "proposed",
      tasks: [],
      ideas: [],
      correlationId: id,
      createdAt: now,
      updatedAt: now,
    };

    await writeJson(this.bucket, `missions/${id}.json`, mission);
    console.log(`[GcsMissionStore] Mission created: ${id} — ${title}`);
    return { ...mission };
  }

  async getMission(missionId: string): Promise<Mission | null> {
    return await readJson<Mission>(this.bucket, `missions/${missionId}.json`);
  }

  async listMissions(statusFilter?: MissionStatus): Promise<Mission[]> {
    const files = await listFiles(this.bucket, "missions/");
    const missions: Mission[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const m = await readJson<Mission>(this.bucket, file);
      if (m) {
        if (statusFilter && m.status !== statusFilter) continue;
        missions.push(m);
      }
    }
    return missions;
  }

  async updateMission(
    missionId: string,
    updates: { status?: MissionStatus; description?: string; documentRef?: string }
  ): Promise<Mission | null> {
    const path = `missions/${missionId}.json`;
    const mission = await readJson<Mission>(this.bucket, path);
    if (!mission) return null;

    if (updates.status) mission.status = updates.status;
    if (updates.description !== undefined) mission.description = updates.description;
    if (updates.documentRef !== undefined) mission.documentRef = updates.documentRef;
    mission.updatedAt = new Date().toISOString();

    await writeJson(this.bucket, path, mission);
    console.log(`[GcsMissionStore] Mission updated: ${missionId} → status=${mission.status}`);
    return { ...mission, tasks: [...mission.tasks], ideas: [...mission.ideas] };
  }

  async linkTask(missionId: string, taskId: string): Promise<void> {
    const path = `missions/${missionId}.json`;
    const mission = await readJson<Mission>(this.bucket, path);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);
    if (!mission.tasks.includes(taskId)) {
      mission.tasks.push(taskId);
      mission.updatedAt = new Date().toISOString();
      await writeJson(this.bucket, path, mission);
      console.log(`[GcsMissionStore] Linked task ${taskId} to ${missionId}`);
    }
  }

  async linkIdea(missionId: string, ideaId: string): Promise<void> {
    const path = `missions/${missionId}.json`;
    const mission = await readJson<Mission>(this.bucket, path);
    if (!mission) throw new Error(`Mission not found: ${missionId}`);
    if (!mission.ideas.includes(ideaId)) {
      mission.ideas.push(ideaId);
      mission.updatedAt = new Date().toISOString();
      await writeJson(this.bucket, path, mission);
      console.log(`[GcsMissionStore] Linked idea ${ideaId} to ${missionId}`);
    }
  }
}
