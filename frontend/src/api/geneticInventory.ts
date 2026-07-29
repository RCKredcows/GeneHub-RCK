import { supabase } from '../lib/supabase';
import { logActivity } from './activityLog';
import type { GeneticInventoryInsert, GeneticInventoryUpdate, CanisterInsert, CanisterUpdate, CanisterWithCount, Json } from '../types';

export const fetchInventoryCounts = async () => {
  try {
    // Run all count queries in parallel
    const [totalResult, semenResult, embryoResult, customerResult] = await Promise.all([
      supabase
        .from('genetic_inventory')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('genetic_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('inventory_type', 'semen'),
      supabase
        .from('genetic_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('inventory_type', 'embryo'),
      supabase
        .from('genetic_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('owner_type', 'customer')
    ]);

    // Check for errors
    if (totalResult.error) throw totalResult.error;
    if (semenResult.error) throw semenResult.error;
    if (embryoResult.error) throw embryoResult.error;
    if (customerResult.error) throw customerResult.error;

    const counts = {
      total: totalResult.count || 0,
      semen: semenResult.count || 0,
      embryo: embryoResult.count || 0,
      customerOwned: customerResult.count || 0
    };

    return { counts, error: null };
  } catch (error) {
    console.error('Error fetching inventory counts:', error);
    return { counts: { total: 0, semen: 0, embryo: 0, customerOwned: 0 }, error: error as Error };
  }
};

interface FetchGeneticInventoryPaginatedOptions {
  ownerType?: string;
  inventoryType?: string;
  sexType?: string;
  ivfFilter?: string;
  statusFilter?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const fetchGeneticInventoryPaginated = async (options: FetchGeneticInventoryPaginatedOptions = {}) => {
  const {
    ownerType = 'all',
    inventoryType = 'all',
    sexType = 'all',
    ivfFilter = 'all',
    statusFilter = 'stored',
    searchQuery = '',
    limit = 25,
    offset = 0
  } = options;

  try {
    const { data, error } = await supabase.rpc('search_genetic_inventory', {
      search_term: searchQuery || '',
      owner_filter: ownerType,
      type_filter: inventoryType,
      sex_filter: sexType,
      ivf_filter: ivfFilter,
      status_filter: statusFilter,
      page_limit: limit,
      page_offset: offset
    });

    if (error) throw error;

    // Extract total count from first row (all rows have same total_count)
    const count = data?.[0]?.total_count || 0;

    // Transform data to match expected format (nest related data)
    const transformedData = (data || []).map(row => ({
      id: row.id,
      inventory_type: row.inventory_type,
      owner_type: row.owner_type,
      customer_id: row.customer_id,
      sire_id: row.sire_id,
      breed: row.breed,
      tank_id: row.tank_id,
      canister_id: row.canister_id,
      cane_number: row.cane_number,
      quantity: row.quantity,
      original_quantity: row.original_quantity,
      unit: row.unit,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      embryo_name: row.embryo_name,
      price_for_semen: row.price_for_semen,
      sex_type: row.sex_type,
      is_ivf: row.is_ivf,
      // Nested relations to match existing format
      sire: row.sire_id ? { id: row.sire_id, name: row.sire_name, breed: row.sire_breed } : null,
      customer: row.customer_id ? { id: row.customer_id, name: row.customer_name } : null,
      tank: row.tank_id ? { id: row.tank_id, tank_name: row.tank_name } : null,
      canister: row.canister_id ? { id: row.canister_id, canister_number: row.canister_number } : null
    }));

    return { data: transformedData, count: Number(count), error: null };
  } catch (error) {
    console.error('Error fetching paginated genetic inventory:', error);
    return { data: [], count: 0, error: error as Error };
  }
};

export const createGeneticInventory = async (inventoryData: GeneticInventoryInsert, userId: string, entityName: string) => {
  try {
    const { data, error } = await supabase
      .from('genetic_inventory')
      .insert([inventoryData])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'genetic_inventory',
        entity_id: data.id,
        entity_name: entityName || `${inventoryData.inventory_type} inventory`
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating genetic inventory:', error);
    return { data: null, error: error as Error };
  }
};

export const updateGeneticInventory = async (
  id: string,
  updates: GeneticInventoryUpdate,
  userId: string,
  entityName: string,
  metadata: Json = null
) => {
  try {
    const { data, error } = await supabase
      .from('genetic_inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'genetic_inventory',
        entity_id: data.id,
        entity_name: entityName || `${data.inventory_type} inventory`,
        metadata
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating genetic inventory:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteGeneticInventory = async (
  id: string,
  userId: string,
  entityName: string,
  metadata: Json = null
) => {
  try {
    const { error } = await supabase
      .from('genetic_inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && entityName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'genetic_inventory',
        entity_id: id,
        entity_name: entityName,
        metadata
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting genetic inventory:', error);
    return { success: false, error: error as Error };
  }
};

export const fetchCanistersByTank = async (tankId: string): Promise<{ data: CanisterWithCount[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('canisters')
      .select('*, genetic_inventory(count)')
      .eq('tank_id', tankId)
      .order('position_in_tank', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Transform to include inventory_count at top level
    const transformedData = (data || []).map(canister => ({
      ...canister,
      inventory_count: (canister.genetic_inventory as unknown as { count: number }[])?.[0]?.count || 0
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching canisters:', error);
    return { data: [], error: error as Error };
  }
};

export const fetchInventoryByCanister = async (canisterId: string) => {
  try {
    const { data, error } = await supabase
      .from('genetic_inventory')
      .select(`
        *,
        customer:customers(id, name),
        sire:sires(id, name, breed),
        tank:tanks(id, tank_name),
        canister:canisters(id, canister_number)
      `)
      .eq('canister_id', canisterId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching canister inventory:', error);
    return { data: [], error: error as Error };
  }
};

export const createCanister = async (canisterData: CanisterInsert, userId: string, tankName: string) => {
  try {
    let position = canisterData.position_in_tank;
    const tankId = canisterData.tank_id;

    if (position != null && tankId) {
      // User specified a position - shift existing canisters to make room
      await supabase.rpc('insert_canister_at_position', {
        p_tank_id: tankId,
        target_position: position
      });
    } else if (tankId) {
      // Auto-calculate position - add at the end
      // Use maybeSingle() since there may be 0 canisters in the tank
      const { data: maxData } = await supabase
        .from('canisters')
        .select('position_in_tank')
        .eq('tank_id', tankId)
        .order('position_in_tank', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      position = (maxData?.position_in_tank || 0) + 1;
    }

    const { data, error } = await supabase
      .from('canisters')
      .insert([{ ...canisterData, position_in_tank: position }])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'canister',
        entity_id: data.id,
        entity_name: `Canister ${data.canister_number}${tankName ? ` in ${tankName}` : ''}`
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating canister:', error);
    return { data: null, error: error as Error };
  }
};

export const updateCanister = async (
  id: string,
  updates: CanisterUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tankId: string | null = null,
  userId: string | null = null,
  canisterName: string | null = null
) => {
  try {
    const { data, error } = await supabase
      .from('canisters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error.message, error.details, error.hint);
      throw error;
    }

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'canister',
        entity_id: data.id,
        entity_name: canisterName || `Canister ${data.canister_number}`
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating canister:', error instanceof Error ? error.message : error);
    return { data: null, error: error as Error };
  }
};

export const checkCanisterHasInventory = async (canisterId: string) => {
  try {
    const { count, error } = await supabase
      .from('genetic_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('canister_id', canisterId);

    if (error) throw error;

    return { hasInventory: (count ?? 0) > 0, count: count || 0, error: null };
  } catch (error) {
    console.error('Error checking canister inventory:', error);
    return { hasInventory: false, count: 0, error: error as Error };
  }
};

export const deleteCanister = async (
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tankId: string | null = null,
  force = false,
  userId: string | null = null,
  canisterName: string | null = null
) => {
  try {
    // Check for associated inventory first (unless forced)
    if (!force) {
      const { hasInventory, count } = await checkCanisterHasInventory(id);
      if (hasInventory) {
        return {
          success: false,
          error: new Error(`Cannot delete canister. There ${count === 1 ? 'is' : 'are'} ${count} inventory item${count === 1 ? '' : 's'} in this canister. Please move or delete the inventory first.`)
        };
      }
    }

    const { error } = await supabase
      .from('canisters')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && canisterName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'canister',
        entity_id: id,
        entity_name: canisterName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting canister:', error);
    return { success: false, error: error as Error };
  }
};

export const normalizeCanisterPositions = async (tankId: string, excludeCanisterId?: string) => {
  try {
    const { error } = await supabase.rpc('normalize_canister_positions', {
      p_tank_id: tankId,
      exclude_canister_id: excludeCanisterId
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error normalizing canister positions:', error);
    return { success: false, error: error as Error };
  }
};

export const updateCanisterPosition = async (
  canisterId: string,
  tankId: string,
  newPosition: number,
  oldPosition?: number
) => {
  try {
    const { error } = await supabase.rpc('update_canister_position', {
      p_canister_id: canisterId,
      p_tank_id: tankId,
      new_position: newPosition,
      old_position: oldPosition
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating canister position:', error);
    return { success: false, error: error as Error };
  }
};

export const insertCanisterAtPosition = async (tankId: string, targetPosition: number) => {
  try {
    const { error } = await supabase.rpc('insert_canister_at_position', {
      p_tank_id: tankId,
      target_position: targetPosition
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error inserting canister at position:', error);
    return { success: false, error: error as Error };
  }
};

interface CheckinLocationData {
  tank_id: string;
  canister_id: string;
  cane_number?: string;
}

export const checkinInventory = async (
  id: string,
  locationData: CheckinLocationData,
  userId: string,
  entityName: string
) => {
  // Use local date to avoid timezone issues
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const updates: GeneticInventoryUpdate = {
    tank_id: locationData.tank_id,
    canister_id: locationData.canister_id,
    cane_number: locationData.cane_number || null,
    status: 'stored',
    check_in_date: localDate,
    check_out_date: null,
    updated_by: userId
  };
  return updateGeneticInventory(id, updates, userId, entityName);
};
