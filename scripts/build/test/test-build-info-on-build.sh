#!/usr/bin/env bash
#
# scripts/build/test/test-build-info-on-build.sh — operator-path wire-up test
#
# M-Build-Identity-AdvisoryTag (idea-256) hot-fix deliverable.
#
# Verifies that `npm run build` from each Pass-10-rebuilt package generates
# dist/build-info.json — the operator path that prepack alone misses.
# Closes the deferred-runtime-gate revealed when PR #193 shipped with only
# prepack: get-agents columns showed `?` because dist/build-info.json never
# materialised on `npm run build` (Pass 10 / start-{shim,hub}.sh path).
#
# Test contract: for every package that has a prebuild hook, running
# `npm run build` MUST emit a well-formed dist/build-info.json.
#
# Usage: ./scripts/build/test/test-build-info-on-build.sh
# Exit:  0 on success; non-zero on any package missing build-info post-build.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$REPO_ROOT"

PACKAGES=(
  "packages/cognitive-layer"
  "packages/message-router"
  "packages/network-adapter"
  "packages/repo-event-bridge"
  "packages/storage-provider"
  "adapters/claude-plugin"
)

PASS=0
FAIL=0

for pkg in "${PACKAGES[@]}"; do
  rm -rf "$REPO_ROOT/$pkg/dist"
  (cd "$REPO_ROOT/$pkg" && npm run build --silent >/dev/null 2>&1)
  if [ -f "$REPO_ROOT/$pkg/dist/build-info.json" ]; then
    SHA=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO_ROOT/$pkg/dist/build-info.json','utf-8')).commitSha)")
    if [[ "$SHA" =~ ^[a-f0-9]{7}$|^unknown$ ]]; then
      echo "  ✓ $pkg → commitSha=$SHA"
      PASS=$((PASS + 1))
    else
      echo "  ✗ $pkg: commitSha malformed ($SHA)"
      FAIL=$((FAIL + 1))
    fi
  else
    echo "  ✗ $pkg: dist/build-info.json missing after npm run build"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
