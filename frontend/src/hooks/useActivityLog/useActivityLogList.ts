import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivityLog } from '../../api';
import { QUERY_KEYS } from '../../constants/queryKeys';

const DEFAULT_ITEMS_PER_PAGE = 25;

const ENTITY_ROUTES: Record<string, string> = {
  customer: '/customers',
  sire: '/sires',
  tank: '/tanks',
  canister: '/tanks',
  genetic_inventory: '/genetic-inventory',
  medical_inventory: '/medical-inventory',
  medical_category: '/medical-inventory'
};

const ACTION_LABELS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted'
};

const ENTITY_LABELS: Record<string, string> = {
  customer: 'Customer',
  sire: 'Sire',
  tank: 'Tank',
  canister: 'Canister',
  genetic_inventory: 'Genetic Inventory',
  medical_inventory: 'Medical Item',
  medical_category: 'Medical Category'
};

interface ActivityFilters {
  entityType: string;
  actionType: string;
  [key: string]: unknown;
}

export function useActivityLogList(itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({
    entityType: '',
    actionType: ''
  });

  // Query for activity log
  const activityQuery = useQuery({
    queryKey: [...QUERY_KEYS.activityLog, {
      page: currentPage,
      limit: itemsPerPage,
      entityType: filters.entityType,
      actionType: filters.actionType
    }],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const { data, count, error } = await fetchActivityLog({
        entityType: filters.entityType || undefined,
        actionType: filters.actionType || undefined,
        limit: itemsPerPage,
        offset
      });

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
  });

  const totalCount = activityQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleSetFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activityLog });
  }, [queryClient]);

  const getEntityLink = useCallback((entityType: string, entityId: string) => {
    const baseRoute = ENTITY_ROUTES[entityType];
    if (!baseRoute) return null;

    if (['customer', 'sire', 'tank'].includes(entityType)) {
      return `${baseRoute}?id=${entityId}`;
    }

    return baseRoute;
  }, []);

  const formatActionLabel = useCallback((action: string, entityType: string) => {
    return `${ACTION_LABELS[action] || action} ${ENTITY_LABELS[entityType] || entityType}`;
  }, []);

  return {
    activities: activityQuery.data?.data || [],
    totalCount,
    loading: activityQuery.isLoading,
    isFetching: activityQuery.isFetching,
    error: activityQuery.error?.message || '',
    filters,
    currentPage,
    totalPages,
    setFilters: handleSetFilters,
    refresh,
    goToPage,
    getEntityLink,
    formatActionLabel
  };
}
