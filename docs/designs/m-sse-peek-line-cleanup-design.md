# M-SSE-Peek-Line-Cleanup — Design v1.1 (RATIFIED)

**Status:** v1.1 (engineer round-2 mid-stream substrate-currency fold applied; architect ratified Option A; implementation authorized)

**Version history:**
- v0.1 (2026-05-06) — architect dispatch DRAFT
- v1.0 (2026-05-06) — engineer round-1 audit folded (F1.a/F1.b/F3/F4); architect ratified
- v1.1 (2026-05-07) — engineer round-2 substrate-currency fold (FX): legacy `interface Notification` reference replaced with `ExternalInjectionPayload` extension (mission-56 W5 removed legacy Notification entity; current emit wire is `messageStore.createMessage`). Render-locus decision preserved unchanged.
**Anchor:** `docs/surveys/m-message-structure-cleanup-survey.md` (parent umbrella; this is Phase 1 of 3)
**Idea:** idea-253 (Phase 1 scope; §1 SSE peek-line layer)
**Mission class:** substrate-cleanup-wave (per Survey envelope; first sub-phase)
**Sizing:** S/M baseline (~1-3 days substrate work + bilateral cycle)
**Tele primaries:** tele-2 Frictionless Agentic Collaboration + tele-3 Sovereign Composition; tele-6 Deterministic Invincibility + tele-7 Resilient Operations secondary

---

## §0 Goal

Standardize the SSE notification peek-line text — the operator-visible `← proxy: ...` channel that surfaces Hub events to the terminal. Replace the inconsistent ad-hoc prefix taxonomy with a canonical structure: `[<source-class>] <action> <entity-id>: "<title>" — <preview> [<actionability>]`. Phase 1 of 3 per parent Survey envelope (§1 first per Q4=a; §3 + §2 follow in subsequent missions).

Phase 1 ships an independently-deployable substrate feature (per Survey Q5=a) — clean release boundary; Phase 2/3 build on but don't depend on Phase 1 in any audience-coverage sense. The substrate change is HUB-SIDE schema additions to notification records + ADAPTER-SIDE render-path update consuming the new schema fields.

---

## §0.5 Existing infrastructure inventory (v1.0 fold per F1.a + F1.b)

Per `idea-survey.md` audit-rubric §3d (mission-73 fold): inventory load-bearing existing infrastructure before Design v0.1 to avoid substrate-elision. Engineer round-1 audit verified completeness via the broadened grep + trigger-table inspection (per `feedback_emit_site_inventory_grep_breadth.md`).

### §0.5.1 Three distinct emit paths to SSE peek-line surface (F1.a fold)

Notification emit happens via **three distinct mechanisms**; helper-only grep undercounts by ~2×. Total surface ~20-25 emit-classes (within original ~15-30 envelope; mission-class re-evaluation NOT triggered).

| Path | Mechanism | Call-site count | Files |
|---|---|---|---|
| **A. Helper-mediated** | `emitLegacyNotification` / `emitDirectorNotification` | **7 call-sites** | hub-networking.ts ×2, task-policy.ts ×1, thread-policy.ts ×2, watchdog.ts ×1, pending-action-policy.ts ×1 |
| **B. Direct messageStore** | `messageStore.createMessage(...)` / `ctx.stores.message.createMessage(...)` | **13 call-sites** | triggers.ts, pulse-sweeper.ts ×3, thread-policy.ts (additional beyond helper calls), message-policy.ts, repo-event-handlers.ts, message-projection-sweeper.ts, scheduled-message-sweeper.ts |
| **C. Declarative trigger table** | `triggers.ts` carries an array of `{emitKind, emitShape}` entries; each row is a distinct emit-class for entity-status transitions (note kind) | **3+ table rows** (lines 104, 132, 160 + future entries) | triggers.ts (single file; multi-class) |

**Audit instruction (broadened per F1.a):**
```
grep -rn "emitLegacyNotification\|emitDirectorNotification\|messageStore\.createMessage\|stores\.message\.createMessage" hub/src/policy/ hub/src/entities/
```
Plus inspect the `transitionTriggers` table in `hub/src/policy/triggers.ts` as a separate emit-class enumeration.

### §0.5.2 Component disposition

| Existing component | Path | Disposition |
|---|---|---|
| External-injection payload schema (Hub-side; FX v1.1 fold) | `hub/src/policy/notification-helpers.ts` (emit-helper boundary) + `hub/src/state.ts` (Message payload type if exported) | **EXTEND** — add `sourceClass`, `entityRef`, `actionability`, `body` fields to `ExternalInjectionPayload` (NOT to legacy `interface Notification` — removed in mission-56 W5; current emit wire is `messageStore.createMessage` with `kind: "external-injection"`) |
| Notification emit helpers (Path A) | `hub/src/policy/notification-helpers.ts` + `director-notification-helpers.ts` | **UPDATE** — populate new schema fields + render canonical body at emit-time |
| Direct messageStore call-sites (Path B) | 13 call-sites enumerated above | **UPDATE** — populate new schema fields + render canonical body at emit-time |
| Trigger table (Path C) | `hub/src/policy/triggers.ts` `transitionTriggers` array | **UPDATE** — emitShape extension to populate sourceClass + entityRef per trigger row |
| Repo-event handlers | `hub/src/policy/repo-event-pr-*-handler.ts` + `commit-pushed-handler.ts` | **UPDATE** — populate sourceClass=System-PR at emit |
| Pulse system | `hub/src/policy/pulse-sweeper.ts` | **UPDATE** — populate sourceClass=System-Pulse |
| Audit emit | `hub/src/entities/audit-repository.ts` | **UPDATE** — populate sourceClass=System-Audit if SSE-surfaced |
| Adapter render-path (F1.b correction) | `packages/network-adapter/src/tool-manager/dispatcher.ts` (645 lines; routes via `notificationHooks` bag with `notification.actionable` / `notification.informational` classification at lines 343/348/368) | **PASS-THROUGH** — Hub renders body at emit-time per §2.1 render-locus decision; adapter passes body unchanged |

### §0.5.3 Render-locus decision (F1.b fold)

Per F1.b clarification: render-text construction is **Hub-side at emit-time** (NOT adapter-internal NOR host-shim contract). Rationale:

- Universal consistency across adapters (claude-plugin + opencode-plugin + future) — single source-of-truth
- "No legacy debt" stance — eliminates per-adapter drift surface
- Adapter pass-through preserves existing `notificationHooks` classification (actionable vs informational) without re-rendering

**Concretely (v1.1 fold):** notification-emit helpers + direct messageStore call-sites + trigger-table emitShape all set `payload.body` (on the `external-injection` Message payload) to the canonical rendered text using the new schema fields (sourceClass + entityRef + actionability). Adapter `tool-manager/dispatcher.ts` consumes `payload.body` unchanged. The `← proxy:` prefix continues to be host-shim-added (claude-plugin shim concern; out of scope per AG-3).

Format-regex contract from §3 enforces the canonical render shape on persist, NOT on adapter consumption — the substrate guarantees the rendered body shape to all consumers uniformly.

---

## §1 Substrate scope — Hub-side schema additions

### §1.1 ExternalInjectionPayload schema extension (v1.1 substrate-currency fold)

**Substrate-currency note (FX v1.1 fold):** mission-56 W5 removed the legacy `Notification` entity + `NotificationRepository` + `INotificationStore`. Hub-event-bus → SSE injection now flows through the Message store via `emitLegacyNotification` (and direct `messageStore.createMessage` call-sites + trigger-table emitShape — per §0.5.1 3-emit-path framing). Current wire shape (per `hub/src/policy/notification-helpers.ts:53-71`):

```typescript
messageStore.createMessage({
  kind: "external-injection",
  authorRole: "system",
  authorAgentId: "hub",
  target: null,
  delivery: "push-immediate",
  payload: { event, data, targetRoles },  // ← Phase-1 extension target
});
```

Phase 1 extends `payload` (the `ExternalInjectionPayload` shape) — NOT a legacy `Notification` interface:

```typescript
interface ExternalInjectionPayload {
  // existing fields preserved:
  event: string;                    // discriminator (e.g. "thread_message", "pr-opened-notification")
  data: Record<string, unknown>;    // per-event payload (existing semantic)
  targetRoles: string[];            // fan-out routing

  // Phase-1 additions (v1.1; this mission):
  sourceClass: SourceClass;         // NEW: canonical taxonomy (see §1.2)
  entityRef?: {                     // NEW: structured entity reference
    type: EntityType;               // "thread" | "mission" | "PR" | "task" | "bug" | "idea" | "calibration" | "commit"
    id: string;                     // canonical ID per type ("thread-487", "PR #185", "bug-56", etc.)
    title?: string;                 // optional title (max ~60 chars; truncated only if exceeds)
  };
  actionability: Actionability;     // NEW: "your-turn" | "FYI" | "emitted" | "acked"
  body: string;                     // NEW: canonical rendered text (Hub-side render-locus per §0.5.3)
}

type SourceClass =
  | "Hub"         // Hub-internal substrate (thread events, mission lifecycle, audit)
  | "Director"    // Director-direct messages or actions
  | "Engineer"    // Engineer peer messages
  | "Architect"   // Architect peer messages
  | "System-PR"   // GitHub-derived PR-events (pr-opened/merged/review)
  | "System-Pulse"// Mission/agent pulse system
  | "System-Audit";// Audit-trail emissions
```

**Render-locus decision preserved unchanged from v1.0 §0.5.3** — emit helpers gain new arguments; helpers compute canonical body using the new schema fields; adapter `tool-manager/dispatcher.ts` consumes `payload.body` unchanged. Persisting all 4 fields (vs body-only) is deliberate per Option A (ratified): composes-with Phase 2 cross-ref schema (entityRef directly query-able post-persist), supports tele-3 Sovereign Composition canonical-form discipline (structured fields > parsable strings), and supports unit-tests on the render function (per `feedback_format_regex_over_hardcoded_hash_tests.md` — tests pin format-regex on body; structured fields support function-level unit tests).

### §1.2 Source-class taxonomy (coarse-grained per architect-flag F1)

Per Survey architect-flag F1: lean coarse-grained. 7-class taxonomy as designed. **Do NOT split** `System-PR` into per-action variants (System-PR-Open / System-PR-Merge / etc.) — at-a-glance taxonomy benefits from coarse-grained classes; action verb in render template carries the per-event detail.

**Resolution table** (per emit-site → sourceClass):

| Emit-site | sourceClass |
|---|---|
| `thread_message` (peer reply) | author's role: `Engineer` / `Architect` / `Director` |
| `thread_convergence_finalized` | `Hub` |
| `mission_status_changed` (proposed→active, etc.) | `Hub` |
| `agent_state_changed` | `Hub` (or filtered out — see §1.5) |
| `pr-opened-notification` / `pr-merged-notification` / etc. | `System-PR` |
| `commit-pushed-notification` | `System-PR` (or split — engineer-call) |
| `agentPulse` / `engineerPulse` / `architectPulse` | `System-Pulse` |
| `audit_action` (when surfaced via SSE) | `System-Audit` |
| `director_notification` (Director-direct) | `Director` |

### §1.3 EntityRef extraction

Auto-populate `entityRef` at emit-site based on emit context. NOT a parser of body text (that's §3 cross-ref schema in Phase 2; out-of-scope here). Each emit-site KNOWS its primary entity:

- thread_message → entityRef = `{ type: "thread", id: thread.id, title: thread.title }`
- mission_status_changed → entityRef = `{ type: "mission", id: mission.id, title: mission.title }`
- pr-opened-notification → entityRef = `{ type: "PR", id: `PR #${prNumber}`, title: prTitle }`
- audit_action → entityRef = `{ type: "audit", id: auditEntryId }` (or null if no entity-bound)

### §1.4 Actionability marker logic (F3 fold)

Defaults per emit-class:
- `your-turn`: thread_message peer-reply WHERE recipient's `currentTurn` matches their role
- `FYI`: thread_convergence_finalized, mission_status_changed, agent_state_changed
- `emitted`: System-PR notifications (architect saw a PR-event; informational)
- `acked`: ack-class notifications (when ack flag flips)

**F3 v1.0 fold — edge-cases:**

1. **Multicast threads** (`routingMode="multicast"`): `currentTurn=role` (not specific agentId). `your-turn` MUST fire for ALL agents matching that role, not just the recipientAgentId. Logic at the emit-site resolving `currentTurn` against agent-identity must enumerate role-members and tag each with `your-turn` (vs `FYI`). Per-agent fan-out at dispatch time.

2. **Thread-less emits** (scheduled-message-fired pulses; bare system notifications without thread context): no `currentTurn` to consult. Default to `FYI`. Subset that gets filter-out per §1.5 will not render at all (no marker needed).

### §1.5 Filter list — events excluded from peek-line render (F4 fold)

Per Survey open-question Q5: lean filter low-signal events from human-visible SSE; surface only adapter-internally for state-machine consumption.

**Filter-list (v1.0; 4 entries per F4 fold):**

| Event class | Reason for filter |
|---|---|
| `agent_state_changed` | Routine internal state transitions; high-volume; adapter consumes for state-machine; not operator-actionable |
| `engineerPulse` / `agentPulse` on standby-acknowledged state | Pure-cadence per `feedback_engineer_pulse_template_carryover.md`; template-carryover noise on ratify-direct missions |
| touchAgent rate-limited updates | Internal heartbeat; not operator-actionable |
| W1b replay-truncated synthetic SSE events | Operator already sees truncation banner via separate channel; redundant peek-line render |

**Implementation:** adapter `tool-manager/dispatcher.ts` consults filter-list before pass-through to `notificationHooks` peek-line classification. Filtered events still flow to adapter-internal state-machine (for cognitive consumption); they just don't surface to terminal.

**Filter-list IS the substrate-feature surface for "what does operator see"** — F4 expansion warrants engineer flag if additional candidates surface during implementation.

---

## §2 Adapter-side scope — render-path update

### §2.1 Render template

```
[<source-class>] <action-verb-phrase> <entity-id>: "<entity-title>" — <body-preview> [<actionability-marker>]
```

Examples post-Phase-1:

```
[Engineer] Replied to thread-487: "idea-252 — name-based dispatch ..." — Round-2 audit response. Concur on all 7 design-asks (your turn)

[Hub] Converged thread-487: "idea-252 — name-based dispatch ..." (FYI)

[Hub] Activated mission-76: "M-RepoEventBridge-Handler-Completion" (FYI)

[System-PR] Architect opened PR #184 in agentic-network (emitted)

[Director] Approved PR #185 (emitted)
```

### §2.2 Action-verb-phrase derivation

Lookup table per emit-class:

| Emit-class | Action-verb-phrase |
|---|---|
| thread_message (peer reply) | "Replied to" |
| thread_message (thread open) | "Opened" |
| thread_convergence_finalized | "Converged" |
| mission_status_changed:proposed→active | "Activated" |
| mission_status_changed:active→completed | "Completed" |
| pr-opened-notification | "<author-role> opened" |
| pr-merged-notification | "<author-role> merged" |
| pr-review-approved-notification | "<author-role> approved" |
| commit-pushed-notification | "<author-role> pushed" |

### §2.3 Truncation policy (Director-stated specific)

**No truncation when message fits within budget.** Total budget ~200 chars per peek-line. Truncation order:

1. body-preview truncated first (with `...`) ONLY if total exceeds budget
2. entity-title truncated next ONLY if still exceeds AND title is >60 chars
3. NEVER truncate source-class / action-verb-phrase / entity-id / actionability-marker

If the entire content fits in one line — render full, no `...` suffix. Per Director directive 2026-05-06.

### §2.4 Body-preview richness (Survey open-question Q7)

Lean: richer than current title-only. First 1-2 sentences of body (max ~100 chars) included as preview. Operator gets context without forcing LLM `get_thread` re-fetch. Doesn't break get_thread-for-full-content semantic — preview is best-effort summary; LLM still fetches full content when engaging.

---

## §3 Test discipline

Per `feedback_format_regex_over_hardcoded_hash_tests.md`: pin contracts (format-regex) not specific values.

Tests:
- **Render contract**: format-regex `/^\[(Hub|Director|Engineer|Architect|System-PR|System-Pulse|System-Audit)\] [a-zA-Z ]+ [a-zA-Z0-9-#:]+/` — peek-line must match the canonical structure
- **Source-class enum**: only the 7 values; reject unknown
- **Entity-id format**: per type (`thread-\d+` / `mission-\d+` / `PR #\d+` / `bug-\d+` / `idea-\d+` / `calibration #\d+` / `task-\d+`); auto-extracted from emit-site
- **Truncation contract**: total ≤ 200 chars; if input < budget → no `...` suffix; if input > budget → `...` only on the body-preview tail
- **Filter contract**: `agent_state_changed` does NOT render to peek-line surface
- **Backward-compat**: pre-Phase-1 notifications without sourceClass field render with fallback `[unknown]` prefix (one release of fallback; Phase 4 hard cutover)

---

## §4 Migration path (backward-compat)

Per Survey open-question Q6: hard cutover preferred (Director's "no legacy debt" stance).

**Phase 1 cutover:**
- All NEW notifications populated with sourceClass + entityRef + actionability fields at emit-time
- OLD notifications already in message store keep old shape; render with fallback `[unknown]` prefix (one-release fallback; sweep on next hub-restart-with-reaper if needed)
- No migration script needed (reaper sweeps stale notifications per existing 7-day threshold)

---

## §5 Anti-goals (out-of-scope for Phase 1)

| AG | Description | Composes-with target |
|---|---|---|
| AG-1 | Don't ship §2 body conventions in Phase 1 — Q4=a pinned §1 first | Phase 3 follow-on (M-Message-Body-Conventions) |
| AG-2 | Don't ship §3 cross-reference auto-extraction in Phase 1 — entityRef populated at emit-site, not parsed from body | Phase 2 follow-on (M-Cross-Reference-Schema) |
| AG-3 | Don't include adapter-side cognitive-pipeline rendering changes — operator-visible wire-output rendering only; cognitive-pipeline surface stays out of scope | future cognitive-pipeline mission (idea-152 territory) |
| AG-4 | Don't pre-emptively split `System-PR` into per-action variants — coarse-grained per F1 | future-canonical IF emit-site complexity warrants split |
| AG-5 | Don't add config knobs (per-operator render-template overrides) — substrate-feature ships canonical render; per-operator customization deferred | future operator-customization idea |

---

## §6 Architect-flags / open questions for engineer round-1 audit

| # | Flag | Architect-recommendation | Audit-rubric class |
|---|---|---|---|
| F1 | INVENTORY-COMPLETENESS — initial inventory at §0.5 estimates ~15-30 emit-sites; full count requires grep across hub/src + adapter render-path | Engineer round-1: run `grep -rn` audit; surface missed surfaces; flag if count > 30 (mission-class re-evaluation) | CRITICAL |
| F2 | Source-class taxonomy granularity — coarse-grained 7-class (lean per F1 of Survey envelope) vs split-System-PR variants | Lean coarse-grained; engineer concur or surface concrete reason for split | PROBE |
| F3 | Actionability marker logic — defaults per emit-class proposed at §1.4; verify edge-cases (e.g., thread waiting on Director vs architect; agent_state_changed → no marker since filtered) | Engineer audit: enumerate edge-cases; refine logic table | MEDIUM |
| F4 | Filter list — Phase 1 filters `agent_state_changed`; surface other low-signal events warranting filter? (scheduled-message-fired? rate-limited touchAgent updates?) | Engineer round-1: enumerate candidates; surface any | MEDIUM |
| F5 | Body-preview richness — 1-2 sentences (~100 chars) preview proposed; verify it doesn't redundantly carry get_thread content for thread-engagement cases | Engineer round-1: confirm OR propose richness-tier | MINOR |
| F6 | Backward-compat fallback — `[unknown]` prefix for pre-Phase-1 notifications; one-release fallback OR no-fallback (display empty)? | Lean one-release `[unknown]` for graceful degradation; engineer concur | MINOR |
| F7 | Migration script — none needed per design; reaper sweeps stale notifications. Verify reaper threshold sufficient | Engineer round-1: spot-check reaper config | PROBE |

---

## §7 Implementation Plan (Phase 4 → Phase 8)

1. **Phase 4 Design v1.0** — fold engineer round-1 audit findings; ratify; authorize implementation
2. **Phase 5 Manifest** — `create_mission(M-SSE-Peek-Line-Cleanup)` post-ratification
3. **Phase 6 Preflight** — verify §6.4 verification gates per calibration #62 promotion (idle-agent-message-render-stability test; canonical-render-format test)
4. **Phase 7 Director release-gate** — Director ratify
5. **Phase 8 Implementation** (engineer):
   - Branch `agent-greg/m-sse-peek-line-cleanup` off main
   - Substrate: extend `ExternalInjectionPayload` shape (per §1.1; mission-56 W5 removed legacy Notification entity — emit wire is `messageStore.createMessage` with `kind: "external-injection"`)
   - Emit-sites: update each per §0.5 inventory (~15-30 sites)
   - Adapter: render-path update consuming new schema fields
   - Tests: format-regex contracts per §3
   - Push + open PR
6. **Phase 9 Closing audit** + **Phase 10 Retrospective**
7. **Phase 11 Mission-flip** to completed

---

## §8 Cross-references

- **`docs/surveys/m-message-structure-cleanup-survey.md`** — parent Survey envelope; this Design concretizes Phase 1
- **idea-253** — source idea (umbrella; A+C scope)
- **idea-254** — sister scope (LLM-facing thread engagement; uses §3 cross-ref schema from Phase 2)
- **idea-251 + idea-252** — foundation (name-as-identity collapse; entity-ID format used in entityRef)
- **calibration #62** — deferred-runtime-gate-becomes-silent-defect-surface; Phase 6 §6.4 verification gate discipline
- **calibration #65** — gate-narrowness-vs-boundary-breadth; relevant for source-class taxonomy completeness
- **`feedback_format_regex_over_hardcoded_hash_tests.md`** — test discipline anchor
- **`feedback_pass10_rebuild_hub_container.md`** — Phase 8 deployment; this PR touches hub/src + adapter

---

## §9 Phase-1.5 follow-up scope (impl-emerged; thread-493 round-7 scope-cut)

Engineer round-7 (PR #188 open) made a judgment call to ship Phase-1 minimum viable substrate-feature (substrate primitives + canonicalize the high-volume `notifyEvent` / `dispatchEvent` path) rather than sweep all ~20-25 emit-classes in one PR. Architect ratified the scope-cut at thread-493 round-8 per Q5=a substrate-feature boundary discipline + `feedback_phase_split_for_oversized_substrate_rewrite.md`. The 4 deferred items below ship as touch-as-you-go incremental Phase-1.5 missions / sub-PRs.

**Priority ordering** (engineer-suggested + architect-ratified at thread-493 round-9 → round-10):

| # | Item | Priority rationale | Class |
|---|---|---|---|
| **1** | **Adapter-side §1.5 filter-list consumption** | Operator-visible delta; the 4 noise classes (`agent_state_changed` / `engineerPulse` standby / touchAgent rate-limit / W1b replay-truncated) STILL render to peek-line until this lands. The F4 fold is substrate-defined but not yet operator-effective. | Substrate-feature (small) |
| 2 | `emitDirectorNotification` body convergence to §2.1 | mission-66 commit 5 STRUCTURAL ANCHOR contract on body composition; **needs separate bilateral cycle** to avoid silent break (do not silently re-route). | Substrate-feature (negotiated) |
| 3 | Path-B direct `messageStore.createMessage` call-sites | 13 call-sites in `pulse-sweeper.ts ×3`, `repo-event-handlers.ts`, `scheduled-message-sweeper.ts`, etc. — mechanical per-emit-class conversion. | Substrate-cleanup (mechanical) |
| 4 | Path-C trigger-table `emitShape` (declarative array in `triggers.ts`) | 3+ table rows; declarative-array per-row update. | Substrate-cleanup (mechanical) |

**Implementation choice for #1:** either (a) duplicate filter-list to adapter package, OR (b) Hub-side suppression flag in SSE wire (`payload.suppress_peek_line: true`). Decide at Phase-1.5 #1 Design.

**Sequencing constraints:**
- **#1 ships first** (only operator-visible-delta item; closes F4 fold in user-perceived behavior).
- **#2 needs its own bilateral cycle** (mission-66 STRUCTURAL ANCHOR negotiation; do not bundle).
- **#3 + #4 are sweep-class** — can ship as one bundled mission OR per-emit-class as touch-as-you-go.

**Phase 2 / Phase 3 dependency:** Phase 3 (M-Message-Body-Conventions) waits on Phase-1.5 #2 (`emitDirectorNotification` body convergence) as natural integration point. Phase 2 (M-Cross-Reference-Schema) does NOT depend on Phase-1.5 — entityRef substrate handoff is complete from Phase 1.

**Architect scheduling:** Phase-1.5 items belong in Strategic Review backlog per `project_target_role_ownership.md` (architect owns Mission scheduling). Surface at next Strategic Review with priority-1 = #1 above.

---

## §10 CI infra finding (out-of-scope follow-on)

PR #188 review surfaced 4 vitest matrix failures verified pre-existing on main tip 5d3e2507 (cognitive-layer / network-adapter / claude-plugin / opencode-plugin) — `setup-node` cache-miss infrastructure issue, not code-level. Wrapper "test" check is SUCCESS (branch-protection-required check satisfied). Worth a separate substrate-cleanup follow-on mission (CI-hygiene class; not Phase-1 scope).

---

— Architect: lily / 2026-05-06 (Design v1.1 RATIFIED; Phase 1 shipped at PR #188 / 2f7e045; Phase-1.5 follow-on scope captured 2026-05-07)
