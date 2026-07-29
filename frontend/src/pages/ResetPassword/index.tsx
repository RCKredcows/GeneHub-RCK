import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { updatePassword, signOut } from '../../api'
import { validateResetPasswordForm } from '../../util/validation'
import PasswordInput from '../../components/common/PasswordInput'
import './styles.css'

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationErrors = validateResetPasswordForm(password, confirmPassword)

    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors.password || validationErrors.confirmPassword || '')
      return
    }

    setLoading(true)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message || 'Failed to update password')
    } else {
      setSuccess(true)
      setTimeout(async () => {
        // Sign out the user so they can log in with new password
        await signOut()
        navigate('/')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <main className="reset-password">
      <div className="reset-password__container">
        <div className="reset-password__logo">
          <img
            src="/rck_logo_dark_final-2.png"
            alt="RCK Logo"
            className="reset-password__logo-image"
          />
        </div>

        <div className="reset-password__card">
          <div className="reset-password__header">
            <h1 className="reset-password__title">Set new password</h1>
            <p className="reset-password__subtitle">
              Enter your new password below
            </p>
          </div>

          {success ? (
            <div className="reset-password__success">
              <h2 className="reset-password__success-title">Password updated!</h2>
              <p className="reset-password__success-message">
                Your password has been successfully updated. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reset-password__form">
              {error && (
                <div className="reset-password__error">
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

            <PasswordInput
              id="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              className="reset-password__button reset-password__button--primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
