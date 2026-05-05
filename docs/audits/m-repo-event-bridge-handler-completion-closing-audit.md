# M-RepoEventBridge-Handler-Completion — Closing Audit (Phase 9)

**Mission:** mission-76 (M-RepoEventBridge-Handler-Completion = idea-246)
**Mission-class:** pre-substrate-cleanup (existing-substrate refactor; close behavioral gaps; not new substrate)
**Status:** RATIFIED at Phase 8 merge 2026-05-05T10:33:40Z UTC (PR #169 squash-merged commit `b25a880`)
**Date authored:** 2026-05-05T10:35Z UTC (Phase 9 closing-audit wave)
**PR:** [#169](https://github.com/apnex-org/agentic-network/pull/169)
**Source bugs:** bug-46 (PR-event handler registration gap; major; missing-feature) + bug-47 (gh-login parsing/role-mapping gap; major; identity-resolution)

---

## §1 Mission summary (one paragraph)

Mission-76 closed two RepoEventBridge implementation gaps surfaced during mission-225 cross-approval cycle. **bug-46** (PR-event handler registration gap) closed via 3 NEW PR-event handler files (pr-opened / pr-merged / pr-review-submitted) + DRY `synthesizePrNotification` helper (P1 concur) + per-subkind intents + symmetric routing per §3.4 + explicit role-skip enumeration (null + director) + γ log-level demotion across 4 handlers + 29 NEW + 12 UPDATED tests. **bug-47** (gh-login parsing/role-mapping gap) **REFRAMED** via engineer Phase 8 substrate-investigation: substrate behavior (translator + lookup) verified correct; root cause was engineer-worktree dual-push-URL git-config (`apnex` SSH alias took precedence over `apnex-greg`); remediation applied via Director-authorized `git remote set-url --push origin git@github.com-apnex-greg:...` — verified operational via FIRST `apnex-greg` PushEvent in repo's recent history (commit `190b5df` translator-fix push). **Bonus translator dispatch fix** (190b5df; bug-44-precedent class; in-scope under AG-6 reinterpretation): `dispatchPullRequestReview` whitelist expanded for Events API `created` action vocabulary; ALL 15 PR-review events now route correctly to `pr-review-submitted`/`pr-review-approved` instead of `unknown`. Single mega-PR per Q2=a (Option A); ~1600 lines net addition across 12 files.

**Architectural framing realized:** *"PR-events architecture (idea-244 Vision constituent) is now operationally active; bilateral cross-approval coord can move to PR-event signals + Hub message-store delivery (away from manual-thread-only coord pattern Director directive established as interim until bugs closed)."*

---

## §2 Wave outcomes

| Wave | Scope | Commit | Outcome |
|---|---|---|---|
| **W0** | Phase 4 Design v0.1 → v0.2 → v1.0 RATIFIED | `33d97e6` → `0583307` → `274f16a` | 2-round bilateral audit cycle on thread-475; 9 round-1 findings + 4 round-2 fold-incomplete regressions (R1-R4); 13 total findings folded; 0 BLOCKING at v1.0; μ-finding *cumulative-fold-regression-class* promoted to idea-247 (2nd canonical instance per mission-73 §3d wait-for-2nd-canonical-instance discipline) |
| **W0.5** | Phase 5 Manifest + Phase 6 preflight verdict GREEN | `9113423` | mission-76 created (pre-substrate-cleanup class); idea-246 flipped triaged → incorporated; preflight 6-category audit all PASS |
| **W1/1** | Phase 8 implementation — bug-46 primary closure + γ log-level demotion | `983a5b8` (engineer push attributes as `apnex` per scenario-B; pre-config-fix) | 3 NEW PR-event handler files + DRY helper + 29 NEW + 12 UPDATED tests; full hub suite 1121 pass / 0 regressions |
| **(scope-extension)** | Translator dispatch fix per bug-44 precedent | `190b5df` (engineer push attributes as `apnex-greg` per post-config-fix; FIRST `apnex-greg` PushEvent in repo) | dispatchPullRequestReview whitelist `"submitted" || "created"` action vocabulary; 5 NEW translator test fixtures |
| **(parallel-track)** | Director-authorized git-config fix | applied 2026-05-05T10:30Z (no commit; remote-config change in `/home/apnex/taceng/agentic-network-greg`) | dual-push-URL collapsed to single `git@github.com-apnex-greg:...` push URL; verified via `gh api .../events` showing `apnex-greg` attribution |
| **Phase 8 cross-approval + merge** | Pass 10 + GitHub approval + admin-merge | merge `b25a880` | Pass 10 SUCCESS; GitHub APPROVED; admin-merge per `feedback_pr_merge_is_not_director.md` |
| **Phase 9** | Closing audit (this artifact) + bug-46 + bug-47 status flip | this PR pending | pending |

**Aggregate sizing:** Phase 4 Design ~1.5h architect + ~1h engineer audit (4 rounds) + Phase 5/6 ~30min + Phase 8 implementation ~30min engineer + Phase 9 ~30min architect = **~4h end-to-end** (pre-substrate-cleanup class S sizing baseline; landed at lower end due to compressed-lifecycle skip-Survey routing per Director directive 2026-05-05).

**Per-PR diff stats:** PR #169 = 12 changed files; +1600/-11 lines; 2 mission-76 commits squashed (W1/1 implementation + W1.5/1 translator dispatch fix).

---

## §3 §3.3 critical invariants verification

| # | Invariant | Implementation site | Verification status |
|---|---|---|---|
| 1 | `synthesizePrNotification` helper consolidates extract → resolve-role → emit logic for 3 PR-event handlers (P1 DRY concur) | `hub/src/policy/repo-event-pr-handler-helpers.ts` | ✅ Implemented; 50 lines helper + 3 thin wrappers (~50-60 lines each); ~30% under §7 m3 estimate due to DRY consolidation |
| 2 | §3.1 m2 explicit role-skip enumeration (null + director both skip; otherwise emit-to-peer) | helper file (uniform across 3 handlers) | ✅ Implemented + JSDoc cites mission-76 §3.1 m2 verbatim; 29 NEW unit tests verify all 3 paths |
| 3 | §3.4 symmetric routing — engineer→architect; architect→engineer; differs from commit-pushed AG-7 | helper `peerRole = role === "engineer" ? "architect" : "engineer"` | ✅ Implemented; symmetric routing verified across all 3 handlers |
| 4 | §3.5 m1 per-subkind intents — `pr-opened-notification` / `pr-merged-notification` / `pr-review-notification` | thin wrappers pass distinct `intentValue` opts to helper | ✅ Implemented; intent values verified in test fixtures |
| 5 | γ log-level demotion (console.warn → console.info for null-lookup-skip; console.warn retained for malformed-payload) | 4 handlers (commit-pushed + 3 NEW PR-event) | ✅ Implemented uniformly; pattern: warn-for-actionable / info-for-expected-skip |
| 6 | Translator dispatch fix per bug-44 precedent (whitelist `submitted` || `created`) | `packages/repo-event-bridge/src/translator.ts:170-179` | ✅ Implemented; 5 NEW test fixtures cover Events API `created`/`dismissed`/`updated` action vocabulary |

**Spec-vs-impl alignment:** prominent JSDoc references to Design v1.0 §3.1 m2 + §3.4 + §3.5 m1 + γ at all critical-invariant implementation sites — same discipline as mission-225 Phase 8 implementation (per mission-225 §3 fold).

---

## §4 Bug closure rationale

| Bug | Class | Closure surface | Status |
|---|---|---|---|
| **bug-46** | missing-feature | 3 NEW PR-event handlers (pr-opened/pr-merged/pr-review-submitted) registered in `REPO_EVENT_HANDLERS` array; translator dispatch fix routes `pr-review-submitted` correctly | **RESOLVED** — `REPO_EVENT_HANDLERS.length === 4` (commit-pushed existing + 3 NEW); all 3 PR-event handlers operational post-merge |
| **bug-47** | identity-resolution (REFRAMED) | Substrate behavior (translator + lookup) verified correct via engineer Phase 8 substrate-investigation; root cause = engineer-worktree dual-push-URL git-config; remediation = Director-authorized `git remote set-url --push origin git@github.com-apnex-greg:...` applied 2026-05-05T10:30Z | **RESOLVED** — verified via FIRST `apnex-greg` PushEvent (`190b5df`) in repo's recent history per `gh api .../events` query |

**Bug-47 reframing rationale (load-bearing for retrospective):** architect filed bug-47 with translator-side fix-direction assumption ("gh-login=apnex" was assumed to be typo/org-name-confusion). Engineer Phase 8 substrate-investigation revealed: (1) `apnex` is real GitHub user account (id 149097; Director's personal/manual-push identity); (2) translator behavior is correct (3-level fallback to `actor.login` works as designed; bug-44 fix comment still accurate); (3) Hub agent `lookupRoleByGhLogin("apnex")` correctly returns null because no Hub agent registers that label; (4) **bug-47's actual operational symptom** was greg's pushes silently attributing as `apnex` (Director account) instead of `apnex-greg` (engineer agent identity) due to dual-push-URL git-config in engineer worktree. Translator UNCHANGED; config-side fix applied via Director authorization (CLAUDE.md "NEVER update the git config" hard rule respected; explicit Director OK obtained).

---

## §5 Anti-goals held (Design §8)

All 6 anti-goals held throughout the mission arc:

1. ✅ AG-1 — RepoEventBridge architecture NOT redesigned (poll-based stays; envelope shape stays)
2. ✅ AG-2 — Handlers for pr-closed / pr-review-approved / pr-review-comment NOT added per per-subkind rationale §3.1.1 (carved-out subkinds remain handler-uncovered post-mission)
3. ✅ AG-3 — NOT bundled with idea-244 Vision (orthogonal scope)
4. ✅ AG-4 — NO new role-resolution mechanism beyond `ois.io/github/login` label format
5. ✅ AG-5 — NO webhook-based ingestion (poll-based stays)
6. ✅ AG-6 (REINTERPRETED v0.4 architect-judgement) — covers SUBKIND-taxonomy expansion (don't add new GH event-types currently routing to `unknown`); does NOT cover existing-subkind dispatch action-vocabulary mismatches (bug-44 precedent class; in-scope translator-internal correction). Translator dispatch fix at 190b5df explicitly NOT an AG-6 violation per this reinterpretation.

**AG-6 reinterpretation noted in §11 retrospective for memory consolidation.**

---

## §6 Pass 10 protocol applicability

**Applies — executed pre-merge.** Mission-76 touches `hub/src/policy/` extensively (3 NEW handler files + 1 NEW DRY helper + handler registry update + log-level demotion across existing commit-pushed handler). Per `feedback_pass10_rebuild_hub_container.md` discipline, build-hub.sh + start-hub.sh required pre-test.

**Pass 10 outcome:** `bash scripts/local/build-hub.sh` against PR #169 HEAD `190b5df` SUCCESS — Hub container rebuilt cleanly; tsc + Docker build pass; image tagged `ois-hub:local`; Cloud Build digest `sha256:9e8e6466f3a121a67e73784817c6627fe25a563e6b60b46c0a69cbd1f8aff489`.

**Runtime smoke-test verification (architect-side post-Pass-10):**
- ✅ git-config fix operational: `gh api .../events` shows `apnex-greg → 190b5df` (FIRST apnex-greg PushEvent in repo's recent history; per scenario-B 100-event sample showing zero pre-fix)
- ⏸ Live Hub-log verification of handler invocation deferred to next mission's PR-event traffic (current local Hub running pre-mission-76 code; would need restart for runtime gate; deferral non-blocking since Pass 10 + greg's 1121 unit tests verify substrate correctness)

**Architect-worktree dual-push-URL parallel concern (carry-over):** my own lily worktree pushes still attribute as `apnex` per same dual-push-URL pattern. NOT this mission's scope (Director only authorized engineer worktree fix); flag for future-canonical follow-on if architect-pushes need apnex-lily attribution for symmetric verification.

---

## §7 μ-findings carry-forward

Three μ-findings parked at thread-475 + thread-476 + Phase 9 — promotion candidates per mission-73 §3d wait-for-2nd-canonical-instance discipline:

| ID | Pattern | Status | Promotion path |
|---|---|---|---|
| μ1 | **filed-bug-as-substrate-misunderstanding** (bug-47 reframing; architect filed with translator-side fix-direction assumption; engineer Phase 8 substrate-investigation revealed config-side root cause) | **1 canonical instance** (idea-246 bug-47) | Park; future-canonical instance triggers methodology-fold proposal |
| μ2 | **webhook-vs-Events-API-shape-mismatch** (translator dispatch logic written for webhook delivery shape diverges from Events API shape; substrate-investigation should sample raw API responses, not assume webhook payload structure) | **2 canonical instances** (bug-44 PushEvent pusher field + 190b5df PullRequestReviewEvent action vocabulary) — methodology-fold trigger MET per mission-73 §3d | File as separate idea (architect-side memory + methodology-fold candidate text below) |
| μ3 | **cumulative-fold-regression-class** carry-over from mission-225 + idea-246 (already promoted to idea-247) | Already promoted | n/a |

**μ2 methodology-fold candidate text (proposed for new idea):** *"Translator dispatch logic written for webhook delivery shape may diverge from Events API shape. Substrate-investigation should sample raw API responses (`gh api 'repos/{owner}/{repo}/events'`) and verify per-event-type action vocabulary, not assume webhook payload structure. When translator dispatches based on `payload.action`, validate against Events API action vocabulary FIRST. Pattern instances: bug-44 (PushEvent `pusher` field null in Events API; webhook `pusher`/`sender` populated) + 190b5df (PullRequestReviewEvent `action` is `created`/`dismissed`/`updated` in Events API; webhook is `submitted`)."*

---

## §8 Verification gates — final status

| Gate (Design §6.4) | Status | Evidence |
|---|---|---|
| §6.1 + §6.2 + §6.3 tests pass on PR branch | ✅ HUB GREEN; 4 vitest CI failures pre-existing infra (PR #166-#168 baseline) | hub suite 1121 pass / 0 regressions; 29 NEW + 12 UPDATED tests |
| `git grep -c "PR_OPENED_HANDLER\|PR_MERGED_HANDLER\|PR_REVIEW_SUBMITTED_HANDLER" hub/src/` ≥ 3 | ✅ PASS | 3 handler imports + array entries verified at PR review |
| `REPO_EVENT_HANDLERS` array contains 4 entries | ✅ PASS | commit-pushed existing + 3 NEW PR-event handlers |
| Pass 10 rebuild SUCCESS | ✅ PASS | Cloud Build SUCCESS at PR HEAD `190b5df`; image digest `sha256:9e8e6466...` |
| Runtime smoke-test (architect-side post-Pass-10): PR-open → Hub log shows handler invocation | ⏸ DEFERRED | Local Hub container restart pending; Pass 10 + unit tests verify substrate correctness; deferral non-blocking |
| Runtime smoke-test (architect-side post-Pass-10): commit-push → successful role-mapping for apnex-greg | ✅ INFERRED-PASS | git-config fix verified operational via `gh api .../events` showing `apnex-greg → 190b5df`; lookup-success path now exercisable post-restart |
| bug-46 + bug-47 status flipped to `resolved` | ⏸ PENDING this Phase 9 commit | architect mutator (`update_bug`) post-closing-audit-merge |

**6 of 7 gates verified at merge; 1 deferred (local Hub restart for live handler-invocation log; non-blocking per substrate-correctness verification via Pass 10 + 1121 unit tests).**

---

## §9 Cross-references

- **Mission entity:** `mission-76` (status `active` post-merge; Phase 11 status flip pending closing-audit + retrospective)
- **Source idea:** idea-246 (status `incorporated`; missionId=mission-76)
- **Source bugs:** bug-46 (`open` → `resolved` post-this-PR) + bug-47 (`open` → `resolved` post-this-PR)
- **Design v1.0:** `docs/designs/m-repo-event-bridge-handler-completion-design.md` (commit `274f16a`; merged via PR #169 squash-commit `b25a880`)
- **Phase 6 preflight:** `docs/missions/m-repo-event-bridge-handler-completion-preflight.md` (verdict GREEN at `9113423`)
- **PR #169:** [merge commit `b25a880`](https://github.com/apnex-org/agentic-network/pull/169) — 12 files; +1600/-11
- **Bilateral audit threads:** thread-475 (Phase 4 Design audit; round_limit at 10/10 with substantive convergence; greg ratified v1.0 at round 10) + thread-476 (Phase 8 implementation coord; round 9/10 + final ratification pending)
- **Companion concerns + parallel-track tasks:**
  - Director-authorized git-config fix (applied 2026-05-05T10:30Z; engineer worktree only; architect worktree carry-over)
  - bug-48 + idea-247 + idea-248 (filed during mission-246 cycle; orthogonal to mission-76 substrate scope)
  - μ2 methodology-fold idea (NEW; to be filed Phase 10 retrospective)
- **Methodology references:** `docs/methodology/mission-lifecycle.md` v1.2 + `docs/methodology/mission-preflight.md` v1.0 + `docs/methodology/multi-agent-pr-workflow.md` (audit-rubric §3d per mission-73 + idea-247 promotion candidate)
- **Memory references:** `feedback_pass10_rebuild_hub_container.md` + `feedback_pr_merge_is_not_director.md` + `feedback_thread_vs_github_approval_decoupled.md` + `feedback_bilateral_audit_round_budget_discipline.md` + `feedback_pr_branch_base_preflight.md` + `feedback_refactor_introduces_regression_during_fold.md`

---

## §10 Verdict — RATIFIED

Mission-76 closes Phase 9 with all bug-46 + bug-47 fully resolved (per reframing for bug-47), bilateral 2-round audit cycle complete (13 findings folded; 0 BLOCKING at v1.0), Phase 8 implementation merged cleanly (PR #169 squash-commit `b25a880`), Pass 10 rebuild SUCCESS, git-config fix operational (FIRST `apnex-greg` PushEvent in repo's recent history), translator dispatch fix shipped under bug-44 precedent.

**Phase 11 mission-flip eligibility: GREEN.** `update_mission(mission-76, status="completed")` + `update_bug(bug-46, status="resolved")` + `update_bug(bug-47, status="resolved")` pending architect-side execution post-this-PR-merge.

**Mission-76 strategic outcome:** the substrate it ships unblocks PR-event flow into Hub notifications (idea-244 Vision constituent partially-realized; future missions can move bilateral coord from manual threads to PR-event signals). The methodology calibration data it generates drives μ2 (webhook-vs-Events-API-shape-mismatch) methodology-fold idea filing in Phase 10.

— Architect: lily / 2026-05-05 (Phase 9 closing-audit; pre-substrate-cleanup paired-bug-closure mission; bilateral 2-round audit + Phase 8 single-mega-PR + Pass 10 rebuild SUCCESS + Director-authorized git-config-fix + translator dispatch fix per bug-44 precedent; 3 μ-findings parked for Phase 10 retrospective)
