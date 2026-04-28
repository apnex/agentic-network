# M-Wire-Entity-Convergence — Design v0.1 (architect draft; pending engineer round-1 audit)

**Author:** lily / architect
**Source:** idea-219 (Wire-Entity Envelope Convergence + Schema-Migration Discipline) + Survey envelope (`docs/designs/m-wire-entity-convergence-survey.md`)
**Lifecycle phase:** 4 Design v0.1 (architect-authored; awaiting engineer round-1 audit)
**Status:** v0.1 draft — open for engineer round-1 audit; iterates to v0.2 (architect post-audit ratify) → v1.0 (bilateral ratify)
**Mission class:** structural-inflection (per Survey envelope; sizing baseline L)
**Tele primaries:** tele-3 Absolute State Fidelity + tele-7 Resilient Operations + tele-6 Deterministic Invincibility (substrate-self-dogfood); tele-1 Sovereign State Transparency tertiary

---

## §1 Goal

Convert all Agent-state-bearing wire surfaces (Hub-output) AND adapter-render path (claude-plugin) to a **canonical envelope shape** that mirrors the Agent entity contract. Eliminate the per-event-type if-ladder in `buildPromptText`. Ship state-migration script + Pass 10 protocol extension as bundled deliverables. Substrate-self-dogfood with full 5-requirement pattern at W4 (mission's own coordination consumes the new envelope at the dogfood gate).

**Architectural framing (per Survey envelope):** *Wire = projection of entity.* The canonical envelope is the contract between Hub-output and adapter-consumption; both layers conform to it; renames propagate through it by construction; per-event-type rendering becomes a single canonical-envelope-driven dispatch.

**Calibrations retired (5 of 9 from mission-62 P0+W4):** #17 Hub-rebuild gap, #18 wire-shape drift, #19 schema-rename without migration, #20 thread-message render-layer gap, #22 pulse-template-as-derived-view.

**Anti-goals locked (Survey Q5=E):**
1. NO legacy-flat-field deprecation runway (clean cutover)
2. vertex-cloudrun stub-only (engineer-side adapter parity stays in idea-220 Phase 2)
3. idea-218 Adapter local cache stays deferred (no consumer)
4. idea-217 Adapter compile/update streamline stays separate (own future mission)

---

## §2 Canonical envelope schema

### §2.1 Top-level shape

```typescript
interface CanonicalAgentEnvelope {
  ok: boolean;                        // Operation outcome (root-level)
  agent: AgentProjection;             // Entity projection (canonical)
  session?: SessionBindingState;      // Present on handshake-bearing responses
  wasCreated?: boolean;               // Operation outcome (register_role only)
  // Error-shape (when ok=false): { ok: false, code, message }
}

interface AgentProjection {
  id: string;                         // Was: agentId — canonical entity ID
  name: string;                       // Was: implicit / agentId fallback — display name from globalInstanceId
  role: "engineer" | "architect" | "director";
  livenessState: "online" | "degraded" | "unresponsive" | "offline";  // ADR-017 INV-AG6 4-state preserved
  activityState: "online_idle" | "online_working" | "online_quota_blocked" | "online_paused" | "offline";  // mission-62 5-state
  labels: Record<string, string>;     // Mission-19 routing labels
  clientMetadata: AgentClientMetadata;
  advisoryTags: AgentAdvisoryTags;
  // Internal/operational fields stay OFF wire: fingerprint, currentSessionId, lastSeenAt, archived, recentErrors, restartHistoryMs
}

interface SessionBindingState {
  epoch: number;                      // Was: sessionEpoch — session-binding state (NOT entity state)
  claimed: boolean;                   // Was: sessionClaimed — false from register_role; true from claim_session
  trigger?: "explicit_claim" | "sse_subscribe" | "first_tool_call";
  displacedPriorSession?: { sessionId: string; epoch: number };
}
```

### §2.2 Per-surface response shape

| Surface | Tool/Event | Envelope shape |
|---|---|---|
| Hub-output | `register_role` response | `{ok:true, agent: {...}, session: {epoch, claimed:false}, wasCreated}` |
| Hub-output | `claim_session` response | `{ok:true, agent: {...}, session: {epoch, claimed:true, trigger, displacedPriorSession?}}` |
| Hub-output | `get_agents` return | `{agents: AgentProjection[]}` (array; no session-binding state per agent in pull-primitive context) |
| Hub-output | `agent_state_changed` SSE event payload | `{agent: {...new state...}, changed: ("livenessState" | "activityState" | ...)[], cause: "first_tool_call" | "signal_working_started" | ...}` |

### §2.3 Wire = projection of entity (the contract)

**Internal fields stay OFF the wire.** Hub-side Agent entity has fields that are operationally meaningful but should not surface at wire level:

| Field | Status |
|---|---|
| `id` | ✓ on wire (renamed from internal Agent.id post-PR-#113) |
| `name` | ✓ on wire (from globalInstanceId post-PR-#114) |
| `role`, `livenessState`, `activityState`, `labels`, `clientMetadata`, `advisoryTags` | ✓ on wire |
| `fingerprint` | ✗ OFF wire (cryptographic identity material; internal) |
| `currentSessionId` | ✗ OFF wire (operational; surfaces via `session.epoch` change indirectly) |
| `lastSeenAt`, `lastHeartbeatAt`, `firstSeenAt` | ✗ OFF wire (operational telemetry; idea-220 Phase 2 may surface selectively) |
| `archived`, `restartCount`, `recentErrors`, `restartHistoryMs` | ✗ OFF wire (administrative/operational) |
| `sessionStartedAt`, `lastToolCallAt`, `lastToolCallName`, `idleSince`, `workingSince`, `quotaBlockedUntil` | ✗ OFF wire (FSM operational; activityState-internal) |
| `wakeEndpoint`, `receiptSla` | ✗ OFF wire (config; doesn't change per call) |
| `adapterVersion`, `ipAddress` | ✗ OFF wire (operational; surfaces via clientMetadata if needed) |

**Rule of thumb:** wire surfaces what callers need to make routing/coordination decisions; Hub keeps everything else internal. Selective surfacing of operational fields is idea-220 Phase 2 territory (engineer Agent-record read-surface gap = calibration #21).

### §2.4 Redaction discipline (Phase 1 observability carryover)

REDACT_KEYS scrubbed before wire emission (case-insensitive whole-key): `hubtoken`, `token`, `authorization`, `bearer`, `apikey`, `api_key`, `secret`, `password`. AgentProjection fields don't carry these by construction (config-time fields like `wakeEndpoint` stay OFF wire), but the REDACT_KEYS rule applies defensively at the canonical envelope serialization layer.

---

## §3 Wire-surface coverage (Hub-output)

### §3.1 `register_role` response (M18 path)

Current shape (post-PR-#112):
```typescript
{ ok: true, agentId: string, sessionEpoch: number, sessionClaimed: false,
  wasCreated, clientMetadata, advisoryTags, labels, message }
```

New shape (canonical):
```typescript
{ ok: true,
  agent: { id, name, role, livenessState, activityState, labels, clientMetadata, advisoryTags },
  session: { epoch, claimed: false },
  wasCreated,
  message? }  // message field optional; semantic-only; legacy-callers got it but envelope doesn't require
```

Implementation: `hub/src/policy/session-policy.ts registerRole` builds new shape from `identity` result. Test: `hub/test/session-policy/register-role.*.test.ts` updated to verify new envelope.

### §3.2 `claim_session` response

Current shape:
```typescript
{ ok: true, agentId, sessionEpoch, sessionClaimed: true,
  trigger?, displacedPriorSession?, message }
```

New shape:
```typescript
{ ok: true,
  agent: { id, name, role, livenessState, activityState, labels, ... },
  session: { epoch, claimed: true, trigger, displacedPriorSession? },
  message? }
```

Implementation: `hub/src/policy/session-policy.ts claimSession`. Per-trigger emission (explicit_claim from MCP tool; sse_subscribe + first_tool_call from auto-claim hooks; all return same envelope shape).

### §3.3 `get_agents` return

Current shape (per PR #111):
```typescript
{ agents: Agent[] }  // each Agent has the full internal entity shape
```

New shape:
```typescript
{ agents: AgentProjection[] }  // each entry is the wire-projection per §2.1
```

Implementation: `hub/src/policy/agent-policy.ts getAgents` projects from internal Agent records. Test: `hub/test/agent-policy/get-agents.test.ts`.

### §3.4 `agent_state_changed` SSE event payload

Current shape (per PR #111):
```typescript
{ agentId: string, livenessState, activityState, changedFields }
```

New shape:
```typescript
{ agent: AgentProjection,                                      // full new state
  changed: ("livenessState" | "activityState" | ...)[],         // which fields changed
  cause: "first_tool_call" | "signal_working_started" | ... }   // FSM transition cause
```

Implementation: `hub/src/networking/sse-dispatch.ts` (or wherever the agent_state_changed dispatcher lives). The full agent-projection in the event payload eliminates the need for downstream consumers to call `get_agents` to learn the new state — push-with-payload model.

---

## §4 Adapter-render unification

### §4.1 Current state (per-event-type if-ladder)

`packages/network-adapter/src/prompt-format.ts buildPromptText`:
```typescript
function buildPromptText(event: string, data: any, opts): string {
  // Per-event-type if-ladder; ~4 branches today (PR #112's Pass 7 fix)
  if (event === "message_arrived" && data.pulseKind) {
    return renderPulseInline(data);  // ✓ inline rendering covered
  }
  if (event === "message_arrived" && data.kind === "note") {
    return renderNoteInline(data);   // ✓ inline rendering covered
  }
  // event === "thread_message" → falls through to generic envelope (calibration #20)
  // event === "thread_convergence_finalized" → partial inline with truncation (calibration #20 sub-finding)
  // event === "agent_state_changed" → currently unhandled (post-PR-#111 surface)
  return buildGenericEnvelope(event, data);  // generic fallthrough
}
```

### §4.2 New state (single canonical pipeline)

```typescript
function buildPromptText(envelope: CanonicalEventEnvelope): string {
  // envelope.event discriminates; envelope.payload conforms to canonical shape
  // Single pipeline: extract structured fields → render template → return text
  return renderCanonicalEnvelope(envelope);
}
```

Where `CanonicalEventEnvelope` is:
```typescript
interface CanonicalEventEnvelope {
  event: string;              // Stable event name (e.g., "message_arrived", "thread_message", "agent_state_changed")
  agent?: AgentProjection;    // Present when event is Agent-state-bearing
  payload: Record<string, unknown>;  // Event-specific payload; structured per event-type
  metadata?: { messageId?, threadId?, correlationId?, ... };
}
```

The renderer walks `envelope.event` + `envelope.payload` shape via a registered template (one per event-type) but the OUTER pipeline is uniform: extract → template → text. Adding a new event-type = registering a template; no if-ladder branch addition.

### §4.3 Migration of existing event-types

| Event | Today's path | New canonical path |
|---|---|---|
| `message_arrived` + `pulseKind` | inline render via Pass 7 fix | inline render via canonical template (preserved behavior) |
| `message_arrived` + `kind=note` | inline render via Pass 7 fix | inline render via canonical template (preserved behavior) |
| `thread_message` | generic fallthrough (calibration #20) | inline render via canonical template (CALIBRATION RETIRED) |
| `thread_convergence_finalized` | partial inline + mid-summary truncation | full inline render via canonical template (CALIBRATION #20 SUB-FINDING RETIRED) |
| `agent_state_changed` | currently unhandled | inline render via canonical template (NEW) |

### §4.4 Render-template per event-type

Templates live in `packages/network-adapter/src/render-templates/<event>.ts` (one file per event-type). Each exports a function `(envelope) => string` that produces the prompt-text rendering.

Sketch for `thread_message`:
```typescript
export function renderThreadMessage(env: CanonicalEventEnvelope): string {
  const { agent, payload, metadata } = env;
  const author = agent?.name ?? agent?.id ?? "unknown";
  const role = agent?.role ?? "unknown";
  const threadTitle = payload.threadTitle ?? metadata?.threadId ?? "unknown thread";
  const body = payload.body ?? "";
  return `[${role}] ${author} replied to thread "${threadTitle}":\n\n${body}\n\n[Thread: ${metadata?.threadId}]`;
}
```

The body inline rendering is now the contract — no fallthrough generic shape.

---

## §5 State migration + Pass 10 protocol extension

### §5.1 State migration script

`scripts/migrate-canonical-envelope-state.ts` (one-shot; idempotent):

```bash
# Migrates persisted Agent records to canonical-envelope-aligned shape.
# Idempotent: re-running produces no change.
# Operator runs ONCE before W3 dogfood gate; before-and-after backup recommended.

scripts/migrate-canonical-envelope-state.ts
```

Concrete operations (mostly already done in mission-62 P0 recovery; this script verifies + completes):
- Verify all `local-state/agents/*.json` have `id` field (not `engineerId` or `agentId` legacy)
- Verify all `local-state/agents/by-fingerprint/*.json` have `id` field
- Recompute `name` field if missing (from globalInstanceId via fingerprint reverse-lookup if needed)
- No data loss; backup at `/tmp/agents-pre-canonical-envelope-migration-$(date +%Y%m%d-%H%M%S).tar.gz`

### §5.2 Pass 10 protocol extension

Updates `docs/methodology/multi-agent-pr-workflow.md` Pass 10 section + adds new ADR:

**New requirement:** Schema-rename PRs that touch persisted entity fields MUST include:
1. Migration script under `scripts/migrate-*.ts` (one-shot, idempotent)
2. Operator instruction in PR description ("run migration before Hub restart")
3. `build-hub.sh` mandatory for any PR touching `hub/src/**` (today's gap: PR #112 didn't include Hub container rebuild step → caused mission-62 P0 layer 1)

**Defensive read-with-fallback** is acceptable as a deprecation runway, but the migration script is preferred — defensive reads accumulate as legacy code paths.

### §5.3 ADR scaffold

New ADR: `docs/decisions/0??-canonical-agent-envelope.md` (number assigned at Manifest time):

**Title:** Canonical Agent Envelope — Wire = Projection of Entity

**Context:** mission-62 W4 dogfood + P0 substrate recovery surfaced 5 calibrations rooted in wire-vs-entity drift + per-event-type render if-ladder. Per Survey envelope, this ADR codifies the architectural pattern.

**Decision:** All Agent-state-bearing wire responses + SSE events conform to canonical envelope shape (`{agent: AgentProjection, session?: SessionBindingState, wasCreated?, ...event-specific}`); adapter-render consumes via single canonical pipeline (event-discriminator dispatch to registered render-templates; no per-event-type if-ladder).

**Consequences:**
- Renames at Hub-side propagate through wire by construction (TS-LSP-equivalent + tests catch breakage)
- Adding new event-types is O(1) — register a render-template; no if-ladder branch
- Internal fields stay OFF wire (operational/administrative); selective surfacing via separate ideas (idea-220 Phase 2 for engineer-side parity)
- Schema-rename PRs with migration script discipline retire the recovery-via-P0 pattern

**Sealed companions:** ADR-017 INV-AG6 (4-state liveness FSM preserved; this ADR doesn't change FSM); ADR-018 (cognitive pipeline modular contract; this ADR shows how the modular surface composes).

---

## §6 Substrate-self-dogfood (W4 5-requirement pattern)

Per `mission-lifecycle.md` §6.1; second canonical execution after mission-62 W4 (first = observation-only; this = full-coverage).

### §6.1 Dogfood gate identification

The **W3 sub-PR** is the gate: it converts adapter-side parser + render path. Once W3 lands and `install.sh` runs, BOTH Hub-output (from W1+W2) AND adapter-render (from W3) speak the canonical envelope. Pre-W3 sub-PRs use legacy flat-field shapes; post-W3 sub-PRs use canonical envelope.

### §6.2 Pre-gate sub-PR sequencing

- W0 — Survey artifact + Design v1.0 + ADR scaffold (this PR; doc-only; no substrate change)
- W1 — Hub-side response builder conversion for `register_role` + `claim_session` + canonical envelope tests (Hub-only PR; adapter still flat; substrate has half-state on main but BOTH adapters today read flat so handshake STILL parses through legacy-shape-omission tolerance — see §6.6 hold-on-failure)
- W2 — Hub-side response builder conversion for `get_agents` + `agent_state_changed` SSE event (still Hub-only)
- **W3 — DOGFOOD GATE** — adapter parser + adapter render-pipeline conversion + state-migration script (atomic; this is the substrate-cutover wave)

### §6.3 Adapter-restart / Hub-redeploy gating (Pass 10 protocol extension under live exercise)

W3 PR merge sequence:
1. `gh pr merge <W3> --admin --squash --delete-branch`
2. `cd /home/apnex/taceng/agentic-network && git pull --ff-only`
3. `cd /home/apnex/taceng/agentic-network && OIS_ENV=prod scripts/local/build-hub.sh` (mandatory per Pass 10 ext)
4. `cd /home/apnex/taceng/agentic-network && scripts/migrate-canonical-envelope-state.ts`
5. `cd /home/apnex/taceng/agentic-network && OIS_ENV=prod scripts/local/start-hub.sh`
6. `cd /home/apnex/taceng/agentic-network/adapters/claude-plugin && ./install.sh`
7. Director-coordinated lily + greg restart
8. Architect verifies via shim-events.ndjson handshake events (cleanly; no `parse_failed`)

This is the canonical "rebuild protocol Pass 10 ext" execution under live mission conditions. mission-62 P0 retroactively executed steps 2-8 reactively; this mission executes proactively.

### §6.4 Verification protocol (W4)

Architect-bilateral with greg via fresh thread (per mission-62 W4 thread-395 pattern). Test points:
1. **Handshake parses cleanly** — both sides; no `parse_failed` in shim-events.ndjson
2. **Verbatim envelope captures** — both sides post-handshake `register_role` + `claim_session` response inspected via shim-events.ndjson; should see canonical envelope shape (`body.agent.id` present; `body.agentId` absent)
3. **`agent_state_changed` SSE round-trip** — force-fire a state transition; both sides observe SSE event with canonical envelope payload
4. **Pulse content rendering inline** — symmetric green (carryover from mission-62 W4)
5. **Thread-message rendering inline** — NEW; mission-62 W4 captured this as RED (calibration #20); should now be GREEN with canonical envelope-driven render-template
6. **Thread-convergence-finalized rendering inline** — NEW; mission-62 W4 captured partial-with-truncation; should now be GREEN
7. **`get_agents({fields: "all"})` engineer-callable** — verify accessible from engineer side (calibration #21 partially adjacent; full retire stays in idea-220 Phase 2)

Closing artifact: `docs/audits/m-wire-entity-convergence-w4-validation.md` (mission-62 W4 audit doc precedent).

### §6.5 Hold-on-failure clause

If verification fails on any test point:
1. **Block downstream waves** (W5 doesn't proceed)
2. **Investigate substrate change** — was it Hub-output (regress W1/W2)? Adapter parser (regress W3)? Adapter render (W3 sub-component)? State migration (regress §5.1)?
3. **Resume in legacy-mode if blocker is non-trivial** — revert W3 only (keep W1/W2 on main; adapter stays on legacy parser; coexists if §2-§3 envelope is additive — but per anti-goal §5.1, NO legacy-co-existence; so revert W3 fully if blocker)
4. **File investigation as bug entity** + Director-surface (categorised concern: substrate-shifting)

### §6.6 Substrate-vs-enrichment classification (substrate; full-coverage)

Per Survey Q6=A. This is substrate (mission's own coordination consumes the new envelope). Specifically:
- Architect↔engineer thread coordination consumes `thread_message` envelope (which uses canonical render-template post-W3)
- Pulse rendering for both `engineerPulse` + `architectPulse` consumes canonical render-template post-W3
- `agent_state_changed` SSE events that fire when greg or lily transitions activity state are visible in shim-events.ndjson via canonical envelope payload
- Substrate verification IS the dogfood — circular, intentional, exactly the substrate-vs-enrichment-substrate-side test

---

## §7 Mission decomposition (W0-W5 wave plan)

Per Survey envelope Q3=A (single big-bang structural-inflection mission):

### §7.1 W0 — Survey + Design + ADR scaffold + Preflight

**Scope (architect-owned; doc-only PR):**
- Survey artifact (`docs/designs/m-wire-entity-convergence-survey.md`) — DONE in this conversation
- Design v0.1 → v1.0 (this doc; bilateral with greg)
- ADR scaffold (`docs/decisions/0??-canonical-agent-envelope.md`)
- Preflight artifact (`docs/missions/m-wire-entity-convergence-preflight.md`) — Phase 6 deliverable

**Deliverable:** PR titled "[mission-N] Survey + Design v1.0 + Preflight artifact — M-Wire-Entity-Convergence"

### §7.2 W1+W2 — Hub-side response builder conversion (atomic engineer claim per mission-62 precedent)

**Scope (engineer-owned; PR ~5-8 files):**
- `hub/src/policy/session-policy.ts` — register_role + claim_session response builders converted to canonical envelope
- `hub/src/policy/agent-policy.ts` — get_agents return projection updated
- `hub/src/networking/sse-dispatch.ts` — agent_state_changed SSE event payload updated
- Tests updated in `hub/test/`
- No adapter-side changes (adapter still parses legacy flat fields; will fail to find them post-W2 → known-temporary breakage; reverted in W3 atomically)

**Wave-coherence note:** W1+W2 is the period where main is in half-state — Hub speaks canonical, adapter parses flat. Adapter handshake will FAIL post-W2 merge (calibration #18 reproduced intentionally). No live agents should be running during W1+W2 merge window OR W3 must follow IMMEDIATELY (within minutes). **Anti-flake mitigation:** W1+W2 merge → W3 PR open same day; greg authors W3 PR before W1+W2 merge to ensure tight cycle.

### §7.3 W3 — Adapter parser + render conversion + state-migration script (DOGFOOD GATE)

**Scope (engineer-owned; PR ~6-10 files):**
- `packages/network-adapter/src/kernel/handshake.ts` — parseHandshakeResponse + parseClaimSessionResponse read `body.agent.id`
- `packages/network-adapter/src/prompt-format.ts buildPromptText` — single canonical pipeline; per-event-type if-ladder retired
- `packages/network-adapter/src/render-templates/*.ts` — new directory; one template per event-type
- `scripts/migrate-canonical-envelope-state.ts` — state-migration script (verifies + completes mission-62 P0 manual migration)
- Adapter rebuild via Pass 10 protocol (engineer rebuilds + ships .tgz updates)
- Tests updated in `packages/network-adapter/test/` + `adapters/claude-plugin/test/`

**Post-merge gate sequence:** §6.3 Pass 10 protocol ext execution.

### §7.4 W4 — Substrate-self-dogfood verification (architect-owned)

**Scope (architect-bilateral with engineer):**
- Architect opens fresh thread to engineer post-W3 dogfood-gate
- 7 test points from §6.4 verified verbatim
- Closing audit at `docs/audits/m-wire-entity-convergence-w4-validation.md`

**Verdict gates:** GREEN proceeds to W5; YELLOW (some test points need follow-up) calibrate + proceed; RED hold-on-failure per §6.5.

### §7.5 W5 — Closing audit + Pass 10 protocol extension PR + ADR final

**Scope (architect-owned; doc-only + protocol PR):**
- W4 + W5 audits (per mission-62 precedent)
- Pass 10 protocol extension PR — updates `docs/methodology/multi-agent-pr-workflow.md`
- ADR final ratification (Director-ratified at Phase 7 release-gate; finalized at W5)
- Mission status flip `active → completed`

### §7.6 Wave parallelization

Largely sequential (W0 → W1+W2 → W3 → W4 → W5). W0 doc work can overlap with W1+W2 engineer ship. W4+W5 are separate phases per methodology.

---

## §8 Anti-goals locked (Survey Q5=E)

Mirrors mission-62's "13 anti-goals locked" pattern but tighter scope (4 anti-goals):

1. **NO legacy-flat-field deprecation runway** — clean cutover; no co-existence period; legacy-shape readers break by construction; state migration converts persisted records atomically; adapter parsers convert wire-readers atomically
2. **vertex-cloudrun stub-only** — engineer-side adapter (vertex-cloudrun) gets stub-only conversion (interface conformance; no live exercise); idea-220 Phase 2 mission ships full vertex-cloudrun parity
3. **idea-218 Adapter local cache stays deferred** — no consumer; not envelope-shape-relevant; mention as explicit non-goal in Design + Preflight
4. **idea-217 Adapter compile/update streamline stays separate** — this mission ships state-migration script + Pass 10 protocol extension (operational tooling for THIS rename) but NOT the broader rebuild-streamline; idea-217 remains its own future mission per Director's 2026-04-27 flagging

---

## §9 Risks + open questions (engineer round-1 audit input)

### §9.1 Wave-coherence anti-flake (W1+W2 → W3 timing)

**Risk:** W1+W2 merge creates a half-state window where Hub speaks canonical envelope but adapter still parses flat fields. Live-agent handshake will fail in this window.

**Mitigations under consideration:**
- (a) **Tight-cycle merge** — W1+W2 merge → W3 PR open same day; engineer authors W3 PR before W1+W2 merge (W3 ready-to-merge in parallel); minimize half-state duration
- (b) **No-live-agent merge window** — Director coordinates lily+greg offline during W1+W2 merge; agents come back online only post-W3 install.sh
- (c) **Atomic W1+W2+W3 super-PR** — single PR covers all three waves (substantial size; ~15-20 files); engineer-claim-larger-block; preserves wave coherence as single commit

**Engineer round-1 audit candidate:** which mitigation is preferred? My current lean is (a) tight-cycle; (c) atomic-super-PR is structurally cleanest but harder to review.

### §9.2 Render-template coverage scope

**Open:** which event-types get explicit render-templates in W3?
- Mandatory (per §6.4 verification): `message_arrived` (pulse + note), `thread_message`, `thread_convergence_finalized`, `agent_state_changed`
- Optional / fold-in: `task_issued`, `mission_activated`, `report_submitted`, `clarification_resolved`, `bug_resolved`, `proposal_accepted`, `idea_submitted`, `proposal_review_submitted`, ... (full notification taxonomy)

**Engineer round-1 audit candidate:** scope to mandatory-only in W3 (sufficient for substrate-self-dogfood + calibration #20 retire) + leave optional-events on legacy generic envelope as known-future-work (sub-deferral)? Or full taxonomy now?

My lean: scope to mandatory-only; full taxonomy is idea-220 Phase 2 territory.

### §9.3 `name` field provenance for legacy Agent records

**Open:** mission-62 P0 manual migration set `id` field but did NOT explicitly verify `name` field. PR #114 added `Agent.name` from `globalInstanceId` at first-contact-create. **Existing records may have `name` undefined or fallback-to-id.**

**Migration script consideration:** §5.1 script should verify `name` field; if missing, derive from `globalInstanceId` (which is in clientMetadata or recoverable from fingerprint via reverse-lookup if Hub keeps that index). If unreachable, fallback `name = id`.

**Engineer round-1 audit candidate:** verify name-field provenance assumption + propose recovery path if record is irrecoverable.

### §9.4 Backward-compat for non-claude clients (e.g., probe-spawn)

**Open:** `claude mcp list` probe-spawns the adapter; pre-mission-40 probes did register_role; mission-40 T2-T3 introduced auto-claim-suppression for probes. Does the canonical envelope cause any probe-side breakage?

**My read:** No — probes don't parse register_role response (per `parseClaimSessionResponse` skip-list discipline). Engineer round-1 audit confirms.

### §9.5 vertex-cloudrun stub-only scope precision

**Open:** "stub-only" per anti-goal §8.2 — does the engineer-side adapter (vertex-cloudrun) get type-conformance-only updates (TypeScript interface matches new envelope; no live exercise) or compile-only (no parser changes, just types)?

**Engineer round-1 audit candidate:** define stub-only scope precisely. My lean: type-conformance + interface alignment so future vertex-cloudrun-parity mission has clean starting point; no live parser changes; no live exercise during W4 dogfood.

### §9.6 Sub-deferral candidates

Items that could fold in OR could defer to future ideas:

| Item | Fold-in candidate | Defer candidate |
|---|---|---|
| Engineer-side `get_agents` callable (calibration #21) | Maybe — Hub-side surface available post-W2 | Lean defer — engineer-side Phase 2 ships in idea-220 |
| Pulse-template stale-content fix (calibration #22) | Phase-derivation work — replaces stored pulse text with synthesis-from-mission-state | Lean defer — separate concern from envelope; could be its own micro-PR |
| Pulse-template role-aware fix (calibration #23) | NOT in scope | Defer to idea-220 (already scoped there) |

**Engineer round-1 audit candidate:** confirm sub-deferral list.

---

## §10 Mission identity + cross-references

**Mission entity manifest (Phase 5 input):**
- `id` — TBD at create_mission
- `title` — M-Wire-Entity-Convergence
- `missionClass` — `structural-inflection`
- `description` — see §1 + §2-§9 sourced from this Design v1.0
- `documentRef` — `docs/designs/m-wire-entity-convergence-design.md`
- `correlationId` — TBD (likely mission-N or M-Wire-Entity-Convergence)
- `plannedTasks` — wave plan §7
- `pulses` — per `mission-lifecycle.md` §4.1 structural-inflection class default cadence (15min engineer / 30min architect)

**Cross-references:**

- **idea-219** — source idea (Wire-Entity Envelope Convergence + Schema-Migration Discipline) — `incorporated` status flips to this mission at create_mission
- **mission-lifecycle.md** v1.2 — formal lifecycle methodology
- **idea-survey.md** v1.0 — Survey methodology (this mission's Phase 3 followed v1.0 canonical pattern)
- **mission-62** — architectural-precedent mission; substrate-self-dogfood W4 first canonical (observation-only); Pass 10 rebuild discipline; W4 audit at `docs/audits/m-agent-entity-revisit-w4-validation.md`; W5 closing at `docs/audits/m-agent-entity-revisit-w5-closing-audit.md`
- **mission-56** — substrate-self-dogfood W2.2 first canonical substrate execution (push pipeline)
- **mission-57** — substrate-self-dogfood enrichment-defer canonical (PulseSweeper)
- **mission-61** — Layer-3 SDK-tgz-stale lesson (carry-forward into W1+W2 → W3 wave coherence discipline)
- **idea-121** — API v2.0 tool-surface (composes; mission ships standalone but folds into v2.0 vocabulary when v2.0 mission emerges)
- **idea-217** — Adapter compile/update streamline (anti-goal §8.4: separate mission)
- **idea-218** — Adapter local cache (anti-goal §8.3: stays deferred)
- **idea-220** — Shim Observability Phase 2 (companion; covers calibrations #15, #16, #21, #23 not retired here)
- **ADR-017** INV-AG6 — 4-state liveness FSM preserved (predates this work; carry-forward)
- **ADR-018** — cognitive pipeline modular contract (companion)
- **PRs** — #110-#114 (mission-62 substrate ship); #115 (W4-followon shim observability + audits); #116 (test repair)

---

## §11 Engineer round-1 audit ask (next bilateral step)

**To engineer (greg):** request round-1 audit on Design v0.1 covering:

1. **§9 risks + open questions** — your views on each (5 candidates listed)
2. **§7 wave decomposition** — wave-shape sanity-check + estimate-vs-actual feedback (mission-62 estimated L; realized M for engineer-side; this mission also L; recalibrate?)
3. **§2 envelope schema** — any field-shape concerns (e.g., should `agent.role` use `coerceAgentRole` enum; `clientMetadata` shape stability across versions)
4. **§4 adapter-render unification** — render-template-per-event-type pattern; does this conflict with any cognitive-layer middleware (CognitiveTelemetry / ResponseSummarizer)?
5. **§5.2 Pass 10 protocol extension** — operator-instruction shape; when does the migration script run during merge sequence (post-pull, pre-build-hub, post-build-hub)?

Round-1 audit thread shape: architect opens via `create_thread` with title "M-Wire-Entity-Convergence Design v0.1 — round-1 audit"; semanticIntent=`seek_rigorous_critique`; greg responds; iterate to v0.2; v1.0 ratifies bilaterally. Survey artifact + Design v1.0 ship in same PR (Phase 4 deliverable).

---

## §12 Status + version history

| Version | Date | Author | Notes |
|---|---|---|---|
| v0.1 | 2026-04-28 ~12:30 AEST | architect lily | Architect draft; pending engineer round-1 audit; Phase 4 entry |
| v0.2 | (pending) | architect lily | Post round-1 audit ratify |
| v1.0 | (pending) | bilateral | Bilateral ratify; Phase 4 exit |
