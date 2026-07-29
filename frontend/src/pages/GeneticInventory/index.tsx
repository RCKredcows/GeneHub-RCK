import { tenant } from '../../config/tenant';
import React, { useState, useEffect, useCallback } from 'react';
import { FiMenu, FiPlus, FiPrinter, FiLogOut } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  useInventoryList,
  useInventoryForm,
  useInventoryDependencies,
  useQuickCreate,
  useCheckinForm
} from '../../hooks/useGeneticInventory';
import { useInventoryQuantity } from '../../hooks/useInventoryQuantity';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useGeneticInventoryReport } from '../../hooks/reports';

// Page-specific components
import InventoryCard from './components/InventoryCard';
import InventoryForm from './components/InventoryForm';
import CheckinModal from './components/CheckinModal';

// Quick create form components
import SireForm from '../Sires/components/SireForm';
import CustomerForm from '../Customers/components/CustomerForm';
import TankForm from '../Tanks/components/TankForm';
import CanisterForm from '../Tanks/components/CanisterForm';

import type { AuthUser } from '../../types';
import './styles.css';

interface GeneticInventoryProps {
  user: AuthUser | null;
}

export default function GeneticInventory({ user }: GeneticInventoryProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zeroConfirm, setZeroConfirm] = useState<{ isOpen: boolean; item: { id: string; quantity: number; inventory_type?: string; embryo_name?: string | null; sire?: { name: string } | null; [key: string]: unknown } | null; delta: number; itemName: string }>({ isOpen: false, item: null, delta: 0, itemName: '' });

  // Data hooks
  const { settings } = useUserSettings(user?.id);
  const dependencies = useInventoryDependencies();
  const inventoryList = useInventoryList(settings.items_per_page ?? undefined);
  const inventoryForm = useInventoryForm({
    onSuccess: inventoryList.refresh,
    clearCanisters: dependencies.clearCanisters,
    userId: user?.id
  });
  const { generateReport, loading: reportLoading } = useGeneticInventoryReport();

  // Check-in form for checked out items
  const checkinForm = useCheckinForm({
    onSuccess: inventoryList.refresh,
    clearCanisters: dependencies.clearCanisters,
    userId: user?.id
  });

  // Quick create hook
  const quickCreate = useQuickCreate({ inventoryForm, dependencies, userId: user?.id });

  // Quantity management
  const quantityManager = useInventoryQuantity(inventoryList.refresh, user?.id);

  // Handle when quantity would go to zero
  const handleWouldDelete = (item: { id: string; quantity: number; inventory_type?: string; embryo_name?: string | null; sire?: { name?: string | null } | null; [key: string]: unknown }, delta: number) => {
    const itemName = item.inventory_type === 'embryo'
      ? (item.embryo_name || 'Unknown Embryo')
      : (item.sire?.name || 'Unknown Sire');
    setZeroConfirm({ isOpen: true, item: item as typeof zeroConfirm.item, delta, itemName });
  };

  const closeZeroConfirm = () => {
    setZeroConfirm({ isOpen: false, item: null, delta: 0, itemName: '' });
  };

  const confirmZeroQuantity = async () => {
    if (zeroConfirm.item) {
      await quantityManager.handleUpdateQuantity(zeroConfirm.item as { id: string; quantity: number; inventory_type?: string; embryo_name?: string | null; sire?: { name: string } | null }, zeroConfirm.delta);
      closeZeroConfirm();
    }
  };

  // Handle check-in form input with tank sync for canisters
  const handleCheckinInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    checkinForm.handleInputChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
    if (e.target.name === 'tank_id' && e.target.value) {
      dependencies.setSelectedTankId(e.target.value as string);
    }
  }, [checkinForm, dependencies]);

  // Sync tank_id changes to dependencies for canister fetching
  useEffect(() => {
    dependencies.setSelectedTankId(inventoryForm.formData.tank_id);
  }, [inventoryForm.formData.tank_id, dependencies.setSelectedTankId]);

  // Clear canister_id when tank changes
  useEffect(() => {
    if (!inventoryForm.formData.tank_id) {
      inventoryForm.setFormData(prev => ({ ...prev, canister_id: null }));
    }
  }, [inventoryForm.formData.tank_id]);

  // Combine errors
  const error = inventoryList.error || inventoryForm.error;

  return (
    <div className="genetic-inventory">
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
        isOpen={inventoryForm.confirmDelete.isOpen}
        onClose={inventoryForm.closeDeleteConfirm}
        onConfirm={inventoryForm.confirmDeleteInventory}
        title="Delete Inventory"
        message={`Are you sure you want to delete ${inventoryForm.confirmDelete.inventoryName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={zeroConfirm.isOpen}
        onClose={closeZeroConfirm}
        onConfirm={confirmZeroQuantity}
        title="Delete Inventory"
        message={`Setting quantity to 0 will delete "${zeroConfirm.itemName}" from inventory. Do you want to continue?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Loading Overlay */}
      {inventoryForm.deleting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting...</p>
          </div>
        </div>
      )}

      {/* Form Loading Overlay */}
      {inventoryForm.loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">
              {inventoryForm.editingInventory ? 'Updating...' : 'Adding...'}
            </p>
          </div>
        </div>
      )}

      <main className="genetic-inventory__main">
        <div className="genetic-inventory__content">
          <header className="genetic-inventory__header">
            <div>
              <h1 className="genetic-inventory__title">Genetic Inventory</h1>
              <p className="genetic-inventory__subtitle">Manage semen and embryo storage</p>
            </div>
            <div className="genetic-inventory__actions">
              <button
                className="genetic-inventory__report-btn"
                onClick={generateReport}
                disabled={reportLoading}
                title={reportLoading ? 'Generating report...' : 'Print Report'}
              >
                <FiPrinter size={20} />
              </button>
              <button
                className="genetic-inventory__add-btn"
                onClick={() => inventoryForm.setIsFormOpen(true)}
                title="Add new inventory"
              >
                <FiPlus size={20} />
                Add Inventory
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="genetic-inventory__search">
            <input
              type="text"
              placeholder="Search by sire, embryo, customer, tank..."
              value={inventoryList.searchQuery}
              onChange={(e) => inventoryList.setSearchQuery(e.target.value)}
              className="genetic-inventory__search-input"
              title="Search inventory by sire, embryo, customer, or tank name"
            />
          </div>

          {/* Owner Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${inventoryList.ownerFilter === 'all' ? 'filter-tab--active' : ''}`}
              onClick={() => inventoryList.setOwnerFilter('all')}
              title="Show all inventory"
            >
              All
            </button>
            <button
              className={`filter-tab ${inventoryList.ownerFilter === 'internal' ? 'filter-tab--active' : ''}`}
              onClick={() => inventoryList.setOwnerFilter('internal')}
              title={`Show ${tenant.name} owned inventory`}
            >
              {tenant.name}
            </button>
            <button
              className={`filter-tab ${inventoryList.ownerFilter === 'customer' ? 'filter-tab--active' : ''}`}
              onClick={() => inventoryList.setOwnerFilter('customer')}
              title="Show customer owned inventory"
            >
              Customer
            </button>
            <button
              className={`filter-tab ${inventoryList.ownerFilter === 'unknown' ? 'filter-tab--active' : ''}`}
              onClick={() => inventoryList.setOwnerFilter('unknown')}
              title="Show inventory with unknown owner"
            >
              Unknown
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="genetic-inventory__type-filter">
            {/* Inventory Type Filter */}
            <select
              value={inventoryList.inventoryTypeFilter}
              onChange={(e) => inventoryList.setInventoryTypeFilter(e.target.value)}
              className="genetic-inventory__type-select"
              title="Filter by inventory type"
            >
              <option value="all">All Types</option>
              <option value="semen">Semen</option>
              <option value="embryo">Embryos</option>
            </select>
            {/* Sex Type Filter */}
            <select
              value={inventoryList.sexTypeFilter}
              onChange={(e) => inventoryList.setSexTypeFilter(e.target.value)}
              className="genetic-inventory__type-select"
              title="Filter by sex type"
            >
              <option value="all">All Sex Types</option>
              <option value="conventional">Conventional</option>
              <option value="sexed_female">Sexed Female</option>
              <option value="sexed_male">Sexed Male</option>
            </select>
            {/* IVF Filter - only show when filtering embryos */}
            {inventoryList.inventoryTypeFilter === 'embryo' && (
              <label className="genetic-inventory__ivf-toggle" title="Show only IVF embryos">
                <input
                  type="checkbox"
                  checked={inventoryList.ivfFilter === 'ivf'}
                  onChange={(e) => inventoryList.setIvfFilter(e.target.checked ? 'ivf' : 'all')}
                />
                <span>IVF Only</span>
              </label>
            )}
            {/* Checked Out Filter Toggle */}
            <button
              className={`genetic-inventory__checked-out-btn ${inventoryList.statusFilter === 'checked_out' ? 'genetic-inventory__checked-out-btn--active' : ''}`}
              onClick={() => inventoryList.setStatusFilter(
                inventoryList.statusFilter === 'checked_out' ? 'all' : 'checked_out'
              )}
              title={inventoryList.statusFilter === 'checked_out' ? 'Show all items' : 'Show checked out only'}
            >
              <FiLogOut size={18} />
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Inventory Form Modal */}
          <InventoryForm
            isOpen={inventoryForm.isFormOpen}
            editingInventory={inventoryForm.editingInventory}
            selectedSire={inventoryForm.selectedSire}
            selectedCustomer={inventoryForm.selectedCustomer}
            formData={inventoryForm.formData}
            loading={inventoryForm.loading}
            error={inventoryForm.error}
            validation={inventoryForm.validation}
            tanks={dependencies.tanks}
            canisters={dependencies.canisters}
            onInputChange={inventoryForm.handleInputChange}
            onSubmit={inventoryForm.handleSubmit}
            onClose={inventoryForm.handleCloseForm}
            onCreateSire={quickCreate.openSireForm}
            onCreateCustomer={quickCreate.openCustomerForm}
            onCreateTank={quickCreate.openTankForm}
            onCreateCanister={quickCreate.openCanisterForm}
          />

          {/* Inventory List */}
          <div className="genetic-inventory__list">
            {inventoryList.loading ? (
              <div className="empty-state">
                <LoadingSpinner size="lg" />
                <p className="empty-state__text">Loading inventory...</p>
              </div>
            ) : inventoryList.inventory.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__text">No inventory found matching your search.</p>
              </div>
            ) : (
              <>
                <div className="genetic-inventory__cards">
                  {inventoryList.inventory.map((item) => (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      onEdit={() => inventoryForm.handleEdit(item)}
                      onDelete={() => inventoryForm.openDeleteConfirm(item.id, item.sire?.name || item.embryo_name || 'Inventory')}
                      onCheckin={() => checkinForm.openCheckinModal(item)}
                      inputValue={quantityManager.getQtyAmount(item.id)}
                      updateAmount={quantityManager.getQtyAmountForUpdate(item.id)}
                      isUpdating={quantityManager.updatingItemId === item.id}
                      onInputChange={(value) => quantityManager.setQtyAmount(item.id, value)}
                      onUpdateQuantity={quantityManager.handleUpdateQuantity}
                      onWouldDelete={handleWouldDelete}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={inventoryList.currentPage}
                  totalPages={inventoryList.totalPages}
                  startIndex={inventoryList.startIndex}
                  endIndex={inventoryList.endIndex}
                  totalItems={inventoryList.totalCount}
                  onPageChange={inventoryList.goToPage}
                />
              </>
            )}
          </div>

        </div>
      </main>

      {/* Check-in Modal for checked out items */}
      <CheckinModal
        isOpen={checkinForm.isOpen}
        item={checkinForm.selectedItem}
        formData={checkinForm.formData}
        tanks={dependencies.tanks}
        canisters={dependencies.canisters}
        validation={checkinForm.validation}
        loading={checkinForm.loading}
        error={checkinForm.error}
        onInputChange={handleCheckinInputChange}
        onSubmit={checkinForm.handleSubmit}
        onClose={checkinForm.handleCloseForm}
      />

      {/* Quick Create Modals */}
      <SireForm
        isOpen={quickCreate.sire.isOpen}
        editingSire={null}
        selectedCustomer={quickCreate.sire.selectedCustomer}
        formData={quickCreate.sire.formData}
        loading={quickCreate.sire.loading}
        error={quickCreate.sire.error}
        imagePreview={quickCreate.sire.imagePreview}
        validation={quickCreate.sire.validation}
        onInputChange={quickCreate.sire.onInputChange}
        onImageChange={quickCreate.sire.onImageChange}
        onRemoveImage={quickCreate.sire.onRemoveImage}
        onSubmit={quickCreate.sire.onSubmit}
        onClose={quickCreate.sire.onClose}
        onCreateCustomer={() => {}}
      />

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

      <TankForm
        isOpen={quickCreate.tank.isOpen}
        editingTank={null}
        formData={quickCreate.tank.formData}
        loading={quickCreate.tank.loading}
        validation={quickCreate.tank.validation}
        onInputChange={quickCreate.tank.onInputChange}
        onSubmit={quickCreate.tank.onSubmit}
        onClose={quickCreate.tank.onClose}
      />

      <CanisterForm
        isOpen={quickCreate.canister.isOpen}
        editingCanister={null}
        selectedTank={quickCreate.canister.selectedTank}
        formData={quickCreate.canister.formData}
        loading={quickCreate.canister.loading}
        validation={quickCreate.canister.validation}
        onInputChange={quickCreate.canister.onInputChange}
        onSubmit={quickCreate.canister.onSubmit}
        onClose={quickCreate.canister.onClose}
      />
    </div>
  );
}
