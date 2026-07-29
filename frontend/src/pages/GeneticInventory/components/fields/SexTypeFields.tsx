import React from 'react';
interface SexTypeFieldsProps {
  formData: {
    sex_type: string;
    inventory_type: string;
    is_ivf?: boolean;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function SexTypeFields({ formData, onInputChange }: SexTypeFieldsProps) {
  return (
    <>
      <div className="form-group form-group--full">
        <label className="form-label">Sex Type *</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="sex_type"
              value="conventional"
              checked={formData.sex_type === 'conventional'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Conventional</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="sex_type"
              value="sexed_female"
              checked={formData.sex_type === 'sexed_female'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Sexed Female</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="sex_type"
              value="sexed_male"
              checked={formData.sex_type === 'sexed_male'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Sexed Male</span>
          </label>
        </div>
      </div>
      {formData.inventory_type === 'embryo' && (
        <div className="form-group form-group--full">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_ivf"
              checked={formData.is_ivf || false}
              onChange={onInputChange}
              className="checkbox-input"
            />
            <span>IVF Embryo</span>
          </label>
        </div>
      )}
    </>
  );
}
