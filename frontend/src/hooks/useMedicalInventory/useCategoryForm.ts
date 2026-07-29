import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  createCategory,
  updateCategory,
  deleteCategory
} from '../../api/medicalInventory';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { MIN_MUTATION_DELAY_SHORT } from '../../constants/mutations';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { SupplyCategory } from '../../types';

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string | null;
  [key: string]: unknown;
}

interface CategoryFormOptions {
  onSuccess?: () => void;
  userId?: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  parent_id: null
};

/**
 * Hook for managing category (folder) create/edit/delete form
 */
export function useCategoryForm({ onSuccess, userId }: CategoryFormOptions = {}) {
  const modal = useModalState();
  const deleteModal = useConfirmModal();

  // CRUD mutations with automatic cache invalidation
  const crud = useCRUDMutation({
    createFn: createCategory,
    updateFn: updateCategory,
    deleteFn: deleteCategory,
    queryKeys: [QUERY_KEYS.medicalInventory],
    userId: userId ?? '',
    minDelay: MIN_MUTATION_DELAY_SHORT
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    name: { required: 'Please enter a folder name' }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingCategory, setEditingCategory] = useState<SupplyCategory | null>(null);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingCategory(null);
    form.reset();
    validation.reset();
  }, [modal, form, validation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    crud.clearError();

    if (!validation.validateAll(form.values)) {
      return;
    }

    const categoryData = {
      name: form.values.name.trim(),
      description: form.values.description.trim() || null,
      parent_id: form.values.parent_id || null
    };

    try {
      await crud.save({
        data: categoryData,
        isEdit: !!editingCategory,
        entityId: editingCategory?.id
      });
      handleCloseForm();
      onSuccess?.();
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, editingCategory, crud, onSuccess, validation, handleCloseForm]);

  const handleEdit = useCallback((category: { id: string; name: string; [key: string]: unknown }) => {
    setEditingCategory(category as SupplyCategory);
    form.setValues({
      name: category.name || '',
      description: (category.description as string) || '',
      parent_id: (category.parent_id as string) || null
    });
    modal.open();
  }, [form, modal]);

  const openDeleteConfirm = useCallback((id: string, name: string) => {
    deleteModal.open(id, name);
  }, [deleteModal]);

  const closeDeleteConfirm = useCallback(() => {
    deleteModal.close();
  }, [deleteModal]);

  const confirmDeleteCategory = useCallback(async () => {
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
    editingCategory,
    loading: crud.saving,
    deleting: crud.deleting,
    error: crud.error,
    confirmDelete: {
      isOpen: deleteModal.isOpen,
      categoryId: deleteModal.itemId,
      categoryName: deleteModal.itemName
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
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteCategory
  };
}
