#!/usr/bin/env bash
#
# scripts/local/stop-hub.sh — Stop and remove the local Hub container.
#
# Mission-46 T1 env-awareness:
#   - With OIS_ENV set: stops only ois-hub-local-<OIS_ENV>.
#   - Without OIS_ENV: auto-detects the (single) running ois-hub-local-*
#     container and stops it. Per start-hub.sh one-at-a-time policy there
#     should never be more than one running; the auto-detect path picks
#     whichever is present.
#   - If multiple ois-hub-local-* containers exist (policy violation or
#     stale state), lists them and exits non-zero. Operator resolves by
#     picking one with OIS_ENV=<env>.
#
# Idempotent: succeeds quietly if no matching container exists.
#
# Usage:
#   scripts/local/stop-hub.sh                 # auto-detect
#   OIS_ENV=<env> scripts/local/stop-hub.sh   # targeted
#

set -euo pipefail

OIS_ENV="${OIS_ENV:-}"

if [[ -n "$OIS_ENV" ]]; then
  if [[ ! "$OIS_ENV" =~ ^[a-z][a-z0-9-]*$ ]] || [[ ${#OIS_ENV} -gt 20 ]]; then
    echo "[stop-hub] ERROR: invalid OIS_ENV='$OIS_ENV' — must match ^[a-z][a-z0-9-]*$, max 20 chars." >&2
    exit 1
  fi
  TARGET="ois-hub-local-${OIS_ENV}"
  if ! docker ps -a -q --filter "name=^/${TARGET}$" | grep -q .; then
    echo "[stop-hub] No $TARGET container found — nothing to do."
    exit 0
  fi
else
  # Auto-detect path — find all ois-hub-local-* containers.
  MATCHES=$(docker ps -a --filter "name=^/ois-hub-local" --format '{{.Names}}' || true)
  COUNT=$(echo -n "$MATCHES" | grep -c '^' || true)
  if [[ -z "$MATCHES" ]]; then
    echo "[stop-hub] No ois-hub-local-* container found — nothing to do."
    exit 0
  fi
  if [[ "$COUNT" -gt 1 ]]; then
    echo "[stop-hub] ERROR: multiple ois-hub-local-* containers exist (policy violation):" >&2
    echo "$MATCHES" | sed 's/^/  /' >&2
    echo "[stop-hub] Re-run with OIS_ENV=<env> to target one, or docker rm them manually." >&2
    exit 1
  fi
  TARGET="$MATCHES"
fi

if docker ps -q --filter "name=^/${TARGET}$" | grep -q .; then
  echo "[stop-hub] Stopping $TARGET ..."
  docker stop "$TARGET" >/dev/null
fi

echo "[stop-hub] Removing $TARGET ..."
docker rm "$TARGET" >/dev/null

echo "[stop-hub] Done."
