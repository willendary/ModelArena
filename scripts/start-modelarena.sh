#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8765}"
HOST="${HOST:-127.0.0.1}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
VENV_PYTHON="$BACKEND_DIR/.venv/bin/python"

echo "=== ModelArena Launcher ==="

if [ ! -x "$VENV_PYTHON" ]; then
  echo "[1/3] Criando virtualenv Python em backend/.venv..."
  python3 -m venv "$BACKEND_DIR/.venv"
  "$VENV_PYTHON" -m pip install --upgrade pip
  "$VENV_PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "[!] Criado backend/.env a partir de .env.example. Configure NVIDIA_API_KEY."
fi

if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "[2/3] Compilando dashboard web em frontend/dist..."
  (cd "$FRONTEND_DIR" && npm install && npm run build)
fi

echo "[3/3] Iniciando ModelArena em http://${HOST}:${PORT}"
cd "$BACKEND_DIR"
exec "$VENV_PYTHON" -m uvicorn app.main:app --host "$HOST" --port "$PORT"
