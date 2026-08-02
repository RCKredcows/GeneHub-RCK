import { tenant } from '../../config/tenant';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiUser, FiMoon, FiSun, FiX, FiLayout, FiSettings, FiSave, FiAlertCircle, FiMessageSquare, FiUsers, FiCreditCard } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useUserSettings } from '../../hooks/useUserSettings';
import {
  STAT_CARD_CONFIG,
  SECTION_CONFIG,
  ITEMS_PER_PAGE_OPTIONS,
  TANK_DISPLAY_COUNT_OPTIONS
} from '../../constants/defaultSettings';
import WidgetListItem from './components/WidgetListItem';
import NotificationSettings from './components/NotificationSettings';
import TeamSettings from './components/TeamSettings';
import BillingSettings from './components/BillingSettings';
import { fetchMyRole, ROLE_HINTS, ROLE_LABELS, type Role } from '../../api/members';
import type { AuthUser } from '../../types';
import './styles.css';

interface SettingsProps {
  user: AuthUser | null;
}

export default function Settings({ user }: SettingsProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);

  // The account section reports the role this person actually has, rather
  // than the single hardcoded value it showed when there was one workspace.
  useEffect(() => {
    fetchMyRole()
      .then(setMyRole)
      .catch((error) => console.error('Could not read your role:', error));
  }, []);

  const {
    settings,
    loading: _loading,
    saving,
    hasUnsavedChanges,
    sortedStatCards,
    sortedSections,
    updateDarkMode,
    updateTankDisplayCount,
    updateItemsPerPage,
    updateMedicalWarningDays,
    toggleStatCardVisibility,
    toggleSectionVisibility,
    reorderStatCards,
    reorderSections,
    saveSettings,
    discardChanges,
    // Notification settings
    updateEmailNotificationsEnabled,
    updateNotifyLowNitrogen,
    updateNotifyLowMedicalStock,
    updateNotifyPeriodicReminder,
    updateNotificationEmail
  } = useUserSettings(user?.id, { localOnly: true });

  // Handle navigation with unsaved changes check
  const handleNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowSaveModal(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  // Handle close button click
  const handleClose = useCallback(() => {
    handleNavigate('/dashboard');
  }, [handleNavigate]);

  // Save and exit
  const handleSaveAndExit = useCallback(async () => {
    setShowSaveModal(false);
    const result = await saveSettings();
    if (result.success && pendingNavigation) {
      navigate(pendingNavigation);
    }
  }, [saveSettings, navigate, pendingNavigation]);

  // Discard and exit
  const handleDiscardAndExit = useCallback(() => {
    discardChanges();
    setShowSaveModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  }, [discardChanges, navigate, pendingNavigation]);

  // Cancel navigation
  const handleCancelNavigation = useCallback(() => {
    setShowSaveModal(false);
    setPendingNavigation(null);
  }, []);

  const handleDarkModeToggle = () => {
    updateDarkMode(!settings.dark_mode);
  };

  const moveWidget = (items: { key: string; visible: boolean }[], reorderFn: (keys: string[]) => void, key: string, direction: 'up' | 'down') => {
    const keys = items.map(item => item.key);
    const currentIndex = keys.indexOf(key);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= keys.length) return;

    // Swap
    const temp = keys[currentIndex];
    keys[currentIndex] = keys[newIndex];
    keys[newIndex] = temp;

    reorderFn(keys);
  };

  const moveStatCard = (key: string, direction: 'up' | 'down') => {
    moveWidget(sortedStatCards, reorderStatCards, key, direction);
  };

  const moveSection = (key: string, direction: 'up' | 'down') => {
    moveWidget(sortedSections, reorderSections, key, direction);
  };

  return (
    <div className="settings">
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onNavigate={handleNavigate}
      />

      {/* Saving Loading Overlay */}
      {saving && (
        <div className="loading-overlay">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Saving settings...</p>
          </div>
        </div>
      )}

      {/* Save Changes Modal */}
      {showSaveModal && (
        <div className="settings__modal-overlay" onClick={handleCancelNavigation}>
          <div className="settings__modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings__modal-icon">
              <FiSave size={24} />
            </div>
            <h2 className="settings__modal-title">Unsaved Changes</h2>
            <p className="settings__modal-message">
              You have unsaved changes. Would you like to save before leaving?
            </p>
            <div className="settings__modal-actions">
              <button
                className="settings__modal-btn settings__modal-btn--secondary"
                onClick={handleDiscardAndExit}
              >
                Discard
              </button>
              <button
                className="settings__modal-btn settings__modal-btn--secondary"
                onClick={handleCancelNavigation}
              >
                Cancel
              </button>
              <button
                className="settings__modal-btn settings__modal-btn--primary"
                onClick={handleSaveAndExit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="settings__main">
        {/* Header */}
        <header className="settings__header">
          <button
            className="settings__menu-button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button>
          <div className="settings__header-center">
            <h1 className="settings__title">Settings</h1>
            {hasUnsavedChanges && (
              <span className="settings__unsaved-indicator">Unsaved changes</span>
            )}
          </div>
          <button
            className="settings__close-button"
            onClick={handleClose}
            aria-label="Close settings"
          >
            <FiX size={24} />
          </button>
        </header>

        <div className="settings__content">

          {/* Account Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiUser className="settings__section-icon" />
              <h2 className="settings__section-title">Account</h2>
            </div>
            <div className="settings__card">
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Email</p>
                  <p className="settings__item-value">{user?.email}</p>
                </div>
              </div>
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Account Type</p>
                  <p className="settings__item-value">
                    {myRole ? `${ROLE_LABELS[myRole]} · ${ROLE_HINTS[myRole]}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiUsers className="settings__section-icon" />
              <h2 className="settings__section-title">Team</h2>
            </div>
            <TeamSettings currentUserId={user?.id} />
          </section>

          {/* Billing Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiCreditCard className="settings__section-icon" />
              <h2 className="settings__section-title">Billing</h2>
            </div>
            <BillingSettings role={myRole} />
          </section>

          {/* Appearance Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              {settings.dark_mode ? <FiMoon className="settings__section-icon" /> : <FiSun className="settings__section-icon" />}
              <h2 className="settings__section-title">Appearance</h2>
            </div>
            <div className="settings__card">
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Dark Mode</p>
                  <p className="settings__item-description">Switch to dark theme</p>
                </div>
                <label className="settings__toggle">
                  <input
                    type="checkbox"
                    checked={settings.dark_mode ?? false}
                    onChange={handleDarkModeToggle}
                  />
                  <span className="settings__toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <NotificationSettings
            settings={settings}
            onUpdateEmailEnabled={updateEmailNotificationsEnabled}
            onUpdateLowNitrogen={updateNotifyLowNitrogen}
            onUpdateLowMedicalStock={updateNotifyLowMedicalStock}
            onUpdatePeriodicReminder={updateNotifyPeriodicReminder}
            onUpdateNotificationEmail={updateNotificationEmail}
            userEmail={user?.email}
          />

          {/* Dashboard Customization Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiLayout className="settings__section-icon" />
              <h2 className="settings__section-title">Dashboard</h2>
            </div>

            {/* Stat Cards */}
            <div className="settings__card">
              <div className="settings__subsection">
                <h3 className="settings__subsection-title">Stat Cards</h3>
                <p className="settings__subsection-description">Toggle visibility and reorder dashboard stat cards</p>
              </div>
              <div className="settings__widget-list">
                {sortedStatCards.map((card, index) => (
                  <WidgetListItem
                    key={card.key}
                    label={STAT_CARD_CONFIG[card.key]?.label || card.key}
                    visible={card.visible}
                    onToggleVisibility={() => toggleStatCardVisibility(card.key)}
                    onMoveUp={() => moveStatCard(card.key, 'up')}
                    onMoveDown={() => moveStatCard(card.key, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedStatCards.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="settings__card">
              <div className="settings__subsection">
                <h3 className="settings__subsection-title">Sections</h3>
                <p className="settings__subsection-description">Toggle visibility of dashboard sections</p>
              </div>
              <div className="settings__widget-list">
                {sortedSections.map((section, index) => (
                  <WidgetListItem
                    key={section.key}
                    label={SECTION_CONFIG[section.key]?.label || section.key}
                    visible={section.visible}
                    onToggleVisibility={() => toggleSectionVisibility(section.key)}
                    onMoveUp={() => moveSection(section.key, 'up')}
                    onMoveDown={() => moveSection(section.key, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedSections.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Tank Display Count */}
            <div className="settings__card">
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Tanks to Display</p>
                  <p className="settings__item-description">Number of tanks shown on dashboard</p>
                </div>
                <select
                  className="settings__select"
                  value={settings.dashboard_tank_display_count ?? 4}
                  onChange={(e) => updateTankDisplayCount(Number(e.target.value))}
                >
                  {TANK_DISPLAY_COUNT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Application Defaults Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiSettings className="settings__section-icon" />
              <h2 className="settings__section-title">Defaults</h2>
            </div>
            <div className="settings__card">
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Items per Page</p>
                  <p className="settings__item-description">Default number of items per page</p>
                </div>
                <select
                  className="settings__select"
                  value={settings.items_per_page ?? 25}
                  onChange={(e) => updateItemsPerPage(Number(e.target.value))}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="settings__item">
                <div className="settings__item-info">
                  <p className="settings__item-label">Expiration Warning</p>
                  <p className="settings__item-description">Days before expiration to show warning</p>
                </div>
                <div className="settings__number-wrapper">
                  <input
                    type="number"
                    className="settings__number-input"
                    value={settings.medical_expiration_warning_days ?? 30}
                    onChange={(e) => updateMedicalWarningDays(Number(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Feedback Section */}
          <section className="settings__section">
            <div className="settings__section-header">
              <FiMessageSquare className="settings__section-icon" />
              <h2 className="settings__section-title">Feedback</h2>
            </div>
            <div className="settings__card">
              <a
                href="mailto:daltongorham@gmail.com?subject=Bug Report - GeneHub&body=Please describe the bug:%0A%0ASteps to reproduce:%0A1.%0A2.%0A3.%0A%0AExpected behavior:%0A%0AActual behavior:%0A"
                className="settings__link-item"
              >
                <FiAlertCircle className="settings__link-icon" />
                <div className="settings__item-info">
                  <p className="settings__item-label">Report a Bug</p>
                  <p className="settings__item-description">Let us know if something isn't working</p>
                </div>
              </a>
              <a
                href="mailto:daltongorham@gmail.com?subject=Feature Suggestion - GeneHub&body=Feature description:%0A%0AWhy this would be helpful:%0A"
                className="settings__link-item"
              >
                <FiMessageSquare className="settings__link-icon" />
                <div className="settings__item-info">
                  <p className="settings__item-label">Suggest a Feature</p>
                  <p className="settings__item-description">Share your ideas for improvements</p>
                </div>
              </a>
            </div>
          </section>

          {/* Credits */}
          <div className="settings__credits">
            <p>Developed by <strong>Dalton Gorham</strong></p>
            <p>&copy; {new Date().getFullYear()} {tenant.legalName}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
