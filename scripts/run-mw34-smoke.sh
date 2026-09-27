#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for command in createdb curl dropdb psql ss; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "$command is required for the isolated MW-34 preview." >&2
    exit 1
  fi
done

db_port=5432
redis_port=6379
database_name="its_done_mw34_$$"
database_url="postgresql://postgres:postgres@127.0.0.1:${db_port}/${database_name}"
runtime_dir="$(mktemp -d)"
state_file="$runtime_dir/preview.state"
backend_log="$runtime_dir/backend.log"
frontend_log="$runtime_dir/frontend.log"
backend_pid=''
frontend_pid=''

port_in_use() {
  ss -Htn state listening "( sport = :$1 )" 2>/dev/null | grep -q .
}

find_free_port() {
  local port="$1"
  while port_in_use "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

cleanup() {
  local task_status=$?
  trap - EXIT INT TERM

  for pid in "$backend_pid" "$frontend_pid"; do
    if [ -n "$pid" ] && kill -0 "-$pid" 2>/dev/null; then
      kill -- "-$pid" 2>/dev/null || true
    fi
  done

  PGPASSWORD=postgres dropdb \
    -h 127.0.0.1 -p "$db_port" -U postgres \
    --if-exists "$database_name" >/dev/null 2>&1 || true
  rm -rf "$runtime_dir"

  if [ "$task_status" -eq 0 ]; then
    echo "MW-34 isolated preview stopped and disposable database removed."
  else
    echo "MW-34 smoke failed; isolated preview was stopped." >&2
  fi
  exit "$task_status"
}
trap cleanup EXIT INT TERM

if ! port_in_use "$db_port"; then
  echo "PostgreSQL is not listening on port $db_port." >&2
  exit 1
fi
if ! port_in_use "$redis_port"; then
  echo "Redis is not listening on port $redis_port." >&2
  exit 1
fi

PGPASSWORD=postgres createdb \
  -h 127.0.0.1 -p "$db_port" -U postgres "$database_name"

DATABASE_URL="$database_url" \
  pnpm --filter @its-done/backend exec prisma migrate deploy

frontend_port="$(find_free_port 3200)"
backend_port="$(find_free_port 3202)"

setsid env \
  PORT="$backend_port" \
  NODE_ENV=development \
  DATABASE_URL="$database_url" \
  JWT_SECRET='mw34-smoke-jwt-secret' \
  FRONTEND_URL="http://127.0.0.1:${frontend_port}" \
  pnpm --filter @its-done/backend start:dev \
  > "$backend_log" 2>&1 < /dev/null &
backend_pid=$!

setsid env \
  NEXTAUTH_URL="http://127.0.0.1:${frontend_port}" \
  NEXTAUTH_SECRET='mw34-smoke-nextauth-secret' \
  API_URL="http://127.0.0.1:${backend_port}" \
  NEXT_PUBLIC_API_URL="http://127.0.0.1:${backend_port}" \
  pnpm --filter frontend exec next dev -p "$frontend_port" \
  > "$frontend_log" 2>&1 < /dev/null &
frontend_pid=$!

cat > "$state_file" <<EOF
BACKEND_PID=$backend_pid
FRONTEND_PID=$frontend_pid
BACKEND_PORT=$backend_port
FRONTEND_PORT=$frontend_port
EOF

echo "MW-34 isolated preview started on frontend $frontend_port and backend $backend_port."
if ! MW34_STATE_FILE="$state_file" scripts/smoke-mw34.sh; then
  echo "Backend log:" >&2
  tail -80 "$backend_log" >&2 || true
  echo "Frontend log:" >&2
  tail -80 "$frontend_log" >&2 || true
  exit 1
fi
