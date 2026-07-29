import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSpinner from '../components/common/LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders with default medium size', () => {
    render(<LoadingSpinner />)
    
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('spinner--md')
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('spinner--sm')
  })

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('spinner--lg')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('custom-class')
  })

  it('contains the morph animation element', () => {
    render(<LoadingSpinner />)
    
    const morphElement = document.querySelector('.spinner__morph')
    expect(morphElement).toBeInTheDocument()
  })

  it('applies multiple classes correctly', () => {
    render(<LoadingSpinner size="lg" className="my-spinner" />)
    
    const spinner = document.querySelector('.spinner')
    expect(spinner).toHaveClass('spinner')
    expect(spinner).toHaveClass('spinner--lg')
    expect(spinner).toHaveClass('my-spinner')
  })
})
