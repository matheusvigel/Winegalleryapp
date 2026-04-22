import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Pencil, Check, X, Save } from 'lucide-react';
import { PROFILE_ORDER } from '../../../lib/profileConstants';

type WineProfileRow = {
  id: string;
  label: string;
  archetype: string;
  tagline: string;
  emoji: string;
  description: string;
  order_index: number;
};

export default function ProfilesAdmin() {
  const [profiles, setProfiles] = useState<WineProfileRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [editing, setEditing]   = useState<string | null>(null);
  const [drafts, setDrafts]     = useState<Partial<WineProfileRow>>({});
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wine_profiles')
      .select('*')
      .order('order_index');
    if (data) setProfiles(data as WineProfileRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (p: WineProfileRow) => {
    setEditing(p.id);
    setDrafts({ ...p });
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setDrafts({});
  };

  const saveProfile = async (id: string) => {
    setSaving(id);
    const { emoji, label, archetype, tagline, description } = drafts;
    const { error } = await supabase
      .from('wine_profiles')
      .update({ emoji, label, archetype, tagline, description, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...drafts } as WineProfileRow : p));
      setEditing(null);
      setDrafts({});
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(error.message);
    }
    setSaving(null);
  };

  const sorted = [...profiles].sort((a, b) =>
    PROFILE_ORDER.indexOf(a.id) - PROFILE_ORDER.indexOf(b.id)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Perfis de Vinho</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Edite o conteúdo dos 5 perfis de apreciador — emoji, nome, arquétipo, tagline e descrição.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X size={14} /></button>
        </p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-2">
          <Check size={14} /> {success}
        </p>
      )}

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando…</p>
      ) : (
        <div className="space-y-4">
          {sorted.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border transition-shadow overflow-hidden ${
                editing === p.id ? 'border-purple-300 shadow-md' : 'border-neutral-200 shadow-sm'
              }`}
            >
              {editing === p.id ? (
                /* ── Edit mode ── */
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{drafts.emoji ?? p.emoji}</span>
                    <div>
                      <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">{p.id}</p>
                      <p className="text-sm font-semibold text-neutral-900">{drafts.label ?? p.label}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Emoji</label>
                      <input
                        value={drafts.emoji ?? ''}
                        onChange={e => setDrafts(d => ({ ...d, emoji: e.target.value }))}
                        placeholder="🌱"
                        className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Nome do perfil</label>
                      <input
                        value={drafts.label ?? ''}
                        onChange={e => setDrafts(d => ({ ...d, label: e.target.value }))}
                        placeholder="Iniciante Curioso"
                        className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Arquétipo</label>
                    <input
                      value={drafts.archetype ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, archetype: e.target.value }))}
                      placeholder="O Descobridor"
                      className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Tagline (frase inspiracional)</label>
                    <input
                      value={drafts.tagline ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, tagline: e.target.value }))}
                      placeholder="Todo grande sommelier já foi um novato apaixonado."
                      className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Descrição</label>
                    <textarea
                      value={drafts.description ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, description: e.target.value }))}
                      rows={3}
                      placeholder="Descreva o perfil do apreciador…"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-500 bg-white resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveProfile(p.id)}
                      disabled={saving === p.id}
                      className="flex items-center gap-2 px-4 h-9 bg-purple-700 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-60"
                    >
                      <Save size={14} />
                      {saving === p.id ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 h-9 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl shrink-0">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-0.5">{p.id}</p>
                          <h3 className="text-base font-bold text-neutral-900 leading-tight">{p.label}</h3>
                          <p className="text-xs text-purple-600 font-medium mt-0.5">{p.archetype}</p>
                        </div>
                        <button
                          onClick={() => startEdit(p)}
                          className="p-2 text-neutral-300 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                      {p.tagline && (
                        <p className="text-xs text-neutral-500 italic mt-2 leading-relaxed">
                          "{p.tagline}"
                        </p>
                      )}
                      {p.description && (
                        <p className="text-xs text-neutral-600 mt-2 leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-4xl mb-3">🍷</p>
              <p className="text-sm">Nenhum perfil encontrado. Execute a migration SQL primeiro.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Sobre os perfis</p>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• Os 5 perfis são fixos: <strong>novato → curioso → desbravador → curador → expert</strong>.</li>
          <li>• Aqui você edita apenas o <em>conteúdo</em> (nome, arquétipo, tagline, descrição, emoji).</li>
          <li>• As regras de prioridade de conteúdo por perfil são gerenciadas em <strong>Perfis & Conteúdo</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
