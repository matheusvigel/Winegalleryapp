import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2, ChevronDown, MapPin, Building2, Grape, Wine, Star } from 'lucide-react';
import type { WineLevel } from '../../../../lib/database.types';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Collection = {
  id: string; title: string; description: string; level: WineLevel;
  cover_image: string; background_image: string | null;
  total_points: number; content_type: string;
};
type ChipOption = { id: string; label: string; sub?: string };

const CONTENT_TYPES = [
  { value: 'mix', label: 'Mix (vários tipos)' },
  { value: 'wines', label: 'Vinhos' },
  { value: 'wineries', label: 'Vinícolas' },
  { value: 'experiences', label: 'Experiências' },
  { value: 'grapes', label: 'Uvas' },
];

const empty = (): Omit<Collection, 'id'> => ({
  title: '', description: '', level: 'essential', cover_image: '',
  background_image: null, total_points: 0, content_type: 'mix',
});

const levelLabel: Record<WineLevel, string> = {
  essential: 'Essencial',
  escape: 'Fuja do óbvio',
  icon: 'Ícone',
};

const levelColor: Record<WineLevel, string> = {
  essential: 'bg-green-100 text-green-700',
  escape: 'bg-blue-100 text-blue-700',
  icon: 'bg-yellow-100 text-yellow-700',
};

// ─── Multi-select chip component ────────────────────────────────────────────
function MultiChipSelect({
  label,
  icon,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-neutral-700">
          <span className="text-neutral-400">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
              {selected.length}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-neutral-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
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
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggle(opt.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? 'bg-red-900 text-white border-red-900 shadow-sm'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-red-300 hover:text-red-800'
                    }`}
                  >
                    {opt.label}
                    {opt.sub && (
                      <span className={active ? 'opacity-60' : 'opacity-40'}>{opt.sub}</span>
                    )}
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

// ─── Main component ──────────────────────────────────────────────────────────
export default function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Relation options
  const [regionOptions, setRegionOptions] = useState<ChipOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<ChipOption[]>([]);
  const [grapeOptions, setGrapeOptions] = useState<ChipOption[]>([]);
  const [wineOptions, setWineOptions] = useState<ChipOption[]>([]);
  const [experienceOptions, setExperienceOptions] = useState<ChipOption[]>([]);

  // Selected relations
  const [selRegions, setSelRegions] = useState<string[]>([]);
  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selGrapes, setSelGrapes] = useState<string[]>([]);
  const [selWines, setSelWines] = useState<string[]>([]);
  const [selExperiences, setSelExperiences] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase.from('collections').select('*').order('title');
    setRows(data ?? []);
    setLoading(false);
  };

  // Load all selectable options once
  useEffect(() => {
    load();
    const loadOptions = async () => {
      const [countriesRes, regionsRes, brandsRes, grapesRes, winesRes, expRes] = await Promise.all([
        supabase.from('countries').select('id, name').order('name'),
        supabase.from('regions').select('id, name, country_id').order('name'),
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('grapes').select('id, name, type').order('name'),
        supabase.from('wine_items').select('id, name, level').order('name'),
        supabase.from('experiences').select('id, name, category').order('name'),
      ]);

      const countryMap = Object.fromEntries(
        (countriesRes.data ?? []).map(c => [c.id, c.name])
      );

      setRegionOptions(
        (regionsRes.data ?? []).map(r => ({
          id: r.id,
          label: r.name,
          sub: countryMap[r.country_id] ? ` · ${countryMap[r.country_id]}` : undefined,
        }))
      );
      setBrandOptions((brandsRes.data ?? []).map(b => ({ id: b.id, label: b.name })));
      setGrapeOptions(
        (grapesRes.data ?? []).map(g => ({
          id: g.id,
          label: g.name,
          sub: g.type === 'red' ? ' · Tinta' : ' · Branca',
        }))
      );
      setWineOptions(
        (winesRes.data ?? []).map(w => ({
          id: w.id,
          label: w.name,
          sub: ` · ${levelLabel[w.level]}`,
        }))
      );
      setExperienceOptions(
        (expRes.data ?? []).map(ex => ({
          id: ex.id,
          label: ex.name,
          sub: ` · ${ex.category}`,
        }))
      );
    };
    loadOptions();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setSelRegions([]);
    setSelBrands([]);
    setSelGrapes([]);
    setSelWines([]);
    setSelExperiences([]);
    setError('');
    setSheetOpen(true);
  };

  const openEdit = async (r: Collection) => {
    setEditing(r);
    setForm({ title: r.title, description: r.description, level: r.level, cover_image: r.cover_image,
      background_image: r.background_image, total_points: r.total_points, content_type: r.content_type });
    setError('');

    // Load existing relations
    const [regRes, brRes, grRes, wineRes, expRes] = await Promise.all([
      supabase.from('region_collections').select('region_id').eq('collection_id', r.id),
      supabase.from('brand_collections').select('brand_id').eq('collection_id', r.id),
      supabase.from('grape_collections').select('grape_id').eq('collection_id', r.id),
      supabase.from('collection_items').select('item_id').eq('collection_id', r.id),
      supabase.from('collection_experiences').select('experience_id').eq('collection_id', r.id),
    ]);
    setSelRegions((regRes.data ?? []).map(x => x.region_id));
    setSelBrands((brRes.data ?? []).map(x => x.brand_id));
    setSelGrapes((grRes.data ?? []).map(x => x.grape_id));
    setSelWines((wineRes.data ?? []).map(x => x.item_id));
    setSelExperiences((expRes.data ?? []).map(x => x.experience_id));

    setSheetOpen(true);
  };

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cover_image) { setError('Selecione uma imagem de capa para continuar.'); return; }
    setSaving(true);
    setError('');

    let collectionId: string;

    if (editing) {
      const result = await supabase.from('collections').update(form).eq('id', editing.id);
      if (result.error) { setError(result.error.message); setSaving(false); return; }
      collectionId = editing.id;
    } else {
      collectionId = crypto.randomUUID();
      const result = await supabase.from('collections').insert({ id: collectionId, ...form });
      if (result.error) { setError(result.error.message); setSaving(false); return; }
    }

    // Sync junction tables: delete all, then re-insert selected
    await Promise.all([
      supabase.from('region_collections').delete().eq('collection_id', collectionId),
      supabase.from('brand_collections').delete().eq('collection_id', collectionId),
      supabase.from('grape_collections').delete().eq('collection_id', collectionId),
      supabase.from('collection_items').delete().eq('collection_id', collectionId),
      supabase.from('collection_experiences').delete().eq('collection_id', collectionId),
    ]);

    const inserts: Promise<unknown>[] = [];
    if (selRegions.length > 0)
      inserts.push(supabase.from('region_collections').insert(
        selRegions.map(rid => ({ region_id: rid, collection_id: collectionId }))
      ));
    if (selBrands.length > 0)
      inserts.push(supabase.from('brand_collections').insert(
        selBrands.map(bid => ({ brand_id: bid, collection_id: collectionId }))
      ));
    if (selGrapes.length > 0)
      inserts.push(supabase.from('grape_collections').insert(
        selGrapes.map(gid => ({ grape_id: gid, collection_id: collectionId }))
      ));
    if (selWines.length > 0)
      inserts.push(supabase.from('collection_items').insert(
        selWines.map(wid => ({ collection_id: collectionId, item_id: wid }))
      ));
    if (selExperiences.length > 0)
      inserts.push(supabase.from('collection_experiences').insert(
        selExperiences.map(eid => ({ collection_id: collectionId, experience_id: eid }))
      ));

    await Promise.all(inserts);

    setSheetOpen(false);
    load();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('collections').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  const totalRelations = selRegions.length + selBrands.length + selGrapes.length + selWines.length + selExperiences.length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Coleções</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
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
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Pontos</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-neutral-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${levelColor[r.level]}`}>
                      {levelLabel[r.level]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{r.total_points} pts</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
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

      <FormModal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar Coleção' : 'Nova Coleção'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          <Field label="Título *">
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Grandes Clássicos de Bordeaux" className={inp} />
          </Field>
          <FieldRow>
            <Field label="Nível *">
              <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as WineLevel }))} className={inp}>
                <option value="essential">Essencial</option>
                <option value="escape">Fuja do óbvio</option>
                <option value="icon">Ícone</option>
              </select>
            </Field>
            <Field label="Total de pontos">
              <input type="number" min={0} value={form.total_points} onChange={e => setForm(f => ({ ...f, total_points: Number(e.target.value) }))} className={inp} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Tipo de conteúdo *">
              <select required value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))} className={inp}>
                {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </Field>
          </FieldRow>
          <Field label="Imagem de capa *">
            <ImageUpload value={form.cover_image} onChange={url => setForm(f => ({ ...f, cover_image: url }))} />
          </Field>
          <Field label="Imagem de background (opcional)">
            <ImageUpload value={form.background_image ?? ''} onChange={url => setForm(f => ({ ...f, background_image: url || null }))} />
          </Field>
          <Field label="Descrição *">
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descrição da coleção..." className={ta} />
          </Field>

          {/* ── Relations ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">Relações</label>
              {totalRelations > 0 && (
                <span className="text-xs text-neutral-400">{totalRelations} selecionada{totalRelations !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="space-y-2">
              <MultiChipSelect label="Regiões" icon={<MapPin size={14} />} options={regionOptions} selected={selRegions} onToggle={toggle(setSelRegions)} />
              <MultiChipSelect label="Vinícolas" icon={<Building2 size={14} />} options={brandOptions} selected={selBrands} onToggle={toggle(setSelBrands)} />
              <MultiChipSelect label="Uvas" icon={<Grape size={14} />} options={grapeOptions} selected={selGrapes} onToggle={toggle(setSelGrapes)} />
              <MultiChipSelect label="Vinhos" icon={<Wine size={14} />} options={wineOptions} selected={selWines} onToggle={toggle(setSelWines)} />
              <MultiChipSelect label="Experiências" icon={<Star size={14} />} options={experienceOptions} selected={selExperiences} onToggle={toggle(setSelExperiences)} />
            </div>
          </div>

          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Coleção'}
          </button>
        </form>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. As relações com regiões, vinícolas, uvas e vinhos também serão removidas.</AlertDialogDescription>
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

