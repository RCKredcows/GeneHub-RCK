import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

interface PaginatedQueryOptions<T> {
  queryKey: readonly unknown[];
  queryFn: (params: { offset: number; limit: number; search: string } & Record<string, unknown>) => Promise<{ data: T[] | null; count: number; error?: unknown }>;
  filters?: Record<string, unknown>;
  searchQuery?: string;
  itemsPerPage?: number;
  debounceMs?: number;
}

/**
 * Shared hook for server-side paginated queries with React Query.
 * Handles pagination state, debounced search, and page reset on filter changes.
 */
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  filters = {},
  searchQuery = '',
  itemsPerPage = 25,
  debounceMs = 300,
}: PaginatedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, debounceMs);

  // Create stable filter key for dependency tracking
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Reset to page 1 when filters or search change (render-time state adjustment)
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevSearch !== debouncedSearch || prevFilterKey !== filterKey) {
    setPrevSearch(debouncedSearch);
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Build query key with all parameters
  const fullQueryKey = useMemo(() => [
    ...queryKey,
    {
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch,
      ...filters
    }
  ], [queryKey, currentPage, itemsPerPage, debouncedSearch, filters]);

  // Query with pagination
  const query = useQuery({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const result = await queryFn({
        offset,
        limit: itemsPerPage,
        search: debouncedSearch,
        ...filters
      });

      if (result.error) throw result.error;
      return { data: result.data || [], count: result.count || 0 };
    },
    placeholderData: (previousData) => previousData,
  });

  // Calculate pagination values
  const totalCount = query.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Refresh function - invalidates base query key (all paginated variants)
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    // Data
    data: query.data?.data || [] as T[],
    totalCount,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || '',

    // Pagination
    currentPage,
    totalPages,
    startIndex,
    endIndex,

    // Navigation
    goToPage,
    goToNextPage,
    goToPrevPage,

    // Actions
    refresh,
  };
}
