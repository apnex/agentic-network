# M-RepoEventBridge-Handler-Completion — Design v0.1 DRAFT

**Status:** v0.1 DRAFT (architect-authored 2026-05-05; pending engineer round-1 audit per `mission-lifecycle.md` Phase 4 audit cycle)
**Methodology:** Phase 4 Design per `mission-lifecycle.md` v1.2 §1 (RACI: C=Director / R=Architect+Engineer)
**Source idea:** idea-246 (status `triaged` via Director-direct route-(a) skip-direct 2026-05-05)
**Source bugs:** bug-46 (major; missing-feature; PR-event handler registration gap) + bug-47 (major; identity-resolution; commit-pushed handler gh-login parsing)
**Branch:** `agent-lily/m-repo-event-bridge-handler-completion`
**Routing:** route-(a) skip-direct per Director directive 2026-05-05 ("Skip survey - bug intent scope already well defined by the gap in behaviour, proceed to design with greg")

---

## §0 Document orientation

Pre-substrate-cleanup mission closing two RepoEventBridge implementation gaps surfaced during mission-225 cross-approval cycle. NOT new substrate — existing infrastructure that should work but doesn't.

Reading order:
- §0.5 Existing infrastructure inventory (repo-event-bridge + handler registry + author lookup)
- §1 Mission scope summary
- §2 Architecture overview (gap-shape + fix approach)
- §3 Component designs:
  - §3.1 PR-event handler registration (bug-46 fix; 3 new handler files)
  - §3.2 gh-login parsing investigation + fix (bug-47)
  - §3.3 subkind=unknown investigation
  - §3.4 Handler routing semantics (per-event peer-role mapping)
  - §3.5 Notification body shape (per #41 STRUCTURAL ANCHOR)
- §4 Migration sequencing (single PR per Q2=a precedent)
- §5 Edge cases + failure modes (F1-F5)
- §6 Test / verification strategy
- §7 PR sequencing + content map
- §8 Anti-goals (carry from idea-246)
- §9 Architect-flags for round-1 audit (F1-F5)
- §10 Cross-references
- §11 Audit fold summary (scaffold)

---

## §0.5 Existing infrastructure inventory

| Substrate primitive | Source-of-truth location | Reuse-vs-replace decision |
|---|---|---|
| `RepoEvent` envelope `{kind: "repo-event", subkind, payload}` | `packages/repo-event-bridge/src/translator.ts` (export) | **REUSE UNCHANGED** — wire format established by mission-52 |
| `RepoEventSubkind` enum (5 values: pr-opened, pr-merged, pr-review-submitted, commit-pushed, unknown) | `packages/repo-event-bridge/src/translator.ts:55` | **REUSE UNCHANGED** — translator already classifies all 5 subkinds |
| Translator `dispatchSubkind()` + `normalizeGhEvent()` (per-subkind payload normalization) | `packages/repo-event-bridge/src/translator.ts` | **REUSE** — pr-opened/pr-merged/pr-review-submitted normalization helpers (`normalizePrOpened` line 186 / `normalizePrMerged` line 205 / `normalizePrReviewSubmitted` line 229) ALREADY EXIST; only handler-side consumption missing |
| Translator `extractLogin()` helper (reads `user.login` → `user.name` fallback) | `packages/repo-event-bridge/src/translator.ts:276` | **INVESTIGATE + FIX per bug-47** — handler log shows `gh-login=apnex` reaching role-lookup when should be `apnex-greg`/`apnex-lily`; root-cause within translator OR upstream in event-source `actor` extraction |
| Push event `normalizePush` 3-level pusher fallback chain (`payload.pusher → payload.sender → actor`) | `packages/repo-event-bridge/src/translator.ts:261-264` | **INVESTIGATE per bug-47** — bug-44 fix comment notes Events API has no `payload.pusher`; falls through to `actor`; one of these three sources is yielding `apnex` (org name?) instead of full user login |
| `REPO_EVENT_HANDLERS: readonly RepoEventHandler[]` array | `hub/src/policy/repo-event-handlers.ts:94` | **EXTEND** — append 3 new handlers (pr-opened, pr-merged, pr-review-submitted) following existing array convention |
| `findRepoEventHandler(subkind)` lookup | `hub/src/policy/repo-event-handlers.ts:107` | **REUSE UNCHANGED** — handler registry pattern works correctly; only missing entries |
| `RepoEventHandler` interface `{subkind, name, handle: (msg, ctx) => Promise<MessageDispatch[]>}` | `hub/src/policy/repo-event-handlers.ts` | **REUSE UNCHANGED** — handler contract established by mission-68 W1 |
| `lookupRoleByGhLogin(ghLogin, ctx)` — exact-match against `ois.io/github/login` agent label | `hub/src/policy/repo-event-author-lookup.ts:42` | **REUSE UNCHANGED** — lookup mechanism correct; exact-string match expected; bug-47 fix happens UPSTREAM of lookup (translator-side) |
| `GITHUB_LOGIN_LABEL = "ois.io/github/login"` constant | `hub/src/policy/repo-event-author-lookup.ts:33` | **REUSE UNCHANGED** — adapter-side discipline registers labels under this key |
| `commit-pushed` handler implementation (mission-68 W1; engineer→architect direction) | `hub/src/policy/repo-event-commit-pushed-handler.ts` | **REUSE PATTERN** for new PR-event handlers (similar shape: extract → resolve → emit) |
| AG-7 from mission-68 — architect-pushes NO emission for commit-pushed (engineer-cadence-discipline scope) | `hub/src/policy/repo-event-commit-pushed-handler.ts:78-82` | **DO NOT propagate to PR-events** per §3.4 symmetric-coverage rationale (PR-events are bilateral cross-approval surface, NOT engineer-cadence-discipline) |
| Message-policy dispatch path (kind=note + payload.kind=repo-event) | `hub/src/policy/message-policy.ts:224-268` | **REUSE UNCHANGED** — dispatch mechanism correct; only missing handlers cause "skipping (non-fatal)" log |
| `MessageDispatch[]` return type for handlers | `hub/src/policy/repo-event-handlers.ts` | **REUSE UNCHANGED** — supports 0-N notifications per inbound event |
| #41 STRUCTURAL ANCHOR (mission-66 commit 5; triggers.ts:108-119) — terse `body: string` + structured payload sub-fields | `hub/src/policy/triggers.ts:108-119` | **REUSE PATTERN** for PR-event notification bodies |

---

## §1 Mission scope summary

| Axis | Bound |
|---|---|
| Mission scope | 3 new PR-event handlers (pr-opened, pr-merged, pr-review-submitted) + bug-47 gh-login parsing fix + subkind=unknown investigation document + tests |
| Mission class | pre-substrate-cleanup (existing-substrate refactor; close behavioral gaps; not new substrate) |
| Tele alignment (primary) | tele-7 (Resilient Agentic Operations) — closes operational PR-event-delivery gap; tele-3 (Sovereign Composition) — clean handler registration following mission-68 pattern |
| Tele alignment (secondary) | tele-2 (Isomorphic Specification) — gh-login parsing aligned with `ois.io/github/login` label format |
| Director picks | route-(a) skip-direct per directive 2026-05-05 |

---

## §2 Architecture overview

Two distinct gap classes; same mission to close both since they share substrate (translator + handler registry).

### Gap A (bug-46) — handler-registration gap

```
GH event → Bridge.poll → Translator.normalize → Sink (create_message) → Hub message store
                                                                              ↓
                                                                     message-policy dispatch
                                                                              ↓
                                                              findRepoEventHandler(subkind)
                                                                          ↙       ↘
                                                            ✅ commit-pushed     ❌ pr-opened (no handler)
                                                                                  ❌ pr-merged (no handler)
                                                                                  ❌ pr-review-submitted (no handler)
                                                                                  ❌ unknown (intentional fallback)
                                                                                       ↓
                                                                             "skipping (non-fatal)" log
                                                                             event silently dropped
```

**Fix:** implement 3 handler files following `commit-pushed-handler.ts` pattern; append to `REPO_EVENT_HANDLERS` array.

### Gap B (bug-47) — identity-resolution gap

```
GH event {actor: {login: "apnex-greg"}} → Translator.extractLogin → ??? → handler.pusher = "apnex"  ← BUG
                                                                                ↓
                                                                  lookupRoleByGhLogin("apnex")
                                                                                ↓
                                                              listAgents() iterates: apnex-greg + apnex-lily
                                                                                ↓
                                                                no match (exact-string compare against label)
                                                                                ↓
                                                                       "no role mapping" log
                                                                       event silently dropped
```

**Fix surface to investigate (engineer):**
- (a) Translator `extractLogin()` returns wrong field (e.g., reads `user.name=apnex` instead of `user.login=apnex-greg`)
- (b) GH Events API returns unexpected actor structure for our events (org-level actor vs user-level actor — possible since repo is org-owned `apnex-org`)
- (c) `normalizePush` 3-level fallback chain (line 261-264) yields wrong source (e.g., `payload.sender` populated with org info)

**Engineer investigation deliverable:** root-cause + fix; document inline in PR description.

**Architect specification (behavioral requirement):** gh-login value reaching `lookupRoleByGhLogin` MUST match registered agent's `ois.io/github/login` label format (full login `apnex-greg`/`apnex-lily`) for events where actor IS a registered user.

---

## §3 Component designs

### §3.1 PR-event handler registration (bug-46 fix)

**Pattern:** mirror `repo-event-commit-pushed-handler.ts` structure for each new handler.

**3 new handler files in `hub/src/policy/`:**
- `repo-event-pr-opened-handler.ts` — handler for `subkind=pr-opened`
- `repo-event-pr-merged-handler.ts` — handler for `subkind=pr-merged`
- `repo-event-pr-review-submitted-handler.ts` — handler for `subkind=pr-review-submitted`

**Registration in `repo-event-handlers.ts`:**
- Import each constant (e.g., `import { PR_OPENED_HANDLER } from "./repo-event-pr-opened-handler.js";`)
- Append to `REPO_EVENT_HANDLERS` array

**Per-handler logic (uniform shape; per-event payload differs):**
1. Extract relevant payload fields from `inbound.payload.payload` (the bridge's normalized `RepoEvent.payload`)
2. Resolve author role via `lookupRoleByGhLogin(authorLogin, ctx)`
3. If role resolves: emit `MessageDispatch[]` (target: peer role per §3.4 routing matrix)
4. If author-role unknown: log + skip (per existing `commit-pushed` pattern)
5. If author-role matches AG-7-style carve-out (decided per §3.4): log + skip

### §3.2 gh-login parsing fix (bug-47 root-cause investigation + fix)

**Engineer investigation deliverables (concrete):**

1. **Reproduce bug-47 locally** — push commit to a test branch with greg's identity; observe Hub log line `gh-login=apnex` (singular).

2. **Trace `actor.login` value through translator → handler:**
   - Read raw GH Events API response (could log to disk via `OIS_REPO_EVENT_BRIDGE_DEBUG_LOG_PATH` or similar; engineer's call on instrumentation)
   - Verify which level of `normalizePush` 3-level fallback (`pusher → sender → actor`) yields the value
   - Identify: Is `actor.login` actually `apnex` from GH API, OR is `extractLogin` reading wrong field?

3. **Identify root cause:**
   - (a) Translator field selection bug
   - (b) GH API actor-shape unexpected (returns org info vs user info)
   - (c) `extractLogin` helper bug (line 276-279)

4. **Document finding inline in PR description** (per `feedback_pr_branch_base_preflight.md` precedent — explicit reproduction + finding + fix-rationale in PR body).

**Fix requirement:** gh-login value reaching `lookupRoleByGhLogin` MUST match registered agent's `ois.io/github/login` label exactly.

**Architect-recommendation (engineer overrides if substrate-reality differs):**

Most likely root cause is option (b) — GH Events API for org-owned repo returns `actor` populated with org-level info for some event types, while user-specific info lives in `payload.head_commit.author` or similar. Fix candidate: use `payload.head_commit.author.username` as primary source; fall back to `actor.login` only if not present.

**Engineer-determined fix.** Architect specifies behavioral requirement; engineer determines mechanism per substrate-investigation findings.

### §3.3 subkind=unknown investigation

Multiple `subkind=unknown` events visible in Hub logs across mission-225 timeframe. Translator documents `unknown` as load-bearing fallback (line 33: "the load-bearing fallback").

**Engineer investigation deliverable (light-touch; documentation only):**
- Sample which GH event types are dropping into `unknown` subkind
- Document inline in PR description for future-canonical handler addition decisions
- NOT in scope to add coverage for unknowns; just visibility

### §3.4 Handler routing semantics (per-event peer-role mapping)

| Subkind | Author role | Notification target | AG carve-out |
|---|---|---|---|
| pr-opened | engineer | architect (peer) | architect-opens-PR → engineer (symmetric) |
| pr-merged | engineer | architect | architect-merges → engineer (symmetric) |
| pr-review-submitted | engineer | architect | architect-reviews → engineer (symmetric) |
| commit-pushed | engineer | architect | architect-pushes → no emission (AG-7 from mission-68; UNCHANGED) |

**Symmetric-coverage rationale for PR-events (NEW for this mission; differs from commit-pushed):**

PR-events are the **bilateral cross-approval surface**. Both directions need notifications:
- Architect-opens-PR (e.g., docs-only post-merge artifacts like mission-225 PR #168) → engineer should be aware (cross-approval coordination)
- Engineer-opens-PR (mission implementation) → architect should be aware (current standard pattern)

This contrasts with commit-pushed (mission-68 AG-7 architect-pushes-skip rationale: "engineer-cadence-discipline" — not relevant to PR-event surface).

**Architect-flag F2 (round-1 audit):** confirm symmetric-coverage decision; PRs in both directions should fire notifications. If reviewer prefers asymmetric (e.g., only engineer→architect on pr-events to mirror commit-pushed), surface for resolution.

### §3.5 Notification body shape

Per **#41 STRUCTURAL ANCHOR** (mission-66 commit 5; `triggers.ts:108-119` canonical pattern): terse `body: string` + structured payload sub-fields for adapter-side `source-attribute.ts` rendering.

**Example (pr-opened):**
```typescript
{
  kind: "note",
  target: { role: "architect" },  // or "engineer" per §3.4 symmetric routing
  delivery: "push-immediate",
  payload: {
    body: `Engineer opened PR #${prNumber}: ${prTitle}`,
    prNumber,
    prTitle,
    prAuthor,
    prHeadRef,
    prBaseRef,
    prUrl,
    repo,
    sourceMessageId: inbound.id,
  },
  intent: "pr-event",  // architect-flag F3 — new intent value; reviewer-confirm
}
```

**Body templates:**
- pr-opened: `${peerRole} opened PR #${prNumber}: ${prTitle}`
- pr-merged: `${peerRole} merged PR #${prNumber}: ${prTitle}`
- pr-review-submitted: `${peerRole} reviewed PR #${prNumber} (${reviewState}): ${prTitle}`

---

## §4 Migration sequencing

**Per Q2=a precedent (mission-225) — single PR, big-bang additive.**

**Single PR adds:**
- 3 new handler files (pr-opened, pr-merged, pr-review-submitted)
- 3 imports + 3 array entries in `repo-event-handlers.ts`
- bug-47 fix in translator (engineer-determined; ~5-15 lines)
- Translator unit test for fix (bug-47 fixture)
- 3 handler unit test files (one per new handler)
- Registry test extension (assert 4 handlers present)

**No state-migration script needed** — additive (new handlers); plus translator fix is internal correction. No schema-rename concerns.

**Consumer-update opportunism:** none — handlers are pure additions; existing message-policy dispatch already handles unknown handlers gracefully.

---

## §5 Edge cases + failure modes

### §5.1 F1 (MEDIUM) — pusher fallback chain in normalizePush

`normalizePush` line 261-264 has 3-level fallback: `payload.pusher → payload.sender → actor`. Bug-47 root-cause may be in one of these levels. Engineer investigation should validate which level is used + whether the value at that level is correct vs unexpected.

**Mitigation:** engineer-determined fix per §3.2. Test fixtures cover all 3 levels.

### §5.2 F2 (MEDIUM) — Handler routing on architect-author PR events

When architect (lily) opens PR / merges / reviews, do we want engineer (greg) notified? §3.4 says yes (symmetric), differs from commit-pushed AG-7. **Architect-recommendation:** symmetric-yes. **Reviewer-confirm at round-1.**

### §5.3 F3 (MINOR) — Unknown-subkind events (informational only)

§3.3 investigation deliverable; non-blocking for ratification. Future-canonical follow-on.

### §5.4 F4 (MINOR) — Multi-repo support

`OIS_REPO_EVENT_BRIDGE_REPOS` env var supports comma-separated list of repos. Current handler emit semantics are repo-agnostic (target: role). If multi-repo expands, per-repo routing may need refinement. NOT in scope for this mission.

### §5.5 F5 (MINOR) — Handler-test coverage edge cases

- Missing payload (defensive skip per existing pattern) — covered
- Author-role unknown (lookup returns null) — covered
- Author-role is architect (symmetric routing per §3.4) — covered

---

## §6 Test / verification strategy

### §6.1 Hub-side tests (vitest)

- **`hub/test/policy/repo-event-pr-opened-handler.test.ts`** *(NEW)* — handler unit tests:
  - engineer-opens-PR → architect notification (full payload assertions)
  - architect-opens-PR → engineer notification (symmetric)
  - unknown-author → skip (lookup returns null)
  - missing payload → skip (defensive)
- **`hub/test/policy/repo-event-pr-merged-handler.test.ts`** *(NEW)* — analogous structure
- **`hub/test/policy/repo-event-pr-review-submitted-handler.test.ts`** *(NEW)* — analogous structure
- **`hub/test/policy/repo-event-handlers.test.ts`** *(EXTEND)* — registry assertion: `REPO_EVENT_HANDLERS.length === 4`; each handler subkind matches expected; lookup by subkind returns expected
- `hub/test/policy/repo-event-author-lookup.test.ts` *(existing; verify still PASS)*

### §6.2 Translator tests (bug-47 fix)

- **`packages/repo-event-bridge/test/translator.test.ts`** *(EXTEND)* — fixtures:
  - GH push event with `actor.login: "apnex-greg"` → assert normalized output `pusher === "apnex-greg"` (NOT `apnex` or other)
  - GH PR event with `pull_request.user.login: "apnex-lily"` → assert prAuthor extracted correctly
  - Edge: `payload.pusher` populated → uses pusher (level 1)
  - Edge: `payload.sender` populated, no pusher → uses sender (level 2)
  - Edge: only `actor.login` populated → uses actor (level 3)
  - Bug-47 specific fixture: whatever GH API actually returns that produced `apnex` in production logs

### §6.3 Verification gates (Phase 6 + Phase 7)

- §6.1 + §6.2 all pass on PR branch
- `git grep -c "PR_OPENED_HANDLER" hub/src/` ≥ 1 (handler exported + imported in registry)
- `git grep -c "PR_MERGED_HANDLER" hub/src/` ≥ 1
- `git grep -c "PR_REVIEW_SUBMITTED_HANDLER" hub/src/` ≥ 1
- `REPO_EVENT_HANDLERS` array contains 4 entries (commit-pushed + 3 new)
- **Pass 10 rebuild SUCCESS** — Hub container rebuilds cleanly with new handlers
- **Runtime smoke-test (architect-side post-Pass-10):** trigger PR-open via test branch + observe Hub log shows handler invocation (NOT "no repo-event handler registered")
- **Runtime smoke-test (architect-side post-Pass-10):** push commit via greg's identity + observe Hub log shows successful role-mapping (NOT "no role mapping for gh-login=apnex")
- bug-46 + bug-47 status flipped to `resolved` post-merge (architect mutator)

---

## §7 PR sequencing + content map

**Single mega-PR per Q2=a precedent.**

| File | Change | Lines (est.) |
|---|---|---|
| `docs/designs/m-repo-event-bridge-handler-completion-design.md` | This Design v0.1 → v1.0 | +500 |
| `docs/missions/m-repo-event-bridge-handler-completion-preflight.md` | Phase 6 preflight | +120 |
| **`hub/src/policy/repo-event-pr-opened-handler.ts`** *(NEW)* | pr-opened handler | +60 |
| **`hub/src/policy/repo-event-pr-merged-handler.ts`** *(NEW)* | pr-merged handler | +60 |
| **`hub/src/policy/repo-event-pr-review-submitted-handler.ts`** *(NEW)* | pr-review-submitted handler | +70 (review state branching adds slight complexity) |
| `hub/src/policy/repo-event-handlers.ts` | Append 3 imports + 3 array entries | +6 / -0 |
| `packages/repo-event-bridge/src/translator.ts` | bug-47 fix (engineer-determined per §3.2 investigation) | +5-15 / variable |
| `hub/test/policy/repo-event-pr-opened-handler.test.ts` *(NEW)* | Handler unit tests | +90 |
| `hub/test/policy/repo-event-pr-merged-handler.test.ts` *(NEW)* | Handler unit tests | +90 |
| `hub/test/policy/repo-event-pr-review-submitted-handler.test.ts` *(NEW)* | Handler unit tests | +100 |
| `hub/test/policy/repo-event-handlers.test.ts` | Registry assertion update | +10 |
| `packages/repo-event-bridge/test/translator.test.ts` | Translator unit tests for bug-47 + 3 PR-event types | +60 |
| `docs/audits/m-repo-event-bridge-handler-completion-closing-audit.md` | Phase 9 | +120 |
| `docs/reviews/m-repo-event-bridge-handler-completion-retrospective.md` | Phase 10 | +150 |

**Total est.** ~1430 lines net addition.

---

## §8 Anti-goals (carry from idea-246)

| AG | Description | Composes-with |
|---|---|---|
| AG-1 | Don't redesign RepoEventBridge architecture (poll-based stays; envelope shape stays; mission-52 substrate UNCHANGED) | n/a |
| AG-2 | Don't add new GH event-types beyond pr-opened / pr-merged / pr-review-submitted in this mission (commit-pushed-architect-symmetric is idea-227 scope) | future-canonical (idea-227) |
| AG-3 | Don't bundle with idea-244 (M-Design-Process-Mechanisation) Vision — orthogonal scope | idea-244 stays separate |
| AG-4 | Don't introduce new role-resolution mechanism beyond `ois.io/github/login` label format (mission-68 W1 substrate UNCHANGED) | future ideas (TBD; trigger = label-system redesign) |
| AG-5 | Don't add webhook-based ingestion (poll-based stays per AG-1) | future ideas (TBD; trigger = real-time-event-latency requirement) |
| AG-6 | Don't add unknown-subkind translator coverage in this mission (investigation only; document for future) | follow-on idea trigger (when 2+ instances of unhandled subkind warrant attention) |

---

## §9 Architect-flags for round-1 audit

| # | Flag | Architect-recommendation |
|---|---|---|
| F1 (MEDIUM) | bug-47 root-cause unclear without engineer investigation; Design specifies behavioral requirement only (gh-login value matches `ois.io/github/login` label) | Engineer determines fix mechanism during Phase 8 implementation; document finding inline in PR description |
| F2 (MEDIUM) | Symmetric-coverage decision for PR-events (§3.4) — architect-PR notifies engineer? | Default symmetric-yes (different from commit-pushed AG-7); reviewer-confirm at round-1 |
| F3 (MINOR) | Notification body shape — `intent: "pr-event"` is a new intent value; reviewer-confirm or suggest existing-vocabulary | Reviewer-confirm intent value |
| F4 (MINOR) | subkind=unknown investigation deliverable — what depth + format | Engineer judgement; document findings in PR description |
| F5 (PROBE) | Handler-shape symmetry — should pr-opened/pr-merged/pr-review-submitted share an internal helper for common extract+resolve+emit logic? | Engineer call (DRY vs explicit per-event); architect leans explicit-per-event for readability |

---

## §10 Cross-references

- **Source idea:** idea-246 (M-RepoEventBridge-Handler-Completion; status `triaged` per Director route-(a) skip-direct 2026-05-05)
- **Source bugs:** bug-46 (PR-event handler registration gap; major; missing-feature) + bug-47 (gh-login parsing/role-mapping gap; major; identity-resolution)
- **Sister missions:**
  - mission-52 (RepoEventBridge T3 Hub-side composition; original substrate)
  - mission-68 W1 (commit-pushed handler — AG-7 architect-skip; this mission's pattern source)
- **Composes-with idea-227** — symmetric-coverage for commit-pushed (architect-pushes notification); future-canonical via this mission's pattern propagation
- **Composes-with idea-244** — M-Design-Process-Mechanisation Vision; mission-225 walk-through pattern surfaced bug-46 + bug-47 visibility gap; closing this mission reduces (but does not eliminate) bilateral-blind-spot dependency from idea-244 Vision constituent missions
- **Substrate to extend:**
  - `hub/src/policy/repo-event-handlers.ts` (append 3 imports + 3 array entries)
  - `hub/src/policy/repo-event-pr-opened-handler.ts` (NEW; modeled on commit-pushed-handler.ts)
  - `hub/src/policy/repo-event-pr-merged-handler.ts` (NEW)
  - `hub/src/policy/repo-event-pr-review-submitted-handler.ts` (NEW)
  - `packages/repo-event-bridge/src/translator.ts` (bug-47 fix; engineer-determined location)
- **Methodology:**
  - `docs/methodology/idea-survey.md` v1.0 (Survey skipped per Director route-(a) directive; not consumed)
  - `docs/methodology/strategic-review.md` (Idea Triage Protocol; route-(a) skip-direct applied)
  - `docs/methodology/mission-lifecycle.md` v1.2 (Phase 4 Design entry methodology; pre-substrate-cleanup class)
  - `docs/methodology/mission-preflight.md` v1.0 (Phase 6 preflight authoring methodology)
  - `docs/methodology/multi-agent-pr-workflow.md` v1.0 (cross-approval pattern at Phase 8)
- **Memory references:**
  - `feedback_pass10_rebuild_hub_container.md` — applies pre-merge (Hub source touched extensively)
  - `feedback_review_loop_calibration_surface.md` — review cycles surface methodology calibrations
  - `feedback_thread_vs_github_approval_decoupled.md` — applies at Phase 8 cross-approval (BOTH thread AND `gh pr review --approve`)
  - `feedback_design_phase_lib_extraction_for_substrate_bash.md` — NOT applicable (no bash substrate in this mission)
  - `feedback_pr_branch_base_preflight.md` — applies at PR-open (state actual base/head explicitly)

---

## §11 Audit fold summary scaffold

(Populated during round-N audit cycles per `mission-lifecycle.md` Phase 4 discipline.)

### §11.1 Round-1 audit folds (v0.1 → v0.2)

(pending engineer round-1 audit)

### §11.2 Round-N audit folds (v0.N → v0.N+1)

(pending if subsequent rounds warranted)

### §11.3 Verdict

(populated at ratification)

---

— Architect: lily / 2026-05-05 (Phase 4 Design v0.1 DRAFT; route-(a) skip-direct per Director directive 2026-05-05; bug-46 + bug-47 paired closure; pending engineer round-1 audit per `mission-lifecycle.md`)
