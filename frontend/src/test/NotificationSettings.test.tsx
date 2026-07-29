import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationSettings from '../pages/Settings/components/NotificationSettings'

describe('NotificationSettings Component', () => {
  const defaultSettings = {
    email_notifications_enabled: true,
    notify_low_nitrogen: true,
    notify_low_medical_stock: true,
    notify_periodic_reminder: true,
    notification_email: null
  }

  const mockHandlers = {
    onUpdateEmailEnabled: vi.fn(),
    onUpdateLowNitrogen: vi.fn(),
    onUpdateLowMedicalStock: vi.fn(),
    onUpdatePeriodicReminder: vi.fn(),
    onUpdateNotificationEmail: vi.fn()
  }

  const userEmail = 'user@example.com'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the notifications section header', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })

    it('renders the master email toggle', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
      expect(screen.getByText('Receive email alerts for important events')).toBeInTheDocument()
    })

    it('renders all notification type toggles when enabled', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.getByText('Low Nitrogen Alerts')).toBeInTheDocument()
      expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument()
      expect(screen.getByText('Monthly Reminders')).toBeInTheDocument()
    })

    it('hides notification types when master toggle is off', () => {
      const disabledSettings = { ...defaultSettings, email_notifications_enabled: false }

      render(
        <NotificationSettings
          settings={disabledSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.queryByText('Low Nitrogen Alerts')).not.toBeInTheDocument()
      expect(screen.queryByText('Low Stock Alerts')).not.toBeInTheDocument()
      expect(screen.queryByText('Monthly Reminders')).not.toBeInTheDocument()
    })
  })

  describe('master toggle', () => {
    it('calls onUpdateEmailEnabled when toggled', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const masterToggle = screen.getByText('Email Notifications').closest('.settings__item')!
      const checkbox = masterToggle.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      expect(mockHandlers.onUpdateEmailEnabled).toHaveBeenCalledWith(false)
    })
  })

  describe('individual notification toggles', () => {
    it('calls onUpdateLowNitrogen when low nitrogen toggle is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const section = screen.getByText('Low Nitrogen Alerts').closest('.settings__item')!
      const checkbox = section.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      expect(mockHandlers.onUpdateLowNitrogen).toHaveBeenCalledWith(false)
    })

    it('calls onUpdateLowMedicalStock when low stock toggle is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const section = screen.getByText('Low Stock Alerts').closest('.settings__item')!
      const checkbox = section.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      expect(mockHandlers.onUpdateLowMedicalStock).toHaveBeenCalledWith(false)
    })

    it('calls onUpdatePeriodicReminder when monthly reminder toggle is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const section = screen.getByText('Monthly Reminders').closest('.settings__item')!
      const checkbox = section.querySelector('input[type="checkbox"]')!

      fireEvent.click(checkbox)

      expect(mockHandlers.onUpdatePeriodicReminder).toHaveBeenCalledWith(false)
    })
  })

  describe('email display', () => {
    it('displays user email when no override is set', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.getByText(`Using account email: ${userEmail}`)).toBeInTheDocument()
    })

    it('displays override email when set', () => {
      const overrideSettings = { ...defaultSettings, notification_email: 'alerts@example.com' }

      render(
        <NotificationSettings
          settings={overrideSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      expect(screen.getByText('Sending to: alerts@example.com')).toBeInTheDocument()
    })
  })

  describe('email override input', () => {
    it('shows email input when Change button is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const changeButton = screen.getByText('Change')
      fireEvent.click(changeButton)

      expect(screen.getByPlaceholderText('alternate@email.com')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('hides email input when Cancel is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      // Open input
      fireEvent.click(screen.getByText('Change'))
      expect(screen.getByPlaceholderText('alternate@email.com')).toBeInTheDocument()

      // Cancel
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByPlaceholderText('alternate@email.com')).not.toBeInTheDocument()
    })

    it('calls onUpdateNotificationEmail with new email when Save is clicked', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      fireEvent.click(screen.getByText('Change'))

      const input = screen.getByPlaceholderText('alternate@email.com')
      fireEvent.change(input, { target: { value: 'newalerts@example.com' } })

      fireEvent.click(screen.getByText('Save'))

      expect(mockHandlers.onUpdateNotificationEmail).toHaveBeenCalledWith('newalerts@example.com')
    })

    it('calls onUpdateNotificationEmail with null when email matches user email', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      fireEvent.click(screen.getByText('Change'))

      const input = screen.getByPlaceholderText('alternate@email.com')
      fireEvent.change(input, { target: { value: userEmail } })

      fireEvent.click(screen.getByText('Save'))

      expect(mockHandlers.onUpdateNotificationEmail).toHaveBeenCalledWith(null)
    })

    it('calls onUpdateNotificationEmail with null when email is empty', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      fireEvent.click(screen.getByText('Change'))

      const input = screen.getByPlaceholderText('alternate@email.com')
      fireEvent.change(input, { target: { value: '' } })

      fireEvent.click(screen.getByText('Save'))

      expect(mockHandlers.onUpdateNotificationEmail).toHaveBeenCalledWith(null)
    })
  })

  describe('checkbox states', () => {
    it('reflects enabled state for all toggles', () => {
      render(
        <NotificationSettings
          settings={defaultSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      // All 4 checkboxes should be checked (master + 3 types)
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })

    it('reflects disabled state for individual toggles', () => {
      const mixedSettings = {
        ...defaultSettings,
        notify_low_nitrogen: false,
        notify_low_medical_stock: true,
        notify_periodic_reminder: false
      }

      render(
        <NotificationSettings
          settings={mixedSettings}
          {...mockHandlers}
          userEmail={userEmail}
        />
      )

      const lowNitrogenSection = screen.getByText('Low Nitrogen Alerts').closest('.settings__item')!
      const lowNitrogenCheckbox = lowNitrogenSection.querySelector('input[type="checkbox"]')
      expect(lowNitrogenCheckbox).not.toBeChecked()

      const lowStockSection = screen.getByText('Low Stock Alerts').closest('.settings__item')!
      const lowStockCheckbox = lowStockSection.querySelector('input[type="checkbox"]')
      expect(lowStockCheckbox).toBeChecked()

      const reminderSection = screen.getByText('Monthly Reminders').closest('.settings__item')!
      const reminderCheckbox = reminderSection.querySelector('input[type="checkbox"]')
      expect(reminderCheckbox).not.toBeChecked()
    })
  })
})
