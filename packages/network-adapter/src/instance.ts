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
 * Returns the UUID. Idempotent across calls within a process.
 */
export function loadOrCreateGlobalInstanceId(
  opts: LoadInstanceOptions = {}
): string {
  const file = opts.instanceFile ?? DEFAULT_INSTANCE_FILE;
  const dir = file.substring(0, file.lastIndexOf("/")) || DEFAULT_INSTANCE_DIR;
  const log = opts.log ?? (() => { /* silent */ });

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
