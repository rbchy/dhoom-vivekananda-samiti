#!/usr/bin/env bash
# Runs every SQL file in supabase/ against a fresh PostgreSQL, then the security tests.
# Usage: PGHOST=... PGUSER=... PGDATABASE=... bash supabase/tests/run-db-tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."
run() { echo "▶ $1"; psql -v ON_ERROR_STOP=1 -q -f "$1" 2>&1 | grep -v "NOTICE:  \(policy\|trigger\|constraint\|column\|relation\).*\(does not exist\|already exists\), skipping" || true; test "${PIPESTATUS[0]}" -eq 0; }
run tests/00-mock-supabase.sql
for f in donations-and-events-schema.sql temple-management-schema.sql site-extras-schema.sql \
         organisations-gallery-schema.sql storage-photos-policy.sql security-hardening.sql \
         roles-and-approvals.sql roles-and-approvals.sql social-posts-schema.sql social-posts-schema.sql smriti-stambha.sql smriti-stambha.sql pranam-mantra.sql pranam-mantra.sql add-surya-dev.sql add-surya-dev.sql test-data-seed.sql remove-test-data.sql; do
  run "$f"
done
psql -v ON_ERROR_STOP=1 -q -f tests/99-security-tests.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
test "${PIPESTATUS[0]}" -eq 0
