import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGeneticInventory, deleteGeneticInventory } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';

interface InventoryItem {
  id: string;
  quantity: number;
  inventory_type?: string;
  embryo_name?: string | null;
  sire?: { name?: string | null } | null;
  [key: string]: unknown;
}

interface UpdateMutationVariables {
  itemId: string;
  quantity: number;
  entityName: string;
  delta: number;
}

interface DeleteMutationVariables {
  itemId: string;
  entityName?: string;
  reason?: string;
}

/**
 * Hook for managing inventory quantity updates using React Query mutations
 */
export function useInventoryQuantity(onUpdate: (() => void) | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const [qtyAmounts, setQtyAmounts] = useState<Record<string, number | string>>({});

  // Invalidate all related caches after inventory changes
  const invalidateCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geneticInventory });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geneticInventoryCounts });
    queryClient.invalidateQueries({ queryKey: ['canisterInventory'] });
    queryClient.invalidateQueries({ queryKey: ['canisters'] });
  }, [queryClient]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity, entityName, delta }: UpdateMutationVariables) => {
      const result = await updateGeneticInventory(
        itemId,
        { quantity },
        userId ?? '',
        entityName,
        {
          change: delta > 0 ? 'increased' : 'decreased',
          delta
        }
      );
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      invalidateCaches();
      onUpdate?.();
    },
    onError: (err: unknown) => {
      console.error('Failed to update inventory:', err);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ itemId, entityName, reason }: DeleteMutationVariables) => {
      const result = await deleteGeneticInventory(itemId, userId ?? '', entityName ?? '', { reason });
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      invalidateCaches();
      onUpdate?.();
    },
    onError: (err: unknown) => {
      console.error('Failed to delete inventory:', err);
    }
  });

  // Get display value (can be empty string for input)
  const getQtyAmount = (itemId: string): string => {
    const val = qtyAmounts[itemId];
    return val === undefined ? '1' : String(val);
  };

  // Get numeric value for actual updates (minimum 0.01 for decimals)
  const getQtyAmountForUpdate = (itemId: string): number => {
    const val = qtyAmounts[itemId];
    return Math.max(0.01, parseFloat(String(val)) || 1);
  };

  // Set the input value (allows empty string for typing)
  const setQtyAmount = (itemId: string, value: number | string) => {
    setQtyAmounts(prev => ({ ...prev, [itemId]: value }));
  };

  // Helper to get entity name from item
  const getEntityName = (item: InventoryItem): string => {
    if (item.inventory_type === 'embryo') {
      return item.embryo_name || 'Unknown Embryo';
    }
    return item.sire?.name || 'Unknown Sire';
  };

  // Handle the actual quantity update
  const handleUpdateQuantity = useCallback((item: InventoryItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 0) return;

    const entityName = getEntityName(item);

    // If quantity reaches 0 (or very close due to floating point), delete the item entirely
    // Use small epsilon for floating point comparison
    if (Math.abs(newQuantity) < 0.001) {
      deleteMutation.mutate({
        itemId: item.id,
        entityName,
        reason: 'Quantity reduced to zero'
      });
      return;
    }

    updateMutation.mutate({
      itemId: item.id,
      quantity: newQuantity,
      entityName,
      delta
    });
  }, [updateMutation, deleteMutation]);

  // Handle deleting an inventory item (cane)
  const handleDeleteItem = useCallback((itemId: string) => {
    deleteMutation.mutate({ itemId });
  }, [deleteMutation]);

  // Track which item is being updated/deleted
  const updatingItemId = updateMutation.isPending ? updateMutation.variables?.itemId : null;
  const deletingItemId = deleteMutation.isPending ? deleteMutation.variables?.itemId : null;

  return {
    updatingItemId,
    deletingItemId,
    getQtyAmount,
    getQtyAmountForUpdate,
    setQtyAmount,
    handleUpdateQuantity,
    handleDeleteItem,
  };
}
