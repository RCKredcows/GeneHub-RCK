-- =====================================================
-- WORKSPACE BRANDING
--
-- `tenants` has no UPDATE policy for authenticated, deliberately: the same row
-- carries subscription_status and billing_exempt, and a row-level policy
-- cannot say "these columns but not those". Opening it to let someone rename
-- their workspace would also let them grant themselves a free one.
--
-- So branding is edited through a function that touches only the branding
-- columns, on the caller's own tenant, and only for an owner or admin.
--
-- Note the explicit GRANT: 012 revoked the default privilege that used to hand
-- EXECUTE to anon and authenticated automatically, so new functions are
-- unreachable until said otherwise.
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_tenant_branding(
    p_name          TEXT,
    p_legal_name    TEXT,
    p_logo_url      TEXT,
    p_login_hint    TEXT,
    p_report_footer TEXT
)
RETURNS TABLE (ok BOOLEAN, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_actor public.employees%ROWTYPE;
BEGIN
    SELECT * INTO v_actor FROM public.employees WHERE id = auth.uid();

    IF NOT FOUND OR v_actor.role NOT IN ('owner', 'admin') THEN
        RETURN QUERY SELECT false, 'not_permitted'::TEXT; RETURN;
    END IF;

    IF coalesce(trim(p_name), '') = '' THEN
        RETURN QUERY SELECT false, 'missing_name'::TEXT; RETURN;
    END IF;

    -- A logo is loaded into the page, so restrict it to a same-origin path or
    -- an https URL. Anything else -- javascript:, data:, plain http -- is
    -- refused rather than rendered.
    IF coalesce(trim(p_logo_url), '') <> ''
       AND p_logo_url !~ '^(/[^\s]*|https://[^\s]+)$' THEN
        RETURN QUERY SELECT false, 'invalid_logo'::TEXT; RETURN;
    END IF;

    -- The tenant is the caller's own, taken from their membership rather than
    -- from an argument: there is no id here to point at someone else.
    UPDATE public.tenants
    SET name          = trim(p_name),
        legal_name    = nullif(trim(coalesce(p_legal_name, '')), ''),
        logo_url      = nullif(trim(coalesce(p_logo_url, '')), ''),
        login_hint    = nullif(trim(coalesce(p_login_hint, '')), ''),
        report_footer = nullif(trim(coalesce(p_report_footer, '')), ''),
        updated_at    = now()
    WHERE id = v_actor.tenant_id;

    RETURN QUERY SELECT true, NULL::TEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_tenant_branding(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_tenant_branding(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
