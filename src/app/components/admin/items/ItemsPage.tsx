import { useEffect, useState } from 'react';
import AdminListPage, { ListItem } from '../AdminListPage';
import { fetchItems, deleteItem, WineItemRow } from '../../../../lib/services/itemService';

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

export default function ItemsPage() {
  const [rows, setRows] = useState<WineItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setRows(await fetchItems());
    } catch {
      setError('Erro ao carregar itens. Verifique sua conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await deleteItem(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Erro ao excluir item.');
    }
  }

  const items: ListItem[] = rows.map(r => ({
    id: r.id,
    title: r.name,
    subtitle: `${r.type === 'wine' ? 'Vinho' : 'Vinícola'} · ${r.points} pts`,
    imageUrl: r.image_url,
    badge: levelLabels[r.level],
    badgeColor: levelColors[r.level],
  }));

  return (
    <AdminListPage
      heading="Vinhos & Vinícolas"
      createTo="/admin/items/new"
      editTo={id => `/admin/items/${id}/edit`}
      items={items}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      emptyMessage="Nenhum vinho ou vinícola cadastrado ainda."
    />
  );
}
