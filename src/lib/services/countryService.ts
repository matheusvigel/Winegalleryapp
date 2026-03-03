import { supabase } from '../supabase';

export type CountryRow = {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
};

export async function fetchCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCountry(id: string): Promise<CountryRow | null> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCountry(payload: Omit<CountryRow, 'id'> & { id?: string }): Promise<CountryRow> {
  const id = payload.id || payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase
    .from('countries')
    .insert({ ...payload, id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCountry(id: string, payload: Partial<Omit<CountryRow, 'id'>>): Promise<CountryRow> {
  const { data, error } = await supabase
    .from('countries')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCountry(id: string): Promise<void> {
  const { error } = await supabase.from('countries').delete().eq('id', id);
  if (error) throw error;
}
