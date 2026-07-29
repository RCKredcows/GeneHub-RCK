-- Multi-tenancy, part 5: per-tenant presentation.
--
-- src/config/tenant.ts currently hardcodes RCK's name, logo, and report footer,
-- so a Bar 7 user sees correct Bar 7 data wrapped in RCK branding. These
-- columns are what that module reads instead.
--
-- Also adds an RPC for pre-login branding. The login screen has to render
-- before anyone is authenticated, so it cannot read the tenants table -- RLS
-- restricts that to members. Resolving by subdomain through a SECURITY DEFINER
-- function is what makes the wildcard DNS earn its keep.

BEGIN;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS legal_name    TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url      TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS login_hint    TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS report_footer TEXT;

-- Backfill the founding tenant with exactly what the frontend hardcoded, so
-- nothing about RCK's appearance changes when the constant is replaced.
UPDATE public.tenants
SET legal_name    = COALESCE(legal_name, 'RCK Genetics'),
    logo_url      = COALESCE(logo_url, '/rck_logo_dark_final-2.png'),
    login_hint    = COALESCE(login_hint, 'RCK employees: Use your company email to access the system'),
    report_footer = COALESCE(report_footer, 'RCK Genetics - Internal Use Only')
WHERE slug = 'rck';

UPDATE public.tenants
SET legal_name    = COALESCE(legal_name, name),
    report_footer = COALESCE(report_footer, name)
WHERE legal_name IS NULL OR report_footer IS NULL;

-- =====================================================
-- PRE-LOGIN BRANDING
-- =====================================================

-- Returns only presentation fields, and only for an active tenant. Callable by
-- anon because the login page needs it before a session exists. Nothing here is
-- sensitive: it is the name and logo a visitor would see anyway. It deliberately
-- exposes no counts, no members, and no settings.
CREATE OR REPLACE FUNCTION public.get_tenant_branding(p_slug TEXT)
RETURNS TABLE (
    slug          TEXT,
    name          TEXT,
    legal_name    TEXT,
    logo_url      TEXT,
    login_hint    TEXT,
    report_footer TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT t.slug, t.name, t.legal_name, t.logo_url, t.login_hint, t.report_footer
    FROM public.tenants t
    WHERE t.slug = lower(p_slug)
      AND t.status = 'active';
$function$;

REVOKE ALL ON FUNCTION public.get_tenant_branding(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_branding(TEXT) TO anon, authenticated;

COMMIT;

-- Verify:
--   SELECT slug, name, legal_name, logo_url FROM public.tenants;
--   SELECT * FROM public.get_tenant_branding('bar7');
--   SELECT * FROM public.get_tenant_branding('nope');   -- no rows
