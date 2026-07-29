import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNitrogenFillHistory, getNitrogenConsumptionStats, clearNitrogenFillHistory, deleteNitrogenFillEvent } from '../../api/tanks';
import { useModalState } from '../useModalState';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Tank } from '../../types';

/**
 * Hook for managing tank detail view with fill history and consumption stats.
 */
export function useTankDetails() {
  const queryClient = useQueryClient();
  const modal = useModalState<Tank>();
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Query for fill history
  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.nitrogenFillHistory(selectedTank?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await getNitrogenFillHistory(selectedTank!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTank?.id && modal.isOpen,
  });

  // Query for consumption stats
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.nitrogenConsumptionStats(selectedTank?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await getNitrogenConsumptionStats(selectedTank!.id);
      if (error) throw error;
      return data || null;
    },
    enabled: !!selectedTank?.id && modal.isOpen,
  });

  const loadTankDetails = useCallback(async (tank: Tank) => {
    setSelectedTank(tank);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (!selectedTank) return;
    setConfirmClearHistory(true);
  }, [selectedTank]);

  const confirmClearHistoryAction = useCallback(async () => {
    if (!selectedTank) return;

    setClearingHistory(true);
    setConfirmClearHistory(false);
    const result = await clearNitrogenFillHistory(selectedTank.id);
    setClearingHistory(false);

    if (result.success) {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nitrogenFillHistory(selectedTank.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nitrogenConsumptionStats(selectedTank.id) });
    }
  }, [selectedTank, queryClient]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const tankId = selectedTank?.id;
    const result = await deleteNitrogenFillEvent(eventId);

    if (result.success && tankId) {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nitrogenFillHistory(tankId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nitrogenConsumptionStats(tankId) });
    }
  }, [selectedTank, queryClient]);

  const handleViewDetails = useCallback(async (tank: Tank) => {
    await loadTankDetails(tank);
    modal.open(tank);
  }, [loadTankDetails, modal]);

  const handleCloseDetails = useCallback(() => {
    modal.close();
    setSelectedTank(null);
  }, [modal]);

  // Utility functions
  const getNitrogenPercentage = useCallback((tank: Pick<Tank, 'nitrogen_level' | 'nitrogen_capacity'>): number | null => {
    if (!tank.nitrogen_level || !tank.nitrogen_capacity) return null;
    return (tank.nitrogen_level / tank.nitrogen_capacity) * 100;
  }, []);

  const isLowNitrogen = useCallback((tank: Pick<Tank, 'nitrogen_level' | 'nitrogen_capacity' | 'low_level_threshold'>): boolean => {
    if (!tank.low_level_threshold) return false;
    const percentage = getNitrogenPercentage(tank);
    return percentage !== null && percentage <= tank.low_level_threshold;
  }, [getNitrogenPercentage]);

  return {
    // State
    isDetailOpen: modal.isOpen,
    selectedTank,
    fillHistory: historyQuery.data || [],
    consumptionStats: statsQuery.data || null,
    clearingHistory,
    confirmClearHistory,

    // Handlers
    handleViewDetails,
    handleCloseDetails,
    handleClearHistory,
    handleDeleteEvent,
    confirmClearHistoryAction,
    setConfirmClearHistory,
    loadTankDetails,

    // Utilities
    getNitrogenPercentage,
    isLowNitrogen
  };
}
