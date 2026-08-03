#!/usr/bin/env bash
#
# Migrate production from 000 to 020.
#
# Runs the plan in frontend/supabase/migrations/README.md: pre-flight, back up,
# repair the history to 000, apply 001-020, verify. It stops at every point
# where a person should look at something before continuing.
#
# The CLI is never linked to production. Every command targets it by
# connection string, so there is no lingering link for a later `db push` or
# `db reset` to land on by accident.
#
# Usage:
#   cp .rehearsal.env.example .rehearsal.env    # add production's password
#   scripts/prod-migration.sh                   # walks through it
#   scripts/prod-migration.sh --defer-016       # leave allowed_emails in place
#   scripts/prod-migration.sh --dry-run         # pre-flight and backup only
#
# Rehearse first: scripts/rehearse-migration.sh

set -euo pipefail

cd "$(dirname "$0")/.."
REPO="$PWD"
FRONTEND="$REPO/frontend"

if [ -z "${PROD_DB_URL:-}" ] && [ -f .rehearsal.env ]; then
    # shellcheck disable=SC1091
    . ./.rehearsal.env
fi

DEFER_016=0
DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --defer-016) DEFER_016=1 ;;
        --dry-run)   DRY_RUN=1 ;;
        *) printf 'Unknown option: %s\n' "$arg" >&2; exit 2 ;;
    esac
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$REPO/.prod-backup"
LOG="$BACKUP_DIR/migration-$STAMP.log"
mkdir -p "$BACKUP_DIR"

log()   { printf '\n\033[1m==> %s\033[0m\n' "$*" | tee -a "$LOG"; }
warn()  { printf '\033[33m%s\033[0m\n' "$*" | tee -a "$LOG"; }
fail()  { printf '\n\033[31mSTOPPED: %s\033[0m\n' "$*" | tee -a "$LOG" >&2; exit 1; }

confirm() {
    local prompt="$1" expected="$2" answer
    printf '\n%s\n' "$prompt"
    printf "Type '%s' to continue: " "$expected"
    read -r answer
    [ "$answer" = "$expected" ] || fail "not confirmed"
}

[ -n "${PROD_DB_URL:-}" ] || fail "No PROD_DB_URL. Copy .rehearsal.env.example to .rehearsal.env and fill it in."
case "$PROD_DB_URL" in
    *YOUR-PASSWORD*) fail "PROD_DB_URL still contains the placeholder." ;;
esac

cd "$FRONTEND"

# --------------------------------------------------------------------------
# 0. Say out loud what this is about to do
# --------------------------------------------------------------------------

cat <<'EOF'

  This migrates PRODUCTION from 000 to 020. It applies the whole multi-tenancy
  conversion (002 adds tenant_id to fourteen tables and makes it NOT NULL),
  switches on row level security everywhere (003), and revokes an RPC the
  currently deployed frontend still calls (008).

  Before continuing, all of these should be true:

    - the app is offline, or you accept that sessions will break mid-run
    - the current frontend build is ready to deploy immediately afterwards
    - scripts/rehearse-migration.sh has been run and looked right

EOF

confirm "Is the application offline and a frontend build ready to deploy?" "yes"

# --------------------------------------------------------------------------
# 1. Pre-flight
# --------------------------------------------------------------------------

log "Pre-flight against production"
PREFLIGHT_OUT="$BACKUP_DIR/preflight-$STAMP.txt"
psql "$PROD_DB_URL" -f supabase/tests/preflight_prod.sql 2>&1 | tee "$PREFLIGHT_OUT"

if grep -q 'BLOCKED' "$PREFLIGHT_OUT"; then
    grep 'BLOCKED' "$PREFLIGHT_OUT" | tee -a "$LOG"
    fail "pre-flight reported BLOCKED. Fix those before migrating."
fi

log "No blockers. Read the REVIEW lines above -- especially who becomes owner."
confirm "Do the counts and the owner match what the rehearsal showed?" "yes"

# --------------------------------------------------------------------------
# 2. Record what is there now, to compare against afterwards
# --------------------------------------------------------------------------

log "Counts before migrating"
BEFORE="$BACKUP_DIR/counts-before-$STAMP.txt"
psql "$PROD_DB_URL" -At -F' ' -c "
SELECT 'genetic_inventory', count(*) FROM public.genetic_inventory
UNION ALL SELECT 'customers', count(*) FROM public.customers
UNION ALL SELECT 'sires', count(*) FROM public.sires
UNION ALL SELECT 'tanks', count(*) FROM public.tanks
UNION ALL SELECT 'canisters', count(*) FROM public.canisters
UNION ALL SELECT 'supply_inventory', count(*) FROM public.supply_inventory
UNION ALL SELECT 'employees', count(*) FROM public.employees
ORDER BY 1;" | tee "$BEFORE"

# --------------------------------------------------------------------------
# 3. Back up. Through the CLI: a local pg_dump is likely older than the server.
# --------------------------------------------------------------------------

log "Backing up production"
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth \
    -f "$BACKUP_DIR/schema-$STAMP.sql" || fail "schema backup failed"
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth --data-only --use-copy \
    -f "$BACKUP_DIR/data-$STAMP.sql" || fail "data backup failed"

ls -lh "$BACKUP_DIR"/*-"$STAMP".sql | tee -a "$LOG"

DATA_BYTES=$(wc -c < "$BACKUP_DIR/data-$STAMP.sql")
[ "$DATA_BYTES" -gt 100000 ] || fail "the data backup is only ${DATA_BYTES} bytes -- that is not production"

if [ "$DRY_RUN" = "1" ]; then
    log "Dry run: stopping before any change. Backup is in $BACKUP_DIR"
    exit 0
fi

confirm "Backup looks the right size. Proceed to change production?" "migrate production"

# --------------------------------------------------------------------------
# 4. Optionally hold 016 back
#
# 016 drops allowed_emails, the only destructive migration in the set. Nothing
# reads it after 010, so deferring costs nothing and keeps the backfill
# checkable against its source.
# --------------------------------------------------------------------------

DEFERRED=""
restore_deferred() {
    if [ -n "$DEFERRED" ] && [ -f "$DEFERRED" ]; then
        mv "$DEFERRED" supabase/migrations/016_drop_allowed_emails.sql
        warn "016 moved back into place (still unapplied)."
    fi
}
trap restore_deferred EXIT

if [ "$DEFER_016" = "1" ]; then
    DEFERRED="$BACKUP_DIR/016_drop_allowed_emails.sql.deferred"
    mv supabase/migrations/016_drop_allowed_emails.sql "$DEFERRED"
    log "Holding 016 back: allowed_emails will survive this run"
fi

# --------------------------------------------------------------------------
# 5. Repair the history to 000, then apply
# --------------------------------------------------------------------------

# With --include-all below, 000 would otherwise be applied as well -- it is
# "not found on remote history" like the rest. Recording it first is what keeps
# the schema snapshot from being replayed over a full database.
log "Recording 000 as applied"
npx supabase migration repair --db-url "$PROD_DB_URL" --status applied 000 \
    || fail "could not repair the migration history"

# --include-all is required, not optional.
#
# Production's history holds 46 timestamped migrations from the original
# repository (20251228014928 onward). Our files are numbered 000-020, and
# versions are compared as strings -- so every one of ours sorts before
# production's latest. Without --include-all, `db push` treats them as
# already-superseded and applies nothing at all, silently.
log "What would be applied"
npx supabase db push --db-url "$PROD_DB_URL" --include-all --dry-run 2>&1 | tee -a "$LOG"

confirm "Is that exactly 001 through 020, and nothing else?" "yes"

log "Applying 001-020"
npx supabase db push --db-url "$PROD_DB_URL" --include-all --yes 2>&1 | tee -a "$LOG" \
    || fail "migrations did not apply cleanly -- production is part way, see $LOG"

# --------------------------------------------------------------------------
# 6. Verify
# --------------------------------------------------------------------------

log "Counts after migrating"
AFTER="$BACKUP_DIR/counts-after-$STAMP.txt"
psql "$PROD_DB_URL" -At -F' ' -c "
SELECT 'genetic_inventory', count(*) FROM public.genetic_inventory
UNION ALL SELECT 'customers', count(*) FROM public.customers
UNION ALL SELECT 'sires', count(*) FROM public.sires
UNION ALL SELECT 'tanks', count(*) FROM public.tanks
UNION ALL SELECT 'canisters', count(*) FROM public.canisters
UNION ALL SELECT 'supply_inventory', count(*) FROM public.supply_inventory
UNION ALL SELECT 'employees', count(*) FROM public.employees
ORDER BY 1;" | tee "$AFTER"

if diff -q "$BEFORE" "$AFTER" >/dev/null; then
    log "Row counts are unchanged."
else
    warn "ROW COUNTS CHANGED:"
    diff "$BEFORE" "$AFTER" | tee -a "$LOG" || true
    warn "Nothing in 001-020 should delete a record. Investigate before going live."
fi

log "Workspace, owner, and billing state"
psql "$PROD_DB_URL" -c "
SELECT t.slug, t.billing_exempt, coalesce(t.subscription_status,'none') AS status,
       e.full_name AS owner
FROM public.tenants t
LEFT JOIN public.employees e ON e.tenant_id = t.id AND e.role = 'owner';" | tee -a "$LOG"

log "Anyone left without a workspace or a role"
psql "$PROD_DB_URL" -c "
SELECT count(*) FILTER (WHERE tenant_id IS NULL) AS no_workspace,
       count(*) FILTER (WHERE role IS NULL)      AS no_role
FROM public.employees;" | tee -a "$LOG"

# --------------------------------------------------------------------------
# 7. What is left for a person to do
# --------------------------------------------------------------------------

cat <<EOF | tee -a "$LOG"

Migration finished. Production is at 020$([ "$DEFER_016" = "1" ] && echo " (016 deferred)").

Backup and logs: $BACKUP_DIR

Still to do, in this order:

  1. Deploy the frontend. The old build calls an RPC that 008 just revoked,
     so signup is broken until it ships.

  2. Sign in and click around -- dashboard, inventory, a tank. Row level
     security now filters every query; this is where a missing employees row
     would show up.

  3. Run the suites against production:
       psql "\$PROD_DB_URL" -f supabase/tests/tenant_isolation.sql
       psql "\$PROD_DB_URL" -f supabase/tests/billing_and_roles.sql
     Expect 13/13 and 39/40. The one failure is the cancellation check, which
     needs a second billable tenant and correctly reports NOT RUN.

  4. Production needs its own edge functions and secrets -- they are only on
     dev today:
       npx supabase functions deploy create-checkout-session --no-verify-jwt
       npx supabase functions deploy stripe-webhook --no-verify-jwt
       npx supabase functions deploy send-invitation
       npx supabase functions deploy create-portal-session
     plus STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET,
     STRIPE_TRIAL_DAYS, RESEND_API_KEY, PUBLIC_SITE_URL.

  5. Point Stripe's webhook at production's function URL, not dev's.

The backup holds real customer data. Keep it somewhere safe and out of git.
EOF
