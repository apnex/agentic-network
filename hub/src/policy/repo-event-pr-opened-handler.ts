/**
 * pr-opened handler — mission-76 W1 (bug-46 closure) + bug-50 fix.
 *
 * Per Design v1.0 §3.1 + §3.4 symmetric routing — closes the PR-opened
 * notification gap (engineer↔architect bilateral cross-approval surface).
 * Differs from commit-pushed AG-7 (engineer-cadence-discipline scope only;
 * not propagated to PR-events).
 *
 * Thin wrapper around `synthesizePrNotification` per §3.1 P1 DRY concur:
 * supplies subkind-specific opts (extractPayload reads `normalizePullRequest`
 * shape — translator emits `base`+`head` as `{ref, sha} | undefined` per
 * `extractRef`; bodyTemplate renders "Engineer/Architect opened PR #N: ${title}"
 * with trailing-colon dropped when title is empty per bug-50 Class B; intentValue
 * `pr-opened-notification` per §3.5 m1 fold).
 */

import type { Message } from "../entities/index.js";
import type { IPolicyContext } from "./types.js";
import type { MessageDispatch, RepoEventHandler } from "./repo-event-handlers.js";
import {
  synthesizePrNotification,
  extractRefField,
  type PrLifecyclePayload,
  type PrNotificationOpts,
} from "./repo-event-pr-handler-helpers.js";

const PR_OPENED_OPTS: PrNotificationOpts<PrLifecyclePayload> = {
  subkind: "pr-opened",
  intentValue: "pr-opened-notification",
  extractPayload(raw) {
    if (typeof raw.number !== "number") return null;
    return {
      author: typeof raw.author === "string" ? raw.author : "",
      number: raw.number,
      title: typeof raw.title === "string" ? raw.title : "",
      url: typeof raw.url === "string" ? raw.url : "",
      base: extractRefField(raw.base),
      head: extractRefField(raw.head),
    };
  },
  extractAuthorLogin(p) {
    return p.author || null;
  },
  bodyTemplate(authorRole, p) {
    const subject = authorRole === "engineer" ? "Engineer" : "Architect";
    // bug-50 Class B: drop trailing colon when title empty (Events API's
    // pr.title=null is the steady-state path — colon-as-marker no longer holds).
    return p.title
      ? `${subject} opened PR #${p.number}: ${p.title}`
      : `${subject} opened PR #${p.number}`;
  },
  buildPayloadFields(p) {
    return {
      prNumber: p.number,
      prTitle: p.title,
      prAuthor: p.author,
      prUrl: p.url,
      prBaseRef: p.base?.ref ?? "",
      prHeadRef: p.head?.ref ?? "",
    };
  },
};

async function handlePrOpened(
  inbound: Message,
  ctx: IPolicyContext,
): Promise<MessageDispatch[]> {
  return synthesizePrNotification(inbound, ctx, PR_OPENED_OPTS);
}

export const PR_OPENED_HANDLER: RepoEventHandler = {
  subkind: "pr-opened",
  name: "pr_opened_bilateral",
  handle: handlePrOpened,
};
