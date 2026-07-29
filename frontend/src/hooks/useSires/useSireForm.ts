import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSire, updateSire, deleteSire } from '../../api/sires';
import { uploadImage, deleteImage } from '../../api/storage';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useImageUpload } from '../useImageUpload';
import { useFormValidation } from '../useFormValidation';
import { useCRUDMutation } from '../useCRUDMutation';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Sire } from '../../types';

interface SireFormData {
  name: string;
  breed: string;
  registration_number: string;
  image_url: string;
  owner_type: string;
  customer_id: string | null;
  notes: string;
  available_for_sale: boolean;
  price_for_semen: string;
  price_for_sexed_semen: string;
  [key: string]: unknown;
}

interface SelectChangeEvent {
  target: { name: string; value: unknown };
  option?: unknown;
}

const initialFormData: SireFormData = {
  name: '',
  breed: '',
  registration_number: '',
  image_url: '',
  owner_type: 'internal',
  customer_id: null,
  notes: '',
  available_for_sale: false,
  price_for_semen: '',
  price_for_sexed_semen: ''
};

/**
 * Hook for managing sire create/edit form with image upload.
 */
export function useSireForm(onSuccess?: (data?: unknown) => void, userId?: string) {
  const queryClient = useQueryClient();
  const modal = useModalState();
  const deleteModal = useConfirmModal();
  const image = useImageUpload();

  // CRUD mutations with automatic cache invalidation
  const crud = useCRUDMutation({
    createFn: createSire,
    updateFn: updateSire,
    deleteFn: deleteSire,
    queryKeys: [QUERY_KEYS.sires, QUERY_KEYS.sireCount],
    userId: userId ?? ''
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    name: { required: 'Please enter a sire name' },
    breed: { required: 'Please enter a breed' },
    owner_type: { required: 'Please select an owner type' },
    customer_id: {
      requiredIf: { field: 'owner_type', value: 'customer', message: 'Please select a customer' }
    }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingSire, setEditingSire] = useState<Sire | null>(null);
  // Track selected customer for display in AsyncSearchableSelect
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);

  // Custom input handler to track customer selection
  const handleInputChange = useCallback((e: SelectChangeEvent) => {
    const { name } = e.target;

    // Track selected customer for AsyncSearchableSelect display
    if (name === 'customer_id' && e.option) {
      const option = e.option as { id: string; name: string };
      setSelectedCustomer(option);
    }

    form.handleChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
  }, [form]);

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingSire(null);
    setSelectedCustomer(null);
    form.reset();
    validation.reset();
    image.clearImage();
  }, [modal, form, validation, image]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    crud.clearError();

    if (!validation.validateAll(form.values)) {
      return;
    }

    // Sanitize form data - convert empty strings to null for numeric fields
    const sanitizedData = {
      ...form.values,
      price_for_semen: form.values.price_for_semen === '' ? null : form.values.price_for_semen,
      price_for_sexed_semen: form.values.price_for_sexed_semen === '' ? null : form.values.price_for_sexed_semen
    };

    try {
      const data = await crud.save({
        data: sanitizedData,
        isEdit: !!editingSire,
        entityId: editingSire?.id
      });

      // Handle image changes
      const sireData = data as { id: string } | null | undefined;
      if (sireData?.id) {
        // If there's a new image file, upload it
        if (image.hasNewImage) {
          const { url, error: uploadError } = await uploadImage(image.imageFile!, sireData.id);

          if (uploadError) {
            crud.setError('Sire saved but image upload failed: ' + uploadError.message);
          } else {
            await updateSire(sireData.id, { image_url: url }, '');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sires });
          }
        }
        // If user removed the image, delete it from storage and clear the URL
        else if (image.shouldRemoveImage && editingSire?.id) {
          await deleteImage(editingSire.id);
          await updateSire(sireData.id, { image_url: null }, '');
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sires });
        }
      }

      handleCloseForm();
      onSuccess?.(data);
    } catch {
      // Error already handled by mutation
    }
  }, [form.values, editingSire, crud, image, onSuccess, queryClient, validation, handleCloseForm]);

  const handleEdit = useCallback((sire: Sire) => {
    setEditingSire(sire);
    form.setValues({
      name: sire.name || '',
      breed: sire.breed || '',
      registration_number: sire.registration_number || '',
      image_url: sire.image_url || '',
      owner_type: sire.owner_type || 'internal',
      customer_id: sire.customer_id || null,
      notes: sire.notes || '',
      available_for_sale: sire.available_for_sale || false,
      price_for_semen: String(sire.price_for_semen ?? ''),
      price_for_sexed_semen: String(sire.price_for_sexed_semen ?? '')
    });
    if (sire.image_url) {
      image.setPreviewFromUrl(sire.image_url);
    }
    modal.open();
  }, [form, modal, image]);

  const handleOpenForm = useCallback(() => {
    setEditingSire(null);
    form.reset();
    image.clearImage();
    modal.open();
  }, [modal, form, image]);

  const openDeleteConfirm = useCallback((id: string, name: string) => {
    deleteModal.open(id, name);
  }, [deleteModal]);

  const closeDeleteConfirm = useCallback(() => {
    deleteModal.close();
  }, [deleteModal]);

  const confirmDeleteSire = useCallback(async () => {
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
    editingSire,
    selectedCustomer,
    imagePreview: image.imagePreview,
    loading: crud.saving,
    deleting: crud.deleting,
    error: crud.error,
    confirmDelete: {
      isOpen: deleteModal.isOpen,
      sireId: deleteModal.itemId,
      sireName: deleteModal.itemName
    },
    validation,

    // Setters (for backwards compatibility)
    setIsFormOpen: modal.setIsOpen,
    setFormData: form.setValues,
    setSelectedCustomer,

    // Handlers
    handleInputChange,
    handleImageChange: image.handleImageChange,
    handleRemoveImage: image.removeImage,
    handleSubmit,
    handleEdit,
    handleCloseForm,
    handleOpenForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteSire
  };
}
