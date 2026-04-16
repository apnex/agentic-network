# Outstanding Items

## Repo & Naming

- [ ] **Wire-level naming mission** — `mcp-relay-hub` still appears in `hub/src/index.ts` (MCP server name), `hub/src/hub-networking.ts` (health endpoint), and all Cloud Run URLs. Needs a dedicated mission to reason about custom naming for deployed services vs local directories.

- [x] **Git repo initialization** — top-level git init done. Sub-repos removed. Ready for initial commit.

## Cleanup

- [x] **`machines/` directory** — created with .gitkeep placeholder.

- [x] **`agents/vertex-cloudrun/.adk/`** — deleted (Python/ADK leftover).

- [x] **`adapters/claude-plugin/.claude-plugin/`** — audited, kept as live plugin identity metadata.

## Features & Infrastructure

- [ ] **Changesets / npm publishing pipeline** — `@ois/network-adapter` currently published via manual `npm pack` + tarball copy. Needs automated publish workflow.

- [ ] **Idea-46: Dynamic LLM model detection** — detect and report the active LLM model at connect time without hardcoding. Logged as idea-46 on the Hub.

## Bugs

- [ ] **Architect empty-reply bug** — Architect sometimes returns empty responses. Low priority, parked.
