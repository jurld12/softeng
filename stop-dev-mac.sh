#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.dev-runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

kill_from_pid_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

kill_port_listeners() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

echo "========================================"
echo "   Stopping Healio Services (macOS)"
echo "========================================"
echo

echo "Stopping backend/frontend processes..."
kill_from_pid_file "$BACKEND_PID_FILE"
kill_from_pid_file "$FRONTEND_PID_FILE"
kill_port_listeners 5000
kill_port_listeners 3000

echo "Stopping MongoDB container..."
(cd "$ROOT_DIR" && docker compose stop mongodb >/dev/null 2>&1 || true)

echo "Done."
