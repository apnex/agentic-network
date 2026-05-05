/**
 * pr-opened handler — mission-76 W1 (bug-46 closure).
 *
 * Per Design v1.0 §3.1 + §3.4 symmetric routing — closes the PR-opened
 * notification gap (engineer↔architect bilateral cross-approval surface).
 * Differs from commit-pushed AG-7 (engineer-cadence-discipline scope only;
 * not propagated to PR-events).
 *
 * Thin wrapper around `synthesizePrNotification` per §3.1 P1 DRY concur:
 * supplies subkind-specific opts (extractPayload reads
 * `normalizePullRequest` shape from translator.ts:182-198; bodyTemplate
 * renders "Engineer/Architect opened PR #N: ${title}"; intentValue
 * `pr-opened-notification` per §3.5 m1 fold).
 */

import type { Message } from "../entities/index.js";
import type { IPolicyContext } from "./types.js";
import type { MessageDispatch, RepoEventHandler } from "./repo-event-handlers.js";
import {
  synthesizePrNotification,
  type PrNotificationOpts,
} from "./repo-event-pr-handler-helpers.js";

interface PrOpenedPayload {
  /** GH login of the PR author (from `pull_request.user.login`). */
  author: string;
  number: number;
  title: string;
  url: string;
  base: string;
  head: string;
}

const PR_OPENED_OPTS: PrNotificationOpts<PrOpenedPayload> = {
  subkind: "pr-opened",
  intentValue: "pr-opened-notification",
  extractPayload(raw) {
    if (typeof raw.number !== "number") return null;
    return {
      author: typeof raw.author === "string" ? raw.author : "",
      number: raw.number,
      title: typeof raw.title === "string" ? raw.title : "",
      url: typeof raw.url === "string" ? raw.url : "",
      base: typeof raw.base === "string" ? raw.base : "",
      head: typeof raw.head === "string" ? raw.head : "",
    };
  },
  extractAuthorLogin(p) {
    return p.author || null;
  },
  bodyTemplate(authorRole, p) {
    const subject = authorRole === "engineer" ? "Engineer" : "Architect";
    return `${subject} opened PR #${p.number}: ${p.title}`;
  },
  buildPayloadFields(p) {
    return {
      prNumber: p.number,
      prTitle: p.title,
      prAuthor: p.author,
      prUrl: p.url,
      prBaseRef: p.base,
      prHeadRef: p.head,
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
