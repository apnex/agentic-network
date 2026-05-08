# M-Workflow-Run-Events-Hub-Integration — Work Trace (live state)

**Mission scope.** Make GitHub Actions `workflow_run` events first-class in the Hub event router so deployment + CI lifecycle is visible at the operator surface (peek-line + Hub thread) without manual `gh` CLI polling. Closes Director question 2026-05-07 ("how did you know the workflow ended?"). Completes the deploy-observe-distribute trio with idea-256 (build-identity) + idea-257 (GitHub Releases). Compressed lifecycle (Phase 4 Design + Phase 8 Implementation; Phase 5/6/10 skipped).

**Anchor:** idea-255.
**Architect coordination thread:** thread-500 — architect lily + engineer greg, 3 rounds so far (round-1 architect dispatch v0.1; round-2 engineer audit + 4 substantive folds; round-3 architect ratifies v1.0 with all folds accepted).
**Branch:** `agent-greg/m-workflow-run-events` off main tip post-PR-#197.
**How to read + update this file:** `docs/methodology/trace-management.md`.

**Status legend:** ▶ in-flight · ✅ done this session · ○ queued / filed · ⏸ deferred

---

## Resumption pointer (cold-session brief)

If picking up cold:

1. **Read this file**, then `docs/designs/m-workflow-run-events-hub-integration-design.md` (Design v1.0; pushed at commit `c2e972c` on `agent-lily/m-workflow-run-events-design`).
2. **Mission status:** Phase 8 Implementation 100% delivered local; PR opening next.
3. **Engineer-side verified:** repo-event-bridge 146/146 PASS; Hub 1243/1243 PASS. End-to-end wire-flow integration test passes (calibration #62 §2.1 mandate).
4. **Round-1 audit catch (load-bearing):** F1 — workflow_run is NOT in the GitHub /events API; v0.1's "alongside existing pollers" understated the surface. Reframed in v1.0 to use a sibling EventSource (`WorkflowRunPollSource`) hitting `/repos/:owner/:repo/actions/runs` with a different cursor strategy (timestamp-based; no ETag-conditional flow).

---

## In-flight

▶ PR open + thread-500 round-4 reply

---

## Done this session

✅ **`packages/repo-event-bridge/src/gh-api-client.ts`** extended — `pollWorkflowRuns(repoId, opts)` method + `WorkflowRun` + `WorkflowRunsResponse` types per F1 fold.
✅ **`packages/repo-event-bridge/src/workflow-run-translator.ts`** — sibling translator producing `RepoEvent` with subkind `workflow-run-{completed,dispatched,in-progress}` per F3 split.
✅ **`packages/repo-event-bridge/src/translator.ts`** REPO_EVENT_SUBKINDS extended with 3 new subkinds; defensive switch-case in `normalizeGhEvent` returns `{ raw }` for workflow-run-* (those subkinds shouldn't reach this path; sibling translator owns them).
✅ **`packages/repo-event-bridge/src/workflow-run-poll-source.ts`** — sibling EventSource implementing the EventSource contract for /actions/runs. Per-repo timestamp cursor (10-min initial lookback to bound first-poll backlog); LRU dedupe on run.id; distinct cursor-store pathPrefix `repo-event-bridge-workflow-runs`.
✅ **`packages/repo-event-bridge/src/index.ts`** — re-exports for the new symbols.
✅ **`hub/src/policy/repo-event-handler.ts`** — RepoEventBridge constructs + drains BOTH `PollSource` + `WorkflowRunPollSource`; merged health() across both sources; `Promise.allSettled` on stop().
✅ **`hub/src/policy/repo-event-workflow-run-handler.ts`** (NEW) — 3 handlers (completed/dispatched/in-progress); mirrors commit-pushed-handler shape (NOT pr-*-handler — workflow_run is system notification, not bilateral-routable); builds `MessageDispatch[]` directly with `kind: "external-injection", target: null`; render-ready body lines per Design §1.3 template.
✅ **`hub/src/policy/repo-event-handlers.ts`** — REPO_EVENT_HANDLERS array extended from 5 → 8 entries.
✅ **`hub/src/policy/sse-peek-line-render.ts`** — SOURCE_CLASSES extended with `System-Workflow` (8th class); ENTITY_TYPES extended with `workflow`; `shouldFilterPeekLine` predicate extends with workflow-run-* per-conclusion + per-workflow-name filter rules per Design §1.8; `deriveRenderContext` extended with workflow-run-* event names + verb derivation; `PEEK_LINE_FORMAT_REGEX` extended for new sourceClass.
✅ **Test coverage:**
  - `packages/repo-event-bridge/test/workflow-run-translator.test.ts` — 14 cases (subkind dispatch matrix + payload shape + format-regex on run_id + head_sha 40-hex preservation).
  - `packages/repo-event-bridge/test/workflow-run-poll-source.test.ts` — 5 cases (cold-start with fresh storage; dedupe; auth-failure terminal; query-param shape pinned).
  - `hub/test/unit/repo-event-workflow-run-handler.test.ts` — 16 cases (end-to-end wire-flow per F7 + filter-list matrix + deriveRenderContext + format-regex contract pin).
  - `hub/test/unit/repo-event-handlers.test.ts` updated count assertion (5 → 8 handlers).
  - `hub/test/unit/sse-peek-line-render.test.ts` updated SOURCE_CLASSES enum assertion (7 → 8).
  - `packages/repo-event-bridge/test/conformance/conformance.test.ts` updated to skip workflow-run-* subkinds (sibling translator path; covered by translator test).

---

## Queued / filed

⏸ **Pass 10 rebuild** — Hub container rebuild + restart per Phase 9 close. Architect-side per Design v1.0 §3 + bilateral cycle plan.
⏸ **Phase 9 verify** — manual workflow_dispatch on deploy-hub.yml → expect peek-line `[System-Workflow] manual_dispatch fired: ...` notification surface.
⏸ **Operator-cadence observation worth filing as follow-on:** when the bridge first starts after extended downtime, the 10-min INITIAL_LOOKBACK_MS bounds the historical-backlog flood. If operator wants longer-history catch-up on restart, the lookback constant could be operator-tunable. Not blocking; small follow-on.

---

## Edges (dependency chains)

```
idea-255 (Director-approved 2026-05-08)
  └─→ Design v0.1 (architect) → Design v1.0 (RATIFIED post round-1 audit; F1+F2+F3+F4+F8 folds)
       └─→ Phase 8 Implementation (this work-trace)
            └─→ PR open + architect cross-approve + admin-merge
                 └─→ Phase 9: Pass 10 rebuild → manual workflow_dispatch trigger → peek-line surfaces → bilateral converge
```

Foundation for:
- **idea-256 composition** — head_sha propagation from workflow_run for "what code is currently deployed" diagnostics.
- **idea-258 forward-compat** — auto-release decisions need workflow lifecycle visibility; this delivers it.

---

## Session log (append-only)

**2026-05-08 11:35 AEST** — Phase 8 implementation complete on local. F1's architectural reframe (sibling EventSource for /actions/runs) was the load-bearing audit catch — would have shipped a fundamentally broken poller otherwise. All 4 substantive folds shipped: F1 (sibling poller + translator + GhApiClient extension); F2 (handler mirrors commit-pushed shape, not pr-*); F3 (per-conclusion event-name split); F4 (timestamp cursor; distinct cursor-store namespace). F8 NEW fold delivered: RepoEventBridge constructs + drains both sources via Promise.allSettled. ~700 LOC end-to-end across 9 files (consistent with v1.0 estimate). Tests: repo-event-bridge 146/146 PASS, Hub 1243/1243 PASS. End-to-end wire-flow integration test (F7 / calibration #62 §2.1) passes — synthesizes /actions/runs response → translateWorkflowRun → handler → MessageDispatch with sourceClass=System-Workflow + entityRef.type=workflow + head_sha propagation + body matching §1.3 render template. Filter-list predicate verified against Design §1.8 matrix (success-noise filtered; failures always render; deploy-class successes render; manual dispatches render). Opening PR next.

---

## Canonical references

- `docs/designs/m-workflow-run-events-hub-integration-design.md` — Design v1.0 (RATIFIED at commit `c2e972c` on `agent-lily/m-workflow-run-events-design`)
- thread-500 — bilateral coordination (3 rounds; max 15 per Director generosity)
- idea-255 — anchor; Director-approved 2026-05-08
- idea-256 — head_sha composability foundation
- idea-257 — release-plugin.yml workflow events surface release-creation lifecycle
- `feedback_substrate_currency_audit_rubric.md` — round-1 audit rubric (named types AND named events)
- `feedback_substrate_extension_wire_flow_integration_test.md` — calibration #62 14-instance discipline; explicitly applied per F7
- `feedback_local_test_masking_via_cached_state.md` — test isolation discipline; pollsource tests use fresh storage per case
- `feedback_format_regex_over_hardcoded_hash_tests.md` — format-regex pin pattern; head_sha matched against /^[a-f0-9]{40}$/, run_id against /^\d+$/
- `feedback_pass10_rebuild_hub_container.md` — Phase 9 deployment discipline (Hub touched by this PR)
