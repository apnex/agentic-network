# Architect-Engineer Collaboration Model

## 1. Overview

This document defines the current state of the collaboration model between the **Director** (human), **Architect** (cloud AI agent), and **Engineer** (local AI coding agent) in the Distributed Multi-Agent Software Engineering Platform.

The system enables collaborative software engineering at scale through asynchronous, structured communication over the Model Context Protocol (MCP), with a central Hub brokering all interactions.

---

## 2. Roles and Responsibilities

### 2.1 Director (Human)

| Responsibility | Description |
|---|---|
| **Strategic direction** | Sets project goals, telos, vision, and axioms |
| **Approval authority** | Approves proposals, phases, and architectural decisions |
| **Communication** | Interacts with the Architect via `architect-chat.sh` (terminal CLI) |
| **Oversight** | Reviews Architect assessments, monitors engineer status |
| **Does NOT** | Write code, call Hub tools directly, or interact with the Engineer directly |

### 2.2 Architect (Cloud Agent — gemini-3.1-pro-preview)

| Responsibility | Description |
|---|---|
| **Planning** | Translates Director intent into concrete engineering directives |
| **Governance** | Reviews engineering reports and proposals against project standards |
| **Tool discovery** | Dynamically discovers Hub tools via MCP (McpToolset) — no hardcoded wrappers |
| **Communication modes** | **Discuss** (analyze without acting) vs **Execute** (issue directives) |
| **Auto-review** | Automatically reviews reports and proposals via webhook-triggered LLM invocation |
| **Clarification** | Automatically answers Engineer clarification requests via webhook |
| **Does NOT** | Execute code, access the filesystem, or call Engineer-tagged tools |

**Architect's Hub Tools (tagged `[Architect]`):**
- `submit_directive` — issue work to the Engineer
- `get_report` — retrieve completed report summaries
- `engineer_status` — check connected engineers
- `review_proposal` — approve/reject/request changes on proposals
- `cancel_task` — cancel pending directives
- `respond_to_clarification` — answer Engineer questions
- `submit_review` — store review assessment for a completed task (GCS-persisted)
- `close_thread` — close an ideation thread after Director review
- `get_pending_actions` — get summary of all items requiring Architect attention (for autonomous polling)
- `submit_audit_entry` — log an autonomous action for Director audit trail

### 2.3 Engineer (Local Agent — OpenCode/Claude Code)

| Responsibility | Description |
|---|---|
| **Execution** | Writes code, edits files, runs commands based on directives |
| **Reporting** | Submits structured reports with summaries and verification data |
| **Proposals** | Submits proposals for design decisions needing Architect review |
| **Clarification** | Requests clarification on ambiguous directives before executing |
| **Quality** | Includes verification (build/test output) in reports |
| **Does NOT** | Set project direction, approve proposals, or issue directives |

**Engineer's Hub Tools (tagged `[Engineer]`):**
- `get_directive` — poll for pending directives
- `submit_report` — submit completed work with summary + verification
- `submit_proposal` — propose design decisions for Architect review
- `request_clarification` — ask questions about ambiguous directives
- `get_clarification_response` — retrieve Architect's answer
- `get_proposal_decision` — check proposal approval status
- `close_proposal` — mark a proposal as implemented after acting on approval

---

## 3. Key Workflows

### 3.1 Task Execution (Directive → Report)

```
Director                    Architect                   Hub                         Engineer
   │                           │                         │                            │
   │  "Build feature X"        │                         │                            │
   │──────────────────────────►│                         │                            │
   │                           │  submit_directive()     │                            │
   │                           │────────────────────────►│                            │
   │                           │                         │  [task queued: pending]     │
   │                           │                         │                            │
   │                           │                         │◄───────────────────────────│
   │                           │                         │  get_directive()            │
   │                           │                         │───────────────────────────►│
   │                           │                         │                            │
   │                           │                         │  [webhook: directive_       │
   │                           │◄────────────────────────│   acknowledged]             │
   │                           │                         │                            │
   │                           │                         │                            │ [executes]
   │                           │                         │                            │
   │                           │                         │◄───────────────────────────│
   │                           │                         │  submit_report(summary,     │
   │                           │                         │   report, verification)     │
   │                           │                         │                            │
   │                           │  [webhook: report_      │                            │
   │                           │◄──────submitted]────────│                            │
   │                           │                         │                            │
   │                           │  [AUTO-REVIEW via LLM]  │                            │
   │                           │  read_document(ref)     │                            │
   │                           │────────────────────────►│                            │
   │                           │◄────────────────────────│                            │
   │                           │  [assessment stored]    │                            │
   │                           │                         │                            │
   │  "What's the status?"     │                         │                            │
   │──────────────────────────►│                         │                            │
   │◄──────────────────────────│                         │                            │
   │  "Engineer completed X,   │                         │                            │
   │   all tests pass"         │                         │                            │
```

### 3.2 Proposal and Review

```
Engineer                    Hub                         Architect
   │                         │                            │
   │  submit_proposal(       │                            │
   │    title, summary,      │                            │
   │    body)                │                            │
   │────────────────────────►│                            │
   │                         │  [webhook: proposal_       │
   │                         │   submitted]               │
   │                         │───────────────────────────►│
   │                         │                            │
   │                         │                            │ [AUTO-REVIEW via LLM]
   │                         │                            │ get_proposals()
   │                         │◄───────────────────────────│
   │                         │───────────────────────────►│
   │                         │                            │ read_document(ref)
   │                         │◄───────────────────────────│
   │                         │───────────────────────────►│
   │                         │                            │ review_proposal(
   │                         │◄───────────────────────────│   decision, feedback)
   │                         │                            │
   │  get_proposal_decision()│                            │
   │────────────────────────►│                            │
   │◄────────────────────────│                            │
   │  {decision: "approved", │                            │
   │   feedback: "..."}      │                            │
```

### 3.3 Clarification Request

```
Engineer                    Hub                         Architect
   │                         │                            │
   │  request_clarification( │                            │
   │    taskId, question)    │                            │
   │────────────────────────►│                            │
   │                         │  [task → input_required]   │
   │                         │  [webhook: clarification_  │
   │                         │   requested]               │
   │                         │───────────────────────────►│
   │                         │                            │
   │                         │                            │ [AUTO-RESPOND via LLM]
   │                         │                            │ respond_to_clarification(
   │                         │◄───────────────────────────│   taskId, answer)
   │                         │  [task → working]          │
   │                         │                            │
   │  get_clarification_     │                            │
   │    response(taskId)     │                            │
   │────────────────────────►│                            │
   │◄────────────────────────│                            │
   │  {answer: "..."}        │                            │
   │                         │                            │
   │  [resumes execution]    │                            │
```

### 3.4 Task Cancellation

```
Director                    Architect                   Hub
   │                           │                         │
   │  "Cancel that task"       │                         │
   │──────────────────────────►│                         │
   │                           │  cancel_task(taskId)    │
   │                           │────────────────────────►│
   │                           │                         │  [task → cancelled]
   │                           │◄────────────────────────│
   │◄──────────────────────────│                         │
   │  "Task cancelled"         │                         │
```

### 3.5 Ideation Thread (Bidirectional Discussion)

```
Engineer                    Hub                         Architect
   │                         │                            │
   │  open_thread(           │                            │
   │    title, message)      │                            │
   │────────────────────────►│                            │
   │                         │  [thread → active]         │
   │                         │  [webhook: thread_opened]  │
   │                         │───────────────────────────►│
   │                         │                            │
   │                         │                            │ [AUTO-REPLY via LLM]
   │                         │                            │ get_thread(threadId)
   │                         │◄───────────────────────────│
   │                         │───────────────────────────►│
   │                         │                            │ reply_to_thread(
   │                         │◄───────────────────────────│   threadId, message)
   │                         │  [currentTurn → engineer]  │
   │                         │                            │
   │  get_thread(threadId)   │                            │
   │────────────────────────►│                            │
   │◄────────────────────────│                            │
   │                         │                            │
   │  reply_to_thread(       │                            │
   │    converged=true)      │                            │
   │────────────────────────►│                            │
   │                         │  [webhook: thread_reply]   │
   │                         │───────────────────────────►│
   │                         │                            │ reply_to_thread(
   │                         │◄───────────────────────────│   converged=true)
   │                         │  [thread → converged]      │
   │                         │                            │
   │                         │           ... Director reviews ...
   │                         │                            │
   │                         │                            │ close_thread(threadId)
   │                         │◄───────────────────────────│
   │                         │  [thread → closed]         │
```

**Thread states:** `active` → `converged` | `round_limit` | `escalated` → `closed`

**Outstanding intent values:**
- `decision_needed` — A decision must be made
- `agreement_pending` — One party proposed, waiting for agreement
- `director_input` — Director must weigh in
- `implementation_ready` — Design agreed, ready for directive

---

## 4. Task State Machine

```
                    ┌──────────┐
                    │ pending  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          │          ▼
        ┌──────────┐     │    ┌───────────┐
        │ working  │     │    │ cancelled │
        └────┬─────┘     │    └───────────┘
             │           │
     ┌───────┼───────┐   │
     │       │       │   │
     ▼       │       ▼   │
┌─────────┐  │  ┌──────────────┐
│completed│  │  │input_required│
└─────────┘  │  └──────┬───────┘
             │         │
     ┌───────┘         │ (answer received)
     ▼                 │
┌─────────┐            │
│ failed  │    ┌───────┘
└─────────┘    │
               ▼
          ┌──────────┐
          │ working  │ (resumed)
          └──────────┘
```

**Terminal states:** `completed`, `failed`, `cancelled`
**Reported states:** `reported_completed`, `reported_failed` (after Architect reads the report)

---

## 5. Communication Infrastructure

| Component | Technology | Location |
|---|---|---|
| **Hub** | TypeScript/Express + MCP SDK | Cloud Run, `australia-southeast1` |
| **Architect** | Python/ADK + McpToolset | Cloud Run, `australia-southeast1` |
| **Engineer** | OpenCode + remote MCP config | Local developer machine |
| **State** | GCS Bucket (`gs://ois-relay-hub-state`) | `australia-southeast1` |
| **Auth** | Bearer token (`HUB_API_TOKEN`) | All MCP endpoints |
| **Director CLI** | `architect-chat.sh` + `architect-parse.py` | Local terminal |

**MCP Tools:** 28 total (10 Architect, 7 Engineer, 11 Any)
**Notification Events:** 5 (`report_submitted`, `proposal_submitted`, `clarification_requested`, `directive_acknowledged`, `thread_message`)
**Delivery:** MCP SSE to connected sessions (primary), HTTP webhook fallback (Phase 13b)

---

## 6. Friction Points and Edge Cases

### 6.1 Session Fragility
**Issue:** Every Hub redeployment or OpenCode restart invalidates MCP sessions. The Director must restart OpenCode, and the engineer-chat.sh must create a new Architect session.
**Impact:** Disrupts workflow flow. IP-based dedup (Phase 10) mitigates the engineer identity problem but doesn't prevent the session drop itself.
**Root cause:** Cloud Run is stateless. MCP sessions are in-memory on the Hub. Hub restarts wipe all sessions.

### 6.2 Architect Session Isolation
**Issue:** The Architect's SQLite session DB is ephemeral (inside the Cloud Run container). Each redeployment wipes Director conversation history. The Architect has no memory of previous conversations.
**Impact:** Director must re-explain context on each session. The Architect can't reference past discussions.
**Root cause:** SQLite is local to the container. No external session persistence.

### 6.3 Stale Task Accumulation
**Issue:** Tasks 13 and 14 from earlier Architect sessions remained in `working` status indefinitely. No timeout or cleanup mechanism exists.
**Impact:** Clutters the task queue. Engineer must manually identify and clear stale tasks.
**Mitigation (proposed):** Heartbeat-based stuck task recovery (deferred from Phase 10 to future phase).

### 6.4 Auto-Review Quality
**Issue:** The Architect's auto-review runs in a fresh session with no prior context. It reads the report but doesn't know the project's history, axioms, or previous decisions.
**Impact:** Reviews are surface-level ("looks good") rather than deep architectural assessments.
**Root cause:** No axiom registry or persistent Architect memory. Each auto-review is a stateless LLM call.

### 6.5 Report-Report Gap
**Issue:** The Architect can only get the *next unread* report via `get_report`. If multiple reports are submitted, it processes them one at a time. There's no way to get a specific report by task ID.
**Impact:** The Architect can't re-read a specific report without knowing its exact GCS path and using `read_document`.

### 6.6 Engineer Polling
**Issue:** The Engineer (OpenCode) must be explicitly told to "check for directives." The Hub now supports SSE push notifications (Phase 13b), but the Engineer does not yet listen for them.
**Impact:** Latency between directive issuance and pickup. Relies on Director prompting the Engineer.
**Mitigation (Phase 13c):** OpenCode Plugin (Node.js) to listen on the SSE stream and surface Hub notifications in the terminal.

### 6.7 Single-Threaded Task Execution
**Issue:** The Engineer processes one directive at a time sequentially. There's no parallel execution or task batching.
**Impact:** Throughput is limited by serial execution. Multiple directives queue up.

---

## 7. Recommendations for Improvement

### High Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| R1 | **Axiom Registry** — Store project axioms in GCS. Architect loads at boot. Auto-review evaluates reports against axioms. | Transforms reviews from surface-level to governance-aware. | Medium |
| R2 | **Persistent Architect sessions** — Use external session storage (Firestore or GCS) for Architect conversation history. | Director context preserved across restarts. | Medium |
| R3 | **Get report by task ID** — Add `get_task_report(taskId)` tool so the Architect can re-read any report without knowing the GCS path. | Eliminates report-report gap. | Low |

### Medium Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| R4 | **Heartbeat-based stuck task recovery** — Engineer heartbeats, Hub detects stale tasks, reverts to pending after timeout. | Prevents task accumulation. | Medium |
| R5 | **Task priority ordering** — `submit_directive` accepts priority. `get_directive` returns highest-priority pending task. | Better batching when multiple directives are queued. | Low |
| R6 | **Claude Code Channels** — Hub declares `claude/channel` capability. Push directives directly to Claude Code's LLM. | Zero-latency directive delivery. | Medium |

### Lower Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| R7 | **Chat Web UI** — Replace `architect-chat.sh` with a React/Next.js web app. | Better UX, mobile support. | High |
| R8 | **Multi-Engineer routing** — Route directives to specific Engineers by capability or project. | Enables parallel teams. | High |
| R9 | **Structured verification schema** — Replace free-form verification string with structured JSON (command, exit code, output, coverage). | Machine-parseable quality metrics. | Low |

---

## 8. Platform Evolution Timeline

| Phase | Focus | Key Deliverable |
|---|---|---|
| 1-4 | MVP | Basic bidirectional comms (Hub + CLI + Agent Engine) |
| 5 | Cloud Run migration | Architect on Cloud Run with gemini-3.1-pro-preview |
| 6a | Real coding agent | OpenCode as Engineer via remote MCP Server |
| 7 | Operational resilience | GCS persistence, Bearer auth, task state machine |
| 8 | Communication workflows | Summary+reference reports, read_document, webhooks, auto-review |
| 9 | Dynamic tools | McpToolset, role tags, list_documents, persistent reports |
| 10 | Workflow efficiency | Clarification workflow, safe cancel, IP dedup, verification |
| 11 | Closed loops & ideation | submit_review, get_review, close_proposal, ideation threads (5 tools) |
| 12 | Supervised autonomy | Counter reconciliation, get_pending_actions, audit trail, NaN cleanup (3 tools) |
| 13a | Hub client + sandwich | hub_client.py (singleton MCP session), sandwich pattern, deterministic event loop |
| 13b | Hub SSE notifications | notifyConnectedAgents(), hybrid notifyEvent(), SSE keepalive, session status tracking |
| 13c | Agent SSE listeners | Architect logging_callback SSE listener, OpenCode Plugin (Node.js), hub_check tool |
| 13d+e | Universal Adapter | MCP-to-MCP proxy, Push-to-LLM, autonomous bidirectional comms, hub-config.json |
| 14 | Node.js Architect | Full rewrite from Python/ADK to Node.js/TypeScript. Unified context store. Full-duplex SSE. |
| 15 | Persistent notifications | GCS-backed notification queue, Last-Event-ID replay, 24h TTL, indestructible delivery |
| 16 | Wisdom retention | ARCHITECTURE.md, 8 ADRs, correlation IDs, communication semantics, context enrichment |
| Stability | Connection manager | @ois/network-adapter shared package, IConnectionManager, state machine, session reaper, zero orphans |
| Next | Backlog | Operational stress testing, token identity, pagination, dashboard |

### Current Architecture (Stability Phase)

```
Director ←→ Architect (Cloud Run) ←→ Hub (Cloud Run) ←→ Plugin (local proxy) ←→ OpenCode ←→ Engineer (LLM)
              │                         │                    │
              └── @ois/network-adapter ──┘                    └── @ois/network-adapter
                  McpConnectionManager                           McpConnectionManager
                  (shared package)                               (shared package)
```

**Entire stack is Node.js/TypeScript. Single connection per agent. Full-duplex autonomous. Zero orphan sessions. Shared connection manager.**
