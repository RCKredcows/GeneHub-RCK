-- Rename the owner_type value 'rck' to 'internal'.
--
-- The distinction this column encodes -- "the operation owns this straw" vs
-- "a customer owns it" -- is generic. Only the value was named after the first
-- tenant. The displayed label now comes from the tenant's name instead.
--
-- Order matters: the CHECK constraints have to come off before the data can be
-- updated, because 'internal' is not yet an allowed value.

BEGIN;

-- Constraint names are Postgres defaults for inline column CHECKs, plus the
-- explicitly named table-level constraint from 000_schema.sql.
ALTER TABLE public.sires
    DROP CONSTRAINT IF EXISTS sires_owner_type_check;

ALTER TABLE public.genetic_inventory
    DROP CONSTRAINT IF EXISTS genetic_inventory_owner_type_check;

ALTER TABLE public.genetic_inventory
    DROP CONSTRAINT IF EXISTS genetic_inventory_check;

-- The default still references the old value, so it has to go before the update.
ALTER TABLE public.sires
    ALTER COLUMN owner_type DROP DEFAULT;

UPDATE public.sires
    SET owner_type = 'internal'
    WHERE owner_type = 'rck';

UPDATE public.genetic_inventory
    SET owner_type = 'internal'
    WHERE owner_type = 'rck';

ALTER TABLE public.sires
    ALTER COLUMN owner_type SET DEFAULT 'internal';

ALTER TABLE public.sires
    ADD CONSTRAINT sires_owner_type_check
    CHECK (owner_type IN ('customer', 'internal', 'unknown'));

ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_owner_type_check
    CHECK (owner_type IN ('customer', 'internal', 'unknown'));

-- Customer-owned rows must name a customer; internally owned ones must not.
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_check
    CHECK (
        ((owner_type = 'customer') AND (customer_id IS NOT NULL)) OR
        ((owner_type = 'internal') AND (customer_id IS NULL)) OR
        ((owner_type = 'unknown') AND (customer_id IS NULL))
    );

COMMIT;

-- Verification:
--   SELECT owner_type, count(*) FROM public.sires GROUP BY 1;
--   SELECT owner_type, count(*) FROM public.genetic_inventory GROUP BY 1;
-- Neither should return a row for 'rck'.
