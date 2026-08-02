-- =====================================================
-- FIX: activation functions were reachable by anon
--
-- 008 and 009 ended with:
--
--     REVOKE ALL ON FUNCTION public.activate_paid_tenant(...) FROM PUBLIC;
--
-- which is not enough here. Supabase's default privileges grant EXECUTE on
-- functions created in `public` to `anon` and `authenticated` as named roles.
-- Revoking from PUBLIC does not touch a grant made to a role, so both
-- activation functions stayed callable straight from the browser.
--
-- activate_paid_tenant is the dangerous one: it takes a pending_signups id and
-- creates the workspace with whatever Stripe identifiers it is handed. It
-- performs no payment check of its own -- the payment check *is* that only the
-- webhook, holding the service role, can call it. Only the difficulty of
-- guessing a UUID stood in the way.
--
-- Found by supabase/tests/billing_and_roles.sql.
-- =====================================================

REVOKE EXECUTE ON FUNCTION
    public.activate_paid_tenant(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
    FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.activate_exempt_tenant(UUID)
    FROM anon, authenticated;

-- Member management is for signed-in users only. anon reaching these is
-- harmless today -- auth.uid() is null, so the actor lookup fails and they
-- return not_permitted -- but relying on that is relying on an implementation
-- detail rather than on a grant.
REVOKE EXECUTE ON FUNCTION public.remove_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_member_role(UUID, TEXT) FROM anon;

-- create_tenant_with_owner was already revoked from anon in 008 and verified
-- passing, but say it explicitly for both roles so a future default-privilege
-- change cannot quietly hand it back.
REVOKE EXECUTE ON FUNCTION public.create_tenant_with_owner(TEXT, TEXT, TEXT, TEXT)
    FROM anon, authenticated;

-- Stop the same thing happening to whatever is added next: new functions in
-- public will not be granted to the application roles by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
