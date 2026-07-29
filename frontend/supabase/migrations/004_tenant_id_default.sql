-- Multi-tenancy, part 3: make writes work again.
--
-- 002 made tenant_id NOT NULL with no default. The frontend does not send it --
-- it has no reason to know tenants exist -- so every INSERT from the app fails
-- on the not-null constraint.
--
-- Defaulting the column to current_tenant_id() fixes that without touching a
-- line of application code, and is safer than teaching the client to send it:
-- a client that sends nothing lands in its own tenant, and a client that
-- deliberately sends someone else's is still rejected by the WITH CHECK in 003.
-- The default is a convenience; the policy is the control.
--
-- Note the default evaluates to NULL for the service role and for SQL editor
-- sessions, which have no auth.uid(). Scripts must therefore keep passing
-- tenant_id explicitly, which is what seed.sql already does. That is deliberate:
-- admin work should say out loud which tenant it is writing to.

BEGIN;

ALTER TABLE public.employees             ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.customers             ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.sires                 ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.tanks                 ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.canisters             ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.genetic_inventory     ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.supply_categories     ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.supply_inventory      ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.supply_usage_log      ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.nitrogen_fill_history ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.user_settings         ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.notification_log      ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.activity_log          ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE public.allowed_emails        ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

COMMIT;

-- Verify from the app, signed in as an RCK user: create a customer. It should
-- save, and it should land in RCK.
--
--   SELECT name, tenant_id FROM public.customers ORDER BY created_at DESC LIMIT 1;
--
-- And the hole this does not open. From the browser console, still as RCK:
--   supabase.from('customers').insert({ name: 'x', tenant_id: '<bar7 uuid>' })
-- must be rejected by row level security rather than succeed.
