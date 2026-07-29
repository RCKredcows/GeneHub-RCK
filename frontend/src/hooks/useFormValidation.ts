import { useState, useCallback } from 'react';

interface MinMaxRule {
  value: number;
  message: string;
}

interface RequiredIfRule {
  field: string;
  value: unknown;
  message?: string;
}

interface FieldRule {
  required?: string | boolean;
  requiredIf?: RequiredIfRule;
  validate?: (value: unknown, allValues: Record<string, unknown>) => string | undefined | null | false;
  min?: number | MinMaxRule;
  max?: number | MinMaxRule;
  email?: string;
}

export type ValidationRules = Record<string, FieldRule>;

/**
 * Hook for form validation with field-level error messages.
 */
export function useFormValidation(rules: ValidationRules = {}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mark a field as touched (on blur)
  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: unknown, allValues: Record<string, unknown> = {}) => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return '';

    // Required validation
    if (fieldRules.required) {
      const isEmpty = value === undefined || value === null || value === '' ||
        (typeof value === 'string' && value.trim() === '');
      if (isEmpty) {
        return typeof fieldRules.required === 'string'
          ? fieldRules.required
          : 'This field is required';
      }
    }

    // Conditional required (e.g., customer_id required when owner_type is 'customer')
    if (fieldRules.requiredIf) {
      const { field, value: conditionValue, message } = fieldRules.requiredIf;
      if (allValues[field] === conditionValue) {
        const isEmpty = value === undefined || value === null || value === '';
        if (isEmpty) {
          return message || 'This field is required';
        }
      }
    }

    // Custom validation function (runs even for empty values - allows conditional required)
    if (fieldRules.validate) {
      const customError = fieldRules.validate(value, allValues);
      if (customError) return customError;
    }

    // Skip other validations if empty and not required
    if (value === undefined || value === null || value === '') {
      return '';
    }

    // Min value validation
    if (fieldRules.min !== undefined) {
      const minVal = typeof fieldRules.min === 'object' ? fieldRules.min.value : fieldRules.min;
      const minMsg = typeof fieldRules.min === 'object' ? fieldRules.min.message : `Must be at least ${minVal}`;
      if (Number(value) < minVal) {
        return minMsg;
      }
    }

    // Max value validation
    if (fieldRules.max !== undefined) {
      const maxVal = typeof fieldRules.max === 'object' ? fieldRules.max.value : fieldRules.max;
      const maxMsg = typeof fieldRules.max === 'object' ? fieldRules.max.message : `Must be at most ${maxVal}`;
      if (Number(value) > maxVal) {
        return maxMsg;
      }
    }

    return '';
  }, [rules]);

  // Validate all fields and return whether form is valid
  const validateAll = useCallback((values: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    let firstErrorField: string | null = null;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName], values);
      if (error) {
        newErrors[fieldName] = error;
        if (!firstErrorField) {
          firstErrorField = fieldName;
        }
        isValid = false;
      }
    });

    setErrors(newErrors);
    // Mark all fields as touched
    const allTouched = Object.keys(rules).reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Scroll to and focus the first field with an error
    if (firstErrorField) {
      setTimeout(() => {
        const element = document.getElementById(firstErrorField!) ||
                       document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }, 0);
    }

    return isValid;
  }, [rules, validateField]);

  // Get error for a field (only if touched)
  const getFieldError = useCallback((fieldName: string) => {
    return touched[fieldName] ? errors[fieldName] : '';
  }, [touched, errors]);

  // Check if a field has an error (only if touched)
  const hasFieldError = useCallback((fieldName: string) => {
    return touched[fieldName] && !!errors[fieldName];
  }, [touched, errors]);

  // Update error for a specific field
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  // Clear error for a specific field (call when field value changes)
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      if (prev[fieldName]) {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  // Clear all errors and touched state
  const reset = useCallback(() => {
    setTouched({});
    setErrors({});
  }, []);

  // Handle blur event - validates and marks as touched
  const handleBlur = useCallback((fieldName: string, value: unknown, allValues?: Record<string, unknown>) => {
    touchField(fieldName);
    const error = validateField(fieldName, value, allValues);
    setFieldError(fieldName, error);
  }, [touchField, validateField, setFieldError]);

  return {
    errors,
    touched,
    validateAll,
    validateField,
    getFieldError,
    hasFieldError,
    setFieldError,
    clearFieldError,
    touchField,
    handleBlur,
    reset
  };
}

/**
 * Get CSS class for field with error state
 */
export function getFieldClassName(baseClass: string, hasError: boolean): string {
  return hasError ? `${baseClass} ${baseClass}--error` : baseClass;
}
