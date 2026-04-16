# ADR-006: Correlation IDs for Task Lineage

**Date:** 2026-04-11
**Status:** Accepted
**Thread:** thread-23 (Improving Context Persistence and Wisdom Retention)

## Decision

Tasks, proposals, and threads carry an optional `correlationId` field that links related entities across the system. When a thread discussion leads to a directive, which produces a report, which triggers a review — all share the same correlation ID.

## Rationale

Without correlation IDs, tracing the lineage of a decision is manual: "task-24 was created because of thread-21 which was opened because of thread-12's backlog item." This traceability is essential for:

- The Architect's `buildAutonomousContext()` to provide relevant history for reviews
- Audit trail analysis (what sequence of events led to this state)
- The Director to understand the provenance of any artifact

## Technical Implementation

- `correlationId: string | null` added to `Task`, `Proposal`, and `Thread` interfaces
- Optional `correlationId` parameter added to `submit_directive`, `submit_proposal`, and `open_thread` tools
- Backward compatible — existing entities have `correlationId: null`
- Agents are responsible for passing correlation IDs when creating related entities

## What It Replaced

No previous mechanism. Relationships between entities were implicit (mentioned in text) or absent.

## Consequences

- Agents must be prompted/instructed to pass correlation IDs when creating follow-up entities
- The correlation ID is informational — not enforced by the Hub
- Future: `list_tasks`, `list_threads`, `get_proposals` could accept a `correlationId` filter to retrieve related entities
