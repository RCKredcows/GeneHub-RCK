import { FiEdit2, FiTrash2, FiMinus, FiPlus, FiAlertTriangle, FiClock, FiPackage } from 'react-icons/fi';

interface MedicalItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reorder_threshold?: number | null;
  expiration_date?: string | null;
  supplier_name?: string | null;
  category?: { name?: string } | null;
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

function getStockPercentage(quantity: number, threshold: number | null | undefined): number {
  if (!threshold || threshold <= 0) return 100;
  // Show percentage relative to 2x threshold (full bar = healthy stock)
  const target = threshold * 2;
  return Math.min(100, Math.round((quantity / target) * 100));
}

interface InventoryCardProps {
  item: MedicalItem;
  onEdit: () => void;
  onDelete: () => void;
  onLogUsage: () => void;
  onRestock: () => void;
}

export default function InventoryCard({ item, onEdit, onDelete, onLogUsage, onRestock }: InventoryCardProps) {
  const expirationStatus = getExpirationStatus(item.expiration_date);
  const stockStatus = getStockStatus(item.quantity, item.reorder_threshold);
  const stockPercentage = getStockPercentage(item.quantity, item.reorder_threshold);

  const hasAlert = stockStatus === 'low' || stockStatus === 'out' ||
                   expirationStatus === 'expired' || expirationStatus === 'expiring';

  return (
    <div className={`inventory-card ${hasAlert ? 'inventory-card--alert' : ''} ${stockStatus === 'out' ? 'inventory-card--critical' : ''}`}>
      {/* Top Row: Category Tag + Actions */}
      <div className="inventory-card__top">
        {item.category?.name && (
          <span className="inventory-card__category-tag">
            <FiPackage size={10} />
            {item.category.name}
          </span>
        )}
        <div className="inventory-card__actions">
          <button
            className="inventory-card__action"
            onClick={onEdit}
            title="Edit item"
          >
            <FiEdit2 size={14} />
          </button>
          <button
            className="inventory-card__action inventory-card__action--delete"
            onClick={onDelete}
            title="Delete item"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Item Name */}
      <h3 className="inventory-card__name">{item.item_name}</h3>

      {/* Hero Quantity Section */}
      <div className="inventory-card__hero">
        <div className="inventory-card__quantity">
          <span className="inventory-card__quantity-value">{item.quantity}</span>
          <span className="inventory-card__quantity-unit">{item.unit}</span>
        </div>

        {/* Stock Level Bar */}
        {item.reorder_threshold && (
          <div className="inventory-card__stock-bar">
            <div
              className={`inventory-card__stock-fill inventory-card__stock-fill--${stockStatus}`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        )}

        {/* Status Badges - Only show when there's an alert */}
        {hasAlert && (
          <div className="inventory-card__badges">
            {stockStatus === 'out' && (
              <span className="inventory-card__badge inventory-card__badge--danger">
                <FiAlertTriangle size={11} />
                Out of Stock
              </span>
            )}
            {stockStatus === 'low' && (
              <span className="inventory-card__badge inventory-card__badge--warning">
                <FiAlertTriangle size={11} />
                Low Stock
              </span>
            )}
            {expirationStatus === 'expired' && (
              <span className="inventory-card__badge inventory-card__badge--danger">
                <FiClock size={11} />
                Expired
              </span>
            )}
            {expirationStatus === 'expiring' && (
              <span className="inventory-card__badge inventory-card__badge--warning">
                <FiClock size={11} />
                Expiring Soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact Details Grid */}
      <div className="inventory-card__details">
        {item.expiration_date && (
          <div className="inventory-card__detail">
            <span className="inventory-card__detail-label">Expires</span>
            <span className={`inventory-card__detail-value ${expirationStatus !== 'ok' ? 'inventory-card__detail-value--alert' : ''}`}>
              {formatDate(item.expiration_date)}
            </span>
          </div>
        )}
        {item.reorder_threshold && (
          <div className="inventory-card__detail">
            <span className="inventory-card__detail-label">Reorder</span>
            <span className="inventory-card__detail-value">≤ {item.reorder_threshold}</span>
          </div>
        )}
        {item.supplier_name && (
          <div className="inventory-card__detail">
            <span className="inventory-card__detail-label">Supplier</span>
            <span className="inventory-card__detail-value">{item.supplier_name}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="inventory-card__quick-actions">
        <button
          className="inventory-card__quick-btn inventory-card__quick-btn--use"
          onClick={onLogUsage}
          disabled={item.quantity <= 0}
        >
          <FiMinus size={14} />
          Use
        </button>
        <button
          className="inventory-card__quick-btn inventory-card__quick-btn--restock"
          onClick={onRestock}
        >
          <FiPlus size={14} />
          Restock
        </button>
      </div>
    </div>
  );
}
