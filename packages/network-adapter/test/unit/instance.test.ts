/**
 * Unit tests for globalInstanceId bootstrap.
 *
 * Layer:     L7 (identity helper under McpAgentClient)
 * Invariants pinned (see docs/network/06-test-specification.md):
 *   #7  globalInstanceId is stable across process restarts; a corrupt
 *       on-disk file triggers recovery (fresh id generated), not crash.
 *
 * The identity carried by this function is what the enriched handshake
 * sends as `globalInstanceId` — the Hub uses it to tell two sessions
 * belonging to the same physical agent apart from two agents racing
 * for the same token.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadOrCreateGlobalInstanceId } from "../../src/kernel/instance.js";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadOrCreateGlobalInstanceId", () => {
  let tmpDir: string;
  let instanceFile: string;
  let savedEnv: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "ois-instance-test-"));
    instanceFile = join(tmpDir, "instance.json");
    // The env override shortcut takes precedence over the file path
    // (commit 26ed0f8). Clear it for the file-based tests so running
    // the suite from a process that set OIS_INSTANCE_ID (e.g. via
    // start-claude.sh) doesn't short-circuit the file-path branch.
    // The env-override sub-describe restores/overrides as needed.
    savedEnv = process.env.OIS_INSTANCE_ID;
    delete process.env.OIS_INSTANCE_ID;
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    if (savedEnv === undefined) delete process.env.OIS_INSTANCE_ID;
    else process.env.OIS_INSTANCE_ID = savedEnv;
  });

  it("creates a new UUID on first call and persists it", () => {
    expect(existsSync(instanceFile)).toBe(false);
    const id = loadOrCreateGlobalInstanceId({ instanceFile });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(existsSync(instanceFile)).toBe(true);
    const body = JSON.parse(readFileSync(instanceFile, "utf-8"));
    expect(body.globalInstanceId).toBe(id);
    expect(body.createdAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("returns the same UUID on subsequent calls", () => {
    const id1 = loadOrCreateGlobalInstanceId({ instanceFile });
    const id2 = loadOrCreateGlobalInstanceId({ instanceFile });
    expect(id1).toBe(id2);
  });

  it("regenerates the UUID if the file is corrupted", () => {
    writeFileSync(instanceFile, "not-json");
    const log = (_msg: string): void => { /* capture */ };
    const id = loadOrCreateGlobalInstanceId({ instanceFile, log });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const body = JSON.parse(readFileSync(instanceFile, "utf-8"));
    expect(body.globalInstanceId).toBe(id);
  });

  it("regenerates the UUID if globalInstanceId field is missing", () => {
    writeFileSync(instanceFile, JSON.stringify({ other: "value" }));
    const id = loadOrCreateGlobalInstanceId({ instanceFile });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("writes the file with 0600 permissions", () => {
    loadOrCreateGlobalInstanceId({ instanceFile });
    const mode = statSync(instanceFile).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("creates the parent directory if it does not exist", () => {
    const nestedFile = join(tmpDir, "nested", "sub", "instance.json");
    const id = loadOrCreateGlobalInstanceId({ instanceFile: nestedFile });
    expect(existsSync(nestedFile)).toBe(true);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  // ── OIS_INSTANCE_ID env override RETIRED (idea-251 D-prime Phase 1) ──

  describe("OIS_INSTANCE_ID env override RETIRED (idea-251 D-prime Phase 1)", () => {
    let originalEnv: string | undefined;
    beforeEach(() => {
      originalEnv = process.env.OIS_INSTANCE_ID;
    });
    afterEach(() => {
      if (originalEnv === undefined) delete process.env.OIS_INSTANCE_ID;
      else process.env.OIS_INSTANCE_ID = originalEnv;
    });

    it("env var is IGNORED post-retirement — file-persisted UUID returned regardless", () => {
      process.env.OIS_INSTANCE_ID = "greg";
      const id = loadOrCreateGlobalInstanceId({ instanceFile });
      // Identity now flows from OIS_AGENT_NAME → handshake.name. The env
      // var is no longer read; file UUID is returned even when set.
      expect(id).not.toBe("greg");
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      expect(existsSync(instanceFile)).toBe(true);
    });
  });
});
