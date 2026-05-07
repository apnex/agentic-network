#!/usr/bin/env node
/**
 * scripts/build/write-build-info.js — per-package build-identity stamper
 *
 * Invoked by each package's `prepack` hook. npm runs prepack from the
 * package directory before tarball pack, so process.cwd() is the package
 * root — we write `dist/build-info.json` there.
 *
 * Mission: M-Build-Identity-AdvisoryTag (idea-256). Solves the class of
 * "did the deploy land?" diagnostics where package.json `version` is
 * stable across many code changes (today's PR #190 motivating incident:
 * canonical-main-stale fault chain invisible from get-agents output).
 *
 * Schema (Design v1.0 §1.1):
 *   { commitSha: "ecc20e7", dirty: false, buildTime: "ISO-8601", branch: "main" }
 *
 * commitSha is the 7-char short SHA. dirty is a separate boolean (NOT a
 * suffix on commitSha at this layer; the "-dirty" suffix is rendered at
 * the get-agents COMMIT column display layer per Design v1.0 §1.6 + §2.3).
 *
 * Graceful fallback: if git is unavailable (extracted-tarball without git
 * context, e.g., npm-installed consumer rebuilding from source), all
 * fields fall back to "unknown" / null rather than failing the build.
 */

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function safeExec(cmd, fallback) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

const sha = safeExec("git rev-parse --short HEAD", "unknown");
const dirty = safeExec("git status --porcelain", "") !== "";
const branch = safeExec("git rev-parse --abbrev-ref HEAD", "unknown");

const buildInfo = {
  commitSha: sha,
  dirty,
  buildTime: new Date().toISOString(),
  branch,
};

const distDir = resolve(process.cwd(), "dist");
mkdirSync(distDir, { recursive: true });
writeFileSync(resolve(distDir, "build-info.json"), JSON.stringify(buildInfo, null, 2));

// Log to stderr — `npm pack --silent` only suppresses npm's own stdout, so
// any prepack-script stdout would leak into a caller's capture
// (`TARBALL_NAME=$(npm pack --silent)`). build-hub.sh + publish-packages.sh
// rely on that capture; stderr keeps the diagnostic visible without poisoning
// the contract.
process.stderr.write(
  `[build-info] dist/build-info.json: ${sha}${dirty ? "-dirty" : ""} on ${branch} at ${buildInfo.buildTime}\n`,
);
