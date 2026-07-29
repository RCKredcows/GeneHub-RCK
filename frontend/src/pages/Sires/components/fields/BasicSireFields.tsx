import React from 'react';
import FieldError from '../../../../components/common/FieldError';
import { getFieldClassName } from '../../../../hooks/useFormValidation';

interface BasicSireFieldsProps {
  formData: {
    name: string;
    breed: string;
    registration_number: string;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  validation?: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
  };
}

export default function BasicSireFields({ formData, onInputChange, validation }: BasicSireFieldsProps) {
  return (
    <>
      <div className="form-group form-group--full">
        <label htmlFor="name" className="form-label">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          className={getFieldClassName('form-input', validation?.hasFieldError('name') ?? false)}
        />
        <FieldError error={validation?.getFieldError('name')} />
      </div>

      <div className="form-group">
        <label htmlFor="breed" className="form-label">Breed *</label>
        <input
          type="text"
          id="breed"
          name="breed"
          value={formData.breed}
          onChange={onInputChange}
          className={getFieldClassName('form-input', validation?.hasFieldError('breed') ?? false)}
        />
        <FieldError error={validation?.getFieldError('breed')} />
      </div>

      <div className="form-group">
        <label htmlFor="registration_number" className="form-label">Registration Number</label>
        <input
          type="text"
          id="registration_number"
          name="registration_number"
          value={formData.registration_number}
          onChange={onInputChange}
          className="form-input"
        />
      </div>
    </>
  );
}
