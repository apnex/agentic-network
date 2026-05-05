# M-TTL-Liveliness-Design — Design v0.1

**Status:** v0.1 DRAFT (architect-authored 2026-05-04; pending engineer round-1 audit per `mission-lifecycle.md` Phase 4 audit cycle)
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
- §1 Mission scope summary (Survey envelope §3 + §4 reference)
- §2 Architecture overview (3-layer composition: schema + transport HB + cognitive composite)
- §3 Component designs:
  - §3.1 Hub schema delta (5 liveness fields)
  - §3.2 Hub-side TTL computation (eager write-on-event)
  - §3.3 Adapter Kernel transport heartbeat
  - §3.4 PulseSweeper extension (per-agent pulse via NULL mission binding)
  - §3.5 Cognitive-staleness threshold logic
  - §3.6 CLI surface refactor (`get-agents.sh`)
- §4 Migration sequencing (big-bang single-PR; consumer-update opportunism)
- §5 Edge cases + failure modes (F1-F5 from envelope architect-flags)
- §6 Test / verification strategy
- §7 PR sequencing + content map
- §8 Anti-goals (carry from envelope §5)
- §9 Architect-flags for round-1 audit (carry from envelope §6)
- §10 Cross-references

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

### §3.1 Hub schema delta (5 liveness fields on Agent record)

**Per Q1=cd maximal-information schema.**

Add 4 new fields to the Hub Agent record (composite `livenessState` retained for legacy):

| Field | Type | Persistence | Derivation |
|---|---|---|---|
| `livenessState` (existing) | enum (`alive\|unresponsive\|unknown`) | Persisted | Composite per derivation rules below |
| `cognitiveLivenessState` (NEW) | enum (`alive\|unresponsive\|unknown`) | Persisted | `cognitiveTTL >= 60s ? unresponsive : alive`; `unknown` if no cognitive signal yet observed |
| `transportLivenessState` (NEW) | enum (`alive\|unresponsive\|unknown`) | Persisted | `transportTTL >= 60s ? unresponsive : alive`; `unknown` if no transport HB observed yet |
| `cognitiveTTL` (NEW) | integer (seconds) | Persisted | `now - lastCognitiveSignalTime`; computed at signal-arrival per Q5=a eager strategy |
| `transportTTL` (NEW) | integer (seconds) | Persisted | `now - lastTransportHBTime`; computed at signal-arrival per Q5=a eager strategy |

Plus 2 supporting fields:

| Field | Type | Purpose |
|---|---|---|
| `lastCognitiveSignalTime` (NEW) | ISO-8601 timestamp | Tracks freshest cognitive signal across {pulse-response, tool-call, thread-reply, message-ack} |
| `lastTransportHBTime` (NEW) | ISO-8601 timestamp | Tracks last transport heartbeat from Adapter Kernel |

**Composite `livenessState` derivation rules (per F4 audit-flag):**

| `cognitiveLivenessState` | `transportLivenessState` | composite `livenessState` |
|---|---|---|
| alive | alive | **alive** |
| unresponsive | * | **unresponsive** |
| * | unresponsive | **unresponsive** |
| unknown | unknown | **unknown** |
| alive | unknown | **unknown** (conservative) |
| unknown | alive | **unknown** (conservative) |

**Conservative `unknown` rule:** if either component is unknown, composite is unknown. Rationale: avoid claiming `alive` when one signal source hasn't been observed yet (e.g., agent just registered; no transport HB yet observed).

### §3.2 Hub-side TTL computation (eager write-on-event)

**Per Q5=a eager strategy.**

Computation flow on signal arrival (transport HB OR cognitive signal):

```typescript
// pseudocode; engineer-substrate writes actual TypeScript
function onSignalArrival(agentId: string, signalKind: SignalKind, signalTime: Date) {
  const agent = await agentStore.get(agentId);

  // 1. Update appropriate last-signal-time
  if (signalKind === 'transport-heartbeat') {
    agent.lastTransportHBTime = signalTime;
  } else {
    // signalKind in {pulse-response, tool-call, thread-reply, message-ack}
    agent.lastCognitiveSignalTime = signalTime;
  }

  // 2. Compute TTLs (eager; persisted)
  agent.transportTTL = secondsBetween(now(), agent.lastTransportHBTime);
  agent.cognitiveTTL = secondsBetween(now(), agent.lastCognitiveSignalTime);

  // 3. Derive component states
  agent.transportLivenessState = deriveLivenessState(agent.transportTTL, COGNITIVE_STALE_THRESHOLD);
  agent.cognitiveLivenessState = deriveLivenessState(agent.cognitiveTTL, COGNITIVE_STALE_THRESHOLD);

  // 4. Derive composite (per §3.1 rules)
  agent.livenessState = deriveComposite(agent.cognitiveLivenessState, agent.transportLivenessState);

  // 5. Atomic write
  await agentStore.put(agent);
}

function deriveLivenessState(ttl: number, threshold: number): LivenessState {
  if (ttl === undefined) return 'unknown';
  return ttl >= threshold ? 'unresponsive' : 'alive';
}
```

**Constants:**
- `COGNITIVE_STALE_THRESHOLD = 60` (seconds; per Q4=b)
- `TRANSPORT_STALE_THRESHOLD = 60` (seconds; same threshold; rationale: transport HB cadence is 30s, so 2× cadence threshold = 60s tolerance for one missed HB)

**Sweeper concern:** TTL values stored on Agent record become stale between writes. Per F1 audit-flag write-amplification: ~7 writes/min/agent under engagement is acceptable; reads return cached values which may be a few seconds stale (negligible relative to 60s threshold). At read-time, consumers can optionally recompute fresh TTL = `now - lastSignalTime` if precision matters; default reads use cached values.

**Architect-flag F1 (audit):** at scale-out (10+ agents under sub-second cognitive activity), eager-write path may need batching. Phase 4 Design notes this as forward-flag per AG-5; v1 ships eager-write-on-event.

### §3.3 Adapter Kernel transport heartbeat

**Per Q4=b cadence + macro-architecture (Adapter Kernel owner; periodic Client→Hub).**

**Location:** `packages/network-adapter/src/kernel/transport-heartbeat.ts` (NEW; ~50 lines)

**Mechanism:**
- Adapter Kernel starts a recurring timer at agent-startup (post-handshake)
- Timer fires every 30s
- On fire: invoke Hub's `transport_heartbeat` MCP tool (NEW; ~20 lines Hub-side)
- Tool payload: empty (just the call counts as the heartbeat; no body needed)
- Hub-side handler: marks `lastTransportHBTime = now()` for the calling agent
- On adapter shutdown: clear timer (no farewell HB; Hub infers via TTL expiry)

**Configuration:**
- `transportHeartbeatIntervalSeconds` env var (default: 30) — Adapter Kernel reads at startup; configurable per-agent if needed
- `transportHeartbeatEnabled` env var (default: true) — disable for testing or special-purpose agents

**MCP tool registration:**
- New tool: `transport_heartbeat` registered on Hub PolicyRouter at engineer-pool surface (since Adapter Kernel runs as engineer-class shim from Hub's perspective)
- **Note:** this adds 1 to PolicyRouter tool count; mission-72 snapshot test absorbs it (sorted-tool-name list updated; no count assertion to bump)
- Per-mission permission: implicit (any registered agent can call it for self)

**Failure mode:**
- HB call fails (network blip): retry once with 5s backoff; if still fails, skip this cycle; next cycle attempts again
- Hub returns error (e.g., agent not registered): log warning; do NOT retry indefinitely; suggests agent re-registration needed

### §3.4 PulseSweeper extension (per-agent pulse via NULL mission binding)

**Per Q3=c reuse + NULL mission binding.**

**Location:** `hub/src/services/pulse-sweeper.ts` (existing; +30 lines for new pulse-class)

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

**Suppression discipline (per F2 audit-flag):**

`agentPulse` fires for agent X if AND ONLY IF:
- `agent.pulseConfig.enabled === true`
- AND no active mission has agent X in its pulse-binding (i.e., no mission where `mission.status === 'active'` AND agent X appears in `mission.assignedEngineerId` OR `mission.architectId`)

Pseudocode:
```typescript
async function shouldFireAgentPulse(agentId: string): Promise<boolean> {
  const agent = await agentStore.get(agentId);
  if (!agent.pulseConfig?.enabled) return false;

  // Suppression: skip if any active mission already pulses this agent
  const activeMissions = await missionStore.list({ status: 'active' });
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

**Edge cases (per F2 audit-flag):**
- Agent on multiple active missions (multi-engagement) → suppressed (any active mission suppresses)
- Agent on completed mission with lingering pulse-config → not suppressed (only `status: 'active'` missions suppress)
- New agent registration with no pulse-config → defaults applied at registration time

### §3.5 Cognitive-staleness threshold logic

**Per Q4=b (60s threshold) + cognitive-heartbeat composition (composite freshness).**

`cognitiveTTL` is computed from `lastCognitiveSignalTime`, which is updated on ANY of:

| Signal source | Hub-side trigger |
|---|---|
| pulse-response (mission OR per-agent) | `claim_message` OR `ack_message` for a pulse Message |
| tool-call (any MCP tool invocation) | Tool dispatcher entry |
| thread-reply (`create_thread_reply`) | Reply handler entry |
| message-ack (`ack_message` for non-pulse messages) | Ack handler entry |

**Architect-flag F3 (audit) — cognitive-stale threshold against engagement patterns:**

The 60s threshold means: "no cognitive signal in 60s" → `cognitivelyStale`. Concern: long-thinking-no-tool-call period for >60s would trip cognitive-stale even though agent is demonstrably alive (e.g., LLM in 90s deep reasoning loop without intermediate tool calls).

**Phase 4 Design open question:** is the 60s threshold load-bearing, OR should we widen to e.g., 120s or 180s for "real" cognitive-stale? Engineer-audit consideration: empirical observation of typical cognitive-signal cadence under engagement (tool-calls during active work tend to fire every 5-30s; long-thinking >60s is rare but possible).

**Architect-recommendation:** ship with 60s threshold for v1; instrument cognitive-stale-fire rate post-deployment; if false-positive rate is high, raise to 120s in follow-on. NOT blocking this mission's ship.

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

**Implementation:**
- `scripts/local/get-agents.sh` updates column header + tpl/jq projection
- Per memory `reference_prism_table_pattern.md`: prism.sh + buildTable + tpl/.jq pattern preserved
- New tpl entry per column (or single column-projection update)

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

**Consumer-update opportunism:**
Existing `livenessState` consumers in:
- `hub/src/policy/router.ts` (PolicyRouter routing decisions; reads `livenessState` for selectAgents predicates)
- `hub/src/services/escalation-trigger.ts` (escalation-on-unresponsive logic)
- Other downstream code reading `livenessState`

**Phase 4 Design open question (carry from envelope §1.Q2 interpretation):** should consumers be updated to reference granular fields (cognitiveLivenessState / transportLivenessState) in the same PR, OR remain on composite `livenessState` indefinitely?

**Architect-recommendation:** update where finer-grained access provides value. E.g., escalation-trigger may want cognitive-vs-transport differentiation (different remediation paths per macro-architecture); PolicyRouter routing may stay on composite. Engineer-audit ask: identify consumer-by-consumer which benefit from update.

**No schema-rename migration script needed** per Q1=cd retains composite; nothing being renamed; only added.

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

### §5.4 F4 (MINOR) — Composite derivation rules

**§3.1 specifies truth table:** conservative `unknown` rule when either component is unknown.

**Engineer-audit ask (F4):** validate truth table; flag edge cases §3.1 missed.

### §5.5 F5 (PROBE) — Per-agent pulse cadence specific number

**Survey-deferred** to Phase 4 Design picks. Range constraint: ≥30min per Q4 ratio; ≤120min per "death-detection slow-but-cheap".

**Architect-recommendation:** 60min default. Configurable per Agent record at registration time + Hub-side mutator.

**Engineer-audit ask (F5):** what cadence does engineer-substrate intuition support; consider real-world cost (token responses every 60min × N agents = baseline overhead); 30min vs 60min vs 120min trade-off.

---

## §6 Test / verification strategy

### §6.1 Hub-side tests (vitest)

- `hub/test/services/agent-store.test.ts` — extend with 5-field schema delta tests (composite derivation; eager TTL computation; component states)
- `hub/test/services/pulse-sweeper.test.ts` — NEW tests for agentPulse class + NULL mission binding suppression rule (multi-engagement edge case; completed mission edge case)
- `hub/test/policy/transport-heartbeat-tool.test.ts` — NEW tests for `transport_heartbeat` MCP tool (registration; signal arrival; TTL update)
- `hub/test/e2e/e2e-foundation.test.ts` — snapshot test absorbs new tool name in sorted list (mission-72 pattern)

### §6.2 Adapter Kernel tests

- `packages/network-adapter/test/kernel/transport-heartbeat.test.ts` — NEW tests for HB timer (start/stop; cadence; retry-on-failure)

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

### §7.3 Content map (single mega-PR; Option A default)

| File | Change | Lines (est.) |
|---|---|---|
| `docs/surveys/m-ttl-liveliness-design-survey.md` | Phase 3 envelope (already committed `f68e23b`) | +359 |
| `docs/designs/m-ttl-liveliness-design-design.md` | This Design v0.1 → v1.0 | +700 |
| `hub/src/entities/agent.ts` | 5-field schema delta + 2 supporting fields | +30 |
| `hub/src/services/agent-store.ts` | Eager TTL computation + composite derivation | +80 |
| `hub/src/policy/router.ts` | Register `transport_heartbeat` MCP tool | +20 |
| `hub/src/services/pulse-sweeper.ts` | agentPulse extension + NULL mission binding suppression | +60 |
| `hub/src/handlers/transport-heartbeat-handler.ts` | NEW | +30 |
| `hub/test/services/agent-store.test.ts` | Schema delta tests + eager TTL + composite | +120 |
| `hub/test/services/pulse-sweeper.test.ts` | agentPulse + suppression edge cases | +80 |
| `hub/test/policy/transport-heartbeat-tool.test.ts` | NEW; tool tests | +60 |
| `hub/test/e2e/e2e-foundation.test.ts` | Snapshot test absorbs new tool | ±5 |
| `packages/network-adapter/src/kernel/transport-heartbeat.ts` | NEW; client-side timer | +50 |
| `packages/network-adapter/src/kernel/index.ts` | Wire transport-heartbeat into kernel startup | +10 |
| `packages/network-adapter/test/kernel/transport-heartbeat.test.ts` | NEW; timer tests | +80 |
| `scripts/local/get-agents.sh` | Column refactor (COG_TTL + TRANS_TTL) | +10 / -5 |
| `scripts/local/tpl/agents.jq` | Column projection update | +5 / -3 |
| `scripts/local/test-get-agents-cli.sh` | Smoke-test extension | +30 |
| `docs/missions/m-ttl-liveliness-design-preflight.md` | Phase 6 preflight | +120 |
| `docs/traces/m-ttl-liveliness-design-architect-trace.md` | Phase 8/9/10 work-trace | +200 |

**Total est.** ~2050 lines net addition. Single squash-merge PR (Option A).

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
- **Substrate to extend:**
  - `hub/src/entities/agent.ts` (Agent record schema)
  - `hub/src/services/agent-store.ts` (TTL computation + composite derivation)
  - `hub/src/services/pulse-sweeper.ts` (agentPulse extension)
  - `hub/src/policy/router.ts` (transport_heartbeat tool registration)
  - `packages/network-adapter/src/kernel/` (transport-HB timer; NEW)
  - `scripts/local/get-agents.sh` + `tpl/agents.jq` (CLI column refactor)
- **Compressed-lifecycle precedent:** mission-67/68/69 substrate-introduction + mission-70/72/73/74 small-mission cleanup-wave precedents
- **Memory references:**
  - `reference_prism_table_pattern.md` — informed §3.6 CLI column projection
  - `feedback_schema_rename_requires_state_migration.md` — informed Q2 migration NOT applying (additive not rename)
  - `feedback_compressed_lifecycle_preflight_currency_checks.md` — applies at Phase 6 preflight
  - `feedback_design_phase_lib_extraction_for_substrate_bash.md` — applies if Adapter Kernel transport-HB warrants lib-extraction at Design phase (testability)

---

— Architect: lily / 2026-05-04 (Phase 4 Design v0.1 DRAFT; pending engineer round-1 audit per `mission-lifecycle.md` Phase 4 audit cycle)
