#!/usr/bin/env bash
#
# scripts/local/test/test-claude-plugin-tarball-install.sh — operator-path
# wire-flow simulation for claude-plugin tarball-install distribution.
#
# M-GitHub-Releases-Plugin-Distribution Design v1.0 §2.2 + §2.3.
#
# What this exercises end-to-end (calibration #62 14th-instance discipline):
#   1. Run scripts/build/lib/prepack-claude-plugin.sh — full release-pack
#      pipeline (skills/ stage + sovereign tarballs + transient swap +
#      npm pack with prepare→tsc→prepack lifecycle)
#   2. Extract the produced tarball under /tmp (consumer-shape simulation)
#   3. Assert tarball SHAPE invariants:
#      - install.sh + dist/shim.js + dist/build-info.json present
#      - lib/bootstrap-skills.sh present (F1 fold)
#      - skills/<at-least-one>/ present (F1 fold)
#      - apnex-{cognitive-layer,message-router,network-adapter}-*.tgz present
#        (F2 fold; format-regex per `feedback_format_regex_over_hardcoded_hash_tests.md`)
#   4. Assert build-info.json content shape (commitSha format-regex; dirty boolean)
#   5. Assert detect_context() in extracted install.sh resolves to "npm-installed"
#      branch when invoked from /tmp (no sibling packages/network-adapter)
#
# The test does NOT actually invoke install.sh end-to-end — that would touch
# ~/.claude. SHAPE-verification is the contract; install-runtime verification
# is the post-merge first-tag operator-side smoke test per Design §2.1.
#
# Usage: ./scripts/local/test/test-claude-plugin-tarball-install.sh
# Exit:  0 on all-pass; non-zero on any fail.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

TMPDIR=$(mktemp -d -t test-cp-tarball-XXXXXX)
RELEASE_ARTIFACTS="$REPO_ROOT/release-artifacts"

cleanup() {
  local rc=$?
  rm -rf "$TMPDIR"
  # Don't trash an existing release-artifacts/ dir if pre-existing; only
  # clean tarballs we created here.
  rm -f "$RELEASE_ARTIFACTS"/apnex-claude-plugin-*.tgz 2>/dev/null || true
  rmdir "$RELEASE_ARTIFACTS" 2>/dev/null || true
  exit "$rc"
}
trap cleanup EXIT INT TERM HUP

echo "[test-tarball] Running prepack-claude-plugin.sh ..."
bash "$REPO_ROOT/scripts/build/lib/prepack-claude-plugin.sh"

TGZ=$(ls "$RELEASE_ARTIFACTS"/apnex-claude-plugin-*.tgz 2>/dev/null | head -1)
if [ -z "$TGZ" ]; then
  echo "[test-tarball] FAIL: no claude-plugin tarball produced at $RELEASE_ARTIFACTS/" >&2
  exit 1
fi
echo "[test-tarball] Tarball produced: $TGZ"

echo "[test-tarball] Extracting to $TMPDIR ..."
( cd "$TMPDIR" && tar xzf "$TGZ" )

# ── Shape invariants ───────────────────────────────────────────────────

PASS=0
FAIL=0
expect_file() {
  if [ -f "$TMPDIR/$1" ]; then
    PASS=$((PASS+1))
    echo "  ✓ $1"
  else
    FAIL=$((FAIL+1))
    echo "  ✗ MISSING: $1" >&2
  fi
}
expect_glob() {
  # $1 = description, $2 = glob (relative to $TMPDIR)
  shopt -s nullglob
  local matches=( $TMPDIR/$2 )
  shopt -u nullglob
  if [ ${#matches[@]} -gt 0 ]; then
    PASS=$((PASS+1))
    echo "  ✓ $1 (matched: $(basename "${matches[0]}"))"
  else
    FAIL=$((FAIL+1))
    echo "  ✗ MISSING: $1 (no glob match for $2)" >&2
  fi
}
expect_dir() {
  if [ -d "$TMPDIR/$1" ]; then
    PASS=$((PASS+1))
    echo "  ✓ dir $1/"
  else
    FAIL=$((FAIL+1))
    echo "  ✗ MISSING DIR: $1/" >&2
  fi
}

echo "[test-tarball] Asserting tarball shape invariants ..."
expect_file "package/install.sh"
expect_file "package/dist/shim.js"
expect_file "package/dist/build-info.json"
expect_file "package/lib/bootstrap-skills.sh"
expect_file "package/.mcp.json"
expect_dir  "package/.claude-plugin"
expect_dir  "package/skills/survey"

# Sovereign-package tarballs — format-regex on version (no hardcoded values)
expect_glob "apnex-cognitive-layer tarball" "package/apnex-cognitive-layer-*.tgz"
expect_glob "apnex-message-router tarball"  "package/apnex-message-router-*.tgz"
expect_glob "apnex-network-adapter tarball" "package/apnex-network-adapter-*.tgz"

# ── build-info.json content shape (calibration #62 14th-instance discipline) ──

echo "[test-tarball] Asserting build-info.json content shape ..."
if node -e "
  const info = require('$TMPDIR/package/dist/build-info.json');
  const okSha = /^[a-f0-9]{7}\$|^unknown\$/.test(info.commitSha);
  const okDirty = typeof info.dirty === 'boolean';
  const okBuildTime = info.buildTime === null || typeof info.buildTime === 'string';
  const okBranch = typeof info.branch === 'string';
  if (!okSha || !okDirty || !okBuildTime || !okBranch) {
    console.error('build-info.json field shape mismatch:', JSON.stringify(info));
    process.exit(1);
  }
" 2>&1; then
  PASS=$((PASS+1))
  echo "  ✓ build-info.json {commitSha,dirty,buildTime,branch} shape OK"
else
  FAIL=$((FAIL+1))
fi

# ── detect_context() resolution check (no sibling packages/) ───────────

echo "[test-tarball] Asserting detect_context() resolves to npm-installed in extracted context ..."
# The check inside install.sh is: [ -d "$PLUGIN_DIR/../../packages/network-adapter" ]
# In extracted-tarball context, $PLUGIN_DIR = $TMPDIR/package; ../../ = $TMPDIR/.
# As long as no sibling packages/network-adapter exists under $TMPDIR, the
# branch correctly returns "npm-installed".
if grep -q 'echo "npm-installed"' "$TMPDIR/package/install.sh" \
   && [ ! -d "$TMPDIR/packages/network-adapter" ]; then
  PASS=$((PASS+1))
  echo "  ✓ detect_context() branch present + sibling packages/ absent"
else
  FAIL=$((FAIL+1))
  echo "  ✗ detect_context() branch missing OR sibling packages/ present (false positive)" >&2
fi

echo ""
echo "[test-tarball] Total: $PASS passed / $FAIL failed"
[ $FAIL -eq 0 ]
