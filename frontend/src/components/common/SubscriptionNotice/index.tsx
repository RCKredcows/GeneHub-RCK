import { useEffect, useState } from 'react';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { fetchBilling, isInGoodStanding, openBillingPortal, type Billing } from '../../../api/billing';
import { fetchMyRole, type Role } from '../../../api/members';
import './styles.css';

/**
 * Tells people when the subscription needs attention.
 *
 * This is the explanation, not the enforcement. Writes are refused by a
 * database trigger, so a lapsed workspace stays read-only whether or not this
 * component renders. Its job is to say why, and to put the fix one click away.
 */

export default function SubscriptionNotice() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetchBilling(), fetchMyRole()])
      .then(([nextBilling, nextRole]) => {
        setBilling(nextBilling);
        setRole(nextRole);
      })
      // Billing trouble must never take the app down with it.
      .catch((error) => console.error('Could not read billing state:', error));
  }, []);

  if (!billing) return null;

  const good = isInGoodStanding(billing);
  const failing = billing.status === 'past_due';

  // Trialing and active workspaces get nothing: a healthy subscription is not
  // news, and a permanent banner is one people stop seeing.
  if (good && !failing) return null;

  const handlePortal = async () => {
    setBusy(true);
    try {
      const result = await openBillingPortal();
      if (result.ok) window.location.assign(result.url);
    } catch (error) {
      console.error('Billing portal failed:', error);
    } finally {
      setBusy(false);
    }
  };

  const owner = role === 'owner';

  return (
    <div className={`sub-notice${failing ? '' : ' sub-notice--blocked'}`} role="status">
      <FiAlertCircle aria-hidden="true" />

      <div className="sub-notice__text">
        {failing ? (
          <>
            <strong>A payment did not go through.</strong>{' '}
            {owner
              ? 'Update your card to avoid losing access — everything still works for now.'
              : 'Your workspace owner needs to update the payment method. Everything still works for now.'}
          </>
        ) : (
          <>
            <strong>This workspace is read-only.</strong>{' '}
            {owner
              ? 'There is no active subscription, so records cannot be changed. Your data is safe and comes back as soon as billing is restored.'
              : 'There is no active subscription, so records cannot be changed. Ask your workspace owner to restore billing.'}
          </>
        )}
      </div>

      {owner && (
        <button type="button" className="sub-notice__action" onClick={handlePortal} disabled={busy}>
          {busy ? 'Opening…' : 'Fix billing'} <FiArrowRight aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
