# Trace Management — Engineer Handover Guide

**Audience:** engineer agents (cold-session LLMs, primarily) + humans reviewing engineer work hygiene.
**Scope:** the live work-trace file that an engineer owns for each active mission. Mission-agnostic — every mission gets its own trace; the conventions below apply uniformly.

This guide exists because the trace is the highest-leverage handover artifact in the system. A fresh engineer session picking up work reads the trace FIRST, before any code, before any ADR, before any mission spec. If the trace is stale, lies, or drifts from reality, the cold engineer starts confused and loses hours. If the trace is clean, the cold engineer starts productive in under five minutes.

The update discipline below is what "clean" looks like in practice.

---

## 1. Purpose

A work-trace is the single source of truth for **what is happening right now, across sessions, on a given mission**. It is a *living* document — not a frozen plan, not an audit report, not a task directive.

The trace exists to answer the three questions a fresh engineer has when they wake up cold:
1. **What am I in the middle of?** (resumption pointer + In-flight section)
2. **What could I pick up next?** (Queued + Done-this-session + Edges)
3. **How did we get here?** (Session log)

Things the trace is NOT:
- A mission spec — that lives in `docs/planning/<mission-slug>.md`, describes the original scope + phased plan, and rarely changes. The trace tracks ongoing live state; the spec stays frozen-ish.
- A task directive — those are Hub entities (`task-*`), owned by the architect, carrying the engineer's work orders.
- An audit report — those live in `docs/audits/*.md`, written once per phase closure, frozen on write.
- A commit log — git has that natively.

Because it is living, the trace is the only engineer-owned document that **must be edited on nearly every meaningful session action**. The mechanics below exist to keep that editing cheap + reliable.

---

## 2. Anatomy

Every trace file has the same seven sections, in order:

```
# <Mission-name> — Work Trace (live state)
  <mission scope blurb>
  <pointer to this trace-management.md>

## Resumption pointer (cold-session brief)
## In-flight
## Queued / filed
## Done this session
## Edges (dependency chains)
## Session log (append-only)
## Canonical references
```

### 2.1 Resumption pointer (live-mutable; update whenever "current in-flight" changes)

The first thing a cold engineer reads. Ordered list of pointers — "read these files in this order, expect this state." Must stay actionable; must never say "in-flight: nothing; don't know what to do next." If nothing is claimed, point at the queue + the next-best-candidate reasoning.

### 2.2 In-flight (live-mutable)

Exactly the items the current engineer has claimed and is actively working on. Typically one item, occasionally two. Empty is valid (between sessions). Each item is one bullet with: item name (task-N or scope label), short status phrase, blocker if any.

### 2.3 Queued / filed (live-mutable)

Items that exist but aren't in-flight: ratified-but-unclaimed scopes, triage-pending ideas, filed-but-deferred bugs. Organized by status glyph (see §2.8):
- **○** queued / filed / awaiting-triage
- **⏸** deferred (explicit decision not to pursue now)

### 2.4 Done this session (live-mutable)

Items that shipped or closed **this session only**. On phase close or mission handover, these roll up into a closing audit + get purged from this section to reset for the next session. Each item is one bullet with: item name, commit range or thread id, one-line outcome.

### 2.5 Edges (dependency chains, live-mutable)

ASCII dependency graph. Shows what unblocks what. Updated whenever an item moves between in-flight/done/queued in a way that changes downstream readiness. Keeps the cold engineer from asking "can I pick up X?" and having to reason about prerequisites from scratch.

### 2.6 Session log (APPEND-ONLY — never edit prior entries)

Timestamped one-paragraph entries, newest-first by date, in local AEST (see §4 on timestamps). Captures what happened that session: what shipped, what was escalated, what was discovered. The "how we got here" narrative. **Prior entries are historical record — never rewrite them**, even to correct errors. If you need to correct, append a new entry noting the correction.

### 2.7 Canonical references (rarely updated)

Pointers to the frozen artifacts this mission depends on: mission spec, phase audit reports, ADRs, external scripts. Updated only when a new canonical reference is added (e.g., a new ADR ratifies).

### 2.8 Status legend

Fixed table. Do not change without director/architect consensus. Current glyphs:

| Glyph | Meaning |
|---|---|
| ▶ | in-flight (currently working or next-up) |
| ✅ | done (this session; moves to closing audit on phase close) |
| ○ | queued / filed (waiting on dependency or triage) |
| ⏸ | deferred (explicit decision to not pursue now) |

---

## 3. When to patch

Patch the trace when **any** of the following occur. If none of these, don't patch — avoid churn.

### 3.1 Hub entity state changed
- A task flipped status (pending → working → in_review → completed)
- A bug transitioned (open → investigating → resolved)
- An idea transitioned (open → triaged → incorporated | dismissed)
- A thread converged, abandoned, or reached round_limit
- A mission was created, activated, or closed

### 3.2 Code shipped
- A commit landed that closes a scope item (feature, bug fix, audit recommendation)
- A series of commits completed a checkpoint (like CP2 C1 → C6)
- A commit reverted or superseded a prior landing

### 3.3 Scope filed or re-scoped
- A new idea was filed capturing future work
- A new bug was filed
- An architect-issued task arrived
- An existing item was split, merged, deferred, or re-prioritized

### 3.4 Architectural context surfaced
- A brainstorm thread converged with a ratified direction
- An audit surfaced findings worth capturing
- A manual intervention resolved a problem (escalation, cleanup, migration)

### 3.5 Session boundary
- Engineer paused mid-work — update resumption pointer so next wake-up has accurate state
- Engineer wrapped a session — append a session log entry summarizing the session

### When NOT to patch
- Mid-task thinking ("I'm considering approach X vs Y") — reasoning happens in context or scratch docs, not the trace
- Speculative / hypothetical work ("if architect approves, we might…") — don't commit to trace until ratification
- Transient Hub state during a single tool sequence (task goes `pending → working` within seconds as part of `get_task`) — the stable end state is what matters

---

## 4. How to patch

### 4.1 Mechanical steps

1. **Read the current trace file.** `docs/traces/<mission-slug>-work-trace.md`. Read the whole thing — resumption pointer, status sections, session log. Internalize current state before editing.
2. **Identify deltas.** What changed since the trace was last patched? Status flips, new filings, escalations, commits landed, thread outcomes, architect decisions.
3. **Edit the status sections.**
   - Flip glyphs: ○ → ▶ when claimed; ▶ → ✅ when shipped; ○ → ⏸ when deferred.
   - Move items: in-flight ↔ queued ↔ done ↔ deferred as state changed.
   - Update one-line summaries: reflect the new state (e.g. add commit SHA when a scope item ships).
4. **Update the edges graph** if downstream readiness changed.
5. **Update the resumption pointer** if the "current in-flight" or "highest-signal next-up" changed.
6. **Append to session log.** One new bullet with:
   - **AEST timestamp** (see §4.2 — do not use UTC)
   - Session-scope summary in past tense
   - Cross-references to the Hub entities + commits that landed (task-N, idea-N, thread-N, commit SHAs)
7. **Commit.** Use `[planning]` prefix, one-line subject + optional body. Example:
   ```
   [planning] Work-trace — task-307 shipped; ideas 117+120+123 triaged

   Resumption pointer updated to reflect CP2 closure...
   ```

### 4.2 Timestamps

Session log entries use **local AEST** (Australia/Sydney, UTC+10), not UTC. This is a deliberate convention so the engineer's observed wall-clock matches the log. Expect the log timestamp to skew ~10 hours ahead of UTC `currentDate` contexts — this is not drift.

Format: `**YYYY-MM-DD <period>** — <narrative>`. Periods: `early`, `mid`, `late`, `night`, `very late`, `early (continuation)` for multi-session days.

### 4.3 Commit conventions

- Always **one commit per trace patch** (don't bundle trace updates with code).
- Prefix with `[planning]`.
- Subject line captures the deltas at a glance: *"task-X shipped"*, *"CP2 brainstorm converged"*, *"bug-N resolved"*.
- Body is optional but useful when multiple deltas land in one patch.
- Co-author trailer follows whatever the mission's commit convention is (see engineer memory for mission-specific co-author overrides).

### 4.4 Update granularity

- **Small changes** (status flip, single commit) → 1 trace patch, 1 commit.
- **Multi-delta session** (task shipped + 2 ideas filed + 1 thread converged) → 1 consolidated trace patch at the end of the logical cluster, 1 commit.
- **Never batch** trace updates across sessions. Close each session with its log entry even if only 10 minutes of work happened.

---

## 5. Worked examples

### 5.1 Example — a task ships + report files

**Event:** Engineer finishes task-306 (5 commits), files a create_report, Hub flips task status to `in_review`.

**Sections to edit:**

- **Resumption pointer item 2** — currently says `Current in-flight: task-306 (working)`. Change to `Current in-flight: nothing. task-306 shipped across 5 commits + filed in_review; awaiting architect review.`
- **In-flight** — remove the `▶ task-306` bullet.
- **Done this session** — add:
  ```
  - ✅ **task-306** — Mission-24 Phase C shipped across 5 commits `682950c` → `68fa7fd`.
    [one paragraph: what delivered, which directive requirements each commit
    satisfied, verification summary (test count, typecheck). Cross-reference
    related entities: source idea, source thread, absorbed bugs.]
    Hub report filed; task status = `in_review`. Phase C follow-ups cleared.
  ```
- **Session log** — append:
  ```
  - **2026-04-21 night** — task-306 (Mission-24 Phase C / F) shipped across 5 commits.
    [one paragraph narrative: chronological summary, any mid-flight findings,
    any clarifications opened, what's unblocked next].
  ```
- **Edges** — update if task-306 unblocked follow-up scope (e.g., a new queued item becomes available).
- **Commit:** `[planning] Work-trace — task-306 shipped; work-trace reflects closure`

### 5.2 Example — an idea triaged bilaterally via a thread

**Event:** Engineer opened thread-233 asking architect to triage idea-132. Thread converged bilaterally: architect ratified Option A (dedicated peer mission) with a 4-task grouping; engineer logged refinements and converged first-party with `close_no_action`. Engineer flips `idea-132: open → triaged`.

**Sections to edit:**

- **Resumption pointer** — if the idea-132 mission is high-priority, add a note: `idea-132 ratified for dedicated peer mission; architect will formalize brief after CP3 stabilizes`.
- **Queued / filed** — find the `○ idea-132` bullet. Flip to `✅` with body text: `ratified for dedicated mission X; architect to formalize brief when <condition>`. Or keep `○` and update the body to reflect triage outcome — depends on whether engineer-side triage is "done" or "awaiting architect final mechanics".
- **Done this session** — add:
  ```
  - ✅ **idea-132 — TRIAGED + ratified for dedicated mission** (thread-233,
    <date>). <4-task grouping summary + engineer refinements + pending
    architect actions>.
  - ✅ **thread-233** — <convergence summary, round count, bilateral/first-party>
  ```
- **Session log** — append narrative:
  ```
  - **<date>** — idea-132 triage via thread-233. Architect ratified Option A
    (<mission name>) with <N>-task grouping; engineer refinements logged;
    idea flipped open → triaged. Architect will formalize mission brief
    post-<blocker>.
  ```
- **Commit:** `[planning] Work-trace — idea-132 triage ratified via thread-233`

Note: thread convergence itself is its own event (first-party OR bilateral). If engineer converged first-party, that's a Done-this-session entry; if architect seals later, the thread becomes fully terminal and may trigger another small patch in a later session.

### 5.3 Example — an audit surfaces findings

**Event:** Engineer runs an end-of-session bug/idea/thread audit (director-requested). Discovers that bug-14 + bug-15 are code-resolved but still Hub-`open`. Flips both to `resolved` with fixCommits. Discovers 55+ stranded active threads that can't be cleaned at engineer authority. Flags this as motivation for CP3 priority.

**Sections to edit:**

- **Resumption pointer item 3/4** — update bug state references (bug-14/15 no longer "open" — they're "resolved"). Update triage-pending bug list to reflect.
- **Queued / filed** — find `⏸ bug-14` and `⏸ bug-15` entries. Flip to `✅` with body: `RESOLVED in CP2 C4/C3 (commit X); Hub status now = resolved`.
- **Done this session** — add:
  ```
  - ✅ **End-of-session state-hygiene audit** (director-requested). Executed
    within engineer authority: bugs 14+15 `open → resolved`; ideas 117+120+123
    `open → triaged`. Surfaced as motivation for CP3 priority: <N> abandoned
    active threads + thread-<N> <specific finding>. Escalated to <audience>.
  ```
- **Session log** — append a narrative that captures the audit scope + what
  it surfaced + what's escalated.
- **Commit:** `[planning] Work-trace — end-of-session state-hygiene audit`

The key move in this example: the audit is engineer-initiated work (not architect-directed) but still warrants trace entry because it mutated Hub state + surfaced escalatable findings.

---

## 6. Common pitfalls

These are the failure modes we've seen (or narrowly avoided) in past sessions. Each one degrades the trace's handover value:

### 6.1 Editing prior session log entries

**Symptom:** a new engineer reads the log and finds a narrative that doesn't match what actually happened (based on git history or Hub audit entries).
**Cause:** someone "corrected" a past entry instead of appending a new one.
**Fix:** session log is append-only. If a prior entry was wrong, append a new entry explaining the correction: *"Note: the 2026-04-20 early entry misstated the commit SHA as X; correct SHA is Y."*

### 6.2 Resumption pointer drift

**Symptom:** pointer says `task-X in-flight` but git log shows task-X completed 3 days ago.
**Cause:** engineer forgot to update the pointer when task-X landed.
**Fix:** the pointer is the engineer's single most-important update discipline. Every session-end, re-read the pointer, confirm it matches live state, patch if not.

### 6.3 Parallel lists / sub-sections

**Symptom:** trace has both `## Queued` and `## Pending` (or `## In-flight` and `## Working`) — two sections with overlapping semantics.
**Cause:** engineer added a new section instead of fitting into the canonical seven.
**Fix:** keep the seven canonical sections. If a new concept needs expression, extend an existing section's body rather than spawning a new top-level.

### 6.4 Narrating unratified work

**Symptom:** trace says "bug-11 mitigations 1-6 are in M-Hypervisor-Adapter-Mitigations mission" but that mission doesn't exist in Hub yet.
**Cause:** engineer wrote down a proposed state as if it were real.
**Fix:** trace captures ratified state. Unratified work goes in the body of the idea/thread/proposal, not in the trace's status sections. If something's pending architect action, the trace says "pending architect X" not "Y (done)".

### 6.5 Mid-session thrash

**Symptom:** trace has 8 patches in one session for the same task flipping ▶ → ⏸ → ○ → ▶ as the engineer debates.
**Cause:** engineer treating trace as a scratchpad.
**Fix:** decisions go in the trace when stable (committed, landed, ratified). Pre-decision thinking stays in context. One-trace-patch-per-stable-delta is the norm.

### 6.6 Missing commit cross-references

**Symptom:** Done-this-session bullet says "CP2 shipped" with no commit SHAs or Hub entity IDs.
**Cause:** engineer wrote narrative without grounding.
**Fix:** every Done-this-session + session log entry includes concrete references: commit SHAs (first 7 chars), task IDs, idea IDs, thread IDs. Future engineers should be able to `git show <sha>` or `get_task <id>` to verify every claim.

### 6.7 Over-long session log entries

**Symptom:** a single session log bullet is 1500 words covering every micro-detail.
**Cause:** engineer used the log as a journal.
**Fix:** session log is the narrative skeleton — ~150 words per entry target, ~300 max. Details live in: Done-this-session (for scope), linked audit reports (for deep-dives), commit messages (for code details), Hub entity bodies (for designs).

### 6.8 AEST confusion

**Symptom:** new engineer flags "the session log says 2026-04-22 but the currentDate harness context says 2026-04-20 — is the log stale?"
**Cause:** UTC-AEST skew.
**Fix:** session log is AEST. `currentDate` is typically UTC. ~10-hour forward skew is normal. The `project_session_log_timezone.md` memory entry codifies this.

---

## 7. Cold-session checklist

First five minutes when a fresh LLM session wakes up on a mission:

1. **Locate the trace.** `ls docs/traces/` — read the newest `*-work-trace.md` (the active mission's file; archived ones have the `.closed.md` suffix).
2. **Read the resumption pointer.** That's items 1-5 or so in a numbered list at the top. They tell you the immediate state + what to read next.
3. **Read the canonical references** section (bottom) — know where the mission spec, audit reports, and ADRs live.
4. **Skim In-flight / Queued / Done-this-session.** Get a feel for what's active, what's available, what just landed. Don't memorize — just orient.
5. **Verify the trace matches Hub state.** Spot-check one or two claims:
   - If trace says `task-X in_review`, call `list_tasks({filter: {status: "in_review"}})` and confirm.
   - If trace says `idea-Y triaged`, call `get_idea({id: "idea-Y"})` and confirm.
   - If the spot-checks reveal drift, start your session by patching the trace to match reality, not by acting on stale trace state.
6. **Skim the last 2-3 session log entries.** That's the "how we got here" tail. Enough context to know what matters without drowning in history.
7. **Check the Hub notification surface.** `list_director_notifications`, check for `thread_message` events awaiting your role. If architect responded to an in-flight thread during the session gap, handle that before starting new work.
8. **Only now start new work** — whether it's continuing in-flight items or picking up from queued.

If any of steps 1-7 reveals problems (trace stale, Hub drift, unreplied threads), fix those first. A fresh engineer with a clean orientation is the whole point of this discipline.

---

## 8. What the trace does NOT replace

For completeness — other engineer-owned documentation and its scope boundary:

- **`docs/planning/<mission-slug>.md`** — frozen mission spec + phased plan. Rarely updated; cross-referenced from trace.
- **`docs/audits/<phase>-report.md`** — per-phase closing audit. Written once at phase closure; frozen on write.
- **`docs/decisions/<N>-<slug>.md`** — ADRs. Permanent; cross-referenced from trace + audits.
- **Commit messages** — the code-level narrative. Verify trace claims against `git log`.
- **Hub audit entries (`list_audit_entries`)** — the system-level event log. Verify trace claims against Hub audit.
- **Agent memory (`~/.claude/projects/<project>/memory/`)** — user-level + workflow-level notes. Cross-referenced from trace where relevant.

The trace is the coordination layer across all of these. It doesn't duplicate them; it points at them.

---

## 9. Evolution

This guide itself should evolve. If a new failure mode surfaces, add it to §6. If a new canonical section becomes necessary, add it to §2 (after consensus with the mission's architect / director). If the timestamp convention changes, update §4.2 and the corresponding memory entry.

Update discipline for this file: treat it like any other canonical reference — changes go through commit with `[docs]` or `[planning]` prefix; reasoning in the body.
