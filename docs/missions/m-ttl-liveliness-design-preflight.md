# M-TTL-Liveliness-Design Preflight (mission-75)

**Mission:** mission-75 (status: `proposed` post-create 2026-05-05)
**Class:** substrate-introduction (multi-substrate; Hub schema + network-adapter substrate + PulseSweeper + CLI)
**Brief:** `docs/designs/m-ttl-liveliness-design-design.md` (v1.0 RATIFIED commit `63b1ebc`)
**Filed:** 2026-05-05 (same-session Phase 5 Manifest from Phase 4 Design v1.0 ratify-bilateral + Director walk-through 5-fold)
**Verdict:** **GREEN**
**Author:** lily (architect)
**Freshness:** current (until 2026-06-04)

---

## Context

Mission-75 implements idea-225 (M-TTL-Liveliness-Design) per Director-direct routing 2026-05-05 ("a — design with greg" / bilateral engineer-audit cycle). Phase 4 Design v1.0 RATIFIED via 4-round audit cycle (round-1 + round-2 + round-3 bilateral via thread-472 sealed at round_limit with greg's `converged: true` ratification + v1.0 Director walk-through 5-fold filing 5 downstream Vision/follow-on ideas).

Mission shape: substrate-introduction; multi-substrate scope spanning Hub schema (4 NEW Agent record fields + 1 livenessConfig sub-object) + network-adapter substrate (poll-backstop second 30s heartbeat timer extension) + Hub PolicyRouter (NEW `transport_heartbeat` MCP tool with `tier: "adapter-internal"` annotation per v1.0 fold; shim-side `list_tools` filter consumes annotation) + PulseSweeper (per-agent `agentPulse` extension via NULL mission binding + STRICT suppression per M3 fold) + CLI surface refactor (`get-agents.sh` column refactor + NEW `scripts/local/mod.core` extraction per v1.0 fold per Director CLI consolidation ask).

Phase 8 implementation per Director-ratified Q2=a big-bang single-PR (Option A per round-1 P3 concur); cross-approval per `multi-agent-pr-workflow.md`.

Cross-references for preflight check:
- Survey envelope: `docs/surveys/m-ttl-liveliness-design-survey.md` v1.0 (commit `f68e23b`; Director-ratified 6 picks)
- Design v1.0 RATIFIED: `docs/designs/m-ttl-liveliness-design-design.md` (commit `63b1ebc`; v1.0 ratification per Director walk-through 5-fold + greg's round-3 ratification)
- Source idea: idea-225 (status: `incorporated` post-mission-create; missionId=mission-75)
- Bilateral thread: thread-472 (round_limit at round-10 with `converged: true; intent: implementation_ready` per greg's round-3 ratification)
- Companion ideas: idea-224 / mission-68 (closed; pulse mechanism we consume per AG-1) + idea-216 (sibling concern; reviewed unrelated)
- Downstream Vision/follow-on ideas (filed during Director walk-through 2026-05-05): idea-239 + idea-240 + idea-241 + idea-242 + idea-243

---

## §A Documentation integrity

| # | Check | Result | Notes |
|---|---|---|---|
| A1 | Brief file (Design v1.0) exists at `mission.documentRef` path + committed | ✅ PASS | `docs/designs/m-ttl-liveliness-design-design.md` exists (887 lines); v1.0 commit `63b1ebc` on `agent-lily/m-ttl-liveliness-design`; pushed to origin |
| A2 | Local branch in sync with `origin` | ✅ PASS | `agent-lily/m-ttl-liveliness-design` HEAD `63b1ebc` pushed to origin (verified at v1.0 commit + push); engineer (greg) has read-access via thread-472 round-1+round-2+round-3 audit cycle |
| A3 | Cross-referenced artifacts (Survey, methodology docs, sibling briefs) exist | ✅ PASS | Survey envelope at `docs/surveys/m-ttl-liveliness-design-survey.md` (commit `f68e23b`; pushed); `docs/methodology/idea-survey.md` v1.0 + `docs/methodology/strategic-review.md` + `docs/methodology/mission-lifecycle.md` v1.2 + `docs/methodology/mission-preflight.md` v1.0 + `docs/methodology/multi-agent-pr-workflow.md` (audit-rubric §3d per mission-73) all exist |

---

## §B Hub filing integrity

| # | Check | Result | Notes |
|---|---|---|---|
| B1 | Mission entity has correct `id`, `status=proposed`, `documentRef` populated | ✅ PASS | mission-75 created 2026-05-05 with status=`proposed`, missionClass=`substrate-introduction`, documentRef=`docs/designs/m-ttl-liveliness-design-design.md`, plannedTasks[1] populated; default pulses auto-injected (engineerPulse 600s + architectPulse 1200s) per substrate-introduction class template |
| B2 | `title` + `description` faithful summary of brief | ✅ PASS | title="M-TTL-Liveliness-Design"; description summarises substrate scope (4 NEW fields + livenessConfig + transport_heartbeat tool + agentPulse extension + CLI refactor + mod.core) + Q2=a single-PR + bilateral audit history + Design v1.0 RATIFIED commit reference |
| B3 | `tasks[]` + `ideas[]` empty (unexpected for `proposed`) | ✅ PASS | tasks[]=[] (planned task auto-issuance via cascade); ideas[]=[] (idea-225 linked via missionId via update_idea mutator post-create) |
| B4 | Source idea linked + flipped to incorporated | ✅ PASS | idea-225 status flipped `triaged` → `incorporated`; missionId=mission-75 set per `update_idea` mutator 2026-05-05 |
| B5 | Pulses configured per substrate-introduction class template | ✅ PASS | engineerPulse 600s + architectPulse 1200s (substrate-introduction class defaults; auto-injected; missedThreshold=2 per ADR-017 receipt-deadline precedent). Phase 8 single mega-PR per Q2=a means engineerPulse fires periodically during implementation; architectPulse fires for cross-coord; both appropriate for bilateral cross-approval pattern |

---

## §C Referenced-artifact currency

| # | Check | Result | Notes |
|---|---|---|---|
| C1 | File paths cited in Design v1.0 §10 + §0.5 + §7.3 exist | ✅ PASS | All cited paths verified at preflight authoring: `hub/src/state.ts`, `hub/src/entities/agent-repository.ts`, `hub/src/policy/pulse-sweeper.ts`, `hub/src/policy/pending-action-policy.ts`, `hub/src/policy/router.ts`, `hub/src/policy/message-policy.ts`, `packages/network-adapter/src/kernel/poll-backstop.ts`, `scripts/local/get-agents.sh`, `scripts/local/tpl/agents.jq`, `scripts/local/test-get-agents-cli.sh` — all exist. `hub/src/handlers/transport-heartbeat-handler.ts` is NEW per v1.0 fold (Phase 8 will create). `scripts/local/mod.core` + `scripts/local/test-mod.core.sh` are NEW per v1.0 fold (Phase 8 will create) |
| C2 | Numeric claims verified | ✅ PASS | Design v1.0 size: 887 lines; bilateral fold count: 13 round-1 + 6 round-2 + 5 v1.0 Director walk-through = 24 findings folded; thread-472 round count: 10/10 (round_limit; substantively converged); AG count: 8 (AG-1 through AG-8); architect-flag count: 6 (F1-F5 + F6-NEW); net-new substrate items: 8 (v1.0 honest accounting per §11.5: 4 fields + livenessConfig sub-object + transport_heartbeat tool + resolveLivenessConfig helper + tier annotation + mod.core file = 8; same count as v0.1 baseline but RIGHT shape — substrate-quality > substrate-count) |
| C3 | Cited ideas/missions/threads in assumed state | ✅ PASS | idea-225 status=`incorporated` (just-flipped 2026-05-05); idea-224 = mission-68 closed (pulse mechanism precondition satisfied per AG-1); idea-216 reviewed at Phase 4 entry — unrelated to this Vision (note-kind primitive surface gap); mission-67/68/69/70/71/72/73/74 all closed (precedents); mission-72 PolicyRouter snapshot test STRUCTURALLY closes the hardcoded-router.size class (this mission's transport_heartbeat tool registration absorbs cleanly); mission-74 validate-envelope.sh multi-pick fix shipped 2026-05-04 (PR #166; Q1=cd validator pass-through enabled); thread-472 round_limit converged with greg ratification |
| C4 | Dependency prerequisites in assumed state | ✅ PASS | mission-68 shipped (pulse mechanism we consume; PULSE_KEYS = ["engineerPulse", "architectPulse"] stable); mission-72 shipped (PolicyRouter snapshot test absorbs new tool entry cleanly); existing substrate primitives stable (ADR-017 liveness FSM + applyLivenessRecompute + drain_pending_actions + lastSeenAt + lastHeartbeatAt + PEER_PRESENCE_WINDOW_MS + AGENT_TOUCH_MIN_INTERVAL_MS + isPeerPresent + activityState mission-62 substrate); poll-backstop.ts substrate stable (DEFAULT_CADENCE_SECONDS = 300; existing message-poll timer to be extended-not-replaced); §0.5 inventory verified at Phase 4 round-2 + cross-checked at preflight |

---

## §D Scope-decision gating

| # | Check | Result | Notes |
|---|---|---|---|
| D1 | Every engineer-flagged scope decision has ratified answer | ✅ PASS | All architect-flags F1-F6 status closed per §9 v1.0 fold: F1 CONCURRED + DEFERRED to post-deployment instrumentation (P4 round-1 concur + round-3 verify); F2 ADDRESSED (M3 STRICT fold; v1.0 §5.2 wording correction); F3 ADDRESSED + STRUCTURALLY CLOSED (env-tunable + per-agent override per v1.0 fold); F4 ADDRESSED via reframe to component-state truth table per C1 fold; F5 CONCUR (P1 round-1; 60min default); F6-NEW FORWARD-FLAG to Phase 8 watchdog consumer-update scope (per §3.3 idle-agent semantic). No unresolved decisions |
| D2 | Director + architect aligned on ambiguous decision points | ✅ PASS | Director walk-through 2026-05-05 surfaced + ratified 5 v1.0 folds: §3.3 adapter-internal-tool tier discipline + field-name corrections (COG_TTL → COGNITIVE_TTL etc.) + §5.2 STRICT/PERMISSIVE wording + env-ification with per-agent livenessConfig override (Declarative-Primacy framing) + scripts/local/mod.core extraction (CLI consolidation ask). All folded into v1.0 RATIFIED. No latent disagreement. 5 downstream ideas filed (idea-239/240/241/242/243) capture longer-term Vision work that's explicitly OUT-OF-SCOPE for mission-75 |
| D3 | Out-of-scope boundaries confirmed (anti-goals) | ✅ PASS | 8 anti-goals codified §8: AG-1 (no pulse mechanism redesign — idea-239 follow-on) / AG-2 (no Transport-module surface change — idea-240+241 follow-on) / AG-3 (no liveness fields beyond 4-field schema) / AG-4 (no wholesale livenessState consumer migration; tight P2 scope: watchdog + agent-projection only of 6 consumers) / AG-5 (no write-batching; F1 forward-flag) / AG-6 (no CLI color/format/auto-detect — operator-UX surface trigger) / AG-7 (no Director-role per-agent-pulse — idea-239 subsumes) / AG-8 (no Adapter-Kernel-vs-Transport-Module methodology formalisation). All scope-creep paths protected |

---

## §E Execution readiness

| # | Check | Result | Notes |
|---|---|---|---|
| E1 | First task/wave sequence clear; engineer can scaffold day-1 work without re-reading brief | ✅ PASS | plannedTask[1] description includes 9-item enumerated scope per §7.3 content map (Hub schema + computation hooks + transport_heartbeat tool + poll-backstop extension + shim-side filter + PulseSweeper agentPulse + CLI refactor + watchdog consumer-update + env vars). §7.1 Option A confirmed (single mega-PR; ~2050 lines net per v1.0 fold estimate). Engineer entry-point: read Design v1.0 §0 reading order → §0.5 inventory → §3.1 schema delta first |
| E2 | Deploy-gate dependencies explicit | ✅ PASS | Per `feedback_pass10_rebuild_hub_container.md` memory: PRs touching `hub/src` REQUIRE build-hub.sh + start-hub.sh per Pass 10 rebuild discipline. mission-75 touches hub/src extensively (§7.3 content map: 8 hub/src files modified or created). Phase 8 implementation must include Hub container rebuild before testing. Adapter Cloud Run redeploy NOT required (no adapter package changes; only network-adapter substrate which lives in same repo). Watchdog consumer-update requires Hub redeploy. Pass 10 rebuild = mandatory pre-test gate |
| E3 | Success-criteria metrics measurable from current baseline | ✅ PASS | §6.4 verification gates enumerate measurable assertions: §6.1 + §6.2 + §6.3 test pass on PR branch; specific git grep assertions for `cognitiveState`/`transportState`/`livenessState` field references; PolicyRouter snapshot test contains `transport_heartbeat` entry; idle-agent transport-state stability across 4× heartbeat cycles (≥120s); shim-side filter excludes adapter-internal tier from LLM catalogue; per-agent override resolution test; mod.core sourced cleanly by get-agents.sh. All measurable from current baseline (no new telemetry required for verification gates; instrumentation for F1 write-amp scale-out is post-deployment + AG-5 anti-goaled) |

---

## §F Coherence with current priorities

| # | Check | Result | Notes |
|---|---|---|---|
| F1 | Anti-goals from parent review (if any) still hold | ✅ PASS (N/A) | This mission has no parent review. Survey + Design own anti-goals; no upstream review to inherit from |
| F2 | No newer missions filed that supersede or overlap | ✅ PASS | Recent missions (mission-67 through mission-74) all closed; no in-flight mission overlaps mission-75's scope. Five downstream ideas filed during walk-through (idea-239/240/241/242/243) explicitly compose-with-but-don't-supersede mission-75 — they're downstream Vision/follow-on work that mission-75 enables (mission-225 substrate must ship first; downstream missions sequence post-225 per their respective idea descriptions) |
| F3 | No recent bugs/ideas materially change scoping | ✅ PASS | No open bugs reference mission-75 scope. The 5 newly-filed ideas (idea-239/240/241/242/243) reframe mission-75's surface as INTERIM (e.g., mission-75's env vars + per-agent override are interim under idea-242 Vision; mission-75's shim-side `list_tools` filter is interim under idea-240 Vision; mission-75's mod.core extraction is first canonical under idea-243 systemic follow-on). This interim framing is INTENTIONAL + DOCUMENTED in §10 cross-references — does NOT change mission-75 scope, just contextualises it within longer-term Vision arcs |

---

## Verdict

**GREEN** — all 6 categories PASS. Mission-75 is execution-ready immediately upon Director Phase 7 release-gate ratification.

**Bilateral audit cycle completeness:** unusual for this mission relative to recent precedent — mission-75 went through full 3-round bilateral cycle (round-1 + round-2 + round-3) PLUS Director walk-through 5-fold. Total: 24 findings folded across 4 review surfaces. Design v1.0 carries comprehensive substrate-currency check + tele-alignment validation; preflight currency-check (§C) found zero stale references.

**Substrate footprint honesty:** v1.0 net-new substrate count returns to v0.1's 8 items (after v0.2's incorrect 50%-reduction slogan + v0.3's honest 38% endpoint). v1.0's items are RIGHT-shaped per Director walk-through folds (declarative livenessConfig + tier annotation + mod.core lib-extraction) — substrate-quality > substrate-count per §11.5 honest accounting.

**Phase 8 deploy-gate reminder (§E2):** Pass 10 rebuild discipline (build-hub.sh + start-hub.sh) is MANDATORY before testing per `feedback_pass10_rebuild_hub_container.md` memory. Hub touches multiple files; container must be rebuilt; watchdog consumer-update requires Hub redeploy.

**Director Phase 7 ratification recommended.** Architect proceeds to Phase 8 implementation upon `update_mission(mission-75, status="active")`.

---

**Cross-references:**

- Mission entity: `mission-75` (created 2026-05-05; status=`proposed`)
- Design brief: `docs/designs/m-ttl-liveliness-design-design.md` v1.0 (commit `63b1ebc`)
- Survey envelope: `docs/surveys/m-ttl-liveliness-design-survey.md` v1.0 (commit `f68e23b`)
- Source idea: idea-225 (status=`incorporated`; missionId=mission-75)
- Bilateral audit thread: thread-472 (round_limit; converged: true)
- Methodology: `docs/methodology/mission-preflight.md` v1.0 (this preflight conforms to Categories A-F)
- Pass 10 rebuild discipline: `~/.claude/projects/-home-apnex-taceng-agentic-network/memory/feedback_pass10_rebuild_hub_container.md`
- Downstream Vision/follow-on ideas: idea-239 (rolePulse) + idea-240 (agnostic-transport Vision) + idea-241 (WebSocket constituent) + idea-242 (declarative agentic configurations) + idea-243 (mod.core CLI consolidation)
