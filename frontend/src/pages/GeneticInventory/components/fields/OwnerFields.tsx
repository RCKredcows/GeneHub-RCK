import React from 'react';
import AsyncSearchableSelect from '../../../../components/common/AsyncSearchableSelect';
import FieldError from '../../../../components/common/FieldError';
import { searchCustomers } from '../../../../api/customers';

interface OwnerFieldsProps {
  formData: {
    owner_type: string;
    customer_id?: string;
    [key: string]: unknown;
  };
  editingInventory: { customer?: { id: string; name: string } | null; [key: string]: unknown } | null;
  selectedCustomer: { id: string; name: string } | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown }; option?: unknown }) => void;
  validation?: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
  };
  onCreateCustomer: () => void;
}

export default function OwnerFields({ formData, editingInventory, selectedCustomer: selectedCustomerProp, onInputChange, validation, onCreateCustomer }: OwnerFieldsProps) {
  // Use selectedCustomer prop if available (from quick-create or selection), fall back to editingInventory.customer
  const selectedCustomer = selectedCustomerProp || editingInventory?.customer || null;
  return (
    <>
      <div className="form-group form-group--full">
        <label className="form-label">Owner Type *</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="owner_type"
              value="rck"
              checked={formData.owner_type === 'rck'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>RCK Owned</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="owner_type"
              value="customer"
              checked={formData.owner_type === 'customer'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Customer Owned</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="owner_type"
              value="unknown"
              checked={formData.owner_type === 'unknown'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Unknown Owner</span>
          </label>
        </div>
        <FieldError error={validation?.getFieldError('owner_type')} />
      </div>

      {formData.owner_type === 'customer' && (
        <div className="form-group form-group--full">
          <label htmlFor="customer_id" className="form-label">Customer *</label>
          <AsyncSearchableSelect
            id="customer_id"
            name="customer_id"
            value={formData.customer_id || ''}
            onChange={onInputChange}
            searchFn={searchCustomers}
            selectedOption={selectedCustomer}
            placeholder="Select a customer..."
            searchPlaceholder="Search customers..."
            getOptionLabel={(customer) => customer.name}
            getOptionValue={(customer) => customer.id}
            className={validation?.hasFieldError('customer_id') ? 'async-searchable-select--error' : ''}
            onCreateNew={onCreateCustomer}
            createNewLabel="Create new customer..."
          />
          <FieldError error={validation?.getFieldError('customer_id')} />
        </div>
      )}
    </>
  );
}
