import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Settings from '../pages/Settings'
import * as userSettingsApi from '../api/userSettings'
import { DEFAULT_SETTINGS } from '../constants/defaultSettings'

// Mock the API
vi.mock('../api/userSettings', () => ({
  fetchUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}))

// Mock the Sidebar component to simplify testing
vi.mock('../components/layout/Sidebar', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="sidebar" data-open={props.isOpen as boolean}>
      <button data-testid="sidebar-dashboard" onClick={() => (props.onNavigate as ((path: string) => void))?.('/dashboard')}>
        Dashboard
      </button>
    </div>
  ),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockSettings = {
  ...DEFAULT_SETTINGS,
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

describe('Settings Page', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.mocked(userSettingsApi.fetchUserSettings).mockResolvedValue({ data: mockSettings, error: null } as unknown as Awaited<ReturnType<typeof userSettingsApi.fetchUserSettings>>)
    vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({ data: mockSettings, error: null } as unknown as Awaited<ReturnType<typeof userSettingsApi.updateUserSettings>>)
  })

  describe('basic rendering', () => {
    it('renders settings page title', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('displays user email in account section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('renders Account section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Account Type')).toBeInTheDocument()
    })

    it('renders Dashboard customization section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Stat Cards')).toBeInTheDocument()
      })
      expect(screen.getByText('Sections')).toBeInTheDocument()
      expect(screen.getByText('Tanks to Display')).toBeInTheDocument()
    })

    it('renders Defaults section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      expect(screen.getByText('Defaults')).toBeInTheDocument()
      expect(screen.getByText('Items per Page')).toBeInTheDocument()
      expect(screen.getByText('Expiration Warning')).toBeInTheDocument()
    })
  })

  describe('sidebar interaction', () => {
    it('opens sidebar when menu button is clicked', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      const menuButton = screen.getByLabelText('Open menu')
      fireEvent.click(menuButton)

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')
    })
  })

  describe('unsaved changes indicator', () => {
    it('shows unsaved changes indicator when settings are modified', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
      })
    })
  })

  describe('save modal', () => {
    it('shows save modal when closing with unsaved changes', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      // Click close button
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
        expect(screen.getByText('You have unsaved changes. Would you like to save before leaving?')).toBeInTheDocument()
      })
    })

    it('saves and navigates when Save & Exit is clicked', async () => {
      const updatedSettings = { ...mockSettings, items_per_page: 50 }
      vi.mocked(userSettingsApi.updateUserSettings).mockResolvedValue({ data: updatedSettings, error: null } as unknown as Awaited<ReturnType<typeof userSettingsApi.updateUserSettings>>)

      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      // Click close button
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.getByText('Save & Exit')).toBeInTheDocument()
      })

      // Click Save & Exit
      fireEvent.click(screen.getByText('Save & Exit'))

      await waitFor(() => {
        expect(userSettingsApi.updateUserSettings).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('discards changes and navigates when Discard is clicked', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      // Click close button
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.getByText('Discard')).toBeInTheDocument()
      })

      // Click Discard
      fireEvent.click(screen.getByText('Discard'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })

      // Should not have called update
      expect(userSettingsApi.updateUserSettings).not.toHaveBeenCalled()
    })

    it('closes modal and stays on page when Cancel is clicked', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      // Click close button
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })

      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('navigates directly if no unsaved changes', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Click close button without making changes
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      // Should navigate directly without showing modal
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()
    })
  })

  describe('sidebar navigation with unsaved changes', () => {
    it('shows save modal when navigating via sidebar with unsaved changes', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Change a setting
      const itemsPerPageSelect = screen.getByDisplayValue('25')
      fireEvent.change(itemsPerPageSelect, { target: { value: '50' } })

      // Open sidebar and click dashboard
      const menuButton = screen.getByLabelText('Open menu')
      fireEvent.click(menuButton)

      const dashboardLink = screen.getByTestId('sidebar-dashboard')
      fireEvent.click(dashboardLink)

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      })
    })
  })

  describe('dark mode toggle', () => {
    it('toggles dark mode', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      // Find dark mode toggle by its label
      const darkModeSection = screen.getByText('Dark Mode').closest('.settings__item')!
      const darkModeCheckbox = darkModeSection.querySelector('input[type="checkbox"]')!

      fireEvent.click(darkModeCheckbox)

      expect(localStorage.getItem('darkMode')).toBe('true')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('widget visibility', () => {
    it('renders visibility toggles for stat cards', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
      })

      expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
      expect(screen.getByText('Sires')).toBeInTheDocument()
      expect(screen.getByText('Customers')).toBeInTheDocument()
    })

    it('renders visibility toggles for sections', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Alerts')).toBeInTheDocument()
      })

      expect(screen.getByText('Tank Status')).toBeInTheDocument()
    })
  })

  describe('reorder buttons', () => {
    it('renders reorder buttons for widgets', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(userSettingsApi.fetchUserSettings).toHaveBeenCalled()
      })

      const moveUpButtons = screen.getAllByLabelText('Move up')
      const moveDownButtons = screen.getAllByLabelText('Move down')

      expect(moveUpButtons.length).toBeGreaterThan(0)
      expect(moveDownButtons.length).toBeGreaterThan(0)
    })
  })

  describe('notification settings', () => {
    it('renders notification section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })

      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    })

    it('shows notification types when master toggle is enabled', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Low Nitrogen Alerts')).toBeInTheDocument()
      })

      expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument()
      expect(screen.getByText('Monthly Reminders')).toBeInTheDocument()
    })

    it('renders notification master toggle', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      // Verify the notification section renders with the master toggle
      await waitFor(() => {
        expect(screen.getByText('Email Notifications')).toBeInTheDocument()
      })

      // Verify notification types are shown when enabled (default)
      expect(screen.getByText('Low Nitrogen Alerts')).toBeInTheDocument()
    })

    it('displays user email as default notification email', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText(/Using account email:/)).toBeInTheDocument()
      })
    })

    it('renders notification email section', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      // Wait for notification section to be visible
      await waitFor(() => {
        expect(screen.getByText('Notification Email')).toBeInTheDocument()
      })

      // Should show the user's email by default
      await waitFor(() => {
        expect(screen.getByText(/Using account email:/)).toBeInTheDocument()
      })
    })

    it('shows email input when Change button is clicked', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Change')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Change'))

      expect(screen.getByPlaceholderText('alternate@email.com')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('toggles low nitrogen notification preference', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Low Nitrogen Alerts')).toBeInTheDocument()
      })

      // Find the checkbox for low nitrogen (it's in the same container as the label)
      const lowNitrogenSection = screen.getByText('Low Nitrogen Alerts').closest('.settings__item')!
      const checkbox = lowNitrogenSection.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      // Should mark as unsaved
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
      })
    })

    it('toggles low stock notification preference', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument()
      })

      const lowStockSection = screen.getByText('Low Stock Alerts').closest('.settings__item')!
      const checkbox = lowStockSection.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
      })
    })

    it('toggles periodic reminder preference', async () => {
      renderWithRouter(<Settings user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Reminders')).toBeInTheDocument()
      })

      const reminderSection = screen.getByText('Monthly Reminders').closest('.settings__item')!
      const checkbox = reminderSection.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
      })
    })
  })
})
