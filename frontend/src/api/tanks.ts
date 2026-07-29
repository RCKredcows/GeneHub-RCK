import { supabase } from '../lib/supabase';
import { logActivity } from './activityLog';
import type { TankInsert, TankUpdate, TankWithCount } from '../types';

export const normalizeTankPositions = async (excludeTankId?: string) => {
  try {
    const { error } = await supabase.rpc('normalize_tank_positions', {
      exclude_tank_id: excludeTankId
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error normalizing tank positions:', error);
    return { success: false, error: error as Error };
  }
};

export const updateTankPosition = async (tankId: string, newPosition: number, oldPosition?: number) => {
  try {
    const { error } = await supabase.rpc('update_tank_position', {
      tank_id: tankId,
      new_position: newPosition,
      old_position: oldPosition
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating tank position:', error);
    return { success: false, error: error as Error };
  }
};

export const insertTankAtPosition = async (targetPosition: number) => {
  try {
    const { error } = await supabase.rpc('insert_tank_at_position', {
      target_position: targetPosition
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error inserting tank at position:', error);
    return { success: false, error: error as Error };
  }
};

export const fetchTanks = async (): Promise<{ data: TankWithCount[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('tanks')
      .select(`
        id,
        tenant_id,
        tank_name,
        location,
        capacity,
        nitrogen_capacity,
        nitrogen_level,
        nitrogen_unit,
        low_level_threshold,
        last_filled_date,
        notes,
        sort_order,
        created_at,
        updated_at,
        canisters(count)
      `)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('tank_name', { ascending: true });

    if (error) throw error;

    // Transform data to include canister_count as a simple number
    const tanksWithCount = (data || []).map(tank => ({
      ...tank,
      canister_count: (tank.canisters as unknown as { count: number }[])?.[0]?.count || 0,
      canisters: undefined // Remove the nested canisters array
    }));

    return { data: tanksWithCount, error: null };
  } catch (error) {
    console.error('Error fetching tanks:', error);
    return { data: [], error: error as Error };
  }
};

export const createTank = async (tankData: TankInsert, userId: string | null = null) => {
  try {
    const { data, error } = await supabase
      .from('tanks')
      .insert([tankData])
      .select()
      .single();

    if (error) throw error;

    // Log initial nitrogen level if set
    if (data && tankData.nitrogen_level && parseFloat(String(tankData.nitrogen_level)) > 0) {
      await supabase
        .from('nitrogen_fill_history')
        .insert([{
          tank_id: data.id,
          event_type: 'fill',
          amount_added: parseFloat(String(tankData.nitrogen_level)),
          nitrogen_level_before: 0,
          nitrogen_level_after: parseFloat(String(tankData.nitrogen_level)),
          filled_by: userId,
          notes: 'Initial tank setup',
          fill_date: new Date().toISOString()
        }]);
    }

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'tank',
        entity_id: data.id,
        entity_name: data.tank_name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating tank:', error);
    return { data: null, error: error as Error };
  }
};

export const updateTankNitrogenLevel = async (id: string, updates: TankUpdate) => {
  try {
    const { data, error } = await supabase
      .from('tanks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating tank nitrogen level:', error);
    return { data: null, error: error as Error };
  }
};

interface PreviousTank {
  nitrogen_level?: number | null;
}

export const updateTank = async (
  id: string,
  updates: TankUpdate,
  userId: string | null = null,
  previousTank: PreviousTank | null = null
) => {
  try {
    // Get current tank data if not provided
    let oldNitrogenLevel = previousTank?.nitrogen_level;
    if (oldNitrogenLevel === undefined && updates.nitrogen_level !== undefined) {
      const { data: currentTank } = await supabase
        .from('tanks')
        .select('nitrogen_level')
        .eq('id', id)
        .single();
      oldNitrogenLevel = currentTank?.nitrogen_level;
    }

    const { data, error } = await supabase
      .from('tanks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log nitrogen level change if it changed
    if (updates.nitrogen_level !== undefined && oldNitrogenLevel !== undefined) {
      const oldLevel = parseFloat(String(oldNitrogenLevel)) || 0;
      const newLevel = parseFloat(String(updates.nitrogen_level)) || 0;

      if (oldLevel !== newLevel) {
        const diff = newLevel - oldLevel;
        await supabase
          .from('nitrogen_fill_history')
          .insert([{
            tank_id: id,
            event_type: diff > 0 ? 'fill' : 'drop',
            amount_added: Math.abs(diff),
            nitrogen_level_before: oldLevel,
            nitrogen_level_after: newLevel,
            filled_by: userId,
            notes: 'Manual adjustment',
            fill_date: new Date().toISOString()
          }]);
      }
    }

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'tank',
        entity_id: data.id,
        entity_name: data.tank_name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating tank:', error);
    return { data: null, error: error as Error };
  }
};

export const updateTankSortOrder = async (id: string, sortOrder: number) => {
  try {
    const { data, error } = await supabase
      .from('tanks')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating tank sort order:', error);
    return { data: null, error: error as Error };
  }
};

export const checkTankHasInventory = async (tankId: string) => {
  try {
    const { count, error } = await supabase
      .from('genetic_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('tank_id', tankId);

    if (error) throw error;

    return { hasInventory: (count ?? 0) > 0, count: count || 0, error: null };
  } catch (error) {
    console.error('Error checking tank inventory:', error);
    return { hasInventory: false, count: 0, error: error as Error };
  }
};

export const deleteTank = async (
  id: string,
  force = false,
  userId: string | null = null,
  tankName: string | null = null
) => {
  try {
    // Check for associated inventory first (unless forced)
    if (!force) {
      const { hasInventory, count } = await checkTankHasInventory(id);
      if (hasInventory) {
        return {
          success: false,
          error: new Error(`Cannot delete tank. There ${count === 1 ? 'is' : 'are'} ${count} inventory item${count === 1 ? '' : 's'} stored in this tank. Please move or delete the inventory first.`)
        };
      }
    }

    const { error } = await supabase
      .from('tanks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && tankName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'tank',
        entity_id: id,
        entity_name: tankName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting tank:', error);
    return { success: false, error: error as Error };
  }
};

export const getLowNitrogenTanks = async () => {
  try {
    const { data, error } = await supabase
      .from('tanks')
      .select('*')
      .not('nitrogen_level', 'is', null)
      .not('nitrogen_capacity', 'is', null)
      .not('low_level_threshold', 'is', null);

    if (error) throw error;

    // Filter tanks where current level is below threshold
    const lowTanks = (data || []).filter(tank => {
      if (!tank.nitrogen_level || !tank.nitrogen_capacity || !tank.low_level_threshold) return false;
      const percentage = (tank.nitrogen_level / tank.nitrogen_capacity) * 100;
      return percentage <= tank.low_level_threshold;
    });

    return { data: lowTanks, error: null };
  } catch (error) {
    console.error('Error fetching low nitrogen tanks:', error);
    return { data: [], error: error as Error };
  }
};

interface NitrogenFillData {
  tank_id: string;
  event_type: string;
  amount_added: number;
  nitrogen_level_before: number;
  nitrogen_level_after: number;
  notes?: string;
}

export const logNitrogenFill = async (
  fillData: NitrogenFillData,
  userId: string | null = null,
  tankName: string | null = null
) => {
  try {
    const { data, error } = await supabase
      .from('nitrogen_fill_history')
      .insert([{
        ...fillData,
        fill_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update the tank's current nitrogen level
    const updates: TankUpdate = {
      nitrogen_level: fillData.nitrogen_level_after
    };

    // Only update last_filled_date for fill events
    if (fillData.event_type === 'fill') {
      updates.last_filled_date = new Date().toISOString();
    }

    await updateTankNitrogenLevel(fillData.tank_id, updates);

    // Log activity
    if (userId && tankName) {
      const actionVerb = fillData.event_type === 'fill' ? 'filled' : 'adjusted';
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'tank',
        entity_id: fillData.tank_id,
        entity_name: tankName,
        metadata: {
          change: actionVerb,
          amount: fillData.amount_added
        }
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error logging nitrogen event:', error);
    return { data: null, error: error as Error };
  }
};

export const getNitrogenFillHistory = async (tankId: string, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('nitrogen_fill_history')
      .select(`
        *,
        employees:employees!nitrogen_fill_history_filled_by_fkey (
          id,
          full_name
        )
      `)
      .eq('tank_id', tankId)
      .order('fill_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching nitrogen fill history:', error);
    return { data: [], error: error as Error };
  }
};

export const clearNitrogenFillHistory = async (tankId: string) => {
  try {
    const { error } = await supabase
      .from('nitrogen_fill_history')
      .delete()
      .eq('tank_id', tankId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error clearing nitrogen fill history:', error);
    return { success: false, error: error as Error };
  }
};

export const deleteNitrogenFillEvent = async (eventId: string) => {
  try {
    const { error } = await supabase
      .from('nitrogen_fill_history')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting nitrogen fill event:', error);
    return { success: false, error: error as Error };
  }
};

export const getNitrogenConsumptionStats = async (tankId: string, days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('nitrogen_fill_history')
      .select('*')
      .eq('tank_id', tankId)
      .gte('fill_date', cutoffDate.toISOString())
      .order('fill_date', { ascending: true });

    if (error) throw error;

    // Separate fills and drops
    const fills = (data || []).filter(e => e.event_type !== 'drop');
    const drops = (data || []).filter(e => e.event_type === 'drop');

    // Calculate totals
    const totalNitrogenAdded = fills.reduce((sum, fill) => sum + parseFloat(String(fill.amount_added || 0)), 0);
    const totalNitrogenDropped = drops.reduce((sum, drop) => sum + parseFloat(String(drop.amount_added || 0)), 0);

    if (!data || data.length < 1) {
      return {
        data: {
          averageConsumptionPerDay: null,
          totalFills: fills.length,
          totalDrops: drops.length,
          totalNitrogenAdded,
          totalNitrogenDropped,
          periodDays: days,
          message: 'Not enough data to calculate consumption rate'
        },
        error: null
      };
    }

    // Calculate average daily loss based on recorded drops and time period
    const firstEvent = data[0];
    const lastEvent = data[data.length - 1];
    const totalDays = (new Date(lastEvent.fill_date!).getTime() - new Date(firstEvent.fill_date!).getTime()) / (1000 * 60 * 60 * 24);

    const effectiveDays = Math.max(totalDays, 1);
    const averageConsumptionPerDay = totalNitrogenDropped > 0
      ? totalNitrogenDropped / effectiveDays
      : null;

    return {
      data: {
        averageConsumptionPerDay,
        totalFills: fills.length,
        totalDrops: drops.length,
        totalNitrogenAdded,
        totalNitrogenDropped,
        totalEvents: data.length,
        periodDays: days
      },
      error: null
    };
  } catch (error) {
    console.error('Error calculating nitrogen consumption:', error);
    return { data: null, error: error as Error };
  }
};
