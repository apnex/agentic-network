# Workflow Specification

## 1. Design Principles

### 1.1 Workflows are first-class

Every MCP tool exists to serve a step in a documented workflow. No tool is added without a workflow justification. No workflow is designed without ensuring every step has a corresponding tool, state, and completion criterion.

### 1.2 Every workflow must be complete

A workflow is **complete** when:
- Every step has a defined actor, tool, and resulting state
- Every state transition has a defined trigger
- Every branch (success, failure, timeout) has a defined path
- The initiating actor can determine the final outcome without manual intervention
- No step is a dead-end

### 1.3 Workflows are observable

Every workflow instance should be:
- **Traceable** — all steps recorded in persistent state (GCS)
- **Queryable** — any actor can determine the current state of a workflow instance
- **Auditable** — historical workflow instances can be reviewed

### 1.4 Workflows are decoupled from tools

A workflow describes *what happens and why*. Tools describe *how it happens*. Changing a tool's implementation should not change the workflow specification. Adding a workflow step should result in a new tool being created.

---

## 2. Workflow Catalog

| ID  | Workflow                | Trigger                        | Primary Actors              | Status        |
| --- | ----------------------- | ------------------------------ | --------------------------- | ------------- |
| W1  | Directive Execution     | Director request               | Director→Architect→Engineer | Complete      |
| W2  | Proposal Lifecycle      | Engineer design decision       | Engineer→Architect          | Complete      |
| W3  | Clarification           | Ambiguous directive            | Engineer→Architect          | Complete      |
| W4  | Task Cancellation       | Director/Architect decision    | Architect→Hub               | Complete      |
| W5  | Engineer Registration   | Engineer connects              | Engineer→Hub                | Complete      |
| W6  | Document Browsing       | Any actor needs information    | Any→Hub                     | Complete      |
| W7  | Architect Review        | Report/proposal submitted      | Hub→Architect               | Complete      |
| W8  | Ideation Thread         | Design discussion needed       | Engineer↔Architect          | Complete      |
| W9  | Autonomous Polling      | Architect event loop tick      | Architect→Hub               | Complete      |
| W10 | Audit Trail             | Autonomous action taken        | Architect→Hub→Director      | Complete      |

---

## 3. Workflow Specifications

### W1: Directive Execution

**Purpose:** Translate a Director's intent into implemented code via the Architect and Engineer.

**Completion criteria:** The Director receives confirmation that the work is done, including the Architect's quality assessment.

| Step | Actor     | Action                          | Tool                       | State Change         | Webhook                  |
| ---- | --------- | ------------------------------- | -------------------------- | -------------------- | ------------------------ |
| 1    | Director  | Describes work to Architect     | (chat via architect-chat)  | —                    | —                        |
| 2    | Architect | Translates intent to directive  | `submit_directive`         | → `pending`          | —                        |
| 3    | Engineer  | Picks up directive              | `get_directive`            | → `working`          | `directive_acknowledged` |
| 3a   | Engineer  | Requests clarification (opt.)   | `request_clarification`    | → `input_required`   | `clarification_requested`|
| 3b   | Architect | Answers clarification (auto)    | `respond_to_clarification` | → `working`          | —                        |
| 3c   | Engineer  | Retrieves answer                | `get_clarification_response`| —                   | —                        |
| 4    | Engineer  | Completes work, submits report  | `submit_report`            | → `completed`/`failed`| `report_submitted`      |
| 5    | Architect | Reviews report (auto)           | (webhook handler)          | —                    | —                        |
| 5a   | Architect | Reads full report               | `read_document`            | —                    | —                        |
| 5b   | Architect | Stores assessment               | `submit_review`            | `reviewRef` set      | —                        |
| 6    | Engineer  | Reads review                    | `get_review`               | —                    | —                        |
| 7    | Director  | Asks Architect for status       | (chat)                     | —                    | —                        |
| 7a   | Architect | Retrieves assessment            | `get_review`               | —                    | —                        |
| 8    | Director  | Receives confirmation           | (chat)                     | —                    | —                        |

**Gaps identified:**
- ~~**G1:** Step 5b — Architect has no tool to store its review assessment back to the Hub.~~ **RESOLVED** — `submit_review` implemented (Phase 11).
- ~~**G2:** Step 6 — Engineer has no tool to retrieve the Architect's review of their report.~~ **RESOLVED** — `get_review` implemented (Phase 11).
- ~~**G3:** Step 7a — Architect has no tool to retrieve its own prior assessment.~~ **RESOLVED** — `get_review` implemented (Phase 11).
- **G4:** No `reviewed` state on the task — completion of the review cycle is not tracked in the task state machine. **PARTIALLY RESOLVED** — `reviewAssessment` and `reviewRef` fields added to Task, but no separate `reviewed` status.

**Resolution implemented:**
- Hub tool: `submit_review(taskId, assessment)` `[Architect]` — stores the review in GCS at `reviews/task-{id}-review.md` and sets `reviewAssessment`/`reviewRef` on the task JSON.
- Hub tool: `get_review(taskId)` `[Any]` — retrieves the Architect's review for a given task.
- Task fields: `reviewAssessment: string | null`, `reviewRef: string | null`
- Architect auto-review handler calls `submit_review` on webhook, persisting assessments to GCS.
- **Outstanding:** Webhook `review_completed` to push review notifications to the Engineer (future, when push-to-Engineer exists).

---

### W2: Proposal Lifecycle

**Purpose:** Engineer requests an architectural decision. Architect reviews, decides, and the Engineer acts on the decision.

**Completion criteria:** The Engineer has received the Architect's decision and feedback, and has either acted on it or acknowledged it.

| Step | Actor     | Action                          | Tool                       | State Change            | Webhook                 |
| ---- | --------- | ------------------------------- | -------------------------- | ----------------------- | ----------------------- |
| 1    | Engineer  | Identifies design decision need | (internal reasoning)       | —                       | —                       |
| 2    | Engineer  | Submits proposal                | `submit_proposal`          | → `submitted`           | `proposal_submitted`    |
| 3    | Architect | Reviews proposal (auto)         | (webhook handler)          | —                       | —                       |
| 3a   | Architect | Reads full proposal             | `read_document`            | —                       | —                       |
| 3b   | Architect | Provides decision               | `review_proposal`          | → `approved`/`rejected`/`changes_requested` | — |
| 4    | Engineer  | Checks decision                 | `get_proposal_decision`    | —                       | —                       |
| 5    | Engineer  | Acts on decision                | (implementation)           | —                       | —                       |
| 5a   | Engineer  | Closes proposal                 | `close_proposal`           | → `implemented`         | —                       |

**Gaps identified:**
- ~~**G5:** Step 5a — No mechanism to close a proposal after the Engineer acts on it.~~ **RESOLVED** — `close_proposal` implemented (Phase 11). Proposals transition to `implemented` status.
- **G6:** No notification to the Engineer when the Architect makes a decision. The Engineer must poll `get_proposal_decision`. (Mitigated by the auto-review happening within seconds, but not formally closed.)
- **G7:** If the decision is `changes_requested`, there's no mechanism for the Engineer to resubmit a revised proposal linked to the original. It would be a new `prop-N` with no parent reference.

**Resolution implemented:**
- Proposal status: `implemented` — Engineer marks proposal as acted upon via `close_proposal(proposalId)`.
- **Outstanding:** `parent_proposal_id` field for revised proposals linking to the original (future).

---

### W3: Clarification

**Purpose:** Engineer resolves ambiguity in a directive by asking the Architect a question, receiving an answer, and resuming work.

**Completion criteria:** The Engineer has received the Architect's answer and resumed work on the directive.

| Step | Actor     | Action                          | Tool                         | State Change       | Webhook                   |
| ---- | --------- | ------------------------------- | ---------------------------- | ------------------ | ------------------------- |
| 1    | Engineer  | Identifies ambiguity            | (internal reasoning)         | —                  | —                         |
| 2    | Engineer  | Requests clarification          | `request_clarification`      | → `input_required` | `clarification_requested` |
| 3    | Architect | Answers (auto via webhook)      | `respond_to_clarification`   | → `working`        | —                         |
| 4    | Engineer  | Retrieves answer                | `get_clarification_response` | —                  | —                         |
| 5    | Engineer  | Resumes work                    | (continues execution)        | —                  | —                         |

**Gaps identified:**
- **G8:** Only one clarification per task. If the Engineer needs a second clarification, they can call `request_clarification` again, but the previous Q&A is overwritten. There's no history of clarification exchanges.

**Proposed resolution:**
- Future: `clarifications: Array<{question, answer, timestamp}>` instead of single `clarificationQuestion`/`clarificationAnswer` fields.

**Status: Functionally complete for single-round clarification.**

---

### W4: Task Cancellation

**Purpose:** Architect cancels a pending directive before the Engineer picks it up.

**Completion criteria:** The task is in `cancelled` status.

| Step | Actor     | Action                          | Tool                | State Change    | Webhook |
| ---- | --------- | ------------------------------- | ------------------- | --------------- | ------- |
| 1    | Director  | Requests cancellation           | (chat)              | —               | —       |
| 2    | Architect | Cancels the task                | `cancel_task`       | → `cancelled`   | —       |
| 3    | Director  | Receives confirmation           | (chat)              | —               | —       |

**Gaps identified:**
- **G9:** No notification to the Engineer if they've already started working. `cancel_task` only works on `pending` tasks. An Engineer working on a now-unwanted task has no way to know.

**Proposed resolution:**
- Future (Tier 2): `cancel_working_task(taskId)` that sets a `cancellation_requested` flag. Engineer checks this flag on next heartbeat or tool call.

**Status: Complete for Tier 1 (pending tasks only).**

---

### W5: Engineer Registration

**Purpose:** Engineer connects to the Hub, is identified, and appears in the status registry.

**Completion criteria:** The Engineer has a unique, persistent identity visible to the Architect.

| Step | Actor    | Action                            | Tool                | State Change    | Webhook |
| ---- | -------- | --------------------------------- | ------------------- | --------------- | ------- |
| 1    | Engineer | Connects to Hub via MCP           | (MCP initialize)    | —               | —       |
| 2a   | Engineer | Registers explicitly              | `register_role`     | → `connected`   | —       |
| 2b   | Engineer | Registers implicitly              | `get_directive`     | → `connected`   | —       |
| 3    | Hub      | Deduplicates by IP                | (internal logic)    | reactivates existing entry | —  |
| 4    | Engineer | Disconnects (session close)       | (MCP transport close)| → `disconnected`| —      |
| 5    | Hub      | Startup cleanup                   | (boot logic)        | all → `disconnected` | —   |

**Gaps identified:**
- **G10:** No webhook on engineer connect/disconnect. The Architect doesn't know when an Engineer comes online or goes offline unless it polls `engineer_status`.

**Proposed resolution:**
- Future webhook events: `engineer_connected`, `engineer_disconnected`.

**Status: Functionally complete. Webhook notification is a polish item.**

---

### W6: Document Browsing

**Purpose:** Any actor retrieves historical documents (reports, proposals, tasks) from the GCS state bucket.

**Completion criteria:** The actor has the document content.

| Step | Actor | Action                          | Tool              | State Change | Webhook |
| ---- | ----- | ------------------------------- | ------------------ | ------------ | ------- |
| 1    | Any   | Lists documents in a directory  | `list_documents`   | —            | —       |
| 2    | Any   | Reads a specific document       | `read_document`    | —            | —       |

**Gaps identified:**
- None. This workflow is complete.

**Status: Complete.**

---

### W7: Architect Review

**Purpose:** The Architect automatically reviews reports and proposals when they are submitted, stores the assessment, and makes it available to all actors.

**Completion criteria:** The review assessment is stored persistently and retrievable by the Director, Architect, and Engineer.

| Step | Actor     | Action                            | Tool / Mechanism      | State Change | Webhook            |
| ---- | --------- | --------------------------------- | --------------------- | ------------ | ------------------ |
| 1    | Hub       | Fires webhook on submission       | (webhook.ts)          | —            | `report_submitted` / `proposal_submitted` |
| 2    | Architect | Receives webhook                  | `/webhook/hub-event`  | —            | —                  |
| 3    | Architect | Dedup check                       | (_processed_events)   | —            | —                  |
| 4    | Architect | Invokes LLM for review            | (Runner.run_async)    | —            | —                  |
| 4a   | Architect | Reads full document               | `read_document`       | —            | —                  |
| 4b   | Architect | Provides decision (proposals)     | `review_proposal`     | → `approved` etc. | —             |
| 5    | Architect | Stores assessment               | `submit_review`       | `reviewRef` set  | —              |
| 6    | Engineer  | Retrieves review                | `get_review`          | —            | —                  |
| 7    | Director  | Views review (via Architect)    | `get_review`          | —            | —                  |

**Gaps identified:**
- ~~**G1 (same as W1):** No tool to store the review assessment in the Hub.~~ **RESOLVED** — `submit_review` implemented.
- ~~**G2 (same as W1):** No tool for the Engineer to retrieve the review.~~ **RESOLVED** — `get_review` implemented.
- ~~**G3 (same as W1):** No tool for the Architect/Director to retrieve a prior review.~~ **RESOLVED** — `get_review` implemented.
- ~~**G11:** The review is stored in ephemeral in-memory `_completed_reviews` list on the Architect's Cloud Run container.~~ **RESOLVED** — Reviews persisted in GCS at `reviews/task-{id}-review.md` via `submit_review`.

**Resolution implemented:**
- `submit_review(taskId, assessment)` `[Architect]` — stores assessment in GCS and sets `reviewAssessment`/`reviewRef` on task.
- `get_review(taskId)` `[Any]` — retrieves the assessment text and reference path.
- Architect auto-review handler calls `submit_review` on webhook instead of appending to in-memory list.

**Status: Complete.**

---

### W8: Ideation Thread

**Purpose:** Enable multi-turn bidirectional discussion between the Architect and Engineer to explore design decisions, debate architectural approaches, and converge on solutions before committing to implementation.

**Completion criteria:** Both parties have converged (both set `converged=true`), or the thread has reached the round limit and escalated to the Director.

| Step | Actor     | Action                          | Tool                         | State Change           | Webhook            |
| ---- | --------- | ------------------------------- | ---------------------------- | ---------------------- | ------------------ |
| 1    | Any       | Opens a discussion thread       | `open_thread`                | → `active`             | `thread_opened`    |
| 2    | Other     | Reads the thread                | `get_thread`                 | —                      | —                  |
| 3    | Other     | Replies (strict turn-taking)    | `reply_to_thread`            | `currentTurn` flips    | `thread_reply`     |
| 3a   | Any       | Sets convergence flag           | `reply_to_thread(converged)` | —                      | —                  |
| 3b   | Any       | Classifies intent               | `reply_to_thread(intent)`    | `outstandingIntent` set| —                  |
| 4    | Both      | Both converge                   | (auto-detected)              | → `converged`          | —                  |
| 4a   | —         | Round limit reached             | (auto-detected)              | → `round_limit`        | —                  |
| 5    | Director  | Reviews outcome (via Architect) | (chat)                       | —                      | —                  |
| 6    | Architect | Closes thread                   | `close_thread`               | → `closed`             | —                  |

**Thread states:** `active` → `converged` | `round_limit` | `escalated` → `closed`

**Turn-taking model:** Strict alternation via `currentTurn` field. Only the actor whose turn it is may reply. Prevents webhook infinite loops and race conditions.

**Outstanding intent classification:**
- `decision_needed` — A decision must be made before proceeding
- `agreement_pending` — One party has proposed, waiting for agreement
- `director_input` — Director must weigh in
- `implementation_ready` — Design is agreed, ready to be converted to a directive

**Gaps identified:**
- No mechanism to unstick a thread if an agent crashes before replying (potential future `override_turn` tool).
- No direct Director posting — Director always goes through the Architect as proxy.

**Status: Complete.**

---

### W9: Autonomous Polling

**Purpose:** The Architect polls the Hub on each event loop tick to discover all items requiring attention, enabling autonomous action without Director prompting.

**Completion criteria:** The Architect has a single tool call that returns a prioritized summary of all pending work.

| Step | Actor     | Action                            | Tool                   | State Change | Webhook |
| ---- | --------- | --------------------------------- | ---------------------- | ------------ | ------- |
| 1    | Architect | Polls for pending actions         | `get_pending_actions`  | —            | —       |
| 2    | Architect | Processes each pending item       | (various tools)        | (varies)     | —       |

**Items surfaced by `get_pending_actions`:**
- Unread reports (completed/failed with report data)
- Unreviewed tasks (completed but no `reviewAssessment`)
- Pending proposals (status: `submitted`)
- Threads awaiting Architect reply (active, `currentTurn: architect`)
- Clarification requests (status: `input_required`)
- Converged threads awaiting closure

**Status: Complete.**

---

### W10: Audit Trail

**Purpose:** Every autonomous action by the Architect is logged to GCS for Director oversight. The Director can review the audit log to understand what the Architect did and why, without being present.

**Completion criteria:** Audit entries are persisted in GCS and queryable by any actor.

| Step | Actor     | Action                            | Tool                   | State Change | Webhook |
| ---- | --------- | --------------------------------- | ---------------------- | ------------ | ------- |
| 1    | Architect | Takes an autonomous action        | (any tool)             | (varies)     | —       |
| 2    | Architect | Logs the action to audit trail    | `submit_audit_entry`   | —            | —       |
| 3    | Director  | Reviews audit log                 | `list_audit_entries`   | —            | —       |
| 3a   | Director  | Browses daily audit Markdown logs | `list_documents` + `read_document` | — | —     |

**GCS layout:**
- `audit/audit-{timestamp}.json` — structured audit entry
- `audit/log-{YYYY-MM-DD}.md` — daily human-readable Markdown table

**Status: Complete.**

---

## 4. Gap Summary

| Gap | Workflow | Description | Priority | Status | Resolution |
| --- | -------- | ----------- | -------- | ------ | ---------- |
| G1  | W1, W7   | Architect cannot store review assessment in Hub | **Critical** | **RESOLVED** | `submit_review` implemented |
| G2  | W1, W7   | Engineer cannot retrieve Architect's review | **Critical** | **RESOLVED** | `get_review` implemented |
| G3  | W1, W7   | Architect cannot retrieve its own prior review | **High** | **RESOLVED** | `get_review` implemented |
| G4  | W1       | No `reviewed` tracking on tasks | **Medium** | **Partial** | `reviewAssessment`/`reviewRef` fields added; no separate status |
| G5  | W2       | Proposals have no `implemented`/`closed` state | **Medium** | **RESOLVED** | `close_proposal` implemented |
| G6  | W2       | No notification to Engineer on proposal decision | **Low** | Open | Future webhook `proposal_decided` |
| G7  | W2       | No revised proposal linking | **Low** | Open | Future `parent_proposal_id` field |
| G8  | W3       | Single clarification per task (no history) | **Low** | Open | Future `clarifications[]` array |
| G9  | W4       | No cancel for working tasks | **Medium** | Open | Future Tier 2 cancel |
| G10 | W5       | No webhook on engineer connect/disconnect | **Low** | Open | Future webhook events |
| G11 | W7       | Review stored in ephemeral memory | **Critical** | **RESOLVED** | GCS persistence via `submit_review` |

### Critical path — RESOLVED

~~G1, G2, G3, and G11 were the same fundamental gap — the review loop was not closed.~~ **All resolved in Phase 11** by implementing `submit_review` and `get_review` tools with GCS persistence at `reviews/task-{id}-review.md`. The Architect's auto-review handler now persists assessments via `submit_review`.

### Remaining open gaps

5 gaps remain open (G6, G7, G8, G9, G10), all Low or Medium priority. None are blocking current workflows.

---

## 5. Tool-to-Workflow Mapping

Every tool must belong to at least one workflow. Orphan tools indicate design drift.

| Tool                         | Role       | Workflows       | Status     |
| ---------------------------- | ---------- | --------------- | ---------- |
| `submit_directive`           | Architect  | W1              | Mapped     |
| `get_directive`              | Engineer   | W1, W5          | Mapped     |
| `submit_report`              | Engineer   | W1              | Mapped     |
| `get_report`                 | Architect  | W1, W7          | Mapped     |
| `read_document`              | Any        | W1, W2, W6, W7  | Mapped     |
| `list_documents`             | Any        | W6              | Mapped     |
| `list_tasks`                 | Any        | W1 (debug)      | Mapped     |
| `register_role`              | Any        | W5              | Mapped     |
| `engineer_status`            | Architect  | W5              | Mapped     |
| `submit_proposal`            | Engineer   | W2              | Mapped     |
| `get_proposals`              | Any        | W2              | Mapped     |
| `review_proposal`            | Architect  | W2, W7          | Mapped     |
| `get_proposal_decision`      | Engineer   | W2              | Mapped     |
| `close_proposal`             | Engineer   | W2              | Mapped     |
| `cancel_task`                | Architect  | W4              | Mapped     |
| `request_clarification`      | Engineer   | W3              | Mapped     |
| `respond_to_clarification`   | Architect  | W3              | Mapped     |
| `get_clarification_response` | Engineer   | W3              | Mapped     |
| `submit_review`              | Architect  | W1, W7          | Mapped     |
| `get_review`                 | Any        | W1, W7          | Mapped     |
| `open_thread`                | Any        | W8              | Mapped     |
| `reply_to_thread`            | Any        | W8              | Mapped     |
| `get_thread`                 | Any        | W8              | Mapped     |
| `list_threads`               | Any        | W8              | Mapped     |
| `close_thread`               | Architect  | W8              | Mapped     |

| `get_pending_actions`          | Architect  | W9              | Mapped     |
| `submit_audit_entry`           | Architect  | W10             | Mapped     |
| `list_audit_entries`           | Any        | W10             | Mapped     |

**All 28 tools are mapped to workflows. No orphan tools. No missing tools.**

---

## 6. Implementation Status

### Completed
1. ~~`submit_review(taskId, assessment)` tool~~ — Implemented (Phase 11)
2. ~~`get_review(taskId)` tool~~ — Implemented (Phase 11)
3. ~~GCS persistence: `reviews/task-{id}-review.md`~~ — Implemented (Phase 11)
4. ~~Architect auto-review handler calls `submit_review`~~ — Implemented (Phase 11)
5. ~~`close_proposal(proposalId)` tool~~ — Implemented (Phase 11)
6. ~~`reviewAssessment`/`reviewRef` fields on Task~~ — Implemented (Phase 11)
7. ~~Ideation Threads (W8) — `open_thread`, `reply_to_thread`, `get_thread`, `list_threads`, `close_thread`~~ — Implemented (Phase 11)
8. ~~AGENTS.md updated with thread/review/proposal tools~~ — Implemented (Phase 11)
9. ~~Counter reconciliation and NaN cleanup~~ — Implemented (Phase 12)
10. ~~`get_pending_actions` tool for autonomous polling (W9)~~ — Implemented (Phase 12)
11. ~~`submit_audit_entry` + `list_audit_entries` tools (W10)~~ — Implemented (Phase 12)

12. ~~Hub client `hub_client.py` (singleton MCP session, sandwich pattern)~~ — Implemented (Phase 13a)
13. ~~Hub SSE notifications (`notifyConnectedAgents`, `notifyEvent`, keepalive)~~ — Implemented (Phase 13b)

14. ~~Architect SSE listener (logging_callback + reconnect loop)~~ — Implemented (Phase 13c)
15. ~~OpenCode Plugin (Node.js) with hub_check tool~~ — Implemented (Phase 13c)
16. ~~Unified OpenCode Plugin with dynamic tool discovery~~ — Implemented (Phase 13d)

17. ~~Universal MCP Network Adapter (MCP-to-MCP proxy, local Bun server)~~ — Implemented (Phase 13d+e)
18. ~~Push-to-LLM: autonomous prompting via SSE + OpenCode SDK~~ — Implemented and validated (Phase 13e)

19. ~~Architect Node.js rewrite (ADK removal, unified context, full-duplex SSE)~~ — Implemented (Phase 14)

20. ~~Persistent notification queue (GCS, Last-Event-ID replay, 24h TTL)~~ — Implemented (Phase 15)

21. ~~Wisdom retention (ARCHITECTURE.md, ADRs, correlation IDs, communication semantics, context enrichment)~~ — Implemented (Phase 16)
22. ~~Session TTL cleanup + shared ConnectionManager (@ois/hub-connection)~~ — Implemented (Stability Phase)
23. ~~Director chat Gemini function declarations fix~~ — Implemented (Stability Phase)
24. ~~Plugin persistent Last-Event-ID~~ — Implemented (Stability Phase)

### Future backlog
25. Operational end-to-end stress testing (hard crash, forced disconnect, replay under load)
26. Token-based engineer identity (replace IP dedup)
27. List tool pagination (limit/cursor)
28. Multi-round clarification history (G8)
29. Tier 2 task cancellation for working tasks (G9)
30. Proposal revision linking (G7)
31. Task graphing / dependency model
32. Health dashboard + metrics
33. upload-wisdom.sh automation (CI/CD)
34. **Workflow Test Suite** — design, document, and maintain acceptance tests for all engineered multi-agent workflows. Test scenarios with pass/fail criteria and measured metrics across four dimensions: correctness (end-to-end completion), efficiency (latency, step count), efficacy (output quality, contextual relevance), and friction (manual interventions required). Executable operationally, evaluated against system intent for a harmonious and efficient human+multi-LLM agentic software engineering platform. Improvements proposed and embedded back into the engineering system.
