-- =====================================================
-- BILLING EXEMPTIONS
--
-- Some workspaces do not pay: the operation that runs GeneHub, anyone comped,
-- and any account used for demos or support. Two pieces carry that:
--
--   1. `tenants.billing_exempt` -- this workspace is never charged and must
--      never be locked out for lack of a subscription.
--   2. `signup_exemptions` -- slugs allowed to skip Stripe checkout entirely
--      when the workspace is first created.
--
-- The second is a separate table rather than a flag on `tenants` because the
-- tenant does not exist yet at the moment the decision has to be made.
-- =====================================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS billing_exempt BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.tenants.billing_exempt IS
    'Never charged, and never locked out for want of a subscription. Any billing check must honour this before it looks at subscription_status.';

-- RCK runs the product; it predates billing and does not pay for it.
UPDATE public.tenants
SET billing_exempt = TRUE,
    updated_at     = now()
WHERE slug = 'rck';

-- =====================================================
-- SIGNUP EXEMPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.signup_exemptions (
    slug       TEXT PRIMARY KEY,
    note       TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT signup_exemptions_slug_format
        CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$')
);

-- RLS on with no policy: only the service role, which is to say only the
-- checkout function, may read this. A visitor must not be able to enumerate
-- which slugs skip payment.
ALTER TABLE public.signup_exemptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.signup_exemptions IS
    'Slugs that may create a workspace without going through Stripe. Add a row to comp an account; delete it to require payment again.';

INSERT INTO public.signup_exemptions (slug, note)
VALUES ('rck', 'Runs GeneHub')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- EXEMPT ACTIVATION
--
-- The counterpart to activate_paid_tenant, for a workspace that never goes to
-- Stripe. Same shape, same idempotency, no subscription identifiers -- and it
-- refuses any slug that is not actually exempt, so it cannot become a second
-- way to create a free workspace.
-- =====================================================

CREATE OR REPLACE FUNCTION public.activate_exempt_tenant(p_pending_id UUID)
RETURNS TABLE (ok BOOLEAN, error_code TEXT, slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pending public.pending_signups%ROWTYPE;
    v_result  RECORD;
BEGIN
    SELECT * INTO v_pending
    FROM public.pending_signups
    WHERE id = p_pending_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'unknown_signup'::TEXT, ''::TEXT;
        RETURN;
    END IF;

    IF v_pending.consumed_at IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, NULL::TEXT, v_pending.slug;
        RETURN;
    END IF;

    -- Checked here as well as in the caller. This function is the thing that
    -- creates a free workspace, so it verifies its own precondition.
    IF NOT EXISTS (SELECT 1 FROM public.signup_exemptions e WHERE e.slug = v_pending.slug) THEN
        RETURN QUERY SELECT FALSE, 'not_exempt'::TEXT, v_pending.slug;
        RETURN;
    END IF;

    SELECT * INTO v_result
    FROM public.create_tenant_with_owner(
        v_pending.slug,
        v_pending.name,
        v_pending.email,
        v_pending.full_name
    );

    IF NOT v_result.ok THEN
        RETURN QUERY SELECT FALSE, v_result.error_code, v_pending.slug;
        RETURN;
    END IF;

    UPDATE public.tenants
    SET billing_exempt = TRUE,
        updated_at     = now()
    WHERE tenants.slug = v_pending.slug;

    UPDATE public.pending_signups
    SET consumed_at = now()
    WHERE id = p_pending_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT, v_pending.slug;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_exempt_tenant(UUID) FROM PUBLIC;
