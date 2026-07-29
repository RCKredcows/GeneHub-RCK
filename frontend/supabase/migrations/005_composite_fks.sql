-- Multi-tenancy, part 4: make cross-tenant references structurally impossible.
--
-- RLS stops a user seeing another tenant's sire. It does not stop a row from
-- pointing at one -- policies govern access, not referential integrity. If a
-- policy is ever loosened by mistake, or a service-role script writes without
-- care, nothing today would prevent genetic_inventory in tenant A from
-- referencing a sire in tenant B.
--
-- Rewriting each foreign key to include tenant_id closes that. The database
-- itself then refuses the reference, independently of who is asking.
--
-- 002 already added the (tenant_id, id) unique constraints these depend on.
--
-- Note on ON DELETE SET NULL: a plain composite key would try to null every
-- column in the key, including tenant_id, which is NOT NULL. Postgres 15+
-- allows naming which columns to null, and Supabase runs 17.

BEGIN;

-- =====================================================
-- canisters -> tanks
-- =====================================================

ALTER TABLE public.canisters DROP CONSTRAINT IF EXISTS canisters_tank_id_fkey;
ALTER TABLE public.canisters
    ADD CONSTRAINT canisters_tank_id_fkey
    FOREIGN KEY (tenant_id, tank_id) REFERENCES public.tanks(tenant_id, id)
    ON DELETE SET NULL (tank_id);

-- =====================================================
-- genetic_inventory
-- =====================================================

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_customer_id_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_customer_id_fkey
    FOREIGN KEY (tenant_id, customer_id) REFERENCES public.customers(tenant_id, id)
    ON DELETE RESTRICT;

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_sire_id_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_sire_id_fkey
    FOREIGN KEY (tenant_id, sire_id) REFERENCES public.sires(tenant_id, id)
    ON DELETE SET NULL (sire_id);

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_tank_id_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_tank_id_fkey
    FOREIGN KEY (tenant_id, tank_id) REFERENCES public.tanks(tenant_id, id)
    ON DELETE SET NULL (tank_id);

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_canister_id_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_canister_id_fkey
    FOREIGN KEY (tenant_id, canister_id) REFERENCES public.canisters(tenant_id, id)
    ON DELETE SET NULL (canister_id);

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_created_by_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_created_by_fkey
    FOREIGN KEY (tenant_id, created_by) REFERENCES public.employees(tenant_id, id)
    ON DELETE SET NULL (created_by);

ALTER TABLE public.genetic_inventory DROP CONSTRAINT IF EXISTS genetic_inventory_updated_by_fkey;
ALTER TABLE public.genetic_inventory
    ADD CONSTRAINT genetic_inventory_updated_by_fkey
    FOREIGN KEY (tenant_id, updated_by) REFERENCES public.employees(tenant_id, id)
    ON DELETE SET NULL (updated_by);

-- =====================================================
-- sires -> customers
-- =====================================================

ALTER TABLE public.sires DROP CONSTRAINT IF EXISTS sires_customer_id_fkey;
ALTER TABLE public.sires
    ADD CONSTRAINT sires_customer_id_fkey
    FOREIGN KEY (tenant_id, customer_id) REFERENCES public.customers(tenant_id, id)
    ON DELETE RESTRICT;

-- =====================================================
-- supplies
-- =====================================================

ALTER TABLE public.supply_categories DROP CONSTRAINT IF EXISTS supply_categories_parent_id_fkey;
ALTER TABLE public.supply_categories
    ADD CONSTRAINT supply_categories_parent_id_fkey
    FOREIGN KEY (tenant_id, parent_id) REFERENCES public.supply_categories(tenant_id, id)
    ON DELETE SET NULL (parent_id);

ALTER TABLE public.supply_inventory DROP CONSTRAINT IF EXISTS supply_inventory_category_id_fkey;
ALTER TABLE public.supply_inventory
    ADD CONSTRAINT supply_inventory_category_id_fkey
    FOREIGN KEY (tenant_id, category_id) REFERENCES public.supply_categories(tenant_id, id)
    ON DELETE SET NULL (category_id);

ALTER TABLE public.supply_usage_log DROP CONSTRAINT IF EXISTS supply_usage_log_inventory_id_fkey;
ALTER TABLE public.supply_usage_log
    ADD CONSTRAINT supply_usage_log_inventory_id_fkey
    FOREIGN KEY (tenant_id, inventory_id) REFERENCES public.supply_inventory(tenant_id, id)
    ON DELETE CASCADE;

ALTER TABLE public.supply_usage_log DROP CONSTRAINT IF EXISTS supply_usage_log_used_by_fkey;
ALTER TABLE public.supply_usage_log
    ADD CONSTRAINT supply_usage_log_used_by_fkey
    FOREIGN KEY (tenant_id, used_by) REFERENCES public.employees(tenant_id, id)
    ON DELETE SET NULL (used_by);

-- =====================================================
-- nitrogen and activity
-- =====================================================

ALTER TABLE public.nitrogen_fill_history DROP CONSTRAINT IF EXISTS nitrogen_fill_history_tank_id_fkey;
ALTER TABLE public.nitrogen_fill_history
    ADD CONSTRAINT nitrogen_fill_history_tank_id_fkey
    FOREIGN KEY (tenant_id, tank_id) REFERENCES public.tanks(tenant_id, id)
    ON DELETE CASCADE;

ALTER TABLE public.nitrogen_fill_history DROP CONSTRAINT IF EXISTS nitrogen_fill_history_filled_by_fkey;
ALTER TABLE public.nitrogen_fill_history
    ADD CONSTRAINT nitrogen_fill_history_filled_by_fkey
    FOREIGN KEY (tenant_id, filled_by) REFERENCES public.employees(tenant_id, id)
    ON DELETE SET NULL (filled_by);

ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey
    FOREIGN KEY (tenant_id, user_id) REFERENCES public.employees(tenant_id, id)
    ON DELETE CASCADE;

-- Foreign keys into auth.users are left alone -- employees.id, user_settings
-- .user_id, notification_log.user_id, allowed_emails.added_by. auth.users has
-- no tenant_id, and the tenant relationship is carried by employees.

COMMIT;

-- Verify. Every one of these should now name two columns:
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE contype = 'f' AND connamespace = 'public'::regnamespace
--     AND conname NOT LIKE '%_tenant_id_fkey'
--   ORDER BY conname;
--
-- The behaviour this buys, as the table owner so RLS is not what is being
-- tested. It must fail on the foreign key:
--   INSERT INTO public.genetic_inventory
--     (tenant_id, inventory_type, owner_type, breed, quantity, original_quantity, sire_id)
--   VALUES (
--     (SELECT id FROM public.tenants WHERE slug = 'rck'),
--     'semen', 'internal', 'Charolais', 1, 1,
--     (SELECT id FROM public.sires WHERE name = 'Titan of Bar 7')
--   );
