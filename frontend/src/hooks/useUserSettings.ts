import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserSettings, updateUserSettings } from '../api/userSettings';
import { DEFAULT_SETTINGS, type DashboardWidgets } from '../constants/defaultSettings';
import { QUERY_KEYS } from '../constants/queryKeys';
import type { UserSettings } from '../types';

interface UseUserSettingsOptions {
  localOnly?: boolean;
}

interface SettingsResult {
  success: boolean;
  data?: UserSettings;
  error?: string;
}

interface UpdateMutationVariables {
  updates: Partial<UserSettings>;
}

interface SaveMutationVariables {
  settings: UserSettings;
}

/**
 * Hook for managing user settings
 * Supports local-only mode for batching changes before save
 */
export function useUserSettings(userId: string | undefined, options: UseUserSettingsOptions = {}) {
  const { localOnly = false } = options;
  const queryClient = useQueryClient();

  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Track original settings to detect changes
  const originalSettingsRef = useRef<string | null>(null);

  // Query for user settings
  const settingsQuery = useQuery({
    queryKey: QUERY_KEYS.userSettings(userId!),
    queryFn: async () => {
      const { data, error } = await fetchUserSettings(userId!);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    placeholderData: DEFAULT_SETTINGS as unknown as UserSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const serverSettings = (settingsQuery.data || DEFAULT_SETTINGS) as UserSettings;
  const loading = settingsQuery.isLoading;
  const error = settingsQuery.error?.message || null;

  // Mutation for updating settings with optimistic updates
  const updateMutation = useMutation<UserSettings | null, unknown, UpdateMutationVariables, { previousSettings?: unknown }>({
    mutationFn: async ({ updates }) => {
      const [result] = await Promise.all([
        updateUserSettings(userId!, updates),
        new Promise(resolve => setTimeout(resolve, 300))
      ]);
      if (result.error) throw result.error;
      return result.data;
    },
    onMutate: async ({ updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSettings(userId!) });
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(QUERY_KEYS.userSettings(userId!));
      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.userSettings(userId!), (prev: unknown) => ({ ...(prev as object), ...updates }));
      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEYS.userSettings(userId!), context.previousSettings);
      }
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSettings(userId!) });
    }
  });

  // Mutation for batch save (localOnly mode)
  const saveMutation = useMutation<UserSettings | null, unknown, SaveMutationVariables>({
    mutationFn: async ({ settings }) => {
      const [result] = await Promise.all([
        updateUserSettings(userId!, settings),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data) => {
      setLocalSettings(data);
      originalSettingsRef.current = JSON.stringify(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSettings(userId!) });
    }
  });

  const saving = updateMutation.isPending || saveMutation.isPending;

  // The active settings (local if in local mode, otherwise server)
  const settings = useMemo(() => {
    return localOnly && localSettings ? localSettings : serverSettings;
  }, [localOnly, localSettings, serverSettings]);

  // Sync local settings when server settings load (for localOnly mode)
  useEffect(() => {
    if (localOnly && serverSettings && !initialized && !settingsQuery.isLoading) {
      setLocalSettings(serverSettings);
      originalSettingsRef.current = JSON.stringify(serverSettings);
      setInitialized(true);
    }
  }, [localOnly, serverSettings, initialized, settingsQuery.isLoading]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!localOnly || !localSettings) return false;
    return JSON.stringify(localSettings) !== originalSettingsRef.current; // eslint-disable-line react-hooks/refs
  }, [localOnly, localSettings]);

  // Update setting locally only (no API call)
  const updateSettingLocal = useCallback((key: string, value: unknown) => {
    setLocalSettings(prev => ({ ...(prev || serverSettings), [key]: value }) as UserSettings);
  }, [serverSettings]);

  // Save all local changes to server
  const saveSettings = useCallback(async (): Promise<SettingsResult> => {
    if (!userId || !localSettings) return { success: false, error: 'No changes to save' };

    try {
      const data = await saveMutation.mutateAsync({ settings: localSettings });
      return { success: true, data: data as UserSettings | undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [userId, localSettings, saveMutation]);

  // Discard local changes
  const discardChanges = useCallback(() => {
    setLocalSettings(serverSettings);
    originalSettingsRef.current = JSON.stringify(serverSettings);

    // Revert dark mode to server state
    if ((serverSettings as Record<string, unknown>).dark_mode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('darkMode', 'false');
    }
  }, [serverSettings]);

  // Generic update function - local or server based on mode
  const updateSetting = useCallback(async (key: string, value: unknown): Promise<SettingsResult> => {
    if (localOnly) {
      updateSettingLocal(key, value);
      return { success: true };
    }

    if (!userId) return { success: false, error: 'No user' };

    try {
      const data = await updateMutation.mutateAsync({ updates: { [key]: value } as Partial<UserSettings> });
      return { success: true, data: data as UserSettings | undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [userId, localOnly, updateSettingLocal, updateMutation]);

  // Specific update functions
  const updateDashboardWidgets = useCallback((widgetConfig: DashboardWidgets) => {
    return updateSetting('dashboard_widgets', widgetConfig);
  }, [updateSetting]);

  const updateTankDisplayCount = useCallback((count: number) => {
    return updateSetting('dashboard_tank_display_count', count);
  }, [updateSetting]);

  const updateItemsPerPage = useCallback((count: number) => {
    return updateSetting('items_per_page', count);
  }, [updateSetting]);

  const updateMedicalWarningDays = useCallback((days: number) => {
    return updateSetting('medical_expiration_warning_days', days);
  }, [updateSetting]);

  const updateDarkMode = useCallback(async (enabled: boolean) => {
    // Also update localStorage for initial load before auth
    localStorage.setItem('darkMode', enabled.toString());

    // Apply theme immediately
    if (enabled) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    return updateSetting('dark_mode', enabled);
  }, [updateSetting]);

  // Notification settings update functions
  const updateEmailNotificationsEnabled = useCallback((enabled: boolean) => {
    return updateSetting('email_notifications_enabled', enabled);
  }, [updateSetting]);

  const updateNotifyLowNitrogen = useCallback((enabled: boolean) => {
    return updateSetting('notify_low_nitrogen', enabled);
  }, [updateSetting]);

  const updateNotifyLowMedicalStock = useCallback((enabled: boolean) => {
    return updateSetting('notify_low_medical_stock', enabled);
  }, [updateSetting]);

  const updateNotifyPeriodicReminder = useCallback((enabled: boolean) => {
    return updateSetting('notify_periodic_reminder', enabled);
  }, [updateSetting]);

  const updateNotificationEmail = useCallback((email: string | null) => {
    return updateSetting('notification_email', email || null);
  }, [updateSetting]);

  // Helper to update dashboard widgets using functional pattern
  const updateWidgetsWithTransform = useCallback((transformFn: (widgets: DashboardWidgets) => DashboardWidgets) => {
    if (localOnly) {
      setLocalSettings(prev => {
        const currentSettings = prev || serverSettings;
        const currentWidgets = (currentSettings as Record<string, unknown>).dashboard_widgets as DashboardWidgets;
        const newWidgets = transformFn(JSON.parse(JSON.stringify(currentWidgets)));
        return { ...currentSettings, dashboard_widgets: newWidgets } as unknown as UserSettings;
      });
      return { success: true };
    } else {
      const currentWidgets = (serverSettings as Record<string, unknown>).dashboard_widgets as DashboardWidgets;
      const newWidgets = transformFn(JSON.parse(JSON.stringify(currentWidgets)));
      return updateDashboardWidgets(newWidgets);
    }
  }, [localOnly, serverSettings, updateDashboardWidgets]);

  // Widget visibility helpers
  const toggleStatCardVisibility = useCallback((cardKey: string) => {
    return updateWidgetsWithTransform(widgets => {
      widgets.statCards[cardKey].visible = !widgets.statCards[cardKey].visible;
      return widgets;
    });
  }, [updateWidgetsWithTransform]);

  const toggleSectionVisibility = useCallback((sectionKey: string) => {
    return updateWidgetsWithTransform(widgets => {
      widgets.sections[sectionKey].visible = !widgets.sections[sectionKey].visible;
      return widgets;
    });
  }, [updateWidgetsWithTransform]);

  // Reorder helpers
  const reorderStatCards = useCallback((orderedKeys: string[]) => {
    return updateWidgetsWithTransform(widgets => {
      orderedKeys.forEach((key, index) => {
        widgets.statCards[key].order = index;
      });
      return widgets;
    });
  }, [updateWidgetsWithTransform]);

  const reorderSections = useCallback((orderedKeys: string[]) => {
    return updateWidgetsWithTransform(widgets => {
      orderedKeys.forEach((key, index) => {
        widgets.sections[key].order = index;
      });
      return widgets;
    });
  }, [updateWidgetsWithTransform]);

  // Dashboard widgets for computed values
  const dashboardWidgets = (settings as Record<string, unknown>).dashboard_widgets as DashboardWidgets | undefined;

  // Computed sorted lists
  const sortedStatCards = useMemo(() => {
    const cards = dashboardWidgets?.statCards || {};
    return Object.entries(cards)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, config]) => ({ key, ...config }));
  }, [dashboardWidgets]);

  const sortedSections = useMemo(() => {
    const sections = dashboardWidgets?.sections || {};
    return Object.entries(sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, config]) => ({ key, ...config }));
  }, [dashboardWidgets]);

  const refresh = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSettings(userId) });
  }, [userId, queryClient]);

  return {
    // State
    settings,
    loading,
    error,
    saving,
    hasUnsavedChanges,

    // Computed
    sortedStatCards,
    sortedSections,

    // Actions
    updateSetting,
    updateDashboardWidgets,
    updateTankDisplayCount,
    updateItemsPerPage,
    updateMedicalWarningDays,
    updateDarkMode,
    toggleStatCardVisibility,
    toggleSectionVisibility,
    reorderStatCards,
    reorderSections,
    refresh,

    // Notification settings actions
    updateEmailNotificationsEnabled,
    updateNotifyLowNitrogen,
    updateNotifyLowMedicalStock,
    updateNotifyPeriodicReminder,
    updateNotificationEmail,

    // Batch save actions (for localOnly mode)
    saveSettings,
    discardChanges
  };
}
