# Edge functions

Two functions carry billing. Both must be deployed with `--no-verify-jwt`:
neither is called by a signed-in user, so there is no Supabase JWT to check.

## Setup

Create the product and price in Stripe first, then:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_PRICE_ID=price_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  PUBLIC_SITE_URL=https://<platform-domain>

supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt

# Called by a signed-in user, so JWT verification stays on.
supabase functions deploy send-invitation
```

`send-invitation` also needs `RESEND_API_KEY`, which the notification functions
already use.

`PUBLIC_SITE_URL` is required, with no fallback: every function that builds a
link fails without it. Links for members go to `<slug>.<its host>`, and email is
sent from `notifications@<its host>`, so that domain must be verified in Resend.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform.

In the Stripe dashboard, point a webhook endpoint at

```
https://<project-ref>.functions.supabase.co/stripe-webhook
```

subscribed to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The signing secret it gives you is `STRIPE_WEBHOOK_SECRET`.

## Testing locally

```bash
supabase functions serve
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Why the tenant is created in the webhook

`create_tenant_with_owner` used to be granted to `anon`, so the browser created
the workspace directly. Migration `008_billing.sql` revokes that. The only
caller now is `activate_paid_tenant`, reached by the webhook with the service
role — so a workspace cannot exist without a Stripe subscription behind it.

## Comping a workspace

Two separate things, deliberately:

```sql
-- Let a slug create a workspace without paying (checked at signup).
INSERT INTO signup_exemptions (slug, note) VALUES ('acme', 'Pilot customer');

-- Mark an existing workspace as never charged (checked by billing logic).
UPDATE tenants SET billing_exempt = TRUE WHERE slug = 'acme';
```

`signup_exemptions` is read once, when the workspace is created. It has to be a
table rather than a column because the tenant does not exist yet at that point.
`tenants.billing_exempt` is the durable flag: any lockout or dunning logic must
check it before it looks at `subscription_status`.

`rck` is set up both ways by migration `009_billing_exemptions.sql`.
