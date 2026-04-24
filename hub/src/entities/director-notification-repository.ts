/**
 * DirectorNotificationRepository — StorageProvider-backed persistence.
 *
 * Mission-47 W3. Replaces `MemoryDirectorNotificationStore` +
 * `GcsDirectorNotificationStore`. Implements `IDirectorNotificationStore`
 * unchanged — policy-layer callers (watchdog, pending-action-policy,
 * notification tools) keep working against the same surface.
 *
 * Layout matches the historical GCS object keyspace:
 *   director-notifications/<id>.json   — per-notification blob
 *   meta/counter.json                  — shared counter blob
 *                                        (directorNotificationCounter field)
 *
 * ID shape: `dn-${YYYY-MM-DD}-${NNN.padStart(3)}`. The date prefix is
 * cosmetic — the counter is a single running integer across all dates,
 * not a per-day reset. Matches the legacy shape exactly so existing
 * prod IDs remain grep-compatible and sort lexicographically.
 */

import type { StorageProvider } from "@ois/storage-provider";
import { hasGetWithToken, StoragePathNotFoundError } from "@ois/storage-provider";

import type {
  IDirectorNotificationStore,
  DirectorNotification,
  NotificationSeverity,
  NotificationSource,
  CreateNotificationOptions,
} from "./director-notification.js";
import { StorageBackedCounter } from "./counter.js";

const MAX_CAS_RETRIES = 50;

function notificationPath(id: string): string {
  return `director-notifications/${id}.json`;
}

function encode(n: DirectorNotification): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(n, null, 2));
}

function decode(bytes: Uint8Array): DirectorNotification {
  return JSON.parse(new TextDecoder().decode(bytes)) as DirectorNotification;
}

export class DirectorNotificationRepository implements IDirectorNotificationStore {
  constructor(
    private readonly provider: StorageProvider,
    private readonly counter: StorageBackedCounter,
  ) {
    if (!hasGetWithToken(provider)) {
      throw new Error(
        "DirectorNotificationRepository requires a StorageProvider with atomic read-with-token support",
      );
    }
  }

  async create(opts: CreateNotificationOptions): Promise<DirectorNotification> {
    const num = await this.counter.next("directorNotificationCounter");
    const now = new Date();
    const id = `dn-${now.toISOString().slice(0, 10)}-${num.toString().padStart(3, "0")}`;
    const n: DirectorNotification = {
      id,
      severity: opts.severity,
      source: opts.source,
      sourceRef: opts.sourceRef ?? null,
      title: opts.title,
      details: opts.details,
      createdAt: now.toISOString(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      createdBy: opts.createdBy,
    };
    const result = await this.provider.createOnly(notificationPath(id), encode(n));
    if (!result.ok) {
      throw new Error(
        `[DirectorNotificationRepository] create: counter issued existing ID ${id}; refusing to clobber`,
      );
    }
    return { ...n };
  }

  async getById(id: string): Promise<DirectorNotification | null> {
    const raw = await this.provider.get(notificationPath(id));
    return raw ? decode(raw) : null;
  }

  async list(filter?: {
    severity?: NotificationSeverity;
    source?: NotificationSource;
    acknowledged?: boolean;
  }): Promise<DirectorNotification[]> {
    const keys = await this.provider.list("director-notifications/");
    const out: DirectorNotification[] = [];
    for (const key of keys) {
      if (!key.endsWith(".json")) continue;
      const raw = await this.provider.get(key);
      if (!raw) continue;
      const n = decode(raw);
      if (filter?.severity && n.severity !== filter.severity) continue;
      if (filter?.source && n.source !== filter.source) continue;
      if (filter?.acknowledged !== undefined) {
        if (filter.acknowledged && !n.acknowledgedAt) continue;
        if (!filter.acknowledged && n.acknowledgedAt) continue;
      }
      out.push(n);
    }
    return out;
  }

  async acknowledge(
    id: string,
    acknowledgedBy: string,
  ): Promise<DirectorNotification | null> {
    const path = notificationPath(id);
    for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
      const read = await (this.provider as unknown as {
        getWithToken(path: string): Promise<{ data: Uint8Array; token: string } | null>;
      }).getWithToken(path);
      if (read === null) return null;
      const current = decode(read.data);
      // INV-DN2: idempotent acknowledge — once ack'd, subsequent calls
      // return the same record unchanged. No write-side retry needed.
      if (current.acknowledgedAt) return current;
      const next: DirectorNotification = {
        ...current,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy,
      };
      try {
        const result = await this.provider.putIfMatch(path, encode(next), read.token);
        if (result.ok) return next;
        // Token stale — loop retries.
      } catch (err) {
        if (err instanceof StoragePathNotFoundError) return null;
        throw err;
      }
    }
    throw new Error(
      `[DirectorNotificationRepository] acknowledge exhausted ${MAX_CAS_RETRIES} retries on ${id}`,
    );
  }
}
