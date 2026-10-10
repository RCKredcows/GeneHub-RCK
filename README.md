# GeneHub

GeneHub is a multi-tenant web app for managing genetic inventory in cattle
breeding operations: sires, customers, liquid-nitrogen tanks and canisters, the
semen and embryo straws stored in them, and the medical supplies that go with
them. It also handles nitrogen and low-stock alerts, activity logging, team
management and Stripe billing.

Each customer gets a workspace on its own subdomain (`acme.genehub.app`) with
its own branding and data. RCK Genetics was the first tenant, and the app began
as their internal tool.

> **Proprietary.** Internal FjordWorks project. All rights reserved.

## Contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Everyday commands](#everyday-commands)
- [How multi-tenancy works](#how-multi-tenancy-works)
- [Database and migrations](#database-and-migrations)
- [Edge functions and billing](#edge-functions-and-billing)
- [Deployment](#deployment)
- [Where things live in the frontend](#where-things-live-in-the-frontend)
- [Further reading](#further-reading)

## Architecture

```
Browser ──► static bundle (nginx on ECS Fargate, or Vercel)
   │
   └──────► Supabase: Auth, PostgREST, Storage, Edge Functions
                       └─► Postgres (RLS + composite FKs)
```

- **Frontend:** React 19, TypeScript, Vite, React Router 7, TanStack Query 5,
  Recharts. Installable as a PWA.
- **Backend:** Supabase only. There is no application server. The browser talks
  to Postgres directly through PostgREST, so **all authorisation is enforced by
  row level security**. Edge functions (Deno) handle Stripe, invitations and
  email notifications.
- **Hosting:** the built bundle is static. Production currently serves from
  Vercel. The AWS setup (Terraform: Route 53, ALB, ECS Fargate) is live for the
  dev environment, and production is mid-migration to it. See
  [Deployment](#deployment).

AWS holds no application data. Everything stateful is in Supabase.

## Repository layout

```
.
├── frontend/                 The app, and its Supabase project
│   ├── src/                  React source (see "Where things live")
│   ├── supabase/
│   │   ├── migrations/       000-022, the full schema history
│   │   ├── functions/        Edge functions (Deno)
│   │   ├── tests/            SQL test suites for isolation and billing
│   │   └── seed.sql
│   ├── scripts/              backup-db / restore-db / backup-storage / restore-storage (.mjs)
│   ├── Dockerfile            Multi-stage build to nginx on :8080
│   └── nginx.conf
├── infra/terraform/          AWS infrastructure
├── scripts/                  Deploy and migration helpers (bash)
├── AWS_MIGRATION_PLAN.md     Architecture decisions and rationale
└── CUTOVER.md                Production cutover runbook
```

## Getting started

### Prerequisites

- **Node.js 22** and npm. The Dockerfile builds with `node:22-alpine`, so match
  it. There is no `.nvmrc` yet.
- Access to the **shared dev Supabase project**: its URL and anon key. Ask a
  maintainer for these.
- Only if you'll touch other parts: the Supabase CLI (installed as a dev
  dependency, so use `npx supabase`), Docker, Terraform and the AWS CLI.

### Run the app

```bash
cd frontend
npm install
cp .env.example .env      # then fill in the two values below
npm run dev
```

`.env` needs:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | The dev project's URL |
| `VITE_SUPABASE_ANON_KEY` | The dev project's **anon** key. Never the service-role key. |

`npm run dev` starts Vite with `--host` on port 5173. Read
[Tenants and hostnames locally](#tenants-and-hostnames-locally) before opening
it: the app is not served at plain `localhost`.

These values are compiled into the bundle at build time. Changing `.env`
requires restarting the dev server, and changing them for a deployed build
requires a rebuild.

### Tenants and hostnames locally

The workspace is taken from the subdomain, so the host you browse to matters.

**Plain `http://localhost:5173` does not show the app.** With no workspace
subdomain, `App.tsx` treats the host as the apex and renders only the landing,
pricing and legal pages. There is no login there. To reach the login and the
app you need a hostname with at least three labels, where the first label is a
workspace slug:

```
http://<workspace-slug>.dev.localhost:5173
```

- The slug must be the workspace your account belongs to. Sign in at a
  different workspace's host and you are signed out with a message.
- A slug that matches no active workspace shows a "workspace not found" state
  instead of the login.
- Chrome and Firefox resolve `*.localhost` to your machine without any setup,
  and Vite allows `*.localhost` hosts by default. Other browsers may need an
  `/etc/hosts` entry.
- `tenantSlugFromHostname()` in `src/config/tenant.ts` is the rule. `www` is
  ignored, and IPs and bare `localhost` yield no slug. This also means the
  `--host` LAN address (an IP) shows the landing page, not the app.

## Everyday commands

Run these from `frontend/`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` (with source maps) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest once, as CI would run it |
| `npm run test:coverage` | Vitest with coverage |

Tests live in `src/test/` (jsdom, Testing Library). Shared helpers are in
`src/test/testUtils.tsx`. Database tests are separate SQL files. See
[Database and migrations](#database-and-migrations).

## How multi-tenancy works

Read this before changing anything that touches data access.

- **One workspace (tenant) per user.** `employees.tenant_id` is the source of
  truth. Roles are `owner`, `admin` and `member`; owners manage billing and
  workspace settings, admins invite and remove people.
- **The tenant comes from the JWT, never the hostname.** The subdomain is
  branding and routing only. It is not an authorisation boundary. A user who
  signs in at another workspace's subdomain is signed out with a message. RLS
  would have blocked their data anyway.
- **Two independent isolation layers:**
  1. *RLS* compares every row's `tenant_id` with `current_tenant_id()`, a
     `SECURITY DEFINER` function that reads the caller's `employees` row.
  2. *Composite foreign keys* such as `(tenant_id, sire_id) → sires(tenant_id, id)`
     make cross-tenant references structurally impossible.
- **The client never sends `tenant_id`.** Columns default to
  `current_tenant_id()`.
- **Branding** (name, logo, login hint, report footer) lives on the `tenants`
  row. `frontend/src/config/tenant.ts` holds it in a mutable module object,
  hydrated at startup from the signed-in user's tenant, or before login from the
  subdomain via the anon-callable `get_tenant_branding()` RPC. Components read
  `tenant` directly at render time.
- **Apex vs subdomain:** `genehub.app` is a landing and signup page with no
  login. `<slug>.genehub.app` is the login and the app. A wildcard DNS record
  and certificate mean onboarding a tenant needs no infrastructure change.

Because there is no server-side second layer, **any new table needs a
`tenant_id`, RLS policies and an entry in the isolation tests.** Anything RLS
cannot express, such as changing roles, removing accounts or updating branding,
goes through a `SECURITY DEFINER` function.

## Database and migrations

Migrations are in `frontend/supabase/migrations/` and numbered `000`-`022`.
`000_schema.sql` is the baseline; the rest layer on tenancy, RLS, composite
FKs, branding, signup, billing, memberships and hardening. The generated types
are in `src/types/database.types.ts`.

The `migrations/README.md` describes each migration and the plan for
promoting production. **Never run `supabase db reset` against production.**

Common tasks:

```bash
cd frontend
npx supabase login
npx supabase link --project-ref <dev-project-ref>
npx supabase db push                    # apply new migrations to the linked project
npx supabase db diff --linked           # check for drift
npx supabase gen types typescript --linked > src/types/database.types.ts
```

**Tests.** The isolation and billing suites are plain SQL, run in the Supabase
SQL editor against a non-production project. Each ends in `ROLLBACK`.
`tenant_isolation.sql` and `billing_and_roles.sql` also need the email near the
top changed to a real user in that project:

- `supabase/tests/tenant_isolation.sql`: cross-tenant reads and writes fail
- `supabase/tests/composite_fks.sql`: cross-tenant references are rejected
- `supabase/tests/billing_and_roles.sql`: billing state and role rules

Run them after any change to policies, constraints or `SECURITY DEFINER`
functions.

**Backups.** `frontend/scripts/backup-db.mjs` and `backup-storage.mjs` export
data and storage through the Supabase API, with matching `restore-*.mjs`
scripts. They need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the
environment. Treat the service-role key as a production secret.

## Edge functions and billing

Functions live in `frontend/supabase/functions/`:

| Function | Purpose | JWT verified |
|---|---|---|
| `create-checkout-session` | Starts a Stripe Checkout for a new workspace | No |
| `stripe-webhook` | Receives Stripe events and creates the tenant via `activate_paid_tenant` | No |
| `create-portal-session` | Opens the Stripe billing portal | Yes |
| `send-invitation` | Emails a workspace invitation (Resend) | Yes |
| `check-low-nitrogen` | Alerts when a tank is low (cron, every 10 hours) | n/a |
| `check-low-stock` | Alerts on low medical stock (cron, every 10 hours) | n/a |
| `periodic-reminder` | Monthly summary (cron, 1st of month) | n/a |

The three cron-driven functions email each user about their own workspace only
(migration `021`). Their cron jobs must still be created by hand in each
project. See `frontend/supabase/README.md`.

Secrets are set with `npx supabase secrets set`: `STRIPE_SECRET_KEY`,
`STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_SITE_URL`, `RESEND_API_KEY`
and optionally `STRIPE_TRIAL_DAYS` (default 14). `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are injected by the platform.

A workspace cannot exist without a Stripe subscription behind it. The tenant is
created by the webhook, not the browser. Test locally with
`npx supabase functions serve` and `stripe listen --forward-to
localhost:54321/functions/v1/stripe-webhook`. See
`frontend/supabase/functions/README.md` for deploy flags, webhook setup and how
to comp a workspace.

## Deployment

There are two environments in flight:

| | Dev | Production |
|---|---|---|
| Hosting | AWS ECS Fargate | Vercel today, moving to AWS |
| Domain | Stand-in domain, wildcard cert | `genehub.app` after cutover |
| Supabase | Dev project | Separate production project |

Both serve the same static bundle. The Supabase URL and anon key are baked in
at build time, so **each environment needs its own build**, and changing the
secret without rebuilding does nothing.

Helper scripts, run from the repo root:

```bash
scripts/put-supabase-secrets.sh <env>    # store the Supabase URL and anon key in Secrets Manager
scripts/build-and-push.sh <env> [tag]    # build the image and push to ECR, prints the tag
scripts/deploy-infra.sh plan|apply|init|output   # Terraform, bootstrapping remote state if needed
scripts/destroy-infra.sh plan|destroy    # preview or tear down (plan is the default)
```

`deploy-infra.sh` and `destroy-infra.sh` take the environment from
`TF_VAR_environment` (default `dev`), not from an argument:

```bash
TF_VAR_environment=prod scripts/deploy-infra.sh plan
```

Infrastructure configuration is in `infra/terraform/`. Copy
`dev.tfvars.example` to `dev.tfvars`; `*.tfvars` is gitignored. Each
environment reads its own `<env>.tfvars`.

**Moving production.** The production database is still on migration `000`, and
the move to AWS is being rolled out. Follow [`CUTOVER.md`](CUTOVER.md), and
rehearse first with `scripts/rehearse-migration.sh` (read-only against
production, restores into a throwaway local database) before
`scripts/prod-migration.sh`. Both use `.rehearsal.env`, copied from
`.rehearsal.env.example` and gitignored because it holds a production password.

## Where things live in the frontend

```
frontend/src/
├── api/          One module per resource, wrapping Supabase calls
├── components/   Shared UI (layout, modals, selects, pagination, ...)
├── config/       tenant.ts: branding and hostname handling
├── constants/    queryKeys.ts, mutations.ts, defaultSettings.ts
├── hooks/        Data and form hooks, grouped by feature
├── lib/          supabase.ts: the client
├── pages/        One folder per route
├── test/         Vitest suites and helpers
├── types/        Shared types, plus generated database.types.ts
└── util/         Validation and helpers
```

Routes: `/dashboard`, `/customers`, `/sires`, `/genetic-inventory`, `/tanks`,
`/medical-inventory`, `/activity`, `/settings` (all behind login). On a
workspace subdomain, `/` is the login page, alongside `/signup`,
`/forgot-password` and `/reset-password`. At the apex, `/` is the landing page,
with `/pricing` and `/welcome`. `/privacy`, `/terms` and `/support` are public
everywhere.

Conventions worth knowing:

- **Data fetching goes through React Query.** Query keys are centralised in
  `src/constants/queryKeys.ts`. Reuse them instead of writing key arrays inline,
  or invalidation will miss.
- **Mutations use `useCRUDMutation`** (or `useSimpleMutation`), which invalidates
  the right keys and smooths loading flashes. Mutations that change dashboard
  counts must invalidate those keys too.
- **Forms** compose `useModalState`, `useConfirmModal`, `useFormState`,
  `useFormValidation` and a mutation hook.
- **Pagination.** Sires and genetic inventory paginate on the server (with an
  RPC for joined search). Tanks, customers and medical inventory paginate on the
  client.
- **Branding text** such as owner labels comes from `tenant` in
  `config/tenant.ts`, not from hard-coded strings. Don't hard-code "RCK".

## Further reading

- [`AWS_MIGRATION_PLAN.md`](AWS_MIGRATION_PLAN.md): the architecture, why
  Supabase was kept, the tenancy model, and what remains before production.
- [`CUTOVER.md`](CUTOVER.md): the production cutover runbook.
- [`frontend/supabase/README.md`](frontend/supabase/README.md): setting up a
  Supabase project, notifications and their cron jobs, and the SQL tests.
- [`frontend/supabase/migrations/README.md`](frontend/supabase/migrations/README.md):
  migration-by-migration notes and the production promotion plan.
- [`frontend/supabase/functions/README.md`](frontend/supabase/functions/README.md):
  edge function setup and Stripe.
- [`frontend/.claude.md`](frontend/.claude.md): frontend architecture notes:
  React Query patterns, mutation and pagination conventions, and refactoring
  opportunities.
