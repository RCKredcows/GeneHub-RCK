import { FiFolder, FiFolderPlus, FiChevronRight, FiChevronDown, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface CategoryData {
  id: string;
  name: string;
  children?: CategoryData[];
  [key: string]: unknown;
}

interface CategoryCounts {
  total: number;
  lowStock: number;
  expiring: number;
  byCategory?: Record<string, number>;
  [key: string]: unknown;
}

interface CategoryNodeProps {
  category: CategoryData;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onEdit: (category: CategoryData) => void;
  onDelete: (category: CategoryData) => void;
  counts: CategoryCounts;
  depth?: number;
}

function CategoryNode({ category, expandedIds, selectedId, onToggleExpand, onSelect, onEdit, onDelete, counts, depth = 0 }: CategoryNodeProps) {
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedId === category.id;
  const hasChildren = category.children && category.children.length > 0;
  const itemCount = counts?.byCategory?.[category.id] || 0;

  return (
    <div className="category-tree__node">
      <div
        className={`category-tree__item ${isSelected ? 'category-tree__item--selected' : ''}`}
        style={{ paddingInlineStart: `${depth * 1.25 + 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            className="category-tree__expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(category.id);
            }}
          >
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        ) : (
          <span className="category-tree__expand-spacer" />
        )}

        <button
          className="category-tree__name"
          onClick={() => onSelect(category.id)}
        >
          <FiFolder size={16} className="category-tree__icon" />
          <span>{category.name}</span>
          <span className="category-tree__item-count">{itemCount}</span>
        </button>

        <div className="category-tree__actions">
          <button
            className="category-tree__action"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            title="Edit folder"
          >
            <FiEdit2 size={14} />
          </button>
          <button
            className="category-tree__action category-tree__action--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            title="Delete folder"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="category-tree__children">
          {category.children!.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              counts={counts}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryTreeProps {
  categories: CategoryData[];
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onEdit: (category: CategoryData) => void;
  onDelete: (category: CategoryData) => void;
  onClearSelection: () => void;
  counts: CategoryCounts;
}

export default function CategoryTree({
  categories,
  expandedIds,
  selectedId,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onClearSelection,
  counts
}: CategoryTreeProps) {
  return (
    <div className="category-tree">
      {/* All Items Option */}
      <button
        className={`category-tree__all-items ${!selectedId ? 'category-tree__all-items--selected' : ''}`}
        onClick={onClearSelection}
      >
        <FiFolderPlus size={16} />
        <span>All Items</span>
        <span className="category-tree__count">{counts.total}</span>
      </button>

      {/* Category Tree */}
      <div className="category-tree__list">
        {categories.length === 0 ? (
          <p className="category-tree__empty">No folders yet</p>
        ) : (
          categories.map(category => (
            <CategoryNode
              key={category.id}
              category={category}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              counts={counts}
            />
          ))
        )}
      </div>

      {/* Quick Stats */}
      {(counts.lowStock > 0 || counts.expiring > 0) && (
        <div className="category-tree__alerts">
          {counts.lowStock > 0 && (
            <div className="category-tree__alert category-tree__alert--low">
              {counts.lowStock} low stock
            </div>
          )}
          {counts.expiring > 0 && (
            <div className="category-tree__alert category-tree__alert--expiring">
              {counts.expiring} expiring soon
            </div>
          )}
        </div>
      )}
    </div>
  );
}
