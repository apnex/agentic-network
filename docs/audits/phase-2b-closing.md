# M-Cognitive-Hypervisor Phase 2b — Closing Audit

**Date:** 2026-04-20
**Scope:** Closing the Phase 2b architect-side precision-context-engineering sprint
**Predecessors:** `docs/audits/phase-1-baseline-measurement.md`, `docs/audits/phase-2a-baseline-measurement.md`
**Plan:** `docs/planning/phase-2b-architect-token-optimization-plan.md`
**Proposed tele axis:** tele-10 "Precision Context Engineering" (idea-116, pending architect triage)

---

## Executive summary

Phase 2b targeted three distinct failure classes surfaced in the Phase 2a baseline:

1. **FR-SCOPE-REJECT** — Gemini calls out-of-scope tools named in the general system prompt but filtered from the sandwich declarations. Each call burns a round until MAX_TOOL_ROUNDS.
2. **Accumulated-history growth** — tool results from prior rounds stay in `contents[]` forever, growing prompt tokens 50-120× between round 1 and round 10.
3. **Architect-side cognitive pipeline not wired** — ResponseSummarizer / ToolResultCache / WriteCallDedup inactive on the architect's Hub request surface; oversized responses flood context.

All three **class-squashed** per the Phase 2b exit thresholds. Cumulative result vs Phase 2a baseline on the canonical 6-prompt matrix:

| Metric | Baseline (2a) | Phase 2b final (ckpt-C) | Δ |
|---|---:|---:|---:|
| Total Gemini tokens | 3,705,002 | 637,853 | **−83%** |
| Scope rejections on hot path | 9 | 0 | eliminated |
| Production Virtual Tokens Saved | 0 | 620,130 | KPI landed |
| Architect-side tool_call telemetry events | 0 | 74 | pipeline firing |

An **unexpected fourth failure class** surfaced during Phase 2b-B larger-N measurement: **Hub-side retry death spiral** — the pending-action queue re-delivers MAX_TOOL_ROUNDS failures every 300s forever, with no bounded-retry budget. Documented separately; filed as idea-117 (M-Bounded-Retry) for architect triage. This blocked clean N=20 measurement but was itself a valuable Phase 2b-B discovery.

---

## Phase 2b scorecard

### Class 1 — FR-SCOPE-REJECT (ckpt-A, commit `a13ba89`)

**Change:** Sandwich thread-reply prepends a scope-override preamble to `ARCHITECT_SYSTEM_PROMPT`. Names the 10 allowlisted tools and explicitly marks commonly-leaked tools (`list_audit_entries`, `get_idea`, `get_engineer_status`, etc.) as NOT AVAILABLE in this context. `generateWithTools` accepts a new `scopeOverride` field on `CognitiveOptions`; sandwich opts in, director-chat does not.

**Verified:** 6-thread matrix on revision `00042-hmx`, 2026-04-19.

| Metric | Baseline | After ckpt-A |
|---|---:|---:|
| Out-of-scope rejections on hot path | 9 | **0** |
| Total Gemini tokens | 3,705k | 1,301k (−65%) |
| MAX_TOOL_ROUNDS attempts | 12 | 1 (−92%) |

**Class status:** **SQUASHED.** Zero out-of-scope rejections observed on the ckpt-A revision's hot path across 6 threads. Regression-guarded by `test/sandwich-scope-override.test.ts` (5 unit tests) + continuous telemetry via the new analyzer.

### Class 2 — Accumulated-history growth (ckpt-B, commit `088bb0b`)

**Change:** New `trimStaleToolResults` helper in `generateWithTools`. Before each LLM call, walks `contents[]` from the most recent backwards; keeps the N most-recent tool-result turns intact (default 3); replaces payloads in older turns with `{_ois_elided, original_tokens_approx, note}` stubs when larger than 500 approx tokens. Preserves `functionResponse.id` + `.name` for Gemini attribution. Idempotent. Opt-in via `historyTrimEnabled` on `CognitiveOptions`.

**Verified:** 6-thread matrix on revision `00043-qjf`, 2026-04-20.

| Metric | Baseline | After ckpt-A | After ckpt-B |
|---|---:|---:|---:|
| Total Gemini tokens | 3,705k | 1,301k | **675k** (cumulative −82%) |
| MAX_TOOL_ROUNDS attempts | 12 | 1 | **0** |

Trim signature directly observed on thread-178 (design analysis): prompt stayed at ~72k rounds 2-4 (big `get_idea` payload inside the window), **dropped 88% to 9.8k at round 5** when the round-2 payload elided.

**Class status:** **SQUASHED.** Round-10 prompt token growth is now sub-linear. Regression-guarded by `test/history-trim.test.ts` (6 unit tests covering window boundary, size threshold, idempotence, `functionResponse.id/name` preservation, non-mutation of the initial prompt).

### Class 3 — Architect-side cognitive pipeline not wired (ckpt-C, commit `0d08a33`)

**Change:** `hub-adapter.ts:80` `McpAgentClient` instantiation now passes `cognitive: CognitivePipeline.standard({ telemetry: { sink: architectTelemetrySink } })`. Activates ResponseSummarizer + ToolResultCache + WriteCallDedup + CircuitBreaker + enricher + normalizer on the architect's Hub request surface. `architectTelemetrySink` exported from `telemetry.ts` so both `llm_usage` events (from the sandwich bridge) and `tool_call` events (from the new pipeline) land on the same `[ArchitectTelemetry]` log line prefix.

**Verified:** 6-thread matrix on revision `00045-2pb`, 2026-04-20.

| Metric | Baseline | After ckpt-A | After ckpt-B | After ckpt-C |
|---|---:|---:|---:|---:|
| Total Gemini tokens | 3,705k | 1,301k | 675k | **638k** (−83% cum) |
| Production Virtual Tokens Saved | 0 | 0 | 0 | **620,130** |
| Summarized tool calls | 0 | 0 | 0 | 15 (20% rate on Hub reads) |
| Cache hits | 0 | 0 | 0 | 2 |
| `tool_call` telemetry events | 0 | 0 | 0 | 74 |

**Class status:** **SQUASHED.** Architect-side pipeline is firing in production; Virtual Tokens Saved is now a live KPI emitting to Cloud Run logs under the `[ArchitectTelemetry]` pipe. Regression-guarded by the telemetry canary target `tool_call_telemetry_events_min >= 10` in `scripts/architect-telemetry/targets.yaml`.

---

## Per-prompt cumulative results (ckpt-C vs baseline)

| # | Prompt shape | Baseline | ckpt-C | Δ |
|---|---|---:|---:|---:|
| 1 | simple ack | 377,185 | 55,871 | −85% |
| 2 | ideation | 487,717 | 77,212 | −84% |
| 3 | tool-heavy read | 351,188 | 33,437 | −90% |
| 4 | design analysis | 1,363,070 | 410,469 | −70% (1 MTR) |
| 5 | parallel candidate | 862,520 | 32,691 | **−96%** |
| 6 | error path | 263,322 | 28,173 | −89% |
| — | **Total** | **3,705,002** | **637,853** | **−83%** |

---

## Durable infrastructure shipped

### Measurement harness (commit `3b244b3`)

`scripts/architect-telemetry/` is the permanent regression-detection substrate for Phase 2b+:

- `aggregate.py` — pulls `[ArchitectTelemetry]` + `[Sandwich]` log lines for a given revision, aggregates per-thread tokens + MAX_TOOL_ROUNDS + scope-rejections + VTS, evaluates against the thresholds in `targets.yaml`, emits structured text/yaml/json. Exit code 0 pass / 1 fail / 2 error so future CI gates can wrap it trivially.
- `targets.yaml` — the sovereign Phase 2b exit-threshold spec (`required` vs `observational` targets).
- `README.md` — runbook + signal sources + interpretation guide.

A Phase 2c task should be to wrap this in a scheduled Cloud Build job and alert on `verdict != pass`.

### Infrastructure hardening (commits `cbd1e3a`, `0acc1ff`)

- `deploy/variables.tf` `architect_min_instances` default flipped 0 → 1 (was causing scale-to-zero between measurement batches, stranding pending-action queue drains)
- `deploy/env/prod.tfvars.example` documents the new default
- `.gitignore` guards `__pycache__/`

---

## Phase 2b-B larger-sample measurement — blocked by retry-death-spiral

The 14-thread follow-up measurement (threads 187-200) to reach N=20 confidence did not produce clean data. Root cause: Hub-side pending-action queue retries previously-failed threads indefinitely on a 300s timer. The 14 new threads were queued behind stuck baseline-era threads (thread-163, -165, -166, -167) that were re-running 10-round sandwich attempts forever, burning ~3.2M tokens on backlog replay alone. The queue could not drain forward in any reasonable window.

This surfaced a new failure class distinct from Phase 2b's three:

### Class 4 — Failure amplification via unbounded retry (OUTSIDE Phase 2b scope — see idea-117)

**Root cause:** Hub queue has no bounded-retry budget. Failed items re-queue every 300s forever. When combined with expensive operations (architect sandwich = 10 rounds × ~22k tokens = ~220k per attempt), a single pathological item can burn millions of tokens before human intervention.

**Observed on revision `00046-76m`, 2026-04-20:**
- Thread-163 (a Phase 2a baseline test thread): 59 Gemini rounds across multiple retries on a single revision, 741,465 tokens, still MAX_TOOL_ROUNDS every attempt.
- 4 threads churning in retry, 0 forward progress on new work.
- ~3.2M tokens burned on retry-backlog within 30 minutes.

**Filed for permanent class-squash:** `idea-117` — "Squash the failure-amplification class — bounded retry policy for Hub-side pending-action queue". Specifies 6 observable ratification criteria: per-item retry budget, exponential backoff, abandonment audit entry + Director notification, same-class circuit breaker, observability canary metric, retroactive drainer tool.

This is **NOT a regression** in Phase 2b's three class squashes — the architect-side precision-context-engineering is working as designed. Class 4 is a Hub-side retry-policy concern that Phase 2b exposed because larger-sample measurement is the first workflow that deliberately opens long-lived queued work.

---

## Phase 2c candidates (ranked by impact)

### 1. Class 4 squash — Hub-side bounded retry policy (idea-117)

Must ship before the next multi-day Director-absent window. Unbounded retry is a silent cost bomb. ~2-4h engineer work on Hub side. Measurement confirmation via the existing harness.

### 2. Pagination-hint-following nudge

Observed: with ResponseSummarizer capping oversized responses, Gemini doesn't reliably follow the `_ois_pagination.next_offset` cursor we ship in summarized responses. It treats the summary as complete context and keeps querying. Thread-184 (ckpt-C) hit MAX_TOOL_ROUNDS despite per-round prompts staying small (~22k) — it just burned rounds not advancing.

Two possible fixes (prefer the first, measure impact, revisit):
- **Prompt-level framing** — in the sandwich prompt, explicitly teach `_ois_pagination` semantics: "when you see `_ois_pagination.next_offset: N`, the result is partial; re-call the tool with `offset: N` to continue, or proceed with the first page if partial data is sufficient." Cost: ~15 lines of prompt.
- **Middleware-level enforcement** — if the LLM re-calls the same read tool with identical args within N rounds after a summarized response, auto-advance the offset rather than replaying. More invasive; earlier prompt framing should be tried first.

### 3. Round-budget-aware convergence nudge

When the round budget is low AND context is already sufficient, bias the LLM toward `create_thread_reply` rather than more tool calls. Closes the remaining stochastic MAX_TOOL_ROUNDS tail on design-analysis-class prompts.

### 4. Dynamic tool scope (idea-115)

Replace the hardcoded allowlist from ckpt-A with a layered scope registry (agent-local → cognitive-middleware → thread-entity-owned → LLM-requested escalation). Architect triage-pending.

### 5. Engineer-side cognitive pipeline wiring

Phase 2b only instrumented the architect. Same change (pass `cognitive: CognitivePipeline.standard(...)` to McpAgentClient) applied to each engineer shim (claude-plugin, opencode-plugin) would propagate Phase 2b wins across the full grid.

### 6. tele-10 "Precision Context Engineering" ratification (idea-116)

Give Phase 2b's wins a sovereign telemetry axis. Architect triage-pending in a dedicated thread per Director direction.

---

## Method / reproducibility

```bash
# 1. Deploy architect with cognitive-pipeline-wired code
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
./deploy/build.sh architect

# 2. Drive the 6-prompt matrix against the live architect
#    (manual via MCP tools or via a driver — see README.md)

# 3. Aggregate + evaluate against ratified targets
scripts/architect-telemetry/aggregate.py \
    --revision architect-agent-NNNNN-xxx \
    --freshness 30m

# Exit 0 = all required targets pass (class remains squashed)
# Exit 1 = regression detected (investigate before promoting revision)
```

The ratified targets in `scripts/architect-telemetry/targets.yaml` are the sovereign class-squash spec. Any change to architect precision-context-engineering code paths should re-run this and confirm `verdict: pass`.

---

## Statistical notes

- Headline 83% reduction is measured on the **6-prompt matrix defined in the Phase 2a baseline plan**, N=6 per checkpoint. Single-run sample.
- The Phase 2b-B larger-N (N=20) attempt did not complete cleanly due to Class 4 backlog contamination — but the partial N=6 data is internally consistent across ckpt-A/B/C.
- Stochastic tail: 1 out of 6 ckpt-C threads hit MAX_TOOL_ROUNDS (design-analysis). Whether this is a 17% rate or a single-run outlier cannot be resolved at N=6; Phase 2c's retry-policy squash + pagination-nudge will narrow the tail.
- The `targets.yaml` MAX_TOOL_ROUNDS threshold is set to ≤10% (lenient) precisely because the tail distribution isn't yet characterized; tighten after Phase 2c.

---

## Declarations

Phase 2b squashes three failure classes:

- **FR-SCOPE-REJECT** — scope-override preamble eliminates hallucinated out-of-scope tool calls.
- **Accumulated-history growth** — round-to-round trimming caps prompt-token growth.
- **Architect-side cognitive pipeline absent** — pipeline now wired; production VTS emitting; tool_call telemetry flowing.

Each class has:
- Unit test or telemetry canary that regresses on re-introduction
- A ratified `targets.yaml` threshold the analyzer enforces
- A per-checkpoint commit in git history for archaeological clarity

Cumulative production impact: **83% reduction in architect Gemini token spend** on the canonical prompt matrix, **620k production Virtual Tokens Saved** per 6-thread workload.

Phase 2b is closed. Phase 2c is ranked and ready.

---

## Canonical references

- Plan: `docs/planning/phase-2b-architect-token-optimization-plan.md`
- Phase 2a baseline: `docs/audits/phase-2a-baseline-measurement.md`
- Phase 1 baseline: `docs/audits/phase-1-baseline-measurement.md`
- Harness: `scripts/architect-telemetry/`
- Open ideas raised: idea-115 (dynamic tool scope), idea-116 (tele-10 proposal), idea-117 (failure-amplification class)
- Shipped commits:
  - `a13ba89` — ckpt-A sandwich scope-override preamble
  - `088bb0b` — ckpt-B round-to-round history trim
  - `0d08a33` — ckpt-C architect cognitive pipeline wire
  - `3b244b3` — telemetry harness
  - `0acc1ff` — min-instances default fix
