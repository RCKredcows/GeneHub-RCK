import { useActivityLogList } from './useActivityLogList';

/**
 * Composed hook for activity log management.
 * Provides state and actions for the Activity page.
 */
export function useActivityLog(itemsPerPage?: number) {
  const activityList = useActivityLogList(itemsPerPage);

  return {
    // State
    activities: activityList.activities,
    totalCount: activityList.totalCount,
    loading: activityList.loading,
    error: activityList.error,
    filters: activityList.filters,

    // Pagination
    currentPage: activityList.currentPage,
    totalPages: activityList.totalPages,

    // Actions
    setFilters: activityList.setFilters,
    refresh: activityList.refresh,
    goToPage: activityList.goToPage,

    // Helpers
    getEntityLink: activityList.getEntityLink,
    formatActionLabel: activityList.formatActionLabel
  };
}

export { useActivityLogList } from './useActivityLogList';
