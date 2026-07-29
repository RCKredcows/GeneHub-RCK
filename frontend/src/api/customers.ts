import { supabase } from '../lib/supabase';
import { logActivity } from './activityLog';
import type { CustomerInsert, CustomerUpdate } from '../types';

export const fetchCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { data: [], error: error as Error };
  }
};

export const fetchCustomerCount = async () => {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching customer count:', error);
    return { count: 0, error: error as Error };
  }
};

export const createCustomer = async (customerData: CustomerInsert, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'customer',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { data: null, error: error as Error };
  }
};

export const updateCustomer = async (id: string, updates: CustomerUpdate, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'customer',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteCustomer = async (id: string, userId: string, customerName: string) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      // Check for foreign key violation (RESTRICT constraint)
      if (error.code === '23503') {
        throw new Error('Cannot delete this customer because they have sires or genetic inventory associated with them. Please reassign or remove those records first.');
      }
      throw error;
    }

    if (userId && customerName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'customer',
        entity_id: id,
        entity_name: customerName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: error as Error };
  }
};

interface FetchCustomersPaginatedOptions {
  searchQuery?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}

export const fetchCustomersPaginated = async (options: FetchCustomersPaginatedOptions = {}) => {
  const {
    searchQuery = '',
    sortBy = 'name-asc',
    limit = 25,
    offset = 0
  } = options;

  // Parse sortBy into field and direction
  let sortField = 'name';
  let sortAscending = true;

  switch (sortBy) {
    case 'name-asc':
      sortField = 'name';
      sortAscending = true;
      break;
    case 'name-desc':
      sortField = 'name';
      sortAscending = false;
      break;
    case 'items-asc':
      sortField = 'items';
      sortAscending = true;
      break;
    case 'items-desc':
      sortField = 'items';
      sortAscending = false;
      break;
    case 'recent':
      sortField = 'created_at';
      sortAscending = false;
      break;
    case 'oldest':
      sortField = 'created_at';
      sortAscending = true;
      break;
  }

  try {
    const { data, error } = await supabase.rpc('search_customers', {
      search_term: searchQuery || '',
      sort_field: sortField,
      sort_ascending: sortAscending,
      page_limit: limit,
      page_offset: offset
    });

    if (error) throw error;

    // Extract total count from first row (all rows have it)
    const count = data?.[0]?.total_count || 0;

    // Remove total_count from each row (it's metadata)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanedData = (data || []).map(({ total_count, ...rest }) => rest);

    return { data: cleanedData, count: Number(count), error: null };
  } catch (error) {
    console.error('Error fetching paginated customers:', error);
    return { data: [], count: 0, error: error as Error };
  }
};

export const searchCustomers = async (searchTerm = '', limit = 20) => {
  try {
    let query = supabase
      .from('customers')
      .select('id, name, email, phone')
      .order('name', { ascending: true })
      .limit(limit);

    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error searching customers:', error);
    return { data: [], error: error as Error };
  }
};

export const fetchCustomerInventory = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('genetic_inventory')
      .select(`
        id,
        inventory_type,
        quantity,
        status,
        cane_number,
        created_at,
        embryo_name,
        breed,
        sex_type,
        is_ivf,
        sire:sires(id, name, breed),
        tank:tanks(id, tank_name),
        canister:canisters(id, canister_number)
      `)
      .eq('customer_id', customerId)
      .eq('owner_type', 'customer')
      .eq('status', 'stored')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching customer inventory:', error);
    return { data: [], error: error as Error };
  }
};
