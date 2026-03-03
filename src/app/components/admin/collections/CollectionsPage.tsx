import { useEffect, useState } from 'react';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchCollections, deleteCollection, CollectionRow } from '../../../../lib/services/collectionService';

const levelColors: Record<string, string> = {
  essential: 'bg-green-900/60 text-green-300',
  escape: 'bg-blue-900/60 text-blue-300',
  icon: 'bg-yellow-900/60 text-yellow-300',
};

const levelLabels: Record<string, string> = {
  essential: 'Essencial',
  escape: 'Escape',
  icon: 'Icon',
};

export default function CollectionsPage() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setRows(await fetchCollections());
    } catch {
      setError('Erro ao carregar coleções. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await deleteCollection(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir coleção.');
    }
  }

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.title,
    subtitle: r.description ?? undefined,
    imageUrl: r.cover_image,
    badge: levelLabels[r.level],
    badgeColor: levelColors[r.level],
  }));

  return (
    <AdminListPage
      heading="Coleções"
      createTo="/admin/collections/new"
      editTo={id => `/admin/collections/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhuma coleção cadastrada ainda."
    />
  );
}
