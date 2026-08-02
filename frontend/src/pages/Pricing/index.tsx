import { useSearchParams } from 'react-router-dom'
import { FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi'
import { baseDomain } from '../../config/tenant'
import './styles.css'

/*
  Pricing.

  One plan, one price. The price shown here is presentational -- Stripe is the
  source of truth, and the amount charged comes from STRIPE_PRICE_ID on the
  checkout function. Change one without the other and this page will lie.
*/

const PLAN = {
  name: 'GeneHub',
  price: '$20',
  cadence: 'per month',
  trialDays: 14,
  included: [
    'Unlimited genetic inventory',
    'Unlimited tanks, canisters, and canes',
    'Unlimited team members',
    'Customers and supply tracking',
    'Full activity history',
    'Your own workspace address',
    'Email support',
  ],
}

export default function Pricing() {
  const [params] = useSearchParams()
  const cancelled = params.get('checkout') === 'cancelled'
  const domain = baseDomain()

  return (
    <main className="pricing">
      <header className="pricing__nav">
        <a className="pricing__brand" href="/" aria-label="GeneHub home">
          <img src="/logo.svg" alt="" />
          <span>GeneHub</span>
        </a>
        <a className="pricing__nav-link" href="/">Back to home</a>
      </header>

      <section className="pricing__head">
        <p className="pricing__kicker">Pricing</p>
        <h1>One plan. Everything in it.</h1>
        <p className="pricing__lede">
          No seat counting and no tiers to outgrow. Try it free for {PLAN.trialDays} days —
          a card is needed to start, and nothing is charged until the trial ends.
        </p>
      </section>

      {cancelled && (
        <div className="pricing__notice" role="status">
          <FiAlertCircle aria-hidden="true" />
          <span>Checkout was cancelled. Nothing was charged and no workspace was created.</span>
        </div>
      )}

      <section className="pricing__plan">
        {/* Left rail owns the offer and the action; the list sits beside it
            rather than under it, so the card has no empty quarter. */}
        <div className="pricing__offer">
          <h2>{PLAN.name}</h2>

          <p className="pricing__price">
            <span>{PLAN.price}</span>
            {PLAN.cadence}
          </p>

          <p className="pricing__trial">
            {PLAN.trialDays} days free, then {PLAN.price} {PLAN.cadence}
          </p>

          <a className="pricing__cta" href="/#create-workspace">
            Start free trial <FiArrowRight aria-hidden="true" />
          </a>

          <p className="pricing__fineprint">
            Cancel any time before the trial ends and you will not be charged.
          </p>
        </div>

        <div className="pricing__contents">
          <h3>Everything included</h3>
          <ul className="pricing__included">
            {PLAN.included.map((item) => (
              <li key={item}>
                <FiCheck aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pricing__faq">
        <h2>Questions people ask first</h2>

        <div className="pricing__faq-item">
          <h3>What happens after the trial?</h3>
          <p>
            Your card is charged {PLAN.price} {PLAN.cadence} and the workspace carries on
            untouched. We email you before the first charge.
          </p>
        </div>

        <div className="pricing__faq-item">
          <h3>Do you charge per user?</h3>
          <p>
            No. Bring the whole crew — the price is per operation, not per person.
          </p>
        </div>

        <div className="pricing__faq-item">
          <h3>What happens if I cancel?</h3>
          <p>
            The workspace stays available to the end of the period you have paid for. After that
            it is closed and its records are removed.
          </p>
        </div>

        <div className="pricing__faq-item">
          <h3>Already have a workspace?</h3>
          <p>
            Open the address your team gave you on {domain} and sign in there. This page is only
            for starting a new one.
          </p>
        </div>
      </section>

      <footer className="pricing__foot">
        <a href="/">← Back to {domain}</a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  )
}
