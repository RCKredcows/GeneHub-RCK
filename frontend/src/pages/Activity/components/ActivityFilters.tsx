interface ActivityFiltersData {
  entityType: string;
  actionType: string;
  [key: string]: unknown;
}

interface ActivityFiltersProps {
  filters: ActivityFiltersData;
  onFilterChange: (updates: Partial<ActivityFiltersData>) => void;
}

export default function ActivityFilters({ filters, onFilterChange }: ActivityFiltersProps) {
  return (
    <div className="activity__filters">
      <select
        value={filters.entityType}
        onChange={(e) => onFilterChange({ entityType: e.target.value })}
        className="activity__filter-select"
        aria-label="Filter by entity type"
      >
        <option value="">All Entities</option>
        <option value="customer">Customers</option>
        <option value="sire">Sires</option>
        <option value="tank">Tanks</option>
        <option value="canister">Canisters</option>
        <option value="genetic_inventory">Genetic Inventory</option>
        <option value="medical_inventory">Medical Inventory</option>
        <option value="medical_category">Medical Categories</option>
      </select>

      <select
        value={filters.actionType}
        onChange={(e) => onFilterChange({ actionType: e.target.value })}
        className="activity__filter-select"
        aria-label="Filter by action type"
      >
        <option value="">All Actions</option>
        <option value="create">Created</option>
        <option value="update">Updated</option>
        <option value="delete">Deleted</option>
      </select>
    </div>
  );
}
