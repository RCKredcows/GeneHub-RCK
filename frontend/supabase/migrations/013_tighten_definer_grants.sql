-- =====================================================
-- Tighten the remaining SECURITY DEFINER surface
--
-- 012 closed the activation functions. The general audit added to
-- supabase/tests/billing_and_roles.sql then found four more definer functions
-- that anon could execute. Each is handled on its own merits:
--
--   mark_email_used   dropped. It marks an allowed_emails row used, and that
--                     flow was retired by 010 in favour of invitations. A
--                     definer function that writes to a table, reachable by
--                     anon, with no caller left.
--
--   handle_new_user   revoked. A trigger function on auth.users. It fires as
--                     the auth service, never as anon or authenticated, so
--                     nothing needs to call it directly.
--
--   rls_auto_enable   revoked. An event trigger function, invoked by the
--                     system. Same reasoning.
--
--   current_tenant_id LEFT ALONE, deliberately. Thirty RLS policies call it,
--                     and a policy runs it as the querying role -- revoking it
--                     from authenticated would break every policy in the
--                     database. For anon it returns NULL, because there is no
--                     auth.uid(), so the grant is harmless. It is allowlisted
--                     in the test with this reasoning rather than silently
--                     ignored.
-- =====================================================

-- Retired with the allowed_emails signup flow.
DROP FUNCTION IF EXISTS public.mark_email_used(TEXT);

-- Revoked by name and signature, resolved at run time: these were created
-- outside the migrations, so their exact signatures are not known here.
DO $$
DECLARE
    fn RECORD;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('handle_new_user', 'rls_auto_enable')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', fn.signature);
        RAISE NOTICE 'revoked anon and authenticated on %', fn.signature;
    END LOOP;
END $$;
