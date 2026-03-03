import { useEffect, useState } from 'react';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchGrapes, deleteGrape, GrapeRow } from '../../../../lib/services/grapeService';

const badgeColors: Record<string, string> = {
  red: 'bg-red-900/60 text-red-300',
  white: 'bg-yellow-900/60 text-yellow-300',
};

export default function GrapesPage() {
  const [rows, setRows] = useState<GrapeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setRows(await fetchGrapes());
    } catch {
      setError('Erro ao carregar uvas. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await deleteGrape(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir uva.');
    }
  }

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.name,
    subtitle: r.characteristics ?? undefined,
    imageUrl: r.image_url,
    badge: r.type === 'red' ? 'Tinta' : 'Branca',
    badgeColor: badgeColors[r.type],
  }));

  return (
    <AdminListPage
      heading="Uvas"
      createTo="/admin/grapes/new"
      editTo={id => `/admin/grapes/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhuma uva cadastrada ainda."
    />
  );
}
