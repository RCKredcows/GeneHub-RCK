import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock the API
vi.mock('../api', () => ({
  signIn: vi.fn(),
}))

import { signIn } from '../api'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
  })

  it('shows validation error for empty email', async () => {
    renderWithRouter(<Login />)
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    renderWithRouter(<Login />)
    
    // Use an email that passes browser validation but fails our custom validation
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('shows validation error for empty password', async () => {
    renderWithRouter(<Login />)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    renderWithRouter(<Login />)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    const passwordInput = document.querySelector('#password')!
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('calls signIn with correct credentials', async () => {
    vi.mocked(signIn).mockResolvedValue({ data: {}, error: null } as Awaited<ReturnType<typeof signIn>>)

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    const passwordInput = document.querySelector('#password')!
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message on failed login', async () => {
    vi.mocked(signIn).mockResolvedValue({ data: null, error: new Error('Invalid credentials') })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    const passwordInput = document.querySelector('#password')!
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('clears email error when typing', async () => {
    renderWithRouter(<Login />)
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 't' } })
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
  })
})
