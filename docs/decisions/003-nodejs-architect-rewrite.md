# ADR-003: Architect Node.js Rewrite (ADK Removal)

**Date:** 2026-04-11
**Status:** Accepted
**Thread:** thread-21 (Phase 14: Architect Node.js Rewrite — Full Design Review)

## Decision

Rewrite the Architect agent from Python/Google ADK to Node.js/TypeScript using `@google/genai` for Gemini LLM access and `@modelcontextprotocol/sdk` for Hub communication.

## Rationale

The Python ADK framework caused critical reliability issues:

- **ClosedResourceError:** The Python MCP SDK's `ClientSession` could not recover from closed write streams after Hub redeploys. The `anyio` cancel scope from the ADK's `Runner` conflicted with manual session lifecycle management. This made Engineer→Architect autonomous communication unreliable (half-duplex only).
- **McpToolset per-invocation overhead:** ADK's `McpToolset` created a new MCP session (5-10s handshake) for every LLM invocation, causing timeout failures.
- **Opaque framework:** ADK's `get_fast_api_app()` owned the application lifespan, preventing custom startup logic (event loop, SSE listener).
- **Two-language stack:** Hub was Node.js/TypeScript, Architect was Python. No code sharing possible.

Node.js/TypeScript eliminated all four issues:
- The JS MCP SDK handles reconnection natively (`maxRetries: Infinity`)
- No per-invocation session creation — shared `StreamableHTTPClientTransport`
- Full control over Express server lifecycle
- Shared code with Hub and Engineer Plugin (same MCP SDK, same patterns)

## What It Replaced

- `architect-agent/main.py` — Python FastAPI app with ADK `get_fast_api_app()`
- `architect-agent/hub_client.py` — Python MCP client with `AsyncExitStack`
- `architect-agent/architect_agent/agent.py` — ADK `Agent` with `McpToolset`
- `architect-agent/requirements.txt` — google-adk, google-genai, fastapi, uvicorn
- `architect-agent/Dockerfile` — Python 3.13 image

## Consequences

- Full-duplex autonomous SSE communication achieved (validated thread-22, 18s round-trip)
- Unified context store: GCS-backed `context.ts` with Director + autonomous context builders
- Director chat API with Gemini function calling (LLM can call Hub tools during conversation)
- `architect-chat.sh` updated for new endpoints (`/chat/session`, `/chat/message`)
- Python entirely removed from the active runtime
