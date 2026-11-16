# Migrations 000–023

These build the multi-tenant schema on a **new, empty project**. That is the
only way they are applied.

**Never apply them to RCK's project (`xnusvnwzvinhopkwmljl`).** RCK stays on its
own single-tenant app and database, at migration `000`, for good. The scripts
that once upgraded it in place (`prod-migration.sh`, `rehearse-migration.sh`,
`move-sire-images.mjs`, `preflight_prod.sql`) were removed on purpose; they are
in git history if ever needed for reference. Check `supabase/.temp/project-ref`
before any `db push`.

**Never run `supabase db reset` against a hosted project.** It drops the public
schema and replays from 000.

## Applying to a new project

```bash
cd frontend
npx supabase link --project-ref <ref>
npx supabase db push --dry-run   # 000–023, in order
npx supabase db push
```

A new project's migration history is empty, so a plain `db push` applies all of
them. Do **not** run `seed.sql` on a real project: it creates demo workspaces.

A fresh database ends up with one workspace, `rck`, created by `002` and given
RCK's branding (`006`) and a billing exemption (`009`). Local development and the
SQL suites use it. On the platform it is removed after the suites pass; see the
platform plan.

Locally, `npx supabase db reset` applies the same files and both seed files.

## What each risky migration actually does

**002** — adds `tenant_id` to fourteen tables, creates the `rck` tenant, assigns
any existing row to it, then sets the column `NOT NULL`. On a fresh database
there are no rows to assign.

**003** — switches on row level security everywhere. Every policy compares
`tenant_id` against `current_tenant_id()`, which reads the caller's `employees`
row. An account without one sees nothing.

**010** — replaces the signup allowlist with `invitations`, and promotes the
earliest account in each workspace to `owner`.

**015** — makes lapsed workspaces read-only. Existing workspaces have
`subscription_status = NULL`, which counts as good standing, so nothing locks
out on day one.

**016** — drops `allowed_emails`, which `010` replaced.

**020** — drops the superseded `search_genetic_inventory` overload. `000` carries
two; a caller that omits `status_filter` silently lands on the old one and gets
checked-out inventory alongside stored.

**021** — adds `tenant_id` to `v_low_nitrogen_alerts` and `v_low_stock_alerts`.
The notification functions read them as the service role, which bypasses RLS,
so without it they cannot tell one workspace's alerts from another's.

**022** — creates the `sire-images` bucket (RCK's was made by hand) and scopes
writes to a `<tenant_id>/` folder. It drops by name the four policies RCK's
bucket has, so it is a no-op on a fresh database in that respect. Adds
`current_tenant_may_write()`, because `tenant_may_write(uuid)` is deliberately
not callable by `authenticated` (017).

**023** — adds `tenants.cancel_at`, which the Stripe webhook sets when a
customer schedules a cancellation and clears if they resume, so Settings can
say "Ends" instead of "Renews".
