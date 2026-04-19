/**
 * ErrorNormalizer middleware (ADR-018).
 *
 * Innermost layer. Rewrites deterministic tool errors into "Reasoning
 * Hints" the LLM can self-correct against. Pass-through for all other
 * errors.
 *
 * Closed rewrite set (INV-COG-10):
 *
 *   1. Zod type mismatch       — "Expected X, received Y at path Z"
 *      → "Invalid Input: <field> expects <type>, got <received>. ..."
 *
 *   2. Missing required field  — "Required" at path
 *      → "Missing required field: <field>. Retry with args including ..."
 *
 *   3. Cascade-action schema drift (6 known variants, Appendix A)
 *      → "<action> requires { <key>: { ... } }, got flat shape. ..."
 *
 *   4. Unknown tool + edit-distance match ≤2
 *      → "Tool '<name>' not found. Did you mean '<suggestion>'?"
 *
 * Every other error passes through untouched — better to show the
 * LLM the raw signal than hallucinate a wrong fix. INV-COG-10.
 *
 * The middleware throws a `NormalizedError` on rewrite; the dispatcher
 * layer catches + wraps as isError content. The LLM still sees an
 * error envelope — just with a more helpful message.
 */

import type {
  CognitiveMiddleware,
  ToolErrorContext,
} from "../contract.js";

export class NormalizedError extends Error {
  readonly rawError: unknown;
  readonly rule: string;

  constructor(message: string, rule: string, rawError: unknown) {
    super(message);
    this.name = "NormalizedError";
    this.rule = rule;
    this.rawError = rawError;
  }
}

export interface ErrorNormalizerConfig {
  /**
   * Known tool names for the "Unknown tool → did you mean?"
   * suggestion. Pass the Hub's tool list at adapter init; empty
   * list disables suggestions.
   */
  knownTools?: string[];
  /**
   * Maximum edit-distance for tool-name suggestions. Default: 2.
   */
  maxToolEditDistance?: number;
  /**
   * Cascade-drift rewrite rules. Default: 6 known variants from
   * ADR-018 Appendix A. Override or extend per deployment.
   */
  cascadeDriftRules?: CascadeDriftRule[];
  /**
   * Custom rule pipeline. Runs AFTER built-in rules; the first
   * non-null return wins. Rules accept the error ctx and return
   * a rewrite message or null.
   */
  customRules?: ErrorRule[];
}

export interface ErrorRule {
  readonly name: string;
  apply(ctx: ToolErrorContext): string | null;
}

export interface CascadeDriftRule {
  /** Tool name this rule applies to. */
  readonly tool: string;
  /** Detect whether the error shape matches this rule. */
  matches(ctx: ToolErrorContext): boolean;
  /** Build the reasoning hint. */
  buildHint(ctx: ToolErrorContext): string;
}

// ── Built-in cascade-drift rules (ADR-018 Appendix A) ──────────────

/**
 * The most common cascade-drift pattern: direct-tool schema is flat
 * (`{ideaId, tags, status}`) but the cascade-action schema expects
 * wrapped (`{ideaId, changes: {tags?, status?}}`). We match by tool
 * name + presence of flat-shape args + error referencing 'changes'.
 */
function matchFlatVsWrapped(wrapKey: string) {
  return (ctx: ToolErrorContext): boolean => {
    const msg = errorMessage(ctx.error).toLowerCase();
    if (!msg.includes(wrapKey.toLowerCase())) return false;
    const argKeys = Object.keys(ctx.args ?? {});
    // Must have NO wrapKey and have other keys that would go inside.
    return !argKeys.includes(wrapKey) && argKeys.length > 0;
  };
}

const DEFAULT_CASCADE_DRIFT_RULES: CascadeDriftRule[] = [
  {
    tool: "update_idea",
    matches: matchFlatVsWrapped("changes"),
    buildHint: (ctx) => {
      const keys = Object.keys(ctx.args ?? {}).filter((k) => k !== "ideaId");
      return (
        `Cascade shape mismatch: update_idea requires { ideaId, changes: { ${keys.join(", ")} } }, ` +
        `got flat shape { ${Object.keys(ctx.args ?? {}).join(", ")} }. ` +
        `Retry with the mutation fields wrapped in 'changes'.`
      );
    },
  },
  {
    tool: "update_mission",
    matches: matchFlatVsWrapped("changes"),
    buildHint: (ctx) => {
      const keys = Object.keys(ctx.args ?? {}).filter((k) => k !== "missionId");
      return (
        `Cascade shape mismatch: update_mission requires { missionId, changes: { ${keys.join(", ")} } }, ` +
        `got flat shape. Retry with the mutation fields wrapped in 'changes'.`
      );
    },
  },
  {
    tool: "update_bug",
    matches: matchFlatVsWrapped("changes"),
    buildHint: (ctx) => {
      const keys = Object.keys(ctx.args ?? {}).filter((k) => k !== "bugId");
      return (
        `Cascade shape mismatch: update_bug requires { bugId, changes: { ${keys.join(", ")} } }, ` +
        `got flat shape. Retry with the mutation fields wrapped in 'changes'.`
      );
    },
  },
  {
    tool: "create_idea",
    matches: (ctx) => {
      const msg = errorMessage(ctx.error).toLowerCase();
      const args = ctx.args ?? {};
      // Wrong shape: tool expects `text`, caller provided `title`+`description`
      if (("title" in args || "description" in args) && !("text" in args)) {
        return msg.includes("text") || msg.includes("required");
      }
      return false;
    },
    buildHint: () =>
      "Cascade shape mismatch: create_idea requires { text: string, tags?: string[] }. " +
      "The fields 'title' and 'description' are not part of the schema — combine into 'text'.",
  },
  {
    tool: "update_mission_status",
    matches: (ctx) => {
      const msg = errorMessage(ctx.error).toLowerCase();
      const args = ctx.args ?? {};
      return (
        msg.includes("statusmessage") &&
        !("statusMessage" in args)
      );
    },
    buildHint: () =>
      "Missing required field: update_mission_status requires { missionId, status, statusMessage }. " +
      "Provide statusMessage (a human-readable note on the transition).",
  },
  {
    tool: "close_no_action",
    matches: (ctx) => {
      // Direct close_no_action calls are out-of-spec — this is a
      // thread-staged action only.
      const msg = errorMessage(ctx.error).toLowerCase();
      return msg.includes("close_no_action") && msg.includes("not found");
    },
    buildHint: () =>
      "close_no_action is not a direct tool — it is only available as a staged action inside a thread " +
      "convergence. Use create_thread_reply with stagedActions: [{ kind: 'stage', type: 'close_no_action', ... }].",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    // MCP error envelope: { content: [{ text: "..." }] }
    const content = (err as { content?: Array<{ text?: string }> }).content;
    if (Array.isArray(content) && content[0]?.text) return content[0].text;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j - 1], dp[j]);
      prev = tmp;
    }
  }
  return dp[n];
}

// ── Built-in core rules (Zod / missing / unknown) ──────────────────

function ruleZodTypeMismatch(ctx: ToolErrorContext): string | null {
  const msg = errorMessage(ctx.error);
  // Pattern: "Expected <type>, received <type>" (Zod default message)
  const match = msg.match(/Expected\s+([a-z]+),\s+received\s+([a-z]+)/i);
  if (!match) return null;
  const expected = match[1];
  const received = match[2];

  // Extract field name: look for `path: ["field"]` or `at "field"`
  const pathMatch = msg.match(/"path"\s*:\s*\[\s*"([^"]+)"/);
  const field = pathMatch ? pathMatch[1] : null;

  const fieldTxt = field ? `'${field}'` : "field";
  const example = exampleForType(expected);
  return (
    `Invalid Input: ${fieldTxt} expects ${expected}, got ${received}. ` +
    (example ? `Example: ${example}.` : "")
  );
}

function ruleMissingRequiredField(ctx: ToolErrorContext): string | null {
  const msg = errorMessage(ctx.error);
  // Zod pattern: "Required" with path; or "is required" prose
  if (!/\brequired\b/i.test(msg)) return null;

  const pathMatch = msg.match(/"path"\s*:\s*\[\s*"([^"]+)"/);
  const fieldFromProse = msg.match(/field\s+['"]?(\w+)['"]?\s+is\s+required/i);
  const field = pathMatch?.[1] ?? fieldFromProse?.[1];
  if (!field) return null;

  return (
    `Missing required field: '${field}'. ` +
    `Retry with args including ${field}: <value>.`
  );
}

function ruleUnknownTool(
  ctx: ToolErrorContext,
  knownTools: string[],
  maxDistance: number,
): string | null {
  const msg = errorMessage(ctx.error);
  const unknownMatch = msg.match(/Unknown tool:?\s*['"]?([\w.-]+)['"]?/i);
  if (!unknownMatch) return null;
  const unknown = unknownMatch[1];
  if (knownTools.length === 0) {
    return `Tool '${unknown}' not found.`;
  }

  // Rank candidates by edit distance; emit top suggestion if within budget.
  const scored = knownTools
    .map((name) => ({ name, d: levenshtein(unknown, name) }))
    .sort((a, b) => a.d - b.d);
  const best = scored[0];
  if (!best || best.d > maxDistance) {
    return `Tool '${unknown}' not found.`;
  }
  const top3 = scored.slice(0, 3).map((s) => `'${s.name}'`);
  return (
    `Tool '${unknown}' not found. Did you mean '${best.name}'? ` +
    `Similar tools: ${top3.join(", ")}.`
  );
}

function exampleForType(t: string): string | null {
  switch (t.toLowerCase()) {
    case "string": return '"example"';
    case "number": return "42";
    case "boolean": return "true";
    case "array": return "[]";
    case "object": return "{}";
    default: return null;
  }
}

// ── Middleware ──────────────────────────────────────────────────────

const DEFAULT_MAX_DISTANCE = 2;

export class ErrorNormalizer implements CognitiveMiddleware {
  readonly name = "ErrorNormalizer";

  private readonly knownTools: string[];
  private readonly maxToolEditDistance: number;
  private readonly cascadeDriftRules: CascadeDriftRule[];
  private readonly customRules: ErrorRule[];

  constructor(config: ErrorNormalizerConfig = {}) {
    this.knownTools = config.knownTools ?? [];
    this.maxToolEditDistance = config.maxToolEditDistance ?? DEFAULT_MAX_DISTANCE;
    this.cascadeDriftRules = config.cascadeDriftRules ?? DEFAULT_CASCADE_DRIFT_RULES;
    this.customRules = config.customRules ?? [];
  }

  async onToolError(
    ctx: ToolErrorContext,
    next: (ctx: ToolErrorContext) => Promise<unknown>,
  ): Promise<unknown> {
    const rewrite = this.tryRewrite(ctx);
    if (rewrite) {
      throw new NormalizedError(rewrite.message, rewrite.rule, ctx.error);
    }
    // No rewrite rule fired — pass through untouched (INV-COG-10).
    return next(ctx);
  }

  /**
   * Expose try-rewrite for unit tests + diagnostic introspection.
   * Returns the normalized message + rule name, or null if no rule
   * matched.
   */
  tryRewrite(ctx: ToolErrorContext): { rule: string; message: string } | null {
    // Rule priority (most specific first):
    // 1. Cascade-drift (tool-name-gated)
    for (const rule of this.cascadeDriftRules) {
      if (rule.tool === ctx.tool && rule.matches(ctx)) {
        return { rule: `cascade-drift:${rule.tool}`, message: rule.buildHint(ctx) };
      }
    }

    // 2. Missing required field
    const missing = ruleMissingRequiredField(ctx);
    if (missing) return { rule: "missing-required", message: missing };

    // 3. Zod type mismatch
    const zod = ruleZodTypeMismatch(ctx);
    if (zod) return { rule: "zod-type-mismatch", message: zod };

    // 4. Unknown tool + suggestion
    const unknown = ruleUnknownTool(ctx, this.knownTools, this.maxToolEditDistance);
    if (unknown) return { rule: "unknown-tool", message: unknown };

    // 5. Custom rules (lowest priority)
    for (const rule of this.customRules) {
      const out = rule.apply(ctx);
      if (out) return { rule: `custom:${rule.name}`, message: out };
    }

    return null;
  }
}
