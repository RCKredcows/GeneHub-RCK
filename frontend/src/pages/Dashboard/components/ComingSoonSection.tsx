import { FiHeart } from 'react-icons/fi';

export default function ComingSoonSection() {
  return (
    <div className="dashboard__coming-soon">
      <div className="dashboard__coming-soon-icon">
        <FiHeart size={32} />
      </div>
      <h3 className="dashboard__coming-soon-title">Medical Records</h3>
      <p className="dashboard__coming-soon-text">Coming Soon</p>
    </div>
  );
}
