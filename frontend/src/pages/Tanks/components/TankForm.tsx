import React from 'react';
import { FiX } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface TankFormData {
  tank_name: string;
  location: string;
  capacity: string;
  nitrogen_capacity: string;
  nitrogen_level: string;
  nitrogen_unit: string;
  low_level_threshold: string;
  sort_order: string;
  notes: string;
  [key: string]: unknown;
}

interface TankFormProps {
  isOpen: boolean;
  editingTank: Record<string, unknown> | null;
  formData: TankFormData;
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

export default function TankForm({
  isOpen,
  editingTank,
  formData,
  loading,
  validation,
  onInputChange,
  onSubmit,
  onClose
}: TankFormProps) {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">
            {editingTank ? 'Edit Tank' : 'Add New Tank'}
          </h2>
          <button
            className="form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tank_name" className="form-label">Tank Name *</label>
              <input
                id="tank_name"
                type="text"
                name="tank_name"
                value={formData.tank_name}
                onChange={onInputChange}
                className={getFieldClassName('form-input', validation?.hasFieldError('tank_name'))}
                placeholder=""
              />
              <FieldError error={validation?.getFieldError('tank_name')} />
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Location</label>
              <input id="location" type="text" name="location" value={formData.location} onChange={onInputChange} className="form-input" placeholder="" />
            </div>

            <div className="form-group">
              <label htmlFor="capacity" className="form-label">Canister Capacity</label>
              <input id="capacity" type="number" name="capacity" value={formData.capacity} onChange={onInputChange} className="form-input" placeholder="Number of canisters" />
            </div>

            <div className="form-group">
              <label htmlFor="nitrogen_capacity" className="form-label">Nitrogen Capacity</label>
              <input id="nitrogen_capacity" type="number" step="0.01" name="nitrogen_capacity" value={formData.nitrogen_capacity} onChange={onInputChange} className="form-input" placeholder="Maximum nitrogen volume" />
            </div>

            <div className="form-group">
              <label htmlFor="nitrogen_level" className="form-label">Current Nitrogen Level</label>
              <input id="nitrogen_level" type="number" step="0.01" name="nitrogen_level" value={formData.nitrogen_level} onChange={onInputChange} className="form-input" placeholder="Current level" />
            </div>

            <div className="form-group">
              <label htmlFor="nitrogen_unit" className="form-label">Unit</label>
              <select id="nitrogen_unit" name="nitrogen_unit" value={formData.nitrogen_unit} onChange={onInputChange} className="form-select">
                <option value="liters">Liters</option>
                <option value="gallons">Gallons</option>
                <option value="cm">Centimeters</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="low_level_threshold" className="form-label">Low Level Alert (%)</label>
              <input id="low_level_threshold" type="number" step="0.1" name="low_level_threshold" value={formData.low_level_threshold} onChange={onInputChange} className="form-input" placeholder="e.g., 20" />
            </div>

            <div className="form-group">
              <label htmlFor="sort_order" className="form-label">Tank Position</label>
              <input id="sort_order" type="number" min="1" name="sort_order" value={formData.sort_order} onChange={onInputChange} className="form-input" placeholder="Auto-assigned if empty" />
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={onInputChange} rows={3} className="form-input" placeholder="Additional notes..." />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="form-btn form-btn--cancel">Cancel</button>
            <button type="submit" disabled={loading} className="form-btn form-btn--submit">
              {loading ? 'Saving...' : editingTank ? 'Update Tank' : 'Add Tank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
