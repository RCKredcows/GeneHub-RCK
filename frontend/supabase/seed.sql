-- Sample data for a development database.
--
-- Seeds two tenants on purpose. A single tenant cannot demonstrate isolation:
-- every query looks correct when there is nothing to leak. The second tenant
-- is what makes the RLS in 003 falsifiable.
--
-- Run this in the SQL editor, which connects as the table owner and therefore
-- bypasses RLS. That is what allows one script to write into both tenants.
--
-- Safe to re-run: it deletes its own rows first, and touches nothing else.

BEGIN;

-- =====================================================
-- TENANTS
-- =====================================================

INSERT INTO public.tenants (slug, name)
SELECT 'bar7', 'Bar 7 Cattle Co'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'bar7');

DO $$
DECLARE
    rck   UUID;
    bar7  UUID;

    -- rck
    c_willow  UUID; c_cedar UUID; c_hollis UUID;
    s_duke    UUID; s_ranger UUID; s_atlas UUID; s_kingpin UUID;
    t_north   UUID; t_south UUID;
    n1 UUID; n2 UUID; n3 UUID; s1 UUID;
    cat_straws UUID; cat_lab UUID; cat_ln2 UUID;

    -- bar7
    b_c_mesa UUID;
    b_s_titan UUID;
    b_t_main UUID;
    b_can UUID;
    b_cat UUID;
BEGIN
    SELECT id INTO rck  FROM public.tenants WHERE slug = 'rck';
    SELECT id INTO bar7 FROM public.tenants WHERE slug = 'bar7';

    -- Clear anything this script created before, children first.
    DELETE FROM public.genetic_inventory  WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.supply_usage_log   WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.supply_inventory   WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.supply_categories  WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.nitrogen_fill_history WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.canisters          WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.tanks              WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.sires              WHERE tenant_id IN (rck, bar7);
    DELETE FROM public.customers          WHERE tenant_id IN (rck, bar7);

    -- =====================================================
    -- RCK
    -- =====================================================

    INSERT INTO public.customers (tenant_id, name, phone, email, city, state, zip) VALUES
        (rck, 'Willow Creek Ranch', '555-0142', 'office@willowcreek.example', 'Bozeman',   'MT', '59715'),
        (rck, 'Cedar Ridge Cattle', '555-0187', 'randy@cedarridge.example',  'Cheyenne',  'WY', '82001'),
        (rck, 'Hollis Family Farms', '555-0119', 'dee@hollisfarms.example',  'Ardmore',   'OK', '73401');
    SELECT id INTO c_willow FROM public.customers WHERE tenant_id = rck AND name = 'Willow Creek Ranch';
    SELECT id INTO c_cedar  FROM public.customers WHERE tenant_id = rck AND name = 'Cedar Ridge Cattle';
    SELECT id INTO c_hollis FROM public.customers WHERE tenant_id = rck AND name = 'Hollis Family Farms';

    -- Internally owned sires are for sale; customer-owned ones are stored on
    -- their behalf and must name the customer.
    INSERT INTO public.sires (tenant_id, name, breed, registration_number, owner_type, customer_id, available_for_sale, price_for_semen, price_for_sexed_semen) VALUES
        (rck, 'Duke of Rockridge', 'Angus',    'AAA-19884321', 'internal', NULL,     true,  35.00, 60.00),
        (rck, 'Ranger 4820',       'Hereford', 'AHA-43920011', 'internal', NULL,     true,  28.00, NULL),
        (rck, 'Atlas Prime',       'Angus',    'AAA-20114455', 'internal', NULL,     false, NULL,  NULL),
        (rck, 'Kingpin 77',        'Simmental','ASA-33019922', 'customer', c_cedar,  false, NULL,  NULL);
    SELECT id INTO s_duke    FROM public.sires WHERE tenant_id = rck AND name = 'Duke of Rockridge';
    SELECT id INTO s_ranger  FROM public.sires WHERE tenant_id = rck AND name = 'Ranger 4820';
    SELECT id INTO s_atlas   FROM public.sires WHERE tenant_id = rck AND name = 'Atlas Prime';
    SELECT id INTO s_kingpin FROM public.sires WHERE tenant_id = rck AND name = 'Kingpin 77';

    -- low_level_threshold is a PERCENTAGE, not a level: v_low_nitrogen_alerts
    -- flags a tank when nitrogen_level / nitrogen_capacity * 100 <= threshold.
    -- Tank 1 sits at 70%, Tank 2 at 23.4%, so only Tank 2 alerts.
    INSERT INTO public.tanks (tenant_id, tank_name, location, capacity, nitrogen_level, nitrogen_capacity, low_level_threshold, last_filled_date, sort_order) VALUES
        (rck, 'Tank 1', 'Main barn, north wall', 6, 24.5, 35.0, 20.0, now() - interval '9 days',  1),
        (rck, 'Tank 2', 'Main barn, south wall', 6,  8.2, 35.0, 25.0, now() - interval '31 days', 2);
    SELECT id INTO t_north FROM public.tanks WHERE tenant_id = rck AND tank_name = 'Tank 1';
    SELECT id INTO t_south FROM public.tanks WHERE tenant_id = rck AND tank_name = 'Tank 2';

    INSERT INTO public.canisters (tenant_id, tank_id, canister_number, position_in_tank) VALUES
        (rck, t_north, 'A1', 1),
        (rck, t_north, 'A2', 2),
        (rck, t_south, 'B1', 1);
    SELECT id INTO n1 FROM public.canisters WHERE tenant_id = rck AND canister_number = 'A1';
    SELECT id INTO n2 FROM public.canisters WHERE tenant_id = rck AND canister_number = 'A2';
    SELECT id INTO n3 FROM public.canisters WHERE tenant_id = rck AND canister_number = 'B1';

    INSERT INTO public.genetic_inventory
        (tenant_id, inventory_type, owner_type, customer_id, sire_id, breed, tank_id, canister_id,
         cane_number, quantity, original_quantity, unit, sex_type, is_ivf, status, check_in_date, price_for_semen)
    VALUES
        (rck, 'semen',  'internal', NULL,     s_duke,   'Angus',     t_north, n1, 'C-101', 42, 60, 'straws', 'conventional', false, 'stored', CURRENT_DATE - 120, 35.00),
        (rck, 'semen',  'internal', NULL,     s_duke,   'Angus',     t_north, n1, 'C-102', 18, 30, 'straws', 'sexed_female', false, 'stored', CURRENT_DATE - 118, 60.00),
        (rck, 'semen',  'internal', NULL,     s_ranger, 'Hereford',  t_north, n2, 'C-110',  9, 25, 'straws', 'conventional', false, 'stored', CURRENT_DATE - 95,  28.00),
        (rck, 'semen',  'internal', NULL,     s_atlas,  'Angus',     t_south, n3, 'C-140', 55, 55, 'straws', 'conventional', false, 'stored', CURRENT_DATE - 40,  NULL),
        (rck, 'semen',  'customer', c_cedar,  s_kingpin,'Simmental', t_south, n3, 'C-141', 30, 30, 'straws', 'conventional', false, 'stored', CURRENT_DATE - 30,  NULL),
        (rck, 'embryo', 'customer', c_willow, s_duke,   'Angus',     t_north, n2, 'E-020', 12, 12, 'embryos','conventional', true,  'stored', CURRENT_DATE - 60,  NULL),
        (rck, 'embryo', 'customer', c_hollis, NULL,     'Angus',     t_south, n3, 'E-031',  6,  8, 'embryos','conventional', true,  'stored', CURRENT_DATE - 22,  NULL),
        (rck, 'semen',  'unknown',  NULL,     NULL,     'Unknown',   t_south, n3, 'C-999',  4,  4, 'straws', 'conventional', false, 'stored', CURRENT_DATE - 400, NULL),
        (rck, 'semen',  'internal', NULL,     s_ranger, 'Hereford',  t_north, n2, 'C-111',  0, 20, 'straws', 'conventional', false, 'depleted', CURRENT_DATE - 300, NULL);

    INSERT INTO public.supply_categories (tenant_id, name, description) VALUES
        (rck, 'Straws & Sheaths', 'Consumables for AI'),
        (rck, 'Lab Supplies',     'Gloves, sleeves, tips'),
        (rck, 'Liquid Nitrogen',  'LN2 and dewar consumables');
    SELECT id INTO cat_straws FROM public.supply_categories WHERE tenant_id = rck AND name = 'Straws & Sheaths';
    SELECT id INTO cat_lab    FROM public.supply_categories WHERE tenant_id = rck AND name = 'Lab Supplies';
    SELECT id INTO cat_ln2    FROM public.supply_categories WHERE tenant_id = rck AND name = 'Liquid Nitrogen';

    -- Two rows sit under their reorder threshold so the low-stock view and the
    -- notification job have something to find.
    INSERT INTO public.supply_inventory
        (tenant_id, category_id, item_name, quantity, unit, reorder_threshold, cost_per_unit, supplier_name, last_restock_date, expiration_date)
    VALUES
        (rck, cat_straws, 'AI Sheaths, universal',   40,  'each',   100, 0.22, 'Genex Supply',   CURRENT_DATE - 45, NULL),
        (rck, cat_straws, 'Straw tint markers',      12,  'each',    10, 3.10, 'Genex Supply',   CURRENT_DATE - 60, NULL),
        (rck, cat_lab,    'Nitrile gloves, L',       6,   'box',     10, 14.50,'Ranch Vet Co',   CURRENT_DATE - 20, NULL),
        (rck, cat_lab,    'OB sleeves',              22,  'box',      8, 19.00,'Ranch Vet Co',   CURRENT_DATE - 12, NULL),
        (rck, cat_ln2,    'Liquid nitrogen',        180,  'liters',  60, 1.85, 'Airgas',         CURRENT_DATE - 9,  NULL),
        (rck, cat_lab,    'Semen thaw unit filters', 3,   'each',     5, 27.00,'Ranch Vet Co',   CURRENT_DATE - 200, CURRENT_DATE + 25);

    INSERT INTO public.nitrogen_fill_history
        (tenant_id, tank_id, fill_date, amount_added, nitrogen_level_before, nitrogen_level_after, event_type, notes)
    VALUES
        (rck, t_north, now() - interval '9 days',  12.0, 14.0, 26.0, 'fill', 'Routine top-off'),
        (rck, t_south, now() - interval '31 days', 15.0, 12.0, 27.0, 'fill', 'Routine top-off'),
        (rck, t_south, now() - interval '3 days',   0.0, 10.5,  8.2, 'drop', 'Level down faster than expected, watch this one');

    -- =====================================================
    -- BAR 7 -- the isolation control group
    -- =====================================================

    INSERT INTO public.customers (tenant_id, name, phone, city, state)
        VALUES (bar7, 'Mesa Verde Livestock', '555-0777', 'Durango', 'CO');
    SELECT id INTO b_c_mesa FROM public.customers WHERE tenant_id = bar7 AND name = 'Mesa Verde Livestock';

    INSERT INTO public.sires (tenant_id, name, breed, owner_type, available_for_sale, price_for_semen)
        VALUES (bar7, 'Titan of Bar 7', 'Charolais', 'internal', true, 45.00);
    SELECT id INTO b_s_titan FROM public.sires WHERE tenant_id = bar7 AND name = 'Titan of Bar 7';

    -- Deliberately named 'Tank 1', which RCK also has. This only works because
    -- 002 changed the unique constraint to (tenant_id, tank_name).
    INSERT INTO public.tanks (tenant_id, tank_name, location, capacity, nitrogen_level, nitrogen_capacity, low_level_threshold, sort_order)
        VALUES (bar7, 'Tank 1', 'Equipment shed', 4, 30.0, 30.0, 8.0, 1);
    SELECT id INTO b_t_main FROM public.tanks WHERE tenant_id = bar7 AND tank_name = 'Tank 1';

    INSERT INTO public.canisters (tenant_id, tank_id, canister_number, position_in_tank)
        VALUES (bar7, b_t_main, 'A1', 1);
    SELECT id INTO b_can FROM public.canisters WHERE tenant_id = bar7 AND canister_number = 'A1';

    INSERT INTO public.genetic_inventory
        (tenant_id, inventory_type, owner_type, customer_id, sire_id, breed, tank_id, canister_id,
         cane_number, quantity, original_quantity, unit, sex_type, status)
    VALUES
        (bar7, 'semen', 'internal', NULL,     b_s_titan, 'Charolais', b_t_main, b_can, 'T-001', 75, 75, 'straws', 'conventional', 'stored'),
        (bar7, 'semen', 'customer', b_c_mesa, b_s_titan, 'Charolais', b_t_main, b_can, 'T-002', 20, 20, 'straws', 'conventional', 'stored');

    INSERT INTO public.supply_categories (tenant_id, name) VALUES (bar7, 'Straws & Sheaths');
    SELECT id INTO b_cat FROM public.supply_categories WHERE tenant_id = bar7 AND name = 'Straws & Sheaths';

    INSERT INTO public.supply_inventory (tenant_id, category_id, item_name, quantity, unit, reorder_threshold)
        VALUES (bar7, b_cat, 'AI Sheaths, universal', 500, 'each', 100);

    -- Invitation so a second user can actually sign in as Bar 7 and prove the
    -- isolation from the application side, not just from SQL.
    DELETE FROM public.allowed_emails WHERE email = 'daltongorham+bar7@gmail.com';
    INSERT INTO public.allowed_emails (tenant_id, email, full_name)
        VALUES (bar7, 'daltongorham+bar7@gmail.com', 'Bar 7 Test User');
END $$;

COMMIT;

-- What you should see, as the table owner (RLS bypassed):
--   SELECT t.slug, count(gi.*) FROM public.tenants t
--     LEFT JOIN public.genetic_inventory gi ON gi.tenant_id = t.id
--     GROUP BY t.slug;
--   -- rck 9, bar7 2
--
-- And the point of the exercise, signed in as an RCK user in the app:
--   genetic inventory shows 9 rows, never 11
--   tanks shows 'Tank 1' and 'Tank 2', never Bar 7's 'Tank 1'
