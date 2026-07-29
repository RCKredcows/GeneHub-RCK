import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createGeneticInventory,
  updateGeneticInventory,
  deleteGeneticInventory
} from '../../api/geneticInventory';
import { updateSireAvailability } from '../../api/sires';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { QUERY_KEYS } from '../../constants/queryKeys';

interface InventoryFormData {
  inventory_type: string;
  sex_type: string;
  is_ivf: boolean;
  owner_type: string;
  customer_id: string | null;
  sire_id: string | null;
  embryo_name: string;
  breed: string;
  tank_id: string | null;
  canister_id: string | null;
  cane_number: string;
  quantity: string;
  original_quantity: string;
  unit: string;
  price_for_semen: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  notes: string;
  add_to_sire_tab: boolean;
  [key: string]: unknown;
}

interface InventoryEditItem {
  id: string;
  inventory_type: string;
  sex_type: string;
  is_ivf: boolean;
  owner_type: string;
  customer_id: string | null;
  sire_id: string | null;
  embryo_name: string;
  breed: string;
  tank_id: string | null;
  canister_id: string | null;
  cane_number: string;
  quantity: number | string;
  original_quantity: number | string;
  unit: string;
  price_for_semen: number | string | null;
  check_in_date: string;
  check_out_date: string | null;
  status: string;
  notes: string;
  sire?: { id: string; name: string; breed?: string; available_for_sale?: boolean } | null;
  customer?: { id: string; name: string } | null;
  tank?: { id: string; tank_name: string } | null;
  canister?: { id: string; canister_number: string } | null;
  [key: string]: unknown;
}

interface SireOption {
  id: string;
  name: string;
  breed?: string;
  price_for_semen?: number | string;
  price_for_sexed_semen?: number | string;
  available_for_sale?: boolean;
}

interface SelectChangeEvent {
  target: { name: string; value: unknown };
  option?: unknown;
}

interface InventoryFormOptions {
  onSuccess?: () => void;
  clearCanisters?: () => void;
  userId?: string;
}

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialFormData: InventoryFormData = {
  inventory_type: 'semen',
  sex_type: 'conventional',
  is_ivf: false,
  owner_type: 'customer',
  customer_id: null,
  sire_id: null,
  embryo_name: '',
  breed: '',
  tank_id: null,
  canister_id: null,
  cane_number: '',
  quantity: '',
  original_quantity: '',
  unit: 'straws',
  price_for_semen: '',
  check_in_date: getLocalDateString(),
  check_out_date: '',
  status: 'stored',
  notes: '',
  add_to_sire_tab: false
};

/**
 * Hook for managing inventory create/edit form.
 */
export function useInventoryForm({ onSuccess, clearCanisters, userId }: InventoryFormOptions) {
  const queryClient = useQueryClient();
  const modal = useModalState();
  const deleteModal = useConfirmModal();

  // CRUD mutations with automatic cache invalidation
  // Note: canisterInventory invalidation handled separately after save since we need canister_id
  const crud = useCRUDMutation({
    createFn: createGeneticInventory,
    updateFn: updateGeneticInventory,
    deleteFn: deleteGeneticInventory,
    queryKeys: [QUERY_KEYS.geneticInventory, QUERY_KEYS.geneticInventoryCounts, QUERY_KEYS.tanks, QUERY_KEYS.sires],
    userId: userId ?? ''
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    sire_id: {
      validate: (value: unknown, allValues: Record<string, unknown>) => {
        if (allValues.inventory_type === 'semen' && !value) {
          return 'Please select a sire';
        }
        return '';
      }
    },
    embryo_name: {
      validate: (value: unknown, allValues: Record<string, unknown>) => {
        if (allValues.inventory_type === 'embryo' && !(value as string)?.trim()) {
          return 'Please enter an embryo name';
        }
        return '';
      }
    },
    owner_type: {
      required: 'Please select an owner type'
    },
    customer_id: {
      requiredIf: { field: 'owner_type', value: 'customer', message: 'Please select a customer' }
    },
    tank_id: {
      validate: (value: unknown, allValues: Record<string, unknown>) => {
        // Location is optional when checked out
        if (allValues.status === 'checked_out') return '';
        if (!value) return 'Please select a tank';
        return '';
      }
    },
    canister_id: {
      validate: (value: unknown, allValues: Record<string, unknown>) => {
        // Location is optional when checked out
        if (allValues.status === 'checked_out') return '';
        if (!value) return 'Please select a canister';
        return '';
      }
    },
    quantity: {
      required: 'Please enter a quantity',
      min: { value: 0.01, message: 'Quantity must be greater than 0' }
    },
    check_out_date: {
      validate: (value: unknown, allValues: Record<string, unknown>) => {
        if (value && allValues.check_in_date && (value as string) < (allValues.check_in_date as string)) {
          return 'Check out date cannot be before check in date';
        }
        return '';
      }
    }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingInventory, setEditingInventory] = useState<InventoryEditItem | null>(null);

  // Track selected sire for entity name in activity logging and display
  const [selectedSire, setSelectedSire] = useState<{ id: string; name: string; breed?: string; price_for_semen?: number | string; price_for_sexed_semen?: number | string; available_for_sale?: boolean } | null>(null);
  // Track selected customer for display in AsyncSearchableSelect
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);

  // Helper to get the correct price based on sex type
  const getPriceForSexType = useCallback((sire: typeof selectedSire, sexType: string): string => {
    if (!sire) return '';
    if (sexType === 'sexed_male' || sexType === 'sexed_female') {
      return String(sire.price_for_sexed_semen || '');
    }
    return String(sire.price_for_semen || '');
  }, []);

  // Custom input handler with auto-population logic
  const handleInputChange = useCallback((e: SelectChangeEvent) => {
    const { name } = e.target;
    const value = e.target.value as string;

    // Auto-populate breed, price, and availability when sire is selected (option comes from AsyncSearchableSelect)
    if (name === 'sire_id' && value && e.option) {
      const sire = e.option as SireOption;
      setSelectedSire(sire);
      form.setMultipleValues({
        [name]: value,
        breed: sire.breed || '',
        price_for_semen: getPriceForSexType(sire, form.values.sex_type),
        add_to_sire_tab: sire.available_for_sale || false
      });
      return;
    }

    // Update price when sex_type changes (if a sire is selected)
    if (name === 'sex_type' && selectedSire) {
      form.setMultipleValues({
        [name]: value,
        price_for_semen: getPriceForSexType(selectedSire, value)
      });
      return;
    }

    // Track selected customer for AsyncSearchableSelect display
    if (name === 'customer_id' && e.option) {
      setSelectedCustomer(e.option as { id: string; name: string });
    }

    // Set original_quantity when quantity is first set
    if (name === 'quantity' && !form.values.original_quantity) {
      form.setMultipleValues({
        [name]: value,
        original_quantity: value
      });
      return;
    }

    // Set unit based on inventory type (straws for semen, empty for embryos)
    if (name === 'inventory_type') {
      form.setMultipleValues({
        [name]: value,
        unit: value === 'semen' ? 'straws' : ''
      });
      return;
    }

    // Clear location and set check_out_date when status changes to checked_out
    if (name === 'status' && value === 'checked_out') {
      // Use local date to avoid timezone issues
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      form.setMultipleValues({
        [name]: value,
        tank_id: null,
        canister_id: null,
        check_out_date: localDate
      });
      clearCanisters?.();
      return;
    }

    form.handleChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
  }, [form, selectedSire, getPriceForSexType, clearCanisters]);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingInventory(null);
    setSelectedSire(null);
    setSelectedCustomer(null);
    form.reset();
    validation.reset();
    clearCanisters?.();
  }, [modal, form, validation, clearCanisters]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    crud.clearError();

    if (!validation.validateAll(form.values)) {
      return;
    }

    // Extract add_to_sire_tab before sending to database
    const { add_to_sire_tab, ...rawData } = form.values;

    const inventoryData = {
      ...rawData,
      customer_id: rawData.customer_id || null,
      sire_id: rawData.sire_id || null,
      tank_id: rawData.tank_id || null,
      canister_id: rawData.canister_id || null,
      check_out_date: rawData.check_out_date || null,
      price_for_semen: rawData.price_for_semen === '' ? null : rawData.price_for_semen
    };

    // Determine entity name for activity logging
    const entityName = form.values.inventory_type === 'embryo'
      ? form.values.embryo_name
      : editingInventory?.sire?.name || selectedSire?.name || 'Unknown Sire';

    try {
      await crud.save({
        data: inventoryData,
        isEdit: !!editingInventory,
        entityId: editingInventory?.id,
        entityName
      });

      // Invalidate canister inventory cache so Tanks page shows updated inventory
      if (form.values.canister_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.canisterInventory(form.values.canister_id)
        });
        // Also invalidate canisters to update inventory_count
        if (form.values.tank_id) {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.canisters(form.values.tank_id)
          });
        }
      }

      // If "Add to Sire Tab" is checked and we have a sire_id, update the sire's availability
      if (add_to_sire_tab && form.values.sire_id && form.values.inventory_type === 'semen') {
        await updateSireAvailability(form.values.sire_id, true);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sires });
      }

      handleCloseForm();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, editingInventory, crud, onSuccess, queryClient, selectedSire, validation, handleCloseForm]);

  const handleEdit = useCallback((item: InventoryEditItem) => {
    setEditingInventory(item);

    // Check if this sire is already available for sale (from item's nested sire data)
    const isAlreadyAvailable = item.sire?.available_for_sale || false;

    form.setValues({
      inventory_type: item.inventory_type || 'semen',
      sex_type: item.sex_type || 'conventional',
      is_ivf: item.is_ivf || false,
      owner_type: item.owner_type || 'customer',
      customer_id: item.customer_id || null,
      sire_id: item.sire_id || null,
      embryo_name: item.embryo_name || '',
      breed: item.breed || '',
      tank_id: item.tank_id || null,
      canister_id: item.canister_id || null,
      cane_number: item.cane_number || '',
      quantity: String(item.quantity || ''),
      original_quantity: String(item.original_quantity || ''),
      unit: item.inventory_type === 'semen' ? (item.unit || 'straws') : '',
      price_for_semen: String(item.price_for_semen ?? ''),
      check_in_date: item.check_in_date || getLocalDateString(),
      check_out_date: item.check_out_date || '',
      status: item.status || 'stored',
      notes: item.notes || '',
      add_to_sire_tab: isAlreadyAvailable
    });
    modal.open();
  }, [form, modal]);

  const openDeleteConfirm = useCallback((id: string, name: string) => {
    deleteModal.open(id, name);
  }, [deleteModal]);

  const closeDeleteConfirm = useCallback(() => {
    deleteModal.close();
  }, [deleteModal]);

  const confirmDeleteInventory = useCallback(async () => {
    try {
      await crud.remove({
        entityId: deleteModal.itemId!,
        entityName: deleteModal.itemName
      });
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
    deleteModal.close();
  }, [deleteModal, crud, onSuccess]);

  return {
    // State
    formData: form.values,
    isFormOpen: modal.isOpen,
    editingInventory,
    selectedSire,
    selectedCustomer,
    loading: crud.saving,
    deleting: crud.deleting,
    error: crud.error,
    confirmDelete: {
      isOpen: deleteModal.isOpen,
      inventoryId: deleteModal.itemId,
      inventoryName: deleteModal.itemName
    },

    // Validation
    validation,

    // Setters (for backwards compatibility)
    setIsFormOpen: modal.setIsOpen,
    setFormData: form.setValues,
    setSelectedSire,
    setSelectedCustomer,

    // Handlers
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleCloseForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteInventory
  };
}
