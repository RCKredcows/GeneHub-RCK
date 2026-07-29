-- Composite foreign key checks for migration 005.
--
-- Runs as the table owner, deliberately. RLS is not what is being tested here:
-- the point is that the database refuses a cross-tenant reference even for a
-- caller that every policy would allow. If these pass as owner, they pass for
-- everyone.
--
-- Assumes seed.sql has been run, so both tenants exist with data.
--
-- Everything is inside a transaction that rolls back. Nothing is persisted.

BEGIN;

CREATE TEMP TABLE _results (
    seq        SERIAL,
    check_name TEXT,
    pass       BOOLEAN,
    detail     TEXT
);

CREATE TEMP TABLE _ids AS
SELECT
    (SELECT id FROM public.tenants WHERE slug = 'rck')  AS rck,
    (SELECT id FROM public.tenants WHERE slug = 'bar7') AS bar7,
    (SELECT id FROM public.sires     WHERE name = 'Titan of Bar 7')        AS bar7_sire,
    (SELECT id FROM public.customers WHERE name = 'Mesa Verde Livestock')  AS bar7_customer,
    (SELECT id FROM public.tanks     WHERE tank_name = 'Tank 1' AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'bar7')) AS bar7_tank,
    (SELECT id FROM public.sires     WHERE name = 'Duke of Rockridge')     AS rck_sire,
    (SELECT id FROM public.tanks     WHERE tank_name = 'Tank 2' AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'rck'))  AS rck_tank,
    (SELECT id FROM public.customers WHERE name = 'Cedar Ridge Cattle')    AS rck_customer;

-- --- Structure -------------------------------------------------------------

-- Every foreign key between tenant-owned tables should now name two columns.
-- The ones pointing at tenants itself, or into auth.users, stay single-column.
INSERT INTO _results (check_name, pass, detail)
SELECT 'all cross-table FKs are composite',
       count(*) FILTER (WHERE array_length(conkey, 1) <> 2) = 0,
       count(*) FILTER (WHERE array_length(conkey, 1) = 2) || ' composite, '
         || count(*) FILTER (WHERE array_length(conkey, 1) <> 2) || ' single'
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND conname NOT LIKE '%\_tenant\_id\_fkey'
  AND confrelid::regclass::text NOT LIKE 'auth.%'
  AND confrelid <> 'public.tenants'::regclass;

-- List any that were missed, so a failure above says which.
INSERT INTO _results (check_name, pass, detail)
SELECT 'single-column FK: ' || conname, false, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND conname NOT LIKE '%\_tenant\_id\_fkey'
  AND confrelid::regclass::text NOT LIKE 'auth.%'
  AND confrelid <> 'public.tenants'::regclass
  AND array_length(conkey, 1) <> 2;

-- --- Cross-tenant references must be refused --------------------------------

DO $$
DECLARE i RECORD;
BEGIN
    SELECT * INTO i FROM _ids;

    -- RCK inventory pointing at a Bar 7 sire.
    BEGIN
        INSERT INTO public.genetic_inventory
            (tenant_id, inventory_type, owner_type, breed, quantity, original_quantity, sire_id)
        VALUES (i.rck, 'semen', 'internal', 'Charolais', 1, 1, i.bar7_sire);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('inventory cannot reference other tenant sire', false, 'ACCEPTED -- constraint missing');
    EXCEPTION WHEN foreign_key_violation THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('inventory cannot reference other tenant sire', true, 'rejected by FK');
    END;

    -- RCK inventory stored in a Bar 7 tank.
    BEGIN
        INSERT INTO public.genetic_inventory
            (tenant_id, inventory_type, owner_type, breed, quantity, original_quantity, tank_id)
        VALUES (i.rck, 'semen', 'internal', 'Angus', 1, 1, i.bar7_tank);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('inventory cannot reference other tenant tank', false, 'ACCEPTED -- constraint missing');
    EXCEPTION WHEN foreign_key_violation THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('inventory cannot reference other tenant tank', true, 'rejected by FK');
    END;

    -- An RCK sire owned by a Bar 7 customer.
    BEGIN
        INSERT INTO public.sires (tenant_id, name, breed, owner_type, customer_id)
        VALUES (i.rck, 'probe-cross-sire', 'Angus', 'customer', i.bar7_customer);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('sire cannot reference other tenant customer', false, 'ACCEPTED -- constraint missing');
    EXCEPTION WHEN foreign_key_violation THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('sire cannot reference other tenant customer', true, 'rejected by FK');
    END;

    -- A Bar 7 canister in an RCK tank.
    BEGIN
        INSERT INTO public.canisters (tenant_id, tank_id, canister_number, position_in_tank)
        VALUES (i.bar7, i.rck_tank, 'X9', 9);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('canister cannot reference other tenant tank', false, 'ACCEPTED -- constraint missing');
    EXCEPTION WHEN foreign_key_violation THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('canister cannot reference other tenant tank', true, 'rejected by FK');
    END;
END $$;

-- --- Same-tenant references must still work ---------------------------------

DO $$
DECLARE i RECORD;
BEGIN
    SELECT * INTO i FROM _ids;
    BEGIN
        INSERT INTO public.genetic_inventory
            (tenant_id, inventory_type, owner_type, breed, quantity, original_quantity, sire_id, tank_id)
        VALUES (i.rck, 'semen', 'internal', 'Angus', 5, 5, i.rck_sire, i.rck_tank);
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('same-tenant reference still accepted', true, 'inserted');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('same-tenant reference still accepted', false, 'REJECTED: ' || SQLERRM);
    END;
END $$;

-- --- Delete behaviour -------------------------------------------------------

-- ON DELETE SET NULL must null only the referencing column. If it tried to
-- null tenant_id as well, this would fail the NOT NULL constraint instead.
DO $$
DECLARE
    i        RECORD;
    survivor UUID;
    kept     UUID;
BEGIN
    SELECT * INTO i FROM _ids;

    SELECT id INTO survivor FROM public.genetic_inventory
    WHERE tenant_id = i.rck AND tank_id = i.rck_tank LIMIT 1;

    BEGIN
        DELETE FROM public.canisters WHERE tenant_id = i.rck AND tank_id = i.rck_tank;
        DELETE FROM public.tanks WHERE id = i.rck_tank;

        SELECT tenant_id INTO kept FROM public.genetic_inventory WHERE id = survivor;

        INSERT INTO _results (check_name, pass, detail)
        SELECT 'SET NULL keeps tenant_id intact',
               tank_id IS NULL AND tenant_id = i.rck,
               'tank_id ' || coalesce(tank_id::text, 'NULL') || ', tenant_id ' || coalesce(kept::text, 'NULL')
        FROM public.genetic_inventory WHERE id = survivor;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('SET NULL keeps tenant_id intact', false, 'DELETE FAILED: ' || SQLERRM);
    END;
END $$;

-- ON DELETE RESTRICT must still block deleting a customer that owns inventory.
DO $$
DECLARE i RECORD;
BEGIN
    SELECT * INTO i FROM _ids;
    BEGIN
        DELETE FROM public.customers WHERE id = i.rck_customer;
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('RESTRICT still blocks customer delete', false, 'DELETE SUCCEEDED');
    EXCEPTION WHEN foreign_key_violation THEN
        INSERT INTO _results (check_name, pass, detail)
            VALUES ('RESTRICT still blocks customer delete', true, 'blocked by FK');
    END;
END $$;

-- --- Report -----------------------------------------------------------------

SELECT
    CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result,
    check_name,
    detail
FROM _results
ORDER BY pass, seq;

ROLLBACK;
