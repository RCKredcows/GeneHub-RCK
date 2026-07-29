import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../../api/medicalInventory';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { MIN_MUTATION_DELAY } from '../../constants/mutations';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SupplyInventory } from '../../types';

interface InventoryFormData {
  category_id: string | null;
  item_name: string;
  quantity: string;
  unit: string;
  reorder_threshold: string;
  expiration_date: string;
  cost_per_unit: string;
  supplier_name: string;
  supplier_contact: string;
  notes: string;
  [key: string]: unknown;
}

interface InventoryFormOptions {
  onSuccess?: () => void;
  userId?: string;
}

const initialFormData: InventoryFormData = {
  category_id: null,
  item_name: '',
  quantity: '',
  unit: 'units',
  reorder_threshold: '',
  expiration_date: '',
  cost_per_unit: '',
  supplier_name: '',
  supplier_contact: '',
  notes: ''
};

/**
 * Hook for managing inventory item create/edit/delete form
 */
export function useInventoryForm({ onSuccess, userId }: InventoryFormOptions = {}) {
  const modal = useModalState();
  const deleteModal = useConfirmModal();

  // CRUD mutations with automatic cache invalidation
  const crud = useCRUDMutation({
    createFn: createInventoryItem,
    updateFn: updateInventoryItem,
    deleteFn: deleteInventoryItem,
    queryKeys: [QUERY_KEYS.medicalInventory, QUERY_KEYS.allMedicalInventoryStats],
    userId: userId ?? '',
    minDelay: MIN_MUTATION_DELAY
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    item_name: { required: 'Please enter an item name' },
    quantity: { required: 'Please enter a quantity', min: { value: 0, message: 'Quantity cannot be negative' } }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingItem, setEditingItem] = useState<SupplyInventory | null>(null);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingItem(null);
    form.reset();
    validation.reset();
  }, [modal, form, validation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    crud.clearError();

    if (!validation.validateAll(form.values)) {
      return;
    }

    const itemData = {
      category_id: form.values.category_id || null,
      item_name: form.values.item_name.trim(),
      quantity: parseFloat(form.values.quantity) || 0,
      unit: form.values.unit.trim() || 'units',
      reorder_threshold: parseFloat(form.values.reorder_threshold) || 0,
      expiration_date: form.values.expiration_date || null,
      cost_per_unit: form.values.cost_per_unit ? parseFloat(form.values.cost_per_unit) : null,
      supplier_name: form.values.supplier_name.trim() || null,
      supplier_contact: form.values.supplier_contact.trim() || null,
      notes: form.values.notes.trim() || null
    };

    try {
      await crud.save({
        data: itemData,
        isEdit: !!editingItem,
        entityId: editingItem?.id
      });
      handleCloseForm();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, editingItem, crud, onSuccess, validation, handleCloseForm]);

  const handleEdit = useCallback((item: { id: string; item_name: string; [key: string]: unknown }) => {
    const typedItem = item as SupplyInventory;
    setEditingItem(typedItem);
    form.setValues({
      category_id: typedItem.category_id || null,
      item_name: typedItem.item_name || '',
      quantity: typedItem.quantity?.toString() || '',
      unit: typedItem.unit || 'units',
      reorder_threshold: typedItem.reorder_threshold?.toString() || '',
      expiration_date: typedItem.expiration_date || '',
      cost_per_unit: typedItem.cost_per_unit?.toString() || '',
      supplier_name: typedItem.supplier_name || '',
      supplier_contact: typedItem.supplier_contact || '',
      notes: typedItem.notes || ''
    });
    modal.open();
  }, [form, modal]);

  // Open form for creating in a specific category
  const openFormForCategory = useCallback((categoryId: string) => {
    form.setValues({
      ...initialFormData,
      category_id: categoryId
    });
    modal.open();
  }, [form, modal]);

  const openDeleteConfirm = useCallback((id: string, name: string) => {
    deleteModal.open(id, name);
  }, [deleteModal]);

  const closeDeleteConfirm = useCallback(() => {
    deleteModal.close();
  }, [deleteModal]);

  const confirmDeleteItem = useCallback(async () => {
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
    editingItem,
    loading: crud.saving,
    deleting: crud.deleting,
    error: crud.error,
    confirmDelete: {
      isOpen: deleteModal.isOpen,
      itemId: deleteModal.itemId,
      itemName: deleteModal.itemName
    },
    validation,

    // Setters
    setIsFormOpen: modal.setIsOpen,
    setFormData: form.setValues,

    // Handlers
    handleInputChange: form.handleChange,
    handleSubmit,
    handleEdit,
    handleCloseForm,
    openFormForCategory,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteItem
  };
}
