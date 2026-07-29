import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../hooks/usePagination'

describe('usePagination', () => {
  const createItems = (count: number) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }))

  describe('basic pagination', () => {
    it('returns first page of items', () => {
      const items = createItems(25)
      const { result } = renderHook(() => usePagination(items, 10))

      expect(result.current.paginatedItems).toHaveLength(10)
      expect(result.current.paginatedItems[0].id).toBe(1)
      expect(result.current.currentPage).toBe(1)
      expect(result.current.totalPages).toBe(3)
    })

    it('calculates correct totalPages', () => {
      const items = createItems(25)
      const { result } = renderHook(() => usePagination(items, 10))

      expect(result.current.totalPages).toBe(3)
    })

    it('returns minimum 1 totalPages for empty array', () => {
      const { result } = renderHook(() => usePagination([], 10))

      expect(result.current.totalPages).toBe(1)
    })

    it('calculates correct startIndex and endIndex', () => {
      const items = createItems(25)
      const { result } = renderHook(() => usePagination(items, 10))

      expect(result.current.startIndex).toBe(1)
      expect(result.current.endIndex).toBe(10)
      expect(result.current.totalItems).toBe(25)
    })
  })

  describe('navigation', () => {
    it('goToPage navigates to specified page', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(2)
      })

      expect(result.current.currentPage).toBe(2)
      expect(result.current.paginatedItems[0].id).toBe(11)
    })

    it('goToNextPage advances to next page', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToNextPage()
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('goToPrevPage goes back one page', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(3)
      })
      act(() => {
        result.current.goToPrevPage()
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('goToPage clamps to valid range (min)', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(0)
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('goToPage clamps to valid range (max)', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(100)
      })

      expect(result.current.currentPage).toBe(3)
    })

    it('resetToFirstPage returns to page 1', () => {
      const items = createItems(30)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(3)
      })
      act(() => {
        result.current.resetToFirstPage()
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('edge cases - filtering/item changes', () => {
    it('adjusts currentPage when items reduce and current page exceeds total', () => {
      const { result, rerender } = renderHook(
        ({ items }) => usePagination(items, 10),
        { initialProps: { items: createItems(30) } }
      )

      // Go to page 3
      act(() => {
        result.current.goToPage(3)
      })
      expect(result.current.currentPage).toBe(3)

      // Reduce items so only 1 page exists (simulates filter)
      rerender({ items: createItems(5) })

      // Should adjust to valid page
      expect(result.current.currentPage).toBe(1)
      expect(result.current.totalPages).toBe(1)
    })

    it('resets to page 1 when items length changes (even if current page would be valid)', () => {
      const { result, rerender } = renderHook(
        ({ items }) => usePagination(items, 10),
        { initialProps: { items: createItems(30) } }
      )

      // Go to page 2
      act(() => {
        result.current.goToPage(2)
      })
      expect(result.current.currentPage).toBe(2)

      // Reduce items - hook resets to page 1 on any length change
      rerender({ items: createItems(25) })

      // Resets to page 1 (designed behavior for filtering)
      expect(result.current.currentPage).toBe(1)
    })

    it('handles empty items array', () => {
      const { result, rerender } = renderHook(
        ({ items }) => usePagination(items, 10),
        { initialProps: { items: createItems(20) } }
      )

      act(() => {
        result.current.goToPage(2)
      })

      // Clear all items (filter returns nothing)
      rerender({ items: [] })

      expect(result.current.currentPage).toBe(1)
      expect(result.current.paginatedItems).toHaveLength(0)
      expect(result.current.totalPages).toBe(1)
    })
  })

  describe('last page behavior', () => {
    it('returns partial items on last page', () => {
      const items = createItems(25)
      const { result } = renderHook(() => usePagination(items, 10))

      act(() => {
        result.current.goToPage(3)
      })

      expect(result.current.paginatedItems).toHaveLength(5)
      expect(result.current.paginatedItems[0].id).toBe(21)
      expect(result.current.endIndex).toBe(25)
    })
  })
})
