import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  validateCheckbox,
  validateLoginForm,
  validateSignUpForm,
  validateForgotPasswordForm,
  validateResetPasswordForm,
} from '../util/validation'

describe('validateEmail', () => {
  it('returns error for empty email', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('   ')).toBe('Email is required')
  })

  it('returns error for invalid email format', () => {
    expect(validateEmail('invalid')).toBe('Please enter a valid email address')
    expect(validateEmail('invalid@')).toBe('Please enter a valid email address')
    expect(validateEmail('@domain.com')).toBe('Please enter a valid email address')
    expect(validateEmail('test@domain')).toBe('Please enter a valid email address')
  })

  it('returns null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
    expect(validateEmail('user.name@domain.org')).toBeNull()
    expect(validateEmail('user+tag@example.co.uk')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required')
    expect(validatePassword(null as unknown as string)).toBe('Password is required')
    expect(validatePassword(undefined as unknown as string)).toBe('Password is required')
  })

  it('returns error for password shorter than 8 characters', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters')
    expect(validatePassword('abc')).toBe('Password must be at least 8 characters')
  })

  it('returns null for valid password', () => {
    expect(validatePassword('12345678')).toBeNull()
    expect(validatePassword('securepassword123')).toBeNull()
  })
})

describe('validatePasswordMatch', () => {
  it('returns error when confirm password is empty', () => {
    expect(validatePasswordMatch('password123', '')).toBe('Please confirm your password')
    expect(validatePasswordMatch('password123', null as unknown as string)).toBe('Please confirm your password')
  })

  it('returns error when passwords do not match', () => {
    expect(validatePasswordMatch('password123', 'password456')).toBe("Passwords don't match")
  })

  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('password123', 'password123')).toBeNull()
  })
})

describe('validateRequired', () => {
  it('returns error for empty or whitespace values', () => {
    expect(validateRequired('', 'Name')).toBe('Name is required')
    expect(validateRequired('   ', 'Name')).toBe('Name is required')
    expect(validateRequired(null, 'Name')).toBe('Name is required')
    expect(validateRequired(undefined, 'Name')).toBe('Name is required')
  })

  it('returns null for non-empty values', () => {
    expect(validateRequired('John', 'Name')).toBeNull()
    expect(validateRequired(123, 'Age')).toBeNull()
  })
})

describe('validateCheckbox', () => {
  it('returns error when checkbox is not checked', () => {
    expect(validateCheckbox(false)).toBe('This field is required')
    expect(validateCheckbox(false, 'You must agree to terms')).toBe('You must agree to terms')
  })

  it('returns null when checkbox is checked', () => {
    expect(validateCheckbox(true)).toBeNull()
  })
})

describe('validateLoginForm', () => {
  it('returns errors for empty form', () => {
    const errors = validateLoginForm('', '')
    expect(errors.email).toBe('Email is required')
    expect(errors.password).toBe('Password is required')
  })

  it('returns email error for invalid email', () => {
    const errors = validateLoginForm('invalid', 'password123')
    expect(errors.email).toBe('Please enter a valid email address')
    expect(errors.password).toBeUndefined()
  })

  it('returns password error for short password', () => {
    const errors = validateLoginForm('test@example.com', 'short')
    expect(errors.email).toBeUndefined()
    expect(errors.password).toBe('Password must be at least 8 characters')
  })

  it('returns empty object for valid form', () => {
    const errors = validateLoginForm('test@example.com', 'password123')
    expect(errors).toEqual({})
  })
})

describe('validateSignUpForm', () => {
  const validFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('returns all errors for empty form', () => {
    const errors = validateSignUpForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    expect(errors.firstName).toBe('First name is required')
    expect(errors.lastName).toBe('Last name is required')
    expect(errors.email).toBe('Email is required')
    expect(errors.password).toBe('Password is required')
    expect(errors.confirmPassword).toBe('Please confirm your password')
  })

  it('returns error when passwords do not match', () => {
    const errors = validateSignUpForm({
      ...validFormData,
      confirmPassword: 'differentpassword',
    })
    expect(errors.confirmPassword).toBe("Passwords don't match")
  })

  it('returns empty object for valid form', () => {
    const errors = validateSignUpForm(validFormData)
    expect(errors).toEqual({})
  })
})

describe('validateForgotPasswordForm', () => {
  it('returns error for empty email', () => {
    expect(validateForgotPasswordForm('')).toBe('Email is required')
  })

  it('returns error for invalid email', () => {
    expect(validateForgotPasswordForm('invalid')).toBe('Please enter a valid email address')
  })

  it('returns null for valid email', () => {
    expect(validateForgotPasswordForm('test@example.com')).toBeNull()
  })
})

describe('validateResetPasswordForm', () => {
  it('returns errors for empty passwords', () => {
    const errors = validateResetPasswordForm('', '')
    expect(errors.password).toBe('Password is required')
    expect(errors.confirmPassword).toBe('Please confirm your password')
  })

  it('returns error when passwords do not match', () => {
    const errors = validateResetPasswordForm('password123', 'differentpassword')
    expect(errors.confirmPassword).toBe("Passwords don't match")
  })

  it('returns empty object for valid form', () => {
    const errors = validateResetPasswordForm('password123', 'password123')
    expect(errors).toEqual({})
  })
})
