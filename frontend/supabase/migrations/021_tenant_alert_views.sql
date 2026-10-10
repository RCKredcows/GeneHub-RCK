-- =====================================================
-- tenant_id on the alert views
--
-- v_low_nitrogen_alerts and v_low_stock_alerts were defined in 000 and never
-- redefined, so the tenant_id that 002 added to tanks and supply_inventory
-- never reached them. For the application that does not matter: 002 made both
-- views security_invoker, so RLS on the base tables already limits a signed-in
-- user to their own workspace's rows.
--
-- The notification functions are different. They read these views with the
-- service role, which bypasses RLS, so they see every workspace's alerts with
-- no way to tell them apart, and would email each user about other
-- workspaces' tanks. With tenant_id on each row, check-low-nitrogen,
-- check-low-stock and periodic-reminder can send each user only their own.
--
-- CREATE OR REPLACE VIEW may only add columns at the end, so tenant_id goes
-- last and every existing column keeps its name, type and position. Existing
-- grants survive a replace. security_invoker is restated rather than assumed.
-- =====================================================

CREATE OR REPLACE VIEW public.v_low_nitrogen_alerts
WITH (security_invoker = true) AS
SELECT
    id AS tank_id,
    tank_name,
    nitrogen_level,
    nitrogen_capacity,
    low_level_threshold,
    ROUND((nitrogen_level::numeric / NULLIF(nitrogen_capacity::numeric, 0)) * 100, 1) AS nitrogen_percentage,
    tenant_id
FROM public.tanks t
WHERE
    nitrogen_level IS NOT NULL
    AND nitrogen_capacity IS NOT NULL
    AND nitrogen_capacity > 0
    AND low_level_threshold IS NOT NULL
    AND (nitrogen_level::numeric / nitrogen_capacity::numeric) * 100 <= low_level_threshold;

CREATE OR REPLACE VIEW public.v_low_stock_alerts
WITH (security_invoker = true) AS
SELECT
    si.id AS item_id,
    si.item_name,
    si.quantity,
    si.reorder_threshold,
    sc.name AS category_name,
    si.tenant_id
FROM public.supply_inventory si
LEFT JOIN public.supply_categories sc ON si.category_id = sc.id
WHERE
    si.reorder_threshold IS NOT NULL
    AND si.reorder_threshold > 0
    AND si.quantity <= si.reorder_threshold;
