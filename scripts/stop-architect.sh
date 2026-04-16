#!/usr/bin/env bash
#
# stop-architect.sh — Take the Architect agent offline.
#
# Sets min-instances=0 and routes 0% traffic to the latest revision,
# so no new requests are accepted and the container scales down.
# The SSE stream will close on container shutdown, and the Hub will
# mark the agent offline via session cleanup.
#

set -euo pipefail

SERVICE="architect-agent"
REGION="${GCP_REGION:-australia-southeast1}"

# Get current revision to route 0% traffic
REVISION=$(gcloud run services describe "$SERVICE" \
  --region "$REGION" \
  --format="value(status.traffic[0].revisionName)" 2>/dev/null)

if [ -z "$REVISION" ]; then
  echo "[stop] Could not determine active revision — service may already be stopped."
  exit 0
fi

echo "[stop] Draining traffic from ${REVISION} ..."
gcloud run services update-traffic "$SERVICE" \
  --to-revisions "${REVISION}=0" \
  --region "$REGION" \
  --quiet 2>/dev/null || echo "[stop] Traffic drain skipped (may already be at 0%)"

echo "[stop] Setting ${SERVICE} min-instances=0 ..."
gcloud run services update "$SERVICE" \
  --min-instances 0 \
  --region "$REGION" \
  --quiet

echo "[stop] Architect is offline. Container will scale down when idle."
echo "[stop] To bring it back: ./scripts/start-architect.sh"
