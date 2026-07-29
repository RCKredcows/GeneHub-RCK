import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatErrorMessage } from './useAsyncOperation';
import { MIN_MUTATION_DELAY } from '../constants/mutations';

interface SaveMutationVariables {
  data: unknown;
  isEdit: boolean;
  entityId?: string;
  entityName?: string;
}

interface DeleteMutationVariables {
  entityId: string;
  entityName?: string;
}

type QueryKeyItem = string | readonly unknown[];

type MutationAsyncFn = (...args: any[]) => Promise<{ data?: unknown; error?: unknown; success?: boolean }>;

interface CRUDMutationOptions {
  createFn: MutationAsyncFn;
  updateFn: MutationAsyncFn;
  deleteFn: MutationAsyncFn;
  queryKeys?: QueryKeyItem[];
  userId: string;
  minDelay?: number;
  optimisticDelete?: boolean;
  listQueryKey?: QueryKeyItem | null;
  entityIdField?: string;
}

/**
 * Generic hook for CRUD mutations with consistent error handling,
 * loading states, cache invalidation, and optional optimistic updates.
 */
export function useCRUDMutation({
  createFn,
  updateFn,
  deleteFn,
  queryKeys = [],
  userId,
  minDelay = MIN_MUTATION_DELAY,
  optimisticDelete = false,
  listQueryKey = null,
  entityIdField = 'id'
}: CRUDMutationOptions) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  // Invalidate all related queries
  const invalidateQueries = useCallback(() => {
    queryKeys.forEach(key => {
      // Handle both string keys and array keys (QUERY_KEYS constants)
      const queryKey = typeof key === 'string' ? [key] : key;
      queryClient.invalidateQueries({ queryKey: queryKey as readonly unknown[] });
    });
  }, [queryClient, queryKeys]);

  // Save mutation (create or update)
  const saveMutation = useMutation({
    mutationFn: async ({ data, isEdit, entityId, entityName }: SaveMutationVariables) => {
      const [result] = await Promise.all([
        isEdit
          ? updateFn(entityId!, data, userId, entityName)
          : createFn(data, userId, entityName),
        new Promise(resolve => setTimeout(resolve, minDelay))
      ]);

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: invalidateQueries,
    onError: (err: unknown) => setError(formatErrorMessage(err))
  });

  // Resolve list query key to array form
  const resolvedListQueryKey = listQueryKey
    ? (Array.isArray(listQueryKey) ? listQueryKey : [listQueryKey]) as readonly unknown[]
    : null;

  // Delete mutation with optional optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async ({ entityId, entityName }: DeleteMutationVariables) => {
      const [result] = await Promise.all([
        deleteFn(entityId, userId, entityName),
        new Promise(resolve => setTimeout(resolve, minDelay))
      ]);

      if (result.error) throw result.error;
      return result;
    },
    // Optimistic update: remove item from cache before API call completes
    onMutate: optimisticDelete && resolvedListQueryKey ? async ({ entityId }: DeleteMutationVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: resolvedListQueryKey! });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(resolvedListQueryKey!);

      // Optimistically update the cache
      queryClient.setQueryData(
        resolvedListQueryKey!,
        (old: unknown) => {
          if (!old) return old;
          // Handle both array and { data: [], count } formats
          if (Array.isArray(old)) {
            return old.filter((item: unknown) => (item as Record<string, unknown>)[entityIdField] !== entityId);
          }
          const oldObj = old as { data?: unknown[]; count?: number };
          if (oldObj.data && Array.isArray(oldObj.data)) {
            return {
              ...oldObj,
              data: oldObj.data.filter((item: unknown) => (item as Record<string, unknown>)[entityIdField] !== entityId),
              count: Math.max(0, (oldObj.count || 0) - 1)
            };
          }
          return old;
        }
      );

      // Return context with previous data for rollback
      return { previousData };
    } : undefined,
    // Rollback on error
    onError: (err: unknown, _variables: DeleteMutationVariables, context?: { previousData?: unknown }) => {
      setError(formatErrorMessage(err));
      // Restore previous data if we have it
      if (context?.previousData && resolvedListQueryKey) {
        queryClient.setQueryData(resolvedListQueryKey, context.previousData);
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: invalidateQueries
  });

  // Wrapper for save that clears error first
  const save = useCallback(async ({ data, isEdit, entityId, entityName }: SaveMutationVariables) => {
    clearError();
    return saveMutation.mutateAsync({ data, isEdit, entityId, entityName });
  }, [saveMutation, clearError]);

  // Wrapper for delete that clears error first
  const remove = useCallback(async ({ entityId, entityName }: DeleteMutationVariables) => {
    clearError();
    return deleteMutation.mutateAsync({ entityId, entityName });
  }, [deleteMutation, clearError]);

  return {
    // State
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    error,

    // Actions
    save,
    remove,
    clearError,
    setError,

    // Raw mutations (for advanced use cases)
    saveMutation,
    deleteMutation,
    invalidateQueries
  };
}

interface SimpleMutationOptions<TParams = unknown> {
  mutationFn: (params: TParams) => Promise<{ data?: unknown; error?: unknown }>;
  queryKeys?: QueryKeyItem[];
  minDelay?: number;
}

/**
 * Simplified hook for mutations that only need save (no delete).
 * Useful for usage logs, restocking, etc.
 */
export function useSimpleMutation<TParams = unknown>({
  mutationFn,
  queryKeys = [],
  minDelay = MIN_MUTATION_DELAY
}: SimpleMutationOptions<TParams>) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const invalidateQueries = useCallback(() => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key as readonly unknown[] : [key] });
    });
  }, [queryClient, queryKeys]);

  const mutation = useMutation({
    mutationFn: async (params: TParams) => {
      const [result] = await Promise.all([
        mutationFn(params),
        new Promise(resolve => setTimeout(resolve, minDelay))
      ]);

      if (result?.error) throw result.error;
      return result?.data ?? result;
    },
    onSuccess: invalidateQueries,
    onError: (err: unknown) => setError(formatErrorMessage(err))
  });

  const execute = useCallback(async (params: TParams) => {
    clearError();
    return mutation.mutateAsync(params);
  }, [mutation, clearError]);

  return {
    loading: mutation.isPending,
    error,
    execute,
    clearError,
    setError,
    mutation,
    invalidateQueries
  };
}
