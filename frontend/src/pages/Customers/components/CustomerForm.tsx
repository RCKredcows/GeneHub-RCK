import React from 'react';
import { FiX } from 'react-icons/fi';
import FieldError from '../../../components/common/FieldError';
import { getFieldClassName } from '../../../hooks/useFormValidation';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  [key: string]: unknown;
}

interface CustomerFormProps {
  isOpen: boolean;
  editingCustomer: Record<string, unknown> | null;
  formData: CustomerFormData;
  loading: boolean;
  error: string;
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CustomerForm({
  isOpen,
  editingCustomer,
  formData,
  loading,
  error,
  validation,
  onInputChange,
  onSubmit,
  onClose
}: CustomerFormProps) {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="form-close"
            aria-label="Close form"
          >
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="customers__form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className={getFieldClassName('form-input', validation?.hasFieldError('name'))}
              />
              <FieldError error={validation?.getFieldError('name')} />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={onInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={onInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={onInputChange}
                className="form-input"
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip" className="form-label">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={onInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group form-group--full">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={onInputChange}
                rows={3}
                className="form-textarea"
              />
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="form-btn form-btn--cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="form-btn form-btn--submit"
            >
              {loading ? (editingCustomer ? 'Updating...' : 'Adding...') : (editingCustomer ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
