import { baseDomain } from '../../config/tenant'
import './styles.css'

/*
  Terms of service.

  Written from what the product actually does and how it actually bills: one
  plan, monthly, 14-day trial with a card taken up front, cancellation ending
  at the period already paid for.

  Business-specific values live in COMPANY so they can be set in one place.

  This is a starting draft written from the code. It is not legal advice, and
  it should be reviewed by a lawyer before you rely on it.
*/

const COMPANY = {
  // The business is RCK Genetics; the product it sells is GeneHub. Obligations
  // and liability belong to the entity, so the two are kept apart.
  legalName: 'RCK Genetics',
  productName: 'GeneHub',
  contactEmail: 'daltongorham@gmail.com',
  addressLines: ['431 Romance Rd', 'Romance, AR 72136'],
  governingLaw: 'the State of Arkansas, United States',
  price: '$20 per month',
  trialDays: 14,
  lastUpdated: 'August 2, 2026',
}

export default function Terms() {
  const domain = baseDomain()

  return (
    <main className="legal">
      <header className="legal__head">
        <a className="legal__back" href="/">← Back to {domain}</a>
        <h1>Terms of Service</h1>
        <p className="legal__updated">Last updated {COMPANY.lastUpdated}</p>
      </header>

      <div className="legal__body">
        <section>
          <h2>The agreement</h2>
          <p>
            These terms are an agreement between you and {COMPANY.legalName}, which provides{' '}
            {COMPANY.productName}, inventory software for livestock breeding operations. By
            creating a workspace or using one, you agree to them. If you are agreeing on behalf
            of a business, you confirm you are authorised to do so.
          </p>
        </section>

        <section>
          <h2>What the service is</h2>
          <p>
            {COMPANY.productName} records genetic inventory — semen and embryos — by sire, owner,
            quantity, and storage location, along with tanks, canisters, canes, breeding and
            medical supplies, customers, and a history of changes made in your workspace.
          </p>
          <p>
            Each operation gets a private workspace on its own subdomain. Records in one
            workspace are not visible to another.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <p>
            An account is created by invitation from a workspace owner or admin. You are
            responsible for keeping your password secure and for what happens under your account.
            Tell us promptly if you believe it has been compromised.
          </p>
          <p>
            The workspace owner controls who has access, and can invite, change the role of, or
            remove any account in that workspace.
          </p>
        </section>

        <section>
          <h2>Your records are yours</h2>
          <p>
            You keep ownership of everything you enter. We claim no rights over it. We store and
            process it to provide the service, and for no other purpose — we do not sell it, mine
            it, or use it to train anything.
          </p>
          <p>
            You are responsible for the records you enter, including making sure you may lawfully
            hold any personal information about your own customers that you put into a workspace.
          </p>
        </section>

        <section>
          <h2>Payment</h2>

          <h3>Price and billing</h3>
          <p>
            {COMPANY.productName} costs {COMPANY.price} per operation. Subscriptions are billed
            monthly in advance and renew automatically until cancelled. Payment is processed by
            Stripe; we never see or store your card details.
          </p>

          <h3>Free trial</h3>
          <p>
            New workspaces start with a {COMPANY.trialDays}-day free trial. A card is required to
            begin, but nothing is charged during the trial. At the end of it, the card is charged
            the monthly price and billing continues monthly from that date. Cancel before the
            trial ends and you will not be charged at all.
          </p>

          <h3>Cancellation</h3>
          <p>
            The workspace owner can cancel at any time from Settings, which opens the billing
            portal. Cancellation takes effect at the end of the period you have already paid for
            — the workspace keeps working until then.
          </p>

          <h3>Refunds</h3>
          <p>
            Payments are not refunded for partial months, because cancelling leaves the workspace
            usable for the rest of the period you paid for. If you were charged in error, or
            something went materially wrong, write to{' '}
            <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a> and we will put
            it right.
          </p>

          <h3>Price changes</h3>
          <p>
            If we change the price we will give at least 30 days notice by email before it
            applies to your subscription. Continuing after that date is acceptance of the new
            price; cancelling before it means you are never charged the new amount.
          </p>

          <h3>Failed payments</h3>
          <p>
            If a payment fails, we will tell you in the app and Stripe will retry. If it stays
            unpaid, the workspace becomes read-only: your records remain intact and visible, but
            cannot be changed until billing is restored.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Break the law with it, or store anything unlawful in it</li>
            <li>Try to reach another workspace's records, or probe for ways to</li>
            <li>Interfere with the service, or place an unreasonable load on it</li>
            <li>Resell or rent access to your workspace to someone else</li>
            <li>Copy, decompile, or reverse engineer the software</li>
          </ul>
          <p>
            We may suspend a workspace that is doing any of these, and will tell you why unless
            the law prevents it.
          </p>
        </section>

        <section>
          <h2>Availability</h2>
          <p>
            We work to keep {COMPANY.productName} available and to keep your records safe, but we do
            not promise uninterrupted service. Maintenance, provider outages, and faults happen.
            The service is provided as is, without warranties of any kind beyond those the law
            requires and does not allow us to exclude.
          </p>
          <p>
            Keep your own copy of anything you cannot afford to lose. We take backups, but they
            are our safeguard, not a substitute for yours.
          </p>
        </section>

        <section>
          <h2>Limits on liability</h2>
          <p>
            To the extent the law allows, {COMPANY.legalName} is not liable for indirect or
            consequential loss, lost profits, or lost data. Our total liability for any claim is
            limited to the amount you paid us in the twelve months before it arose.
          </p>
          <p>
            Nothing here excludes liability that cannot lawfully be excluded.
          </p>
        </section>

        <section>
          <h2>Ending the agreement</h2>
          <p>
            You may stop using {COMPANY.productName} at any time by cancelling your subscription.
            We may end this agreement if you materially breach these terms and do not fix it
            within 30 days of being told.
          </p>
          <p>
            When a workspace closes, its records are deleted after a reasonable period. Export
            anything you want to keep before cancelling.
          </p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms. The date at the top changes when we do, and for changes
            that materially affect your rights we will give notice in the app or by email before
            they take effect.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these terms can go to{' '}
            <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
          </p>
          <p className="legal__contact">
            {COMPANY.legalName}
            {COMPANY.addressLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
            <br />
            {COMPANY.contactEmail}
          </p>
          <p>
            These terms are governed by the laws of {COMPANY.governingLaw}.
          </p>
        </section>
      </div>

      <footer className="legal__foot">
        <a href="/">← Back to {domain}</a>
      </footer>
    </main>
  )
}
