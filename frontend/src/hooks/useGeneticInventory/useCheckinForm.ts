import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { checkinInventory } from '../../api/geneticInventory';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { QUERY_KEYS } from '../../constants/queryKeys';

interface CheckinFormData {
  tank_id: string | null;
  canister_id: string | null;
  cane_number: string;
  [key: string]: unknown;
}

interface CheckinItem {
  id: string;
  inventory_type: string;
  embryo_name?: string;
  sire?: { id: string; name: string } | null;
  [key: string]: unknown;
}

interface CheckinFormOptions {
  onSuccess?: () => void;
  clearCanisters?: () => void;
  userId?: string;
}

const initialFormData: CheckinFormData = {
  tank_id: null,
  canister_id: null,
  cane_number: ''
};

/**
 * Hook for managing the check-in form for checked out inventory items.
 * Simplified form that only needs location selection (tank, canister, cane).
 */
export function useCheckinForm({ onSuccess, clearCanisters, userId }: CheckinFormOptions) {
  const queryClient = useQueryClient();
  const modal = useModalState();
  const [selectedItem, setSelectedItem] = useState<CheckinItem | null>(null);

  // CRUD mutation for check-in
  const crud = useCRUDMutation({
    createFn: async () => ({ data: null, error: null }), // Not used
    updateFn: async (id: string, data: Record<string, unknown>, userId: string, entityName?: string) => {
      return checkinInventory(id, data as { tank_id: string; canister_id: string; cane_number?: string }, userId, entityName ?? '');
    },
    deleteFn: async () => ({ data: null, error: null }), // Not used
    queryKeys: [QUERY_KEYS.geneticInventory, QUERY_KEYS.geneticInventoryCounts, QUERY_KEYS.tanks],
    userId: userId ?? ''
  });

  // Validation rules - tank and canister are required for check-in
  const validationRules = useMemo(() => ({
    tank_id: {
      required: 'Please select a tank'
    },
    canister_id: {
      required: 'Please select a canister'
    }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    form.handleChange(e);
  }, [form]);

  const openCheckinModal = useCallback((item: CheckinItem) => {
    setSelectedItem(item);
    form.reset();
    validation.reset();
    modal.open();
  }, [form, validation, modal]);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setSelectedItem(null);
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

    if (!selectedItem) {
      return;
    }

    // Determine entity name for activity logging
    const entityName = selectedItem.inventory_type === 'embryo'
      ? selectedItem.embryo_name ?? ''
      : selectedItem.sire?.name || 'Unknown Sire';

    try {
      await crud.save({
        data: form.values,
        isEdit: true,
        entityId: selectedItem.id,
        entityName
      });

      // Invalidate canister inventory cache for the new location
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

      handleCloseForm();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, selectedItem, crud, onSuccess, queryClient, validation, handleCloseForm]);

  return {
    // State
    formData: form.values,
    isOpen: modal.isOpen,
    selectedItem,
    loading: crud.saving,
    error: crud.error,

    // Validation
    validation,

    // Handlers
    handleInputChange,
    handleSubmit,
    openCheckinModal,
    handleCloseForm
  };
}
