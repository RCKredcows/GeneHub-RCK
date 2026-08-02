-- =====================================================
-- FIX: signup could not create user_settings
--
-- 010 rewrote handle_new_user to consume an invitation, but based the body on
-- the original in 000_schema, which inserts user_settings with only (user_id).
-- That drops the fix 002 had made: user_settings.tenant_id is NOT NULL and
-- defaults to current_tenant_id(), which evaluates to NULL inside this trigger
-- because there is no session yet -- auth.uid() is null while the account is
-- still being created.
--
-- The result was a not-null violation surfacing as "Database error saving new
-- user" on every signup.
--
-- The tenant is passed explicitly here, exactly as 002 did. employees was
-- already correct; only the user_settings insert was wrong.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_invite public.invitations%ROWTYPE;
BEGIN
    SELECT * INTO v_invite
    FROM public.invitations i
    WHERE lower(i.email) = lower(NEW.email)
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
    ORDER BY i.created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'no_invitation'
            USING HINT = 'This email has no open invitation to a workspace.';
    END IF;

    INSERT INTO public.employees (id, tenant_id, full_name, role)
    VALUES (
        NEW.id,
        v_invite.tenant_id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
            NULLIF(v_invite.full_name, ''),
            NEW.email
        ),
        v_invite.role
    );

    -- tenant_id passed explicitly: the column's default cannot resolve here.
    INSERT INTO public.user_settings (user_id, tenant_id)
    VALUES (NEW.id, v_invite.tenant_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = v_invite.id;

    RETURN NEW;
END;
$function$;
