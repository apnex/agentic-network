import { monotonicFactory, decodeTime } from "ulidx";

// Use monotonic factory to guarantee lexicographic ordering
// even when multiple ULIDs are generated within the same millisecond.
const monotoneUlid = monotonicFactory();

export interface AmpEnvelope {
  id: string;           // ULID
  type: string;         // Event type
  correlationId: string | null;
  sourceRole: "hub" | "architect" | "engineer";
  timestamp: number;    // Unix ms, decoded from ULID
  targetRoles: string[];
  payload: Record<string, unknown>;
}

export function createEnvelope(
  type: string,
  payload: Record<string, unknown>,
  opts: {
    correlationId?: string;
    sourceRole?: string;
    targetRoles?: string[];
  } = {}
): AmpEnvelope {
  const id = monotoneUlid();
  return {
    id,
    type,
    correlationId: opts.correlationId ?? null,
    sourceRole: (opts.sourceRole ?? "hub") as AmpEnvelope["sourceRole"],
    timestamp: decodeTime(id),
    targetRoles: opts.targetRoles ?? [],
    payload,
  };
}

/** Detect if a Last-Event-ID value is a legacy integer or a ULID */
export function isLegacyCursor(lastEventId: string): boolean {
  return /^\d+$/.test(lastEventId);
}
