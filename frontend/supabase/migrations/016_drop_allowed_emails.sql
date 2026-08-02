-- =====================================================
-- Drop allowed_emails
--
-- The global signup allowlist, replaced by `invitations` in 010. Everything
-- that read it has been rewritten:
--
--   handle_new_user      consumes an invitation (010, fixed in 011)
--   check_email_allowed  reads invitations (011)
--   mark_email_used      dropped (013)
--
-- 010 also backfilled every unused row into invitations, so nobody who was
-- mid-signup at the cutover was stranded.
--
-- What goes with it: the historical record of pre-migration invitations --
-- who added an address, when it was used. The accounts themselves are in
-- `employees` and are unaffected. If that history matters, take a backup of
-- the table before running this; it is not recoverable afterwards except from
-- a database backup.
-- =====================================================

-- A plpgsql function that names a dropped table does not fail until it runs,
-- so the drop refuses if anything still mentions it. Better to stop here than
-- to discover it at someone's next signup.
DO $$
DECLARE
    v_offenders TEXT;
BEGIN
    SELECT string_agg(p.proname, ', ')
    INTO v_offenders
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc ILIKE '%allowed_emails%';

    IF v_offenders IS NOT NULL THEN
        RAISE EXCEPTION 'allowed_emails is still read by: %', v_offenders
            USING HINT = 'Rewrite those functions to use invitations before dropping the table.';
    END IF;
END $$;

-- RESTRICT rather than CASCADE, deliberately: if something does depend on it,
-- this should stop rather than quietly demolish whatever that is.
DROP TABLE IF EXISTS public.allowed_emails RESTRICT;
