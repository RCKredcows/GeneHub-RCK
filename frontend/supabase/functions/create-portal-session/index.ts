/**
 * Opens the Stripe customer portal for the caller's workspace.
 *
 * Stripe hosts the whole thing -- cards, invoices, cancellation -- so none of
 * that has to be rebuilt or kept in sync here.
 *
 * Two checks before a session is created: the caller must be an owner, and the
 * customer id is read from *their own* workspace rather than taken from the
 * request. Passing a customer id in would let anyone open anyone's billing.
 *
 * Deploy:  supabase functions deploy create-portal-session
 *          (JWT verification stays on -- called by a signed-in user)
 * Secrets: STRIPE_SECRET_KEY, PUBLIC_SITE_URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'not_authenticated' }, 401)

  try {
    // The caller's own token: RLS scopes every read below to their workspace.
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

    const { data: auth } = await db.auth.getUser()
    if (!auth.user) return json({ error: 'not_authenticated' }, 401)

    const { data: me } = await db
      .from('employees')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()

    // Billing belongs to the owner. An admin manages people, not the card.
    if (me?.role !== 'owner') return json({ error: 'not_permitted' }, 403)

    // Reading the tenant through RLS means this is always the caller's own
    // workspace; there is no customer id in the request to tamper with.
    const { data: tenant } = await db
      .from('tenants')
      .select('stripe_customer_id, billing_exempt')
      .maybeSingle()

    if (tenant?.billing_exempt) return json({ error: 'billing_exempt' }, 409)
    if (!tenant?.stripe_customer_id) return json({ error: 'no_subscription' }, 409)

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://genehub.app'

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${request.headers.get('origin') ?? siteUrl}/settings`,
    })

    return json({ url: session.url })
  } catch (error) {
    console.error('portal session failed:', error)
    return json({ error: 'portal_failed' }, 500)
  }
})
