/**
 * DirectorNotification Entity (ADR-017).
 *
 * Terminal escalation surface. When the watchdog escalates a
 * PendingActionItem (agent unresponsive or stuck), a notification is
 * persisted here. Director-chat layer consumes from this store via a
 * future surface; v1 exposes list + acknowledge tools directly.
 */

import type { EntityProvenance } from "../state.js";

export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationSource =
  | "queue_item_escalated"
  | "agent_unresponsive"
  | "agent_stuck"
  | "cascade_failed"
  | "manual";

export interface DirectorNotification {
  id: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  sourceRef: string | null;
  title: string;
  details: string;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  /** Mission-24 idea-120: uniform direct-create provenance (task-305).
   *  Most notifications are created by the Hub itself (watchdog,
   *  escalator); `createdBy.role` will typically be "system". */
  createdBy?: EntityProvenance;
}

export interface CreateNotificationOptions {
  severity: NotificationSeverity;
  source: NotificationSource;
  sourceRef?: string;
  title: string;
  details: string;
  /** Mission-24 idea-120 / task-305: identity of the creator.
   *  For hub-internal watchdog/reaper creates, use HUB_SYSTEM_PROVENANCE. */
  createdBy?: EntityProvenance;
}

export interface IDirectorNotificationStore {
  create(opts: CreateNotificationOptions): Promise<DirectorNotification>;
  getById(id: string): Promise<DirectorNotification | null>;
  list(filter?: {
    severity?: NotificationSeverity;
    source?: NotificationSource;
    acknowledged?: boolean;
  }): Promise<DirectorNotification[]>;
  acknowledge(id: string, acknowledgedBy: string): Promise<DirectorNotification | null>;
}

// Mission-47 W3: `MemoryDirectorNotificationStore` deleted.
// `DirectorNotificationRepository` in `director-notification-repository.ts`
// composes any `StorageProvider` (including `MemoryStorageProvider`
// for tests) via the IDirectorNotificationStore interface.
