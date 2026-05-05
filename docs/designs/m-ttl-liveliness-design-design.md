# M-TTL-Liveliness-Design — Design v1.0

**Status:** v1.0 RATIFIED (architect-finalised 2026-05-05; engineer round-1 + round-2 + round-3 audits folded; greg ratified v0.3 → v1.0 at thread-472 round-10; v1.0 ratification commit folds 5 Director-walk-through items: §3.3 adapter-internal-tool tier discipline + field-name corrections (COG_TTL → COGNITIVE_TTL etc.) + §5.2 STRICT/PERMISSIVE wording fix + env-ification with per-agent `livenessConfig` override (Director Declarative-Primacy framing; idea-242 captures broader Vision) + scripts/local/mod.core extraction (Director CLI consolidation ask; idea-243 captures systemic follow-on). Full multi-round fold summary §11; ready for Phase 6 preflight entry per `mission-lifecycle.md`.)
**Methodology:** Phase 4 Design per `mission-lifecycle.md` v1.2 §1 (RACI: C=Director / R=Architect+Engineer)
**Survey envelope:** `docs/surveys/m-ttl-liveliness-design-survey.md` v1.0 (Director-ratified 6 picks; commit `f68e23b`)
**Source idea:** idea-225 (status `triaged` via route-(a) skip-direct)
**Companion:** idea-224 / mission-68 (closed; pulse mechanism we consume per AG-1) + idea-216 (sibling concern; reviewed Phase 4 entry — unrelated to this Vision)
**Downstream Visions surfaced during Director walk-through (2026-05-05):** idea-239 (rolePulse vocabulary consolidation; AG-1/AG-7 follow-on), idea-240 (agnostic-transport Vision; AG-2 follow-on), idea-241 (WebSocket constituent of idea-240), idea-242 (declarative-config-as-entities; mission-225 env-vars + per-agent override are interim under this Vision), idea-243 (systemic mod.core consolidation across operator CLIs)
**Branch:** `agent-lily/m-ttl-liveliness-design` (Survey envelope committed `f68e23b`; this Design v0.1 + retrofit + Phase 8 implementation cumulative)
**Director-pre-ratified macro-architecture:** transport heartbeat owned by Adapter Kernel (NOT Transport module); periodic Client→Hub; Hub-side TTL count. Cognitive heartbeat = composite freshness across {pulse-response, tool-call, thread-reply, message-ack}. Hybrid (γ) pulse architecture (mission pulses + per-agent pulse).

---

## §0 Document orientation

Substrate-introduction mission spanning multi-substrate scope. NOT a compressed-lifecycle candidate per envelope §7.3 — bilateral round-1 audit warranted (engineer cross-check on schema decomposition + write-amplification + suppression discipline + cadence threshold).

Reading order:
- §0.5 Existing infrastructure inventory (load-bearing per round-1 audit C1-C3; v0.3 polish per round-2 §0.5 completeness — 3 additional rows for `applyLivenessRecompute`, `isPeerPresent`, `activityState` auto-clamp)
- §1 Mission scope summary (Survey envelope §3 + §4 reference)
- §2 Architecture overview (3-layer composition; revised v0.3 per round-2 R1 — diagram updated to v0.3 reality with poll-backstop 30s heartbeat timer + transport_heartbeat MCP tool re-introduced per N1)
- §3 Component designs:
  - §3.1 Hub schema delta (4 NEW fields; 4-state composite preserved per round-1 C1 fold)
  - §3.2 Hub-side TTL computation (reuse lastSeenAt + lastHeartbeatAt per round-1 C3 fold; eager write-on-event; v0.3 adds applyLivenessRecompute interaction note per round-2 §0.5 polish)
  - §3.3 Transport heartbeat = poll-backstop 30s heartbeat timer + new `transport_heartbeat` MCP tool (rewritten v0.3 per round-2 N1 fold; v1.0 fold adds adapter-internal-tool tier discipline — `transport_heartbeat` MUST be excluded from LLM-exposed tool surface via shim-side `list_tools` filter consuming PolicyRouter `tier: "adapter-internal"` annotation; idea-240 Vision makes this filter structurally unnecessary later)
  - §3.4 PulseSweeper extension (per-agent pulse via NULL mission binding; revised line estimate per round-1 M1 fold; v1.0 fold notes `pulseConfig` is the canonical pattern that `livenessConfig` per-agent override generalises)
  - §3.5 Cognitive-staleness collapses to PEER_PRESENCE_WINDOW_MS (per round-1 M4 fold; 1 invariant not 2; v1.0 fold env-tunable + per-agent overridable closes F3 mitigation in this mission per Director Declarative-Primacy framing)
  - §3.6 CLI surface refactor (`get-agents.sh`; v1.0 fold extracts `buildTable()` into NEW `scripts/local/mod.core` per Director CLI consolidation ask + `feedback_design_phase_lib_extraction_for_substrate_bash.md` discipline)
- §4 Migration sequencing (big-bang single-PR; tight consumer-update scope per round-1 P2 concur; v0.3 single-PR adds list updated per round-2 R2)
- §5 Edge cases + failure modes (F1-F5 from envelope architect-flags; v0.3 §5.2 cross-references §3.4 M3 resolution per round-2 R5)
- §6 Test / verification strategy (v0.3 transport_heartbeat tool tests re-added per N1; verification gates updated per round-2 R3)
- §7 PR sequencing + content map (path corrections per round-1 M2 fold; v0.3 content map updated per N1 substrate addition)
- §8 Anti-goals (carry from envelope §5)
- §9 Architect-flags status (each marked addressed/deferred for round-3 verify; v0.3 F4 reframe to component-state truth table per round-2 R4)
- §10 Cross-references (path corrections per round-1 M2 fold)
- §11 Multi-round audit fold summary (v1.0 — round-1 + round-2 + round-3 + v1.0 Director-walk-through ratification folds; honest accounting of substrate-footprint reduction)

---

## §0.5 Existing infrastructure inventory (NEW v0.2; load-bearing; v0.3 polish — 3 added rows + drain/poll-backstop decisions corrected per N1 substrate-reality fold; v1.0 fold — env-ification + per-agent override sub-object + mod.core extraction)

Round-1 audit C1/C2/C3 shared-root-cause: **prior-substrate-elision** in v0.1 — Design didn't reference existing infrastructure that this mission overlaps with. v0.2 grounds explicitly via inventory; reuse-vs-replace decisions become explicit per-primitive. **v0.3 update:** round-2 N1 substrate-reality fold corrects the v0.2 `drain_pending_actions` reuse claim (drain is queue-driven, not periodic — see §3.3); 3 polish rows added per round-2 §0.5 completeness audit. **v1.0 update (Director walk-through 2026-05-05):** PEER_PRESENCE_WINDOW_MS + AGENT_TOUCH_MIN_INTERVAL_MS env-ified (defaults match current values; backward-compatible); NEW agent.livenessConfig sub-object for per-agent override (interim under idea-242 Vision); buildTable() extracted from get-agents.sh into NEW scripts/local/mod.core (interim under idea-243 systemic follow-on per `feedback_design_phase_lib_extraction_for_substrate_bash.md` discipline).

| Substrate primitive | Source-of-truth location | Reuse-vs-replace decision (v1.0) |
|---|---|---|
| `livenessState` 4-state enum `{online, degraded, unresponsive, offline}` | `hub/src/state.ts:198` | **REUSE UNCHANGED** (per C1 fold option (a)) — ADR-017 FSM untouched; sticky-offline + degraded-as-intermediate semantics preserved |
| ADR-017 liveness FSM (online → degraded → unresponsive → offline transitions) | (referenced via state.ts) | **REUSE UNCHANGED** — drives Agent-record liveness; load-bearing for routing + escalation |
| `applyLivenessRecompute()` (existing FSM transition function) | `hub/src/state.ts` (referenced by ADR-017 FSM) | **REUSE UNCHANGED** (NEW polish v0.3) — composite `livenessState` transitions continue via this function; v0.3 component-state hooks (`recomputeCognitiveTTLAndState` + `recomputeTransportTTLAndState`) are PARALLEL to applyLivenessRecompute, NOT replacements; no call-site changes required for FSM transitions |
| `lastSeenAt` field | `hub/src/state.ts` | **REUSE** as cognitive-touch primitive; v0.2 derives `cognitiveTTL = now - lastSeenAt` |
| `touchAgent` (updates lastSeenAt; called from tool-call entry) | `hub/src/state.ts` (line ~1245) | **REUSE UNCHANGED** — already wired across all tool-call sites |
| `AGENT_TOUCH_MIN_INTERVAL_MS = 30_000` (rate-limit on touchAgent) | `hub/src/agent-repository.ts:172` | **ENV-IFY** (v1.0 fold per Director Declarative-Primacy framing) — default = current 30_000 (backward-compatible); env var `AGENT_TOUCH_MIN_INTERVAL_MS`; per-agent override via `agent.livenessConfig.agentTouchMinIntervalMs?` |
| `lastHeartbeatAt` field | `hub/src/state.ts:250` | **REUSE** as transport-HB primitive; v0.2 derives `transportTTL = now - lastHeartbeatAt` |
| `drain_pending_actions` MCP tool (existing) | `hub/src/policy/pending-action-policy.ts:42` | **REUSE UNCHANGED** (v0.3 corrects v0.2 claim per N1 fold) — drain remains queue-driven; NOT a transport-HB primitive (queue-driven cadence ≠ periodic). v0.3 introduces NEW `transport_heartbeat` tool driven from poll-backstop substrate per N1 |
| `refreshHeartbeat(agent.id)` (Hub-side handler called on every drain) | `hub/src/policy/pending-action-policy.ts:42` | **REUSE UNCHANGED** — also invoked by NEW `transport_heartbeat` tool handler in v0.3; drives `lastHeartbeatAt` updates |
| `isPeerPresent(agent)` helper (existing 60s-window check) | `hub/src/agent-repository.ts:179` | **REUSE UNCHANGED** (NEW polish v0.3) — load-bearing helper for `cognitivelyStale = !isPeerPresent(agent)` collapse per M4 fold; computes `(now - lastSeenAt) < PEER_PRESENCE_WINDOW_MS`; consumers (e.g., orchestrator routing decisions) continue using helper unchanged |
| `PEER_PRESENCE_WINDOW_MS = 60_000` ("agent active in last 60s" check) | `hub/src/agent-repository.ts:179` | **REUSE AS COGNITIVE-STALE THRESHOLD + ENV-IFY** (per M4 fold + v1.0 fold) — `cognitivelyStale = !isPeerPresent(agent)` collapses 60s threshold into existing invariant; net win = 1 invariant not 2. v1.0 env-ifies (default = current 60_000; backward-compatible); env var `PEER_PRESENCE_WINDOW_MS`; per-agent override via `agent.livenessConfig.peerPresenceWindowMs?` — closes F3 mitigation strategy structurally (env tune + per-agent override; no code change needed) |
| `agent.livenessConfig` sub-object (NEW v1.0 fold) | `hub/src/state.ts` (Agent record schema extension) | **NEW** — optional per-agent override sub-object with optional fields: `peerPresenceWindowMs?`, `agentTouchMinIntervalMs?`, `transportHeartbeatIntervalMs?`, `transportHeartbeatEnabled?`. Analogous shape to existing per-agent `pulseConfig` sub-object (§3.4). Resolution at consumption-site via `resolveLivenessConfig()` helper: agent-override → env var → built-in fallback |
| `resolveLivenessConfig()` helper (NEW v1.0 fold) | `hub/src/state.ts` (consumption-site helper) | **NEW** — generic accessor for liveness-tuning fields with precedence chain (agent.livenessConfig.X ?? readEnvAs(field) ?? builtinDefault). Single canonical resolution helper consumed by §3.2 hooks + §3.3 heartbeat handler + watchdog escalation logic |
| `transport_heartbeat` MCP tool tier annotation (NEW v1.0 fold) | `hub/src/policy/router.ts` (registration metadata) | **NEW** — `tier: "adapter-internal"` annotation at PolicyRouter registration; consumed by shim-side `list_tools` filter (excludes adapter-internal tools from LLM-exposed catalogue). Interim solution; idea-240 Vision (agnostic-transport) makes this filter structurally unnecessary |
| `scripts/local/mod.core` (NEW v1.0 fold) | `scripts/local/mod.core` | **NEW** — sourceable bash module hosting `buildTable()` extracted from get-agents.sh; first canonical instance of the lib-extraction pattern per `feedback_design_phase_lib_extraction_for_substrate_bash.md` discipline; idea-243 Vision is systemic follow-on (migrate all operator CLIs to source mod.core) |
| Adapter Kernel poll-backstop | `packages/network-adapter/src/kernel/poll-backstop.ts` (DEFAULT_CADENCE_SECONDS = 300) | **EXTEND** (v0.3 corrects v0.2 claim per N1 fold) — existing 300s message-poll timer (calls `list_messages`) UNCHANGED; v0.3 adds NEW 30s heartbeat timer (calls `transport_heartbeat`) alongside; two-timer poll-backstop. NOT a new Adapter Kernel timer |
| `PULSE_KEYS = ["engineerPulse", "architectPulse"]` | `hub/src/policy/pulse-sweeper.ts` (or related) | **EXTEND CAREFULLY** (per M1 fold) — agentPulse stays SEPARATE from PULSE_KEYS as new constant `AGENT_PULSE_KIND`; cannot join PULSE_KEYS without breaking `mission.pulses[pulseKey]` invariant in 6-file references |
| `pulse-sweeper.ts` (mission-driven iteration) | `hub/src/policy/pulse-sweeper.ts` (NOT services/) | **EXTEND** with second iteration pass (iterate-agents-not-missions); explicit second pass per M1 fold |
| `agent-repository.ts` (Agent record persistence + OCC `putIfMatch`) | `hub/src/entities/agent-repository.ts` | **EXTEND** — Agent record gains 4 new fields; OCC handles concurrent-write contention safely (per P4 concur) |
| `activityState` (existing per mission-62; auto-clamp behaviour) | `hub/src/state.ts` (mission-62 substrate) | **REUSE UNCHANGED** (NEW polish v0.3) — orthogonal to liveness component states; auto-clamp behaviour preserved per mission-62 (`activityState` represents engagement-side concept, distinct from cognitive/transport TTL freshness). KEPT as separate column in CLI per Q6=a; NOT folded into cognitive/transport state |
| `tpl/agents.jq` (jq projection for agents column rendering) | `scripts/local/tpl/agents.jq` | **EXTEND** — column projection update for COGNITIVE_TTL + TRANSPORT_TTL (v1.0 field-name correction; full-form deterministic camelCase ↔ SNAKE_CASE round-trip); replace LIVENESS_STATE column |
| `scripts/local/get-agents.sh` (CLI with in-line `buildTable()` function) | `scripts/local/get-agents.sh` | **EXTEND + REFACTOR** (v1.0 fold) — column-header update; **`buildTable()` extracted to NEW `scripts/local/mod.core`** per Director CLI consolidation ask; get-agents.sh `source mod.core` + invoke extracted function. NOT swapping prism.sh (per MIN2 wording-fold) |

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

Three-layer composition (v0.3 — diagram updated per round-2 R1 to reflect v0.3 mechanism: poll-backstop substrate hosts the 30s heartbeat timer; existing tool-call sites bump lastSeenAt; no new Adapter Kernel timer):

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: Network-adapter substrate (packages/network-adapter/src)       │
│                                                                          │
│   poll-backstop.ts (EXISTING; EXTENDED v0.3):                            │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ Existing 300s message-poll timer (UNCHANGED):                     │ │
│   │   calls Hub `list_messages` MCP tool                              │ │
│   │                                                                    │ │
│   │ NEW v0.3 30s heartbeat timer:                                     │ │
│   │   calls Hub `transport_heartbeat` MCP tool (NEW)                  │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│   (Two-timer poll-backstop; v0.3 NOT a new Adapter Kernel timer per N1) │
└─────────────────────────────────────────────────────────────────────────┘
                              │ (30s heartbeat)             │ (cognitive signals)
                              ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: Hub-side state computation (hub/src)                           │
│                                                                          │
│  Two existing primitives + 1 new tool handler bump cadence-source        │
│  timestamps; eager TTL/state recomputation hooked alongside (v0.2):      │
│                                                                          │
│  Transport-HB path (v0.3 N1 fold):                                       │
│    1. NEW `transport_heartbeat` tool handler invokes refreshHeartbeat()  │
│       (existing function; updates lastHeartbeatAt; rate-limit per spec)  │
│    2. Eager hook: recomputeTransportTTLAndState(agentId)                 │
│         transportTTL = now - lastHeartbeatAt                             │
│         transportState = TTL >= 60s ? unresponsive : alive               │
│    3. Atomic OCC write (putIfMatch) to Agent record (transport fields)   │
│                                                                          │
│  Cognitive-touch path (existing primitives; UNCHANGED):                  │
│    1. touchAgent(agentId) on tool-call entry → lastSeenAt update         │
│       (rate-limited 30s per AGENT_TOUCH_MIN_INTERVAL_MS)                 │
│    2. Eager hook: recomputeCognitiveTTLAndState(agentId)                 │
│         cognitiveTTL = now - lastSeenAt                                  │
│         cognitiveState = TTL >= PEER_PRESENCE_WINDOW_MS/1000             │
│           ? unresponsive : alive                                         │
│    3. Atomic OCC write (putIfMatch) to Agent record (cognitive fields)   │
│                                                                          │
│  Composite livenessState (existing 4-state ADR-017 FSM): UNTOUCHED.      │
│  cognitiveState + transportState are PARALLEL observability surfaces;    │
│  not derivation inputs to composite livenessState.                       │
│                                                                          │
│  PulseSweeper extension (per Q3=c reuse + NULL mission binding):         │
│    - Second iteration pass (iterate-agents-not-missions; AGENT_PULSE_KIND)│
│    - 60min default cadence; per-agent override allowed                   │
│    - Suppression: skip if agent on any active mission                    │
│    - Per-agent pulse provides death-detection signal between missions    │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: CLI surface (scripts/local/get-agents.sh + tpl/agents.jq)      │
│                                                                          │
│  get-agents.sh columns refactored:                                       │
│    REMOVED: LIVENESS_STATE                                               │
│    ADDED:   COGNITIVE_TTL  (cognitiveTTL raw seconds)                    │
│    ADDED:   TRANSPORT_TTL  (transportTTL raw seconds)                    │
│    KEPT:    ACTIVITY_STATE (orthogonal concept)                          │
│                                                                          │
│  Pipe-friendly numeric output (raw seconds; per Q6=a; in-line buildTable │
│  preserved per MIN2 wording-fold; NOT swapping to prism.sh)              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Net-new substrate items (v0.3; honest accounting per round-2 N1 fold):**
1. `cognitiveTTL` field (Agent record)
2. `transportTTL` field (Agent record)
3. `cognitiveState` field (Agent record)
4. `transportState` field (Agent record)
5. `transport_heartbeat` MCP tool (Hub PolicyRouter; driven from poll-backstop substrate; NOT a new Adapter Kernel timer)

(38% reduction from v0.1's 8 net-new items; v0.2's claimed 50% reduction was incorrect — see §11 multi-round fold summary.)

---

## §3 Component designs

### §3.1 Hub schema delta (4 NEW fields + 1 livenessConfig sub-object per v1.0 fold; 4-state composite preserved per round-1 C1 fold)

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
| `livenessConfig` (NEW v1.0 fold; per-agent override sub-object) | optional `AgentLivenessConfig` sub-object (see schema below) | Persisted (sparse — only populated when overrides are set) | n/a (configuration data, not derived) | **NEW v1.0** |

**`AgentLivenessConfig` sub-object schema (v1.0 fold; analogous to existing `pulseConfig` per-agent sub-object pattern from §3.4):**

```typescript
interface AgentLivenessConfig {
  peerPresenceWindowMs?: number;       // optional override; defaults to env var PEER_PRESENCE_WINDOW_MS
  agentTouchMinIntervalMs?: number;    // optional override; defaults to env var AGENT_TOUCH_MIN_INTERVAL_MS
  transportHeartbeatIntervalMs?: number;  // optional override; defaults to env var TRANSPORT_HEARTBEAT_INTERVAL_MS
  transportHeartbeatEnabled?: boolean;  // optional override; defaults to env var TRANSPORT_HEARTBEAT_ENABLED
}
```

All fields optional. Resolution at consumption-site via `resolveLivenessConfig(agent, field, builtinDefault)` helper (precedence: agent.livenessConfig.X → env var → builtin fallback). Per Director Declarative-Primacy framing — interim under idea-242 Vision (declarative config-as-entities; env vars deprecate to declarative LivenessConfig entity later).

**Net schema delta:** 4 NEW fields + 1 NEW sub-object (cognitiveTTL + transportTTL + cognitiveState + transportState + livenessConfig). 0 NEW supporting timestamps (reuse existing `lastSeenAt` + `lastHeartbeatAt` per C3 fold). Down from v0.1's 7 NEW fields (5 + 2 supporting).

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

function deriveStateFromTTL(agent: Agent, ttl: number | null): ComponentState {
  if (ttl === null) return 'unknown';
  // M4 fold: collapse to existing PEER_PRESENCE_WINDOW_MS = 60_000
  // v1.0 fold: per-agent override via agent.livenessConfig.peerPresenceWindowMs
  const windowMs = resolveLivenessConfig(agent, 'peerPresenceWindowMs', 60_000);
  return ttl >= (windowMs / 1000) ? 'unresponsive' : 'alive';
}

// NEW v1.0 fold: liveness config resolution helper (precedence chain)
function resolveLivenessConfig<K extends keyof AgentLivenessConfig>(
  agent: Agent,
  field: K,
  builtinDefault: NonNullable<AgentLivenessConfig[K]>
): NonNullable<AgentLivenessConfig[K]> {
  return agent.livenessConfig?.[field]
    ?? readEnvAs(field)
    ?? builtinDefault;
}
```

**Constants — env-ified per v1.0 fold (Director Declarative-Primacy framing; idea-242 captures broader Vision):**
- `PEER_PRESENCE_WINDOW_MS` env var — default 60_000 (backward-compatible); per-agent override via `agent.livenessConfig.peerPresenceWindowMs?`. Closes F3 mitigation strategy structurally (env tune + per-agent override; no code change required)
- `AGENT_TOUCH_MIN_INTERVAL_MS` env var — default 30_000 (backward-compatible); per-agent override via `agent.livenessConfig.agentTouchMinIntervalMs?`. Cognitive-cadence rate-limit; sub-window of 60s threshold; aligns with engagement patterns
- Both existing constants migrate from hardcoded to `resolveLivenessConfig()` reads at consumption-sites (`hub/src/agent-repository.ts:172` + `hub/src/agent-repository.ts:179`)

**Sweeper concern:** TTL values stored on Agent record become stale between writes (since they're computed at write-time). Per F1 audit-flag write-amplification: ~7 writes/min/agent under engagement is acceptable per round-1 P4 concur (AgentRepository OCC `putIfMatch` handles concurrent-write contention safely; storage-provider write-throughput limits not approached at current scale of 2 agents). Reads return cached values which may be up to AGENT_TOUCH_MIN_INTERVAL_MS=30s stale on the cognitive side (negligible relative to 60s threshold).

**Read-time precision:** consumers needing freshness-precision can optionally recompute on-demand: `freshTTL = now() - agent.lastSeenAt`. Default reads use cached values. PolicyRouter routing decisions + escalation triggers consume cached values (sub-second precision not required for routing decisions).

**Architect-flag F1 (audit):** at scale-out (10+ agents under sub-second cognitive activity), eager-write path may need batching. Phase 4 Design notes this as forward-flag per AG-5; v1 ships eager-write-on-event hooks. P4 concur from greg confirms current-scale headroom.

### §3.3 Transport heartbeat = poll-backstop 30s timer + new `transport_heartbeat` MCP tool (v0.3 N1 fold; partial C2 revert)

**v0.2 → v0.3 architectural change (per round-2 N1 substrate-reality fold):**

v0.2 proposed reusing `drain_pending_actions` as the transport-HB primitive. **Round-2 audit caught the substrate-reality gap:** `drain_pending_actions` is **queue-driven, NOT periodic** — it fires only when the adapter has pending actions to claim (per `pending-action-policy.ts`). Adapter Kernel's poll-backstop default cadence is 300s (per `packages/network-adapter/src/kernel/poll-backstop.ts:37` `DEFAULT_CADENCE_SECONDS = 300`); it calls `list_messages` (NOT drain). `list_messages` does NOT currently invoke `refreshHeartbeat()`. So idle agents (no pending actions queued) would have `lastHeartbeatAt` aging monotonically + `transportState` falsely flipping to unresponsive after 60s.

PEER_PRESENCE_WINDOW_MS = 60_000 doesn't absorb 300s+ cadence variance. The C2 critique's "duplicates drain" framing was wrong — drain isn't periodic; v0.3 partial revert fills the periodic gap WITHOUT a new Adapter Kernel timer.

**v0.3 mechanism (option (c) per round-2 N1 fold):**

- **NEW MCP tool `transport_heartbeat`** registered on Hub PolicyRouter (lightweight; no payload; just the call counts as the heartbeat); Hub-side handler invokes existing `refreshHeartbeat(agent.id)` to bump `lastHeartbeatAt`
- **Poll-backstop substrate** (existing; `packages/network-adapter/src/kernel/poll-backstop.ts`) extended with second timer alongside existing 300s message-poll timer:
  - Existing 300s message-poll timer: UNCHANGED (calls `list_messages`)
  - NEW 30s heartbeat timer: invokes `transport_heartbeat` MCP tool
- **NOT a new Adapter Kernel timer** — preserves C2 directional intent (no new Adapter Kernel timer); the new timer lives in poll-backstop substrate (network-adapter package)

**Net effect vs v0.1 + v0.2:**

| Dimension | v0.1 | v0.2 | v0.3 |
|---|---|---|---|
| New MCP tools | 1 (`transport_heartbeat`; new tool) | 0 (claimed reuse drain) | **1** (`transport_heartbeat`; via poll-backstop) |
| New Adapter Kernel timer | 1 | 0 | **0** (poll-backstop substrate, NOT Adapter Kernel) |
| Periodic transport-HB function | yes (Adapter Kernel timer) | **NO (substrate-reality gap)** | yes (poll-backstop 30s timer) |
| Net-new substrate items | 8 | 4 | **5** |

**Honest accounting:** v0.3 substrate-footprint = 5 net-new items (38% reduction from v0.1's 8). v0.2's claimed 50% reduction was incorrect — the C2 fold's "drain reuses existing" claim didn't actually deliver periodic transport-HB. v0.3 is the honest endpoint.

**Cadence configuration:**
- Heartbeat timer cadence: 30s (Director-ratified Q4=b; matches transport-HB threshold derivation)
- Message-poll timer cadence: 300s (existing; UNCHANGED; per poll-backstop's existing anti-pattern guard "poll cadence MUST be measurably longer than push latency")
- Two timers in poll-backstop; clean separation of concerns (cadence-vs-poll vs cadence-vs-heartbeat)

**Configuration env vars (NEW in v0.3; v1.0 fold extends with per-agent override):**
- `TRANSPORT_HEARTBEAT_INTERVAL_MS = 30_000` (default 30s; configurable for test environments; minimum 10_000); per-agent override via `agent.livenessConfig.transportHeartbeatIntervalMs?`
- `TRANSPORT_HEARTBEAT_ENABLED = true` (default; can disable for test scenarios); per-agent override via `agent.livenessConfig.transportHeartbeatEnabled?`
- v1.0 fold: poll-backstop heartbeat timer reads via `resolveLivenessConfig(agent, 'transportHeartbeatIntervalMs', 30_000)` precedence chain

**MCP tool registration (v1.0 fold adds tier discipline; idea-240 Vision makes structurally unnecessary later):**
- New tool: `transport_heartbeat` registered on Hub PolicyRouter
- **PolicyRouter snapshot test (mission-72 invariant):** sorted-tool-name list updated with new entry; absorbs cleanly per mission-72 pattern (no count assertion to bump)
- Per-mission permission: implicit (any registered agent can call it for self)
- **NEW v1.0 fold — Tier annotation:** `tier: "adapter-internal"` annotation at PolicyRouter registration. Consumed by shim-side `list_tools` filter (excludes adapter-internal tools from LLM-exposed catalogue). Rationale: `transport_heartbeat` is invoked by adapter substrate code (poll-backstop's 30s timer) — NOT meant for LLM consumption. Without this tier annotation, the tool would appear in the LLM's tool catalogue, which is wrong (LLM has no business calling it; its purpose is mechanical adapter↔Hub liveness signalling).

**Tool-tier separation discipline (NEW v1.0 fold):**

Today's substrate has no formal distinction between adapter-internal MCP tools (e.g., `drain_pending_actions`, `claim_session`, `register_role`, `list_messages`, NEW `transport_heartbeat`) and LLM-callable MCP tools. All Hub-registered tools are returned by `list_tools` and surfaced by shim to the LLM. v1.0 fold introduces:
- **Hub side:** PolicyRouter registration accepts optional `tier` field (`"adapter-internal" | "llm-callable"`; default `"llm-callable"` for backward-compat — only NEW `transport_heartbeat` carries `"adapter-internal"` in this mission)
- **Shim side:** `list_tools` consumer filters out `adapter-internal`-tier tools before surfacing to LLM
- **Hub remains passive about LLM-surface** — Hub annotates; shim filters. Matches today's pull-discovery model
- **Interim status:** idea-240 Vision (agnostic-transport Adapter↔Hub) makes this filter structurally unnecessary by changing the wire format (adapter-internal tools become RPC methods that have no MCP-tool surface to begin with). v1.0 ships the shim-side filter as the in-mission solution

**Phase 8 implementation hook:** PolicyRouter registration call for `transport_heartbeat` includes `tier: "adapter-internal"`; shim's tool-surface filter (in adapter package) reads tier annotation; `list_tools` response post-filter excludes adapter-internal tools.

**Handler hook discipline — `transport_heartbeat` MUST bypass `touchAgent` (NEW v0.3; load-bearing for cognitive-vs-transport semantic separation):**

The Hub-side `transport_heartbeat` handler invokes `refreshHeartbeat(agent.id)` to bump `lastHeartbeatAt` ONLY. It MUST NOT invoke `touchAgent(agent.id)` (which would bump `lastSeenAt`). Rationale: if the heartbeat goes through the standard MCP-tool-dispatcher path that calls `touchAgent` on every tool-call entry, `lastSeenAt` gets bumped on every 30s heartbeat → `cognitiveState` becomes effectively `transportState` (loses the load-bearing semantic distinction between "adapter polling" and "LLM doing meaningful work").

**Implementation hook:** Phase 8 implementation requires either:
- (i) **AGENT_TOUCH_BYPASS_TOOLS allow-list approach:** new constant `AGENT_TOUCH_BYPASS_TOOLS = {"transport_heartbeat"}` consulted by tool-dispatcher entry; tools in this set skip `touchAgent` invocation. Extensible if future heartbeat-class tools are added (e.g., a future `cognitive_pulse_ack` tool may want the inverse — bump `lastSeenAt` only).
- (ii) **Direct handler bypass:** `transport_heartbeat` handler registered via a code path that never traverses the standard `touchAgent`-invoking dispatcher entry. Less extensible but smaller surgical surface.

Phase 8 architect-recommendation: prefer (i) for extensibility; engineer-substrate judgment at implementation time. **Critical invariant:** `cognitiveState=alive` MUST require a tool-call OTHER than `transport_heartbeat` within PEER_PRESENCE_WINDOW_MS — i.e., LLM doing meaningful work. `transport_heartbeat` adapter-side polling does NOT count as cognitive activity.

**Test coverage:** §6.1 transport_heartbeat tool tests MUST verify: (a) `lastHeartbeatAt` bumped post-call; (b) `lastSeenAt` UNCHANGED post-call (no touchAgent invocation); (c) `cognitiveState` UNCHANGED post-call when no other tool-call activity has occurred.

**Idle-agent semantic clarification (NEW v0.3):**

For idle agents (no active engagement; no tool-calls):
- transport_heartbeat fires every 30s → `transportState = alive` (adapter is alive)
- No tool-calls → `lastSeenAt` ages → `cognitiveState = unresponsive` (LLM is idle)

This is **semantically correct, NOT pathological**. Operator visibility shows "agent's adapter reachable; LLM idle." Watchdog escalation logic needs engagement-context to distinguish idle-vs-stuck:
- Active mission + cognitiveState=unresponsive + duration > X = stuck (escalate)
- No active mission + cognitiveState=unresponsive = idle (no action)
- Per-agent pulse responses provide the death-detection signal for between-mission agents (per envelope hybrid γ architecture)

**Architect-flag for Phase 4 Design (forward-flag, NEW v0.3):** watchdog escalation logic update needs to consume engagement-context (active-mission-vs-not) for cognitive-state interpretation. Phase 4 Design v0.3 calls this out; Phase 8 implementation handles in watchdog consumer-update.

**Failure modes:**
- Heartbeat call fails (network blip): retry once with 5s backoff; if still fails, skip cycle; next cycle attempts (poll-backstop existing retry semantics)
- Hub returns error (e.g., agent not registered): log warning; do NOT retry indefinitely; suggests re-registration
- Long-quiescent period: no longer applicable (heartbeat fires every 30s regardless of queue activity)

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

**Architect-recommendation (v1.0 fold updates per Director Declarative-Primacy framing):** ship with PEER_PRESENCE_WINDOW_MS = 60s default for v1 — but **env-tunable + per-agent overridable** per v1.0 fold (env var `PEER_PRESENCE_WINDOW_MS` defaults to 60_000; per-agent override via `agent.livenessConfig.peerPresenceWindowMs?`). Closes F3 mitigation strategy structurally **within this mission**: operator can tune the threshold via env (no code change required); specific agents can override at registration time via livenessConfig. Falls under idea-242 Vision (declarative config-as-entities) as interim; broader Vision retires env vars in favor of LivenessConfig declarative entity later.

### §3.6 CLI surface refactor (`scripts/local/get-agents.sh` + NEW `scripts/local/mod.core` extraction per v1.0 fold)

**Per Q6=a raw-seconds + Director CLI mandate + v1.0 Director CLI consolidation ask.**

**Current columns** (mission-66 W4-era):
```
ID  NAME  ROLE  LIVENESS_STATE  ACTIVITY_STATE  SHIM_PLUGIN  ADAPTER  LLM_MODEL  PID  LABELS
```

**Target columns** (post-mission-225 v1.0; full-form names per v1.0 field-name correction for deterministic camelCase ↔ SNAKE_CASE round-trip):
```
ID  NAME  ROLE  COGNITIVE_TTL  TRANSPORT_TTL  ACTIVITY_STATE  SHIM_PLUGIN  ADAPTER  LLM_MODEL  PID  LABELS
```

**Changes:**
- REMOVED: `LIVENESS_STATE` column (composite still in schema; just not in CLI default render — composite available via `--show-composite` flag if needed)
- ADDED: `COGNITIVE_TTL` column showing `cognitiveTTL` raw seconds (v1.0 fold: full-form name; `cognitiveTTL` ↔ `COGNITIVE_TTL` deterministic round-trip)
- ADDED: `TRANSPORT_TTL` column showing `transportTTL` raw seconds (v1.0 fold: full-form name; `transportTTL` ↔ `TRANSPORT_TTL` deterministic round-trip)
- KEPT: `ACTIVITY_STATE` (orthogonal concept; busy/idle indicator)

**Determinism note (v1.0 fold per Director feedback):** with full-form column names, `buildTable()` can derive headers programmatically from camelCase field names via the conversion rule SNAKE_CASE = camelCase split on case boundary, joined with `_`, uppercased. Eliminates manual header-mapping; column projection is mechanical from agent record schema.

**Implementation (per MIN2 fold; clarified wording + v1.0 fold mod.core extraction per Director CLI consolidation ask):**
- **NEW v1.0 fold — `scripts/local/mod.core` (NEW file)** — sourceable bash module hosting extracted utility functions; first canonical instance of the lib-extraction discipline pattern per `feedback_design_phase_lib_extraction_for_substrate_bash.md`. Mission-225 extracts `buildTable()` only; future operator scripts source mod.core opportunistically OR systemically (idea-243 follow-on)
- `scripts/local/get-agents.sh` refactored to `source mod.core` + invoke extracted `buildTable()` function. Script-specific logic stays in get-agents.sh: argument parsing, jq template selection (`tpl/agents.jq`), Hub query specifics, output assembly
- `scripts/local/tpl/agents.jq` projection update for new columns (COGNITIVE_TTL + TRANSPORT_TTL; remove LIVENESS_STATE)
- Per AG-1 of mission-225 anti-goals: NOT swapping prism.sh into scripts/local/; memory `reference_prism_table_pattern.md` is conceptual reference, not substrate import
- Per AG-6 of mission-225 anti-goals: NO color/format/auto-detect added to mod.core in this mission (operator-UX surface trigger)

**Sourcing pattern (mod.core):**
```bash
#!/usr/bin/env bash
# scripts/local/get-agents.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/mod.core"

# ... script-specific logic ...
buildTable "$jq_output"
```

**mod.core scope (mission-225):**
- `buildTable()` — extracted from get-agents.sh in-line definition; hosts column-rendering logic
- (Future utilities migrate opportunistically as scripts are touched; idea-243 captures systemic follow-on for migrating all existing operator CLIs)

**Sample output (v1.0 fold field names):**
```
ID                NAME              ROLE       COGNITIVE_TTL  TRANSPORT_TTL  ACTIVITY_STATE  SHIM_PLUGIN   ADAPTER  ...
eng-0d2c690e7dd5  eng-0d2c690e7dd5  engineer   12             8              online_idle     claude-1.2.0  2.1.0    ...
eng-40903c59d19f  eng-40903c59d19f  architect  3              15             online_idle     claude-1.2.0  2.1.0    ...
```

Operator visually scans: "low TTLs = alive; high TTLs (>60) = unresponsive; missing values = unknown". No color/format/auto-detect per AG-6.

---

## §4 Migration sequencing (big-bang single-PR; consumer-update opportunism; v0.3 single-PR adds list updated per round-2 R2)

**Per Q2=a big-bang additive migration.**

**Single PR adds (v0.3):**
- 4 new schema fields on Agent record (`cognitiveTTL`, `transportTTL`, `cognitiveState`, `transportState`); composite `livenessState` retained UNCHANGED
- 0 new supporting timestamps (reuse existing `lastSeenAt` + `lastHeartbeatAt` per round-1 C3 fold)
- `pulseConfig` field on Agent record (for per-agent `agentPulse` cadence override; default 60min per F5 architect-recommendation)
- Hub-side TTL/state computation hooks: `recomputeCognitiveTTLAndState()` invoked from existing `touchAgent`; `recomputeTransportTTLAndState()` invoked from existing `refreshHeartbeat`
- **NEW v0.3 (per round-2 N1 fold):** Hub-side `transport_heartbeat` MCP tool (PolicyRouter registration; lightweight no-payload; handler invokes existing `refreshHeartbeat()`)
- **NEW v0.3 (per round-2 N1 fold):** Network-adapter substrate — extend `poll-backstop.ts` with second 30s heartbeat timer (calls `transport_heartbeat`); existing 300s message-poll timer UNCHANGED. NOT a new Adapter Kernel timer per N1 directional intent
- 2 new env vars (v0.3): `TRANSPORT_HEARTBEAT_INTERVAL_MS` (default 30_000), `TRANSPORT_HEARTBEAT_ENABLED` (default true)
- **v1.0 fold — 2 additional env-ifications:** `PEER_PRESENCE_WINDOW_MS` (default 60_000; backward-compatible), `AGENT_TOUCH_MIN_INTERVAL_MS` (default 30_000; backward-compatible). Closes F3 mitigation strategy structurally
- **v1.0 fold — `agent.livenessConfig` sub-object** (per-agent override for all 4 liveness env vars; analogous to existing `pulseConfig` per-agent pattern; sparse persistence)
- **v1.0 fold — `resolveLivenessConfig()` helper** at consumption-site (precedence: agent-override → env var → builtin fallback); single canonical resolver consumed by §3.2 hooks + §3.3 heartbeat handler + watchdog escalation
- **v1.0 fold — `transport_heartbeat` PolicyRouter tier annotation** (`tier: "adapter-internal"`); shim-side `list_tools` filter excludes adapter-internal tier from LLM catalogue surface (interim per idea-240 Vision)
- **v1.0 fold — `scripts/local/mod.core` extraction** (NEW file; extracted `buildTable()` from get-agents.sh; first canonical lib-extraction instance per `feedback_design_phase_lib_extraction_for_substrate_bash.md`)
- PulseSweeper `agentPulse` extension: second iteration pass (iterate-agents-not-missions); `AGENT_PULSE_KIND` constant separate from existing `PULSE_KEYS`
- Suppression rule: skip per-agent pulse when agent is on any active mission (per §3.4)
- CLI column refactor: `tpl/agents.jq` projection update (REMOVE `LIVENESS_STATE`; ADD `COGNITIVE_TTL` + `TRANSPORT_TTL` per v1.0 fold full-form names); `get-agents.sh` header refresh; **NEW v1.0 fold** — `buildTable()` extracted to `scripts/local/mod.core` per Director CLI consolidation ask (idea-243 captures systemic follow-on)
- Watchdog consumer-update: cognitive-vs-transport differentiation in escalation logic (per §4 consumer-update opportunism scope)
- PolicyRouter snapshot test: sorted-tool-name list updated with new `transport_heartbeat` entry (mission-72 invariant absorbs cleanly; no count assertion to bump)

**Consumer-update opportunism (per round-1 P2 concur; tight scope):**

`livenessState` consumed by 6 hub/src files (per greg's substrate scan):
- `state.ts` — types + isPeerPresent invariant; **STAY ON COMPOSITE** (predicate is "agent reachable for routing"; composite-FSM is correct level)
- `agent-repository.ts` — Agent record persistence; **STAY ON COMPOSITE** (existing FSM transitions unchanged)
- `agent-projection.ts` — CLI projection; **UPDATE** per §3.6 column refactor (COGNITIVE_TTL + TRANSPORT_TTL per v1.0 fold)
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
- **Suppression-policy strictness** (per round-1 M3 fold): strict-vs-permissive resolution

**§3.4 specifies suppression rule** (v0.3 R5 cross-reference per round-2 audit; v1.0 fold corrects v0.3 STRICT/PERMISSIVE wording bug per greg's round-3 non-blocking flag): `mission.status === 'active' AND (agent.id === mission.assignedEngineerId OR agent.id === mission.architectId)`. Multi-engagement → ANY active mission suppresses (`OR` semantics across missions); completed missions don't suppress; new agents get default pulseConfig at registration. **§3.4 M3 fold resolves to STRICT strict-vs-permissive policy** (any active-mission-engagement suppresses; permissive alternative explicitly rejected per §3.4 rationale). Separately, post-completion missions don't suppress (mission status drives, not stale config) — that's a different invariant from the STRICT/PERMISSIVE axis. See §3.4 for full rule text + rejection rationale.

**Engineer-audit ask (F2):** validate suppression rule semantics per §3.4 (M3-resolved permissive policy); flag any edge cases §3.4 missed.

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

### §6.1 Hub-side tests (vitest; revised v0.3 per round-1 folds + round-2 N1 fold)

- `hub/test/entities/agent-repository.test.ts` (path correction per M2) — extend with 4-field schema delta tests (cognitiveTTL/transportTTL eager-computation; cognitiveState/transportState derivation against PEER_PRESENCE_WINDOW_MS; truth-table edges incl. registration-instant `(unknown, alive)` per MIN1)
- `hub/test/policy/pulse-sweeper.test.ts` (path correction per M2) — NEW tests for agentPulse class + AGENT_PULSE_KIND second-iteration-pass + NULL mission binding suppression rule (strict; multi-engagement edge; completed mission edge; permissive-rule explicitly-rejected case per M3)
- `hub/test/policy/pending-action-policy.test.ts` — extend `refreshHeartbeat()` tests to verify `recomputeTransportTTLAndState()` hook fires post-bump (eager-write semantic)
- `hub/test/state.test.ts` — extend `touchAgent()` tests to verify `recomputeCognitiveTTLAndState()` hook fires post-bump (eager-write semantic; 30s rate-limit preserved)
- **`hub/test/policy/transport-heartbeat-tool.test.ts` (RE-ADDED v0.3 per N1 fold)** — NEW tests for `transport_heartbeat` MCP tool handler: invokes `refreshHeartbeat(agent.id)`; non-registered-agent rejection; rate-limit preserved (delegated to existing handler); registration-required-context propagated correctly
- **`hub/test/e2e/e2e-foundation.test.ts` snapshot update (RE-ADDED v0.3 per N1 fold)** — sorted-tool-name list snapshot updated for new `transport_heartbeat` entry; mission-72 invariant absorbs cleanly (no count assertion to bump per mission-72 pattern)
- **`hub/test/state.test.ts` resolveLivenessConfig precedence tests (NEW v1.0 fold)** — verify resolution order: agent.livenessConfig.X → env var → builtin fallback; verify per-field independence (override one field, others fall through to env); verify env-var-only path (no agent override); verify builtin-only path (no env, no agent override)
- **`hub/test/policy/transport-heartbeat-tool.test.ts` tier-filter tests (EXTENDED v1.0 fold)** — verify PolicyRouter registration of `transport_heartbeat` carries `tier: "adapter-internal"`; verify `list_tools` Hub-side response includes the tool (Hub remains passive); shim-side filter test (in adapter package §6.2) verifies LLM catalogue exclusion

### §6.2 Network-adapter substrate tests (revised v0.3 — re-add 30s heartbeat-timer tests per N1 fold)

- **`packages/network-adapter/test/kernel/poll-backstop.test.ts` (EXTENDED v0.3 per N1 fold)** — existing 300s message-poll timer tests UNCHANGED; NEW tests for second 30s heartbeat timer: cadence verification (30s default; honors `TRANSPORT_HEARTBEAT_INTERVAL_MS` env var); calls `transport_heartbeat` MCP tool; failure handling (retry once with 5s backoff; skip on second failure; resume next cycle); `TRANSPORT_HEARTBEAT_ENABLED=false` disables timer cleanly
- ~~`packages/network-adapter/test/kernel/transport-heartbeat.test.ts` (NOT created)~~ — heartbeat lives in poll-backstop substrate per N1; no separate file

### §6.3 CLI smoke-test

- `scripts/local/test-get-agents-cli.sh` — extend OR new; verify columns COGNITIVE_TTL + TRANSPORT_TTL render correctly via mod.core's `buildTable()` + `tpl/agents.jq` projection (v1.0 fold uses full-form column names)
- **NEW v1.0 fold** — `scripts/local/test-mod.core.sh` — unit tests for extracted `buildTable()` (column alignment edge cases; empty input; mixed-width input; deterministic camelCase→SNAKE_CASE header derivation)

### §6.4 Verification gates (Phase 6 + Phase 7; v0.3 update per round-2 R3)

- §6.1 + §6.2 + §6.3 all pass on PR branch
- `git grep -c "livenessState" hub/src/` → ≥1 (composite still referenced; UNCHANGED per C1 fold)
- `git grep -c "cognitiveState" hub/src/` → ≥1 (NEW field referenced; v0.3 corrects v0.2 reference of `cognitiveLivenessState` — renamed per C1 non-conflicting-naming fold)
- `git grep -c "transportState" hub/src/` → ≥1 (NEW field referenced)
- **Hub `transport_heartbeat` tool registered** (v0.3 RE-ADDED per N1) — validated via PolicyRouter snapshot test (mission-72 invariant): sorted-tool-name list contains `transport_heartbeat` entry
- **Network-adapter poll-backstop fires 30s heartbeat timer** (v0.3 RE-ADDED per N1) — validated via §6.2 cadence test + integration smoke-test (verify Hub-side `lastHeartbeatAt` updates within ~30s of adapter startup, idle agent)
- **Idle-agent transport-state stability** (NEW v0.3 verification per N1) — start adapter, no tool-calls, no pending actions; verify `transportState` remains `alive` for ≥120s (covers 4× heartbeat cycle)
- `scripts/local/get-agents.sh` outputs COGNITIVE_TTL + TRANSPORT_TTL columns (LIVENESS_STATE removed; v1.0 fold full-form names; sources `mod.core` for `buildTable()`)
- *(v1.0 fold)* **`transport_heartbeat` NOT in shim's LLM-exposed tool surface** — validated via shim `list_tools` filter test; tool returns from Hub but is filtered out by tier annotation (`tier: "adapter-internal"`) before LLM catalogue surface
- *(v1.0 fold)* **Per-agent override resolution test** — `agent.livenessConfig.peerPresenceWindowMs` overrides env default; `agent.livenessConfig.transportHeartbeatIntervalMs` overrides env default; `resolveLivenessConfig()` precedence chain validated (agent override → env var → builtin fallback)
- *(v1.0 fold)* **`scripts/local/mod.core` sourced cleanly by `get-agents.sh`** — validated via test-mod.core.sh + test-get-agents-cli.sh end-to-end

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

### §7.3 Content map (single mega-PR; Option A default; revised v0.3 per round-2 N1 fold — transport_heartbeat MCP tool + poll-backstop heartbeat timer re-added)

| File | Change | Lines (est.) |
|---|---|---|
| `docs/surveys/m-ttl-liveliness-design-survey.md` | Phase 3 envelope (already committed `f68e23b`) | +359 |
| `docs/designs/m-ttl-liveliness-design-design.md` | This Design v0.1 → v0.2 → v0.3 → v1.0 | +900 |
| `hub/src/state.ts` (path correction per M2) | Type extensions: cognitiveTTL/transportTTL/cognitiveState/transportState fields + AGENT_PULSE_KIND constant + pulseConfig type + touchAgent post-bump hook | +35 / -2 |
| `hub/src/entities/agent-repository.ts` (path correction per M2; was entities/agent.ts) | Schema delta application: 4 NEW fields persistence; OCC-safe writes for new fields | +40 |
| `hub/src/policy/pulse-sweeper.ts` (path correction per M2; was services/pulse-sweeper.ts) | agentPulse SECOND iteration pass (iterate-Agents-not-missions) + AGENT_PULSE_KIND constant + NULL mission binding suppression (strict per M3) + lastFiredAt persistence | +80-120 (per M1 fold; revised from v0.1's +60) |
| `hub/src/policy/pending-action-policy.ts` | `refreshHeartbeat()` post-bump hook → `recomputeTransportTTLAndState(agentId)` | +10 |
| **`hub/src/policy/router.ts` — Register `transport_heartbeat` MCP tool (RE-ADDED v0.3 per N1 fold)** | Tool registration entry; sorted-tool-name list snapshot will absorb cleanly per mission-72 pattern | +5 |
| **`hub/src/handlers/transport-heartbeat-handler.ts` (NEW v0.3 per N1 fold)** | Handler invokes existing `refreshHeartbeat(agent.id)`; lightweight no-payload; rejects unregistered agents | +30 |
| `hub/src/policy/message-policy.ts` | agentPulse-ack hook (per M1 fold; pulse-ack lifecycle extension) | +20 |
| `hub/test/entities/agent-repository.test.ts` (path correction per M2) | Schema delta tests + eager TTL + truth-table edges (incl. registration-instant) | +130 |
| `hub/test/policy/pulse-sweeper.test.ts` (path correction per M2) | agentPulse + AGENT_PULSE_KIND + suppression strict-rule edge cases (multi-engagement, completed-mission, permissive-rejection) | +90 |
| `hub/test/policy/pending-action-policy.test.ts` | `refreshHeartbeat` post-bump hook fires `recomputeTransportTTLAndState` | +30 |
| `hub/test/state.test.ts` | `touchAgent` post-bump hook fires `recomputeCognitiveTTLAndState`; 30s rate-limit preserved | +30 |
| **`hub/test/policy/transport-heartbeat-tool.test.ts` (NEW v0.3 per N1 fold)** | Handler tests: invokes refreshHeartbeat; non-registered rejection; rate-limit preserved | +60 |
| **`hub/test/e2e/e2e-foundation.test.ts` (UPDATED v0.3 per N1 fold)** | Snapshot update for new `transport_heartbeat` tool entry in sorted-tool-name list | +1 / -0 |
| **`packages/network-adapter/src/kernel/poll-backstop.ts` (EXTENDED v0.3 per N1 fold)** | Add second 30s heartbeat timer alongside existing 300s message-poll timer; calls `transport_heartbeat` MCP tool; honors `TRANSPORT_HEARTBEAT_INTERVAL_MS` + `TRANSPORT_HEARTBEAT_ENABLED` env vars; failure handling (5s backoff retry, skip cycle) | +50 / -5 |
| **`packages/network-adapter/test/kernel/poll-backstop.test.ts` (EXTENDED v0.3 per N1 fold)** | New tests for 30s heartbeat timer cadence + env-var honor + failure handling + idle-agent stability | +80 |
| `hub/src/state.ts` (watchdog consumer-update per P2 concur tight-scope) | watchdog escalation-on-unresponsive update to use cognitiveState vs transportState differentiation (different remediation paths); idle-vs-stuck disambiguation per §3.3 idle-agent semantic clarification | +25 / -10 |
| `hub/src/state.ts` (agent-projection consumer-update per P2 concur tight-scope) | agent-projection update for new fields surface in get_agents tool response | +15 |
| `scripts/local/get-agents.sh` | Column refactor (COGNITIVE_TTL + TRANSPORT_TTL replace LIVENESS_STATE per v1.0 fold full-form names); refactor to `source mod.core` + invoke extracted `buildTable()` per Director CLI consolidation ask | +5 / -15 |
| **`scripts/local/mod.core`** *(NEW v1.0 fold)* | Sourceable bash module; extracted `buildTable()`; first canonical instance of lib-extraction discipline per `feedback_design_phase_lib_extraction_for_substrate_bash.md` | +50 |
| **`scripts/local/test-mod.core.sh`** *(NEW v1.0 fold)* | Unit tests for `buildTable()` (column alignment edges; empty/mixed-width; deterministic header derivation) | +50 |
| `scripts/local/tpl/agents.jq` | Column projection update | +5 / -3 |
| `scripts/local/test-get-agents-cli.sh` | Smoke-test extension | +30 |
| `docs/missions/m-ttl-liveliness-design-preflight.md` | Phase 6 preflight | +120 |
| `docs/traces/m-ttl-liveliness-design-architect-trace.md` | Phase 8/9/10 work-trace | +200 |

**Total est.** ~1900 lines net addition (revised up from v0.2's ~1700 by ~12% per N1 transport_heartbeat tool + poll-backstop timer re-introduction; still 7% below v0.1's ~2050). Single squash-merge PR (Option A; per round-1 P3 concur).

**Net-new-substrate count comparison (v0.3 honest accounting):**
- v0.1: 5 new liveness fields + 2 supporting timestamps + 1 new MCP tool = **8 net-new substrate items**
- v0.2: 4 new liveness fields + 0 supporting timestamps + 0 new MCP tools = **4 net-new substrate items** (claimed 50% reduction; **incorrect** — drain isn't periodic, so v0.2 didn't actually deliver periodic transport-HB)
- v0.3: 4 new liveness fields + 0 supporting timestamps + 1 new MCP tool (`transport_heartbeat` driven from poll-backstop substrate) = **5 net-new substrate items** (38% reduction from v0.1; honest endpoint per round-2 N1 fold)

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

## §9 Architect-flags status (v1.0 fold — F3 ADDRESSED upgraded per env-tunable + per-agent-overridable mitigation; v0.3 per round-2 R4 — addressed/deferred markers added; F4 reframe to component-state truth table)

| # | Flag | Status (v1.0) | Architect-recommendation |
|---|---|---|---|
| F1 (CRITICAL) | Write-amplification at scale — eager TTL writes mean every transport HB + cognitive signal triggers Agent-record write | **CONCURRED + DEFERRED to post-deployment instrumentation** (round-3 ratified by greg; P4 round-1 concur — current-scale OCC headroom; AG-5 anti-goal blocks batching this mission; forward-flag for scale-out) | Per §5.1 + §3.2: ship eager-write v1; instrument; AG-5 anti-goal blocks batching. v0.3 N1 fold's 30s heartbeat timer adds ~2 writes/min/agent for transport path alone — within order-of-magnitude assessment per round-3 verify. Forward-flag: file follow-on idea M-TTL-Eager-Write-Batching when scale-out triggers |
| F2 (MEDIUM) | Suppression-discipline correctness — agentPulse "skip if any active mission" edge cases (multi-engagement; completed mission lingering config) | **ADDRESSED** in §3.4 (M3 fold STRICT-rule; permissive explicitly rejected); §5.2 cross-references §3.4 per round-2 R5 (v1.0 fold corrects v0.3 PERMISSIVE/STRICT wording bug per greg's round-3 non-blocking flag) | Per §3.4 + §5.2 (v1.0 fold): STRICT suppression rule = `mission.status === 'active' AND agent.id IN (engineerId, architectId)`; multi-engagement = ANY active mission suppresses (OR semantics); completed don't (status drives, not stale config). Engineer-audit ratified round-3 |
| F3 (MEDIUM) | Cognitive-stale threshold against engagement patterns — 60s may false-positive on long-thinking-no-tool-call | **ADDRESSED + STRUCTURALLY CLOSED** (v1.0 fold per Director Declarative-Primacy framing) — M4 fold collapses to existing PEER_PRESENCE_WINDOW_MS = 60s invariant; v1.0 fold env-ifies (`PEER_PRESENCE_WINDOW_MS` env var; default 60_000) + per-agent override (`agent.livenessConfig.peerPresenceWindowMs?`); operator can tune via env without code change; specific agents can override at registration. Mitigation strategy now in-mission, NOT deferred to follow-on | Per §3.5 + §5.3 (v1.0 fold): ship 60s default; env-tunable + per-agent overridable; instrument false-positive rate post-deployment; tune env if needed (no code change). Falls under idea-242 Vision (declarative config-as-entities) as interim |
| F4 (MINOR) | **REFRAMED v0.2 + v0.3:** truth table is for component states (`cognitiveState` × `transportState`), NOT composite-`livenessState` derivation rules. v0.3 per round-2 R4 explicitly: composite stays untouched per C1 fold; F4's "composite derivation rules" framing was v0.1-era and no longer applies — there is no composite derivation in v0.2/v0.3 | **ADDRESSED** via reframe to component-state truth table in §3.1 (incl. registration-instant `(unknown, alive)` edge per MIN1); §5.4 reframes per C1 fold | Per §3.1 + §5.4: 7-row truth table for `cognitiveState × transportState` (NOT composite); registration-instant edge documented. **Engineer-audit ask (round-3):** validate §3.1 truth table; confirm registration-instant edge is naturally-pending; flag any edges §3.1 missed |
| F5 (PROBE) | Per-agent pulse cadence specific number — Survey-deferred | **CONCUR** (P1 round-1) — 60min default; configurable per-agent at registration | Per §3.4 + §5.5: 60min default; configurable per Agent record. **Engineer-audit ask (round-3):** what cadence does engineer-substrate intuition support; 30/60/120min trade-off |
| F6-NEW (FORWARD-FLAG; v0.3) | **NEW per round-2 N1 fold:** watchdog escalation logic needs engagement-context (active-mission-vs-not) for cognitive-state interpretation. Idle-agent semantic clarification per §3.3: `cognitiveState=unresponsive` is normal for idle agents (no active mission); only pathological under active engagement | **FORWARD-FLAG** for Phase 8 implementation (watchdog consumer-update scope per §4) | Per §3.3 idle-agent semantic clarification: watchdog logic update consumes engagement-context; idle-vs-stuck disambiguation = active-mission-presence + duration threshold |

---

## §10 Cross-references

- **Survey envelope:** `docs/surveys/m-ttl-liveliness-design-survey.md` (commit `f68e23b`; Director-ratified 6 picks across 2 rounds)
- **Source idea:** idea-225 (status: triaged; will flip incorporated at mission-create)
- **Sister:** idea-224 / mission-68 (closed; pulse mechanism we consume per AG-1) + idea-216 (sibling concern; reviewed at Phase 4 entry — note-kind primitive surface gap; unrelated to this mission's Vision)
- **Downstream Visions surfaced during Director walk-through (2026-05-05):**
  - **idea-239 (M-RolePulse-Vocabulary-Consolidation)** — collapse engineerPulse + architectPulse + agentPulse into rolePulse(role, engagementContext); AG-1 + AG-7 follow-on; substrate-cleanup-wave class
  - **idea-240 (M-Agnostic-Transport-Adapter-Hub)** — Vision/umbrella; confine MCP to single Shim↔LocalProxy boundary; agnostic wire transport (WebSocket/gRPC) Adapter↔Hub; AG-2 follow-on; structurally retires v1.0 shim-side `transport_heartbeat` tier filter
  - **idea-241 (M-Transport-WebSocket-Adapter-Hub)** — first canonical constituent of idea-240; replace MCP wire-protocol with WebSocket; preserve operation contracts initially
  - **idea-242 (M-Declarative-Agentic-Configurations-Hub)** — Vision/umbrella; replace env-vars-as-primary-config with declarative LivenessConfig + WatchdogConfig + ... entities at Hub; v1.0 env-vars + per-agent override are interim under this Vision
  - **idea-243 (M-Operator-CLI-Consolidation-mod-core)** — systemic follow-on to v1.0 mod.core extraction; migrate all existing operator CLIs to source mod.core
- **Pre-ratified macro-architecture:** Director-architect bilateral 2026-05-02 (transport HB owner + cognitive heartbeat composition + hybrid γ pulse architecture + cadence relationship + CLI surface mandate)
- **Validator readiness:** mission-74 PR #166 multi-pick fix (2026-05-04) — enables validate-envelope.sh to accept Q1=cd; Phase 3 finalize-gate clean post-fix
- **Methodology:** `docs/methodology/idea-survey.md` v1.0 (Survey methodology consumed; not modified per AG-9 carve-out from mission-69) + `docs/methodology/strategic-review.md` (Idea Triage Protocol; route-(a) skip-direct applied) + `docs/methodology/mission-lifecycle.md` v1.2 (Phase 4 Design entry methodology; substrate-introduction class)
- **Substrate to extend (paths corrected per round-1 M2 fold; v0.3 re-adds network-adapter poll-backstop per N1 fold):**
  - `hub/src/state.ts` (types + AGENT_PULSE_KIND constant + touchAgent hook + watchdog/agent-projection consumer updates)
  - `hub/src/entities/agent-repository.ts` (Agent record schema; 4 NEW fields persistence)
  - `hub/src/policy/pulse-sweeper.ts` (agentPulse second iteration pass)
  - `hub/src/policy/pending-action-policy.ts` (refreshHeartbeat post-bump hook)
  - `hub/src/policy/router.ts` (NEW `transport_heartbeat` MCP tool registration; v0.3 per N1)
  - `hub/src/handlers/transport-heartbeat-handler.ts` (NEW handler; v0.3 per N1)
  - `hub/src/policy/message-policy.ts` (agentPulse-ack hook)
  - `packages/network-adapter/src/kernel/poll-backstop.ts` (EXTEND with second 30s heartbeat timer; v0.3 per N1)
  - `scripts/local/get-agents.sh` + `scripts/local/tpl/agents.jq` (CLI column refactor)
- **Compressed-lifecycle precedent:** mission-67/68/69 substrate-introduction + mission-70/72/73/74 small-mission cleanup-wave precedents
- **Memory references:**
  - `reference_prism_table_pattern.md` — informed §3.6 CLI column projection
  - `feedback_schema_rename_requires_state_migration.md` — informed Q2 migration NOT applying (additive not rename)
  - `feedback_compressed_lifecycle_preflight_currency_checks.md` — applies at Phase 6 preflight
  - `feedback_design_phase_lib_extraction_for_substrate_bash.md` — **load-bearing for v1.0 fold** mod.core extraction (Director CLI consolidation ask; first canonical instance of the discipline pattern in this codebase)
  - `feedback_refactor_introduces_regression_during_fold.md` — load-bearing for round-2 R1-R5 fold-incomplete-regression catch + v0.3 → v1.0 fold cycle
  - `feedback_review_loop_calibration_surface.md` — composes with §11.4 μ-finding parking; this thread generated 3 calibration data points across rounds

---

## §11 Multi-round audit fold summary (v1.0 — round-1 + round-2 + round-3 + v1.0 Director-walk-through ratification folds; extends mission-67/68/69/71 round-2 verify discipline to multi-round folds)

### §11.1 Round-1 audit folds (v0.1 → v0.2; greg; thread-472 round-1; 2026-05-05)

**13 findings: 3 CRITICAL + 4 MEDIUM + 2 MINOR + 4 PROBE concur.**

| Finding | Class | Architect fold-decision (v0.2) | v0.2 § |
|---|---|---|---|
| C1 | enum-domain mismatch (schema-rename without migration); `livenessState` is 4-state ADR-017 FSM, not 3-state | **FOLDED** — option (a): preserve existing 4-state composite UNTOUCHED; new component fields use non-conflicting names `cognitiveState` + `transportState` (was `cognitiveLivenessState`/`transportLivenessState`) | §0.5 + §3.1 |
| C2 | `transport_heartbeat` proposed tool duplicates existing `drain_pending_actions` HB mechanism | **FOLDED v0.2** — option (a): drop new MCP tool; document drain as transport-HB primitive; reuse poll-backstop cadence. **PARTIALLY REVERTED v0.3 per round-2 N1** — drain is queue-driven NOT periodic; v0.3 re-introduces `transport_heartbeat` MCP tool driven from poll-backstop substrate (NOT new Adapter Kernel timer; preserves C2 directional intent) | §0.5 + §3.3 (rewritten v0.3) |
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

**NEW §0.5 introduced (v0.2):** Existing infrastructure inventory (closes prior-substrate-elision class structurally; methodology-fold candidate per mission-73 audit-rubric §3d pattern — sister to "memory-tier-to-methodology-tier graduation" + "validator-mechanism-tier-to-methodology-conformance graduation" → "architect-design-prior-substrate-elision" graduation; future-canonical instance triggers methodology-fold mission).

### §11.2 Round-2 audit folds (v0.2 → v0.3; greg; thread-472 round-2; 2026-05-05)

**6 findings: 1 NEW (architectural; substrate-reality gap on C2 fold) + 5 fold-incomplete regressions (R1-R5; doc-internal text not updated to match v0.2 architectural reshapings) + 3 §0.5 polish items.**

| Finding | Class | Architect fold-decision (v0.3) | v0.3 § |
|---|---|---|---|
| N1 | **NEW (substrate-reality gap on v0.2 C2 fold)** — `drain_pending_actions` is queue-driven NOT periodic; idle agents (no pending actions) would have `lastHeartbeatAt` aging monotonically + `transportState` falsely flipping unresponsive after 60s. PEER_PRESENCE_WINDOW_MS = 60_000 doesn't absorb 300s+ poll-backstop default cadence variance. v0.2's "drain reuses existing" claim didn't deliver periodic transport-HB | **FOLDED v0.3 — option (c) partial C2 revert:** re-introduce `transport_heartbeat` MCP tool (Hub-side) driven from existing poll-backstop substrate (network-adapter package; NOT a new Adapter Kernel timer). Two-timer poll-backstop (300s message-poll UNCHANGED + new 30s heartbeat). C2 directional intent preserved (no new Adapter Kernel timer); periodic-transport-HB gap closed | §3.3 (rewritten v0.3) + §2 + §4 + §6.1 + §6.2 + §6.4 + §7.3 + §10 |
| R1 | §2 architecture diagram still shows v0.1 wording ("Adapter Kernel timer") + lists `transport_heartbeat` as `(NEW; lightweight)` (which v0.2 dropped, v0.3 re-adds via different mechanism) | **FOLDED v0.3** — diagram rewritten to v0.3 reality: poll-backstop substrate (Layer 1) hosts both 300s message-poll + 30s heartbeat timer; explicit "NOT a new Adapter Kernel timer per N1" annotation | §2 |
| R2 | §4 single-PR adds list still shows v0.1 items (`lastCognitiveSignalTime`, `lastTransportHBTime`, "Adapter Kernel transport-HB timer") that don't match v0.2 substrate; missing v0.3 N1 items | **FOLDED v0.3** — list rewritten: 4 fields (no supporting timestamps); v0.3 transport_heartbeat tool + handler; poll-backstop heartbeat timer extension; new env vars; explicit consumer-update scope; PolicyRouter snapshot test bump | §4 |
| R3 | §6.4 verification gates reference `cognitiveLivenessState` (v0.1 name; v0.2 renamed to `cognitiveState` per C1 fold) + claim "no snapshot update needed" (v0.2 era; v0.3 needs the update) | **FOLDED v0.3** — gates updated to use v0.2 field names + add v0.3 N1 verification gates (transport_heartbeat tool registered in PolicyRouter snapshot; poll-backstop 30s heartbeat timer fires; idle-agent transport-state stability across 4× heartbeat cycles) | §6.4 |
| R4 | §9 architect-flags table doesn't mark each F1-F5 with addressed/deferred status post-folds; F4 still shows v0.1 "composite derivation rules" framing despite v0.2 reframe to component-state truth table | **FOLDED v0.3** — status column added per-flag (ADDRESSED/DEFERRED/CONCUR/FORWARD-FLAG); F4 reframed explicitly to component-state truth table per C1; F1 deferred to round-3 verify with v0.3 N1 write-amp note; NEW F6-NEW added per N1 idle-agent semantic clarification | §9 |
| R5 | §5.2 F2 edge cases doesn't cross-reference §3.4's M3-resolved strict-vs-permissive policy | **FOLDED v0.3** — §5.2 explicitly cross-references §3.4 for M3-resolved permissive policy + suppression rule text + worked-example | §5.2 |
| §0.5-polish-1 | `applyLivenessRecompute()` (existing FSM transition function) absent from inventory | **FOLDED v0.3** — added inventory row (REUSE UNCHANGED; PARALLEL to v0.3 component-state hooks; no call-site changes for FSM transitions) | §0.5 |
| §0.5-polish-2 | `isPeerPresent(agent)` helper (load-bearing for M4 collapse) absent from inventory | **FOLDED v0.3** — added inventory row (REUSE UNCHANGED; consumers continue using helper unchanged) | §0.5 |
| §0.5-polish-3 | `activityState` auto-clamp behaviour (mission-62) absent from inventory | **FOLDED v0.3** — added inventory row (REUSE UNCHANGED; orthogonal to liveness component states; KEPT as separate CLI column per Q6=a; not folded) | §0.5 |

### §11.3 Round-3 verify (v0.3 → v1.0 ratification; greg; thread-472 round-10; 2026-05-05)

Round-3 verified all v0.3 folds clean. Greg ratified v0.3 as v1.0 with one trivial wording bug flagged as non-blocking follow-up:
- N1 fold mechanism (option (c) poll-backstop 30s heartbeat timer) ✓
- touchAgent-bypass discipline (commit `99f6e7d`) — exemplary; closes the cognitive-vs-transport semantic separation invariant ✓
- R1-R5 fold completeness ✓ (with one §5.2 STRICT/PERMISSIVE wording bug — folded into v1.0 ratification commit per Director walk-through)
- §0.5 polish 3 added rows + drain/poll-backstop corrections ✓
- §11 multi-round summary + honest substrate-footprint accounting ✓
- μ-finding parked correctly per mission-73 §3d wait-for-2nd-canonical-instance discipline ✓

Thread-472 hit round_limit (10/10) at greg's ratification reply but converged substantively (`converged: true; intent: implementation_ready`). Bilateral Phase 4 audit cycle complete.

### §11.4 v1.0 Director-walk-through ratification folds (lily ↔ Director; Phase 4 walk-through; 2026-05-05)

Director walk-through of ratified v0.3 surfaced 5 substantive items folded into the v1.0 ratification commit:

| Item | Class | Architect fold-decision (v1.0) | v1.0 § |
|---|---|---|---|
| §3.3 adapter-internal-tool tier discipline | NEW (architectural; tool-tier-separation surface gap) | **FOLDED v1.0** — `transport_heartbeat` PolicyRouter registration carries `tier: "adapter-internal"`; shim-side `list_tools` filter excludes adapter-internal tier from LLM catalogue. Hub remains passive (annotates only); shim is active filter. Interim solution; idea-240 Vision (agnostic-transport) makes structurally unnecessary later | §3.3 + §6.1 + §6.4 + §0.5 + §10 |
| Field-name corrections (COG_TTL → COGNITIVE_TTL etc.) | NEW (Director feedback per CLI walk-through; deterministic camelCase ↔ SNAKE_CASE round-trip) | **FOLDED v1.0** — full-form names throughout (§2 diagram, §3.6, §4, §6, §7.3); enables `buildTable()` to derive headers programmatically from camelCase field names | §2 + §3.6 + §4 + §6 + §7.3 |
| §5.2 STRICT/PERMISSIVE wording fix | TRIVIAL (greg round-3 non-blocking flag) | **FOLDED v1.0** — corrects v0.3's §5.2 paraphrase that incorrectly said PERMISSIVE; §3.4's actual rule is STRICT (any active-mission-engagement suppresses; permissive explicitly rejected) | §5.2 |
| Env-ification + per-agent override (Director Declarative-Primacy framing) | NEW (architectural; closes F3 mitigation strategy structurally) | **FOLDED v1.0** — env-ify PEER_PRESENCE_WINDOW_MS + AGENT_TOUCH_MIN_INTERVAL_MS (defaults match current; backward-compatible); NEW `agent.livenessConfig` sub-object for per-agent override (analogous to existing `pulseConfig` pattern); NEW `resolveLivenessConfig()` helper at consumption-site (precedence: agent → env → builtin). Interim under idea-242 Vision (declarative config-as-entities) | §3.1 + §3.2 + §3.3 + §3.5 + §4 + §6.1 + §6.4 + §7.3 + §9 (F3 status DEFERRED → ADDRESSED) + §0.5 |
| `scripts/local/mod.core` extraction (Director CLI consolidation ask) | NEW (architectural; first canonical lib-extraction instance per `feedback_design_phase_lib_extraction_for_substrate_bash.md` discipline) | **FOLDED v1.0** — extract `buildTable()` from get-agents.sh into NEW `scripts/local/mod.core` sourceable module; refactor get-agents.sh to source mod.core; NEW `scripts/local/test-mod.core.sh` unit tests. Mission-225 establishes the pattern; idea-243 captures systemic follow-on (migrate all operator CLIs) | §3.6 + §6.3 + §7.3 + §0.5 |

**Five Director-surfaced ideas filed during walk-through (downstream Vision capture):**
- idea-239 (rolePulse vocabulary consolidation) — substrate-cleanup-wave
- idea-240 (agnostic-transport Vision) — Vision/umbrella
- idea-241 (WebSocket transport) — substrate-introduction (constituent of idea-240)
- idea-242 (declarative agentic configurations) — Vision/umbrella
- idea-243 (mod.core CLI consolidation) — substrate-cleanup-wave

### §11.5 Honest substrate-footprint accounting (v1.0 — extends v0.3 per N1 fold; v1.0 fold adds env-ification + per-agent override + tier annotation + mod.core)

| Version | Net-new substrate items | Reduction vs v0.1 | Honest framing |
|---|---|---|---|
| v0.1 | 5 fields + 2 supporting timestamps + 1 new MCP tool = **8** | (baseline) | Baseline |
| v0.2 | 4 fields + 0 supporting + 0 new MCP tools = **4** | claimed 50% | **INCORRECT claim** — drain isn't periodic; v0.2 didn't deliver periodic transport-HB; "reuse existing" was substrate-reality gap |
| v0.3 | 4 fields + 0 supporting + 1 new MCP tool (`transport_heartbeat` via poll-backstop substrate; NOT new Adapter Kernel timer) = **5** | honest 38% | Round-2 N1 fold endpoint; periodic gap closed; C2 directional intent preserved |
| **v1.0** | 4 fields + 1 sub-object (livenessConfig) + 0 supporting + 1 new MCP tool + 1 helper (resolveLivenessConfig) + 1 tier annotation (transport_heartbeat tier) + 1 module file (mod.core) = **8** | **honest 0% net** vs v0.1 (same item count; vastly different shape) | v1.0 fold expands substrate to deliver Declarative-Primacy alignment + adapter-internal-tool tier discipline + lib-extraction discipline. Item count returns to v0.1 baseline but the items are RIGHT this time (declarative config sub-object instead of supporting timestamps; tier annotation instead of separate filter; sourceable module instead of in-line code). Substrate-quality > substrate-count |

### §11.6 μ-findings (parked; sister-class to mission-71 μ7-impl4)

**μ1-cumulative-fold-regression-class:** R1-R5 represent a sister-class to mission-71 μ7-impl4. v0.2 architectural folds (C1+C2+C3) were correct in directional intent + tabular (§0.5 + §3.1 + §3.3 + §3.5) sections, but doc-internal sections written before the folds (§2 diagram, §4 PR-list, §5.2 cross-refs, §6.4 gates, §9 flags) retained pre-fold framing — fold-incomplete regression class. Round-2 verify is the natural catch-net (per `feedback_refactor_introduces_regression_during_fold.md`). **Diagnostic question for future folds:** "When I introduce architectural reshaping in tabular section X, which doc-internal narrative sections still reference the pre-fold framing?" Architect-discipline + Phase-4 audit-rubric §3d candidate (parked; not promoted to methodology-fold this mission per mission-73 §3d pattern — wait for 2nd canonical instance).

**μ2-design-walkthrough-as-calibration-surface (NEW v1.0 fold):** Director walk-through of ratified v0.3 surfaced 5 substantive folds (3 NEW architectural items + 1 trivial wording + Director's CLI consolidation ask) PLUS 5 downstream Vision/follow-on ideas. The walk-through pattern composes with `feedback_review_loop_calibration_surface.md` — Director-walkthrough-as-design-review surfaces architectural-tension-signals that bilateral round-1+round-2+round-3 audit cycle didn't catch (because greg's engineer-RACI doesn't typically reach into LLM/shim tool-surface boundaries OR Director's tele-alignment framing on Declarative-Primacy). **Diagnostic question for future Phase 4 walkthroughs:** "What architectural-tension-signals did Director surface that engineer-RACI structurally couldn't?" Methodology-fold candidate per mission-73 §3d pattern (parked; not promoted this mission per wait-for-2nd-canonical-instance discipline).

### §11.7 Verdict — v1.0 RATIFIED

- **Round-1:** all 3 CRITICALs resolved + 4/4 MEDIUMs folded + 2/2 MINORs folded + 4/4 PROBEs concur. v0.2 delivered.
- **Round-2:** 1 NEW (N1 substrate-reality gap) + 5 fold-incomplete regressions (R1-R5) + 3 §0.5 polish items folded. v0.3 delivered.
- **Round-3:** greg ratified v0.3 as v1.0 at thread-472 round-10 (`converged: true; intent: implementation_ready`); 1 trivial wording bug flagged as non-blocking → folded into v1.0 ratification commit.
- **v1.0 Director walk-through:** 5 substantive folds (§3.3 tier discipline + field-name corrections + §5.2 STRICT/PERMISSIVE + env-ification with per-agent override + mod.core extraction) + 5 downstream Vision/follow-on ideas filed (idea-239/240/241/242/243).

**Mission-225 Phase 4 Design v1.0 RATIFIED. Ready for Phase 6 preflight entry per `mission-lifecycle.md`.**

---

— Architect: lily / 2026-05-05 (Phase 4 Design v1.0 RATIFIED; engineer round-1 + round-2 + round-3 audits folded clean per bilateral audit cycle; Director walk-through 2026-05-05 added 5 v1.0 ratification folds + filed 5 downstream Vision/follow-on ideas; ready for Phase 6 preflight entry)
