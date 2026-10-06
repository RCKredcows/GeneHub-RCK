-- Local-only sign-in invitations, loaded after seed.sql by `supabase db reset`
-- (config.toml, [db.seed]). Never run this against a hosted project.
--
-- handle_new_user() only creates an account for an invited address, and the
-- migrations create the rck workspace with nobody in it. These give each seeded
-- workspace an owner to sign up as, at:
--
--   http://rck.dev.localhost:5173/signup    owner@rck.test
--   http://bar7.dev.localhost:5173/signup   owner@bar7.test
--
-- The .test addresses can never receive mail, which is the point: local Auth
-- has confirmation off, and anything it does send lands in Mailpit.

BEGIN;

DELETE FROM public.invitations
WHERE lower(email) IN ('owner@rck.test', 'owner@bar7.test');

INSERT INTO public.invitations (tenant_id, email, full_name, role, expires_at)
SELECT t.id, v.email, v.full_name, 'owner', now() + INTERVAL '1 year'
FROM (VALUES
        ('rck',  'owner@rck.test',  'RCK Local Owner'),
        ('bar7', 'owner@bar7.test', 'Bar 7 Local Owner')
     ) AS v(slug, email, full_name)
JOIN public.tenants t ON t.slug = v.slug;

COMMIT;
