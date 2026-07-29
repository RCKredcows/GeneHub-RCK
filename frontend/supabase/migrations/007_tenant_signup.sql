-- Self-serve workspace creation.
--
-- The apex becomes a landing page: pick a name and a subdomain, and that
-- creates the tenant. Logging in moves to the tenant's own subdomain.
--
-- Ordering is what makes this work without a backend. This function creates the
-- tenant AND an allowed_emails invitation for the owner, but does not create
-- the auth user. The client then sends the person to their own subdomain to
-- sign up, where the existing handle_new_user() trigger finds the invitation
-- and assigns them to the new tenant. Signing up on the tenant's origin also
-- means the session lands in the right localStorage, rather than at the apex
-- where it could not be used.
--
-- Returns a status row rather than raising, so the form can show a specific
-- message per failure without parsing exception text.

BEGIN;

-- Names that must never become a tenant subdomain: they either already resolve
-- to something, or would be confusing enough to be a phishing aid.
CREATE TABLE IF NOT EXISTS public.reserved_slugs (
    slug TEXT PRIMARY KEY
);

INSERT INTO public.reserved_slugs (slug) VALUES
    ('www'), ('api'), ('app'), ('admin'), ('administrator'), ('root'),
    ('mail'), ('email'), ('smtp'), ('imap'), ('ftp'), ('ns'), ('ns1'), ('ns2'),
    ('cdn'), ('static'), ('assets'), ('media'), ('files'), ('img'), ('images'),
    ('blog'), ('docs'), ('help'), ('support'), ('status'), ('about'),
    ('dev'), ('staging'), ('stage'), ('test'), ('testing'), ('demo'), ('sandbox'),
    ('login'), ('signup'), ('signin'), ('auth'), ('account'), ('billing'),
    ('genehub'), ('internal'), ('system'), ('null'), ('undefined')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;
-- No policy: nothing outside SECURITY DEFINER functions needs to read this.

-- =====================================================
-- AVAILABILITY CHECK
-- =====================================================

-- Lets the signup form give feedback as the user types, without exposing the
-- tenant list. Answers only "could you have this one", never "who has it".
CREATE OR REPLACE FUNCTION public.is_slug_available(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT lower(p_slug) ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
       AND length(p_slug) BETWEEN 3 AND 40
       AND NOT EXISTS (SELECT 1 FROM public.reserved_slugs r WHERE r.slug = lower(p_slug))
       AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = lower(p_slug));
$function$;

-- =====================================================
-- WORKSPACE CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
    p_slug       TEXT,
    p_name       TEXT,
    p_email      TEXT,
    p_full_name  TEXT
)
RETURNS TABLE (ok BOOLEAN, error_code TEXT, slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_slug  TEXT := lower(trim(p_slug));
    v_email TEXT := lower(trim(p_email));
    v_tenant UUID;
BEGIN
    IF v_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' OR length(v_slug) NOT BETWEEN 3 AND 40 THEN
        RETURN QUERY SELECT false, 'invalid_slug', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM public.reserved_slugs r WHERE r.slug = v_slug) THEN
        RETURN QUERY SELECT false, 'reserved_slug', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = v_slug) THEN
        RETURN QUERY SELECT false, 'slug_taken', v_slug; RETURN;
    END IF;

    IF coalesce(trim(p_name), '') = '' THEN
        RETURN QUERY SELECT false, 'missing_name', v_slug; RETURN;
    END IF;

    IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
        RETURN QUERY SELECT false, 'invalid_email', v_slug; RETURN;
    END IF;

    -- allowed_emails.email is globally unique, and so is auth.users.email, so
    -- one address cannot own two workspaces. Caught here to give a clear
    -- message rather than a constraint violation.
    IF EXISTS (SELECT 1 FROM public.allowed_emails a WHERE lower(a.email) = v_email) THEN
        RETURN QUERY SELECT false, 'email_taken', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email) THEN
        RETURN QUERY SELECT false, 'email_taken', v_slug; RETURN;
    END IF;

    INSERT INTO public.tenants (slug, name, legal_name, report_footer)
    VALUES (v_slug, trim(p_name), trim(p_name), trim(p_name))
    RETURNING id INTO v_tenant;

    -- The invitation the signup trigger will consume on the tenant's subdomain.
    INSERT INTO public.allowed_emails (tenant_id, email, full_name)
    VALUES (v_tenant, v_email, coalesce(nullif(trim(p_full_name), ''), v_email));

    RETURN QUERY SELECT true, NULL::TEXT, v_slug;
END;
$function$;

REVOKE ALL ON FUNCTION public.is_slug_available(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_tenant_with_owner(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_slug_available(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_owner(TEXT, TEXT, TEXT, TEXT) TO anon;

COMMIT;

-- Verify:
--   SELECT public.is_slug_available('www');        -- false, reserved
--   SELECT public.is_slug_available('rck');        -- false, taken
--   SELECT public.is_slug_available('new-ranch');  -- true
--   SELECT * FROM public.create_tenant_with_owner('new-ranch','New Ranch','a@b.com','A B');
--
-- Note this is open to anonymous callers by design -- that is what self-serve
-- signup means. Nothing here rate limits, so a script could create tenants in
-- bulk. Worth revisiting before this is public: a CAPTCHA, an email
-- verification step before the tenant row is written, or a signup code.
