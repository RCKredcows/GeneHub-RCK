import type React from 'react';
import { Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  session: Session | null;
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Redirects to login if no session exists
 */
const ProtectedRoute = ({ session, children }: ProtectedRouteProps) => {
  if (!session) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
