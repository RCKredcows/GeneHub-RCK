import { tenant } from '../../config/tenant';
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { useSignUpForm } from '../../hooks/useSignUpForm'
import PasswordInput from '../../components/common/PasswordInput'
import './styles.css'

export default function SignUp() {
  const {
    formData,
    errors,
    loading,
    message,
    success,
    handleInputChange,
    handleSubmit
  } = useSignUpForm()

  if (success) {
    return (
      <main className="signup">
        <div className="signup__container">
          <div className="signup__logo">
            <img
              src={tenant.logoUrl}
              alt={`${tenant.legalName} logo`}
              className="signup__logo-image"
            />
          </div>

          <div className="signup__card">
            <div className="signup__success">
              <div className="signup__success-icon">
                <svg viewBox="0 0 100 100" className="signup__check-icon">
                  <circle cx="50" cy="50" r="45" fill="hsl(142, 71%, 45%)" />
                  <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="signup__success-title">Account Created Successfully!</h1>
              <p className="signup__success-message">
                Please check your email to verify your account before signing in.
              </p>
              <Link
                to="/"
                className="signup__button signup__button--outline"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="signup">
      <div className="signup__container">
        <div className="signup__logo">
          <img
            src={tenant.logoUrl}
            alt={`${tenant.legalName} logo`}
            className="signup__logo-image"
          />
        </div>

        <div className="signup__card">
          <div className="signup__header">
            <h1 className="signup__title">Create Account</h1>
            <p className="signup__subtitle">
              Already have an account?{' '}
              <Link
                to="/"
                className="signup__toggle-link"
              >
                Log in
              </Link>
            </p>
          </div>

          {message && (
            <div className={`signup__message ${message.toLowerCase().includes('error') || message.includes('not authorized') ? 'signup__message--error' : 'signup__message--success'}`}>
              {message.toLowerCase().includes('error') || message.includes('not authorized') ? (
                <FiAlertCircle size={18} />
              ) : (
                <FiCheckCircle size={18} />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup__form">
          <div className="signup__form-row">
            <div className="signup__form-group">
              <label htmlFor="firstName" className="signup__label">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`signup__input ${errors.firstName ? 'signup__input--error' : ''}`}
                disabled={loading}
              />
              {errors.firstName && (
                <p className="signup__error">{errors.firstName}</p>
              )}
            </div>

            <div className="signup__form-group">
              <label htmlFor="lastName" className="signup__label">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`signup__input ${errors.lastName ? 'signup__input--error' : ''}`}
                disabled={loading}
              />
              {errors.lastName && (
                <p className="signup__error">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="signup__form-group">
            <label htmlFor="email" className="signup__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`signup__input ${errors.email ? 'signup__input--error' : ''}`}
              disabled={loading}
            />
            {errors.email && (
              <p className="signup__error">{errors.email}</p>
            )}
          </div>

          <PasswordInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={!!errors.password}
            errorMessage={errors.password}
            disabled={loading}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            error={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
            disabled={loading}
          />

          <button
            type="submit"
            className="signup__button signup__button--primary"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        </div>
      </div>
    </main>
  )
}
