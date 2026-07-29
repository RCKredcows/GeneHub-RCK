import { useState, useCallback } from 'react';

/**
 * Convert API/database errors to user-friendly messages
 */
export function formatErrorMessage(error: unknown): string {
  const message =
    (error instanceof Error ? error.message : null) ||
    (typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : null) ||
    (typeof error === 'string' ? error : null) ||
    'An error occurred';

  // Common Supabase/PostgreSQL errors
  const errorMap: Record<string, string> = {
    'duplicate key': 'This record already exists',
    'unique constraint': 'This record already exists',
    'foreign key constraint': 'Cannot complete this action - related records exist',
    'violates check constraint': 'Invalid data provided',
    'null value in column': 'Required information is missing',
    'permission denied': 'You do not have permission to perform this action',
    'JWT expired': 'Your session has expired. Please log in again',
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email address',
    'User already registered': 'An account with this email already exists',
    'Network request failed': 'Unable to connect. Please check your internet connection',
    'Failed to fetch': 'Unable to connect. Please check your internet connection',
    'timeout': 'Request timed out. Please try again',
  };

  // Check if message contains any known error patterns
  const lowerMessage = message.toLowerCase();
  for (const [pattern, friendlyMessage] of Object.entries(errorMap)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // If it's a technical message, provide a generic one
  if (message.includes('_') || message.includes('constraint') || message.includes('relation')) {
    return 'Unable to complete this action. Please try again';
  }

  return message;
}

interface AsyncOperationOptions {
  minDelay?: number;
}

interface ExecuteOptions {
  isDelete?: boolean;
}

interface ExecuteResult<T = unknown> {
  data: T | null;
  error: unknown;
}

/**
 * Hook for managing async operation state (loading, error, deleting).
 * Encapsulates the common pattern of tracking loading states and errors.
 */
export function useAsyncOperation(options: AsyncOperationOptions = {}) {
  const { minDelay = 0 } = options;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Execute an async function with loading state management.
   */
  const execute = useCallback(async <T = unknown>(
    asyncFn: () => Promise<T>,
    opts: ExecuteOptions = {}
  ): Promise<ExecuteResult<T>> => {
    const { isDelete = false } = opts;
    const setState = isDelete ? setDeleting : setLoading;

    setState(true);
    clearError();

    try {
      // Run in parallel: the async operation and the minimum delay
      const [result] = await Promise.all([
        asyncFn(),
        minDelay > 0 ? new Promise(resolve => setTimeout(resolve, minDelay)) : Promise.resolve()
      ]);

      // Handle Supabase-style { data, error } responses
      const resultObj = result as { data?: unknown; error?: unknown };
      if (resultObj && resultObj.error) {
        setError(formatErrorMessage(resultObj.error));
        setState(false);
        return { data: null, error: resultObj.error };
      }

      setState(false);
      return { data: (resultObj?.data ?? result) as T, error: null };
    } catch (err) {
      setError(formatErrorMessage(err));
      setState(false);
      return { data: null, error: err };
    }
  }, [minDelay, clearError]);

  /**
   * Execute an async function with loading state.
   */
  const executeLoad = useCallback(<T = unknown>(asyncFn: () => Promise<T>) => {
    return execute(asyncFn, { isDelete: false });
  }, [execute]);

  /**
   * Execute an async function with deleting state.
   */
  const executeDelete = useCallback(<T = unknown>(asyncFn: () => Promise<T>) => {
    return execute(asyncFn, { isDelete: true });
  }, [execute]);

  return {
    loading,
    deleting,
    error,
    setError,
    clearError,
    execute,
    executeLoad,
    executeDelete,
    setLoading,
    setDeleting
  };
}
