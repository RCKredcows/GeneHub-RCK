import { FiAlertTriangle } from 'react-icons/fi';

interface LowNitrogenTank {
  tank_name: string;
  [key: string]: unknown;
}

interface AlertSectionProps {
  lowNitrogenTanks: LowNitrogenTank[];
  onNavigate: (path: string) => void;
}

export default function AlertSection({ lowNitrogenTanks, onNavigate }: AlertSectionProps) {
  if (lowNitrogenTanks.length === 0) return null;

  return (
    <div className="dashboard__alerts">
      <div className="dashboard__alert dashboard__alert--warning">
        <FiAlertTriangle size={20} />
        <div className="dashboard__alert-content">
          <strong>{lowNitrogenTanks.length} tank{lowNitrogenTanks.length > 1 ? 's' : ''} with low nitrogen</strong>
          <span>{lowNitrogenTanks.map(t => t.tank_name).join(', ')}</span>
        </div>
        <button
          className="dashboard__alert-action"
          onClick={() => onNavigate('/tanks')}
        >
          View Tanks
        </button>
      </div>
    </div>
  );
}
