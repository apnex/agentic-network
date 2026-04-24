#!/usr/bin/env bash
#
# deploy/build-architect.sh — Build the Architect container via Cloud
# Build and publish to Artifact Registry with a timestamped tag + :latest
# alias. Mirror of deploy/build-hub.sh for the agents/vertex-cloudrun
# service.
#
# Scope: build + push only. Does NOT roll Cloud Run — that's
# deploy/deploy-architect.sh. Run this, confirm the new image, then roll
# via deploy/deploy-architect.sh or terraform apply.
#
# Usage:
#   OIS_ENV=<env> deploy/build-architect.sh [--tag <tag-suffix>]
#
# Default tag suffix: UTC ISO-compact timestamp (YYYYMMDD-HHMMSS).
# Recommended for mission ships: pass --tag "mission-XX-YYYYMMDD-HHMMSS"
# for easier provenance tracing.
#
# Env selection (mission-46 T1):
#   OIS_ENV     — selects which tfvars file to read. Default: prod.
#                 Must match ^[a-z][a-z0-9-]*$, max 20 chars.
#   GCP_PROJECT — project id override (takes precedence over tfvars)
#   GCP_REGION  — region override (fallback: australia-southeast1)
#
# tfvars discovery order (first existing wins for OIS_ENV=<env>):
#   1. deploy/cloudrun/env/<env>.tfvars   (split-structure target)
#   2. deploy/env/<env>.tfvars            (local-bootstrap; transitional)
# Both paths are gitignored via deploy/.gitignore. This script reads only
# `project_id` and `region` keys — it never reads, prints, or logs secret
# material such as hub_api_token or architect_global_instance_id.
#
# Requires: gcloud authenticated as a principal with Cloud Build + Artifact
# Registry write permissions on the target project.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Env selection + validation (mission-46 T1) ─────────────────────────

OIS_ENV="${OIS_ENV:-prod}"
if [[ ! "$OIS_ENV" =~ ^[a-z][a-z0-9-]*$ ]] || [[ ${#OIS_ENV} -gt 20 ]]; then
  echo "[build-architect] ERROR: invalid OIS_ENV='$OIS_ENV' — must match ^[a-z][a-z0-9-]*$, max 20 chars." >&2
  exit 1
fi

# ── Parse args ─────────────────────────────────────────────────────────

TAG_SUFFIX=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG_SUFFIX="${2:?--tag requires a value}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,34p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "[build-architect] Unknown arg: $1" >&2
      echo "[build-architect] Usage: OIS_ENV=<env> deploy/build-architect.sh [--tag <tag-suffix>]" >&2
      exit 1
      ;;
  esac
done

TAG_SUFFIX="${TAG_SUFFIX:-$(date -u +%Y%m%d-%H%M%S)}"

# ── Discover tfvars + read project/region ──────────────────────────────

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

if [[ -z "$PROJECT_ID" ]]; then
  echo "[build-architect] ERROR: project_id not resolvable for OIS_ENV='$OIS_ENV'." >&2
  echo "             Populate deploy/cloudrun/env/${OIS_ENV}.tfvars (see .example)," >&2
  echo "             or set GCP_PROJECT env var." >&2
  exit 1
fi

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy"
IMAGE_TIMESTAMPED="${REGISTRY}/architect:${TAG_SUFFIX}"
IMAGE_LATEST="${REGISTRY}/architect:latest"

# ── Print plan (no secrets) ────────────────────────────────────────────

echo "[build-architect] OIS_ENV:       $OIS_ENV"
echo "[build-architect] Project:       $PROJECT_ID"
echo "[build-architect] Region:        $REGION"
echo "[build-architect] tfvars source: ${TFVARS:-<none; using env overrides>}"
echo "[build-architect] Source:        $REPO_ROOT/agents/vertex-cloudrun"
echo "[build-architect] Image tag:     $IMAGE_TIMESTAMPED"
echo "[build-architect] Latest alias:  $IMAGE_LATEST"
echo "[build-architect] ──────── Cloud Build submit ────────"

# ── Build + push via Cloud Build ───────────────────────────────────────

gcloud builds submit "$REPO_ROOT/agents/vertex-cloudrun" \
  --project "$PROJECT_ID" \
  --tag "$IMAGE_TIMESTAMPED" \
  --quiet

# ── Re-tag :latest to the fresh image ──────────────────────────────────

echo "[build-architect] ──────── Re-tagging :latest ────────"
gcloud artifacts docker tags add \
  "$IMAGE_TIMESTAMPED" \
  "$IMAGE_LATEST" \
  --quiet

# ── Summary + Cloud Run follow-up hint ─────────────────────────────────

echo ""
echo "[build-architect] Done."
echo "[build-architect]   New image:   $IMAGE_TIMESTAMPED"
echo "[build-architect]   :latest →    $IMAGE_TIMESTAMPED"
echo ""
echo "[build-architect] Next — roll Cloud Run to the new image (not performed here):"
echo "[build-architect]   OIS_ENV=$OIS_ENV deploy/deploy-architect.sh --image \"$IMAGE_TIMESTAMPED\""
