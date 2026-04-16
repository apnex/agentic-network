/**
 * GCS-backed Turn Store.
 */

import { readJson, writeJson, listFiles, getAndIncrementCounter } from "../../gcs-state.js";
import type { Turn, TurnStatus, ITurnStore } from "../turn.js";

export class GcsTurnStore implements ITurnStore {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
    console.log(`[GcsTurnStore] Using bucket: gs://${bucket}`);
  }

  async createTurn(
    title: string,
    scope: string,
    tele?: string[]
  ): Promise<Turn> {
    const num = await getAndIncrementCounter(this.bucket, "turnCounter");
    const id = `turn-${num}`;
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

    await writeJson(this.bucket, `turns/${id}.json`, turn);
    console.log(`[GcsTurnStore] Turn created: ${id} — ${title}`);
    return { ...turn, missionIds: [...turn.missionIds], taskIds: [...turn.taskIds], tele: [...turn.tele] };
  }

  async getTurn(turnId: string): Promise<Turn | null> {
    return await readJson<Turn>(this.bucket, `turns/${turnId}.json`);
  }

  async listTurns(statusFilter?: TurnStatus): Promise<Turn[]> {
    const files = await listFiles(this.bucket, "turns/");
    const turns: Turn[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const t = await readJson<Turn>(this.bucket, file);
      if (t) {
        if (statusFilter && t.status !== statusFilter) continue;
        turns.push(t);
      }
    }
    return turns;
  }

  async updateTurn(
    turnId: string,
    updates: { status?: TurnStatus; scope?: string; tele?: string[] }
  ): Promise<Turn | null> {
    const path = `turns/${turnId}.json`;
    const turn = await readJson<Turn>(this.bucket, path);
    if (!turn) return null;

    if (updates.status) turn.status = updates.status;
    if (updates.scope !== undefined) turn.scope = updates.scope;
    if (updates.tele) turn.tele = updates.tele;
    turn.updatedAt = new Date().toISOString();

    await writeJson(this.bucket, path, turn);
    console.log(`[GcsTurnStore] Turn updated: ${turnId} → status=${turn.status}`);
    return { ...turn, missionIds: [...turn.missionIds], taskIds: [...turn.taskIds], tele: [...turn.tele] };
  }

  async linkMission(turnId: string, missionId: string): Promise<void> {
    const path = `turns/${turnId}.json`;
    const turn = await readJson<Turn>(this.bucket, path);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    if (!turn.missionIds.includes(missionId)) {
      turn.missionIds.push(missionId);
      turn.updatedAt = new Date().toISOString();
      await writeJson(this.bucket, path, turn);
      console.log(`[GcsTurnStore] Linked mission ${missionId} to ${turnId}`);
    }
  }

  async linkTask(turnId: string, taskId: string): Promise<void> {
    const path = `turns/${turnId}.json`;
    const turn = await readJson<Turn>(this.bucket, path);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    if (!turn.taskIds.includes(taskId)) {
      turn.taskIds.push(taskId);
      turn.updatedAt = new Date().toISOString();
      await writeJson(this.bucket, path, turn);
      console.log(`[GcsTurnStore] Linked task ${taskId} to ${turnId}`);
    }
  }
}
