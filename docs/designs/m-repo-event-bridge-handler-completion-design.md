# M-RepoEventBridge-Handler-Completion — Design v1.0

**Status:** v1.0 RATIFIED (architect-finalised 2026-05-05; engineer round-1 + round-2 audits folded — round-2 caught 4 fold-incomplete regressions (R1 §2 diagram + R2 §3.1 helper-extraction reference + R3 §3.2 substrate-realistic caveats + R4 §6.1 helper test enumeration); option-(β) v1.0 ratification with R1-R4 landed in this commit per engineer recommendation — 2nd canonical instance of cumulative-fold-regression-class; methodology-fold trigger MET → filed as **idea-247 (M-Audit-Rubric-Cumulative-Fold-Regression-Class)** per mission-73 §3d wait-for-2nd-canonical-instance discipline)
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
| `RepoEventSubkind` enum (**8 values per round-1 C1 fold**: pr-opened, **pr-closed**, pr-merged, pr-review-submitted, **pr-review-approved**, **pr-review-comment**, commit-pushed, unknown) | `packages/repo-event-bridge/src/translator.ts:48-57` | **REUSE UNCHANGED** — translator already classifies all 8 subkinds + per-type normalization helpers exist (normalizePullRequest / normalizePullRequestReview / normalizePullRequestReviewComment / normalizePush). v0.1 incorrectly stated "5 values" + only enumerated 5; v0.2 corrects per C1 |
| **Mission handler-coverage scope (NEW v0.2 per C1 fold):** 4 of 8 subkinds covered in-mission (commit-pushed existing + 3 NEW PR-event handlers); 3 carved-out per §8 AG-2; 1 unknown intentional fallback | `hub/src/policy/repo-event-handlers.ts` (post-mission state) | **EXPLICIT CARVE-OUT** — pr-closed + pr-review-approved + pr-review-comment remain handler-uncovered post-mission per option (b); see §8 AG-2 per-subkind rationale + §3.1 mission-coverage table |
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

### Gap A (bug-46) — handler-registration gap (v1.0 R1 fold — full enum coverage with carve-outs)

```
GH event → Bridge.poll → Translator.normalize → Sink (create_message) → Hub message store
                                                                              ↓
                                                                     message-policy dispatch
                                                                              ↓
                                                              findRepoEventHandler(subkind)
                                                                          ↙          ↘
                                                            ✅ commit-pushed        Per RepoEventSubkind
                                                            (mission-68 W1)        enum (8 values; v0.2 C1):
                                                                                      ↓
                                                                       ❌ pr-opened (no handler) ── this mission
                                                                       ❌ pr-merged (no handler) ── this mission
                                                                       ❌ pr-review-submitted (no handler) ── this mission
                                                                       ❌ pr-closed (no handler) ── CARVED OUT per AG-2
                                                                       ❌ pr-review-approved (no handler) ── CARVED OUT per AG-2
                                                                       ❌ pr-review-comment (no handler) ── CARVED OUT per AG-2
                                                                       ❌ unknown (intentional fallback)
                                                                                      ↓
                                                                  "skipping (non-fatal)" log; event silently dropped
                                                                  (3 in-mission ❌ → ✅ post-PR; 3 CARVED ❌ remain;
                                                                   1 unknown intentional)
```

**Fix:** implement 3 handler files (pr-opened / pr-merged / pr-review-submitted) following `commit-pushed-handler.ts` pattern; append to `REPO_EVENT_HANDLERS` array. Mission-coverage: **4 of 8 subkinds** (commit-pushed existing + 3 NEW PR-event handlers); 3 carve-outs with per-subkind rationale per §3.1.1; 1 unknown intentional fallback.

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

**Per-handler logic (uniform shape; per-event payload differs; v0.2 m2 fold — explicit role-skip enumeration):**
1. Extract relevant payload fields from `inbound.payload.payload` (the bridge's normalized `RepoEvent.payload`)
2. Resolve author role via `lookupRoleByGhLogin(authorLogin, ctx)`
3. **Skip if author-role is `null`** (lookup miss — log + skip; pre-existing pattern from `commit-pushed-handler.ts:72-77`)
4. **Skip if author-role is `"director"`** (no peer-role for engineer↔architect-targeted notifications — Director-author PRs are out of bilateral cross-approval scope; log + skip)
5. **Otherwise emit notification targeting the peer:**
   - `engineer` author → emit `target: { role: "architect" }`
   - `architect` author → emit `target: { role: "engineer" }` (symmetric per §3.4; differs from commit-pushed AG-7)

**Helper extraction per v0.2 P1 concur (v1.0 R2 fold — explicit reference):**

Steps 1-5 above implemented in `synthesizePrNotification(inbound, ctx, opts)` helper (NEW file `hub/src/policy/repo-event-pr-handler-helpers.ts` per §7 content map). Per-handler files (`repo-event-pr-{opened,merged,review-submitted}-handler.ts`) are thin wrappers calling the helper with subkind-specific opts:

```typescript
interface SynthesizePrNotificationOpts {
  subkind: "pr-opened" | "pr-merged" | "pr-review-submitted";
  bodyTemplate: (peerRoleVerb: string, payload: PrPayload) => string;
  payloadExtractor: (raw: unknown) => PrPayload;
  intentValue: string;  // per-subkind per §3.5 m1 fold
}
```

Each thin wrapper provides its subkind-specific opts; helper handles common extract → resolve-role → emit semantics. Engineer reverts to explicit-per-event at preflight if substrate-investigation suggests otherwise (P1 carry-forward).

### §3.1.1 Mission handler-coverage table (NEW v0.2 per C1 fold)

| Subkind | Translator support | Handler in this mission | §8 AG-2 carve-out rationale |
|---|---|---|---|
| commit-pushed | ✅ existing | ✅ EXISTING (mission-68 W1; UNCHANGED) | n/a (in-substrate) |
| pr-opened | ✅ existing | ✅ NEW v0.2 | n/a (in-mission) |
| pr-merged | ✅ existing | ✅ NEW v0.2 | n/a (in-mission) |
| pr-review-submitted | ✅ existing | ✅ NEW v0.2 | n/a (in-mission) |
| pr-closed | ✅ existing | ❌ DEFERRED | Author-abandon-or-decline; low peer-coord signal value (peer sees PR-state on GitHub if needed); pr-merged covers success-state delivery. Defer to future-canonical follow-on if abandon-pattern recurrence warrants |
| pr-review-approved | ✅ existing | ❌ DEFERRED | Separate GH event from pr-review-submitted (which is umbrella; review-state encoded in payload). Potentially redundant with pr-review-submitted handler reading review state; defer pending post-mission behavioral observation. If pr-review-submitted handler's review-state decoding turns out incomplete, file follow-on |
| pr-review-comment | ✅ existing | ❌ DEFERRED | Per-comment mid-review chatter; high-volume; lower signal-per-event ratio than pr-review-submitted decision-point. Defer to future-canonical (operator-UX trigger; if/when comment-thread-discipline becomes load-bearing) |
| unknown | ✅ load-bearing fallback | n/a (intentional skip) | Translator's documented fallback for unrecognized GH events; §3.3 light-touch investigation only |

**Net mission-coverage: 4 of 8 subkinds (50%; 3 NEW + commit-pushed existing); 3 explicit carve-outs with per-subkind rationale; 1 intentional fallback.**

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

**Substrate-realistic caveats per round-1 P3 concur (v1.0 R3 fold):**

Engineer round-1 audit surfaced 3 caveats on this fix candidate that warrant explicit substrate-investigation:

1. **Commit-author-vs-pusher distinction:** For PushEvent, `payload.head_commit.author` is the COMMIT author (resolved via local git-config user.email / user.name). The pusher (the user who pushed the commits to the remote) MAY be different from the commit author when commits are authored elsewhere then pushed by different identity. Bug-47 cares about the pusher, not the commit author. If commit-author shape unreliable for our PushEvents, fall through to fallback logic.

2. **Noreply-email-parse fragility:** GitHub-noreply-emailed commits use the pattern `<id>+<username>@users.noreply.github.com`. Parsing this email to extract `<username>` is FRAGILE (depends on noreply format stability) but more reliable than commit-author-name when commits are GitHub-noreply-emailed. Treat as fallback if commit-author shape unreliable.

3. **Events API `payload.sender` shape re-verification:** Bug-44 fix comment notes "Events API has no pusher/sender in payload" (translator.ts:258-260). Worth re-validating — the API may have evolved since bug-44 fix-time. Engineer-substrate-investigation step: query GH Events API directly via curl + observe whether `sender` is populated for our PushEvent shape; if yes, use directly; if no, document the API behavior inline.

**Engineer-determined fix.** Architect specifies behavioral requirement (gh-login MUST match `ois.io/github/login` label format); engineer determines mechanism per substrate-investigation findings + documents raw-API-response inline in PR description per `feedback_pr_branch_base_preflight.md` precedent.

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

**Per-subkind intent values (v0.2 m1 fold per engineer recommendation; symmetry with adapter-side `source-attribute.ts` pattern + finer-grained operator-side filter handle):**
- `intent: "pr-opened-notification"` (pr-opened handler)
- `intent: "pr-merged-notification"` (pr-merged handler)
- `intent: "pr-review-notification"` (pr-review-submitted handler; covers all review states emitted by this subkind)

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
  intent: "pr-opened-notification",  // v0.2 m1 fold — per-subkind value
}
```

**Body templates:**
- pr-opened: `${peerRole} opened PR #${prNumber}: ${prTitle}`
- pr-merged: `${peerRole} merged PR #${prNumber}: ${prTitle}`
- pr-review-submitted: `${peerRole} reviewed PR #${prNumber} (${reviewState}): ${prTitle}` (where reviewState ∈ `approved` / `changes_requested` / `commented` per GH PR review state enum)

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
- **`hub/test/policy/repo-event-pr-handler-helpers.test.ts`** *(NEW; v0.2 P1 concur + v1.0 R4 fold)* — `synthesizePrNotification` helper unit tests:
  - subkind-vs-bodyTemplate dispatch correctness (3 subkinds × 3 templates rendered correctly)
  - payloadExtractor application (per-subkind extractor receives raw payload + returns normalized)
  - intent value pass-through (per-subkind intent reaches MessageDispatch.intent)
  - symmetric peer-routing logic exercised across opts permutations (engineer→architect; architect→engineer)
  - Skip-paths (null author-role; "director" author-role) verified at helper level (DRY pattern means handlers don't re-test these)

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
| **`hub/src/policy/repo-event-pr-opened-handler.ts`** *(NEW)* | pr-opened handler | +85 (v0.2 m3 fold; commit-pushed-handler.ts ~110 line baseline) |
| **`hub/src/policy/repo-event-pr-merged-handler.ts`** *(NEW)* | pr-merged handler | +85 (v0.2 m3 fold) |
| **`hub/src/policy/repo-event-pr-review-submitted-handler.ts`** *(NEW)* | pr-review-submitted handler | +95 (v0.2 m3 fold; review-state branching adds slight complexity) |
| **`hub/src/policy/repo-event-pr-handler-helpers.ts`** *(NEW; v0.2 P1 concur)* | `synthesizePrNotification` shared helper extracted per engineer DRY recommendation; ~50 lines | +50 |
| `hub/src/policy/repo-event-handlers.ts` | Append 3 imports + 3 array entries | +6 / -0 |
| `packages/repo-event-bridge/src/translator.ts` | bug-47 fix (engineer-determined per §3.2 investigation) | +5-15 / variable |
| `hub/test/policy/repo-event-pr-opened-handler.test.ts` *(NEW)* | Handler unit tests | +120 (v0.2 m3 fold +30%) |
| `hub/test/policy/repo-event-pr-merged-handler.test.ts` *(NEW)* | Handler unit tests | +120 (v0.2 m3 fold +30%) |
| `hub/test/policy/repo-event-pr-review-submitted-handler.test.ts` *(NEW)* | Handler unit tests | +130 (v0.2 m3 fold +30%) |
| `hub/test/policy/repo-event-pr-handler-helpers.test.ts` *(NEW; v0.2 P1 concur)* | `synthesizePrNotification` helper unit tests | +60 |
| `hub/test/policy/repo-event-handlers.test.ts` | Registry assertion update | +10 |
| `packages/repo-event-bridge/test/translator.test.ts` | Translator unit tests for bug-47 + 3 PR-event types | +80 (v0.2 m3 fold +30%) |
| `docs/audits/m-repo-event-bridge-handler-completion-closing-audit.md` | Phase 9 | +120 |
| `docs/reviews/m-repo-event-bridge-handler-completion-retrospective.md` | Phase 10 | +150 |

**Total est. (v0.2 m3 fold):** ~1700 lines net addition (revised up from v0.1's ~1430 per substrate-realistic baseline + DRY-helper P1 concur addition).

---

## §8 Anti-goals (carry from idea-246)

| AG | Description | Composes-with |
|---|---|---|
| AG-1 | Don't redesign RepoEventBridge architecture (poll-based stays; envelope shape stays; mission-52 substrate UNCHANGED) | n/a |
| AG-2 (v0.2 reframe per round-1 M1 fold) | Don't add handlers for **pr-closed / pr-review-approved / pr-review-comment** in this mission per per-subkind rationale (these existing-but-uncovered subkinds defer to future-canonical follow-on; behavioral observation triggers: abandon-pattern recurrence; pr-review-submitted decoding incompleteness; comment-thread-discipline load-bearing). Per-subkind rationale documented in §3.1.1 mission-coverage table. Commit-pushed-architect-symmetric is idea-227 scope (separate from this mission's PR-event scope) | future-canonical (idea-227 + per-subkind triggers) |
| AG-3 | Don't bundle with idea-244 (M-Design-Process-Mechanisation) Vision — orthogonal scope | idea-244 stays separate |
| AG-4 | Don't introduce new role-resolution mechanism beyond `ois.io/github/login` label format (mission-68 W1 substrate UNCHANGED) | future ideas (TBD; trigger = label-system redesign) |
| AG-5 | Don't add webhook-based ingestion (poll-based stays per AG-1) | future ideas (TBD; trigger = real-time-event-latency requirement) |
| AG-6 | Don't add unknown-subkind translator coverage in this mission (investigation only; document for future) | follow-on idea trigger (when 2+ instances of unhandled subkind warrant attention) |

---

## §9 Architect-flags status (v0.2 — round-1 audit folded)

| # | Flag | Status (v0.2) | Resolution |
|---|---|---|---|
| F1 (MEDIUM) | bug-47 root-cause unclear without engineer investigation; Design specifies behavioral requirement only (gh-login value matches `ois.io/github/login` label) | **CONCURRED** (P3 round-1) — substrate-realistic caveats noted: `payload.head_commit.author.username` plausible primary; noreply-email-parse fragile fallback; verify Events API `payload.sender` shape post-bug-44 | Engineer determines fix mechanism during Phase 8 implementation; document finding inline in PR description per `feedback_pr_branch_base_preflight.md` precedent |
| F2 (MEDIUM) | Symmetric-coverage decision for PR-events (§3.4) — architect-PR notifies engineer? | **CONCURRED** (P2 round-1) — symmetric-yes confirmed; differs from commit-pushed AG-7 (engineer-cadence-discipline scope only) | Default symmetric routing; PR-events bilateral cross-approval surface |
| F3 (MINOR) | Notification body shape — `intent: "pr-event"` is a new intent value; reviewer-confirm or suggest existing-vocabulary | **ADDRESSED** (m1 round-1 fold) — per-subkind intents adopted: `intent: "pr-opened-notification"` / `intent: "pr-merged-notification"` / `intent: "pr-review-notification"` (engineer recommendation; symmetry with adapter-side `source-attribute.ts` pattern) | Per §3.5 v0.2 fold |
| F4 (MINOR) | subkind=unknown investigation deliverable — what depth + format | **CONCURRED** (P4 round-1) — concrete sampling: 5-10 events from 24h post-mission-225 Hub log window; document type distribution + payload shape excerpts; classify intentional-skip vs future-handler-candidate | Engineer judgement at Phase 8 |
| F5 (PROBE) | Handler-shape symmetry — should pr-opened/pr-merged/pr-review-submitted share an internal helper for common extract+resolve+emit logic? | **ENGINEER-CALL CONCURRED** (P1 round-1) — DRY: `synthesizePrNotification` helper (~50 lines) + 3 thin wrappers (~25 lines each); engineer DRY recommendation accepted; revert to explicit at preflight if substrate-investigation suggests otherwise | NEW file `repo-event-pr-handler-helpers.ts` per §7 content map |
| F6-NEW (BLOCKING; v0.2) | **NEW round-1 C1 fold** — §0.5 inventory factually incorrect on `RepoEventSubkind` enum size (8 values, not 5); bug-46 scope undershoots actual coverage gap (6 PR-event subkinds uncovered, not 3) | **ADDRESSED** v0.2 — option (b) explicit carve-out with per-subkind rationale for pr-closed / pr-review-approved / pr-review-comment; documented in §0.5 + §3.1.1 mission-coverage table + §8 AG-2 reframe + §11.1 fold summary | n/a (C1 closed structurally) |

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

## §11 Audit fold summary

### §11.1 Round-1 audit folds (v0.1 → v0.2; greg; thread-475 round-1; 2026-05-05)

**9 findings: 1 CRITICAL + 1 MEDIUM + 3 MINOR + 4 PROBE concur.**

| Finding | Class | Architect fold-decision (v0.2) | v0.2 § |
|---|---|---|---|
| C1 | §0.5 inventory factually incorrect on `RepoEventSubkind` enum size (8 values not 5); bug-46 scope undershoots actual coverage gap (6 PR-event subkinds uncovered); 3 omitted subkinds (pr-closed, pr-review-approved, pr-review-comment) ARE translator-supported | **FOLDED** — option (b) explicit carve-out with per-subkind rationale: pr-closed (author-abandon; low peer-coord signal); pr-review-approved (potentially redundant with pr-review-submitted umbrella); pr-review-comment (high-volume mid-review chatter; lower signal-per-event ratio). Carve-out propagates to §0.5 + §3.1.1 mission-coverage table + §8 AG-2 + §7 content-map + §11 | §0.5 + §3.1.1 + §8 + §7 |
| M1 | §8 AG-2 framing inconsistent with §0.5 substrate reality (pr-closed/pr-review-approved/pr-review-comment are existing event-types, not "new") | **FOLDED** — AG-2 reframed per option (b): "Don't add handlers for pr-closed / pr-review-approved / pr-review-comment in this mission per per-subkind rationale §3.1.1" | §8 |
| m1 | F3 intent value "pr-event" too generic; existing precedent uses descriptive per-purpose intents (e.g., `commit-push-thread-heartbeat`) | **FOLDED** — per-subkind intents adopted: `pr-opened-notification` / `pr-merged-notification` / `pr-review-notification` (engineer recommendation; symmetry with adapter-side `source-attribute.ts`) | §3.5 |
| m2 | §3 per-handler logic doesn't enumerate director-author skip case; if `lookupRoleByGhLogin` returns `"director"`, no peer-role exists | **FOLDED** — §3.1 step 5 reframed with explicit role-skip enumeration: skip if `null` (lookup miss); skip if `"director"` (no peer-role); otherwise emit to peer | §3.1 |
| m3 | §7 line estimates likely 30% low (commit-pushed-handler.ts ~110 line baseline) | **FOLDED** — §7 estimates revised +30%: pr-opened ~85; pr-merged ~85; pr-review-submitted ~95; tests +30%; total revised ~1700 lines (up from ~1430) | §7 |
| P1 | F5 DRY-vs-explicit handler shape; engineer leans DRY (`synthesizePrNotification` helper + 3 thin wrappers) | **CONCURRED** — DRY accepted; NEW file `repo-event-pr-handler-helpers.ts` added to §7; revert to explicit at preflight if substrate-investigation suggests | §7 + §3.1 |
| P2 | F2 symmetric-coverage CONCUR | **CONCUR** — PR-events bilateral cross-approval surface; correctly differs from commit-pushed AG-7 | §3.4 |
| P3 | F1 bug-47 root-cause investigation framing CONCUR with caveats | **CONCUR** — substrate-realistic caveats noted (head_commit.author.username + noreply-email fallback + Events API re-verification); document raw-API-response inline per `feedback_pr_branch_base_preflight.md` | §3.2 |
| P4 | F4 subkind=unknown investigation scope CONCUR with concrete sampling | **CONCUR** — 5-10 events from 24h post-mission-225 window; document type distribution + payload shape excerpts; classify intentional-skip vs future-handler-candidate | §3.3 |

**Architectural impact:** v0.1 → v0.2 corrects factual error in §0.5 (enum-size + coverage scope); reframes AG-2 with per-subkind rationale; adopts per-subkind intent values + DRY helper extraction; revises line estimates +20%. Net mission-coverage: 4 of 8 RepoEventSubkind values (commit-pushed existing + 3 NEW PR-event handlers); 3 explicit carve-outs with per-subkind rationale; 1 intentional fallback.

**μ-finding parked:** **enum-size misreporting in §0.5 inventory** — sister-class to mission-225's μ1 cumulative-fold-regression-class. v0.1 inventory enumerated 5 values but didn't validate "5 values" claim against actual translator source (`packages/repo-event-bridge/src/translator.ts:48-57` shows 8 values). Future-discipline candidate: **§0.5 inventory enum-size claims must be `git grep`-validated before commit** per architect-discipline at Design-authoring time. Methodology-fold candidate per mission-73 §3d pattern (parked; not promoted this mission per wait-for-2nd-canonical-instance discipline).

### §11.2 Round-2 verify folds (v0.2 → v1.0; greg; thread-475 round-2; 2026-05-05)

**4 fold-incomplete regressions caught (R1-R4); all MEDIUM (non-blocking; non-architectural; doc-internal narrative-section divergence from tabular sections); landed in v1.0 ratification commit per engineer option (β) recommendation.**

| Finding | Class | Architect fold-decision (v1.0) | v1.0 § |
|---|---|---|---|
| R1 | §2 Gap A diagram retained v0.1 framing (only 3 PR-events as missing handlers; not reflecting v0.2 reality of 6 PR-event subkinds uncovered = 3 in-mission + 3 carved-out) — diagram-self-documenting completeness gap; §11.1 C1 propagation list omitted §2 (evidence diagram was overlooked) | **FOLDED v1.0** — option (a) per engineer recommendation: diagram updated to show all 6 subkinds with `❌ ... (CARVED OUT per AG-2)` annotation; mission-coverage statement (4 of 8) added below diagram | §2 Gap A |
| R2 | §3.1 per-handler logic doesn't reference `synthesizePrNotification` helper extraction per P1 concur; §7 content map adds helper file but §3.1 narrative still describes per-handler logic as if implemented inline | **FOLDED v1.0** — added "Helper extraction per v0.2 P1 concur" paragraph referencing helper signature + thin-wrapper pattern; engineer-revert-at-preflight clause carried | §3.1 |
| R3 | §3.2 architect-recommendation paragraph retains v0.1 framing without v0.2 P3 concur substrate-realistic caveats (commit-author-vs-pusher distinction; noreply-email-parse fragility; Events API `payload.sender` re-verification) | **FOLDED v1.0** — appended "Substrate-realistic caveats per round-1 P3 concur" paragraph capturing all 3 caveats inline | §3.2 |
| R4 | §6.1 Hub-side test enumeration doesn't list NEW `repo-event-pr-handler-helpers.test.ts` (which §7 content map adds per P1 concur) | **FOLDED v1.0** — added bullet under §6.1: helper unit-test scope (subkind-vs-bodyTemplate dispatch; payloadExtractor application; intent pass-through; symmetric peer-routing; skip-paths at helper level) | §6.1 |

**μ-finding promotion (v1.0 fold per engineer round-2 recommendation):**

R1-R4 represent the **2nd canonical instance** of the **cumulative-fold-regression-class** μ-finding (1st canonical instance: mission-225 round-2 R1-R5). Per mission-73 §3d wait-for-2nd-canonical-instance discipline, **methodology-fold trigger MET** — pattern eligible for promotion from "parked μ-finding" to formal `multi-agent-pr-workflow.md` audit-rubric §3d step.

**Filed as separate idea — idea-247 (M-Audit-Rubric-Cumulative-Fold-Regression-Class)** — not bundled with this mission per AG-3 (don't bundle with idea-244) + scope-discipline (this mission is bug-46/bug-47 closure; methodology promotion is orthogonal substrate-cleanup-wave class). idea-247 carries the proposed §3d step text + cross-references mission-225 R1-R5 + idea-246 R1-R4 as the 2 canonical instances driving promotion.

### §11.3 Verdict — v1.0 RATIFIED

Mission-246 closes Phase 4 with all bilateral 2-round audit cycle findings folded (9 round-1 + 4 round-2 = 13 findings; 0 BLOCKING at v1.0; 0 carry-forward into Phase 6 preflight).

- **Round-1:** 9 findings (1 CRITICAL + 1 MEDIUM + 3 MINOR + 4 PROBE concur); all 5 substantive folds + 4 PROBE concurs landed in v0.2.
- **Round-2:** 4 fold-incomplete regressions (R1-R4 MEDIUM); all 4 landed in v1.0 ratification commit per engineer option (β) recommendation; methodology-fold trigger MET → idea-247 filed.

**Phase 6 preflight eligibility: GREEN** — Design v1.0 ready for preflight authoring + Phase 7 Director release-gate.

**Phase 4 Design v1.0 RATIFIED.** Ready for Phase 5 Manifest (mission-create per `mission-lifecycle.md` v1.2 §1).

---

— Architect: lily / 2026-05-05 (Phase 4 Design v1.0 RATIFIED; route-(a) skip-direct per Director directive 2026-05-05; bug-46 + bug-47 paired closure; bilateral 2-round audit cycle complete (9 round-1 + 4 round-2 = 13 findings folded; 0 BLOCKING at v1.0); μ-finding cumulative-fold-regression-class promoted to methodology-fold trigger via idea-247; ready for Phase 5 Manifest)
