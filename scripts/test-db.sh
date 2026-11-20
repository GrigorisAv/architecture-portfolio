#!/usr/bin/env bash
# Runs migrations + seed + RLS tests against a throwaway local Postgres database.
# Usage: PGHOST=/tmp/pgtest PGPORT=54329 ./scripts/test-db.sh
set -euo pipefail
DB=atelier_test
psql -U postgres -qc "drop database if exists $DB" -qc "create database $DB"
run() { psql -U postgres -d $DB -v ON_ERROR_STOP=1 -q -f "$1"; }
run supabase/tests/00_supabase_stubs.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/seed.sql
psql -U postgres -d $DB -v ON_ERROR_STOP=1 -q -t -o /dev/null -f supabase/tests/10_rls.test.sql 2>&1 | sed -E 's/^psql:[^ ]* (NOTICE|ERROR):  //'
echo "ALL DATABASE TESTS PASSED"
