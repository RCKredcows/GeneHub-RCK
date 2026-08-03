-- Pre-flight for migrating production from 000 to 020.
--
-- Production is at 000: the original single-operation schema. It has never had
-- 001 through 007, so this is not a billing upgrade -- it is the whole
-- multi-tenancy conversion followed by the billing work.
--
-- Confirmed by dumping production and inspecting it: no `tenants` table, no
-- `tenant_id` column anywhere, and an owner_type constraint still allowing
-- 'rck' rather than 'internal'.
--
-- Read-only. Runs no DDL, changes nothing, safe to run as often as you like.
-- Run it in the target project's SQL editor.
--
-- READY   satisfied.
-- BLOCKED fix before migrating; the run will fail or do the wrong thing.
-- REVIEW  will not fail, but look at the number and decide if it is expected.

BEGIN;

CREATE TEMP TABLE _pre (
    seq    SERIAL,
    status TEXT,
    check_name TEXT,
    detail TEXT
);

-- =====================================================
-- 1. IS THIS DATABASE WHERE WE THINK IT IS?
--
-- Everything below assumes a database at 000. If any of these are already
-- present, this database is further along and the plan needs rethinking
-- rather than following.
-- =====================================================

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'database is at 000 (multi-tenancy not yet applied)',
    CASE WHEN count(*) = 0 THEN 'no tenants table, as expected'
         ELSE 'tenants table already exists -- this database is past 002' END
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'tenants';

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no tenant_id columns yet',
    CASE WHEN count(*) = 0 THEN 'none'
         ELSE count(*) || ' tables already carry tenant_id' END
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'tenant_id';

-- 001 rewrites owner_type 'rck' to 'internal'. Seeing 'internal' already
-- would mean 001 ran and the constraint is out of step with the data.
INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) FILTER (WHERE owner_type = 'internal') = 0
         THEN 'READY' ELSE 'REVIEW' END,
    'owner_type still uses the pre-001 values',
    'rck ' || count(*) FILTER (WHERE owner_type = 'rck') ||
    ', customer ' || count(*) FILTER (WHERE owner_type = 'customer') ||
    ', unknown ' || count(*) FILTER (WHERE owner_type = 'unknown') ||
    ', internal ' || count(*) FILTER (WHERE owner_type = 'internal')
FROM public.genetic_inventory;

-- =====================================================
-- 2. MIGRATION HISTORY
--
-- If empty, the CLI does not know 000 was applied and will try to replay it
-- against a full database. Repair it to 000 first -- and only to 000.
-- =====================================================

-- Guarded: the schema only exists once the Supabase CLI has been used against
-- this database. On a project that has only ever been managed by hand it is
-- absent, and referencing it would abort the transaction and produce no report
-- at all -- the least useful thing a pre-flight can do.
DO $$
BEGIN
    IF to_regclass('supabase_migrations.schema_migrations') IS NULL THEN
        INSERT INTO _pre (status, check_name, detail)
        VALUES ('REVIEW', 'migration history records 000 and nothing else',
                'no history table yet; `migration repair --status applied 000` creates it');
        RETURN;
    END IF;

    EXECUTE $q$
        INSERT INTO _pre (status, check_name, detail)
        SELECT
            CASE WHEN count(*) = 1 THEN 'READY' ELSE 'REVIEW' END,
            'migration history records 000 and nothing else',
            CASE
                WHEN count(*) = 0 THEN 'EMPTY: run `supabase migration repair --status applied 000`'
                ELSE count(*) || ' recorded: ' ||
                     coalesce((SELECT string_agg(version, ', ' ORDER BY version)
                               FROM supabase_migrations.schema_migrations), '-')
            END
        FROM supabase_migrations.schema_migrations
    $q$;
END $$;

-- =====================================================
-- 3. WHAT 002 WILL DO, AND WHETHER IT CAN
--
-- 002 is the dangerous one. It adds tenant_id to fourteen tables, assigns
-- every existing row to a single new `rck` tenant, then sets the column NOT
-- NULL. A half-applied 002 leaves tables with a NOT NULL column and no values.
-- =====================================================

INSERT INTO _pre (status, check_name, detail)
SELECT 'REVIEW', 'rows that will be assigned to the rck workspace',
       'inventory ' || (SELECT count(*) FROM public.genetic_inventory) ||
       ', customers ' || (SELECT count(*) FROM public.customers) ||
       ', sires ' || (SELECT count(*) FROM public.sires) ||
       ', tanks ' || (SELECT count(*) FROM public.tanks) ||
       ', canisters ' || (SELECT count(*) FROM public.canisters) ||
       ', supplies ' || (SELECT count(*) FROM public.supply_inventory) ||
       ', accounts ' || (SELECT count(*) FROM public.employees);

-- 002 seeds the rck tenant itself. An existing slug conflict cannot happen at
-- 000 because there is no tenants table, but the accounts have to exist for
-- anyone to own the result.
INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) > 0 THEN 'READY' ELSE 'BLOCKED' END,
    'there is at least one account to become owner',
    count(*) || ' accounts; the earliest becomes owner of rck'
FROM public.employees;

INSERT INTO _pre (status, check_name, detail)
SELECT 'REVIEW', 'who will own the rck workspace',
       coalesce(
           (SELECT e.full_name || ' (' || coalesce(u.email, 'no email') || ')'
            FROM public.employees e
            LEFT JOIN auth.users u ON u.id = e.id
            ORDER BY e.created_at NULLS LAST, e.id
            LIMIT 1),
           'NOBODY');

-- =====================================================
-- 4. WHAT 010 WILL CARRY OVER
--
-- 010 backfills unused allowed_emails rows into invitations, which carries a
-- unique index over live addresses. Two unused rows sharing an address and the
-- backfill aborts, taking the migration with it.
-- =====================================================

-- Guarded: allowed_emails is dropped by 016, so a database that has already
-- migrated has no such table. Referencing it directly would abort the
-- transaction and produce no report at all -- the least useful thing a
-- pre-flight can do.
DO $$
BEGIN
    IF to_regclass('public.allowed_emails') IS NULL THEN
        INSERT INTO _pre (status, check_name, detail)
        VALUES ('REVIEW', 'allowed_emails backfill',
                'not applicable: table absent, so 010 and 016 have already run');
        RETURN;
    END IF;

    EXECUTE $q$
        INSERT INTO _pre (status, check_name, detail)
        SELECT
            CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
            'no duplicate addresses among unused invitations',
            CASE WHEN count(*) = 0 THEN 'none'
                 ELSE count(*) || ' duplicated: ' || string_agg(email, ', ') END
        FROM (
            SELECT lower(email) AS email
            FROM public.allowed_emails
            WHERE is_used IS NOT TRUE
            GROUP BY lower(email)
            HAVING count(*) > 1
        ) d
    $q$;

    EXECUTE $q$
        INSERT INTO _pre (status, check_name, detail)
        SELECT 'REVIEW', 'invitations to be carried over',
               count(*) || ' unused allowed_emails rows become pending invitations'
        FROM public.allowed_emails WHERE is_used IS NOT TRUE
    $q$;
END $$;

-- =====================================================
-- 5. WHAT 020 WILL DROP
-- =====================================================

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 2 THEN 'READY'
         WHEN count(*) = 1 THEN 'REVIEW'
         ELSE 'BLOCKED' END,
    'search_genetic_inventory overloads',
    count(*) || ' present; 020 drops the one without status_filter'
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'search_genetic_inventory';

-- =====================================================
-- 6. THINGS THAT WOULD BREAK THE CONVERSION
-- =====================================================

-- 005 hangs composite foreign keys off these, which needs the parent rows to
-- be intact. An orphan reference fails the constraint.
INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no inventory pointing at a missing sire',
    count(*) || ' orphaned'
FROM public.genetic_inventory gi
WHERE gi.sire_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.sires s WHERE s.id = gi.sire_id);

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no inventory pointing at a missing customer',
    count(*) || ' orphaned'
FROM public.genetic_inventory gi
WHERE gi.customer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = gi.customer_id);

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no inventory pointing at a missing tank or canister',
    count(*) || ' orphaned'
FROM public.genetic_inventory gi
WHERE (gi.tank_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = gi.tank_id))
   OR (gi.canister_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.canisters c WHERE c.id = gi.canister_id));

-- 002 adds a unique constraint on (tenant_id, name) for these. With one
-- tenant that is effectively a unique constraint on name, and duplicates
-- would fail it. This is what broke an earlier replay attempt.
INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no duplicate supply category names',
    CASE WHEN count(*) = 0 THEN 'none'
         ELSE count(*) || ' duplicated: ' || string_agg(name, ', ') END
FROM (
    SELECT name FROM public.supply_categories
    GROUP BY name HAVING count(*) > 1
) d;

INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'BLOCKED' END,
    'no duplicate tank names',
    CASE WHEN count(*) = 0 THEN 'none'
         ELSE count(*) || ' duplicated: ' || string_agg(tank_name, ', ') END
FROM (
    SELECT tank_name FROM public.tanks
    GROUP BY tank_name HAVING count(*) > 1
) d;

-- Every employee needs an auth account: 002 makes employees.tenant_id NOT NULL
-- and later migrations join through auth.users.
INSERT INTO _pre (status, check_name, detail)
SELECT
    CASE WHEN count(*) = 0 THEN 'READY' ELSE 'REVIEW' END,
    'every account has a matching auth user',
    count(*) || ' employees with no auth.users row'
FROM public.employees e
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = e.id);

-- =====================================================
-- REPORT
-- =====================================================

SELECT status, check_name, detail
FROM _pre
ORDER BY CASE status WHEN 'BLOCKED' THEN 0 WHEN 'REVIEW' THEN 1 ELSE 2 END, seq;

ROLLBACK;
