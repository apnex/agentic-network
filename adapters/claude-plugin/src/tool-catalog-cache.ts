/**
 * tool-catalog-cache.ts — M-Session-Claim-Separation (mission-40) T4.
 *
 * Per-WORK_DIR cache of the Hub tool catalog so probe spawns (claude mcp
 * list) can serve ListTools without a Hub round-trip. Together with T3's
 * lazy-claim path, this makes probes fully Hub-free against a warm cache
 * — extending bug-26's structural resolution from "no session-claim
 * audits on probes" to "no Hub touch at all on probes".
 *
 * Storage: $WORK_DIR/.ois/tool-catalog.json
 *   {
 *     schemaVersion: 1,
 *     hubVersion: "1.0.0",
 *     fetchedAt: "2026-04-22T...Z",
 *     catalog: [...]
 *   }
 *
 * Invalidation: Hub version mismatch only. No TTL (decision §4.5 — catalog
 * is static between Hub deploys; TTL would add noise without correctness
 * value). Schema-version mismatch on read returns null (the cache file is
 * treated as invalid; future schema evolution bumps CATALOG_SCHEMA_VERSION
 * as the migration trigger).
 *
 * Atomicity: writeCache uses tmp-file + rename so partial writes on crash
 * don't corrupt the cache. Parse errors on read also return null —
 * the cache self-heals on next bootstrap.
 *
 * Failure modes (best-effort, never throws on the primary flow):
 *   - missing file:           readCache returns null
 *   - parse error:            readCache returns null + logs warning
 *   - schema-version mismatch: readCache returns null
 *   - $WORK_DIR readonly:     writeCache logs warning + no-ops
 *   - disk full:              writeCache logs warning + no-ops
 */

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Bumping CATALOG_SCHEMA_VERSION forces all existing cache files to be
 * treated as invalid + re-bootstrapped. Use this when changing the cache
 * file shape (e.g. adding new fields beyond catalog/hubVersion/fetchedAt).
 */
export const CATALOG_SCHEMA_VERSION = 1;

/**
 * MCP tool catalog entry shape — kept loose (`unknown[]`) since the
 * cache is opaque storage; the dispatcher hands the catalog back to
 * the host without re-shaping. Matches what `agent.listTools()` returns.
 */
export type ToolCatalog = unknown[];

export interface CachedCatalog {
  schemaVersion: number;
  hubVersion: string;
  fetchedAt: string;
  catalog: ToolCatalog;
}

/** Compute the canonical cache path for a given WORK_DIR. */
export function cachePathFor(workDir: string): string {
  return join(workDir, ".ois", "tool-catalog.json");
}

/**
 * Read the cache file. Returns null on:
 *   - missing file
 *   - parse error
 *   - schema-version mismatch
 *   - missing required fields
 * Never throws — the primary ListTools flow can always fall through to
 * a live Hub fetch when readCache returns null.
 */
export function readCache(workDir: string, log?: (msg: string) => void): CachedCatalog | null {
  const path = cachePathFor(workDir);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<CachedCatalog>;
    if (
      typeof parsed.schemaVersion !== "number" ||
      parsed.schemaVersion !== CATALOG_SCHEMA_VERSION ||
      typeof parsed.hubVersion !== "string" ||
      typeof parsed.fetchedAt !== "string" ||
      !Array.isArray(parsed.catalog)
    ) {
      log?.(`[tool-catalog-cache] readCache: cache invalid (schema/shape mismatch) at ${path}`);
      return null;
    }
    return {
      schemaVersion: parsed.schemaVersion,
      hubVersion: parsed.hubVersion,
      fetchedAt: parsed.fetchedAt,
      catalog: parsed.catalog,
    };
  } catch (err) {
    log?.(`[tool-catalog-cache] readCache: parse error at ${path}: ${(err as Error).message ?? err}`);
    return null;
  }
}

/**
 * Persist the catalog atomically. Writes to a sibling tmp file then
 * renames — so a crash mid-write leaves either the previous cache
 * intact OR the new cache fully landed. Best-effort: failures log a
 * warning + return; the caller's primary ListTools flow continues.
 */
export function writeCache(
  workDir: string,
  catalog: ToolCatalog,
  hubVersion: string,
  log?: (msg: string) => void,
): void {
  const path = cachePathFor(workDir);
  const tmpPath = `${path}.tmp.${process.pid}`;
  const body: CachedCatalog = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    hubVersion,
    fetchedAt: new Date().toISOString(),
    catalog,
  };
  try {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(tmpPath, JSON.stringify(body), { encoding: "utf8" });
    renameSync(tmpPath, path);
  } catch (err) {
    log?.(`[tool-catalog-cache] writeCache: failed at ${path}: ${(err as Error).message ?? err} — cache will not populate this run`);
    // Try to clean up partial tmp file (best-effort).
    try { if (existsSync(tmpPath)) unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

/**
 * Returns true iff the cached catalog matches the current Hub version.
 * Two semantics:
 *   - currentHubVersion is a non-empty string: strict equality with
 *     cached.hubVersion. Mismatch → invalid → caller re-bootstraps.
 *   - currentHubVersion is null/undefined: caller doesn't know the
 *     current Hub version yet (e.g. /health fetch in flight at startup).
 *     We trust the cache (probe-friendly default) — worst case is
 *     serving a stale catalog ONCE until the next /health fetch
 *     completes and a real session refreshes the cache.
 *
 * Schema-version check is NOT here — it's enforced by readCache (which
 * returns null on schema-version mismatch, so isCacheValid never sees
 * a wrong-schema cached object).
 */
export function isCacheValid(cached: CachedCatalog, currentHubVersion: string | null | undefined): boolean {
  if (currentHubVersion === null || currentHubVersion === undefined || currentHubVersion === "") {
    // Don't know current version → trust cache. See docstring.
    return true;
  }
  return cached.hubVersion === currentHubVersion;
}
