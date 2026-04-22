import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Wine = {
  id: string; name: string; photo: string; winery_id: string;
  category: string; type: string; method: string | null;
  highlight: string; tasting_note: string | null;
  price_min: number | null; price_max: number | null;
  alcohol_pct: number | null; buy_link: string | null;
};

type Winery = { id: string; name: string };
type Grape  = { id: string; name: string; type: string };
type WineGrape = { grape_id: string; percentage: number | null };

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'];
const TYPES = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Fortificado', 'Laranja', 'Sobremesa'];

const emptyWine = (): Omit<Wine, 'id'> => ({
  name: '', photo: '', winery_id: '', category: 'Essencial', type: 'Tinto',
  method: null, highlight: '', tasting_note: null,
  price_min: null, price_max: null, alcohol_pct: null, buy_link: null,
});

// ── Grape composition sub-component ──────────────────────────────────────────

function GrapeComposition({
  allGrapes, composition, onChange,
}: {
  allGrapes: Grape[];
  composition: WineGrape[];
  onChange: (c: WineGrape[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    allGrapes.filter(g =>
      !composition.find(c => c.grape_id === g.id) &&
      g.name.toLowerCase().includes(search.toLowerCase())
    ), [allGrapes, composition, search]);

  const addGrape = (grape_id: string) => {
    onChange([...composition, { grape_id, percentage: null }]);
    setSearch('');
  };

  const removeGrape = (grape_id: string) =>
    onChange(composition.filter(c => c.grape_id !== grape_id));

  const setPct = (grape_id: string, pct: string) =>
    onChange(composition.map(c =>
      c.grape_id === grape_id ? { ...c, percentage: pct ? Number(pct) : null } : c
    ));

  return (
    <div className="space-y-2">
      {/* Selected grapes */}
      {composition.map(c => {
        const grape = allGrapes.find(g => g.id === c.grape_id);
        if (!grape) return null;
        return (
          <div key={c.grape_id} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-neutral-800 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg">
              🍇 {grape.name}
              <span className="text-xs text-neutral-500 ml-1">· {grape.type}</span>
            </span>
            <input
              type="number" min={1} max={100}
              value={c.percentage ?? ''}
              onChange={e => setPct(c.grape_id, e.target.value)}
              placeholder="%" className="w-16 h-8 px-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-purple-500 text-center"
            />
            <span className="text-xs text-neutral-400">%</span>
            <button type="button" onClick={() => removeGrape(c.grape_id)}
              className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        );
      })}

      {/* Search to add */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar uva para adicionar…"
          className="w-full pl-8 pr-3 h-9 text-sm border border-neutral-200 rounded-lg outline-none focus:border-purple-500 bg-white"
        />
        {search && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
            {filtered.map(g => (
              <button key={g.id} type="button" onClick={() => addGrape(g.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-purple-50 transition-colors">
                <span className="font-medium text-neutral-900">{g.name}</span>
                <span className="text-xs text-neutral-400">· {g.type}</span>
              </button>
            ))}
          </div>
        )}
        {search && filtered.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-sm text-neutral-400">
            Nenhuma uva encontrada
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Wines() {
  const [rows, setRows]         = useState<Wine[]>([]);
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [allGrapes, setAllGrapes] = useState<Grape[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing]   = useState<Wine | null>(null);
  const [form, setForm]         = useState(emptyWine());
  const [composition, setComposition] = useState<WineGrape[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [tableSearch, setTableSearch] = useState('');

  const load = async () => {
    const [{ data: wines }, { data: w }, { data: g }] = await Promise.all([
      supabase.from('wines').select('id, name, photo, winery_id, category, type, method, highlight, tasting_note, price_min, price_max, alcohol_pct, buy_link').order('name'),
      supabase.from('wineries').select('id, name').order('name'),
      supabase.from('grapes').select('id, name, type').order('name'),
    ]);
    setRows(wines ?? []);
    setWineries(w ?? []);
    setAllGrapes(g ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm(emptyWine()); setComposition([]); setError(''); setModalOpen(true);
  };

  const openEdit = async (r: Wine) => {
    setEditing(r);
    setForm({
      name: r.name, photo: r.photo, winery_id: r.winery_id, category: r.category,
      type: r.type, method: r.method, highlight: r.highlight, tasting_note: r.tasting_note,
      price_min: r.price_min, price_max: r.price_max, alcohol_pct: r.alcohol_pct, buy_link: r.buy_link,
    });
    const { data: wg } = await supabase
      .from('wine_grapes')
      .select('grape_id, percentage')
      .eq('wine_id', r.id);
    setComposition((wg ?? []).map((x: any) => ({ grape_id: x.grape_id, percentage: x.percentage })));
    setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo)      { setError('Selecione uma imagem para continuar.'); return; }
    if (!form.winery_id)  { setError('Selecione uma vinícola.'); return; }
    setSaving(true); setError('');

    const payload = {
      name:       form.name,
      photo:      form.photo,
      winery_id:  form.winery_id,
      category:   form.category,
      type:       form.type,
      method:     form.method     || null,
      highlight:  form.highlight,
      tasting_note: form.tasting_note || null,
      price_min:  form.price_min  ?? null,
      price_max:  form.price_max  ?? null,
      alcohol_pct: form.alcohol_pct ?? null,
      buy_link:   form.buy_link   || null,
    };

    let wineId: string;
    if (editing) {
      const { error: err } = await supabase.from('wines').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      wineId = editing.id;
    } else {
      const { data, error: err } = await supabase.from('wines').insert(payload).select('id').single();
      if (err || !data) { setError(err?.message ?? 'Erro ao criar vinho'); setSaving(false); return; }
      wineId = data.id;
    }

    // Sync grape composition
    await supabase.from('wine_grapes').delete().eq('wine_id', wineId);
    if (composition.length > 0) {
      await supabase.from('wine_grapes').insert(
        composition.map(c => ({ wine_id: wineId, grape_id: c.grape_id, percentage: c.percentage ?? null }))
      );
    }

    setModalOpen(false); load();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('wines').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const wineryName = (id: string) => wineries.find(w => w.id === id)?.name ?? '—';

  const filteredRows = useMemo(() =>
    tableSearch
      ? rows.filter(r => r.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
          wineryName(r.winery_id).toLowerCase().includes(tableSearch.toLowerCase()))
      : rows,
    [rows, tableSearch, wineries]
  );

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return '—';
    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
    return fmt(min ?? max!);
  };

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

      {/* Table search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={tableSearch}
          onChange={e => setTableSearch(e.target.value)}
          placeholder="Filtrar vinhos…"
          className="w-full pl-9 pr-3 h-9 text-sm border border-neutral-200 rounded-lg outline-none focus:border-purple-500 bg-white"
        />
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : filteredRows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum vinho encontrado.</p>
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden xl:table-cell">Preço</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
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
                  <td className="px-4 py-3 text-neutral-500 hidden xl:table-cell text-xs">{formatPrice(r.price_min, r.price_max)}</td>
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

          <Field label="Vinícola *">
            <select
              required
              value={form.winery_id}
              onChange={e => setForm(f => ({ ...f, winery_id: e.target.value }))}
              className={inp}
            >
              <option value="">Selecione uma vinícola…</option>
              {wineries.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>

          <FieldRow>
            <Field label="Preço mínimo (R$)">
              <input
                type="number" min={0} step="1"
                value={form.price_min ?? ''}
                onChange={e => setForm(f => ({ ...f, price_min: e.target.value ? Number(e.target.value) : null }))}
                placeholder="200"
                className={inp}
              />
            </Field>
            <Field label="Preço máximo (R$)">
              <input
                type="number" min={0} step="1"
                value={form.price_max ?? ''}
                onChange={e => setForm(f => ({ ...f, price_max: e.target.value ? Number(e.target.value) : null }))}
                placeholder="350"
                className={inp}
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Graduação alc. (%)">
              <input
                type="number" min={0} max={25} step="0.1"
                value={form.alcohol_pct ?? ''}
                onChange={e => setForm(f => ({ ...f, alcohol_pct: e.target.value ? Number(e.target.value) : null }))}
                placeholder="13.5"
                className={inp}
              />
            </Field>
            <Field label="Método de elaboração">
              <input
                value={form.method ?? ''}
                onChange={e => setForm(f => ({ ...f, method: e.target.value || null }))}
                placeholder="Champenoise, Charmat…"
                className={inp}
              />
            </Field>
          </FieldRow>

          <Field label="Composição (uvas)">
            <GrapeComposition
              allGrapes={allGrapes}
              composition={composition}
              onChange={setComposition}
            />
          </Field>

          <Field label="Imagem *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>

          <Field label="Destaque *">
            <textarea required value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))} rows={2} placeholder="Por que provar este vinho..." className={ta} />
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
