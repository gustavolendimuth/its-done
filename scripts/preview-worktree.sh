#!/bin/bash
# Sobe/derruba um preview provisório da worktree atual (backend + frontend via
# pnpm, em portas livres), reaproveitando o postgres/redis do docker principal.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# .env é gitignorado, então worktrees novas não o herdam do checkout principal.
# Se não tiver um aqui, busca no worktree original do projeto (o primeiro da lista).
if [ ! -f "$ROOT_DIR/.env" ]; then
    MAIN_WORKTREE=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')
    if [ -n "$MAIN_WORKTREE" ] && [ "$MAIN_WORKTREE" != "$ROOT_DIR" ] && [ -f "$MAIN_WORKTREE/.env" ]; then
        echo -e "${YELLOW}.env não existe nesta worktree, copiando de $MAIN_WORKTREE${NC}"
        cp "$MAIN_WORKTREE/.env" "$ROOT_DIR/.env"
    fi
fi

if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
fi

STATE_FILE="$ROOT_DIR/.preview-worktree.state"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_LOG="$LOG_DIR/preview-backend.log"
FRONTEND_LOG="$LOG_DIR/preview-frontend.log"

FRONTEND_BASE_PORT=3100
BACKEND_BASE_PORT=3102
DB_PORT=5432
REDIS_PORT=6379

# Banco isolado por worktree: essa branch pode ter migrations incompatíveis
# com o schema que o docker principal usa (ex: rename de tabela), então o
# preview nunca roda migration contra o banco "its_done" compartilhado.
PREVIEW_DB_NAME="its_done_$(echo -n "$(basename "$ROOT_DIR")" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9' '_')"

port_in_use() {
    ss -Htn state listening "( sport = :$1 )" 2>/dev/null | grep -q .
}

ensure_preview_db() {
    local exists
    exists=$(PGPASSWORD=postgres psql -h localhost -p "$DB_PORT" -U postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$PREVIEW_DB_NAME'" 2>/dev/null)
    if [ "$exists" != "1" ]; then
        echo -e "${YELLOW}Criando banco de preview $PREVIEW_DB_NAME...${NC}"
        PGPASSWORD=postgres createdb -h localhost -p "$DB_PORT" -U postgres "$PREVIEW_DB_NAME"
    fi
    echo -e "${BLUE}Aplicando migrations no banco de preview...${NC}"
    DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/${PREVIEW_DB_NAME}" \
        pnpm --filter backend exec prisma migrate deploy
}

find_free_port() {
    local port=$1
    while port_in_use "$port"; do
        port=$((port + 1))
    done
    echo "$port"
}

cmd_start() {
    if [ -f "$STATE_FILE" ]; then
        # shellcheck disable=SC1090
        source "$STATE_FILE"
        if kill -0 "-${BACKEND_PID:-0}" 2>/dev/null || kill -0 "-${FRONTEND_PID:-0}" 2>/dev/null; then
            echo -e "${YELLOW}Preview já rodando nesta worktree:${NC}"
            echo -e "  Frontend: ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
            echo -e "  Backend:  ${BLUE}http://localhost:${BACKEND_PORT}${NC}"
            echo "Rode 'pnpm preview:stop' antes de subir de novo."
            exit 0
        fi
        rm -f "$STATE_FILE"
    fi

    if ! command -v psql >/dev/null || ! command -v createdb >/dev/null; then
        echo -e "${RED}psql/createdb não encontrados no PATH.${NC}"
        echo "Instale o cliente do postgres (ex: pacote postgresql-client) e tente de novo."
        exit 1
    fi

    if ! port_in_use "$DB_PORT"; then
        echo -e "${RED}Postgres não está respondendo na porta $DB_PORT.${NC}"
        echo "Suba o docker principal antes: docker compose -f docker-compose.dev.yml up -d postgres redis"
        exit 1
    fi

    if ! port_in_use "$REDIS_PORT"; then
        echo -e "${RED}Redis não está respondendo na porta $REDIS_PORT.${NC}"
        echo "Suba o docker principal antes: docker compose -f docker-compose.dev.yml up -d postgres redis"
        exit 1
    fi

    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        echo -e "${YELLOW}node_modules não existe nesta worktree. Rodando pnpm install...${NC}"
        pnpm install
    fi

    ensure_preview_db

    mkdir -p "$LOG_DIR"
    : > "$BACKEND_LOG"
    : > "$FRONTEND_LOG"

    FRONTEND_PORT=$(find_free_port "$FRONTEND_BASE_PORT")
    BACKEND_PORT=$(find_free_port "$BACKEND_BASE_PORT")

    echo -e "${BLUE}Subindo preview da worktree $(basename "$ROOT_DIR")...${NC}"

    setsid env \
        PORT="$BACKEND_PORT" \
        NODE_ENV=development \
        DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/${PREVIEW_DB_NAME}" \
        JWT_SECRET="preview-jwt-secret" \
        FRONTEND_URL="http://localhost:${FRONTEND_PORT}" \
        pnpm --filter backend start:dev > "$BACKEND_LOG" 2>&1 < /dev/null &
    BACKEND_PID=$!

    setsid env \
        NEXTAUTH_URL="http://localhost:${FRONTEND_PORT}" \
        NEXTAUTH_SECRET="preview-nextauth-secret" \
        API_URL="http://localhost:${BACKEND_PORT}" \
        NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}" \
        pnpm --filter frontend exec next dev -p "$FRONTEND_PORT" > "$FRONTEND_LOG" 2>&1 < /dev/null &
    FRONTEND_PID=$!

    cat > "$STATE_FILE" <<EOF
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF

    echo -e "${GREEN}Preview no ar.${NC}"
    echo -e "  Frontend: ${BLUE}http://localhost:${FRONTEND_PORT}${NC} (log: $FRONTEND_LOG)"
    echo -e "  Backend:  ${BLUE}http://localhost:${BACKEND_PORT}${NC} (log: $BACKEND_LOG)"
    echo -e "  Banco:    ${BLUE}${PREVIEW_DB_NAME}${NC} (isolado do docker principal)"
    echo "Rode 'pnpm preview:stop' quando terminar de validar."
}

cmd_stop() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "Nenhum preview rodando nesta worktree."
        exit 0
    fi

    # shellcheck disable=SC1090
    source "$STATE_FILE"

    for pid in "${BACKEND_PID:-}" "${FRONTEND_PID:-}"; do
        if [ -n "$pid" ] && kill -0 "-$pid" 2>/dev/null; then
            kill -- "-$pid" 2>/dev/null || true
        fi
    done

    rm -f "$STATE_FILE"
    echo -e "${GREEN}Preview derrubado.${NC}"
}

case "${1:-}" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    *)
        echo "Uso: $0 {start|stop}"
        exit 1
        ;;
esac
