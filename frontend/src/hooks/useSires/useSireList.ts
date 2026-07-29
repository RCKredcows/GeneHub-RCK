import { useState, useMemo } from 'react';
import { fetchSiresPaginated } from '../../api/sires';
import { usePaginatedQuery } from '../usePaginatedQuery';
import { QUERY_KEYS } from '../../constants/queryKeys';

/**
 * Hook for managing sire list data with React Query for caching and server-side pagination.
 */
export function useSireList(itemsPerPage = 25) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  // Memoize filters object
  const filters = useMemo(() => ({
    ownerFilter,
    availabilityFilter,
    priceFilter
  }), [ownerFilter, availabilityFilter, priceFilter]);

  // Paginated query for sires
  const {
    data: sires,
    totalCount,
    loading,
    isFetching,
    error: siresError,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPrevPage,
    refresh
  } = usePaginatedQuery({
    queryKey: QUERY_KEYS.sires,
    queryFn: async ({ offset, limit, search, ...filterParams }) => {
      return fetchSiresPaginated({
        ownerType: filterParams.ownerFilter as string | undefined,
        availabilityFilter: filterParams.availabilityFilter as string | undefined,
        priceFilter: filterParams.priceFilter as string | undefined,
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
    sires,
    loading,
    isFetching,
    error: siresError,

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
    availabilityFilter,
    priceFilter,
    setOwnerFilter,
    setAvailabilityFilter,
    setPriceFilter,

    // Actions
    refresh
  };
}
