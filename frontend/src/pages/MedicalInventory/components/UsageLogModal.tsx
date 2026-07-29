import React, { useState } from 'react';
import { FiX, FiMinus, FiClock, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface UsageItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reorder_threshold?: number | null;
  [key: string]: unknown;
}

interface UsageFormData {
  quantity_used: string;
  notes: string;
  [key: string]: unknown;
}

interface UsageHistoryEntry {
  id: string;
  quantity_used: number;
  used_at: string | null;
  notes?: string | null;
  inventory_id?: string;
  created_at?: string | null;
  used_by?: string | null;
  [key: string]: unknown;
}

interface UsageLogModalProps {
  isOpen: boolean;
  item: UsageItem | null;
  formData: UsageFormData;
  usageHistory: UsageHistoryEntry[];
  historyLoading: boolean;
  loading: boolean;
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const QUICK_AMOUNTS = [1, 5, 10, 25];

export default function UsageLogModal({
  isOpen,
  item,
  formData,
  usageHistory,
  historyLoading,
  loading,
  error,
  onInputChange,
  onSubmit,
  onClose
}: UsageLogModalProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);

  if (!isOpen || !item) return null;

  const handleQuickAmount = (amount: number) => {
    const newValue = Math.min(amount, item.quantity);
    onInputChange({ target: { name: 'quantity_used', value: newValue.toString() } } as React.ChangeEvent<HTMLInputElement>);
  };

  const currentQty = parseFloat(formData.quantity_used) || 0;
  const remainingQty = Math.max(0, item.quantity - currentQty);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header modal-header--compact">
          <div className="modal-header__icon modal-header__icon--use">
            <FiMinus size={18} />
          </div>
          <div>
            <h2 className="modal-title">Log Usage</h2>
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
              <span className={`quick-modal__stock-value ${remainingQty <= (item.reorder_threshold || 0) ? 'quick-modal__stock-value--warning' : ''}`}>
                {remainingQty}
              </span>
              <span className="quick-modal__stock-unit">{item.unit}</span>
            </div>
          </div>

          {error && <div className="error-message error-message--compact">{error}</div>}

          <form onSubmit={onSubmit} className="quick-modal__form">
            {/* Quick Amount Buttons */}
            <div className="quick-modal__quick-btns">
              {QUICK_AMOUNTS.filter(amt => amt <= item.quantity).map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`quick-modal__quick-btn ${currentQty === amount ? 'quick-modal__quick-btn--active' : ''}`}
                  onClick={() => handleQuickAmount(amount)}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="quick-modal__input-row">
              <input
                type="number"
                name="quantity_used"
                value={formData.quantity_used}
                onChange={onInputChange}
                className="quick-modal__input"
                min="0.01"
                max={item.quantity}
                step="0.01"
                placeholder="Custom amount"
                required
              />
              <span className="quick-modal__input-unit">{item.unit}</span>
            </div>

            {/* Notes */}
            <textarea
              name="notes"
              value={formData.notes}
              onChange={onInputChange}
              className="quick-modal__textarea"
              placeholder="Notes (optional)"
              rows={2}
            />

            {/* Actions */}
            <div className="quick-modal__actions">
              <button type="button" className="quick-modal__btn quick-modal__btn--cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="quick-modal__btn quick-modal__btn--primary"
                disabled={loading || item.quantity <= 0 || currentQty <= 0 || currentQty > item.quantity}
              >
                Log Usage
              </button>
            </div>
          </form>

          {/* Recent History (Collapsible) */}
          {usageHistory.length > 0 && (
            <div className="quick-modal__history">
              <button
                type="button"
                className="quick-modal__history-toggle"
                onClick={() => setHistoryExpanded(!historyExpanded)}
              >
                <FiClock size={12} />
                <span>Recent History ({usageHistory.length})</span>
                {historyExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </button>
              {historyExpanded && (
                historyLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <div className="quick-modal__history-list">
                    {usageHistory.slice(0, 5).map(log => (
                      <div key={log.id} className="quick-modal__history-item">
                        <span className="quick-modal__history-qty">-{log.quantity_used}</span>
                        <span className="quick-modal__history-date">{log.used_at ? formatDateTime(log.used_at) : '—'}</span>
                        {log.notes && <span className="quick-modal__history-notes">{log.notes}</span>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
