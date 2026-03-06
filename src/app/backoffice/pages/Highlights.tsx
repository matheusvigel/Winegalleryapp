import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, btn } from '../components/FormModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type HighlightType = 'collection' | 'country' | 'region' | 'brand';
type Highlight = {
  id: string; type: HighlightType; entity_id: string; label: string | null;
  position: number; active: boolean;
};
type EntityOption = { id: string; name: string };

const TYPE_LABELS: Record<HighlightType, string> = {
  collection: 'Coleção', country: 'País', region: 'Região', brand: 'Vinícola',
};

const empty = (): Omit<Highlight, 'id'> => ({
  type: 'collection', entity_id: '', label: '', position: 0, active: true,
});

export default function Highlights() {
  const [rows, setRows] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Highlight | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);

  const load = async () => {
    const { data } = await supabase.from('highlights').select('*').order('position');
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadEntityOptions = async (type: HighlightType) => {
    const tableMap: Record<HighlightType, string> = {
      collection: 'collections', country: 'countries', region: 'regions', brand: 'brands',
    };
    const nameCol = type === 'collection' ? 'title' : 'name';
    const { data } = await supabase.from(tableMap[type] as never).select(`id, ${nameCol}`).order(nameCol);
    setEntityOptions((data ?? []).map((d: Record<string, string>) => ({ id: d.id, name: d[nameCol] })));
  };

  const openCreate = async () => {
    setEditing(null);
    const f = empty();
    setForm(f);
    setError('');
    await loadEntityOptions(f.type);
    setSheetOpen(true);
  };

  const openEdit = async (r: Highlight) => {
    setEditing(r);
    setForm({ type: r.type, entity_id: r.entity_id, label: r.label ?? '', position: r.position, active: r.active });
    setError('');
    await loadEntityOptions(r.type);
    setSheetOpen(true);
  };

  const handleTypeChange = async (type: HighlightType) => {
    setForm(f => ({ ...f, type, entity_id: '' }));
    await loadEntityOptions(type);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entity_id) { setError('Selecione um item.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, label: form.label || null };
    if (editing) {
      const { error: err } = await supabase.from('highlights').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('highlights').insert({ id: crypto.randomUUID(), ...payload });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSheetOpen(false); setSaving(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('highlights').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const toggleActive = async (r: Highlight) => {
    await supabase.from('highlights').update({ active: !r.active }).eq('id', r.id);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Destaques</h1>
          <p className="text-sm text-neutral-500 mt-1">Itens exibidos na seção de destaques da home · {rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
          <Plus size={16} /> Novo Destaque
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum destaque cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Pos.</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Label</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 text-neutral-500 tabular-nums">{r.position}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{TYPE_LABELS[r.type]}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.label ?? <span className="text-neutral-400 italic text-xs">{r.entity_id}</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {r.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(r)} className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title={r.active ? 'Desativar' : 'Ativar'}>
                        {r.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
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

      <FormModal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar Destaque' : 'Novo Destaque'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <FieldRow>
            <Field label="Tipo *">
              <select required value={form.type} onChange={e => handleTypeChange(e.target.value as HighlightType)} className={inp}>
                <option value="collection">Coleção</option>
                <option value="country">País</option>
                <option value="region">Região</option>
                <option value="brand">Vinícola</option>
              </select>
            </Field>
            <Field label="Posição">
              <input type="number" min={0} value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} className={inp} />
            </Field>
          </FieldRow>
          <Field label="Item *">
            <select required value={form.entity_id} onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))} className={inp}>
              <option value="">Selecione...</option>
              {entityOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
          </Field>
          <Field label="Label (opcional)">
            <input value={form.label ?? ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Exibido no card do destaque" className={inp} />
          </Field>
          <Field label="Status">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-red-900" />
              <span className="text-sm text-neutral-700">Ativo (visível na home)</span>
            </label>
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Destaque'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir destaque?</AlertDialogTitle>
            <AlertDialogDescription>Este destaque deixará de aparecer na home.</AlertDialogDescription>
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
