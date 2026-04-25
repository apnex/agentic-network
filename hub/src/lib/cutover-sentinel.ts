/**
 * Cutover-completeness sentinel — mission-48 T2b.
 *
 * `scripts/state-sync.sh` (mission-48 T2a) writes `.cutover-complete`
 * inside `OIS_LOCAL_FS_ROOT` ONLY after the GCS→local-fs post-copy
 * set-equality invariant passes. Hub startup under
 * `STORAGE_BACKEND=local-fs` checks for the sentinel to refuse
 * operating on a half-bootstrapped state directory — the inverse of
 * T1's writability assertion (uid/gid concern) is the bootstrap-
 * completeness concern.
 *
 * Presence is the contract. Sentinel-staleness checks (e.g., stale
 * commit-SHA, stale timestamp) are deferred until the failure mode
 * surfaces in operations; presence-only is sufficient for "have you
 * ever bootstrapped this directory" — which is the T2b success
 * criterion.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Path of the cutover-complete sentinel within a local-fs state root. */
export const CUTOVER_SENTINEL_FILENAME = ".cutover-complete";

export function cutoverSentinelPath(root: string): string {
  return path.join(root, CUTOVER_SENTINEL_FILENAME);
}

/** True iff the cutover-complete sentinel exists under `root`. */
export function isCutoverComplete(root: string): boolean {
  try {
    return fs.statSync(cutoverSentinelPath(root)).isFile();
  } catch {
    return false;
  }
}
