import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTank, updateTank, deleteTank as deleteTankAPI, normalizeTankPositions, updateTankPosition, insertTankAtPosition } from '../../api/tanks';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useConfirmModal } from '../useConfirmModal';
import { useFormValidation } from '../useFormValidation';
import { formatErrorMessage } from '../useAsyncOperation';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Tank, TankInsert } from '../../types';

interface TankFormData {
  tank_name: string;
  location: string;
  capacity: string;
  nitrogen_capacity: string;
  nitrogen_level: string;
  nitrogen_unit: string;
  low_level_threshold: string;
  sort_order: string;
  notes: string;
  [key: string]: unknown;
}

interface SaveMutationVars {
  tankData: TankInsert;
  isEdit: boolean;
  tank: Tank | null;
  positionChanged: boolean;
  userSpecifiedPosition: boolean;
}

interface DeleteMutationVars {
  tankId: string;
  tankName: string;
}

const initialFormData: TankFormData = {
  tank_name: '',
  location: '',
  capacity: '',
  nitrogen_capacity: '',
  nitrogen_level: '',
  nitrogen_unit: 'liters',
  low_level_threshold: '',
  sort_order: '',
  notes: ''
};

/**
 * Hook for managing tank create/edit form and deletion.
 */
export function useTankForm(
  onSuccess?: (data?: unknown) => void,
  tanks: Array<{ id: string; sort_order?: number | null }> = [],
  userId: string | null = null
) {
  const queryClient = useQueryClient();
  const modal = useModalState();
  const deleteModal = useConfirmModal();
  const [error, setError] = useState('');

  // Validation rules
  const validationRules = useMemo(() => ({
    tank_name: { required: 'Please enter a tank name' }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFormData, { validation });
  const [editingTank, setEditingTank] = useState<Tank | null>(null);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async ({ tankData, isEdit, tank, positionChanged, userSpecifiedPosition }: SaveMutationVars) => {
      let savedTank;

      if (isEdit) {
        // If position changed, handle swap via RPC
        if (positionChanged && tank) {
          await updateTankPosition(tank.id, tankData.sort_order as number, tank.sort_order ?? undefined);
        }
        // Update tank data (sort_order already handled if position changed)
        const dataToUpdate = positionChanged
          ? { ...tankData, sort_order: undefined }
          : tankData;
        savedTank = await updateTank(tank!.id, dataToUpdate, userId, tank);

        // Normalize if position didn't change (updateTankPosition already normalizes)
        if (!positionChanged && !savedTank.error) {
          await normalizeTankPositions();
        }
      } else {
        // If creating with a specific position, shift others first
        if (userSpecifiedPosition) {
          await insertTankAtPosition(tankData.sort_order as number);
        }
        savedTank = await createTank(tankData, userId);
        // Normalize after create if no specific position (insertTankAtPosition already normalizes)
        if (!userSpecifiedPosition && !savedTank.error) {
          await normalizeTankPositions();
        }
      }

      if (savedTank.error) throw savedTank.error;
      return savedTank.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
    },
    onError: (err: unknown) => {
      setError(formatErrorMessage(err));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ tankId, tankName }: DeleteMutationVars) => {
      const result = await deleteTankAPI(tankId, false, userId, tankName);
      if (result.error) throw result.error;
      // Normalize positions after delete (single RPC call)
      await normalizeTankPositions();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
    },
    onError: (err: unknown) => {
      setError(formatErrorMessage(err));
    }
  });

  const handleCloseForm = useCallback(() => {
    modal.close();
    setEditingTank(null);
    form.reset();
    validation.reset();
    setError('');
  }, [modal, form, validation, setError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!validation.validateAll(form.values)) {
      return;
    }

    // Parse and validate sort_order
    let sortOrder: number | null = null;
    if (form.values.sort_order) {
      const parsed = parseInt(form.values.sort_order);
      if (parsed < 1) {
        setError('Tank position must be 1 or greater');
        return;
      }
      sortOrder = parsed;
    } else {
      // Auto-assign next position if no position specified (new or edited)
      // Exclude current tank when calculating max to avoid incrementing past itself
      const otherTanks = editingTank ? tanks.filter(t => t.id !== editingTank.id) : tanks;
      const maxOrder = otherTanks.reduce((max, t) => Math.max(max, t.sort_order || 0), 0);
      sortOrder = maxOrder + 1;
    }

    const tankData = {
      tank_name: form.values.tank_name,
      location: form.values.location || null,
      capacity: form.values.capacity ? parseInt(form.values.capacity) : null,
      nitrogen_capacity: form.values.nitrogen_capacity ? parseFloat(form.values.nitrogen_capacity) : null,
      nitrogen_level: form.values.nitrogen_level ? parseFloat(form.values.nitrogen_level) : null,
      nitrogen_unit: form.values.nitrogen_unit || 'liters',
      low_level_threshold: form.values.low_level_threshold ? parseFloat(form.values.low_level_threshold) : null,
      sort_order: sortOrder,
      notes: form.values.notes || null
    };

    const positionChanged = !!editingTank && editingTank.sort_order !== sortOrder;
    const userSpecifiedPosition = !!form.values.sort_order;

    try {
      const data = await saveMutation.mutateAsync({
        tankData,
        isEdit: !!editingTank,
        tank: editingTank,
        positionChanged,
        userSpecifiedPosition
      });

      handleCloseForm();
      onSuccess?.(data);
    } catch {
      // Error already handled by onError callback
    }
  }, [form.values, editingTank, tanks, saveMutation, onSuccess, validation, handleCloseForm]);

  const handleEdit = useCallback((tank: Tank) => {
    setEditingTank(tank);
    form.populate({
      tank_name: tank.tank_name || '',
      location: tank.location || '',
      capacity: tank.capacity || '',
      nitrogen_capacity: tank.nitrogen_capacity || '',
      nitrogen_level: tank.nitrogen_level || '',
      nitrogen_unit: tank.nitrogen_unit || 'liters',
      low_level_threshold: tank.low_level_threshold || '',
      sort_order: tank.sort_order || '',
      notes: tank.notes || ''
    });
    modal.open();
  }, [form, modal]);

  const handleDelete = useCallback((tank: Tank) => {
    deleteModal.open(tank.id, tank.tank_name);
  }, [deleteModal]);

  const confirmDeleteAction = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({
        tankId: deleteModal.itemId!,
        tankName: deleteModal.itemName
      });
      onSuccess?.();
    } catch {
      // Error already handled by onError callback
    }
    deleteModal.close();
  }, [deleteModal, deleteMutation, onSuccess]);

  return {
    // Form state
    formData: form.values,
    isFormOpen: modal.isOpen,
    editingTank,
    loading: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    error,
    validation,

    // Delete confirmation
    confirmDelete: deleteModal.confirmDelete,
    setConfirmDelete: deleteModal.setConfirmDelete,

    // Form setters (for backwards compatibility)
    setIsFormOpen: modal.setIsOpen,
    setFormData: form.setValues,

    // Handlers
    handleInputChange: form.handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCloseForm,
    confirmDeleteAction
  };
}
