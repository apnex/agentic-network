#!/usr/bin/env npx tsx
/**
 * One-shot GCS backfill: populate `createdBy: EntityProvenance` on every
 * entity JSON that lacks it (Mission-24 idea-120 / task-305 C4).
 *
 * Phased ordering per thread-226 architect guidance:
 *   1. Check `createdBy` already present → skip (IDEMPOTENT)
 *   2. Infer from legacy field present in raw JSON:
 *        - Idea.author (string) — role if recognized, else agentId if eng-*, else treat as role
 *        - Thread.initiatedBy (ThreadAuthor) — role string; resolve agentId from participants[]
 *   3. Fall back to audit log — scan `audit/` for `thread_create_*` +
 *      parallel direct-create actions matching entity id; use actor role
 *      + placeholder agentId
 *   4. Last resort: `{role: "unknown", agentId: "legacy-pre-provenance"}`
 *      (architect-ratified thread-225 placeholder; avoids null-gap)
 *
 * Modes:
 *   --dry-run        log what would change; no writes (default)
 *   --apply          execute writes
 *   --only <type>    restrict to one entity prefix (tasks|proposals|threads|
 *                    ideas|missions|turns|tele|bugs|pending-actions|
 *                    director-notifications)
 *   --verify         after migration, sample 5% of migrated entities and
 *                    report any where audit-log actor disagrees with
 *                    stored createdBy.role (diagnostic only — doesn't fail)
 *   --bucket <name>  GCS bucket (default: ois-relay-hub-state)
 *
 * Usage:
 *   npx tsx scripts/backfill-created-by.ts                    # dry-run
 *   npx tsx scripts/backfill-created-by.ts --apply            # live
 *   npx tsx scripts/backfill-created-by.ts --apply --verify   # live + sample check
 *   npx tsx scripts/backfill-created-by.ts --only ideas --apply
 *
 * Concurrent-write safety: every write uses the Hub's OCC helper
 * (readJsonWithGeneration + writeJsonWithPrecondition), so if a live
 * Hub writer races this script the backfill retries transparently and
 * the live write wins (which will already contain createdBy if
 * post-task-305 code wrote it).
 *
 * Auth: uses @google-cloud/storage default credentials. Must be run
 * from a shell where either `gcloud auth application-default login`
 * is current OR `GOOGLE_APPLICATION_CREDENTIALS` points at a service-
 * account key with `storage.objects.{list,get,create,delete}` on the
 * Hub's bucket.
 */

import {
  readJsonWithGeneration,
  writeJsonWithPrecondition,
  listFiles,
  readJson,
  GcsOccPreconditionFailed,
} from "../hub/src/gcs-state.js";
import type { EntityProvenance } from "../hub/src/state.js";

// ── Types ───────────────────────────────────────────────────────────

interface AuditEntryShape {
  actor: "architect" | "engineer" | "hub";
  action: string;
  relatedEntity?: string;
  timestamp?: string;
}

interface EntityDescriptor {
  prefix: string;                                  // GCS prefix (e.g., "ideas/")
  label: string;                                   // human label for logs
  excludeSubpaths?: boolean;                       // skip nested paths (e.g., threads/<id>/messages/<seq>.json)
  legacyRoleFields?: readonly string[];            // fields to consider for legacy inference (e.g., ["author"], ["initiatedBy"])
  legacyResolver?: (raw: Record<string, unknown>) => EntityProvenance | null;
  auditActionPrefixes?: readonly string[];         // audit-log action names signaling creation (e.g., ["thread_create_idea"])
}

// ── Descriptors for every entity type ────────────────────────────────

const PLACEHOLDER: EntityProvenance = { role: "unknown", agentId: "legacy-pre-provenance" };

const IDEA_DESCRIPTOR: EntityDescriptor = {
  prefix: "ideas/",
  label: "Idea",
  legacyRoleFields: ["author"],
  legacyResolver: (raw) => {
    const author = raw.author;
    if (typeof author !== "string" || author.length === 0) return null;
    if (author.startsWith("eng-")) return { role: "unknown", agentId: author };
    return { role: author, agentId: `anonymous-${author}` };
  },
  auditActionPrefixes: ["thread_create_idea"],
};

const THREAD_DESCRIPTOR: EntityDescriptor = {
  prefix: "threads/",
  label: "Thread",
  excludeSubpaths: true,
  legacyRoleFields: ["initiatedBy"],
  legacyResolver: (raw) => {
    const initiatedBy = raw.initiatedBy;
    if (typeof initiatedBy !== "string" || initiatedBy.length === 0) return null;
    // Try to recover agentId from participants[] — first participant whose role matches.
    const participants = Array.isArray(raw.participants) ? raw.participants : [];
    const opener = participants.find((p) => p && typeof p === "object" && (p as { role?: string }).role === initiatedBy) as { agentId?: string } | undefined;
    return {
      role: initiatedBy,
      agentId: opener?.agentId ?? `anonymous-${initiatedBy}`,
    };
  },
  // Threads are created via create_thread (direct) or opened implicitly;
  // no single audit action covers all paths — legacy resolver + placeholder
  // is the reliable recovery here.
};

const TASK_DESCRIPTOR: EntityDescriptor = {
  prefix: "tasks/",
  label: "Task",
  auditActionPrefixes: ["task_issued", "thread_create_task", "directive_issued"],
};

const PROPOSAL_DESCRIPTOR: EntityDescriptor = {
  prefix: "proposals/",
  label: "Proposal",
  excludeSubpaths: true, // skip proposal .md companions (we only own .json)
  auditActionPrefixes: ["thread_create_proposal", "proposal_submitted"],
};

const MISSION_DESCRIPTOR: EntityDescriptor = {
  prefix: "missions/",
  label: "Mission",
  auditActionPrefixes: ["thread_propose_mission", "mission_created"],
};

const TURN_DESCRIPTOR: EntityDescriptor = { prefix: "turns/", label: "Turn", auditActionPrefixes: ["turn_created"] };
const TELE_DESCRIPTOR: EntityDescriptor = { prefix: "tele/", label: "Tele", auditActionPrefixes: ["tele_defined"] };
const BUG_DESCRIPTOR: EntityDescriptor = { prefix: "bugs/", label: "Bug", auditActionPrefixes: ["thread_create_bug", "bug_reported"] };
const PENDING_ACTION_DESCRIPTOR: EntityDescriptor = { prefix: "pending-actions/", label: "PendingActionItem" };
const DIRECTOR_NOTIFICATION_DESCRIPTOR: EntityDescriptor = { prefix: "director-notifications/", label: "DirectorNotification" };

const ENTITY_DESCRIPTORS: Record<string, EntityDescriptor> = {
  ideas: IDEA_DESCRIPTOR,
  threads: THREAD_DESCRIPTOR,
  tasks: TASK_DESCRIPTOR,
  proposals: PROPOSAL_DESCRIPTOR,
  missions: MISSION_DESCRIPTOR,
  turns: TURN_DESCRIPTOR,
  tele: TELE_DESCRIPTOR,
  bugs: BUG_DESCRIPTOR,
  "pending-actions": PENDING_ACTION_DESCRIPTOR,
  "director-notifications": DIRECTOR_NOTIFICATION_DESCRIPTOR,
};

// ── Audit-log lookup table ──────────────────────────────────────────

/** Build an entity-id → {role, action, timestamp} map from the audit store. */
async function buildAuditIndex(bucket: string): Promise<Map<string, AuditEntryShape>> {
  console.log(`[backfill] Indexing audit log from gs://${bucket}/audit/ ...`);
  const files = await listFiles(bucket, "audit/");
  const index = new Map<string, AuditEntryShape>();
  let count = 0;
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const entry = await readJson<AuditEntryShape>(bucket, file);
    if (!entry || !entry.relatedEntity) continue;
    // Prefer the earliest audit entry per entity (first create wins).
    const existing = index.get(entry.relatedEntity);
    if (!existing || (entry.timestamp && existing.timestamp && entry.timestamp < existing.timestamp)) {
      index.set(entry.relatedEntity, entry);
    }
    count++;
  }
  console.log(`[backfill]   audit entries scanned: ${count}; unique related entities: ${index.size}`);
  return index;
}

function resolveFromAudit(entityId: string, auditIndex: Map<string, AuditEntryShape>, prefixes: readonly string[] | undefined): EntityProvenance | null {
  const entry = auditIndex.get(entityId);
  if (!entry) return null;
  if (prefixes && prefixes.length > 0 && !prefixes.some((p) => entry.action.startsWith(p))) return null;
  // Audit actor is architect|engineer|hub — carries role, not agentId.
  return { role: entry.actor, agentId: `anonymous-${entry.actor}` };
}

// ── Per-entity migration ────────────────────────────────────────────

interface MigrationStats {
  scanned: number;
  alreadyMigrated: number;
  migratedFromLegacy: number;
  migratedFromAudit: number;
  migratedFromPlaceholder: number;
  occRetries: number;
  errors: number;
}

async function migrateEntity(
  bucket: string,
  descriptor: EntityDescriptor,
  auditIndex: Map<string, AuditEntryShape>,
  dryRun: boolean,
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    scanned: 0,
    alreadyMigrated: 0,
    migratedFromLegacy: 0,
    migratedFromAudit: 0,
    migratedFromPlaceholder: 0,
    occRetries: 0,
    errors: 0,
  };

  const files = await listFiles(bucket, descriptor.prefix);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    if (descriptor.excludeSubpaths && file.slice(descriptor.prefix.length).includes("/")) continue;
    stats.scanned++;

    let attempts = 0;
    // Small retry loop for OCC races with live writers.
    while (attempts < 3) {
      attempts++;
      try {
        const read = await readJsonWithGeneration<Record<string, unknown>>(bucket, file);
        if (!read) break;
        const { data: entity, generation } = read;
        if (entity.createdBy && typeof entity.createdBy === "object") {
          stats.alreadyMigrated++;
          break;
        }

        let resolved: EntityProvenance | null = null;
        let source: "legacy" | "audit" | "placeholder" = "placeholder";
        if (descriptor.legacyResolver) {
          resolved = descriptor.legacyResolver(entity);
          if (resolved) source = "legacy";
        }
        if (!resolved) {
          const id = entity.id as string | undefined;
          if (id) {
            const fromAudit = resolveFromAudit(id, auditIndex, descriptor.auditActionPrefixes);
            if (fromAudit) {
              resolved = fromAudit;
              source = "audit";
            }
          }
        }
        if (!resolved) {
          resolved = PLACEHOLDER;
          source = "placeholder";
        }

        const upgraded = { ...entity, createdBy: resolved };

        if (dryRun) {
          console.log(`[backfill] DRY-RUN ${descriptor.label} ${entity.id ?? file}: would set createdBy from ${source} → ${JSON.stringify(resolved)}`);
        } else {
          await writeJsonWithPrecondition(bucket, file, upgraded, generation);
          console.log(`[backfill]          ${descriptor.label} ${entity.id ?? file}: createdBy set from ${source} → ${JSON.stringify(resolved)}`);
        }

        if (source === "legacy") stats.migratedFromLegacy++;
        else if (source === "audit") stats.migratedFromAudit++;
        else stats.migratedFromPlaceholder++;
        break;
      } catch (err) {
        if (err instanceof GcsOccPreconditionFailed) {
          stats.occRetries++;
          continue; // retry
        }
        console.error(`[backfill] ERROR on ${file}:`, err);
        stats.errors++;
        break;
      }
    }
  }

  return stats;
}

// ── Verify mode (architect recommendation §3) ───────────────────────

async function verifySample(
  bucket: string,
  descriptor: EntityDescriptor,
  auditIndex: Map<string, AuditEntryShape>,
): Promise<void> {
  const files = (await listFiles(bucket, descriptor.prefix)).filter((f) => f.endsWith(".json"));
  const sample: string[] = [];
  const targetSize = Math.max(1, Math.floor(files.length * 0.05));
  const pool = [...files];
  for (let i = 0; i < targetSize && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    sample.push(pool.splice(idx, 1)[0]);
  }

  console.log(`[verify] ${descriptor.label}: sampling ${sample.length}/${files.length} entities ...`);
  let matches = 0;
  let mismatches = 0;
  let unverifiable = 0;
  for (const file of sample) {
    const entity = await readJson<Record<string, unknown>>(bucket, file);
    if (!entity || !entity.createdBy) { unverifiable++; continue; }
    const id = entity.id as string | undefined;
    if (!id) { unverifiable++; continue; }
    const fromAudit = resolveFromAudit(id, auditIndex, descriptor.auditActionPrefixes);
    if (!fromAudit) { unverifiable++; continue; }
    const storedRole = (entity.createdBy as EntityProvenance).role;
    if (storedRole === fromAudit.role) matches++;
    else {
      mismatches++;
      console.log(`[verify]   MISMATCH on ${id}: stored=${storedRole} audit=${fromAudit.role}`);
    }
  }
  console.log(`[verify] ${descriptor.label}: matches=${matches} mismatches=${mismatches} unverifiable=${unverifiable}`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = !argv.includes("--apply");
  const verify = argv.includes("--verify");
  const onlyIdx = argv.indexOf("--only");
  const onlyType = onlyIdx !== -1 ? argv[onlyIdx + 1] : null;
  const bucketIdx = argv.indexOf("--bucket");
  const bucket = bucketIdx !== -1 ? argv[bucketIdx + 1] : (process.env.GCS_BUCKET || "ois-relay-hub-state");

  console.log(`[backfill] bucket=${bucket} mode=${dryRun ? "DRY-RUN" : "APPLY"} verify=${verify} only=${onlyType ?? "all"}`);

  const auditIndex = await buildAuditIndex(bucket);

  const types = onlyType ? [onlyType] : Object.keys(ENTITY_DESCRIPTORS);
  const totals: MigrationStats = {
    scanned: 0, alreadyMigrated: 0, migratedFromLegacy: 0, migratedFromAudit: 0,
    migratedFromPlaceholder: 0, occRetries: 0, errors: 0,
  };
  for (const t of types) {
    const desc = ENTITY_DESCRIPTORS[t];
    if (!desc) { console.error(`[backfill] unknown entity type: ${t}`); process.exit(2); }
    console.log(`\n[backfill] === ${desc.label} (${desc.prefix}) ===`);
    const s = await migrateEntity(bucket, desc, auditIndex, dryRun);
    console.log(`[backfill] ${desc.label}: scanned=${s.scanned} alreadyMigrated=${s.alreadyMigrated} fromLegacy=${s.migratedFromLegacy} fromAudit=${s.migratedFromAudit} fromPlaceholder=${s.migratedFromPlaceholder} occRetries=${s.occRetries} errors=${s.errors}`);
    totals.scanned += s.scanned;
    totals.alreadyMigrated += s.alreadyMigrated;
    totals.migratedFromLegacy += s.migratedFromLegacy;
    totals.migratedFromAudit += s.migratedFromAudit;
    totals.migratedFromPlaceholder += s.migratedFromPlaceholder;
    totals.occRetries += s.occRetries;
    totals.errors += s.errors;

    if (verify && !dryRun) await verifySample(bucket, desc, auditIndex);
  }

  console.log(`\n[backfill] TOTALS: scanned=${totals.scanned} alreadyMigrated=${totals.alreadyMigrated} fromLegacy=${totals.migratedFromLegacy} fromAudit=${totals.migratedFromAudit} fromPlaceholder=${totals.migratedFromPlaceholder} occRetries=${totals.occRetries} errors=${totals.errors}`);
  if (dryRun) console.log(`[backfill] DRY-RUN — no writes performed. Re-run with --apply to execute.`);
  if (totals.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[backfill] FATAL:", err);
  process.exit(1);
});
