import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Country = { id: string; name: string };
type Region = { id: string; name: string; country_id: string; parent_id: string | null; image_url: string; description: string };
type RegionRow = Region & { depth: number };

const empty = (): Omit<Region, 'id'> => ({ name: '', country_id: '', parent_id: null, image_url: '', description: '' });

/** DFS-flatten regions per country with depth, inserting country header rows (depth === -1). */
function buildTree(regions: Region[], countries: Country[]): RegionRow[] {
  const result: RegionRow[] = [];

  for (const country of countries) {
    const countryRegions = regions.filter(r => r.country_id === country.id);
    if (countryRegions.length === 0) continue;

    // header sentinel row
    result.push({ id: `__header__${country.id}`, name: country.name, country_id: country.id, parent_id: null, image_url: '', description: '', depth: -1 });

    const byParent = new Map<string | null, Region[]>();
    for (const r of countryRegions) {
      const key = r.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }

    const walk = (parentId: string | null, depth: number) => {
      const children = (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name));
      for (const r of children) {
        result.push({ ...r, depth });
        walk(r.id, depth + 1);
      }
    };

    walk(null, 0);
  }

  return result;
}

/** Collect all descendant IDs of a region (to exclude from parent selector). */
function getDescendantIds(regionId: string, regions: Region[]): Set<string> {
  const ids = new Set<string>();
  const walk = (id: string) => {
    for (const r of regions.filter(r => r.parent_id === id)) {
      ids.add(r.id);
      walk(r.id);
    }
  };
  walk(regionId);
  return ids;
}

export default function Regions() {
  const [rows, setRows] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: regions }, { data: cts }] = await Promise.all([
      supabase.from('regions').select('*').order('name'),
      supabase.from('countries').select('id, name').order('name'),
    ]);
    setRows(regions ?? []);
    setCountries(cts ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = (prefill?: Partial<Omit<Region, 'id'>>) => {
    setEditing(null);
    setForm({ ...empty(), ...prefill });
    setError('');
    setSheetOpen(true);
  };

  const openEdit = (r: Region) => {
    setEditing(r);
    setForm({ name: r.name, country_id: r.country_id, parent_id: r.parent_id, image_url: r.image_url, description: r.description });
    setError('');
    setSheetOpen(true);
  };

  const handleParentChange = (parentId: string) => {
    const parent = rows.find(r => r.id === parentId);
    setForm(f => ({
      ...f,
      parent_id: parentId || null,
      country_id: parent ? parent.country_id : f.country_id,
    }));
  };

  const handleCountryChange = (countryId: string) => {
    setForm(f => ({ ...f, country_id: countryId, parent_id: null }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true);
    setError('');
    const result = editing
      ? await supabase.from('regions').update(form).eq('id', editing.id)
      : await supabase.from('regions').insert({ id: crypto.randomUUID(), ...form });
    if (result.error) { setError(result.error.message); } else { setSheetOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('regions').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  // Parent options: regions in the same country, excluding self and all descendants
  const excludedIds = editing ? getDescendantIds(editing.id, rows) : new Set<string>();
  const parentOptions = rows.filter(r =>
    r.country_id === form.country_id &&
    r.id !== editing?.id &&
    !excludedIds.has(r.id)
  );

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
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map((r) => {
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openCreate({ country_id: r.country_id, parent_id: r.id })}
                          className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Adicionar sub-região"
                        >
                          <Plus size={14} />
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Região' : 'Nova Região'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
            <Field label="Nome *">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bordeaux" className={inp} />
            </Field>
            <Field label="País *">
              <select required value={form.country_id} onChange={e => handleCountryChange(e.target.value)} className={inp}>
                <option value="">Selecione um país</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
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
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Descrição da região..." className={ta} />
            </Field>
            <button type="submit" disabled={saving} className={btn}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Região'}
            </button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir região?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Sub-regiões desta região perderão o vínculo hierárquico mas não serão excluídas.
            </AlertDialogDescription>
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
