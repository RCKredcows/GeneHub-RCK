import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession, onAuthStateChange, signOut } from './api'
import { fetchCurrentTenant, fetchTenantBranding } from './api/tenants'
import {
  applyTenant,
  resetTenant,
  tenantSlugFromHostname,
  tenantHostname,
  baseDomain,
} from './config/tenant'
import ProtectedRoute from './components/common/ProtectedRoute'
import PrivacyPolicy from './pages/Legal/PrivacyPolicy'
import Pricing from './pages/Pricing'
import Welcome from './pages/Pricing/Welcome'
import OfflineBanner from './components/common/OfflineBanner'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Sires from './pages/Sires'
import GeneticInventory from './pages/GeneticInventory'
import Tanks from './pages/Tanks'
import MedicalInventory from './pages/MedicalInventory'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import './App.css'

import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [tenantMissing, setTenantMissing] = useState(false)
  // Set when a valid account signs in at a workspace it does not belong to.
  const [deniedSlug, setDeniedSlug] = useState<string | null>(null)
  // True between a session appearing and its workspace being confirmed. Without
  // it the app renders on the session alone and the dashboard flashes up before
  // a cross-workspace login is refused.
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // Load dark mode preference on app start
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Resolve branding before the first paint. A signed-in user's own tenant is
    // authoritative; falling back to the subdomain is what brands the login
    // screen, where there is no session to read a tenant from.
    //
    // The hostname check below is presentation only. Row level security already
    // guarantees a user reads nothing outside their own tenant regardless of
    // the URL, so this removes a confusing state rather than closing a hole.
    const hydrateTenant = async (session: Session | null) => {
      const hostSlug = tenantSlugFromHostname()

      try {
        if (session) {
          const own = await fetchCurrentTenant()

          // Signed in at a workspace this account does not belong to. Refuse
          // and say so, rather than bouncing them somewhere else: the session
          // lives in this origin's localStorage and cannot travel to another
          // subdomain anyway, so a redirect only produced a second login.
          if (own?.slug && hostSlug && hostSlug !== own.slug) {
            try {
              await signOut()
            } catch {
              // Saying no matters more than a clean sign-out.
            }
            // Keep this workspace's branding: the message is about where the
            // user is, not where they belong.
            applyTenant(await fetchTenantBranding(hostSlug).catch(() => null))
            setDeniedSlug(own.slug)
            return
          }

          applyTenant(own)
          setTenantMissing(false)
          setDeniedSlug(null)
          return
        }

        if (!hostSlug) {
          applyTenant(null)
          setTenantMissing(false)
          return
        }

        const branding = await fetchTenantBranding(hostSlug)
        applyTenant(branding)
        // A slug that matches no active tenant is a typo or a suspended
        // workspace. Saying so beats silently showing an unbranded login.
        setTenantMissing(!branding)
      } catch {
        // Branding is cosmetic; a failure here must not block sign-in.
        resetTenant()
        setTenantMissing(false)
      }
    }

    // Get initial session. The finally matters: without it any rejection here
    // leaves the app on "Loading..." permanently, with no way out but a reload.
    getSession()
      .then(async ({ session }) => {
        await hydrateTenant(session)
        setSession(session)
      })
      .catch((err) => {
        console.error('Session bootstrap failed:', err)
        setSession(null)
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth changes.
    //
    // This callback must stay synchronous and must not call Supabase. The auth
    // client holds a lock while it runs, so awaiting another Supabase request
    // here deadlocks: the promise never settles, setSession never runs, and the
    // UI freezes until a reload. That was the hanging "Logging in..." and the
    // sign-out that only took effect after a refresh.
    //
    // Session state updates immediately; tenant hydration is deferred to a
    // later tick, once the lock has been released.
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setVerifying(true)
      setTimeout(() => {
        void hydrateTenant(session).finally(() => setVerifying(false))
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // `verifying` is deliberately part of this gate. A session is not on its own
  // permission to render the app: it has to be confirmed against this
  // workspace first, or a cross-workspace login shows the dashboard before
  // being refused.
  if (loading || verifying) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh'
      }}>
        Loading...
      </div>
    )
  }

  if (!tenantSlugFromHostname()) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Valid credentials, wrong workspace. They have already been signed out of
  // this origin; this only explains why.
  if (deniedSlug) {
    const ownHost = tenantHostname(deniedSlug)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '0.75rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>You don't have access to this workspace</h1>
        <p style={{ margin: 0, color: '#666', maxWidth: '32rem' }}>
          Your account belongs to a different workspace. Sign in at{' '}
          <strong>{ownHost}</strong> instead.
        </p>
        <a href={`${window.location.protocol}//${ownHost}`}>
          Go to {ownHost}
        </a>
        <button
          type="button"
          onClick={() => setDeniedSlug(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Use a different account
        </button>
      </div>
    )
  }

  // The subdomain names no active workspace. Showing the ordinary login form
  // here would let a typo look like a working entry point.
  if (tenantMissing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '0.75rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Workspace not found</h1>
        <p style={{ margin: 0, color: '#666', maxWidth: '32rem' }}>
          There is no active workspace at <strong>{window.location.hostname}</strong>.
          Check the address, or contact whoever invited you.
        </p>
        <a href={`${window.location.protocol}//${baseDomain()}`}>
          Go to {baseDomain()}
        </a>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <SignUp />} />
        <Route path="/forgot-password" element={session ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute session={session}><Dashboard user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute session={session}><Customers user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/sires" element={<ProtectedRoute session={session}><Sires user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/genetic-inventory" element={<ProtectedRoute session={session}><GeneticInventory user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/tanks" element={<ProtectedRoute session={session}><Tanks user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/medical-inventory" element={<ProtectedRoute session={session}><MedicalInventory user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute session={session}><Settings user={session?.user ?? null} /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute session={session}><Activity user={session?.user ?? null} /></ProtectedRoute>} />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
