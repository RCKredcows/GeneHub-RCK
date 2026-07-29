import React from 'react';
interface SireDetailsFieldsProps {
  formData: {
    notes: string;
    price_for_semen: string;
    price_for_sexed_semen: string;
    available_for_sale: boolean;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => void;
}

export default function SireDetailsFields({ formData, onInputChange }: SireDetailsFieldsProps) {
  return (
    <>
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

      <div className="form-group">
        <label htmlFor="price_for_semen" className="form-label">Conventional Semen Price</label>
        <input
          type="number"
          id="price_for_semen"
          name="price_for_semen"
          value={formData.price_for_semen}
          onChange={onInputChange}
          step="0.01"
          min="0"
          placeholder="e.g., 25.00"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="price_for_sexed_semen" className="form-label">Sexed Semen Price</label>
        <input
          type="number"
          id="price_for_sexed_semen"
          name="price_for_sexed_semen"
          value={formData.price_for_sexed_semen}
          onChange={onInputChange}
          step="0.01"
          min="0"
          placeholder="e.g., 35.00"
          className="form-input"
        />
      </div>

      <div className="form-group form-group--full">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="available_for_sale"
            checked={formData.available_for_sale || false}
            onChange={(e) => onInputChange({
              target: { name: 'available_for_sale', value: e.target.checked }
            })}
            className="checkbox-input"
          />
          <span>Show in Sires Tab (Available for Sale)</span>
        </label>
      </div>
    </>
  );
}
