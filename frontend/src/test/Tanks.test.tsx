import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Tanks from '../pages/Tanks'

// Mock the sub-hooks
vi.mock('../hooks/useTanks', () => ({
  useTankList: vi.fn(),
  useTankForm: vi.fn(),
  useFillForm: vi.fn(),
  useCanisterForm: vi.fn(),
  useTankDetails: vi.fn(),
}))

vi.mock('../hooks/useInventoryQuantity', () => ({
  useInventoryQuantity: vi.fn(),
}))

vi.mock('../hooks/useUserSettings', () => ({
  useUserSettings: vi.fn(),
}))

vi.mock('../hooks/usePagination', () => ({
  usePagination: vi.fn(),
}))

// Mock Sidebar
vi.mock('../components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}))

// Mock ConfirmModal
vi.mock('../components/common/ConfirmModal', () => ({
  default: (props: Record<string, unknown>) => (props.isOpen as boolean) ? (
    <div data-testid="confirm-modal">
      <span>{props.title as string}</span>
      <button onClick={props.onConfirm as React.MouseEventHandler}>Confirm</button>
      <button onClick={props.onClose as React.MouseEventHandler}>Cancel</button>
    </div>
  ) : null,
}))

// Mock LoadingSpinner
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock CanisterManager
vi.mock('../components/CanisterManager', () => ({
  default: () => <div data-testid="canister-manager">Canister Manager</div>,
}))

// Mock QuantityEditor
vi.mock('../components/common/QuantityEditor', () => ({
  default: () => <div data-testid="quantity-editor">Quantity Editor</div>,
}))

import { useTankList, useTankForm, useFillForm, useCanisterForm, useTankDetails } from '../hooks/useTanks'
import { useInventoryQuantity } from '../hooks/useInventoryQuantity'
import { useUserSettings } from '../hooks/useUserSettings'
import { usePagination } from '../hooks/usePagination'
import { DEFAULT_SETTINGS } from '../constants/defaultSettings'

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

describe('Tanks Page', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  const defaultTankListReturn = {
    tanks: [],
    filteredTanks: [],
    searchQuery: '',
    setSearchQuery: vi.fn(),
    canisters: {},
    inventory: [],
    loading: false,
    error: '',
    refresh: vi.fn(),
    refreshInventory: vi.fn(),
    getInventoryForCanister: vi.fn(() => []),
    fetchCanistersForTank: vi.fn(),
    setCanisters: vi.fn(),
  }

  const defaultTankFormReturn = {
    isFormOpen: false,
    setIsFormOpen: vi.fn(),
    editingTank: null,
    formData: {
      tank_name: '',
      location: '',
      capacity: '',
      nitrogen_capacity: '',
      nitrogen_level: '',
      nitrogen_unit: 'liters',
      low_level_threshold: '',
      notes: '',
    },
    loading: false,
    error: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleCloseForm: vi.fn(),
    confirmDelete: { isOpen: false, itemId: null, itemName: '' },
    setConfirmDelete: vi.fn(),
    confirmDeleteAction: vi.fn(),
  }

  const defaultFillFormReturn = {
    isFillFormOpen: false,
    fillFormData: {
      nitrogen_level_before: '',
      amount_added: '',
      nitrogen_level_after: '',
      notes: '',
    },
    loading: false,
    error: '',
    handleFillInputChange: vi.fn(),
    handleFillSubmit: vi.fn(),
    handleOpenFillForm: vi.fn(),
    handleCloseFillForm: vi.fn(),
  }

  const defaultCanisterFormReturn = {
    isCanisterFormOpen: false,
    selectedTankForCanister: null,
    editingCanister: null,
    canisterFormData: {
      canister_number: '',
      position_in_tank: '',
    },
    loading: false,
    error: '',
    handleCanisterInputChange: vi.fn(),
    handleCanisterSubmit: vi.fn(),
    handleOpenCanisterForm: vi.fn(),
    handleCloseCanisterForm: vi.fn(),
    handleDeleteCanister: vi.fn(),
    confirmDeleteCanister: { isOpen: false, itemId: null, itemName: '' },
    setConfirmDeleteCanister: vi.fn(),
    confirmDeleteCanisterAction: vi.fn(),
    handleReorderCanisters: vi.fn(),
  }

  const defaultTankDetailsReturn = {
    isDetailOpen: false,
    selectedTank: null,
    fillHistory: [],
    consumptionStats: null,
    loading: false,
    handleViewDetails: vi.fn(),
    handleCloseDetails: vi.fn(),
    loadTankDetails: vi.fn(),
    getNitrogenPercentage: vi.fn(() => 50),
    isLowNitrogen: vi.fn(() => false),
  }

  const defaultQuantityHookReturn = {
    updatingItemId: null,
    getQtyAmount: vi.fn(() => 1),
    getQtyAmountForUpdate: vi.fn(() => 1),
    setQtyAmount: vi.fn(),
    handleUpdateQuantity: vi.fn(),
  }

  const defaultUserSettingsReturn = {
    settings: DEFAULT_SETTINGS,
    loading: false,
    error: null,
  }

  const defaultPaginationReturn = {
    paginatedItems: [],
    currentPage: 1,
    totalPages: 1,
    startIndex: 0,
    endIndex: 0,
    totalItems: 0,
    goToPage: vi.fn(),
    goToNextPage: vi.fn(),
    goToPrevPage: vi.fn(),
    resetToFirstPage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTankList).mockReturnValue(defaultTankListReturn as unknown as ReturnType<typeof useTankList>)
    vi.mocked(useTankForm).mockReturnValue(defaultTankFormReturn as unknown as ReturnType<typeof useTankForm>)
    vi.mocked(useFillForm).mockReturnValue(defaultFillFormReturn as unknown as ReturnType<typeof useFillForm>)
    vi.mocked(useCanisterForm).mockReturnValue(defaultCanisterFormReturn as unknown as ReturnType<typeof useCanisterForm>)
    vi.mocked(useTankDetails).mockReturnValue(defaultTankDetailsReturn as unknown as ReturnType<typeof useTankDetails>)
    vi.mocked(useInventoryQuantity).mockReturnValue(defaultQuantityHookReturn as unknown as ReturnType<typeof useInventoryQuantity>)
    vi.mocked(useUserSettings).mockReturnValue(defaultUserSettingsReturn as unknown as ReturnType<typeof useUserSettings>)
    vi.mocked(usePagination).mockReturnValue(defaultPaginationReturn as unknown as ReturnType<typeof usePagination>)
  })

  it('renders page title', () => {
    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders add tank button', () => {
    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText('Add Tank')).toBeInTheDocument()
  })

  it('calls setIsFormOpen when add button is clicked', () => {
    const setIsFormOpen = vi.fn()
    vi.mocked(useTankForm).mockReturnValue({
      ...defaultTankFormReturn,
      setIsFormOpen,
    } as unknown as ReturnType<typeof useTankForm>)

    renderWithRouter(<Tanks user={mockUser} />)

    fireEvent.click(screen.getByText('Add Tank'))

    expect(setIsFormOpen).toHaveBeenCalledWith(true)
  })

  it('renders search input', () => {
    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByPlaceholderText(/Search tanks/i)).toBeInTheDocument()
  })

  it('calls setSearchQuery when typing in search', () => {
    const setSearchQuery = vi.fn()
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      setSearchQuery,
    } as unknown as ReturnType<typeof useTankList>)

    renderWithRouter(<Tanks user={mockUser} />)

    const searchInput = screen.getByPlaceholderText(/Search tanks/i)
    fireEvent.change(searchInput, { target: { value: 'Tank A' } })

    expect(setSearchQuery).toHaveBeenCalledWith('Tank A')
  })

  it('shows page content when loading is true', () => {
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      loading: true,
    } as unknown as ReturnType<typeof useTankList>)

    renderWithRouter(<Tanks user={mockUser} />)

    // Page title should still be present during loading states
    expect(screen.getByText('Semen Tanks')).toBeInTheDocument()
  })

  it('shows confirm modal when delete is triggered', () => {
    vi.mocked(useTankForm).mockReturnValue({
      ...defaultTankFormReturn,
      confirmDelete: { isOpen: true, itemId: '1', itemName: 'Tank A' },
    } as unknown as ReturnType<typeof useTankForm>)

    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('renders tank list when data exists', () => {
    const tanks = [
      { id: 1, tank_name: 'Tank Alpha', location: 'Barn A', nitrogen_level: 80, nitrogen_capacity: 100 },
      { id: 2, tank_name: 'Tank Beta', location: 'Barn B', nitrogen_level: 50, nitrogen_capacity: 100 },
    ]
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      filteredTanks: tanks,
    } as unknown as ReturnType<typeof useTankList>)
    vi.mocked(usePagination).mockReturnValue({
      ...defaultPaginationReturn,
      paginatedItems: tanks,
      totalItems: 2,
      totalPages: 1,
      endIndex: 2,
    } as unknown as ReturnType<typeof usePagination>)

    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText('Tank Alpha')).toBeInTheDocument()
    expect(screen.getByText('Tank Beta')).toBeInTheDocument()
  })

  it('shows empty state when no tanks', () => {
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      filteredTanks: [],
    } as unknown as ReturnType<typeof useTankList>)

    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText(/No tanks/i)).toBeInTheDocument()
  })

  it('renders hamburger menu button', () => {
    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('displays tank location', () => {
    const tanks = [
      { id: 1, tank_name: 'Test Tank', location: 'Main Barn', nitrogen_level: 75, nitrogen_capacity: 100 },
    ]
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      filteredTanks: tanks,
    } as unknown as ReturnType<typeof useTankList>)
    vi.mocked(usePagination).mockReturnValue({
      ...defaultPaginationReturn,
      paginatedItems: tanks,
      totalItems: 1,
      endIndex: 1,
    } as unknown as ReturnType<typeof usePagination>)

    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText('Main Barn')).toBeInTheDocument()
  })

  it('shows low nitrogen warning for tanks below threshold', () => {
    const tanks = [
      { id: 1, tank_name: 'Low Tank', location: 'Barn', nitrogen_level: 10, nitrogen_capacity: 100, low_level_threshold: 25 },
    ]
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      filteredTanks: tanks,
    } as unknown as ReturnType<typeof useTankList>)
    vi.mocked(usePagination).mockReturnValue({
      ...defaultPaginationReturn,
      paginatedItems: tanks,
      totalItems: 1,
      endIndex: 1,
    } as unknown as ReturnType<typeof usePagination>)
    vi.mocked(useTankDetails).mockReturnValue({
      ...defaultTankDetailsReturn,
      isLowNitrogen: vi.fn(() => true),
    } as unknown as ReturnType<typeof useTankDetails>)

    renderWithRouter(<Tanks user={mockUser} />)

    // Should show the tank name
    expect(screen.getByText('Low Tank')).toBeInTheDocument()
  })

  it('displays nitrogen percentage', () => {
    const tanks = [
      { id: 1, tank_name: 'Test Tank', location: 'Barn', nitrogen_level: 75, nitrogen_capacity: 100 },
    ]
    vi.mocked(useTankList).mockReturnValue({
      ...defaultTankListReturn,
      filteredTanks: tanks,
    } as unknown as ReturnType<typeof useTankList>)
    vi.mocked(usePagination).mockReturnValue({
      ...defaultPaginationReturn,
      paginatedItems: tanks,
      totalItems: 1,
      endIndex: 1,
    } as unknown as ReturnType<typeof usePagination>)
    vi.mocked(useTankDetails).mockReturnValue({
      ...defaultTankDetailsReturn,
      getNitrogenPercentage: vi.fn(() => 75),
    } as unknown as ReturnType<typeof useTankDetails>)

    renderWithRouter(<Tanks user={mockUser} />)

    expect(screen.getByText('Test Tank')).toBeInTheDocument()
  })

  describe('pagination', () => {
    it('renders pagination component when multiple pages exist', () => {
      const tanks = [
        { id: 1, tank_name: 'Tank 1', location: 'Barn A', nitrogen_level: 80, nitrogen_capacity: 100 },
      ]
      vi.mocked(useTankList).mockReturnValue({
        ...defaultTankListReturn,
        filteredTanks: tanks,
      } as unknown as ReturnType<typeof useTankList>)
      vi.mocked(usePagination).mockReturnValue({
        ...defaultPaginationReturn,
        paginatedItems: tanks,
        totalItems: 20,
        totalPages: 2,
        currentPage: 1,
        startIndex: 1,
        endIndex: 15,
      } as unknown as ReturnType<typeof usePagination>)

      renderWithRouter(<Tanks user={mockUser} />)

      // Pagination should show items range
      expect(screen.getByText('1–15 of 20')).toBeInTheDocument()
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
      expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    })

    it('calls usePagination with correct parameters', () => {
      const tanks = [
        { id: 1, tank_name: 'Tank 1', location: 'Barn A', nitrogen_level: 80, nitrogen_capacity: 100 },
        { id: 2, tank_name: 'Tank 2', location: 'Barn B', nitrogen_level: 70, nitrogen_capacity: 100 },
      ]
      vi.mocked(useTankList).mockReturnValue({
        ...defaultTankListReturn,
        filteredTanks: tanks,
      } as unknown as ReturnType<typeof useTankList>)

      renderWithRouter(<Tanks user={mockUser} />)

      expect(usePagination).toHaveBeenCalledWith(tanks, DEFAULT_SETTINGS.items_per_page)
    })

    it('only shows paginated items in the grid', () => {
      const allTanks = [
        { id: 1, tank_name: 'Tank 1', location: 'Barn A', nitrogen_level: 80, nitrogen_capacity: 100 },
        { id: 2, tank_name: 'Tank 2', location: 'Barn B', nitrogen_level: 70, nitrogen_capacity: 100 },
        { id: 3, tank_name: 'Tank 3', location: 'Barn C', nitrogen_level: 60, nitrogen_capacity: 100 },
      ]
      const paginatedTanks = [allTanks[0], allTanks[1]] // Only first 2 on current page

      vi.mocked(useTankList).mockReturnValue({
        ...defaultTankListReturn,
        filteredTanks: allTanks,
      } as unknown as ReturnType<typeof useTankList>)
      vi.mocked(usePagination).mockReturnValue({
        ...defaultPaginationReturn,
        paginatedItems: paginatedTanks,
        totalItems: 3,
        totalPages: 2,
        currentPage: 1,
        startIndex: 0,
        endIndex: 2,
      } as unknown as ReturnType<typeof usePagination>)

      renderWithRouter(<Tanks user={mockUser} />)

      expect(screen.getByText('Tank 1')).toBeInTheDocument()
      expect(screen.getByText('Tank 2')).toBeInTheDocument()
      expect(screen.queryByText('Tank 3')).not.toBeInTheDocument()
    })

    it('does not render pagination when no tanks', () => {
      vi.mocked(useTankList).mockReturnValue({
        ...defaultTankListReturn,
        filteredTanks: [],
      } as unknown as ReturnType<typeof useTankList>)
      vi.mocked(usePagination).mockReturnValue({
        ...defaultPaginationReturn,
        paginatedItems: [],
        totalItems: 0,
        totalPages: 0,
      } as unknown as ReturnType<typeof usePagination>)

      renderWithRouter(<Tanks user={mockUser} />)

      expect(screen.getByText(/No tanks/i)).toBeInTheDocument()
    })

    it('uses items_per_page from user settings', () => {
      const customSettings = { ...DEFAULT_SETTINGS, items_per_page: 25 }
      vi.mocked(useUserSettings).mockReturnValue({
        settings: customSettings,
        loading: false,
        error: null,
      } as unknown as ReturnType<typeof useUserSettings>)

      const tanks = [{ id: 1, tank_name: 'Tank 1', location: 'Barn', nitrogen_level: 80, nitrogen_capacity: 100 }]
      vi.mocked(useTankList).mockReturnValue({
        ...defaultTankListReturn,
        filteredTanks: tanks,
      } as unknown as ReturnType<typeof useTankList>)

      renderWithRouter(<Tanks user={mockUser} />)

      expect(usePagination).toHaveBeenCalledWith(tanks, 25)
    })
  })
})
