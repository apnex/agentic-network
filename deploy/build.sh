#!/usr/bin/env bash
# ── OIS Agentic Network — Build & Deploy ──────────────────────────────
#
# Builds container images via Cloud Build and deploys via Terraform.
# Assumes `terraform init` has been run and infrastructure exists.
#
# Usage:
#   ./build.sh                    # build + deploy all services
#   ./build.sh hub                # build + deploy Hub only
#   ./build.sh architect          # build + deploy Architect only
#   ./build.sh --build-only       # build images without terraform apply
#
# After `terraform apply`, this script forces a new Cloud Run revision
# for each target service via `gcloud run services update
# --update-labels=deploy-ts=<epoch>`. This works around Terraform's
# behaviour of leaving the existing revision in place when the image
# tag (`:latest`) resolves to the same digest as the currently-deployed
# revision — a frequent scenario during Phase 2b/2c/2x development
# cycles where the image changes but Terraform-managed fields don't.
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - terraform init completed in this directory
#   - deploy/env/prod.tfvars exists with valid configuration
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TFVARS="${TFVARS:-$SCRIPT_DIR/env/prod.tfvars}"

# ── Parse args ────────────────────────────────────────────────────────

TARGET="${1:-all}"
BUILD_ONLY=false
if [[ "$TARGET" == "--build-only" ]]; then
  BUILD_ONLY=true
  TARGET="${2:-all}"
fi

# ── Read Terraform outputs ────────────────────────────────────────────

cd "$SCRIPT_DIR"

if ! terraform output -raw registry_prefix >/dev/null 2>&1; then
  echo "ERROR: Terraform outputs not available."
  echo "       Run 'terraform init && terraform apply -var-file=env/prod.tfvars' first."
  exit 1
fi

REGISTRY_PREFIX="$(terraform output -raw registry_prefix)"
echo "Registry: $REGISTRY_PREFIX"

# ── Build functions ───────────────────────────────────────────────────

build_hub() {
  local tag="$REGISTRY_PREFIX/hub:latest"
  echo ""
  echo "── Building Hub ────────────────────────────────────"
  gcloud builds submit "$REPO_ROOT/hub" \
    --tag "$tag" \
    --quiet
  echo "  Image: $tag"
}

build_architect() {
  local tag="$REGISTRY_PREFIX/architect-agent:latest"
  echo ""
  echo "── Building Architect ──────────────────────────────"

  # Architect needs the network-adapter tarball at build time
  local adapter_tgz="$REPO_ROOT/agents/vertex-cloudrun/ois-network-adapter-2.0.0.tgz"
  if [[ ! -f "$adapter_tgz" ]]; then
    echo "  Packing network-adapter..."
    (cd "$REPO_ROOT/packages/network-adapter" && npm pack --pack-destination "$REPO_ROOT/agents/vertex-cloudrun")
  fi

  gcloud builds submit "$REPO_ROOT/agents/vertex-cloudrun" \
    --tag "$tag" \
    --quiet
  echo "  Image: $tag"
}

# ── Execute builds ────────────────────────────────────────────────────

case "$TARGET" in
  hub)
    build_hub
    ;;
  architect)
    build_architect
    ;;
  all)
    build_hub
    build_architect
    ;;
  *)
    echo "Usage: $0 [hub|architect|all|--build-only [hub|architect|all]]"
    exit 1
    ;;
esac

# ── Deploy via Terraform ──────────────────────────────────────────────

if [[ "$BUILD_ONLY" == "true" ]]; then
  echo ""
  echo "Build complete (--build-only). Run 'terraform apply' to deploy."
  exit 0
fi

echo ""
echo "── Deploying via Terraform ───────────────────────────"

if [[ ! -f "$TFVARS" ]]; then
  echo "ERROR: $TFVARS not found. Copy env/prod.tfvars.example to env/prod.tfvars"
  exit 1
fi

terraform apply -var-file="$TFVARS" -auto-approve

# ── Force new revisions (Phase 2x P2-7) ───────────────────────────────
#
# Terraform leaves the existing Cloud Run revision in place when the
# image tag (:latest) resolves to the same digest as the current
# revision's image, even though we just built a fresh image under the
# same tag. The label bump below is an in-place service-config update
# that Cloud Run treats as a new revision trigger — the ready revision
# advances and the new image is actually rolled out. Without this,
# `./build.sh` would silently serve stale code for any change that
# didn't modify a Terraform-managed field.
#
# Only bumps the services in the current TARGET scope so building just
# the architect doesn't recycle a warm Hub instance (or vice versa).

REGION="$(terraform output -raw region 2>/dev/null || echo "")"
DEPLOY_TS="$(date +%s)"
force_revision() {
  local svc="$1"
  if [[ -z "$REGION" ]]; then
    echo "  WARN: no region Terraform output — skipping revision-force for $svc"
    return
  fi
  echo "  Forcing new revision for $svc..."
  gcloud run services update "$svc" \
    --region="$REGION" \
    --update-labels="deploy-ts=$DEPLOY_TS" \
    --quiet >/dev/null
  local rev
  rev="$(gcloud run services describe "$svc" --region="$REGION" --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo "?")"
  echo "  $svc → $rev"
}

echo ""
echo "── Forcing new Cloud Run revisions ───────────────────"
case "$TARGET" in
  hub)
    force_revision "$(terraform output -raw hub_service_name 2>/dev/null || echo "hub")"
    ;;
  architect)
    force_revision "$(terraform output -raw architect_service_name 2>/dev/null || echo "architect-agent")"
    ;;
  all)
    force_revision "$(terraform output -raw hub_service_name 2>/dev/null || echo "hub")"
    force_revision "$(terraform output -raw architect_service_name 2>/dev/null || echo "architect-agent")"
    ;;
esac

echo ""
echo "── Deploy Complete ───────────────────────────────────"
terraform output
