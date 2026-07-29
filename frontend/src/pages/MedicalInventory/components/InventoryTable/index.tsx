import { useState, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiMinus, FiPlus, FiAlertTriangle, FiClock } from 'react-icons/fi';
import ItemDetail from '../ItemDetail';
import Pagination from '../../../../components/common/Pagination';
import { usePagination } from '../../../../hooks/usePagination';
import './styles.css';

interface MedicalItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  category_id?: string | null;
  reorder_threshold?: number | null;
  expiration_date?: string | null;
  supplier_name?: string | null;
  [key: string]: unknown;
}

interface CategoryOption {
  id: string;
  name?: string;
  label?: string;
  path?: string;
  [key: string]: unknown;
}

interface EditValues {
  item_name: string;
  quantity: string | number;
  unit: string;
  category_id: string | null;
  reorder_threshold: string | number;
  expiration_date: string;
  supplier_name: string;
  [key: string]: unknown;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getExpirationStatus(expirationDate: string | null | undefined): string | null {
  if (!expirationDate) return null;
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 30) return 'expiring';
  return 'ok';
}

function getStockStatus(quantity: number, threshold: number | null | undefined): string {
  if (quantity <= 0) return 'out';
  if (threshold && quantity <= threshold) return 'low';
  return 'ok';
}

interface InventoryTableProps {
  items: MedicalItem[];
  categoryOptions: CategoryOption[];
  loading: boolean;
  onUpdate: (id: string, values: Record<string, unknown>) => Promise<unknown>;
  onDelete: (item: MedicalItem) => void;
  onLogUsage: (item: MedicalItem) => void;
  onRestock: (item: MedicalItem) => void;
  onEdit: (item: MedicalItem) => void;
  itemsPerPage?: number;
}

export default function InventoryTable({
  items,
  categoryOptions,
  loading,
  onUpdate,
  onDelete,
  onLogUsage,
  onRestock,
  onEdit,
  itemsPerPage = 15
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({} as EditValues);
  const [selectedItem, setSelectedItem] = useState<MedicalItem | null>(null);

  // Pagination
  const pagination = usePagination(items, itemsPerPage);

  // Inline editing
  const startEditing = useCallback((item: MedicalItem) => {
    setEditingId(item.id);
    setEditValues({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      category_id: item.category_id || null,
      reorder_threshold: item.reorder_threshold || '',
      expiration_date: item.expiration_date || '',
      supplier_name: item.supplier_name || ''
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValues({} as EditValues);
  }, []);

  const saveEditing = useCallback(async () => {
    if (editingId && onUpdate) {
      await onUpdate(editingId, {
        item_name: editValues.item_name,
        quantity: parseFloat(String(editValues.quantity)) || 0,
        unit: editValues.unit,
        category_id: editValues.category_id || null,
        reorder_threshold: parseFloat(String(editValues.reorder_threshold)) || 0,
        expiration_date: editValues.expiration_date || null,
        supplier_name: editValues.supplier_name || null
      });
      setEditingId(null);
      setEditValues({} as EditValues);
    }
  }, [editingId, editValues, onUpdate]);

  const handleEditChange = useCallback((field: string, value: string | null) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const getCategoryName = useCallback((categoryId: string | null | undefined): string => {
    const cat = categoryOptions?.find(c => c.id === categoryId);
    return cat?.name || '—';
  }, [categoryOptions]);

  if (items.length === 0) {
    return (
      <div className="inventory-table__empty">
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="inventory-table-container">
      {/* Desktop: Table View */}
      <div className="inventory-table-wrapper inventory-table--desktop">
        <table className="inventory-table">
          <thead>
            <tr>
              <th className="inventory-table__th">Item Name</th>
              <th className="inventory-table__th inventory-table__th--center">Qty</th>
              <th className="inventory-table__th">Unit</th>
              <th className="inventory-table__th">Category</th>
              <th className="inventory-table__th inventory-table__th--center">Reorder At</th>
              <th className="inventory-table__th">Expires</th>
              <th className="inventory-table__th">Supplier</th>
              <th className="inventory-table__th inventory-table__th--center">Status</th>
              <th className="inventory-table__th inventory-table__th--actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.map((item: MedicalItem) => {
              const isEditing = editingId === item.id;
              const stockStatus = getStockStatus(item.quantity, item.reorder_threshold);
              const expStatus = getExpirationStatus(item.expiration_date);

              return (
                <tr key={item.id} className={`inventory-table__row ${stockStatus !== 'ok' || expStatus === 'expired' || expStatus === 'expiring' ? 'inventory-table__row--alert' : ''}`}>
                  <td className="inventory-table__td inventory-table__td--name">
                    {isEditing ? (
                      <input
                        type="text"
                        className="inventory-table__input"
                        value={editValues.item_name}
                        onChange={(e) => handleEditChange('item_name', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="inventory-table__name">{item.item_name}</span>
                    )}
                  </td>

                  <td className="inventory-table__td inventory-table__td--center">
                    {isEditing ? (
                      <input
                        type="number"
                        className="inventory-table__input inventory-table__input--sm"
                        value={editValues.quantity}
                        onChange={(e) => handleEditChange('quantity', e.target.value)}
                        min="0"
                      />
                    ) : (
                      <span className={`inventory-table__qty ${stockStatus === 'out' ? 'inventory-table__qty--out' : stockStatus === 'low' ? 'inventory-table__qty--low' : ''}`}>
                        {item.quantity}
                      </span>
                    )}
                  </td>

                  <td className="inventory-table__td">
                    {isEditing ? (
                      <input
                        type="text"
                        className="inventory-table__input inventory-table__input--sm"
                        value={editValues.unit}
                        onChange={(e) => handleEditChange('unit', e.target.value)}
                      />
                    ) : (
                      item.unit
                    )}
                  </td>

                  <td className="inventory-table__td">
                    {isEditing ? (
                      <select
                        className="inventory-table__select"
                        value={editValues.category_id || ''}
                        onChange={(e) => handleEditChange('category_id', e.target.value || null)}
                      >
                        <option value="">None</option>
                        {categoryOptions?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label || cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inventory-table__category">{getCategoryName(item.category_id)}</span>
                    )}
                  </td>

                  <td className="inventory-table__td inventory-table__td--center">
                    {isEditing ? (
                      <input
                        type="number"
                        className="inventory-table__input inventory-table__input--sm"
                        value={editValues.reorder_threshold}
                        onChange={(e) => handleEditChange('reorder_threshold', e.target.value)}
                        min="0"
                        placeholder="—"
                      />
                    ) : (
                      item.reorder_threshold || '—'
                    )}
                  </td>

                  <td className="inventory-table__td">
                    {isEditing ? (
                      <input
                        type="date"
                        className="inventory-table__input"
                        value={editValues.expiration_date as string}
                        onChange={(e) => handleEditChange('expiration_date', e.target.value)}
                      />
                    ) : (
                      <span className={`inventory-table__date ${expStatus === 'expired' || expStatus === 'expiring' ? 'inventory-table__date--alert' : ''}`}>
                        {formatDate(item.expiration_date)}
                      </span>
                    )}
                  </td>

                  <td className="inventory-table__td">
                    {isEditing ? (
                      <input
                        type="text"
                        className="inventory-table__input"
                        value={editValues.supplier_name}
                        onChange={(e) => handleEditChange('supplier_name', e.target.value)}
                        placeholder="—"
                      />
                    ) : (
                      item.supplier_name || '—'
                    )}
                  </td>

                  <td className="inventory-table__td inventory-table__td--center">
                    <div className="inventory-table__badges">
                      {stockStatus === 'out' && (
                        <span className="inventory-table__badge inventory-table__badge--danger" title="Out of Stock">
                          <FiAlertTriangle size={12} />
                        </span>
                      )}
                      {stockStatus === 'low' && (
                        <span className="inventory-table__badge inventory-table__badge--warning" title="Low Stock">
                          <FiAlertTriangle size={12} />
                        </span>
                      )}
                      {expStatus === 'expired' && (
                        <span className="inventory-table__badge inventory-table__badge--danger" title="Expired">
                          <FiClock size={12} />
                        </span>
                      )}
                      {expStatus === 'expiring' && (
                        <span className="inventory-table__badge inventory-table__badge--warning" title="Expiring Soon">
                          <FiClock size={12} />
                        </span>
                      )}
                      {stockStatus === 'ok' && expStatus !== 'expired' && expStatus !== 'expiring' && (
                        <span className="inventory-table__badge inventory-table__badge--ok" title="OK">
                          <FiCheck size={12} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="inventory-table__td inventory-table__td--actions">
                    {isEditing ? (
                      <div className="inventory-table__action-group">
                        <button className="inventory-table__action inventory-table__action--save" onClick={saveEditing} title="Save" disabled={loading}>
                          <FiCheck size={14} />
                        </button>
                        <button className="inventory-table__action inventory-table__action--cancel" onClick={cancelEditing} title="Cancel" disabled={loading}>
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="inventory-table__action-group">
                        <button className="inventory-table__action" onClick={() => onLogUsage?.(item)} title="Log Usage" disabled={item.quantity <= 0}>
                          <FiMinus size={14} />
                        </button>
                        <button className="inventory-table__action inventory-table__action--restock" onClick={() => onRestock?.(item)} title="Restock">
                          <FiPlus size={14} />
                        </button>
                        <button className="inventory-table__action" onClick={() => startEditing(item)} title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="inventory-table__action inventory-table__action--delete" onClick={() => onDelete?.(item)} title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Table View (click row to open detail) */}
      <div className="inventory-mobile-table inventory-table--mobile">
        <table className="inventory-mobile-table__table">
          <thead>
            <tr>
              <th className="inventory-mobile-table__th">Item</th>
              <th className="inventory-mobile-table__th inventory-mobile-table__th--right">Qty</th>
              <th className="inventory-mobile-table__th inventory-mobile-table__th--center">Status</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.map((item: MedicalItem) => {
              const stockStatus = getStockStatus(item.quantity, item.reorder_threshold);
              const expStatus = getExpirationStatus(item.expiration_date);
              const hasAlert = stockStatus !== 'ok' || expStatus === 'expired' || expStatus === 'expiring';

              return (
                <tr
                  key={item.id}
                  className={`inventory-mobile-table__row ${hasAlert ? 'inventory-mobile-table__row--alert' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="inventory-mobile-table__td inventory-mobile-table__td--name">
                    {item.item_name}
                  </td>
                  <td className="inventory-mobile-table__td inventory-mobile-table__td--right">
                    <span className={`inventory-mobile-table__qty ${stockStatus === 'out' ? 'inventory-mobile-table__qty--out' : stockStatus === 'low' ? 'inventory-mobile-table__qty--low' : ''}`}>
                      {item.quantity}
                    </span>
                    <span className="inventory-mobile-table__unit">{item.unit}</span>
                  </td>
                  <td className="inventory-mobile-table__td inventory-mobile-table__td--center">
                    {stockStatus === 'out' && <FiAlertTriangle size={14} className="inventory-mobile-table__icon inventory-mobile-table__icon--danger" title="Out of Stock" />}
                    {stockStatus === 'low' && <FiAlertTriangle size={14} className="inventory-mobile-table__icon inventory-mobile-table__icon--warning" title="Low Stock" />}
                    {expStatus === 'expired' && <FiClock size={14} className="inventory-mobile-table__icon inventory-mobile-table__icon--danger" title="Expired" />}
                    {expStatus === 'expiring' && <FiClock size={14} className="inventory-mobile-table__icon inventory-mobile-table__icon--warning" title="Expiring Soon" />}
                    {stockStatus === 'ok' && expStatus !== 'expired' && expStatus !== 'expiring' && <FiCheck size={14} className="inventory-mobile-table__icon inventory-mobile-table__icon--ok" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          categoryName={getCategoryName(selectedItem.category_id)}
          onClose={() => setSelectedItem(null)}
          onLogUsage={onLogUsage}
          onRestock={onRestock}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        totalItems={pagination.totalItems}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}
