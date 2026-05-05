---
mission-name: M-TTL-Liveliness-Design
source-idea: idea-225
methodology-source: docs/methodology/idea-survey.md v1.0
director-picks:
  round-1:
    Q1: cd
    Q1-rationale: maximal-information schema — composite + 2 component-states + 2 raw TTLs all exposed; legacy convenience + advanced-consumer composability + threshold-flexibility
    Q2: a
    Q2-rationale: big-bang single-PR migration; additive not breaking (composite retained per Q1c); no schema-rename migration script needed; tele-7 clean-state
    Q3: c
    Q3-rationale: reuse PulseSweeper with NULL mission binding; suppression discipline = "skip if any active mission already pulses this agent"; minimal new substrate; tele-3 + tele-11
  round-2:
    Q4: b
    Q4-rationale: standard cadences — transport HB 30s + cognitive-stale threshold 60s (2× ratio); balanced; bounds constraint hierarchy transport (30s) << cognitive (60s) << mission pulse (600s+) << per-agent pulse (≥30min)
    Q5: a
    Q5-rationale: eager TTL recomputation on signal-arrival; persisted on Agent record; reads return cached value; trade write-amplification for read-cheapness; manageable at current scale
    Q6: a
    Q6-rationale: raw-seconds CLI rendering; pipe-friendly numeric output; matches established CLI idiom (prism.sh + buildTable pattern; mission-72 PolicyRouter snapshot test aesthetic)
mission-class: substrate-introduction
tele-alignment:
  primary: [tele-7, tele-2]
  secondary: [tele-3, tele-12, tele-11]
  round-1:
    primary: [tele-3]
    secondary: [tele-2, tele-7]
  round-2:
    primary: [tele-7]
    secondary: [tele-12, tele-11]
anti-goals-count: 8
architect-flags-count: 5
skill-meta:
  skill-version: survey-v1.2
  tier-1-status: implemented
  tier-2-status: stubbed
  tier-3-status: stubbed
calibration-data:
  director-time-cost-minutes: 6
  comparison-baseline: mission-71 Survey envelope (idea-230; 2nd-canonical Skill-mechanized Survey execution)
  notes: |
    Third-canonical Skill-mechanized Survey execution (mission-69 = 1st; mission-71 = 2nd; this = 3rd).

    Pattern: Director-pre-ratified macro-architecture before Survey. Director-architect bilateral conversation co-designed the macro-architecture (transport HB owner, cognitive-heartbeat composition, hybrid γ pulse architecture, cadence relationship, CLI surface mandate) PRE-Survey; Survey then probed only OPEN dimensions (cadences, schema decomposition, migration, per-agent pulse mechanism, CLI render, Hub-side TTL strategy). Director-direct "I still want a full survey" preserved 6-question discipline despite pre-ratification. Methodology-evolution observation: when Director-pre-ratification is substantial, Round-1 anchors at HIGHEST-LEVEL HOW (architectural-decision tier) rather than WHY/WHO/WHEN — the standard round-1-template framing assumes WHY/WHO/WHEN are open, but pre-ratified missions already have those. Forward-pattern label: "Survey-after-architecture-pre-ratify" — useful when architect-Director bilateral has already settled macro decisions before Phase 3 entry.

    Maximal-information-schema choice (Q1=cd) — rare multi-pick into both state-judgments AND raw-data; reflects "consumer chooses granularity" principle. Forward-pattern label: "schema-maximal-exposure-for-unknown-future-consumer-set" — useful when consumer set is not fully enumerable at Design time.

    Mechanical-engineering aesthetic across Round-2 picks — standard cadences (Q4b) + eager-write (Q5a) + raw-seconds CLI (Q6a) all chose simplicity over fancy. Round-2 picks composed coherently into low-substrate-complexity profile. Forward-pattern label: "mechanical-engineering-aesthetic" — when Round-2 specifics consistently choose plumbing-grade over UX-grade, the mission's aesthetic is "scriptable substrate" not "operator UX".

    Director-flagged 2026-05-03 (this Survey): notes ARE captured in envelope §calibration per §15 schema, BUT not consumed downstream effectively. Notes live in envelope artifact (queryable by future Survey-Skill comparison-baseline) but DON'T feed cross-Survey pattern aggregation, memory entries, calibration ledger, or strategic-review state surface. Methodology-evolution candidate: "notes-aggregation Skill" or strategic-review-state notes-rollup that surfaces patterns across Surveys for downstream consumption. Self-referential observation: this very note documents the gap.

    **Validator-multi-pick bug caught at finalize-gate (3rd-canonical Survey-Skill execution):** `skills/survey/scripts/validate-envelope.sh` line 90 regex `^[a-d]$` rejects multi-pick values like `Q1=cd`, but `idea-survey.md` §6 explicitly states "multi-pick is always supported at Director's discretion." Validator's single-letter constraint contradicts methodology spec. Envelope IS structurally valid per §15 schema; validator is the bug. **Forward-pattern label:** "Skill-validator-vs-methodology-spec-divergence" — Skill mechanism over-constrains relative to methodology source-of-truth; bilateral audit at Skill-implementation time should grep methodology-spec for "multi-pick" / "Director discretion" / similar permissive clauses + verify validator allows them.

    Survey methodology itself NOT modified per AG-9 carve-out from mission-69. Skill-validator fix filed as separate follow-on idea (architect-Director-bilateral) per mission-72/73 precedent pattern of "memory-tier-to-methodology-tier graduation" — in this case "validator-mechanism-tier-to-methodology-conformance graduation".
contradictory-constraints:
  # No contradictory multi-pick detected this Survey; section omitted per §15 schema
calibration-cross-refs:
  closures-applied: []
  candidates-surfaced:
    - survey-after-architecture-pre-ratify-pattern-class
    - schema-maximal-exposure-for-unknown-future-consumer-set
    - mechanical-engineering-aesthetic-class
    - survey-notes-aggregation-downstream-consumption-gap
    - survey-skill-validator-multi-pick-bug-mechanism-vs-methodology-divergence
---

# M-TTL-Liveliness-Design — Phase 3 Survey envelope

**Methodology:** `docs/methodology/idea-survey.md` v1.0 (3+3 Director-intent pick-list)
**Source idea:** idea-225
**Mission-class candidate:** substrate-introduction (Hub schema decomposition + Adapter Kernel transport heartbeat + PulseSweeper extension + CLI surface refactor; multi-substrate scope)
**Branch:** `agent-lily/m-ttl-liveliness-design` (push pre-bilateral round-1 audit per calibration #59 closure mechanism (a))

---

## §0 Context

idea-225 (M-TTL-Liveliness-Design — Adapter Healthcheck vs Agent Activity-Tracking) Director-flagged 2026-04-29 as companion to idea-224 (M-Pulse-Mechanism-Phase-2; mission-68 closed). Triaged via route-(a) skip-direct 2026-05-02 (5 criteria PASS). Sister to mission-68 + composes with mission-66 W4 observability work.

**Concrete data point surfaced 2026-05-02:** `scripts/local/get-agents.sh` shows `liveness_state: unresponsive` despite `activity_state: online_idle` for an agent demonstrably typing through the architect session. The conflation between transport-vs-cognitive signals surfaces incorrect inference. Verified during architect-Director conversation that the system has NO explicit transport heartbeat today — `liveness_state` is computed entirely from cognitive-activity-derived signals with a TTL-staleness window.

**Director-ratified macro-architecture (2026-05-02 architect-Director bilateral; pre-Survey):** transport heartbeat owned by Adapter Kernel (NOT Transport module); periodic Client→Hub; Hub-side TTL count. Cognitive heartbeat = composite freshness across {pulse-response, tool-call, thread-reply, message-ack}. Hybrid (γ) pulse architecture: mission pulses dominate during engagement; per-agent pulse fills the between-mission gap; per-agent pulse cadence > mission pulse cadence (mission = engagement-detection fast; per-agent = death-detection slow-but-cheap). CLI surface mandate: `get-agents.sh` adds Cognitive-TTL + Transport-TTL columns; replaces existing `LIVENESS_STATE` where correct.

**Director directive 2026-05-02:** full Survey requested even though macro-architecture is pre-ratified. Survey probes the OPEN dimensions only — schema decomposition, migration path, per-agent pulse mechanism, cadences, thresholds, CLI render specifics, Hub-side TTL strategy. Methodology anchor: `docs/methodology/idea-survey.md` v1.0 + AG-9 carve-out (Survey methodology itself NOT modified).

---

## §questions — Question text dispatched to Director

Recorded for envelope self-containment + format-pick-presentation rendering. Standard question shape per `round-1-template.md` + `round-2-template.md`.

**Q1 — Schema decomposition:** how should the Hub Agent record EXPOSE liveness?

- (a) Single composite field — keep `livenessState: alive | unresponsive | unknown` only; Hub computes internally; consumers don't see components
- (b) Two separate state-fields — `cognitiveLivenessState` + `transportLivenessState`; remove composite
- (c) Three fields (composite + components) — composite as legacy convenience; components for advanced consumers
- (d) TTL-as-data — `cognitiveTTL: <seconds>` + `transportTTL: <seconds>` raw values; consumers compute their own state-judgment

**Q2 — Migration approach for existing `livenessState` consumers:**

- (a) Big-bang — schema change ships in one PR; all consumers updated simultaneously; deployment-risk accepted
- (b) Gradual / parallel-then-cutover — keep old `livenessState` + add new fields; consumers migrate over multiple PRs; deprecate after soak (~2 days)
- (c) Compatibility shim (forever) — old field stays as derived-from-new; never deprecated
- (d) Schema-rename migration — explicit state-migration script per `feedback_schema_rename_requires_state_migration.md`

**Q3 — Per-agent pulse mechanism architecture:**

- (a) Extend PulseSweeper with new pulse-class (`agentPulse` parallel to `engineerPulse`/`architectPulse`)
- (b) New separate sweeper for per-agent pulses; isolated from mission-pulse infrastructure
- (c) Reuse existing pulse infrastructure with NULL mission binding; suppression rule = "skip if any active mission already covers this agent"
- (d) No per-agent pulse mechanism — drop hybrid (γ); cognitive-liveness from composite freshness only

**Q4 — Transport heartbeat cadence + cognitive staleness threshold (paired numerics):**

- (a) Tight — transport HB 10s + cognitive-stale 30s (3×)
- (b) Standard — transport HB 30s + cognitive-stale 60s (2×); matches typical microservices heartbeat cadence
- (c) Conservative — transport HB 60s + cognitive-stale 120s (2×)
- (d) Defer to Phase 4 Design with relative-ordering constraint (transport HB ≤ mission-pulse-interval; cognitive-stale ≥ 2×transport-HB)

**Q5 — Hub-side TTL computation strategy:**

- (a) Eager — TTL recomputed on signal-arrival; persisted on Agent record; cached reads
- (b) Lazy — only `lastSignalTime` stored; TTL computed at read-time as `now - lastSignalTime`
- (c) Hybrid — `lastSignalTime` stored + lazy raw values + eager state-transitions
- (d) Push-based — Hub publishes TTL-state-change events; consumers cache locally

**Q6 — CLI render specifics for `get-agents.sh`:**

- (a) Raw seconds — `cognitiveTTL: 245` `transportTTL: 12` (numeric)
- (b) Human-readable — `cognitiveTTL: 4m5s` `transportTTL: 12s` (formatted)
- (c) Color-coded staleness — green/yellow/red ANSI; human-readable text
- (d) Hybrid auto-detect — color-coded human-readable when TTY; raw numeric when piped; `--raw` flag

---

## §1 Round 1 picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q1 — Schema decomposition | **cd** maximal-information schema | All 5 fields exposed (composite + 2 component-states + 2 raw TTLs); legacy convenience + advanced-consumer composability + threshold-flexibility |
| Q2 — Migration approach | **a** big-bang single-PR | Additive not breaking (composite retained per Q1c); no schema-rename ceremony; tele-7 clean-state |
| Q3 — Per-agent pulse | **c** reuse PulseSweeper + NULL mission binding | Suppression rule = skip-if-active-mission; minimal new substrate; reuse existing infrastructure |

### §1.Q1 — Per-question interpretation

Director's **(c)+(d) multi-pick** read against **Original Idea** (CLI mandate for Cognitive-TTL + Transport-TTL columns; idea-225 §"Schema decomposition" open dimension) + **Tele-mapping** (tele-2 isomorphic-specification — separate concerns get separate fields; tele-3 sovereign-composition — schema must compose for unknown future consumers) + **Aggregate-Surface** (Q2=a big-bang migration favors clean additive schema; Q3=c reuse-infrastructure favors minimal-substrate-with-rich-data): the Hub Agent record gets **5 liveness-related fields exposed** —

| Field | Type | Audience |
|---|---|---|
| `livenessState` | composite enum (`alive\|unresponsive\|unknown`) | Legacy convenience; PolicyRouter routing decisions; existing consumers |
| `cognitiveLivenessState` | component enum | Advanced consumers needing cognitive-vs-transport differentiation |
| `transportLivenessState` | component enum | Advanced consumers (escalation triggers; reconnect logic) |
| `cognitiveTTL` | seconds (raw) | Threshold-flexible consumers; CLI columns; observability |
| `transportTTL` | seconds (raw) | Threshold-flexible consumers; CLI columns; observability |

**Rules-out (a) composite-only** (too narrow; CLI mandate violated) **and (b) components-only** (no legacy convenience surface; breaks existing consumers without need). Director chose **maximal exposure** — Hub computes all derivations internally + exposes everything; consumers pick granularity.

### §1.Q2 — Per-question interpretation

Director's **(a)** read against **Q1=cd context**: since `livenessState` composite is RETAINED per Q1(c), the migration becomes **additive** — single PR adds 4 new fields without breaking any existing consumer reading the composite. **No deprecated-field-lingering, no soak window, no schema-rename-migration script needed** — `feedback_schema_rename_requires_state_migration.md` doesn't apply because nothing is being renamed; only added.

Read against **Tele-mapping** (tele-7 resilient-operations — clean state; tele-2 isomorphic-spec — single-version atomic transition) + **Aggregate-Surface** (Q1c retains composite → no breaking change → big-bang is safe; Q3c reuses infrastructure → no migration ceremony for pulse-mechanism either).

**Phase 4 Design clarification candidate:** should downstream consumers (PolicyRouter routing decisions, escalation triggers) be UPDATED to reference granular fields in the same PR, OR remain on composite indefinitely? Q2(a) implies "in same PR where it matters"; soft answer is "update only where finer-grained access provides value; legacy stays untouched".

### §1.Q3 — Per-question interpretation

Director's **(c)** read against **Original Idea** (hybrid γ architecture; per-agent pulse fills between-mission gap) + **Tele-mapping** (tele-3 sovereign-composition — reuse existing infrastructure; tele-11 cognitive-minimalism — minimal new substrate) + **Aggregate-Surface** (Q1cd maximal-schema doesn't require new pulse infrastructure; Q2a big-bang doesn't require new substrate either): per-agent pulse fires through existing **PulseSweeper** with **NULL mission binding** — suppression rule = "skip if any active mission already pulses this agent". New config field on Agent record (per-agent pulse cadence; defaults TBD at Round-2; ratified at Phase 4 Design).

**Mechanism:**
- When agent enters active mission → mission pulses dominate; per-agent pulse skipped
- When agent leaves mission engagement → per-agent pulse fires at slow cadence
- New PulseSweeper dispatch-logic: mission-pulse vs agent-pulse selection (small addition; well-tested via vitest)

**Rules-out (a) extend-with-new-class** (heavier substrate; new pulse-config field per Agent + new sweeper logic) **and (b) new-separate-sweeper** (over-engineered) **and (d) no-mechanism** (breaks idle-but-alive detection between missions; loses hybrid γ value).

**Round-1 composite read:** maximal-information schema (composite + 2 component-states + 2 raw TTLs all exposed) + big-bang single-PR additive migration (composite field retained; no breaking change; no migration script) + reuse PulseSweeper with NULL mission binding for per-agent pulse (suppression composes with existing infrastructure). Bounds Phase 4 Design to **a substrate-introduction mission with minimal new code and maximal schema-information-density**.

---

## §2 Round 2 picks

| Q | Pick | Director-intent reading (1-line summary) |
|---|---|---|
| Q4 — Cadences | **b** standard 30s/60s (2× ratio) | Transport HB 30s + cognitive-stale 60s; balanced; matches microservices idiom; bounds constraint hierarchy |
| Q5 — Hub-side TTL | **a** eager + persisted | TTL recomputed on signal-arrival; cached on Agent record; trade write-amp for read-cheap |
| Q6 — CLI render | **a** raw seconds | Pipe-friendly numeric output; matches prism.sh + mission-72 snapshot-test aesthetic |

### §2.Q4 — Per-question interpretation

Director's **(b)** read against **Original Idea** (open dimension; no specific cadence anchored) + **Round-1 carry-forward** (Q3=c reuse PulseSweeper; mission pulses 600s/1200s already ratified per idea-224/mission-68; per-agent pulse > mission cadence per architecture) + **Round-2 tele-mapping** (tele-7 + tele-11) + **Aggregate-Surface** (Q5a eager + Q6a raw align with low-overhead cadence).

The **2× ratio** (cognitive-stale = 2× transport HB) means a single missed transport HB doesn't trip cognitive-stale; only sustained absence does. This bounds the constraint hierarchy:

```
transport HB (30s)  <<  cognitive-stale (60s)  <<  mission pulse (600s+)  <<  per-agent pulse (≥30min)
       ↓                       ↓                            ↓                           ↓
   mechanical             derived (2×)                 existing                    derived (≥30×)
```

Each layer 10-30× slower than previous; clean cost-vs-detection trade per layer. Phase 4 Design picks specific per-agent-pulse number (60min reasonable default per idea-225 candidate range).

### §2.Q5 — Per-question interpretation

Director's **(a)** read against **Original Idea** ("eager vs lazy" open dimension) + **Round-1 carry-forward** (Q1cd maximal-schema → 2 raw TTL fields need cheap reads for CLI + PolicyRouter routing) + **Round-2 tele-mapping** (tele-3 + tele-7) + **Aggregate-Surface** (Q4b 30s HB → write-amplification ~7 writes/min/agent under engagement; manageable at current scale).

Trade: write-amplification accepted for read-cheapness. CLI invocations + PolicyRouter routing decisions read cached values; no arithmetic at read-time; consistent point-in-time TTL values across consumers.

**Rules-out (b) lazy** (more reads than writes profile; arithmetic each read), **(c) hybrid** (over-engineered for current scale), **(d) push-based** (substrate complexity not warranted).

**Architect-flag for Phase 4 Design (forward-flag, NOT immediate concern):** write-amplification at scale — if agent population grows to 10+ with sub-second cognitive activity, eager-write path may need batching. Phase 4 Design notes this as forward-flag, not Phase 1 work.

### §2.Q6 — Per-question interpretation

Director's **(a)** read against **Original Idea** (CLI surface mandate; new columns Cognitive-TTL + Transport-TTL) + **Round-1 carry-forward** (Q1cd raw TTLs exposed in schema → CLI passes through directly) + **Round-2 tele-mapping** (tele-12 + tele-11) + **Aggregate-Surface** (Q5a eager-cached → consistent values; Q4b 30s/60s cadences → numeric values small enough to read at-glance).

`cognitiveTTL: 245` `transportTTL: 12` — numeric only; deterministic; pipe-friendly (`awk`, `sort -k`, etc.). Operator does mental conversion (245s ≈ 4m5s).

Aligns with established CLI idiom (memory `reference_prism_table_pattern.md` — `prism.sh + buildTable` column-based numeric output) + mission-72 PolicyRouter snapshot test (deterministic pipe-friendly aesthetic).

**Rules-out (b) human-readable** (harder grep/sort), **(c) color-coded** (ANSI escapes break piping), **(d) hybrid auto-detect** (over-engineered).

**Round-2 composite read:** standard cadences (30s/60s, 2× ratio) + eager-cached Hub-side TTL (write-amp accepted for read-cheap) + raw-seconds pipe-friendly CLI. Three picks compose into a **mechanical-engineering aesthetic**: write-on-event substrate + numeric cached fields + scriptable CLI.

---

## §3 Composite intent envelope

The mission ships TTL-liveliness redesign with these load-bearing constraints (matrix-solved across both rounds):

1. **Maximal-information schema** — 5 liveness fields exposed (composite + 2 component-states + 2 raw TTLs); Hub computes all derivations; consumers pick granularity (Q1=cd)
2. **Big-bang additive migration** — single PR adds 4 new fields; composite retained; no breaking change; no schema-rename ceremony (Q2=a)
3. **Reuse PulseSweeper** — per-agent pulse via NULL-mission-binding; suppression discipline = "skip if any active mission already pulses this agent"; minimal new substrate (Q3=c)
4. **Standard cadences** — transport HB 30s + cognitive-stale 60s (2× ratio); per-agent pulse ≥30min (Phase 4 Design picks specific number; 60min reasonable default) (Q4=b)
5. **Eager Hub-side TTL** — write-on-event; persisted on Agent record; reads return cached values; trade write-amplification for read-cheapness (Q5=a)
6. **Raw-seconds CLI** — `cognitiveTTL: 245` `transportTTL: 12` numeric; pipe-friendly; matches prism.sh + mission-72 snapshot-test aesthetic (Q6=a)

Phase 4 Design v0.1 concretizes each constraint into specific schema deltas + Adapter Kernel transport-HB implementation + PulseSweeper extension + `get-agents.sh` CLI refactor + migration sequencing + cadence numerics + forward-flags. **Mechanical-engineering aesthetic across all 6 picks** — write-on-event substrate + numeric cached fields + scriptable CLI; no operator-UX ceremony at this layer.

---

## §4 Mission scope summary

| Axis | Bound |
|---|---|
| Mission name | M-TTL-Liveliness-Design |
| Mission class | substrate-introduction (multi-substrate; Hub schema + Adapter Kernel + PulseSweeper + CLI; possibly methodology) |
| Substrate location | `hub/src/` (Agent record + selectAgents) + `packages/network-adapter/src/` (Adapter Kernel transport HB) + `scripts/local/get-agents.sh` (CLI) + possibly `docs/methodology/entity-mechanics.md` (vocabulary clarification) |
| Primary outcome | Hub Agent record exposes 5 liveness fields (composite + 2 component-states + 2 raw TTLs); Adapter Kernel sends transport HB at 30s; PulseSweeper extended with per-agent pulse via NULL-mission-binding suppression; CLI renders raw-seconds Cognitive-TTL + Transport-TTL columns |
| Secondary outcomes | Methodology-doc updates if needed (entity-mechanics.md liveness vocabulary); forward-flag for write-amplification-at-scale; Phase 4 Design picks per-agent-pulse cadence numeric |
| Tele alignment (primary, whole-mission) | tele-7 (Resilient Agentic Operations); tele-2 (Isomorphic Specification) |
| Tele alignment (secondary, whole-mission) | tele-3 (Sovereign Composition); tele-12 (Precision Context Engineering); tele-11 (Cognitive Minimalism) |
| Tele alignment (Round-1) | primary: tele-3; secondary: tele-2, tele-7 |
| Tele alignment (Round-2) | primary: tele-7; secondary: tele-12, tele-11 |

---

## §5 Anti-goals (out-of-scope; deferred)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Don't redesign pulse mechanism itself (mission-68 closed; idea-224 sister scope; this mission CONSUMES pulses) | n/a — explicitly out-of-scope |
| AG-2 | Don't change adapter Transport-module surface (separation of concerns; transport stays plumbing per Director-ratified architecture 2026-05-02) | n/a — explicitly out-of-scope |
| AG-3 | Don't add new liveness-related fields beyond 5-field schema (composite + 2 components + 2 raw TTLs) + activity-state preservation | future idea (TBD; e.g., engagement-state, work-state) |
| AG-4 | Don't migrate `livenessState` consumers wholesale in this mission's first PR (composite retained per Q1c; consumers update opportunistically where finer-grained access provides value) | M6 fold-pattern OR sequential PRs if consumer-update sub-PRs surface |
| AG-5 (NEW from Survey Q5a) | Don't implement write-batching for eager TTL writes in this mission (forward-flag noted; defer to follow-on if scale warrants — e.g., 10+ agents with sub-second cognitive activity) | follow-on idea (TBD; trigger = scale event) |
| AG-6 (NEW from Survey Q6a) | Don't add color/formatting/auto-detect to CLI render in this mission (raw-seconds numeric only; defer enrichment to follow-on idea if operator-UX warrants) | follow-on idea (TBD; trigger = operator complaint or UX reframe) |
| AG-7 (NEW from Survey) | Don't extend per-agent-pulse to Director role in this mission (engineer + architect roles only; Director-role pulse cadence TBD per future-canonical instance) | future idea (TBD; Director-role-engagement scope) |
| AG-8 (NEW from Survey) | Don't formalize Adapter-Kernel-vs-Transport-Module separation in methodology doc as part of this mission (architectural direction Director-ratified 2026-05-02; methodology codification deferred per AG-9 carve-out from mission-69 — Survey methodology not modified by this mission) | future-canonical instance (when 2nd mission needs the same separation framing) |

---

## §6 Architect-flags / open questions for Phase 4 Design round-1 audit

Architect-flags batched for engineer's round-1 content-level audit (per mission-67/68/69/71 audit-rubric precedent: CRITICAL / MEDIUM / MINOR / PROBE classifications). Each flag carries an architect-recommendation to challenge.

| # | Flag | Architect-recommendation |
|---|---|---|
| F1 (CRITICAL) | Write-amplification at scale — eager TTL writes mean every transport HB + cognitive signal triggers Agent-record write. At 30s HB cadence × 2 agents = 4 writes/min just from transport; add cognitive signals = ~10-14 writes/min. Manageable now; at 10+ agents under sub-second activity, may need batching | Phase 4 Design notes write-amplification headroom + scale-out path; v1 ships eager-write-on-event; AG-5 anti-goal blocks batching in this mission. **Engineer-audit ask:** validate write-amp doesn't trip Agent-record contention or storage-provider write-throughput limits at current scale |
| F2 (MEDIUM) | Suppression-discipline correctness — PulseSweeper "skip if any active mission already pulses this agent" — what counts as "active mission already pulses"? Edge cases: agent on multiple active missions (multi-engagement); agent on completed mission with lingering pulse-config (post-completion edge) | Phase 4 Design specifies suppression rule precisely: `mission.status=active AND (agent.id IN mission.assignedEngineerId OR mission.architectId)`. Edge cases enumerated in §5.1 of Design. **Engineer-audit ask:** validate suppression rule semantics; flag edge cases Phase 4 missed |
| F3 (MEDIUM) | Cognitive-stale threshold against engagement patterns — 60s threshold means "no cognitive signal in 60s" → cognitively-stale. But cognitive sources are heterogeneous: pulse-response (mission cadence 600s/1200s), tool-call (sub-second to minutes), thread-reply (minutes to hours), message-ack (seconds). Long-thinking-no-tool-call period for 70s would trip cognitive-stale even though demonstrably alive | Phase 4 Design validates 60s threshold against engagement patterns; documents which signal sources reset freshness; possibly adds "any cognitive signal in last N seconds" semantics over "single-source TTL". **Engineer-audit ask:** validate threshold doesn't fire false-positive under normal engagement |
| F4 (MINOR) | Composite `livenessState` derivation rules — from 2 component states. Edge: cognitive=alive + transport=unknown (e.g., agent just registered, no transport HB yet) | Phase 4 Design picks edge-case rules — propose: `alive` if both alive; `unresponsive` if either unresponsive; `unknown` if either unknown (conservative). **Engineer-audit ask:** validate edge-case truth table |
| F5 (PROBE) | Per-agent pulse cadence specific number — Survey-deferred (Phase 4 Design picks). Range: ≥30min per Q4 ratio constraint; ≤120min per "death-detection slow-but-cheap" pragma | Phase 4 Design picks 60min as default; configurable per-agent (Agent record field). **Engineer-audit ask:** what cadence does engineer-substrate intuition support; consider real-world cost (LLM token responses every 60min × N agents = baseline overhead) |

---

## §7 Sequencing / cross-mission considerations

### §7.1 Branch + PR strategy

Branch handle: `agent-lily/m-ttl-liveliness-design`. Push pre-bilateral round-1 audit per calibration #59 closure mechanism (a) — 5th-canonical instance (after mission-69 + mission-70 + mission-71 + mission-72/73 hub-test PRs).

PR cadence: medium-large substrate-introduction; multi-substrate scope (Hub + Adapter Kernel + CLI). Likely **2-3 PRs sequenced**:
1. Hub schema delta (5-field expansion + eager TTL computation; tests)
2. Adapter Kernel transport HB + PulseSweeper extension (per-agent pulse + NULL-mission-binding suppression; tests)
3. CLI refactor (`get-agents.sh` columns; tests)

OR cumulative single mega-PR per mission-71 M6 fold pattern if scope allows. Phase 4 Design picks sequencing.

### §7.2 Composability with concurrent / pending work

- **idea-224 / mission-68 (closed)** — pulse mechanism we CONSUME (not redesign per AG-1)
- **idea-227 (M-Event-Design-End-to-End; open)** — adapter-kernel events natural fit for transport-HB firing; could compose if mission-227 ships first
- **idea-216 (bug-35 selectAgents semantic shift; open)** — sibling concern about liveness semantics; may obsolete or compose; review at Phase 4 Design entry
- **mission-66 W4 (closed)** — agent_state_changed event surface; existing; consumed
- **mission-71 install bootstrap (closed)** — claude-plugin install path; future agent-startup may auto-configure transport-HB cadence per Agent record default
- **idea-234 (M-Sovereign-Skill-Packages; open)** — orthogonal; no direct composability
- **idea-235 + idea-236 (handover state; open)** — orthogonal at this layer; per-agent pulse may benefit handover-state freshness checks

### §7.3 Same-day compressed-lifecycle candidate?

**No — full-cycle warranted.** Mission scope is medium-large substrate-introduction; multi-substrate scope (Hub + Adapter Kernel + PulseSweeper + CLI). Bilateral round-1 audit (engineer cross-check on schema decomposition + write-amplification + suppression discipline + cadence threshold) is load-bearing. Engineer-Responsibility implementation across multiple substrate areas — engineer's substrate intuition is needed at Phase 4 Design + Phase 8 implementation.

Architect-recommendation at Phase 4 entry: full bilateral cycle (mission-69 / mission-71 precedent for substrate-introduction class). Compressed-lifecycle compression NOT warranted per scope + risk profile.

---

## §calibration — Calibration data point

Per `idea-survey.md` §5 (Survey output element) + §15 schema. Captures empirical baseline for methodology-evolution loop per §13 Forward Implications.

- **Director time-cost (minutes):** 6 (across both Survey rounds; Director picks were terse + decisive)
- **Comparison baseline:** mission-71 Survey envelope (idea-230; 2nd-canonical Skill-mechanized Survey execution)
- **Notes:** Third-canonical Skill-mechanized Survey execution (mission-69 = 1st; mission-71 = 2nd; this = 3rd).

  **Pattern: Director-pre-ratified macro-architecture before Survey.** Director-architect bilateral conversation co-designed the macro-architecture (transport HB owner, cognitive-heartbeat composition, hybrid γ pulse architecture, cadence relationship, CLI surface mandate) PRE-Survey; Survey then probed only OPEN dimensions (cadences, schema decomposition, migration, per-agent pulse mechanism, CLI render, Hub-side TTL strategy). Director-direct "I still want a full survey" preserved 6-question discipline despite pre-ratification. **Methodology-evolution observation:** when Director-pre-ratification is substantial, Round-1 anchors at HIGHEST-LEVEL HOW (architectural-decision tier) rather than WHY/WHO/WHEN — the standard `round-1-template.md` framing assumes WHY/WHO/WHEN are open, but pre-ratified missions already have those. **Forward-pattern label:** "Survey-after-architecture-pre-ratify" — useful when architect-Director bilateral has already settled macro decisions before Phase 3 entry.

  **Maximal-information-schema choice (Q1=cd)** — rare multi-pick into both state-judgments AND raw-data; reflects "consumer chooses granularity" principle. **Forward-pattern label:** "schema-maximal-exposure-for-unknown-future-consumer-set" — useful when consumer set is not fully enumerable at Design time.

  **Mechanical-engineering aesthetic across Round-2 picks** — standard cadences (Q4b) + eager-write (Q5a) + raw-seconds CLI (Q6a) all chose simplicity over fancy. Round-2 picks composed coherently into low-substrate-complexity profile. **Forward-pattern label:** "mechanical-engineering-aesthetic" — when Round-2 specifics consistently choose plumbing-grade over UX-grade, the mission's aesthetic is "scriptable substrate" not "operator UX".

  **Director-flagged 2026-05-03 (this Survey):** notes ARE captured in envelope §calibration per §15 schema, BUT not consumed downstream effectively. Notes live in envelope artifact (queryable by future Survey-Skill comparison-baseline) but DON'T feed cross-Survey pattern aggregation, memory entries, calibration ledger, or strategic-review state surface. **Methodology-evolution candidate:** "notes-aggregation Skill" or strategic-review-state notes-rollup that surfaces patterns across Surveys for downstream consumption. **Self-referential observation:** this very note documents the gap.

  Survey methodology itself NOT modified per AG-9 carve-out from mission-69.

---

## §8 Cross-references

- **`docs/methodology/idea-survey.md`** v1.0 — canonical Survey methodology this mission consumes (NOT modified per AG-9 carve-out from mission-69)
- **`docs/methodology/strategic-review.md`** — Idea Triage Protocol (route-(a) skip-direct rationale applied 2026-05-02; 5/5 criteria PASS)
- **`docs/methodology/mission-lifecycle.md`** v1.2 — Phase 3 entry methodology + §3 mission-class taxonomy (substrate-introduction)
- **`docs/methodology/entity-mechanics.md`** — Agent record FSM; possible methodology-doc update target (vocabulary clarification: liveness vs activity vs engagement)
- **`docs/calibrations.yaml`** — calibration ledger cross-refs (closures-applied: []; candidates-surfaced: 4 forward-pattern labels per §calibration notes)
- **idea-225** — source idea (status: triaged → will flip to incorporated at mission-create)
- **idea-224 / mission-68** — sister idea (closed); pulse mechanism we consume (AG-1 boundary)
- **idea-216** — sibling concern (bug-35 selectAgents semantic shift; lastSeenAt-window vs livenessState-projection); may obsolete or compose; review at Phase 4 entry
- **idea-227** (M-Event-Design-End-to-End; open) — adapter-kernel events composability candidate
- **mission-66 W4 (closed)** — agent_state_changed event surface (consumed)
- **mission-69 + mission-71 + mission-72 + mission-73** — recent substrate-introduction + substrate-cleanup-wave precedents (compressed-lifecycle + bilateral patterns)
- **`scripts/local/get-agents.sh`** — CLI surface to refactor (columns + tpl/jq update)
- **Memory references:**
  - `feedback_schema_rename_requires_state_migration.md` — informed Q2 migration (NOT applied; additive not rename)
  - `reference_prism_table_pattern.md` — informed Q6 raw-seconds CLI aesthetic
  - `feedback_compressed_lifecycle_preflight_currency_checks.md` — applies at Phase 6 preflight (currency-check anti-goal idea-refs + mission-config templates)
  - `feedback_design_phase_lib_extraction_for_substrate_bash.md` — applies if Adapter Kernel transport-HB warrants lib-extraction at Design phase (testability)

---

— Architect: lily / 2026-05-03 (Phase 3 Survey envelope; Director-ratified 6 picks across 2 rounds; branch-pushed pre-bilateral round-1 audit per calibration #59 closure mechanism (a) — 5th-canonical)
