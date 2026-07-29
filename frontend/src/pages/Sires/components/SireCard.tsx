import { ownerLabel } from '../../../config/tenant';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface SireCardData {
  id: string;
  name: string;
  breed?: string | null;
  image_url?: string | null;
  price_for_semen?: number | null;
  price_for_sexed_semen?: number | null;
  owner_type?: string | null;
  customer?: { name?: string | null } | null;
  registration_number?: string | null;
  notes?: string | null;
}

interface SireCardProps {
  sire: SireCardData;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SireCard({ sire, onEdit, onDelete }: SireCardProps) {
  return (
    <div className="sires__card">
      {sire.image_url && (
        <div className="sires__card-image">
          <img src={sire.image_url} alt={sire.name} />
        </div>
      )}
      <div className="sires__card-header">
        <h3 className="sires__card-name">{sire.name}</h3>
        <div className="sires__card-actions">
          <button
            onClick={onEdit}
            className="sires__card-action"
            aria-label="Edit sire"
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="sires__card-action sires__card-action--delete"
            aria-label="Delete sire"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      <div className="sires__card-body">
        <div className="sires__card-field">
          <span className="sires__card-label">Breed:</span>
          <span className="sires__card-value">{sire.breed}</span>
        </div>
        {sire.price_for_semen && (
          <div className="sires__card-field">
            <span className="sires__card-label">Conventional:</span>
            <span className="sires__card-value sires__card-value--price">
              ${Number(sire.price_for_semen).toFixed(2)}
            </span>
          </div>
        )}
        {sire.price_for_sexed_semen && (
          <div className="sires__card-field">
            <span className="sires__card-label">Sexed:</span>
            <span className="sires__card-value sires__card-value--price">
              ${Number(sire.price_for_sexed_semen).toFixed(2)}
            </span>
          </div>
        )}
        <div className="sires__card-field">
          <span className="sires__card-label">Owner:</span>
          <span className="sires__card-value">
            {ownerLabel(sire.owner_type, sire.customer?.name)}
          </span>
        </div>
        {sire.registration_number && (
          <div className="sires__card-field">
            <span className="sires__card-label">Registration #:</span>
            <span className="sires__card-value">{sire.registration_number}</span>
          </div>
        )}
        {sire.notes && (
          <div className="sires__card-field sires__card-field--notes">
            <span className="sires__card-label">Notes:</span>
            <p className="sires__card-notes">{sire.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
