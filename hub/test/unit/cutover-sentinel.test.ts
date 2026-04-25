/**
 * Cutover-completeness sentinel unit tests — mission-48 T2b.
 *
 * Verifies the bootstrap-required guard helper that gates Hub startup
 * under STORAGE_BACKEND=local-fs. Sentinel is written by
 * scripts/state-sync.sh AFTER the GCS→local-fs post-copy invariant
 * passes; presence-only contract.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  CUTOVER_SENTINEL_FILENAME,
  cutoverSentinelPath,
  isCutoverComplete,
} from "../../src/lib/cutover-sentinel.js";

describe("cutoverSentinelPath", () => {
  it("returns root joined with the sentinel filename", () => {
    expect(cutoverSentinelPath("/var/state")).toBe(`/var/state/${CUTOVER_SENTINEL_FILENAME}`);
  });

  it("matches the filename produced by state-sync.sh (.cutover-complete)", () => {
    expect(CUTOVER_SENTINEL_FILENAME).toBe(".cutover-complete");
  });
});

describe("isCutoverComplete", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "cutover-sentinel-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("returns false on a fresh empty directory (no bootstrap done)", () => {
    expect(isCutoverComplete(root)).toBe(false);
  });

  it("returns true when .cutover-complete exists as a file", async () => {
    await writeFile(join(root, ".cutover-complete"), "timestamp_utc=2026-04-25T01:00:00Z\n");
    expect(isCutoverComplete(root)).toBe(true);
  });

  it("returns false when the path is a directory rather than a file", async () => {
    // Defensive: an operator manually creating `.cutover-complete/` as a
    // directory would otherwise satisfy `fs.existsSync`. The sentinel
    // contract is "regular file with provenance"; a directory is invalid.
    await mkdir(join(root, ".cutover-complete"));
    expect(isCutoverComplete(root)).toBe(false);
  });

  it("returns false when the path doesn't exist (root has no entries)", () => {
    // Same as fresh-empty case but exercised explicitly — the absence
    // case is the load-bearing one for the bootstrap-required guard.
    expect(isCutoverComplete(root)).toBe(false);
  });

  it("returns false on a non-existent root path", () => {
    // Explicit safety: passing a never-created path returns false rather
    // than throwing. The Hub's startup branch handles `false` with a
    // process.exit(1); a thrown error would surface as an unhandled
    // rejection during boot.
    expect(isCutoverComplete("/tmp/this-path-definitely-does-not-exist-mission-48-t2b")).toBe(false);
  });
});
