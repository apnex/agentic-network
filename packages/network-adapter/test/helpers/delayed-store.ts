/**
 * DelayedNotificationStore — Wraps a real MemoryNotificationStore
 * with configurable async delays to simulate I/O latency.
 *
 * Used to test persist-first race conditions: if delivery happens
 * before persist completes, notifications can be lost.
 */

import type { INotificationStore } from "../../../../hub/src/state.js";

export class DelayedNotificationStore implements INotificationStore {
  /** Delay in ms before persist() resolves */
  persistDelay: number = 0;
  /** Delay in ms before listSince() resolves */
  listSinceDelay: number = 0;
  /** Count of persist calls (for verification) */
  persistCount: number = 0;
  /** Count of listSince calls */
  listSinceCount: number = 0;
  /** Whether persist is currently in-flight */
  persistInFlight: boolean = false;

  constructor(private inner: INotificationStore) {}

  async persist(
    event: string,
    data: Record<string, unknown>,
    targetRoles: string[]
  ): Promise<{ id: number; event: string; data: Record<string, unknown>; targetRoles: string[]; timestamp: string }> {
    this.persistInFlight = true;
    this.persistCount++;

    if (this.persistDelay > 0) {
      await new Promise((r) => setTimeout(r, this.persistDelay));
    }

    const result = await this.inner.persist(event, data, targetRoles);
    this.persistInFlight = false;
    return result;
  }

  async listSince(
    sinceId: number,
    role: string
  ): Promise<Array<{ id: number; event: string; data: Record<string, unknown>; targetRoles: string[]; timestamp: string }>> {
    this.listSinceCount++;

    if (this.listSinceDelay > 0) {
      await new Promise((r) => setTimeout(r, this.listSinceDelay));
    }

    return this.inner.listSince(sinceId, role);
  }

  async cleanup(maxAgeMs: number): Promise<number> {
    return this.inner.cleanup(maxAgeMs);
  }
}
