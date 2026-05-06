/**
 * globalInstanceId bootstrap.
 *
 * Identity is decoupled from authentication: the Hub token grants *access*
 * and *role*; the globalInstanceId grants *identity*. This lets tokens be
 * rotated without orphaning Agent entities.
 *
 * Storage: ~/.ois/instance.json (owner-private, 0600). NOT workspace-local —
 * workspace scoping fails on multi-terminal, clone, and accidental git commit.
 *
 * First call generates a new UUID v4. Subsequent calls read it. If the file
 * is deleted or corrupted, a new UUID is generated → new fingerprint → Hub
 * creates a new Agent. The old Agent remains append-only with its queue
 * intact; use `migrate_agent_queue` to recover pending work.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

const DEFAULT_INSTANCE_DIR = join(homedir(), ".ois");
const DEFAULT_INSTANCE_FILE = join(DEFAULT_INSTANCE_DIR, "instance.json");

interface InstanceFile {
  globalInstanceId: string;
  createdAt: string;
}

export interface LoadInstanceOptions {
  /** Override the default ~/.ois/instance.json location (for tests). */
  instanceFile?: string;
  /** Optional logger for diagnostics (regeneration on corruption, etc.). */
  log?: (msg: string) => void;
}

/**
 * Load an existing globalInstanceId from disk or create a new one.
 * Returns the UUID (or the env-provided string override). Idempotent
 * across calls within a process.
 *
 * idea-251 D-prime Phase 1: `OIS_INSTANCE_ID` env-var override RETIRED
 * per Director's "legacy" framing (2026-05-06). Identity now comes from
 * the `name` field in the handshake payload (sourced from `OIS_AGENT_NAME`
 * env via the host shim). This file's role is reduced to file-persistent
 * UUID for non-adapter callers (vertex-cloudrun production agent,
 * scripts/architect-client, cognitive-layer/bench) — those will migrate
 * in Phase 2 (idea-TBD; full identity-primitive rebuild). Adapter-driven
 * sessions ignore this UUID — Hub keys identity off `payload.name`.
 */
export function loadOrCreateGlobalInstanceId(
  opts: LoadInstanceOptions = {}
): string {
  const log = opts.log ?? (() => { /* silent */ });

  // idea-251 D-prime Phase 1: OIS_INSTANCE_ID env override REMOVED. Identity
  // now flows from OIS_AGENT_NAME → handshake.name → fingerprint. This
  // function is kept for non-adapter callers that still need a UUID
  // (vertex-cloudrun, scripts, bench); they migrate in Phase 2.

  const file = opts.instanceFile ?? DEFAULT_INSTANCE_FILE;
  const dir = file.substring(0, file.lastIndexOf("/")) || DEFAULT_INSTANCE_DIR;

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  if (existsSync(file)) {
    try {
      const raw = JSON.parse(readFileSync(file, "utf-8")) as InstanceFile;
      if (raw.globalInstanceId && typeof raw.globalInstanceId === "string") {
        return raw.globalInstanceId;
      }
      log(`[instance] ${file} missing globalInstanceId — regenerating`);
    } catch (err) {
      log(`[instance] Failed to parse ${file}: ${err} — regenerating`);
    }
  }

  const globalInstanceId = randomUUID();
  const body: InstanceFile = {
    globalInstanceId,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(file, JSON.stringify(body, null, 2), { mode: 0o600 });
  try {
    chmodSync(file, 0o600);
  } catch {
    /* best effort — filesystem may not support chmod */
  }
  log(`[instance] Generated new globalInstanceId → ${file}`);
  return globalInstanceId;
}
