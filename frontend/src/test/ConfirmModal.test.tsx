import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '../components/common/ConfirmModal'

describe('ConfirmModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  }

  it('returns null when not open', () => {
    const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders with default props', () => {
    render(<ConfirmModal {...defaultProps} />)
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders with custom title and message', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        title="Delete Item"
        message="This action cannot be undone."
      />
    )
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders with custom button text', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    )
    
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />)
    
    fireEvent.click(screen.getByText('Confirm'))
    
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    
    // Click on the overlay (the outermost div)
    const overlay = document.querySelector('.confirm-modal__overlay')!
    fireEvent.click(overlay)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal container is clicked', () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    
    // Click on the container (should stop propagation)
    const container = document.querySelector('.confirm-modal__container')!
    fireEvent.click(container)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies danger variant class by default', () => {
    render(<ConfirmModal {...defaultProps} />)
    
    const icon = document.querySelector('.confirm-modal__icon')
    expect(icon).toHaveClass('confirm-modal__icon--danger')
  })

  it('applies warning variant class when specified', () => {
    render(<ConfirmModal {...defaultProps} variant="warning" />)
    
    const icon = document.querySelector('.confirm-modal__icon')
    expect(icon).toHaveClass('confirm-modal__icon--warning')
  })
})
