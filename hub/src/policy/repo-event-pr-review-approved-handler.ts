/**
 * pr-review-approved handler — bug-51 fix.
 *
 * Closes mission-76 Design v1.0 §3.1.1 + §8 AG-2 carve-out which had
 * factually-incorrect rationale ("potentially redundant with pr-review-
 * submitted handler reading review state"). In reality, the translator's
 * `dispatchPullRequestReview` (translator.ts:185-193) routes approved
 * reviews to a SEPARATE `pr-review-approved` subkind — the
 * pr-review-submitted handler never sees them. Approval is the highest-
 * value review event (gates merge per branch protection) and was being
 * silently dropped at the handler boundary.
 *
 * Per Design v1.0 §3.4 symmetric routing — engineer-approves → architect
 * notified; architect-approves → engineer notified. Both directions need
 * the merge-gate signal (last-pusher rule unblocks merge when peer approves).
 *
 * Thin wrapper around `synthesizePrNotification` per §3.1 P1 DRY concur:
 * shares `normalizePullRequestReview` payload shape with pr-review-submitted
 * (translator.ts:220-238); intentValue `pr-review-approved-notification`
 * (separate from `pr-review-notification` so adapter-side rendering can
 * differentiate approval from changes_requested at routing surface).
 *
 * Body template intentionally terse (`Engineer/Architect approved PR #N`)
 * — approval is the action signal; cold-context already established by
 * the prior pr-opened notification. Title-rich body would be churn.
 *
 * **KNOWN LIMITATION (carried from bug-50 scope):** in Events-API delivery,
 * `review.html_url` is null; the `reviewUrl` field will be empty in those
 * notifications. Operator navigates via `prNumber` cross-reference. Review
 * URL derivation deferred to a future fix per bug-50 scoping ("review/comment
 * URL deferred"). When promoted, will compose with the
 * `deriveHtmlUrlFromApiUrl` regex pattern from translator.ts.
 */

import type { Message } from "../entities/index.js";
import type { IPolicyContext } from "./types.js";
import type { MessageDispatch, RepoEventHandler } from "./repo-event-handlers.js";
import {
  synthesizePrNotification,
  type PrNotificationOpts,
} from "./repo-event-pr-handler-helpers.js";

interface PrReviewApprovedPayload {
  /** GH login of the reviewer (from `review.user.login` ?? `event.actor.login`; bug-49 fallback). */
  reviewer: string;
  prNumber: number;
  body: string;
  url: string;
}

const PR_REVIEW_APPROVED_OPTS: PrNotificationOpts<PrReviewApprovedPayload> = {
  subkind: "pr-review-approved",
  intentValue: "pr-review-approved-notification",
  extractPayload(raw) {
    if (typeof raw.prNumber !== "number") return null;
    return {
      reviewer: typeof raw.reviewer === "string" ? raw.reviewer : "",
      prNumber: raw.prNumber,
      body: typeof raw.body === "string" ? raw.body : "",
      url: typeof raw.url === "string" ? raw.url : "",
    };
  },
  extractAuthorLogin(p) {
    return p.reviewer || null;
  },
  bodyTemplate(authorRole, p) {
    const subject = authorRole === "engineer" ? "Engineer" : "Architect";
    return `${subject} approved PR #${p.prNumber}`;
  },
  buildPayloadFields(p) {
    // Matches pr-review-submitted shape (reviewer / reviewUrl / reviewBody);
    // adds explicit reviewState: "approved" so adapter doesn't have to
    // special-case this intent to know the state. Cheap consistency.
    return {
      prNumber: p.prNumber,
      reviewer: p.reviewer,
      reviewState: "approved",
      reviewUrl: p.url,
      reviewBody: p.body,
    };
  },
};

async function handlePrReviewApproved(
  inbound: Message,
  ctx: IPolicyContext,
): Promise<MessageDispatch[]> {
  return synthesizePrNotification(inbound, ctx, PR_REVIEW_APPROVED_OPTS);
}

export const PR_REVIEW_APPROVED_HANDLER: RepoEventHandler = {
  subkind: "pr-review-approved",
  name: "pr_review_approved_bilateral",
  handle: handlePrReviewApproved,
};
