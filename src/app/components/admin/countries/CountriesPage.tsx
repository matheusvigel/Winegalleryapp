import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchCountries, deleteCountry, CountryRow } from '../../../../lib/services/countryService';

export default function CountriesPage() {
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    try {
      setError(null);
      const data = await fetchCountries();
      setRows(data);
    } catch {
      setError('Erro ao carregar países. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"? Esta ação também remove as regiões vinculadas.`)) return;
    try {
      await deleteCountry(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir país.');
    }
  }

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.name,
    subtitle: r.description ?? undefined,
    imageUrl: r.image_url,
  }));

  return (
    <AdminListPage
      heading="Países"
      createTo="/admin/countries/new"
      editTo={id => `/admin/countries/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhum país cadastrado ainda."
    />
  );
}
