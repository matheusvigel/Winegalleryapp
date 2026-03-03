import { supabase } from '../supabase';

export type GrapeRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: 'red' | 'white';
  characteristics: string | null;
};

export async function fetchGrapes(type?: 'red' | 'white'): Promise<GrapeRow[]> {
  let query = supabase.from('grapes').select('*').order('name');
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchGrape(id: string): Promise<GrapeRow | null> {
  const { data, error } = await supabase.from('grapes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createGrape(payload: Omit<GrapeRow, 'id'> & { id?: string }): Promise<GrapeRow> {
  const id = payload.id || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase.from('grapes').insert({ ...payload, id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateGrape(id: string, payload: Partial<Omit<GrapeRow, 'id'>>): Promise<GrapeRow> {
  const { data, error } = await supabase.from('grapes').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGrape(id: string): Promise<void> {
  const { error } = await supabase.from('grapes').delete().eq('id', id);
  if (error) throw error;
}
