/**
 * Audit Policy — Append-only audit log.
 *
 * Tools: create_audit_entry, list_audit_entries
 * No FSM — entries are immutable once created.
 */

import { z } from "zod";
import type { PolicyRouter } from "./router.js";
import type { IPolicyContext, PolicyResult } from "./types.js";

// ── Handlers ────────────────────────────────────────────────────────

async function createAuditEntry(args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
  const action = args.action as string;
  const details = args.details as string;
  const relatedEntity = args.relatedEntity as string | undefined;

  // Derive actor from session role — not hardcoded
  const role = ctx.stores.engineerRegistry.getRole(ctx.sessionId);
  const actor = (role === "engineer" || role === "architect") ? role : "architect";
  const entry = await ctx.stores.audit.logEntry(actor, action, details, relatedEntity);
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        success: true,
        auditId: entry.id,
        timestamp: entry.timestamp,
      }),
    }],
  };
}

async function listAuditEntries(args: Record<string, unknown>, ctx: IPolicyContext): Promise<PolicyResult> {
  const limit = (args.limit as number) || 50;
  const actor = args.actor as string | undefined;

  const entries = await ctx.stores.audit.listEntries(limit, actor as "architect" | "engineer" | "hub" | undefined);
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ entries, count: entries.length }, null, 2),
    }],
  };
}

// ── Registration ────────────────────────────────────────────────────

export function registerAuditPolicy(router: PolicyRouter): void {
  router.register(
    "create_audit_entry",
    "[Architect] Log an audit entry recording an autonomous action taken by the Architect. Persisted in GCS for Director oversight. Every autonomous decision should be audited.",
    {
      action: z.string().describe("Short action name (e.g., 'auto_review', 'auto_clarification', 'directive_issued')"),
      details: z.string().describe("Description of what was done and why"),
      relatedEntity: z.string().optional().describe("Related entity ID (e.g., 'task-24', 'prop-7', 'thread-3')"),
    },
    createAuditEntry,
  );

  router.register(
    "list_audit_entries",
    "[Any] List recent audit entries for Director review. Returns the most recent entries first. Supports filtering by actor.",
    {
      limit: z.number().optional().describe("Maximum number of entries to return (default: 50)"),
      actor: z.enum(["architect", "engineer", "hub"]).optional().describe("Filter by actor (optional)"),
    },
    listAuditEntries,
  );
}
