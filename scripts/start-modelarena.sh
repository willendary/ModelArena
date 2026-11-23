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
  echo "[!] Criado backend/.env a partir de .env.example (NVIDIA_API_KEY e opcional se o OpenChamber/OpenCode estiver instalado)."
fi

if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "[2/3] Compilando dashboard web em frontend/dist..."
  (cd "$FRONTEND_DIR" && npm install && npm run build)
fi

SELECTED_PORT="$("$VENV_PYTHON" -c "
import socket, sys
host = sys.argv[1]
preferred = int(sys.argv[2])
for p in dict.fromkeys([preferred, 8766, 8770, 8865, 8965, 9765, 18765, 0]):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind((host, p))
        print(s.getsockname()[1])
        s.close()
        break
    except OSError:
        s.close()
" "$HOST" "$PORT")"

if [ "$SELECTED_PORT" != "$PORT" ]; then
  echo "[!] Porta $PORT ocupada. Usando porta livre $SELECTED_PORT automaticamente."
fi

mkdir -p "$HOME/.modelarena"
printf '{"url":"http://%s:%s","host":"%s","port":%s}\n' "$HOST" "$SELECTED_PORT" "$HOST" "$SELECTED_PORT" > "$HOME/.modelarena/runtime.json"

echo "[3/3] Iniciando ModelArena em http://${HOST}:${SELECTED_PORT}"
cd "$BACKEND_DIR"
exec "$VENV_PYTHON" -m uvicorn app.main:app --host "$HOST" --port "$SELECTED_PORT"
