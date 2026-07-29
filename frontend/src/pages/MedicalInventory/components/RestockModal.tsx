import React from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

interface RestockItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  [key: string]: unknown;
}

interface RestockFormData {
  quantity: string;
  [key: string]: unknown;
}

interface RestockModalProps {
  isOpen: boolean;
  item: RestockItem | null;
  formData: RestockFormData;
  loading: boolean;
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function RestockModal({
  isOpen,
  item,
  formData,
  loading,
  error,
  onInputChange,
  onSubmit,
  onClose
}: RestockModalProps) {
  if (!isOpen || !item) return null;

  const handleQuickAmount = (amount: number) => {
    onInputChange({ target: { name: 'quantity', value: amount.toString() } } as React.ChangeEvent<HTMLInputElement>);
  };

  const addQty = parseFloat(formData.quantity) || 0;
  const newTotal = item.quantity + addQty;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header modal-header--compact">
          <div className="modal-header__icon modal-header__icon--restock">
            <FiPlus size={18} />
          </div>
          <div>
            <h2 className="modal-title">Restock</h2>
            <p className="modal-subtitle">{item.item_name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className="quick-modal">
          {/* Stock Display */}
          <div className="quick-modal__stock">
            <div className="quick-modal__stock-item">
              <span className="quick-modal__stock-label">Current</span>
              <span className="quick-modal__stock-value">{item.quantity}</span>
              <span className="quick-modal__stock-unit">{item.unit}</span>
            </div>
            <div className="quick-modal__stock-arrow">→</div>
            <div className="quick-modal__stock-item">
              <span className="quick-modal__stock-label">After</span>
              <span className="quick-modal__stock-value quick-modal__stock-value--success">
                {newTotal}
              </span>
              <span className="quick-modal__stock-unit">{item.unit}</span>
            </div>
          </div>

          {error && <div className="error-message error-message--compact">{error}</div>}

          <form onSubmit={onSubmit} className="quick-modal__form">
            {/* Quick Amount Buttons */}
            <div className="quick-modal__quick-btns">
              {QUICK_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`quick-modal__quick-btn ${addQty === amount ? 'quick-modal__quick-btn--active' : ''}`}
                  onClick={() => handleQuickAmount(amount)}
                >
                  +{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="quick-modal__input-row">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={onInputChange}
                className="quick-modal__input"
                min="0.01"
                step="0.01"
                placeholder="Custom amount"
                required
              />
              <span className="quick-modal__input-unit">{item.unit}</span>
            </div>

            {/* Actions */}
            <div className="quick-modal__actions">
              <button type="button" className="quick-modal__btn quick-modal__btn--cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="quick-modal__btn quick-modal__btn--success"
                disabled={loading || addQty <= 0}
              >
                Add Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
