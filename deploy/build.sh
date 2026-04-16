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

echo ""
echo "── Deploy Complete ───────────────────────────────────"
terraform output
