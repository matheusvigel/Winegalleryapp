import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield, ShieldOff, Search, UserPlus, AlertTriangle,
  Check, X, RefreshCw, Crown,
} from 'lucide-react';

type AdminRow = {
  user_id:      string;
  display_name: string;
  email:        string | null;
  user_type:    string;
  wine_profile: string | null;
  created_at:   string;
};

export default function Admins() {
  const { user: currentUser } = useAuth();

  const [admins, setAdmins]         = useState<AdminRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [revoking, setRevoking]     = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // Promote form
  const [searchEmail, setSearchEmail]   = useState('');
  const [searching, setSearching]       = useState(false);
  const [found, setFound]               = useState<AdminRow | null | 'not-found'>(null);
  const [promoting, setPromoting]       = useState(false);

  // Confirm revoke
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email, user_type, wine_profile, created_at')
      .eq('user_type', 'admin')
      .order('created_at');
    if (error) setError(error.message);
    else setAdmins(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  // Search user by email
  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFound(null);
    setError('');

    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email, user_type, wine_profile, created_at')
      .ilike('email', searchEmail.trim())
      .maybeSingle();

    setFound(data ?? 'not-found');
    setSearching(false);
  };

  // Promote to admin
  const handlePromote = async () => {
    if (!found || found === 'not-found') return;
    setPromoting(true);
    setError('');

    const { error } = await supabase
      .from('user_profiles')
      .update({ user_type: 'admin' })
      .eq('user_id', (found as AdminRow).user_id);

    if (error) {
      setError(error.message);
    } else {
      showSuccess(`${(found as AdminRow).display_name || (found as AdminRow).email} agora é administrador.`);
      setSearchEmail('');
      setFound(null);
      load();
    }
    setPromoting(false);
  };

  // Revoke admin
  const handleRevoke = async (userId: string) => {
    setRevoking(userId);
    setError('');

    const { error } = await supabase
      .from('user_profiles')
      .update({ user_type: 'normal' })
      .eq('user_id', userId);

    if (error) {
      setError(error.message);
    } else {
      const revoked = admins.find(a => a.user_id === userId);
      showSuccess(`Acesso de ${revoked?.display_name || revoked?.email} removido.`);
      setAdmins(prev => prev.filter(a => a.user_id !== userId));
    }
    setRevoking(null);
    setConfirmRevoke(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });

  const isSelf = (userId: string) => userId === currentUser?.id;

  const alreadyAdmin = found && found !== 'not-found' && (found as AdminRow).user_type === 'admin';

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Administradores</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {admins.length} administrador{admins.length !== 1 ? 'es' : ''} ativo{admins.length !== 1 ? 's' : ''}
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

      {/* ── Alerts ─────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
          <Check size={14} /> {success}
        </div>
      )}

      {/* ── Adicionar admin ─────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <UserPlus size={16} className="text-purple-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Promover usuário a administrador</h2>
            <p className="text-xs text-neutral-400">O usuário precisa ter uma conta criada no app.</p>
          </div>
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="email"
              value={searchEmail}
              onChange={e => { setSearchEmail(e.target.value); setFound(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="email@exemplo.com"
              className="w-full pl-9 pr-4 h-10 text-sm border border-neutral-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 bg-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchEmail.trim() || searching}
            className="h-10 px-4 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-40"
          >
            {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {/* Search result */}
        {found === 'not-found' && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Usuário não encontrado</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Nenhuma conta com esse email. Peça para o usuário criar uma conta no app primeiro —
                depois volte aqui para promovê-lo.
              </p>
            </div>
          </div>
        )}

        {found && found !== 'not-found' && (
          <div className={`flex items-center gap-3 border rounded-xl p-4 ${
            alreadyAdmin
              ? 'bg-purple-50 border-purple-200'
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
              {((found as AdminRow).display_name || (found as AdminRow).email || '?').charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {(found as AdminRow).display_name || <span className="text-neutral-400 italic">sem nome</span>}
              </p>
              <p className="text-xs text-neutral-500 truncate">{(found as AdminRow).email}</p>
            </div>

            {/* Badge or button */}
            {alreadyAdmin ? (
              <span className="flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                <Shield size={12} /> Já é admin
              </span>
            ) : (
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="flex items-center gap-2 px-4 h-9 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-60"
              >
                <Crown size={14} />
                {promoting ? 'Promovendo…' : 'Tornar admin'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Lista de admins ─────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Administradores ativos
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <p className="text-center py-10 text-neutral-400 text-sm bg-white rounded-2xl border border-neutral-200">
            Nenhum administrador cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {admins.map(admin => (
              <div
                key={admin.user_id}
                className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                  isSelf(admin.user_id) ? 'border-purple-200 bg-purple-50/30' : 'border-neutral-200'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold text-base border-2 border-white shadow-sm">
                    {(admin.display_name || admin.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Shield size={9} className="text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {admin.display_name || <span className="italic text-neutral-400">sem nome</span>}
                    </p>
                    {isSelf(admin.user_id) && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                        você
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{admin.email ?? '—'}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Admin desde {formatDate(admin.created_at)}
                  </p>
                </div>

                {/* Revoke */}
                {!isSelf(admin.user_id) && (
                  confirmRevoke === admin.user_id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-500">Confirmar?</span>
                      <button
                        onClick={() => handleRevoke(admin.user_id)}
                        disabled={revoking === admin.user_id}
                        className="flex items-center gap-1 px-3 h-8 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {revoking === admin.user_id ? '…' : <><ShieldOff size={12} /> Remover</>}
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(admin.user_id)}
                      title="Remover acesso admin"
                      className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    >
                      <ShieldOff size={16} />
                    </button>
                  )
                )}

                {isSelf(admin.user_id) && (
                  <div
                    title="Não é possível remover seu próprio acesso"
                    className="p-2 text-neutral-200 cursor-not-allowed shrink-0"
                  >
                    <ShieldOff size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Info box ────────────────────────────────────────────── */}
      <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Como funciona</p>
        <ul className="text-xs text-neutral-500 space-y-1.5">
          <li>• Administradores têm acesso completo ao backoffice do Wine Gallery.</li>
          <li>• Para adicionar um novo admin, o usuário deve <strong>primeiro criar uma conta</strong> no app e depois ser promovido aqui.</li>
          <li>• Você não pode remover seu próprio acesso de administrador.</li>
          <li>• A remoção de acesso é imediata — o usuário perde acesso ao backoffice no próximo carregamento.</li>
        </ul>
      </div>

    </div>
  );
}
