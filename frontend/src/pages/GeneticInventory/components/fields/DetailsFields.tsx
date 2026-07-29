import React from 'react';
import FieldError from '../../../../components/common/FieldError';
import { getFieldClassName } from '../../../../hooks/useFormValidation';

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DetailsFieldsProps {
  formData: {
    quantity: string;
    status: string;
    check_in_date: string;
    check_out_date: string;
    notes: string;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => void;
  validation?: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
  };
}

export default function DetailsFields({ formData, onInputChange, validation }: DetailsFieldsProps) {
  // Handle status change with auto-setting check_out_date
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange(e);
    // Auto-set check_out_date to today when status changes to checked_out
    if (e.target.value === 'checked_out' && !formData.check_out_date) {
      onInputChange({
        target: { name: 'check_out_date', value: getLocalDateString() }
      });
    }
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="quantity" className="form-label">Quantity *</label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={onInputChange}
          min="0"
          step="any"
          className={getFieldClassName('form-input', validation?.hasFieldError('quantity') ?? false)}
        />
        <FieldError error={validation?.getFieldError('quantity')} />
      </div>

      <div className="form-group">
        <label htmlFor="status" className="form-label">Status *</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleStatusChange}
          className="form-select"
        >
          <option value="stored">Stored</option>
          <option value="checked_out">Checked Out</option>
          <option value="depleted">Depleted</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="check_in_date" className="form-label">Check In Date *</label>
        <input
          type="date"
          id="check_in_date"
          name="check_in_date"
          value={formData.check_in_date}
          onChange={onInputChange}
          className="form-input"
        />
      </div>

      {formData.status === 'checked_out' && (
        <div className="form-group">
          <label htmlFor="check_out_date" className="form-label">Check Out Date</label>
          <input
            type="date"
            id="check_out_date"
            name="check_out_date"
            value={formData.check_out_date}
            onChange={onInputChange}
            min={formData.check_in_date}
            className={getFieldClassName('form-input', validation?.hasFieldError('check_out_date') ?? false)}
          />
          <FieldError error={validation?.getFieldError('check_out_date')} />
        </div>
      )}

      <div className="form-group form-group--full">
        <label htmlFor="notes" className="form-label">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
          rows={3}
          className="form-textarea"
        />
      </div>
    </>
  );
}
