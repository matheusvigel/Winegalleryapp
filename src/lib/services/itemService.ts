import { supabase } from '../supabase';

export type WineItemRow = {
  id: string;
  name: string;
  description: string | null;
  type: 'wine' | 'winery';
  image_url: string | null;
  points: number;
  level: 'essential' | 'escape' | 'icon';
  brand_id: string | null;
};

export async function fetchItems(filters?: {
  type?: 'wine' | 'winery';
  level?: 'essential' | 'escape' | 'icon';
  brand_id?: string;
}): Promise<WineItemRow[]> {
  let query = supabase.from('wine_items').select('*').order('name');
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.level) query = query.eq('level', filters.level);
  if (filters?.brand_id) query = query.eq('brand_id', filters.brand_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchItem(id: string): Promise<WineItemRow | null> {
  const { data, error } = await supabase.from('wine_items').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createItem(payload: Omit<WineItemRow, 'id'> & { id?: string }): Promise<WineItemRow> {
  const id = payload.id || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const { data, error } = await supabase.from('wine_items').insert({ ...payload, id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, payload: Partial<Omit<WineItemRow, 'id'>>): Promise<WineItemRow> {
  const { data, error } = await supabase.from('wine_items').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('wine_items').delete().eq('id', id);
  if (error) throw error;
}
