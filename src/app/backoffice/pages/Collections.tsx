import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronDown, MapPin, Building2, Grape, Wine, Star } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Collection = {
  id: string; title: string; tagline: string; photo: string;
  category: string; content_type: string;
  country_id: string | null; region_id: string | null; sub_region_id: string | null; is_mixed: boolean;
};
type ChipOption = { id: string; label: string; sub?: string };

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'];
const CONTENT_TYPES = [
  { value: 'Vinhos', label: 'Vinhos' },
  { value: 'Vinícolas', label: 'Vinícolas' },
  { value: 'Experiências', label: 'Experiências' },
  { value: 'Regiões', label: 'Regiões' },
  { value: 'Uvas', label: 'Uvas' },
  { value: 'Confrarias', label: 'Confrarias' },
];
const ITEM_TYPES: Record<string, string> = {
  Vinhos: 'wine', Vinícolas: 'winery', Experiências: 'experience',
  Regiões: 'region', Uvas: 'grape', Confrarias: 'brotherhood',
};

const empty = (): Omit<Collection, 'id'> => ({
  title: '', tagline: '', photo: '', category: 'Essencial',
  content_type: 'Vinhos', country_id: null, region_id: null, sub_region_id: null, is_mixed: false,
});

function MultiChipSelect({ label, icon, options, selected, onToggle }: {
  label: string; icon: React.ReactNode; options: ChipOption[]; selected: string[]; onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 transition-colors">
        <div className="flex items-center gap-2 text-neutral-700">
          <span className="text-neutral-400">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{selected.length}</span>}
          <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="p-2.5 border-t border-neutral-100">
          {options.length === 0 ? (
            <p className="text-xs text-neutral-400 py-1 px-1">Nenhum item cadastrado.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
              {options.map(opt => {
                const active = selected.includes(opt.id);
                return (
                  <button key={opt.id} type="button" onClick={() => onToggle(opt.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${active ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-neutral-600 border-neutral-200 hover:border-purple-300 hover:text-purple-700'}`}>
                    {opt.label}
                    {opt.sub && <span className={active ? 'opacity-60' : 'opacity-40'}>{opt.sub}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [regionOptions, setRegionOptions] = useState<ChipOption[]>([]);
  const [wineryOptions, setWineryOptions] = useState<ChipOption[]>([]);
  const [grapeOptions, setGrapeOptions] = useState<ChipOption[]>([]);
  const [wineOptions, setWineOptions] = useState<ChipOption[]>([]);
  const [experienceOptions, setExperienceOptions] = useState<ChipOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<{ id: string; name: string }[]>([]);
  const [allRegions, setAllRegions] = useState<{ id: string; name: string; level: string }[]>([]);

  const [selItems, setSelItems] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase.from('collections').select('*').order('title');
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const loadOptions = async () => {
      const [regsRes, wineriesRes, grapesRes, winesRes, expRes] = await Promise.all([
        supabase.from('regions').select('id, name, level').order('name'),
        supabase.from('wineries').select('id, name, category').order('name'),
        supabase.from('grapes').select('id, name, type').order('name'),
        supabase.from('wines').select('id, name, type').order('name'),
        supabase.from('experiences').select('id, name, category').order('name'),
      ]);

      const regs = regsRes.data ?? [];
      setAllRegions(regs);
      setCountryOptions(regs.filter(r => r.level === 'country'));
      setRegionOptions(regs.filter(r => r.level !== 'country').map(r => ({ id: r.id, label: r.name })));
      setWineryOptions((wineriesRes.data ?? []).map(w => ({ id: w.id, label: w.name, sub: ` · ${w.category}` })));
      setGrapeOptions((grapesRes.data ?? []).map(g => ({ id: g.id, label: g.name, sub: ` · ${g.type}` })));
      setWineOptions((winesRes.data ?? []).map(w => ({ id: w.id, label: w.name, sub: ` · ${w.type}` })));
      setExperienceOptions((expRes.data ?? []).map(ex => ({ id: ex.id, label: ex.name, sub: ` · ${ex.category}` })));
    };
    loadOptions();
  }, []);

  const getOptionsForContentType = () => {
    switch (form.content_type) {
      case 'Vinhos': return { opts: wineOptions, icon: <Wine size={14} />, label: 'Vinhos' };
      case 'Vinícolas': return { opts: wineryOptions, icon: <Building2 size={14} />, label: 'Vinícolas' };
      case 'Experiências': return { opts: experienceOptions, icon: <Star size={14} />, label: 'Experiências' };
      case 'Regiões': return { opts: regionOptions, icon: <MapPin size={14} />, label: 'Regiões' };
      case 'Uvas': return { opts: grapeOptions, icon: <Grape size={14} />, label: 'Uvas' };
      default: return null;
    }
  };

  const openCreate = () => {
    setEditing(null); setForm(empty()); setSelItems([]); setError(''); setSheetOpen(true);
  };

  const openEdit = async (r: Collection) => {
    setEditing(r);
    setForm({ title: r.title, tagline: r.tagline, photo: r.photo, category: r.category, content_type: r.content_type, country_id: r.country_id, region_id: r.region_id, sub_region_id: r.sub_region_id, is_mixed: r.is_mixed });
    setError('');
    const { data: items } = await supabase.from('collection_items').select('item_id').eq('collection_id', r.id);
    setSelItems((items ?? []).map(x => x.item_id));
    setSheetOpen(true);
  };

  const toggle = (id: string) => setSelItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem de capa.'); return; }
    setSaving(true); setError('');

    let collectionId: string;
    const payload = { ...form, country_id: form.country_id || null, region_id: form.region_id || null, sub_region_id: form.sub_region_id || null };

    if (editing) {
      const { error: err } = await supabase.from('collections').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      collectionId = editing.id;
    } else {
      const { data, error: err } = await supabase.from('collections').insert(payload).select('id').single();
      if (err || !data) { setError(err?.message ?? 'Erro ao criar coleção'); setSaving(false); return; }
      collectionId = data.id;
    }

    // Sync collection_items
    await supabase.from('collection_items').delete().eq('collection_id', collectionId);
    if (selItems.length > 0) {
      const itemType = ITEM_TYPES[form.content_type] ?? 'wine';
      await supabase.from('collection_items').insert(
        selItems.map((itemId, pos) => ({ collection_id: collectionId, item_id: itemId, item_type: itemType, position: pos }))
      );
    }

    setSheetOpen(false); load(); setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('collections').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const itemOptions = getOptionsForContentType();
  const subRegions = allRegions.filter(r => r.level === 'sub-region');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Coleções</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          <Plus size={16} /> Nova Coleção
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma coleção cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Título</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{r.content_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
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

      <FormModal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar Coleção' : 'Nova Coleção'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <Field label="Título *">
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Grandes Clássicos de Bordeaux" className={inp} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Subtítulo curto da coleção" className={inp} />
          </Field>
          <FieldRow>
            <Field label="Categoria *">
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tipo de conteúdo *">
              <select required value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))} className={inp}>
                {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="País (opcional)">
              <select value={form.country_id ?? ''} onChange={e => setForm(f => ({ ...f, country_id: e.target.value || null }))} className={inp}>
                <option value="">Todos</option>
                {countryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Região (opcional)">
              <select value={form.region_id ?? ''} onChange={e => setForm(f => ({ ...f, region_id: e.target.value || null }))} className={inp}>
                <option value="">Todas</option>
                {regionOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
          </FieldRow>
          {subRegions.length > 0 && (
            <Field label="Sub-região (opcional)">
              <select value={form.sub_region_id ?? ''} onChange={e => setForm(f => ({ ...f, sub_region_id: e.target.value || null }))} className={inp}>
                <option value="">Nenhuma</option>
                {subRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Imagem de capa *">
            <ImageUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} />
          </Field>
          <Field label="Descrição longa (opcional)">
            <textarea value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} rows={3} placeholder="Descrição da coleção..." className={ta} />
          </Field>

          {itemOptions && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Itens da coleção <span className="text-neutral-400 font-normal">({selItems.length} selecionados)</span>
              </label>
              <MultiChipSelect label={itemOptions.label} icon={itemOptions.icon} options={itemOptions.opts} selected={selItems} onToggle={toggle} />
            </div>
          )}

          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Coleção'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
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
