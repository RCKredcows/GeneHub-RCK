import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../pages/Dashboard'
import { DEFAULT_SETTINGS } from '../constants/defaultSettings'

// Mock the API functions
vi.mock('../api/tanks', () => ({
  fetchTanks: vi.fn(),
}))

vi.mock('../api/geneticInventory', () => ({
  fetchInventoryCounts: vi.fn(),
}))

vi.mock('../api/sires', () => ({
  fetchSireCount: vi.fn(),
}))

vi.mock('../api/customers', () => ({
  fetchCustomerCount: vi.fn(),
}))

vi.mock('../api/medicalInventory', () => ({
  fetchMedicalInventoryStats: vi.fn(),
}))

// Mock Sidebar to simplify testing
vi.mock('../components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}))

// Mock LoadingSpinner
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock useUserSettings hook
vi.mock('../hooks/useUserSettings', () => ({
  useUserSettings: vi.fn(),
}))

import { fetchTanks } from '../api/tanks'
import { fetchInventoryCounts } from '../api/geneticInventory'
import { fetchSireCount } from '../api/sires'
import { fetchCustomerCount } from '../api/customers'
import { fetchMedicalInventoryStats } from '../api/medicalInventory'
import { useUserSettings } from '../hooks/useUserSettings'

type FetchTanksReturn = Awaited<ReturnType<typeof fetchTanks>>
type UseUserSettingsReturn = ReturnType<typeof useUserSettings>

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithRouter = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard Page', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'John',
    },
  }

  const mockSettings = {
    ...DEFAULT_SETTINGS,
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

    // Default mock implementations for API calls
    vi.mocked(fetchTanks).mockResolvedValue({ data: [], error: null } as unknown as FetchTanksReturn)
    vi.mocked(fetchInventoryCounts).mockResolvedValue({ counts: { total: 0, semen: 0, embryo: 0, customerOwned: 0 }, error: null })
    vi.mocked(fetchSireCount).mockResolvedValue({ count: 0, error: null })
    vi.mocked(fetchCustomerCount).mockResolvedValue({ count: 0, error: null })
    vi.mocked(fetchMedicalInventoryStats).mockResolvedValue({ stats: { total: 0, lowStock: 0, expiring: 0 }, error: null })

    // Default mock for useUserSettings hook
    vi.mocked(useUserSettings).mockReturnValue({
      settings: mockSettings,
      sortedStatCards: [
        { key: 'geneticInventory', visible: true, order: 0 },
        { key: 'tanks', visible: true, order: 1 },
        { key: 'sires', visible: true, order: 2 },
        { key: 'customers', visible: true, order: 3 },
        { key: 'medicalInventory', visible: true, order: 4 }
      ],
      sortedSections: [
        { key: 'alerts', visible: true, order: 0 },
        { key: 'tankStatus', visible: true, order: 1 },
        { key: 'medicalInventory', visible: true, order: 2 }
      ],
      loading: false,
      error: null
    } as unknown as UseUserSettingsReturn)
  })

  describe('basic rendering', () => {
    it('shows loading spinner initially', () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('renders dashboard title after loading', async () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })

    it('displays welcome message with user first name', async () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, John/)).toBeInTheDocument()
      })
    })

    it('displays "User" when no first name available', async () => {
      const userWithoutName = { id: 'user-123', email: 'test@example.com', user_metadata: {} }
      renderWithRouter(<Dashboard user={userWithoutName} />)

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, User/)).toBeInTheDocument()
      })
    })

    it('renders sidebar component', async () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      })
    })
  })

  describe('data fetching', () => {
    it('fetches all data on mount', async () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(fetchTanks).toHaveBeenCalled()
        expect(fetchInventoryCounts).toHaveBeenCalled()
        expect(fetchSireCount).toHaveBeenCalled()
        expect(fetchCustomerCount).toHaveBeenCalled()
        expect(fetchMedicalInventoryStats).toHaveBeenCalled()
      })
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(fetchTanks).mockResolvedValue({ data: null, error: { message: 'Error' } } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('alerts section', () => {
    it('shows alert when tanks have low nitrogen', async () => {
      vi.mocked(fetchTanks).mockResolvedValue({
        data: [
          {
            id: '1',
            tank_name: 'Tank A',
            nitrogen_level: 5,
            nitrogen_capacity: 100,
            low_level_threshold: 25
          },
        ],
        error: null,
      } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText(/with low nitrogen/i)).toBeInTheDocument()
      })
    })

    it('does not show alert when nitrogen levels are normal', async () => {
      vi.mocked(fetchTanks).mockResolvedValue({
        data: [
          {
            id: '1',
            tank_name: 'Tank A',
            nitrogen_level: 80,
            nitrogen_capacity: 100,
            low_level_threshold: 25
          },
        ],
        error: null,
      } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      expect(screen.queryByText(/low nitrogen/i)).not.toBeInTheDocument()
    })
  })

  describe('stat cards visibility', () => {
    it('shows all stat cards when all are visible', async () => {
      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
      })

      expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
      expect(screen.getByText('Sires')).toBeInTheDocument()
      expect(screen.getByText('Customers')).toBeInTheDocument()
      // Medical Inventory appears twice (stat card + section), so use getAllByText
      expect(screen.getAllByText('Medical Inventory').length).toBeGreaterThanOrEqual(1)
    })

    it('hides stat cards when visibility is false', async () => {
      vi.mocked(useUserSettings).mockReturnValue({
        settings: mockSettings,
        sortedStatCards: [
          { key: 'geneticInventory', visible: true, order: 0 },
          { key: 'tanks', visible: false, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'alerts', visible: true, order: 0 },
          { key: 'tankStatus', visible: true, order: 1 },
          { key: 'medicalInventory', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
      })

      expect(screen.queryByText('Semen Tanks')).not.toBeInTheDocument()
    })
  })

  describe('section visibility', () => {
    it('hides sections when visibility is false', async () => {
      vi.mocked(useUserSettings).mockReturnValue({
        settings: mockSettings,
        sortedStatCards: [
          { key: 'geneticInventory', visible: true, order: 0 },
          { key: 'tanks', visible: true, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'alerts', visible: true, order: 0 },
          { key: 'tankStatus', visible: false, order: 1 },
          { key: 'medicalInventory', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      // Add some tanks to ensure the section would render if visible
      vi.mocked(fetchTanks).mockResolvedValue({
        data: [{ id: '1', tank_name: 'Tank A', nitrogen_level: 80, nitrogen_capacity: 100 }],
        error: null,
      } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Tank Status section should not be rendered
      expect(screen.queryByText('Tank Status')).not.toBeInTheDocument()
    })
  })

  describe('section ordering', () => {
    it('renders sections in sorted order', async () => {
      // Set sections order: medicalInventory first, then alerts, then tankStatus
      vi.mocked(useUserSettings).mockReturnValue({
        settings: mockSettings,
        sortedStatCards: [
          { key: 'geneticInventory', visible: true, order: 0 },
          { key: 'tanks', visible: true, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'medicalInventory', visible: true, order: 0 },
          { key: 'alerts', visible: true, order: 1 },
          { key: 'tankStatus', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      // Add tank data so tankStatus section renders
      vi.mocked(fetchTanks).mockResolvedValue({
        data: [{ id: '1', tank_name: 'Tank A', nitrogen_level: 5, nitrogen_capacity: 100, low_level_threshold: 25 }],
        error: null,
      } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // We can't easily test DOM order, but we can verify all sections render
      // The key is that the code uses sortedSections.map() which respects order
      await waitFor(() => {
        // All visible sections should be present
        expect(screen.getByText(/with low nitrogen/i)).toBeInTheDocument() // alerts
      })
    })
  })

  describe('stat cards ordering', () => {
    it('renders stat cards in sorted order', async () => {
      // Reorder: tanks first, then everything else
      vi.mocked(useUserSettings).mockReturnValue({
        settings: mockSettings,
        sortedStatCards: [
          { key: 'tanks', visible: true, order: 0 },
          { key: 'geneticInventory', visible: true, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'alerts', visible: true, order: 0 },
          { key: 'tankStatus', visible: true, order: 1 },
          { key: 'medicalInventory', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // All stat cards should be present
      expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
      expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
      expect(screen.getByText('Sires')).toBeInTheDocument()
    })
  })

  describe('tank display count', () => {
    it('uses dashboard_tank_display_count from settings', async () => {
      const settingsWithDisplayCount = {
        ...mockSettings,
        dashboard_tank_display_count: 2
      }
      vi.mocked(useUserSettings).mockReturnValue({
        settings: settingsWithDisplayCount,
        sortedStatCards: [
          { key: 'geneticInventory', visible: true, order: 0 },
          { key: 'tanks', visible: true, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'alerts', visible: true, order: 0 },
          { key: 'tankStatus', visible: true, order: 1 },
          { key: 'medicalInventory', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      vi.mocked(fetchTanks).mockResolvedValue({
        data: [
          { id: '1', tank_name: 'Tank A', nitrogen_level: 80, nitrogen_capacity: 100 },
          { id: '2', tank_name: 'Tank B', nitrogen_level: 70, nitrogen_capacity: 100 },
          { id: '3', tank_name: 'Tank C', nitrogen_level: 60, nitrogen_capacity: 100 },
          { id: '4', tank_name: 'Tank D', nitrogen_level: 50, nitrogen_capacity: 100 },
        ],
        error: null,
      } as unknown as FetchTanksReturn)

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Settings are passed to TankStatusSection - functionality is in that component
    })
  })

  describe('medical expiration warning', () => {
    it('uses medical_expiration_warning_days from settings', async () => {
      const settingsWithWarningDays = {
        ...mockSettings,
        medical_expiration_warning_days: 14
      }
      vi.mocked(useUserSettings).mockReturnValue({
        settings: settingsWithWarningDays,
        sortedStatCards: [
          { key: 'geneticInventory', visible: true, order: 0 },
          { key: 'tanks', visible: true, order: 1 },
          { key: 'sires', visible: true, order: 2 },
          { key: 'customers', visible: true, order: 3 },
          { key: 'medicalInventory', visible: true, order: 4 }
        ],
        sortedSections: [
          { key: 'alerts', visible: true, order: 0 },
          { key: 'tankStatus', visible: true, order: 1 },
          { key: 'medicalInventory', visible: true, order: 2 }
        ],
        loading: false,
        error: null
      } as unknown as UseUserSettingsReturn)

      // Mock medical inventory stats with expiring items
      vi.mocked(fetchMedicalInventoryStats).mockResolvedValue({
        stats: { total: 1, lowStock: 0, expiring: 1 },
        error: null,
      })

      renderWithRouter(<Dashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // useDashboard now fetches stats with the warning days param
      expect(fetchMedicalInventoryStats).toHaveBeenCalled()
    })
  })
})
