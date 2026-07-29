import './styles.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = `spinner--${size}`;

  return (
    <div className={`spinner ${sizeClass} ${className}`}>
      <div className="spinner__morph" />
    </div>
  );
}
