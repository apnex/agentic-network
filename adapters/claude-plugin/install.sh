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

echo "[install] Building plugin ..."
cd "$PLUGIN_DIR"
npm install --silent
npm run build

echo "[install] Registering local marketplace ..."
claude plugin marketplace add "$REPO_ROOT"

echo "[install] Installing agent-adapter plugin ..."
claude plugin install agent-adapter@agentic-network

echo ""
echo "[install] Done. Restart Claude Code to activate the plugin."
