import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Sparkles, TrendingUp, MapPin, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';
import { CollectionCard } from './CollectionCard';


interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
}

interface HighlightRow {
  id: string;
  type: string;
  entity_id: string;
  label: string;
  image_url: string;
  route: string;
}

interface CountryRow {
  id: string;
  name: string;
  photo: string;
}

interface BonusQuestion {
  id: string;
  question: string;
  bonus_points: number;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats]             = useState(getStats());
  const [highlights, setHighlights]   = useState<HighlightRow[]>([]);
  const [countries, setCountries]     = useState<CountryRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [bonusQuestions, setBonusQuestions] = useState<BonusQuestion[]>([]);
  const [dismissedBonus, setDismissedBonus] = useState(false);

  useEffect(() => {
    const h = () => setStats(getStats());
    window.addEventListener('statsUpdated', h);
    return () => window.removeEventListener('statsUpdated', h);
  }, []);

  // Check for unanswered bonus quiz questions
  useEffect(() => {
    if (!user) return;
    const checkBonus = async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quiz_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.quiz_completed) return; // user hasn't done the quiz yet

      const { data: bonusQs } = await supabase
        .from('quiz_questions')
        .select('id, question, bonus_points')
        .gt('bonus_points', 0)
        .eq('active', true);

      if (!bonusQs?.length) return;

      const { data: answered } = await supabase
        .from('quiz_bonus_answers')
        .select('question_id')
        .eq('user_id', user.id);

      const answeredIds = new Set((answered ?? []).map((a: any) => a.question_id));
      const pending = (bonusQs as BonusQuestion[]).filter(q => !answeredIds.has(q.id));
      setBonusQuestions(pending);
    };
    checkBonus();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: cols }, { data: hls }] = await Promise.all([
        supabase.from('regions').select('id, name, photo').eq('level', 'country').order('name').limit(4),
        supabase.from('collections').select('id, title, tagline, photo, content_type').order('title').limit(10),
        supabase.from('highlights').select('id, type, entity_id, label').eq('active', true).order('position').limit(6),
      ]);

      setCountries((cts as CountryRow[]) ?? []);
      setCollections((cols as CollectionRow[]) ?? []);

      // Resolve highlight labels and images
      const hlList = hls ?? [];
      const regionById: Record<string, { name: string; photo: string }> = {};
      for (const r of cts ?? []) regionById[r.id] = { name: r.name, photo: r.photo };

      const colIds = hlList.filter(h => h.type === 'collection').map(h => h.entity_id);
      const regIds = hlList.filter(h => h.type === 'region').map(h => h.entity_id);

      const [{ data: hlCols }, { data: hlRegs }] = await Promise.all([
        colIds.length ? supabase.from('collections').select('id, title, photo').in('id', colIds) : Promise.resolve({ data: [] }),
        regIds.length ? supabase.from('regions').select('id, name, photo').in('id', regIds) : Promise.resolve({ data: [] }),
      ]);

      const cById: Record<string, { name: string; photo: string }> = {};
      for (const c of hlCols ?? []) cById[c.id] = { name: c.title, photo: c.photo };
      for (const r of hlRegs ?? []) regionById[r.id] = { name: r.name, photo: r.photo };

      setHighlights(hlList.map(h => {
        let entity: { name: string; photo: string } | undefined;
        let route = '/explore';
        if (h.type === 'region') { entity = regionById[h.entity_id]; route = `/region/${h.entity_id}`; }
        else if (h.type === 'collection') { entity = cById[h.entity_id]; route = `/collection/${h.entity_id}`; }
        else if (h.type === 'winery') { route = `/explore`; }
        return { id: h.id, type: h.type, entity_id: h.entity_id, label: entity?.name || h.label || '', image_url: entity?.photo ?? '', route };
      }));

      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      {/* Mobile-only inner header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Wine Gallery
              </h1>
              <p className="text-sm text-gray-600">Colecione experiências no mundo do vinho</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-full">
                <span className="text-sm font-bold text-purple-700">{stats.completedCount} 🍷</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:px-8 lg:py-8 lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 lg:items-start">

        {/* ── Main column ─────────────────────────────────────── */}
        <div>
          {/* Welcome card — mobile only (desktop shows it in sidebar) */}
          <div className="lg:hidden bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                {user ? (
                  <>
                    <h2 className="text-xl font-bold mb-1">Bem-vindo de volta!</h2>
                    <p className="text-purple-100 text-sm">Continue sua jornada. Você já registrou {stats.completedCount} itens.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-1">Bem-vindo ao Wine Gallery!</h2>
                    <p className="text-purple-100 text-sm">Explore vinhos, experiências e vinícolas do mundo inteiro.</p>
                  </>
                )}
              </div>
            </div>
            {!user && (
              <Link to="/register" className="block mt-2 text-center bg-white/20 hover:bg-white/30 transition-colors text-white font-semibold py-3 rounded-xl">
                Criar conta gratuita →
              </Link>
            )}
          </div>

          {/* Bonus quiz notification */}
          {user && bonusQuestions.length > 0 && !dismissedBonus && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900 mb-0.5">
                    Nova pergunta do quiz disponível!
                  </p>
                  <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                    Responda e ganhe{' '}
                    <strong>{bonusQuestions.reduce((s, q) => s + q.bonus_points, 0)} pontos bônus</strong>{' '}
                    — {bonusQuestions.length === 1 ? '1 pergunta nova' : `${bonusQuestions.length} perguntas novas`} te espera{bonusQuestions.length === 1 ? '' : 'm'}.
                  </p>
                  <Link
                    to="/quiz-bonus"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    Responder agora <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <button
                  onClick={() => setDismissedBonus(true)}
                  className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 mt-0.5"
                  aria-label="Fechar"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Highlights */}
          {(loading || highlights.length > 0) && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Destaques</h2>
              </div>
              {loading ? (
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {[1, 2, 3].map(i => <div key={i} className="min-w-[148px] h-48 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />)}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible" style={{ scrollbarWidth: 'none' }}>
                  {highlights.map(h => (
                    <Link
                      key={h.id}
                      to={h.route}
                      className="min-w-[148px] lg:min-w-0 flex-shrink-0 lg:flex-shrink rounded-2xl overflow-hidden relative h-48 block group"
                    >
                      {h.image_url ? (
                        <img src={h.image_url} alt={h.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80'; }} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-semibold text-sm line-clamp-2">{h.label}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explore by country */}
          {countries.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Explore o Mundo</h2>
                </div>
                <Link to="/explore" className="text-sm text-purple-600 font-medium flex items-center gap-1">
                  Ver tudo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {countries.map(c => (
                  <Link key={c.id} to={`/region/${c.id}`} className="relative overflow-hidden rounded-2xl h-28 lg:h-36 block group">
                    <img src={c.photo} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-white font-semibold text-sm">{c.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Coleções</h2>
                </div>
                <Link to="/explore" className="text-sm text-purple-600 font-medium flex items-center gap-1">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
                {collections.slice(0, 4).map(col => (
                  <CollectionCard key={col.id} id={col.id} title={col.title} coverImage={col.photo} description={col.tagline ?? ''} contentType={col.content_type} />
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-64" />)}
            </div>
          )}
        </div>

        {/* ── Right sidebar (desktop only) ─────────────────────── */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          {/* Stats / Welcome card */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                {user ? (
                  <>
                    <h2 className="text-lg font-bold mb-1">Bem-vindo de volta!</h2>
                    <p className="text-purple-100 text-xs">Continue sua jornada no mundo do vinho.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold mb-1">Bem-vindo ao Wine Gallery!</h2>
                    <p className="text-purple-100 text-xs">Explore vinhos, experiências e vinícolas.</p>
                  </>
                )}
              </div>
            </div>
            {user ? (
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-purple-400/30">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.completedCount}</div>
                  <div className="text-[10px] text-purple-200">Completos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalPoints}</div>
                  <div className="text-[10px] text-purple-200">Pontos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.level}</div>
                  <div className="text-[10px] text-purple-200">Nível</div>
                </div>
              </div>
            ) : (
              <Link to="/register" className="block mt-4 text-center bg-white/20 hover:bg-white/30 transition-colors text-white font-semibold py-3 rounded-xl text-sm">
                Criar conta gratuita →
              </Link>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Navegar</h3>
            <div className="space-y-1">
              {[
                { to: '/explore',       label: 'Explorar coleções'  },
                { to: '/brotherhoods',  label: 'Confrarias'         },
                { to: '/achievements',  label: 'Conquistas'         },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors text-sm text-gray-700 hover:text-purple-700 no-underline">
                  {label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
