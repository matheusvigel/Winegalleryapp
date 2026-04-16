import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Winery = {
  id: string; name: string; photo: string; region_id: string;
  sub_region_id: string | null; category: string; highlight: string; buy_link: string | null;
};
type Region = { id: string; name: string; level: string };

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'];
const empty = (): Omit<Winery, 'id'> => ({ name: '', photo: '', region_id: '', sub_region_id: null, category: 'Essencial', highlight: '', buy_link: null });

export default function Brands() {
  const [rows, setRows] = useState<Winery[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Winery | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: w }, { data: r }] = await Promise.all([
      supabase.from('wineries').select('*').order('name'),
      supabase.from('regions').select('id, name, level').in('level', ['country', 'region', 'sub-region']).order('name'),
    ]);
    setRows(w ?? []);
    setRegions(r ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setModalOpen(true); };
  const openEdit = (r: Winery) => {
    setEditing(r);
    setForm({ name: r.name, photo: r.photo, region_id: r.region_id, sub_region_id: r.sub_region_id, category: r.category, highlight: r.highlight, buy_link: r.buy_link });
    setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem para continuar.'); return; }
    if (!form.region_id) { setError('Selecione uma região.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, sub_region_id: form.sub_region_id || null, buy_link: form.buy_link || null };
    const result = editing
      ? await supabase.from('wineries').update(payload).eq('id', editing.id)
      : await supabase.from('wineries').insert(payload);
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('wineries').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const regionName = (id: string) => regions.find(r => r.id === id)?.name ?? id;

  const countryRegions = regions.filter(r => r.level === 'country' || r.level === 'region');
  const subRegions = regions.filter(r => r.level === 'sub-region');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Vinícolas</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          <Plus size={16} /> Nova Vinícola
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma vinícola cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Região</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{regionName(r.region_id)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{r.category}</span>
                  </td>
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Vinícola' : 'Nova Vinícola'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <FieldRow>
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Château Margaux" className={inp} />
            </Field>
            <Field label="Categoria *">
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Região *">
              <select required value={form.region_id} onChange={e => setForm(f => ({ ...f, region_id: e.target.value }))} className={inp}>
                <option value="">Selecione...</option>
                {countryRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Sub-região (opcional)">
              <select value={form.sub_region_id ?? ''} onChange={e => setForm(f => ({ ...f, sub_region_id: e.target.value || null }))} className={inp}>
                <option value="">Nenhuma</option>
                {subRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Imagem *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>
          <Field label="Destaque *">
            <textarea required value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))} rows={2} placeholder="Por que conhecer esta vinícola..." className={ta} />
          </Field>
          <Field label="Link de compra (opcional)">
            <input type="url" value={form.buy_link ?? ''} onChange={e => setForm(f => ({ ...f, buy_link: e.target.value || null }))} placeholder="https://..." className={inp} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Vinícola'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vinícola?</AlertDialogTitle>
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
