#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3015}"
APP_HOSTNAME="${APP_HOSTNAME:-0.0.0.0}"
AI_MODEL="${AI_MODEL:-cx/gpt-5.2}"
AI_FALLBACK_MODEL="${AI_FALLBACK_MODEL:-cx/gpt-5.5}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${LOG_FILE:-/tmp/monev-staging-${PORT}.log}"

cd "$APP_DIR"

existing_pids="$(ss -ltnp "sport = :${PORT}" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u || true)"
if [[ -n "$existing_pids" ]]; then
    echo "Stopping existing process on port ${PORT}: ${existing_pids}"
    kill $existing_pids || true
    sleep 1
fi

echo "Starting Monev staging on ${APP_HOSTNAME}:${PORT}"
nohup env \
    PORT="$PORT" \
    HOSTNAME="$APP_HOSTNAME" \
    AI_MODEL="$AI_MODEL" \
    AI_FALLBACK_MODEL="$AI_FALLBACK_MODEL" \
    npm run start > "$LOG_FILE" 2>&1 &

pid="$!"
echo "PID: ${pid}"
echo "Log: ${LOG_FILE}"

for _ in {1..30}; do
    if curl -fsS "http://127.0.0.1:${PORT}/api/ping" >/dev/null 2>&1 || curl -fsSI "http://127.0.0.1:${PORT}/login" >/dev/null 2>&1; then
        echo "Ready: http://127.0.0.1:${PORT}"
        exit 0
    fi
    sleep 1
done

echo "Staging did not become ready in time. Last log lines:" >&2
tail -50 "$LOG_FILE" >&2 || true
exit 1
