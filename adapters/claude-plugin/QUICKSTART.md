# Claude Code Plugin — Quickstart

Install the OIS agent adapter plugin into Claude Code. This bridges Claude Code into the OIS agentic network as an Engineer agent via the MCP Relay Hub.

## Quick install (from GitHub)

No clone required. Run these in any terminal:

```bash
claude plugin marketplace add github:apnex/agentic-network
claude plugin install agent-adapter@agentic-network
```

Then configure credentials (see step 1 below) and launch:

```bash
claude --dangerously-load-development-channels plugin:agent-adapter@agentic-network
```

---

## Developer install (from clone)

Use this path if you need to modify the plugin, deploy other components, or work on the codebase.

### Prerequisites

- Node.js 18+
- Claude Code CLI installed (`claude` available in PATH)
- Access to a running OIS Hub instance (URL + auth token)

### 1. Configure Hub credentials

Create a config file in your working directory (the project you'll run Claude Code in):

```bash
mkdir -p .ois
cat > .ois/adapter-config.json << 'EOF'
{
  "hubUrl": "https://your-hub-instance.run.app",
  "hubToken": "your-auth-token",
  "role": "engineer"
}
EOF
```

Alternatively, set environment variables (these override the config file):

```bash
export OIS_HUB_URL="https://your-hub-instance.run.app"
export OIS_HUB_TOKEN="your-auth-token"
export OIS_HUB_ROLE="engineer"
```

These `OIS_` variables are shared across all OIS plugins.

#### Per-agent identity (idea-251 D-prime)

The canonical per-agent config surface is `~/.config/apnex-agents/{name}.env`
— operator-managed file (chmod 600), one per agent identity, sourced by the
operator's per-name `start-{name}.sh` wrapper:

```bash
# ~/.config/apnex-agents/greg.env
OIS_AGENT_NAME=greg                # Identity (drives agentId derivation
                                   # in Hub: agent-{8-char-hash-of-name}).
                                   # 1-32 chars, alphanumeric + `_-`.
                                   # Reserved names rejected:
                                   # director / system / hub / engineer / architect
                                   # (case-insensitive).
GH_TOKEN=github_pat_...            # Other per-agent secrets / config
```

When `OIS_AGENT_NAME` is unset and `globalInstanceId` is also unset, the
Hub rejects the handshake (loud-error so the misconfiguration is visible).

> **Retired (idea-251 D-prime):** the legacy `OIS_INSTANCE_ID` env-var
> override is no longer read by the adapter. If still set in your wrappers,
> it is ignored. Use `OIS_AGENT_NAME` for identity instead.

### 2. Install the plugin

Run the install script (idempotent — safe to re-run):

```bash
./adapters/claude-plugin/install.sh
```

This builds the plugin, registers the local marketplace, and installs into Claude Code.

### 3. Launch Claude Code with the plugin

```bash
claude --dangerously-load-development-channels plugin:agent-adapter@agentic-network-local
```

Or use the convenience script:

```bash
./adapters/claude-plugin/start-claude.sh
```

## Verifying the connection

Once Claude Code starts with the plugin loaded, the adapter will:

1. Connect to the Hub via MCP Streamable HTTP
2. Perform an enriched `register_role` handshake (M18 Agent identity)
3. Begin listening for SSE notifications
4. Expose all Hub tools under the `agent-adapter_proxy` namespace

You should see Hub tools available when you type `/` in Claude Code. The adapter logs to `~/.ois/notifications.log`.

## Configuration reference

| Source | Location | Priority |
|---|---|---|
| Config file | `<workdir>/.ois/adapter-config.json` | Default |
| Environment | `OIS_HUB_URL`, `OIS_HUB_TOKEN`, `OIS_HUB_ROLE` | Overrides config file |

| Field | Required | Default | Description |
|---|---|---|---|
| `hubUrl` | Yes | — | Full URL of the Hub instance |
| `hubToken` | Yes | — | Bearer token for Hub authentication |
| `role` | No | `engineer` | Agent role: `engineer` or `architect` |

| Env var | Required | Default | Description |
|---|---|---|---|
| `OIS_AGENT_NAME` | Yes (or transitional `globalInstanceId`) | — | idea-251 D-prime: identity input. Drives agentId derivation (`agent-{8-char-hash}`) and is surfaced as the display name in get_agents. 1-32 chars, alphanumeric + `_-`. Reserved: director/system/hub/engineer/architect. Set in `~/.config/apnex-agents/{name}.env`. |
| `OIS_INSTANCE_ID` | — | — | RETIRED (idea-251 D-prime). Ignored by adapter; remove from wrappers. |

## Troubleshooting

- **"Hub credentials not found"** — Neither config file nor env vars are set. Check that `.ois/adapter-config.json` exists in your working directory, or set `OIS_HUB_URL` and `OIS_HUB_TOKEN`.
- **Plugin not found** — Ensure the marketplace was added with the correct absolute path to the `agentic-network` root directory.
- **Build errors** — Run `npm install` again. The `@apnex/network-adapter` dependency resolves from a local tarball (`ois-network-adapter-2.0.0.tgz`) which must be present in the plugin directory.
