import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { GrapeType } from '../../../../lib/database.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Grape = { id: string; name: string; description: string; image_url: string; type: GrapeType; characteristics: string };

const empty = (): Omit<Grape, 'id'> => ({ name: '', description: '', image_url: '', type: 'red', characteristics: '' });

export default function Grapes() {
  const [rows, setRows] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Grape | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('grapes').select('*').order('name');
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setSheetOpen(true); };
  const openEdit = (r: Grape) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description, image_url: r.image_url, type: r.type, characteristics: r.characteristics });
    setError('');
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true);
    setError('');
    const result = editing
      ? await supabase.from('grapes').update(form).eq('id', editing.id)
      : await supabase.from('grapes').insert({ id: crypto.randomUUID(), ...form });
    if (result.error) { setError(result.error.message); } else { setSheetOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('grapes').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Uvas</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Características</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-neutral-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${r.type === 'red' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.type === 'red' ? 'Tinta' : 'Branca'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell max-w-xs truncate">{r.characteristics}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Uva' : 'Nova Uva'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Cabernet Sauvignon" className={inp} />
            </Field>
            <Field label="Tipo *">
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GrapeType }))} className={inp}>
                <option value="red">Tinta</option>
                <option value="white">Branca</option>
              </select>
            </Field>
            <Field label="Características *">
              <input required value={form.characteristics} onChange={e => setForm(f => ({ ...f, characteristics: e.target.value }))} placeholder="Encorpado, taninos firmes, notas de cassis" className={inp} />
            </Field>
            <Field label="Imagem *">
              <ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
            </Field>
            <Field label="Descrição *">
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Descrição da uva..." className={ta} />
            </Field>
            <button type="submit" disabled={saving} className={btn}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Uva'}
            </button>
          </form>
        </SheetContent>
      </Sheet>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inp = 'w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-white';
const ta = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20 resize-none bg-white';
const btn = 'w-full h-11 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors';
