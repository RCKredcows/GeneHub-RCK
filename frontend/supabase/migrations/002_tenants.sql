-- Multi-tenancy, part 1: structure and backfill.
--
-- Model: one tenant per user. employees.tenant_id is the single source of
-- truth for who a person belongs to; there is no membership join table and no
-- role column. Membership alone grants access within a tenant.
--
-- This migration deliberately does NOT touch RLS policies. Those come in 003
-- so the security-critical change can be reviewed on its own.
--
-- Staging matters on a database with live rows: columns are added nullable,
-- backfilled, and only then made NOT NULL.

BEGIN;

-- =====================================================
-- TENANTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'suspended')),
    settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Slug is the subdomain, so restrict it to what is valid in a hostname
    -- label: lowercase alphanumerics and internal hyphens.
    CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$')
);

-- Reserved names that must never become a tenant subdomain, because they
-- either already resolve elsewhere or would be confusing.
INSERT INTO public.tenants (slug, name)
SELECT 'rck', 'RCK Genetics'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'rck');

-- =====================================================
-- TENANT COLUMNS (nullable for now)
-- =====================================================

ALTER TABLE public.employees             ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.customers             ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.sires                 ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.tanks                 ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.canisters             ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.genetic_inventory     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.supply_categories     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.supply_inventory      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.supply_usage_log      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.nitrogen_fill_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.user_settings         ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.notification_log      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.activity_log          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.allowed_emails        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- =====================================================
-- BACKFILL
-- =====================================================

-- Every existing row belongs to the founding tenant. Safe to re-run.
DO $$
DECLARE
    t UUID;
BEGIN
    SELECT id INTO t FROM public.tenants WHERE slug = 'rck';

    UPDATE public.employees             SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.customers             SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.sires                 SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.tanks                 SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.canisters             SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.genetic_inventory     SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.supply_categories     SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.supply_inventory      SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.supply_usage_log      SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.nitrogen_fill_history SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.user_settings         SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.notification_log      SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.activity_log          SET tenant_id = t WHERE tenant_id IS NULL;
    UPDATE public.allowed_emails        SET tenant_id = t WHERE tenant_id IS NULL;
END $$;

-- =====================================================
-- ENFORCE
-- =====================================================

ALTER TABLE public.employees             ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.customers             ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.sires                 ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tanks                 ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.canisters             ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.genetic_inventory     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supply_categories     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supply_inventory      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.supply_usage_log      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.nitrogen_fill_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_settings         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.notification_log      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.activity_log          ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.allowed_emails        ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- TENANT-AWARE UNIQUENESS
-- =====================================================

-- These were globally unique, which would stop a second tenant from having a
-- tank called "Tank 1" or a category called "Straws".
ALTER TABLE public.tanks             DROP CONSTRAINT IF EXISTS tanks_tank_name_key;
ALTER TABLE public.supply_categories DROP CONSTRAINT IF EXISTS supply_categories_name_key;

ALTER TABLE public.tanks
    ADD CONSTRAINT tanks_tenant_name_key UNIQUE (tenant_id, tank_name);
ALTER TABLE public.supply_categories
    ADD CONSTRAINT supply_categories_tenant_name_key UNIQUE (tenant_id, name);

-- allowed_emails.email stays GLOBALLY unique on purpose. It gates signup, and
-- auth.users.email is global, so the same address cannot join two tenants.
-- tenant_id here records which tenant an invitee lands in, not a uniqueness scope.

-- Parents need (tenant_id, id) unique so 003 can hang composite foreign keys
-- off them and make a cross-tenant reference structurally impossible.
ALTER TABLE public.customers         ADD CONSTRAINT customers_tenant_id_key         UNIQUE (tenant_id, id);
ALTER TABLE public.sires             ADD CONSTRAINT sires_tenant_id_key             UNIQUE (tenant_id, id);
ALTER TABLE public.tanks             ADD CONSTRAINT tanks_tenant_id_key             UNIQUE (tenant_id, id);
ALTER TABLE public.canisters         ADD CONSTRAINT canisters_tenant_id_key         UNIQUE (tenant_id, id);
ALTER TABLE public.supply_categories ADD CONSTRAINT supply_categories_tenant_id_key UNIQUE (tenant_id, id);
ALTER TABLE public.supply_inventory  ADD CONSTRAINT supply_inventory_tenant_id_key  UNIQUE (tenant_id, id);
ALTER TABLE public.employees         ADD CONSTRAINT employees_tenant_id_key         UNIQUE (tenant_id, id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Tenant-leading, because every query is now filtered by tenant first.
CREATE INDEX IF NOT EXISTS idx_customers_tenant             ON public.customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sires_tenant                 ON public.sires (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tanks_tenant                 ON public.tanks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_canisters_tenant             ON public.canisters (tenant_id);
CREATE INDEX IF NOT EXISTS idx_supply_categories_tenant     ON public.supply_categories (tenant_id);
CREATE INDEX IF NOT EXISTS idx_supply_inventory_tenant      ON public.supply_inventory (tenant_id);
CREATE INDEX IF NOT EXISTS idx_supply_usage_log_tenant      ON public.supply_usage_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_nitrogen_fill_history_tenant ON public.nitrogen_fill_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_tenant      ON public.notification_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_tenant        ON public.allowed_emails (tenant_id);

-- Composite where the existing hot path already had an index worth extending.
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_tenant_status ON public.genetic_inventory (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_genetic_inventory_tenant_owner  ON public.genetic_inventory (tenant_id, owner_type, customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant_created     ON public.activity_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_tenant                ON public.employees (tenant_id);

-- =====================================================
-- VIEWS: close the RLS bypass
-- =====================================================

-- Without security_invoker a view runs as its owner (postgres) and ignores the
-- querying user's RLS entirely. customer_inventory already had this set; these
-- two did not, which would have leaked every tenant's data regardless of how
-- correct the policies in 003 are.
ALTER VIEW public.v_low_nitrogen_alerts SET (security_invoker = true);
ALTER VIEW public.v_low_stock_alerts    SET (security_invoker = true);

-- =====================================================
-- SIGNUP: assign the new user to a tenant
-- =====================================================

-- Same gating as before, but the invitation now carries the tenant, and both
-- the employee and their settings row inherit it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    invited_tenant UUID;
BEGIN
    SELECT ae.tenant_id INTO invited_tenant
    FROM allowed_emails ae
    WHERE LOWER(ae.email) = LOWER(NEW.email)
      AND ae.is_used = false;

    IF invited_tenant IS NULL THEN
        RAISE EXCEPTION 'Email not authorized for signup: %', NEW.email;
    END IF;

    UPDATE allowed_emails
    SET is_used = true, used_at = now()
    WHERE LOWER(email) = LOWER(NEW.email);

    INSERT INTO public.employees (id, full_name, tenant_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        invited_tenant
    );

    INSERT INTO public.user_settings (user_id, tenant_id)
    VALUES (NEW.id, invited_tenant)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$;

-- =====================================================
-- HELPER used by 003
-- =====================================================

-- The calling user's tenant. STABLE so the planner can call it once per query
-- rather than once per row, which matters a great deal inside RLS policies.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT tenant_id FROM public.employees WHERE id = auth.uid();
$function$;

COMMIT;

-- Verification:
--   SELECT slug, name FROM public.tenants;
--   SELECT count(*) FROM public.employees WHERE tenant_id IS NULL;  -- 0
--   SELECT relname, reloptions FROM pg_class
--     WHERE relname IN ('v_low_stock_alerts','v_low_nitrogen_alerts');
--     -- both should show security_invoker=true
