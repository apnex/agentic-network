#!/usr/bin/env bash
# Mission-45 Task 5 — one-time local hook activation.
#
# Points git at the in-repo .husky/ directory (via core.hooksPath) so the
# committed hook scripts execute for this clone. Run once after cloning
# the repo; idempotent.
#
# No npm / husky-the-package dependency — pure-git mechanism. Chosen over
# husky-managed install because the repo has no root package.json to anchor
# an `npm run prepare` script to (hub/, adapters/*, packages/* each have
# their own package.json; nothing at root).

set -euo pipefail

# Locate repo root (tolerates invocation from subdirectories)
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository." >&2
  echo "Run this script from anywhere under the agentic-network clone." >&2
  exit 1
fi

cd "$repo_root"

if [[ ! -d .husky ]]; then
  echo "ERROR: .husky/ directory not found at repository root ($repo_root)." >&2
  echo "Expected committed hooks at .husky/pre-commit and similar." >&2
  exit 1
fi

# Preserve exec bit on hook scripts (may be lost over tar/zip transport)
chmod +x .husky/* 2>/dev/null || true

# Point git at .husky/ rather than the default .git/hooks/
git config core.hooksPath .husky

echo "setup-hooks: core.hooksPath set to .husky"
echo "setup-hooks: pre-commit secret-scan now enforced for this clone."
echo ""
echo "Test the hook locally:"
echo "  touch fake.tfvars && git add fake.tfvars && git commit -m test"
echo "  (should be blocked; then:  rm fake.tfvars && git reset fake.tfvars)"
echo ""
echo "Emergency bypass (audit-visible in reflog):  git commit --no-verify"
