#!/bin/bash
#
# start-claude.sh — Launch a Claude Code session wired to the local
# agent-adapter plugin, under a named identity.
#
# The name is exported as OIS_INSTANCE_ID, which the plugin's handshake
# passes to the Hub as globalInstanceId. Distinct names → distinct
# agentIds, so two Claude sessions on the same laptop can coexist as
# independent engineers (required for engineer↔engineer peer threads).
#
# idea-251 D-prime: per-agent identity (OIS_AGENT_NAME) belongs in the
# operator's per-agent env file at ~/.config/apnex-agents/{name}.env
# (canonical config surface for ALL per-agent vars; secrets + non-secrets).
# This generic wrapper does NOT export OIS_AGENT_NAME — operators set it
# in their per-agent env file alongside other per-agent config.
#
# Usage: ./start-claude.sh <name>
# Example: ./start-claude.sh kate
#

set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: $0 <name>" >&2
  echo "       <name> is the engineer identity (e.g. 'greg', 'kate') — required." >&2
  exit 1
fi

export OIS_INSTANCE_ID="$1"
export OIS_HUB_LABELS='{"env":"prod"}'
echo "[start-claude] OIS_INSTANCE_ID=$OIS_INSTANCE_ID"

exec claude --dangerously-load-development-channels plugin:agent-adapter@agentic-network
