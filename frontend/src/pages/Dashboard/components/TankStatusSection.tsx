import { FiChevronRight, FiPlus } from 'react-icons/fi';

interface DashboardTank {
  id: string;
  tank_name: string;
  location?: string | null;
  nitrogen_level: number | null;
  nitrogen_capacity: number | null;
  nitrogen_unit?: string | null;
  low_level_threshold?: number | null;
}

interface TankStatusSectionProps {
  tanks: DashboardTank[];
  onNavigate: (path: string) => void;
  displayCount?: number;
}

export default function TankStatusSection({ tanks, onNavigate, displayCount = 4 }: TankStatusSectionProps) {
  return (
    <div className="dashboard__section">
      <div className="dashboard__section-header">
        <h2 className="dashboard__section-title">Tank Status</h2>
        <button
          className="dashboard__section-link"
          onClick={() => onNavigate('/tanks')}
        >
          View All <FiChevronRight size={16} />
        </button>
      </div>
      {tanks.length === 0 ? (
        <div className="dashboard__empty">
          <p>No tanks configured</p>
          <button
            className="dashboard__empty-btn"
            onClick={() => onNavigate('/tanks')}
          >
            <FiPlus size={16} /> Add Tank
          </button>
        </div>
      ) : (
        <div className="dashboard__tank-list">
          {tanks.slice(0, displayCount).map(tank => {
            const percentage = tank.nitrogen_capacity
              ? Math.round(((tank.nitrogen_level ?? 0) / tank.nitrogen_capacity) * 100)
              : 0;
            const isLow = percentage <= (tank.low_level_threshold || 25);

            return (
              <div key={tank.id} className="dashboard__tank-item">
                <div className="dashboard__tank-info">
                  <span className="dashboard__tank-name">{tank.tank_name}</span>
                  <span className="dashboard__tank-location">{tank.location || 'No location'}</span>
                </div>
                <div className="dashboard__tank-level">
                  <div className="dashboard__tank-bar">
                    <div
                      className={`dashboard__tank-fill ${isLow ? 'dashboard__tank-fill--low' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`dashboard__tank-percent ${isLow ? 'dashboard__tank-percent--low' : ''}`}>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
