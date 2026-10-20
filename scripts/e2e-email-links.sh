#!/bin/bash
# Smoke: aciona cada email do backend que carrega link pro frontend e abre o
# link num browser de verdade (packages/e2e). Sobe o stack via preview-worktree.sh
# com o Resend apontado pra um mock local, então nenhum email real é enviado.
#
# Uso: pnpm e2e:email-links
# Requer: postgres e redis rodando (docker compose -f docker-compose.dev.yml up -d postgres redis)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STATE_FILE="$ROOT_DIR/.preview-worktree.state"
MAIL_PORT="${E2E_MAIL_PORT:-4010}"
READY_TIMEOUT="${E2E_READY_TIMEOUT:-180}"

if [ -f "$STATE_FILE" ]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE"
    if kill -0 "-${BACKEND_PID:-0}" 2>/dev/null || kill -0 "-${FRONTEND_PID:-0}" 2>/dev/null; then
        echo "Já existe um preview rodando nesta worktree. Rode 'pnpm preview:stop' antes:" >&2
        echo "o smoke precisa subir o backend com RESEND_BASE_URL apontando pro mock." >&2
        exit 1
    fi
fi

# Lidas pelo backend no boot (o SDK do resend lê RESEND_BASE_URL ao importar).
export RESEND_BASE_URL="http://127.0.0.1:${MAIL_PORT}"
export RESEND_API_KEY="${RESEND_API_KEY:-re_e2e_mock}"

cleanup() {
    ./scripts/preview-worktree.sh stop || true
}
trap cleanup EXIT

./scripts/preview-worktree.sh start

# shellcheck disable=SC1090
source "$STATE_FILE"

wait_for() {
    local url=$1 name=$2 waited=0
    until curl -sf -o /dev/null "$url"; do
        if [ "$waited" -ge "$READY_TIMEOUT" ]; then
            echo "$name não respondeu em ${READY_TIMEOUT}s ($url). Logs em logs/preview-*.log" >&2
            exit 1
        fi
        sleep 2
        waited=$((waited + 2))
    done
}

wait_for "http://localhost:${BACKEND_PORT}/api/health" "backend"
wait_for "http://localhost:${FRONTEND_PORT}/login" "frontend"

export E2E_BACKEND_URL="http://localhost:${BACKEND_PORT}"
export E2E_FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
export E2E_MAIL_PORT="$MAIL_PORT"

pnpm --filter @its-done/e2e exec playwright test "$@"
