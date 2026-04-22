import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { RefreshCw, Check, X, ExternalLink, Wine, Clock, Trophy } from 'lucide-react';

type Submission = {
  id:               string;
  wine_name:        string;
  winery_name:      string | null;
  vintage:          number | null;
  wine_type:        string | null;
  region_hint:      string | null;
  notes:            string | null;
  label_photo:      string | null;
  status:           'pending' | 'approved' | 'rejected';
  is_pioneer:       boolean;
  created_at:       string;
  submitted_by:     string | null;
  user_profiles:    { display_name: string; email: string } | null;
};

const STATUS_LABEL: Record<string, { label: string; pill: string }> = {
  pending:  { label: 'Pendente',  pill: 'bg-amber-100 text-amber-700'  },
  approved: { label: 'Aprovado',  pill: 'bg-green-100 text-green-700'  },
  rejected: { label: 'Rejeitado', pill: 'bg-red-100 text-red-600'      },
};

export default function WineSubmissions() {
  const [rows, setRows]     = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [acting, setActing]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const q = supabase
      .from('wine_submissions')
      .select('*, user_profiles(display_name, email)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') q.eq('status', filter);
    const { data } = await q;
    setRows((data ?? []) as Submission[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: 'approved' | 'rejected', isPioneer = false) => {
    setActing(id);
    await supabase
      .from('wine_submissions')
      .update({ status, is_pioneer: isPioneer })
      .eq('id', id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status, is_pioneer: isPioneer } : r));
    setActing(null);
  };

  const counts = {
    all:      rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });

  const displayed = filter === 'all' ? rows : rows.filter(r => r.status === filter);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Envios para Curadoria</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Vinhos enviados por usuários para revisão
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

      {/* ── Filter tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-6 w-fit">
        {(['pending','approved','rejected','all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_LABEL[f].label}
            {' '}
            <span className="ml-1 text-xs text-neutral-400">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <Wine className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhum envio {filter !== 'all' ? STATUS_LABEL[filter].label.toLowerCase() : ''} encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(sub => (
            <div key={sub.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
              <div className="flex gap-4">
                {/* Label photo */}
                {sub.label_photo ? (
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img src={sub.label_photo} alt="Rótulo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-20 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center">
                    <Wine className="w-7 h-7 text-neutral-300" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-bold text-neutral-900 text-sm leading-tight">
                        {sub.wine_name}
                        {sub.vintage && <span className="font-normal text-neutral-500 ml-1">{sub.vintage}</span>}
                      </p>
                      {sub.winery_name && <p className="text-xs text-neutral-600">{sub.winery_name}</p>}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_LABEL[sub.status].pill}`}>
                      {STATUS_LABEL[sub.status].label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mb-2">
                    {sub.wine_type && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{sub.wine_type}</span>}
                    {sub.region_hint && <span>📍 {sub.region_hint}</span>}
                    {sub.is_pioneer && <span className="flex items-center gap-1 text-amber-600"><Trophy size={11} /> Pioneiro</span>}
                  </div>

                  {sub.notes && (
                    <p className="text-xs text-neutral-500 mb-2 line-clamp-2 leading-relaxed">{sub.notes}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Clock size={11} />
                      {fmtDate(sub.created_at)}
                      {sub.user_profiles && (
                        <span>· {sub.user_profiles.display_name || sub.user_profiles.email}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {sub.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStatus(sub.id, 'approved', true)}
                          disabled={acting === sub.id}
                          title="Aprovar como pioneiro"
                          className="flex items-center gap-1 px-3 h-7 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                          <Trophy size={11} /> Pioneiro
                        </button>
                        <button
                          onClick={() => setStatus(sub.id, 'approved')}
                          disabled={acting === sub.id}
                          className="flex items-center gap-1 px-3 h-7 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                          <Check size={12} /> Aprovar
                        </button>
                        <button
                          onClick={() => setStatus(sub.id, 'rejected')}
                          disabled={acting === sub.id}
                          className="flex items-center gap-1 px-3 h-7 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          <X size={12} /> Rejeitar
                        </button>
                      </div>
                    )}

                    {sub.status !== 'pending' && (
                      <button
                        onClick={() => setStatus(sub.id, 'approved')}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
