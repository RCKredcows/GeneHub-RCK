# Cutover: daltongorham.com → genehub.app, dev Supabase → production

Four separate changes that people tend to treat as one:

1. **DNS and certificate** — `genehub.app` instead of `daltongorham.com`
2. **Supabase project** — the AWS secret, and a rebuild, because the keys are
   baked into the bundle
3. **Database** — production migrated from 000 to 020
4. **Stripe** — live keys, a webhook pointing at the new domain

They have different lead times. DNS delegation and certificate validation can
take hours; the database migration takes minutes. Start the slow ones first.

---

## Before the day

### 1. Buy and delegate genehub.app

Terraform creates a Route 53 hosted zone for whatever `domain_name` is set to,
then waits for an ACM certificate covering the apex **and** `*.genehub.app`.
The wildcard is not optional — every workspace lives on a subdomain.

The certificate cannot validate until the domain's nameservers point at that
Route 53 zone. At your registrar, replace the nameservers with the four
`ns-*.awsdns-*` records Terraform outputs. Propagation is usually under an hour
and occasionally much longer.

Do this first. Everything else waits on it.

### 2. Create the production environment files

There is only `dev.tfvars` today. Production needs its own, so the two
environments do not share state, a domain, or a secret:

```bash
cp infra/terraform/dev.tfvars infra/terraform/prod.tfvars
```

Then in `prod.tfvars`:

```hcl
environment  = "prod"
domain_name  = "genehub.app"

# One NAT gateway is a development economy. Production wants one per zone so a
# single zone going away does not take outbound traffic with it.
single_nat_gateway = false

desired_count = 2          # one task is a single point of failure
```

Leave `validate_certificate = true` and `enable_wildcard_certificate = true`.

### 3. Decide what happens to dev

`dev.tfvars` keeps `daltongorham.com`. Leaving it alone gives you somewhere to
test against after the cutover, which is worth the ~$32/month. Changing it to
`genehub.app` would collide with production over the same hosted zone.

---

## Cutover day

Work down this list. Each step assumes the one before it finished.

### 4. Point the AWS secret at production Supabase

The build reads `genehub/<environment>/supabase` from Secrets Manager and bakes
the values into the bundle with Vite. A new environment needs its own secret:

```bash
scripts/put-supabase-secrets.sh prod
# prompts for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Use **production's** project URL and anon key, not the development project's.

Check it landed:

```bash
scripts/put-supabase-secrets.sh prod --show
```

**Updating this secret does not change a running task.** The values are
compiled into the JavaScript at build time, so nothing takes effect until step
6 rebuilds the image. A secret change with no rebuild is a no-op — worth
remembering when it looks like the change did not work.

### 5. Migrate the production database

The whole plan is in `frontend/supabase/migrations/README.md`, and the script
walks it:

```bash
cp .rehearsal.env.example .rehearsal.env    # production's connection string
scripts/prod-migration.sh --dry-run         # pre-flight and backup, no changes
scripts/prod-migration.sh --defer-016       # the real run
```

Take the application offline first. 003 switches on row level security across
every table and 008 revokes an RPC the deployed frontend still calls.

Expect afterwards: 987 inventory rows, 137 customers, 408 sires, one `rck`
workspace owned by Dalton Gorham, `billing_exempt = true`.

### 6. Build against production

```bash
scripts/build-and-push.sh prod
```

This pulls the secret from step 4, bakes it in, and pushes to ECR. Note the tag
it prints — Terraform does not build images, it points at one that exists.

### 7. Apply the infrastructure

Put the tag from step 6 into `prod.tfvars` as `image_tag`, then:

`deploy-infra.sh` takes an action (`plan`, `apply`, `init`, `output`), not an
environment. The environment comes from `TF_VAR_environment`, which defaults to
`dev`, so leaving it unset would plan against development. Set it explicitly:

```bash
export TF_VAR_environment=prod
scripts/deploy-infra.sh plan     # read the plan first
scripts/deploy-infra.sh apply
```

First apply creates the hosted zone, the certificate, the load balancer, and
the service. It will sit waiting on certificate validation until the
nameservers from step 1 have propagated.

### 8. Point Stripe at the new domain

In the Stripe dashboard, **live mode**:

- **Webhook endpoint** → production's function URL, not development's:
  `https://<prod-project-ref>.supabase.co/functions/v1/stripe-webhook`
  Subscribed to `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`.
  It issues a **new signing secret**.
- **Customer portal** must be configured in live mode as well as the sandbox;
  they are separate.
- **Business details** → website `https://genehub.app`, support URL
  `https://genehub.app/support`, privacy `https://genehub.app/privacy`, terms
  `https://genehub.app/terms`.

Then set production's function secrets — the development project's are not
shared:

```bash
cd frontend
npx supabase link --project-ref <prod-project-ref>
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_PRICE_ID=price_...          `# the $20 price, not the $1 test one` \
  STRIPE_WEBHOOK_SECRET=whsec_...    `# from the new endpoint above` \
  STRIPE_TRIAL_DAYS=14               `# not 0 -- that was the live charge test` \
  RESEND_API_KEY=re_... \
  PUBLIC_SITE_URL=https://genehub.app

npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy send-invitation
npx supabase functions deploy create-portal-session
```

`PUBLIC_SITE_URL` is what invitation links are built from. Leave it pointing at
the old domain and every invitation sends people somewhere that is no longer
yours.

### 9. Verify before announcing

- `https://genehub.app` — the landing page
- `https://genehub.app/pricing`, `/privacy`, `/terms`, `/support` — all four
  resolve. Stripe's reviewer checks these.
- `https://rck.genehub.app` — sign in, look at inventory, open a tank. Row
  level security now filters every query.
- Settings → Team → invite an address you control. Confirm the email arrives
  **and the link points at `genehub.app`**.
- Settings → Billing → Manage billing opens the Stripe portal.
- Run `supabase/tests/tenant_isolation.sql` and
  `supabase/tests/billing_and_roles.sql` against production.

---

## Loose ends worth clearing at the same time

- **`STRIPE_TRIAL_DAYS` and `STRIPE_PRICE_ID` on the development project** are
  still set to the `$1` / no-trial values from the live charge test.
- **Stripe's trial-ending email** is off. The pricing page promises "We email
  you before the first charge", which is only true once it is on.
  Settings → Billing → Subscriptions and emails.
- **Test tenants** `bar8`, `bar9`, `bar10` and any `probe-test-%` rows in
  `pending_signups` are still on the development project.
- **The database password** used during the rehearsal was written to a file and
  pasted into a chat. Rotate it: Project Settings → Database → Reset password.
- **PWA icons** `icon-192.png` and `icon-512.png` are still the old artwork.
  PNG is required; the SVG logo cannot substitute.
- **Custom SMTP** for Supabase auth emails. The built-in mailer is rate limited
  to a handful an hour and lands in spam.

## What does not change

`AWS_MIGRATION_PLAN.md` describes `daltongorham.com` as a deliberate stand-in
while production stayed on Vercel. That was true when written, and rewriting it
to say `genehub.app` would make it a worse record of why things are as they
are. Leave it; this document supersedes it.
