import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Country = { id: string; name: string };
type Region = { id: string; name: string; country_id: string; parent_id: string | null; image_url: string; description: string };
type RegionRow = Region & { depth: number };
type CollectionCounts = Record<string, number>;

const empty = (): Omit<Region, 'id'> => ({ name: '', country_id: '', parent_id: null, image_url: '', description: '' });

function buildTree(regions: Region[], countries: Country[]): RegionRow[] {
  const result: RegionRow[] = [];
  for (const country of countries) {
    const countryRegions = regions.filter(r => r.country_id === country.id);
    if (countryRegions.length === 0) continue;
    result.push({ id: `__header__${country.id}`, name: country.name, country_id: country.id, parent_id: null, image_url: '', description: '', depth: -1 });
    const byParent = new Map<string | null, Region[]>();
    for (const r of countryRegions) {
      const key = r.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }
    const walk = (parentId: string | null, depth: number) => {
      const children = (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name));
      for (const r of children) { result.push({ ...r, depth }); walk(r.id, depth + 1); }
    };
    walk(null, 0);
  }
  return result;
}

function getDescendantIds(regionId: string, regions: Region[]): Set<string> {
  const ids = new Set<string>();
  const walk = (id: string) => {
    for (const r of regions.filter(r => r.parent_id === id)) { ids.add(r.id); walk(r.id); }
  };
  walk(regionId);
  return ids;
}

export default function Regions() {
  const [rows, setRows] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [colCounts, setColCounts] = useState<CollectionCounts>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: regions }, { data: cts }, { data: rc }] = await Promise.all([
      supabase.from('regions').select('*').order('name'),
      supabase.from('countries').select('id, name').order('name'),
      supabase.from('region_collections').select('region_id'),
    ]);
    setRows(regions ?? []);
    setCountries(cts ?? []);
    const cnt: CollectionCounts = {};
    for (const { region_id } of rc ?? []) cnt[region_id] = (cnt[region_id] ?? 0) + 1;
    setColCounts(cnt);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = (prefill?: Partial<Omit<Region, 'id'>>) => {
    setEditing(null); setForm({ ...empty(), ...prefill }); setError(''); setModalOpen(true);
  };
  const openEdit = (r: Region) => {
    setEditing(r); setForm({ name: r.name, country_id: r.country_id, parent_id: r.parent_id, image_url: r.image_url, description: r.description }); setError(''); setModalOpen(true);
  };

  const handleParentChange = (parentId: string) => {
    const parent = rows.find(r => r.id === parentId);
    setForm(f => ({ ...f, parent_id: parentId || null, country_id: parent ? parent.country_id : f.country_id }));
  };
  const handleCountryChange = (countryId: string) => { setForm(f => ({ ...f, country_id: countryId, parent_id: null })); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true); setError('');
    const result = editing
      ? await supabase.from('regions').update(form).eq('id', editing.id)
      : await supabase.from('regions').insert({ id: crypto.randomUUID(), ...form });
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('regions').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const excludedIds = editing ? getDescendantIds(editing.id, rows) : new Set<string>();
  const parentOptions = rows.filter(r => r.country_id === form.country_id && r.id !== editing?.id && !excludedIds.has(r.id));
  const tree = buildTree(rows, countries);

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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Descrição</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Coleções</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map(r => {
                if (r.depth === -1) {
                  return (
                    <Fragment key={r.id}>
                      <tr className="bg-neutral-100 border-b border-neutral-200">
                        <td colSpan={3} className="px-4 py-2">
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
                    <td className="px-4 py-3 text-neutral-500 hidden md:table-cell max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {colCounts[r.id] ? (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                          {colCounts[r.id]}
                        </span>
                      ) : (
                        <span className="text-neutral-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openCreate({ country_id: r.country_id, parent_id: r.id })} className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Adicionar sub-região">
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
            <Field label="País *">
              <select required value={form.country_id} onChange={e => handleCountryChange(e.target.value)} className={inp}>
                <option value="">Selecione um país</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </FieldRow>
          {form.country_id && (
            <Field label="Sub-região de (opcional)">
              <select value={form.parent_id ?? ''} onChange={e => handleParentChange(e.target.value)} className={inp}>
                <option value="">Região raiz do país</option>
                {parentOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Imagem *">
            <ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
          </Field>
          <Field label="Descrição *">
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descrição da região..." className={ta} />
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
            <AlertDialogDescription>Esta ação não pode ser desfeita. Sub-regiões perderão o vínculo hierárquico mas não serão excluídas.</AlertDialogDescription>
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
