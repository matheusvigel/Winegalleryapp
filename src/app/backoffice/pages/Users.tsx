import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Shield, ShieldOff, Search, RefreshCw } from 'lucide-react';
import {
  PROFILE_LABELS, PROFILE_ICONS, LEVEL_LABELS,
  type WineProfile, type UserLevel, type UserType,
} from '../../../lib/profileConstants';

type UserRow = {
  user_id: string;
  display_name: string;
  email: string | null;
  wine_profile: WineProfile | null;
  user_level: UserLevel | null;
  user_type: UserType | null;
  total_points: number;
  quiz_completed: boolean;
  created_at: string;
};

export default function Users() {
  const [rows, setRows]         = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email, wine_profile, user_level, user_type, total_points, quiz_completed, created_at')
      .order('created_at', { ascending: false });
    if (error) { setError(error.message); }
    else { setRows(data ?? []); setFiltered(data ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? rows.filter(r =>
        r.email?.toLowerCase().includes(q) ||
        r.display_name?.toLowerCase().includes(q)
      ) : rows
    );
  }, [search, rows]);

  const toggleType = async (userId: string, current: UserType | null) => {
    setToggling(userId);
    const next: UserType = current === 'admin' ? 'normal' : 'admin';
    const { error } = await supabase
      .from('user_profiles')
      .update({ user_type: next })
      .eq('user_id', userId);
    if (error) { setError(error.message); }
    else { setRows(prev => prev.map(r => r.user_id === userId ? { ...r, user_type: next } : r)); }
    setToggling(null);
  };

  const profileLabel = (p: WineProfile | null) =>
    p ? `${PROFILE_ICONS[p]} ${PROFILE_LABELS[p]}` : '—';

  const levelLabel = (l: UserLevel | null) =>
    l ? LEVEL_LABELS[l] : '—';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });

  const admins  = rows.filter(r => r.user_type === 'admin').length;
  const quizzed = rows.filter(r => r.quiz_completed).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Usuários</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {rows.length} cadastros · {admins} admin · {quizzed} com quiz completo
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email ou nome…"
          className="w-full pl-9 pr-4 h-10 text-sm border border-neutral-200 rounded-lg outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 bg-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum usuário encontrado.</p>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Usuário</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Perfil</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Nível</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden sm:table-cell text-right">Pts</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Cadastro</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-center">Tipo</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.user_id} className={`border-b border-neutral-100 last:border-0 ${i % 2 ? 'bg-neutral-50/50' : ''}`}>
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                        {(r.display_name || r.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {r.display_name || <span className="text-neutral-400 italic">sem nome</span>}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{r.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Perfil */}
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                    <span className="flex items-center gap-1.5">
                      {profileLabel(r.wine_profile)}
                      {r.quiz_completed && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">quiz ✓</span>
                      )}
                    </span>
                  </td>

                  {/* Nível */}
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">
                    {levelLabel(r.user_level)}
                  </td>

                  {/* Pontos */}
                  <td className="px-4 py-3 hidden sm:table-cell text-right font-mono text-neutral-700 font-medium">
                    {r.total_points ?? 0}
                  </td>

                  {/* Cadastro */}
                  <td className="px-4 py-3 text-neutral-400 text-xs hidden lg:table-cell">
                    {formatDate(r.created_at)}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 text-center">
                    {r.user_type === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        <Shield size={11} /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 font-medium">Normal</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleType(r.user_id, r.user_type)}
                      disabled={toggling === r.user_id}
                      title={r.user_type === 'admin' ? 'Remover acesso admin' : 'Dar acesso admin'}
                      className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
                        r.user_type === 'admin'
                          ? 'text-purple-600 hover:text-red-600 hover:bg-red-50'
                          : 'text-neutral-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {r.user_type === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
