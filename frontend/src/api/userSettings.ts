import { supabase } from '../lib/supabase';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import type { UserSettings, UserSettingsUpdate, Json } from '../types';

export const fetchUserSettings = async (userId: string | undefined) => {
  if (!userId) {
    return { data: DEFAULT_SETTINGS as unknown as UserSettings, error: null };
  }

  try {
    let { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no settings exist, create default settings
    if (error?.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await createUserSettings(userId);
      if (createError) throw createError;
      data = newSettings;
    } else if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { data: DEFAULT_SETTINGS as unknown as UserSettings, error: error as Error };
  }
};

export const createUserSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        dashboard_widgets: DEFAULT_SETTINGS.dashboard_widgets as unknown as Json,
        dashboard_tank_display_count: DEFAULT_SETTINGS.dashboard_tank_display_count,
        items_per_page: DEFAULT_SETTINGS.items_per_page,
        medical_expiration_warning_days: DEFAULT_SETTINGS.medical_expiration_warning_days,
        dark_mode: DEFAULT_SETTINGS.dark_mode,
        // Notification settings
        email_notifications_enabled: DEFAULT_SETTINGS.email_notifications_enabled,
        notify_low_nitrogen: DEFAULT_SETTINGS.notify_low_nitrogen,
        notify_low_medical_stock: DEFAULT_SETTINGS.notify_low_medical_stock,
        notify_periodic_reminder: DEFAULT_SETTINGS.notify_periodic_reminder,
        notification_email: DEFAULT_SETTINGS.notification_email
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating user settings:', error);
    return { data: null, error: error as Error };
  }
};

export const updateUserSettings = async (userId: string, updates: UserSettingsUpdate) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { data: null, error: error as Error };
  }
};
