#!/usr/bin/env npx tsx
/**
 * Admin: drain pending notifications from stale engineerIds into a
 * target engineerId. For the M18 "laptop died, new globalInstanceId"
 * recovery path — Agents are append-only, so the old engineerId stays
 * but its queue must be migrated to the replacement Agent.
 *
 * Registers an ephemeral architect session (random globalInstanceId)
 * and invokes migrate_agent_queue once per source. Reads hub credentials
 * from .ois/hub-config.json or OIS_HUB_URL / OIS_HUB_TOKEN env vars.
 *
 * Usage:
 *   npx tsx scripts/migrate-agent-queue.ts <target> <source1> [source2 ...]
 */

import { McpAgentClient } from "../packages/network-adapter/src/index.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const [, , target, ...sources] = process.argv;
if (!target || sources.length === 0) {
  console.error("Usage: migrate-agent-queue.ts <target> <source1> [source2 ...]");
  process.exit(1);
}

const configPath = resolve(process.cwd(), ".ois", "hub-config.json");
if (!existsSync(configPath)) {
  console.error(`No config at ${configPath}`);
  process.exit(1);
}
const raw = JSON.parse(readFileSync(configPath, "utf-8"));
const hubUrl = process.env.OIS_HUB_URL || raw.hubUrl;
const hubToken = process.env.OIS_HUB_TOKEN || raw.hubToken;

async function main(): Promise<void> {
  const client = new McpAgentClient(
    {
      role: "architect",
      handshake: {
        globalInstanceId: `admin-${randomUUID()}`,
        proxyName: "admin-migrate",
        proxyVersion: "0.0.0",
        transport: "http",
        sdkVersion: "0.0.0",
        getClientInfo: () => ({ name: "admin-migrate", version: "0.0.0" }),
      },
      logger: () => {},
    },
    { transportConfig: { url: hubUrl, token: hubToken } },
  );
  client.setCallbacks({});
  await client.start();

  for (const source of sources) {
    try {
      const result = await client.call("migrate_agent_queue", {
        sourceEngineerId: source,
        targetEngineerId: target,
      });
      console.log(`${source} → ${target}:`, typeof result === "string" ? result : JSON.stringify(result));
    } catch (err) {
      console.error(`${source} failed:`, err instanceof Error ? err.message : err);
    }
  }

  await client.stop();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
