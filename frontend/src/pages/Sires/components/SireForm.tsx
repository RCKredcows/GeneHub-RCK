import React from 'react';
import { FiX } from 'react-icons/fi';
import BasicSireFields from './fields/BasicSireFields';
import ImageUploadField from './fields/ImageUploadField';
import SireOwnerFields from './fields/SireOwnerFields';
import SireDetailsFields from './fields/SireDetailsFields';

interface SireFormProps {
  isOpen: boolean;
  editingSire: Record<string, unknown> | null;
  selectedCustomer: { id: string; name: string } | null;
  formData: Record<string, unknown>;
  loading: boolean;
  error: string;
  imagePreview: string | null;
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  onInputChange: (e: { target: { name: string; value: unknown }; option?: unknown }) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCreateCustomer: () => void;
}

export default function SireForm({
  isOpen,
  editingSire,
  selectedCustomer,
  formData,
  loading,
  error,
  imagePreview,
  validation,
  onInputChange,
  onImageChange,
  onRemoveImage,
  onSubmit,
  onClose,
  onCreateCustomer
}: SireFormProps) {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">
            {editingSire ? 'Edit Sire' : 'Add New Sire'}
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
        <form onSubmit={onSubmit} className="sires__form">
          <div className="form-grid">
            <BasicSireFields
              formData={formData as Record<string, unknown> & { name: string; breed: string; registration_number: string }}
              onInputChange={onInputChange}
              validation={validation}
            />
            <ImageUploadField
              imagePreview={imagePreview}
              onImageChange={onImageChange}
              onRemoveImage={onRemoveImage}
            />
            <SireOwnerFields
              formData={formData as Record<string, unknown> & { owner_type: string; customer_id: string }}
              editingSire={editingSire}
              selectedCustomer={selectedCustomer}
              onInputChange={onInputChange}
              validation={validation}
              onCreateCustomer={onCreateCustomer}
            />
            <SireDetailsFields
              formData={formData as Record<string, unknown> & { notes: string; price_for_semen: string; price_for_sexed_semen: string; available_for_sale: boolean }}
              onInputChange={onInputChange}
            />
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
              {loading ? (editingSire ? 'Updating...' : 'Adding...') : (editingSire ? 'Update Sire' : 'Add Sire')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
