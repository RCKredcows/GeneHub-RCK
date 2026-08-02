import { baseDomain } from '../../config/tenant'
import './styles.css'

/*
  Support page.

  Exists because a payment processor's review asks for a reachable support
  channel, and because a customer whose tank room depends on this needs to know
  how to reach a person. Every answer here is one the product actually gives.
*/

const SUPPORT = {
  legalName: 'RCK Genetics',
  productName: 'GeneHub',
  email: 'daltongorham@gmail.com',
  addressLines: ['431 Romance Rd', 'Romance, AR 72136'],
  hours: 'Monday to Friday, 8am to 5pm Central',
  responseTime: 'within one business day',
}

export default function Support() {
  const domain = baseDomain()

  return (
    <main className="legal">
      <header className="legal__head">
        <a className="legal__back" href="/">← Back to {domain}</a>
        <h1>Support</h1>
        <p className="legal__updated">{SUPPORT.hours}</p>
      </header>

      <div className="legal__body">
        <section>
          <h2>Get in touch</h2>
          <p>
            Email <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a> with anything at all —
            a question, a problem, a billing issue, or a request to close your account. We reply{' '}
            {SUPPORT.responseTime}.
          </p>
          <p>
            If something is wrong with your inventory records, include your workspace address
            (the part before <code>.{domain}</code>) so we can find it quickly.
          </p>
          <p className="legal__contact">
            {SUPPORT.legalName}
            {SUPPORT.addressLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
            <br />
            <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>
          </p>
        </section>

        <section>
          <h2>Common questions</h2>

          <h3>I have a workspace but cannot sign in</h3>
          <p>
            Sign in at your own address, not the main site — that is your workspace name followed
            by <code>.{domain}</code>. If you have forgotten your password, use the reset link on
            that page.
          </p>

          <h3>I was invited but never got the email</h3>
          <p>
            Check spam first. Then ask whoever invited you to open Settings, find your address
            under Team, and press Resend. Invitations expire after 14 days and can be renewed
            from the same place.
          </p>

          <h3>How do I add someone to my workspace?</h3>
          <p>
            Settings, then Team. Owners and admins can invite people, choose whether they join as
            a member or an admin, and remove them later. Members do the day-to-day work; admins
            also manage people; the owner also manages billing.
          </p>

          <h3>How do I change my card, or cancel?</h3>
          <p>
            Settings, then Billing, then Manage billing. That opens the payment portal where you
            can update your card, download invoices, or cancel. Only the workspace owner can do
            this. Cancelling takes effect at the end of the period you have already paid for.
          </p>

          <h3>My workspace says it is read-only</h3>
          <p>
            That means there is no active subscription. Your records are safe and still visible,
            and everything returns to normal as soon as billing is restored from Settings. If you
            think that is wrong, email us.
          </p>

          <h3>Can I get my data out?</h3>
          <p>
            Yes. Email us and we will send an export of your workspace. Do it before cancelling,
            since records are deleted a reasonable period after a workspace closes.
          </p>
        </section>

        <section>
          <h2>Reporting a security problem</h2>
          <p>
            If you believe you have found a vulnerability, email{' '}
            <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a> with the details. Please give
            us a reasonable chance to fix it before disclosing it publicly. We will confirm
            receipt {SUPPORT.responseTime}.
          </p>
        </section>
      </div>

      <footer className="legal__foot">
        <a href="/">← Back to {domain}</a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  )
}
