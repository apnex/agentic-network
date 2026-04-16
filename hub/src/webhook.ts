/**
 * Webhook client for notifying the Architect of Hub events.
 *
 * Fires HTTP POST to the Architect's /webhook/hub-event endpoint
 * when reports or proposals are submitted.
 *
 * Configuration:
 *   ARCHITECT_WEBHOOK_URL — full URL of the Architect's webhook endpoint
 *   HUB_API_TOKEN — Bearer token for authentication
 */

const ARCHITECT_WEBHOOK_URL = process.env.ARCHITECT_WEBHOOK_URL || "";
const HUB_API_TOKEN = process.env.HUB_API_TOKEN || "";

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Fire a webhook notification to the Architect.
 * Fire-and-forget with a single retry on failure.
 */
export async function fireWebhook(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!ARCHITECT_WEBHOOK_URL) {
    console.log(`[Webhook] No ARCHITECT_WEBHOOK_URL configured, skipping ${event}`);
    return;
  }

  const payload: WebhookEvent = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (HUB_API_TOKEN) {
    headers["Authorization"] = `Bearer ${HUB_API_TOKEN}`;
  }

  const attempt = async (): Promise<boolean> => {
    try {
      const response = await fetch(ARCHITECT_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        console.log(`[Webhook] ${event} sent successfully`);
        return true;
      } else {
        console.error(
          `[Webhook] ${event} failed: HTTP ${response.status} ${response.statusText}`
        );
        return false;
      }
    } catch (error) {
      console.error(`[Webhook] ${event} error:`, error instanceof Error ? error.message : error);
      return false;
    }
  };

  // Try once, retry once on failure
  const success = await attempt();
  if (!success) {
    console.log(`[Webhook] Retrying ${event}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await attempt();
  }
}
