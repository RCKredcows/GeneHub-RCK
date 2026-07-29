import { supabase } from '../lib/supabase';
import { logActivity } from './activityLog';
import type { SireInsert, SireUpdate } from '../types';

export const fetchSireCount = async () => {
  try {
    const { count, error } = await supabase
      .from('sires')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching sire count:', error);
    return { count: 0, error: error as Error };
  }
};

export const createSire = async (sireData: SireInsert, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('sires')
      .insert([sireData])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'create',
        entity_type: 'sire',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating sire:', error);
    return { data: null, error: error as Error };
  }
};

export const updateSire = async (id: string, updates: SireUpdate, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('sires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      logActivity({
        user_id: userId,
        action_type: 'update',
        entity_type: 'sire',
        entity_id: data.id,
        entity_name: data.name
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating sire:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteSire = async (id: string, userId: string, sireName: string) => {
  try {
    const { error } = await supabase
      .from('sires')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId && sireName) {
      logActivity({
        user_id: userId,
        action_type: 'delete',
        entity_type: 'sire',
        entity_id: id,
        entity_name: sireName
      });
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting sire:', error);
    return { success: false, error: error as Error };
  }
};

interface FetchSiresPaginatedOptions {
  ownerType?: string;
  availabilityFilter?: string;
  priceFilter?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const fetchSiresPaginated = async (options: FetchSiresPaginatedOptions = {}) => {
  const {
    ownerType,
    availabilityFilter = 'all',
    priceFilter = 'all',
    searchQuery,
    limit = 25,
    offset = 0
  } = options;

  try {
    // Determine sort field and order based on priceFilter
    let sortField = 'created_at';
    let sortAscending = false;

    if (priceFilter === 'low-high') {
      sortField = 'price_for_semen';
      sortAscending = true;
    } else if (priceFilter === 'high-low') {
      sortField = 'price_for_semen';
      sortAscending = false;
    }

    let query = supabase
      .from('sires')
      .select('*, customer:customers(id, name)', { count: 'exact' })
      .order(sortField, { ascending: sortAscending, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply owner type filter
    if (ownerType && ownerType !== 'all') {
      query = query.eq('owner_type', ownerType);
    }

    // Apply availability filter
    if (availabilityFilter === 'available') {
      query = query.eq('available_for_sale', true);
    }

    // Apply price filter
    if (priceFilter === 'has-price') {
      query = query.not('price_for_semen', 'is', null);
    } else if (priceFilter === 'no-price') {
      query = query.is('price_for_semen', null);
    }

    // Apply search filter (ILIKE across name, breed, registration_number)
    if (searchQuery && searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(`name.ilike.${term},breed.ilike.${term},registration_number.ilike.${term}`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching paginated sires:', error);
    return { data: [], count: 0, error: error as Error };
  }
};

export const searchSires = async (searchTerm = '', limit = 20) => {
  try {
    let query = supabase
      .from('sires')
      .select('id, name, breed, price_for_semen, price_for_sexed_semen, available_for_sale')
      .order('name', { ascending: true })
      .limit(limit);

    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${term},breed.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error searching sires:', error);
    return { data: [], error: error as Error };
  }
};

export const updateSireAvailability = async (sireId: string, availableForSale: boolean) => {
  try {
    const { data, error } = await supabase
      .from('sires')
      .update({ available_for_sale: availableForSale })
      .eq('id', sireId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating sire availability:', error);
    return { data: null, error: error as Error };
  }
};
