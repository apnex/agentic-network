#!/usr/bin/env bash
#
# scripts/local/start-hub.sh — Launch the local Hub container against a
# selected env. Container name encodes the env (mission-46 T1):
# ois-hub-local-<env>.
#
# Idempotent: if ANY ois-hub-local-* container exists, it's stopped and
# removed before relaunching this env's. One hub at a time (per mission-46
# decision); env switching is stop-prior-start-new.
#
# Container config (env, ports, mount, seccomp) is the single source of
# truth here — constants at the top. Token + bucket come from the env's
# tfvars (gitignored). SA key path is auto-discovered.
#
# Usage:
#   OIS_ENV=<env> scripts/local/start-hub.sh
#   scripts/local/start-hub.sh                 # OIS_ENV defaults to prod
#
# Env selection (mission-46 T1):
#   OIS_ENV    — selects which tfvars file to read + container name
#                suffix. Default: prod.
#                Must match ^[a-z][a-z0-9-]*$, max 20 chars.
#   HUB_HOST_PORT — default: 8080
#   GOOGLE_APPLICATION_CREDENTIALS — path to SA JSON; auto-discovered if unset
#
# tfvars discovery order (first existing wins for OIS_ENV=<env>):
#   1. deploy/cloudrun/env/<env>.tfvars   (split-structure target)
#   2. deploy/env/<env>.tfvars            (local-bootstrap; transitional)
#
# Reads from tfvars: hub_api_token (required), state_bucket_name
# (optional; falls back to ois-relay-hub-state for backward-compat with
# single-env operators), project_id (for SA key auto-discovery hint).
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ── Env selection + validation (mission-46 T1) ─────────────────────────

OIS_ENV="${OIS_ENV:-prod}"
if [[ ! "$OIS_ENV" =~ ^[a-z][a-z0-9-]*$ ]] || [[ ${#OIS_ENV} -gt 20 ]]; then
  echo "[start-hub] ERROR: invalid OIS_ENV='$OIS_ENV' — must match ^[a-z][a-z0-9-]*$, max 20 chars." >&2
  exit 1
fi

# ── tfvars discovery ───────────────────────────────────────────────────

TFVARS=""
for candidate in \
  "$REPO_ROOT/deploy/cloudrun/env/${OIS_ENV}.tfvars" \
  "$REPO_ROOT/deploy/env/${OIS_ENV}.tfvars"; do
  if [[ -f "$candidate" ]]; then
    TFVARS="$candidate"
    break
  fi
done

if [[ -z "$TFVARS" ]]; then
  echo "[start-hub] ERROR: no tfvars found for OIS_ENV='$OIS_ENV'." >&2
  echo "              Expected one of:" >&2
  echo "                deploy/cloudrun/env/${OIS_ENV}.tfvars" >&2
  echo "                deploy/env/${OIS_ENV}.tfvars" >&2
  echo "              Copy from deploy/cloudrun/env/prod.tfvars.example and populate." >&2
  exit 1
fi

read_tfvar() {
  awk -v key="$1" '
    $1 == key && $2 == "=" {
      val = $0
      sub(/^[^=]*=[ \t]*"/, "", val)
      sub(/"[ \t]*$/, "", val)
      print val
      exit
    }
  ' "$TFVARS"
}

# ── Container constants (env-tagged for side-by-side clarity) ──────────

CONTAINER_NAME="ois-hub-local-${OIS_ENV}"
IMAGE="ois-hub:local"
HOST_PORT="${HUB_HOST_PORT:-8080}"
CONTAINER_PORT="8080"

# Hub-side env defaults (non-secret)
GCS_BUCKET="$(read_tfvar state_bucket_name)"
GCS_BUCKET="${GCS_BUCKET:-ois-relay-hub-state}"
STORAGE_BACKEND="gcs"
WATCHDOG_ENABLED="false"   # ADR-017 watchdog paused locally; queue still operational
NODE_ENV="production"
PROJECT_ID="$(read_tfvar project_id)"

# ── Read tfvars for the secret ─────────────────────────────────────────

HUB_API_TOKEN="$(read_tfvar hub_api_token)"
if [[ -z "$HUB_API_TOKEN" || "$HUB_API_TOKEN" == "your-secret-token-here" ]]; then
  echo "[start-hub] ERROR: hub_api_token not populated in $TFVARS." >&2
  exit 1
fi

# ── SA key auto-discovery ──────────────────────────────────────────────
#
# Search order (first hit wins):
#   1. $REPO_ROOT/<project-id>.json   (worktree-local; per-env key)
#   2. $REPO_ROOT/labops-389703.json  (legacy single-env hardcode — preserved for prod back-compat)
#   3. parent/<project-id>.json       (canonical sibling)
#   4. parent/agentic-network/<project-id>.json
#   5. parent/labops-389703.json      (legacy)
# A new env's operator drops their <project-id>.json into the worktree or parent; prod
# continues working via the labops-389703.json path until rotated.

if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  PARENT="$(cd "$REPO_ROOT/.." && pwd)"
  CANDIDATES=()
  if [[ -n "$PROJECT_ID" ]]; then
    CANDIDATES+=("$REPO_ROOT/${PROJECT_ID}.json")
    CANDIDATES+=("$PARENT/${PROJECT_ID}.json")
    CANDIDATES+=("$PARENT/agentic-network/${PROJECT_ID}.json")
  fi
  # Legacy fallbacks (preserve prod back-compat for engineers who haven't renamed their key)
  CANDIDATES+=("$REPO_ROOT/labops-389703.json")
  CANDIDATES+=("$PARENT/agentic-network/labops-389703.json")
  CANDIDATES+=("$PARENT/labops-389703.json")
  for candidate in "${CANDIDATES[@]}"; do
    if [[ -f "$candidate" ]]; then
      GOOGLE_APPLICATION_CREDENTIALS="$candidate"
      break
    fi
  done
fi

if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" || ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]]; then
  echo "[start-hub] ERROR: SA key not found. Set GOOGLE_APPLICATION_CREDENTIALS explicitly" >&2
  echo "              or place <project-id>.json (e.g. ${PROJECT_ID:-<project>}.json) in" >&2
  echo "              $REPO_ROOT, its parent, or the canonical agentic-network/ sibling." >&2
  exit 1
fi

# ── Image presence check ───────────────────────────────────────────────

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "[start-hub] ERROR: Image '$IMAGE' not found locally." >&2
  echo "              Run: OIS_ENV=$OIS_ENV scripts/local/build-hub.sh" >&2
  exit 1
fi

# ── One-hub-at-a-time enforcement ──────────────────────────────────────
#
# Policy (mission-46 T1 Decision: option B + one-at-a-time): only one
# ois-hub-local-* container may run at a time. If a different-env
# container is running, we stop it before starting the requested one.

RUNNING_HUBS=$(docker ps -a -q --filter "name=^/ois-hub-local" || true)
if [[ -n "$RUNNING_HUBS" ]]; then
  for cid in $RUNNING_HUBS; do
    existing_name=$(docker inspect --format '{{.Name}}' "$cid" 2>/dev/null | sed 's|^/||')
    echo "[start-hub] Removing existing $existing_name ..."
    docker rm -f "$cid" >/dev/null
  done
fi

# ── Port collision check (non-Docker processes only) ───────────────────

if ss -ltn "( sport = :$HOST_PORT )" 2>/dev/null | tail -n +2 | grep -q .; then
  echo "[start-hub] ERROR: Port $HOST_PORT already in use by a non-Docker process." >&2
  ss -ltnp "( sport = :$HOST_PORT )" 2>/dev/null | tail -n +2 >&2 || true
  exit 1
fi

# ── Launch ─────────────────────────────────────────────────────────────

echo "[start-hub] OIS_ENV:      $OIS_ENV"
echo "[start-hub] Image:        $IMAGE"
echo "[start-hub] Container:    $CONTAINER_NAME"
echo "[start-hub] Port:         ${HOST_PORT}:${CONTAINER_PORT}"
echo "[start-hub] GCS bucket:   $GCS_BUCKET"
echo "[start-hub] SA key:       $GOOGLE_APPLICATION_CREDENTIALS"
echo "[start-hub] Watchdog:     $WATCHDOG_ENABLED"

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -e "NODE_ENV=$NODE_ENV" \
  -e "PORT=$CONTAINER_PORT" \
  -e "GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa-key.json" \
  -e "GCS_BUCKET=$GCS_BUCKET" \
  -e "STORAGE_BACKEND=$STORAGE_BACKEND" \
  -e "HUB_API_TOKEN=$HUB_API_TOKEN" \
  -e "WATCHDOG_ENABLED=$WATCHDOG_ENABLED" \
  -v "$GOOGLE_APPLICATION_CREDENTIALS:/secrets/sa-key.json:ro" \
  --security-opt seccomp=unconfined \
  "$IMAGE" >/dev/null

# ── Health check ───────────────────────────────────────────────────────

echo "[start-hub] Waiting for health ..."
HEALTH_URL="http://localhost:${HOST_PORT}/health"
DEADLINE=$(( $(date +%s) + 30 ))
while (( $(date +%s) < DEADLINE )); do
  if curl -sf -o /dev/null "$HEALTH_URL" 2>/dev/null; then
    BODY=$(curl -s "$HEALTH_URL")
    echo "[start-hub] Healthy: $BODY"
    echo "[start-hub] Hub up at $HEALTH_URL (env=$OIS_ENV)"
    exit 0
  fi
  sleep 1
done

echo "[start-hub] ERROR: Hub failed to become healthy within 30s." >&2
echo "[start-hub] Last 30 log lines:" >&2
docker logs --tail 30 "$CONTAINER_NAME" >&2 || true
exit 1
