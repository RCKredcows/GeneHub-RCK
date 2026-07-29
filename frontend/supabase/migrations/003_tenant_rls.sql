-- Multi-tenancy, part 2: row level security.
--
-- Replaces all 23 policies. The old ones authorized anyone holding a valid
-- session ("auth.role() = 'authenticated'" or plain "true"), which was
-- adequate for one tenant and is a cross-tenant leak with more than one.
--
-- Every policy now compares the row's tenant_id against current_tenant_id(),
-- which reads the caller's employees row. That function is SECURITY DEFINER on
-- purpose: the policy on employees itself calls it, and without the definer
-- bypass the policy would recurse into itself.
--
-- This is the security-critical migration. Read it carefully.

BEGIN;

-- =====================================================
-- TENANTS: was left unprotected by 002
-- =====================================================

-- A new table has RLS disabled by default, and Supabase grants the
-- authenticated role access to public schema tables. Without this, any user
-- could read and modify the tenant registry itself.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select_own ON public.tenants;
CREATE POLICY tenants_select_own ON public.tenants
    FOR SELECT TO authenticated
    USING (id = public.current_tenant_id());

-- No insert/update/delete policy: tenants are provisioned out of band, not by
-- application users.

-- =====================================================
-- DROP THE OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can check if email is allowed"                ON public.allowed_emails;
DROP POLICY IF EXISTS "Authenticated users can add allowed emails"          ON public.allowed_emails;
DROP POLICY IF EXISTS "Authenticated users can delete allowed emails"       ON public.allowed_emails;
DROP POLICY IF EXISTS "Authenticated users can update allowed emails"       ON public.allowed_emails;
DROP POLICY IF EXISTS "Authenticated users can view allowed emails"         ON public.allowed_emails;
DROP POLICY IF EXISTS "Authenticated employees can log activity"            ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated employees can view activity log"       ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated employees can manage canisters"        ON public.canisters;
DROP POLICY IF EXISTS "Authenticated employees can manage customers"        ON public.customers;
DROP POLICY IF EXISTS "Authenticated employees can manage genetic inventory" ON public.genetic_inventory;
DROP POLICY IF EXISTS "Authenticated employees can manage sires"            ON public.sires;
DROP POLICY IF EXISTS "Authenticated employees can manage supply categories" ON public.supply_categories;
DROP POLICY IF EXISTS "Authenticated employees can manage supply inventory" ON public.supply_inventory;
DROP POLICY IF EXISTS "Authenticated employees can manage supply usage log" ON public.supply_usage_log;
DROP POLICY IF EXISTS "Authenticated employees can manage tanks"            ON public.tanks;
DROP POLICY IF EXISTS "Authenticated users can manage employees"            ON public.employees;
DROP POLICY IF EXISTS "Enable delete for authenticated users"               ON public.nitrogen_fill_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users"               ON public.nitrogen_fill_history;
DROP POLICY IF EXISTS "Enable read access for authenticated users"          ON public.nitrogen_fill_history;
DROP POLICY IF EXISTS "Users can insert own settings"                       ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings"                       ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own settings"                         ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own notification log"                 ON public.notification_log;

-- =====================================================
-- TENANT-SCOPED TABLES
-- =====================================================

-- One FOR ALL policy per table. USING governs which rows are visible and which
-- may be updated or deleted; WITH CHECK governs what may be written, and is
-- stated explicitly rather than defaulting, so an insert cannot plant a row in
-- another tenant.

DROP POLICY IF EXISTS tenant_isolation ON public.employees;
CREATE POLICY tenant_isolation ON public.employees
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.customers;
CREATE POLICY tenant_isolation ON public.customers
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.sires;
CREATE POLICY tenant_isolation ON public.sires
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.tanks;
CREATE POLICY tenant_isolation ON public.tanks
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.canisters;
CREATE POLICY tenant_isolation ON public.canisters
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.genetic_inventory;
CREATE POLICY tenant_isolation ON public.genetic_inventory
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.supply_categories;
CREATE POLICY tenant_isolation ON public.supply_categories
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.supply_inventory;
CREATE POLICY tenant_isolation ON public.supply_inventory
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.supply_usage_log;
CREATE POLICY tenant_isolation ON public.supply_usage_log
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.nitrogen_fill_history;
CREATE POLICY tenant_isolation ON public.nitrogen_fill_history
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.activity_log;
CREATE POLICY tenant_isolation ON public.activity_log
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON public.allowed_emails;
CREATE POLICY tenant_isolation ON public.allowed_emails
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- The anon SELECT policy is gone. Signup checks an address through
-- check_email_allowed(), which is SECURITY DEFINER and returns only a boolean
-- and a name for the address asked about, rather than exposing the table.

-- =====================================================
-- USER-SCOPED TABLES
-- =====================================================

-- Tenant AND owner. The tenant clause is redundant while a user belongs to one
-- tenant, but it keeps the invariant explicit and survives that assumption
-- changing.

DROP POLICY IF EXISTS user_settings_own ON public.user_settings;
CREATE POLICY user_settings_own ON public.user_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid() AND tenant_id = public.current_tenant_id())
    WITH CHECK (user_id = auth.uid() AND tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notification_log_own ON public.notification_log;
CREATE POLICY notification_log_own ON public.notification_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() AND tenant_id = public.current_tenant_id());

-- Notifications are written by scheduled jobs using the service role, which
-- bypasses RLS, so no insert policy is needed for application users.

COMMIT;

-- Verification. As a signed-in user:
--   SELECT count(*) FROM public.tenants;          -- 1, only your own
--   SELECT public.current_tenant_id();            -- your tenant
--
-- Cross-tenant negative test, which is the one that actually matters. Create a
-- second tenant and a user in it, then from tenant A:
--   SELECT count(*) FROM public.customers;        -- only A's rows
--   INSERT INTO public.customers (tenant_id, name) VALUES (<B's id>, 'x');
--     -- must fail on the WITH CHECK, not succeed
