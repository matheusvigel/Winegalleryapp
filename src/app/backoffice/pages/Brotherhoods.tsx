import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import FormModal, { Field, FieldRow, inp, ta, btn } from '../components/FormModal';
import ImageUpload from '../components/ImageUpload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type Brotherhood = {
  id: string;
  name: string;
  photo: string;
  region_id: string | null;
  description: string | null;
  highlight: string | null;
  website: string | null;
};
type Region = { id: string; name: string };

const empty = (): Omit<Brotherhood, 'id'> => ({
  name: '', photo: '', region_id: null, description: null, highlight: null, website: null,
});

export default function Brotherhoods() {
  const [rows, setRows]       = useState<Brotherhood[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [editing, setEditing]     = useState<Brotherhood | null>(null);
  const [form, setForm]           = useState(empty());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from('brotherhoods').select('*').order('name'),
      supabase.from('regions').select('id, name').in('level', ['country', 'region']).order('name'),
    ]);
    setRows(b ?? []);
    setRegions(r ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(''); setModalOpen(true); };
  const openEdit = (b: Brotherhood) => {
    setEditing(b);
    setForm({ name: b.name, photo: b.photo, region_id: b.region_id, description: b.description, highlight: b.highlight, website: b.website });
    setError(''); setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.photo) { setError('Selecione uma imagem para continuar.'); return; }
    setSaving(true); setError('');
    const payload = {
      ...form,
      region_id:   form.region_id   || null,
      description: form.description || null,
      highlight:   form.highlight   || null,
      website:     form.website     || null,
    };
    const result = editing
      ? await supabase.from('brotherhoods').update(payload).eq('id', editing.id)
      : await supabase.from('brotherhoods').insert(payload);
    if (result.error) { setError(result.error.message); } else { setModalOpen(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('brotherhoods').delete().eq('id', deleteId);
    setDeleteId(null); load();
  };

  const regionName = (id: string | null) => id ? (regions.find(r => r.id === id)?.name ?? id) : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Confrarias</h1>
          <p className="text-sm text-neutral-500 mt-1">{rows.length} registros</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
        >
          <Plus size={16} /> Nova Confraria
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma confraria cadastrada.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Região</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Imagem</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{regionName(r.region_id)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
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

      {/* ── Create / Edit modal ────────────────────────────────────────────────── */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Confraria' : 'Nova Confraria'}
        onSubmit={handleSave}
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <Field label="Nome *">
          <input
            className={inp}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome da confraria"
            required
          />
        </Field>

        <Field label="Região">
          <select
            className={inp}
            value={form.region_id ?? ''}
            onChange={e => setForm(f => ({ ...f, region_id: e.target.value || null }))}
          >
            <option value="">Selecione uma região (opcional)</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Imagem *">
          <ImageUpload
            value={form.photo}
            onChange={url => setForm(f => ({ ...f, photo: url }))}
          />
        </Field>

        <Field label="Destaque">
          <textarea
            className={ta}
            value={form.highlight ?? ''}
            onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
            placeholder="Frase de destaque da confraria"
            rows={2}
          />
        </Field>

        <Field label="Descrição">
          <textarea
            className={ta}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição detalhada"
            rows={3}
          />
        </Field>

        <Field label="Website (opcional)">
          <input
            className={inp}
            type="url"
            value={form.website ?? ''}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            placeholder="https://confraria.com.br"
          />
        </Field>

        <button type="submit" disabled={saving} className={btn}>
          {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar confraria'}
        </button>
      </FormModal>

      {/* ── Delete confirmation ───────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir confraria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
