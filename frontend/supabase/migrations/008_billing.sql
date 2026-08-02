-- =====================================================
-- BILLING
--
-- A workspace now exists only once Stripe has accepted a card. Two changes
-- carry that:
--
--   1. Subscription state on the tenant, so the app can tell an active
--      workspace from a lapsed one.
--   2. `pending_signups`, which holds what the visitor typed on the landing
--      page between "go to checkout" and the webhook that confirms payment.
--      Until that webhook arrives, no tenant row exists.
--
-- The important line is at the bottom: EXECUTE on create_tenant_with_owner is
-- revoked from anon. Before this migration any visitor could call that RPC
-- straight from the browser and mint a workspace without paying. It is now
-- reachable only by the service role, which means only the webhook.
-- =====================================================

-- =====================================================
-- SUBSCRIPTION STATE
-- =====================================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS subscription_status    TEXT,
    ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_period_end     TIMESTAMPTZ;

-- Mirrors Stripe's own subscription statuses, plus NULL for the tenants that
-- predate billing.
ALTER TABLE public.tenants
    DROP CONSTRAINT IF EXISTS tenants_subscription_status_check;

ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_subscription_status_check
    CHECK (subscription_status IS NULL OR subscription_status IN (
        'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete',
        'incomplete_expired', 'paused'
    ));

CREATE INDEX IF NOT EXISTS tenants_stripe_subscription_id_idx
    ON public.tenants (stripe_subscription_id);

COMMENT ON COLUMN public.tenants.subscription_status IS
    'Mirror of the Stripe subscription status. NULL for tenants created before billing existed.';

-- =====================================================
-- PENDING SIGNUPS
--
-- What the visitor typed, parked until Stripe confirms. Deliberately not a
-- tenant: an abandoned checkout must not leave a workspace behind, and must
-- not hold its slug hostage either.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pending_signups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL,
    name                TEXT NOT NULL,
    email               TEXT NOT NULL,
    full_name           TEXT NOT NULL DEFAULT '',
    checkout_session_id TEXT UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at         TIMESTAMPTZ,

    CONSTRAINT pending_signups_slug_format
        CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$')
);

CREATE INDEX IF NOT EXISTS pending_signups_session_idx
    ON public.pending_signups (checkout_session_id);

-- RLS on with no policy: only the service role reaches this table, which is
-- to say only the edge functions.
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pending_signups IS
    'Signup details held between Stripe checkout and the webhook that creates the tenant.';

-- =====================================================
-- ACTIVATION
--
-- Called by the webhook once payment is accepted: creates the tenant through
-- the existing signup function, then records the Stripe identifiers against
-- it. One function so the whole thing is a single transaction -- a tenant
-- must never exist without its subscription, or the workspace would be free.
-- =====================================================

CREATE OR REPLACE FUNCTION public.activate_paid_tenant(
    p_pending_id      UUID,
    p_customer_id     TEXT,
    p_subscription_id TEXT,
    p_status          TEXT,
    p_trial_ends_at   TIMESTAMPTZ,
    p_period_end      TIMESTAMPTZ
)
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

    -- Stripe retries webhooks, so this has to be safe to call twice.
    IF v_pending.consumed_at IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, NULL::TEXT, v_pending.slug;
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
    SET stripe_customer_id     = p_customer_id,
        stripe_subscription_id = p_subscription_id,
        subscription_status    = p_status,
        trial_ends_at          = p_trial_ends_at,
        current_period_end     = p_period_end,
        updated_at             = now()
    WHERE tenants.slug = v_pending.slug;

    UPDATE public.pending_signups
    SET consumed_at = now()
    WHERE id = p_pending_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT, v_pending.slug;
END;
$$;

-- =====================================================
-- GRANTS
--
-- The line that closes the hole.
-- =====================================================

-- Was granted to anon in 007, which let anyone create a workspace for free.
-- Only the service role -- the Stripe webhook -- may create tenants now.
REVOKE EXECUTE ON FUNCTION public.create_tenant_with_owner(TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_tenant_with_owner(TEXT, TEXT, TEXT, TEXT) FROM authenticated;

REVOKE ALL ON FUNCTION public.activate_paid_tenant(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;

-- is_slug_available stays open: the landing page checks addresses as you type,
-- before any account exists. It only ever answers true or false.
