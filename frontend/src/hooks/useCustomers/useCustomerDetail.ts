import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomerInventory } from '../../api/customers';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Customer } from '../../types';

/**
 * Hook for managing customer detail view.
 * Fetches customer inventory on demand when viewing a customer.
 */
export function useCustomerDetail() {
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Fetch inventory for the viewing customer on demand
  const inventoryQuery = useQuery({
    queryKey: QUERY_KEYS.customerInventory(viewingCustomer?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await fetchCustomerInventory(viewingCustomer!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!viewingCustomer?.id,
  });

  const handleViewCustomer = useCallback((customer: { id: string; name: string; [key: string]: unknown }) => {
    setViewingCustomer(customer as Customer);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingCustomer(null);
  }, []);

  return {
    // State
    viewingCustomer,
    customerInventory: inventoryQuery.data || [],
    inventoryLoading: inventoryQuery.isLoading,

    // Handlers
    handleViewCustomer,
    handleCloseView,
  };
}
