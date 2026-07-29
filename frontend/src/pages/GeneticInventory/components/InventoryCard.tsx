import { ownerLabel } from '../../../config/tenant';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiCalendar, FiLogIn } from 'react-icons/fi';
import QuantityEditor from '../../../components/common/QuantityEditor';

// Parse date string as local date (avoids timezone issues with YYYY-MM-DD format)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper to calculate storage duration
const getStorageDuration = (checkInDate: string | null, checkOutDate: string | null): string | null => {
  if (!checkInDate) return null;

  const startDate = parseLocalDate(checkInDate);
  let endDate: Date;
  if (checkOutDate) {
    endDate = parseLocalDate(checkOutDate);
  } else {
    // Normalize "today" to midnight for consistent day calculation
    const now = new Date();
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0
      ? `${months} mo${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`
      : `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return months > 0
      ? `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''}`
      : `${years} year${years !== 1 ? 's' : ''}`;
  }
};

// Get semen badge color class based on sex type
const getSemenBadgeClass = (sexType: string | null): string => {
  switch (sexType) {
    case 'sexed_male':
      return 'genetic-inventory__type-badge--semen-male';
    case 'sexed_female':
      return 'genetic-inventory__type-badge--semen-female';
    case 'conventional':
    default:
      return 'genetic-inventory__type-badge--semen';
  }
};

// Get embryo badge color class based on sex type
const getEmbryoBadgeClass = (sexType: string | null): string => {
  switch (sexType) {
    case 'sexed_male':
      return 'genetic-inventory__type-badge--embryo-male';
    case 'sexed_female':
      return 'genetic-inventory__type-badge--embryo-female';
    case 'conventional':
    default:
      return 'genetic-inventory__type-badge--embryo';
  }
};

interface InventoryItemData {
  id: string;
  inventory_type: string;
  sex_type: string | null;
  quantity: number;
  status: string;
  owner_type: string;
  is_ivf?: boolean;
  embryo_name?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  cane_number?: string | null;
  notes?: string | null;
  sire?: { name?: string | null } | null;
  customer?: { name?: string | null } | null;
  tank?: { tank_name?: string | null } | null;
  canister?: { canister_number?: string | null } | null;
  [key: string]: unknown;
}

interface InventoryCardProps {
  item: InventoryItemData;
  onEdit: () => void;
  onDelete: () => void;
  onCheckin?: () => void;
  inputValue: string;
  updateAmount: number;
  isUpdating: boolean;
  onInputChange: (value: string) => void;
  onUpdateQuantity: (item: InventoryItemData, delta: number) => void;
  onWouldDelete: (item: InventoryItemData, delta: number) => void;
}

export default function InventoryCard({
  item,
  onEdit,
  onDelete,
  onCheckin,
  inputValue,
  updateAmount,
  isUpdating,
  onInputChange,
  onUpdateQuantity,
  onWouldDelete
}: InventoryCardProps) {
  const isCheckedOut = item.status === 'checked_out';

  return (
    <div className={`genetic-inventory__card ${isCheckedOut ? 'genetic-inventory__card--checked-out' : ''}`}>
      <div className="genetic-inventory__card-header">
        <div className="genetic-inventory__card-title">
          <div className="genetic-inventory__badges">
            {item.inventory_type === 'semen' ? (
              <span className={`genetic-inventory__type-badge ${getSemenBadgeClass(item.sex_type)}`}>
                Semen
              </span>
            ) : (
              <>
                <span className={`genetic-inventory__type-badge ${getEmbryoBadgeClass(item.sex_type)}`}>
                  Embryo
                </span>
                {item.is_ivf && (
                  <span className="genetic-inventory__sex-badge genetic-inventory__sex-badge--ivf">
                    IVF
                  </span>
                )}
              </>
            )}
            {isCheckedOut && (
              <span className="genetic-inventory__status-badge genetic-inventory__status-badge--checked-out">
                Checked Out
              </span>
            )}
          </div>
          <h3 className="genetic-inventory__card-name">
            {item.sire?.name || item.embryo_name || 'Unknown'}
          </h3>
        </div>
        <div className="genetic-inventory__card-actions">
          <button
            onClick={onEdit}
            className="genetic-inventory__card-action"
            aria-label="Edit inventory"
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="genetic-inventory__card-action genetic-inventory__card-action--delete"
            aria-label="Delete inventory"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      <div className="genetic-inventory__card-body">
        <div className="genetic-inventory__card-field">
          <span className="genetic-inventory__card-label">Location:</span>
          {item.tank?.tank_name ? (
            <Link to="/tanks" className="genetic-inventory__card-link">
              {item.tank.tank_name}
              {item.canister?.canister_number && ` - ${item.canister.canister_number}`}
              {item.cane_number && ` - Cane ${item.cane_number}`}
            </Link>
          ) : (
            <span className="genetic-inventory__card-value">—</span>
          )}
        </div>
        <div className="genetic-inventory__card-field">
          <span className="genetic-inventory__card-label">Owner:</span>
          <span className="genetic-inventory__card-value">
            {ownerLabel(item.owner_type, item.customer?.name)}
          </span>
        </div>
        {isCheckedOut ? (
          <>
            <div className="genetic-inventory__card-field">
              <span className="genetic-inventory__card-label">Checked Out:</span>
              <span className="genetic-inventory__card-value">
                {item.check_out_date
                  ? parseLocalDate(item.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            {item.notes && (
              <div className="genetic-inventory__card-field">
                <span className="genetic-inventory__card-label">Notes:</span>
                <span className="genetic-inventory__card-value">{item.notes}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="genetic-inventory__card-field">
              <span className="genetic-inventory__card-label">Check In:</span>
              <span className="genetic-inventory__card-value">
                {item.check_in_date
                  ? parseLocalDate(item.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            {item.check_in_date && (
              <div className="genetic-inventory__card-field genetic-inventory__card-field--highlight">
                <span className="genetic-inventory__card-label">
                  <FiCalendar size={14} /> Storage:
                </span>
                <span className="genetic-inventory__card-value">
                  {getStorageDuration(item.check_in_date, item.check_out_date || null)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className={`genetic-inventory__card-footer ${isCheckedOut ? 'genetic-inventory__card-footer--checked-out' : ''}`}>
        {isCheckedOut && onCheckin ? (
          <>
            <div className="genetic-inventory__qty-display">
              <span className="genetic-inventory__qty-value">{item.quantity}</span>
              <span className="genetic-inventory__qty-label">{item.inventory_type === 'semen' ? 'Straws' : 'Units'}</span>
            </div>
            <button
              onClick={onCheckin}
              className="genetic-inventory__checkin-btn"
              title="Check in to a new location"
            >
              <FiLogIn size={16} />
              Check In
            </button>
          </>
        ) : (
          <QuantityEditor
            item={item}
            inputValue={inputValue}
            updateAmount={updateAmount}
            isUpdating={isUpdating}
            onInputChange={onInputChange}
            onUpdate={(qi, delta) => onUpdateQuantity(qi as InventoryItemData, delta)}
            onWouldDelete={(qi, delta) => onWouldDelete(qi as InventoryItemData, delta)}
            label={item.inventory_type === 'semen' ? 'Straws' : 'Units'}
          />
        )}
      </div>
    </div>
  );
}
