import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Customers from '../pages/Customers'

// Mock the sub-hooks
vi.mock('../hooks/useCustomers', () => ({
  useCustomerList: vi.fn(),
  useCustomerForm: vi.fn(),
  useCustomerDetail: vi.fn(),
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

// Mock CustomerDetail
vi.mock('../components/CustomerDetail', () => ({
  default: ({ customer, onClose }: { customer: Record<string, unknown> | null; onClose: () => void }) => customer ? (
    <div data-testid="customer-detail">
      <span>{customer.name as string}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))

import { useCustomerList, useCustomerForm, useCustomerDetail } from '../hooks/useCustomers'

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

describe('Customers Page', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  const defaultCustomerListReturn = {
    customers: [],
    customerInventory: [],
    searchQuery: '',
    sortBy: 'name-asc',
    error: '',
    setSearchQuery: vi.fn(),
    setSortBy: vi.fn(),
    setError: vi.fn(),
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useCustomerList>

  const defaultCustomerFormReturn = {
    formData: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
    },
    isFormOpen: false,
    editingCustomer: null,
    loading: false,
    deleting: false,
    error: '',
    confirmDelete: { isOpen: false, customerId: null, customerName: '' },
    setIsFormOpen: vi.fn(),
    setFormData: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleCloseForm: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteCustomer: vi.fn(),
  } as unknown as ReturnType<typeof useCustomerForm>

  const defaultCustomerDetailReturn = {
    viewingCustomer: null,
    handleViewCustomer: vi.fn(),
    handleCloseView: vi.fn(),
    getViewingCustomerInventory: vi.fn(() => []),
  } as unknown as ReturnType<typeof useCustomerDetail>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCustomerList).mockReturnValue(defaultCustomerListReturn)
    vi.mocked(useCustomerForm).mockReturnValue(defaultCustomerFormReturn)
    vi.mocked(useCustomerDetail).mockReturnValue(defaultCustomerDetailReturn)
  })

  it('renders page title and subtitle', () => {
    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Manage client information')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders add customer button', () => {
    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('Add Customer')).toBeInTheDocument()
  })

  it('calls setIsFormOpen when add button is clicked', () => {
    const setIsFormOpen = vi.fn()
    vi.mocked(useCustomerForm).mockReturnValue({
      ...defaultCustomerFormReturn,
      setIsFormOpen,
    } as ReturnType<typeof useCustomerForm>)

    renderWithRouter(<Customers user={mockUser} />)

    fireEvent.click(screen.getByText('Add Customer'))

    expect(setIsFormOpen).toHaveBeenCalledWith(true)
  })

  it('renders search input', () => {
    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByPlaceholderText(/Search by name, email/i)).toBeInTheDocument()
  })

  it('calls setSearchQuery when typing in search', () => {
    const setSearchQuery = vi.fn()
    vi.mocked(useCustomerList).mockReturnValue({
      ...defaultCustomerListReturn,
      setSearchQuery,
    } as ReturnType<typeof useCustomerList>)

    renderWithRouter(<Customers user={mockUser} />)

    const searchInput = screen.getByPlaceholderText(/Search by name, email/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })

    expect(setSearchQuery).toHaveBeenCalledWith('John')
  })

  it('renders sort dropdown', () => {
    renderWithRouter(<Customers user={mockUser} />)

    const sortSelect = document.querySelector('.customers__sort-select')
    expect(sortSelect).toBeInTheDocument()
  })

  it('calls setSortBy when sort option is changed', () => {
    const setSortBy = vi.fn()
    vi.mocked(useCustomerList).mockReturnValue({
      ...defaultCustomerListReturn,
      setSortBy,
    } as ReturnType<typeof useCustomerList>)

    renderWithRouter(<Customers user={mockUser} />)

    const sortSelect = document.querySelector('.customers__sort-select')!
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } })

    expect(setSortBy).toHaveBeenCalledWith('name-desc')
  })

  it('shows loading overlay when deleting', () => {
    vi.mocked(useCustomerForm).mockReturnValue({
      ...defaultCustomerFormReturn,
      deleting: true,
    } as ReturnType<typeof useCustomerForm>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('Deleting customer...')).toBeInTheDocument()
  })

  it('shows loading overlay when adding', () => {
    vi.mocked(useCustomerForm).mockReturnValue({
      ...defaultCustomerFormReturn,
      loading: true,
    } as ReturnType<typeof useCustomerForm>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('Adding customer...')).toBeInTheDocument()
  })

  it('shows updating text when editing', () => {
    vi.mocked(useCustomerForm).mockReturnValue({
      ...defaultCustomerFormReturn,
      loading: true,
      editingCustomer: { id: '1' },
    } as unknown as ReturnType<typeof useCustomerForm>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('Updating customer...')).toBeInTheDocument()
  })

  it('shows confirm modal when delete is triggered', () => {
    vi.mocked(useCustomerForm).mockReturnValue({
      ...defaultCustomerFormReturn,
      confirmDelete: { isOpen: true, customerId: '1', customerName: 'John Doe' },
    } as unknown as ReturnType<typeof useCustomerForm>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('renders customer list when data exists', () => {
    vi.mocked(useCustomerList).mockReturnValue({
      ...defaultCustomerListReturn,
      customers: [
        { id: '1', name: 'John Doe', email: 'john@example.com', phone: '555-1234' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678' },
      ],
    } as unknown as ReturnType<typeof useCustomerList>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows empty state when no customers', () => {
    vi.mocked(useCustomerList).mockReturnValue({
      ...defaultCustomerListReturn,
      customers: [],
    } as ReturnType<typeof useCustomerList>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText(/No customers/i)).toBeInTheDocument()
  })

  it('renders hamburger menu button', () => {
    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('displays customer email', () => {
    vi.mocked(useCustomerList).mockReturnValue({
      ...defaultCustomerListReturn,
      customers: [
        { id: '1', name: 'Test User', email: 'test@test.com', phone: '555-0000' },
      ],
    } as unknown as ReturnType<typeof useCustomerList>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByText('test@test.com')).toBeInTheDocument()
  })

  it('shows customer detail view when viewingCustomer is set', () => {
    vi.mocked(useCustomerDetail).mockReturnValue({
      ...defaultCustomerDetailReturn,
      viewingCustomer: { id: '1', name: 'John Doe' },
    } as unknown as ReturnType<typeof useCustomerDetail>)

    renderWithRouter(<Customers user={mockUser} />)

    expect(screen.getByTestId('customer-detail')).toBeInTheDocument()
  })
})
