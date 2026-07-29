import React from 'react';
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import ProtectedRoute from '../components/common/ProtectedRoute'

// Wrapper component to provide router context
const renderWithRouter = (ui: React.ReactElement, { initialEntries = ['/protected'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe('ProtectedRoute Component', () => {
  it('renders children when session exists', () => {
    const session = { user: { id: '1', email: 'test@example.com' } } as Session
    
    renderWithRouter(
      <ProtectedRoute session={session}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('does not render children when session is null', () => {
    renderWithRouter(
      <ProtectedRoute session={null}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('does not render children when session is undefined', () => {
    renderWithRouter(
      <ProtectedRoute session={null}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders nested components when authenticated', () => {
    const session = { user: { id: '1' } } as Session
    
    renderWithRouter(
      <ProtectedRoute session={session}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to the dashboard</p>
        </div>
      </ProtectedRoute>
    )
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the dashboard')).toBeInTheDocument()
  })
})
