import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'

// Mock the signOut function
vi.mock('../api', () => ({
  signOut: vi.fn(() => Promise.resolve()),
}))

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      {ui}
    </MemoryRouter>
  )
}

describe('Sidebar Component', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: {
      first_name: 'John',
      full_name: 'John Doe',
    },
  }

  const defaultProps = {
    user: mockUser,
    isOpen: true,
    setIsOpen: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logo', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('Gene')).toBeInTheDocument()
    expect(screen.getByText(/Hub 🧬/)).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Sires')).toBeInTheDocument()
    expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
    expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
    expect(screen.getByText('Medical Inventory')).toBeInTheDocument()
  })

  it('renders settings link', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('displays user email', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('displays user full name', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays user avatar with first letter of first name', () => {
    renderWithRouter(<Sidebar {...defaultProps} />)
    
    const avatar = document.querySelector('.sidebar__user-avatar')
    expect(avatar).toHaveTextContent('J')
  })

  it('falls back to email first letter for avatar when no first name', () => {
    const userWithoutName = {
      email: 'test@example.com',
      user_metadata: {},
    }
    
    renderWithRouter(<Sidebar {...defaultProps} user={userWithoutName} />)
    
    const avatar = document.querySelector('.sidebar__user-avatar')
    expect(avatar).toHaveTextContent('T')
  })

  it('displays "User" when no full name available', () => {
    const userWithoutName = {
      email: 'test@example.com',
      user_metadata: {},
    }
    
    renderWithRouter(<Sidebar {...defaultProps} user={userWithoutName} />)
    
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('calls setIsOpen(false) when close button is clicked', () => {
    const setIsOpen = vi.fn()
    renderWithRouter(<Sidebar {...defaultProps} setIsOpen={setIsOpen} />)
    
    const closeButton = screen.getByLabelText('Close menu')
    fireEvent.click(closeButton)
    
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('calls setIsOpen(false) when nav item is clicked', () => {
    const setIsOpen = vi.fn()
    renderWithRouter(<Sidebar {...defaultProps} setIsOpen={setIsOpen} />)
    
    fireEvent.click(screen.getByText('Customers'))
    
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('renders overlay when open', () => {
    renderWithRouter(<Sidebar {...defaultProps} isOpen={true} />)
    
    const overlay = document.querySelector('.sidebar__overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('does not render overlay when closed', () => {
    renderWithRouter(<Sidebar {...defaultProps} isOpen={false} />)
    
    const overlay = document.querySelector('.sidebar__overlay')
    expect(overlay).not.toBeInTheDocument()
  })

  it('calls setIsOpen(false) when overlay is clicked', () => {
    const setIsOpen = vi.fn()
    renderWithRouter(<Sidebar {...defaultProps} setIsOpen={setIsOpen} isOpen={true} />)
    
    const overlay = document.querySelector('.sidebar__overlay')!
    fireEvent.click(overlay)
    
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('applies open class when isOpen is true', () => {
    renderWithRouter(<Sidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = document.querySelector('.sidebar')
    expect(sidebar).toHaveClass('sidebar--open')
  })

  it('does not apply open class when isOpen is false', () => {
    renderWithRouter(<Sidebar {...defaultProps} isOpen={false} />)
    
    const sidebar = document.querySelector('.sidebar')
    expect(sidebar).not.toHaveClass('sidebar--open')
  })
})
