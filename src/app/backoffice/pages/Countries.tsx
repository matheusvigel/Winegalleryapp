import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Country = { id: string; name: string; photo: string; description: string | null };
const empty = (): Omit<Country, 'id'> => ({ name: '', photo: '', description: '' });

export default function Countries() {
  const [rows, setRows] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('regions').select('id, name, photo, description').eq('level', 'country').order('name');
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setModalOpen(true); };
  const openEdit = (r: Country) => { setEditing(r); setForm({ name: r.name, photo: r.photo, description: r.description }); setError(''); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name, photo: form.photo, description: form.description, level: 'country' };
    const result = editing
      ? await supabase.from('regions').update(payload).eq('id', editing.id)
      : await supabase.from('regions').insert(payload);
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('regions').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Países</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
          <Plus size={16} /> Novo País
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum país cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar País' : 'Novo País'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <Field label="Nome *">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="França" className={inp} />
          </Field>
          <Field label="Imagem de capa *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>
          <Field label="Descrição">
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} rows={3} placeholder="Descrição do país..." className={ta} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar País'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir país?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Regiões vinculadas perderão o vínculo.</AlertDialogDescription>
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
