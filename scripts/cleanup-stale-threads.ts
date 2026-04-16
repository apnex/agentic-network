#!/usr/bin/env npx tsx
/**
 * One-time cleanup script: close all historical converged threads.
 *
 * These threads converged during previous phases and have been acted upon,
 * but were never explicitly closed. This causes get_pending_actions to
 * accumulate 42+ stale items.
 *
 * Usage:
 *   npx tsx scripts/cleanup-stale-threads.ts
 *
 * Requires: MCP_HUB_URL and HUB_API_TOKEN environment variables
 * (or defaults to the production Hub with no auth).
 */

import { McpConnectionManager } from "../packages/network-adapter/src/mcp-connection.js";

const HUB_URL = process.env.MCP_HUB_URL || "https://mcp-relay-hub-5muxctm3ta-ts.a.run.app/mcp";
const HUB_TOKEN = process.env.HUB_API_TOKEN || "";

async function main() {
  console.log(`Connecting to Hub at ${HUB_URL}...`);

  const manager = new McpConnectionManager(
    { url: HUB_URL, token: HUB_TOKEN, role: "architect" },
    (msg) => console.log(`[Connection] ${msg}`)
  );

  await manager.connect();
  console.log("Connected.\n");

  // Get all threads
  const result = await manager.executeTool("list_threads", {}) as any;
  const threads = result?.threads || result;
  if (!Array.isArray(threads)) {
    console.log("Unexpected response from list_threads:", result);
    await manager.close();
    return;
  }

  // Find converged threads
  const converged = threads.filter((t: any) => t.status === "converged");
  console.log(`Found ${converged.length} converged threads out of ${threads.length} total.\n`);

  if (converged.length === 0) {
    console.log("No converged threads to close.");
    await manager.close();
    return;
  }

  // Close each one
  let closed = 0;
  let failed = 0;
  for (const thread of converged) {
    const id = thread.id || thread.threadId;
    const title = thread.title || "untitled";
    try {
      await manager.executeTool("close_thread", { threadId: id });
      console.log(`  ✓ Closed: ${id} — ${title}`);
      closed++;
    } catch (err) {
      console.log(`  ✗ Failed: ${id} — ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. Closed: ${closed}, Failed: ${failed}`);
  await manager.close();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
