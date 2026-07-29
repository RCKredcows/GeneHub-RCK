-- Tenant isolation checks.
--
-- Runs as an impersonated application user rather than the table owner, which
-- is the only way to exercise row level security -- the SQL editor normally
-- connects as owner and bypasses every policy.
--
-- auth.uid() reads request.jwt.claims, so setting that and switching to the
-- authenticated role reproduces what the browser gets.
--
-- Results are collected into one table and returned by the final statement,
-- because the SQL editor only displays the last result set.
--
-- Everything is inside a transaction that rolls back. Nothing is persisted.
--
-- Set the email below to your RCK user. Expected counts are measured from the
-- data at run time, so working in the app does not cause false failures.

BEGIN;

-- Expected counts are measured here, as owner, rather than hardcoded. Creating
-- records in the app then stops producing false failures, and the assertion
-- becomes "you see exactly your tenant's rows" rather than "you see nine".
CREATE TEMP TABLE _ids AS
SELECT
    (SELECT id FROM public.tenants WHERE slug = 'rck')  AS rck,
    (SELECT id FROM public.tenants WHERE slug = 'bar7') AS bar7,
    (SELECT id FROM auth.users WHERE email = 'daltongorham@gmail.com') AS uid,
    (SELECT count(*) FROM public.genetic_inventory WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'rck')) AS n_inv,
    (SELECT count(*) FROM public.customers         WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'rck')) AS n_cust,
    (SELECT count(*) FROM public.tanks             WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'rck')) AS n_tank,
    (SELECT count(*) FROM public.sires             WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'rck')) AS n_sire,
    (SELECT count(*) FROM public.genetic_inventory) AS n_inv_all,
    (SELECT count(*) FROM public.customers)         AS n_cust_all,
    (SELECT count(*) FROM public.tanks)             AS n_tank_all,
    (SELECT count(*) FROM public.sires)             AS n_sire_all;

CREATE TEMP TABLE _results (
    seq    SERIAL,
    check_name TEXT,
    pass   BOOLEAN,
    detail TEXT
);

-- Both belong to postgres; the impersonated role needs access. They hold only
-- ids and check results, and disappear with the transaction.
GRANT SELECT ON _ids TO authenticated;
GRANT SELECT, INSERT ON _results TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE _results_seq_seq TO authenticated;

SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', (SELECT uid FROM _ids), 'role', 'authenticated')::text,
    true
);
SET LOCAL ROLE authenticated;

-- --- Reads -----------------------------------------------------------------

INSERT INTO _results (check_name, pass, detail)
SELECT 'current_tenant_id resolves to rck',
       public.current_tenant_id() = (SELECT rck FROM _ids),
       coalesce(public.current_tenant_id()::text, 'NULL');

INSERT INTO _results (check_name, pass, detail)
SELECT 'tenants: sees only own', count(*) = 1, count(*) || ' rows' FROM public.tenants;

INSERT INTO _results (check_name, pass, detail)
SELECT 'genetic_inventory scoped',
       count(*) = (SELECT n_inv FROM _ids),
       count(*) || ' visible, ' || (SELECT n_inv FROM _ids) || ' owned, ' || (SELECT n_inv_all FROM _ids) || ' total'
FROM public.genetic_inventory;

INSERT INTO _results (check_name, pass, detail)
SELECT 'customers scoped',
       count(*) = (SELECT n_cust FROM _ids),
       count(*) || ' visible, ' || (SELECT n_cust FROM _ids) || ' owned, ' || (SELECT n_cust_all FROM _ids) || ' total'
FROM public.customers;

INSERT INTO _results (check_name, pass, detail)
SELECT 'tanks scoped',
       count(*) = (SELECT n_tank FROM _ids),
       count(*) || ' visible, ' || (SELECT n_tank FROM _ids) || ' owned, ' || (SELECT n_tank_all FROM _ids) || ' total'
FROM public.tanks;

INSERT INTO _results (check_name, pass, detail)
SELECT 'sires scoped',
       count(*) = (SELECT n_sire FROM _ids),
       count(*) || ' visible, ' || (SELECT n_sire FROM _ids) || ' owned, ' || (SELECT n_sire_all FROM _ids) || ' total'
FROM public.sires;

-- Views. LEFT JOIN on purpose: a leaked row fails to match the RLS-filtered
-- base table and surfaces as NULL, rather than quietly vanishing from an
-- inner join and making a broken view look clean.
INSERT INTO _results (check_name, pass, detail)
SELECT 'v_low_stock_alerts scoped',
       count(*) FILTER (WHERE si.tenant_id IS DISTINCT FROM (SELECT rck FROM _ids)) = 0,
       count(*) || ' rows visible'
FROM public.v_low_stock_alerts v
LEFT JOIN public.supply_inventory si ON si.id = v.item_id;

INSERT INTO _results (check_name, pass, detail)
SELECT 'v_low_nitrogen_alerts scoped',
       count(*) FILTER (WHERE t.tenant_id IS DISTINCT FROM (SELECT rck FROM _ids)) = 0,
       count(*) || ' rows visible'
FROM public.v_low_nitrogen_alerts v
LEFT JOIN public.tanks t ON t.id = v.tank_id;

-- This view is FROM customers LEFT JOIN genetic_inventory, so a customer with
-- no inventory produces a row whose inventory_id is NULL. Those are legitimate
-- and must be excluded, or they look like leaks.
INSERT INTO _results (check_name, pass, detail)
SELECT 'customer_inventory scoped',
       count(*) FILTER (
           WHERE v.inventory_id IS NOT NULL
             AND gi.tenant_id IS DISTINCT FROM (SELECT rck FROM _ids)
       ) = 0,
       count(*) FILTER (WHERE v.inventory_id IS NOT NULL) || ' with inventory, '
         || count(*) FILTER (WHERE v.inventory_id IS NULL) || ' without'
FROM public.customer_inventory v
LEFT JOIN public.genetic_inventory gi ON gi.id = v.inventory_id;

-- --- Writes ----------------------------------------------------------------

INSERT INTO public.customers (name) VALUES ('probe-default');

INSERT INTO _results (check_name, pass, detail)
SELECT 'insert defaults to own tenant',
       tenant_id = (SELECT rck FROM _ids),
       tenant_id::text
FROM public.customers WHERE name = 'probe-default';

-- The one that matters.
DO $$
DECLARE
    other UUID;
BEGIN
    SELECT bar7 INTO other FROM _ids;
    BEGIN
        INSERT INTO public.customers (name, tenant_id) VALUES ('probe-cross', other);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('cross-tenant insert rejected', false, 'INSERT SUCCEEDED -- isolation is broken');
    EXCEPTION
        WHEN insufficient_privilege THEN
            INSERT INTO _results (check_name, pass, detail)
                VALUES ('cross-tenant insert rejected', true, 'rejected by RLS check');
        WHEN OTHERS THEN
            INSERT INTO _results (check_name, pass, detail)
                VALUES ('cross-tenant insert rejected', true, 'rejected: ' || SQLSTATE);
    END;
END $$;

-- RLS hides other tenants' rows rather than erroring, so these must affect
-- zero rows. A non-zero count is isolation failing in the quietest way.
WITH updated AS (
    UPDATE public.customers SET name = 'hijacked'
    WHERE tenant_id = (SELECT bar7 FROM _ids)
    RETURNING 1
)
INSERT INTO _results (check_name, pass, detail)
SELECT 'cross-tenant update affects nothing', count(*) = 0, count(*) || ' rows' FROM updated;

WITH deleted AS (
    DELETE FROM public.customers
    WHERE tenant_id = (SELECT bar7 FROM _ids)
    RETURNING 1
)
INSERT INTO _results (check_name, pass, detail)
SELECT 'cross-tenant delete affects nothing', count(*) = 0, count(*) || ' rows' FROM deleted;

-- --- Report ----------------------------------------------------------------

SELECT
    CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result,
    check_name,
    detail
FROM _results
ORDER BY pass, seq;

ROLLBACK;
