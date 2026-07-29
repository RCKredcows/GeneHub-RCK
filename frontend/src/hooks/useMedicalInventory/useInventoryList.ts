import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInventory as fetchInventoryAPI, updateInventoryItem } from '../../api/medicalInventory';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SupplyInventory, SupplyInventoryUpdate } from '../../types';

interface InventoryItemWithCategory extends SupplyInventory {
  category?: { id: string; name: string; parent_id: string | null } | null;
  [key: string]: unknown;
}

interface InlineUpdateVars {
  id: string;
  updates: SupplyInventoryUpdate;
}

interface InventoryCounts {
  total: number;
  lowStock: number;
  expiring: number;
  byCategory: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Hook for managing medical inventory list with React Query caching and filtering
 */
export function useInventoryList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState('all:name-asc'); // combined filter:sort

  // Parse combined filter:sort value
  const [stockFilter, sortBy] = useMemo(() => {
    const [filter, sort] = filterSort.split(':');
    return [filter || 'all', sort || 'name-asc'];
  }, [filterSort]);

  // Query for medical inventory
  const inventoryQuery = useQuery({
    queryKey: QUERY_KEYS.medicalInventory,
    queryFn: async () => {
      const { data, error } = await fetchInventoryAPI();
      if (error) throw error;
      return (data || []) as InventoryItemWithCategory[];
    },
  });

  const inventory = inventoryQuery.data || [];

  // Refresh with cache invalidation
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicalInventory });
  }, [queryClient]);

  // Inline update mutation for table edits (e.g., category changes)
  const inlineUpdateMutation = useMutation({
    mutationFn: async ({ id, updates }: InlineUpdateVars) => {
      const result = await updateInventoryItem(id, updates, '');
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicalInventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMedicalInventoryStats });
    }
  });

  const inlineUpdate = useCallback((id: string, updates: SupplyInventoryUpdate) => {
    return inlineUpdateMutation.mutateAsync({ id, updates });
  }, [inlineUpdateMutation]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        const itemName = (item.item_name || '').toLowerCase();
        const categoryName = (item.category?.name || '').toLowerCase();
        const supplier = (item.supplier_name || '').toLowerCase();
        return itemName.includes(query) ||
               categoryName.includes(query) ||
               supplier.includes(query);
      });
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter(item =>
        (item.reorder_threshold ?? 0) > 0 && item.quantity <= (item.reorder_threshold ?? 0)
      );
    } else if (stockFilter === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter(item => {
        if (!item.expiration_date) return false;
        const expDate = new Date(item.expiration_date);
        return expDate >= today && expDate <= thirtyDaysFromNow;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.item_name || '').localeCompare(b.item_name || '');
        case 'name-desc':
          return (b.item_name || '').localeCompare(a.item_name || '');
        case 'quantity-asc':
          return (a.quantity || 0) - (b.quantity || 0);
        case 'quantity-desc':
          return (b.quantity || 0) - (a.quantity || 0);
        case 'expiration-asc':
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime();
        case 'expiration-desc':
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return new Date(b.expiration_date!).getTime() - new Date(a.expiration_date!).getTime();
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [inventory, searchQuery, stockFilter, sortBy]);

  /**
   * Filter inventory by category IDs
   */
  const filterByCategory = useCallback((categoryIds: string[] | null) => {
    if (!categoryIds) return filteredInventory;
    return filteredInventory.filter(item =>
      item.category_id && categoryIds.includes(item.category_id)
    );
  }, [filteredInventory]);

  // Count items by status and by category
  const counts = useMemo((): InventoryCounts => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let lowStock = 0;
    let expiring = 0;
    const byCategory: Record<string, number> = {};

    inventory.forEach(item => {
      if ((item.reorder_threshold ?? 0) > 0 && item.quantity <= (item.reorder_threshold ?? 0)) {
        lowStock++;
      }
      if (item.expiration_date) {
        const expDate = new Date(item.expiration_date);
        if (expDate >= today && expDate <= thirtyDaysFromNow) {
          expiring++;
        }
      }
      // Count by category
      if (item.category_id) {
        byCategory[item.category_id] = (byCategory[item.category_id] || 0) + 1;
      }
    });

    return { total: inventory.length, lowStock, expiring, byCategory };
  }, [inventory]);

  return {
    // State
    inventory: filteredInventory,
    rawInventory: inventory,
    searchQuery,
    filterSort,
    counts,
    error: inventoryQuery.error?.message || '',
    loading: inventoryQuery.isLoading,
    updating: inlineUpdateMutation.isPending,

    // Setters
    setSearchQuery,
    setFilterSort,
    setError: () => {}, // No-op, errors come from queries

    // Actions
    refresh,
    filterByCategory,
    inlineUpdate
  };
}
