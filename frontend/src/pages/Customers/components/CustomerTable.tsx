import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface CustomerData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

interface CustomerTableProps {
  customers: CustomerData[];
  onRowClick: (customer: CustomerData) => void;
  onEdit: (customer: CustomerData) => void;
  onDelete: (customer: CustomerData) => void;
}

export default function CustomerTable({ customers, onRowClick, onEdit, onDelete }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">No customers found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table__head">
          <tr>
            <th className="table__header">Name</th>
            <th className="table__header table__header--hide-mobile">Email</th>
            <th className="table__header table__header--hide-mobile">Phone</th>
            <th className="table__header customers__table-header--actions">Actions</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="table__row"
              onClick={() => onRowClick(customer)}
            >
              <td className="table__cell customers__table-cell--name">
                {customer.name}
              </td>
              <td className="table__cell table__cell--hide-mobile">
                {customer.email || '—'}
              </td>
              <td className="table__cell table__cell--hide-mobile">
                {customer.phone || '—'}
              </td>
              <td className="table__cell customers__table-cell--actions">
                <div className="customers__table-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="customers__table-action"
                    onClick={() => onEdit(customer)}
                    aria-label="Edit customer"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    className="customers__table-action customers__table-action--delete"
                    onClick={() => onDelete(customer)}
                    aria-label="Delete customer"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
