import React from 'react';
import AsyncSearchableSelect from '../../../../components/common/AsyncSearchableSelect';
import FieldError from '../../../../components/common/FieldError';
import { getFieldClassName } from '../../../../hooks/useFormValidation';
import { searchSires } from '../../../../api/sires';

interface InventoryTypeFieldsProps {
  formData: {
    inventory_type: string;
    sire_id?: string;
    price_for_semen?: string;
    add_to_sire_tab?: boolean;
    embryo_name?: string;
    [key: string]: unknown;
  };
  editingInventory: { sire?: { id: string; name: string; breed?: string } | null; [key: string]: unknown } | null;
  selectedSire: { id: string; name: string; breed?: string } | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown }; option?: unknown }) => void;
  validation?: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
  };
  onCreateSire: () => void;
}

export default function InventoryTypeFields({ formData, editingInventory, selectedSire: selectedSireProp, onInputChange, validation, onCreateSire }: InventoryTypeFieldsProps) {
  // Use selectedSire prop if available (from quick-create or selection), fall back to editingInventory.sire
  const selectedSire = selectedSireProp || editingInventory?.sire || null;
  return (
    <>
      <div className="form-group form-group--full">
        <label className="form-label">Inventory Type *</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="inventory_type"
              value="semen"
              checked={formData.inventory_type === 'semen'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Semen</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="inventory_type"
              value="embryo"
              checked={formData.inventory_type === 'embryo'}
              onChange={onInputChange}
              className="radio-input"
            />
            <span>Embryos</span>
          </label>
        </div>
      </div>

      {formData.inventory_type === 'semen' && (
        <>
          <div className="form-group form-group--full">
            <label htmlFor="sire_id" className="form-label">Sire *</label>
            <AsyncSearchableSelect
              id="sire_id"
              name="sire_id"
              value={formData.sire_id || ''}
              onChange={onInputChange}
              searchFn={searchSires}
              selectedOption={selectedSire}
              placeholder="Select a sire..."
              searchPlaceholder="Search sires..."
              getOptionLabel={(sire) => `${sire.name} - ${sire.breed}`}
              getOptionValue={(sire) => sire.id}
              className={validation?.hasFieldError('sire_id') ? 'async-searchable-select--error' : ''}
              onCreateNew={onCreateSire}
              createNewLabel="Create new sire..."
            />
            <FieldError error={validation?.getFieldError('sire_id')} />
          </div>

          <div className="form-group">
            <label htmlFor="price_for_semen" className="form-label">Semen Price ($)</label>
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

          <div className="form-group form-group--full">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="add_to_sire_tab"
                checked={formData.add_to_sire_tab || false}
                onChange={(e) => onInputChange({
                  target: { name: 'add_to_sire_tab', value: e.target.checked }
                })}
                className="checkbox-input"
              />
              <span>Add to Sire Tab (Make Available for Sale)</span>
            </label>
          </div>
        </>
      )}

      {formData.inventory_type === 'embryo' && (
        <div className="form-group form-group--full">
          <label htmlFor="embryo_name" className="form-label">Embryo Name *</label>
          <input
            type="text"
            id="embryo_name"
            name="embryo_name"
            value={formData.embryo_name}
            onChange={onInputChange}
            placeholder="e.g., K103 X Draft Pick"
            className={getFieldClassName('form-input', validation?.hasFieldError('embryo_name') ?? false)}
          />
          <FieldError error={validation?.getFieldError('embryo_name')} />
        </div>
      )}
    </>
  );
}
