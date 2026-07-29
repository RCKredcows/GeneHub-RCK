import { FiPlus, FiEdit2, FiTrash2, FiX, FiMove } from 'react-icons/fi';
import { useDragReorder } from '../../hooks/useDragReorder';
import './styles.css';

interface CanisterItem {
  id: string;
  canister_number: string;
  position_in_tank: number | null;
  inventory_count?: number;
  [key: string]: unknown;
}

interface TankItem {
  id: string;
  tank_name: string;
  canister_count?: number;
  [key: string]: unknown;
}

interface CanisterManagerProps {
  tank: TankItem | null;
  canisters: Record<string, CanisterItem[]>;
  isOpen: boolean;
  onClose: () => void;
  onOpenCanisterForm: (tank: TankItem, canister?: CanisterItem) => void;
  onDeleteCanister: (canister: CanisterItem, tankId: string) => void;
  onReorderCanisters: (tankId: string, reordered: CanisterItem[]) => void;
  onViewInventory: (canister: CanisterItem) => void;
}

export default function CanisterManager({
  tank,
  canisters,
  isOpen,
  onClose,
  onOpenCanisterForm,
  onDeleteCanister,
  onReorderCanisters,
  onViewInventory
}: CanisterManagerProps) {
  const tankCanisters = tank ? (canisters[tank.id] || []) : [];
  // Check if we're still loading canisters (we know there are some but haven't fetched yet)
  const isLoadingCanisters = tank && (tank.canister_count ?? 0) > 0 && tankCanisters.length === 0;

  const {
    isDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragReorder(tankCanisters, (reordered) => {
    onReorderCanisters(tank!.id, reordered as CanisterItem[]);
  });

  if (!isOpen || !tank) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container canister-manager__modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-title">{tank.tank_name} Contents</h2>
          <button
            className="form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="form-body">
          <div className="canister-manager__actions">
            <button
              className="canister-manager__add-btn"
              onClick={() => onOpenCanisterForm(tank)}
            >
              <FiPlus size={18} />
              Add Canister
            </button>
          </div>

          {isLoadingCanisters ? (
            <div className="canister-manager__loading">
              <p>Loading canisters...</p>
            </div>
          ) : tankCanisters.length > 0 ? (
            <div className="canister-manager__grid">
              {tankCanisters.map((canister, index) => {
                // Use inventory_count from canister data (fetched with canisters)
                const itemCount = canister.inventory_count || 0;

                return (
                  <div
                    key={canister.id}
                    data-draggable
                    className={`canister-manager__card ${isDragOver(canister) ? 'canister-manager__card--drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, canister)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, canister)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, canister)}
                  >
                    <div className="canister-manager__drag-handle" title="Drag to reorder">
                      <FiMove size={14} />
                    </div>
                    <button
                      onClick={() => onViewInventory(canister)}
                      className="canister-manager__btn"
                    >
                      <div className="canister-manager__visual">
                        <div className="canister-manager__lid" />
                        <div className="canister-manager__cylinder" />
                      </div>
                      <span className="canister-manager__number">#{canister.canister_number}</span>
                      <span className="canister-manager__position">Pos: {index + 1}</span>
                      <span className="canister-manager__count">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </button>
                    <div className="canister-manager__card-actions">
                      <button
                        className="canister-manager__action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCanisterForm(tank, canister);
                        }}
                        title="Edit canister"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        className="canister-manager__action canister-manager__action--delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCanister(canister, tank.id);
                        }}
                        title="Delete canister"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="canister-manager__empty">
              <p>No canisters in this tank</p>
              <p className="canister-manager__empty-hint">Click "Add Canister" to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
