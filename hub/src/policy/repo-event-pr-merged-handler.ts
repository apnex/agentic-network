/**
 * pr-merged handler — mission-76 W1 (bug-46 closure).
 *
 * Per Design v1.0 §3.1 + §3.4 symmetric routing — closes the PR-merged
 * notification gap. Bilateral (engineer-merges → architect; architect-
 * merges → engineer); differs from commit-pushed AG-7. Distinct from
 * pr-closed (which is carved out per §3.1.1 + AG-2 — author-abandon-or-
 * decline; low peer-coord signal value).
 *
 * Thin wrapper around `synthesizePrNotification` per §3.1 P1 DRY concur:
 * shares pr-opened's `normalizePullRequest` payload shape (translator
 * routes both pr-opened + pr-merged through the same normalizer at
 * translator.ts:182-198); intentValue `pr-merged-notification` per
 * §3.5 m1 fold.
 */

import type { Message } from "../entities/index.js";
import type { IPolicyContext } from "./types.js";
import type { MessageDispatch, RepoEventHandler } from "./repo-event-handlers.js";
import {
  synthesizePrNotification,
  type PrNotificationOpts,
} from "./repo-event-pr-handler-helpers.js";

interface PrMergedPayload {
  /** GH login of the PR author (NOT necessarily the merger; per
   *  `normalizePullRequest`, this is `pull_request.user.login`). */
  author: string;
  number: number;
  title: string;
  url: string;
  base: string;
  head: string;
}

const PR_MERGED_OPTS: PrNotificationOpts<PrMergedPayload> = {
  subkind: "pr-merged",
  intentValue: "pr-merged-notification",
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
    return `${subject} merged PR #${p.number}: ${p.title}`;
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

async function handlePrMerged(
  inbound: Message,
  ctx: IPolicyContext,
): Promise<MessageDispatch[]> {
  return synthesizePrNotification(inbound, ctx, PR_MERGED_OPTS);
}

export const PR_MERGED_HANDLER: RepoEventHandler = {
  subkind: "pr-merged",
  name: "pr_merged_bilateral",
  handle: handlePrMerged,
};
