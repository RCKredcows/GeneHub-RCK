import { FiX, FiMinus, FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiClock } from 'react-icons/fi';

interface MedicalItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reorder_threshold?: number | null;
  expiration_date?: string | null;
  supplier_name?: string | null;
  cost_per_unit?: number | null;
  notes?: string | null;
  [key: string]: unknown;
}

function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getExpirationStatus(expirationDate: string | null | undefined): string | null {
  if (!expirationDate) return null;
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 30) return 'expiring';
  return 'ok';
}

function getStockStatus(quantity: number, threshold: number | null | undefined): string {
  if (quantity <= 0) return 'out';
  if (threshold && quantity <= threshold) return 'low';
  return 'ok';
}

interface ItemDetailProps {
  item: MedicalItem;
  categoryName: string;
  onClose: () => void;
  onLogUsage: (item: MedicalItem) => void;
  onRestock: (item: MedicalItem) => void;
  onEdit: (item: MedicalItem) => void;
  onDelete: (item: MedicalItem) => void;
}

export default function ItemDetail({
  item,
  categoryName,
  onClose,
  onLogUsage,
  onRestock,
  onEdit,
  onDelete
}: ItemDetailProps) {
  if (!item) return null;

  const stockStatus = getStockStatus(item.quantity, item.reorder_threshold);
  const expStatus = getExpirationStatus(item.expiration_date);

  return (
    <div className="item-detail__overlay" onClick={onClose}>
      <div className="item-detail__container" onClick={(e) => e.stopPropagation()}>
        <div className="item-detail__header">
          <h2 className="item-detail__title">{item.item_name}</h2>
          <button className="item-detail__close" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className="item-detail__body">
          {/* Quantity Hero */}
          <div className="item-detail__quantity">
            <span className="item-detail__quantity-value">{item.quantity}</span>
            <span className="item-detail__quantity-unit">{item.unit}</span>
          </div>

          {/* Status Badges */}
          {(stockStatus !== 'ok' || expStatus === 'expired' || expStatus === 'expiring') && (
            <div className="item-detail__badges">
              {stockStatus === 'out' && (
                <span className="item-detail__badge item-detail__badge--danger">
                  <FiAlertTriangle size={12} /> Out of Stock
                </span>
              )}
              {stockStatus === 'low' && (
                <span className="item-detail__badge item-detail__badge--warning">
                  <FiAlertTriangle size={12} /> Low Stock
                </span>
              )}
              {expStatus === 'expired' && (
                <span className="item-detail__badge item-detail__badge--danger">
                  <FiClock size={12} /> Expired
                </span>
              )}
              {expStatus === 'expiring' && (
                <span className="item-detail__badge item-detail__badge--warning">
                  <FiClock size={12} /> Expiring Soon
                </span>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="item-detail__quick-actions">
            <button
              className="item-detail__quick-btn"
              onClick={() => { onLogUsage(item); onClose(); }}
              disabled={item.quantity <= 0}
            >
              <FiMinus size={18} />
              Log Usage
            </button>
            <button
              className="item-detail__quick-btn item-detail__quick-btn--primary"
              onClick={() => { onRestock(item); onClose(); }}
            >
              <FiPlus size={18} />
              Restock
            </button>
          </div>

          {/* Details */}
          <div className="item-detail__fields">
            {categoryName && (
              <div className="item-detail__field">
                <span className="item-detail__field-label">Category</span>
                <span className="item-detail__field-value">{categoryName}</span>
              </div>
            )}
            {item.reorder_threshold != null && item.reorder_threshold > 0 && (
              <div className="item-detail__field">
                <span className="item-detail__field-label">Reorder Threshold</span>
                <span className="item-detail__field-value">{item.reorder_threshold} {item.unit}</span>
              </div>
            )}
            {item.expiration_date && (
              <div className="item-detail__field">
                <span className="item-detail__field-label">Expiration Date</span>
                <span className={`item-detail__field-value ${expStatus !== 'ok' ? 'item-detail__field-value--alert' : ''}`}>
                  {formatDate(item.expiration_date)}
                </span>
              </div>
            )}
            {item.supplier_name && (
              <div className="item-detail__field">
                <span className="item-detail__field-label">Supplier</span>
                <span className="item-detail__field-value">{item.supplier_name}</span>
              </div>
            )}
            {item.cost_per_unit && (
              <div className="item-detail__field">
                <span className="item-detail__field-label">Cost per Unit</span>
                <span className="item-detail__field-value">${item.cost_per_unit}</span>
              </div>
            )}
            {item.notes && (
              <div className="item-detail__field item-detail__field--full">
                <span className="item-detail__field-label">Notes</span>
                <span className="item-detail__field-value">{item.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="item-detail__actions">
          <button
            className="item-detail__btn"
            onClick={() => { onEdit(item); onClose(); }}
          >
            <FiEdit2 size={16} />
            Edit
          </button>
          <button
            className="item-detail__btn item-detail__btn--delete"
            onClick={() => { onDelete(item); onClose(); }}
          >
            <FiTrash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
