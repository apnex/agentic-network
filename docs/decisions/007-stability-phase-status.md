# ADR-007: Stability Phase — Status and Remaining Work

**Date:** 2026-04-11
**Status:** In Progress

## What Was Fixed

### Task A: Network Layer
1. **Architect reconnection** — removed exponential backoff (10s→300s), replaced with flat 10s retry. Removed health monitor (caused session storms by overlapping with transport-level reconnection).
2. **Hub session reaper** — 3min TTL for registered sessions, 60s for unregistered orphans. Runs every 60s. Atomic cleanup (transport + server + sseActive + lastActivity).
3. **Director chat Gemini function declarations** — fixed `INVALID_ARGUMENT` error. MCP JSON Schema now correctly converted to Gemini's Type-based schema format.
4. **Dead client close error** — `connect()` no longer tries to close a dead client (which threw `McpError: Connection closed` and blocked reconnection).

### Task B: State Layer
5. **Plugin persistent Last-Event-ID** — `.opencode/hub-plugin-state.json` stores `lastSeenNotificationId`. On startup, the Plugin filters all replayed notifications with ID <= lastSeen. Verified: stale thread-26 replay eliminated after 6 restarts.

### Task C: Session Push Notification Fix (task-48)
6. **Notification replay race condition** — replaced the fixed 2s `setTimeout` replay with `replayWithRoleWait`, which polls every 200ms until the session's role is registered before replaying missed notifications. Eliminates the race where replay fired before `register_role` POST completed, causing all replayed events to be silently dropped.
7. **Zombie session pruning** — added `pruneZombieSessions()` method to `HubNetworking`. When a new session's role becomes known, dead sessions (SSE inactive) of the same role are immediately cleaned up. Prevents zombie accumulation from Cloud Run connection draining.
8. **Hub shutdown hang** — added per-transport 2s timeout in `hub.stop()` to prevent hangs when `transport.close()` is stuck on dead sockets.
9. **Graceful replay cancellation** — added `_stopping` flag to cancel outstanding `replayWithRoleWait` polling loops during Hub shutdown. Prevents orphaned async operations from outliving the Hub lifecycle.

### Task D: Plugin Deferred Backlog (task-48 continued)
10. **Rate-limited actionable events silently lost** — the Plugin's 30s rate limiter was downgrading actionable notifications to silent context injections (`noReply: true`), meaning the LLM was never prompted to act on them. Added a `deferredBacklog[]` that accumulates rate-limited actionable events and drains them either: (a) as a suffix on the next successful prompt, or (b) as a dedicated prompt on `session.idle`. Nothing is silently dropped.

### Task E: Dual-Channel Heartbeat — Zombie Session Reaper Fix (task-67)
11. **Outbound keepalive no longer resets sessionLastActivity** — The Hub's SSE keepalive writes previously reset the session TTL timer, preventing the reaper from pruning zombie sessions behind Cloud Run's proxy. Removed `sessionLastActivity.set()` from `sendKeepalive()`. Session liveness is now proven exclusively by inbound POST requests (tool calls, heartbeat pings).
12. **get_task response includes title+description** — Fixed `get_task` handler to return `title`, `description`, and backward-compatible `directive` field when tasks use the new schema format.

## What's Still Broken

### Architect Session Orphan Storm (Partially Fixed)
The TTL reaper now correctly identifies zombie sessions (no inbound POSTs). However, the root session creation storm remains:
**Root cause:** The MCP SDK's `StreamableHTTPClientTransport` manages its own SSE reconnections internally. When the transport reconnects, it creates a new session on the Hub. But the Architect's `connect()` method ALSO creates a new Client + Transport when `callTool` fails. This creates two sources of session creation:
1. Transport-level SSE reconnection (automatic, creates orphan sessions)
2. `callTool` failure → `connect()` (manual, creates a full new session)

These overlap, producing a storm of orphan sessions (observed: 27 sessions in 3 minutes).

**Symptoms:**
- Hub accumulates `role: unknown` sessions with `sseActive: true`
- Reaper cleans orphans after 60s, but they're created faster than they're pruned
- The Architect reports `hubConnected: true` but the active session may not be the one it's using for tool calls

**Proposed fix:** Create the Client + Transport ONCE in the Architect's lifecycle. Never recreate them. The transport's `maxRetries: Infinity` handles SSE reconnection transparently. The `callTool` method should retry on the EXISTING transport, not create a new one. If the transport is truly dead (process restart), only then recreate everything.

### Hub Keepalive Keeps Orphan SSE Streams Alive
The Hub's keepalive sends `sendLoggingMessage` to all sessions with `sseActive: true`. This resets `lastActivitySec` on orphan sessions that have an SSE stream open from the transport's reconnection. The reaper never prunes them because they appear active.

**Proposed fix:** The keepalive should only ping sessions with a registered role (not `unknown`). Or: the reaper should ignore `lastActivitySec` for `unknown` sessions and always prune them after 60s.

## Backlog Priority

| Priority | Item | Status |
|---|---|---|
| 1 | Architect single-transport lifecycle (fix orphan storm) | **NEXT** |
| 2 | Keepalive should skip unknown sessions | Part of #1 |
| 3 | Task B directive from Architect (persistent Last-Event-ID already implemented) | Done, needs report |
| 4 | Session cleanup verification (ensure steady state of exactly 2-3 sessions) | After #1 |
| 5 | Engineer session push notification fix (replay race + zombie pruning) | **Done (task-48)** |
| 6 | Upload-wisdom.sh automation (CI/CD) | Backlog |
| 7 | GCS lock contention audit | Backlog |
