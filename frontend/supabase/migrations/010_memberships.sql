-- =====================================================
-- ROLES AND INVITATIONS
--
-- `allowed_emails` was a single global allowlist from when GeneHub ran one
-- operation: you added a row by hand, that person could sign up. It has no
-- roles, no expiry, no revoke, and no record of who invited whom.
--
-- This replaces it with:
--
--   employees.role  -- owner / admin / member
--   invitations     -- expiring, revocable, resendable, with an audit trail
--
-- One address still belongs to exactly one workspace. auth.users.email is
-- globally unique and that rule is kept deliberately, so `employees` remains
-- the single membership record and RLS keeps working as it does today
-- (current_tenant_id() reads the caller's employees row).
--
-- allowed_emails is left in place, unused, until the cutover is confirmed in
-- production. 011 can drop it.
-- =====================================================

-- =====================================================
-- ROLES
-- =====================================================

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

ALTER TABLE public.employees
    DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE public.employees
    ADD CONSTRAINT employees_role_check CHECK (role IN ('owner', 'admin', 'member'));

COMMENT ON COLUMN public.employees.role IS
    'owner: billing and workspace deletion. admin: manages people. member: day-to-day work.';

-- Everyone who predates roles keeps working; the earliest account in each
-- workspace becomes its owner so no workspace is left without one.
UPDATE public.employees e
SET role = 'owner'
WHERE e.role = 'member'
  AND e.id = (
      SELECT e2.id
      FROM public.employees e2
      WHERE e2.tenant_id = e.tenant_id
      ORDER BY e2.created_at NULLS LAST, e2.id
      LIMIT 1
  );

-- =====================================================
-- INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT NOT NULL DEFAULT '',
    role        TEXT NOT NULL DEFAULT 'member',
    token       UUID NOT NULL DEFAULT gen_random_uuid(),
    invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '14 days',
    accepted_at TIMESTAMPTZ,
    revoked_at  TIMESTAMPTZ,

    CONSTRAINT invitations_role_check CHECK (role IN ('owner', 'admin', 'member')),
    CONSTRAINT invitations_email_format
        CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- One address, one workspace: at most one live invitation per email anywhere.
-- Spent and revoked invitations drop out, so an address can be re-invited.
CREATE UNIQUE INDEX IF NOT EXISTS invitations_live_email_key
    ON public.invitations (lower(email))
    WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS invitations_tenant_idx ON public.invitations (tenant_id);
CREATE INDEX IF NOT EXISTS invitations_token_idx  ON public.invitations (token);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Readable and writable only inside the workspace it belongs to, and only by
-- someone who manages people there.
DROP POLICY IF EXISTS invitations_read ON public.invitations;
CREATE POLICY invitations_read ON public.invitations
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS invitations_write ON public.invitations;
CREATE POLICY invitations_write ON public.invitations
    FOR ALL TO authenticated
    USING (
        tenant_id = public.current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid() AND e.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        tenant_id = public.current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid() AND e.role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE public.invitations IS
    'Pending and historical workspace invitations. Replaces allowed_emails.';

-- =====================================================
-- SIGNUP
--
-- Consumes an invitation instead of consulting a global allowlist. The
-- invitation carries the workspace and the role, so a new account lands in the
-- right place with the right powers.
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

    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = v_invite.id;

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$;

-- =====================================================
-- WORKSPACE CREATION
--
-- Same contract as before, but the invitation it leaves behind is an owner
-- invitation in the new table.
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
    p_slug       TEXT,
    p_name       TEXT,
    p_email      TEXT,
    p_full_name  TEXT
)
RETURNS TABLE (ok BOOLEAN, error_code TEXT, slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_slug   TEXT := lower(trim(p_slug));
    v_email  TEXT := lower(trim(p_email));
    v_tenant UUID;
BEGIN
    IF v_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' OR length(v_slug) NOT BETWEEN 3 AND 40 THEN
        RETURN QUERY SELECT false, 'invalid_slug', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM public.reserved_slugs r WHERE r.slug = v_slug) THEN
        RETURN QUERY SELECT false, 'reserved_slug', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = v_slug) THEN
        RETURN QUERY SELECT false, 'slug_taken', v_slug; RETURN;
    END IF;

    IF coalesce(trim(p_name), '') = '' THEN
        RETURN QUERY SELECT false, 'missing_name', v_slug; RETURN;
    END IF;

    IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
        RETURN QUERY SELECT false, 'invalid_email', v_slug; RETURN;
    END IF;

    -- One address, one workspace. Checked against live invitations and against
    -- accounts that already exist, so the caller gets a clear code rather than
    -- a unique-index violation.
    IF EXISTS (
        SELECT 1 FROM public.invitations i
        WHERE lower(i.email) = v_email
          AND i.accepted_at IS NULL
          AND i.revoked_at IS NULL
    ) THEN
        RETURN QUERY SELECT false, 'email_taken', v_slug; RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email) THEN
        RETURN QUERY SELECT false, 'email_taken', v_slug; RETURN;
    END IF;

    INSERT INTO public.tenants (slug, name, legal_name, report_footer)
    VALUES (v_slug, trim(p_name), trim(p_name), trim(p_name))
    RETURNING id INTO v_tenant;

    -- The owner invitation the signup trigger consumes on the new subdomain.
    INSERT INTO public.invitations (tenant_id, email, full_name, role, expires_at)
    VALUES (
        v_tenant,
        v_email,
        coalesce(nullif(trim(p_full_name), ''), ''),
        'owner',
        now() + INTERVAL '30 days'
    );

    RETURN QUERY SELECT true, NULL::TEXT, v_slug;
END;
$function$;

-- =====================================================
-- BACKFILL
--
-- Unused allowed_emails rows become pending invitations so nobody mid-signup
-- is stranded by the cutover.
-- =====================================================

INSERT INTO public.invitations (tenant_id, email, full_name, role, created_at, expires_at)
SELECT a.tenant_id,
       lower(a.email),
       coalesce(a.full_name, ''),
       'member',
       coalesce(a.created_at, now()),
       now() + INTERVAL '14 days'
FROM public.allowed_emails a
WHERE a.is_used IS NOT TRUE
  AND NOT EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE lower(i.email) = lower(a.email)
        AND i.accepted_at IS NULL
        AND i.revoked_at IS NULL
  );

-- =====================================================
-- MEMBER MANAGEMENT
--
-- Removing a member is a SECURITY DEFINER function rather than a DELETE
-- policy: it has to reach auth.users, which RLS cannot express, and it has to
-- refuse the two cases that would strand a workspace.
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_member(p_member_id UUID)
RETURNS TABLE (ok BOOLEAN, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_actor  public.employees%ROWTYPE;
    v_target public.employees%ROWTYPE;
BEGIN
    SELECT * INTO v_actor FROM public.employees WHERE id = auth.uid();
    IF NOT FOUND OR v_actor.role NOT IN ('owner', 'admin') THEN
        RETURN QUERY SELECT false, 'not_permitted'::TEXT; RETURN;
    END IF;

    SELECT * INTO v_target FROM public.employees WHERE id = p_member_id;
    IF NOT FOUND OR v_target.tenant_id <> v_actor.tenant_id THEN
        RETURN QUERY SELECT false, 'not_found'::TEXT; RETURN;
    END IF;

    IF v_target.id = v_actor.id THEN
        RETURN QUERY SELECT false, 'cannot_remove_self'::TEXT; RETURN;
    END IF;

    -- Only an owner may remove another owner.
    IF v_target.role = 'owner' AND v_actor.role <> 'owner' THEN
        RETURN QUERY SELECT false, 'not_permitted'::TEXT; RETURN;
    END IF;

    -- A workspace without an owner has nobody who can manage billing.
    IF v_target.role = 'owner' AND (
        SELECT count(*) FROM public.employees e
        WHERE e.tenant_id = v_target.tenant_id AND e.role = 'owner'
    ) <= 1 THEN
        RETURN QUERY SELECT false, 'last_owner'::TEXT; RETURN;
    END IF;

    DELETE FROM auth.users WHERE id = p_member_id;

    RETURN QUERY SELECT true, NULL::TEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.remove_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_member(UUID) TO authenticated;

-- =====================================================
-- ROLE CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_member_role(p_member_id UUID, p_role TEXT)
RETURNS TABLE (ok BOOLEAN, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_actor  public.employees%ROWTYPE;
    v_target public.employees%ROWTYPE;
BEGIN
    IF p_role NOT IN ('owner', 'admin', 'member') THEN
        RETURN QUERY SELECT false, 'invalid_role'::TEXT; RETURN;
    END IF;

    SELECT * INTO v_actor FROM public.employees WHERE id = auth.uid();

    -- Only an owner changes roles: an admin promoting themselves to owner
    -- would put them in charge of billing.
    IF NOT FOUND OR v_actor.role <> 'owner' THEN
        RETURN QUERY SELECT false, 'not_permitted'::TEXT; RETURN;
    END IF;

    SELECT * INTO v_target FROM public.employees WHERE id = p_member_id;
    IF NOT FOUND OR v_target.tenant_id <> v_actor.tenant_id THEN
        RETURN QUERY SELECT false, 'not_found'::TEXT; RETURN;
    END IF;

    IF v_target.role = 'owner' AND p_role <> 'owner' AND (
        SELECT count(*) FROM public.employees e
        WHERE e.tenant_id = v_target.tenant_id AND e.role = 'owner'
    ) <= 1 THEN
        RETURN QUERY SELECT false, 'last_owner'::TEXT; RETURN;
    END IF;

    UPDATE public.employees SET role = p_role, updated_at = now() WHERE id = p_member_id;

    RETURN QUERY SELECT true, NULL::TEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_member_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_role(UUID, TEXT) TO authenticated;

-- =====================================================
-- SIGNUP PRE-FLIGHT
--
-- The signup form asks this before it calls auth.signUp, so it can say "you
-- have no invitation" plainly instead of surfacing the trigger's exception.
-- Redefined here to read invitations; it was reading allowed_emails, which
-- this migration stops filling. Same name and same shape, so no client change.
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
    (
      SELECT nullif(i.full_name, '')
      FROM public.invitations i
      WHERE lower(i.email) = lower(check_email)
        AND i.accepted_at IS NULL
        AND i.revoked_at IS NULL
        AND i.expires_at > now()
      ORDER BY i.created_at DESC
      LIMIT 1
    ) AS full_name;
END;
$function$;
