import type React from 'react';
import { useState, useCallback } from 'react';
import { signUp } from '../api';
import { validateSignUpForm } from '../util/validation';

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const initialFormData: SignUpFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
};

/**
 * Hook for managing sign up form state.
 * Consolidates form data, errors, loading, message, and success state.
 */
export function useSignUpForm() {
  // Arriving from the landing page, the address is already known and is the one
  // the invitation was written for. Prefilling avoids a mistyped second entry
  // that would fail the invitation check with no obvious explanation.
  const [formData, setFormData] = useState<SignUpFormData>(() => {
    const invited = new URLSearchParams(window.location.search).get('email');
    return invited ? { ...initialFormData, email: invited } : initialFormData;
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = useCallback((field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = validateSignUpForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      metadata: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`
      }
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
    } else {
      setSuccess(true);
      setMessage('Account created! Please check your email to verify your account.');
      setFormData(initialFormData);
    }

    setLoading(false);
  }, [formData, validateForm]);

  const reset = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setMessage('');
    setSuccess(false);
  }, []);

  return {
    // State
    formData,
    errors,
    loading,
    message,
    success,

    // Handlers
    handleInputChange,
    handleSubmit,
    reset
  };
}
