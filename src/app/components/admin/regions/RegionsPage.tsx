import { useEffect, useState } from 'react';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchRegions, deleteRegion, RegionRow } from '../../../../lib/services/regionService';
import { fetchCountries, CountryRow } from '../../../../lib/services/countryService';

export default function RegionsPage() {
  const [rows, setRows] = useState<RegionRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [regionsData, countriesData] = await Promise.all([fetchRegions(), fetchCountries()]);
      setRows(regionsData);
      setCountries(countriesData);
    } catch {
      setError('Erro ao carregar regiões. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"? As coleções vinculadas também serão removidas.`)) return;
    try {
      await deleteRegion(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir região.');
    }
  }

  const countryMap = Object.fromEntries(countries.map(c => [c.id, c.name]));

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.name,
    subtitle: countryMap[r.country_id] ?? r.country_id,
    imageUrl: r.image_url,
  }));

  return (
    <AdminListPage
      heading="Regiões"
      createTo="/admin/regions/new"
      editTo={id => `/admin/regions/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhuma região cadastrada ainda."
    />
  );
}
