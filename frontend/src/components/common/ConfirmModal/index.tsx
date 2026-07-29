import { FiAlertTriangle } from 'react-icons/fi';
import './styles.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-modal__overlay" onClick={onClose}>
      <div className="confirm-modal__container" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal__icon confirm-modal__icon--${variant}`}>
          <FiAlertTriangle size={24} />
        </div>

        <h2 className="confirm-modal__title">{title}</h2>
        <p className="confirm-modal__message">{message}</p>

        <div className="confirm-modal__actions">
          <button
            type="button"
            onClick={onClose}
            className="confirm-modal__btn confirm-modal__btn--cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`confirm-modal__btn confirm-modal__btn--confirm confirm-modal__btn--${variant}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
