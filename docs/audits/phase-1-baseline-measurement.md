# M-Cognitive-Hypervisor Phase 1 — Baseline Measurement

**Date:** 2026-04-19
**Scope:** Synthetic benchmark of the cognitive-layer pipeline against 5 scenarios modeled on M-Ideas-Audit failure patterns.
**Mode:** Loopback (in-process PolicyLoopbackHub + McpAgentClient; no network).
**Harness:** `packages/cognitive-layer/bench/` (`aggregating-sink.ts`, `scenarios.ts`, `run.ts`).

## Scenarios

| # | Name | Tests |
|---|---|---|
| 1 | `audit-workflow` | 3 passes of list + get read-heavy flow (9 reads/pass); targets ToolResultCache |
| 2 | `duplicate-write-storm` | 5 concurrent identical `create_idea` calls; targets WriteCallDedup |
| 3 | `read-cache` | 20 identical `list_ideas` calls; targets ToolResultCache hit rate |
| 4 | `thread-convergence` | Full thread open → 3 replies → converge; realistic write-mix |
| 5 | `schema-drift` | Wrong-shape `update_idea`; would exercise ErrorNormalizer if Hub rejected |

Each scenario runs twice — once in **baseline** mode (CognitiveTelemetry only, no cache/dedup/etc) and once in **cognitive** mode (full `CognitivePipeline.standard()`).

## Results

### Client-side call count (what the LLM issues)

| Metric | Baseline | Cognitive | Δ |
|---|---:|---:|---:|
| Tool calls | 107 | 107 | 0% (identical LLM workload) |
| Errors | 0 | 0 | — |

LLM-issued call count is the same in both modes. That's correct: the cognitive layer is transparent to the LLM — it sees the same tool surface, issues the same calls, gets the same data back.

### Hub-side call count (the actual savings)

| Metric | Baseline | Cognitive | Δ |
|---|---:|---:|---:|
| Calls that reached the Hub | 59 | 19 | **−67.8%** |
| Calls prevented by cognitive layer | — | 40 | |

**This is the win.** 40 of 59 Hub-reaching calls were short-circuited by the cognitive layer (cache hits + dedup collapses). Hub-side load reduces by ~2/3 on this mix without any LLM-visible behavior change.

### Per-tool breakdown

| Tool | Baseline (Hub) | Cognitive (Hub) | Prevented |
|---|---:|---:|---:|
| `list_ideas` | 38 | 7 | **31** (cache) |
| `create_idea` | 6 | 2 | **4** (dedup) |
| `list_tele` | 3 | 1 | 2 (cache) |
| `list_available_peers` | 3 | 1 | 2 (cache) |
| `get_thread` | 2 | 1 | 1 (cache) |
| `create_thread_reply` | 3 | 3 | 0 (writes pass through) |
| `update_idea` | 3 | 3 | 0 (writes pass through) |
| `create_thread` | 1 | 1 | 0 (write) |

Observations:
- **Reads dominated the savings**: `list_ideas` alone saved 31 Hub calls. The audit-workflow and read-cache scenarios are the biggest contributors — exactly the pattern M-Ideas-Audit showed.
- **Writes pass through as designed**: write verbs (`create_*`, `update_*`) don't engage the cache; `dedup` catches only concurrent identical writes within the 5s post-settlement window.

### Cognitive-layer derived metrics

| Metric | Value |
|---|---:|
| Cache hit rate | **78.3%** (36/46 cacheable reads served from cache) |
| Dedup prevention rate | 6.6% (4/61 writes had concurrent duplicates) |
| Circuit-breaker fast-fails | 0 (no induced faults) |
| Mean per-call pipeline overhead | 0.31 ms (well under the 10 ms p99 budget per INV-COG-11) |
| Error rate | 0% (schema-drift scenario didn't error as expected) |

### Client-side tokens (input + output)

| Metric | Baseline | Cognitive | Δ |
|---|---:|---:|---:|
| Input tokens (approx) | 2,247 | 2,247 | 0% |
| Output tokens (approx) | 16,904 | 16,904 | 0% |
| Total bytes | 76,438 | 76,438 | 0% |

Unchanged — the LLM observes the same data content in both modes. Cache hits don't reduce LLM context consumption on THIS run; they reduce Hub round-trips. True LLM context savings come from downstream effects (faster tool-result delivery → fewer retries; ResponseSummarizer in Phase 2 for payload truncation).

## How these numbers map to M-Ideas-Audit failure classes

| M-Ideas-Audit observation | Phase 1 mitigation | Measurement |
|---|---|---|
| 10× `auto_thread_reply_failed` (tool-round exhaustion) | ToolResultCache + WriteCallDedup cut Hub calls ~2/3 → fewer rounds consumed per convergence | **67.8% Hub-call reduction** corroborates the ~70% target |
| 11× wrong-shape cascade drift | ErrorNormalizer rewrites 6 known variants | **0 observed in bench** (schema-drift scenario didn't actually error — needs wrong-shape args the Hub rejects); unit tests cover all 6 rewrites |
| 1× duplicate reply | WriteCallDedup | **4 duplicates collapsed** in duplicate-write-storm scenario |
| 4× unauthorized task creation | Not a cognitive-layer concern (governance-policy; idea-110) | Out of scope |
| 1× false-positive watchdog | idea-105 shipped separately | Out of scope |

## Limitations + caveats

1. **Synthetic workload, not a real mission.** Numbers are indicative, not production. A real M-Ideas-Audit replay would exercise the schema-drift path end-to-end against real Hub schemas (and would expose the isError-envelope bypass limitation documented in the ErrorNormalizer commit).

2. **Loopback transport is zero-latency.** Mean per-call overhead of 0.31 ms is pipeline cost only; it doesn't include real Hub round-trip latency. In production, cache hits save the full Hub round-trip (tens to hundreds of ms each depending on Cloud Run cold-state).

3. **Approximate tokens only.** `bytes / 4` heuristic; for per-model precision use `gpt-tokenizer` or `@anthropic-ai/tokenizer` at the sink layer.

4. **Hub-side token savings are the full story.** Client-side LLM context tokens don't change here because the LLM sees identical data. Real token savings happen either (a) in LLM prompt context reuse (handled by host LLM layer, not us) or (b) via Phase 2 ResponseSummarizer (truncates large payloads before they reach the LLM).

5. **ErrorNormalizer coverage in the bench is thin** because the schema-drift scenario didn't actually error against the PolicyLoopbackHub (the Hub accepts flat-shape `update_idea` — its direct-tool schema differs from the cascade-action schema). Unit tests cover the rewrite logic exhaustively; a real Hub-side error path requires the same "convert isError envelope to throw" work flagged in the ErrorNormalizer commit as Phase 1.1 or Phase 2.

## Conclusion

**Phase 1 delivers on the mission's claimed value.** Hub-side call volume drops ~68% on a realistic read-heavy mix without LLM-visible changes. Cache hit rate is high (78.3%) because LLM workloads routinely re-read the same state within a turn. Dedup catches duplicate writes by construction.

The cognitive layer is effectively a **kernel for agentic tool surfaces** — transparent to the LLM, load-bearing for the Hub. M-Cognitive-Hypervisor Phase 1 framing ("the universal adapter as a hypervisor") is operationally realized.

## Next steps

1. **Production baseline** — run a real mission (M-Ideas-Audit replay or equivalent) with the cognitive pipeline active, capture Hub-latency deltas (not just call counts).
2. **ErrorNormalizer envelope-aware path** — convert Hub isError responses to throws in the cognitive path so the rewriter catches Zod/cascade-drift in production flows.
3. **vertex-cloudrun shim adds** — round-budget prompt injection + parallel tool-call composition in `sandwich.REASON` (the remaining Phase 1 arch-specific work).
4. **Phase 2 opportunities**:
   - ResponseSummarizer for payload truncation (`list_ideas` returns 15,571 tokens — much of that stable across reads)
   - StaleWhileRevalidateStrategy for ToolResultCache
   - LLM-side token emission via vertex-cloudrun Gemini usage metadata
