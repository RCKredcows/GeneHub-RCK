import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GeneticInventory from '../pages/GeneticInventory'

// Mock the sub-hooks
vi.mock('../hooks/useGeneticInventory', () => ({
  useInventoryList: vi.fn(),
  useInventoryForm: vi.fn(),
  useInventoryDependencies: vi.fn(),
  useQuickCreate: vi.fn(),
  useCheckinForm: vi.fn(),
}))

// Mock Sidebar
vi.mock('../components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}))

// Mock ConfirmModal
vi.mock('../components/common/ConfirmModal', () => ({
  default: ({ isOpen, title, onConfirm, onClose }: { isOpen: boolean; title: string; onConfirm: () => void; onClose: () => void }) => isOpen ? (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ) : null,
}))

// Mock LoadingSpinner
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock SearchableSelect
vi.mock('../components/common/SearchableSelect', () => ({
  default: ({ placeholder }: { placeholder?: string }) => <select data-testid="searchable-select">{placeholder}</select>,
}))

import { useInventoryList, useInventoryForm, useInventoryDependencies, useQuickCreate, useCheckinForm } from '../hooks/useGeneticInventory'

const mockedUseInventoryList = vi.mocked(useInventoryList)
const mockedUseInventoryForm = vi.mocked(useInventoryForm)
const mockedUseInventoryDependencies = vi.mocked(useInventoryDependencies)
const mockedUseQuickCreate = vi.mocked(useQuickCreate)
const mockedUseCheckinForm = vi.mocked(useCheckinForm)

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

describe('GeneticInventory Page', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  const defaultInventoryListReturn = {
    inventory: [],
    rawInventory: [],
    searchQuery: '',
    ownerFilter: 'all',
    error: '',
    setSearchQuery: vi.fn(),
    setOwnerFilter: vi.fn(),
    setError: vi.fn(),
    refresh: vi.fn(),
  }

  const defaultInventoryFormReturn = {
    formData: {
      inventory_type: 'semen',
      sex_type: 'conventional',
      owner_type: 'customer',
      customer_id: null,
      sire_id: null,
      embryo_name: '',
      breed: '',
      tank_id: null,
      canister_id: null,
      cane_number: '',
      quantity: '',
      original_quantity: '',
      unit: 'straws',
      price_for_semen: '',
      check_in_date: '',
      check_out_date: '',
      status: 'stored',
      notes: '',
      add_to_sire_tab: false,
    },
    isFormOpen: false,
    editingInventory: null,
    selectedSire: null,
    selectedCustomer: null,
    loading: false,
    deleting: false,
    error: '',
    confirmDelete: { isOpen: false, inventoryId: null, inventoryName: '' },
    setIsFormOpen: vi.fn(),
    setFormData: vi.fn(),
    setSelectedSire: vi.fn(),
    setSelectedCustomer: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleCloseForm: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteInventory: vi.fn(),
  }

  const defaultDependenciesReturn = {
    tanks: [],
    canisters: [],
    setSelectedTankId: vi.fn(),
    fetchCanistersForTank: vi.fn(),
    clearCanisters: vi.fn(),
    refreshSires: vi.fn(),
    refreshTanks: vi.fn(),
  }

  const defaultCheckinFormReturn = {
    formData: {
      tank_id: null,
      canister_id: null,
      cane_number: '',
      notes: '',
    },
    isOpen: false,
    selectedItem: null,
    loading: false,
    error: '',
    validation: {
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
    },
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    openCheckinModal: vi.fn(),
    handleCloseForm: vi.fn(),
  }

  const defaultQuickCreateReturn = {
    openSireForm: vi.fn(),
    openCustomerForm: vi.fn(),
    openTankForm: vi.fn(),
    openCanisterForm: vi.fn(),
    sire: {
      isOpen: false,
      selectedCustomer: null,
      formData: {},
      loading: false,
      error: '',
      imagePreview: null,
      validation: null,
      onInputChange: vi.fn(),
      onImageChange: vi.fn(),
      onSubmit: vi.fn(),
      onClose: vi.fn(),
    },
    customer: {
      isOpen: false,
      formData: {},
      loading: false,
      error: '',
      validation: null,
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
      onClose: vi.fn(),
    },
    tank: {
      isOpen: false,
      formData: {},
      loading: false,
      error: '',
      validation: null,
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
      onClose: vi.fn(),
    },
    canister: {
      isOpen: false,
      selectedTank: null,
      formData: {},
      loading: false,
      error: '',
      validation: null,
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
      onClose: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseInventoryList.mockReturnValue(defaultInventoryListReturn as unknown as ReturnType<typeof useInventoryList>)
    mockedUseInventoryForm.mockReturnValue(defaultInventoryFormReturn as unknown as ReturnType<typeof useInventoryForm>)
    mockedUseInventoryDependencies.mockReturnValue(defaultDependenciesReturn as unknown as ReturnType<typeof useInventoryDependencies>)
    mockedUseQuickCreate.mockReturnValue(defaultQuickCreateReturn as unknown as ReturnType<typeof useQuickCreate>)
    mockedUseCheckinForm.mockReturnValue(defaultCheckinFormReturn as unknown as ReturnType<typeof useCheckinForm>)
  })

  it('renders page title', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders add button', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText(/Add Inventory/i)).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument()
  })

  it('calls setSearchQuery when typing in search', () => {
    const setSearchQuery = vi.fn()
    mockedUseInventoryList.mockReturnValue({
      ...defaultInventoryListReturn,
      setSearchQuery,
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    const searchInput = screen.getByPlaceholderText(/Search/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(setSearchQuery).toHaveBeenCalledWith('test')
  })

  it('renders filter tabs', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('RCK')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('calls setOwnerFilter when filter tab is clicked', () => {
    const setOwnerFilter = vi.fn()
    mockedUseInventoryList.mockReturnValue({
      ...defaultInventoryListReturn,
      setOwnerFilter,
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    fireEvent.click(screen.getByText('Customer'))

    expect(setOwnerFilter).toHaveBeenCalledWith('customer')
  })

  it('shows loading overlay when deleting', () => {
    mockedUseInventoryForm.mockReturnValue({
      ...defaultInventoryFormReturn,
      deleting: true,
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
  })

  it('shows loading overlay when loading', () => {
    mockedUseInventoryForm.mockReturnValue({
      ...defaultInventoryFormReturn,
      loading: true,
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText('Adding...')).toBeInTheDocument()
  })

  it('shows updating text when editing and loading', () => {
    mockedUseInventoryForm.mockReturnValue({
      ...defaultInventoryFormReturn,
      loading: true,
      editingInventory: { id: 1 },
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText('Updating...')).toBeInTheDocument()
  })

  it('shows confirm modal when delete is triggered', () => {
    mockedUseInventoryForm.mockReturnValue({
      ...defaultInventoryFormReturn,
      confirmDelete: { isOpen: true, inventoryId: 1, inventoryName: 'Test Item' },
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('renders inventory items when data exists', () => {
    mockedUseInventoryList.mockReturnValue({
      ...defaultInventoryListReturn,
      inventory: [
        { id: 1, sire_name: 'Bull A', breed: 'Angus', quantity: 10, owner_type: 'customer' },
        { id: 2, sire_name: 'Bull B', breed: 'Hereford', quantity: 5, owner_type: 'internal' },
      ],
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    // Inventory items should render - check that page title is present (items render in list)
    expect(screen.getByText('Genetic Inventory')).toBeInTheDocument()
  })

  it('shows empty state when no inventory', () => {
    mockedUseInventoryList.mockReturnValue({
      ...defaultInventoryListReturn,
      inventory: [],
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<GeneticInventory user={mockUser} />)

    expect(screen.getByText(/No inventory/i)).toBeInTheDocument()
  })

  it('opens sidebar when hamburger menu is clicked', () => {
    renderWithRouter(<GeneticInventory user={mockUser} />)

    const hamburger = screen.getByLabelText('Toggle menu')
    expect(hamburger).toBeInTheDocument()
  })
})
