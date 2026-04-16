/**
 * ILogger — structured logging surface shared by Transport (L4) and
 * AgentClient (L7).
 *
 * Phase 1: types only. No implementation. Both layers will accept an
 * injected `ILogger` at construction in later phases; Phase 5 introduces
 * the concrete structured logger.
 *
 * Design intent:
 *   - Stable event names. Every log call carries a short, dotted `event`
 *     identifier (e.g., "transport.connect.ok", "agent.session.invalid")
 *     so downstream telemetry pipelines can aggregate without parsing
 *     human-readable text.
 *   - Structured fields. `fields` is an arbitrary record of primitives.
 *     Implementations MUST NOT introspect contents — the field names are
 *     a contract between caller and log sink.
 *   - No levels on the call site. Severity is inferred from the event
 *     name prefix by the sink (convention: `*.error.*`, `*.warn.*`).
 *     This keeps call sites terse and makes it impossible to log the
 *     "wrong" level for a known event.
 *   - Free-form `message` is optional. Most structured events don't
 *     need prose; it's retained for one-off diagnostics during
 *     development and bridging legacy string-logger call sites.
 */

export type LogField = string | number | boolean | null | undefined;

export interface LogFields {
  readonly [key: string]: LogField | readonly LogField[];
}

export interface ILogger {
  /**
   * Emit a structured log event.
   *
   * @param event  Dotted stable name, e.g. "transport.sse.watchdog.fired".
   *               Stable across releases; consumed by telemetry.
   * @param fields Optional structured context. Keys are part of the
   *               event contract — do not rename without a migration.
   * @param message Optional human-readable prose. Callers should prefer
   *                moving information into `fields` over this string.
   */
  log(event: string, fields?: LogFields, message?: string): void;

  /**
   * Create a child logger with `fields` pre-bound to every emission.
   * Used to scope a logger to a single Transport instance, session,
   * or reconnect attempt without threading context through call sites.
   */
  child(fields: LogFields): ILogger;
}

/**
 * Adapter that bridges a legacy string-only logger (e.g. the existing
 * `(msg: string) => void` used by McpConnectionManager) into the
 * ILogger shape.
 */
export type LegacyStringLogger = (message: string) => void;

// ── Phase 5: concrete implementations ───────────────────────────────

function formatValue(v: LogField | readonly LogField[]): string {
  if (Array.isArray(v)) return `[${v.map(formatValue).join(",")}]`;
  if (v === undefined) return "undef";
  if (v === null) return "null";
  return String(v);
}

function renderFields(fields?: LogFields): string {
  if (!fields) return "";
  const parts: string[] = [];
  for (const k of Object.keys(fields)) {
    const v = fields[k];
    parts.push(`${k}=${formatValue(v as LogField | readonly LogField[])}`);
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

/**
 * Render an event + fields + message into the single-string shape the
 * legacy `(msg: string) => void` sink expects.
 *
 * Format: `[event] message | k1=v1 k2=v2` (empty segments elided).
 * Stable enough that tests matching on message substrings still pass;
 * event name appears as a prefix so structured sinks can still parse.
 */
export function renderLogLine(
  event: string,
  fields?: LogFields,
  message?: string
): string {
  const body = message ?? "";
  const tail = renderFields(fields);
  if (!body && !tail) return `[${event}]`;
  if (!body) return `[${event}]${tail}`;
  if (!tail) return `[${event}] ${body}`;
  return `[${event}] ${body} |${tail}`;
}

class LoggerBase implements ILogger {
  constructor(
    private readonly boundFields: LogFields | undefined,
    private readonly sink: (line: string) => void
  ) {}

  log(event: string, fields?: LogFields, message?: string): void {
    const merged = this.boundFields
      ? { ...this.boundFields, ...(fields ?? {}) }
      : fields;
    this.sink(renderLogLine(event, merged, message));
  }

  child(fields: LogFields): ILogger {
    const merged = this.boundFields
      ? { ...this.boundFields, ...fields }
      : { ...fields };
    return new LoggerBase(merged, this.sink);
  }
}

/**
 * Wrap a legacy `(msg: string) => void` sink into an `ILogger`. The
 * logger renders structured events back to a single string via
 * `renderLogLine`, preserving substring assertions used by existing
 * integration tests.
 */
export function bridgeLegacyLogger(fn: LegacyStringLogger): ILogger {
  return new LoggerBase(undefined, fn);
}

/**
 * Default `ILogger` that renders to `console.log`, prefixed with a
 * component name for visual scan of interleaved output.
 */
export function createConsoleLogger(component: string): ILogger {
  return new LoggerBase(undefined, (line) =>
    console.log(`[${component}] ${line}`)
  );
}

/**
 * Normalize the three accepted logger input shapes (undefined, legacy
 * string function, structured `ILogger`) into a single `ILogger` for
 * internal use. Call sites inside `McpTransport` and `McpAgentClient`
 * use this so they can emit structured events regardless of what the
 * caller passed in.
 */
export function normalizeToILogger(
  logger: ILogger | LegacyStringLogger | undefined,
  defaultComponent: string
): ILogger {
  if (!logger) return createConsoleLogger(defaultComponent);
  if (typeof logger === "function") return bridgeLegacyLogger(logger);
  return logger;
}
