import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// ── Constants ────────────────────────────────────────────────────────────────

export const PLACE_TYPES: { value: string; label: string; emoji: string; subTypes: string[] }[] = [
  {
    value: 'restaurant',
    label: 'Restaurante',
    emoji: '🍽️',
    subTypes: ['Bistrô', 'Wine Bar', 'Enoteca', 'Taberna', 'Fine Dining', 'Casual', 'Pizzaria', 'Steakhouse'],
  },
  {
    value: 'accommodation',
    label: 'Hospedagem',
    emoji: '🏨',
    subTypes: ['Hotel', 'Pousada', 'Boutique Hotel', 'Resort', 'Fazenda Hotel', 'Chalé', 'B&B'],
  },
  {
    value: 'attraction',
    label: 'Atração Turística',
    emoji: '🎯',
    subTypes: ['Museu', 'Parque', 'Adega', 'Tour Guiado', 'Ecoturismo', 'Spa', 'Mirante', 'Centro Histórico'],
  },
];

const PRICE_RANGES = [
  { value: '$',    label: '$ — Econômico'      },
  { value: '$$',   label: '$$ — Moderado'      },
  { value: '$$$',  label: '$$$ — Sofisticado'  },
  { value: '$$$$', label: '$$$$ — Premium'     },
];

// ── Types ────────────────────────────────────────────────────────────────────

type Place = {
  id: string; name: string; photo: string | null;
  description: string | null; highlight: string | null;
  region_id: string | null; sub_region_id: string | null;
  type: string; sub_type: string | null;
  website: string | null; address: string | null; price_range: string | null;
};

type Region = { id: string; name: string; level: string };

const empty = (): Omit<Place, 'id'> => ({
  name: '', photo: null, description: null, highlight: null,
  region_id: null, sub_region_id: null,
  type: 'restaurant', sub_type: null,
  website: null, address: null, price_range: null,
});

// ── Component ────────────────────────────────────────────────────────────────

export default function Places() {
  const [rows, setRows]         = useState<Place[]>([]);
  const [regions, setRegions]   = useState<Region[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing]   = useState<Place | null>(null);
  const [form, setForm]         = useState<Omit<Place, 'id'>>(empty());
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const load = async () => {
    const { data } = await supabase
      .from('places')
      .select('*')
      .order('name');
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase
      .from('regions')
      .select('id, name, level')
      .in('level', ['country', 'region', 'sub-region'])
      .order('name')
      .then(({ data }) => setRegions(data ?? []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p: Place) => {
    setEditing(p);
    setForm({
      name: p.name, photo: p.photo, description: p.description, highlight: p.highlight,
      region_id: p.region_id, sub_region_id: p.sub_region_id,
      type: p.type, sub_type: p.sub_type,
      website: p.website, address: p.address, price_range: p.price_range,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      photo:         form.photo || null,
      description:   form.description || null,
      highlight:     form.highlight || null,
      region_id:     form.region_id || null,
      sub_region_id: form.sub_region_id || null,
      sub_type:      form.sub_type || null,
      website:       form.website || null,
      address:       form.address || null,
      price_range:   form.price_range || null,
    };
    const result = editing
      ? await supabase.from('places').update(payload).eq('id', editing.id)
      : await supabase.from('places').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setModalOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('places').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  // Sub-types for the currently selected type
  const currentSubTypes = PLACE_TYPES.find(t => t.value === form.type)?.subTypes ?? [];

  // Filtered rows
  const filtered = filterType === 'all' ? rows : rows.filter(r => r.type === filterType);

  const typeLabel = (type: string) => PLACE_TYPES.find(t => t.value === type)?.label ?? type;
  const typeEmoji = (type: string) => PLACE_TYPES.find(t => t.value === type)?.emoji ?? '📍';
  const regionName = (id: string | null) => id ? (regions.find(r => r.id === id)?.name ?? id) : '—';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lugares</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
        >
          <Plus size={16} /> Novo Lugar
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            filterType === 'all' ? 'bg-purple-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Todos ({rows.length})
        </button>
        {PLACE_TYPES.map(pt => {
          const count = rows.filter(r => r.type === pt.value).length;
          return (
            <button
              key={pt.value}
              onClick={() => setFilterType(pt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === pt.value ? 'bg-purple-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {pt.emoji} {pt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum lugar cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Sub-tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Região</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Preço</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-base flex-shrink-0">
                          {typeEmoji(p.type)}
                        </div>
                      )}
                      <span className="font-medium text-neutral-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-full">
                      {typeEmoji(p.type)} {typeLabel(p.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500 text-xs">{p.sub_type ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-500 text-xs">{regionName(p.region_id)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-500 font-mono text-xs">{p.price_range ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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

      {/* Create / Edit Modal */}
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Lugar' : 'Novo Lugar'}>
        <form onSubmit={handleSave} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

          <FieldRow>
            <Field label="Nome *">
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Casa do Vinho..."
                className={inp}
              />
            </Field>
            <Field label="Preço">
              <select
                value={form.price_range ?? ''}
                onChange={e => setForm(f => ({ ...f, price_range: e.target.value || null }))}
                className={inp}
              >
                <option value="">Não informado</option>
                {PRICE_RANGES.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
              </select>
            </Field>
          </FieldRow>

          {/* Type selector */}
          <Field label="Tipo *">
            <div className="grid grid-cols-3 gap-2">
              {PLACE_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: pt.value, sub_type: null }))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${
                    form.type === pt.value
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-purple-300'
                  }`}
                >
                  <span className="text-2xl">{pt.emoji}</span>
                  {pt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Sub-type (cascades from type) */}
          <Field label="Sub-tipo">
            <select
              value={form.sub_type ?? ''}
              onChange={e => setForm(f => ({ ...f, sub_type: e.target.value || null }))}
              className={inp}
            >
              <option value="">Selecionar sub-tipo...</option>
              {currentSubTypes.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </Field>

          <FieldRow>
            <Field label="Região (opcional)">
              <select
                value={form.region_id ?? ''}
                onChange={e => setForm(f => ({ ...f, region_id: e.target.value || null }))}
                className={inp}
              >
                <option value="">Sem região</option>
                {regions.filter(r => r.level !== 'sub-region').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Sub-região (opcional)">
              <select
                value={form.sub_region_id ?? ''}
                onChange={e => setForm(f => ({ ...f, sub_region_id: e.target.value || null }))}
                className={inp}
              >
                <option value="">Sem sub-região</option>
                {regions.filter(r => r.level === 'sub-region').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <Field label="Imagem">
            <ImageUpload value={form.photo ?? ''} onChange={url => setForm(f => ({ ...f, photo: url || null }))} />
          </Field>

          <Field label="Endereço">
            <input
              value={form.address ?? ''}
              onChange={e => setForm(f => ({ ...f, address: e.target.value || null }))}
              placeholder="Rua das Uvas, 123 — Serra Gaúcha"
              className={inp}
            />
          </Field>

          <Field label="Website">
            <input
              type="url"
              value={form.website ?? ''}
              onChange={e => setForm(f => ({ ...f, website: e.target.value || null }))}
              placeholder="https://..."
              className={inp}
            />
          </Field>

          <Field label="Destaque">
            <textarea
              value={form.highlight ?? ''}
              onChange={e => setForm(f => ({ ...f, highlight: e.target.value || null }))}
              rows={2}
              placeholder="Por que visitar este lugar..."
              className={ta}
            />
          </Field>

          <Field label="Descrição">
            <textarea
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
              rows={3}
              placeholder="Descrição completa..."
              className={ta}
            />
          </Field>

          <button type="submit" disabled={saving} className={btn}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Lugar'}
          </button>
        </form>
      </FormModal>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lugar?</AlertDialogTitle>
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
