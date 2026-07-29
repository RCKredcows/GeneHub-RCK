import { tenant } from '../../../config/tenant';
import { useState, useMemo } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import QuantityEditor from '../../../components/common/QuantityEditor';
import ConfirmModal from '../../../components/common/ConfirmModal';

interface InventoryItem {
  id: string;
  inventory_type: string;
  embryo_name?: string | null;
  sire?: { name?: string; breed?: string } | null;
  customer?: { name?: string } | null;
  owner_type?: string | null;
  sex_type?: string | null;
  cane_number?: string | null;
  status: string;
  is_ivf?: boolean;
  quantity: number;
  [key: string]: unknown;
}

interface CanisterData {
  id: string;
  canister_number: string;
  position?: number | null;
  [key: string]: unknown;
}

interface InventoryListProps {
  isOpen: boolean;
  canister: CanisterData | null;
  inventoryItems: InventoryItem[];
  getQtyAmount: (id: string) => string;
  getQtyAmountForUpdate: (id: string) => number;
  updatingItemId: string | null;
  deletingItemId: string | null;
  setQtyAmount: (id: string, value: string) => void;
  handleUpdateQuantity: (item: { id: string; quantity: number; [key: string]: unknown }, delta: number) => void;
  handleDeleteItem: (id: string) => void;
  onClose: () => void;
}

export default function InventoryList({
  isOpen,
  canister,
  inventoryItems,
  getQtyAmount,
  getQtyAmountForUpdate,
  updatingItemId,
  deletingItemId,
  setQtyAmount,
  handleUpdateQuantity,
  handleDeleteItem,
  onClose
}: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: InventoryItem | null; itemName: string }>({ isOpen: false, item: null, itemName: '' });

  // Helper to get owner display name
  const getOwnerName = (item: InventoryItem): string | null => {
    if (item.owner_type === 'customer' && item.customer?.name) {
      return item.customer.name;
    }
    if (item.owner_type === 'internal') return tenant.name;
    if (item.owner_type === 'unknown') return 'Unknown';
    return null;
  };

  // Get type badge class based on inventory type and sex type
  const getTypeBadgeClass = (item: InventoryItem): string => {
    const isEmbryo = item.inventory_type === 'embryo';
    const prefix = isEmbryo ? 'tanks__type-badge--embryo' : 'tanks__type-badge--semen';

    switch (item.sex_type) {
      case 'sexed_male':
        return `${prefix}-male`;
      case 'sexed_female':
        return `${prefix}-female`;
      default:
        return prefix;
    }
  };

  const filteredInventoryItems = useMemo(() => {
    if (!searchQuery) return inventoryItems;

    const query = searchQuery.toLowerCase();
    return inventoryItems.filter(item => {
      const itemName = item.inventory_type === 'embryo'
        ? (item.embryo_name || '').toLowerCase()
        : (item.sire?.name || '').toLowerCase();
      const breed = (item.sire?.breed || '').toLowerCase();
      const ownerName = (getOwnerName(item) || '').toLowerCase();
      const caneNumber = (item.cane_number || '').toLowerCase();

      return itemName.includes(query) ||
             breed.includes(query) ||
             ownerName.includes(query) ||
             caneNumber.includes(query);
    });
  }, [inventoryItems, searchQuery]);

  // State for pending zero-quantity update
  const [zeroConfirm, setZeroConfirm] = useState<{ isOpen: boolean; item: InventoryItem | null; delta: number; itemName: string }>({ isOpen: false, item: null, delta: 0, itemName: '' });

  const openDeleteConfirm = (item: InventoryItem) => {
    const itemName = item.inventory_type === 'embryo'
      ? (item.embryo_name || 'Unknown Embryo')
      : (item.sire?.name || 'Unknown Sire');
    setDeleteConfirm({ isOpen: true, item, itemName });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, item: null, itemName: '' });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.item) {
      await handleDeleteItem(deleteConfirm.item.id);
      closeDeleteConfirm();
    }
  };

  // Handle when quantity would go to zero
  const handleWouldDelete = (item: Record<string, unknown>, delta: number) => {
    const typedItem = item as InventoryItem;
    const itemName = typedItem.inventory_type === 'embryo'
      ? (typedItem.embryo_name || 'Unknown Embryo')
      : (typedItem.sire?.name || 'Unknown Sire');
    setZeroConfirm({ isOpen: true, item: typedItem, delta, itemName });
  };

  const closeZeroConfirm = () => {
    setZeroConfirm({ isOpen: false, item: null, delta: 0, itemName: '' });
  };

  const confirmZeroQuantity = async () => {
    if (zeroConfirm.item) {
      await handleUpdateQuantity(zeroConfirm.item, zeroConfirm.delta);
      closeZeroConfirm();
    }
  };

  if (!isOpen || !canister) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container tanks__inventory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">Canister Inventory</h2>
          <button
            className="form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="form-body">
          {/* Canister Info Banner */}
          <div className="tanks__modal-canister-info">
            <div className="tanks__modal-canister-visual">
              <div className="tanks__modal-canister-lid" />
              <div className="tanks__modal-canister-cylinder" />
            </div>
            <div className="tanks__modal-canister-details">
              <h3 className="tanks__modal-canister-number">Canister #{canister.canister_number}</h3>
              {canister.position && (
                <p className="tanks__modal-canister-position">Position: {canister.position}</p>
              )}
            </div>
            <span className="tanks__modal-canister-count">
              {searchQuery ? `${filteredInventoryItems.length} of ${inventoryItems.length}` : inventoryItems.length} items
            </span>
          </div>

          {/* Search Bar */}
          <div className="tanks__inventory-search">
            <input
              type="text"
              placeholder="Search by name, breed, owner, or cane..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tanks__inventory-search-input"
            />
          </div>

          {filteredInventoryItems.length > 0 ? (
            <div className="tanks__inventory-list">
              {filteredInventoryItems.map((item) => {
                const isEmbryo = item.inventory_type === 'embryo';
                const itemName = isEmbryo
                  ? (item.embryo_name || 'Unknown Embryo')
                  : (item.sire?.name || 'Unknown Sire');

                // Dynamic font size class based on name length
                const nameLength = itemName.length;
                const nameSizeClass = nameLength > 30 ? 'tanks__inventory-name--long'
                  : nameLength > 20 ? 'tanks__inventory-name--medium'
                  : '';

                // Dynamic font size class for cane number
                const caneNumber = item.cane_number || '—';
                const caneLength = caneNumber.length;
                const caneSizeClass = caneLength > 10 ? 'tanks__cane-number--long'
                  : caneLength > 6 ? 'tanks__cane-number--medium'
                  : '';

                return (
                  <div key={item.id} className={`tanks__inventory-item ${isEmbryo ? 'tanks__inventory-item--embryo' : ''}`}>
                    {/* Cane Visual */}
                    <div className={`tanks__cane-visual ${isEmbryo ? 'tanks__cane-visual--embryo' : ''}`}>
                      <div className="tanks__cane-icon">
                        <div className="tanks__cane-straw" />
                        <div className="tanks__cane-straw" />
                        <div className="tanks__cane-straw" />
                      </div>
                      <span className="tanks__cane-label">Cane</span>
                      <span className={`tanks__cane-number ${caneSizeClass}`}>{caneNumber}</span>
                    </div>

                    {/* Details */}
                    <div className="tanks__inventory-details">
                      <div className="tanks__inventory-title-row">
                        <h4 className={`tanks__inventory-name ${nameSizeClass}`}>{itemName}</h4>
                        <span className={`tanks__type-badge ${getTypeBadgeClass(item)}`}>
                          {isEmbryo ? 'Embryo' : 'Semen'}
                        </span>
                      </div>
                      <div className="tanks__inventory-meta">
                        {!isEmbryo && item.sire?.breed && (
                          <span className="tanks__inventory-meta-item">
                            <span className="tanks__inventory-meta-label">Breed:</span> {item.sire.breed}
                          </span>
                        )}
                        {getOwnerName(item) && (
                          <span className="tanks__inventory-meta-item">
                            <span className="tanks__inventory-meta-label">Owner:</span> {getOwnerName(item)}
                          </span>
                        )}
                        <span className={`tanks__status-badge tanks__status-badge--${item.status}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        {item.is_ivf && (
                          <span className="tanks__sex-badge tanks__sex-badge--ivf">
                            IVF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="tanks__inventory-actions">
                      <QuantityEditor
                        item={item}
                        inputValue={getQtyAmount(item.id)}
                        updateAmount={getQtyAmountForUpdate(item.id)}
                        isUpdating={updatingItemId === item.id}
                        onInputChange={(value: string) => setQtyAmount(item.id, value)}
                        onUpdate={handleUpdateQuantity}
                        onWouldDelete={handleWouldDelete}
                      />
                      <button
                        className="tanks__inventory-delete"
                        onClick={() => openDeleteConfirm(item)}
                        disabled={deletingItemId === item.id}
                        aria-label="Delete cane"
                        title="Delete cane"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tanks__empty">
              <p>No inventory in this canister</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Cane"
        message={`Are you sure you want to delete "${deleteConfirm.itemName}"? This will remove it from inventory permanently.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={zeroConfirm.isOpen}
        onClose={closeZeroConfirm}
        onConfirm={confirmZeroQuantity}
        title="Delete Cane"
        message={`Setting quantity to 0 will delete "${zeroConfirm.itemName}" from inventory. Do you want to continue?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
