import type React from 'react';
import { Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import SubscriptionNotice from '../SubscriptionNotice'

interface ProtectedRouteProps {
  session: Session | null;
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Redirects to login if no session exists.
 *
 * Also carries the subscription notice, so a lapsed workspace says so on every
 * signed-in screen rather than only where someone remembered to add it. The
 * notice renders nothing when the subscription is healthy.
 */
const ProtectedRoute = ({ session, children }: ProtectedRouteProps) => {
  if (!session) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <SubscriptionNotice />
      {children}
    </>
  )
}

export default ProtectedRoute
