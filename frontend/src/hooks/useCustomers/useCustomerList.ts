import { useState, useMemo } from 'react';
import { fetchCustomersPaginated } from '../../api/customers';
import { usePaginatedQuery } from '../usePaginatedQuery';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SearchCustomerResult } from '../../types';

type CustomerListItem = Omit<SearchCustomerResult, 'total_count'>;

/**
 * Hook for managing customer list data with React Query caching and server-side pagination.
 */
export function useCustomerList(itemsPerPage = 25) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  // Memoize filters object
  const filters = useMemo(() => ({
    sortBy
  }), [sortBy]);

  // Paginated query for customers
  const {
    data: customers,
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
  } = usePaginatedQuery<CustomerListItem>({
    queryKey: QUERY_KEYS.customers,
    queryFn: async ({ offset, limit, search, ...filterParams }) => {
      return fetchCustomersPaginated({
        searchQuery: search,
        sortBy: filterParams.sortBy as string | undefined,
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
    customers,
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

    // Sort
    sortBy,
    setSortBy,

    // Actions
    refresh,
    setError: () => {}, // No-op, errors come from queries
  };
}
