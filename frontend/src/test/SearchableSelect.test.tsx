import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchableSelect from '../components/common/SearchableSelect'

describe('SearchableSelect Component', () => {
  const mockOptions = [
    { id: 1, name: 'Option One' },
    { id: 2, name: 'Option Two' },
    { id: 3, name: 'Option Three' },
  ]

  const defaultProps = {
    id: 'test-select',
    name: 'testField',
    value: '',
    onChange: vi.fn(),
    options: mockOptions,
    getOptionLabel: (opt: Record<string, unknown>) => opt.name as string,
    getOptionValue: (opt: Record<string, unknown>) => String(opt.id),
  }

  it('renders with placeholder when no value selected', () => {
    render(<SearchableSelect {...defaultProps} placeholder="Select item..." />)
    
    expect(screen.getByText('Select item...')).toBeInTheDocument()
  })

  it('displays selected value', () => {
    render(<SearchableSelect {...defaultProps} value="1" />)

    expect(screen.getByText('Option One')).toBeInTheDocument()
  })

  it('opens dropdown when trigger is clicked', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    const trigger = screen.getByRole('button', { expanded: false })
    fireEvent.click(trigger)
    
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('shows all options in dropdown', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    
    expect(screen.getByText('Option One')).toBeInTheDocument()
    expect(screen.getByText('Option Two')).toBeInTheDocument()
    expect(screen.getByText('Option Three')).toBeInTheDocument()
  })

  it('filters options based on search', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    // Type in search
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'Two' } })
    
    expect(screen.getByText('Option Two')).toBeInTheDocument()
    expect(screen.queryByText('Option One')).not.toBeInTheDocument()
    expect(screen.queryByText('Option Three')).not.toBeInTheDocument()
  })

  it('shows no results message when search has no matches', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'xyz' } })
    
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} onChange={onChange} />)
    
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Option Two'))
    
    expect(onChange).toHaveBeenCalledWith({
      target: {
        name: 'testField',
        value: '2',
      }
    })
  })

  it('closes dropdown after selection', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Option One'))
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })

  it('shows clear button when value is selected', () => {
    render(<SearchableSelect {...defaultProps} value="1" />)

    const clearButton = screen.getByRole('button', { name: /clear selection/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('clears selection when clear button is clicked', () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...defaultProps} value="1" onChange={onChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear selection/i })
    fireEvent.click(clearButton)
    
    expect(onChange).toHaveBeenCalledWith({
      target: {
        name: 'testField',
        value: '',
      }
    })
  })

  it('does not open dropdown when disabled', () => {
    render(<SearchableSelect {...defaultProps} disabled={true} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })

  it('applies disabled class when disabled', () => {
    render(<SearchableSelect {...defaultProps} disabled={true} />)
    
    const container = document.querySelector('.searchable-select')
    expect(container).toHaveClass('searchable-select--disabled')
  })

  it('uses custom search placeholder', () => {
    render(<SearchableSelect {...defaultProps} searchPlaceholder="Find option..." />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.getByPlaceholderText('Find option...')).toBeInTheDocument()
  })

  it('closes dropdown on Escape key', () => {
    render(<SearchableSelect {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    
    const dropdown = document.querySelector('.searchable-select__dropdown')!
    fireEvent.keyDown(dropdown, { key: 'Escape' })
    
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })
})
