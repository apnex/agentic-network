#!/usr/bin/env bash
#
# plugin-install.sh — Clean install of the Claude Code agent-adapter plugin.
#
# Usage: ./scripts/plugin-install.sh
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="${REPO_ROOT}/adapters/claude-plugin"

echo "[install] Building plugin ..."
cd "$PLUGIN_DIR"
npm install --silent
npm run build

echo "[install] Registering local marketplace ..."
claude plugin marketplace add "$REPO_ROOT"

echo "[install] Installing agent-adapter plugin ..."
claude plugin install agent-adapter@agentic-network-local

echo ""
echo "[install] Done. Launch with:"
echo "  claude --dangerously-load-development-channels plugin:agent-adapter@agentic-network-local"
