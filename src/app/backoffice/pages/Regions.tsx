import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Region = { id: string; name: string; parent_id: string | null; level: string; photo: string | null; description: string | null; position: number };
type RegionRow = Region & { depth: number; siblings: string[] };

const LEVELS = [
  { value: 'region', label: 'Região' },
  { value: 'sub-region', label: 'Sub-região' },
];

const empty = (): Omit<Region, 'id'> => ({ name: '', parent_id: null, level: 'region', photo: null, description: null, position: 0 });

function buildTree(countries: Region[], regions: Region[]): RegionRow[] {
  const result: RegionRow[] = [];
  for (const country of countries) {
    const allUnder = regions.filter(r => {
      let cur: Region | undefined = r;
      while (cur?.parent_id) {
        if (cur.parent_id === country.id) return true;
        cur = regions.find(x => x.id === cur!.parent_id);
      }
      return false;
    });
    if (allUnder.length === 0) continue;
    result.push({ ...country, depth: -1, siblings: [] });
    const walk = (parentId: string, depth: number) => {
      const kids = regions.filter(r => r.parent_id === parentId).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
      const siblingIds = kids.map(k => k.id);
      for (const r of kids) { result.push({ ...r, depth, siblings: siblingIds }); walk(r.id, depth + 1); }
    };
    walk(country.id, 0);
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
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('regions').select('id, name, parent_id, level, photo, description, position').order('position').order('name');
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
    setEditing(r); setForm({ name: r.name, parent_id: r.parent_id, level: r.level, photo: r.photo, description: r.description, position: r.position }); setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    // When creating, place the new item at the end of its sibling list
    const siblingCount = editing
      ? 0
      : rows.filter(r => r.parent_id === (form.parent_id || null)).length;
    const payload = {
      name: form.name,
      parent_id: form.parent_id || null,
      level: form.level,
      photo: form.photo || null,
      description: form.description || null,
      ...(editing ? {} : { position: siblingCount }),
    };
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

  const moveRegion = async (id: string, siblings: string[], direction: 'up' | 'down') => {
    const idx = siblings.indexOf(id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swapId = siblings[swapIdx];
    const current = rows.find(r => r.id === id)!;
    const swap    = rows.find(r => r.id === swapId)!;
    setReordering(true);
    await Promise.all([
      supabase.from('regions').update({ position: swap.position }).eq('id', id),
      supabase.from('regions').update({ position: current.position }).eq('id', swapId),
    ]);
    setReordering(false);
    load();
  };

  const tree = buildTree(countries, rows);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Regiões</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-14 hidden sm:table-cell">Foto</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map(r => {
                if (r.depth === -1) {
                  return (
                    <Fragment key={r.id}>
                      <tr className="bg-neutral-100 border-b border-neutral-200">
                        <td colSpan={5} className="px-4 py-2">
                          <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{r.name}</span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }
                return (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {r.photo ? (
                        <img src={r.photo} alt={r.name} className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-300 text-xs">—</div>
                      )}
                    </td>
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
                        {/* Reorder buttons — only for non-country rows */}
                        <button
                          onClick={() => moveRegion(r.id, r.siblings, 'up')}
                          disabled={reordering || r.siblings.indexOf(r.id) === 0}
                          className="p-1.5 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                          title="Mover para cima"
                        ><ChevronUp size={14} /></button>
                        <button
                          onClick={() => moveRegion(r.id, r.siblings, 'down')}
                          disabled={reordering || r.siblings.indexOf(r.id) === r.siblings.length - 1}
                          className="p-1.5 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                          title="Mover para baixo"
                        ><ChevronDown size={14} /></button>
                        {/* Only show "add sub-region" button on regions (depth 0), not on sub-regions */}
                        {r.level === 'region' && (
                          <button onClick={() => openCreate({ parent_id: r.id, level: 'sub-region' })} className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Adicionar sub-região">
                            <Plus size={14} />
                          </button>
                        )}
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
              <select
                required
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value, parent_id: null }))}
                className={inp}
              >
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </FieldRow>

          {form.level === 'region' ? (
            <Field label="País *">
              <select required value={form.parent_id ?? ''} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))} className={inp}>
                <option value="">Selecione o país...</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Região pai *">
              <select required value={form.parent_id ?? ''} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))} className={inp}>
                <option value="">Selecione a região...</option>
                {rows
                  .filter(r => r.level === 'region' && r.id !== editing?.id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                }
              </select>
            </Field>
          )}

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
