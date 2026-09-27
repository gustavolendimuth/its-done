#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_FILE="${MW34_STATE_FILE:-$ROOT_DIR/.preview-worktree.state}"

for command in curl jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "$command is required for the MW-34 smoke test." >&2
    exit 1
  fi
done

if [ ! -f "$STATE_FILE" ]; then
  echo "Preview state not found. Run 'pnpm preview:start' first." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$STATE_FILE"

api_base="http://127.0.0.1:${BACKEND_PORT}/api"
frontend_base="http://127.0.0.1:${FRONTEND_PORT}"
response_body="$(mktemp)"
trap 'rm -f "$response_body"' EXIT

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local token="${4:-}"
  local args=(-sS -o "$response_body" -w '%{http_code}' -X "$method")

  if [ -n "$body" ]; then
    args+=(-H 'Content-Type: application/json' --data "$body")
  fi
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  local status
  status="$(curl "${args[@]}" "$url")"
  if [[ ! "$status" =~ ^2[0-9][0-9]$ ]]; then
    echo "$method $url returned HTTP $status" >&2
    cat "$response_body" >&2
    echo >&2
    exit 1
  fi
}

assert_frontend_route() {
  local path="$1"
  local status
  status="$(curl -sS -o "$response_body" -w '%{http_code}' "$frontend_base$path")"
  if [ "$status" = '404' ] || [[ "$status" =~ ^5[0-9][0-9]$ ]]; then
    echo "Frontend route $path returned HTTP $status" >&2
    cat "$response_body" >&2
    echo >&2
    exit 1
  fi
}

echo "Waiting for backend and frontend preview..."
for _ in $(seq 1 90); do
  if curl -fsS "$api_base/health" >/dev/null 2>&1 \
    && curl -fsS "$frontend_base/en/login" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS "$api_base/health" >/dev/null
curl -fsS "$frontend_base/en/login" >/dev/null

suffix="$(date +%s)-$$"
user_email="mw34-user-${suffix}@example.test"
admin_email="mw34-admin-${suffix}@example.test"
password='Mw34Smoke!123'

request_json POST "$api_base/auth/register" \
  "$(jq -nc --arg name 'MW-34 Smoke' --arg email "$user_email" --arg password "$password" '{name:$name,email:$email,password:$password}')"

request_json POST "$api_base/auth/login" \
  "$(jq -nc --arg email "$user_email" --arg password "$password" '{email:$email,password:$password}')"
user_token="$(jq -er '.access_token' "$response_body")"

request_json POST "$api_base/companies" \
  "$(jq -nc --arg company "MW-34 Company $suffix" --arg email "mw34-company-${suffix}@example.test" '{company:$company,email:$email}')" \
  "$user_token"
company_id="$(jq -er '.id' "$response_body")"

request_json GET "$api_base/companies" '' "$user_token"
jq -e --arg id "$company_id" 'any(.[]; .id == $id)' "$response_body" >/dev/null

request_json GET "$api_base/companies/$company_id" '' "$user_token"
jq -e --arg id "$company_id" '.id == $id' "$response_body" >/dev/null

request_json POST "$api_base/company-admin/auth/register" \
  "$(jq -nc --arg company "MW-34 Admin Company $suffix" --arg email "$admin_email" --arg password "$password" '{company:$company,email:$email,password:$password}')"
admin_token="$(jq -er '.access_token' "$response_body")"

request_json GET "$api_base/company-admin/collaborators" '' "$admin_token"
jq -e 'type == "array"' "$response_body" >/dev/null

request_json GET "$api_base/company-admin/invites" '' "$admin_token"
jq -e 'type == "array"' "$response_body" >/dev/null

assert_frontend_route '/en/login'
assert_frontend_route '/en/companies'
assert_frontend_route "/en/companies/$company_id"
assert_frontend_route '/en/company-admin/register'
assert_frontend_route '/en/company-admin/dashboard'

echo "MW-34 smoke passed: common login, company list/detail, and Company Admin register/collaborators/invites."
