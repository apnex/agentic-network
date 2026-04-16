# ADR-001: MCP as Universal Transport

**Date:** 2026-04-11
**Status:** Accepted
**Thread:** thread-6 (Agentic Networking Architecture: Converged Transport Design)

## Decision

All agent-Hub communication uses the MCP (Model Context Protocol) over Streamable HTTP with SSE for server-initiated notifications. No parallel communication channels.

## Rationale

- MCP is an open standard designed for LLM-tool communication
- Streamable HTTP works across NATs/firewalls (outbound connections only)
- SSE provides server-to-client push within the same protocol
- Single protocol reduces complexity vs. managing MCP + webhooks + custom APIs
- All major LLM clients (OpenCode, Claude, Gemini CLI) support MCP natively

## What It Replaced

Previously the Hub used HTTP webhooks as the primary push mechanism to the Architect. Webhooks required the Architect to expose a public endpoint and maintain a separate HTTP server for receiving notifications. MCP SSE notifications replaced webhooks as the primary channel (webhooks remain as fallback).

## Consequences

- Every new agent type needs an MCP client adapter
- SSE streams require persistent connections (managed via reconnection with `maxRetries: Infinity`)
- Notifications that fail SSE delivery are persisted to GCS and replayed via `Last-Event-ID` on reconnect
