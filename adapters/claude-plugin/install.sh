#!/usr/bin/env bash
#
# install.sh — Install the Claude Code agent-adapter plugin.
#
# Idempotent — safe to re-run. Builds the plugin, registers the
# local marketplace, and installs into Claude Code.
#
# Usage: ./adapters/claude-plugin/install.sh
#

set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$PLUGIN_DIR/../.." && pwd)"
MARKETPLACE="agentic-network"
PLUGIN_NAME="agent-adapter"

echo "[install] Building plugin ..."
cd "$PLUGIN_DIR"
npm install --silent
npm run build

# Claude Code caches the installed plugin by <marketplace>/<name>/<version>.
# Because the plugin version stays at 1.0.0 across local rebuilds, the cache
# is never invalidated by a plain `plugin install` and we end up running a
# stale `dist/` even after this script succeeds. Force a refresh by wiping
# the cache entry first — next `plugin install` will re-copy from the
# freshly built working tree.
CACHE_ROOT="${CLAUDE_PLUGIN_CACHE_DIR:-$HOME/.claude/plugins/cache}"
CACHE_DIR="$CACHE_ROOT/$MARKETPLACE/$PLUGIN_NAME"
if [ -d "$CACHE_DIR" ]; then
  echo "[install] Clearing stale cache at $CACHE_DIR ..."
  rm -rf "$CACHE_DIR"
fi

echo "[install] Registering local marketplace ..."
claude plugin marketplace add "$REPO_ROOT"

echo "[install] Installing $PLUGIN_NAME@$MARKETPLACE ..."
claude plugin install "$PLUGIN_NAME@$MARKETPLACE"

echo ""
echo "[install] Done. Restart Claude Code to activate the plugin."
