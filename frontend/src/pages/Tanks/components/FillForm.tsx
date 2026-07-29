import React from 'react';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface FillFormData {
  event_type: string;
  nitrogen_level_before: string;
  amount: string;
  nitrogen_level_after: string;
  notes: string;
  [key: string]: unknown;
}

interface FillFormProps {
  isOpen: boolean;
  formData: FillFormData;
  loading: boolean;
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function FillForm({ isOpen, formData, loading, validation, onInputChange, onSubmit, onClose }: FillFormProps) {
  if (!isOpen) return null;

  const isFill = formData.event_type === 'fill';

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">Log Nitrogen {isFill ? 'Fill' : 'Drop'}</h2>
          <button className="form-close" onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-body">
          <div className="form-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Event Type</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${isFill ? 'toggle-btn--active' : ''}`} onClick={() => onInputChange({ target: { name: 'event_type', value: 'fill' } })}>
                  <FiPlus size={16} /> Fill
                </button>
                <button type="button" className={`toggle-btn ${!isFill ? 'toggle-btn--active toggle-btn--drop' : ''}`} onClick={() => onInputChange({ target: { name: 'event_type', value: 'drop' } })}>
                  <FiMinus size={16} /> Drop
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nitrogen_level_before" className="form-label">Level Before *</label>
              <input id="nitrogen_level_before" type="number" step="0.01" name="nitrogen_level_before" value={formData.nitrogen_level_before} onChange={onInputChange} className={getFieldClassName('form-input', validation?.hasFieldError('nitrogen_level_before'))} />
              <FieldError error={validation?.getFieldError('nitrogen_level_before')} />
            </div>

            <div className="form-group">
              <label htmlFor="amount" className="form-label">Amount {isFill ? 'Added' : 'Dropped'} *</label>
              <input id="amount" type="number" step="0.01" min="0" name="amount" value={formData.amount} onChange={onInputChange} className={getFieldClassName('form-input', validation?.hasFieldError('amount'))} />
              <FieldError error={validation?.getFieldError('amount')} />
            </div>

            <div className="form-group">
              <label htmlFor="nitrogen_level_after" className="form-label">Level After *</label>
              <input id="nitrogen_level_after" type="number" step="0.01" name="nitrogen_level_after" value={formData.nitrogen_level_after} onChange={onInputChange} className={getFieldClassName('form-input', validation?.hasFieldError('nitrogen_level_after'))} />
              <FieldError error={validation?.getFieldError('nitrogen_level_after')} />
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="fill_notes" className="form-label">Notes</label>
              <textarea id="fill_notes" name="notes" value={formData.notes} onChange={onInputChange} rows={2} className="form-input" placeholder="Any observations..." />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="form-btn form-btn--cancel">Cancel</button>
            <button type="submit" disabled={loading} className="form-btn form-btn--submit">
              {loading ? 'Saving...' : `Log ${isFill ? 'Fill' : 'Drop'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
