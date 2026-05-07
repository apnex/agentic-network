/**
 * SSE peek-line render — M-SSE-Peek-Line-Cleanup Phase 1 (Design v1.1).
 *
 * Substrate-side canonical render of the operator-visible peek-line text
 * surfaced via SSE notifications. Per Design v1.1 §0.5.3 (render-locus
 * decision) + §1.1 (ExternalInjectionPayload extension): emit-sites
 * compute the canonical body at emit-time using structured fields
 * (sourceClass + entityRef + actionability + the action-verb-phrase);
 * adapter passes `payload.body` through unchanged.
 *
 * Substrate-currency note (Design v1.1 FX fold): mission-56 W5 removed
 * the legacy `Notification` entity; SSE-injection now flows through
 * `messageStore.createMessage({ kind: "external-injection", payload })`.
 * Phase-1 extends that payload (NOT a non-existent Notification interface).
 *
 * Render template (Design v1.1 §2.1):
 *   `[<source-class>] <action-verb-phrase> <entity-id>: "<entity-title>" — <body-preview> [<actionability-marker>]`
 *
 * Truncation policy (§2.3, Director-stated): no truncation when content
 * fits; total budget ~200 chars; truncation order is body-preview (first)
 * → entity-title (second, only if >60 chars). Source-class / action-verb-
 * phrase / entity-id / actionability NEVER truncated.
 */

// ── Types ────────────────────────────────────────────────────────────

/**
 * 7-class taxonomy per Design v1.1 §1.2. Coarse-grained; action verb in
 * the render template carries per-event detail (so System-PR is NOT split
 * into per-action variants per AG-4).
 */
export const SOURCE_CLASSES = [
  "Hub",
  "Director",
  "Engineer",
  "Architect",
  "System-PR",
  "System-Pulse",
  "System-Audit",
] as const;

export type SourceClass = (typeof SOURCE_CLASSES)[number];

/**
 * Entity-reference type per Design v1.1 §1.1. Auto-populated at emit-site
 * based on emit context (each emit-site KNOWS its primary entity); NOT a
 * parser of body text — that's §3 cross-ref schema in Phase 2.
 */
export const ENTITY_TYPES = [
  "thread",
  "mission",
  "PR",
  "task",
  "bug",
  "idea",
  "calibration",
  "commit",
  "audit",
  "agent",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface EntityRef {
  type: EntityType;
  id: string;
  title?: string;
}

/**
 * Actionability marker per Design v1.1 §1.4. Populated per emit-class:
 * - `your-turn`: thread_message peer-reply where recipient's currentTurn
 *   matches their role. Multicast threads fan out per-agent (every role-
 *   member tagged your-turn).
 * - `FYI`: thread_convergence_finalized, mission_status_changed,
 *   agent_state_changed, thread-less emits without currentTurn context.
 * - `emitted`: System-PR notifications (operator-informational; no action
 *   required).
 * - `acked`: ack-class notifications (when ack flag flips).
 */
export const ACTIONABILITIES = ["your-turn", "FYI", "emitted", "acked"] as const;
export type Actionability = (typeof ACTIONABILITIES)[number];

/**
 * The Phase-1 extended payload shape for `kind: "external-injection"`
 * Messages, per Design v1.1 §1.1 + Phase-1.5 #1 §1.1
 * (M-SSE-Filter-List-Adapter-Consumption). Existing fields (event, data,
 * targetRoles) are preserved unchanged; the 4 Phase-1 additions
 * (sourceClass, entityRef, actionability, body) are render inputs/output
 * stored on the payload for query-ability + Phase-2 cross-ref foundation;
 * the Phase-1.5 #1 addition (suppress_peek_line) carries the §1.5
 * filter-list decision Hub-side → adapter consumption (single
 * source-of-truth; no per-adapter drift surface).
 */
export interface ExternalInjectionPayload {
  // Existing fields (preserved):
  event: string;
  data: Record<string, unknown>;
  targetRoles: string[];

  // Phase-1 additions (Design v1.1):
  sourceClass: SourceClass;
  entityRef?: EntityRef;
  actionability: Actionability;
  body: string;

  // Phase-1.5 #1 addition (M-SSE-Filter-List-Adapter-Consumption Design v1.0):
  suppress_peek_line?: boolean;
}

/**
 * Render inputs — what an emit-site supplies. The render function
 * derives the entity-id label and entity-title from `entityRef` and
 * applies the truncation policy.
 */
export interface PeekLineRenderInput {
  sourceClass: SourceClass;
  /**
   * Action-verb-phrase per Design v1.1 §2.2 (e.g., "Replied to",
   * "Converged", "Activated", "<author-role> opened"). Caller supplies
   * the appropriate phrase per the lookup table; no enum because the
   * phrase is free-form (must satisfy the format-regex in §3).
   */
  actionVerb: string;
  entityRef?: EntityRef;
  /** First 1-2 sentences of body (~100 chars) per §2.4. Optional. */
  bodyPreview?: string;
  actionability: Actionability;
}

// ── Constants ────────────────────────────────────────────────────────

/** Total budget per peek-line per Design v1.1 §2.3. */
export const PEEK_LINE_BUDGET = 200;

/** Entity-title threshold beyond which truncation may apply per §2.3. */
export const ENTITY_TITLE_TRUNCATE_THRESHOLD = 60;

// ── Filter list (§1.5) ───────────────────────────────────────────────

/**
 * Events excluded from peek-line render per Design v1.1 §1.5. Filtered
 * events still flow to adapter-internal state-machine consumption (e.g.,
 * agent_state_changed drives state transitions); they just don't surface
 * to the operator's terminal.
 *
 * Filter-list IS the substrate-feature surface for "what does operator
 * see"; engineer flag for additional candidates surfacing during impl.
 */
export const PEEK_LINE_FILTERED_EVENTS: ReadonlySet<string> = new Set([
  "agent_state_changed",
  // engineerPulse / agentPulse on standby-acknowledged: filtered via
  // shouldFilterPeekLine() (data-shape check; covered below).
  // touchAgent rate-limited updates: filtered via event-prefix check.
  // W1b replay-truncated synthetic SSE events: filtered via event match.
  "touchAgent",
  "sse_replay_truncated",
]);

/**
 * Predicate for filter-list per §1.5. Checks event name + payload shape;
 * pulse events are filtered only when on the standby-acknowledged data
 * path (per `feedback_engineer_pulse_template_carryover.md`).
 */
export function shouldFilterPeekLine(
  event: string,
  data?: Record<string, unknown>,
): boolean {
  if (PEEK_LINE_FILTERED_EVENTS.has(event)) return true;

  // Pulse-on-standby-acknowledged: filter when state=standby + acked=true
  if (
    (event === "engineerPulse" ||
      event === "agentPulse" ||
      event === "architectPulse") &&
    data &&
    typeof data === "object"
  ) {
    const d = data as Record<string, unknown>;
    if (d.state === "standby" && d.acknowledged === true) return true;
  }

  return false;
}

// ── Render ───────────────────────────────────────────────────────────

/**
 * Render the canonical peek-line body string per Design v1.1 §2.1 +
 * §2.3 truncation policy. Returns the body string that emit-sites stash
 * in `payload.body`.
 */
export function renderPeekLineBody(input: PeekLineRenderInput): string {
  const { sourceClass, actionVerb, entityRef, bodyPreview, actionability } =
    input;

  const prefix = `[${sourceClass}]`;
  const actionMarker = `[${actionability}]`;

  // Build the entity-segment: `<entity-id>: "<entity-title>"`
  // When entityRef is absent (e.g., bare system note), omit the segment;
  // the caller's actionVerb should carry sufficient context.
  let entitySegment = "";
  let entityTitle = entityRef?.title ?? "";
  let entityId = entityRef?.id ?? "";
  if (entityRef) {
    entitySegment = entityTitle
      ? `${entityId}: "${entityTitle}"`
      : entityId;
  }

  const previewSegment = bodyPreview ? ` — ${bodyPreview}` : "";

  // First pass: build with no truncation
  const parts = [prefix, actionVerb];
  if (entitySegment) parts.push(entitySegment);
  let line = parts.join(" ") + previewSegment + ` ${actionMarker}`;

  if (line.length <= PEEK_LINE_BUDGET) return line;

  // Truncation step 1: shrink body-preview (§2.3 first truncation target)
  if (bodyPreview) {
    const overflow = line.length - PEEK_LINE_BUDGET;
    const minPreviewLen = 3; // "..."
    const targetPreviewLen = Math.max(
      minPreviewLen,
      bodyPreview.length - overflow - 3, // -3 for "..." suffix
    );
    if (targetPreviewLen >= minPreviewLen && targetPreviewLen < bodyPreview.length) {
      const truncatedPreview = bodyPreview.slice(0, targetPreviewLen).trimEnd() + "...";
      line =
        parts.join(" ") + ` — ${truncatedPreview} ${actionMarker}`;
    } else {
      // Drop body-preview entirely if even minimal truncation insufficient
      line = parts.join(" ") + ` ${actionMarker}`;
    }
    if (line.length <= PEEK_LINE_BUDGET) return line;
  }

  // Truncation step 2: shrink entity-title (only if >60 chars per §2.3)
  if (entityRef && entityTitle.length > ENTITY_TITLE_TRUNCATE_THRESHOLD) {
    const overflow = line.length - PEEK_LINE_BUDGET;
    const minTitleLen = 10; // sane lower bound
    const targetTitleLen = Math.max(
      minTitleLen,
      entityTitle.length - overflow - 3,
    );
    if (targetTitleLen >= minTitleLen && targetTitleLen < entityTitle.length) {
      entityTitle = entityTitle.slice(0, targetTitleLen).trimEnd() + "...";
      entitySegment = `${entityId}: "${entityTitle}"`;
      const newParts = [prefix, actionVerb, entitySegment];
      // Keep whatever preview survived step 1
      const finalPreview = line.includes(" — ")
        ? line.slice(line.indexOf(" — "), line.lastIndexOf(` ${actionMarker}`))
        : "";
      line = newParts.join(" ") + finalPreview + ` ${actionMarker}`;
    }
  }

  return line;
}

/**
 * Backward-compat render for pre-Phase-1 notifications (no sourceClass
 * field). Per Design v1.1 §3 + §4: `[unknown]` prefix; one-release
 * fallback. Reaper sweeps stale records per existing 7-day threshold.
 */
export function renderUnknownFallback(rawBody: string): string {
  const line = `[unknown] ${rawBody}`;
  if (line.length <= PEEK_LINE_BUDGET) return line;
  return line.slice(0, PEEK_LINE_BUDGET - 3).trimEnd() + "...";
}

/**
 * Format-regex contract per Design v1.1 §3 (render contract test). Pins
 * the canonical structure; less brittle than hardcoded-string assertions
 * (per `feedback_format_regex_over_hardcoded_hash_tests.md`).
 */
export const PEEK_LINE_FORMAT_REGEX =
  /^\[(Hub|Director|Engineer|Architect|System-PR|System-Pulse|System-Audit)\] [a-zA-Z][a-zA-Z0-9 -]*\b/;

// ── Event → render-context derivation (§1.2 + §2.2 resolution tables) ─

/**
 * Derive the canonical render-context from an event-name + data payload
 * per Design v1.1 §1.2 (sourceClass) + §2.2 (action-verb-phrase) +
 * §1.3 (entityRef) + §1.4 (actionability) tables.
 *
 * Returns `null` if the event is in the filter-list (§1.5) — caller
 * should skip emit-time render (peek-line not surfaced) but still
 * persist the legacy payload shape for adapter-internal state-machine
 * consumption.
 *
 * Returns a partial context for events not in the table — sourceClass
 * defaults to `Hub`; action-verb falls back to a generic phrasing; the
 * fallback `[unknown]` adapter-render path covers the gap during cutover.
 */
export function deriveRenderContext(
  event: string,
  data: Record<string, unknown>,
): {
  sourceClass: SourceClass;
  actionVerb: string;
  entityRef?: EntityRef;
  bodyPreview?: string;
  actionability: Actionability;
} | null {
  if (shouldFilterPeekLine(event, data)) return null;

  // Helper to safely extract string fields from data
  const str = (key: string): string | undefined => {
    const v = data[key];
    return typeof v === "string" ? v : undefined;
  };

  switch (event) {
    case "thread_message": {
      const author = str("author") ?? "Engineer";
      const sourceClass: SourceClass =
        author === "architect" ? "Architect" :
        author === "director" ? "Director" :
        author === "engineer" ? "Engineer" : "Engineer";
      const threadId = str("threadId") ?? "thread-?";
      const title = str("title");
      return {
        sourceClass,
        actionVerb: "Replied to",
        entityRef: { type: "thread", id: threadId, title },
        bodyPreview: str("message"),
        actionability: "your-turn",
      };
    }

    case "thread_convergence_finalized": {
      const threadId = str("threadId") ?? "thread-?";
      const title = str("title");
      return {
        sourceClass: "Hub",
        actionVerb: "Converged",
        entityRef: { type: "thread", id: threadId, title },
        bodyPreview: str("summary"),
        actionability: "FYI",
      };
    }

    case "mission_status_changed": {
      const missionId = str("missionId") ?? "mission-?";
      const title = str("title");
      const fromStatus = str("fromStatus") ?? "?";
      const toStatus = str("toStatus") ?? "?";
      const transition = `${fromStatus}→${toStatus}`;
      const verb =
        toStatus === "active" ? "Activated" :
        toStatus === "completed" ? "Completed" :
        toStatus === "abandoned" ? "Abandoned" : `Transitioned (${transition})`;
      return {
        sourceClass: "Hub",
        actionVerb: verb,
        entityRef: { type: "mission", id: missionId, title },
        actionability: "FYI",
      };
    }

    case "pr-opened-notification":
    case "pr-merged-notification":
    case "pr-review-approved-notification":
    case "pr-review-submitted-notification":
    case "commit-pushed-notification": {
      const author = str("authorRole") ?? str("author") ?? "Agent";
      const verb =
        event === "pr-opened-notification" ? `${author} opened` :
        event === "pr-merged-notification" ? `${author} merged` :
        event === "pr-review-approved-notification" ? `${author} approved` :
        event === "pr-review-submitted-notification" ? `${author} reviewed` :
        `${author} pushed`;
      const prNumber = data.prNumber ?? data.pullNumber;
      const repoRef = str("repo") ?? "";
      const id = prNumber !== undefined ? `PR #${prNumber}` : (str("commit") ?? "commit");
      return {
        sourceClass: "System-PR",
        actionVerb: verb,
        entityRef: { type: "PR", id, title: str("prTitle") ?? str("title") ?? repoRef },
        actionability: "emitted",
      };
    }

    case "engineerPulse":
    case "agentPulse":
    case "architectPulse": {
      const missionId = str("missionId") ?? "mission-?";
      return {
        sourceClass: "System-Pulse",
        actionVerb: "Pulse fired",
        entityRef: { type: "mission", id: missionId },
        bodyPreview: str("message"),
        actionability: "FYI",
      };
    }

    case "task_issued": {
      const taskId = str("taskId") ?? "task-?";
      return {
        sourceClass: "Architect",
        actionVerb: "Issued",
        entityRef: { type: "task", id: taskId, title: str("title") },
        actionability: "your-turn",
      };
    }

    case "review_completed": {
      const taskId = str("taskId") ?? "task-?";
      return {
        sourceClass: "Architect",
        actionVerb: "Reviewed",
        entityRef: { type: "task", id: taskId },
        actionability: "FYI",
      };
    }

    case "revision_required": {
      const taskId = str("taskId") ?? "task-?";
      return {
        sourceClass: "Architect",
        actionVerb: "Revision-required",
        entityRef: { type: "task", id: taskId },
        actionability: "your-turn",
      };
    }

    case "proposal_decided": {
      const proposalId = str("proposalId") ?? "proposal-?";
      const decision = str("decision") ?? "decided";
      return {
        sourceClass: "Architect",
        actionVerb: `Proposal ${decision}`,
        entityRef: { type: "idea", id: proposalId },
        actionability: "FYI",
      };
    }

    case "clarification_answered": {
      const taskId = str("taskId") ?? "task-?";
      return {
        sourceClass: "Architect",
        actionVerb: "Answered clarification for",
        entityRef: { type: "task", id: taskId },
        actionability: "your-turn",
      };
    }

    case "director_notification": {
      return {
        sourceClass: "Director",
        actionVerb: "Notification",
        bodyPreview: str("title") ?? str("body"),
        actionability: "FYI",
      };
    }

    default:
      return {
        sourceClass: "Hub",
        actionVerb: `Event: ${event}`,
        actionability: "FYI",
      };
  }
}
