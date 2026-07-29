import { supabase } from '../lib/supabase';
import type { ActivityLogInsert } from '../types';

export const logActivity = async (activityData: ActivityLogInsert): Promise<void> => {
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert([activityData]);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

interface FetchActivityLogOptions {
  entityType?: string;
  actionType?: string;
  limit?: number;
  offset?: number;
}

export const fetchActivityLog = async (options: FetchActivityLogOptions = {}) => {
  const { entityType, actionType, limit = 25, offset = 0 } = options;

  try {
    let query = supabase
      .from('activity_log')
      .select(`
        *,
        user:employees!user_id(id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return { data: [], count: 0, error: error as Error };
  }
};
