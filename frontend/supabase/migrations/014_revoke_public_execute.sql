-- =====================================================
-- Revoke the default PUBLIC grant on rls_auto_enable
--
-- 013 revoked anon and authenticated on the trigger functions, and the audit
-- still reported them open. The reason is the other half of the same lesson
-- 012 taught: PostgreSQL grants EXECUTE on new functions to PUBLIC by default,
-- and has_function_privilege() reports true for privilege inherited through
-- PUBLIC. Revoking the named roles left the PUBLIC grant untouched.
--
-- Neither function is exploitable: PostgreSQL refuses to invoke a trigger
-- function directly ("trigger functions can only be called as triggers"), so
-- this is grant hygiene rather than an open door. That matters, because the
-- two are not equally safe to touch.
--
--   rls_auto_enable   revoked here. An event trigger, fired by DDL that runs
--                     as the owner. Nothing in a request path depends on it.
--
--   handle_new_user   LEFT ALONE, deliberately. It is the trigger every signup
--                     passes through, fired by supabase_auth_admin. If that
--                     role reaches it via the PUBLIC grant rather than one of
--                     its own, revoking PUBLIC would break account creation
--                     for every new user -- to close a hole that cannot be
--                     used, since it cannot be called directly at all.
--
--                     It is allowlisted in billing_and_roles.sql with this
--                     reasoning. To harden it anyway: revoke PUBLIC, grant
--                     EXECUTE to supabase_auth_admin explicitly, then create
--                     an account through an invitation before trusting it.
-- =====================================================

DO $$
DECLARE
    fn RECORD;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'rls_auto_enable'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.signature);
        RAISE NOTICE 'revoked PUBLIC on %', fn.signature;
    END LOOP;
END $$;
