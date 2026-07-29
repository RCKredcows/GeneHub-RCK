import React from 'react';
import SearchableSelect from '../../../../components/common/SearchableSelect';
import FieldError from '../../../../components/common/FieldError';

interface LocationFieldsProps {
  formData: {
    tank_id: string;
    canister_id: string;
    cane_number: string;
    status?: string;
    [key: string]: unknown;
  };
  tanks: { id: string; tank_name: string; [key: string]: unknown }[];
  canisters: { id: string; canister_number: string; [key: string]: unknown }[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => void;
  validation?: {
    hasFieldError: (field: string) => boolean;
    getFieldError: (field: string) => string | undefined;
  };
  onCreateTank: () => void;
  onCreateCanister: () => void;
}

export default function LocationFields({ formData, tanks, canisters, onInputChange, validation, onCreateTank, onCreateCanister }: LocationFieldsProps) {
  const isCheckedOut = formData.status === 'checked_out';

  return (
    <>
      <div className="form-group">
        <label htmlFor="tank_id" className="form-label">
          Tank {!isCheckedOut && '*'}
          {isCheckedOut && <span className="form-label-hint">(optional when checked out)</span>}
        </label>
        <SearchableSelect
          id="tank_id"
          name="tank_id"
          value={formData.tank_id || ''}
          onChange={onInputChange}
          options={tanks}
          placeholder={isCheckedOut ? "No location (checked out)" : "Select a tank..."}
          searchPlaceholder="Search tanks..."
          getOptionLabel={(tank) => tank.tank_name}
          getOptionValue={(tank) => tank.id}
          className={validation?.hasFieldError('tank_id') ? 'searchable-select--error' : ''}
          onCreateNew={onCreateTank}
          createNewLabel="Create new tank..."
        />
        {!isCheckedOut && <FieldError error={validation?.getFieldError('tank_id')} />}
      </div>

      <div className="form-group">
        <label htmlFor="canister_id" className="form-label">
          Canister {!isCheckedOut && '*'}
        </label>
        <SearchableSelect
          id="canister_id"
          name="canister_id"
          value={formData.canister_id || ''}
          onChange={onInputChange}
          options={canisters}
          placeholder={isCheckedOut ? "No location (checked out)" : "Select a canister..."}
          searchPlaceholder="Search canisters..."
          disabled={!formData.tank_id}
          getOptionLabel={(canister) => canister.canister_number}
          getOptionValue={(canister) => canister.id}
          className={validation?.hasFieldError('canister_id') ? 'searchable-select--error' : ''}
          onCreateNew={formData.tank_id ? onCreateCanister : undefined}
          createNewLabel="Create new canister..."
        />
        {!isCheckedOut && <FieldError error={validation?.getFieldError('canister_id')} />}
      </div>

      <div className="form-group">
        <label htmlFor="cane_number" className="form-label">Cane Number</label>
        <input
          type="text"
          id="cane_number"
          name="cane_number"
          value={formData.cane_number}
          onChange={onInputChange}
          className="form-input"
        />
      </div>
    </>
  );
}
