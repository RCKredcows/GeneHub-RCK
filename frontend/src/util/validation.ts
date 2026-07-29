// Form validation utilities

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email is required'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  return null
}

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }
  if (password !== confirmPassword) {
    return "Passwords don't match"
  }
  return null
}

export const validateRequired = (value: string | number | boolean | null | undefined, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`
  }
  return null
}

export const validateCheckbox = (checked: boolean, message = 'This field is required'): string | null => {
  if (!checked) {
    return message
  }
  return null
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export const validateLoginForm = (email: string, password: string): LoginFormErrors => {
  const errors: LoginFormErrors = {}

  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError

  return errors
}

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

export const validateSignUpForm = (formData: SignUpFormData): SignUpFormErrors => {
  const errors: SignUpFormErrors = {}

  const firstNameError = validateRequired(formData.firstName, 'First name')
  if (firstNameError) errors.firstName = firstNameError

  const lastNameError = validateRequired(formData.lastName, 'Last name')
  if (lastNameError) errors.lastName = lastNameError

  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError

  const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword)
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

  return errors
}

export const validateForgotPasswordForm = (email: string): string | null => {
  const emailError = validateEmail(email)
  if (emailError) return emailError
  return null
}

interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
}

export const validateResetPasswordForm = (password: string, confirmPassword: string): ResetPasswordFormErrors => {
  const errors: ResetPasswordFormErrors = {}

  const passwordError = validatePassword(password)
  if (passwordError) {
    errors.password = passwordError
  }

  const confirmPasswordError = validatePasswordMatch(password, confirmPassword)
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError
  }

  return errors
}
