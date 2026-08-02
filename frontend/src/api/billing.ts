import { supabase } from '../lib/supabase';

/**
 * Subscription state for the current workspace.
 *
 * The figures are read straight from the tenant, where the Stripe webhook
 * keeps them current. Nothing here talks to Stripe: the app should be able to
 * say what it believes without a network round trip to a third party.
 */

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface Billing {
  status: SubscriptionStatus | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  /** Comped workspaces are never charged and must never be locked out. */
  exempt: boolean;
  hasSubscription: boolean;
}

/** Statuses where the workspace is paid up, on trial, or otherwise fine. */
export function isInGoodStanding(billing: Billing): boolean {
  if (billing.exempt) return true;
  return billing.status === 'trialing' || billing.status === 'active';
}

export async function fetchBilling(): Promise<Billing> {
  const { data, error } = await supabase
    .from('tenants')
    .select('subscription_status, trial_ends_at, current_period_end, billing_exempt, stripe_customer_id')
    .maybeSingle();

  if (error) throw error;

  return {
    status: (data?.subscription_status as SubscriptionStatus) ?? null,
    trialEndsAt: data?.trial_ends_at ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    exempt: data?.billing_exempt ?? false,
    hasSubscription: Boolean(data?.stripe_customer_id),
  };
}

export type BillingError = 'not_permitted' | 'no_subscription' | 'billing_exempt' | 'portal_failed';

/**
 * Sends the owner to Stripe's hosted portal.
 *
 * Returns the destination rather than navigating, so the caller decides when
 * to leave the page.
 */
export async function openBillingPortal(): Promise<
  { ok: true; url: string } | { ok: false; errorCode: BillingError }
> {
  const { data, error } = await supabase.functions.invoke('create-portal-session', { body: {} });

  if (error) {
    let code: BillingError = 'portal_failed';
    try {
      const body = await (error as { context?: Response }).context?.json();
      code = (body?.error as BillingError) ?? 'portal_failed';
    } catch {
      code = 'portal_failed';
    }
    return { ok: false, errorCode: code };
  }

  return { ok: true, url: data.url as string };
}
