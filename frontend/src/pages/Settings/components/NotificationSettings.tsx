import { useState } from 'react';
import { FiBell, FiMail, FiDroplet, FiPackage, FiCalendar } from 'react-icons/fi';

interface NotificationSettingsData {
  email_notifications_enabled: boolean | null;
  notify_low_nitrogen: boolean | null;
  notify_low_medical_stock: boolean | null;
  notify_periodic_reminder: boolean | null;
  notification_email?: string | null;
  [key: string]: unknown;
}

interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onUpdateEmailEnabled: (value: boolean) => void;
  onUpdateLowNitrogen: (value: boolean) => void;
  onUpdateLowMedicalStock: (value: boolean) => void;
  onUpdatePeriodicReminder: (value: boolean) => void;
  onUpdateNotificationEmail: (value: string | null) => void;
  userEmail?: string;
}

export default function NotificationSettings({
  settings,
  onUpdateEmailEnabled,
  onUpdateLowNitrogen,
  onUpdateLowMedicalStock,
  onUpdatePeriodicReminder,
  onUpdateNotificationEmail,
  userEmail
}: NotificationSettingsProps) {
  const [emailOverride, setEmailOverride] = useState(settings.notification_email || '');
  const [showEmailInput, setShowEmailInput] = useState(!!settings.notification_email);

  const handleEmailOverrideSubmit = () => {
    if (emailOverride && emailOverride !== userEmail) {
      onUpdateNotificationEmail(emailOverride);
    } else {
      onUpdateNotificationEmail(null);
      setEmailOverride('');
      setShowEmailInput(false);
    }
  };

  const handleEmailOverrideCancel = () => {
    setShowEmailInput(false);
    setEmailOverride(settings.notification_email || '');
  };

  return (
    <section className="settings__section">
      <div className="settings__section-header">
        <FiBell className="settings__section-icon" />
        <h2 className="settings__section-title">Notifications</h2>
      </div>

      {/* Master Toggle */}
      <div className="settings__card">
        <div className="settings__item">
          <div className="settings__item-info">
            <p className="settings__item-label">Email Notifications</p>
            <p className="settings__item-description">
              Receive email alerts for important events
            </p>
          </div>
          <label className="settings__toggle">
            <input
              type="checkbox"
              checked={settings.email_notifications_enabled ?? false}
              onChange={(e) => onUpdateEmailEnabled(e.target.checked)}
            />
            <span className="settings__toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Notification Types - Only show if master toggle is on */}
      {settings.email_notifications_enabled && (
        <>
          <div className="settings__card">
            <div className="settings__subsection">
              <h3 className="settings__subsection-title">Alert Types</h3>
              <p className="settings__subsection-description">
                Choose which notifications you want to receive
              </p>
            </div>

            <div className="settings__item">
              <div className="settings__item-info">
                <div className="settings__notification-label">
                  <FiDroplet size={16} className="settings__notification-icon settings__notification-icon--blue" />
                  <p className="settings__item-label">Low Nitrogen Alerts</p>
                </div>
                <p className="settings__item-description">
                  Get notified when tanks fall below threshold
                </p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.notify_low_nitrogen ?? false}
                  onChange={(e) => onUpdateLowNitrogen(e.target.checked)}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__item">
              <div className="settings__item-info">
                <div className="settings__notification-label">
                  <FiPackage size={16} className="settings__notification-icon settings__notification-icon--red" />
                  <p className="settings__item-label">Low Stock Alerts</p>
                </div>
                <p className="settings__item-description">
                  Get notified when medical inventory needs restocking
                </p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.notify_low_medical_stock ?? false}
                  onChange={(e) => onUpdateLowMedicalStock(e.target.checked)}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__item">
              <div className="settings__item-info">
                <div className="settings__notification-label">
                  <FiCalendar size={16} className="settings__notification-icon settings__notification-icon--green" />
                  <p className="settings__item-label">Monthly Reminders</p>
                </div>
                <p className="settings__item-description">
                  Receive a monthly check-in reminder (every 30 days)
                </p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.notify_periodic_reminder ?? false}
                  onChange={(e) => onUpdatePeriodicReminder(e.target.checked)}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Email Override */}
          <div className="settings__card">
            <div className={`settings__item ${showEmailInput ? 'settings__item--stacked' : ''}`}>
              <div className="settings__item-info">
                <div className="settings__notification-label">
                  <FiMail size={16} className="settings__notification-icon" />
                  <p className="settings__item-label">Notification Email</p>
                </div>
                <p className="settings__item-description">
                  {settings.notification_email
                    ? `Sending to: ${settings.notification_email}`
                    : `Using account email: ${userEmail}`
                  }
                </p>
              </div>
              {!showEmailInput ? (
                <button
                  className="settings__link-btn"
                  onClick={() => setShowEmailInput(true)}
                >
                  Change
                </button>
              ) : (
                <div className="settings__email-input-group">
                  <input
                    type="email"
                    className="settings__text-input"
                    placeholder="alternate@email.com"
                    value={emailOverride}
                    onChange={(e) => setEmailOverride(e.target.value)}
                  />
                  <div className="settings__email-actions">
                    <button
                      className="settings__btn-small settings__btn-small--primary"
                      onClick={handleEmailOverrideSubmit}
                    >
                      Save
                    </button>
                    <button
                      className="settings__btn-small"
                      onClick={handleEmailOverrideCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
