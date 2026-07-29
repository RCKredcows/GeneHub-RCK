import React from 'react';
import { FiX } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface CanisterFormData {
  canister_number: string;
  position_in_tank: string;
  [key: string]: unknown;
}

interface CanisterFormProps {
  isOpen: boolean;
  selectedTank: { id: string; tank_name: string; [key: string]: unknown } | null;
  editingCanister: Record<string, unknown> | null;
  formData: CanisterFormData;
  loading: boolean;
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CanisterForm({
  isOpen,
  selectedTank,
  editingCanister,
  formData,
  loading,
  validation,
  onInputChange,
  onSubmit,
  onClose
}: CanisterFormProps) {
  if (!isOpen || !selectedTank) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container tanks__canister-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">
            {editingCanister ? 'Edit Canister' : 'Add Canister'}
          </h2>
          <button className="form-close" onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-body">
          <div className="form-group">
            <label htmlFor="canister_number" className="form-label">Canister Number/Name *</label>
            <input
              id="canister_number"
              type="text"
              name="canister_number"
              value={formData.canister_number}
              onChange={onInputChange}
              className={getFieldClassName('form-input', validation?.hasFieldError('canister_number'))}
              placeholder="e.g., C1, A1, 1"
            />
            <FieldError error={validation?.getFieldError('canister_number')} />
          </div>

          <div className="form-group">
            <label htmlFor="position_in_tank" className="form-label">Position in Tank</label>
            <input
              id="position_in_tank"
              type="number"
              name="position_in_tank"
              value={formData.position_in_tank}
              onChange={onInputChange}
              min="1"
              className="form-input"
              placeholder={editingCanister ? "Current position" : "Auto-assigned if empty"}
            />
            <p className="form-hint">
              {editingCanister
                ? `Currently at position ${formData.position_in_tank || 'unset'}. You can also drag canisters to reorder.`
                : 'Leave empty to add at the end, or enter a specific position.'
              }
            </p>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="form-btn form-btn--cancel">Cancel</button>
            <button type="submit" disabled={loading} className="form-btn form-btn--submit">
              {loading ? 'Saving...' : editingCanister ? 'Update Canister' : 'Add Canister'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
