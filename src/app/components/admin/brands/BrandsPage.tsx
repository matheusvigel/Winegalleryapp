import { useEffect, useState } from 'react';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchBrands, deleteBrand, BrandRow } from '../../../../lib/services/brandService';

export default function BrandsPage() {
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setRows(await fetchBrands());
    } catch {
      setError('Erro ao carregar marcas. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await deleteBrand(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir marca.');
    }
  }

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.name,
    subtitle: [r.country, r.region].filter(Boolean).join(' · ') || undefined,
    imageUrl: r.image_url,
  }));

  return (
    <AdminListPage
      heading="Marcas"
      createTo="/admin/brands/new"
      editTo={id => `/admin/brands/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhuma marca cadastrada ainda."
    />
  );
}
