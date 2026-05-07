import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Wine, LogOut, ChevronRight, Plus, Loader2 } from 'lucide-react';
import {
  PROFILE_LABELS, PROFILE_ICONS, PROFILE_ARCHETYPES, PROFILE_TAGLINES,
  LEVEL_LABELS, LEVEL_POINTS, PROFILE_ORDER, getNextProfile,
  type WineProfile, type UserLevel,
} from '../../lib/profileConstants';

// ── Types ──────────────────────────────────────────────────────────────

interface UserProfileData {
  wine_profile:         WineProfile;
  user_level:           UserLevel;
  total_points:         number;
  next_profile_count:   number;
  profile_composition:  Record<WineProfile, number> | null;
  quiz_completed:       boolean;
  display_name:         string | null;
}

interface CellarEntry {
  id:            string;
  intent:        'drank' | 'cellar' | 'wishlist';
  added_at:      string;
  wine_id:       string | null;
  wine_name:     string | null;
  winery_name:   string | null;
  wine_type:     string | null;
  label_photo:   string | null;
  submission_id: string | null;
  wine?: {
    id:       string;
    name:     string;
    photo:    string | null;
    type:     string;
    wineries: { name: string } | null;
  } | null;
  submission?: {
    wine_name:    string;
    winery_name:  string | null;
    wine_type:    string | null;
    label_photo:  string | null;
    status:       string;
  } | null;
}

interface RecentActivity {
  id:          string;
  action_type: string;
  item_id:     string | null;
  points:      number;
  created_at:  string;
}

// ── Badge definitions (from Achievements) ─────────────────────────────

interface BadgeDef {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  total:       number;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_wine',    name: 'Primeiro Brinde',       description: 'Experimente seu primeiro vinho',           icon: '🍷', total: 1  },
  { id: 'explorer_3',   name: 'Explorador de Terroirs', description: 'Prove vinhos de 3 regiões diferentes',     icon: '🗺️', total: 3  },
  { id: 'collector_5',  name: 'Colecionador',           description: 'Complete 5 itens em qualquer coleção',     icon: '🏆', total: 5  },
  { id: 'adventurer_5', name: 'Aventureiro do Vinho',   description: 'Viva 5 experiências diferentes',           icon: '⛰️', total: 5  },
  { id: 'sommelier_10', name: 'Sommelier em Formação',  description: 'Prove 10 vinhos diferentes',               icon: '🥂', total: 10 },
  { id: 'explorer_5',   name: 'Grande Explorador',      description: 'Explore 5 regiões vinícolas',              icon: '🌍', total: 5  },
];

// ── Constants ──────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';

const ACTION_LABELS: Record<string, string> = {
  tried:            'Experimentou um item',
  favorite:         'Adicionou aos favoritos',
  review:           'Escreveu uma avaliação',
  photo:            'Adicionou uma foto',
  brotherhood_join: 'Entrou em uma confraria',
  follow:           'Seguiu um usuário',
};

const ACTION_ICONS: Record<string, string> = {
  tried:            '🍷',
  favorite:         '❤️',
  review:           '✍️',
  photo:            '📸',
  brotherhood_join: '🤝',
  follow:           '👤',
};

type TabKey = 'adega' | 'evolucao' | 'conquistas';
type AdegaSubTab = 'drank' | 'cellar' | 'wishlist';

// ── Helpers ────────────────────────────────────────────────────────────

function entryName(e: CellarEntry) {
  return e.wine?.name ?? e.wine_name ?? e.submission?.wine_name ?? '—';
}
function entryWinery(e: CellarEntry) {
  return e.wine?.wineries?.name ?? e.winery_name ?? e.submission?.winery_name ?? null;
}
function entryType(e: CellarEntry) {
  return e.wine?.type ?? e.wine_type ?? e.submission?.wine_type ?? null;
}
function entryPhoto(e: CellarEntry) {
  return e.wine?.photo ?? e.label_photo ?? e.submission?.label_photo ?? null;
}
function entryCurated(e: CellarEntry) {
  return !!e.wine_id;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (mins > 0)  return `${mins}min atrás`;
  return 'agora';
}

function getLevelProgress(pts: number, level: UserLevel): number {
  const { min, max } = LEVEL_POINTS[level];
  if (max === null) return 100;
  return Math.min(100, Math.round(((pts - min) / (max - min)) * 100));
}

function getPtsToNext(pts: number, level: UserLevel): number {
  const { max } = LEVEL_POINTS[level];
  return max === null ? 0 : Math.max(0, max + 1 - pts);
}

const NEXT_LEVEL: Record<UserLevel, UserLevel | null> = {
  recem_chegado: 'em_ascensao',
  em_ascensao:   'destaque',
  destaque:      'embaixador',
  embaixador:    null,
};

// ══════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════

export default function Minha() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('adega');
  const [adegaSubTab, setAdegaSubTab] = useState<AdegaSubTab>('drank');

  // Adega data
  const [entries, setEntries]     = useState<CellarEntry[]>([]);
  const [loadingAdega, setLoadingAdega] = useState(true);

  // Evolução data
  const [profileData, setProfileData]       = useState<UserProfileData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [triedCount, setTriedCount]         = useState(0);
  const [favCount, setFavCount]             = useState(0);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loadingEvolucao, setLoadingEvolucao]   = useState(true);

  // Conquistas data
  const [badgeProgress, setBadgeProgress]   = useState<number[]>(BADGE_DEFS.map(() => 0));
  const [loadingBadges, setLoadingBadges]   = useState(true);

  // ── Load adega ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoadingAdega(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from('user_cellar')
        .select(`
          id, intent, added_at,
          wine_id, wine_name, winery_name, wine_type, label_photo, submission_id,
          wine:wines(id, name, photo, type, wineries(name)),
          submission:wine_submissions(wine_name, winery_name, wine_type, label_photo, status)
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });
      setEntries((data ?? []) as unknown as CellarEntry[]);
      setLoadingAdega(false);
    };
    load();
  }, [user]);

  // ── Load evolução ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'evolucao' || !user) { if (!user) setLoadingEvolucao(false); return; }
    const load = async () => {
      setLoadingEvolucao(true);
      const [profileRes, activityRes, progressRes, colsRes] = await Promise.all([
        supabase.from('user_profiles')
          .select('wine_profile, user_level, total_points, next_profile_count, profile_composition, quiz_completed, display_name')
          .eq('user_id', user.id)
          .single(),
        supabase.from('user_points_log')
          .select('id, action_type, item_id, points, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('user_progress')
          .select('completed, is_favorite')
          .eq('user_id', user.id),
        supabase.from('user_collections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      if (profileRes.data)  setProfileData(profileRes.data as UserProfileData);
      if (activityRes.data) setRecentActivity(activityRes.data as RecentActivity[]);
      if (progressRes.data) {
        setTriedCount(progressRes.data.filter((p: any) => p.completed).length);
        setFavCount(progressRes.data.filter((p: any) => p.is_favorite).length);
      }
      setCollectionsCount(colsRes.count ?? 0);
      setLoadingEvolucao(false);
    };
    load();
  }, [activeTab, user]);

  // ── Load conquistas ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'conquistas' || !user) { if (!user) setLoadingBadges(false); return; }
    const load = async () => {
      setLoadingBadges(true);
      const { data: completedItems } = await supabase
        .from('user_progress')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('completed', true);
      const completed = completedItems?.length ?? 0;
      const progress = BADGE_DEFS.map(d => {
        if (d.id === 'first_wine' || d.id === 'sommelier_10' || d.id === 'collector_5') {
          return Math.min(completed, d.total);
        }
        return 0;
      });
      setBadgeProgress(progress);
      setLoadingBadges(false);
    };
    load();
  }, [activeTab, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // ── Derived values ────────────────────────────────────────────
  const totalPoints  = profileData?.total_points ?? 0;
  const currentLevel = (profileData?.user_level ?? 'recem_chegado') as UserLevel;
  const levelProgress = getLevelProgress(totalPoints, currentLevel);
  const ptsToNext     = getPtsToNext(totalPoints, currentLevel);
  const nextLevel     = NEXT_LEVEL[currentLevel];

  const currentProfile  = (profileData?.wine_profile ?? 'novato') as WineProfile;
  const nextProfile     = getNextProfile(currentProfile);
  const composition     = profileData?.profile_composition as Record<WineProfile, number> | null;
  const compTotal       = composition
    ? Object.values(composition).reduce((s, v) => s + (v as number), 0)
    : 0;

  const displayName = profileData?.display_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Apreciador';

  const tabEntries = entries.filter(e =>
    adegaSubTab === 'drank'    ? e.intent === 'drank'    :
    adegaSubTab === 'cellar'   ? e.intent === 'cellar'   :
    adegaSubTab === 'wishlist' ? e.intent === 'wishlist' :
    false,
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#E9E3D9' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🍷</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
            Minha área
          </h2>
          <p className="mb-6" style={{ color: '#7A6855' }}>Faça login para acessar sua adega, evolução e conquistas.</p>
          <Link to="/login" className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{ background: '#6B0035', textDecoration: 'none' }}>
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#E9E3D9' }}>

      {/* ── Fixed header with tabs ────────────────────────────────── */}
      <div className="sticky top-0 z-40"
           style={{ background: '#fff', borderBottom: '1px solid rgba(139,90,43,0.12)' }}>
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Logo */}
          <div className="pt-3 pb-1">
            <h1 className="text-base font-bold"
                style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#6B0035' }}>
              wine gallery
            </h1>
          </div>
          {/* Tabs */}
          <div className="flex gap-0">
            {(['adega', 'evolucao', 'conquistas'] as TabKey[]).map(tab => {
              const active = activeTab === tab;
              const label = tab === 'adega' ? '🍾 Adega' : tab === 'evolucao' ? '📈 Sua evolução' : '🏆 Conquistas';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative flex-1 py-2.5 text-xs font-semibold text-center transition-colors"
                  style={{ color: active ? '#6B0035' : '#B0A090' }}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                          style={{ background: '#6B0035' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════
            TAB 1 — ADEGA
            ════════════════════════════════════════════════════════ */}
        {activeTab === 'adega' && (
          <motion.div
            key="adega"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-4"
          >
            {/* Sub-tabs */}
            <div className="flex gap-1.5 mb-5">
              {([
                { key: 'drank',    label: '🍷 Bebidos'  },
                { key: 'cellar',   label: '🏠 Adega'    },
                { key: 'wishlist', label: '❤️ Wishlist' },
              ] as { key: AdegaSubTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setAdegaSubTab(t.key)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
                  style={{
                    background: adegaSubTab === t.key ? '#6B0035' : 'rgba(139,90,43,0.08)',
                    color:      adegaSubTab === t.key ? '#fff'    : '#7A6855',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: '#B0A090' }}>
                {tabEntries.length} {tabEntries.length === 1 ? 'vinho' : 'vinhos'}
              </p>
              <button
                onClick={() => navigate('/add-wine')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#6B0035' }}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {loadingAdega ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B0035' }} />
              </div>
            ) : tabEntries.length === 0 ? (
              <div className="text-center py-14 px-4">
                <div className="text-4xl mb-3">🍷</div>
                <p className="font-bold mb-1" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                  Nenhum vinho aqui ainda
                </p>
                <p className="text-sm mb-5" style={{ color: '#7A6855' }}>
                  Explore coleções e adicione seus vinhos!
                </p>
                <button onClick={() => navigate('/explore')}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
                        style={{ background: '#6B0035' }}>
                  Explorar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tabEntries.map((entry, i) => {
                  const name    = entryName(entry);
                  const winery  = entryWinery(entry);
                  const type    = entryType(entry);
                  const photo   = entryPhoto(entry);
                  const curated = entryCurated(entry);
                  const card = (
                    <div className="flex items-center gap-3 rounded-2xl p-3 transition-shadow"
                         style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.12)', boxShadow: '0 1px 4px rgba(28,18,9,0.05)' }}>
                      <div className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                           style={{ width: 56, height: 64, background: 'linear-gradient(135deg, #F8EBF1 0%, #FBF7F2 100%)' }}>
                        {photo ? (
                          <img src={photo} alt={name} className="w-full h-full object-contain p-1"
                               onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                        ) : (
                          <Wine className="w-5 h-5" style={{ color: '#9B1B4D' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#1C1209' }}>{name}</p>
                        {winery && <p className="text-xs truncate" style={{ color: '#7A6855' }}>{winery}</p>}
                        <div className="flex items-center gap-1.5 mt-1">
                          {type && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(107,0,53,0.08)', color: '#6B0035' }}>
                              {type}
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: '#B0A090' }}>
                            {new Date(entry.added_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      {curated && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#B0A090' }} />}
                    </div>
                  );
                  return (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                      {curated && entry.wine_id ? (
                        <Link to={`/wine/${entry.wine_id}`} className="block rounded-2xl" style={{ textDecoration: 'none' }}>
                          {card}
                        </Link>
                      ) : card}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2 — SUA EVOLUÇÃO
            ════════════════════════════════════════════════════════ */}
        {activeTab === 'evolucao' && (
          <motion.div
            key="evolucao"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-5 space-y-4"
          >
            {loadingEvolucao ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B0035' }} />
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div className="rounded-3xl p-5 text-white relative"
                     style={{ background: 'linear-gradient(135deg, #4A0024 0%, #6B0035 55%, #9B1B4D 100%)', boxShadow: '0 8px 24px rgba(107,0,53,0.30)' }}>
                  {/* Logout button */}
                  <button
                    onClick={handleSignOut}
                    className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
                  >
                    <LogOut className="w-3 h-3" /> Sair
                  </button>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                         style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      {PROFILE_ICONS[currentProfile]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        Olá, {displayName}!
                      </p>
                      <p className="text-lg font-bold leading-tight"
                         style={{ fontFamily: '"Fraunces", Georgia, serif' }}>
                        {PROFILE_LABELS[currentProfile]}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {PROFILE_ARCHETYPES[currentProfile]}
                      </p>
                    </div>
                  </div>

                  {/* Level card */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.18)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1"
                       style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {LEVEL_LABELS[currentLevel]}
                    </p>
                    <div className="flex items-end justify-between mb-3">
                      <p className="text-3xl font-bold leading-none">
                        {totalPoints}
                        <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.55)' }}>pts</span>
                      </p>
                      {nextLevel ? (
                        <div className="text-right">
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>Próximo</p>
                          <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.80)' }}>{LEVEL_LABELS[nextLevel]}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>{ptsToNext} pts restantes</p>
                        </div>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.15)' }}>
                          Nível máximo 🏆
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: '#D4A82A' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats quick */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { emoji: '🍷', label: 'Vinhos provados', value: triedCount    },
                    { emoji: '❤️', label: 'Favoritos',       value: favCount      },
                    { emoji: '📚', label: 'Coleções',        value: collectionsCount },
                  ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-3 text-center"
                         style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.10)' }}>
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <p className="text-lg font-bold" style={{ color: '#1C1209' }}>{s.value}</p>
                      <p className="text-[10px] leading-tight" style={{ color: '#B0A090' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Composition */}
                {composition && compTotal > 0 && (
                  <div className="rounded-2xl p-4"
                       style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.10)' }}>
                    <p className="text-sm font-bold mb-3" style={{ color: '#1C1209' }}>Sua composição</p>
                    <div className="space-y-2.5">
                      {PROFILE_ORDER.map(p => {
                        const votes = (composition[p] as number) ?? 0;
                        if (!votes) return null;
                        const pct = Math.round((votes / compTotal) * 100);
                        return (
                          <div key={p}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span>{PROFILE_ICONS[p]}</span>
                                <span className="text-xs font-medium" style={{ color: '#1C1209' }}>{PROFILE_LABELS[p]}</span>
                              </div>
                              <span className="text-xs" style={{ color: '#B0A090' }}>{votes} votos</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,90,43,0.10)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background: '#6B0035' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                {recentActivity.length > 0 && (
                  <div className="rounded-2xl p-4"
                       style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.10)' }}>
                    <p className="text-sm font-bold mb-3" style={{ color: '#1C1209' }}>Atividade recente</p>
                    <div className="space-y-3">
                      {recentActivity.map(a => (
                        <div key={a.id} className="flex items-center gap-3">
                          <span className="text-xl w-8 text-center flex-shrink-0">
                            {ACTION_ICONS[a.action_type] ?? '⭐'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#1C1209' }}>
                              {ACTION_LABELS[a.action_type] ?? a.action_type}
                            </p>
                            <p className="text-[10px]" style={{ color: '#B0A090' }}>
                              {formatRelative(a.created_at)}
                            </p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#D4A82A' }}>
                            +{a.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile tagline card */}
                {profileData?.quiz_completed && (
                  <div className="rounded-2xl p-4"
                       style={{ background: '#fff', border: '1px solid rgba(139,90,43,0.10)' }}>
                    <p className="text-xs italic" style={{ color: '#7A6855' }}>
                      "{PROFILE_TAGLINES[currentProfile]}"
                    </p>
                    {nextProfile && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(139,90,43,0.08)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#B0A090' }}>
                          Próximo perfil
                        </p>
                        <div className="flex items-center gap-2">
                          <span>{PROFILE_ICONS[nextProfile]}</span>
                          <span className="text-xs font-semibold" style={{ color: '#1C1209' }}>
                            {PROFILE_LABELS[nextProfile]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 3 — CONQUISTAS
            ════════════════════════════════════════════════════════ */}
        {activeTab === 'conquistas' && (
          <motion.div
            key="conquistas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-4 py-5"
          >
            {loadingBadges ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B0035' }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {BADGE_DEFS.map((badge, i) => {
                  const progress = badgeProgress[i] ?? 0;
                  const unlocked = progress >= badge.total;
                  const pct = Math.round((progress / badge.total) * 100);
                  return (
                    <div key={badge.id}
                         className="rounded-2xl p-4"
                         style={{
                           background: unlocked ? '#fff' : 'rgba(255,255,255,0.55)',
                           border:     unlocked ? '1.5px solid rgba(212,168,42,0.45)' : '1px solid rgba(139,90,43,0.10)',
                           opacity:    unlocked ? 1 : 0.75,
                           boxShadow:  unlocked ? '0 2px 8px rgba(212,168,42,0.15)' : 'none',
                         }}>
                      <div className="text-4xl mb-2 text-center">{badge.icon}</div>
                      <p className="text-xs font-bold text-center mb-0.5" style={{ color: '#1C1209' }}>{badge.name}</p>
                      <p className="text-[10px] text-center mb-2 leading-snug" style={{ color: '#7A6855' }}>
                        {badge.description}
                      </p>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,90,43,0.10)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: unlocked
                              ? 'linear-gradient(90deg, #D4A82A, #F0C849)'
                              : '#6B0035',
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-right mt-0.5" style={{ color: '#B0A090' }}>
                        {progress}/{badge.total}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
