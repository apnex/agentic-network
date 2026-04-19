/**
 * CognitiveTelemetry middleware (ADR-018).
 *
 * Outermost layer of the standard pipeline. Captures every tool call,
 * list-tools invocation, and error with timing + annotations. Emissions
 * are strictly non-blocking (INV-COG-2, INV-COG-11): event metadata is
 * captured synchronously on the hot path and delivered to the user-
 * provided sink via `queueMicrotask` — the pipeline never awaits the
 * sink.
 *
 * Back-pressure: a bounded internal queue caps at `maxQueueDepth`
 * pending emissions. When full, new events are dropped and a rate-
 * limited `telemetry_overflow` log entry surfaces via the diagnostic
 * `logger` callback. Sink exceptions are swallowed — telemetry failure
 * never propagates into agent code.
 */

import type {
  CognitiveMiddleware,
  ToolCallContext,
  ListToolsContext,
  ToolErrorContext,
  Tool,
} from "../contract.js";

export type TelemetryEventKind =
  | "tool_call"
  | "list_tools"
  | "tool_error"
  | "telemetry_overflow";

export interface TelemetryEvent {
  kind: TelemetryEventKind;
  sessionId?: string;
  agentId?: string;
  tool?: string;
  durationMs?: number;
  tags?: Record<string, string>;
  errorMessage?: string;
  droppedCount?: number;
  timestamp: number;
}

export interface CognitiveTelemetryConfig {
  /** User-provided event emitter. Called asynchronously via microtask. */
  sink?: (event: TelemetryEvent) => void;
  /** Diagnostic logger for overflow warnings. */
  logger?: (msg: string) => void;
  /** Internal bounded-queue depth before dropping. Default: 1000. */
  maxQueueDepth?: number;
  /** Rate limit for overflow-warning logs (ms). Default: 60_000. */
  overflowLogIntervalMs?: number;
  /** Clock override for tests. Default: `Date.now`. */
  now?: () => number;
}

const DEFAULT_MAX_QUEUE_DEPTH = 1000;
const DEFAULT_OVERFLOW_LOG_INTERVAL_MS = 60_000;

export class CognitiveTelemetry implements CognitiveMiddleware {
  readonly name = "CognitiveTelemetry";

  private readonly sink: (event: TelemetryEvent) => void;
  private readonly logger: (msg: string) => void;
  private readonly maxQueueDepth: number;
  private readonly overflowLogIntervalMs: number;
  private readonly now: () => number;

  /** Pending emissions awaiting microtask delivery. */
  private pending = 0;
  /** Count of events dropped since last overflow log. */
  private dropped = 0;
  /** Timestamp of last overflow log (throttling). */
  private lastOverflowLog = 0;

  constructor(config: CognitiveTelemetryConfig = {}) {
    this.sink = config.sink ?? (() => {});
    this.logger = config.logger ?? (() => {});
    this.maxQueueDepth = config.maxQueueDepth ?? DEFAULT_MAX_QUEUE_DEPTH;
    this.overflowLogIntervalMs =
      config.overflowLogIntervalMs ?? DEFAULT_OVERFLOW_LOG_INTERVAL_MS;
    this.now = config.now ?? Date.now;
  }

  async onToolCall(
    ctx: ToolCallContext,
    next: (ctx: ToolCallContext) => Promise<unknown>,
  ): Promise<unknown> {
    const started = this.now();
    try {
      const result = await next(ctx);
      this.emit({
        kind: "tool_call",
        sessionId: ctx.sessionId,
        agentId: ctx.agentId,
        tool: ctx.tool,
        durationMs: this.now() - started,
        tags: { ...ctx.tags },
        timestamp: this.now(),
      });
      return result;
    } catch (err) {
      this.emit({
        kind: "tool_error",
        sessionId: ctx.sessionId,
        agentId: ctx.agentId,
        tool: ctx.tool,
        durationMs: this.now() - started,
        tags: { ...ctx.tags },
        errorMessage: err instanceof Error ? err.message : String(err),
        timestamp: this.now(),
      });
      throw err;
    }
  }

  async onListTools(
    ctx: ListToolsContext,
    next: (ctx: ListToolsContext) => Promise<Tool[]>,
  ): Promise<Tool[]> {
    const started = this.now();
    const result = await next(ctx);
    this.emit({
      kind: "list_tools",
      sessionId: ctx.sessionId,
      agentId: ctx.agentId,
      durationMs: this.now() - started,
      tags: { ...ctx.tags, toolCount: String(result.length) },
      timestamp: this.now(),
    });
    return result;
  }

  /**
   * Exposed for diagnostics + tests. Runtime value of the in-flight
   * emission count (decremented once the microtask fires).
   */
  getPendingCount(): number {
    return this.pending;
  }

  /** Count of events dropped since last overflow log. */
  getDroppedCount(): number {
    return this.dropped;
  }

  private emit(event: TelemetryEvent): void {
    if (this.pending >= this.maxQueueDepth) {
      this.dropped++;
      const now = this.now();
      if (now - this.lastOverflowLog >= this.overflowLogIntervalMs) {
        this.logger(
          `[CognitiveTelemetry] queue overflow: dropped ${this.dropped} events (queue depth ${this.maxQueueDepth})`,
        );
        this.lastOverflowLog = now;
      }
      return;
    }
    this.pending++;
    queueMicrotask(() => {
      try {
        this.sink(event);
      } catch {
        /* sink failure swallowed — telemetry never propagates errors */
      } finally {
        this.pending--;
      }
    });
  }
}
