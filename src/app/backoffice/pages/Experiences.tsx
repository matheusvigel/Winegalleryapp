import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { WineLevel } from '../../../../lib/database.types';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Experience = {
  id: string; name: string; description: string; category: string;
  image_url: string; points: number; level: WineLevel;
  brand_id: string | null; duration_minutes: number | null; price_range: string | null;
};

const CATEGORIES = [
  { value: 'visita', label: 'Visita' },
  { value: 'degustacao', label: 'Degustação' },
  { value: 'tour', label: 'Tour' },
  { value: 'curso', label: 'Curso' },
  { value: 'evento', label: 'Evento' },
  { value: 'harmonizacao', label: 'Harmonização' },
];

const levelLabel: Record<WineLevel, string> = {
  essential: 'Essencial', escape: 'Fuja do óbvio', icon: 'Ícone',
};

const empty = (): Omit<Experience, 'id'> => ({
  name: '', description: '', category: 'visita', image_url: '', points: 10,
  level: 'essential', brand_id: null, duration_minutes: null, price_range: null,
});

export default function Experiences() {
  const [rows, setRows] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [brandOptions, setBrandOptions] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    const { data } = await supabase.from('experiences').select('*').order('name');
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from('brands').select('id, name').order('name').then(({ data }) => setBrandOptions(data ?? []));
  }, []);

  const openCreate = () => {
    setEditing(null); setForm(empty()); setError(''); setSheetOpen(true);
  };

  const openEdit = (r: Experience) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description, category: r.category, image_url: r.image_url,
      points: r.points, level: r.level, brand_id: r.brand_id, duration_minutes: r.duration_minutes, price_range: r.price_range });
    setError(''); setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { setError('Selecione uma imagem.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, brand_id: form.brand_id || null, duration_minutes: form.duration_minutes || null, price_range: form.price_range || null };
    if (editing) {
      const { error: err } = await supabase.from('experiences').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('experiences').insert({ id: crypto.randomUUID(), ...payload });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSheetOpen(false); setSaving(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('experiences').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const catLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Experiências</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Pontos</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{catLabel(r.category)}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{levelLabel[r.level]}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{r.points} pts</td>
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
          <Field label="Nome *">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Visita à vinícola..." className={inp} />
          </Field>
          <FieldRow>
            <Field label="Categoria *">
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Nível *">
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as WineLevel }))} className={inp}>
                <option value="essential">Essencial</option>
                <option value="escape">Fuja do óbvio</option>
                <option value="icon">Ícone</option>
              </select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Pontos">
              <input type="number" min={0} value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} className={inp} />
            </Field>
            <Field label="Duração (min)">
              <input type="number" min={0} value={form.duration_minutes ?? ''} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value ? Number(e.target.value) : null }))} placeholder="60" className={inp} />
            </Field>
          </FieldRow>
          <Field label="Faixa de preço">
            <input value={form.price_range ?? ''} onChange={e => setForm(f => ({ ...f, price_range: e.target.value || null }))} placeholder="R$ 80 – R$ 200" className={inp} />
          </Field>
          <Field label="Vinícola (opcional)">
            <select value={form.brand_id ?? ''} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value || null }))} className={inp}>
              <option value="">Sem vinícola vinculada</option>
              {brandOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Imagem *">
            <ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
          </Field>
          <Field label="Descrição *">
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descrição da experiência..." className={ta} />
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
