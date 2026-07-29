-- =====================================================
-- GeneHub Database - Complete Schema
-- Generated from live Supabase project: xnusvnwzvinhopkwmljl
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;

-- =====================================================
-- TABLES (in dependency order)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    city TEXT,
    state TEXT,
    zip TEXT
);

CREATE TABLE IF NOT EXISTS public.sires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    registration_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    image_url TEXT,
    owner_type TEXT NOT NULL DEFAULT 'rck' CHECK (owner_type IN ('customer', 'rck', 'unknown')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    available_for_sale BOOLEAN NOT NULL DEFAULT false,
    price_for_semen NUMERIC(10, 2),
    price_for_sexed_semen NUMERIC
);

CREATE TABLE IF NOT EXISTS public.tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_name TEXT NOT NULL UNIQUE,
    location TEXT,
    capacity INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    nitrogen_level NUMERIC(5, 2),
    nitrogen_capacity NUMERIC(5, 2),
    nitrogen_unit VARCHAR(20) DEFAULT 'liters',
    last_filled_date TIMESTAMPTZ,
    low_level_threshold NUMERIC(5, 2),
    sort_order INTEGER
);

CREATE TABLE IF NOT EXISTS public.canisters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_id UUID REFERENCES public.tanks(id) ON DELETE SET NULL,
    canister_number TEXT NOT NULL,
    position_in_tank INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tank_id, canister_number)
);

CREATE TABLE IF NOT EXISTS public.genetic_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_type TEXT NOT NULL CHECK (inventory_type IN ('semen', 'embryo')),
    owner_type TEXT NOT NULL CHECK (owner_type IN ('customer', 'rck', 'unknown')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    sire_id UUID REFERENCES public.sires(id) ON DELETE SET NULL,
    breed TEXT NOT NULL,
    tank_id UUID REFERENCES public.tanks(id) ON DELETE SET NULL,
    canister_id UUID REFERENCES public.canisters(id) ON DELETE SET NULL,
    cane_number TEXT,
    quantity NUMERIC NOT NULL CHECK (quantity >= 0),
    original_quantity NUMERIC NOT NULL,
    unit TEXT DEFAULT 'straws',
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_out_date DATE,
    status TEXT DEFAULT 'stored' CHECK (status IN ('stored', 'depleted', 'checked_out')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    embryo_name TEXT,
    price_for_semen NUMERIC(10, 2),
    sex_type TEXT NOT NULL DEFAULT 'conventional' CHECK (sex_type IN ('sexed_male', 'sexed_female', 'conventional')),
    is_ivf BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT genetic_inventory_check CHECK (
        ((owner_type = 'customer') AND (customer_id IS NOT NULL)) OR
        ((owner_type = 'rck') AND (customer_id IS NULL)) OR
        ((owner_type = 'unknown') AND (customer_id IS NULL))
    )
);

CREATE TABLE IF NOT EXISTS public.supply_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    parent_id UUID REFERENCES public.supply_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.supply_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.supply_categories(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,
    reorder_threshold NUMERIC(10, 2) DEFAULT 0,
    cost_per_unit NUMERIC(10, 2),
    supplier_name TEXT,
    supplier_contact TEXT,
    last_restock_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expiration_date DATE
);

CREATE TABLE IF NOT EXISTS public.supply_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.supply_inventory(id) ON DELETE CASCADE,
    quantity_used NUMERIC(10, 2) NOT NULL CHECK (quantity_used > 0),
    used_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nitrogen_fill_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
    fill_date TIMESTAMPTZ DEFAULT now(),
    amount_added NUMERIC(5, 2) NOT NULL,
    nitrogen_level_before NUMERIC(5, 2),
    nitrogen_level_after NUMERIC(5, 2) NOT NULL,
    filled_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type VARCHAR(10) DEFAULT 'fill' CHECK (event_type IN ('fill', 'drop'))
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    dashboard_widgets JSONB DEFAULT '{
        "sections": {
            "alerts": {"order": 0, "visible": true},
            "tankStatus": {"order": 1, "visible": true},
            "medicalInventory": {"order": 2, "visible": true}
        },
        "statCards": {
            "sires": {"order": 2, "visible": true},
            "tanks": {"order": 1, "visible": true},
            "customers": {"order": 3, "visible": true},
            "geneticInventory": {"order": 0, "visible": true},
            "medicalInventory": {"order": 4, "visible": true}
        }
    }'::jsonb,
    dashboard_tank_display_count INTEGER DEFAULT 4,
    items_per_page INTEGER DEFAULT 15 CHECK (items_per_page IN (10, 15, 25, 50)),
    medical_expiration_warning_days INTEGER DEFAULT 30,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    email_notifications_enabled BOOLEAN DEFAULT true,
    notify_low_nitrogen BOOLEAN DEFAULT true,
    notify_low_medical_stock BOOLEAN DEFAULT true,
    notify_periodic_reminder BOOLEAN DEFAULT true,
    notification_email TEXT
);

CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    reference_id UUID,
    reference_name TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    email_sent_to TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    resend_message_id TEXT
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'customer', 'sire', 'tank', 'canister',
        'genetic_inventory', 'medical_inventory', 'medical_category'
    )),
    entity_id UUID NOT NULL,
    entity_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allowed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log USING btree (action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS allowed_emails_email_key ON public.allowed_emails USING btree (email);

CREATE UNIQUE INDEX IF NOT EXISTS canisters_tank_id_canister_number_key ON public.canisters USING btree (tank_id, canister_number);

CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING btree (name);

CREATE INDEX IF NOT EXISTS idx_genetic_inventory_canister_id ON public.genetic_inventory USING btree (canister_id);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_created_at ON public.genetic_inventory USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_created_by ON public.genetic_inventory USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_customer_id ON public.genetic_inventory USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_inventory_type ON public.genetic_inventory USING btree (inventory_type);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_location ON public.genetic_inventory USING btree (tank_id, canister_id);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_owner ON public.genetic_inventory USING btree (owner_type, customer_id);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_owner_type ON public.genetic_inventory USING btree (owner_type);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_sex_type ON public.genetic_inventory USING btree (sex_type);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_sire ON public.genetic_inventory USING btree (sire_id);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_status ON public.genetic_inventory USING btree (status) WHERE (status = 'stored');
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_updated_by ON public.genetic_inventory USING btree (updated_by);

CREATE INDEX IF NOT EXISTS idx_nitrogen_fill_history_fill_date ON public.nitrogen_fill_history USING btree (fill_date DESC);
CREATE INDEX IF NOT EXISTS idx_nitrogen_fill_history_filled_by ON public.nitrogen_fill_history USING btree (filled_by);
CREATE INDEX IF NOT EXISTS idx_nitrogen_fill_history_tank_id ON public.nitrogen_fill_history USING btree (tank_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_lookup ON public.notification_log USING btree (user_id, notification_type, reference_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_periodic ON public.notification_log USING btree (user_id, notification_type, sent_at) WHERE (notification_type = 'periodic_reminder');
CREATE INDEX IF NOT EXISTS idx_notification_log_resend_message_id ON public.notification_log USING btree (resend_message_id) WHERE (resend_message_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_sires_available_for_sale ON public.sires USING btree (available_for_sale) WHERE (available_for_sale = true);
CREATE INDEX IF NOT EXISTS idx_sires_created_at ON public.sires USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sires_customer_id ON public.sires USING btree (customer_id) WHERE (customer_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sires_owner_type ON public.sires USING btree (owner_type);

CREATE INDEX IF NOT EXISTS idx_supply_categories_parent ON public.supply_categories USING btree (parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS supply_categories_name_key ON public.supply_categories USING btree (name);

CREATE INDEX IF NOT EXISTS idx_supply_inventory_category_id ON public.supply_inventory USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_supply_inventory_expiration ON public.supply_inventory USING btree (expiration_date) WHERE (expiration_date IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_supply_low_stock ON public.supply_inventory USING btree (quantity, reorder_threshold) WHERE (quantity <= reorder_threshold);

CREATE INDEX IF NOT EXISTS idx_supply_usage_log_date ON public.supply_usage_log USING btree (used_at);
CREATE INDEX IF NOT EXISTS idx_supply_usage_log_inventory ON public.supply_usage_log USING btree (inventory_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_log_used_by ON public.supply_usage_log USING btree (used_by);

CREATE INDEX IF NOT EXISTS idx_tanks_sort_order ON public.tanks USING btree (sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS tanks_tank_name_key ON public.tanks USING btree (tank_name);

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_key ON public.user_settings USING btree (user_id);

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW public.customer_inventory
WITH (security_invoker = true)
AS
SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    gi.id AS inventory_id,
    gi.quantity,
    gi.tank_id,
    t.tank_name,
    gi.canister_id,
    gi.cane_number,
    gi.status,
    gi.created_at,
    gi.inventory_type,
    gi.embryo_name,
    s.name AS sire_name,
    s.breed
FROM customers c
LEFT JOIN genetic_inventory gi ON gi.customer_id = c.id
LEFT JOIN sires s ON gi.sire_id = s.id
LEFT JOIN tanks t ON gi.tank_id = t.id
ORDER BY c.name;

CREATE OR REPLACE VIEW public.v_low_nitrogen_alerts AS
SELECT
    id AS tank_id,
    tank_name,
    nitrogen_level,
    nitrogen_capacity,
    low_level_threshold,
    ROUND((nitrogen_level::numeric / NULLIF(nitrogen_capacity::numeric, 0)) * 100, 1) AS nitrogen_percentage
FROM tanks t
WHERE
    nitrogen_level IS NOT NULL
    AND nitrogen_capacity IS NOT NULL
    AND nitrogen_capacity > 0
    AND low_level_threshold IS NOT NULL
    AND (nitrogen_level::numeric / nitrogen_capacity::numeric) * 100 <= low_level_threshold;

CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT
    si.id AS item_id,
    si.item_name,
    si.quantity,
    si.reorder_threshold,
    sc.name AS category_name
FROM supply_inventory si
LEFT JOIN supply_categories sc ON si.category_id = sc.id
WHERE
    si.reorder_threshold IS NOT NULL
    AND si.reorder_threshold > 0
    AND si.quantity <= si.reorder_threshold;

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  email_allowed boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM allowed_emails ae
    WHERE LOWER(ae.email) = LOWER(NEW.email)
    AND ae.is_used = false
  ) INTO email_allowed;

  IF NOT email_allowed THEN
    RAISE EXCEPTION 'Email not authorized for signup: %', NEW.email;
  END IF;

  UPDATE allowed_emails
  SET is_used = true, used_at = now()
  WHERE LOWER(email) = LOWER(NEW.email);

  INSERT INTO public.employees (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_email_allowed(check_email text)
RETURNS TABLE(allowed boolean, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.allowed_emails ae
      WHERE LOWER(ae.email) = LOWER(check_email)
      AND ae.is_used = false
    ) as allowed,
    (
      SELECT ae.full_name FROM public.allowed_emails ae
      WHERE LOWER(ae.email) = LOWER(check_email)
      AND ae.is_used = false
    ) as full_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_email_used(used_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.allowed_emails
  SET is_used = true, used_at = now()
  WHERE LOWER(email) = LOWER(used_email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_tank_at_position(target_position integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.tanks
  SET sort_order = sort_order + 1
  WHERE sort_order >= target_position;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_tank_positions(exclude_tank_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  WITH ranked_tanks AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY sort_order ASC NULLS LAST, tank_name ASC) as new_position
    FROM public.tanks
    WHERE (exclude_tank_id IS NULL OR id != exclude_tank_id)
  )
  UPDATE public.tanks t
  SET sort_order = rt.new_position
  FROM ranked_tanks rt
  WHERE t.id = rt.id
    AND (t.sort_order IS DISTINCT FROM rt.new_position);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tank_position(tank_id uuid, new_position integer, old_position integer DEFAULT NULL::integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  conflicting_tank_id UUID;
BEGIN
  SELECT id INTO conflicting_tank_id
  FROM public.tanks
  WHERE sort_order = new_position AND id != tank_id;

  IF conflicting_tank_id IS NOT NULL AND old_position IS NOT NULL THEN
    UPDATE public.tanks SET sort_order = old_position WHERE id = conflicting_tank_id;
  END IF;

  UPDATE public.tanks SET sort_order = new_position WHERE id = tank_id;

  PERFORM public.normalize_tank_positions();
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_canister_at_position(p_tank_id uuid, target_position integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.canisters
  SET position_in_tank = position_in_tank + 1
  WHERE tank_id = p_tank_id
    AND position_in_tank >= target_position;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_canister_positions(p_tank_id uuid, exclude_canister_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  WITH ranked_canisters AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY position_in_tank ASC, canister_number ASC) as new_position
    FROM public.canisters
    WHERE tank_id = p_tank_id
      AND (exclude_canister_id IS NULL OR id != exclude_canister_id)
  )
  UPDATE public.canisters c
  SET position_in_tank = rc.new_position
  FROM ranked_canisters rc
  WHERE c.id = rc.id
    AND (c.position_in_tank IS DISTINCT FROM rc.new_position);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_canister_position(p_canister_id uuid, p_tank_id uuid, new_position integer, old_position integer DEFAULT NULL::integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  conflicting_canister_id UUID;
BEGIN
  SELECT id INTO conflicting_canister_id
  FROM public.canisters
  WHERE tank_id = p_tank_id
    AND position_in_tank = new_position
    AND id != p_canister_id;

  IF conflicting_canister_id IS NOT NULL AND old_position IS NOT NULL THEN
    UPDATE public.canisters SET position_in_tank = old_position WHERE id = conflicting_canister_id;
  END IF;

  UPDATE public.canisters SET position_in_tank = new_position WHERE id = p_canister_id;

  PERFORM public.normalize_canister_positions(p_tank_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_genetic_inventory(
    search_term text DEFAULT NULL::text,
    owner_filter text DEFAULT NULL::text,
    type_filter text DEFAULT NULL::text,
    sex_filter text DEFAULT NULL::text,
    ivf_filter text DEFAULT 'all'::text,
    status_filter text DEFAULT 'stored'::text,
    page_limit integer DEFAULT 25,
    page_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid, inventory_type text, owner_type text, customer_id uuid, sire_id uuid,
    breed text, tank_id uuid, canister_id uuid, cane_number text, quantity numeric,
    original_quantity numeric, unit text, check_in_date date, check_out_date date,
    status text, notes text, created_at timestamptz, updated_at timestamptz,
    created_by uuid, updated_by uuid, embryo_name text, price_for_semen numeric,
    sex_type text, is_ivf boolean, sire_name text, sire_breed text, customer_name text,
    tank_name text, canister_number text, total_count bigint
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    gi.id, gi.inventory_type, gi.owner_type, gi.customer_id, gi.sire_id,
    gi.breed, gi.tank_id, gi.canister_id, gi.cane_number, gi.quantity,
    gi.original_quantity, gi.unit, gi.check_in_date, gi.check_out_date,
    gi.status, gi.notes, gi.created_at, gi.updated_at,
    gi.created_by, gi.updated_by, gi.embryo_name, gi.price_for_semen,
    gi.sex_type, gi.is_ivf,
    s.name as sire_name, s.breed as sire_breed,
    c.name as customer_name,
    t.tank_name,
    can.canister_number,
    COUNT(*) OVER() as total_count
  FROM public.genetic_inventory gi
  LEFT JOIN public.sires s ON gi.sire_id = s.id
  LEFT JOIN public.customers c ON gi.customer_id = c.id
  LEFT JOIN public.tanks t ON gi.tank_id = t.id
  LEFT JOIN public.canisters can ON gi.canister_id = can.id
  WHERE
    (search_term IS NULL OR search_term = '' OR
      gi.breed ILIKE '%' || search_term || '%' OR
      gi.embryo_name ILIKE '%' || search_term || '%' OR
      gi.cane_number ILIKE '%' || search_term || '%' OR
      s.name ILIKE '%' || search_term || '%' OR
      c.name ILIKE '%' || search_term || '%' OR
      t.tank_name ILIKE '%' || search_term || '%')
    AND (owner_filter IS NULL OR owner_filter = 'all' OR gi.owner_type = owner_filter)
    AND (type_filter IS NULL OR type_filter = 'all' OR gi.inventory_type = type_filter)
    AND (sex_filter IS NULL OR sex_filter = 'all' OR gi.sex_type = sex_filter)
    AND (ivf_filter IS NULL OR ivf_filter = 'all' OR
         (ivf_filter = 'ivf' AND gi.inventory_type = 'embryo' AND gi.is_ivf = true) OR
         (ivf_filter = 'not_ivf' AND gi.inventory_type = 'embryo' AND gi.is_ivf = false))
    AND (status_filter IS NULL OR status_filter = 'all' OR gi.status = status_filter)
  ORDER BY gi.created_at DESC
  LIMIT page_limit OFFSET page_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_customers(
    search_term text DEFAULT NULL::text,
    sort_field text DEFAULT 'name'::text,
    sort_ascending boolean DEFAULT true,
    page_limit integer DEFAULT 25,
    page_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid, name text, email text, phone text, address text, notes text,
    created_at timestamptz, updated_at timestamptz,
    inventory_count bigint, total_count bigint
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  WITH customer_inv AS (
    SELECT
      gi.customer_id,
      SUM(gi.quantity) as item_count,
      STRING_AGG(DISTINCT s.name, ' ') as sire_names,
      STRING_AGG(DISTINCT gi.breed, ' ') as breeds
    FROM public.genetic_inventory gi
    LEFT JOIN public.sires s ON gi.sire_id = s.id
    WHERE gi.owner_type = 'customer' AND gi.status = 'stored'
    GROUP BY gi.customer_id
  )
  SELECT
    c.id, c.name, c.email, c.phone, c.address, c.notes,
    c.created_at, c.updated_at,
    COALESCE(inv.item_count, 0)::BIGINT as inventory_count,
    COUNT(*) OVER() as total_count
  FROM public.customers c
  LEFT JOIN customer_inv inv ON c.id = inv.customer_id
  WHERE
    (search_term IS NULL OR search_term = '' OR
      c.name ILIKE '%' || search_term || '%' OR
      c.email ILIKE '%' || search_term || '%' OR
      c.phone ILIKE '%' || search_term || '%' OR
      inv.sire_names ILIKE '%' || search_term || '%' OR
      inv.breeds ILIKE '%' || search_term || '%')
  ORDER BY
    CASE WHEN sort_field = 'name' AND sort_ascending THEN c.name END ASC,
    CASE WHEN sort_field = 'name' AND NOT sort_ascending THEN c.name END DESC,
    CASE WHEN sort_field = 'items' AND sort_ascending THEN COALESCE(inv.item_count, 0) END ASC,
    CASE WHEN sort_field = 'items' AND NOT sort_ascending THEN COALESCE(inv.item_count, 0) END DESC,
    CASE WHEN sort_field = 'created_at' AND sort_ascending THEN c.created_at END ASC,
    CASE WHEN sort_field = 'created_at' AND NOT sort_ascending THEN c.created_at END DESC,
    c.name ASC
  LIMIT page_limit OFFSET page_offset;
END;
$function$;

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canisters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetic_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nitrogen_fill_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- employees
CREATE POLICY "Authenticated users can manage employees"
ON public.employees AS PERMISSIVE FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- customers
CREATE POLICY "Authenticated employees can manage customers"
ON public.customers AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- sires
CREATE POLICY "Authenticated employees can manage sires"
ON public.sires AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- tanks
CREATE POLICY "Authenticated employees can manage tanks"
ON public.tanks AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- canisters
CREATE POLICY "Authenticated employees can manage canisters"
ON public.canisters AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- genetic_inventory
CREATE POLICY "Authenticated employees can manage genetic inventory"
ON public.genetic_inventory AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- supply_categories
CREATE POLICY "Authenticated employees can manage supply categories"
ON public.supply_categories AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- supply_inventory
CREATE POLICY "Authenticated employees can manage supply inventory"
ON public.supply_inventory AS PERMISSIVE FOR ALL TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- supply_usage_log
CREATE POLICY "Authenticated employees can manage supply usage log"
ON public.supply_usage_log AS PERMISSIVE FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- nitrogen_fill_history
CREATE POLICY "Enable read access for authenticated users"
ON public.nitrogen_fill_history AS PERMISSIVE FOR SELECT TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
ON public.nitrogen_fill_history AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
ON public.nitrogen_fill_history AS PERMISSIVE FOR DELETE TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- user_settings
CREATE POLICY "Users can view own settings"
ON public.user_settings AS PERMISSIVE FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own settings"
ON public.user_settings AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings AS PERMISSIVE FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- notification_log
CREATE POLICY "Users can view own notification log"
ON public.notification_log AS PERMISSIVE FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- activity_log
CREATE POLICY "Authenticated employees can view activity log"
ON public.activity_log AS PERMISSIVE FOR SELECT TO public
USING ((auth.role() = 'authenticated'));

CREATE POLICY "Authenticated employees can log activity"
ON public.activity_log AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((auth.role() = 'authenticated'));

-- allowed_emails
CREATE POLICY "Anyone can check if email is allowed"
ON public.allowed_emails AS PERMISSIVE FOR SELECT TO anon
USING (true);

CREATE POLICY "Authenticated users can view allowed emails"
ON public.allowed_emails AS PERMISSIVE FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can add allowed emails"
ON public.allowed_emails AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update allowed emails"
ON public.allowed_emails AS PERMISSIVE FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete allowed emails"
ON public.allowed_emails AS PERMISSIVE FOR DELETE TO authenticated
USING (true);

-- =====================================================
-- CRON JOBS
-- =====================================================

-- Clean up activity log entries older than 30 days (runs daily at 3 AM UTC)
SELECT cron.schedule(
    'cleanup-activity-log',
    '0 3 * * *',
    $$DELETE FROM public.activity_log WHERE created_at < NOW() - INTERVAL '30 days';$$
);

-- NOTE: Edge function cron jobs (check-low-nitrogen, check-low-stock, periodic-reminder)
-- must be configured manually after deploying to a new project, as they contain
-- project-specific URLs. Set them up in the Supabase Dashboard > Database > Cron Jobs.
