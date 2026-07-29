import type React from 'react';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  logUsage as logUsageAPI,
  fetchUsageHistory,
  restockItem as restockItemAPI
} from '../../api/medicalInventory';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useSimpleMutation } from '../useCRUDMutation';
import { MIN_MUTATION_DELAY_SHORT } from '../../constants/mutations';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SupplyInventory } from '../../types';

interface LogFormData {
  quantity_used: string;
  notes: string;
  [key: string]: unknown;
}

interface RestockFormData {
  quantity: string;
  [key: string]: unknown;
}

interface LogUsageParams {
  itemId: string;
  quantityUsed: number;
  notes: string;
}

interface RestockParams {
  itemId: string;
  quantity: number;
}

interface UsageLogOptions {
  onSuccess?: () => void;
}

const initialLogFormData: LogFormData = {
  quantity_used: '',
  notes: ''
};

const initialRestockFormData: RestockFormData = {
  quantity: ''
};

/**
 * Hook for managing usage logging and restocking
 */
export function useUsageLog({ onSuccess }: UsageLogOptions = {}) {
  const logModal = useModalState();
  const restockModal = useModalState();

  const logForm = useFormState(initialLogFormData);
  const restockForm = useFormState(initialRestockFormData);

  const [selectedItem, setSelectedItem] = useState<SupplyInventory | null>(null);

  // Log usage mutation
  const logMutation = useSimpleMutation<LogUsageParams>({
    mutationFn: ({ itemId, quantityUsed, notes }) => logUsageAPI(itemId, quantityUsed, notes),
    queryKeys: [QUERY_KEYS.medicalInventory, QUERY_KEYS.allUsageHistory, QUERY_KEYS.allMedicalInventoryStats],
    minDelay: MIN_MUTATION_DELAY_SHORT
  });

  // Restock mutation
  const restockMutation = useSimpleMutation<RestockParams>({
    mutationFn: ({ itemId, quantity }) => restockItemAPI(itemId, quantity),
    queryKeys: [QUERY_KEYS.medicalInventory, QUERY_KEYS.allMedicalInventoryStats],
    minDelay: MIN_MUTATION_DELAY_SHORT
  });

  // Query for usage history - only runs when item is selected and modal is open
  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.usageHistory(selectedItem?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await fetchUsageHistory(selectedItem!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedItem?.id && logModal.isOpen,
  });

  // Open log usage modal for an item
  const openLogUsage = useCallback((item: { id: string; item_name: string; [key: string]: unknown }) => {
    setSelectedItem(item as SupplyInventory);
    logForm.reset();
    logModal.open();
  }, [logForm, logModal]);

  // Submit usage log
  const handleLogUsage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    logMutation.clearError();

    const quantityUsed = parseFloat(logForm.values.quantity_used);

    if (!quantityUsed || quantityUsed <= 0) {
      logMutation.setError('Please enter a valid quantity');
      return;
    }

    if (selectedItem && quantityUsed > selectedItem.quantity) {
      logMutation.setError(`Cannot use more than available (${selectedItem.quantity} ${selectedItem.unit})`);
      return;
    }

    try {
      await logMutation.execute({
        itemId: selectedItem!.id,
        quantityUsed,
        notes: logForm.values.notes.trim()
      });
      logModal.close();
      setSelectedItem(null);
      logForm.reset();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [logForm, selectedItem, logMutation, logModal, onSuccess]);

  // Close log modal
  const closeLogUsage = useCallback(() => {
    logModal.close();
    setSelectedItem(null);
    logForm.reset();
  }, [logModal, logForm]);

  // Open restock modal for an item
  const openRestock = useCallback((item: { id: string; item_name: string; [key: string]: unknown }) => {
    setSelectedItem(item as SupplyInventory);
    restockForm.reset();
    restockModal.open();
  }, [restockForm, restockModal]);

  // Submit restock
  const handleRestock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    restockMutation.clearError();

    const quantity = parseFloat(restockForm.values.quantity);

    if (!quantity || quantity <= 0) {
      restockMutation.setError('Please enter a valid quantity');
      return;
    }

    try {
      await restockMutation.execute({
        itemId: selectedItem!.id,
        quantity
      });
      restockModal.close();
      setSelectedItem(null);
      restockForm.reset();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [restockForm, selectedItem, restockMutation, restockModal, onSuccess]);

  // Close restock modal
  const closeRestock = useCallback(() => {
    restockModal.close();
    setSelectedItem(null);
    restockForm.reset();
  }, [restockModal, restockForm]);

  return {
    // State
    selectedItem,
    usageHistory: historyQuery.data || [],
    historyLoading: historyQuery.isLoading,
    loading: logMutation.loading || restockMutation.loading,
    error: logMutation.error || restockMutation.error,

    // Log Usage
    isLogModalOpen: logModal.isOpen,
    logFormData: logForm.values,
    handleLogInputChange: logForm.handleChange,
    openLogUsage,
    handleLogUsage,
    closeLogUsage,

    // Restock
    isRestockModalOpen: restockModal.isOpen,
    restockFormData: restockForm.values,
    handleRestockInputChange: restockForm.handleChange,
    openRestock,
    handleRestock,
    closeRestock
  };
}
