import { TestHub } from "./test/helpers/test-hub.js";
import { McpTransport } from "./src/mcp-transport.js";
import { LogCapture, wait, waitFor } from "./test/helpers/test-utils.js";

async function test() {
  const hub = new TestHub({
    sessionTtl: 30_000,
    orphanTtl: 10_000,
    autoStartTimers: false,
  });
  await hub.start();
  
  const log = new LogCapture();
  const t = new McpTransport({
    url: hub.url,
    token: "",
    heartbeatInterval: 2_000,
    reconnectDelay: 500,
    sseKeepaliveTimeout: 3_000,
    firstKeepaliveDeadline: 2_000,
    sseWatchdogInterval: 1_000,
    logger: log.logger,
  });

  const pushes = [];
  t.onWireEvent((e) => {
    console.log("[TEST] WireEvent:", e.type, e);
    if (e.type === "push") pushes.push(e);
  });

  try {
    console.log("[TEST] Connecting transport...");
    await t.connect();
    console.log("[TEST] Transport connected, sessionId:", t.getSessionId());

    console.log("[TEST] Registering role...");
    const roleResult = await t.request("register_role", { role: "engineer" });
    console.log("[TEST] Role registration result:", roleResult);

    const sessionInfo = await hub.getSessionInfo();
    console.log("[TEST] Hub session info after role register:", JSON.stringify(sessionInfo, null, 2));

    console.log("[TEST] Waiting 200ms...");
    await wait(200);

    console.log("[TEST] Sending notification...");
    await hub.sendNotification(
      "task_assigned",
      { taskId: "t-1", title: "test" },
      ["engineer"]
    );

    console.log("[TEST] Waiting for pushes (5s timeout)...");
    try {
      await waitFor(() => pushes.length >= 1, 5_000);
      console.log("[TEST] SUCCESS: Got push event");
    } catch (err) {
      console.log("[TEST] FAILED: No push event received");
      console.log("[TEST] Pushes array:", pushes);
      console.log("[TEST] Logs:", log.messages);
    }
  } finally {
    await t.close();
    await hub.stop();
  }
}

test().catch(console.error);
