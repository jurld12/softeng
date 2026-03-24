#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.dev-runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"

mkdir -p "$RUNTIME_DIR"

print_banner() {
  echo "========================================"
  echo "   Healio Development Environment (macOS)"
  echo "========================================"
  echo
}

require_command() {
  local cmd="$1"
  local label="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $label is required but was not found in PATH."
    exit 1
  fi
}

kill_pid_file() {
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

stop_port_if_listening() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

prepare_backend_venv() {
  local venv_activate="$ROOT_DIR/backend/venv/bin/activate"

  if [[ ! -f "$venv_activate" ]]; then
    echo "Creating backend virtual environment..."
    python3 -m venv "$ROOT_DIR/backend/venv"

    # shellcheck disable=SC1091
    source "$venv_activate"
    python -m pip install --upgrade pip
    pip install -r "$ROOT_DIR/backend/requirements.txt"
  fi
}

start_backend() {
  echo "Starting backend server..."
  nohup bash -lc "cd '$ROOT_DIR/backend' && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 5000" >"$BACKEND_LOG" 2>&1 &
  echo $! >"$BACKEND_PID_FILE"
}

start_frontend() {
  echo "Starting frontend server..."
  nohup bash -lc "cd '$ROOT_DIR/frontend' && python3 -m http.server 3000" >"$FRONTEND_LOG" 2>&1 &
  echo $! >"$FRONTEND_PID_FILE"
}

print_summary() {
  echo
  echo "========================================"
  echo "   All Services Started"
  echo "========================================"
  echo "MongoDB:  Docker container healio-mongodb"
  echo "Backend:  http://127.0.0.1:5000"
  echo "Docs:     http://127.0.0.1:5000/docs"
  echo "Frontend: http://localhost:3000"
  echo
  echo "Logs:"
  echo "- Backend:  $BACKEND_LOG"
  echo "- Frontend: $FRONTEND_LOG"
  echo
  echo "To stop services: ./stop-dev-mac.sh"
}

print_banner

require_command "python3" "Python 3"
require_command "docker" "Docker"
require_command "lsof" "lsof"

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker Desktop is not running. Start Docker Desktop and retry."
  exit 1
fi

echo "Cleaning stale local server processes..."
kill_pid_file "$BACKEND_PID_FILE"
kill_pid_file "$FRONTEND_PID_FILE"
stop_port_if_listening 5000
stop_port_if_listening 3000

prepare_backend_venv

echo "Starting MongoDB..."
(cd "$ROOT_DIR" && docker compose up -d mongodb)

start_backend
start_frontend

sleep 2

print_summary
