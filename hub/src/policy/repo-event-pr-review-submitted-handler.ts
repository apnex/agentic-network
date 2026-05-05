/**
 * pr-review-submitted handler — mission-76 W1 (bug-46 closure).
 *
 * Per Design v1.0 §3.1 + §3.4 symmetric routing — closes the PR-review
 * notification gap (engineer↔architect bilateral cross-approval surface).
 * Reviews this subkind handles: `commented` + `changes_requested` +
 * any other submitted state EXCEPT `approved` (which is dispatched to
 * the carved-out `pr-review-approved` subkind per
 * `dispatchPullRequestReview` at translator.ts:170-179). Approved
 * reviews follow naturally via pr-merged downstream; potentially
 * redundant with this handler reading review state per §3.1.1 carve-out
 * rationale for pr-review-approved.
 *
 * Thin wrapper around `synthesizePrNotification` per §3.1 P1 DRY concur:
 * uses `normalizePullRequestReview` shape (translator.ts:200-216) where
 * the GH login is at `payload.reviewer` (NOT `payload.author`).
 * intentValue `pr-review-notification` per §3.5 m1 fold (covers all
 * review states emitted by this subkind).
 */

import type { Message } from "../entities/index.js";
import type { IPolicyContext } from "./types.js";
import type { MessageDispatch, RepoEventHandler } from "./repo-event-handlers.js";
import {
  synthesizePrNotification,
  type PrNotificationOpts,
} from "./repo-event-pr-handler-helpers.js";

interface PrReviewSubmittedPayload {
  /** GH login of the reviewer (from `review.user.login`). */
  reviewer: string;
  prNumber: number;
  state: string;
  url: string;
  body: string;
}

const PR_REVIEW_SUBMITTED_OPTS: PrNotificationOpts<PrReviewSubmittedPayload> = {
  subkind: "pr-review-submitted",
  intentValue: "pr-review-notification",
  extractPayload(raw) {
    if (typeof raw.prNumber !== "number") return null;
    return {
      reviewer: typeof raw.reviewer === "string" ? raw.reviewer : "",
      prNumber: raw.prNumber,
      state: typeof raw.state === "string" ? raw.state : "",
      url: typeof raw.url === "string" ? raw.url : "",
      body: typeof raw.body === "string" ? raw.body : "",
    };
  },
  extractAuthorLogin(p) {
    return p.reviewer || null;
  },
  bodyTemplate(authorRole, p) {
    const subject = authorRole === "engineer" ? "Engineer" : "Architect";
    const stateClause = p.state ? ` (${p.state})` : "";
    return `${subject} reviewed PR #${p.prNumber}${stateClause}`;
  },
  buildPayloadFields(p) {
    return {
      prNumber: p.prNumber,
      reviewer: p.reviewer,
      reviewState: p.state,
      reviewUrl: p.url,
      reviewBody: p.body,
    };
  },
};

async function handlePrReviewSubmitted(
  inbound: Message,
  ctx: IPolicyContext,
): Promise<MessageDispatch[]> {
  return synthesizePrNotification(inbound, ctx, PR_REVIEW_SUBMITTED_OPTS);
}

export const PR_REVIEW_SUBMITTED_HANDLER: RepoEventHandler = {
  subkind: "pr-review-submitted",
  name: "pr_review_submitted_bilateral",
  handle: handlePrReviewSubmitted,
};
