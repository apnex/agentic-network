#!/usr/bin/env bash
#
# scripts/build/lib/prepack-claude-plugin.sh — claude-plugin release-pack
# orchestration.
#
# M-GitHub-Releases-Plugin-Distribution Design v1.0 §1.4. Drives the
# full pre-pack pipeline that produces a self-contained tarball at
# $REPO_ROOT/release-artifacts/apnex-claude-plugin-<version>.tgz:
#
#   1. Refresh dist/build-info.json (idea-256 substrate)
#   2. Stage REPO_ROOT/skills/ → adapters/claude-plugin/skills/
#      (F1 fold for skills/ co-location at package boundary)
#   3. Pack sovereign packages + swap claude-plugin/package.json deps
#      via transient-package-swap.sh helper (F2 fold for sovereign-dep
#      bundling). prepare → npm run build → tsc compiles dist/ during
#      the npm pack lifecycle (F4 fold).
#   4. npm pack from adapters/claude-plugin/ into release-artifacts/
#
# Single trap restores all state on EXIT/INT/TERM/HUP: deletes staged
# skills/ + delegates to _tps_cleanup_state for sovereign-tarball +
# package.json restoration.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CP_DIR="$REPO_ROOT/adapters/claude-plugin"
SKILLS_SRC="$REPO_ROOT/skills"
SKILLS_DST="$CP_DIR/skills"
RELEASE_ARTIFACTS="$REPO_ROOT/release-artifacts"

SKILLS_STAGED=0

cleanup_all() {
  local rc=$?
  trap - EXIT INT TERM HUP
  if [[ $SKILLS_STAGED -eq 1 && -d "$SKILLS_DST" ]]; then
    rm -rf "$SKILLS_DST"
  fi
  _tps_cleanup_state
  exit "$rc"
}

source "$REPO_ROOT/scripts/build/lib/transient-package-swap.sh"
trap cleanup_all EXIT INT TERM HUP

echo "[prepack-claude-plugin] REPO_ROOT: $REPO_ROOT"

# Step 0 — ensure scoped workspace symlinks are populated, but DO NOT fire
# any prepare hooks. The adapter-side sovereigns (cognitive-layer,
# message-router, network-adapter) don't have prepare hooks, but
# claude-plugin's prepare = `npm run build` would invoke tsc against
# unbuilt sovereign dists and fail. --ignore-scripts populates symlinks
# only; we drive builds explicitly below in topological order.
#
# Scoped install (NOT --workspaces) avoids the opencode-plugin stale
# `ois-*.tgz` lockfile-ref hazard from M-Deployment-Hygiene PR #192 (F7
# fold; AG-5 cleanup deferred).
if [[ ! -L "$REPO_ROOT/node_modules/@apnex/cognitive-layer" ]]; then
  echo "[prepack-claude-plugin] ──────── Install scoped workspace symlinks ────────"
  ( cd "$REPO_ROOT" && npm install --no-audit --no-fund --ignore-scripts --silent \
      --workspace=@apnex/claude-plugin \
      --workspace=@apnex/cognitive-layer \
      --workspace=@apnex/message-router \
      --workspace=@apnex/network-adapter )
fi

# Step 0.5 — explicit topological build of the 3 adapter-side sovereigns.
# These packages form a cycle: network-adapter ↔ message-router (NA
# imports MR's MessageRouter/SeenIdCache classes; MR imports NA's
# SessionState/SessionReconnectReason types). Cycle is broken via 4-pass
# build:
#   pass 1: cognitive-layer (leaf; no @apnex deps)
#   pass 2: network-adapter (allow-fail; emits partial dist with .d.ts
#                            files that MR can resolve)
#   pass 3: message-router (uses NA's partial dist)
#   pass 4: network-adapter clean rebuild (now has MR's dist available)
#
# The cycle is a real substrate-currency defect — sovereign packages
# should not be mutually dependent — but breaking it requires a separate
# refactor mission. Surfacing as a follow-on observation; this multi-pass
# workaround keeps the release path unblocked.
echo "[prepack-claude-plugin] ──────── Topological build of sovereign packages ────────"
rm -rf \
  "$REPO_ROOT/packages/cognitive-layer/dist" \
  "$REPO_ROOT/packages/network-adapter/dist" \
  "$REPO_ROOT/packages/message-router/dist"
( cd "$REPO_ROOT/packages/cognitive-layer" && npm run build --silent )
( cd "$REPO_ROOT/packages/network-adapter" && npm run build --silent ) || true
( cd "$REPO_ROOT/packages/message-router" && npm run build --silent )
rm -rf "$REPO_ROOT/packages/network-adapter/dist"
( cd "$REPO_ROOT/packages/network-adapter" && npm run build --silent )

# Step 1 — refresh build-info.json (defensive; npm pack lifecycle also fires it
# via prepare → prebuild + prepack, but local invocations may want a fresh
# build-info before any other steps inspect dist/).
echo "[prepack-claude-plugin] ──────── Refresh build-info.json ────────"
( cd "$CP_DIR" && node "$REPO_ROOT/scripts/build/write-build-info.js" )

# Step 2 — stage skills/ under package boundary so npm pack (governed by
# files: array containing "skills/") includes them.
echo "[prepack-claude-plugin] ──────── Stage skills/ → $SKILLS_DST ────────"
if [[ ! -d "$SKILLS_SRC" ]]; then
  echo "[prepack-claude-plugin] ERROR: $SKILLS_SRC missing — repo state broken" >&2
  exit 1
fi
if [[ -e "$SKILLS_DST" ]]; then
  echo "[prepack-claude-plugin] ERROR: $SKILLS_DST already exists — refusing to overwrite" >&2
  exit 1
fi
mkdir -p "$SKILLS_DST"
cp -r "$SKILLS_SRC/." "$SKILLS_DST/"
SKILLS_STAGED=1

# Step 3 — pack sovereign tarballs + swap claude-plugin package.json deps.
echo "[prepack-claude-plugin] ──────── Pack sovereign tarballs + swap deps ────────"
swap_workspace_deps_to_tarballs "$CP_DIR" \
  "@apnex/cognitive-layer:packages/cognitive-layer" \
  "@apnex/message-router:packages/message-router" \
  "@apnex/network-adapter:packages/network-adapter"

# Step 4 — npm pack (prepare → prebuild + tsc compiles dist/ + prepack
# stamps build-info.json). Output: release-artifacts/apnex-claude-plugin-V.tgz
echo "[prepack-claude-plugin] ──────── npm pack claude-plugin → $RELEASE_ARTIFACTS ────────"
mkdir -p "$RELEASE_ARTIFACTS"
TARBALL_NAME=$( cd "$CP_DIR" && npm pack --pack-destination "$RELEASE_ARTIFACTS" --silent )
if [[ -z "$TARBALL_NAME" || ! -f "$RELEASE_ARTIFACTS/$TARBALL_NAME" ]]; then
  echo "[prepack-claude-plugin] ERROR: npm pack did not produce a tarball at $RELEASE_ARTIFACTS/" >&2
  exit 1
fi
echo "[prepack-claude-plugin] Done. Tarball: $RELEASE_ARTIFACTS/$TARBALL_NAME"
