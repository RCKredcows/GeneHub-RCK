import React from 'react';
import { FiX } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface CategoryFormData {
  name: string;
  parent_id: string | null;
  description: string;
  [key: string]: unknown;
}

interface CategoryOption {
  id: string;
  path: string;
  [key: string]: unknown;
}

interface CategoryFormProps {
  isOpen: boolean;
  editingCategory: { id: string; [key: string]: unknown } | null;
  formData: CategoryFormData;
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

export default function CategoryForm({
  isOpen,
  editingCategory,
  formData,
  categoryOptions,
  validation,
  onInputChange,
  onSubmit,
  onClose
}: CategoryFormProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingCategory ? 'Edit Folder' : 'New Folder'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Folder Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              className={getFieldClassName('form-input', validation?.hasFieldError('name'))}
              placeholder="e.g., Vaccines, Antibiotics"
            />
            <FieldError error={validation?.getFieldError('name')} />
          </div>

          <div className="form-group">
            <label htmlFor="parent_id" className="form-label">Parent Folder</label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id || ''}
              onChange={onInputChange}
              className="form-select"
            >
              <option value="">None (Top Level)</option>
              {categoryOptions
                .filter(cat => cat.id !== editingCategory?.id)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.path}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className="form-input form-textarea"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingCategory ? 'Save Changes' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
