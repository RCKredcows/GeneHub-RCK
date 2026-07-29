import { useState, useCallback } from 'react';
import type { TankWithCount, AuthUser } from '../../types';
import { FiMenu, FiPlus, FiFilter, FiPrinter } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CanisterManager from '../../components/CanisterManager';
import Pagination from '../../components/common/Pagination';
import {
  useTankList,
  useTankForm,
  useFillForm,
  useCanisterForm,
  useTankDetails
} from '../../hooks/useTanks';
import { useInventoryQuantity } from '../../hooks/useInventoryQuantity';
import { usePagination } from '../../hooks/usePagination';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useTanksReport } from '../../hooks/reports';

// Page-specific components
import TankCard from './components/TankCard';
import TankForm from './components/TankForm';
import FillForm from './components/FillForm';
import CanisterForm from './components/CanisterForm';
import TankDetails from './components/TankDetails';
import InventoryList from './components/InventoryList';

import './styles.css';

interface TanksProps {
  user: AuthUser | null;
}

export default function Tanks({ user }: TanksProps) {
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canisterModalOpen, setCanisterModalOpen] = useState(false);
  const [selectedTankForCanisters, setSelectedTankForCanisters] = useState<TankWithCount | null>(null);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedCanister, setSelectedCanister] = useState<Record<string, unknown> | null>(null);
  const [expandedSections, setExpandedSections] = useState({ stats: false, history: false });

  // Data hooks
  const { settings } = useUserSettings(user?.id);
  const tankList = useTankList();
  const pagination = usePagination(tankList.filteredTanks, settings.items_per_page ?? 25);
  const tankForm = useTankForm(tankList.refresh, tankList.tanks, user?.id);
  const tankDetails = useTankDetails();
  const { generateReport } = useTanksReport(tankList.tanks);

  // Fill form with refresh callback
  const fillForm = useFillForm(async () => {
    await tankList.refresh();
    if (tankDetails.selectedTank) {
      await tankDetails.loadTankDetails(tankDetails.selectedTank);
    }
  }, user?.id);

  // Canister form - React Query handles cache invalidation automatically
  const canisterForm = useCanisterForm(
    () => {}, // onSuccess no longer needed - React Query refetches automatically
    user?.id
  );

  // Inventory quantity editor
  const {
    updatingItemId,
    deletingItemId,
    getQtyAmount,
    getQtyAmountForUpdate,
    setQtyAmount,
    handleUpdateQuantity,
    handleDeleteItem,
  } = useInventoryQuantity(() => tankList.refreshInventory(), user?.id);

  // Wrapper for canister reorder
  const handleReorderCanisters = useCallback((tankId: string, reorderedCanisters: Array<{ id: string; position_in_tank: number | null; [key: string]: unknown }>) => {
    canisterForm.handleReorderCanisters(tankId, reorderedCanisters);
  }, [canisterForm]);

  // Local handlers
  const openCanisterModal = (tank: TankWithCount) => {
    setSelectedTankForCanisters(tank);
    tankList.fetchCanistersForTank(tank.id);
    setCanisterModalOpen(true);
  };

  const closeCanisterModal = () => {
    setCanisterModalOpen(false);
    setSelectedTankForCanisters(null);
  };

  const openInventoryModal = async (canister: Record<string, unknown>) => {
    setSelectedCanister(canister);
    setInventoryModalOpen(true);
    // Fetch inventory for this canister on-demand
    await tankList.fetchInventoryForCanister(canister.id as string);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setSelectedCanister(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  // Combine errors
  const error = tankList.error || tankForm.error || fillForm.error || canisterForm.error;

  return (
    <div className="tanks">
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

      <main className="tanks__main">
        <div className="tanks__content">
          <header className="page-header">
            <div>
              <h1 className="page-title">Semen Tanks</h1>
              <p className="page-subtitle">Manage semen tanks and monitor nitrogen levels</p>
            </div>
            <div className="page-header__actions">
              <button
                className="btn-secondary btn-icon"
                onClick={generateReport}
                title="Print Report"
              >
                <FiPrinter size={20} />
              </button>
              <button
                className="btn-primary"
                onClick={() => tankForm.setIsFormOpen(true)}
              >
                <FiPlus size={20} />
                Add Tank
              </button>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="tanks__toolbar">
            <div className="tanks__search">
              <input
                type="text"
                placeholder="Search tanks..."
                value={tankList.searchQuery}
                onChange={(e) => tankList.setSearchQuery(e.target.value)}
                className="tanks__search-input"
              />
            </div>

            <div className="tanks__filters">
              <select
                value={tankList.sortBy}
                onChange={(e) => tankList.setSortBy(e.target.value)}
                className="tanks__select"
              >
                <option value="position">Custom Order</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="nitrogen_low">Nitrogen (Low First)</option>
                <option value="nitrogen_high">Nitrogen (High First)</option>
                <option value="last_filled">Recently Filled</option>
              </select>

              <button
                className={`tanks__filter-btn ${tankList.filterBy === 'low_nitrogen' ? 'tanks__filter-btn--active' : ''}`}
                onClick={() => tankList.setFilterBy(tankList.filterBy === 'low_nitrogen' ? 'all' : 'low_nitrogen')}
                title="Show only low nitrogen tanks"
              >
                <FiFilter size={16} />
                Low N₂
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {tankList.filteredTanks.length === 0 ? (
            <div className="tanks__empty">
              <p>No tanks found</p>
            </div>
          ) : (
            <>
              <div className="tanks__grid">
                {pagination.paginatedItems.map((tank) => (
                  <TankCard
                    key={tank.id}
                    tank={tank}
                    canisters={tankList.canisters[tank.id] ?? undefined}
                    getNitrogenPercentage={tankDetails.getNitrogenPercentage}
                    isLowNitrogen={tankDetails.isLowNitrogen}
                    onViewDetails={() => tankDetails.handleViewDetails(tank)}
                    onFill={() => fillForm.handleOpenFillForm(tank)}
                    onEdit={() => tankForm.handleEdit(tank)}
                    onDelete={() => tankForm.handleDelete(tank)}
                    onManageCanisters={() => openCanisterModal(tank)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                totalItems={pagination.totalItems}
                onPageChange={pagination.goToPage}
              />
            </>
          )}
        </div>
      </main>

      {/* Tank Form Modal */}
      <TankForm
        isOpen={tankForm.isFormOpen}
        editingTank={tankForm.editingTank}
        formData={tankForm.formData}
        loading={tankForm.loading}
        validation={tankForm.validation}
        onInputChange={tankForm.handleInputChange}
        onSubmit={tankForm.handleSubmit}
        onClose={tankForm.handleCloseForm}
      />

      {/* Nitrogen Fill Form Modal */}
      <FillForm
        isOpen={fillForm.isFillFormOpen}
        formData={fillForm.fillFormData}
        loading={fillForm.loading}
        validation={fillForm.validation}
        onInputChange={fillForm.handleFillInputChange}
        onSubmit={fillForm.handleFillSubmit}
        onClose={fillForm.handleCloseFillForm}
      />

      {/* Canister Manager Modal */}
      <CanisterManager
        tank={selectedTankForCanisters}
        canisters={tankList.canisters}
        isOpen={canisterModalOpen}
        onClose={closeCanisterModal}
        onOpenCanisterForm={canisterForm.handleOpenCanisterForm}
        onDeleteCanister={canisterForm.handleDeleteCanister}
        onReorderCanisters={handleReorderCanisters}
        onViewInventory={openInventoryModal}
      />

      {/* Canister Form Modal */}
      <CanisterForm
        isOpen={canisterForm.isCanisterFormOpen}
        selectedTank={canisterForm.selectedTankForCanister}
        editingCanister={canisterForm.editingCanister}
        formData={canisterForm.canisterFormData}
        loading={canisterForm.loading}
        validation={canisterForm.validation}
        onInputChange={canisterForm.handleCanisterInputChange}
        onSubmit={canisterForm.handleCanisterSubmit}
        onClose={canisterForm.handleCloseCanisterForm}
      />

      {/* Inventory Items Modal */}
      <InventoryList
        isOpen={inventoryModalOpen}
        canister={selectedCanister as { id: string; canister_number: string; position?: number | null } | null}
        inventoryItems={selectedCanister ? tankList.getInventoryForCanister(selectedCanister.id as string) as Array<{ id: string; inventory_type: string; quantity: number; status: string; [key: string]: unknown }> : []}
        getQtyAmount={getQtyAmount}
        getQtyAmountForUpdate={getQtyAmountForUpdate}
        updatingItemId={updatingItemId}
        deletingItemId={deletingItemId}
        setQtyAmount={setQtyAmount}
        handleUpdateQuantity={handleUpdateQuantity}
        handleDeleteItem={handleDeleteItem}
        onClose={closeInventoryModal}
      />

      {/* Tank Details Modal */}
      <TankDetails
        isOpen={tankDetails.isDetailOpen}
        tank={tankDetails.selectedTank}
        fillHistory={tankDetails.fillHistory}
        consumptionStats={tankDetails.consumptionStats}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        onClose={tankDetails.handleCloseDetails}
        onLogFirstFill={() => {
          tankDetails.handleCloseDetails();
          fillForm.handleOpenFillForm(tankDetails.selectedTank!);
        }}
        onClearHistory={tankDetails.handleClearHistory}
        onDeleteEvent={tankDetails.handleDeleteEvent}
        clearingHistory={tankDetails.clearingHistory}
      />

      <ConfirmModal
        isOpen={tankDetails.confirmClearHistory}
        onClose={() => tankDetails.setConfirmClearHistory(false)}
        onConfirm={tankDetails.confirmClearHistoryAction}
        title="Clear History"
        message="Are you sure you want to clear all fill history for this tank? This cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={tankForm.confirmDelete.isOpen}
        onClose={() => tankForm.setConfirmDelete({ isOpen: false, itemId: null, itemName: '' })}
        onConfirm={tankForm.confirmDeleteAction}
        title="Delete Tank"
        message={`Are you sure you want to delete ${tankForm.confirmDelete.itemName}? This will also delete all nitrogen fill history for this tank.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={canisterForm.confirmDeleteCanister.isOpen}
        onClose={() => canisterForm.setConfirmDeleteCanister({ isOpen: false, canisterId: null, canisterNumber: '', tankId: null })}
        onConfirm={canisterForm.confirmDeleteCanisterAction}
        title="Delete Canister"
        message={`Are you sure you want to delete Canister ${canisterForm.confirmDeleteCanister.canisterNumber}? Any inventory in this canister will need to be reassigned.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Loading Overlays */}
      {tankForm.deleting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting tank...</p>
          </div>
        </div>
      )}

      {canisterForm.deleting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting canister...</p>
          </div>
        </div>
      )}
    </div>
  );
}
