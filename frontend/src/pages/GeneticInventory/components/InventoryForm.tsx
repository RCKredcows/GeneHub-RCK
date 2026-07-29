import React from 'react';
import { FiX } from 'react-icons/fi';
import InventoryTypeFields from './fields/InventoryTypeFields';
import SexTypeFields from './fields/SexTypeFields';
import OwnerFields from './fields/OwnerFields';
import LocationFields from './fields/LocationFields';
import DetailsFields from './fields/DetailsFields';

interface InventoryFormProps {
  isOpen: boolean;
  editingInventory: Record<string, unknown> | null;
  selectedSire: { id: string; name: string; breed?: string } | null;
  selectedCustomer: { id: string; name: string } | null;
  formData: Record<string, unknown>;
  loading: boolean;
  error: string;
  validation: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
    [key: string]: unknown;
  };
  tanks: { id: string; tank_name: string; [key: string]: unknown }[];
  canisters: { id: string; canister_number: string; [key: string]: unknown }[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown }; option?: unknown }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCreateSire: () => void;
  onCreateCustomer: () => void;
  onCreateTank: () => void;
  onCreateCanister: () => void;
}

export default function InventoryForm({
  isOpen,
  editingInventory,
  selectedSire,
  selectedCustomer,
  formData,
  loading,
  error,
  validation,
  tanks,
  canisters,
  onInputChange,
  onSubmit,
  onClose,
  onCreateSire,
  onCreateCustomer,
  onCreateTank,
  onCreateCanister
}: InventoryFormProps) {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">
            {editingInventory ? 'Edit Inventory' : 'Add New Inventory'}
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
        <form onSubmit={onSubmit} className="genetic-inventory__form">
          <div className="form-grid">
            <InventoryTypeFields
              formData={formData as Record<string, unknown> & { inventory_type: string }}
              editingInventory={editingInventory}
              selectedSire={selectedSire}
              onInputChange={onInputChange}
              validation={validation}
              onCreateSire={onCreateSire}
            />
            <SexTypeFields
              formData={formData as Record<string, unknown> & { sex_type: string; inventory_type: string }}
              onInputChange={onInputChange}
            />
            <OwnerFields
              formData={formData as Record<string, unknown> & { owner_type: string }}
              editingInventory={editingInventory}
              selectedCustomer={selectedCustomer}
              onInputChange={onInputChange}
              validation={validation}
              onCreateCustomer={onCreateCustomer}
            />
            <LocationFields
              formData={formData as Record<string, unknown> & { tank_id: string; canister_id: string; cane_number: string }}
              tanks={tanks}
              canisters={canisters}
              onInputChange={onInputChange}
              validation={validation}
              onCreateTank={onCreateTank}
              onCreateCanister={onCreateCanister}
            />
            <DetailsFields
              formData={formData as Record<string, unknown> & { quantity: string; status: string; check_in_date: string; check_out_date: string; notes: string }}
              onInputChange={onInputChange}
              validation={validation}
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
              {loading ? (editingInventory ? 'Updating...' : 'Adding...') : (editingInventory ? 'Update Inventory' : 'Add Inventory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
