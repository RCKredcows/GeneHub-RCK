import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { fetchTanks as fetchTanksAPI } from '../../api/tanks';
import { fetchCanistersByTank, fetchInventoryByCanister } from '../../api/geneticInventory';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { TankWithCount, CanisterWithCount, GeneticInventoryItem } from '../../types';

/**
 * Hook for managing tank list data, canisters, and inventory with React Query caching.
 */

// Helper to calculate nitrogen percentage
const getNitrogenPercentage = (tank: TankWithCount): number | null => {
  if (!tank.nitrogen_level || !tank.nitrogen_capacity) return null;
  return (tank.nitrogen_level / tank.nitrogen_capacity) * 100;
};

// Helper to check if tank has low nitrogen
const isLowNitrogen = (tank: TankWithCount): boolean => {
  const percentage = getNitrogenPercentage(tank);
  if (percentage === null || !tank.low_level_threshold) return false;
  return percentage <= tank.low_level_threshold;
};

export function useTankList() {
  const queryClient = useQueryClient();

  // Track which tanks/canisters have been expanded (for on-demand fetching)
  const [expandedTankIds, setExpandedTankIds] = useState<string[]>([]);
  const [expandedCanisterIds, setExpandedCanisterIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [filterBy, setFilterBy] = useState('all');

  // Query for tanks only - no inventory fetch on page load
  const tanksQuery = useQuery({
    queryKey: QUERY_KEYS.tanks,
    queryFn: async () => {
      const { data, error } = await fetchTanksAPI();
      if (error) throw error;
      return data || [];
    },
  });

  const tanks = tanksQuery.data || [];

  // Canister queries - React Query manages fetching/caching/refetching
  const canisterQueries = useQueries({
    queries: expandedTankIds.map(tankId => ({
      queryKey: QUERY_KEYS.canisters(tankId),
      queryFn: async () => {
        const { data, error } = await fetchCanistersByTank(tankId);
        if (error) throw error;
        return data || [];
      },
      staleTime: 30000, // Consider data fresh for 30 seconds
    })),
  });

  // Derive canisters object from query results
  const canisters = useMemo(() => {
    const result: Record<string, CanisterWithCount[]> = {};
    expandedTankIds.forEach((tankId, index) => {
      const query = canisterQueries[index];
      if (query?.data) {
        result[tankId] = query.data;
      }
    });
    return result;
  }, [canisterQueries, expandedTankIds]);

  // Canister inventory queries - React Query manages fetching/caching/refetching
  const inventoryQueries = useQueries({
    queries: expandedCanisterIds.map(canisterId => ({
      queryKey: QUERY_KEYS.canisterInventory(canisterId),
      queryFn: async () => {
        const { data, error } = await fetchInventoryByCanister(canisterId);
        if (error) throw error;
        return data || [];
      },
      staleTime: 30000,
    })),
  });

  // Derive canisterInventory object from query results
  const canisterInventory = useMemo(() => {
    const result: Record<string, GeneticInventoryItem[]> = {};
    expandedCanisterIds.forEach((canisterId, index) => {
      const query = inventoryQueries[index];
      if (query?.data) {
        result[canisterId] = query.data;
      }
    });
    return result;
  }, [inventoryQueries, expandedCanisterIds]);

  // Filtered and sorted tanks (client-side)
  const filteredTanks = useMemo(() => {
    let result = [...tanks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tank => {
        const tankName = tank.tank_name?.toLowerCase() || '';
        const location = tank.location?.toLowerCase() || '';
        return tankName.includes(query) || location.includes(query);
      });
    }

    // Apply filter
    if (filterBy === 'low_nitrogen') {
      result = result.filter(tank => isLowNitrogen(tank));
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => (a.tank_name || '').localeCompare(b.tank_name || ''));
        break;
      case 'name_desc':
        result.sort((a, b) => (b.tank_name || '').localeCompare(a.tank_name || ''));
        break;
      case 'nitrogen_low':
        result.sort((a, b) => {
          const aPerc = getNitrogenPercentage(a) ?? 999;
          const bPerc = getNitrogenPercentage(b) ?? 999;
          return aPerc - bPerc;
        });
        break;
      case 'nitrogen_high':
        result.sort((a, b) => {
          const aPerc = getNitrogenPercentage(a) ?? -1;
          const bPerc = getNitrogenPercentage(b) ?? -1;
          return bPerc - aPerc;
        });
        break;
      case 'last_filled':
        result.sort((a, b) => {
          const aDate = a.last_filled_date ? new Date(a.last_filled_date) : new Date(0);
          const bDate = b.last_filled_date ? new Date(b.last_filled_date) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        break;
      case 'position':
      default:
        result.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
        break;
    }

    return result;
  }, [tanks, searchQuery, sortBy, filterBy]);

  // Fetch canisters for a specific tank - adds to expanded list, React Query handles the rest
  const fetchCanistersForTank = useCallback((tankId: string) => {
    setExpandedTankIds(prev => {
      // Only add if not already in the list
      if (prev.includes(tankId)) return prev;
      return [...prev, tankId];
    });
  }, []);

  // Fetch inventory for a specific canister - adds to expanded list, React Query handles the rest
  const fetchInventoryForCanister = useCallback((canisterId: string) => {
    setExpandedCanisterIds(prev => {
      if (prev.includes(canisterId)) return prev;
      return [...prev, canisterId];
    });
  }, []);

  // Get inventory for a canister (from cache or empty)
  const getInventoryForCanister = useCallback((canisterId: string) => {
    return canisterInventory[canisterId] || [];
  }, [canisterInventory]);

  // Get inventory count for a canister (from canister data)
  const getInventoryCountForCanister = useCallback((canisterId: string) => {
    // Look through all cached canisters to find this one
    for (const tankCanisters of Object.values(canisters)) {
      const canister = tankCanisters.find(c => c.id === canisterId);
      if (canister) {
        return canister.inventory_count || 0;
      }
    }
    return 0;
  }, [canisters]);

  // Refresh functions
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
  }, [queryClient]);

  const refreshInventory = useCallback(() => {
    // Invalidate all canister inventory caches (use base key to match all parameterized queries)
    queryClient.invalidateQueries({ queryKey: ['canisterInventory'] });
    // Also refresh canister counts for all expanded tanks
    expandedTankIds.forEach(tankId => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canisters(tankId) });
    });
  }, [queryClient, expandedTankIds]);

  const refreshCanisterInventory = useCallback((canisterId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canisterInventory(canisterId) });
  }, [queryClient]);

  return {
    // State
    tanks,
    filteredTanks,
    canisters,
    searchQuery,
    sortBy,
    filterBy,
    error: tanksQuery.error?.message || '',
    loading: tanksQuery.isLoading,

    // Setters
    setSearchQuery,
    setSortBy,
    setFilterBy,
    setError: () => {}, // No-op, errors come from queries

    // Actions
    refresh,
    fetchCanistersForTank,
    fetchInventoryForCanister,
    getInventoryForCanister,
    getInventoryCountForCanister,
    refreshInventory,
    refreshCanisterInventory
  };
}
