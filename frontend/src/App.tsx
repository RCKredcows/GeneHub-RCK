import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession, onAuthStateChange } from './api'
import { fetchCurrentTenant, fetchTenantBranding } from './api/tenants'
import {
  applyTenant,
  resetTenant,
  tenantSlugFromHostname,
  tenantHostname,
  baseDomain,
} from './config/tenant'
import ProtectedRoute from './components/common/ProtectedRoute'
import OfflineBanner from './components/common/OfflineBanner'
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
          applyTenant(own)

          // Signed in at another tenant's subdomain: send them to their own,
          // keeping the path so a deep link still lands where it was aimed.
          if (own?.slug && hostSlug && hostSlug !== own.slug) {
            window.location.replace(
              `${window.location.protocol}//${tenantHostname(own.slug)}${window.location.pathname}${window.location.search}`
            )
            return
          }
          setTenantMissing(false)
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

    // Get initial session
    getSession().then(async ({ session }) => {
      await hydrateTenant(session)
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      await hydrateTenant(session)
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
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
