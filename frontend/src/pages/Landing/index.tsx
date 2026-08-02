import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { FiAlertCircle, FiArrowRight, FiCheck, FiChevronRight, FiMenu, FiX } from 'react-icons/fi'
import { createTenantWithOwner, isSlugAvailable } from '../../api/tenants'
import type { CreateTenantError } from '../../api/tenants'
import { baseDomain } from '../../config/tenant'
import Showcase from './Showcase'
import './styles.css'

/** Turns an operation name into a URL-safe subdomain. */
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

/**
 * Background footage for the hero, served from /public.
 *
 * Null falls back to the CSS backdrop, which is what ships today. Point this at
 * your own clip -- tank room, canes coming out of vapor, cattle in a lot -- and
 * it layers in underneath the copy. Keep it short, muted, and under ~3 MB.
 */
const HERO_MEDIA: string | null = null

/** Rungs in the hero helix. Each one is a base pair turned a little further. */
const HELIX_RUNGS = 28


/** Sample operations for the name field's placeholder, typed one after another. */
const NAME_EXAMPLES = ['Rocking K Cattle', 'Circle Bar Ranch', 'Vance Genetics']

const TYPE_MS = 80
const ERASE_MS = 45
const HOLD_MS = 1700

/**
 * Types a phrase out, holds it, erases it, moves to the next.
 *
 * Runs only while `active` -- the caller switches it off once the field has
 * focus or content, so a moving placeholder never competes with real typing.
 */
function useTypewriter(phrases: string[], active: boolean): string {
  const [text, setText] = useState('')
  const [phrase, setPhrase] = useState(0)
  const [erasing, setErasing] = useState(false)

  useEffect(() => {
    if (!active) return

    const target = phrases[phrase % phrases.length]
    const written = !erasing && text === target
    const cleared = erasing && text === ''

    // Every transition runs off the timer, so nothing sets state during the
    // effect body itself.
    const delay = written ? HOLD_MS : cleared ? 320 : erasing ? ERASE_MS : TYPE_MS

    const timer = setTimeout(() => {
      if (written) {
        setErasing(true)
      } else if (cleared) {
        setErasing(false)
        setPhrase((current) => (current + 1) % phrases.length)
      } else {
        setText((current) => target.slice(0, current.length + (erasing ? -1 : 1)))
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [text, erasing, phrase, active, phrases])

  return text
}

const journey = [
  {
    stage: 'Received',
    title: 'Entered once',
    body: 'Owner, sire, type, quantity, and storage location go on the record the moment a unit arrives.',
  },
  {
    stage: 'Stored',
    title: 'Its address never goes missing',
    body: 'Tank, canister, and cane stay attached to the unit, so finding it later is a lookup, not a search.',
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

  const [menuOpen, setMenuOpen] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)

  const domain = baseDomain()

  // The placeholder only animates while the field is untouched, and never
  // when the visitor has asked for reduced motion.
  const stillMoving =
    !nameFocused &&
    name === '' &&
    !(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const typed = useTypewriter(NAME_EXAMPLES, stillMoving)
  const page = useRef<HTMLElement>(null)

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

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Sections ease into focus as they are scrolled to, once each.
  useEffect(() => {
    const targets = page.current?.querySelectorAll('[data-reveal]')
    if (!targets?.length) return

    // Without an observer nothing would ever un-hide, so show it all up front.
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((target) => target.classList.add('is-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

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
    <main className="landing" ref={page}>
      <section className="landing__stage">
        <div className="landing__stage-media" aria-hidden="true">
          {HERO_MEDIA && (
            <video autoPlay loop muted playsInline preload="metadata" src={HERO_MEDIA} />
          )}
        </div>

        {/* Each rung spins on its own axis, a fixed phase behind the one above
            it. The offset is what reads as a twist -- nothing is drawn curved. */}
        <div className="landing__helix" aria-hidden="true">
          <div className="landing__helix-strand">
            {Array.from({ length: HELIX_RUNGS }, (_, index) => (
              <span key={index} style={{ '--i': index } as CSSProperties} />
            ))}
          </div>
        </div>

        <header className="landing__nav" data-open={menuOpen}>
          <a className="landing__brand" href="/" aria-label="GeneHub home">
            <img src="/logo.svg" alt="" className="landing__brand-mark" />
            <span>GeneHub</span>
          </a>

          <button
            type="button"
            className="landing__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>

          <nav id="landing-menu" className="landing__nav-links" aria-label="Main navigation">
            <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
            <a
              href="#create-workspace"
              className="landing__nav-cta"
              onClick={() => setMenuOpen(false)}
            >
              Create workspace <FiArrowRight aria-hidden="true" />
            </a>
          </nav>
        </header>

        <div className="landing__stage-copy">
          <p className="landing__eyebrow">
            <span aria-hidden="true" />
            For livestock breeding operations
          </p>
          <h1>Your complete genetic inventory manager</h1>
          <p className="landing__hero-text">
            Semen and embryos by sire and owner. Every tank, canister, and cane. Supplies,
            customers, and the history behind all of it — in one place your whole team can use.
          </p>

          <div className="landing__hero-actions">
            <a href="#create-workspace" className="landing__button landing__button--solid">
              Set up your operation <FiArrowRight aria-hidden="true" />
            </a>
            <a href="#product" className="landing__button landing__button--outline">
              Explore GeneHub <FiChevronRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="landing__section landing__product" id="product">
        <div className="landing__section-heading" data-reveal>
          <p className="landing__section-kicker">Everything has a place</p>
          <h2>What it looks like day to day.</h2>
        </div>

        <div data-reveal>
          <Showcase />
        </div>
      </section>

      <section className="landing__workflow" id="workflow">
        <div className="landing__workflow-head" data-reveal>
          <p className="landing__section-kicker">The workflow</p>
          <h2>Entered once. Findable for as long as you keep it.</h2>
        </div>

        {/* A real sequence, so it is drawn as one: three stops on a rail. */}
        <ol className="journey" data-reveal>
          {journey.map(({ stage, title, body }, index) => (
            <li className="journey__stop" key={stage} style={{ '--d': index } as CSSProperties}>
              <span className="journey__marker" aria-hidden="true" />
              <span className="journey__stage">{stage}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing__signup-section" id="create-workspace">
        <div className="landing__signup-copy" data-reveal>
          <p className="landing__section-kicker">Open a workspace</p>
          <h2>Start your operation&rsquo;s record.</h2>
          <p>
            Pick the address your team will use, add your details, and finish setting up the
            owner account on your own subdomain.
          </p>

          <ul className="landing__signup-benefits">
            <li>Your own address on {domain}</li>
            <li>Records separated by workspace</li>
            <li>Ready for your team and inventory</li>
          </ul>
        </div>

        <div className="landing__signup-card" data-reveal>
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
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder={stillMoving ? `${typed}|` : NAME_EXAMPLES[0]}
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
                  placeholder={toSlug(typed) || 'your-operation'}
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
                  'At least 3 letters or numbers.'
                ) : checking ? (
                  'Checking this address…'
                ) : available ? (
                  <><FiCheck aria-hidden="true" /> {slug}.{domain} is available</>
                ) : available === false ? (
                  <><FiAlertCircle aria-hidden="true" /> That address is taken</>
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
                placeholder="jane@company.com"
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
            Already have a workspace? Open the address your team gave you.
          </p>
        </div>
      </section>

      <footer className="landing__footer" data-reveal>
        <a className="landing__brand" href="/" aria-label="GeneHub home">
          <img src="/logo.svg" alt="" className="landing__brand-mark" />
          <span>GeneHub</span>
        </a>
        <p>Inventory clarity for modern breeding operations.</p>
      </footer>
    </main>
  )
}
