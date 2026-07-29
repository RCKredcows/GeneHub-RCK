import { FiMinus, FiPlus } from 'react-icons/fi';
import './styles.css';

interface QuantityItem {
  id: string;
  quantity: number;
  status?: string | null;
  [key: string]: unknown;
}

interface QuantityEditorProps {
  item: QuantityItem;
  inputValue: number | string;
  updateAmount: number;
  isUpdating: boolean;
  onInputChange: (value: string) => void;
  onUpdate: (item: QuantityItem, delta: number) => void;
  onWouldDelete?: (item: QuantityItem, delta: number) => void;
  label?: string;
}

/**
 * Quantity editor with +/- buttons and input field
 */
export default function QuantityEditor({
  item,
  inputValue,
  updateAmount,
  isUpdating,
  onInputChange,
  onUpdate,
  onWouldDelete,
  label = 'Units',
}: QuantityEditorProps) {
  const handleMinus = () => {
    const newQuantity = item.quantity - updateAmount;
    // Use small epsilon for floating point comparison (treats < 0.001 as zero)
    if (newQuantity < 0.001 && onWouldDelete) {
      onWouldDelete(item, -updateAmount);
    } else {
      onUpdate(item, -updateAmount);
    }
  };

  return (
    <div className="qty-editor">
      <div className="qty-editor__display">
        <span className="qty-editor__display-value">
          {isUpdating ? '...' : item.quantity}
        </span>
        <span className="qty-editor__display-label">{label}</span>
      </div>
      <div className="qty-editor__controls">
        <button
          className="qty-editor__btn qty-editor__btn--minus"
          onClick={handleMinus}
          disabled={isUpdating || item.quantity <= 0}
          title={`Remove ${updateAmount} unit(s)`}
        >
          <FiMinus size={14} />
        </button>
        <input
          type="number"
          className="qty-editor__input"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          min="0.01"
          step="any"
          title="Amount to add/remove"
        />
        <button
          className="qty-editor__btn qty-editor__btn--plus"
          onClick={() => onUpdate(item, updateAmount)}
          disabled={isUpdating}
          title={`Add ${updateAmount} unit(s)`}
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  );
}
