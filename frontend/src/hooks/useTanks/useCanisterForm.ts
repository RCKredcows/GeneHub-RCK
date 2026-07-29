import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCanister,
  updateCanister,
  deleteCanister,
  updateCanisterPosition
} from '../../api/geneticInventory';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useFormValidation } from '../useFormValidation';
import { formatErrorMessage } from '../useAsyncOperation';
import { QUERY_KEYS } from '../../constants/queryKeys';


interface CanisterFormData {
  canister_number: string;
  position_in_tank: string;
  [key: string]: unknown;
}

interface TankRef {
  id: string;
  tank_name: string;
  [key: string]: unknown;
}

interface SaveMutationVars {
  formValues: CanisterFormData;
  tank: TankRef;
  canister: { id: string; canister_number: string; position_in_tank: number | null; [key: string]: unknown } | null;
}

interface DeleteMutationVars {
  canisterId: string;
  tankId: string;
  canisterNumber: string;
}

interface DeleteCanisterState {
  isOpen: boolean;
  canisterId: string | null;
  canisterNumber: string;
  tankId: string | null;
}

const initialCanisterFormData: CanisterFormData = {
  canister_number: '',
  position_in_tank: ''
};

/**
 * Hook for managing canister create/edit form and operations.
 */
export function useCanisterForm(
  onSuccess?: (data?: unknown, tankId?: string) => void,
  _unused?: unknown,
  userId?: string
) {
  const queryClient = useQueryClient();
  const modal = useModalState();
  const [error, setError] = useState('');

  // Validation rules
  const validationRules = useMemo(() => ({
    canister_number: { required: 'Please enter a canister number/name' }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialCanisterFormData, { validation });
  const [editingCanister, setEditingCanister] = useState<{ id: string; canister_number: string; position_in_tank: number | null; [key: string]: unknown } | null>(null);
  const [selectedTankForCanister, setSelectedTankForCanister] = useState<TankRef | null>(null);

  // Extended delete modal state to include tankId
  const [confirmDeleteCanisterState, setConfirmDeleteCanister] = useState<DeleteCanisterState>({
    isOpen: false,
    canisterId: null,
    canisterNumber: '',
    tankId: null
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ formValues, tank, canister }: SaveMutationVars) => {
      const newPosition = formValues.position_in_tank ? parseInt(formValues.position_in_tank, 10) : null;
      const tankId = tank.id;

      if (canister) {
        const oldPosition = canister.position_in_tank ?? undefined;

        // If position changed, use swap behavior
        if (newPosition && newPosition !== oldPosition) {
          await updateCanisterPosition(canister.id, tankId, newPosition, oldPosition);
        }

        // Update other fields
        const result = await updateCanister(
          canister.id,
          {
            tank_id: tankId,
            canister_number: formValues.canister_number,
            position_in_tank: newPosition || oldPosition
          },
          tankId,
          userId ?? null,
          `Canister ${formValues.canister_number} in ${tank.tank_name}`
        );

        if (result.error) throw result.error;
        return result.data;
      } else {
        // Create new canister
        const result = await createCanister(
          {
            tank_id: tankId,
            canister_number: formValues.canister_number,
            position_in_tank: newPosition ?? undefined
          },
          userId ?? '',
          tank.tank_name
        );

        if (result.error) throw result.error;
        return result.data;
      }
    },
    onSuccess: (_data: unknown, { tank }: SaveMutationVars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canisters(tank.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
    },
    onError: (err: unknown) => {
      setError(formatErrorMessage(err));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ canisterId, tankId, canisterNumber }: DeleteMutationVars) => {
      const result = await deleteCanister(canisterId, tankId, false, userId ?? null, `Canister ${canisterNumber}`);
      if (result.error) throw result.error;
      return { ...result, tankId };
    },
    onSuccess: (data: { tankId: string }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canisters(data.tankId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
    },
    onError: (err: unknown) => {
      setError(formatErrorMessage(err));
    }
  });

  const handleOpenCanisterForm = useCallback((tank: TankRef, canister: { id: string; canister_number: string; position_in_tank: number | null; [key: string]: unknown } | null = null) => {
    setSelectedTankForCanister(tank);
    if (canister) {
      setEditingCanister(canister);
      form.populate({
        canister_number: canister.canister_number || '',
        position_in_tank: canister.position_in_tank || ''
      });
    } else {
      setEditingCanister(null);
      form.reset();
    }
    modal.open();
  }, [form, modal]);

  const handleCloseCanisterForm = useCallback(() => {
    modal.close();
    setEditingCanister(null);
    setSelectedTankForCanister(null);
    form.reset();
    validation.reset();
    setError('');
  }, [modal, form, validation, setError]);

  const handleCanisterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!validation.validateAll(form.values)) {
      return;
    }

    try {
      const data = await saveMutation.mutateAsync({
        formValues: form.values,
        tank: selectedTankForCanister!,
        canister: editingCanister
      });

      handleCloseCanisterForm();
      // Small delay to ensure database consistency before refetching
      await new Promise(resolve => setTimeout(resolve, 100));
      onSuccess?.(data, selectedTankForCanister!.id);
    } catch {
      // Error already handled by onError callback
    }
  }, [form.values, editingCanister, selectedTankForCanister, saveMutation, handleCloseCanisterForm, onSuccess, validation]);

  const handleDeleteCanister = useCallback((canister: { id: string; canister_number: string; [key: string]: unknown }, tankId: string) => {
    setConfirmDeleteCanister({
      isOpen: true,
      canisterId: canister.id,
      canisterNumber: canister.canister_number,
      tankId: tankId
    });
  }, []);

  const confirmDeleteCanisterAction = useCallback(async () => {
    const { canisterId, tankId, canisterNumber } = confirmDeleteCanisterState;

    try {
      await deleteMutation.mutateAsync({ canisterId: canisterId!, tankId: tankId!, canisterNumber });
      onSuccess?.(undefined, tankId!);
    } catch {
      // Error already handled by onError callback
    }

    setConfirmDeleteCanister({ isOpen: false, canisterId: null, canisterNumber: '', tankId: null });
  }, [confirmDeleteCanisterState, deleteMutation, onSuccess]);

  const handleReorderCanisters = useCallback(async (tankId: string, reorderedCanisters: Array<{ id: string; position_in_tank: number | null; [key: string]: unknown }>) => {
    // Optimistically update React Query cache
    const updatedCanisters = reorderedCanisters.map((canister, index) => ({
      ...canister,
      position_in_tank: index + 1
    }));
    queryClient.setQueryData(QUERY_KEYS.canisters(tankId), updatedCanisters);

    // Update positions in database sequentially to avoid conflicts
    // Use updateCanisterPosition for proper swap handling
    let hasError = false;
    for (let i = 0; i < reorderedCanisters.length; i++) {
      const canister = reorderedCanisters[i];
      const newPosition = i + 1;
      const currentPosition = Number(canister.position_in_tank);

      if (currentPosition !== newPosition) {
        const result = await updateCanisterPosition(
          canister.id,
          tankId,
          newPosition,
          currentPosition
        );
        if (result.error) {
          hasError = true;
          break;
        }
      }
    }

    if (hasError) {
      setError('Failed to update canister positions');
    }
    // Always invalidate to get fresh data from server
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.canisters(tankId) });
  }, [queryClient, setError]);

  return {
    // State
    canisterFormData: form.values,
    isCanisterFormOpen: modal.isOpen,
    editingCanister,
    selectedTankForCanister,
    confirmDeleteCanister: confirmDeleteCanisterState,
    loading: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    error,
    validation,

    // Setters
    setConfirmDeleteCanister,

    // Handlers
    handleCanisterInputChange: form.handleChange,
    handleOpenCanisterForm,
    handleCloseCanisterForm,
    handleCanisterSubmit,
    handleDeleteCanister,
    confirmDeleteCanisterAction,
    handleReorderCanisters
  };
}
