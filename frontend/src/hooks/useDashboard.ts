import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTanks } from '../api/tanks';
import { fetchInventoryCounts } from '../api/geneticInventory';
import { fetchSireCount } from '../api/sires';
import { fetchCustomerCount } from '../api/customers';
import { fetchMedicalInventoryStats } from '../api/medicalInventory';
import { QUERY_KEYS } from '../constants/queryKeys';
import type { Tank } from '../types';

interface DashboardOptions {
  expirationWarningDays?: number;
}

interface InventoryCounts {
  total: number;
  semen: number;
  embryo: number;
  customerOwned: number;
}

interface MedicalStats {
  total: number;
  lowStock: number;
  expiring: number;
}

/**
 * Hook for fetching all dashboard data using React Query.
 * Uses parallel queries for optimal performance.
 */
export function useDashboard({ expirationWarningDays = 30 }: DashboardOptions = {}) {
  // Fetch tanks
  const tanksQuery = useQuery({
    queryKey: QUERY_KEYS.tanks,
    queryFn: async () => {
      const { data, error } = await fetchTanks();
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch inventory counts
  const inventoryCountsQuery = useQuery({
    queryKey: QUERY_KEYS.geneticInventoryCounts,
    queryFn: async () => {
      const { counts, error } = await fetchInventoryCounts();
      if (error) throw error;
      return counts || { total: 0, semen: 0, embryo: 0, customerOwned: 0 };
    },
  });

  // Fetch sire count
  const sireCountQuery = useQuery({
    queryKey: QUERY_KEYS.sireCount,
    queryFn: async () => {
      const { count, error } = await fetchSireCount();
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch customer count
  const customerCountQuery = useQuery({
    queryKey: QUERY_KEYS.customerCount,
    queryFn: async () => {
      const { count, error } = await fetchCustomerCount();
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch medical inventory stats (counts only)
  const medicalStatsQuery = useQuery({
    queryKey: QUERY_KEYS.medicalInventoryStats(expirationWarningDays),
    queryFn: async () => {
      const { stats, error } = await fetchMedicalInventoryStats(expirationWarningDays);
      if (error) throw error;
      return stats;
    },
  });

  // Combined loading state - true if any query is loading
  const loading = tanksQuery.isLoading ||
    inventoryCountsQuery.isLoading ||
    sireCountQuery.isLoading ||
    customerCountQuery.isLoading ||
    medicalStatsQuery.isLoading;

  // Combined data
  const tanks = (tanksQuery.data || []) as Tank[];
  const inventoryCounts = (inventoryCountsQuery.data || { total: 0, semen: 0, embryo: 0, customerOwned: 0 }) as InventoryCounts;
  const sireCount = (sireCountQuery.data || 0) as number;
  const customerCount = (customerCountQuery.data || 0) as number;
  const medicalStats = (medicalStatsQuery.data || { total: 0, lowStock: 0, expiring: 0 }) as MedicalStats;

  // Calculate derived stats
  const lowNitrogenTanks = useMemo(() =>
    tanks.filter(tank => {
      if (!tank.nitrogen_level || !tank.nitrogen_capacity) return false;
      const percentage = (tank.nitrogen_level / tank.nitrogen_capacity) * 100;
      return percentage <= (tank.low_level_threshold || 25);
    }),
    [tanks]
  );

  // Combined error
  const error = tanksQuery.error?.message ||
    inventoryCountsQuery.error?.message ||
    sireCountQuery.error?.message ||
    customerCountQuery.error?.message ||
    medicalStatsQuery.error?.message ||
    '';

  return {
    // Loading state
    loading,

    // Data
    tanks,
    inventoryCounts,
    sireCount,
    customerCount,

    // Derived stats
    lowNitrogenTanks,
    medicalStats,

    // Error
    error,

    // Individual query states (for granular loading indicators if needed)
    queries: {
      tanks: tanksQuery,
      inventoryCounts: inventoryCountsQuery,
      sireCount: sireCountQuery,
      customerCount: customerCountQuery,
      medicalStats: medicalStatsQuery,
    }
  };
}
