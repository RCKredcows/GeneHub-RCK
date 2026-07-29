import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from '../pages/ForgotPassword'

// Mock the API
vi.mock('../api', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

import { sendPasswordResetEmail } from '../api'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  )
}

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password form', () => {
    renderWithRouter(<ForgotPassword />)
    
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    renderWithRouter(<ForgotPassword />)
    
    expect(screen.getByText('Back to Login')).toBeInTheDocument()
  })

  it('shows validation error for empty email', async () => {
    renderWithRouter(<ForgotPassword />)
    
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    renderWithRouter(<ForgotPassword />)
    
    // Use an email that passes browser validation but fails our custom validation
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'a@b' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('calls sendPasswordResetEmail with correct email', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({ success: true, error: null })

    renderWithRouter(<ForgotPassword />)

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows success message after successful email send', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({ success: true, error: null })

    renderWithRouter(<ForgotPassword />)

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })
  })

  it('shows error message on failed email send', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({
      success: false,
      error: new Error('User not found')
    })
    
    renderWithRouter(<ForgotPassword />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('shows loading state while sending', async () => {
    vi.mocked(sendPasswordResetEmail).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    renderWithRouter(<ForgotPassword />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    
    expect(screen.getByText('Sending...')).toBeInTheDocument()
  })

  it('disables input while loading', async () => {
    vi.mocked(sendPasswordResetEmail).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    renderWithRouter(<ForgotPassword />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    
    expect(screen.getByLabelText('Email Address')).toBeDisabled()
  })
})
