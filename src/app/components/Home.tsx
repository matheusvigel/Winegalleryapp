import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight, Lock, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PROFILE_LABELS, PROFILE_ICONS, PROFILE_ARCHETYPES,
  LEVEL_LABELS, LEVEL_POINTS,
  type WineProfile, type UserLevel,
} from '../../lib/profileConstants';

// ── Types ──────────────────────────────────────────────────────────────

interface UserProfileData {
  wine_profile:   WineProfile;
  total_points:   number;
  user_level:     UserLevel;
  display_name:   string;
  quiz_completed: boolean;
}

interface HighlightRow {
  id:         string;
  type:       string;
  entity_id:  string;
  label:      string;
  image_url:  string;
  route:      string;
}

interface CollectionRow {
  id:           string;
  title:        string;
  tagline:      string | null;
  photo:        string;
  content_type: string;
  category:     string;
}

interface ProfileRule {
  category: string;
  priority: number;
  visible:  boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const HIGHLIGHT_TYPE: Record<string, { label: string; emoji: string; bg: string }> = {
  collection:  { label: 'Coleção',      emoji: '📚', bg: 'bg-amber-500'   },
  region:      { label: 'Região',       emoji: '📍', bg: 'bg-rose-500'    },
  winery:      { label: 'Vinícola',     emoji: '🏛️', bg: 'bg-emerald-500' },
  wine:        { label: 'Vinho',        emoji: '🍷', bg: 'bg-purple-600'  },
  place:       { label: 'Lugar',        emoji: '🍽️', bg: 'bg-sky-500'     },
  experience:  { label: 'Experiência',  emoji: '✨', bg: 'bg-orange-500'  },
};

const CATEGORY_PILL: Record<string, string> = {
  'Essencial':       'bg-purple-100 text-purple-700',
  'Fugir do óbvio':  'bg-rose-100 text-rose-700',
  'Ícones':          'bg-amber-100 text-amber-700',
};

const CONTENT_TYPE_PILL: Record<string, { emoji: string; pill: string }> = {
  Vinhos:        { emoji: '🍷', pill: 'bg-purple-50 text-purple-600'  },
  Experiências:  { emoji: '✨', pill: 'bg-orange-50 text-orange-600'  },
  Vinícolas:     { emoji: '🏛️', pill: 'bg-emerald-50 text-emerald-700'},
};

const NEXT_LEVEL: Record<UserLevel, UserLevel | null> = {
  recem_chegado: 'em_ascensao',
  em_ascensao:   'destaque',
  destaque:      'embaixador',
  embaixador:    null,
};

// ── Helpers ────────────────────────────────────────────────────────────

function getLevelProgress(pts: number, level: UserLevel) {
  const { min, max } = LEVEL_POINTS[level];
  if (max === null) return 100;
  return Math.min(100, Math.round(((pts - min) / (max - min)) * 100));
}

function getPtsToNext(pts: number, level: UserLevel) {
  const { max } = LEVEL_POINTS[level];
  return max === null ? 0 : max + 1 - pts;
}

// ══════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════

export default function Home() {
  const { user } = useAuth();

  const [profile, setProfile]                       = useState<UserProfileData | null>(null);
  const [highlights, setHighlights]                 = useState<HighlightRow[]>([]);
  const [collections, setCollections]               = useState<CollectionRow[]>([]);
  const [profileRules, setProfileRules]             = useState<ProfileRule[]>([]);
  const [collectionItemsMap, setCollectionItemsMap] = useState<Record<string, string[]>>({});
  const [completedIds, setCompletedIds]             = useState<Set<string>>(new Set());
  const [bonusCount, setBonusCount]                 = useState(0);
  const [dismissedBonus, setDismissedBonus]         = useState(false);
  const [loading, setLoading]                       = useState(true);

  // ── Load global data ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: hls }, { data: colItems }] = await Promise.all([
        supabase.from('collections').select('id, title, tagline, photo, content_type, category').order('title'),
        supabase.from('highlights').select('id, type, entity_id, label').eq('active', true).order('position').limit(8),
        supabase.from('collection_items').select('collection_id, item_id'),
      ]);

      setCollections((cols as CollectionRow[]) ?? []);

      // Build collection → item_ids map
      const map: Record<string, string[]> = {};
      for (const row of colItems ?? []) {
        if (!map[row.collection_id]) map[row.collection_id] = [];
        map[row.collection_id].push(row.item_id);
      }
      setCollectionItemsMap(map);

      // Resolve highlight photos/names
      const hlList = hls ?? [];
      const colIds = hlList.filter(h => h.type === 'collection').map(h => h.entity_id);
      const regIds = hlList.filter(h => h.type === 'region').map(h => h.entity_id);

      const [{ data: hlCols }, { data: hlRegs }] = await Promise.all([
        colIds.length ? supabase.from('collections').select('id, title, photo').in('id', colIds) : Promise.resolve({ data: [] }),
        regIds.length ? supabase.from('regions').select('id, name, photo').in('id', regIds)      : Promise.resolve({ data: [] }),
      ]);

      const cById: Record<string, { name: string; photo: string }> = {};
      const rById: Record<string, { name: string; photo: string }> = {};
      for (const c of hlCols ?? []) cById[c.id] = { name: c.title, photo: c.photo };
      for (const r of hlRegs ?? []) rById[r.id] = { name: r.name,  photo: r.photo };

      setHighlights(hlList.map(h => {
        let entity: { name: string; photo: string } | undefined;
        let route = '/explore';
        if (h.type === 'collection')  { entity = cById[h.entity_id]; route = `/collection/${h.entity_id}`; }
        if (h.type === 'region')      { entity = rById[h.entity_id]; route = `/region/${h.entity_id}`;     }
        if (h.type === 'winery')      { route = `/winery/${h.entity_id}`;  }
        if (h.type === 'wine')        { route = `/wine/${h.entity_id}`;    }
        if (h.type === 'place')       { route = `/place/${h.entity_id}`;   }
        return { id: h.id, type: h.type, entity_id: h.entity_id, label: entity?.name || h.label || '', image_url: entity?.photo ?? '', route };
      }));

      setLoading(false);
    };
    load();
  }, []);

  // ── Load user-specific data ───────────────────────────────────
  useEffect(() => {
    if (!user) { setProfile(null); setProfileRules([]); setCompletedIds(new Set()); return; }

    const loadUser = async () => {
      const [{ data: prof }, { data: progress }] = await Promise.all([
        supabase.from('user_profiles')
          .select('wine_profile, total_points, user_level, display_name, quiz_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('user_progress')
          .select('item_id, completed')
          .eq('user_id', user.id),
      ]);

      setProfile(prof as UserProfileData ?? null);
      setCompletedIds(new Set(
        (progress ?? []).filter((p: any) => p.completed).map((p: any) => p.item_id as string)
      ));

      if (prof?.wine_profile) {
        const { data: rules } = await supabase
          .from('profile_content_rules')
          .select('category, priority, visible')
          .eq('profile', prof.wine_profile);
        setProfileRules((rules as ProfileRule[]) ?? []);
      }

      // Check bonus questions
      if (prof?.quiz_completed) {
        const { data: bonusQs } = await supabase
          .from('quiz_questions')
          .select('id')
          .gt('bonus_points', 0)
          .eq('active', true);
        if (bonusQs?.length) {
          const { data: answered } = await supabase
            .from('quiz_bonus_answers')
            .select('question_id')
            .eq('user_id', user.id);
          const answeredIds = new Set((answered ?? []).map((a: any) => a.question_id));
          setBonusCount(bonusQs.filter(q => !answeredIds.has(q.id)).length);
        }
      }
    };
    loadUser();
  }, [user]);

  // ── Personalized collections ──────────────────────────────────
  const personalizedCollections = useMemo(() => {
    if (!profileRules.length) return collections;
    const ruleMap: Record<string, ProfileRule> = {};
    for (const r of profileRules) ruleMap[r.category] = r;
    const hidden = new Set(profileRules.filter(r => !r.visible).map(r => r.category));
    return [...collections]
      .filter(c => !hidden.has(c.category))
      .sort((a, b) => (ruleMap[a.category]?.priority ?? 99) - (ruleMap[b.category]?.priority ?? 99));
  }, [collections, profileRules]);

  // ── Collection progress ───────────────────────────────────────
  const getProgress = (colId: string) => {
    const items = collectionItemsMap[colId] ?? [];
    const done  = items.filter(id => completedIds.has(id)).length;
    return { total: items.length, done, pct: items.length > 0 ? Math.round((done / items.length) * 100) : 0 };
  };

  const levelProgress = profile ? getLevelProgress(profile.total_points, profile.user_level) : 0;
  const ptsToNext     = profile ? getPtsToNext(profile.total_points, profile.user_level) : 0;
  const nextLevel     = profile ? NEXT_LEVEL[profile.user_level] : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Wine Gallery
          </h1>
          {profile && (
            <Link to="/profile" className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 leading-none">{profile.total_points} pts</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{LEVEL_LABELS[profile.user_level]}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-lg border-2 border-purple-200">
                {PROFILE_ICONS[profile.wine_profile]}
              </div>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:px-8 lg:py-8 lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 lg:items-start">

        {/* ══ MAIN COLUMN ══════════════════════════════════════════ */}
        <div className="space-y-8">

          {/* ── 1. Profile Hero (mobile) ──────────────────────────── */}
          <div className="lg:hidden">
            <ProfileHero
              user={user}
              profile={profile}
              levelProgress={levelProgress}
              ptsToNext={ptsToNext}
              nextLevel={nextLevel}
              bonusCount={bonusCount}
              dismissedBonus={dismissedBonus}
              onDismissBonus={() => setDismissedBonus(true)}
            />
          </div>

          {/* ── 2. Destaques do Wine Gallery ──────────────────────── */}
          <section>
            <SectionHeader
              title="Destaques do Wine Gallery"
              subtitle="Seleção especial deste período"
              linkTo="/explore"
              linkLabel="Ver tudo"
            />
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1,2,3,4].map(i => (
                  <div key={i} className="min-w-[200px] h-56 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : highlights.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
                {highlights.map((h, i) => <HighlightCard key={h.id} h={h} index={i} />)}
              </div>
            ) : (
              <EmptyBox text="Nenhum destaque configurado ainda." />
            )}
          </section>

          {/* ── 3. Feito para você ────────────────────────────────── */}
          <section>
            <SectionHeader
              title={user && profile?.quiz_completed ? 'Feito para você' : 'Explorar coleções'}
              subtitle={
                user && profile?.quiz_completed
                  ? `Curado para o perfil ${PROFILE_LABELS[profile!.wine_profile]}`
                  : 'Descubra vinhos, experiências e muito mais'
              }
              linkTo="/explore"
              linkLabel="Ver todas"
            />
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : personalizedCollections.length > 0 ? (
              <div className="space-y-3">
                {personalizedCollections.slice(0, 6).map((col, i) => (
                  <CollectionCard key={col.id} col={col} index={i} progress={getProgress(col.id)} />
                ))}
              </div>
            ) : (
              <EmptyBox text="Nenhuma coleção disponível." />
            )}
          </section>

          {/* ── 4. Desafios — Em breve ────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Trophy className="w-5 h-5 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-300">Desafios</h2>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full tracking-wide uppercase">
                Em breve
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-white">
              {/* Frosted overlay */}
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center gap-3 p-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-600 font-bold text-center">Desafios chegando em breve</p>
                <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
                  Challenges semanais, conquistas exclusivas e rankings entre amigos.
                </p>
              </div>
              {/* Blurred preview cards */}
              <div className="p-4 space-y-3 pointer-events-none select-none" aria-hidden>
                {[
                  { emoji: '🍷', title: 'Do Novato ao Curioso',    pts: 50,  label: 'Iniciante'  },
                  { emoji: '🗺️', title: 'Explorador de Regiões',   pts: 100, label: 'Aventura'   },
                  { emoji: '⭐', title: 'Semana do Expert',         pts: 200, label: 'Avançado'   },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                      {d.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">{d.title}</p>
                      <p className="text-xs text-gray-400">{d.label}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">+{d.pts} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* ══ SIDEBAR (desktop only) ════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-24">

          {/* Profile card */}
          {user && profile ? (
            <DesktopProfileCard
              profile={profile}
              levelProgress={levelProgress}
              ptsToNext={ptsToNext}
              nextLevel={nextLevel}
            />
          ) : user ? (
            <GuestCard
              title="Descubra seu perfil"
              text="Responda o quiz e personalize sua experiência no Wine Gallery."
              cta="Fazer o quiz →"
              to="/onboarding"
            />
          ) : (
            <GuestCard
              title="Bem-vindo ao Wine Gallery!"
              text="Explore vinhos, experiências e vinícolas do mundo inteiro."
              cta="Criar conta gratuita →"
              to="/register"
            />
          )}

          {/* Bonus notification (desktop) */}
          {user && bonusCount > 0 && !dismissedBonus && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">🎁</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Nova pergunta bônus!</p>
                  <p className="text-xs text-amber-700 mt-0.5 mb-3">
                    {bonusCount} pergunta{bonusCount > 1 ? 's' : ''} disponíve{bonusCount > 1 ? 'is' : 'l'} — ganhe pontos extras.
                  </p>
                  <Link
                    to="/quiz-bonus"
                    className="block text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Responder e ganhar pontos
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Navegar</h3>
            <div className="space-y-0.5">
              {[
                { to: '/explore',      label: 'Explorar coleções' },
                { to: '/brotherhoods', label: 'Confrarias'        },
                { to: '/achievements', label: 'Conquistas'        },
                { to: '/search',       label: 'Busca avançada'    },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors text-sm text-gray-600 hover:text-purple-700"
                >
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

// ══════════════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════════════

// ── Section header ─────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, linkTo, linkLabel }: {
  title: string; subtitle?: string; linkTo: string; linkLabel: string;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <Link to={linkTo} className="text-sm text-purple-600 font-medium flex items-center gap-0.5 hover:underline shrink-0 mt-1">
        {linkLabel} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ── Empty box ──────────────────────────────────────────────────────────
function EmptyBox({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
      {text}
    </div>
  );
}

// ── Highlight card ─────────────────────────────────────────────────────
function HighlightCard({ h, index }: { h: HighlightRow; index: number }) {
  const t = HIGHLIGHT_TYPE[h.type] ?? { label: h.type, emoji: '✨', bg: 'bg-purple-500' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="min-w-[200px] lg:min-w-0 flex-shrink-0 lg:flex-shrink"
    >
      <Link to={h.route} className="block group relative rounded-2xl overflow-hidden h-56 shadow-sm hover:shadow-lg transition-shadow">
        {h.image_url ? (
          <img
            src={h.image_url}
            alt={h.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${t.bg}`}>
            {t.emoji} {t.label}
          </span>
        </div>
        {/* Title */}
        <p className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm leading-snug line-clamp-2">
          {h.label}
        </p>
      </Link>
    </motion.div>
  );
}

// ── Personalized collection card ───────────────────────────────────────
function CollectionCard({ col, index, progress }: {
  col: CollectionRow;
  index: number;
  progress: { total: number; done: number; pct: number };
}) {
  const catPill  = CATEGORY_PILL[col.category]         ?? 'bg-gray-100 text-gray-600';
  const typeConf = CONTENT_TYPE_PILL[col.content_type] ?? { emoji: '📚', pill: 'bg-gray-50 text-gray-500' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
    >
      <Link
        to={`/collection/${col.id}`}
        className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {col.photo ? (
            <img
              src={col.photo}
              alt={col.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
              {typeConf.emoji}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catPill}`}>
                {col.category}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeConf.pill}`}>
                {typeConf.emoji} {col.content_type}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{col.title}</p>
            {col.tagline && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{col.tagline}</p>
            )}
          </div>

          {/* Progress bar */}
          {progress.total > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">
                  {progress.done} de {progress.total} itens
                </span>
                <span className="text-[10px] font-bold text-purple-600">{progress.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── Profile hero (mobile) ──────────────────────────────────────────────
function ProfileHero({ user, profile, levelProgress, ptsToNext, nextLevel, bonusCount, dismissedBonus, onDismissBonus }: {
  user: any;
  profile: UserProfileData | null;
  levelProgress: number;
  ptsToNext: number;
  nextLevel: UserLevel | null;
  bonusCount: number;
  dismissedBonus: boolean;
  onDismissBonus: () => void;
}) {
  if (!user) {
    return (
      <GuestCard
        title="Bem-vindo ao Wine Gallery!"
        text="Explore vinhos, experiências e vinícolas do mundo inteiro."
        cta="Criar conta gratuita →"
        to="/register"
      />
    );
  }

  if (!profile?.quiz_completed) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <p className="text-xl font-bold mb-1">🍷 Qual é o seu perfil?</p>
        <p className="text-purple-100 text-sm mb-1">Descubra e personalize sua experiência no Wine Gallery.</p>
        <p className="text-purple-200 text-xs mb-4">Complete o quiz e ganhe pontos de boas-vindas!</p>
        <Link to="/onboarding" className="block text-center bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl transition-colors">
          Fazer o quiz agora →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 rounded-3xl p-5 text-white shadow-xl">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl flex-shrink-0">
            {PROFILE_ICONS[profile.wine_profile]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-200 font-medium">
              Olá, {profile.display_name || 'Apreciador'}!
            </p>
            <p className="text-lg font-bold leading-tight">{PROFILE_LABELS[profile.wine_profile]}</p>
            <p className="text-xs text-purple-300">{PROFILE_ARCHETYPES[profile.wine_profile]}</p>
          </div>
          <Link
            to="/profile"
            className="shrink-0 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Points + level + progress */}
        <div className="bg-black/15 rounded-2xl p-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold mb-0.5">
                {LEVEL_LABELS[profile.user_level]}
              </p>
              <p className="text-3xl font-bold leading-none">
                {profile.total_points}
                <span className="text-sm font-normal text-purple-300 ml-1">pts</span>
              </p>
            </div>
            {nextLevel && (
              <div className="text-right">
                <p className="text-[10px] text-purple-400">Próximo nível</p>
                <p className="text-xs font-bold text-purple-200">{LEVEL_LABELS[nextLevel]}</p>
                <p className="text-[10px] text-purple-400">{ptsToNext} pts restantes</p>
              </div>
            )}
            {!nextLevel && (
              <span className="text-xs font-bold bg-white/15 px-2 py-1 rounded-lg">
                Nível máximo 🏆
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-purple-400">
              {LEVEL_POINTS[profile.user_level].min} pts
            </span>
            {nextLevel && (
              <span className="text-[9px] text-purple-400">
                {LEVEL_POINTS[profile.user_level].max} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bonus notification */}
      {bonusCount > 0 && !dismissedBonus && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">Nova pergunta bônus!</p>
            <p className="text-xs text-amber-700 mb-2.5">
              {bonusCount} pergunta{bonusCount > 1 ? 's' : ''} disponíve{bonusCount > 1 ? 'is' : 'l'} — ganhe pontos extras.
            </p>
            <Link
              to="/quiz-bonus"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Responder agora <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <button
            onClick={onDismissBonus}
            className="text-amber-300 hover:text-amber-500 transition-colors shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Desktop profile card (sidebar) ────────────────────────────────────
function DesktopProfileCard({ profile, levelProgress, ptsToNext, nextLevel }: {
  profile: UserProfileData;
  levelProgress: number;
  ptsToNext: number;
  nextLevel: UserLevel | null;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">
          {PROFILE_ICONS[profile.wine_profile]}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-purple-300 font-medium truncate">
            {profile.display_name || 'Apreciador'}
          </p>
          <p className="text-sm font-bold leading-tight">{PROFILE_LABELS[profile.wine_profile]}</p>
          <p className="text-[10px] text-purple-300">{PROFILE_ARCHETYPES[profile.wine_profile]}</p>
        </div>
      </div>

      {/* Points + progress */}
      <div className="bg-black/15 rounded-xl p-3 mb-3">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold">
              {LEVEL_LABELS[profile.user_level]}
            </p>
            <p className="text-xl font-bold">
              {profile.total_points}
              <span className="text-xs font-normal text-purple-300 ml-1">pts</span>
            </p>
          </div>
          {nextLevel && (
            <p className="text-[10px] text-purple-400 text-right leading-tight">
              {ptsToNext} pts<br />
              <span className="text-purple-300 font-semibold">{LEVEL_LABELS[nextLevel]}</span>
            </p>
          )}
        </div>
        <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      <Link
        to="/profile"
        className="block text-center bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
      >
        Ver perfil completo
      </Link>
    </div>
  );
}

// ── Guest / unauthenticated card ──────────────────────────────────────
function GuestCard({ title, text, cta, to }: {
  title: string; text: string; cta: string; to: string;
}) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
      <p className="text-xl font-bold mb-1">{title}</p>
      <p className="text-purple-100 text-sm mb-4">{text}</p>
      <Link to={to} className="block text-center bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl transition-colors text-sm">
        {cta}
      </Link>
    </div>
  );
}
