#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${MONEV_BASE_URL:-https://monev.app}"
if [[ -z "${CRON_SECRET:-}" && -f .env.local ]]; then
  CRON_SECRET="$(grep -E '^CRON_SECRET=' .env.local | tail -n 1 | cut -d= -f2-)"
fi

curl -fsS "${BASE_URL}/api/cron/admin-notifications?secret=${CRON_SECRET:-}"
