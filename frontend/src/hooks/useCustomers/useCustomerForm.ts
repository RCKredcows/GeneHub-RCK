import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { createCustomer, updateCustomer, deleteCustomer } from '../../api';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Customer } from '../../types';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  [key: string]: unknown;
}

const initialFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  notes: ''
};

/**
 * Hook for managing customer create/edit form.
 */
export function useCustomerForm(onSuccess?: (data?: unknown) => void, userId?: string) {
  const modal = useModalState();
  const deleteModal = useConfirmModal();

  // CRUD mutations with automatic cache invalidation
  const crud = useCRUDMutation({
    createFn: createCustomer,
    updateFn: updateCustomer,
    deleteFn: deleteCustomer,
    queryKeys: [QUERY_KEYS.customers, QUERY_KEYS.customersWithInventory, QUERY_KEYS.customerCount],
    userId: userId ?? ''
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    name: { required: 'Please enter a customer name' }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingCustomer(null);
    form.reset();
    validation.reset();
  }, [modal, form, validation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    crud.clearError();

    if (!validation.validateAll(form.values)) {
      return;
    }

    try {
      const data = await crud.save({
        data: form.values,
        isEdit: !!editingCustomer,
        entityId: editingCustomer?.id
      });

      handleCloseForm();
      onSuccess?.(data);
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, editingCustomer, crud, onSuccess, validation, handleCloseForm]);

  const handleEdit = useCallback((customer: { id: string; name: string; [key: string]: unknown }) => {
    const c = customer as Customer;
    setEditingCustomer(c);
    form.setValues({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      zip: c.zip || '',
      notes: c.notes || ''
    });
    modal.open();
  }, [form, modal]);

  const openDeleteConfirm = useCallback((id: string, name: string) => {
    deleteModal.open(id, name);
  }, [deleteModal]);

  const closeDeleteConfirm = useCallback(() => {
    deleteModal.close();
  }, [deleteModal]);

  const confirmDeleteCustomer = useCallback(async () => {
    try {
      await crud.remove({
        entityId: deleteModal.itemId!,
        entityName: deleteModal.itemName
      });
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
    deleteModal.close();
  }, [deleteModal, crud, onSuccess]);

  return {
    // State
    formData: form.values,
    isFormOpen: modal.isOpen,
    editingCustomer,
    loading: crud.saving,
    deleting: crud.deleting,
    error: crud.error,
    confirmDelete: {
      isOpen: deleteModal.isOpen,
      customerId: deleteModal.itemId,
      customerName: deleteModal.itemName
    },
    validation,

    // Setters (for backwards compatibility)
    setIsFormOpen: modal.setIsOpen,
    setFormData: form.setValues,

    // Handlers
    handleInputChange: form.handleChange,
    handleSubmit,
    handleEdit,
    handleCloseForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteCustomer
  };
}
