import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PROFILE_LABELS, PROFILE_ICONS, PROFILE_ARCHETYPES,
  LEVEL_LABELS, LEVEL_POINTS,
  type WineProfile, type UserLevel,
} from '../../lib/profileConstants';
import { CollectionCard } from '../components/CollectionCard';

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
  country:      { name: string } | null;
  region:       { name: string } | null;
  sub_region:   { name: string } | null;
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

const NEXT_LEVEL: Record<UserLevel, UserLevel | null> = {
  recem_chegado: 'em_ascensao',
  em_ascensao:   'destaque',
  destaque:      'embaixador',
  embaixador:    null,
};

// ── Helpers ────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

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
  const [previewPhotosMap, setPreviewPhotosMap]     = useState<Record<string, string[]>>({});
  const [completedIds, setCompletedIds]             = useState<Set<string>>(new Set());
  const [bonusCount, setBonusCount]                 = useState(0);
  const [dismissedBonus, setDismissedBonus]         = useState(false);
  const [loading, setLoading]                       = useState(true);
  const [visibleCount, setVisibleCount]             = useState(6);
  const [countries, setCountries]                   = useState<{ id: string; name: string; photo: string | null }[]>([]);
  const [regions, setRegions]                       = useState<{ id: string; name: string; photo: string | null; parent?: { name: string } | null }[]>([]);
  const [triedCount, setTriedCount]                 = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Load global data ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: hls }, { data: colItems }, { data: ctrs }, { data: regs }] = await Promise.all([
        supabase
          .from('collections')
          .select('id, title, tagline, photo, content_type, category, country:country_id(name), region:region_id(name), sub_region:sub_region_id(name)')
          .order('title'),
        supabase.from('highlights').select('id, type, entity_id, label').eq('active', true).order('position').limit(8),
        supabase.from('collection_items').select('collection_id, item_id, item_type, position').order('collection_id').order('position').limit(1000),
        supabase.from('regions').select('id, name, photo').eq('level', 'country').order('name').limit(20),
        supabase.from('regions').select('id, name, photo, parent:parent_id(name)').eq('level', 'region').order('name').limit(20),
      ]);
      setCountries((ctrs as any[]) ?? []);
      setRegions((regs as any[]) ?? []);

      setCollections((cols as CollectionRow[]) ?? []);

      // Build collection → item_ids map (for progress tracking)
      const map: Record<string, string[]> = {};
      for (const row of (colItems ?? []) as any[]) {
        if (!map[row.collection_id]) map[row.collection_id] = [];
        map[row.collection_id].push(row.item_id);
      }
      setCollectionItemsMap(map);

      // Build preview photos map: collection → first 5 item photos
      const previewPerCol: Record<string, { item_id: string; item_type: string }[]> = {};
      for (const row of (colItems ?? []) as any[]) {
        if (!previewPerCol[row.collection_id]) previewPerCol[row.collection_id] = [];
        if (previewPerCol[row.collection_id].length < 5) {
          previewPerCol[row.collection_id].push({ item_id: row.item_id, item_type: row.item_type });
        }
      }
      const previewItems = Object.values(previewPerCol).flat();
      const pvWineIds   = previewItems.filter(r => r.item_type === 'wine').map(r => r.item_id);
      const pvExpIds    = previewItems.filter(r => r.item_type === 'experience').map(r => r.item_id);
      const pvWineryIds = previewItems.filter(r => r.item_type === 'winery').map(r => r.item_id);
      const [pvWines, pvExps, pvWineries] = await Promise.all([
        pvWineIds.length   ? supabase.from('wines').select('id, photo').in('id', pvWineIds)         : Promise.resolve({ data: [] }),
        pvExpIds.length    ? supabase.from('experiences').select('id, photo').in('id', pvExpIds)    : Promise.resolve({ data: [] }),
        pvWineryIds.length ? supabase.from('wineries').select('id, photo').in('id', pvWineryIds)    : Promise.resolve({ data: [] }),
      ]);
      const photoById: Record<string, string> = {};
      for (const r of [...(pvWines.data ?? []), ...(pvExps.data ?? []), ...(pvWineries.data ?? [])] as any[]) {
        if (r.photo) photoById[r.id] = r.photo;
      }
      const newPreviewMap: Record<string, string[]> = {};
      for (const [colId, items] of Object.entries(previewPerCol)) {
        const photos = items.map(r => photoById[r.item_id]).filter(Boolean);
        if (photos.length > 0) newPreviewMap[colId] = photos;
      }
      setPreviewPhotosMap(newPreviewMap);

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
      const completed = (progress ?? []).filter((p: any) => p.completed);
      setCompletedIds(new Set(completed.map((p: any) => p.item_id as string)));
      setTriedCount(completed.length);

      if (prof?.wine_profile) {
        const { data: rules } = await supabase
          .from('profile_content_rules')
          .select('category, priority, visible')
          .eq('profile', prof.wine_profile);
        setProfileRules((rules as ProfileRule[]) ?? []);
      }

      // Check bonus questions (parallel fetch)
      if (prof?.quiz_completed) {
        const [{ data: bonusQs }, { data: answered }] = await Promise.all([
          supabase.from('quiz_questions').select('id').gt('bonus_points', 0).eq('active', true),
          supabase.from('quiz_bonus_answers').select('question_id').eq('user_id', user.id),
        ]);
        if (bonusQs?.length) {
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

  // Reset visible count when personalizedCollections changes (profile change)
  useEffect(() => {
    setVisibleCount(6);
  }, [personalizedCollections]);

  // ── Infinite scroll via IntersectionObserver ──────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 6, personalizedCollections.length));
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [personalizedCollections.length]);

  // ── Collection progress ───────────────────────────────────────
  const getProgress = (colId: string) => {
    const items = collectionItemsMap[colId] ?? [];
    const done  = items.filter(id => completedIds.has(id)).length;
    return { total: items.length, done, pct: items.length > 0 ? Math.round((done / items.length) * 100) : 0 };
  };

  const levelProgress = profile ? getLevelProgress(profile.total_points, profile.user_level) : 0;
  const ptsToNext     = profile ? getPtsToNext(profile.total_points, profile.user_level) : 0;
  const nextLevel     = profile ? NEXT_LEVEL[profile.user_level] : null;

  const hasMore = visibleCount < personalizedCollections.length;

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-screen-xl mx-auto px-4 py-4 lg:px-8 lg:py-8 lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 lg:items-start">

        {/* ══ MAIN COLUMN ══════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── 1. Compact profile strip ─────────────────────────── */}
          {user && profile && profile.quiz_completed ? (
            <Link to="/minha" style={{ textDecoration: 'none' }}>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                   style={{ background: 'linear-gradient(135deg, #4A0024 0%, #6B0035 100%)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                     style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {PROFILE_ICONS[profile.wine_profile]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {getGreeting()}, {profile.display_name || 'Apreciador'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                      {LEVEL_LABELS[profile.user_level]}
                    </span>
                    <span className="text-xs font-bold text-white">{profile.total_points} pts</span>
                    {triedCount > 0 && (
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        · {triedCount} {triedCount === 1 ? 'item provado' : 'itens provados'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 w-14">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className="h-full rounded-full" style={{ width: `${levelProgress}%`, background: '#D4A82A' }} />
                  </div>
                  <p className="text-[9px] mt-0.5 text-right" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {levelProgress}%
                  </p>
                </div>
              </div>
            </Link>
          ) : user && !profile?.quiz_completed ? (
            <Link to="/onboarding" style={{ textDecoration: 'none' }}>
              <div className="rounded-2xl px-4 py-3 text-white"
                   style={{ background: 'linear-gradient(135deg, #6B0035 0%, #9B1B4D 100%)' }}>
                <p className="text-sm font-bold">🍷 Qual é o seu perfil de vinho?</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.70)' }}>Faça o quiz e personalize sua experiência →</p>
              </div>
            </Link>
          ) : null}

          {/* ── 2. Continue sua jornada (desafios placeholder) ────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: '#D4A82A' }} />
                <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                  Continue sua jornada
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#FBF3DC', color: '#B8820B' }}>Em breve</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { label: 'COLEÇÃO', title: 'Provar 10 Pinots',     sub: '★ 7 de 10',     color: '#6B0035' },
                { label: 'QUIZ',    title: 'Identifique a uva',    sub: '★ +80 XP',      color: '#4A0060' },
                { label: 'MAPA',    title: 'Explore nova região',  sub: '★ Nova região', color: '#1C3028' },
              ].map((c, i) => (
                <div key={i} className="flex-shrink-0 rounded-2xl p-3 text-white"
                     style={{ width: 140, background: c.color, opacity: 0.85 }}>
                  <span className="text-[9px] font-bold tracking-widest opacity-70">{c.label}</span>
                  <p className="text-sm font-bold leading-snug mt-1"
                     style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{c.title}</p>
                  <p className="text-[10px] mt-2 opacity-70">{c.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 3. Por País ───────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                🌍 Por País
              </h2>
              <Link to="/regions" className="text-xs font-semibold flex items-center gap-0.5 no-underline"
                    style={{ color: '#6B0035' }}>
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse"
                       style={{ width: 80, height: 80, background: '#D5CFC5' }} />
                ))}
              </div>
            ) : countries.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {countries.map(c => (
                  <Link key={c.id} to={`/country/${c.id}`}
                        className="flex-shrink-0 relative rounded-2xl overflow-hidden no-underline"
                        style={{ width: 80, height: 80 }}>
                    {c.photo
                      ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover"
                             onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                      : <div className="w-full h-full" style={{ background: '#6B0035' }} />
                    }
                    <div className="absolute inset-0"
                         style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.08) 60%)' }} />
                    <p className="absolute bottom-1.5 left-1 right-1 text-white font-semibold text-[9px] text-center leading-tight line-clamp-2">
                      {c.name}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          {/* ── 4. Por Região ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                📍 Explorar por Região
              </h2>
              <Link to="/regions" className="text-xs font-semibold flex items-center gap-0.5 no-underline"
                    style={{ color: '#6B0035' }}>
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse"
                       style={{ width: 120, height: 90, background: '#D5CFC5' }} />
                ))}
              </div>
            ) : regions.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {regions.map(r => (
                  <Link key={r.id} to={`/region/${r.id}`}
                        className="flex-shrink-0 relative rounded-2xl overflow-hidden no-underline"
                        style={{ width: 120, height: 90 }}>
                    {r.photo
                      ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover"
                             onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                      : <div className="w-full h-full" style={{ background: '#4A0024' }} />
                    }
                    <div className="absolute inset-0"
                         style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.10) 60%)' }} />
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className="text-white font-semibold text-[10px] leading-tight line-clamp-1">{r.name}</p>
                      {(r.parent as any)?.name && (
                        <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.60)' }}>
                          {(r.parent as any).name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          {/* ── 5. Feito para você — coleções ─────────────────────── */}
          <section>
            <SectionHeader
              title={user && profile?.quiz_completed ? 'Feito para você' : 'Coleções'}
              subtitle={
                user && profile?.quiz_completed
                  ? `Curado para o perfil ${PROFILE_LABELS[profile!.wine_profile]}`
                  : 'Descubra vinhos, experiências e muito mais'
              }
              linkTo="/for-you"
              linkLabel="Ver todas"
            />
            {loading ? (
              <>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:hidden">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex-shrink-0 rounded-[18px] animate-pulse"
                         style={{ width: 200, height: 300, background: '#EDE4D6' }} />
                  ))}
                </div>
                <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-[18px] animate-pulse" style={{ height: 300, background: '#EDE4D6' }} />
                  ))}
                </div>
              </>
            ) : personalizedCollections.length > 0 ? (
              <>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide lg:hidden">
                  {personalizedCollections.map((col) => {
                    const prog = getProgress(col.id);
                    return (
                      <div key={col.id} className="flex-shrink-0" style={{ width: 200 }}>
                        <CollectionCard
                          id={col.id} title={col.title} coverImage={col.photo}
                          description={col.tagline ?? ''} contentType={col.content_type}
                          category={col.category} country={(col.country as any)?.name}
                          region={(col.region as any)?.name} subRegion={(col.sub_region as any)?.name}
                          progress={prog.pct} totalItems={prog.total} completedItems={prog.done}
                          previewPhotos={previewPhotosMap[col.id]} variant="portrait"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
                  {personalizedCollections.map((col) => {
                    const prog = getProgress(col.id);
                    return (
                      <CollectionCard
                        key={col.id} id={col.id} title={col.title} coverImage={col.photo}
                        description={col.tagline ?? ''} contentType={col.content_type}
                        category={col.category} country={(col.country as any)?.name}
                        region={(col.region as any)?.name} subRegion={(col.sub_region as any)?.name}
                        progress={prog.pct} totalItems={prog.total} completedItems={prog.done}
                        previewPhotos={previewPhotosMap[col.id]} variant="portrait"
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyBox text="Nenhuma coleção disponível." />
            )}
          </section>

          {/* ── 6. Destaques ──────────────────────────────────────── */}
          {highlights.length > 0 && (
            <section>
              <SectionHeader
                title="Destaques"
                subtitle="Seleção especial deste período"
                linkTo="/explore"
                linkLabel="Ver tudo"
              />
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
                {highlights.map((h, i) => <HighlightCard key={h.id} h={h} index={i} />)}
              </div>
            </section>
          )}

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
            <div className="rounded-2xl p-4"
                 style={{ background: '#FBF3DC', border: '1px solid rgba(184,130,11,0.25)' }}>
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">🎁</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#3E2705' }}>Nova pergunta bônus!</p>
                  <p className="text-xs mt-0.5 mb-3" style={{ color: '#7A4F07' }}>
                    {bonusCount} pergunta{bonusCount > 1 ? 's' : ''} disponíve{bonusCount > 1 ? 'is' : 'l'} — ganhe pontos extras.
                  </p>
                  <Link to="/quiz-bonus"
                        className="block text-center text-white text-xs font-bold py-2 rounded-xl transition-colors"
                        style={{ background: '#B8820B' }}>
                    Responder e ganhar pontos
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="bg-white rounded-2xl p-5"
               style={{ border: '1px solid rgba(139,90,43,0.12)', boxShadow: '0 1px 4px rgba(28,18,9,0.06)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1C1209' }}>Navegar</h3>
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
                  className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors text-sm"
                  style={{ color: '#7A6855' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F8EBF1';
                    e.currentTarget.style.color = '#6B0035';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#7A6855';
                  }}
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
        <h2 className="text-xl section-title">{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#B0A090' }}>{subtitle}</p>}
      </div>
      <Link
        to={linkTo}
        className="text-sm font-semibold flex items-center gap-0.5 shrink-0 mt-1 transition-colors hover:underline"
        style={{ color: '#6B0035' }}
      >
        {linkLabel} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ── Empty box ──────────────────────────────────────────────────────────
function EmptyBox({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-sm rounded-2xl bg-white"
         style={{ color: '#B0A090', border: '1px solid rgba(139,90,43,0.10)' }}>
      {text}
    </div>
  );
}

// ── Highlight card ─────────────────────────────────────────────────────
const HIGHLIGHT_BG: Record<string, string> = {
  collection: '#B8820B',
  region:     '#9B1B4D',
  winery:     '#2D4A3E',
  wine:       '#6B0035',
  place:      '#1C3028',
  experience: '#7A4F07',
};

function HighlightCard({ h, index }: { h: HighlightRow; index: number }) {
  const t  = HIGHLIGHT_TYPE[h.type] ?? { label: h.type, emoji: '✨', bg: 'bg-wine-700' };
  const bg = HIGHLIGHT_BG[h.type] ?? '#6B0035';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="min-w-[200px] lg:min-w-0 flex-shrink-0 lg:flex-shrink"
    >
      <Link to={h.route}
            className="block group relative rounded-2xl overflow-hidden h-56 transition-shadow hover:shadow-lg"
            style={{ boxShadow: '0 2px 8px rgba(28,18,9,0.10)' }}>
        {h.image_url ? (
          <img
            src={h.image_url}
            alt={h.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
        ) : (
          <div className="w-full h-full"
               style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}CC 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: bg, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
            {t.emoji} {t.label}
          </span>
        </div>
        {/* Title */}
        <p className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm leading-snug line-clamp-2"
           style={{ fontFamily: '"Fraunces", Georgia, serif' }}>
          {h.label}
        </p>
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
      <div className="rounded-3xl p-6 text-white"
           style={{ background: 'linear-gradient(135deg, #6B0035 0%, #9B1B4D 100%)', boxShadow: '0 8px 24px rgba(107,0,53,0.30)' }}>
        <p className="text-xl font-bold mb-1"
           style={{ fontFamily: '"Fraunces", Georgia, serif' }}>🍷 Qual é o seu perfil?</p>
        <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.80)' }}>Descubra e personalize sua experiência no Wine Gallery.</p>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>Complete o quiz e ganhe pontos de boas-vindas!</p>
        <Link to="/onboarding"
              className="block text-center text-white font-bold py-3 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.18)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}>
          Fazer o quiz agora →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <div className="rounded-3xl p-5 text-white"
           style={{ background: 'linear-gradient(135deg, #4A0024 0%, #6B0035 55%, #9B1B4D 100%)', boxShadow: '0 8px 24px rgba(107,0,53,0.30)' }}>
        {/* Top row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
            {PROFILE_ICONS[profile.wine_profile]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Olá, {profile.display_name || 'Apreciador'}!
            </p>
            <p className="text-lg font-bold leading-tight"
               style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{PROFILE_LABELS[profile.wine_profile]}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{PROFILE_ARCHETYPES[profile.wine_profile]}</p>
          </div>
          <Link to="/profile"
                className="shrink-0 p-2 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.10)' }}>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Points + level + progress */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.18)' }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5"
                 style={{ color: 'rgba(255,255,255,0.55)' }}>
                {LEVEL_LABELS[profile.user_level]}
              </p>
              <p className="text-3xl font-bold leading-none">
                {profile.total_points}
                <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.55)' }}>pts</span>
              </p>
            </div>
            {nextLevel ? (
              <div className="text-right">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>Próximo nível</p>
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

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: '#D4A82A' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {LEVEL_POINTS[profile.user_level].min} pts
            </span>
            {nextLevel && (
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {LEVEL_POINTS[profile.user_level].max} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bonus notification */}
      {bonusCount > 0 && !dismissedBonus && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
             style={{ background: '#FBF3DC', border: '1px solid rgba(184,130,11,0.25)' }}>
          <span className="text-xl shrink-0 mt-0.5">🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#3E2705' }}>Nova pergunta bônus!</p>
            <p className="text-xs mb-2.5" style={{ color: '#7A4F07' }}>
              {bonusCount} pergunta{bonusCount > 1 ? 's' : ''} disponíve{bonusCount > 1 ? 'is' : 'l'} — ganhe pontos extras.
            </p>
            <Link to="/quiz-bonus"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-xl transition-colors"
                  style={{ background: '#B8820B' }}>
              Responder agora <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <button onClick={onDismissBonus}
                  className="shrink-0 mt-0.5 transition-colors"
                  style={{ color: '#C8B9A8' }}
                  aria-label="Fechar">
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
    <div className="rounded-2xl p-5 text-white"
         style={{ background: 'linear-gradient(135deg, #4A0024 0%, #6B0035 55%, #9B1B4D 100%)', boxShadow: '0 8px 24px rgba(107,0,53,0.30)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
             style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
          {PROFILE_ICONS[profile.wine_profile]}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {profile.display_name || 'Apreciador'}
          </p>
          <p className="text-sm font-bold leading-tight"
             style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{PROFILE_LABELS[profile.wine_profile]}</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{PROFILE_ARCHETYPES[profile.wine_profile]}</p>
        </div>
      </div>

      {/* Points + progress */}
      <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {LEVEL_LABELS[profile.user_level]}
            </p>
            <p className="text-xl font-bold">
              {profile.total_points}
              <span className="text-xs font-normal ml-1" style={{ color: 'rgba(255,255,255,0.55)' }}>pts</span>
            </p>
          </div>
          {nextLevel && (
            <p className="text-[10px] text-right leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {ptsToNext} pts<br />
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>{LEVEL_LABELS[nextLevel]}</span>
            </p>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: '#D4A82A' }}
          />
        </div>
      </div>

      <Link to="/profile"
            className="block text-center text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.10)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.20)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}>
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
    <div className="rounded-3xl p-6 text-white"
         style={{ background: 'linear-gradient(135deg, #6B0035 0%, #9B1B4D 100%)', boxShadow: '0 8px 24px rgba(107,0,53,0.28)' }}>
      <p className="text-xl font-bold mb-1"
         style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.80)' }}>{text}</p>
      <Link to={to}
            className="block text-center text-white font-bold py-3 rounded-xl transition-colors text-sm"
            style={{ background: 'rgba(255,255,255,0.18)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}>
        {cta}
      </Link>
    </div>
  );
}
