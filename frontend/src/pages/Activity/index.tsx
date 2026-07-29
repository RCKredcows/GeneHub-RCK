import { useState } from 'react';
import { FiMenu, FiClock } from 'react-icons/fi';
import Sidebar from '../../components/layout/Sidebar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useUserSettings } from '../../hooks/useUserSettings';
import ActivityItem from './components/ActivityItem';
import ActivityFilters from './components/ActivityFilters';
import type { AuthUser } from '../../types';
import './styles.css';

interface ActivityProps {
  user: AuthUser | null;
}

export default function Activity({ user }: ActivityProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useUserSettings(user?.id);

  const {
    activities,
    loading,
    error,
    filters,
    currentPage,
    totalPages,
    totalCount,
    setFilters,
    goToPage,
    getEntityLink,
    formatActionLabel
  } = useActivityLog(settings.items_per_page ?? undefined);

  const itemsPerPage = settings.items_per_page ?? 25;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="activity">
      {/* Hamburger Menu Button */}
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

      <main className="activity__main">
        <div className="activity__content">
          <header className="activity__header">
            <div>
              <h1 className="activity__title">Activity Log</h1>
              <p className="activity__subtitle">Track team actions and changes</p>
            </div>
          </header>

          {/* Filters */}
          <ActivityFilters
            filters={filters}
            onFilterChange={setFilters}
          />

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Activity List */}
          <div className="activity__list">
            {loading ? (
              <div className="activity__loading">
                <LoadingSpinner size="lg" />
              </div>
            ) : activities.length === 0 ? (
              <div className="activity__empty">
                <FiClock size={48} />
                <p>No activity found</p>
                <span>Activities will appear here as your team makes changes</span>
              </div>
            ) : (
              <>
                <div className="activity__items">
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      getEntityLink={getEntityLink}
                      formatActionLabel={formatActionLabel}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalCount}
                  onPageChange={goToPage}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
