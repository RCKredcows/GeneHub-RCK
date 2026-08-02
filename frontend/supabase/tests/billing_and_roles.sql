-- Billing, roles, and the payment gate.
--
-- Covers what migrations 008 to 011 introduced:
--
--   * a workspace cannot be created without paying
--   * comped workspaces are exempt from that, and only comped ones
--   * subscription state is per-tenant and invisible to other tenants
--   * roles are enforced in the database, not just in the interface
--   * a workspace can never be left without an owner
--
-- Runs in two phases. The privilege checks run as the table owner, because
-- they inspect grants rather than data. Everything after that impersonates an
-- application user, which is the only way to exercise row level security --
-- the SQL editor connects as owner and bypasses every policy.
--
-- Expectations are measured at run time rather than hardcoded, so working in
-- the app does not produce false failures.
--
-- Everything is inside a transaction that rolls back. Nothing is persisted.
--
-- Set the email below to a real user before running.

BEGIN;

CREATE TEMP TABLE _results (
    seq        SERIAL,
    check_name TEXT,
    pass       BOOLEAN,
    detail     TEXT
);

CREATE TEMP TABLE _ids AS
SELECT
    (SELECT id FROM auth.users WHERE email = 'daltongorham@gmail.com') AS uid,
    (SELECT e.tenant_id FROM public.employees e
      WHERE e.id = (SELECT id FROM auth.users WHERE email = 'daltongorham@gmail.com')) AS my_tenant,
    (SELECT e.role FROM public.employees e
      WHERE e.id = (SELECT id FROM auth.users WHERE email = 'daltongorham@gmail.com')) AS my_role,
    (SELECT id FROM public.tenants WHERE slug = 'rck') AS rck,
    (SELECT count(*) FROM public.tenants) AS n_tenants_all;

-- Owner count in the caller's own workspace, used by the last-owner checks.
ALTER TABLE _ids ADD COLUMN n_owners INT;
UPDATE _ids SET n_owners = (
    SELECT count(*) FROM public.employees e
    WHERE e.tenant_id = (SELECT my_tenant FROM _ids) AND e.role = 'owner'
);

-- =====================================================
-- PHASE 1: grants and constraints, as owner
-- =====================================================

-- The payment gate. Before migration 008 this was granted to anon, so anyone
-- could call it from the browser console and mint a free workspace.
INSERT INTO _results (check_name, pass, detail)
SELECT 'anon cannot create a workspace',
       NOT has_function_privilege('anon',
           'public.create_tenant_with_owner(text,text,text,text)', 'EXECUTE'),
       'create_tenant_with_owner';

INSERT INTO _results (check_name, pass, detail)
SELECT 'authenticated cannot create a workspace',
       NOT has_function_privilege('authenticated',
           'public.create_tenant_with_owner(text,text,text,text)', 'EXECUTE'),
       'create_tenant_with_owner';

-- Activation is the webhook's alone: it is what turns payment into a tenant.
INSERT INTO _results (check_name, pass, detail)
SELECT 'anon cannot activate a paid tenant',
       NOT has_function_privilege('anon',
           'public.activate_paid_tenant(uuid,text,text,text,timestamptz,timestamptz)', 'EXECUTE'),
       'activate_paid_tenant';

INSERT INTO _results (check_name, pass, detail)
SELECT 'anon cannot activate an exempt tenant',
       NOT has_function_privilege('anon', 'public.activate_exempt_tenant(uuid)', 'EXECUTE'),
       'activate_exempt_tenant';

-- A general net rather than a list to maintain: any SECURITY DEFINER function
-- anon can execute, other than the three the signup screens genuinely need.
-- These run as their owner and bypass RLS, so an unintended grant here is how
-- a hole gets in. This is the check that caught activate_paid_tenant.
INSERT INTO _results (check_name, pass, detail)
SELECT 'no unexpected SECURITY DEFINER function is open to anon',
       count(*) = 0,
       coalesce(string_agg(name, ', '), 'none')
FROM (
    SELECT p.proname AS name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND p.proname NOT IN (
          -- Reached before any account exists, and each answers narrowly.
          'is_slug_available',
          'check_email_allowed',
          'get_tenant_branding',
          -- Called by thirty RLS policies as the querying role, so it has to
          -- stay executable. Returns NULL for anon: there is no auth.uid().
          'current_tenant_id',
          -- A trigger function on auth.users, and PostgreSQL refuses to invoke
          -- one directly, so the grant cannot be used. Left in place because
          -- supabase_auth_admin may reach it through PUBLIC, and revoking that
          -- would break every signup to close a door that does not open.
          'handle_new_user'
      )
) open_to_anon;

-- Slug availability stays open: the signup form checks it before any account
-- exists, and it only ever answers true or false.
INSERT INTO _results (check_name, pass, detail)
SELECT 'anon can still check slug availability',
       has_function_privilege('anon', 'public.is_slug_available(text)', 'EXECUTE'),
       'is_slug_available';

-- Tables the application must never reach directly.
INSERT INTO _results (check_name, pass, detail)
SELECT 'pending_signups has RLS enabled', relrowsecurity, 'pending_signups'
FROM pg_class WHERE oid = 'public.pending_signups'::regclass;

INSERT INTO _results (check_name, pass, detail)
SELECT 'pending_signups has no policy', count(*) = 0, count(*) || ' policies'
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pending_signups';

INSERT INTO _results (check_name, pass, detail)
SELECT 'signup_exemptions has RLS enabled', relrowsecurity, 'signup_exemptions'
FROM pg_class WHERE oid = 'public.signup_exemptions'::regclass;

INSERT INTO _results (check_name, pass, detail)
SELECT 'signup_exemptions has no policy', count(*) = 0, count(*) || ' policies'
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signup_exemptions';

INSERT INTO _results (check_name, pass, detail)
SELECT 'invitations has RLS enabled', relrowsecurity, 'invitations'
FROM pg_class WHERE oid = 'public.invitations'::regclass;

-- Subscription status must be one Stripe actually emits, so a typo cannot
-- quietly grant a workspace permanent access.
DO $$
DECLARE ok BOOLEAN;
BEGIN
    BEGIN
        UPDATE public.tenants SET subscription_status = 'definitely_paid'
        WHERE slug = 'rck';
        ok := false;   -- should not be reachable
    EXCEPTION WHEN check_violation THEN
        ok := true;
    END;

    INSERT INTO _results (check_name, pass, detail)
    VALUES ('subscription_status rejects unknown values', ok, 'check constraint');
END $$;

DO $$
DECLARE ok BOOLEAN;
BEGIN
    BEGIN
        UPDATE public.employees SET role = 'superuser'
        WHERE id = (SELECT uid FROM _ids);
        ok := false;
    EXCEPTION WHEN check_violation THEN
        ok := true;
    END;

    INSERT INTO _results (check_name, pass, detail)
    VALUES ('employees.role rejects unknown roles', ok, 'check constraint');
END $$;

-- Every workspace needs someone who can manage billing.
INSERT INTO _results (check_name, pass, detail)
SELECT 'every workspace has an owner',
       count(*) = 0,
       count(*) || ' without an owner'
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.employees e WHERE e.tenant_id = t.id AND e.role = 'owner'
)
AND EXISTS (SELECT 1 FROM public.employees e WHERE e.tenant_id = t.id);

-- Two live invitations for one address would let someone join two workspaces.
INSERT INTO _results (check_name, pass, detail)
SELECT 'no duplicate live invitations',
       count(*) = 0,
       count(*) || ' duplicated addresses'
FROM (
    SELECT lower(email)
    FROM public.invitations
    WHERE accepted_at IS NULL AND revoked_at IS NULL
    GROUP BY lower(email)
    HAVING count(*) > 1
) dupes;

-- RCK runs the product and does not pay for it.
INSERT INTO _results (check_name, pass, detail)
SELECT 'rck is billing exempt', coalesce(billing_exempt, false), slug
FROM public.tenants WHERE slug = 'rck';

INSERT INTO _results (check_name, pass, detail)
SELECT 'exempt workspaces carry no Stripe customer',
       count(*) = 0,
       count(*) || ' exempt tenants with a customer id'
FROM public.tenants
WHERE billing_exempt AND stripe_customer_id IS NOT NULL;

-- A genuinely lapsed workspace is refused.
--
-- Runs here, as owner, rather than in phase 2: row level security hides other
-- tenants from an application user, so down there this silently found nothing
-- to test and reported a pass. Uses another tenant so the caller's own writes
-- are unaffected, and rolls back with everything else.
DO $$
DECLARE
    v_other UUID;
    v_may   BOOLEAN;
BEGIN
    SELECT id INTO v_other FROM public.tenants
    WHERE id <> (SELECT my_tenant FROM _ids) AND NOT billing_exempt
    LIMIT 1;

    -- A skip must not read as a pass.
    IF v_other IS NULL THEN
        INSERT INTO _results (check_name, pass, detail)
        VALUES ('cancelled workspace may not be written to', false,
                'NOT RUN: no other billable tenant to cancel');
        RETURN;
    END IF;

    UPDATE public.tenants SET subscription_status = 'canceled' WHERE id = v_other;
    v_may := public.tenant_may_write(v_other);

    INSERT INTO _results (check_name, pass, detail)
    VALUES ('cancelled workspace may not be written to', NOT v_may,
            CASE WHEN v_may THEN 'still writable' ELSE 'refused' END);

    -- And exemption outranks a cancelled subscription.
    UPDATE public.tenants SET billing_exempt = true WHERE id = v_other;

    INSERT INTO _results (check_name, pass, detail)
    VALUES ('exempt workspace writes even when cancelled',
            public.tenant_may_write(v_other), 'billing_exempt wins');
END $$;

-- =====================================================
-- PHASE 2: as an application user
-- =====================================================

GRANT SELECT ON _ids TO authenticated;
GRANT SELECT, INSERT ON _results TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE _results_seq_seq TO authenticated;

SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', (SELECT uid FROM _ids), 'role', 'authenticated')::text,
    true
);
SET LOCAL ROLE authenticated;

-- --- What the caller can see ------------------------------------------------

INSERT INTO _results (check_name, pass, detail)
SELECT 'sees exactly one workspace',
       count(*) = 1,
       count(*) || ' of ' || (SELECT n_tenants_all FROM _ids) || ' tenants'
FROM public.tenants;

INSERT INTO _results (check_name, pass, detail)
SELECT 'the workspace seen is their own',
       count(*) = 1,
       count(*) || ' matching'
FROM public.tenants WHERE id = (SELECT my_tenant FROM _ids);

-- Billing figures belong to the workspace, and travel with it.
INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot read another workspace''s billing',
       count(*) = 0,
       count(*) || ' foreign tenants visible'
FROM public.tenants WHERE id <> (SELECT my_tenant FROM _ids);

INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot read pending signups',
       count(*) = 0,
       count(*) || ' rows'
FROM public.pending_signups;

INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot read the exemption list',
       count(*) = 0,
       count(*) || ' rows'
FROM public.signup_exemptions;

INSERT INTO _results (check_name, pass, detail)
SELECT 'sees only its own invitations',
       count(*) = 0,
       count(*) || ' foreign invitations visible'
FROM public.invitations WHERE tenant_id <> (SELECT my_tenant FROM _ids);

INSERT INTO _results (check_name, pass, detail)
SELECT 'sees only its own colleagues',
       count(*) = 0,
       count(*) || ' foreign employees visible'
FROM public.employees WHERE tenant_id <> (SELECT my_tenant FROM _ids);

-- --- Writes that must be refused --------------------------------------------

-- Granting yourself a free workspace by flipping the flag.
WITH updated AS (
    UPDATE public.tenants SET billing_exempt = true
    WHERE id = (SELECT my_tenant FROM _ids)
    RETURNING 1
)
INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot make own workspace exempt', count(*) = 0, count(*) || ' rows' FROM updated;

-- Extending your own trial.
WITH updated AS (
    UPDATE public.tenants SET subscription_status = 'active',
                              trial_ends_at = now() + INTERVAL '10 years'
    WHERE id = (SELECT my_tenant FROM _ids)
    RETURNING 1
)
INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot alter own subscription state', count(*) = 0, count(*) || ' rows' FROM updated;

-- Inviting someone into a workspace that is not yours.
DO $$
DECLARE n INT := 0;
BEGIN
    BEGIN
        INSERT INTO public.invitations (tenant_id, email, role)
        SELECT id, 'intruder@example.com', 'owner'
        FROM public.tenants WHERE id <> (SELECT my_tenant FROM _ids) LIMIT 1;
        GET DIAGNOSTICS n = ROW_COUNT;
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        n := 0;
    END;

    INSERT INTO _results (check_name, pass, detail)
    VALUES ('cannot invite into another workspace', n = 0, n || ' rows');
END $$;

-- --- Guard rails on the member functions ------------------------------------

INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot remove own account', NOT ok, coalesce(error_code, 'no error')
FROM public.remove_member((SELECT uid FROM _ids));

INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot remove someone who does not exist',
       NOT ok, coalesce(error_code, 'no error')
FROM public.remove_member('00000000-0000-0000-0000-000000000000'::uuid);

INSERT INTO _results (check_name, pass, detail)
SELECT 'cannot assign a role that does not exist',
       NOT ok, coalesce(error_code, 'no error')
FROM public.set_member_role((SELECT uid FROM _ids), 'superuser');

-- Demoting the only owner would leave nobody able to manage billing. Only
-- meaningful when the caller is in fact the sole owner.
INSERT INTO _results (check_name, pass, detail)
SELECT CASE WHEN (SELECT my_role FROM _ids) = 'owner' AND (SELECT n_owners FROM _ids) = 1
            THEN 'sole owner cannot demote themselves'
            ELSE 'role change refused for non-owner' END,
       NOT ok,
       coalesce(error_code, 'no error')
FROM public.set_member_role((SELECT uid FROM _ids), 'member');

-- --- Subscription enforcement -----------------------------------------------

-- The caller's own workspace is in good standing (or exempt), so its writes
-- must still go through. A regression here locks out paying customers, which
-- is worse than the hole this feature closes.
INSERT INTO _results (check_name, pass, detail)
SELECT 'own workspace may still be written to',
       public.tenant_may_write((SELECT my_tenant FROM _ids)),
       'tenant_may_write';

-- A lapsed workspace is refused. Checked against a value rather than by
-- cancelling a real subscription: the function is the thing being tested.
INSERT INTO _results (check_name, pass, detail)
SELECT 'enforcement is attached to the tenant tables',
       count(*) >= 10,
       count(*) || ' tables carry the trigger'
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND t.tgname = 'enforce_subscription' AND NOT t.tgisinternal;

-- --- Report -----------------------------------------------------------------

RESET ROLE;

SELECT
    CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result,
    check_name,
    detail
FROM _results
ORDER BY pass, seq;

ROLLBACK;
