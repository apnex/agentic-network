#!/usr/bin/env bash
# Verify start-hub.sh's pre-flight check rejects non-canonical CWD.
# Runnable from any directory; invokes the canonical script via absolute path.
set -e
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
cd "$TMPDIR"
if /home/apnex/taceng/agentic-network/scripts/local/start-hub.sh 2>&1 | grep -q "must run from canonical"; then
  echo "PASS: pre-flight rejected non-canonical CWD"
else
  echo "FAIL: pre-flight check missing or wrong message"
  exit 1
fi
