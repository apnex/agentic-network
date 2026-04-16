#!/usr/bin/env bash
#
# state-backup.sh — Download full GCS hub state as a timestamped tar.gz.
#
# Usage:
#   ./scripts/state-backup.sh                     # saves to ./backups/
#   ./scripts/state-backup.sh /path/to/output/     # saves to custom dir
#

set -euo pipefail

BUCKET="${GCS_BUCKET:-gs://ois-relay-hub-state}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups}"
FILENAME="ois-hub-state-${TIMESTAMP}.tar.gz"
TMPDIR="$(mktemp -d)"

trap 'rm -rf "$TMPDIR"' EXIT

mkdir -p "$OUTPUT_DIR"

echo "[backup] Downloading ${BUCKET} ..."
gsutil -m rsync -r "${BUCKET}/" "${TMPDIR}/"

echo "[backup] Compressing ..."
tar -czf "${OUTPUT_DIR}/${FILENAME}" -C "$TMPDIR" .

SIZE=$(du -h "${OUTPUT_DIR}/${FILENAME}" | cut -f1)
echo "[backup] Done: ${OUTPUT_DIR}/${FILENAME} (${SIZE})"
