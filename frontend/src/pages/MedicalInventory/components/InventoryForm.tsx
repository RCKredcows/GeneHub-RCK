import React from 'react';
import { FiX } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface InventoryFormData {
  item_name: string;
  category_id: string | null;
  quantity: string;
  unit: string;
  reorder_threshold: string;
  expiration_date: string;
  cost_per_unit: string;
  supplier_name: string;
  supplier_contact: string;
  notes: string;
  [key: string]: unknown;
}

interface CategoryOption {
  id: string;
  path: string;
  [key: string]: unknown;
}

interface InventoryFormProps {
  isOpen: boolean;
  editingItem: Record<string, unknown> | null;
  formData: InventoryFormData;
  categoryOptions: CategoryOption[];
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function InventoryForm({
  isOpen,
  editingItem,
  formData,
  categoryOptions,
  validation,
  onInputChange,
  onSubmit,
  onClose
}: InventoryFormProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingItem ? 'Edit Item' : 'New Item'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form">
          {/* Basic Info */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="item_name" className="form-label">Item Name *</label>
                <input
                  type="text"
                  id="item_name"
                  name="item_name"
                  value={formData.item_name}
                  onChange={onInputChange}
                  className={getFieldClassName('form-input', validation?.hasFieldError('item_name'))}
                  placeholder="e.g., Penicillin 500mg"
                />
                <FieldError error={validation?.getFieldError('item_name')} />
              </div>

              <div className="form-group">
                <label htmlFor="category_id" className="form-label">Folder</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={onInputChange}
                  className="form-select"
                >
                  <option value="">No Folder</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.path}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          <div className="form-section">
            <h3 className="form-section-title">Stock Information</h3>

            <div className="form-row form-row--three">
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={onInputChange}
                  className={getFieldClassName('form-input', validation?.hasFieldError('quantity'))}
                  min="0"
                  step="0.01"
                />
                <FieldError error={validation?.getFieldError('quantity')} />
              </div>

              <div className="form-group">
                <label htmlFor="unit" className="form-label">Unit</label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={onInputChange}
                  className="form-input"
                  placeholder="e.g., units, ml, tablets"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reorder_threshold" className="form-label">Reorder At</label>
                <input
                  type="number"
                  id="reorder_threshold"
                  name="reorder_threshold"
                  value={formData.reorder_threshold}
                  onChange={onInputChange}
                  className="form-input"
                  min="0"
                  step="0.01"
                  placeholder="Low stock alert"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiration_date" className="form-label">Expiration Date</label>
                <input
                  type="date"
                  id="expiration_date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={onInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cost_per_unit" className="form-label">Cost per Unit ($)</label>
                <input
                  type="number"
                  id="cost_per_unit"
                  name="cost_per_unit"
                  value={formData.cost_per_unit}
                  onChange={onInputChange}
                  className="form-input"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="form-section">
            <h3 className="form-section-title">Supplier Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier_name" className="form-label">Supplier Name</label>
                <input
                  type="text"
                  id="supplier_name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={onInputChange}
                  className="form-input"
                  placeholder="e.g., Valley Vet Supply"
                />
              </div>

              <div className="form-group">
                <label htmlFor="supplier_contact" className="form-label">Supplier Contact</label>
                <input
                  type="text"
                  id="supplier_contact"
                  name="supplier_contact"
                  value={formData.supplier_contact}
                  onChange={onInputChange}
                  className="form-input"
                  placeholder="Phone or email"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={onInputChange}
                className="form-input form-textarea"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
