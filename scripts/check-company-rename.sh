#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

raw_hits="$(mktemp)"
unclassified_hits="$(mktemp)"
trap 'rm -f "$raw_hits" "$unclassified_hits"' EXIT

search_roots=(
  apps/backend/prisma/schema.prisma
  apps/backend/src
  apps/backend/test
  apps/frontend/src
  packages/types/src
)

if ! rg --line-number --with-filename \
  --glob '*.ts' --glob '*.tsx' --glob '*.prisma' \
  --regexp '\bClient\b' \
  --regexp '\bclientId\b' \
  --regexp '\bclientIds\b' \
  --regexp '\bclient\b' \
  "${search_roots[@]}" > "$raw_hits"; then
  :
fi

# OAuth is the only active contract outside the public legacy dashboard route
# where clientId remains a field. Catch a reintroduced Company-domain field even
# when it appears in a test.
if rg --line-number --with-filename \
  --glob '*.ts' --glob '*.tsx' --glob '*.prisma' \
  --regexp '\bclientIds?\b' \
  "${search_roots[@]}" \
  | grep -Ev '^(apps/backend/src/auth/auth\.module\.ts|apps/frontend/src/app/api/auth/\[\.\.\.nextauth\]/route\.ts|apps/frontend/src/app/\[locale\]/client-dashboard/\[clientId\]/page\.tsx):' \
  > "$unclassified_hits"; then
  echo "Unclassified clientId/clientIds fields remain:" >&2
  cat "$unclassified_hits" >&2
  exit 1
fi

# Each surviving exact Client/client occurrence belongs to one reviewed class:
# framework/package vocabulary, translated copy, generic HTTP/browser clients,
# test fixtures/assertions, OAuth, or the stable public legacy dashboard URL.
grep -Ev \
  -e ":1:[\"']use client[\"'];?$" \
  -e '@prisma/client' \
  -e '@aws-sdk/client-s3' \
  -e 'schema\.prisma:[0-9]+:(generator client|  provider = "prisma-client-js")' \
  -e 'QueryClientProvider client=' \
  -e '^apps/backend/src/auth/auth\.module\.ts:' \
  -e '^apps/frontend/src/app/api/auth/\[\.\.\.nextauth\]/route\.ts:' \
  -e '^apps/frontend/src/app/\[locale\]/client-dashboard/\[clientId\]/page\.tsx:' \
  -e '^apps/frontend/src/features/companies/components/company-share-menu\.tsx:.*client-dashboard' \
  -e "\\bt\\([\"']client[\"']\\)" \
  -e 'client: clientLabel' \
  -e "(Client Component|server/client|client-only|client-side|on the client|to the client|from the client|client's outbox)" \
  -e '\.(test|spec|e2e-spec)\.(ts|tsx):' \
  "$raw_hits" > "$unclassified_hits" || true

if [ -s "$unclassified_hits" ]; then
  echo "Unclassified Client/client occurrences remain:" >&2
  cat "$unclassified_hits" >&2
  exit 1
fi

echo "Company rename sweep passed."
echo "Reviewed exceptions: OAuth clientId, framework/package clients, translated copy, test fixtures, and /client-dashboard/[clientId]."
