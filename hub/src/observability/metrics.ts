/**
 * Hub observability — metrics primitive (Phase 2d CP1, M-Cognitive-Hypervisor).
 *
 * In-memory counter map with bucket-keyed increment + snapshot read.
 * Counter state lives per-process; snapshot() is the read surface for
 * audit reports + test assertions. Complements existing console/audit
 * logging rather than replacing it — metrics increment alongside the
 * existing log at each instrumented site.
 *
 * Buckets are free-form strings; recommended taxonomy (per the Phase
 * 2d CP1 plan):
 *   - inv_th<N>.shadow_breach    — shadow-validation near-breaches
 *   - convergence_gate.rejected  — ThreadConvergenceGateError throws
 *   - cascade_fail.<reason>      — per-reason cascade failures
 *
 * Recent-details buffer is bounded (32 entries per bucket) so a hot
 * loop doesn't accumulate unbounded memory. Older details age out.
 */

export interface MetricsSnapshot {
  [bucket: string]: number;
}

export interface RecentDetailsEntry {
  at: string;
  details: Record<string, unknown>;
}

export interface MetricsCounter {
  /**
   * Increment a counter bucket. Optional details are appended to the
   * bucket's ring buffer for audit-report sampling.
   */
  increment(bucket: string, details?: Record<string, unknown>): void;

  /** Immutable snapshot of current counter values. */
  snapshot(): MetricsSnapshot;

  /**
   * Recent details for a bucket (default up to RECENT_DETAILS_CAP = 32,
   * bounded by the ring buffer). Returns [] if the bucket has no
   * details. Older entries at the front when buffer is full.
   */
  recentDetails(bucket: string, limit?: number): RecentDetailsEntry[];
}

export const RECENT_DETAILS_CAP = 32;

export function createMetricsCounter(): MetricsCounter {
  const counts = new Map<string, number>();
  const details = new Map<string, RecentDetailsEntry[]>();

  return {
    increment(bucket, d) {
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
      if (d) {
        const buf = details.get(bucket) ?? [];
        buf.push({ at: new Date().toISOString(), details: d });
        if (buf.length > RECENT_DETAILS_CAP) buf.shift();
        details.set(bucket, buf);
      }
    },
    snapshot() {
      return Object.fromEntries(counts);
    },
    recentDetails(bucket, limit = RECENT_DETAILS_CAP) {
      const buf = details.get(bucket) ?? [];
      if (limit >= buf.length) return [...buf];
      return buf.slice(-limit);
    },
  };
}
