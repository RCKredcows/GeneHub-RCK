# GeneHub Supabase project

Everything the app needs on the Supabase side: schema, policies, edge functions
and tests.

```
supabase/
├── migrations/   000-020: the full schema history (see migrations/README.md)
├── functions/    Edge functions (see functions/README.md)
├── tests/        SQL test suites, run in the SQL editor
└── seed.sql
```

- **Schema and policies** come from the migrations, not from files in the SQL
  editor. `000_schema.sql` is the baseline and creates the `pg_cron` and `pg_net`
  extensions. Apply the rest with `npx supabase db push` against a linked
  project. `migrations/README.md` describes every migration and the plan for
  promoting production, which is still on `000`. **Never run `supabase db reset`
  against production.**
- **Billing, invitations and workspace creation** are in
  [`functions/README.md`](functions/README.md), including the Stripe setup.
- **Tests** are in `tests/`. Run them in the SQL editor of a non-production
  project. See [Tests](#tests).

## Setting up a project

```bash
cd frontend
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Then deploy the functions and set their secrets as described in
[`functions/README.md`](functions/README.md). The notification functions below
also need `RESEND_API_KEY`:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
npx supabase functions deploy check-low-nitrogen
npx supabase functions deploy check-low-stock
npx supabase functions deploy periodic-reminder
```

Create a [Resend](https://resend.com) account and verify your domain, or use
their test domain for development, to get the API key.

## Notifications

Three edge functions send email through Resend:

| Function | Schedule | Description |
|----------|----------|-------------|
| `check-low-nitrogen` | Every 10 hours | Tanks below their nitrogen threshold |
| `check-low-stock` | Every 10 hours | Medical inventory below its reorder threshold |
| `periodic-reminder` | 1st of month, 9 AM UTC | Monthly summary reminder |

Recipients are users whose settings in `user_settings` enable the notification.
`notification_log` records what was sent, and each function skips anything sent
within its cooldown:

- Low nitrogen: 5 days per tank
- Low stock: 5 days per item
- Periodic reminder: 30 days per user

### Scheduling

**No migration creates these cron jobs**, because each one contains a
project-specific URL and key. `000_schema.sql` creates only
`cleanup-activity-log`, which deletes activity older than 30 days. After
deploying to a new project, create the three jobs yourself in **Dashboard >
Database > Cron Jobs**, or with SQL modelled on the existing project's
definitions:

```sql
-- Inspect what the working project has, and copy its shape
SELECT jobname, schedule, command FROM cron.job;
```

Each job calls its function over HTTP with `pg_net`, sending the project's anon
key as a bearer token:

```sql
SELECT cron.schedule(
  'check-low-nitrogen',
  '0 */10 * * *',
  $$SELECT net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-low-nitrogen',
      headers := jsonb_build_object(
                   'Authorization', 'Bearer YOUR_ANON_KEY',
                   'Content-Type',  'application/json')
    );$$
);
```

That is a template, so check it against the existing jobs before relying on it.
Do the same for `check-low-stock` and, with a `0 9 1 * *` schedule,
`periodic-reminder`.

### Testing by hand

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-low-nitrogen \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Swap in `check-low-stock` or `periodic-reminder` for the others.

### Monitoring

```sql
SELECT * FROM cron.job;                                                 -- scheduled jobs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;   -- recent runs
SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 50;          -- what was sent
```

### Not tenant-aware yet

These functions use the service-role client and read alerts and user settings
across **all** workspaces, with no tenant filter. Once more than one workspace
shares a project, they will email across tenant boundaries. Making them
tenant-aware is on the list in `AWS_MIGRATION_PLAN.md` §6 and is a blocker for
running production as multi-tenant.

## Tests

Run these in the SQL editor of a non-production project. Every file ends in
`ROLLBACK`, so nothing is kept. `tenant_isolation.sql` and
`billing_and_roles.sql` also need the email near the top changed to a real user
in that project; they ship with a specific address in them.

| File | Checks |
|------|--------|
| `tests/tenant_isolation.sql` | Cross-tenant reads and writes are refused |
| `tests/composite_fks.sql` | Cross-tenant references are rejected by the database itself |
| `tests/billing_and_roles.sql` | Subscription enforcement, roles and invitations |
| `tests/preflight_prod.sql` | Read-only pre-flight for the production migration. Run it in production's SQL editor |

Run the first three after any change to policies, constraints or
`SECURITY DEFINER` functions.
