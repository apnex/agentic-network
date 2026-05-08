#!/usr/bin/env bash
#
# scripts/build/test/test-transient-package-swap.sh — bash unit test for
# scripts/build/lib/transient-package-swap.sh.
#
# M-GitHub-Releases-Plugin-Distribution Design v1.0 §1.4 lib-extraction
# test contract. Pinned per `feedback_format_regex_over_hardcoded_hash_tests.md`:
# tests SHAPE (rewrite-took-effect + cleanup-restored-state) not specific
# tarball-name values.
#
# Cases covered:
#   T1 — dep ref rewrite for workspace-`*` style ("@apnex/X": "*")
#   T2 — dep ref rewrite for file-path style ("@apnex/X": "file:../path")
#   T3 — cleanup restores original package.json (byte-equivalent)
#   T4 — cleanup removes staged tarballs
#   T5 — error path: missing target package.json
#
# Usage: ./scripts/build/test/test-transient-package-swap.sh
# Exit:  0 on all-pass; 1 on any-fail.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

PASS=0
FAIL=0

note() { echo "[test-tps] $*"; }
fail() { echo "[test-tps] FAIL: $*" >&2; FAIL=$((FAIL+1)); }
ok()   { echo "[test-tps] PASS: $*"; PASS=$((PASS+1)); }

# Each test runs in its own subshell so traps / sourced lib state don't leak.

# ── T1: workspace-`*` rewrite ──────────────────────────────────────────

(
  set -euo pipefail
  TMPDIR=$(mktemp -d -t test-tps-t1-XXXXXX)
  trap "rm -rf '$TMPDIR'" EXIT

  # Build a stand-in target package
  mkdir -p "$TMPDIR/target"
  cat > "$TMPDIR/target/package.json" <<'JSON'
{
  "name": "test-target",
  "version": "0.0.0",
  "dependencies": {
    "@apnex/cognitive-layer": "*"
  }
}
JSON

  # Build a stand-in source package
  mkdir -p "$TMPDIR/src/cognitive-layer"
  cat > "$TMPDIR/src/cognitive-layer/package.json" <<'JSON'
{
  "name": "@apnex/cognitive-layer",
  "version": "9.9.9",
  "main": "index.js"
}
JSON
  echo "module.exports = {};" > "$TMPDIR/src/cognitive-layer/index.js"

  REPO_ROOT="$TMPDIR"
  source "$(dirname "$(dirname "$(readlink -f "$0")")")/lib/transient-package-swap.sh"

  swap_workspace_deps_to_tarballs "$TMPDIR/target" "@apnex/cognitive-layer:src/cognitive-layer" >/dev/null

  # Verify rewrite took effect (file:./<tarball-name>) — format regex, not exact name
  if grep -E '"@apnex/cognitive-layer": "file:\./apnex-cognitive-layer-[0-9]+\.[0-9]+\.[0-9]+\.tgz"' "$TMPDIR/target/package.json" >/dev/null; then
    echo "T1-rewrite OK"
  else
    echo "T1-rewrite FAIL: package.json contents:" >&2
    cat "$TMPDIR/target/package.json" >&2
    exit 1
  fi

  # Verify a tarball was staged
  if ls "$TMPDIR/target"/apnex-cognitive-layer-*.tgz >/dev/null 2>&1; then
    echo "T1-tarball OK"
  else
    echo "T1-tarball FAIL: no tarball in $TMPDIR/target" >&2
    exit 1
  fi

  # Trigger cleanup explicitly (subshell-exit will also fire it via trap, but
  # we want to assert state mid-flight before the EXIT trap from the outer
  # subshell rm -rf $TMPDIR runs).
  _tps_cleanup_state

  # T3-style assertion on restoration: package.json should match original
  if grep -q '"@apnex/cognitive-layer": "\*"' "$TMPDIR/target/package.json"; then
    echo "T3-restore OK"
  else
    echo "T3-restore FAIL: package.json after cleanup:" >&2
    cat "$TMPDIR/target/package.json" >&2
    exit 1
  fi

  # T4: tarballs removed
  if ! ls "$TMPDIR/target"/apnex-cognitive-layer-*.tgz >/dev/null 2>&1; then
    echo "T4-cleanup OK"
  else
    echo "T4-cleanup FAIL: tarball still present" >&2
    exit 1
  fi
) && ok "T1 + T3 + T4 (workspace-* rewrite + cleanup restoration)" || \
  fail "T1 + T3 + T4 (workspace-* rewrite + cleanup)"

# ── T2: file-path rewrite ──────────────────────────────────────────────

(
  set -euo pipefail
  TMPDIR=$(mktemp -d -t test-tps-t2-XXXXXX)
  trap "rm -rf '$TMPDIR'" EXIT

  mkdir -p "$TMPDIR/target"
  cat > "$TMPDIR/target/package.json" <<'JSON'
{
  "name": "test-target",
  "version": "0.0.0",
  "dependencies": {
    "@apnex/storage-provider": "file:../packages/storage-provider"
  }
}
JSON

  mkdir -p "$TMPDIR/src/storage-provider"
  cat > "$TMPDIR/src/storage-provider/package.json" <<'JSON'
{
  "name": "@apnex/storage-provider",
  "version": "1.2.3",
  "main": "index.js"
}
JSON
  echo "module.exports = {};" > "$TMPDIR/src/storage-provider/index.js"

  REPO_ROOT="$TMPDIR"
  source "$(dirname "$(dirname "$(readlink -f "$0")")")/lib/transient-package-swap.sh"

  swap_workspace_deps_to_tarballs "$TMPDIR/target" "@apnex/storage-provider:src/storage-provider" >/dev/null

  if grep -E '"@apnex/storage-provider": "file:\./apnex-storage-provider-[0-9]+\.[0-9]+\.[0-9]+\.tgz"' "$TMPDIR/target/package.json" >/dev/null; then
    echo "T2-rewrite OK"
  else
    echo "T2-rewrite FAIL" >&2
    cat "$TMPDIR/target/package.json" >&2
    exit 1
  fi

  _tps_cleanup_state

  # Restored to file:../packages/...
  if grep -q '"@apnex/storage-provider": "file:\.\./packages/storage-provider"' "$TMPDIR/target/package.json"; then
    echo "T2-restore OK"
  else
    echo "T2-restore FAIL" >&2
    cat "$TMPDIR/target/package.json" >&2
    exit 1
  fi
) && ok "T2 (file-path rewrite + cleanup restoration)" || \
  fail "T2 (file-path rewrite + cleanup)"

# ── T5: error path on missing target package.json ──────────────────────

(
  set -euo pipefail
  TMPDIR=$(mktemp -d -t test-tps-t5-XXXXXX)
  trap "rm -rf '$TMPDIR'" EXIT

  REPO_ROOT="$TMPDIR"
  source "$(dirname "$(dirname "$(readlink -f "$0")")")/lib/transient-package-swap.sh"

  set +e
  swap_workspace_deps_to_tarballs "$TMPDIR/nonexistent" "@apnex/x:does-not-matter" 2>/dev/null
  rc=$?
  set -e
  if [[ $rc -ne 0 ]]; then
    echo "T5 OK (returned non-zero on missing target)"
  else
    echo "T5 FAIL: expected non-zero exit on missing target" >&2
    exit 1
  fi
) && ok "T5 (error path on missing target)" || \
  fail "T5 (error path)"

note "Total: $PASS passed / $FAIL failed"
[[ $FAIL -eq 0 ]] || exit 1
