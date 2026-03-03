import { supabase } from '../supabase';

export type CollectionRow = {
  id: string;
  title: string;
  description: string | null;
  level: 'essential' | 'escape' | 'icon';
  cover_image: string | null;
  total_points: number;
  region_id: string | null;
  brand_id: string | null;
  grape_id: string | null;
};

export async function fetchCollections(filters?: {
  region_id?: string;
  brand_id?: string;
  grape_id?: string;
}): Promise<CollectionRow[]> {
  let query = supabase.from('collections').select('*').order('title');
  if (filters?.region_id) query = query.eq('region_id', filters.region_id);
  if (filters?.brand_id) query = query.eq('brand_id', filters.brand_id);
  if (filters?.grape_id) query = query.eq('grape_id', filters.grape_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCollection(id: string): Promise<CollectionRow | null> {
  const { data, error } = await supabase.from('collections').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCollection(payload: Omit<CollectionRow, 'id'> & { id?: string }): Promise<CollectionRow> {
  const id = payload.id || payload.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const { data, error } = await supabase.from('collections').insert({ ...payload, id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCollection(id: string, payload: Partial<Omit<CollectionRow, 'id'>>): Promise<CollectionRow> {
  const { data, error } = await supabase.from('collections').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}
