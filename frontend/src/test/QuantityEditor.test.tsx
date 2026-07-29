import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuantityEditor from '../components/common/QuantityEditor'

describe('QuantityEditor Component', () => {
  const defaultProps = {
    item: { id: '1', quantity: 10, status: 'stored' },
    inputValue: 1,
    updateAmount: 1,
    isUpdating: false,
    onInputChange: vi.fn(),
    onUpdate: vi.fn(),
  }

  it('renders current quantity', () => {
    render(<QuantityEditor {...defaultProps} />)
    
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Units')).toBeInTheDocument()
  })

  it('shows loading indicator when updating', () => {
    render(<QuantityEditor {...defaultProps} isUpdating={true} />)
    
    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.queryByText('10')).not.toBeInTheDocument()
  })

  it('calls onUpdate with positive delta when plus button clicked', () => {
    const onUpdate = vi.fn()
    render(<QuantityEditor {...defaultProps} onUpdate={onUpdate} />)
    
    const plusButton = screen.getByTitle('Add 1 unit(s)')
    fireEvent.click(plusButton)
    
    expect(onUpdate).toHaveBeenCalledWith(defaultProps.item, 1)
  })

  it('calls onUpdate with negative delta when minus button clicked', () => {
    const onUpdate = vi.fn()
    render(<QuantityEditor {...defaultProps} onUpdate={onUpdate} />)
    
    const minusButton = screen.getByTitle('Remove 1 unit(s)')
    fireEvent.click(minusButton)
    
    expect(onUpdate).toHaveBeenCalledWith(defaultProps.item, -1)
  })

  it('calls onInputChange when input value changes', () => {
    const onInputChange = vi.fn()
    render(<QuantityEditor {...defaultProps} onInputChange={onInputChange} />)
    
    const input = screen.getByTitle('Amount to add/remove')
    fireEvent.change(input, { target: { value: '5' } })
    
    expect(onInputChange).toHaveBeenCalledWith('5')
  })

  it('disables buttons when updating', () => {
    render(<QuantityEditor {...defaultProps} isUpdating={true} />)
    
    const plusButton = screen.getByTitle('Add 1 unit(s)')
    const minusButton = screen.getByTitle('Remove 1 unit(s)')
    
    expect(plusButton).toBeDisabled()
    expect(minusButton).toBeDisabled()
  })

  it('disables minus button when quantity is zero', () => {
    const props = {
      ...defaultProps,
      item: { id: '1', quantity: 0, status: 'stored' },
    }
    render(<QuantityEditor {...props} />)
    
    const minusButton = screen.getByTitle('Remove 1 unit(s)')
    expect(minusButton).toBeDisabled()
  })

  it('uses custom updateAmount for button titles', () => {
    render(<QuantityEditor {...defaultProps} updateAmount={5} />)
    
    expect(screen.getByTitle('Add 5 unit(s)')).toBeInTheDocument()
    expect(screen.getByTitle('Remove 5 unit(s)')).toBeInTheDocument()
  })

  it('renders input with correct value', () => {
    render(<QuantityEditor {...defaultProps} inputValue={3} />)
    
    const input = screen.getByTitle('Amount to add/remove')
    expect(input).toHaveValue(3)
  })
})
