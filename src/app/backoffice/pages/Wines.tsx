import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Wine = {
  id: string; name: string; photo: string; winery_id: string | null;
  category: string; type: string; method: string | null;
  highlight: string; pairing: string | null; tasting_note: string | null;
  average_price: number | null; buy_link: string | null;
};
type Winery = { id: string; name: string };

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'];
const TYPES = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Fortificado', 'Laranja', 'Sobremesa'];

const empty = (): Omit<Wine, 'id'> => ({
  name: '', photo: '', winery_id: null, category: 'Essencial', type: 'Tinto',
  method: null, highlight: '', pairing: null, tasting_note: null, average_price: null, buy_link: null,
});

export default function Wines() {
  const [rows, setRows] = useState<Wine[]>([]);
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Wine | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: wines }, { data: w }] = await Promise.all([
      supabase.from('wines').select('*').order('name'),
      supabase.from('wineries').select('id, name').order('name'),
    ]);
    setRows(wines ?? []); setWineries(w ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setModalOpen(true); };
  const openEdit = (r: Wine) => {
    setEditing(r);
    setForm({ name: r.name, photo: r.photo, winery_id: r.winery_id, category: r.category, type: r.type, method: r.method, highlight: r.highlight, pairing: r.pairing, tasting_note: r.tasting_note, average_price: r.average_price, buy_link: r.buy_link });
    setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true); setError('');
    const payload = {
      ...form,
      winery_id: form.winery_id || null,
      method: form.method || null,
      pairing: form.pairing || null,
      tasting_note: form.tasting_note || null,
      average_price: form.average_price || null,
      buy_link: form.buy_link || null,
    };
    const result = editing
      ? await supabase.from('wines').update(payload).eq('id', editing.id)
      : await supabase.from('wines').insert(payload);
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('wines').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const wineryName = (id: string | null) => id ? (wineries.find(w => w.id === id)?.name ?? id) : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Vinhos</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-14 hidden sm:table-cell">Foto</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Vinícola</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{r.type}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{r.category}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">{wineryName(r.winery_id)}</td>
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Vinho' : 'Novo Vinho'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <Field label="Nome *">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Château Margaux 2019" className={inp} />
          </Field>
          <FieldRow>
            <Field label="Tipo *">
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Categoria *">
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Vinícola (opcional)">
              <select value={form.winery_id ?? ''} onChange={e => setForm(f => ({ ...f, winery_id: e.target.value || null }))} className={inp}>
                <option value="">Sem vinícola</option>
                {wineries.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Preço médio (R$)">
              <input type="number" min={0} step="0.01" value={form.average_price ?? ''} onChange={e => setForm(f => ({ ...f, average_price: e.target.value ? Number(e.target.value) : null }))} placeholder="250.00" className={inp} />
            </Field>
          </FieldRow>
          <Field label="Método de elaboração (opcional)">
            <input value={form.method ?? ''} onChange={e => setForm(f => ({ ...f, method: e.target.value || null }))} placeholder="Champenoise, Charmat..." className={inp} />
          </Field>
          <Field label="Imagem *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>
          <Field label="Destaque *">
            <textarea required value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))} rows={2} placeholder="Por que provar este vinho..." className={ta} />
          </Field>
          <Field label="Harmonização (opcional)">
            <input value={form.pairing ?? ''} onChange={e => setForm(f => ({ ...f, pairing: e.target.value || null }))} placeholder="Carnes vermelhas, queijos curados..." className={inp} />
          </Field>
          <Field label="Notas de degustação (opcional)">
            <textarea value={form.tasting_note ?? ''} onChange={e => setForm(f => ({ ...f, tasting_note: e.target.value || null }))} rows={2} placeholder="Taninos presentes, notas de frutas negras..." className={ta} />
          </Field>
          <Field label="Link de compra (opcional)">
            <input type="url" value={form.buy_link ?? ''} onChange={e => setForm(f => ({ ...f, buy_link: e.target.value || null }))} placeholder="https://..." className={inp} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Vinho'}
          </button>
        </form>
      </FormModal>

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
