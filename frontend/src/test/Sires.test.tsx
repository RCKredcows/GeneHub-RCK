import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sires from '../pages/Sires'

// Mock the sub-hooks
vi.mock('../hooks/useSires', () => ({
  useSireList: vi.fn(),
  useSireForm: vi.fn(),
  useSireQuickCreate: vi.fn(),
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

import { useSireList, useSireForm, useSireQuickCreate } from '../hooks/useSires'

const mockedUseSireList = vi.mocked(useSireList)
const mockedUseSireForm = vi.mocked(useSireForm)
const mockedUseSireQuickCreate = vi.mocked(useSireQuickCreate)

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

describe('Sires Page', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: { first_name: 'John' },
  }

  const defaultSireListReturn = {
    sires: [],
    rawSires: [],
    customers: [],
    searchQuery: '',
    ownerFilter: 'all',
    error: '',
    setSearchQuery: vi.fn(),
    setOwnerFilter: vi.fn(),
    setError: vi.fn(),
    refresh: vi.fn(),
  }

  const defaultSireFormReturn = {
    formData: {
      name: '',
      breed: '',
      registration_number: '',
      image_url: '',
      owner_type: '',
      customer_id: null,
      notes: '',
      available_for_sale: false,
      price_for_semen: '',
      price_for_sexed_semen: '',
    },
    isFormOpen: false,
    editingSire: null,
    selectedCustomer: null,
    imagePreview: null,
    loading: false,
    deleting: false,
    error: '',
    confirmDelete: { isOpen: false, sireId: null, sireName: '' },
    setIsFormOpen: vi.fn(),
    setFormData: vi.fn(),
    setSelectedCustomer: vi.fn(),
    handleInputChange: vi.fn(),
    handleImageChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleEdit: vi.fn(),
    handleCloseForm: vi.fn(),
    handleOpenForm: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDeleteSire: vi.fn(),
  }

  const defaultQuickCreateReturn = {
    openCustomerForm: vi.fn(),
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseSireList.mockReturnValue(defaultSireListReturn as unknown as ReturnType<typeof useSireList>)
    mockedUseSireForm.mockReturnValue(defaultSireFormReturn as unknown as ReturnType<typeof useSireForm>)
    mockedUseSireQuickCreate.mockReturnValue(defaultQuickCreateReturn as unknown as ReturnType<typeof useSireQuickCreate>)
  })

  it('renders page title and subtitle', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Sires')).toBeInTheDocument()
    expect(screen.getByText('Manage bull information')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders add sire button', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Add Sire')).toBeInTheDocument()
  })

  it('calls handleOpenForm when add button is clicked', () => {
    const handleOpenForm = vi.fn()
    mockedUseSireForm.mockReturnValue({
      ...defaultSireFormReturn,
      handleOpenForm,
    } as unknown as ReturnType<typeof useSireForm>)

    renderWithRouter(<Sires user={mockUser} />)

    fireEvent.click(screen.getByText('Add Sire'))

    expect(handleOpenForm).toHaveBeenCalled()
  })

  it('renders search input', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByPlaceholderText(/Search by name, breed/i)).toBeInTheDocument()
  })

  it('calls setSearchQuery when typing in search', () => {
    const setSearchQuery = vi.fn()
    mockedUseSireList.mockReturnValue({
      ...defaultSireListReturn,
      setSearchQuery,
    } as unknown as ReturnType<typeof useSireList>)

    renderWithRouter(<Sires user={mockUser} />)

    const searchInput = screen.getByPlaceholderText(/Search by name, breed/i)
    fireEvent.change(searchInput, { target: { value: 'Angus' } })

    expect(setSearchQuery).toHaveBeenCalledWith('Angus')
  })

  it('renders filter tabs', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('RCK')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('calls setOwnerFilter when filter tab is clicked', () => {
    const setOwnerFilter = vi.fn()
    mockedUseSireList.mockReturnValue({
      ...defaultSireListReturn,
      setOwnerFilter,
    } as unknown as ReturnType<typeof useSireList>)

    renderWithRouter(<Sires user={mockUser} />)

    fireEvent.click(screen.getByText('RCK'))

    expect(setOwnerFilter).toHaveBeenCalledWith('rck')
  })

  it('shows loading overlay when deleting', () => {
    mockedUseSireForm.mockReturnValue({
      ...defaultSireFormReturn,
      deleting: true,
    } as unknown as ReturnType<typeof useSireForm>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Deleting sire...')).toBeInTheDocument()
  })

  it('shows loading overlay when adding', () => {
    mockedUseSireForm.mockReturnValue({
      ...defaultSireFormReturn,
      loading: true,
    } as unknown as ReturnType<typeof useSireForm>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Adding sire...')).toBeInTheDocument()
  })

  it('shows updating text when editing', () => {
    mockedUseSireForm.mockReturnValue({
      ...defaultSireFormReturn,
      loading: true,
      editingSire: { id: 1 },
    } as unknown as ReturnType<typeof useSireForm>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Updating sire...')).toBeInTheDocument()
  })

  it('shows confirm modal when delete is triggered', () => {
    mockedUseSireForm.mockReturnValue({
      ...defaultSireFormReturn,
      confirmDelete: { isOpen: true, sireId: 1, sireName: 'Test Bull' },
    } as unknown as ReturnType<typeof useSireForm>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('renders sires list when data exists', () => {
    mockedUseSireList.mockReturnValue({
      ...defaultSireListReturn,
      sires: [
        { id: 1, name: 'Bull Alpha', breed: 'Angus', registration_number: 'REG001' },
        { id: 2, name: 'Bull Beta', breed: 'Hereford', registration_number: 'REG002' },
      ],
    } as unknown as ReturnType<typeof useSireList>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Bull Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bull Beta')).toBeInTheDocument()
  })

  it('shows empty state when no sires', () => {
    mockedUseSireList.mockReturnValue({
      ...defaultSireListReturn,
      sires: [],
    } as unknown as ReturnType<typeof useSireList>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText(/No sires/i)).toBeInTheDocument()
  })

  it('renders hamburger menu button', () => {
    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('displays sire breed information', () => {
    mockedUseSireList.mockReturnValue({
      ...defaultSireListReturn,
      sires: [
        { id: 1, name: 'Test Bull', breed: 'Black Angus', registration_number: 'REG123' },
      ],
    } as unknown as ReturnType<typeof useSireList>)

    renderWithRouter(<Sires user={mockUser} />)

    expect(screen.getByText('Black Angus')).toBeInTheDocument()
  })
})
