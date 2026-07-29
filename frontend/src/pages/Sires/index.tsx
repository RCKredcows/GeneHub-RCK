import { useState } from 'react';
import { FiMenu, FiPlus, FiPrinter } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { useSireList, useSireForm, useSireQuickCreate } from '../../hooks/useSires';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useSiresReport } from '../../hooks/reports';

// Page-specific components
import SireCard from './components/SireCard';
import SireForm from './components/SireForm';
import CustomerForm from '../Customers/components/CustomerForm';

import type { AuthUser } from '../../types';
import './styles.css';

interface SiresProps {
  user: AuthUser | null;
}

export default function Sires({ user }: SiresProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data hooks
  const { settings } = useUserSettings(user?.id);
  const sireList = useSireList(settings.items_per_page ?? undefined);
  const sireForm = useSireForm(sireList.refresh, user?.id);
  const { generateReport, loading: reportLoading } = useSiresReport();

  // Quick create customer
  const quickCreate = useSireQuickCreate({ sireForm, userId: user?.id });

  // Combine errors
  const error = sireList.error || sireForm.error;

  return (
    <div className="sires">
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
        isOpen={sireForm.confirmDelete.isOpen}
        onClose={sireForm.closeDeleteConfirm}
        onConfirm={sireForm.confirmDeleteSire}
        title="Delete Sire"
        message={`Are you sure you want to delete ${sireForm.confirmDelete.sireName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Loading Overlay */}
      {sireForm.deleting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting sire...</p>
          </div>
        </div>
      )}

      {/* Form Loading Overlay */}
      {sireForm.loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">
              {sireForm.editingSire ? 'Updating sire...' : 'Adding sire...'}
            </p>
          </div>
        </div>
      )}

      <main className="sires__main">
        <div className="sires__content">
          <header className="sires__header">
            <div>
              <h1 className="sires__title">Sires</h1>
              <p className="sires__subtitle">Manage bull information</p>
            </div>
            <div className="sires__actions">
              <button
                className="sires__report-btn"
                onClick={generateReport}
                disabled={reportLoading}
                title={reportLoading ? 'Generating report...' : 'Print Report'}
              >
                <FiPrinter size={20} />
              </button>
              <button
                className="sires__add-btn"
                onClick={sireForm.handleOpenForm}
              >
                <FiPlus size={20} />
                Add Sire
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="sires__search">
            <input
              type="text"
              placeholder="Search by name, breed, or registration number..."
              value={sireList.searchQuery}
              onChange={(e) => sireList.setSearchQuery(e.target.value)}
              className="sires__search-input"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="sires__filter-bar">
            <select
              className="sires__filter-select"
              value={sireList.availabilityFilter}
              onChange={(e) => sireList.setAvailabilityFilter(e.target.value)}
            >
              <option value="available">Available to Sell</option>
              <option value="all">All Sires</option>
            </select>

            <select
              className="sires__filter-select"
              value={sireList.priceFilter}
              onChange={(e) => sireList.setPriceFilter(e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
              <option value="has-price">Has Price</option>
              <option value="no-price">No Price Set</option>
            </select>
          </div>

          {/* Owner Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${sireList.ownerFilter === 'all' ? 'filter-tab--active' : ''}`}
              onClick={() => sireList.setOwnerFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${sireList.ownerFilter === 'rck' ? 'filter-tab--active' : ''}`}
              onClick={() => sireList.setOwnerFilter('rck')}
            >
              RCK
            </button>
            <button
              className={`filter-tab ${sireList.ownerFilter === 'customer' ? 'filter-tab--active' : ''}`}
              onClick={() => sireList.setOwnerFilter('customer')}
            >
              Customer
            </button>
            <button
              className={`filter-tab ${sireList.ownerFilter === 'unknown' ? 'filter-tab--active' : ''}`}
              onClick={() => sireList.setOwnerFilter('unknown')}
            >
              Unknown
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Sire Form Modal */}
          <SireForm
            isOpen={sireForm.isFormOpen}
            editingSire={sireForm.editingSire}
            selectedCustomer={sireForm.selectedCustomer}
            formData={sireForm.formData}
            loading={sireForm.loading}
            error={sireForm.error}
            imagePreview={sireForm.imagePreview}
            validation={sireForm.validation}
            onInputChange={sireForm.handleInputChange}
            onImageChange={sireForm.handleImageChange}
            onRemoveImage={sireForm.handleRemoveImage}
            onSubmit={sireForm.handleSubmit}
            onClose={sireForm.handleCloseForm}
            onCreateCustomer={quickCreate.openCustomerForm}
          />

          {/* Quick Create Customer Modal */}
          <CustomerForm
            isOpen={quickCreate.customer.isOpen}
            editingCustomer={null}
            formData={quickCreate.customer.formData}
            loading={quickCreate.customer.loading}
            error={quickCreate.customer.error}
            validation={quickCreate.customer.validation}
            onInputChange={quickCreate.customer.onInputChange}
            onSubmit={quickCreate.customer.onSubmit}
            onClose={quickCreate.customer.onClose}
          />

          {/* Sire List */}
          <div className="sires__list">
            {sireList.loading ? (
              <div className="empty-state">
                <LoadingSpinner size="lg" />
                <p className="empty-state__text">Loading sires...</p>
              </div>
            ) : sireList.sires.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__text">No sires found matching your search.</p>
              </div>
            ) : (
              <>
                <div className="sires__cards">
                  {sireList.sires.map((sire) => (
                    <SireCard
                      key={sire.id}
                      sire={sire}
                      onEdit={() => sireForm.handleEdit(sire)}
                      onDelete={() => sireForm.openDeleteConfirm(sire.id, sire.name)}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={sireList.currentPage}
                  totalPages={sireList.totalPages}
                  startIndex={sireList.startIndex}
                  endIndex={sireList.endIndex}
                  totalItems={sireList.totalCount}
                  onPageChange={sireList.goToPage}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
