-- =====================================================
-- SUBSCRIPTION ENFORCEMENT
--
-- Until now a cancelled workspace worked exactly like a paying one: the
-- status was recorded and nothing read it.
--
-- Enforced in the database rather than the interface, because the interface
-- is not a control. Anyone can call PostgREST directly with their own token.
--
-- The policy:
--
--   trialing, active     write freely
--   past_due             write freely, with a warning in the app. Stripe
--                        retries a failed card for about two weeks; locking
--                        someone out the moment a payment bounces punishes an
--                        expired card rather than a non-paying customer.
--   canceled, unpaid,
--   incomplete_expired   reads still work, writes are refused
--   NULL                 write freely -- these predate billing, and locking
--                        them out would be a data-loss-shaped bug
--   billing_exempt       always writes, checked before anything else
--
-- Reads are deliberately left alone. Someone whose card failed needs to see
-- their inventory, and needs to reach the billing page to fix it. Locking
-- people out of the screen where they would pay you is self-defeating.
-- =====================================================

CREATE OR REPLACE FUNCTION public.tenant_may_write(p_tenant UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (
            SELECT t.billing_exempt
                OR t.subscription_status IS NULL
                OR t.subscription_status IN ('trialing', 'active', 'past_due')
            FROM public.tenants t
            WHERE t.id = p_tenant
        ),
        -- No tenant row means this is not a tenant-scoped write to judge.
        true
    );
$function$;

COMMENT ON FUNCTION public.tenant_may_write(UUID) IS
    'Whether a workspace may still be written to. Checks billing_exempt first, so a comped workspace is never locked out.';

-- =====================================================
-- THE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.enforce_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_tenant UUID;
BEGIN
    -- The service role and migrations have no auth.uid(). They must keep
    -- working: the Stripe webhook writes to a workspace precisely when its
    -- subscription is in a bad state, which is the moment it has to record
    -- what happened.
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_tenant := COALESCE(
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE (to_jsonb(NEW) ->> 'tenant_id')::UUID END,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE (to_jsonb(OLD) ->> 'tenant_id')::UUID END
    );

    IF v_tenant IS NOT NULL AND NOT public.tenant_may_write(v_tenant) THEN
        RAISE EXCEPTION 'subscription_lapsed'
            USING HINT = 'This workspace has no active subscription. Billing can be restored from Settings.',
                  ERRCODE = 'check_violation';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.tenant_may_write(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_may_write(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.enforce_subscription() FROM PUBLIC, anon, authenticated;

-- =====================================================
-- ATTACH
--
-- To every table carrying a tenant_id, found by looking rather than by a list
-- that would go stale. `tenants` itself is excluded: the webhook has to be
-- able to record a lapse, and a workspace must always be able to read its own
-- billing row.
-- =====================================================

DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND a.attname = 'tenant_id'
          AND NOT a.attisdropped
          AND c.relname NOT IN ('tenants', 'invitations', 'allowed_emails')
        ORDER BY c.relname
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS enforce_subscription ON public.%I', t.table_name);
        EXECUTE format(
            'CREATE TRIGGER enforce_subscription
             BEFORE INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription()',
            t.table_name
        );
        RAISE NOTICE 'subscription enforced on %', t.table_name;
    END LOOP;
END $$;

-- invitations is excluded on purpose: an owner whose card lapsed should still
-- be able to hand the workspace to a colleague who can pay for it.
