#!/usr/bin/env bash
set -euo pipefail

# VPS cron runner for Monev recurring transactions.
# Required env:
#   MONEV_BASE_URL=https://your-domain.com
# Optional env:
#   CRON_SECRET=your-secret

if [[ -z "${MONEV_BASE_URL:-}" ]]; then
    echo "MONEV_BASE_URL is required" >&2
    exit 1
fi

BASE_URL="${MONEV_BASE_URL%/}"
ENDPOINT="${BASE_URL}/api/cron/execute-recurring"

if [[ -n "${CRON_SECRET:-}" ]]; then
    curl -fsS -X POST \
        -H "Authorization: Bearer ${CRON_SECRET}" \
        -H "X-Cron-Secret: ${CRON_SECRET}" \
        "${ENDPOINT}"
else
    curl -fsS -X POST "${ENDPOINT}"
fi

echo
