#!/usr/bin/env bash
#
# deploy/deploy-architect.sh — Roll the Cloud Run architect-<env> service
# to a specified image revision. Pairs with deploy/build-architect.sh
# (which pushes the image to Artifact Registry). Does NOT rebuild — runs
# `gcloud run services update` only; assumes the image is already live
# in the registry.
#
# Usage:
#   OIS_ENV=<env> deploy/deploy-architect.sh [--image <full-image-uri>]
#
# Default image:  "<registry>/architect:latest" resolved from the active
# tfvars. Recommended for mission ships: pass the explicit timestamped
# URI printed by deploy/build-architect.sh so the Cloud Run revision
# carries a traceable tag.
#
# Env selection (mission-46 T1):
#   OIS_ENV     — selects which tfvars file to read + which architect-<env>
#                 service to roll. Default: prod.
#                 Must match ^[a-z][a-z0-9-]*$, max 20 chars.
#   GCP_PROJECT — project id override (takes precedence over tfvars)
#   GCP_REGION  — region override (fallback: australia-southeast1)
#
# Service-name convention: `architect-<env>` (per mission-46 T1 decision).
# Reads `architect_service_name` from tfvars if set; otherwise computes
# `architect-${OIS_ENV}`.
#
# tfvars discovery order (first existing wins for OIS_ENV=<env>):
#   1. deploy/cloudrun/env/<env>.tfvars   (split-structure target)
#   2. deploy/env/<env>.tfvars            (local-bootstrap; transitional)
# Both paths are gitignored via deploy/.gitignore. This script reads only
# `project_id`, `region`, and `architect_service_name` keys — it never
# reads, prints, or logs secret material such as hub_api_token or
# architect_global_instance_id.
#
# Requires: gcloud authenticated as a principal with Cloud Run Admin
# permissions on the target project. The specified image must already
# exist in Artifact Registry (run deploy/build-architect.sh first).
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Env selection + validation (mission-46 T1) ─────────────────────────

OIS_ENV="${OIS_ENV:-prod}"
if [[ ! "$OIS_ENV" =~ ^[a-z][a-z0-9-]*$ ]] || [[ ${#OIS_ENV} -gt 20 ]]; then
  echo "[deploy-architect] ERROR: invalid OIS_ENV='$OIS_ENV' — must match ^[a-z][a-z0-9-]*$, max 20 chars." >&2
  exit 1
fi

# ── Parse args ─────────────────────────────────────────────────────────

IMAGE_OVERRIDE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE_OVERRIDE="${2:?--image requires a value}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "[deploy-architect] Unknown arg: $1" >&2
      echo "[deploy-architect] Usage: OIS_ENV=<env> deploy/deploy-architect.sh [--image <full-image-uri>]" >&2
      exit 1
      ;;
  esac
done

# ── Discover tfvars + read project/region/service-name ─────────────────

TFVARS=""
for candidate in \
  "$REPO_ROOT/deploy/cloudrun/env/${OIS_ENV}.tfvars" \
  "$REPO_ROOT/deploy/env/${OIS_ENV}.tfvars"; do
  if [[ -f "$candidate" ]]; then
    TFVARS="$candidate"
    break
  fi
done

read_tfvar() {
  [[ -z "$TFVARS" ]] && return 0
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

PROJECT_ID="${GCP_PROJECT:-$(read_tfvar project_id)}"
REGION="${GCP_REGION:-$(read_tfvar region)}"
REGION="${REGION:-australia-southeast1}"
SERVICE_NAME="$(read_tfvar architect_service_name)"
SERVICE_NAME="${SERVICE_NAME:-architect-${OIS_ENV}}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "[deploy-architect] ERROR: project_id not resolvable for OIS_ENV='$OIS_ENV'." >&2
  echo "             Populate deploy/cloudrun/env/${OIS_ENV}.tfvars (see .example)," >&2
  echo "             or set GCP_PROJECT env var." >&2
  exit 1
fi

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy"
IMAGE="${IMAGE_OVERRIDE:-${REGISTRY}/architect:latest}"

# ── Print plan (no secrets) ────────────────────────────────────────────

echo "[deploy-architect] OIS_ENV:       $OIS_ENV"
echo "[deploy-architect] Project:       $PROJECT_ID"
echo "[deploy-architect] Region:        $REGION"
echo "[deploy-architect] tfvars source: ${TFVARS:-<none; using env overrides>}"
echo "[deploy-architect] Service:       $SERVICE_NAME"
echo "[deploy-architect] Image:         $IMAGE"
echo "[deploy-architect] ──────── Cloud Run services update ────────"

# ── Roll the service ───────────────────────────────────────────────────

gcloud run services update "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --quiet

# ── Report the live URL ────────────────────────────────────────────────

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format="value(status.url)" 2>/dev/null || true)

echo ""
echo "[deploy-architect] Done."
echo "[deploy-architect]   Service URL: ${SERVICE_URL:-<unable to resolve>}"
