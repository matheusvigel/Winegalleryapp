import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { WineLevel, ItemType } from '../../../../lib/database.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Brand = { id: string; name: string };
type WineItem = { id: string; name: string; description: string; type: ItemType; image_url: string; points: number; level: WineLevel; brand_id: string | null };

const empty = (): Omit<WineItem, 'id'> => ({ name: '', description: '', type: 'wine', image_url: '', points: 10, level: 'essential', brand_id: null });

const levelLabel: Record<WineLevel, string> = { essential: 'Essencial', escape: 'Fuja do óbvio', icon: 'Ícone' };
const levelColor: Record<WineLevel, string> = { essential: 'bg-green-100 text-green-700', escape: 'bg-blue-100 text-blue-700', icon: 'bg-yellow-100 text-yellow-700' };

export default function Wines() {
  const [rows, setRows] = useState<WineItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WineItem | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: wines }, { data: brs }] = await Promise.all([
      supabase.from('wine_items').select('*').order('name'),
      supabase.from('brands').select('id, name').order('name'),
    ]);
    setRows(wines ?? []);
    setBrands(brs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setSheetOpen(true); };
  const openEdit = (r: WineItem) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description, type: r.type, image_url: r.image_url, points: r.points, level: r.level, brand_id: r.brand_id });
    setError('');
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const result = editing
      ? await supabase.from('wine_items').update(form).eq('id', editing.id)
      : await supabase.from('wine_items').insert({ id: crypto.randomUUID(), ...form });
    if (result.error) { setError(result.error.message); } else { setSheetOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('wine_items').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  const brandName = (id: string | null) => id ? (brands.find(b => b.id === id)?.name ?? id) : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Vinhos</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
          <Plus size={16} /> Novo Vinho
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum vinho cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Marca</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Pts</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-neutral-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${levelColor[r.level]}`}>{levelLabel[r.level]}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell capitalize">{r.type === 'wine' ? 'Vinho' : 'Vinícola'}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">{brandName(r.brand_id)}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{r.points}</td>
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
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Vinho' : 'Novo Vinho'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Château Margaux 2019" className={inp} />
            </Field>
            <Field label="Tipo *">
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ItemType }))} className={inp}>
                <option value="wine">Vinho</option>
                <option value="winery">Vinícola</option>
              </select>
            </Field>
            <Field label="Nível *">
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as WineLevel }))} className={inp}>
                <option value="essential">Essencial</option>
                <option value="escape">Fuja do óbvio</option>
                <option value="icon">Ícone</option>
              </select>
            </Field>
            <Field label="Pontos">
              <input type="number" min={0} value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} className={inp} />
            </Field>
            <Field label="Marca (opcional)">
              <select value={form.brand_id ?? ''} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value || null }))} className={inp}>
                <option value="">Sem marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="URL da imagem *">
              <input required value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className={inp} />
            </Field>
            <Field label="Descrição *">
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Descrição do vinho..." className={ta} />
            </Field>
            <button type="submit" disabled={saving} className={btn}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Vinho'}
            </button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vinho?</AlertDialogTitle>
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
