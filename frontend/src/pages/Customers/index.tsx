import { useState } from 'react';
import { FiMenu, FiPlus, FiPrinter } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import CustomerDetail from './components/CustomerDetail';
import { useCustomerList, useCustomerForm, useCustomerDetail } from '../../hooks/useCustomers';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useCustomersReport } from '../../hooks/reports';

// Page-specific components
import CustomerTable from './components/CustomerTable';
import CustomerForm from './components/CustomerForm';

import type { AuthUser } from '../../types';
import './styles.css';

interface CustomersProps {
  user: AuthUser | null;
}

export default function Customers({ user }: CustomersProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data hooks
  const { settings } = useUserSettings(user?.id);
  const customerList = useCustomerList(settings.items_per_page ?? undefined);
  const customerForm = useCustomerForm(customerList.refresh, user?.id);
  const customerDetail = useCustomerDetail();
  const { generateReport, loading: reportLoading } = useCustomersReport();

  // Combine errors
  const error = customerList.error || customerForm.error;

  return (
    <div className="customers">
      {/* Hamburger Menu Button */}
      <button
        className={`hamburger ${isSidebarOpen ? 'hamburger--hidden' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <FiMenu size={24} />
      </button>

      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <ConfirmModal
        isOpen={customerForm.confirmDelete.isOpen}
        onClose={customerForm.closeDeleteConfirm}
        onConfirm={customerForm.confirmDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerForm.confirmDelete.customerName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Loading Overlay */}
      {customerForm.deleting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting customer...</p>
          </div>
        </div>
      )}

      {/* Form Loading Overlay */}
      {customerForm.loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">
              {customerForm.editingCustomer ? 'Updating customer...' : 'Adding customer...'}
            </p>
          </div>
        </div>
      )}

      <main className="customers__main">
        <div className="customers__content">
          <header className="customers__header">
            <div>
              <h1 className="customers__title">Customers</h1>
              <p className="customers__subtitle">Manage client information</p>
            </div>
            <div className="customers__actions">
              <button
                className="customers__action-btn customers__action-btn--icon"
                onClick={generateReport}
                disabled={reportLoading}
                title={reportLoading ? 'Generating report...' : 'Print Report'}
              >
                <FiPrinter size={20} />
              </button>
              <button
                className="customers__add-btn"
                onClick={() => customerForm.setIsFormOpen(true)}
              >
                <FiPlus size={20} />
                Add Customer
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="customers__search">
            <input
              type="text"
              placeholder="Search by name, email, phone, or owned semen..."
              value={customerList.searchQuery}
              onChange={(e) => customerList.setSearchQuery(e.target.value)}
              className="customers__search-input"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="customers__sort-filter">
            <select
              value={customerList.sortBy}
              onChange={(e) => customerList.setSortBy(e.target.value)}
              className="customers__sort-select"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="items-desc">Most Items</option>
              <option value="items-asc">Least Items</option>
              <option value="recent">Recently Added</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Customer Form Modal */}
          <CustomerForm
            isOpen={customerForm.isFormOpen}
            editingCustomer={customerForm.editingCustomer}
            formData={customerForm.formData}
            loading={customerForm.loading}
            error={customerForm.error}
            validation={customerForm.validation}
            onInputChange={customerForm.handleInputChange}
            onSubmit={customerForm.handleSubmit}
            onClose={customerForm.handleCloseForm}
          />

          {/* Customer List */}
          <div className="customers__list">
            <CustomerTable
              customers={customerList.customers}
              onRowClick={customerDetail.handleViewCustomer}
              onEdit={customerForm.handleEdit}
              onDelete={(customer) => customerForm.openDeleteConfirm(customer.id, customer.name)}
            />
            <Pagination
              currentPage={customerList.currentPage}
              totalPages={customerList.totalPages}
              startIndex={customerList.startIndex}
              endIndex={customerList.endIndex}
              totalItems={customerList.totalCount}
              onPageChange={customerList.goToPage}
            />
          </div>

          {/* Customer Detail Modal */}
          {customerDetail.viewingCustomer && (
            <CustomerDetail
              customer={customerDetail.viewingCustomer}
              inventory={customerDetail.customerInventory}
              inventoryLoading={customerDetail.inventoryLoading}
              onClose={customerDetail.handleCloseView}
              onEdit={() => {
                customerDetail.handleCloseView();
                customerForm.handleEdit(customerDetail.viewingCustomer!);
              }}
              onDelete={() => {
                customerDetail.handleCloseView();
                customerForm.openDeleteConfirm(customerDetail.viewingCustomer!.id, customerDetail.viewingCustomer!.name);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
