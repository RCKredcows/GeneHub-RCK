import { useEffect, useState, type FormEvent } from 'react'
import {
  FiAlertCircle,
  FiArrowRight,
  FiBox,
  FiCheck,
  FiChevronRight,
  FiLayers,
  FiMapPin,
  FiPackage,
  FiShield,
  FiTrendingDown,
  FiUsers,
} from 'react-icons/fi'
import { createTenantWithOwner, isSlugAvailable } from '../../api/tenants'
import type { CreateTenantError } from '../../api/tenants'
import { baseDomain } from '../../config/tenant'
import './styles.css'

/** Turns "Bar 7 Cattle Co" into "bar-7-cattle-co". */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

const MESSAGES: Record<CreateTenantError, string> = {
  invalid_slug: 'Use 3 to 40 letters, numbers, or hyphens.',
  reserved_slug: 'That address is reserved. Try another.',
  slug_taken: 'That address is already in use.',
  missing_name: 'Give your workspace a name.',
  invalid_email: 'That email address does not look right.',
  email_taken: 'That email already belongs to a workspace. Sign in there instead.',
}

const productFeatures = [
  {
    icon: FiLayers,
    title: 'Genetic inventory',
    body: 'Track semen and embryos by sire, owner, quantity, status, and exact storage location.',
  },
  {
    icon: FiMapPin,
    title: 'Tank & canister maps',
    body: 'Find inventory quickly with an organized view of every tank, canister, and cane.',
  },
  {
    icon: FiPackage,
    title: 'Supply control',
    body: 'Keep medical and breeding supplies visible with usage history and low-stock alerts.',
  },
]

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

  const domain = baseDomain()

  // Derive the subdomain from the workspace name until the user takes it over.
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

  return (
    <main className="landing">
      <header className="landing__nav">
        <a className="landing__brand" href="/" aria-label="GeneHub home">
          <img src="/icon-192.png" alt="" className="landing__brand-mark" />
          <span>GeneHub</span>
        </a>

        <nav className="landing__nav-links" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#workflow">How it works</a>
          <a href="#create-workspace" className="landing__nav-cta">
            Create workspace <FiArrowRight aria-hidden="true" />
          </a>
        </nav>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="landing__eyebrow">
            <span aria-hidden="true" />
            Breeding inventory, finally organized
          </p>
          <h1>Every straw. Every tank. Right where it should be.</h1>
          <p className="landing__hero-text">
            GeneHub brings genetic inventory, tank locations, customers, and supplies into one
            clear workspace built for livestock breeding teams.
          </p>

          <div className="landing__hero-actions">
            <a href="#create-workspace" className="landing__button landing__button--primary">
              Set up your operation <FiArrowRight aria-hidden="true" />
            </a>
            <a href="#product" className="landing__button landing__button--ghost">
              Explore GeneHub <FiChevronRight aria-hidden="true" />
            </a>
          </div>

          <div className="landing__hero-points" aria-label="GeneHub benefits">
            <span><FiCheck aria-hidden="true" /> Mobile-ready</span>
            <span><FiCheck aria-hidden="true" /> Built-in activity history</span>
            <span><FiCheck aria-hidden="true" /> Your own workspace</span>
          </div>
        </div>

        <div className="landing__product-window" aria-label="GeneHub dashboard preview">
          <div className="landing__window-bar">
            <div className="landing__window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="landing__window-address">bar7.{domain}/dashboard</div>
            <span className="landing__window-live"><i /> Live inventory</span>
          </div>

          <div className="landing__app-preview">
            <aside className="landing__preview-sidebar" aria-hidden="true">
              <div className="landing__preview-logo">
                <img src="/icon-192.png" alt="" />
              </div>
              <span className="is-active"><FiBox /></span>
              <span><FiLayers /></span>
              <span><FiMapPin /></span>
              <span><FiUsers /></span>
            </aside>

            <div className="landing__preview-main">
              <div className="landing__preview-heading">
                <div>
                  <p>Monday, July 28</p>
                  <h2>Good morning, Jane</h2>
                </div>
                <span>Bar 7 Cattle Co.</span>
              </div>

              <div className="landing__metric-grid">
                <article>
                  <div className="landing__metric-icon landing__metric-icon--teal"><FiLayers /></div>
                  <p>Genetic inventory</p>
                  <strong>1,842</strong>
                  <span>units tracked</span>
                </article>
                <article>
                  <div className="landing__metric-icon landing__metric-icon--violet"><FiBox /></div>
                  <p>Active tanks</p>
                  <strong>12</strong>
                  <span>48 canisters</span>
                </article>
                <article>
                  <div className="landing__metric-icon landing__metric-icon--lime"><FiTrendingDown /></div>
                  <p>Needs attention</p>
                  <strong>3</strong>
                  <span>low-stock items</span>
                </article>
              </div>

              <div className="landing__preview-panels">
                <article className="landing__tank-panel">
                  <div className="landing__panel-title">
                    <div>
                      <p>Tank status</p>
                      <strong>All storage locations</strong>
                    </div>
                    <span>View tanks</span>
                  </div>
                  <div className="landing__tank-row">
                    <span className="landing__tank-gauge landing__tank-gauge--full">92%</span>
                    <div><strong>Main Tank</strong><small>24 canisters</small></div>
                    <span className="landing__status landing__status--good">Good</span>
                  </div>
                  <div className="landing__tank-row">
                    <span className="landing__tank-gauge landing__tank-gauge--watch">48%</span>
                    <div><strong>North Barn</strong><small>16 canisters</small></div>
                    <span className="landing__status landing__status--watch">Watch</span>
                  </div>
                </article>

                <article className="landing__activity-panel">
                  <div className="landing__panel-title">
                    <div>
                      <p>Recent activity</p>
                      <strong>Today</strong>
                    </div>
                  </div>
                  <div className="landing__activity-item">
                    <i className="landing__activity-dot landing__activity-dot--teal" />
                    <div><strong>Inventory checked in</strong><small>12 units · 9:42 AM</small></div>
                  </div>
                  <div className="landing__activity-item">
                    <i className="landing__activity-dot landing__activity-dot--violet" />
                    <div><strong>Tank level updated</strong><small>Main Tank · 8:15 AM</small></div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__value-strip" aria-label="Product overview">
        <p>One dependable workspace</p>
        <span aria-hidden="true" />
        <p>From the tank room</p>
        <span aria-hidden="true" />
        <p>To the front office</p>
      </section>

      <section className="landing__section landing__product" id="product">
        <div className="landing__section-heading">
          <p className="landing__section-kicker">Everything has a place</p>
          <h2>Less time searching. More confidence in every decision.</h2>
          <p>
            GeneHub connects the details your team handles every day, without turning the work
            into another complicated system to maintain.
          </p>
        </div>

        <div className="landing__feature-grid">
          {productFeatures.map(({ icon: Icon, title, body }, index) => (
            <article className="landing__feature-card" key={title}>
              <div className={`landing__feature-number landing__feature-number--${index + 1}`}>
                <Icon aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
              <span><FiCheck aria-hidden="true" /> Clear, searchable records</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__workflow" id="workflow">
        <div className="landing__workflow-inner">
          <div className="landing__workflow-copy">
            <p className="landing__section-kicker">Made for the real workflow</p>
            <h2>From check-in to checkout, the history stays with the inventory.</h2>
            <p>
              Give your whole team one source of truth—whether they are receiving inventory,
              locating a cane, checking a tank, or preparing a customer order.
            </p>
            <div className="landing__workflow-note">
              <FiShield aria-hidden="true" />
              <div>
                <strong>Separate workspace, clear ownership</strong>
                <span>Each operation gets its own address and isolated records.</span>
              </div>
            </div>
          </div>

          <ol className="landing__steps">
            <li>
              <span>01</span>
              <div>
                <h3>Check inventory in</h3>
                <p>Capture owner, sire, quantity, type, and storage details once.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Know exactly where it lives</h3>
                <p>Organize every item by tank and canister for faster retrieval.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Keep a reliable trail</h3>
                <p>See quantity changes, tank fills, supply use, and recent activity.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing__signup-section" id="create-workspace">
        <div className="landing__signup-copy">
          <p className="landing__section-kicker">Start with your own address</p>
          <h2>Bring your operation into focus.</h2>
          <p>
            Create a GeneHub workspace for your team. Choose the address, add your details, and
            finish setting up your owner account.
          </p>

          <div className="landing__signup-benefits">
            <div><FiCheck aria-hidden="true" /><span>Your own GeneHub subdomain</span></div>
            <div><FiCheck aria-hidden="true" /><span>Workspace-level data separation</span></div>
            <div><FiCheck aria-hidden="true" /><span>Ready for your team and inventory</span></div>
          </div>
        </div>

        <div className="landing__signup-card">
          <div className="landing__form-heading">
            <div>
              <p>New workspace</p>
              <h2>Set up your operation</h2>
            </div>
            <span>About 1 minute</span>
          </div>

          {error && (
            <div className="landing__error" role="alert">
              <FiAlertCircle aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="landing__form">
            <div className="landing__field landing__field--full">
              <label htmlFor="name">Operation name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Bar 7 Cattle Co"
                autoComplete="organization"
                required
              />
            </div>

            <div className="landing__field landing__field--full">
              <label htmlFor="slug">Workspace address</label>
              <div className="landing__address-input">
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true)
                    setSlug(toSlug(event.target.value))
                  }}
                  placeholder="bar-7"
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="slug-status"
                  required
                />
                <span>.{domain}</span>
              </div>

              <p
                id="slug-status"
                className={[
                  'landing__field-status',
                  checking ? 'is-checking' : available === true ? 'is-available' : available === false ? 'is-unavailable' : '',
                ].join(' ')}
                aria-live="polite"
              >
                {slug.length < 3 ? (
                  'Use at least 3 letters or numbers.'
                ) : checking ? (
                  'Checking this address…'
                ) : available ? (
                  <><FiCheck aria-hidden="true" /> {slug}.{domain} is available</>
                ) : available === false ? (
                  <><FiAlertCircle aria-hidden="true" /> That address is not available</>
                ) : (
                  'We could not check that address yet.'
                )}
              </p>
            </div>

            <div className="landing__field">
              <label htmlFor="fullName">Your name <span>Optional</span></label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div className="landing__field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@bar7.com"
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="landing__submit" disabled={!canSubmit}>
              {submitting ? (
                <><span className="landing__spinner" aria-hidden="true" /> Creating workspace…</>
              ) : (
                <>Create my workspace <FiArrowRight aria-hidden="true" /></>
              )}
            </button>
          </form>

          <p className="landing__existing">
            Already have a workspace? Open the address your team shared with you, such as{' '}
            <code>yourname.{domain}</code>.
          </p>
        </div>
      </section>

      <footer className="landing__footer">
        <a className="landing__brand" href="/" aria-label="GeneHub home">
          <img src="/icon-192.png" alt="" className="landing__brand-mark" />
          <span>GeneHub</span>
        </a>
        <p>Inventory clarity for modern breeding operations.</p>
      </footer>
    </main>
  )
}
