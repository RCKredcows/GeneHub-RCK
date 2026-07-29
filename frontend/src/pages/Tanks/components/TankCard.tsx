import { FiEdit2, FiTrash2, FiDroplet, FiAlertTriangle, FiMapPin, FiChevronRight, FiClock } from 'react-icons/fi';
import type { TankWithCount, CanisterWithCount } from '../../../types';

// Get title size class based on name length
const getTitleSizeClass = (name: string | null): string => {
  if (!name) return '';
  if (name.length > 25) return 'tanks__card-title--long';
  if (name.length > 18) return 'tanks__card-title--medium';
  return '';
};

interface TankCardProps {
  tank: TankWithCount;
  canisters: CanisterWithCount[] | undefined;
  getNitrogenPercentage: (tank: TankWithCount) => number | null;
  isLowNitrogen: (tank: TankWithCount) => boolean;
  onViewDetails: () => void;
  onFill: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageCanisters: () => void;
  formatDate: (dateString: string) => string;
}

export default function TankCard({
  tank, canisters, getNitrogenPercentage, isLowNitrogen,
  onViewDetails, onFill, onEdit, onDelete, onManageCanisters, formatDate
}: TankCardProps) {
  const percentage = getNitrogenPercentage(tank);
  const lowNitrogen = isLowNitrogen(tank);
  const tankCanisters = canisters || [];
  const canisterCount = tankCanisters.length > 0 ? tankCanisters.length : (tank.canister_count || 0);
  const fillHeight = percentage !== null ? Math.max(0, Math.min(100, percentage)) : 0;
  const titleSizeClass = getTitleSizeClass(tank.tank_name);

  const cardClasses = ['tanks__card', lowNitrogen ? 'tanks__card--low' : ''].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <div className="tanks__card-visual">
        <div className="tanks__tank-icon">
          <div className="tanks__tank-neck" />
          <div className="tanks__tank-body">
            <div className={`tanks__tank-fill ${lowNitrogen ? 'tanks__tank-fill--low' : ''}`} style={{ height: `${fillHeight}%` }} />
          </div>
        </div>
        <div className="tanks__card-info">
          <div className="tanks__card-header">
            <h3 className={`tanks__card-title ${titleSizeClass}`}>{tank.tank_name}</h3>
            <div className="tanks__card-actions" onClick={(e) => e.stopPropagation()}>
              <button className="tanks__card-action" onClick={onViewDetails} title="View fill history"><FiClock /></button>
              <button className="tanks__card-action" onClick={onFill} title="Add nitrogen fill"><FiDroplet /></button>
              <button className="tanks__card-action" onClick={onEdit} title="Edit tank"><FiEdit2 /></button>
              <button className="tanks__card-action tanks__card-action--delete" onClick={onDelete} title="Delete tank"><FiTrash2 /></button>
            </div>
          </div>
          {tank.location && (
            <p className="tanks__card-location"><FiMapPin size={12} />{tank.location}</p>
          )}
        </div>
      </div>

      <div className="tanks__card-body">
        <div className="tanks__card-nitrogen">
          <div className="tanks__nitrogen-header">
            <span className="tanks__nitrogen-label">Nitrogen Level</span>
            {lowNitrogen && (<span className="tanks__nitrogen-warning"><FiAlertTriangle size={12} />Low</span>)}
          </div>
          {percentage !== null ? (
            <>
              <div className="tanks__nitrogen-bar">
                <div className={`tanks__nitrogen-fill ${lowNitrogen ? 'tanks__nitrogen-fill--low' : ''}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
              </div>
              <div className="tanks__nitrogen-stats">
                <span className="tanks__nitrogen-value">{tank.nitrogen_level} / {tank.nitrogen_capacity} {tank.nitrogen_unit}</span>
                <span className="tanks__nitrogen-percentage">{percentage.toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <p className="tanks__nitrogen-empty">No nitrogen data</p>
          )}
        </div>
        <div className="tanks__card-stats">
          <div className="tanks__stat">
            <span className="tanks__stat-value">{tank.capacity || '—'}</span>
            <span className="tanks__stat-label">Capacity</span>
          </div>
          <div className="tanks__stat">
            <span className="tanks__stat-value">{canisterCount}</span>
            <span className="tanks__stat-label">Canisters</span>
          </div>
        </div>
      </div>

      <div className="tanks__card-footer">
        <span className="tanks__card-meta">{tank.last_filled_date ? `Filled: ${formatDate(tank.last_filled_date)}` : ''}</span>
        <button onClick={onManageCanisters} className="tanks__expand-btn">
          {canisterCount > 0 ? 'View Contents' : 'Manage Canisters'} <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
