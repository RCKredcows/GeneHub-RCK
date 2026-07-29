import { useEffect, useState, type FormEvent } from 'react'
import { FiAlertCircle } from 'react-icons/fi'
import { createTenantWithOwner, isSlugAvailable } from '../../api/tenants'
import type { CreateTenantError } from '../../api/tenants'
import { baseDomain } from '../../config/tenant'
import './styles.css'

/** Turns "Ridgeline Genetics" into "ridgeline-genetics". */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/**
 * Shown wherever the page names a workspace address.
 *
 * baseDomain() reports the host actually being served, which is right in
 * production but is "localhost" or a bare IP in development — neither of which
 * belongs in front of a customer. Fall back to the product domain unless the
 * host is a real registrable name.
 */
const PRODUCT_DOMAIN = 'genehub.app'

function displayDomain(): string {
  const host = baseDomain()
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(host) ? host : PRODUCT_DOMAIN
}

const MESSAGES: Record<CreateTenantError, string> = {
  invalid_slug: 'Use 3 to 40 letters, numbers, or hyphens.',
  reserved_slug: 'That address is reserved. Try another.',
  slug_taken: 'That address is already in use.',
  missing_name: 'Give your workspace a name.',
  invalid_email: 'That email address does not look right.',
  email_taken: 'That email already belongs to a workspace. Sign in there instead.',
}

/**
 * The occupied canister positions in the hero diagram.
 *
 * A dewar holds its canisters in a ring, and the position is how you find
 * anything: tank, then canister, then cane. `owner` mirrors the app's own
 * distinction between stock the operation owns and stock it holds for a
 * customer, so the legend introduces that idea before anyone signs up.
 */
const CANISTERS = [
  { id: 'A2', owner: 'owned' },
  { id: 'A3', owner: 'held' },
  { id: 'A4', owner: 'owned' },
  { id: 'A5', owner: 'owned' },
  { id: 'A6', owner: 'held' },
] as const

/**
 * Example operations for the placeholder. Invented names, not seed data — a
 * real tenant's name has no business appearing on the front page.
 */
const EXAMPLE_OPERATIONS = [
  'Ridgeline Genetics',
  'Cedar Hollow Cattle',
  'Two Rivers Livestock',
  'Bitterroot Angus',
  'Stonegate Ranch',
] as const

/**
 * Types an example out a character at a time, holds it, deletes it, and moves
 * to the next. Runs only while the field is empty, since a placeholder is
 * invisible once someone starts typing and animating it would be wasted work.
 */
function useTypedExample(active: boolean): string {
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  const [text, setText] = useState('')

  useEffect(() => {
    if (!active || reduced) return

    let word = 0
    let chars = 0
    let deleting = false
    let timer: number

    const step = () => {
      const current = EXAMPLE_OPERATIONS[word]

      if (deleting) {
        chars -= 1
        setText(current.slice(0, chars))
        if (chars === 0) {
          deleting = false
          word = (word + 1) % EXAMPLE_OPERATIONS.length
          timer = window.setTimeout(step, 400)
          return
        }
        timer = window.setTimeout(step, 28)
        return
      }

      chars += 1
      setText(current.slice(0, chars))
      if (chars === current.length) {
        deleting = true
        timer = window.setTimeout(step, 1900)
        return
      }
      timer = window.setTimeout(step, 68)
    }

    timer = window.setTimeout(step, 700)
    return () => window.clearTimeout(timer)
  }, [active, reduced])

  return reduced ? EXAMPLE_OPERATIONS[0] : text
}

/** Six positions on a circle, starting at the top. Index 0 is the open slot. */
function position(index: number) {
  const angle = (-90 + index * 60) * (Math.PI / 180)
  return {
    x: 100 + 52 * Math.cos(angle),
    y: 100 + 52 * Math.sin(angle),
  }
}

export default function Landing() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const domain = displayDomain()
  const example = useTypedExample(name === '')

  // Derive the subdomain from the operation name until the user takes it over.
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(name))
  }, [name, slugEdited])

  // Debounced, so typing does not fire a request per keystroke.
  useEffect(() => {
    if (slug.length < 3) {
      setAvailable(null)
      setChecking(false)
      return
    }

    let cancelled = false
    setAvailable(null)
    setChecking(true)

    const timer = setTimeout(async () => {
      try {
        const result = await isSlugAvailable(slug)
        if (!cancelled) setAvailable(result)
      } catch {
        if (!cancelled) setAvailable(null)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [slug])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await createTenantWithOwner({ slug, name, email, fullName })

      if (!result.ok) {
        setError(result.errorCode ? MESSAGES[result.errorCode] : 'Could not create the workspace.')
        return
      }

      // Finish signing up on the new subdomain. Creating the account here would
      // leave the session on the apex, where it cannot be used.
      window.location.assign(
        `${window.location.protocol}//${result.slug}.${domain}/signup?email=${encodeURIComponent(email)}`
      )
    } catch (err) {
      console.error('Workspace creation failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    !submitting && name.trim() !== '' && slug.length >= 3 && available === true && email.trim() !== ''

  // The open position in the rack is claimed once the address is confirmed
  // free. Signing up is, quite literally, taking a slot in the tank.
  const claimed = available === true
  const slot = position(0)

  return (
    <main className="landing">
      <div className="landing__inner">
        <header className="landing__mast">
          <h1 className="landing__wordmark">GeneHub</h1>
        </header>

        <div className="landing__hero">
          <div className="landing__column">
            <p className="landing__eyebrow">Genetic inventory</p>
            <h2 className="landing__headline">Know where every straw is.</h2>
            <p className="landing__lede">
              GeneHub tracks genetics down to the tank, canister, and cane — what you
              own, what you are holding for customers, and what is running low.
            </p>

            <section className="landing__card" aria-labelledby="create-workspace">
              <h3 className="landing__card-title" id="create-workspace">
                Create your workspace
              </h3>

              <form onSubmit={handleSubmit} className="landing__form">
                {error && (
                  <p className="landing__error" role="alert">
                    <FiAlertCircle aria-hidden="true" />
                    <span>{error}</span>
                  </p>
                )}

                <div className="landing__field">
                  <label className="landing__label" htmlFor="operation">Operation name</label>
                  <input
                    id="operation"
                    className="landing__input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={example || EXAMPLE_OPERATIONS[0]}
                    autoComplete="organization"
                    required
                  />
                </div>

                <div className="landing__field">
                  <label className="landing__label" htmlFor="address">Workspace address</label>
                  <div className="landing__address">
                    <input
                      id="address"
                      className="landing__input"
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlugEdited(true)
                        setSlug(toSlug(e.target.value))
                      }}
                      placeholder={toSlug(example) || toSlug(EXAMPLE_OPERATIONS[0])}
                      autoComplete="off"
                      spellCheck={false}
                      aria-describedby="address-status"
                      required
                    />
                    <span className="landing__suffix">.{domain}</span>
                  </div>

                  <p
                    id="address-status"
                    aria-live="polite"
                    className={
                      'landing__status' +
                      (available === true ? ' landing__status--ok' : '') +
                      (available === false ? ' landing__status--reject' : '')
                    }
                  >
                    {slug.length < 3 ? '' : checking ? (
                      <>
                        <span className="landing__pulse" aria-hidden="true" />
                        Checking
                      </>
                    ) : available === true ? (
                      `${slug}.${domain} is available`
                    ) : available === false ? (
                      'That address is taken'
                    ) : ''}
                  </p>
                </div>

                <div className="landing__field">
                  <label className="landing__label" htmlFor="fullName">Your name</label>
                  <input
                    id="fullName"
                    className="landing__input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </div>

                <div className="landing__field">
                  <label className="landing__label" htmlFor="email">Your email</label>
                  <input
                    id="email"
                    className="landing__input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <button type="submit" className="landing__submit" disabled={!canSubmit}>
                  {submitting ? 'Creating workspace' : 'Create workspace'}
                </button>
              </form>

              <p className="landing__signin">
                Already have a workspace? Sign in at your own address.
              </p>
            </section>
          </div>

          <figure className="landing__tank">
            <svg
              className="landing__tank-svg"
              viewBox="0 0 200 200"
              role="img"
              aria-label="A dewar seen from above, with five loaded canisters and one open position."
            >
              {/* Neck and inner wall of the dewar */}
              <circle cx="100" cy="100" r="92" fill="none"
                stroke="var(--lp-line)" strokeWidth="1" />
              <circle cx="100" cy="100" r="82" fill="none"
                stroke="var(--lp-steel)" strokeWidth="0.75" strokeDasharray="2 4" />

              {/* Loaded canisters */}
              {CANISTERS.map((can, i) => {
                const { x, y } = position(i + 1)
                const fill = can.owner === 'owned' ? 'var(--lp-owned)' : 'var(--lp-held)'
                return (
                  <g key={can.id} className="landing__can"
                    style={{ animationDelay: `${i * 70}ms` }}>
                    <circle cx={x} cy={y} r="16" fill={fill} />
                    <text className="landing__can-label" x={x} y={y + 2.5}
                      textAnchor="middle">{can.id}</text>
                  </g>
                )
              })}

              {/* The open position, claimed once the address is confirmed free */}
              <g className="landing__can" style={{ animationDelay: '350ms' }}>
                <circle
                  className="landing__slot-ring"
                  cx={slot.x} cy={slot.y} r="16"
                  fill={claimed ? 'var(--lp-owned)' : 'transparent'}
                  stroke={claimed ? 'var(--lp-owned)' : 'var(--lp-steel)'}
                  strokeWidth="1.5"
                  strokeDasharray={claimed ? '0' : '2.5 3'}
                />
                <text
                  className={`landing__slot-label${claimed ? ' landing__slot-label--claimed' : ''}`}
                  x={slot.x} y={slot.y + 2.5} textAnchor="middle"
                >
                  {claimed ? slug.slice(0, 5) : 'A1'}
                </text>
              </g>

              {/* Cane bundle at the centre */}
              <circle cx="100" cy="100" r="7" fill="none"
                stroke="var(--lp-steel)" strokeWidth="0.75" />
            </svg>

            <figcaption className="landing__tank-caption">
              {claimed ? `${slug}.${domain}` : 'Tank 01 · one position open'}
            </figcaption>

            <div className="landing__legend">
              <span className="landing__legend-item">
                <span className="landing__swatch landing__swatch--owned" aria-hidden="true" />
                Yours
              </span>
              <span className="landing__legend-item">
                <span className="landing__swatch landing__swatch--held" aria-hidden="true" />
                Customer-held
              </span>
            </div>

            {/* One record, as the app stores it. Shows what "know where it is"
                actually resolves to, without a screenshot. */}
            <dl className="landing__record">
              <div className="landing__record-row">
                <dt>Position</dt>
                <dd>Tank 01 · A3 · C-141</dd>
              </div>
              <div className="landing__record-row">
                <dt>Contents</dt>
                <dd>Simmental · conventional</dd>
              </div>
              <div className="landing__record-row">
                <dt>Quantity</dt>
                <dd>30 straws</dd>
              </div>
              <div className="landing__record-row">
                <dt>Owner</dt>
                <dd>Customer-held</dd>
              </div>
            </dl>
          </figure>
        </div>

        <section className="landing__facts">
          <div>
            <h3 className="landing__fact-term">Tanks &amp; canisters</h3>
            <p className="landing__fact-body">
              Every straw and embryo carries its position: which tank, which canister,
              which cane. Look something up once and go straight to it.
            </p>
          </div>
          <div>
            <h3 className="landing__fact-term">Ownership</h3>
            <p className="landing__fact-body">
              Separate what you own from what you store for customers, so a consignment
              is never mistaken for sale stock.
            </p>
          </div>
          <div>
            <h3 className="landing__fact-term">Before you run out</h3>
            <p className="landing__fact-body">
              Nitrogen levels and supply counts are watched for you, with email alerts
              when a tank or an item drops below its threshold.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
