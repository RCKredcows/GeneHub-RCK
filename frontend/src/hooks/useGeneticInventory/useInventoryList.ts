import { useState, useMemo, useCallback } from 'react';
import { fetchGeneticInventoryPaginated } from '../../api/geneticInventory';
import { usePaginatedQuery } from '../usePaginatedQuery';
import { QUERY_KEYS } from '../../constants/queryKeys';

/**
 * Hook for managing inventory list data with React Query for caching and server-side pagination.
 */
export function useInventoryList(itemsPerPage = 25) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState('all');
  const [sexTypeFilter, setSexTypeFilter] = useState('all');
  const [ivfFilter, setIvfFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // Show all including checked_out

  // Wrapper to reset IVF filter when switching away from embryos
  const handleSetInventoryTypeFilter = useCallback((value: string) => {
    setInventoryTypeFilter(value);
    if (value !== 'embryo') {
      setIvfFilter('all');
    }
  }, []);

  // Memoize filters object
  const filters = useMemo(() => ({
    ownerFilter,
    inventoryType: inventoryTypeFilter,
    sexType: sexTypeFilter,
    ivfFilter,
    statusFilter
  }), [ownerFilter, inventoryTypeFilter, sexTypeFilter, ivfFilter, statusFilter]);

  // Paginated query for inventory
  const {
    data: inventory,
    totalCount,
    loading,
    isFetching,
    error,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPrevPage,
    refresh
  } = usePaginatedQuery({
    queryKey: QUERY_KEYS.geneticInventory,
    queryFn: async ({ offset, limit, search, ...filterParams }) => {
      return fetchGeneticInventoryPaginated({
        ownerType: filterParams.ownerFilter as string | undefined,
        inventoryType: filterParams.inventoryType as string | undefined,
        sexType: filterParams.sexType as string | undefined,
        ivfFilter: filterParams.ivfFilter as string | undefined,
        statusFilter: filterParams.statusFilter as string | undefined,
        searchQuery: search,
        limit,
        offset
      });
    },
    filters,
    searchQuery,
    itemsPerPage,
  });

  return {
    // Data
    inventory,
    rawInventory: inventory,
    loading,
    isFetching,
    error,

    // Pagination
    currentPage,
    totalPages,
    totalCount,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPrevPage,

    // Search
    searchQuery,
    setSearchQuery,

    // Filters
    ownerFilter,
    inventoryTypeFilter,
    sexTypeFilter,
    ivfFilter,
    statusFilter,
    setOwnerFilter,
    setInventoryTypeFilter: handleSetInventoryTypeFilter,
    setSexTypeFilter,
    setIvfFilter,
    setStatusFilter,

    // Actions
    refresh
  };
}
