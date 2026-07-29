import { FiX, FiDroplet, FiMapPin, FiChevronDown, FiChevronRight, FiTrendingDown, FiList, FiClock, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';

interface TankData {
  tank_name: string;
  location?: string | null;
  nitrogen_unit?: string | null;
  [key: string]: unknown;
}

interface FillHistoryItem {
  id: string;
  event_type: string | null;
  fill_date: string | null;
  nitrogen_level_before?: number | null;
  amount_added: number;
  nitrogen_level_after: number;
  notes?: string | null;
  employees?: { full_name?: string } | null;
  [key: string]: unknown;
}

interface ConsumptionStats {
  totalFills?: number;
  totalDrops?: number;
  averageConsumptionPerDay?: number | null;
  totalNitrogenAdded?: number | null;
  totalNitrogenDropped?: number | null;
  [key: string]: unknown;
}

interface TankDetailsProps {
  isOpen: boolean;
  tank: TankData | null;
  fillHistory: FillHistoryItem[];
  consumptionStats: ConsumptionStats | null;
  expandedSections: { stats: boolean; history: boolean };
  onToggleSection: (section: string) => void;
  onClose: () => void;
  onLogFirstFill: () => void;
  onClearHistory: () => void;
  onDeleteEvent: (id: string) => void;
  clearingHistory: boolean;
}

export default function TankDetails({
  isOpen,
  tank,
  fillHistory,
  consumptionStats,
  expandedSections,
  onToggleSection,
  onClose,
  onLogFirstFill,
  onClearHistory,
  onDeleteEvent,
  clearingHistory
}: TankDetailsProps) {
  if (!isOpen || !tank) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container tanks__history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">Tank Details</h2>
          <button
            className="form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="form-body">
          {/* Tank Info Banner */}
          <div className="tanks__history-tank-info">
            <div className="tanks__history-tank-name">
              <FiDroplet size={20} />
              <span>{tank.tank_name}</span>
            </div>
            {tank.location && (
              <span className="tanks__history-tank-location">
                <FiMapPin size={14} />
                {tank.location}
              </span>
            )}
          </div>

          {/* Consumption Stats Accordion */}
          <div className="tanks__accordion">
            <button
              className={`tanks__accordion-header ${expandedSections.stats ? 'tanks__accordion-header--open' : ''}`}
              onClick={() => onToggleSection('stats')}
            >
              <div className="tanks__accordion-title">
                <FiTrendingDown size={18} />
                <span>Consumption Stats</span>
                <span className="tanks__accordion-badge">Last 30 days</span>
              </div>
              <FiChevronDown className={`tanks__accordion-icon ${expandedSections.stats ? 'tanks__accordion-icon--open' : ''}`} />
            </button>
            {expandedSections.stats && consumptionStats && (
              <div className="tanks__accordion-content">
                <div className="tanks__history-stats">
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value">{consumptionStats.totalFills || 0}</span>
                    <span className="tanks__history-stat-label">Fills</span>
                  </div>
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value">{consumptionStats.totalDrops || 0}</span>
                    <span className="tanks__history-stat-label">Drops</span>
                  </div>
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value">
                      {consumptionStats.averageConsumptionPerDay?.toFixed(2) || '—'}
                    </span>
                    <span className="tanks__history-stat-label">Avg. Daily Loss</span>
                  </div>
                </div>
                <div className="tanks__history-stats" style={{ marginTop: '0.75rem' }}>
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value" style={{ color: 'hsl(142, 71%, 35%)' }}>
                      +{consumptionStats.totalNitrogenAdded?.toFixed(1) || '0'}
                    </span>
                    <span className="tanks__history-stat-label">
                      {tank.nitrogen_unit || 'L'} Added
                    </span>
                  </div>
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value" style={{ color: 'hsl(25, 80%, 45%)' }}>
                      -{consumptionStats.totalNitrogenDropped?.toFixed(1) || '0'}
                    </span>
                    <span className="tanks__history-stat-label">
                      {tank.nitrogen_unit || 'L'} Dropped
                    </span>
                  </div>
                  <div className="tanks__history-stat">
                    <span className="tanks__history-stat-value">
                      {((consumptionStats.totalNitrogenAdded || 0) - (consumptionStats.totalNitrogenDropped || 0)).toFixed(1)}
                    </span>
                    <span className="tanks__history-stat-label">
                      {tank.nitrogen_unit || 'L'} Net
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fill History Accordion */}
          <div className="tanks__accordion">
            <button
              className={`tanks__accordion-header ${expandedSections.history ? 'tanks__accordion-header--open' : ''}`}
              onClick={() => onToggleSection('history')}
            >
              <div className="tanks__accordion-title">
                <FiList size={18} />
                <span>Fill History</span>
                <span className="tanks__accordion-badge">{fillHistory.length} records</span>
              </div>
              <FiChevronDown className={`tanks__accordion-icon ${expandedSections.history ? 'tanks__accordion-icon--open' : ''}`} />
            </button>
            {expandedSections.history && (
              <div className="tanks__accordion-content">
                {fillHistory.length > 0 ? (
                  <div className="tanks__history-list">
                    {fillHistory.map((fill) => {
                      const isDrop = fill.event_type === 'drop';
                      return (
                        <div key={fill.id} className={`tanks__history-item ${isDrop ? 'tanks__history-item--drop' : ''}`}>
                          <div className="tanks__history-date">
                            <span className={`tanks__history-type-badge ${isDrop ? 'tanks__history-type-badge--drop' : ''}`}>
                              {isDrop ? <FiMinus size={12} /> : <FiPlus size={12} />}
                              {isDrop ? 'Drop' : 'Fill'}
                            </span>
                            <span className="tanks__history-date-main">
                              {fill.fill_date ? new Date(fill.fill_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              }) : '—'}
                            </span>
                            <span className="tanks__history-date-time">
                              {fill.fill_date ? new Date(fill.fill_date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              }) : ''}
                            </span>
                          </div>
                          <div className="tanks__history-details">
                            <div className="tanks__history-values">
                              <span className="tanks__history-value">
                                <span className="tanks__history-value-label">Before</span>
                                {fill.nitrogen_level_before ?? '—'}
                              </span>
                              <FiChevronRight className="tanks__history-arrow" size={14} />
                              <span className={`tanks__history-value ${isDrop ? 'tanks__history-value--dropped' : 'tanks__history-value--added'}`}>
                                {isDrop ? '-' : '+'}{fill.amount_added}
                              </span>
                              <FiChevronRight className="tanks__history-arrow" size={14} />
                              <span className="tanks__history-value tanks__history-value--after">
                                {fill.nitrogen_level_after}
                              </span>
                            </div>
                            {fill.notes && (
                              <p className="tanks__history-notes">{fill.notes}</p>
                            )}
                            {fill.employees?.full_name && (
                              <span className="tanks__history-by">by {fill.employees.full_name}</span>
                            )}
                          </div>
                          <button
                            className="tanks__history-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(fill.id);
                            }}
                            title="Delete this event"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      className="tanks__clear-all-btn"
                      onClick={onClearHistory}
                      disabled={clearingHistory}
                    >
                      <FiTrash2 size={14} />
                      {clearingHistory ? 'Clearing...' : 'Clear All History'}
                    </button>
                  </div>
                ) : (
                  <div className="tanks__empty tanks__empty--compact">
                    <FiClock size={24} />
                    <p>No fill history recorded yet</p>
                    <button
                      className="btn-primary"
                      onClick={onLogFirstFill}
                    >
                      <FiDroplet size={16} />
                      Log First Fill
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
