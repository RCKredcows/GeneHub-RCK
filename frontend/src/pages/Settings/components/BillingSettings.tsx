import { useEffect, useState } from 'react';
import { FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import {
  fetchBilling,
  openBillingPortal,
  type Billing,
  type BillingError,
} from '../../../api/billing';
import type { Role } from '../../../api/members';

/**
 * Subscription state, and the way out to Stripe's portal.
 *
 * Everyone in the workspace can see the state -- a member should be able to
 * tell why the workspace is locked. Only the owner gets the portal button.
 */

const MESSAGES: Record<BillingError, string> = {
  not_permitted: 'Only the workspace owner can manage billing.',
  no_subscription: 'This workspace has no subscription to manage.',
  billing_exempt: 'This workspace is not billed.',
  portal_failed: 'Could not open the billing portal. Please try again.',
};

/** What each Stripe status means to someone who does not use Stripe. */
const STATUS_LABELS: Record<string, string> = {
  trialing: 'Free trial',
  active: 'Active',
  past_due: 'Payment failed',
  canceled: 'Cancelled',
  unpaid: 'Unpaid',
  incomplete: 'Awaiting payment',
  incomplete_expired: 'Expired before payment',
  paused: 'Paused',
};

const NEEDS_ATTENTION = ['past_due', 'unpaid', 'canceled', 'incomplete_expired'];

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface BillingSettingsProps {
  role: Role | null;
}

export default function BillingSettings({ role }: BillingSettingsProps) {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBilling()
      .then(setBilling)
      .catch((err) => {
        console.error('Could not read billing:', err);
        setError('Could not load billing details.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePortal = async () => {
    setBusy(true);
    setError(null);

    try {
      const result = await openBillingPortal();

      if (!result.ok) {
        setError(MESSAGES[result.errorCode]);
        return;
      }

      window.location.assign(result.url);
    } catch (err) {
      console.error('Billing portal failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="settings__card">
        <div className="settings__item">
          <p className="settings__item-value">Loading billing…</p>
        </div>
      </div>
    );
  }

  if (!billing) return null;

  const trialEnds = formatDate(billing.trialEndsAt);
  const renews = formatDate(billing.currentPeriodEnd);
  const attention = billing.status ? NEEDS_ATTENTION.includes(billing.status) : false;

  return (
    <>
      {error && (
        <div className="team__banner team__banner--error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="settings__card">
        <div className="settings__item">
          <div className="settings__item-info">
            <p className="settings__item-label">Plan</p>
            <p className="settings__item-value">
              {billing.exempt
                ? 'Complimentary — this workspace is not billed'
                : billing.status
                  ? STATUS_LABELS[billing.status] ?? billing.status
                  : 'No subscription'}
            </p>
          </div>

          {attention && <span className="billing__flag">Needs attention</span>}
        </div>

        {!billing.exempt && billing.status === 'trialing' && trialEnds && (
          <div className="settings__item">
            <div className="settings__item-info">
              <p className="settings__item-label">Trial ends</p>
              <p className="settings__item-value">{trialEnds} — your card is charged then</p>
            </div>
          </div>
        )}

        {!billing.exempt && billing.status === 'active' && renews && (
          <div className="settings__item">
            <div className="settings__item-info">
              <p className="settings__item-label">Renews</p>
              <p className="settings__item-value">{renews}</p>
            </div>
          </div>
        )}

        {!billing.exempt && billing.hasSubscription && (
          <div className="settings__item">
            <div className="settings__item-info">
              <p className="settings__item-label">Payment method, invoices, cancellation</p>
              <p className="settings__item-value">
                {role === 'owner'
                  ? 'Managed on Stripe, where your card details are held.'
                  : 'Only the workspace owner can change billing.'}
              </p>
            </div>

            {role === 'owner' && (
              <button
                type="button"
                className="billing__portal-button"
                onClick={handlePortal}
                disabled={busy}
              >
                {busy ? 'Opening…' : 'Manage billing'} <FiExternalLink aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
