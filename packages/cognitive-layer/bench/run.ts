/**
 * Phase 1 baseline benchmark runner.
 *
 * For each scenario: run TWICE against a fresh loopback hub:
 *   1. `cognitive = undefined` (baseline — no pipeline)
 *   2. `cognitive = CognitivePipeline.standard({ telemetry: { sink } })`
 *
 * Aggregate counters across both runs, derive before/after metrics,
 * emit a markdown report to stdout.
 *
 * Usage:
 *   cd packages/cognitive-layer
 *   npx tsx bench/run.ts
 */

import { randomUUID } from "node:crypto";
import { CognitivePipeline } from "../src/pipeline.js";
import { CognitiveTelemetry } from "../src/middlewares/telemetry.js";
import { McpAgentClient } from "../../network-adapter/src/mcp-agent-client.js";
import { LoopbackTransport } from "../../network-adapter/test/helpers/loopback-transport.js";
import { PolicyLoopbackHub } from "../../network-adapter/test/helpers/policy-loopback.js";
import { AggregatingTelemetrySink } from "./aggregating-sink.js";
import { ALL_SCENARIOS, seedIdeas, type ScenarioContext } from "./scenarios.js";

async function waitFor(cond: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!cond() && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5));
  }
  if (!cond()) throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
}

async function createAgent(
  hub: PolicyLoopbackHub,
  role: "architect" | "engineer",
  cognitive?: CognitivePipeline,
): Promise<{ agent: McpAgentClient; engineerId: string }> {
  const transport = new LoopbackTransport(hub);
  const agent = new McpAgentClient(
    {
      role,
      handshake: {
        globalInstanceId: `bench-${role}-${randomUUID()}`,
        proxyName: "cognitive-bench",
        proxyVersion: "0.0.0",
        transport: "loopback",
        sdkVersion: "0.0.0",
        getClientInfo: () => ({ name: "cognitive-bench", version: "0.0.0" }),
      },
    },
    { transport, cognitive },
  );
  agent.setCallbacks({ onActionableEvent: () => {}, onInformationalEvent: () => {} });
  await agent.start();
  await waitFor(() => agent.isConnected, 5_000);
  const sid = transport.getSessionId();
  const engineerId = sid ? (await hub.engineerIdForSession(sid)) ?? "" : "";
  return { agent, engineerId };
}

interface RunResult {
  sink: AggregatingTelemetrySink;
  /** Total tool calls the Hub actually observed (what we save by caching/dedup). */
  hubSideCalls: number;
  /** Hub calls broken down by tool name. */
  hubCallsByTool: Record<string, number>;
}

async function runScenarios(mode: "baseline" | "cognitive"): Promise<RunResult> {
  const sink = new AggregatingTelemetrySink();
  let hubSideCalls = 0;
  const hubCallsByTool: Record<string, number> = {};

  for (const scenario of ALL_SCENARIOS) {
    const hub = new PolicyLoopbackHub();
    // Both modes include CognitiveTelemetry so we can measure. Baseline
    // omits cache/dedup/circuit/enricher/normalizer — gives us the
    // pre-Phase-1 counts. Cognitive mode enables the full standard()
    // pipeline — gives us the post-Phase-1 counts.
    const pipeline =
      mode === "cognitive"
        ? CognitivePipeline.standard({ telemetry: { sink: sink.sink } })
        : new CognitivePipeline().use(new CognitiveTelemetry({ sink: sink.sink }));

    const arch = await createAgent(hub, "architect");
    const eng = await createAgent(hub, "engineer", pipeline);

    // Seed a few ideas for read-heavy scenarios
    await seedIdeas(eng.agent, 10);

    const ctx: ScenarioContext = {
      eng: eng.agent,
      arch: arch.agent,
      engEngineerId: eng.engineerId,
      archEngineerId: arch.engineerId,
    };

    // Reset the hub log after seeding so we only count scenario-run calls
    hub.clearToolCallLog();

    try {
      await scenario.run(ctx);
    } catch (err) {
      console.error(`Scenario ${scenario.name} crashed:`, err);
    }

    // Capture Hub-side call count for this scenario
    const scenarioHubCalls = hub.getToolCallLog();
    hubSideCalls += scenarioHubCalls.length;
    for (const call of scenarioHubCalls) {
      hubCallsByTool[call.tool] = (hubCallsByTool[call.tool] ?? 0) + 1;
    }

    try { await eng.agent.stop(); } catch { /* ignore */ }
    try { await arch.agent.stop(); } catch { /* ignore */ }
    // Let any fire-and-forget telemetry emissions settle.
    await new Promise((r) => setTimeout(r, 50));
  }

  return { sink, hubSideCalls, hubCallsByTool };
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatPct(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

function computeDelta(before: number, after: number): number {
  if (before === 0) return after === 0 ? 0 : 1;
  return (after - before) / before;
}

async function main(): Promise<void> {
  console.log("=== M-Cognitive-Hypervisor Phase 1 — Baseline Measurement ===\n");

  console.log("Running baseline (telemetry only — no cache/dedup/circuit/enricher/normalizer)...");
  const baseline = await runScenarios("baseline");
  console.log("  ... done");

  console.log("Running cognitive (full .standard() pipeline)...");
  const cognitive = await runScenarios("cognitive");
  console.log("  ... done\n");

  const b = baseline.sink.snapshot();
  const c = cognitive.sink.snapshot();

  // ── Report ──────────────────────────────────────────────────────

  console.log("## Phase 1 Baseline Measurement Report\n");
  console.log(`Scenario set: ${ALL_SCENARIOS.length} scenarios`);
  console.log(`  ${ALL_SCENARIOS.map((s) => `- ${s.name}`).join("\n  ")}\n`);

  console.log("### Raw volume (client-side — what the LLM issued)\n");
  console.log("| Metric | Baseline | Cognitive | Δ |");
  console.log("|---|---:|---:|---:|");
  console.log(
    `| Client tool calls | ${formatCount(b.toolCalls)} | ${formatCount(c.toolCalls)} | ${formatPct(computeDelta(b.toolCalls, c.toolCalls))} |`,
  );
  console.log(
    `| Tool errors | ${formatCount(b.toolErrors)} | ${formatCount(c.toolErrors)} | ${formatPct(computeDelta(b.toolErrors, c.toolErrors))} |`,
  );

  console.log("\n### Hub-side calls (the actual savings)\n");
  console.log("| Metric | Baseline | Cognitive | Δ |");
  console.log("|---|---:|---:|---:|");
  console.log(
    `| Hub-side calls reached | ${formatCount(baseline.hubSideCalls)} | ${formatCount(cognitive.hubSideCalls)} | ${formatPct(computeDelta(baseline.hubSideCalls, cognitive.hubSideCalls))} |`,
  );
  console.log(
    `| Calls prevented by cognitive layer | — | ${formatCount(baseline.hubSideCalls - cognitive.hubSideCalls)} | — |`,
  );

  console.log("\n### Token accounting\n");
  console.log("| Metric | Baseline (off) | Cognitive (on) | Δ |");
  console.log("|---|---:|---:|---:|");
  console.log(
    `| Total input tokens (approx) | ${formatCount(b.totalInputTokensApprox)} | ${formatCount(c.totalInputTokensApprox)} | ${formatPct(computeDelta(b.totalInputTokensApprox, c.totalInputTokensApprox))} |`,
  );
  console.log(
    `| Total output tokens (approx) | ${formatCount(b.totalOutputTokensApprox)} | ${formatCount(c.totalOutputTokensApprox)} | ${formatPct(computeDelta(b.totalOutputTokensApprox, c.totalOutputTokensApprox))} |`,
  );
  console.log(
    `| Total bytes in/out | ${formatCount(b.totalInputBytes + b.totalOutputBytes)} | ${formatCount(c.totalInputBytes + c.totalOutputBytes)} | ${formatPct(computeDelta(b.totalInputBytes + b.totalOutputBytes, c.totalInputBytes + c.totalOutputBytes))} |`,
  );

  console.log("\n### Cognitive-layer derived metrics (cognitive run only)\n");
  console.log("| Metric | Value |");
  console.log("|---|---:|");
  console.log(`| Cache hit rate | ${formatRate(cognitive.sink.cacheHitRate())} (${c.cacheHits}/${c.cacheHits + c.cacheMisses}) |`);
  console.log(
    `| Dedup prevention rate | ${formatRate(cognitive.sink.dedupPreventionRate())} (prevented ${c.dedupInFlight + c.dedupReplay}/${c.dedupFirst + c.dedupInFlight + c.dedupReplay}) |`,
  );
  console.log(`| Circuit-breaker fast-fails | ${c.circuitBreakerFastFails} |`);
  console.log(`| Mean call duration (ms) | ${cognitive.sink.meanDurationMs().toFixed(2)} |`);
  console.log(`| Error rate | ${formatRate(cognitive.sink.errorRate())} |`);

  console.log("\n### Per-tool call counts (cognitive run)\n");
  const sorted = Object.entries(c.toolCallsByTool).sort(([, a], [, bv]) => bv - a);
  for (const [tool, count] of sorted.slice(0, 10)) {
    const tokens = c.outputTokensByTool[tool] ?? 0;
    console.log(`  ${tool.padEnd(30)} ${String(count).padStart(6)} calls, ~${tokens} output tokens`);
  }

  console.log("\n### Error-message shapes (cognitive run, top 5)\n");
  const errs = Object.entries(c.errorMessagesByPrefix).sort(([, a], [, bv]) => bv - a);
  if (errs.length === 0) {
    console.log("  (no errors)");
  } else {
    for (const [prefix, count] of errs.slice(0, 5)) {
      console.log(`  [${count}x] ${prefix}`);
    }
  }

  console.log("\n### Hub-side calls by tool (baseline vs cognitive)\n");
  const allTools = new Set([
    ...Object.keys(baseline.hubCallsByTool),
    ...Object.keys(cognitive.hubCallsByTool),
  ]);
  const sortedTools = Array.from(allTools).sort((a, bName) => {
    const bCount = baseline.hubCallsByTool[bName] ?? 0;
    const aCount = baseline.hubCallsByTool[a] ?? 0;
    return bCount - aCount;
  });
  console.log("| Tool | Baseline | Cognitive | Prevented |");
  console.log("|---|---:|---:|---:|");
  for (const tool of sortedTools.slice(0, 12)) {
    const bC = baseline.hubCallsByTool[tool] ?? 0;
    const cC = cognitive.hubCallsByTool[tool] ?? 0;
    console.log(`| ${tool} | ${bC} | ${cC} | ${bC - cC} |`);
  }

  console.log("\n### Summary\n");
  const hubCallsPrevented = baseline.hubSideCalls - cognitive.hubSideCalls;
  const hubReductionPct =
    baseline.hubSideCalls > 0
      ? (hubCallsPrevented / baseline.hubSideCalls) * 100
      : 0;
  console.log(`- **Hub-side call reduction:** ${hubCallsPrevented} fewer Hub calls (${hubReductionPct.toFixed(1)}% reduction)`);
  console.log(`- **Cache hit rate:** ${formatRate(cognitive.sink.cacheHitRate())} (${c.cacheHits} reads served from cache)`);
  console.log(`- **Dedup prevention:** ${c.dedupInFlight + c.dedupReplay} duplicate writes collapsed`);
  console.log(`- **Client tokens unchanged:** ${formatCount(c.totalOutputTokensApprox)} output tokens seen by LLM either way — cognitive layer is cache-transparent (LLM still sees same data; Hub sees fewer calls)`);
  console.log();
}

main().catch((err) => {
  console.error("Bench crashed:", err);
  process.exit(1);
});
