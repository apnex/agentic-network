# ADR-002: Sandwich Pattern for Autonomous Actions

**Date:** 2026-04-11
**Status:** Accepted
**Thread:** thread-5 (Persistent MCP Sessions vs. Per-Invocation McpToolset)

## Decision

All autonomous LLM actions (reviews, thread replies, proposal evaluations) follow the "sandwich" pattern: deterministic FETCH → LLM REASON → deterministic EXECUTE.

## Rationale

The Architect's LLM needs to perform actions that involve both data access and reasoning. Previously, the entire operation was delegated to the LLM via tool calling — the LLM would call `read_document`, reason about the content, then call `submit_review`. This was unreliable because:

- MCP tool calls from the LLM had 5-10s overhead per session creation (McpToolset)
- If any tool call failed (timeout), the entire operation failed silently
- The LLM controlled the infrastructure calls, which should be deterministic

The sandwich pattern separates concerns:
1. **FETCH** — Python/Node.js code reads data via the cached MCP session (fast, reliable)
2. **REASON** — LLM generates text (assessment, response, decision) — the only non-deterministic step
3. **EXECUTE** — Python/Node.js code writes results via the cached MCP session (fast, reliable)

## What It Replaced

The previous approach used ADK's `_run_auto_review()` which gave the LLM full tool access and asked it to call `read_document` + `submit_review` itself. This failed ~50% of the time due to MCP session timeouts.

## Consequences

- The LLM cannot call tools during sandwich operations (no tool calling in the REASON step)
- All data must be pre-fetched and passed as text in the prompt
- Results are parsed from the LLM's text output (structured format at the end of the response)
- Infrastructure reliability is decoupled from LLM reliability
