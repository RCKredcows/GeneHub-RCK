export interface WidgetConfig {
  visible: boolean;
  order: number;
}

export interface DashboardWidgets {
  statCards: Record<string, WidgetConfig>;
  sections: Record<string, WidgetConfig>;
}

export interface DefaultSettingsType {
  dashboard_widgets: DashboardWidgets;
  dashboard_tank_display_count: number;
  items_per_page: number;
  medical_expiration_warning_days: number;
  dark_mode: boolean;
  email_notifications_enabled: boolean;
  notify_low_nitrogen: boolean;
  notify_low_medical_stock: boolean;
  notify_periodic_reminder: boolean;
  notification_email: string | null;
}

export const DEFAULT_SETTINGS: DefaultSettingsType = {
  dashboard_widgets: {
    statCards: {
      geneticInventory: { visible: true, order: 0 },
      tanks: { visible: true, order: 1 },
      sires: { visible: true, order: 2 },
      customers: { visible: true, order: 3 },
      medicalInventory: { visible: true, order: 4 }
    },
    sections: {
      alerts: { visible: true, order: 0 },
      tankStatus: { visible: true, order: 1 },
      medicalInventory: { visible: true, order: 2 }
    }
  },
  dashboard_tank_display_count: 4,
  items_per_page: 25,
  medical_expiration_warning_days: 30,
  dark_mode: false,
  email_notifications_enabled: true,
  notify_low_nitrogen: true,
  notify_low_medical_stock: true,
  notify_periodic_reminder: true,
  notification_email: null
};

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 25, label: '25' },
  { value: 50, label: '50' }
] as const;

export const TANK_DISPLAY_COUNT_OPTIONS = [
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
  { value: 8, label: '8' },
  { value: 10, label: '10' }
] as const;

export const STAT_CARD_CONFIG: Record<string, { label: string; key: string }> = {
  geneticInventory: { label: 'Genetic Inventory', key: 'geneticInventory' },
  tanks: { label: 'Semen Tanks', key: 'tanks' },
  sires: { label: 'Sires', key: 'sires' },
  customers: { label: 'Customers', key: 'customers' },
  medicalInventory: { label: 'Medical Inventory', key: 'medicalInventory' }
};

export const SECTION_CONFIG: Record<string, { label: string; key: string }> = {
  alerts: { label: 'Alerts', key: 'alerts' },
  tankStatus: { label: 'Tank Status', key: 'tankStatus' },
  medicalInventory: { label: 'Medical Inventory', key: 'medicalInventory' }
};
