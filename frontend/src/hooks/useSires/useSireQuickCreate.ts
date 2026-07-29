import { useCallback } from 'react';
import { useCustomerForm } from '../useCustomers/useCustomerForm';
import type { useSireForm } from './useSireForm';

type SireFormRef = Pick<ReturnType<typeof useSireForm>, 'setFormData' | 'setSelectedCustomer'>;

interface SireQuickCreateOptions {
  sireForm: SireFormRef;
  userId?: string;
}

/**
 * Quick create customer hook for Sires page.
 * Auto-selects the new customer in the sire form after creation.
 */
export function useSireQuickCreate({ sireForm, userId }: SireQuickCreateOptions) {
  const handleCustomerCreated = useCallback((newCustomer?: unknown) => {
    const customer = newCustomer as { id: string; name: string } | null | undefined;
    if (customer?.id) {
      sireForm.setFormData(prev => ({ ...prev, customer_id: customer.id }));
      sireForm.setSelectedCustomer(customer);
    }
  }, [sireForm]);

  const customerForm = useCustomerForm(handleCustomerCreated, userId);

  const openCustomerForm = useCallback(() => {
    customerForm.setIsFormOpen(true);
  }, [customerForm]);

  return {
    openCustomerForm,
    customer: {
      isOpen: customerForm.isFormOpen,
      formData: customerForm.formData,
      loading: customerForm.loading,
      error: customerForm.error,
      validation: customerForm.validation,
      onInputChange: customerForm.handleInputChange,
      onSubmit: customerForm.handleSubmit,
      onClose: customerForm.handleCloseForm,
    }
  };
}
