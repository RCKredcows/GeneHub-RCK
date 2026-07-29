import { useState, useMemo } from 'react';
import { FiMenu, FiPlus, FiFolder, FiChevronRight, FiChevronDown, FiPrinter } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  useCategoryList,
  useCategoryForm,
  useInventoryList,
  useInventoryForm,
  useUsageLog
} from '../../hooks/useMedicalInventory';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useMedicalInventoryReport } from '../../hooks/reports';

// Page-specific components
import CategoryTree from './components/CategoryTree';
import CategoryForm from './components/CategoryForm';
import InventoryForm from './components/InventoryForm';
import UsageLogModal from './components/UsageLogModal';
import RestockModal from './components/RestockModal';
import InventoryTable from './components/InventoryTable';

import type { AuthUser } from '../../types';
import './styles.css';

interface MedicalInventoryProps {
  user: AuthUser | null;
}

export default function MedicalInventory({ user }: MedicalInventoryProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState(true);

  // Data hooks
  const { settings } = useUserSettings(user?.id);
  const categoryList = useCategoryList();
  const inventoryList = useInventoryList();

  const categoryForm = useCategoryForm({
    onSuccess: categoryList.refresh,
    userId: user?.id
  });

  const inventoryForm = useInventoryForm({
    onSuccess: inventoryList.refresh,
    userId: user?.id
  });

  const usageLog = useUsageLog({
    onSuccess: inventoryList.refresh
  });

  const { generateReport } = useMedicalInventoryReport(inventoryList.rawInventory, categoryList.categories);

  // Filter inventory by selected category
  const displayedInventory = useMemo(() => {
    return inventoryList.filterByCategory(categoryList.selectedCategoryIds);
  }, [inventoryList, categoryList.selectedCategoryIds]);

  // Get breadcrumb for current selection
  const breadcrumb = useMemo(() => {
    return categoryList.getBreadcrumb(categoryList.selectedCategoryId);
  }, [categoryList]);

  // Combine errors
  const error = categoryList.error || inventoryList.error ||
                categoryForm.error || inventoryForm.error || usageLog.error;

  const handleAddItem = () => {
    if (categoryList.selectedCategoryId) {
      inventoryForm.openFormForCategory(categoryList.selectedCategoryId);
    } else {
      inventoryForm.setIsFormOpen(true);
    }
  };

  return (
    <div className="medical-inventory">
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

      {/* Delete Confirmation Modals */}
      <ConfirmModal
        isOpen={categoryForm.confirmDelete.isOpen}
        onClose={categoryForm.closeDeleteConfirm}
        onConfirm={categoryForm.confirmDeleteCategory}
        title="Delete Folder"
        message={`Are you sure you want to delete "${categoryForm.confirmDelete.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={inventoryForm.confirmDelete.isOpen}
        onClose={inventoryForm.closeDeleteConfirm}
        onConfirm={inventoryForm.confirmDeleteItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${inventoryForm.confirmDelete.itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Loading Overlays */}
      {(categoryForm.deleting || inventoryForm.deleting) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Deleting...</p>
          </div>
        </div>
      )}

      {(categoryForm.loading || inventoryForm.loading || usageLog.loading || inventoryList.updating) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Saving...</p>
          </div>
        </div>
      )}

      {/* Forms */}
      <CategoryForm
        isOpen={categoryForm.isFormOpen}
        editingCategory={categoryForm.editingCategory}
        formData={categoryForm.formData}
        categoryOptions={categoryList.categoryOptions}
        validation={categoryForm.validation}
        onInputChange={categoryForm.handleInputChange}
        onSubmit={categoryForm.handleSubmit}
        onClose={categoryForm.handleCloseForm}
      />

      <InventoryForm
        isOpen={inventoryForm.isFormOpen}
        editingItem={inventoryForm.editingItem}
        formData={inventoryForm.formData}
        categoryOptions={categoryList.categoryOptions}
        validation={inventoryForm.validation}
        onInputChange={inventoryForm.handleInputChange}
        onSubmit={inventoryForm.handleSubmit}
        onClose={inventoryForm.handleCloseForm}
      />

      <UsageLogModal
        isOpen={usageLog.isLogModalOpen}
        item={usageLog.selectedItem}
        formData={usageLog.logFormData}
        usageHistory={usageLog.usageHistory}
        historyLoading={usageLog.historyLoading}
        loading={usageLog.loading}
        error={usageLog.error}
        onInputChange={usageLog.handleLogInputChange}
        onSubmit={usageLog.handleLogUsage}
        onClose={usageLog.closeLogUsage}
      />

      <RestockModal
        isOpen={usageLog.isRestockModalOpen}
        item={usageLog.selectedItem}
        formData={usageLog.restockFormData}
        loading={usageLog.loading}
        error={usageLog.error}
        onInputChange={usageLog.handleRestockInputChange}
        onSubmit={usageLog.handleRestock}
        onClose={usageLog.closeRestock}
      />

      <main className="medical-inventory__main">
        <div className="medical-inventory__content">
          <header className="medical-inventory__header">
            <div>
              <h1 className="medical-inventory__title">Medical Inventory</h1>
              <p className="medical-inventory__subtitle">
                Manage supplies and track usage
              </p>
            </div>
          </header>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="medical-inventory__layout">
            {/* Collapsible Folder Panel (mobile) / Always visible (desktop) */}
            <aside className={`medical-inventory__sidebar ${foldersCollapsed ? 'medical-inventory__sidebar--collapsed' : ''}`}>
              <button
                className="medical-inventory__sidebar-toggle"
                onClick={() => setFoldersCollapsed(!foldersCollapsed)}
              >
                <FiFolder size={16} />
                <span>Folders</span>
                {foldersCollapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
              </button>
              <div className="medical-inventory__sidebar-content">
                <CategoryTree
                  categories={categoryList.categoryTree}
                  expandedIds={categoryList.expandedIds}
                  selectedId={categoryList.selectedCategoryId}
                  onToggleExpand={categoryList.toggleExpanded}
                  onSelect={(id: string) => {
                    categoryList.selectCategory(id);
                    setFoldersCollapsed(true);
                  }}
                  onEdit={categoryForm.handleEdit}
                  onDelete={(cat: { id: string; name: string }) => categoryForm.openDeleteConfirm(cat.id, cat.name)}
                  onClearSelection={() => {
                    categoryList.clearSelection();
                    setFoldersCollapsed(true);
                  }}
                  counts={inventoryList.counts}
                />
              </div>
            </aside>

            {/* Items Panel */}
            <section className="medical-inventory__items">
              {/* Breadcrumb */}
              {breadcrumb.length > 0 && (
                <div className="medical-inventory__breadcrumb">
                  <button
                    className="medical-inventory__breadcrumb-item"
                    onClick={categoryList.clearSelection}
                  >
                    All Items
                  </button>
                  {breadcrumb.map((item: { id: string; name: string }, index: number) => (
                    <span key={item.id} className="medical-inventory__breadcrumb-segment">
                      <FiChevronRight size={14} />
                      <button
                        className={`medical-inventory__breadcrumb-item ${index === breadcrumb.length - 1 ? 'medical-inventory__breadcrumb-item--active' : ''}`}
                        onClick={() => categoryList.selectCategory(item.id)}
                      >
                        {item.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search, Filters, and Actions */}
              <div className="medical-inventory__toolbar">
                <div className="medical-inventory__filters">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={inventoryList.searchQuery}
                    onChange={(e) => inventoryList.setSearchQuery(e.target.value)}
                    className="medical-inventory__search-input"
                  />
                  <select
                    value={inventoryList.filterSort}
                    onChange={(e) => inventoryList.setFilterSort(e.target.value)}
                    className="medical-inventory__filter-select"
                  >
                    <option value="all:name-asc">All Items (A-Z)</option>
                    <option value="all:name-desc">All Items (Z-A)</option>
                    <option value="low:name-asc">Low Stock ({inventoryList.counts.lowStock})</option>
                    <option value="expiring:expiration-asc">Expiring Soon ({inventoryList.counts.expiring})</option>
                    <option value="all:quantity-asc">Quantity (Low-High)</option>
                    <option value="all:quantity-desc">Quantity (High-Low)</option>
                    <option value="all:recent">Recently Added</option>
                  </select>
                </div>
                <div className="medical-inventory__actions">
                  <button
                    className="medical-inventory__action-btn medical-inventory__action-btn--icon"
                    onClick={generateReport}
                    title="Print Report"
                  >
                    <FiPrinter size={16} />
                  </button>
                  <button
                    className="medical-inventory__action-btn medical-inventory__action-btn--secondary"
                    onClick={() => categoryForm.setIsFormOpen(true)}
                  >
                    <FiFolder size={16} />
                    <span>Add Folder</span>
                  </button>
                  <button
                    className="medical-inventory__action-btn"
                    onClick={handleAddItem}
                  >
                    <FiPlus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <InventoryTable
                items={displayedInventory}
                categoryOptions={categoryList.categoryOptions}
                loading={inventoryList.updating}
                onUpdate={inventoryList.inlineUpdate}
                onDelete={(item) => inventoryForm.openDeleteConfirm(item.id, item.item_name)}
                onLogUsage={(item) => usageLog.openLogUsage(item)}
                onRestock={(item) => usageLog.openRestock(item)}
                onEdit={(item) => inventoryForm.handleEdit(item)}
                itemsPerPage={settings.items_per_page ?? undefined}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
