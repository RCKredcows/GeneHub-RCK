/**
 * Starts a Stripe Checkout session for a new workspace.
 *
 * Nothing is created here beyond a `pending_signups` row. The tenant itself is
 * created by the webhook, once Stripe confirms a card was accepted -- so an
 * abandoned checkout leaves no workspace behind and does not hold its slug.
 *
 * The exception is a slug listed in `signup_exemptions`, which is created here
 * and never reaches Stripe.
 *
 * Deploy:  supabase functions deploy create-checkout-session --no-verify-jwt
 * Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, PUBLIC_SITE_URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { getSupabaseAdmin } from '../_shared/notification-helpers.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

// Service role: this function reads slug availability and writes a pending
// signup, neither of which anon may do.
const db = getSupabaseAdmin()

const SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://genehub.app'
const TRIAL_DAYS = 14

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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const { slug, name, email, fullName } = await request.json()

    // Re-validate everything. The form checked it, but the form is not a
    // trustworthy source -- this endpoint is public.
    if (typeof slug !== 'string' || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length < 3) {
      return json({ error: 'invalid_slug' }, 400)
    }
    if (typeof name !== 'string' || name.trim() === '') {
      return json({ error: 'missing_name' }, 400)
    }
    if (typeof email !== 'string' || !EMAIL.test(email)) {
      return json({ error: 'invalid_email' }, 400)
    }

    const { data: available, error: slugError } = await db.rpc('is_slug_available', { p_slug: slug })
    if (slugError) throw slugError
    if (available !== true) return json({ error: 'slug_taken' }, 409)

    // Comped workspaces skip Stripe entirely. The exemption list is readable
    // only by the service role, so a visitor cannot probe for free slugs.
    const { data: exemption, error: exemptionError } = await db
      .from('signup_exemptions')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (exemptionError) throw exemptionError

    const { data: pending, error: pendingError } = await db
      .from('pending_signups')
      .insert({
        slug,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        full_name: typeof fullName === 'string' ? fullName.trim() : '',
      })
      .select('id')
      .single()

    if (pendingError) throw pendingError

    if (exemption) {
      // Create the workspace now and send the owner straight to their own
      // subdomain to finish signing up -- the same place Stripe would have
      // sent them, minus the payment step.
      const { data, error } = await db.rpc('activate_exempt_tenant', {
        p_pending_id: pending.id,
      })

      if (error) throw error

      const result = data?.[0]
      if (!result?.ok) return json({ error: result?.error_code ?? 'signup_failed' }, 409)

      const host = SITE_URL.replace(/^https?:\/\//, '')
      const target = `https://${slug}.${host}/signup?email=${encodeURIComponent(email.trim().toLowerCase())}`

      return json({ url: target })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID') ?? '', quantity: 1 }],
      customer_email: email.trim().toLowerCase(),
      // Ties the webhook back to the row above.
      client_reference_id: pending.id,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { pending_signup_id: pending.id, slug },
      },
      // The card is collected now and charged when the trial ends.
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
    })

    await db
      .from('pending_signups')
      .update({ checkout_session_id: session.id })
      .eq('id', pending.id)

    return json({ url: session.url })
  } catch (error) {
    console.error('checkout session failed:', error)
    return json({ error: 'checkout_failed' }, 500)
  }
})
