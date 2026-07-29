import { useState } from 'react';
import { FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useCustomerInventoryReport } from '../../../hooks/reports';

interface CustomerDetailData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}

interface InventoryItem {
  [key: string]: unknown;
}

interface CustomerDetailProps {
  customer: CustomerDetailData;
  inventory?: InventoryItem[];
  inventoryLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CustomerDetail({
  customer,
  inventory = [],
  inventoryLoading = false,
  onClose,
  onEdit,
  onDelete
}: CustomerDetailProps) {
  const { generateReport } = useCustomerInventoryReport(customer, inventory);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [includeEmbryos, setIncludeEmbryos] = useState(true);
  const [includeSemen, setIncludeSemen] = useState(true);

  const handleGenerate = () => {
    generateReport({ includeEmbryos, includeSemen });
    setShowReportOptions(false);
  };

  return (
    <div className="customer-detail__overlay" onClick={onClose} data-testid="customer-detail">
      <div className="customer-detail__container" onClick={(e) => e.stopPropagation()}>
        <div className="customer-detail__header">
          <h2 className="customer-detail__title">{customer.name}</h2>
          <button
            className="customer-detail__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="customer-detail__body">
          {customer.email && (
            <div className="customer-detail__field">
              <strong>Email:</strong>
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="customer-detail__field">
              <strong>Phone:</strong>
              <span>{customer.phone}</span>
            </div>
          )}
          {(customer.address || customer.city || customer.state || customer.zip) && (
            <div className="customer-detail__field">
              <strong>Address:</strong>
              <div>
                {customer.address && <div>{customer.address}</div>}
                {(customer.city || customer.state || customer.zip) && (
                  <div>
                    {customer.city}{customer.city && customer.state && ', '}{customer.state} {customer.zip}
                  </div>
                )}
              </div>
            </div>
          )}
          {customer.notes && (
            <div className="customer-detail__field">
              <strong>Notes:</strong>
              <p className="customer-detail__notes">{customer.notes}</p>
            </div>
          )}

          <button
            className="customer-detail__report-btn"
            onClick={() => setShowReportOptions(v => !v)}
            disabled={inventoryLoading}
          >
            {inventoryLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading inventory...
              </>
            ) : (
              <>
                <FiFileText size={18} />
                Generate Inventory Report
                {inventory.length > 0 && (
                  <span className="customer-detail__inventory-badge">{inventory.length} items</span>
                )}
              </>
            )}
          </button>

          {showReportOptions && !inventoryLoading && (
            <div className="customer-detail__report-options">
              <label>
                <input
                  type="checkbox"
                  checked={includeEmbryos}
                  onChange={(e) => setIncludeEmbryos(e.target.checked)}
                />
                Show embryo inventory
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={includeSemen}
                  onChange={(e) => setIncludeSemen(e.target.checked)}
                />
                Show semen inventory
              </label>
              <button
                type="button"
                className="customer-detail__report-options-btn"
                onClick={handleGenerate}
                disabled={!includeEmbryos && !includeSemen}
              >
                Generate
              </button>
            </div>
          )}
        </div>

        <div className="customer-detail__actions">
          <button
            className="customer-detail__btn customer-detail__btn--edit"
            onClick={onEdit}
          >
            <FiEdit2 size={16} />
            Edit Customer
          </button>
          <button
            className="customer-detail__btn customer-detail__btn--delete"
            onClick={onDelete}
          >
            <FiTrash2 size={16} />
            Delete Customer
          </button>
        </div>
      </div>
    </div>
  );
}
