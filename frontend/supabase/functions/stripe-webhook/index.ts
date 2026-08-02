/**
 * Stripe webhook. The only thing in the system that may create a workspace.
 *
 * checkout.session.completed  -> create the tenant and its owner invite
 * customer.subscription.*     -> keep the tenant's subscription state current
 *
 * Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
 * Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * --no-verify-jwt is required: Stripe does not send a Supabase JWT. The
 * request is authenticated by its Stripe signature instead, which is verified
 * below before anything is read from the body.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { getSupabaseAdmin } from '../_shared/notification-helpers.ts'
import { sendInvitationEmail } from '../_shared/invitation-email.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const db = getSupabaseAdmin()

const seconds = (value: number | null | undefined) =>
  value ? new Date(value * 1000).toISOString() : null

serve(async (request) => {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('missing signature', { status: 400 })

  const body = await request.text()

  let event: Stripe.Event
  try {
    // Async variant: the sync one uses node crypto, which Deno does not have.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
  } catch (error) {
    console.error('signature verification failed:', error)
    return new Response('invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const pendingId = session.client_reference_id
        if (!pendingId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        // Creates the tenant and stamps the Stripe ids on it in one
        // transaction, and is safe to run twice -- Stripe retries.
        const { data, error } = await db.rpc('activate_paid_tenant', {
          p_pending_id: pendingId,
          p_customer_id: session.customer as string,
          p_subscription_id: subscription.id,
          p_status: subscription.status,
          p_trial_ends_at: seconds(subscription.trial_end),
          p_period_end: seconds(subscription.current_period_end),
        })

        if (error) throw error

        const result = data?.[0]
        if (!result?.ok) {
          // Returning 200 on purpose: retrying will not fix a taken slug, and
          // a retry storm would bury the real signal.
          console.error('activation refused:', result?.error_code, pendingId)
          break
        }

        console.log('workspace created:', result.slug)

        // The owner invitation exists but nothing has sent it: this path has
        // no signed-in user, so it cannot go through send-invitation.
        const { data: invite } = await db
          .from('invitations')
          .select('email, role, expires_at, tenants!inner(name, slug)')
          .eq('tenants.slug', result.slug)
          .eq('role', 'owner')
          .is('accepted_at', null)
          .is('revoked_at', null)
          .maybeSingle()

        if (invite) {
          const workspace = invite.tenants as unknown as { name: string; slug: string }
          const sent = await sendInvitationEmail({
            email: invite.email,
            workspaceName: workspace.name,
            workspaceSlug: workspace.slug,
            role: invite.role,
            expiresAt: invite.expires_at,
            invitedByName: 'GeneHub',
          })

          // Logged rather than thrown: the workspace and the subscription are
          // real, and a retry would try to create them again. The invitation
          // can be resent by hand.
          if (!sent.success) console.error('owner invitation not sent:', result.slug)
        } else {
          console.error('no owner invitation found for:', result.slug)
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await db
          .from('tenants')
          .update({
            subscription_status: subscription.status,
            trial_ends_at: seconds(subscription.trial_end),
            current_period_end: seconds(subscription.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) throw error
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // A 500 asks Stripe to retry, which is what we want for a transient fault.
    console.error('webhook handling failed:', event.type, error)
    return new Response('handler failed', { status: 500 })
  }
})
