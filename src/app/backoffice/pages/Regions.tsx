import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Region = { id: string; name: string; parent_id: string | null; level: string; photo: string | null; description: string | null };
type RegionRow = Region & { depth: number };

const LEVELS = [
  { value: 'region', label: 'Região' },
  { value: 'sub-region', label: 'Sub-região' },
];

const empty = (): Omit<Region, 'id'> => ({ name: '', parent_id: null, level: 'region', photo: null, description: null });

function buildTree(countries: Region[], regions: Region[]): RegionRow[] {
  const result: RegionRow[] = [];
  for (const country of countries) {
    const children = regions.filter(r => r.parent_id === country.id || regions.some(r2 => r2.parent_id === country.id && r.parent_id === r2.id));
    const directChildren = regions.filter(r => r.parent_id === country.id);
    if (directChildren.length === 0 && !regions.some(r => r.parent_id === country.id)) continue;
    const allUnder = regions.filter(r => {
      let cur: Region | undefined = r;
      while (cur?.parent_id) {
        if (cur.parent_id === country.id) return true;
        cur = regions.find(x => x.id === cur!.parent_id);
      }
      return false;
    });
    if (allUnder.length === 0 && directChildren.length === 0) continue;
    result.push({ ...country, depth: -1 });
    const walk = (parentId: string, depth: number) => {
      const kids = regions.filter(r => r.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));
      for (const r of kids) { result.push({ ...r, depth }); walk(r.id, depth + 1); }
    };
    walk(country.id, 0);
    void children;
  }
  return result;
}

export default function Regions() {
  const [rows, setRows] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('regions').select('id, name, parent_id, level, photo, description').order('name');
    const all = (data ?? []) as Region[];
    setCountries(all.filter(r => r.level === 'country'));
    setRows(all.filter(r => r.level !== 'country'));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = (prefill?: Partial<Omit<Region, 'id'>>) => {
    setEditing(null); setForm({ ...empty(), ...prefill }); setError(''); setModalOpen(true);
  };
  const openEdit = (r: Region) => {
    setEditing(r); setForm({ name: r.name, parent_id: r.parent_id, level: r.level, photo: r.photo, description: r.description }); setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = { name: form.name, parent_id: form.parent_id || null, level: form.level, photo: form.photo || null, description: form.description || null };
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

  // Parent options: for a region, parents can be countries or other regions
  const parentOptions = [...countries, ...rows.filter(r => r.level === 'region' && r.id !== editing?.id)];
  const tree = buildTree(countries, rows);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Regiões</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
          <Plus size={16} /> Nova Região
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma região cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map(r => {
                if (r.depth === -1) {
                  return (
                    <Fragment key={r.id}>
                      <tr className="bg-neutral-100 border-b border-neutral-200">
                        <td colSpan={4} className="px-4 py-2">
                          <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{r.name}</span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }
                return (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-1" style={{ paddingLeft: r.depth * 20 }}>
                        {r.depth > 0 && <ChevronRight size={14} className="text-neutral-300 shrink-0" />}
                        {r.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {r.level === 'region' ? 'Região' : 'Sub-região'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden md:table-cell max-w-xs truncate">{r.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openCreate({ parent_id: r.id, level: 'sub-region' })} className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Adicionar sub-região">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => openEdit(r)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Região' : 'Nova Região'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <FieldRow>
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bordeaux" className={inp} />
            </Field>
            <Field label="Nível *">
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={inp}>
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Pertence a (País ou Região pai) *">
            <select required value={form.parent_id ?? ''} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))} className={inp}>
              <option value="">Selecione...</option>
              <optgroup label="Países">
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Regiões">
                {rows.filter(r => r.level === 'region' && r.id !== editing?.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </optgroup>
            </select>
          </Field>
          <Field label="Imagem (opcional)">
            <ImageUpload value={form.photo ?? ''} onChange={url => setForm(f => ({ ...f, photo: url || null }))} />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} rows={3} placeholder="Descrição da região..." className={ta} />
          </Field>
          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Região'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir região?</AlertDialogTitle>
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
