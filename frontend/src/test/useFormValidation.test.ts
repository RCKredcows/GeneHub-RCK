import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation, getFieldClassName } from '../hooks/useFormValidation'

describe('useFormValidation', () => {
  describe('required validation', () => {
    it('returns error for empty required field', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ name: '' })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('name')).toBe('Name is required')
    })

    it('returns no error for filled required field', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ name: 'John' })
      })

      expect(isValid).toBe(true)
      expect(result.current.hasFieldError('name')).toBe(false)
    })

    it('treats whitespace-only as empty', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ name: '   ' })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('name')).toBe('Name is required')
    })
  })

  describe('requiredIf validation', () => {
    it('requires field when condition is met', () => {
      const rules = {
        customer_id: {
          requiredIf: { field: 'owner_type', value: 'customer', message: 'Please select a customer' }
        }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ owner_type: 'customer', customer_id: null })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('customer_id')).toBe('Please select a customer')
    })

    it('does not require field when condition is not met', () => {
      const rules = {
        customer_id: {
          requiredIf: { field: 'owner_type', value: 'customer', message: 'Please select a customer' }
        }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ owner_type: 'rck', customer_id: null })
      })

      expect(isValid).toBe(true)
      expect(result.current.hasFieldError('customer_id')).toBe(false)
    })
  })

  describe('custom validate function', () => {
    it('runs custom validation for conditional required fields', () => {
      const rules = {
        sire_id: {
          validate: (value: unknown, allValues: Record<string, unknown>) => {
            if (allValues.inventory_type === 'semen' && !value) {
              return 'Please select a sire'
            }
            return ''
          }
        }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ inventory_type: 'semen', sire_id: null })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('sire_id')).toBe('Please select a sire')
    })

    it('passes when custom validation condition is not met', () => {
      const rules = {
        sire_id: {
          validate: (value: unknown, allValues: Record<string, unknown>) => {
            if (allValues.inventory_type === 'semen' && !value) {
              return 'Please select a sire'
            }
            return ''
          }
        }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ inventory_type: 'embryo', sire_id: null })
      })

      expect(isValid).toBe(true)
    })
  })

  describe('min validation', () => {
    it('returns error when value is below minimum', () => {
      const rules = {
        quantity: { min: { value: 1, message: 'Quantity must be at least 1' } }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ quantity: 0 })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('quantity')).toBe('Quantity must be at least 1')
    })

    it('passes when value meets minimum', () => {
      const rules = {
        quantity: { min: { value: 1, message: 'Quantity must be at least 1' } }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ quantity: 5 })
      })

      expect(isValid).toBe(true)
    })
  })

  describe('max validation', () => {
    it('returns error when value exceeds maximum', () => {
      const rules = {
        quantity: { max: { value: 100, message: 'Quantity must be at most 100' } }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ quantity: 150 })
      })

      expect(isValid).toBe(false)
      expect(result.current.getFieldError('quantity')).toBe('Quantity must be at most 100')
    })
  })

  describe('multiple field validation', () => {
    it('validates all fields and returns first error field', () => {
      const rules = {
        name: { required: 'Name is required' },
        breed: { required: 'Breed is required' },
        owner_type: { required: 'Owner type is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      let isValid
      act(() => {
        isValid = result.current.validateAll({ name: '', breed: '', owner_type: '' })
      })

      expect(isValid).toBe(false)
      expect(result.current.hasFieldError('name')).toBe(true)
      expect(result.current.hasFieldError('breed')).toBe(true)
      expect(result.current.hasFieldError('owner_type')).toBe(true)
    })
  })

  describe('reset', () => {
    it('clears all errors and touched state', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      act(() => {
        result.current.validateAll({ name: '' })
      })

      expect(result.current.hasFieldError('name')).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.hasFieldError('name')).toBeFalsy()
      expect(result.current.getFieldError('name')).toBeFalsy()
    })
  })

  describe('hasFieldError', () => {
    it('returns falsy for untouched fields', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      expect(result.current.hasFieldError('name')).toBeFalsy()
    })

    it('returns true for touched fields with errors', () => {
      const rules = {
        name: { required: 'Name is required' }
      }
      const { result } = renderHook(() => useFormValidation(rules))

      act(() => {
        result.current.validateAll({ name: '' })
      })

      expect(result.current.hasFieldError('name')).toBe(true)
    })
  })
})

describe('getFieldClassName', () => {
  it('returns base class when no error', () => {
    expect(getFieldClassName('form-input', false)).toBe('form-input')
  })

  it('returns base class with error modifier when error exists', () => {
    expect(getFieldClassName('form-input', true)).toBe('form-input form-input--error')
  })

  it('works with form-select class', () => {
    expect(getFieldClassName('form-select', true)).toBe('form-select form-select--error')
  })
})
