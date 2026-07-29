import { supabase } from '../lib/supabase';
import { logActivity } from './activityLog';
import type { SupplyCategoryInsert, SupplyCategoryUpdate, SupplyInventoryInsert, SupplyInventoryUpdate } from '../types';

// ============================================
// CATEGORIES (Folders)
// ============================================

export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('supply_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching supply categories:', error);
    return { data: [], error: error as Error };
  }
};

export const createCategory = async (categoryData: SupplyCategoryInsert, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('supply_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'medical_category',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error: error as Error };
  }
};

export const updateCategory = async (id: string, updates: SupplyCategoryUpdate, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('supply_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'medical_category',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error: error as Error };
  }
};

export const checkCategoryDependencies = async (categoryId: string) => {
  try {
    // Check for child categories
    const { count: childCount, error: childError } = await supabase
      .from('supply_categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', categoryId);

    if (childError) throw childError;

    // Check for items in this category
    const { count: itemCount, error: itemError } = await supabase
      .from('supply_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (itemError) throw itemError;

    return {
      hasChildren: (childCount ?? 0) > 0,
      hasItems: (itemCount ?? 0) > 0,
      childCount: childCount || 0,
      itemCount: itemCount || 0,
      error: null
    };
  } catch (error) {
    console.error('Error checking category dependencies:', error);
    return { hasChildren: false, hasItems: false, childCount: 0, itemCount: 0, error: error as Error };
  }
};

export const deleteCategory = async (
  id: string,
  force = false,
  userId: string | null = null,
  categoryName: string | null = null
) => {
  try {
    if (!force) {
      const { hasChildren, hasItems, childCount, itemCount } = await checkCategoryDependencies(id);
      if (hasChildren) {
        return {
          success: false,
          error: new Error(`Cannot delete folder. It contains ${childCount} subfolder${childCount === 1 ? '' : 's'}. Please delete or move them first.`)
        };
      }
      if (hasItems) {
        return {
          success: false,
          error: new Error(`Cannot delete folder. It contains ${itemCount} item${itemCount === 1 ? '' : 's'}. Please delete or move them first.`)
        };
      }
    }

    const { error } = await supabase
      .from('supply_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && categoryName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'medical_category',
        entity_id: id,
        entity_name: categoryName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error as Error };
  }
};

// ============================================
// INVENTORY ITEMS
// ============================================

export const fetchInventory = async () => {
  try {
    const { data, error } = await supabase
      .from('supply_inventory')
      .select(`
        *,
        category:supply_categories(id, name, parent_id)
      `)
      .order('item_name', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching supply inventory:', error);
    return { data: [], error: error as Error };
  }
};

export const createInventoryItem = async (itemData: SupplyInventoryInsert, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('supply_inventory')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'medical_inventory',
        entity_id: data.id,
        entity_name: data.item_name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return { data: null, error: error as Error };
  }
};

export const updateInventoryItem = async (id: string, updates: SupplyInventoryUpdate, userId: string) => {
  try {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('supply_inventory')
      .update(updatesWithTimestamp)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'medical_inventory',
        entity_id: data.id,
        entity_name: data.item_name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteInventoryItem = async (id: string, userId: string, itemName: string) => {
  try {
    const { error } = await supabase
      .from('supply_inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && itemName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'medical_inventory',
        entity_id: id,
        entity_name: itemName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return { success: false, error: error as Error };
  }
};

// ============================================
// USAGE LOGGING
// ============================================

export const logUsage = async (
  inventoryId: string,
  quantityUsed: number,
  notes = '',
  usedBy: string | null = null
) => {
  try {
    // First, get current quantity
    const { data: item, error: fetchError } = await supabase
      .from('supply_inventory')
      .select('quantity')
      .eq('id', inventoryId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = item.quantity - quantityUsed;
    if (newQuantity < 0) {
      return {
        data: null,
        error: new Error('Cannot use more than available quantity')
      };
    }

    // Create usage log entry
    const { data: logEntry, error: logError } = await supabase
      .from('supply_usage_log')
      .insert([{
        inventory_id: inventoryId,
        quantity_used: quantityUsed,
        used_by: usedBy,
        notes: notes || null
      }])
      .select()
      .single();

    if (logError) throw logError;

    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('supply_inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryId);

    if (updateError) throw updateError;

    return { data: logEntry, error: null };
  } catch (error) {
    console.error('Error logging usage:', error);
    return { data: null, error: error as Error };
  }
};

export const fetchUsageHistory = async (inventoryId: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('supply_usage_log')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('used_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching usage history:', error);
    return { data: [], error: error as Error };
  }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const fetchMedicalInventoryStats = async (expirationWarningDays = 30) => {
  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('supply_inventory')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get low stock count - fetch only 2 columns and filter client-side
    const { data: stockItems, error: stockError } = await supabase
      .from('supply_inventory')
      .select('quantity, reorder_threshold');

    if (stockError) throw stockError;

    const lowStock = (stockItems || []).filter(item =>
      item.reorder_threshold && item.reorder_threshold > 0 && item.quantity <= item.reorder_threshold
    ).length;

    // Get expiring count
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + expirationWarningDays);
    const today = new Date().toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    const { count: expiring, error: expiringError } = await supabase
      .from('supply_inventory')
      .select('*', { count: 'exact', head: true })
      .not('expiration_date', 'is', null)
      .gte('expiration_date', today)
      .lte('expiration_date', futureStr);

    if (expiringError) throw expiringError;

    return {
      stats: {
        total: total || 0,
        lowStock,
        expiring: expiring || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching medical inventory stats:', error);
    return { stats: { total: 0, lowStock: 0, expiring: 0 }, error: error as Error };
  }
};

// ============================================
// SPECIAL QUERIES
// ============================================

export const fetchLowStockItems = async () => {
  try {
    const { data, error } = await supabase
      .from('supply_inventory')
      .select(`
        *,
        category:supply_categories(id, name)
      `)
      .not('reorder_threshold', 'is', null)
      .gt('reorder_threshold', 0)
      .order('quantity', { ascending: true });

    if (error) throw error;

    // Filter client-side since Supabase can't compare two columns
    const lowStockItems = (data || []).filter(item =>
      item.reorder_threshold && item.quantity <= item.reorder_threshold
    );

    return { data: lowStockItems, error: null };
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return { data: [], error: error as Error };
  }
};

export const fetchExpiringItems = async (days = 30) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('supply_inventory')
      .select(`
        *,
        category:supply_categories(id, name)
      `)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .gte('expiration_date', new Date().toISOString().split('T')[0])
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    return { data: [], error: error as Error };
  }
};

export const restockItem = async (id: string, quantity: number) => {
  try {
    // Get current quantity
    const { data: item, error: fetchError } = await supabase
      .from('supply_inventory')
      .select('quantity')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = item.quantity + quantity;

    const { data, error } = await supabase
      .from('supply_inventory')
      .update({
        quantity: newQuantity,
        last_restock_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error restocking item:', error);
    return { data: null, error: error as Error };
  }
};
