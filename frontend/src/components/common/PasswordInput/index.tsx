import type React from 'react';
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import './styles.css'

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  errorMessage?: string;
  className?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  label,
  errorMessage,
  className = '',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`password-input ${className}`}>
      {label && (
        <label htmlFor={id} className="password-input__label">
          {label}
        </label>
      )}
      <div className="password-input__wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`password-input__field ${error ? 'password-input__field--error' : ''}`}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-input__toggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {errorMessage && (
        <p className="password-input__error">{errorMessage}</p>
      )}
    </div>
  )
}
