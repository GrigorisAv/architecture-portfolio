#!/usr/bin/env bash
# Builds the site in Supabase mode and runs tests/integration/supabase-mode.cjs against a local Postgres.
set -euo pipefail
bash scripts/test-db.sh > /dev/null
psql -U postgres -d atelier_test -qc "delete from public.quote_requests; update public.projects set status = 'published'"
VITE_SUPABASE_URL=https://fake-project.supabase.co VITE_SUPABASE_ANON_KEY=test-anon-key npx vite build --outDir dist-supabase-test > /dev/null
cp dist-supabase-test/index.html dist-supabase-test/spa.html
DIST=dist-supabase-test PORT=4174 node scripts/serve-dist.mjs & SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node tests/integration/supabase-mode.cjs test-results
