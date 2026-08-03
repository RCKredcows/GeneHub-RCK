# Migrating production from 000 to 020

**Production is at migration 000.** It has never had 001 through 007, so this
is not a billing upgrade — it is the entire multi-tenancy conversion followed
by the billing and roles work.

That was established by dumping production and reading it: no `tenants` table,
no `tenant_id` column anywhere, and an `owner_type` constraint still allowing
`'rck'` rather than `'internal'`. Do not assume otherwise without checking.

**Never run `supabase db reset` against production.** It drops the public
schema and replays from 000. That is what the rehearsal is for.

## What has already been proven

The full path 001 → 020 has been applied to a restored copy of production, on a
local stack, with these results:

| | |
|---|---|
| Genetic inventory | 987 rows, unchanged |
| Customers | 137, unchanged |
| Sires | 408, unchanged |
| Tanks / canisters | 16 / 130 |
| Accounts | 7 |
| Workspace created | `rck`, owned by the earliest account |
| Subscription status | `NULL` — counts as good standing, nobody locked out |

`tenant_isolation.sql` passed 13/13 and `billing_and_roles.sql` 39/40 against
that copy. The single failure is `cancelled workspace may not be written to`,
which needs a second billable tenant to cancel and correctly reports NOT RUN
rather than a false pass.

## 1. Rehearse it yourself

```bash
cp .rehearsal.env.example .rehearsal.env    # add production's password
scripts/rehearse-migration.sh
```

Production is only read. The CLI is never linked to it, so no `db push` can
reach it by accident.

Read two things in the output: the row counts before and after (identical —
nothing here deletes a record) and who ends up owning `rck`, since that person
controls billing.

## 2. Pre-flight against production

Run `supabase/tests/preflight_prod.sql` in production's SQL editor. Read-only.

Anything `BLOCKED` will make the run fail or do the wrong thing. The checks
that matter most:

- **duplicate supply category or tank names** — 002 adds unique constraints on
  `(tenant_id, name)`, which with one tenant is a unique constraint on the name
  alone. A duplicate aborts the migration. This is what broke an earlier replay.
- **orphaned inventory** — 005 hangs composite foreign keys off sires,
  customers, tanks, and canisters. A reference to a missing parent fails.
- **duplicate addresses among unused `allowed_emails`** — 010 backfills those
  into `invitations`, which has a unique index over live addresses.

## 3. Back up

```bash
cd frontend
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth -f prod-schema.sql
npx supabase db dump --db-url "$PROD_DB_URL" -s public,auth --data-only --use-copy -f prod-data.sql
```

Use the CLI, not a local `pg_dump` — Homebrew's is version 14 and refuses to
read a PostgreSQL 17 server. Check the file sizes before continuing.

## 4. Repair the history to 000

```bash
npx supabase migration repair --db-url "$PROD_DB_URL" --status applied 000
```

Without this, step 5's `--include-all` would sweep `000_schema.sql` in as well
— it is "not found on remote history" like the rest — and replay a schema
snapshot over a full database.

## 5. Apply, with --include-all

```bash
npx supabase db push --db-url "$PROD_DB_URL" --include-all --dry-run   # check the list first
npx supabase db push --db-url "$PROD_DB_URL" --include-all
```

**`--include-all` is required here, and its absence fails silently.**

Production's history already holds 46 timestamped migrations from the original
repository, from `20251228014928` to `20260226014958`. Our files are numbered
`000`–`020`, and the CLI compares versions as strings — so `'020' < '2025…'`,
and every one of ours sorts *before* production's latest. `db push` only
applies migrations that come after the last remote one, so without the flag it
finds nothing to do and says so cheerfully.

The two lineages coexist without conflict; they are simply different naming
schemes for the same history table. Worth reconciling one day, not today.

Take the app offline first. 008 revokes `create_tenant_with_owner` from `anon`
mid-run, and 003 switches on row level security across every table — a client
holding a session through that will see queries change under it.

## 6. Verify

```sql
-- Counts match what the pre-flight recorded.
SELECT count(*) FROM genetic_inventory;   -- expect 987
SELECT count(*) FROM customers;           -- expect 137
SELECT count(*) FROM sires;               -- expect 408

-- One workspace, with an owner, and it is the right person.
SELECT t.slug, e.full_name, e.role
FROM tenants t JOIN employees e ON e.tenant_id = t.id
WHERE e.role = 'owner';

-- Nobody locked out: no subscription counts as good standing.
SELECT slug, subscription_status, billing_exempt FROM tenants;
```

Then run `supabase/tests/tenant_isolation.sql` and
`supabase/tests/billing_and_roles.sql`. Both need a real email set near the top.

## Deploy the frontend in the same window

008 revokes `create_tenant_with_owner` from `anon`. Any deployed frontend still
calling that RPC breaks the moment it applies — which is exactly what happened
to the development site. The current frontend goes through Stripe checkout
instead.

## Consider deferring 016

`016_drop_allowed_emails.sql` is the only migration that destroys anything: the
record of who was invited and when. Everything else is additive, and nothing
reads that table after 010.

Holding it back a week costs nothing and leaves a way to check the backfill
against its source. Move the file out of the directory, push, then move it back
and push again once you are satisfied.

## What each risky migration actually does

**002** — the dangerous one. Adds `tenant_id` to fourteen tables, assigns every
existing row to a new `rck` tenant, then sets the column `NOT NULL`. A
half-applied 002 leaves tables with a NOT NULL column and no values.

**003** — switches on row level security everywhere. Every policy compares
`tenant_id` against `current_tenant_id()`, which reads the caller's `employees`
row. An account without one sees nothing.

**010** — replaces the signup allowlist with `invitations`, and promotes the
earliest account in each workspace to `owner`. That promotion is a guess; the
pre-flight prints who it will pick.

**015** — makes lapsed workspaces read-only. Existing workspaces have
`subscription_status = NULL`, which counts as good standing, so nothing locks
out on day one.

**016** — drops `allowed_emails`. See above.

**020** — drops the superseded `search_genetic_inventory` overload. Production
carries two; a caller that omits `status_filter` silently lands on the old one
and gets checked-out inventory alongside stored.
