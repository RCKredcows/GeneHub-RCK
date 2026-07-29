import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTankForm } from '../hooks/useTanks/useTankForm'
import * as tanksApi from '../api/tanks'

// Mock the APIs
vi.mock('../api/tanks', () => ({
  createTank: vi.fn(),
  updateTank: vi.fn(),
  deleteTank: vi.fn(),
  normalizeTankPositions: vi.fn(),
  updateTankPosition: vi.fn(),
  insertTankAtPosition: vi.fn(),
}))

// Mock the dependent hooks
vi.mock('../hooks/useFormState', () => ({
  useFormState: () => ({
    values: {
      tank_name: 'Test Tank',
      location: 'Barn A',
      capacity: '10',
      nitrogen_capacity: '100',
      nitrogen_level: '80',
      nitrogen_unit: 'liters',
      low_level_threshold: '25',
      sort_order: '',
      notes: ''
    },
    handleChange: vi.fn(),
    populate: vi.fn(),
    reset: vi.fn(),
    setValues: vi.fn(),
  })
}))

vi.mock('../hooks/useModalState', () => ({
  useModalState: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    setIsOpen: vi.fn(),
  })
}))

vi.mock('../hooks/useAsyncOperation', () => ({
  formatErrorMessage: (err: unknown) => (err as Error)?.message || String(err) || 'An error occurred'
}))

vi.mock('../hooks/useConfirmModal', () => ({
  useConfirmModal: () => ({
    isOpen: false,
    itemId: null,
    itemName: '',
    open: vi.fn(),
    close: vi.fn(),
    confirmDelete: { isOpen: false, tankId: null, tankName: '' },
    setConfirmDelete: vi.fn(),
  })
}))

vi.mock('../hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: {},
    touched: {},
    validateAll: vi.fn(() => true),
    validateField: vi.fn(() => ''),
    getFieldError: vi.fn(() => ''),
    hasFieldError: vi.fn(() => false),
    setFieldError: vi.fn(),
    touchField: vi.fn(),
    handleBlur: vi.fn(),
    reset: vi.fn(),
  })
}))

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTankForm', () => {
  const mockTanks = [
    { id: '1', tank_name: 'Tank A', sort_order: 1 },
    { id: '2', tank_name: 'Tank B', sort_order: 2 },
    { id: '3', tank_name: 'Tank C', sort_order: 3 },
  ]
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tanksApi.createTank).mockResolvedValue({ data: { id: '4' }, error: null } as Awaited<ReturnType<typeof tanksApi.createTank>>)
    vi.mocked(tanksApi.updateTank).mockResolvedValue({ data: { id: '1' }, error: null } as Awaited<ReturnType<typeof tanksApi.updateTank>>)
    vi.mocked(tanksApi.deleteTank).mockResolvedValue({ success: true, error: null })
    vi.mocked(tanksApi.normalizeTankPositions).mockResolvedValue({ success: true, error: null })
    vi.mocked(tanksApi.updateTankPosition).mockResolvedValue({ success: true, error: null })
    vi.mocked(tanksApi.insertTankAtPosition).mockResolvedValue({ success: true, error: null })
  })

  describe('create tank position logic', () => {
    it('calls normalizeTankPositions when creating without specific position', async () => {
      const { result } = renderHook(() => useTankForm(mockOnSuccess, mockTanks), {
        wrapper: createWrapper()
      })

      // Submit form (no position specified in mock)
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent)
      })

      expect(tanksApi.insertTankAtPosition).not.toHaveBeenCalled()
      expect(tanksApi.createTank).toHaveBeenCalled()
      expect(tanksApi.normalizeTankPositions).toHaveBeenCalled()
    })
  })

  describe('delete tank position logic', () => {
    it('calls normalizeTankPositions after deleting a tank', async () => {
      const { result } = renderHook(() => useTankForm(mockOnSuccess, mockTanks), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.confirmDeleteAction()
      })

      expect(tanksApi.normalizeTankPositions).toHaveBeenCalled()
    })
  })
})
