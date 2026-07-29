import type React from 'react';
import { useState, useCallback } from 'react';
import { signIn } from '../api';
import { validateLoginForm } from '../util/validation';

interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Hook for managing login form state.
 * Consolidates email, password, errors, loading, and error message state.
 */
export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const clearFieldError = useCallback((field: keyof LoginFormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearFieldError('email');
  }, [clearFieldError]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    clearFieldError('password');
  }, [clearFieldError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const { error } = await signIn({ email, password });

    if (error) {
      setErrorMessage(error.message || 'An error occurred');
    }

    setLoading(false);
  }, [email, password]);

  const reset = useCallback(() => {
    setEmail('');
    setPassword('');
    setErrors({});
    setErrorMessage('');
  }, []);

  return {
    // State
    email,
    password,
    errors,
    loading,
    errorMessage,

    // Handlers
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
    reset
  };
}
