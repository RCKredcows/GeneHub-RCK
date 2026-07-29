import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logNitrogenFill } from '../../api/tanks';
import { useFormState } from '../useFormState';
import { useModalState } from '../useModalState';
import { useFormValidation } from '../useFormValidation';
import { formatErrorMessage } from '../useAsyncOperation';
import { QUERY_KEYS } from '../../constants/queryKeys';
import type { Tank } from '../../types';

interface FillFormData {
  tank_id: string | null;
  event_type: string;
  amount: string;
  nitrogen_level_before: string;
  nitrogen_level_after: string;
  notes: string;
  [key: string]: unknown;
}

interface FillMutationVars {
  fillData: {
    tank_id: string;
    event_type: string;
    amount_added: number;
    nitrogen_level_before: number;
    nitrogen_level_after: number;
    notes?: string;
  };
  tankName: string | undefined;
}

const initialFillFormData: FillFormData = {
  tank_id: null,
  event_type: 'fill',
  amount: '',
  nitrogen_level_before: '',
  nitrogen_level_after: '',
  notes: ''
};

/**
 * Hook for managing the nitrogen fill form.
 */
export function useFillForm(onSuccess?: () => void, userId?: string) {
  const queryClient = useQueryClient();
  const modal = useModalState<Tank>();
  const [error, setError] = useState('');

  // Fill mutation
  const fillMutation = useMutation({
    mutationFn: async ({ fillData, tankName }: FillMutationVars) => {
      const result = await logNitrogenFill(fillData, userId ?? null, tankName ?? null);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tanks });
      queryClient.invalidateQueries({ queryKey: ['nitrogenFillHistory'] });
      queryClient.invalidateQueries({ queryKey: ['nitrogenConsumptionStats'] });
    },
    onError: (err: unknown) => {
      setError(formatErrorMessage(err));
    }
  });

  // Validation rules
  const validationRules = useMemo(() => ({
    nitrogen_level_before: { required: 'Please enter the level before' },
    amount: { required: 'Please enter the amount', min: { value: 0.01, message: 'Amount must be greater than 0' } },
    nitrogen_level_after: { required: 'Please enter the level after' }
  }), []);

  const validation = useFormValidation(validationRules);
  const form = useFormState(initialFillFormData, { validation });

  // Helper to calculate level after based on event type
  const calculateLevelAfter = useCallback((levelBefore: string, amount: string, eventType: string): string => {
    const before = parseFloat(levelBefore || '0');
    const amountVal = parseFloat(amount || '0');
    if (eventType === 'fill') {
      return (before + amountVal).toFixed(2);
    } else {
      return Math.max(0, before - amountVal).toFixed(2);
    }
  }, []);

  // Custom input handler that auto-calculates nitrogen_level_after
  const handleFillInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name } = e.target;
    const value = String(e.target.value);

    if (name === 'amount' && form.values.nitrogen_level_before) {
      const levelAfter = calculateLevelAfter(
        form.values.nitrogen_level_before,
        value,
        form.values.event_type
      );

      form.setMultipleValues({
        [name]: value,
        nitrogen_level_after: levelAfter
      });
    } else if (name === 'event_type' && form.values.amount) {
      // Recalculate when switching between fill/drop
      const levelAfter = calculateLevelAfter(
        form.values.nitrogen_level_before,
        form.values.amount,
        value
      );

      form.setMultipleValues({
        [name]: value,
        nitrogen_level_after: levelAfter
      });
    } else {
      form.setFieldValue(name as keyof FillFormData & string, value);
    }
  }, [form, calculateLevelAfter]);

  const handleOpenFillForm = useCallback((tank: Tank, eventType = 'fill') => {
    form.setValues({
      tank_id: tank.id,
      event_type: eventType,
      amount: '',
      nitrogen_level_before: String(tank.nitrogen_level || '0'),
      nitrogen_level_after: '',
      notes: ''
    });
    modal.open(tank);
  }, [form, modal]);

  const handleCloseFillForm = useCallback(() => {
    modal.close();
    form.reset();
    validation.reset();
    setError('');
  }, [modal, form, validation, setError]);

  const handleFillSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!validation.validateAll(form.values)) {
      return;
    }

    const fillData = {
      tank_id: form.values.tank_id ?? '',
      event_type: form.values.event_type,
      amount_added: parseFloat(form.values.amount),
      nitrogen_level_before: parseFloat(form.values.nitrogen_level_before),
      nitrogen_level_after: parseFloat(form.values.nitrogen_level_after),
      ...(form.values.notes ? { notes: form.values.notes } : {})
    };

    try {
      await fillMutation.mutateAsync({
        fillData,
        tankName: modal.data?.tank_name
      });
      handleCloseFillForm();
      onSuccess?.();
    } catch {
      // Error already handled by onError callback
    }
  }, [form.values, fillMutation, handleCloseFillForm, onSuccess, validation, modal.data, userId]);

  return {
    // State
    fillFormData: form.values,
    isFillFormOpen: modal.isOpen,
    loading: fillMutation.isPending,
    error,
    validation,

    // Handlers
    handleFillInputChange,
    handleOpenFillForm,
    handleCloseFillForm,
    handleFillSubmit
  };
}
