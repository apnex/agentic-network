# ADR-012: Architect Error-Surfacing and Context-Economy Policy

**Date:** 2026-04-17
**Status:** Accepted
**Threads:** (none — outcome of an ad-hoc Architect log audit by the Director)
**Complements:** ADR-002 (Sandwich Pattern), ADR-003 (Node.js Architect Rewrite)
**Mission:** sibling hardening pass during Mission-20 closeout

## Decision

The Architect service (`agents/vertex-cloudrun`) follows four explicit contracts:

1. **LLM errors surface as HTTP 200 chat responses with a classified message.** The Director-chat endpoint never returns HTTP 5xx for a Gemini error — quota exhaustion, payload validation failures, model-not-found, and safety blocks all return HTTP 200 with a short prefixed message (`Gemini quota exhausted (429)…`, `Gemini rejected the request (400 INVALID_ARGUMENT)…`, etc.). Session state is preserved.

2. **`buildAutonomousContext()` is cached with a 30-second TTL.** A burst of sandwich handlers within one EventLoop tick reuses a single assembly rather than each re-reading GCS. The cache invalidates explicitly on any write that changes what the context would contain.

3. **Director `session.history` is capped at 150 `Content` entries.** Trim runs both on cold-session load from GCS and after every `generateWithTools` call returns. The trim cuts only at fresh user-text-turn boundaries so it never orphans a model `functionCall` or leaves dangling tool responses.

4. **429 retries in `generateWithTools` do not count against `MAX_TOOL_ROUNDS`.** The tool-loop now retries on 429 with the same 3-attempt exponential backoff that `generateText` already uses. The MAX_TOOL_ROUNDS limit (10) counts legitimate model reasoning rounds only.

Observable by: distinctive log prefixes (`[LLM] generateWithTools round …`, `[DirectorChat] Trimmed session history …`, `[DirectorChat] Error:`) that can be grepped in Cloud Run logs.

## Context

### The "Session Expired" Blackhole

Prior to this ADR, every Gemini failure mode collapsed into one symptom in the chat UI:

```
[Director] > Can you show me the current task list?
[System] Session expired, reconnecting...
[System] New session: 89dbee58-8f65-4f96-a876-07f331f20479
[Architect] I reached the maximum number of tool-calling rounds. Please try a more specific request.
```

The Director couldn't tell which of these was firing:
- **400 INVALID_ARGUMENT** — malformed Gemini payload (most common, often context-overflow)
- **429 RESOURCE_EXHAUSTED** — Vertex AI quota
- **404 NOT_FOUND** — stale/wrong model ID
- **SSE watchdog timeout** — transport reconnect, not LLM at all
- **Genuine tool-loop exhaustion** — legitimately hit 10 rounds

Root cause: `director-chat.ts` caught every LLM error and returned HTTP 500 with `{error: err.message}`. The chat UI treated any 5xx as a transport failure and displayed "Session expired, reconnecting…" — swallowing the actual error string.

### The Polling-Loop Context Waste

A 2026-04-17 audit of the autonomous event loop found ~25-30% of the observed 9.8k-char system prompt was repeated stale content:

- `buildAutonomousContext()` was rebuilt from scratch by every sandwich handler within a single EventLoop tick. A tick with 5 pending items did 5 identical GCS reads and 5 identical 5k-char assemblies.
- Director `session.history` grew unbounded — tool-loop rounds compound across messages (3-20 `Content` entries per Director exchange), and session-expired reconnect replayed the full 200-message persisted history into the in-memory session.
- The four historical snapshots assembled by `buildAutonomousContext` (architecture overview, ADRs, Recent Decisions, Recent Reviews, Recent Thread Outcomes) are re-sent on every call regardless of relevance to the task at hand.

Of those three, the first two are mechanical fixes shipped with this ADR. The third (always-on historical snapshots as a prompt firehose) is a deeper cognitive-architecture redesign tracked as **idea-72** and out of scope here.

## The Four Contracts

### Contract 1 — HTTP 200 on LLM error

`director-chat.ts` `/chat/message` catch block classifies by status code and message pattern, then returns `res.status(200).json({session_id, response, error: true})`. The response body contains a short prefixed message the UI renders like any other chat turn.

Classifications:

| Signal | Message |
|--------|---------|
| `status === 429` / message contains `RESOURCE_EXHAUSTED` | `Gemini quota exhausted (429). Retry shortly or check Vertex AI quota for <project>.` |
| `status === 400` / message contains `INVALID_ARGUMENT` | `Gemini rejected the request (400 INVALID_ARGUMENT). See the [LLM] generateWithTools round … 400 INVALID_ARGUMENT diagnostics in Cloud Run logs. If it persists, start a new session.` |
| `status === 404` / message contains `NOT_FOUND` | `Gemini model or resource not found (404): <msg>` |
| message contains `safety` / `blocked` | `Gemini blocked the response (safety filter).` |
| other | `Architect error: <msg>` |

Session state is preserved — the Director can retry without reconnecting.

### Contract 2 — `buildAutonomousContext` TTL cache

`context.ts` adds `autonomousContextCache: {text, expiresAt}` as a private field on `ContextStore`. `AUTONOMOUS_CONTEXT_TTL_MS = 30_000`. The cached path is called by every sandwich handler and by the Director chat; both benefit from coalescing.

Explicit invalidation is wired into `appendReview`, `appendThreadSummary`, and `appendDecision` via a private `invalidateAutonomousContext()` — the three methods that write state `buildAutonomousContext` reads. `appendDirectorMessage` deliberately does **not** invalidate — it only writes to `director-history.json`, which `buildAutonomousContext` never reads.

TTL rationale: EventLoop ticks are 300s apart and complete within seconds; 30s is long enough to coalesce every handler within one tick and short enough that a stale cache from one tick cannot leak into the next.

### Contract 3 — `session.history` cap at 150 entries

`director-chat.ts` adds a `trimSessionHistory(history, max)` helper. The trim algorithm:

1. If `history.length <= max`, return unchanged.
2. Scan forward from `history.length - max` looking for the first `role === "user"` entry whose `parts` contain a `text` part (i.e. a fresh Director message, not a `functionResponse` batch). Slice from there.
3. If no such boundary exists in the tail, scan from the end backwards for the most recent user-text turn and keep only from there. Rare; only hits in pathological tool-loop-heavy tails.

Cap placement:
- After loading persisted history on a cold session (line that used to assign `session.history = persistedHistory` directly).
- After every `generateWithTools` returns an updated history.

A log line (`[DirectorChat] Trimmed session history N → M entries`) is emitted only when a trim actually reduces the entry count, so the effect is observable without noise.

### Contract 4 — 429 retry not charged against `MAX_TOOL_ROUNDS`

`llm.ts` `generateWithTools` wraps each `client.models.generateContent` call in a 3-attempt retry loop that matches `generateText`'s existing pattern:

```typescript
for (let attempt = 1; attempt <= GENERATE_MAX_RETRIES; attempt++) {
  try {
    response = await client.models.generateContent({...});
    break;
  } catch (err: any) {
    const status = err?.status || err?.code || err?.response?.status;
    if ((status === 429 || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) && attempt < GENERATE_MAX_RETRIES) {
      const delay = GENERATE_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    // 400 — log request diagnostics before rethrowing
    if (status === 400 || msg.includes("INVALID_ARGUMENT")) { /* dump contents shape */ }
    throw err;
  }
}
```

The outer `rounds < MAX_TOOL_ROUNDS` loop only increments on a successful model response. A single quota burp no longer aborts the chat; legitimate rounds-exhaustion means 10 rounds of reasoning actually happened.

400 payload diagnostics (emitted on the error path before rethrow):

- `contents.length` / `systemInstruction.length` / `functionDeclarations.length`
- Total chars across `contents`
- Role sequence (e.g. `user→model→user→model→user→model`)
- Keys + 200-char preview of each part in the last `Content`

These are the shape questions Vertex 400s almost always reduce to: malformed role alternation, orphaned `functionCall` with no matching `functionResponse`, context-size overflow, or a tool-argument blob that's not valid JSON.

## Consequences

### Positive

- The chat UI can now display the actual reason a Gemini call failed. Director can distinguish "quota" from "payload malformed" from "model not found" at a glance, and retry intelligently.
- A 5-handler EventLoop tick now does 1 GCS assembly instead of 5. At current traffic, idle ticks still cost zero Gemini tokens; busy ticks coalesce GCS reads.
- Director sessions no longer grow unbounded on reconnect. A session resuming from 200 persisted messages gets trimmed to 150 before the first new request hits Gemini.
- A single 429 during a long tool-loop no longer aborts the whole chat. Under Vertex quota pressure, the retry-with-backoff pattern matches `generateText`.
- The 400 diagnostic block gives us enough signal to triage malformed-payload failures from logs alone, without needing to reproduce.

### Negative

- Cached autonomous context is stale for up to 30s after a write. In practice the writes (`appendReview`, etc.) invalidate explicitly, so the stale window only exists for writes from other processes (there are none — `max-instances=1`). Safe at current scale; needs re-evaluation if the pin lifts.
- The trim cap at 150 `Content` entries discards older context once a session grows past that. Measured effect: a Director session resumed from GCS with 200 persisted messages loses the oldest 50 on trim. Acceptable trade-off; the alternative is replaying a 200-message transcript on every new request. If Director feedback shows lost context matters, raise the cap.
- The HTTP 200 + `error: true` convention diverges from standard REST. Chat clients must check `error` rather than HTTP status. The current chat UI is the only consumer; other consumers will need updating if added.

### Neutral

- Log volume increases slightly — each tool-loop round now emits `[LLM] generateWithTools round <n>: input=… output=… total=… finishReason=…`, each 400 emits a diagnostic block, each trim emits one line. Cloud Run log costs are negligible at current traffic.
- The architect-agent history RMW (`context.ts` `append*` methods) is not addressed by this ADR. That is a separate sibling concern from Mission-20 Phase 1's §5.1 findings. This ADR only covers what sits on top of those methods.
- **idea-72** remains open. Moving the "Recent Decisions / Reviews / Thread Outcomes" snapshots off the always-on prompt and exposing them as on-demand tools is the deeper redesign. This ADR's TTL cache reduces the cost of the existing design; it does not change the design.

## Implementation

- HTTP 200 classification: `agents/vertex-cloudrun/src/director-chat.ts` `/chat/message` catch block.
- TTL cache: `agents/vertex-cloudrun/src/context.ts` — `AUTONOMOUS_CONTEXT_TTL_MS` constant, `autonomousContextCache` field, `buildAutonomousContext` / `buildAutonomousContextUncached` split, `invalidateAutonomousContext()` called from `appendReview` / `appendThreadSummary` / `appendDecision`.
- Session-history trim: `director-chat.ts` `trimSessionHistory` helper, `MAX_SESSION_HISTORY_ENTRIES = 150` constant, applied at cold-session load and after each generate call.
- 429 retry + 400 diagnostics: `agents/vertex-cloudrun/src/llm.ts` `generateWithTools` — inner `for (attempt …)` loop wrapping `generateContent`.
- Commits: `e52b193` (HTTP 200 surfacing + 429 retry + 400 diagnostics + per-round telemetry), `75b5309` (TTL cache + session-history trim).

## Observability reference

For operators triaging Architect behaviour from Cloud Run logs:

| Symptom | Log filter |
|---------|------------|
| Gemini 400 diagnostic block | `textPayload=~"\[LLM\] generateWithTools round .* 400 INVALID_ARGUMENT"` |
| 429 retry firing | `textPayload=~"\[LLM\] generateWithTools round .* Rate limited \(429\)"` |
| Per-round token usage | `textPayload=~"\[LLM\] generateWithTools round .* input="` |
| Classified error returned to chat | `textPayload:"\[DirectorChat\] Error:"` |
| Session-history trim event | `textPayload:"\[DirectorChat\] Trimmed session history"` |
| SSE transport reconnect | `textPayload=~"Connection: .* → reconnecting \(sse_watchdog\)"` |
