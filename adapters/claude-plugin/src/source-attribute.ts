/**
 * Mission-56 W2.3 — claude-plugin render-surface source-attribute taxonomy.
 *
 * Layer-3 host-specific binding (claude-plugin only). The Universal
 * Adapter notification contract (Layer 1) emits classified events; the
 * Layer-2 `@ois/message-router` routes them onto the host's
 * `notificationHooks`; this module implements the claude-shim's
 * `<channel>` source-attribute taxonomy per Design v1.2 §"Architectural
 * commitments #4" + spec §"Render-surface semantics" worked example.
 *
 * The four ratified family strings:
 *   - `plugin:agent-adapter:repo-event` — mission-52 bridge subkinds
 *   - `plugin:agent-adapter:directive`  — director-attention notifications
 *   - `plugin:agent-adapter:notification` — general Hub notifications
 *   - `plugin:agent-adapter:proxy`      — fallback / pre-taxonomy compat
 *
 * Pure function — testable in isolation; called from
 * `pushChannelNotification` to populate the `meta.source` field on
 * every `<channel>` push.
 */

const SOURCE_REPO_EVENT = "plugin:agent-adapter:repo-event";
const SOURCE_DIRECTIVE = "plugin:agent-adapter:directive";
const SOURCE_NOTIFICATION = "plugin:agent-adapter:notification";
const SOURCE_PROXY = "plugin:agent-adapter:proxy";

/**
 * Mirror of `@ois/repo-event-bridge` `REPO_EVENT_SUBKINDS`. Hardcoded to
 * avoid a cross-package install dependency just for a constant; verify
 * against `packages/repo-event-bridge/src/translator.ts` when bridge
 * subkind taxonomy evolves.
 */
const REPO_EVENT_SUBKINDS: ReadonlySet<string> = new Set([
  "pr-opened",
  "pr-closed",
  "pr-merged",
  "pr-review-submitted",
  "pr-review-approved",
  "pr-review-comment",
  "commit-pushed",
  "unknown",
]);

/**
 * Hub event-types that route to the general notification family.
 * Mirror of `HubEventType` in `@ois/network-adapter`'s
 * `kernel/event-router.ts` minus `director_attention_required` (which
 * has its own family) and minus `cascade_failure` (router-level
 * diagnostic; treated as general). `message_arrived` (mission-56 W1a)
 * is included so push-pipeline Messages route to the notification
 * family unless their subkind is repo-event.
 */
const HUB_NOTIFICATION_EVENTS: ReadonlySet<string> = new Set([
  "task_issued",
  "directive_acknowledged",
  "report_submitted",
  "review_completed",
  "revision_required",
  "proposal_submitted",
  "proposal_decided",
  "clarification_requested",
  "clarification_answered",
  "thread_opened",
  "thread_message",
  "thread_convergence_finalized",
  "thread_abandoned",
  "idea_submitted",
  "mission_created",
  "mission_activated",
  "turn_created",
  "turn_updated",
  "tele_defined",
  "cascade_failure",
  "message_arrived",
]);

/**
 * Resolve the `<channel>` source-attribute family for a given Hub
 * event-type. Returns one of the four ratified strings; never throws.
 *
 * Resolution order (kind/subkind-aware classification stays
 * forward-compat W3+):
 *   1. repo-event subkind → repo-event family
 *   2. director_attention_required → directive family
 *   3. known general Hub event → notification family
 *   4. anything else → proxy fallback (preserves backward compat)
 */
export function resolveSourceAttribute(eventType: string): string {
  if (REPO_EVENT_SUBKINDS.has(eventType)) return SOURCE_REPO_EVENT;
  if (eventType === "director_attention_required") return SOURCE_DIRECTIVE;
  if (HUB_NOTIFICATION_EVENTS.has(eventType)) return SOURCE_NOTIFICATION;
  return SOURCE_PROXY;
}

/** Visibility for tests + diagnostics. */
export const SOURCE_ATTRIBUTE_FAMILIES = {
  REPO_EVENT: SOURCE_REPO_EVENT,
  DIRECTIVE: SOURCE_DIRECTIVE,
  NOTIFICATION: SOURCE_NOTIFICATION,
  PROXY: SOURCE_PROXY,
} as const;
