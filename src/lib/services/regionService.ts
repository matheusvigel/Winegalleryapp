import { supabase } from '../supabase';

export type RegionRow = {
  id: string;
  name: string;
  country_id: string;
  image_url: string | null;
  description: string | null;
};

export async function fetchRegions(countryId?: string): Promise<RegionRow[]> {
  let query = supabase.from('regions').select('*').order('name');
  if (countryId) query = query.eq('country_id', countryId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchRegion(id: string): Promise<RegionRow | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRegion(payload: Omit<RegionRow, 'id'> & { id?: string }): Promise<RegionRow> {
  const id = payload.id || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase
    .from('regions')
    .insert({ ...payload, id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRegion(id: string, payload: Partial<Omit<RegionRow, 'id'>>): Promise<RegionRow> {
  const { data, error } = await supabase
    .from('regions')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRegion(id: string): Promise<void> {
  const { error } = await supabase.from('regions').delete().eq('id', id);
  if (error) throw error;
}
