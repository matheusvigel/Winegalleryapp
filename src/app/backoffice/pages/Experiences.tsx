import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Experience = {
  id: string; name: string; photo: string; category: string;
  location_type: string;
  winery_id: string | null; region_id: string | null;
  highlight: string; buy_link: string | null;
};
type Option = { id: string; name: string };

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'];

const LOCATION_TYPES: { value: string; label: string; emoji: string }[] = [
  { value: 'em_casa',     label: 'Em Casa',      emoji: '🏠' },
  { value: 'na_vinicola', label: 'Na Vinícola',  emoji: '🍇' },
  { value: 'na_cidade',   label: 'Na Cidade',    emoji: '🏙️' },
];

const empty = (): Omit<Experience, 'id'> => ({
  name: '', photo: '', category: 'Essencial', location_type: 'na_vinicola',
  winery_id: null, region_id: null, highlight: '', buy_link: null,
});

export default function Experiences() {
  const [rows, setRows] = useState<Experience[]>([]);
  const [wineries, setWineries] = useState<Option[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('experiences').select('*').order('name');
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    Promise.all([
      supabase.from('wineries').select('id, name').order('name'),
      supabase.from('regions').select('id, name').in('level', ['country', 'region']).order('name'),
    ]).then(([{ data: w }, { data: r }]) => {
      setWineries(w ?? []);
      setRegions(r ?? []);
    });
  }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setSheetOpen(true); };
  const openEdit = (r: Experience) => {
    setEditing(r);
    setForm({ name: r.name, photo: r.photo, category: r.category, location_type: r.location_type ?? 'na_vinicola', winery_id: r.winery_id, region_id: r.region_id, highlight: r.highlight, buy_link: r.buy_link });
    setError(''); setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, winery_id: form.winery_id || null, region_id: form.region_id || null, buy_link: form.buy_link || null };
    const result = editing
      ? await supabase.from('experiences').update(payload).eq('id', editing.id)
      : await supabase.from('experiences').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSheetOpen(false); setSaving(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('experiences').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Experiências</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          <Plus size={16} /> Nova Experiência
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma experiência cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Local</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Destaque</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{r.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-neutral-600">
                      {LOCATION_TYPES.find(l => l.value === r.location_type)?.emoji ?? '🍇'}{' '}
                      {LOCATION_TYPES.find(l => l.value === r.location_type)?.label ?? 'Na Vinícola'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell max-w-xs truncate">{r.highlight}</td>
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

      <FormModal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar Experiência' : 'Nova Experiência'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <FieldRow>
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Visita à vinícola..." className={inp} />
            </Field>
            <Field label="Categoria *">
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Onde acontece *">
            <div className="flex gap-2">
              {LOCATION_TYPES.map(lt => (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, location_type: lt.value }))}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    form.location_type === lt.value
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-purple-300'
                  }`}
                >
                  <span className="text-lg">{lt.emoji}</span>
                  {lt.label}
                </button>
              ))}
            </div>
          </Field>
          <FieldRow>
            <Field label="Vinícola (opcional)">
              <select value={form.winery_id ?? ''} onChange={e => setForm(f => ({ ...f, winery_id: e.target.value || null }))} className={inp}>
                <option value="">Sem vinícola</option>
                {wineries.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Região (opcional)">
              <select value={form.region_id ?? ''} onChange={e => setForm(f => ({ ...f, region_id: e.target.value || null }))} className={inp}>
                <option value="">Sem região</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Imagem *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>
          <Field label="Destaque *">
            <textarea required value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))} rows={2} placeholder="Por que fazer esta experiência..." className={ta} />
          </Field>
          <Field label="Link de compra (opcional)">
            <input type="url" value={form.buy_link ?? ''} onChange={e => setForm(f => ({ ...f, buy_link: e.target.value || null }))} placeholder="https://..." className={inp} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Experiência'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir experiência?</AlertDialogTitle>
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
