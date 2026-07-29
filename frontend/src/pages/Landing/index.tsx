import { useEffect, useState, type FormEvent } from 'react'
import { FiAlertCircle, FiCheck } from 'react-icons/fi'
import { createTenantWithOwner, isSlugAvailable } from '../../api/tenants'
import type { CreateTenantError } from '../../api/tenants'
import { baseDomain } from '../../config/tenant'
import '../Login/styles.css'

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
      return
    }
    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        setAvailable(await isSlugAvailable(slug))
      } catch {
        setAvailable(null)
      } finally {
        setChecking(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [slug])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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
    <main className="login">
      <div className="login__container">
        <div className="login__card">
          <div className="login__header">
            <h1 className="login__title">Create your GeneHub workspace</h1>
            <p className="login__subtitle">
              Genetic inventory management for breeding operations.
              Pick an address and you are set up in a minute.
            </p>
          </div>

          {error && (
            <div className="login__error" role="alert">
              <FiAlertCircle aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login__form">
            <div className="login__field">
              <label htmlFor="name" className="login__label">Operation name</label>
              <input
                id="name"
                type="text"
                className="login__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bar 7 Cattle Co"
                autoComplete="organization"
                required
              />
            </div>

            <div className="login__field">
              <label htmlFor="slug" className="login__label">Your address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  id="slug"
                  type="text"
                  className="login__input"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setSlug(toSlug(e.target.value))
                  }}
                  placeholder="bar-7"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <span style={{ whiteSpace: 'nowrap', color: '#666' }}>.{domain}</span>
              </div>

              {slug.length >= 3 && (
                <p
                  style={{
                    margin: '0.35rem 0 0',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: checking ? '#666' : available ? '#1a7f37' : '#b42318',
                  }}
                >
                  {checking ? 'Checking…' : available ? (
                    <>
                      <FiCheck aria-hidden="true" /> {slug}.{domain} is available
                    </>
                  ) : (
                    <>
                      <FiAlertCircle aria-hidden="true" /> That address is not available
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="login__field">
              <label htmlFor="fullName" className="login__label">Your name</label>
              <input
                id="fullName"
                type="text"
                className="login__input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div className="login__field">
              <label htmlFor="email" className="login__label">Your email</label>
              <input
                id="email"
                type="email"
                className="login__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="login__submit" disabled={!canSubmit}>
              {submitting ? 'Creating…' : 'Create workspace'}
            </button>
          </form>

          <p className="login__subtitle" style={{ marginTop: '1rem' }}>
            Already have a workspace? Go to your own address,
            for example <code>yourname.{domain}</code>.
          </p>
        </div>
      </div>
    </main>
  )
}
