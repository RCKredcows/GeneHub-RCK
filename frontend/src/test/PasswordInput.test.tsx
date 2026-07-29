import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordInput from '../components/common/PasswordInput'

describe('PasswordInput Component', () => {
  const defaultProps = {
    id: 'password',
    value: '',
    onChange: vi.fn(),
  }

  it('renders with password type by default', () => {
    render(<PasswordInput {...defaultProps} />)
    
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('toggles to text type when show password is clicked', () => {
    render(<PasswordInput {...defaultProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    fireEvent.click(toggleButton)
    
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('toggles back to password type when hide password is clicked', () => {
    render(<PasswordInput {...defaultProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    fireEvent.click(toggleButton) // Show
    fireEvent.click(toggleButton) // Hide
    
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders label when provided', () => {
    render(<PasswordInput {...defaultProps} label="Password" />)
    
    expect(screen.getByText('Password')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    render(<PasswordInput {...defaultProps} />)
    
    const label = document.querySelector('label')
    expect(label).toBeNull()
  })

  it('renders placeholder when provided', () => {
    render(<PasswordInput {...defaultProps} placeholder="Enter password" />)
    
    const input = document.querySelector('input')
    expect(input).toHaveAttribute('placeholder', 'Enter password')
  })

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn()
    render(<PasswordInput {...defaultProps} onChange={onChange} />)
    
    const input = document.querySelector('input')
    fireEvent.change(input!, { target: { value: 'test123' } })
    
    expect(onChange).toHaveBeenCalled()
  })

  it('renders error message when provided', () => {
    render(<PasswordInput {...defaultProps} errorMessage="Password is required" />)
    
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('applies error class when error prop is true', () => {
    render(<PasswordInput {...defaultProps} error={true} />)
    
    const input = document.querySelector('input')
    expect(input).toHaveClass('password-input__field--error')
  })

  it('disables input when disabled prop is true', () => {
    render(<PasswordInput {...defaultProps} disabled={true} />)
    
    const input = document.querySelector('input')
    const toggleButton = screen.getByRole('button')
    
    expect(input).toBeDisabled()
    expect(toggleButton).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<PasswordInput {...defaultProps} className="custom-class" />)
    
    const wrapper = document.querySelector('.password-input')
    expect(wrapper).toHaveClass('custom-class')
  })

  it('displays current value', () => {
    render(<PasswordInput {...defaultProps} value="secretpass" />)
    
    const input = document.querySelector('input')
    expect(input).toHaveValue('secretpass')
  })
})
