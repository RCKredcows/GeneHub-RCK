import { useState } from 'react';
import { FiMenu, FiDroplet, FiLayers, FiUsers, FiDatabase, FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useDashboard } from '../../hooks/useDashboard';

// Page-specific components
import AlertSection from './components/AlertSection';
import StatCard from './components/StatCard';
import TankStatusSection from './components/TankStatusSection';
import MedicalInventorySection from './components/MedicalInventorySection';

import type { AuthUser } from '../../types';
import './styles.css';

interface DashboardProps {
  user: AuthUser | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { settings, sortedStatCards, sortedSections } = useUserSettings(user?.id);

  // Use React Query for dashboard data
  const {
    loading,
    tanks,
    inventoryCounts,
    sireCount,
    customerCount,
    lowNitrogenTanks,
    medicalStats
  } = useDashboard({
    expirationWarningDays: settings.medical_expiration_warning_days ?? undefined
  });

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className={`dashboard__main ${isSidebarOpen ? 'dashboard__main--sidebar-open' : ''}`}>
          <div className="dashboard__content dashboard__loading">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <button
        className={`hamburger ${isSidebarOpen ? 'hamburger--hidden' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <FiMenu size={24} />
      </button>

      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className={`dashboard__main ${isSidebarOpen ? 'dashboard__main--sidebar-open' : ''}`}>
        <div className="dashboard__content">
          <header className="dashboard__header">
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">Welcome back, {user?.user_metadata?.first_name as string || 'User'}</p>
          </header>

          <div className="dashboard__grid">
            {sortedStatCards.map(card => {
              if (!card.visible) return null;

              switch (card.key) {
                case 'geneticInventory':
                  return (
                    <StatCard
                      key={card.key}
                      icon={<FiLayers size={24} />}
                      iconClass="dashboard__card-icon--primary"
                      value={inventoryCounts.total}
                      label="Genetic Inventory"
                      breakdown={[`${inventoryCounts.semen} semen`, `${inventoryCounts.embryo} embryos`]}
                      onClick={() => navigate('/genetic-inventory')}
                    />
                  );
                case 'tanks':
                  return (
                    <StatCard
                      key={card.key}
                      icon={<FiDroplet size={24} />}
                      iconClass="dashboard__card-icon--blue"
                      value={tanks.length}
                      label="Semen Tanks"
                      warningText={lowNitrogenTanks.length > 0 ? `${lowNitrogenTanks.length} low nitrogen` : null}
                      onClick={() => navigate('/tanks')}
                    />
                  );
                case 'sires':
                  return (
                    <StatCard
                      key={card.key}
                      icon={<FiDatabase size={24} />}
                      iconClass="dashboard__card-icon--green"
                      value={sireCount}
                      label="Sires"
                      breakdown={['In catalog']}
                      onClick={() => navigate('/sires')}
                    />
                  );
                case 'customers':
                  return (
                    <StatCard
                      key={card.key}
                      icon={<FiUsers size={24} />}
                      iconClass="dashboard__card-icon--purple"
                      value={customerCount}
                      label="Customers"
                      breakdown={[`${inventoryCounts.customerOwned} items stored`]}
                      onClick={() => navigate('/customers')}
                    />
                  );
                case 'medicalInventory':
                  return (
                    <StatCard
                      key={card.key}
                      icon={<FiHeart size={24} />}
                      iconClass="dashboard__card-icon--red"
                      value={medicalStats.total}
                      label="Medical Inventory"
                      warningText={medicalStats.lowStock > 0 ? `${medicalStats.lowStock} low stock` : null}
                      onClick={() => navigate('/medical-inventory')}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Render sections in sorted order */}
          {sortedSections.map(section => {
            if (!section.visible) return null;

            switch (section.key) {
              case 'alerts':
                return (
                  <AlertSection
                    key={section.key}
                    lowNitrogenTanks={lowNitrogenTanks}
                    onNavigate={navigate}
                  />
                );
              case 'tankStatus':
                return (
                  <TankStatusSection
                    key={section.key}
                    tanks={tanks}
                    onNavigate={navigate}
                    displayCount={settings.dashboard_tank_display_count ?? undefined}
                  />
                );
              case 'medicalInventory':
                return (
                  <MedicalInventorySection
                    key={section.key}
                    stats={medicalStats}
                    onNavigate={navigate}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </main>
    </div>
  );
}
