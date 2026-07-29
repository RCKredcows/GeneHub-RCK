import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTankList } from '../hooks/useTanks/useTankList'
import * as tanksApi from '../api/tanks'
import * as geneticInventoryApi from '../api/geneticInventory'
import { createQueryWrapper } from './testUtils'

// Mock the APIs
vi.mock('../api/tanks', () => ({
  fetchTanks: vi.fn(),
}))

vi.mock('../api/geneticInventory', () => ({
  fetchCanistersByTank: vi.fn(),
}))

describe('useTankList', () => {
  const mockTanks = [
    { id: '1', tank_name: 'Alpha Tank', location: 'Barn A', nitrogen_level: 80, nitrogen_capacity: 100, low_level_threshold: 25, sort_order: 2, last_filled_date: '2024-01-15' },
    { id: '2', tank_name: 'Beta Tank', location: 'Barn B', nitrogen_level: 20, nitrogen_capacity: 100, low_level_threshold: 25, sort_order: 1, last_filled_date: '2024-01-20' },
    { id: '3', tank_name: 'Gamma Tank', location: 'Barn C', nitrogen_level: 50, nitrogen_capacity: 100, low_level_threshold: 25, sort_order: 3, last_filled_date: '2024-01-10' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tanksApi.fetchTanks).mockResolvedValue({ data: mockTanks, error: null } as Awaited<ReturnType<typeof tanksApi.fetchTanks>>)
    vi.mocked(geneticInventoryApi.fetchCanistersByTank).mockResolvedValue({ data: [], error: null } as Awaited<ReturnType<typeof geneticInventoryApi.fetchCanistersByTank>>)
  })

  describe('filtering', () => {
    it('filters tanks by search query (name)', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSearchQuery('Alpha')
      })

      expect(result.current.filteredTanks).toHaveLength(1)
      expect(result.current.filteredTanks[0].tank_name).toBe('Alpha Tank')
    })

    it('filters tanks by search query (location)', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSearchQuery('Barn B')
      })

      expect(result.current.filteredTanks).toHaveLength(1)
      expect(result.current.filteredTanks[0].tank_name).toBe('Beta Tank')
    })

    it('search is case insensitive', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSearchQuery('ALPHA')
      })

      expect(result.current.filteredTanks).toHaveLength(1)
      expect(result.current.filteredTanks[0].tank_name).toBe('Alpha Tank')
    })

    it('filters tanks by low nitrogen', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setFilterBy('low_nitrogen')
      })

      // Beta Tank has 20% which is <= 25% threshold
      expect(result.current.filteredTanks).toHaveLength(1)
      expect(result.current.filteredTanks[0].tank_name).toBe('Beta Tank')
    })

    it('returns all tanks when filter is "all"', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setFilterBy('low_nitrogen')
      })
      act(() => {
        result.current.setFilterBy('all')
      })

      expect(result.current.filteredTanks).toHaveLength(3)
    })
  })

  describe('sorting', () => {
    it('sorts by position (sort_order) by default', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      // Default sort is 'position'
      expect(result.current.sortBy).toBe('position')
      // Beta (sort_order: 1), Alpha (sort_order: 2), Gamma (sort_order: 3)
      expect(result.current.filteredTanks[0].tank_name).toBe('Beta Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Alpha Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Gamma Tank')
    })

    it('sorts by name ascending', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSortBy('name_asc')
      })

      expect(result.current.filteredTanks[0].tank_name).toBe('Alpha Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Beta Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Gamma Tank')
    })

    it('sorts by name descending', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSortBy('name_desc')
      })

      expect(result.current.filteredTanks[0].tank_name).toBe('Gamma Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Beta Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Alpha Tank')
    })

    it('sorts by nitrogen level low first', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSortBy('nitrogen_low')
      })

      // Beta (20%), Gamma (50%), Alpha (80%)
      expect(result.current.filteredTanks[0].tank_name).toBe('Beta Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Gamma Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Alpha Tank')
    })

    it('sorts by nitrogen level high first', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSortBy('nitrogen_high')
      })

      // Alpha (80%), Gamma (50%), Beta (20%)
      expect(result.current.filteredTanks[0].tank_name).toBe('Alpha Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Gamma Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Beta Tank')
    })

    it('sorts by last filled date (recent first)', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSortBy('last_filled')
      })

      // Beta (Jan 20), Alpha (Jan 15), Gamma (Jan 10)
      expect(result.current.filteredTanks[0].tank_name).toBe('Beta Tank')
      expect(result.current.filteredTanks[1].tank_name).toBe('Alpha Tank')
      expect(result.current.filteredTanks[2].tank_name).toBe('Gamma Tank')
    })
  })

  describe('combined filtering and sorting', () => {
    it('applies both search filter and sorting', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSearchQuery('Tank')
        result.current.setSortBy('name_asc')
      })

      expect(result.current.filteredTanks).toHaveLength(3)
      expect(result.current.filteredTanks[0].tank_name).toBe('Alpha Tank')
    })
  })

  describe('edge cases', () => {
    it('handles tanks with null nitrogen data in sorting', async () => {
      const tanksWithNull = [
        { id: '1', tank_name: 'Tank A', nitrogen_level: null, nitrogen_capacity: null, sort_order: 1 },
        { id: '2', tank_name: 'Tank B', nitrogen_level: 50, nitrogen_capacity: 100, sort_order: 2 },
      ]
      vi.mocked(tanksApi.fetchTanks).mockResolvedValue({ data: tanksWithNull, error: null } as Awaited<ReturnType<typeof tanksApi.fetchTanks>>)

      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(2)
      })

      act(() => {
        result.current.setSortBy('nitrogen_low')
      })

      // Tank with data should come first when sorting low, null goes to end
      expect(result.current.filteredTanks[0].tank_name).toBe('Tank B')
    })

    it('handles tanks with null sort_order', async () => {
      const tanksWithNullOrder = [
        { id: '1', tank_name: 'Tank A', sort_order: null },
        { id: '2', tank_name: 'Tank B', sort_order: 1 },
      ]
      vi.mocked(tanksApi.fetchTanks).mockResolvedValue({ data: tanksWithNullOrder, error: null } as Awaited<ReturnType<typeof tanksApi.fetchTanks>>)

      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(2)
      })

      // Tank B with sort_order 1 should come first, null treated as 999
      expect(result.current.filteredTanks[0].tank_name).toBe('Tank B')
    })

    it('handles empty search returning all tanks', async () => {
      const { result } = renderHook(() => useTankList(), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.tanks).toHaveLength(3)
      })

      act(() => {
        result.current.setSearchQuery('xyz')
      })
      expect(result.current.filteredTanks).toHaveLength(0)

      act(() => {
        result.current.setSearchQuery('')
      })
      expect(result.current.filteredTanks).toHaveLength(3)
    })
  })
})
