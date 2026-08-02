import { baseDomain } from '../../config/tenant'
import './styles.css'

/*
  Where Stripe returns after a successful checkout.

  This page deliberately does not create anything or poll for the workspace.
  The webhook creates it, usually within a second or two, and the owner
  finishes signing up from the email they receive. Telling them that is more
  honest than a spinner that cannot know when the webhook has landed.

  The steps below say nothing about a receipt arriving now: the trial means no
  payment is taken at checkout, so Stripe has nothing to send a receipt for.
*/

export default function Welcome() {
  const domain = baseDomain()

  return (
    <main className="pricing">
      <header className="pricing__nav">
        <a className="pricing__brand" href="/" aria-label="GeneHub home">
          <img src="/logo.svg" alt="" />
          <span>GeneHub</span>
        </a>
      </header>

      <section className="pricing__head">
        <p className="pricing__kicker">You&rsquo;re in</p>
        <h1>Your workspace is being set up.</h1>
        <p className="pricing__lede">
          Your trial has started and your card will not be charged until it ends. We&rsquo;re
          creating the workspace now — it usually takes a few seconds.
        </p>
      </section>

      <section className="welcome__card">
        <div className="welcome__card-head">
          <h2>What happens next</h2>
          <p>Two steps, both by email.</p>
        </div>

        <ol className="welcome__steps">
          <li>Check your inbox for an invitation to your new workspace</li>
          <li>Follow it to set a password and sign in on your own address</li>
          <li>Your card is not charged for the next 14 days</li>
          <li>Stripe emails a receipt when the first payment goes through</li>
        </ol>

        <p className="welcome__note">
          Nothing in your inbox after a few minutes? Check spam, then write to us and we will
          sort it out — your payment is safe either way.
        </p>
      </section>

      <footer className="pricing__foot">
        <a href="/">← Back to {domain}</a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  )
}
