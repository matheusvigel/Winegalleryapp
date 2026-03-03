import { supabase } from '../supabase';

export type BrandRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  country: string | null;
  region: string | null;
};

export async function fetchBrands(): Promise<BrandRow[]> {
  const { data, error } = await supabase.from('brands').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchBrand(id: string): Promise<BrandRow | null> {
  const { data, error } = await supabase.from('brands').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createBrand(payload: Omit<BrandRow, 'id'> & { id?: string }): Promise<BrandRow> {
  const id = payload.id || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase.from('brands').insert({ ...payload, id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBrand(id: string, payload: Partial<Omit<BrandRow, 'id'>>): Promise<BrandRow> {
  const { data, error } = await supabase.from('brands').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}
