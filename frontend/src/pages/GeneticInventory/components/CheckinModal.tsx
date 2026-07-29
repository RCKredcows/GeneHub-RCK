import React from 'react';
import { FiX } from 'react-icons/fi';
import SearchableSelect from '../../../components/common/SearchableSelect';
import FieldError from '../../../components/common/FieldError';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface CheckinItem {
  inventory_type: string;
  embryo_name?: string | null;
  sire?: { name?: string | null } | null;
  [key: string]: unknown;
}

interface CheckinFormData {
  tank_id: string | null;
  canister_id: string | null;
  cane_number: string;
  [key: string]: unknown;
}

interface CheckinModalProps {
  isOpen: boolean;
  item: CheckinItem | null;
  formData: CheckinFormData;
  tanks: { id: string; tank_name: string; [key: string]: unknown }[];
  canisters: { id: string; canister_number: string; [key: string]: unknown }[];
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  loading: boolean;
  error: { message?: string } | string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CheckinModal({
  isOpen,
  item,
  formData,
  tanks,
  canisters,
  validation,
  loading,
  error,
  onInputChange,
  onSubmit,
  onClose
}: CheckinModalProps) {
  if (!isOpen || !item) return null;

  const itemName = item.inventory_type === 'embryo'
    ? (item.embryo_name || 'Unknown Embryo')
    : (item.sire?.name || 'Unknown Sire');

  const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container checkin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">Check In: {itemName}</h2>
          <button onClick={onClose} className="form-close" aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-body">
            <p className="checkin-modal__description">
              Select a new storage location for this inventory item.
            </p>

            {error && (
              <div className="form-error">{errorMessage}</div>
            )}

            <div className="form-group">
              <label htmlFor="tank_id" className="form-label">Tank *</label>
              <SearchableSelect
                id="tank_id"
                name="tank_id"
                value={formData.tank_id || ''}
                onChange={onInputChange}
                options={tanks}
                placeholder="Select a tank..."
                searchPlaceholder="Search tanks..."
                getOptionLabel={(tank) => tank.tank_name}
                getOptionValue={(tank) => tank.id}
                className={validation?.hasFieldError('tank_id') ? 'searchable-select--error' : ''}
              />
              <FieldError error={validation?.getFieldError('tank_id')} />
            </div>

            <div className="form-group">
              <label htmlFor="canister_id" className="form-label">Canister *</label>
              <SearchableSelect
                id="canister_id"
                name="canister_id"
                value={formData.canister_id || ''}
                onChange={onInputChange}
                options={canisters}
                placeholder="Select a canister..."
                searchPlaceholder="Search canisters..."
                disabled={!formData.tank_id}
                getOptionLabel={(canister) => canister.canister_number}
                getOptionValue={(canister) => canister.id}
                className={validation?.hasFieldError('canister_id') ? 'searchable-select--error' : ''}
              />
              <FieldError error={validation?.getFieldError('canister_id')} />
            </div>

            <div className="form-group">
              <label htmlFor="cane_number" className="form-label">Cane Number</label>
              <input
                type="text"
                id="cane_number"
                name="cane_number"
                value={formData.cane_number || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="form-footer">
            <button type="button" onClick={onClose} className="form-btn form-btn--cancel">
              Cancel
            </button>
            <button type="submit" className="form-btn form-btn--submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
