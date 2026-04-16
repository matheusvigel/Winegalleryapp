import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Grape = { id: string; name: string; type: string; description: string | null; photo: string | null };

const TYPES = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Fortificado', 'Laranja', 'Sobremesa'];
const TYPE_COLORS: Record<string, string> = {
  Tinto: 'bg-red-100 text-red-700',
  Branco: 'bg-yellow-100 text-yellow-700',
  Rosé: 'bg-pink-100 text-pink-700',
  Espumante: 'bg-blue-100 text-blue-700',
  Fortificado: 'bg-amber-100 text-amber-700',
  Laranja: 'bg-orange-100 text-orange-700',
  Sobremesa: 'bg-purple-100 text-purple-700',
};

const empty = (): Omit<Grape, 'id'> => ({ name: '', type: 'Tinto', description: null, photo: null });

export default function Grapes() {
  const [rows, setRows] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Grape | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('grapes').select('id, name, type, description, photo').order('name');
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setModalOpen(true); };
  const openEdit = (r: Grape) => {
    setEditing(r); setForm({ name: r.name, type: r.type, description: r.description, photo: r.photo }); setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = { name: form.name, type: form.type, description: form.description || null, photo: form.photo || null };
    const result = editing
      ? await supabase.from('grapes').update(payload).eq('id', editing.id)
      : await supabase.from('grapes').insert(payload);
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('grapes').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Uvas</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          <Plus size={16} /> Nova Uva
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma uva cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell max-w-xs truncate">{r.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Uva' : 'Nova Uva'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <FieldRow>
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Cabernet Sauvignon" className={inp} />
            </Field>
            <Field label="Tipo *">
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Imagem (opcional)">
            <ImageUpload value={form.photo ?? ''} onChange={url => setForm(f => ({ ...f, photo: url || null }))} />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} rows={3} placeholder="Encorpado, taninos firmes, notas de cassis..." className={ta} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Uva'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir uva?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
