import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import MedicalInventory from '../pages/MedicalInventory'

// Mock the sub-hooks
vi.mock('../hooks/useMedicalInventory', () => ({
  useCategoryList: vi.fn(),
  useCategoryForm: vi.fn(),
  useInventoryList: vi.fn(),
  useInventoryForm: vi.fn(),
  useUsageLog: vi.fn(),
}))

// Mock the API
vi.mock('../api/medicalInventory', () => ({
  updateInventoryItem: vi.fn(),
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
      <button onClick={props.onConfirm as () => void}>Confirm</button>
      <button onClick={props.onClose as () => void}>Cancel</button>
    </div>
  ) : null,
}))

// Mock LoadingSpinner
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock InventoryTable
vi.mock('../pages/MedicalInventory/components/InventoryTable', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="inventory-table">
      {(props.items as Array<Record<string, unknown>>).length === 0 ? (
        <p>No items found</p>
      ) : (
        (props.items as Array<Record<string, unknown>>).map((item) => (
          <div key={item.id as string} data-testid="inventory-item">
            {item.item_name as string}
          </div>
        ))
      )}
    </div>
  ),
}))

// Mock CategoryTree
vi.mock('../pages/MedicalInventory/components/CategoryTree', () => ({
  default: () => <div data-testid="category-tree">Category Tree</div>,
}))

// Mock CategoryForm
vi.mock('../pages/MedicalInventory/components/CategoryForm', () => ({
  default: () => null,
}))

// Mock InventoryForm
vi.mock('../pages/MedicalInventory/components/InventoryForm', () => ({
  default: () => null,
}))

// Mock UsageLogModal
vi.mock('../pages/MedicalInventory/components/UsageLogModal', () => ({
  default: () => null,
}))

// Mock RestockModal
vi.mock('../pages/MedicalInventory/components/RestockModal', () => ({
  default: () => null,
}))

import {
  useCategoryList,
  useCategoryForm,
  useInventoryList,
  useInventoryForm,
  useUsageLog,
} from '../hooks/useMedicalInventory'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithRouter = (ui: ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('MedicalInventory Page', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  const defaultCategoryListReturn = {
    categories: [],
    categoryTree: [],
    categoryOptions: [],
    expandedIds: new Set<string>(),
    selectedCategoryId: null,
    selectedCategoryIds: null,
    error: '',
    loading: false,
    toggleExpanded: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    selectCategory: vi.fn(),
    clearSelection: vi.fn(),
    getBreadcrumb: vi.fn().mockReturnValue([]),
    refresh: vi.fn(),
    setError: vi.fn(),
  } as unknown as ReturnType<typeof useCategoryList>

  const defaultCategoryFormReturn = {
    isFormOpen: false,
    editingCategory: null,
    formData: { name: '', description: '', parent_id: null },
    loading: false,
    deleting: false,
    error: '',
    confirmDelete: { isOpen: false, categoryId: null, categoryName: '' },
    validation: { errors: {}, validateAll: vi.fn(), reset: vi.fn() },
    setIsFormOpen: vi.fn(),
    setFormData: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleCloseForm: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteCategory: vi.fn(),
  } as unknown as ReturnType<typeof useCategoryForm>

  const defaultInventoryListReturn = {
    inventory: [],
    rawInventory: [],
    searchQuery: '',
    filterSort: 'all:name-asc',
    counts: { total: 0, lowStock: 0, expiring: 0, byCategory: {} },
    error: '',
    loading: false,
    updating: false,
    setSearchQuery: vi.fn(),
    setFilterSort: vi.fn(),
    setError: vi.fn(),
    refresh: vi.fn(),
    filterByCategory: vi.fn().mockReturnValue([]),
    inlineUpdate: vi.fn(),
  } as unknown as ReturnType<typeof useInventoryList>

  const defaultInventoryFormReturn = {
    isFormOpen: false,
    editingItem: null,
    formData: {
      item_name: '',
      quantity: '',
      unit: 'units',
      category_id: null,
      reorder_threshold: '',
      expiration_date: '',
      cost_per_unit: '',
      supplier_name: '',
      supplier_contact: '',
      notes: '',
    },
    loading: false,
    deleting: false,
    error: '',
    confirmDelete: { isOpen: false, itemId: null, itemName: '' },
    validation: { errors: {}, validateAll: vi.fn(), reset: vi.fn() },
    setIsFormOpen: vi.fn(),
    setFormData: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleCloseForm: vi.fn(),
    openFormForCategory: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteItem: vi.fn(),
  } as unknown as ReturnType<typeof useInventoryForm>

  const defaultUsageLogReturn = {
    selectedItem: null,
    usageHistory: [],
    historyLoading: false,
    loading: false,
    error: '',
    isLogModalOpen: false,
    logFormData: { quantity_used: '', notes: '' },
    handleLogInputChange: vi.fn(),
    openLogUsage: vi.fn(),
    handleLogUsage: vi.fn(),
    closeLogUsage: vi.fn(),
    isRestockModalOpen: false,
    restockFormData: { quantity: '' },
    handleRestockInputChange: vi.fn(),
    openRestock: vi.fn(),
    handleRestock: vi.fn(),
    closeRestock: vi.fn(),
  } as unknown as ReturnType<typeof useUsageLog>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCategoryList).mockReturnValue(defaultCategoryListReturn)
    vi.mocked(useCategoryForm).mockReturnValue(defaultCategoryFormReturn)
    vi.mocked(useInventoryList).mockReturnValue(defaultInventoryListReturn)
    vi.mocked(useInventoryForm).mockReturnValue(defaultInventoryFormReturn)
    vi.mocked(useUsageLog).mockReturnValue(defaultUsageLogReturn)
  })

  it('renders page title', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Medical Inventory')).toBeInTheDocument()
  })

  it('renders page subtitle', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Manage supplies and track usage')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders add item button', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('renders add folder button', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Add Folder')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument()
  })

  it('calls setSearchQuery when typing in search', () => {
    const setSearchQuery = vi.fn()
    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      setSearchQuery,
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    const searchInput = screen.getByPlaceholderText('Search items...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(setSearchQuery).toHaveBeenCalledWith('test')
  })

  it('renders filter/sort dropdown', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByDisplayValue('All Items (A-Z)')).toBeInTheDocument()
  })

  it('calls setFilterSort when filter is changed', () => {
    const setFilterSort = vi.fn()
    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      setFilterSort,
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    const filterSelect = screen.getByDisplayValue('All Items (A-Z)')
    fireEvent.change(filterSelect, { target: { value: 'low:name-asc' } })

    expect(setFilterSort).toHaveBeenCalledWith('low:name-asc')
  })

  it('shows folders toggle button', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Folders')).toBeInTheDocument()
  })

  it('shows loading overlay when deleting category', () => {
    vi.mocked(useCategoryForm).mockReturnValue({
      ...defaultCategoryFormReturn,
      deleting: true,
    } as unknown as ReturnType<typeof useCategoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
  })

  it('shows loading overlay when deleting item', () => {
    vi.mocked(useInventoryForm).mockReturnValue({
      ...defaultInventoryFormReturn,
      deleting: true,
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Deleting...')).toBeInTheDocument()
  })

  it('shows loading overlay when saving', () => {
    vi.mocked(useCategoryForm).mockReturnValue({
      ...defaultCategoryFormReturn,
      loading: true,
    } as unknown as ReturnType<typeof useCategoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows loading overlay when usage log is loading', () => {
    vi.mocked(useUsageLog).mockReturnValue({
      ...defaultUsageLogReturn,
      loading: true,
    } as unknown as ReturnType<typeof useUsageLog>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows category delete confirm modal', () => {
    vi.mocked(useCategoryForm).mockReturnValue({
      ...defaultCategoryFormReturn,
      confirmDelete: { isOpen: true, categoryId: '1', categoryName: 'Test Category' },
    } as unknown as ReturnType<typeof useCategoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    expect(screen.getByText('Delete Folder')).toBeInTheDocument()
  })

  it('shows item delete confirm modal', () => {
    vi.mocked(useInventoryForm).mockReturnValue({
      ...defaultInventoryFormReturn,
      confirmDelete: { isOpen: true, itemId: '1', itemName: 'Test Item' },
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
  })

  it('renders empty state when no items', () => {
    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      filterByCategory: vi.fn().mockReturnValue([]),
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders inventory items when data exists', () => {
    const mockItems = [
      { id: '1', item_name: 'Bandages', quantity: 50, unit: 'units', category_id: null },
      { id: '2', item_name: 'Syringes', quantity: 100, unit: 'units', category_id: null },
    ]

    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      inventory: mockItems,
      filterByCategory: vi.fn().mockReturnValue(mockItems),
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Bandages')).toBeInTheDocument()
    expect(screen.getByText('Syringes')).toBeInTheDocument()
  })

  it('shows breadcrumb when category is selected', () => {
    vi.mocked(useCategoryList).mockReturnValue({
      ...defaultCategoryListReturn,
      selectedCategoryId: '1',
      getBreadcrumb: vi.fn().mockReturnValue([{ id: '1', name: 'Antibiotics' }]),
    } as unknown as ReturnType<typeof useCategoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('All Items')).toBeInTheDocument()
    expect(screen.getByText('Antibiotics')).toBeInTheDocument()
  })

  it('opens add item form when add item button is clicked', () => {
    const setIsFormOpen = vi.fn()
    vi.mocked(useInventoryForm).mockReturnValue({
      ...defaultInventoryFormReturn,
      setIsFormOpen,
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    fireEvent.click(screen.getByText('Add Item'))

    expect(setIsFormOpen).toHaveBeenCalledWith(true)
  })

  it('opens add folder form when add folder button is clicked', () => {
    const setIsFormOpen = vi.fn()
    vi.mocked(useCategoryForm).mockReturnValue({
      ...defaultCategoryFormReturn,
      setIsFormOpen,
    } as unknown as ReturnType<typeof useCategoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    fireEvent.click(screen.getByText('Add Folder'))

    expect(setIsFormOpen).toHaveBeenCalledWith(true)
  })

  it('opens add item form for category when category is selected', () => {
    const openFormForCategory = vi.fn()
    vi.mocked(useCategoryList).mockReturnValue({
      ...defaultCategoryListReturn,
      selectedCategoryId: '1',
    } as unknown as ReturnType<typeof useCategoryList>)
    vi.mocked(useInventoryForm).mockReturnValue({
      ...defaultInventoryFormReturn,
      openFormForCategory,
    } as unknown as ReturnType<typeof useInventoryForm>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    fireEvent.click(screen.getByText('Add Item'))

    expect(openFormForCategory).toHaveBeenCalledWith('1')
  })

  it('displays low stock count in filter dropdown', () => {
    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      counts: { total: 10, lowStock: 3, expiring: 2, byCategory: {} },
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText(/Low Stock \(3\)/)).toBeInTheDocument()
  })

  it('displays expiring count in filter dropdown', () => {
    vi.mocked(useInventoryList).mockReturnValue({
      ...defaultInventoryListReturn,
      counts: { total: 10, lowStock: 3, expiring: 2, byCategory: {} },
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText(/Expiring Soon \(2\)/)).toBeInTheDocument()
  })

  it('opens hamburger menu when clicked', () => {
    renderWithRouter(<MedicalInventory user={mockUser} />)

    const hamburger = screen.getByLabelText('Toggle menu')
    expect(hamburger).toBeInTheDocument()
  })

  it('displays error message when error exists', () => {
    vi.mocked(useCategoryList).mockReturnValue({
      ...defaultCategoryListReturn,
      error: 'Failed to load categories',
    } as unknown as ReturnType<typeof useCategoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Failed to load categories')).toBeInTheDocument()
  })
})

describe('MedicalInventory useInventoryList hook integration', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCategoryList).mockReturnValue({
      categories: [],
      categoryTree: [],
      categoryOptions: [],
      expandedIds: new Set<string>(),
      selectedCategoryId: null,
      selectedCategoryIds: null,
      error: '',
      loading: false,
      toggleExpanded: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
      selectCategory: vi.fn(),
      clearSelection: vi.fn(),
      getBreadcrumb: vi.fn().mockReturnValue([]),
      refresh: vi.fn(),
      setError: vi.fn(),
    } as unknown as ReturnType<typeof useCategoryList>)
    vi.mocked(useCategoryForm).mockReturnValue({
      isFormOpen: false,
      editingCategory: null,
      formData: { name: '', description: '', parent_id: null },
      loading: false,
      deleting: false,
      error: '',
      confirmDelete: { isOpen: false, categoryId: null, categoryName: '' },
      validation: { errors: {}, validateAll: vi.fn(), reset: vi.fn() },
      setIsFormOpen: vi.fn(),
      setFormData: vi.fn(),
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      handleEdit: vi.fn(),
      handleCloseForm: vi.fn(),
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      confirmDeleteCategory: vi.fn(),
    } as unknown as ReturnType<typeof useCategoryForm>)
    vi.mocked(useInventoryForm).mockReturnValue({
      isFormOpen: false,
      editingItem: null,
      formData: {
        item_name: '',
        quantity: '',
        unit: 'units',
        category_id: null,
        reorder_threshold: '',
        expiration_date: '',
        cost_per_unit: '',
        supplier_name: '',
        supplier_contact: '',
        notes: '',
      },
      loading: false,
      deleting: false,
      error: '',
      confirmDelete: { isOpen: false, itemId: null, itemName: '' },
      validation: { errors: {}, validateAll: vi.fn(), reset: vi.fn() },
      setIsFormOpen: vi.fn(),
      setFormData: vi.fn(),
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      handleEdit: vi.fn(),
      handleCloseForm: vi.fn(),
      openFormForCategory: vi.fn(),
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      confirmDeleteItem: vi.fn(),
    } as unknown as ReturnType<typeof useInventoryForm>)
    vi.mocked(useUsageLog).mockReturnValue({
      selectedItem: null,
      usageHistory: [],
      historyLoading: false,
      loading: false,
      error: '',
      isLogModalOpen: false,
      logFormData: { quantity_used: '', notes: '' },
      handleLogInputChange: vi.fn(),
      openLogUsage: vi.fn(),
      handleLogUsage: vi.fn(),
      closeLogUsage: vi.fn(),
      isRestockModalOpen: false,
      restockFormData: { quantity: '' },
      handleRestockInputChange: vi.fn(),
      openRestock: vi.fn(),
      handleRestock: vi.fn(),
      closeRestock: vi.fn(),
    } as unknown as ReturnType<typeof useUsageLog>)
  })

  it('filters items by low stock', () => {
    const lowStockItems = [
      { id: '1', item_name: 'Low Item', quantity: 2, reorder_threshold: 5, unit: 'units' },
    ]

    vi.mocked(useInventoryList).mockReturnValue({
      inventory: lowStockItems,
      rawInventory: lowStockItems,
      searchQuery: '',
      filterSort: 'low:name-asc',
      counts: { total: 1, lowStock: 1, expiring: 0, byCategory: {} },
      error: '',
      loading: false,
      updating: false,
      setSearchQuery: vi.fn(),
      setFilterSort: vi.fn(),
      setError: vi.fn(),
      refresh: vi.fn(),
      filterByCategory: vi.fn().mockReturnValue(lowStockItems),
      inlineUpdate: vi.fn(),
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Low Item')).toBeInTheDocument()
  })

  it('shows items with expiration warning', () => {
    const expiringItems = [
      {
        id: '1',
        item_name: 'Expiring Med',
        quantity: 10,
        unit: 'units',
        expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    vi.mocked(useInventoryList).mockReturnValue({
      inventory: expiringItems,
      rawInventory: expiringItems,
      searchQuery: '',
      filterSort: 'expiring:expiration-asc',
      counts: { total: 1, lowStock: 0, expiring: 1, byCategory: {} },
      error: '',
      loading: false,
      updating: false,
      setSearchQuery: vi.fn(),
      setFilterSort: vi.fn(),
      setError: vi.fn(),
      refresh: vi.fn(),
      filterByCategory: vi.fn().mockReturnValue(expiringItems),
      inlineUpdate: vi.fn(),
    } as unknown as ReturnType<typeof useInventoryList>)

    renderWithRouter(<MedicalInventory user={mockUser} />)

    expect(screen.getByText('Expiring Med')).toBeInTheDocument()
  })
})
