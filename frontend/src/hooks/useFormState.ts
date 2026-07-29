import type React from 'react';
import { useState, useCallback } from 'react';

interface ValidationHook {
  clearFieldError?: (name: string) => void;
}

interface FormStateOptions {
  validation?: ValidationHook;
}

/**
 * Hook for managing form state.
 * Use with useFormValidation for validation.
 */
export function useFormState<T extends object>(
  initialValues: T,
  options: FormStateOptions = {}
) {
  const { validation } = options;
  const [values, setValues] = useState<T>(initialValues);

  /**
   * Handle input change from form elements.
   * Supports text inputs, checkboxes, and select elements.
   * Auto-clears validation errors if validation hook is provided.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;

    // Auto-clear validation error for this field
    if (validation?.clearFieldError) {
      validation.clearFieldError(name);
    }

    setValues(prev => ({ ...prev, [name]: newValue }));
  }, [validation]);

  /**
   * Set a specific field value programmatically.
   * Optionally clears validation error for the field.
   */
  const setFieldValue = useCallback((name: keyof T & string, value: T[keyof T], clearError = true) => {
    if (clearError && validation?.clearFieldError) {
      validation.clearFieldError(name);
    }
    setValues(prev => ({ ...prev, [name]: value }));
  }, [validation]);

  /**
   * Set multiple field values at once.
   * Optionally clears validation errors for all changed fields.
   */
  const setMultipleValues = useCallback((newValues: Partial<T>, clearErrors = true) => {
    if (clearErrors && validation?.clearFieldError) {
      Object.keys(newValues).forEach(name => {
        validation.clearFieldError!(name);
      });
    }
    setValues(prev => ({ ...prev, ...newValues }));
  }, [validation]);

  /**
   * Reset form to initial values or new values.
   */
  const reset = useCallback((newInitialValues?: T) => {
    setValues(newInitialValues ?? initialValues);
  }, [initialValues]);

  /**
   * Populate form with values (for editing existing items).
   */
  const populate = useCallback((data: Record<string, unknown>) => {
    const populated = {} as Record<string, unknown>;
    Object.keys(initialValues).forEach(key => {
      populated[key] = data[key] ?? (initialValues as Record<string, unknown>)[key];
    });
    setValues(populated as T);
  }, [initialValues]);

  return {
    values,
    setValues,
    setFieldValue,
    setMultipleValues,
    handleChange,
    reset,
    populate
  };
}
