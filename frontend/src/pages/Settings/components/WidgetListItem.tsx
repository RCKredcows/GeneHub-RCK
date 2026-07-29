import { FiEye, FiEyeOff, FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface WidgetListItemProps {
  label: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function WidgetListItem({
  label,
  visible,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: WidgetListItemProps) {
  return (
    <div className="settings__widget-item">
      <div className="settings__widget-info">
        <button
          className="settings__visibility-btn"
          onClick={onToggleVisibility}
          aria-label={visible ? 'Hide widget' : 'Show widget'}
        >
          {visible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
        </button>
        <span className={`settings__widget-label ${!visible ? 'settings__widget-label--hidden' : ''}`}>
          {label}
        </span>
      </div>
      <div className="settings__widget-actions">
        <button
          className="settings__reorder-btn"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Move up"
        >
          <FiChevronUp size={18} />
        </button>
        <button
          className="settings__reorder-btn"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Move down"
        >
          <FiChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}
