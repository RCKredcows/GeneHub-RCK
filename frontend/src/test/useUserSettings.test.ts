import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserSettings } from '../hooks/useUserSettings'
import * as userSettingsApi from '../api/userSettings'
import { DEFAULT_SETTINGS } from '../constants/defaultSettings'
import { createQueryWrapper } from './testUtils'

// Mock the API
vi.mock('../api/userSettings', () => ({
  fetchUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}))

describe('useUserSettings', () => {
  const mockUserId = 'user-123'
  const mockSettings = {
    ...DEFAULT_SETTINGS,
    id: 'settings-1',
    user_id: mockUserId,
    tenant_id: 'tenant-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    dark_mode: false,
    items_per_page: 25,
    dashboard_widgets: {
      statCards: {
        geneticInventory: { visible: true, order: 0 },
        tanks: { visible: true, order: 1 },
        sires: { visible: true, order: 2 },
        customers: { visible: true, order: 3 },
        medicalInventory: { visible: true, order: 4 }
      },
      sections: {
        alerts: { visible: true, order: 0 },
        tankStatus: { visible: true, order: 1 },
        medicalInventory: { visible: true, order: 2 }
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(userSettingsApi.fetchUserSettings).mockResolvedValue({ data: mockSettings, error: null })
    vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({ data: mockSettings, error: null })
  })

  describe('initialization', () => {
    it('returns default settings initially', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      // Initially returns placeholder data (DEFAULT_SETTINGS) while loading
      expect(result.current.settings).toBeDefined()

      // Wait for settings to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('fetches settings on mount', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(userSettingsApi.fetchUserSettings).toHaveBeenCalledWith(mockUserId)
      expect(result.current.settings).toMatchObject({
        dark_mode: mockSettings.dark_mode,
        items_per_page: mockSettings.items_per_page,
        dashboard_widgets: mockSettings.dashboard_widgets
      })
    })

    it('does not fetch if no userId provided', async () => {
      const { result } = renderHook(() => useUserSettings(undefined), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(userSettingsApi.fetchUserSettings).not.toHaveBeenCalled()
    })

    it('handles fetch error gracefully', async () => {
      // When API returns error, hook should still provide default settings
      vi.mocked(userSettingsApi.fetchUserSettings).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should have settings (from placeholder/defaults) even if fetch fails
      expect(result.current.settings).toBeDefined()
    })
  })

  describe('sortedStatCards', () => {
    it('returns stat cards sorted by order', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const keys = result.current.sortedStatCards.map(c => c.key)
      expect(keys).toEqual(['geneticInventory', 'tanks', 'sires', 'customers', 'medicalInventory'])
    })

    it('includes visibility in sorted cards', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sortedStatCards[0].visible).toBe(true)
      expect(result.current.sortedStatCards[0].key).toBe('geneticInventory')
    })
  })

  describe('sortedSections', () => {
    it('returns sections sorted by order', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const keys = result.current.sortedSections.map(s => s.key)
      expect(keys).toEqual(['alerts', 'tankStatus', 'medicalInventory'])
    })
  })

  describe('localOnly mode', () => {
    it('does not call API when updating in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear the fetch call count
      vi.clearAllMocks()

      act(() => {
        result.current.updateItemsPerPage(50)
      })

      expect(userSettingsApi.updateUserSettings).not.toHaveBeenCalled()
      expect(result.current.settings.items_per_page).toBe(50)
    })

    it('tracks unsaved changes in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasUnsavedChanges).toBe(false)

      act(() => {
        result.current.updateItemsPerPage(50)
      })

      expect(result.current.hasUnsavedChanges).toBe(true)
    })

    it('saves all changes when saveSettings is called', async () => {
      const updatedSettings = { ...mockSettings, items_per_page: 50 }
      vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({ data: updatedSettings, error: null })

      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateItemsPerPage(50)
      })

      await act(async () => {
        await result.current.saveSettings()
      })

      expect(userSettingsApi.updateUserSettings).toHaveBeenCalled()
      expect(result.current.hasUnsavedChanges).toBe(false)
    })

    it('discards changes when discardChanges is called', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateItemsPerPage(50)
      })

      expect(result.current.settings.items_per_page).toBe(50)

      act(() => {
        result.current.discardChanges()
      })

      expect(result.current.settings.items_per_page).toBe(25)
      expect(result.current.hasUnsavedChanges).toBe(false)
    })
  })

  describe('toggleStatCardVisibility', () => {
    it('toggles stat card visibility in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialVisibility = result.current.sortedStatCards.find(c => c.key === 'tanks')!.visible
      expect(initialVisibility).toBe(true)

      act(() => {
        result.current.toggleStatCardVisibility('tanks')
      })

      const newVisibility = result.current.sortedStatCards.find(c => c.key === 'tanks')!.visible
      expect(newVisibility).toBe(false)
    })
  })

  describe('toggleSectionVisibility', () => {
    it('toggles section visibility in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialVisibility = result.current.sortedSections.find(s => s.key === 'alerts')!.visible
      expect(initialVisibility).toBe(true)

      act(() => {
        result.current.toggleSectionVisibility('alerts')
      })

      const newVisibility = result.current.sortedSections.find(s => s.key === 'alerts')!.visible
      expect(newVisibility).toBe(false)
    })
  })

  describe('reorderStatCards', () => {
    it('reorders stat cards in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Move tanks to first position
      act(() => {
        result.current.reorderStatCards(['tanks', 'geneticInventory', 'sires', 'customers', 'medicalInventory'])
      })

      const keys = result.current.sortedStatCards.map(c => c.key)
      expect(keys[0]).toBe('tanks')
      expect(keys[1]).toBe('geneticInventory')
    })
  })

  describe('reorderSections', () => {
    it('reorders sections in localOnly mode', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Move medicalInventory to first position
      act(() => {
        result.current.reorderSections(['medicalInventory', 'alerts', 'tankStatus'])
      })

      const keys = result.current.sortedSections.map(s => s.key)
      expect(keys[0]).toBe('medicalInventory')
      expect(keys[1]).toBe('alerts')
      expect(keys[2]).toBe('tankStatus')
    })

    it('marks changes as unsaved after reorder', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasUnsavedChanges).toBe(false)

      act(() => {
        result.current.reorderSections(['medicalInventory', 'alerts', 'tankStatus'])
      })

      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })

  describe('updateDarkMode', () => {
    it('updates dark mode and localStorage', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateDarkMode(true)
      })

      expect(result.current.settings.dark_mode).toBe(true)
      expect(localStorage.getItem('darkMode')).toBe('true')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('updateTankDisplayCount', () => {
    it('updates tank display count', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateTankDisplayCount(6)
      })

      expect(result.current.settings.dashboard_tank_display_count).toBe(6)
    })
  })

  describe('updateMedicalWarningDays', () => {
    it('updates medical warning days', async () => {
      const { result } = renderHook(() => useUserSettings(mockUserId, { localOnly: true }), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateMedicalWarningDays(14)
      })

      expect(result.current.settings.medical_expiration_warning_days).toBe(14)
    })
  })

  describe('non-localOnly mode (immediate save)', () => {
    it('calls API immediately when updating', async () => {
      const updatedSettings = { ...mockSettings, items_per_page: 50 }
      vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({ data: updatedSettings, error: null })

      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      vi.clearAllMocks()

      await act(async () => {
        await result.current.updateItemsPerPage(50)
      })

      expect(userSettingsApi.updateUserSettings).toHaveBeenCalledWith(mockUserId, { items_per_page: 50 })
    })

    it('rolls back on API error', async () => {
      vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({
        data: null,
        error: new Error('Update failed')
      })

      const { result } = renderHook(() => useUserSettings(mockUserId), { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateItemsPerPage(50)
      })

      // Should roll back to original value after mutation error
      await waitFor(() => {
        expect(result.current.settings.items_per_page).toBe(25)
      })
    })
  })
})
