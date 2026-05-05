# M-TTL-Liveliness-Design — Work Trace (live state)

**Mission scope.** mission-75 (M-TTL-Liveliness-Design). Substrate-introduction; multi-substrate Hub schema delta + network-adapter substrate + PulseSweeper extension + CLI surface refactor. Director-ratified Q2=a big-bang single-PR (Option A). Full §3.3 critical invariants: touchAgent-bypass via AGENT_TOUCH_BYPASS_TOOLS allow-list (i); tier annotation Hub-passive/shim-active; (unknown,alive) registration-instant edge; PEER_PRESENCE_WINDOW_MS env-ified via resolveLivenessConfig precedence chain.

**Hub mission id:** mission-75.
**Source idea:** idea-225 (status `incorporated`; missionId=mission-75).
**Architect coordination:** thread-473 (cold-pickup coord; sealed via close_no_action 2026-05-05). Phase 8 coord moves to commit-push thread-heartbeats via `create_message kind=note` + PR events at PR-open + cross-approval at PR review per Director directive.
**How to read + update this file:** `docs/methodology/trace-management.md` (canonical guide).

**Status legend:** ▶ in-flight · ✅ done this session · ○ queued / filed · ⏸ deferred

---

## Resumption pointer (cold-session brief)

If you're picking up cold:

1. **Read this file first**, then Design v1.0 at `docs/designs/m-ttl-liveliness-design-design.md` (commit `63b1ebc`; 887 lines; Director-walk-through-ratified bilaterally). Then Phase 6 preflight at `docs/missions/m-ttl-liveliness-design-preflight.md` (commit `f0c0d4b`; verdict GREEN).
2. **Hub mission id:** mission-75 (status=`active`; Phase 7 release-gate ratified by Director).
3. **Branch:** `agent-greg/m-ttl-liveliness-design` branched from `agent-lily/m-ttl-liveliness-design@f0c0d4b` (carries Design v0.1→v1.0 + Phase 6 preflight + engineer implementation stack; mega-PR composes to main).
4. **Ratified scope inputs (do NOT re-litigate):** Q1=cd / Q2=a / Q3=c / Q4=b / Q5=a / Q6=a per Survey envelope; 24 findings folded across round-1 + round-2 + round-3 + Director walk-through; 8 anti-goals (per Survey §5 + Design §8); 4 architect-flags closed (F1 deferred + F2/F3/F4 addressed + F5 concur) + F6-NEW forward-flagged to Phase 8 watchdog consumer-update.
5. **Anti-goals (hold firm; per Design §8):** AG-1 no pulse mechanism redesign (idea-239 follow-on); AG-2 no Transport-module surface change (idea-240+241 follow-on); AG-3 no liveness fields beyond 4-field schema; AG-4 no wholesale livenessState consumer migration (tight P2 scope: watchdog + agent-projection only of 6 consumers); AG-5 no write-batching; AG-6 no CLI color/format/auto-detect; AG-7 no Director-role per-agent-pulse (idea-239 subsumes); AG-8 no Adapter-Kernel-vs-Transport-Module methodology formalisation.
6. **§3.3 critical invariants for during-implementation reference (acknowledged on thread-473):**
   - **touchAgent-bypass:** `transport_heartbeat` handler MUST NOT call `touchAgent` (would bump `lastSeenAt` and collapse cognitive-vs-transport semantic). Implementation approach: AGENT_TOUCH_BYPASS_TOOLS allow-list (i) for extensibility.
   - **Tier annotation:** `tier: "adapter-internal"` at PolicyRouter registration; shim-side `list_tools` filter consumes (Hub stays passive).
   - **§3.1 truth table:** `(unknown cognitive, alive transport)` is registration-instant steady-state — naturally-pending NOT pathological.
   - **PEER_PRESENCE_WINDOW_MS env-ify:** read via `resolveLivenessConfig(agent, 'peerPresenceWindowMs', 60_000)` precedence helper (agent-override → env var → builtin); consumers migrate from hardcoded constant reads.
7. **Pass 10 rebuild MANDATORY before §6 verification gates** per `feedback_pass10_rebuild_hub_container.md` memory; mission-75 touches hub/src extensively (8 files modified or created).

---

## In-flight

▶ **Phase 8 implementation** — single mega-PR per Q2=a Option A; commit-grouped sequence per §7.3 9-item content map. Branch `agent-greg/m-ttl-liveliness-design` cumulative on architect's branch HEAD `f0c0d4b`.

---

## Queued / filed

- ○ **Commit 1:** Hub schema delta — 4 NEW Agent fields (`cognitiveTTL`, `transportTTL`, `cognitiveState`, `transportState`) + `livenessConfig` sub-object + `pulseConfig` field + AGENT_PULSE_KIND constant + AgentPulseConfig + AgentLivenessConfig + ComponentState types
- ○ **Commit 2:** Hub-side TTL/state computation hooks — `recomputeCognitiveTTLAndState` + `recomputeTransportTTLAndState` + `resolveLivenessConfig` + `deriveStateFromTTL` + `touchAgent` post-bump hook + `refreshHeartbeat` post-bump hook + env-ify PEER_PRESENCE_WINDOW_MS + AGENT_TOUCH_MIN_INTERVAL_MS
- ○ **Commit 3:** `transport_heartbeat` MCP tool + tier annotation — PolicyRouter registration with `tier: "adapter-internal"`; new handler invokes existing `refreshHeartbeat`; AGENT_TOUCH_BYPASS_TOOLS allow-list for `touchAgent` skip
- ○ **Commit 4:** Network-adapter poll-backstop heartbeat timer — second 30s timer alongside existing 300s message-poll timer; env vars `TRANSPORT_HEARTBEAT_INTERVAL_MS` + `TRANSPORT_HEARTBEAT_ENABLED`
- ○ **Commit 5:** Shim-side `list_tools` tier filter — adapter-internal tier excluded from LLM catalogue
- ○ **Commit 6:** PulseSweeper `agentPulse` extension — second iteration pass + `AGENT_PULSE_KIND` constant + STRICT suppression rule + agentPulse-ack hook in message-policy
- ○ **Commit 7:** CLI refactor + `mod.core` extraction — NEW `scripts/local/mod.core` (extracted `buildTable()`); `get-agents.sh` sources mod.core; `tpl/agents.jq` column refactor (COGNITIVE_TTL + TRANSPORT_TTL replace LIVENESS_STATE); NEW `test-mod.core.sh` + extension to `test-get-agents-cli.sh`
- ○ **Commit 8:** Watchdog + agent-projection consumer-update — cognitive-vs-transport differentiation per F6-NEW idle-vs-stuck disambiguation per §3.3
- ○ **Commit 9:** Hub-side tests — agent-repository.test.ts (4-field schema + truth-table edges + registration-instant edge); pulse-sweeper.test.ts (agentPulse + AGENT_PULSE_KIND + suppression edges); pending-action-policy.test.ts (refreshHeartbeat post-bump hook); state.test.ts (touchAgent post-bump hook + resolveLivenessConfig precedence); transport-heartbeat-tool.test.ts (handler + tier annotation); e2e-foundation.test.ts (sorted-tool-name snapshot update)
- ○ **Pass 10 rebuild + verification gate run** — `build-hub.sh` + `start-hub.sh` per `feedback_pass10_rebuild_hub_container.md`; run §6.1-§6.4 verification gates on PR branch
- ○ **PR open + cross-approval thread** — push branch + `gh pr create` referencing Design v1.0 + Preflight + thread-473 + thread-472; bilateral cross-approval per `multi-agent-pr-workflow.md` v1.0; thread-side ≠ GitHub-side approval per `feedback_thread_vs_github_approval_decoupled.md`.
- ○ **`create_report` on task-395** — engineer-side report submission post-shipping; architect-side `create_review(approved)` triggers cascade.
- ○ **Architect-side post-merge:** Phase 9 closing audit + Phase 10 retrospective + mission-flip `active → completed`. Per Director directive: full autonomous mission execution; no further Director gate-engagement.

---

## Done this session

- ✅ **Cold-pickup coord (thread-473)** — branch-base concurred; `agent-greg/m-ttl-liveliness-design` branched from `agent-lily/m-ttl-liveliness-design@f0c0d4b`; §3.3 invariants acknowledged; Phase 8 coord moves to pulse + PR events per Director directive. Thread sealed via close_no_action.
- ✅ **Engineer pulse-response** — short_status response dispatched to architect via thread-473 round-1 (pulse fired 04:48Z first-cycle).
- ✅ **Branch + work-trace scaffold** — `agent-greg/m-ttl-liveliness-design` reset to `origin/agent-lily/m-ttl-liveliness-design@f0c0d4b`; this work-trace authored.

---

## Edges (dependency chains)

```
Commit 1 (schema delta) → Commit 2 (computation hooks) → Commit 3 (transport_heartbeat tool) → Commit 4 (poll-backstop heartbeat timer) → Commit 5 (shim filter) → Commit 6 (PulseSweeper) → Commit 7 (CLI + mod.core) → Commit 8 (consumer-update) → Commit 9 (tests) → Pass 10 rebuild → §6 verification gates → PR open → cross-approval → merge → Phase 9/10 (architect)
```

Commits 1-2 are sequential (types must exist before hooks). Commit 3 depends on Commit 2 (handler invokes hook indirectly via refreshHeartbeat). Commits 4 + 5 + 6 are parallelisable post-3 but kept sequential for review clarity. Commit 7 is independent (CLI surface; not load-bearing for hub-side). Commit 8 depends on Commit 1 (consumes new fields). Commit 9 depends on Commits 1-8. Pass 10 rebuild happens after all commits; verification gates run post-rebuild.

---

## Session log (APPEND-ONLY — never edit prior entries)

### 2026-05-05 (AEST) — Cold-pickup + Phase 8 entry

- Engineer pulse fired 04:48Z (first-cycle for mission-75). Cold-pickup: read mission-75 entity (status=active, plannedTask[1] issued as task-395 to greg) + Design v1.0 (commit `63b1ebc`) + Phase 6 preflight (commit `f0c0d4b`; verdict GREEN).
- Opened thread-473 with architect (lily) for status check. Architect concurred plan-of-attack with one clarification: branch from `agent-lily/m-ttl-liveliness-design@f0c0d4b` (NOT main) to compose Design + preflight + implementation in single mega-PR.
- Reset branch `agent-greg/m-ttl-liveliness-design` to `origin/agent-lily/m-ttl-liveliness-design@f0c0d4b`. Confirmed branch-base on thread-473; sealed via close_no_action; Phase 8 coord moves to pulse + PR events per Director directive.
- Authored this work-trace; ready to begin Commit 1 (Hub schema delta).

---

## Canonical references

- **Mission entity:** `mission-75` (created 2026-05-05; status=active)
- **Design brief:** `docs/designs/m-ttl-liveliness-design-design.md` v1.0 (commit `63b1ebc`)
- **Preflight artifact:** `docs/missions/m-ttl-liveliness-design-preflight.md` (commit `f0c0d4b`; verdict GREEN)
- **Survey envelope:** `docs/surveys/m-ttl-liveliness-design-survey.md` v1.0 (commit `f68e23b`)
- **Source idea:** idea-225 (status `incorporated`; missionId=mission-75)
- **Bilateral audit thread (Design):** thread-472 (round_limit; converged: true)
- **Cold-pickup coord thread:** thread-473 (close_no_action sealed)
- **Methodology:** `docs/methodology/mission-lifecycle.md` v1.2 (Phase 8 entry) + `docs/methodology/multi-agent-pr-workflow.md` (cross-approval pattern) + `docs/methodology/trace-management.md` (this trace conforms)
- **Pass 10 rebuild discipline:** `~/.claude/projects/-home-apnex-taceng-agentic-network/memory/feedback_pass10_rebuild_hub_container.md`
- **Architect work-trace (companion):** `docs/traces/m-ttl-liveliness-design-architect-trace.md` (architect-owned; pending architect-side authorship)
- **Downstream Vision/follow-on ideas:** idea-239 (rolePulse) + idea-240 (agnostic-transport) + idea-241 (WebSocket constituent) + idea-242 (declarative configurations) + idea-243 (mod.core systemic CLI consolidation)
