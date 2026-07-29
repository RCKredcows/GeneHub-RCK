import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: string;
  value: number;
  label: string;
  breakdown?: string[];
  warningText?: string | null;
  onClick: () => void;
}

export default function StatCard({ icon, iconClass, value, label, breakdown, warningText, onClick }: StatCardProps) {
  return (
    <div
      className="dashboard__card dashboard__card--clickable"
      onClick={onClick}
    >
      <div className={`dashboard__card-icon ${iconClass}`}>
        {icon}
      </div>
      <div className="dashboard__card-info">
        <p className="dashboard__card-value">{value}</p>
        <p className="dashboard__card-label">{label}</p>
        {(breakdown || warningText) && (
          <div className="dashboard__card-breakdown">
            {warningText ? (
              <span className="dashboard__card-warning">{warningText}</span>
            ) : (
              breakdown!.map((item, index) => (
                <span key={index}>{item}</span>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
