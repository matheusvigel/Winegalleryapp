import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { WineLevel } from '../../../../lib/database.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Collection = { id: string; title: string; description: string; level: WineLevel; cover_image: string; total_points: number };

const empty = (): Omit<Collection, 'id'> => ({ title: '', description: '', level: 'essential', cover_image: '', total_points: 0 });

const levelLabel: Record<WineLevel, string> = {
  essential: 'Essencial',
  escape: 'Fuja do óbvio',
  icon: 'Ícone',
};

const levelColor: Record<WineLevel, string> = {
  essential: 'bg-green-100 text-green-700',
  escape: 'bg-blue-100 text-blue-700',
  icon: 'bg-yellow-100 text-yellow-700',
};

export default function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('collections').select('*').order('title');
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setSheetOpen(true); };
  const openEdit = (r: Collection) => {
    setEditing(r);
    setForm({ title: r.title, description: r.description, level: r.level, cover_image: r.cover_image, total_points: r.total_points });
    setError('');
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cover_image) { setError('Selecione uma imagem de capa para continuar.'); return; }
    setSaving(true);
    setError('');
    const result = editing
      ? await supabase.from('collections').update(form).eq('id', editing.id)
      : await supabase.from('collections').insert({ id: crypto.randomUUID(), ...form });
    if (result.error) { setError(result.error.message); } else { setSheetOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('collections').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Coleções</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
          <Plus size={16} /> Nova Coleção
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma coleção cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Título</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Pontos</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-neutral-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${levelColor[r.level]}`}>
                      {levelLabel[r.level]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{r.total_points} pts</td>
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
            <SheetTitle>{editing ? 'Editar Coleção' : 'Nova Coleção'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
            <Field label="Título *">
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Grandes Clássicos de Bordeaux" className={inp} />
            </Field>
            <Field label="Nível *">
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as WineLevel }))} className={inp}>
                <option value="essential">Essencial</option>
                <option value="escape">Fuja do óbvio</option>
                <option value="icon">Ícone</option>
              </select>
            </Field>
            <Field label="Imagem de capa *">
              <ImageUpload value={form.cover_image} onChange={url => setForm(f => ({ ...f, cover_image: url }))} />
            </Field>
            <Field label="Total de pontos">
              <input type="number" min={0} value={form.total_points} onChange={e => setForm(f => ({ ...f, total_points: Number(e.target.value) }))} className={inp} />
            </Field>
            <Field label="Descrição *">
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Descrição da coleção..." className={ta} />
            </Field>
            <button type="submit" disabled={saving} className={btn}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Coleção'}
            </button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
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
