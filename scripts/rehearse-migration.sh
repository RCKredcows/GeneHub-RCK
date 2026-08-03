#!/usr/bin/env bash
#
# Rehearse the 008-019 migrations against a copy of production.
#
# Takes a dump of production, restores it into a throwaway local database, and
# applies the migrations to that. Production is only ever read: the connection
# string is used for pg_dump and nothing else, and the CLI is never linked to
# it, so there is no window in which a stray `db push` could reach it.
#
# Usage:
#   cp .rehearsal.env.example .rehearsal.env
#   # put production's connection string in it, then:
#   scripts/rehearse-migration.sh
#
# The connection string is in the Supabase dashboard under
# Project Settings -> Database -> Connection string. Either the direct or the
# pooler URI works for pg_dump; replace [YOUR-PASSWORD] with the real one.
#
# Nothing here writes to production. Read it before running it anyway.

set -euo pipefail

cd "$(dirname "$0")/.."

# The connection string lives in .rehearsal.env, which is gitignored. A file
# rather than a command-line argument: a password typed as an argument ends up
# in shell history and, briefly, in the process list.
if [ -z "${PROD_DB_URL:-}" ] && [ -f .rehearsal.env ]; then
    # shellcheck disable=SC1091
    . ./.rehearsal.env
fi

FRONTEND="$PWD/frontend"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_DIR="$PWD/.rehearsal"
mkdir -p "$DUMP_DIR"

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

[ -n "${PROD_DB_URL:-}" ] || fail "No PROD_DB_URL. Copy .rehearsal.env.example to .rehearsal.env and fill it in."

case "$PROD_DB_URL" in
    *YOUR-PASSWORD*|*"[password]"*)
        fail "PROD_DB_URL still contains the placeholder -- replace [YOUR-PASSWORD] with the real password." ;;
esac

# --------------------------------------------------------------------------
# 1. Dump production. Read-only.
# --------------------------------------------------------------------------

# Dumped through the Supabase CLI rather than a local pg_dump. The CLI runs a
# pg_dump matching the server in Docker, which sidesteps the version check --
# Homebrew's pg_dump 14 refuses to read a PostgreSQL 17 server outright.
cd "$FRONTEND"

log "Dumping production schema"
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth \
    -f "$DUMP_DIR/schema-$STAMP.sql" || fail "schema dump failed"

log "Dumping production data"
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth --data-only --use-copy \
    -f "$DUMP_DIR/data-$STAMP.sql" || fail "data dump failed"

cd - >/dev/null

ls -lh "$DUMP_DIR"/*-"$STAMP".sql

# A dump nobody looked at is not a dump. An almost-empty data file means the
# credentials worked but the database was not what you thought.
DATA_BYTES=$(wc -c < "$DUMP_DIR/data-$STAMP.sql")
[ "$DATA_BYTES" -gt 10000 ] || fail "data dump is only ${DATA_BYTES} bytes -- check the connection string"

# --------------------------------------------------------------------------
# 2. Bring up a local stack to rehearse against.
# --------------------------------------------------------------------------

log "Starting local Supabase (first run pulls images, give it a few minutes)"
cd "$FRONTEND"
npx supabase start >/dev/null 2>&1 || true      # already running is fine

# Parsed with awk on quote boundaries rather than a literal grep: the CLI
# prints `"DB_URL": "postgres://..."` with a space after the colon, and a
# pattern without one silently matches nothing. `|| true` keeps a failed match
# from killing the script under `set -o pipefail` before the check below can
# say what went wrong.
LOCAL_URL="$(npx supabase status --output json 2>/dev/null \
  | awk -F'"' '/"DB_URL"/ { print $4 }' || true)"

if [ -z "$LOCAL_URL" ]; then
    printf '\n--- supabase status ---\n' >&2
    npx supabase status >&2 || true
    fail "could not read DB_URL from \`supabase status\` (output above)"
fi

log "Rehearsing against $LOCAL_URL"

# --------------------------------------------------------------------------
# 3. Replace the local database with production's copy.
#
# `supabase start` applies every local migration, which is the opposite of what
# a rehearsal wants: the starting point has to be production as it is today,
# not production as these migrations imagine it.
# --------------------------------------------------------------------------

log "Wiping the local schema and restoring production into it"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
TRUNCATE auth.users CASCADE;
DELETE FROM supabase_migrations.schema_migrations;
SQL

# Errors against the auth schema are expected and harmless: locally it is
# owned by supabase_auth_admin and already exists. Errors against public are
# not, so they are counted and reported rather than swallowed.
psql "$LOCAL_URL" -q -f "$DUMP_DIR/schema-$STAMP.sql" 2>"$DUMP_DIR/restore-schema.log" || true
psql "$LOCAL_URL" -q -f "$DUMP_DIR/data-$STAMP.sql"  2>"$DUMP_DIR/restore-data.log"  || true

PUBLIC_ERRORS=$(grep -c 'ERROR' "$DUMP_DIR/restore-schema.log" 2>/dev/null | head -1 || echo 0)
log "Restore finished with $PUBLIC_ERRORS schema errors (auth-schema ones are expected)"

# Only tables that exist at 000. `tenants` arrives with 002.
log "What was restored"
psql "$LOCAL_URL" -c "
SELECT 'employees' AS table, count(*) FROM public.employees
UNION ALL SELECT 'genetic_inventory', count(*) FROM public.genetic_inventory
UNION ALL SELECT 'customers', count(*) FROM public.customers
UNION ALL SELECT 'sires', count(*) FROM public.sires
UNION ALL SELECT 'tanks', count(*) FROM public.tanks
UNION ALL SELECT 'allowed_emails', count(*) FROM public.allowed_emails
UNION ALL SELECT 'auth.users', count(*) FROM auth.users;"

# --------------------------------------------------------------------------
# 4. Pre-flight, against the copy.
# --------------------------------------------------------------------------

# Run against the restored copy while it is still at 000 -- the same state
# production will be in, so this is a genuine dry run of the pre-flight too.
log "Pre-flight (against the restored copy, before migrating)"
psql "$LOCAL_URL" -f supabase/tests/preflight_prod.sql || true

# --------------------------------------------------------------------------
# 5. Repair history, then apply only what is pending.
# --------------------------------------------------------------------------

# Production is at 000 and nothing else. It was never given 001 through 007:
# the dumped schema has no `tenants` table, no `tenant_id` column anywhere, and
# an owner_type constraint still allowing 'rck' rather than 'internal'. So the
# real migration path is 001 to 019 -- the whole multi-tenancy conversion, not
# just the billing work.
log "Recording 000 as already applied"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('000')
ON CONFLICT (version) DO NOTHING;
SQL

log "Applying 001-019"
npx supabase db push --db-url "$LOCAL_URL" --yes || fail "migrations did not apply cleanly"

# --------------------------------------------------------------------------
# 6. Did anything get lost, and did it do what it was supposed to?
# --------------------------------------------------------------------------

log "Counts after migrating -- compare against step 3"
psql "$LOCAL_URL" -c "
SELECT 'tenants' AS table, count(*) FROM public.tenants
UNION ALL SELECT 'employees', count(*) FROM public.employees
UNION ALL SELECT 'genetic_inventory', count(*) FROM public.genetic_inventory
UNION ALL SELECT 'customers', count(*) FROM public.customers
UNION ALL SELECT 'sires', count(*) FROM public.sires;"

log "Who ended up owning each workspace"
psql "$LOCAL_URL" -c "
SELECT t.slug, e.full_name, e.role
FROM public.tenants t
JOIN public.employees e ON e.tenant_id = t.id
WHERE e.role = 'owner' ORDER BY t.slug;"

log "Workspaces left without an owner (should be none with accounts)"
psql "$LOCAL_URL" -c "
SELECT t.slug, count(e.id) AS accounts
FROM public.tenants t
LEFT JOIN public.employees e ON e.tenant_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.employees o WHERE o.tenant_id = t.id AND o.role = 'owner')
GROUP BY t.slug;"

log "Invitations carried over from the old allowlist"
psql "$LOCAL_URL" -c "SELECT count(*) AS carried_over FROM public.invitations;"

log "Nobody locked out (NULL subscription counts as good standing)"
psql "$LOCAL_URL" -c "
SELECT coalesce(subscription_status, 'none') AS status, count(*)
FROM public.tenants GROUP BY 1;"

cat <<EOF

Rehearsal finished.

Production was only read. The dumps are in .rehearsal/ -- they contain real
customer data, so delete them when you are done and keep them out of git.

Still worth doing by hand against the rehearsal database:

  psql "$LOCAL_URL" -f supabase/tests/billing_and_roles.sql
  psql "$LOCAL_URL" -f supabase/tests/tenant_isolation.sql

Both need a real email address set near the top of the file.
EOF
