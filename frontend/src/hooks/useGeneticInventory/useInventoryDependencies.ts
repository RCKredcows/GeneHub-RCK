import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCanistersByTank } from '../../api/geneticInventory';
import { fetchTanks } from '../../api/tanks';
import { QUERY_KEYS } from '../../constants/queryKeys';

/**
 * Hook for fetching inventory dependencies with React Query caching.
 * Sires and customers are loaded on-demand via AsyncSearchableSelect.
 * Handles the tank-to-canister dependency.
 */
export function useInventoryDependencies() {
  const queryClient = useQueryClient();
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);

  // Query for tanks
  const tanksQuery = useQuery({
    queryKey: QUERY_KEYS.tanks,
    queryFn: async () => {
      const { data, error } = await fetchTanks();
      if (error) throw error;
      return data || [];
    },
  });

  // Query for canisters based on selected tank
  const canistersQuery = useQuery({
    queryKey: QUERY_KEYS.canisters(selectedTankId ?? ''),
    queryFn: async () => {
      if (!selectedTankId) return [];
      const { data, error } = await fetchCanistersByTank(selectedTankId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTankId, // Only run when tank is selected
  });

  const clearCanisters = useCallback(() => {
    setSelectedTankId(null);
  }, []);

  const refreshTanks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
  }, [queryClient]);

  const refreshSires = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sires });
  }, [queryClient]);

  // Legacy function for compatibility - triggers canister fetch
  const fetchCanistersForTank = useCallback((tankId: string) => {
    setSelectedTankId(tankId);
  }, []);

  return {
    // State (customers and sires loaded on-demand via AsyncSearchableSelect)
    tanks: tanksQuery.data || [],
    canisters: canistersQuery.data || [],

    // Actions
    setSelectedTankId,
    fetchCanistersForTank,
    clearCanisters,
    refreshTanks,
    refreshSires
  };
}
