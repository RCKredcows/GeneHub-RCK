-- =====================================================
-- Scope two SECURITY DEFINER functions to their caller
--
-- A definer function runs as its owner and bypasses row level security, so
-- each one has to enforce tenant scoping itself. Most already do:
--
--   remove_member, set_member_role   compare the actor's tenant to the
--                                    target's and refuse a mismatch
--   current_tenant_id                returns only the caller's own tenant
--   create_tenant_with_owner,
--   activate_paid_tenant,
--   activate_exempt_tenant           service role only
--   is_slug_available                global by design, answers only yes or no
--   get_tenant_branding              global by design; the login screen has to
--                                    render before there is a session
--
-- Two did not:
--
--   tenant_may_write(uuid)   granted to authenticated and accepting any tenant
--                            id, so a signed-in user could ask whether another
--                            workspace had lapsed. The trigger that needs it
--                            is itself SECURITY DEFINER, so it keeps working
--                            without the grant.
--
--   check_email_allowed()    returns the invitee's full name for any address
--                            with a live invitation, to anyone including anon.
--                            The signup form has to be able to say "you have
--                            no invitation", so existence cannot be hidden --
--                            but the name is more than that needs.
-- =====================================================

-- The enforcement trigger reaches this as its owner, not as the caller.
REVOKE EXECUTE ON FUNCTION public.tenant_may_write(UUID) FROM authenticated;

-- =====================================================
-- check_email_allowed: existence, without the name
--
-- Signature unchanged so the client needs no edit. full_name now comes back
-- NULL: handle_new_user already falls back to the invitation's own full_name
-- when the signup form does not supply one, so nothing is lost.
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_email_allowed(check_email TEXT)
RETURNS TABLE(allowed BOOLEAN, full_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE lower(i.email) = lower(check_email)
        AND i.accepted_at IS NULL
        AND i.revoked_at IS NULL
        AND i.expires_at > now()
    ) AS allowed,
    -- Deliberately not the invitee's name. Anyone can call this with any
    -- address, and the trigger fills the name in from the invitation anyway.
    NULL::TEXT AS full_name;
END;
$function$;
