import { tenant } from '../../config/tenant';
import { Link } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { useLoginForm } from '../../hooks/useLoginForm'
import PasswordInput from '../../components/common/PasswordInput'
import './styles.css'

export default function Login() {
  const {
    email,
    password,
    errors,
    loading,
    errorMessage,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit
  } = useLoginForm()

  return (
    <main className="login">
      <div className="login__container">
        <div className="login__logo">
          <img
            src={tenant.logoUrl}
            alt={`${tenant.legalName} logo`}
            className="login__logo-image"
          />
        </div>

        <div className="login__card">
          <div className="login__header">
            <h1 className="login__title">Log in to your account</h1>
            <p className="login__subtitle">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="login__toggle-link"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Message display */}
          {errorMessage && (
            <div className="login__message login__message--error">
              <FiAlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email login form */}
          <form onSubmit={handleSubmit} className="login__form">
          <div className="login__form-group">
            <label htmlFor="email" className="login__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`login__input ${errors.email ? 'login__input--error' : ''}`}
              disabled={loading}
            />
            {errors.email && (
              <p className="login__error">{errors.email}</p>
            )}
          </div>
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={handlePasswordChange}
            error={!!errors.password}
            errorMessage={errors.password}
            disabled={loading}
          />

          <div className="login__forgot-password">
            <Link
              to="/forgot-password"
              className="login__forgot-link"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="login__button login__button--primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Help text */}
        <div className="login__footer">
          <p className="login__help-text">
            {tenant.loginHint}
          </p>
        </div>
      </div>
      </div>
    </main>
  )
}
