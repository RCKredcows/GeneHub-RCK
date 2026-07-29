import { FiPackage, FiAlertTriangle, FiClock, FiChevronRight } from 'react-icons/fi';

interface MedicalStats {
  total: number;
  lowStock: number;
  expiring: number;
}

interface MedicalInventorySectionProps {
  stats: MedicalStats;
  onNavigate: (path: string) => void;
}

export default function MedicalInventorySection({ stats, onNavigate }: MedicalInventorySectionProps) {
  const { total, lowStock, expiring } = stats;

  return (
    <div className="dashboard__section">
      <div className="dashboard__section-header">
        <h2 className="dashboard__section-title">Medical Inventory</h2>
        <button
          className="dashboard__section-link"
          onClick={() => onNavigate('/medical-inventory')}
        >
          View All <FiChevronRight size={16} />
        </button>
      </div>

      <div className="dashboard__medical-grid">
        <div
          className="dashboard__medical-card"
          onClick={() => onNavigate('/medical-inventory')}
        >
          <div className="dashboard__medical-icon dashboard__medical-icon--primary">
            <FiPackage size={20} />
          </div>
          <div className="dashboard__medical-info">
            <span className="dashboard__medical-value">{total}</span>
            <span className="dashboard__medical-label">Total Items</span>
          </div>
        </div>

        <div
          className={`dashboard__medical-card ${lowStock > 0 ? 'dashboard__medical-card--warning' : ''}`}
          onClick={() => onNavigate('/medical-inventory')}
        >
          <div className={`dashboard__medical-icon ${lowStock > 0 ? 'dashboard__medical-icon--warning' : 'dashboard__medical-icon--muted'}`}>
            <FiAlertTriangle size={20} />
          </div>
          <div className="dashboard__medical-info">
            <span className="dashboard__medical-value">{lowStock}</span>
            <span className="dashboard__medical-label">Low Stock</span>
          </div>
        </div>

        <div
          className={`dashboard__medical-card ${expiring > 0 ? 'dashboard__medical-card--warning' : ''}`}
          onClick={() => onNavigate('/medical-inventory')}
        >
          <div className={`dashboard__medical-icon ${expiring > 0 ? 'dashboard__medical-icon--warning' : 'dashboard__medical-icon--muted'}`}>
            <FiClock size={20} />
          </div>
          <div className="dashboard__medical-info">
            <span className="dashboard__medical-value">{expiring}</span>
            <span className="dashboard__medical-label">Expiring Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
