import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession, onAuthStateChange } from './api'
import { fetchCurrentTenant, fetchTenantBranding } from './api/tenants'
import { applyTenant, resetTenant, tenantSlugFromHostname } from './config/tenant'
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

  useEffect(() => {
    // Load dark mode preference on app start
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Resolve branding before the first paint. A signed-in user's own tenant is
    // authoritative; falling back to the subdomain is what brands the login
    // screen, where there is no session to read a tenant from.
    const hydrateTenant = async (session: Session | null) => {
      try {
        if (session) {
          applyTenant(await fetchCurrentTenant())
          return
        }
        const slug = tenantSlugFromHostname()
        applyTenant(slug ? await fetchTenantBranding(slug) : null)
      } catch {
        // Branding is cosmetic; a failure here must not block sign-in.
        resetTenant()
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
