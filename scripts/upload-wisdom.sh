#!/bin/bash
# Upload ARCHITECTURE.md and docs/decisions/ to GCS for the Architect's context store.
# Run this after updating any wisdom documents.

BUCKET="ois-relay-hub-state"
PREFIX="architect-context/wisdom"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Uploading wisdom documents to gs://${BUCKET}/${PREFIX}/"

# Upload ARCHITECTURE.md
gsutil cp "${REPO_ROOT}/ARCHITECTURE.md" "gs://${BUCKET}/${PREFIX}/ARCHITECTURE.md"

# Upload workflow specification (includes backlog)
gsutil cp "${REPO_ROOT}/docs/workflow-specification.md" "gs://${BUCKET}/${PREFIX}/workflow-specification.md"

# Upload collaboration doc
gsutil cp "${REPO_ROOT}/docs/architect-engineer-collaboration.md" "gs://${BUCKET}/${PREFIX}/architect-engineer-collaboration.md"

# Upload all decision records
for file in "${REPO_ROOT}/docs/decisions/"*.md; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    gsutil cp "$file" "gs://${BUCKET}/${PREFIX}/decisions/${basename}"
    echo "  Uploaded ${basename}"
  fi
done

echo "Done. Wisdom documents uploaded to GCS."
