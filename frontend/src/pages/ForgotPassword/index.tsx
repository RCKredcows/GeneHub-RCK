import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { sendPasswordResetEmail } from '../../api'
import { validateForgotPasswordForm } from '../../util/validation'
import './styles.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const validationError = validateForgotPasswordForm(email)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const { error: resetError } = await sendPasswordResetEmail(email)

    if (resetError) {
      setError(resetError.message || 'Failed to send reset email')
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <main className="forgot-password">
      <div className="forgot-password__container">
        <div className="forgot-password__logo">
          <img
            src="/rck_logo_dark_final-2.png"
            alt="RCK Logo"
            className="forgot-password__logo-image"
          />
        </div>

        <div className="forgot-password__card">
          <div className="forgot-password__header">
            <h1 className="forgot-password__title">Reset your password</h1>
            <p className="forgot-password__subtitle">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {success ? (
            <div className="forgot-password__success">
              <h2 className="forgot-password__success-title">Check your email</h2>
              <p className="forgot-password__success-message">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="forgot-password__success-note">
                If you don't see the email, check your spam folder.
              </p>
              <Link
                to="/"
                className="forgot-password__button forgot-password__button--back"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-password__form">
              {error && (
                <div className="forgot-password__error">
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

            <div className="forgot-password__field">
              <label htmlFor="email" className="forgot-password__label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="forgot-password__input"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="forgot-password__button forgot-password__button--primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <Link
              to="/"
              className="forgot-password__link"
            >
              Back to Login
            </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
