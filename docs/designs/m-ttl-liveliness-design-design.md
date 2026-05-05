# M-TTL-Liveliness-Design — Design v0.2

**Status:** v0.2 (architect-revised 2026-05-05; engineer round-1 audit folded — 3 CRITICAL + 4 MEDIUM + 2 MINOR + 4 PROBE concur, full fold summary §11; pending engineer round-2 verify per `mission-lifecycle.md` Phase 4 audit cycle)
**Methodology:** Phase 4 Design per `mission-lifecycle.md` v1.2 §1 (RACI: C=Director / R=Architect+Engineer)
**Survey envelope:** `docs/surveys/m-ttl-liveliness-design-survey.md` v1.0 (Director-ratified 6 picks; commit `f68e23b`)
**Source idea:** idea-225 (status `triaged` via route-(a) skip-direct)
**Companion:** idea-224 / mission-68 (closed; pulse mechanism we consume per AG-1) + idea-216 (sibling concern; review at Phase 4 entry)
**Branch:** `agent-lily/m-ttl-liveliness-design` (Survey envelope committed `f68e23b`; this Design v0.1 + retrofit + Phase 8 implementation cumulative)
**Director-pre-ratified macro-architecture:** transport heartbeat owned by Adapter Kernel (NOT Transport module); periodic Client→Hub; Hub-side TTL count. Cognitive heartbeat = composite freshness across {pulse-response, tool-call, thread-reply, message-ack}. Hybrid (γ) pulse architecture (mission pulses + per-agent pulse).

---

## §0 Document orientation

Substrate-introduction mission spanning multi-substrate scope. NOT a compressed-lifecycle candidate per envelope §7.3 — bilateral round-1 audit warranted (engineer cross-check on schema decomposition + write-amplification + suppression discipline + cadence threshold).

Reading order:
- §0.5 Existing infrastructure inventory (NEW v0.2 — load-bearing per round-1 audit C1-C3 shared-root-cause finding "prior-substrate-elision")
- §1 Mission scope summary (Survey envelope §3 + §4 reference)
- §2 Architecture overview (3-layer composition; revised v0.2 — drop new MCP tool; reuse drain_pending_actions)
- §3 Component designs:
  - §3.1 Hub schema delta (4 NEW fields; 4-state composite preserved per round-1 C1 fold)
  - §3.2 Hub-side TTL computation (reuse lastSeenAt + lastHeartbeatAt per round-1 C3 fold; eager write-on-event)
  - §3.3 Transport heartbeat = `drain_pending_actions` (existing primitive per round-1 C2 fold; NOT new tool)
  - §3.4 PulseSweeper extension (per-agent pulse via NULL mission binding; revised line estimate per round-1 M1 fold)
  - §3.5 Cognitive-staleness collapses to PEER_PRESENCE_WINDOW_MS (per round-1 M4 fold; 1 invariant not 2)
  - §3.6 CLI surface refactor (`get-agents.sh`; clarified wording per round-1 MIN2 fold)
- §4 Migration sequencing (big-bang single-PR; tight consumer-update scope per round-1 P2 concur)
- §5 Edge cases + failure modes (F1-F5 from envelope architect-flags; truth-table revised per round-1 MIN1 fold)
- §6 Test / verification strategy (drop transport_heartbeat tool tests; reuse existing drain tests)
- §7 PR sequencing + content map (path corrections per round-1 M2 fold)
- §8 Anti-goals (carry from envelope §5)
- §9 Architect-flags status (each marked addressed/deferred for round-2 verify)
- §10 Cross-references (path corrections per round-1 M2 fold)
- §11 Round-1 audit fold summary (NEW v0.2; per mission-67/68/69/71 round-2 verify discipline)

---

## §0.5 Existing infrastructure inventory (NEW v0.2; load-bearing)

Round-1 audit C1/C2/C3 shared-root-cause: **prior-substrate-elision** in v0.1 — Design didn't reference existing infrastructure that this mission overlaps with. v0.2 grounds explicitly via inventory; reuse-vs-replace decisions become explicit per-primitive.

| Substrate primitive | Source-of-truth location | v0.2 reuse-vs-replace decision |
|---|---|---|
| `livenessState` 4-state enum `{online, degraded, unresponsive, offline}` | `hub/src/state.ts:198` | **REUSE UNCHANGED** (per C1 fold option (a)) — ADR-017 FSM untouched; sticky-offline + degraded-as-intermediate semantics preserved |
| ADR-017 liveness FSM (online → degraded → unresponsive → offline transitions) | (referenced via state.ts) | **REUSE UNCHANGED** — drives Agent-record liveness; load-bearing for routing + escalation |
| `lastSeenAt` field | `hub/src/state.ts` | **REUSE** as cognitive-touch primitive; v0.2 derives `cognitiveTTL = now - lastSeenAt` |
| `touchAgent` (updates lastSeenAt; called from tool-call entry) | `hub/src/state.ts` (line ~1245) | **REUSE UNCHANGED** — already wired across all tool-call sites |
| `AGENT_TOUCH_MIN_INTERVAL_MS = 30_000` (rate-limit on touchAgent) | `hub/src/agent-repository.ts:172` | **REUSE UNCHANGED** — cognitive-cadence sub-window of 60s threshold; aligns with engagement patterns |
| `lastHeartbeatAt` field | `hub/src/state.ts:250` | **REUSE** as transport-HB primitive; v0.2 derives `transportTTL = now - lastHeartbeatAt` |
| `drain_pending_actions` MCP tool (existing) | `hub/src/policy/pending-action-policy.ts:42` | **REUSE AS TRANSPORT-HB** (per C2 fold option (a)) — drop new `transport_heartbeat` tool from v0.1; Adapter Kernel poll-backstop already calls drain regularly; serves as transport-HB by design |
| `refreshHeartbeat(agent.id)` (Hub-side handler called on every drain) | `hub/src/policy/pending-action-policy.ts:42` | **REUSE UNCHANGED** — drives `lastHeartbeatAt` updates |
| `PEER_PRESENCE_WINDOW_MS = 60_000` ("agent active in last 60s" check) | `hub/src/agent-repository.ts:179` | **REUSE AS COGNITIVE-STALE THRESHOLD** (per M4 fold) — `cognitivelyStale = !isPeerPresent(agent)` collapses 60s threshold into existing invariant; net win = 1 invariant not 2 |
| Adapter Kernel poll-backstop (periodically calls drain) | `packages/network-adapter/src/kernel/poll-backstop.ts` | **REUSE UNCHANGED** — provides transport-HB cadence via existing mechanism; cadence variance absorbed by PEER_PRESENCE_WINDOW_MS |
| `PULSE_KEYS = ["engineerPulse", "architectPulse"]` | `hub/src/policy/pulse-sweeper.ts` (or related) | **EXTEND CAREFULLY** (per M1 fold) — agentPulse stays SEPARATE from PULSE_KEYS as new constant `AGENT_PULSE_KIND`; cannot join PULSE_KEYS without breaking `mission.pulses[pulseKey]` invariant in 6-file references |
| `pulse-sweeper.ts` (mission-driven iteration) | `hub/src/policy/pulse-sweeper.ts` (NOT services/) | **EXTEND** with second iteration pass (iterate-agents-not-missions); explicit second pass per M1 fold |
| `agent-repository.ts` (Agent record persistence + OCC `putIfMatch`) | `hub/src/entities/agent-repository.ts` | **EXTEND** — Agent record gains 4 new fields; OCC handles concurrent-write contention safely (per P4 concur) |
| `tpl/agents.jq` (jq projection for agents column rendering) | `scripts/local/tpl/agents.jq` | **EXTEND** — column projection update for COG_TTL + TRANS_TTL; replace LIVENESS_STATE column |
| `scripts/local/get-agents.sh` (CLI with in-line `buildTable()` function) | `scripts/local/get-agents.sh` | **EXTEND** — column-header update; in-line buildTable preserved (NOT swapping prism.sh; per MIN2 wording-fold) |

**Discipline going forward:** Phase 4 Design-v0.1 authoring includes §0.5 Existing infrastructure inventory as standard methodology (architect drafts + engineer round-1 verifies completeness). Methodology-fold candidate per mission-73 audit-rubric §3d pattern — sister-class to "memory-tier-to-methodology-tier graduation" + "validator-mechanism-tier-to-methodology-conformance graduation" (mission-74) → "architect-design-prior-substrate-elision" → §3d audit-rubric promotion. Forward-canonical instance: when 2nd substrate-introduction Design surfaces same-class elision, file follow-on idea per the precedent.

---

## §1 Mission scope summary

Per Survey envelope §3 composite intent envelope (matrix-solved):

| Axis | Bound |
|---|---|
| Mission scope | Hub schema delta (5 liveness fields) + Adapter Kernel transport HB (30s) + PulseSweeper extension (per-agent pulse via NULL mission binding) + CLI surface refactor (`get-agents.sh` columns) |
| Mission class | substrate-introduction (multi-substrate; Hub + Adapter Kernel + PulseSweeper + CLI) |
| Tele alignment (primary) | tele-7 (Resilient Agentic Operations); tele-2 (Isomorphic Specification) |
| Tele alignment (secondary) | tele-3 (Sovereign Composition); tele-12 (Precision Context Engineering); tele-11 (Cognitive Minimalism) |
| Director picks (load-bearing) | Q1=cd maximal-info schema / Q2=a big-bang additive migration / Q3=c reuse PulseSweeper + NULL mission binding / Q4=b standard cadences (30s/60s) / Q5=a eager Hub-side TTL / Q6=a raw-seconds CLI |

---

## §2 Architecture overview

Three-layer composition:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: Adapter Kernel (packages/network-adapter/src)                  │
│                                                                          │
│   Transport heartbeat timer (30s):                                       │
│   ┌──────────────┐         ┌─────────────────────────────────────────┐ │
│   │ Adapter      │  POST   │ Hub `transport_heartbeat` MCP tool      │ │
│   │ Kernel timer │ ──30s── ▶│  (NEW; lightweight; no payload)         │ │
│   └──────────────┘         └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: Hub-side state computation (hub/src)                           │
│                                                                          │
│  On signal arrival (transport HB / cognitive signal):                   │
│    1. Update lastTransportHBTime OR lastCognitiveSignalTime              │
│    2. Compute cognitiveTTL = now - lastCognitiveSignalTime               │
│    3. Compute transportTTL = now - lastTransportHBTime                   │
│    4. Derive cognitiveLivenessState = TTL >= 60s ? unresponsive : alive  │
│    5. Derive transportLivenessState = TTL >= 60s ? unresponsive : alive  │
│    6. Derive composite livenessState (rules per §3.1)                    │
│    7. Atomic write to Agent record (5 fields)                            │
│                                                                          │
│  Cognitive signal sources composing freshness:                           │
│    {pulse-response, tool-call, thread-reply, message-ack}                │
│                                                                          │
│  PulseSweeper extended with agentPulse class:                            │
│    - 60min cadence (configurable per Agent record)                       │
│    - NULL mission binding (per-agent fire)                               │
│    - Suppression: skip if agent on any active mission                    │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: CLI surface (scripts/local/get-agents.sh)                      │
│                                                                          │
│  get-agents.sh columns refactored:                                       │
│    REMOVED: LIVENESS_STATE                                               │
│    ADDED:   COG_TTL  (cognitiveTTL raw seconds)                          │
│    ADDED:   TRANS_TTL (transportTTL raw seconds)                         │
│    KEPT:    ACTIVITY_STATE (orthogonal concept)                          │
│                                                                          │
│  Pipe-friendly numeric output (raw seconds; matches prism.sh idiom)     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## §3 Component designs

### §3.1 Hub schema delta (4 NEW fields; 4-state composite preserved per round-1 C1 fold)

**Per Q1=cd maximal-information schema + C1 fold option (a) preserve existing 4-state composite enum.**

Existing `livenessState` field stays UNCHANGED (4-state ADR-017 FSM `{online, degraded, unresponsive, offline}`; sticky-offline; degraded-as-intermediate-stale-but-recoverable). NEW component fields use non-conflicting names per C1 fold:

| Field | Type | Persistence | Derivation | Status |
|---|---|---|---|---|
| `livenessState` (existing) | enum (`online\|degraded\|unresponsive\|offline`) | Persisted | ADR-017 FSM (UNCHANGED) | **EXISTING; UNTOUCHED** |
| `lastSeenAt` (existing) | ISO-8601 timestamp | Persisted | Bumped by `touchAgent` on tool-call entry; rate-limited 30s | **EXISTING; UNTOUCHED** |
| `lastHeartbeatAt` (existing) | ISO-8601 timestamp | Persisted | Bumped by `drain_pending_actions` via `refreshHeartbeat()` | **EXISTING; UNTOUCHED** |
| `cognitiveTTL` (NEW) | integer (seconds) | Persisted (eager) | `now - lastSeenAt`; computed at signal-arrival per Q5=a eager strategy | **NEW v0.2** |
| `transportTTL` (NEW) | integer (seconds) | Persisted (eager) | `now - lastHeartbeatAt`; computed at signal-arrival per Q5=a eager strategy | **NEW v0.2** |
| `cognitiveState` (NEW; renamed from v0.1 `cognitiveLivenessState` per C1 non-conflicting-naming fold) | enum (`alive\|unresponsive\|unknown`) | Persisted | `cognitiveTTL >= PEER_PRESENCE_WINDOW_MS / 1000 ? unresponsive : alive`; `unknown` if `lastSeenAt === null` | **NEW v0.2** |
| `transportState` (NEW; renamed from v0.1 `transportLivenessState` per C1 non-conflicting-naming fold) | enum (`alive\|unresponsive\|unknown`) | Persisted | `transportTTL >= PEER_PRESENCE_WINDOW_MS / 1000 ? unresponsive : alive`; `unknown` if `lastHeartbeatAt === null` | **NEW v0.2** |

**Net schema delta:** 4 NEW fields (cognitiveTTL + transportTTL + cognitiveState + transportState). 0 NEW supporting timestamps (reuse existing `lastSeenAt` + `lastHeartbeatAt` per C3 fold). Down from v0.1's 7 NEW fields (5 + 2 supporting).

**Composite `livenessState` REMAINS in ADR-017 FSM territory (UNTOUCHED):**

The existing 4-state FSM is preserved verbatim. NEW component states (`cognitiveState` + `transportState`) are **complementary 3-state simple-TTL checks**, NOT a derivation rule for composite. They serve different purposes:
- Composite `livenessState` = ADR-017 FSM state (online → degraded → unresponsive → offline; sticky-offline)
- `cognitiveState` = simple TTL check (alive if lastSeenAt within PEER_PRESENCE_WINDOW; unresponsive otherwise)
- `transportState` = simple TTL check (alive if lastHeartbeatAt within PEER_PRESENCE_WINDOW; unresponsive otherwise)

Existing FSM logic continues to drive composite transitions (no derivation rule change in this mission per AG-1 — pulse mechanism redesign out-of-scope; ADR-017 FSM redesign also out-of-scope).

**Truth table — `cognitiveState` × `transportState` (per F4 + MIN1 folds; v0.2 explicit on registration-instant edge):**

| `cognitiveState` | `transportState` | Notes |
|---|---|---|
| alive | alive | Steady-state under engagement |
| unresponsive | alive | Cognitive-stale; transport still receiving drain calls (e.g., long-thinking-no-tool-call >60s; OR LLM hung mid-call but adapter still polling) |
| alive | unresponsive | Transport blip; cognitive freshness still observed (rare; transient network issue) |
| unresponsive | unresponsive | Both stale; agent likely down or disconnected |
| unknown | alive | **Steady-state-just-after-`claim_session`** (per MIN1 fold): claim_session bumps `lastHeartbeatAt` immediately; `lastSeenAt` remains null until first tool-call. Naturally-pending; not pathological |
| alive | unknown | Edge: cognitive signal observed but no transport HB yet (e.g., agent ran tool-call before first drain; rare in practice; resolved on next drain) |
| unknown | unknown | Pre-registration; never reachable for a registered agent |

NOTE: composite `livenessState` 4-state FSM is independent of this truth table; its transitions are driven by ADR-017 logic (existing). v0.2 component states are PARALLEL observability surfaces, NOT FSM inputs.

### §3.2 Hub-side TTL computation (reuse lastSeenAt + lastHeartbeatAt per round-1 C3 fold)

**Per Q5=a eager strategy + C3 fold option (a) reuse existing 2-signal model.**

Computation flow piggybacks on existing primitives that already update timestamps. NO new timestamps; v0.2 just adds eager TTL/state derivation alongside existing updates.

```typescript
// pseudocode; engineer-substrate writes actual TypeScript

// HOOK 1: cognitive-signal piggyback on existing touchAgent
// (existing function in hub/src/state.ts ~line 1245; updates lastSeenAt;
// rate-limited to AGENT_TOUCH_MIN_INTERVAL_MS = 30s)
function touchAgent(agentId: string) {
  // ... existing logic to update lastSeenAt, rate-limited ...
  // NEW v0.2 hook: eager TTL/state derivation post-bump
  recomputeCognitiveTTLAndState(agentId);
}

// HOOK 2: transport-HB piggyback on existing refreshHeartbeat
// (existing function called from drain_pending_actions handler;
// hub/src/policy/pending-action-policy.ts:42)
function refreshHeartbeat(agentId: string) {
  // ... existing logic to update lastHeartbeatAt ...
  // NEW v0.2 hook: eager TTL/state derivation post-bump
  recomputeTransportTTLAndState(agentId);
}

// NEW v0.2 functions
function recomputeCognitiveTTLAndState(agentId: string) {
  const agent = await agentRepository.get(agentId);
  agent.cognitiveTTL = agent.lastSeenAt
    ? secondsBetween(now(), agent.lastSeenAt)
    : null;
  agent.cognitiveState = deriveStateFromTTL(agent.cognitiveTTL);
  await agentRepository.putIfMatch(agent);  // OCC; existing pattern
}

function recomputeTransportTTLAndState(agentId: string) {
  const agent = await agentRepository.get(agentId);
  agent.transportTTL = agent.lastHeartbeatAt
    ? secondsBetween(now(), agent.lastHeartbeatAt)
    : null;
  agent.transportState = deriveStateFromTTL(agent.transportTTL);
  await agentRepository.putIfMatch(agent);  // OCC; existing pattern
}

function deriveStateFromTTL(ttl: number | null): ComponentState {
  if (ttl === null) return 'unknown';
  // M4 fold: collapse to existing PEER_PRESENCE_WINDOW_MS = 60_000
  return ttl >= (PEER_PRESENCE_WINDOW_MS / 1000) ? 'unresponsive' : 'alive';
}
```

**Constants reused (NOT new):**
- `PEER_PRESENCE_WINDOW_MS = 60_000` (existing; `hub/src/agent-repository.ts:179`) — 60s threshold for `cognitivelyStale` AND `transportStale` (per M4 fold; 1 invariant not 2)
- `AGENT_TOUCH_MIN_INTERVAL_MS = 30_000` (existing; cognitive-cadence rate-limit; sub-window of 60s threshold; aligns with engagement patterns)

**Sweeper concern:** TTL values stored on Agent record become stale between writes (since they're computed at write-time). Per F1 audit-flag write-amplification: ~7 writes/min/agent under engagement is acceptable per round-1 P4 concur (AgentRepository OCC `putIfMatch` handles concurrent-write contention safely; storage-provider write-throughput limits not approached at current scale of 2 agents). Reads return cached values which may be up to AGENT_TOUCH_MIN_INTERVAL_MS=30s stale on the cognitive side (negligible relative to 60s threshold).

**Read-time precision:** consumers needing freshness-precision can optionally recompute on-demand: `freshTTL = now() - agent.lastSeenAt`. Default reads use cached values. PolicyRouter routing decisions + escalation triggers consume cached values (sub-second precision not required for routing decisions).

**Architect-flag F1 (audit):** at scale-out (10+ agents under sub-second cognitive activity), eager-write path may need batching. Phase 4 Design notes this as forward-flag per AG-5; v1 ships eager-write-on-event hooks. P4 concur from greg confirms current-scale headroom.

### §3.3 Transport heartbeat = `drain_pending_actions` (existing primitive per round-1 C2 fold)

**Per macro-architecture (Adapter Kernel owner) + C2 fold option (a) repurpose existing.**

**v0.1 → v0.2 architectural change:** v0.1 proposed a NEW `transport_heartbeat` MCP tool + Adapter Kernel timer. **v0.2 drops this entirely** and reuses existing infrastructure: `drain_pending_actions` IS the transport-HB mechanism today.

**Existing mechanism (UNCHANGED in this mission):**
- Adapter Kernel periodically calls `drain_pending_actions` MCP tool via the existing **poll-backstop pattern** (`packages/network-adapter/src/kernel/poll-backstop.ts`)
- Each drain call → Hub's `pending-action-policy.ts:42` invokes `refreshHeartbeat(agent.id)` → updates `lastHeartbeatAt`
- Adapter Kernel cadence is variable (queue-driven; depends on pending-action-pull frequency); existing PEER_PRESENCE_WINDOW_MS = 60_000 absorbs cadence variance

**v0.2 addition:** §3.2 hook installs eager TTL/state recomputation alongside existing `refreshHeartbeat()` call (no new MCP tool; no new Adapter Kernel timer; no new code path).

**Net effect vs v0.1:**
- 0 new MCP tools (vs +1 in v0.1)
- 0 new Adapter Kernel timers (vs +1 in v0.1)
- PolicyRouter snapshot test untouched (mission-72 invariant unaffected)
- ~70 lines of v0.1 code-surface eliminated (transport-heartbeat.ts + tool handler + tests)

**Cadence consideration (from Q4=b 30s spec):**
The 30s cadence Director-ratified at Survey was an absolute interval expectation. Existing poll-backstop has variable cadence based on queue activity. The 60s PEER_PRESENCE_WINDOW threshold is 2× the typical poll cadence, providing tolerance for natural queue-quiet periods. **Architect-flag for round-2 verify (NEW from v0.2):** if engineer-substrate observation shows poll-backstop quiescing >60s under no-queue conditions, may need to add a minimum-poll-cadence config to ensure transport-HB freshness even when no pending actions exist. Defer to engineer round-2 verify; not blocking v0.2 ratification.

**Configuration (NEW; minimal):**
- No new env vars in v0.2 (vs v0.1's transportHeartbeatIntervalSeconds + transportHeartbeatEnabled). Existing poll-backstop config (whatever exists) preserved.
- IF round-2 verify surfaces poll-quiescence concern: add `MIN_POLL_INTERVAL_MS` env var to poll-backstop (separate concern from this mission; could file as follow-on).

**Failure mode:**
- Drain call fails (network blip): existing poll-backstop retry semantics handle (UNCHANGED)
- Hub returns error: existing poll-backstop error handling (UNCHANGED)
- Long-quiescent period (no queue activity, no drain triggered): `lastHeartbeatAt` ages; eventually `transportTTL >= 60s` → `transportState = unresponsive`; ADR-017 FSM may transition `livenessState` to `degraded` if existing logic fires. Acceptable behavior; reflects real transport-stale state.

### §3.4 PulseSweeper extension (per-agent pulse via NULL mission binding; revised line estimate per round-1 M1 fold)

**Per Q3=c reuse + NULL mission binding + M1 fold (line estimate revised; explicit second iteration pass; AGENT_PULSE_KIND separate from PULSE_KEYS).**

**Location:** `hub/src/policy/pulse-sweeper.ts` (NOT services/; per M2 fold path correction)

**Line estimate revision (per M1 fold):** v0.1 estimated +30 lines; v0.2 revises to **+80-120 lines** per engineer's substrate analysis. Rationale: new iteration pass (iterate-Agents-not-missions) + lastFiredAt persistence on Agent record + agentPulse-specific message-policy.ts pulse-ack hook + tests. PULSE_KEYS contract preserved (agentPulse stays SEPARATE constant `AGENT_PULSE_KIND`; cannot join PULSE_KEYS without breaking 6-file `mission.pulses[pulseKey]` invariant).

**Architectural pattern:**
- Existing `PULSE_KEYS = ["engineerPulse", "architectPulse"]` drives mission-pulse iteration: `for mission of activeMissions; for pulseKey of PULSE_KEYS; mission.pulses[pulseKey]`
- NEW v0.2 separate constant `AGENT_PULSE_KIND = "agentPulse"` drives per-agent iteration: `for agent of registeredAgents; agent.pulseConfig`
- Two iteration passes in pulse-sweeper.ts; NOT unified into PULSE_KEYS array
- agentPulse `mission.pulses` does NOT exist (config lives on Agent, not Mission); preserves existing schema invariants

**New pulse-class:** `agentPulse` (parallel to existing `engineerPulse` / `architectPulse`)

**Configuration on Agent record (NEW field):**
```typescript
interface AgentPulseConfig {
  intervalSeconds: number;     // default 3600 (60min)
  message: string;             // default "Agent pulse — heartbeat check; respond with shape ack"
  responseShape: "ack";        // lighter than short_status; just an ack
  missedThreshold: number;     // default 2
  enabled: boolean;            // default true
}
```

**Suppression discipline (per F2 audit-flag + M3 fold strict-rejection-of-permissive):**

`agentPulse` fires for agent X if AND ONLY IF:
- `agent.pulseConfig.enabled === true`
- AND no active mission has agent X in its pulse-binding (i.e., no mission where `mission.status === 'active'` AND agent X appears in `mission.assignedEngineerId` OR `mission.architectId`)

Pseudocode (path correction per M2: agentRepository not agentStore):
```typescript
async function shouldFireAgentPulse(agentId: string): Promise<boolean> {
  const agent = await agentRepository.get(agentId);
  if (!agent.pulseConfig?.enabled) return false;

  // Suppression: skip if any active mission already pulses this agent
  // Strict rule (per M3 fold; alternative permissive rule explicitly REJECTED below)
  const activeMissions = await missionRepository.list({ status: 'active' });
  const isOnActiveMission = activeMissions.some(m =>
    m.assignedEngineerId === agentId || m.architectId === agentId
  );
  if (isOnActiveMission) return false;

  // Cadence check: fire if interval elapsed since last fire
  const elapsed = secondsBetween(now(), agent.pulseConfig.lastFiredAt);
  return elapsed >= agent.pulseConfig.intervalSeconds;
}
```

**Pulse content:**
- Message: "Agent pulse — heartbeat check; respond with shape ack"
- ResponseShape: `ack` (lighter than `short_status`; just an acknowledgment that the agent is cognitively alive)
- Recipient: agent itself (single-recipient pulse)

**Strict-vs-permissive rejection rationale (per M3 fold; explicit closure):**

Alternative permissive rule considered: only suppress if `mission.pulses[corresponding-role]` is configured for this agent. Rationale would be: agent assigned but silent (no mission-pulse engagement) → wants the agent-pulse signal.

**Strict rule preferred + explicit rejection of permissive:** agent on active mission is busy by definition; the system already trusts mission-pulse engagement (engineerPulse OR architectPulse) to monitor agent liveness during mission engagement. Adding redundant agentPulse fires when agent is mission-engaged but silent (no mission-pulse) would:
- Increase token cost per agent during mission engagement
- Provide low signal value (mission-pulse missed-count + escalation already handles silence)
- Conflict with the "death-detection slow-but-cheap" design intent (per Survey envelope §0)

The permissive rule's edge case (mission with architect-only pulses; engineer assigned but silent) is real but better solved at the mission-pulse-config layer (configure mission to also have engineerPulse if engineer engagement is desired) than at the agent-pulse layer.

**Edge cases (per F2 audit-flag; revised v0.2):**
- Agent on multiple active missions (multi-engagement) → suppressed (any active mission suppresses)
- Agent on completed mission with lingering pulse-config → not suppressed (only `status: 'active'` missions suppress)
- Agent on active mission where agent's role-pulse (engineerPulse/architectPulse) is NOT configured → suppressed per strict rule (M3 fold; permissive alternative explicitly rejected above)
- New agent registration with no pulse-config → defaults applied at registration time

### §3.5 Cognitive-staleness threshold collapses to PEER_PRESENCE_WINDOW_MS (per round-1 M4 fold; 1 invariant not 2)

**Per Q4=b (60s threshold) + M4 fold (collapse to existing 60s invariant).**

**v0.1 → v0.2 simplification:** v0.1 introduced a separate 60s threshold for cognitive-staleness on a separate `lastCognitiveSignalTime` timestamp. v0.2 collapses to the existing **PEER_PRESENCE_WINDOW_MS = 60_000** invariant on existing `lastSeenAt` timestamp:

```typescript
function deriveStateFromTTL(ttl: number | null): ComponentState {
  if (ttl === null) return 'unknown';
  return ttl >= (PEER_PRESENCE_WINDOW_MS / 1000) ? 'unresponsive' : 'alive';
}
```

`cognitivelyStale` becomes equivalent to `!isPeerPresent(agent)` — the existing invariant in `agent-repository.ts:179`. Net win: **1 invariant instead of 2** (eliminates double-bookkeeping risk).

**Cognitive signal sources composing freshness via `touchAgent`:**

`lastSeenAt` is updated by `touchAgent()` (existing; rate-limited 30s by AGENT_TOUCH_MIN_INTERVAL_MS) called from tool-call entry sites. The cognitive-signal sources Director-ratified at Survey (pulse-response, tool-call, thread-reply, message-ack) all flow through tool-call entry → `touchAgent` → `lastSeenAt` bump. Existing infrastructure already handles this composition; v0.2 simply derives cognitiveTTL from the existing timestamp.

**Architect-flag F3 (audit) — cognitive-stale 60s threshold against engagement patterns:**

The 60s threshold (PEER_PRESENCE_WINDOW_MS = 60_000) means: "no `touchAgent` call in 60s" → `cognitivelyStale`. Concern: long-thinking-no-tool-call period for >60s would trip cognitive-stale even though agent is demonstrably alive (e.g., LLM in 90s deep reasoning loop without intermediate tool calls).

**Phase 4 Design open question (UNCHANGED from v0.1):** is the 60s threshold load-bearing, OR should we widen to e.g., 120s or 180s for "real" cognitive-stale? Engineer-audit consideration: empirical observation of typical cognitive-signal cadence under engagement (tool-calls during active work tend to fire every 5-30s; long-thinking >60s is rare but possible).

**Architect-recommendation:** ship with PEER_PRESENCE_WINDOW_MS = 60s threshold for v1 (existing invariant; no constant change in this mission); instrument cognitive-stale-fire rate post-deployment; if false-positive rate is high, raise to 120s in follow-on (would mean updating the existing constant — affects ALL existing `isPeerPresent` consumers; broader change than this mission's scope; AG-3 anti-goal protects). NOT blocking this mission's ship.

### §3.6 CLI surface refactor (`scripts/local/get-agents.sh`)

**Per Q6=a raw-seconds + Director CLI mandate.**

**Current columns** (mission-66 W4-era):
```
ID  NAME  ROLE  LIVENESS_STATE  ACTIVITY_STATE  SHIM_PLUGIN  ADAPTER  LLM_MODEL  PID  LABELS
```

**Target columns** (post-mission-225):
```
ID  NAME  ROLE  COG_TTL  TRANS_TTL  ACTIVITY_STATE  SHIM_PLUGIN  ADAPTER  LLM_MODEL  PID  LABELS
```

**Changes:**
- REMOVED: `LIVENESS_STATE` column (composite still in schema; just not in CLI default render — composite available via `--show-composite` flag if needed)
- ADDED: `COG_TTL` column showing `cognitiveTTL` raw seconds
- ADDED: `TRANS_TTL` column showing `transportTTL` raw seconds
- KEPT: `ACTIVITY_STATE` (orthogonal concept; busy/idle indicator)

**Implementation (per MIN2 fold; clarified wording):**
- `scripts/local/get-agents.sh` updates column header via existing in-line `buildTable()` function (NOT swapping prism.sh into scripts/local/; memory `reference_prism_table_pattern.md` is conceptual reference, not substrate import)
- `scripts/local/tpl/agents.jq` projection update for new columns (COG_TTL + TRANS_TTL; remove LIVENESS_STATE)
- In-line `buildTable()` column-header refresh in get-agents.sh

**Sample output:**
```
ID                NAME              ROLE       COG_TTL  TRANS_TTL  ACTIVITY_STATE  SHIM_PLUGIN   ADAPTER  ...
eng-0d2c690e7dd5  eng-0d2c690e7dd5  engineer   12       8          online_idle     claude-1.2.0  2.1.0    ...
eng-40903c59d19f  eng-40903c59d19f  architect  3        15         online_idle     claude-1.2.0  2.1.0    ...
```

Operator visually scans: "low TTLs = alive; high TTLs (>60) = unresponsive; missing values = unknown". No color/format/auto-detect per AG-6.

---

## §4 Migration sequencing (big-bang single-PR; consumer-update opportunism)

**Per Q2=a big-bang additive migration.**

**Single PR adds:**
- 4 new schema fields (composite retained)
- 2 supporting fields (lastCognitiveSignalTime, lastTransportHBTime)
- pulseConfig field on Agent record (for agentPulse)
- Hub-side TTL computation logic
- Hub-side `transport_heartbeat` MCP tool
- Adapter Kernel transport-HB timer
- PulseSweeper agentPulse extension + suppression
- CLI column refactor

**Consumer-update opportunism (per round-1 P2 concur; tight scope):**

`livenessState` consumed by 6 hub/src files (per greg's substrate scan):
- `state.ts` — types + isPeerPresent invariant; **STAY ON COMPOSITE** (predicate is "agent reachable for routing"; composite-FSM is correct level)
- `agent-repository.ts` — Agent record persistence; **STAY ON COMPOSITE** (existing FSM transitions unchanged)
- `agent-projection.ts` — CLI projection; **UPDATE** per §3.6 column refactor (COG_TTL + TRANS_TTL)
- `watchdog.ts` — escalation-on-unresponsive logic; **UPDATE** to use cognitive-vs-transport differentiation (different remediation paths per macro-architecture: cognitive-stale → reset context / Director escalation; transport-stale → reconnect / restart shim)
- `pending-action-policy.ts` — predicate is "is this Agent reachable for routing"; **STAY ON COMPOSITE**
- `session-policy.ts` — session-management predicate; **STAY ON COMPOSITE**

**Tight scope for this mission's PR:** watchdog + agent-projection only (2 of 6). Bound the blast radius. Other 4 consumers stay on composite indefinitely; ADR-017 FSM semantics serve them correctly.

**No schema-rename migration script needed** per C1 fold preserves existing 4-state `livenessState` enum + ADR-017 FSM untouched; nothing being renamed; only added (4 NEW fields).

---

## §5 Edge cases + failure modes

### §5.1 F1 (CRITICAL) — Write-amplification at scale

**Risk:** at 30s transport HB + ~5 cognitive signals/min under engagement = ~7 writes/min/agent. At 10+ agents → ~70 writes/min hub-wide. Storage-provider write-throughput limits + Agent-record lock contention.

**Mitigation v1:** ship eager-write per Q5=a; instrument write-rate post-deployment; AG-5 anti-goal blocks batching this mission.

**Forward-flag:** if scale-out warrants, file follow-on idea for "M-TTL-Eager-Write-Batching" — batch writes per agent within 1s window.

**Engineer-audit ask (F1):** validate write-amp doesn't trip Agent-record contention or storage-provider write-throughput limits at current scale (2 agents).

### §5.2 F2 (MEDIUM) — Suppression-discipline correctness

**Risk:** PulseSweeper "skip if any active mission already pulses this agent" — edge cases:
- Agent on multiple active missions (multi-engagement)
- Agent on completed mission with lingering pulse-config (post-completion)
- New agent registration with no pulse-config

**§3.4 specifies suppression rule:** `mission.status === 'active' AND (agent.id IN mission.assignedEngineerId OR mission.architectId)`. Multi-engagement → ANY active mission suppresses; completed missions don't suppress; new agents get default pulseConfig at registration.

**Engineer-audit ask (F2):** validate suppression rule semantics; flag edge cases §3.4 missed.

### §5.3 F3 (MEDIUM) — Cognitive-stale threshold against engagement patterns

**Risk:** 60s threshold may false-positive on long-thinking-no-tool-call periods.

**Mitigation v1:** ship 60s threshold; instrument cognitive-stale-fire rate post-deployment; if false-positive rate >5%, raise to 120s in follow-on.

**Engineer-audit ask (F3):** validate threshold doesn't fire false-positive under normal engagement; suggest empirical observation strategy.

### §5.4 F4 (MINOR) — Truth table (component states; NOT composite derivation per round-1 C1 fold)

**v0.1 → v0.2 reframing:** v0.1 §5.4 framed truth table as "composite derivation rules". v0.2 reframes per C1 fold: composite `livenessState` is UNCHANGED (4-state ADR-017 FSM); truth table is now for the NEW component states (`cognitiveState` × `transportState`), which are PARALLEL observability surfaces (NOT FSM inputs to composite).

**§3.1 specifies the truth table** with explicit registration-instant edge case (per MIN1 fold): `(unknown cognitive, alive transport)` is the steady-state-just-after-`claim_session` row, not `(unknown, unknown)`. claim_session bumps `lastHeartbeatAt` immediately (transport-alive); `lastSeenAt` is null until first tool-call (cognitive-unknown).

**Engineer-audit ask (F4 v0.2):** validate the §3.1 truth table; confirm `(unknown, alive)` registration-instant edge is naturally-pending (not pathological); flag any edge cases §3.1 missed.

### §5.5 F5 (PROBE) — Per-agent pulse cadence specific number

**Survey-deferred** to Phase 4 Design picks. Range constraint: ≥30min per Q4 ratio; ≤120min per "death-detection slow-but-cheap".

**Architect-recommendation:** 60min default. Configurable per Agent record at registration time + Hub-side mutator.

**Engineer-audit ask (F5):** what cadence does engineer-substrate intuition support; consider real-world cost (token responses every 60min × N agents = baseline overhead); 30min vs 60min vs 120min trade-off.

---

## §6 Test / verification strategy

### §6.1 Hub-side tests (vitest; revised v0.2 per round-1 folds)

- `hub/test/entities/agent-repository.test.ts` (path correction per M2) — extend with 4-field schema delta tests (cognitiveTTL/transportTTL eager-computation; cognitiveState/transportState derivation against PEER_PRESENCE_WINDOW_MS; truth-table edges incl. registration-instant `(unknown, alive)` per MIN1)
- `hub/test/policy/pulse-sweeper.test.ts` (path correction per M2) — NEW tests for agentPulse class + AGENT_PULSE_KIND second-iteration-pass + NULL mission binding suppression rule (strict; multi-engagement edge; completed mission edge; permissive-rule explicitly-rejected case per M3)
- `hub/test/policy/pending-action-policy.test.ts` — extend `refreshHeartbeat()` tests to verify `recomputeTransportTTLAndState()` hook fires post-bump (eager-write semantic)
- `hub/test/state.test.ts` — extend `touchAgent()` tests to verify `recomputeCognitiveTTLAndState()` hook fires post-bump (eager-write semantic; 30s rate-limit preserved)
- ~~`hub/test/policy/transport-heartbeat-tool.test.ts` (DROPPED v0.2)~~ — no new MCP tool per C2 fold; existing `drain_pending_actions` tests cover transport-HB path
- `hub/test/e2e/e2e-foundation.test.ts` — UNCHANGED (no new MCP tool per C2 fold; sorted-tool-name snapshot does NOT need update)

### §6.2 Adapter Kernel tests (revised v0.2 — drop new transport-HB timer tests per C2 fold)

- ~~`packages/network-adapter/test/kernel/transport-heartbeat.test.ts` (DROPPED v0.2)~~ — no new client-side timer per C2 fold; existing poll-backstop tests cover transport-HB cadence
- `packages/network-adapter/test/kernel/poll-backstop.test.ts` — UNCHANGED (existing tests; transport-HB cadence is poll-backstop's existing concern)

### §6.3 CLI smoke-test

- `scripts/local/test-get-agents-cli.sh` — extend OR new; verify columns COG_TTL + TRANS_TTL render correctly with prism.sh + buildTable

### §6.4 Verification gates (Phase 6 + Phase 7)

- §6.1 + §6.2 + §6.3 all pass on PR branch
- `git grep -c "livenessState" hub/src/` → ≥1 (composite still referenced; not removed)
- `git grep -c "cognitiveLivenessState" hub/src/` → ≥1 (NEW field referenced)
- Hub `transport_heartbeat` tool registered (validated via PolicyRouter snapshot test)
- Adapter Kernel transport-HB fires on agent-startup (validated via test-skill-bootstrap.sh-style smoke-test)
- `scripts/local/get-agents.sh` outputs COG_TTL + TRANS_TTL columns

---

## §7 PR sequencing + content map

**Mission scope is medium-large; multi-substrate.** Two PR-sequencing options:

### §7.1 Option A — Single mega-PR (mission-71 M6 fold pattern)

All deltas in one PR; cumulative-fold pattern. Pros: atomic transition; clean migration. Cons: large diff; review burden.

### §7.2 Option B — 2-3 sequenced PRs (substrate-cleanup-wave pattern)

PR 1: Hub schema delta + eager TTL computation + composite derivation + tests
PR 2: Adapter Kernel transport-HB + Hub `transport_heartbeat` tool + PulseSweeper agentPulse extension + tests
PR 3: CLI refactor (`get-agents.sh` columns) + integration smoke-test

Pros: smaller per-PR review burden; sequenced testing. Cons: intermediate states (PR 1 ships 5-field schema before HB mechanism exists; transport-LivenessState would always show `unknown` post-PR1 until PR2 ships).

**Architect-recommendation:** Phase 4 Design picks Option A OR B at engineer-audit time based on scope feel. Default lean: Option A (mission-71 precedent for medium-large architect+engineer-bilateral substrate-introduction).

### §7.3 Content map (single mega-PR; Option A default; revised v0.2 per round-1 M2 path corrections + scope reductions)

| File | Change | Lines (est.) |
|---|---|---|
| `docs/surveys/m-ttl-liveliness-design-survey.md` | Phase 3 envelope (already committed `f68e23b`) | +359 |
| `docs/designs/m-ttl-liveliness-design-design.md` | This Design v0.1 → v0.2 → v1.0 | +750 |
| `hub/src/state.ts` (path correction per M2) | Type extensions: cognitiveTTL/transportTTL/cognitiveState/transportState fields + AGENT_PULSE_KIND constant + pulseConfig type + touchAgent post-bump hook | +35 / -2 |
| `hub/src/entities/agent-repository.ts` (path correction per M2; was entities/agent.ts) | Schema delta application: 4 NEW fields persistence; OCC-safe writes for new fields | +40 |
| `hub/src/policy/pulse-sweeper.ts` (path correction per M2; was services/pulse-sweeper.ts) | agentPulse SECOND iteration pass (iterate-Agents-not-missions) + AGENT_PULSE_KIND constant + NULL mission binding suppression (strict per M3) + lastFiredAt persistence | +80-120 (per M1 fold; revised from v0.1's +60) |
| `hub/src/policy/pending-action-policy.ts` | `refreshHeartbeat()` post-bump hook → `recomputeTransportTTLAndState(agentId)` | +10 |
| ~~`hub/src/policy/router.ts` — Register `transport_heartbeat` MCP tool~~ | **DROPPED v0.2 per C2 fold** — no new MCP tool | 0 |
| ~~`hub/src/handlers/transport-heartbeat-handler.ts` (NEW)~~ | **DROPPED v0.2 per C2 fold** — no new handler | 0 |
| `hub/src/policy/message-policy.ts` | agentPulse-ack hook (per M1 fold; pulse-ack lifecycle extension) | +20 |
| `hub/test/entities/agent-repository.test.ts` (path correction per M2) | Schema delta tests + eager TTL + truth-table edges (incl. registration-instant) | +130 |
| `hub/test/policy/pulse-sweeper.test.ts` (path correction per M2) | agentPulse + AGENT_PULSE_KIND + suppression strict-rule edge cases (multi-engagement, completed-mission, permissive-rejection) | +90 |
| `hub/test/policy/pending-action-policy.test.ts` | `refreshHeartbeat` post-bump hook fires `recomputeTransportTTLAndState` | +30 |
| `hub/test/state.test.ts` | `touchAgent` post-bump hook fires `recomputeCognitiveTTLAndState`; 30s rate-limit preserved | +30 |
| ~~`hub/test/policy/transport-heartbeat-tool.test.ts`~~ | **DROPPED v0.2 per C2 fold** | 0 |
| ~~`hub/test/e2e/e2e-foundation.test.ts` snapshot update~~ | **UNCHANGED v0.2 per C2 fold** | 0 |
| ~~`packages/network-adapter/src/kernel/transport-heartbeat.ts` (NEW)~~ | **DROPPED v0.2 per C2 fold** | 0 |
| ~~`packages/network-adapter/src/kernel/index.ts` — wire HB timer~~ | **DROPPED v0.2 per C2 fold** | 0 |
| ~~`packages/network-adapter/test/kernel/transport-heartbeat.test.ts` (NEW)~~ | **DROPPED v0.2 per C2 fold** | 0 |
| `hub/src/state.ts` (watchdog consumer-update per P2 concur tight-scope) | watchdog escalation-on-unresponsive update to use cognitiveState vs transportState differentiation (different remediation paths) | +25 / -10 |
| `hub/src/state.ts` (agent-projection consumer-update per P2 concur tight-scope) | agent-projection update for new fields surface in get_agents tool response | +15 |
| `scripts/local/get-agents.sh` | Column refactor (COG_TTL + TRANS_TTL replace LIVENESS_STATE; in-line buildTable update per MIN2 wording-fold) | +10 / -5 |
| `scripts/local/tpl/agents.jq` | Column projection update | +5 / -3 |
| `scripts/local/test-get-agents-cli.sh` | Smoke-test extension | +30 |
| `docs/missions/m-ttl-liveliness-design-preflight.md` | Phase 6 preflight | +120 |
| `docs/traces/m-ttl-liveliness-design-architect-trace.md` | Phase 8/9/10 work-trace | +200 |

**Total est.** ~1700 lines net addition (revised down from v0.1's ~2050; ~17% reduction per substrate-reuse). Single squash-merge PR (Option A; per round-1 P3 concur — Option A right after v0.2 resolves C1-C3).

**Net-new-substrate count comparison:**
- v0.1: 5 new liveness fields + 2 supporting timestamps + 1 new MCP tool = **8 net-new substrate items**
- v0.2: 4 new liveness fields + 0 supporting timestamps + 0 new MCP tools = **4 net-new substrate items** (50% reduction per architectural-tension signal greg flagged)

---

## §8 Anti-goals (carry from Survey envelope §5)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Don't redesign pulse mechanism itself (mission-68 closed; this mission CONSUMES pulses) | n/a — explicitly out-of-scope |
| AG-2 | Don't change adapter Transport-module surface (separation; transport stays plumbing) | n/a |
| AG-3 | Don't add new liveness-related fields beyond 5-field schema + activity-state preservation | future idea (TBD) |
| AG-4 | Don't migrate `livenessState` consumers wholesale in this mission's first PR (composite retained per Q1c; consumers update opportunistically) | M6 fold-pattern OR sequential PRs |
| AG-5 | Don't implement write-batching for eager TTL writes in this mission (forward-flag noted) | follow-on (TBD; trigger = scale event) |
| AG-6 | Don't add color/formatting/auto-detect to CLI render (raw-seconds numeric only) | follow-on (TBD; trigger = operator-UX surface) |
| AG-7 | Don't extend per-agent-pulse to Director role in this mission | future-canonical instance |
| AG-8 | Don't formalize Adapter-Kernel-vs-Transport-Module separation in methodology doc as part of this mission | future-canonical instance (when 2nd mission needs it) |

---

## §9 Architect-flags for round-1 audit (carry from Survey envelope §6)

| # | Flag | Architect-recommendation |
|---|---|---|
| F1 (CRITICAL) | Write-amplification at scale — eager TTL writes mean every transport HB + cognitive signal triggers Agent-record write | Per §5.1 + §3.2: ship eager-write v1; instrument; AG-5 anti-goal blocks batching. **Engineer-audit ask:** validate write-amp doesn't trip Agent-record contention or storage-provider throughput at current scale |
| F2 (MEDIUM) | Suppression-discipline correctness — agentPulse "skip if any active mission" edge cases (multi-engagement; completed mission lingering config) | Per §3.4 + §5.2: suppression rule = `mission.status === 'active' AND agent IN engineerId\|architectId`; multi-engagement = ANY active mission suppresses; completed don't. **Engineer-audit ask:** validate semantics; flag missed edges |
| F3 (MEDIUM) | Cognitive-stale threshold against engagement patterns — 60s may false-positive on long-thinking-no-tool-call | Per §3.5 + §5.3: ship 60s v1; instrument false-positive rate; raise to 120s in follow-on if needed. **Engineer-audit ask:** validate threshold; suggest empirical observation strategy |
| F4 (MINOR) | Composite derivation rules — edge case truth table | Per §3.1 + §5.4: conservative `unknown` rule when either component is unknown. **Engineer-audit ask:** validate truth table; flag missed edges |
| F5 (PROBE) | Per-agent pulse cadence specific number — Survey-deferred | Per §3.4 + §5.5: 60min default; configurable per Agent record. **Engineer-audit ask:** what cadence does engineer-substrate intuition support; 30/60/120min trade-off |

---

## §10 Cross-references

- **Survey envelope:** `docs/surveys/m-ttl-liveliness-design-survey.md` (commit `f68e23b`; Director-ratified 6 picks across 2 rounds)
- **Source idea:** idea-225 (status: triaged; will flip incorporated at mission-create)
- **Sister:** idea-224 / mission-68 (closed; pulse mechanism we consume per AG-1) + idea-216 (sibling concern; review at Phase 4 entry)
- **Pre-ratified macro-architecture:** Director-architect bilateral 2026-05-02 (transport HB owner + cognitive heartbeat composition + hybrid γ pulse architecture + cadence relationship + CLI surface mandate)
- **Validator readiness:** mission-74 PR #166 multi-pick fix (2026-05-04) — enables validate-envelope.sh to accept Q1=cd; Phase 3 finalize-gate clean post-fix
- **Methodology:** `docs/methodology/idea-survey.md` v1.0 (Survey methodology consumed; not modified per AG-9 carve-out from mission-69) + `docs/methodology/strategic-review.md` (Idea Triage Protocol; route-(a) skip-direct applied) + `docs/methodology/mission-lifecycle.md` v1.2 (Phase 4 Design entry methodology; substrate-introduction class)
- **Substrate to extend (paths corrected per round-1 M2 fold):**
  - `hub/src/state.ts` (types + AGENT_PULSE_KIND constant + touchAgent hook + watchdog/agent-projection consumer updates)
  - `hub/src/entities/agent-repository.ts` (Agent record schema; 4 NEW fields persistence)
  - `hub/src/policy/pulse-sweeper.ts` (agentPulse second iteration pass)
  - `hub/src/policy/pending-action-policy.ts` (refreshHeartbeat post-bump hook)
  - `hub/src/policy/message-policy.ts` (agentPulse-ack hook)
  - ~~`packages/network-adapter/src/kernel/`~~ (DROPPED v0.2 per C2 fold; existing poll-backstop unchanged)
  - `scripts/local/get-agents.sh` + `scripts/local/tpl/agents.jq` (CLI column refactor)
- **Compressed-lifecycle precedent:** mission-67/68/69 substrate-introduction + mission-70/72/73/74 small-mission cleanup-wave precedents
- **Memory references:**
  - `reference_prism_table_pattern.md` — informed §3.6 CLI column projection
  - `feedback_schema_rename_requires_state_migration.md` — informed Q2 migration NOT applying (additive not rename)
  - `feedback_compressed_lifecycle_preflight_currency_checks.md` — applies at Phase 6 preflight
  - `feedback_design_phase_lib_extraction_for_substrate_bash.md` — applies if Adapter Kernel transport-HB warrants lib-extraction at Design phase (testability)

---

## §11 Round-1 audit fold summary (NEW v0.2; per mission-67/68/69/71 round-2 verify discipline)

Engineer round-1 audit (greg; thread-472 round-1; 2026-05-05). **13 findings total: 3 CRITICAL + 4 MEDIUM + 2 MINOR + 4 PROBE concur.** Architect fold-decisions:

| Finding | Class | Architect fold-decision | v0.2 § |
|---|---|---|---|
| C1 | enum-domain mismatch (schema-rename without migration); `livenessState` is 4-state ADR-017 FSM, not 3-state | **FOLDED** — option (a): preserve existing 4-state composite UNTOUCHED; new component fields use non-conflicting names `cognitiveState` + `transportState` (was `cognitiveLivenessState`/`transportLivenessState`) | §0.5 + §3.1 |
| C2 | `transport_heartbeat` proposed tool duplicates existing `drain_pending_actions` HB mechanism | **FOLDED** — option (a): drop new MCP tool; document drain as transport-HB primitive; reuse poll-backstop cadence | §0.5 + §3.3 (rewritten) |
| C3 | existing 2-signal model (`lastSeenAt` + `lastHeartbeatAt`) not referenced; net-new timestamps create parallel-bookkeeping | **FOLDED** — option (a): reuse existing fields; derive cognitiveTTL from `lastSeenAt`, transportTTL from `lastHeartbeatAt`; 0 new timestamps; schema delta drops 7→4 fields | §0.5 + §3.1 + §3.2 |
| M1 | agentPulse line estimate optimistic; PULSE_KEYS substrate has 6-file references; second iteration pass needed | **FOLDED** — line estimate revised +30 → +80-120; explicit second iteration pass; AGENT_PULSE_KIND stays SEPARATE from PULSE_KEYS | §3.4 |
| M2 | path mismatches in §10 cross-references (entities/agent.ts, services/agent-store.ts, services/pulse-sweeper.ts) | **FOLDED** — corrected to entities/agent-repository.ts + state.ts + policy/pulse-sweeper.ts; consolidated agent-store into agent-repository | §3.4 + §6.1 + §7.3 + §10 |
| M3 | F2 suppression edge — per-mission pulses-config asymmetry (mission with architect-only pulses + engineer assigned but silent) | **FOLDED** — strict rule preferred + explicit rejection of permissive alternative; rationale documented | §3.4 (suppression-discipline section) |
| M4 | F3 cognitive-stale 60s threshold collides with existing PEER_PRESENCE_WINDOW_MS = 60s | **FOLDED** — collapse to existing PEER_PRESENCE_WINDOW_MS invariant; `cognitivelyStale = !isPeerPresent(agent)`; 1 invariant not 2 | §3.5 (rewritten) |
| MIN1 | F4 truth-table registration-instant edge: `claim_session` bumps `lastHeartbeatAt` → `(unknown cognitive, alive transport)` is steady-state-just-after-registration | **FOLDED** — truth table explicit on registration-instant edge; `(unknown, alive)` documented as naturally-pending | §3.1 truth-table + §5.4 |
| MIN2 | §3.6 CLI prism.sh wording sounds like file-copy (memory ref is conceptual not substrate-import) | **FOLDED** — wording clarified to "tpl/agents.jq projection update + buildTable column-header refresh"; dropped "prism.sh + buildTable + tpl/.jq pattern preserved" framing | §3.6 |
| P1 | F5 cadence intuition — 60min default right; 30min chatty; 120min too slow | **CONCUR** — 60min default; configurable per-agent at registration | §3.4 |
| P2 | §4 consumer-update opportunism — tight scope to watchdog + agent-projection only (out of 6 consumers) | **CONCUR** — watchdog + agent-projection updated in same PR; other 4 consumers stay on composite | §4 |
| P3 | §7 PR sequencing — Option A right pick AFTER v0.2 resolves C1/C2/C3 | **CONCUR** — Option A confirmed v0.2; intermediate-state risk eliminated by C1+C2+C3 folds | §7 |
| P4 | F1 write-amp at current scale fine; OCC handles contention; forward-flag for scale-out | **CONCUR** — eager-write v1; AG-5 anti-goal blocks batching this mission; forward-flag noted | §3.2 + §5.1 |

**NEW §0.5 introduced:** Existing infrastructure inventory (closes prior-substrate-elision class structurally; methodology-fold candidate per mission-73 audit-rubric §3d pattern — sister to "memory-tier-to-methodology-tier graduation" + "validator-mechanism-tier-to-methodology-conformance graduation" → "architect-design-prior-substrate-elision" graduation; future-canonical instance triggers methodology-fold mission).

**Architectural impact:** v0.1 → v0.2 reduces substrate footprint by 50% (8 → 4 net-new substrate items). Composite `livenessState` 4-state FSM untouched; transport-HB reuses existing primitive; cognitive-staleness reuses existing invariant.

**Verdict:** all 3 CRITICALs resolved + 4/4 MEDIUMs folded + 2/2 MINORs folded + 4/4 PROBEs concur. v0.2 ready for round-2 verify on thread-472.

Round-2 verify expectation: greg confirms folds correct (especially CRITICAL resolutions C1+C2+C3 architectural reshapings + §0.5 inventory completeness) + no new findings → ratify v0.2 as v1.0 → Phase 6 preflight entry.

---

— Architect: lily / 2026-05-05 (Phase 4 Design v0.2; engineer round-1 audit folded — 13 findings: 3 CRITICAL + 4 MEDIUM + 2 MINOR + 4 PROBE concur; pending engineer round-2 verify per `mission-lifecycle.md` Phase 4 audit cycle)
