import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CollectionCard } from '../components/CollectionCard';
import {
  PROFILE_LABELS, PROFILE_ICONS,
  type WineProfile,
} from '../../lib/profileConstants';

// ── Types ──────────────────────────────────────────────────────────────

interface UserProfileData {
  wine_profile:   WineProfile;
  total_points:   number;
  user_level:     string;
  display_name:   string;
  quiz_completed: boolean;
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

interface RegionRow {
  id:     string;
  name:   string;
  photo:  string | null;
  parent?: { name: string } | null;
}

// ── Constants ──────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

// ══════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════

export default function ForYou() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]                       = useState<UserProfileData | null>(null);
  const [collections, setCollections]               = useState<CollectionRow[]>([]);
  const [profileRules, setProfileRules]             = useState<ProfileRule[]>([]);
  const [collectionItemsMap, setCollectionItemsMap] = useState<Record<string, string[]>>({});
  const [previewPhotosMap, setPreviewPhotosMap]     = useState<Record<string, string[]>>({});
  const [completedIds, setCompletedIds]             = useState<Set<string>>(new Set());
  const [countries, setCountries]                   = useState<RegionRow[]>([]);
  const [regions, setRegions]                       = useState<RegionRow[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [loadingGeo, setLoadingGeo]                 = useState(true);

  // ── Load global data ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: colItems }, { data: ctrs }, { data: regs }] = await Promise.all([
        supabase
          .from('collections')
          .select('id, title, tagline, photo, content_type, category, country:country_id(name), region:region_id(name), sub_region:sub_region_id(name)')
          .order('title'),
        supabase.from('collection_items').select('collection_id, item_id, item_type, position').order('collection_id').order('position').limit(1000),
        supabase.from('regions').select('id, name, photo').eq('level', 'country').order('name').limit(20),
        supabase.from('regions').select('id, name, photo, parent:parent_id(name)').eq('level', 'region').order('name').limit(20),
      ]);

      setCollections((cols as CollectionRow[]) ?? []);
      setCountries((ctrs as RegionRow[]) ?? []);
      setRegions((regs as RegionRow[]) ?? []);
      setLoadingGeo(false);

      // Build collection → item_ids map
      const map: Record<string, string[]> = {};
      for (const row of (colItems ?? []) as any[]) {
        if (!map[row.collection_id]) map[row.collection_id] = [];
        map[row.collection_id].push(row.item_id);
      }
      setCollectionItemsMap(map);

      // Build preview photos map
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

  return (
    <div className="min-h-screen" style={{ background: '#E9E3D9' }}>

      {/* ── Compact sticky header (mobile) ──────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white"
              style={{ borderBottom: '1px solid rgba(139,90,43,0.12)' }}>
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-base font-bold"
              style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
            Feito para você
          </h1>
          <button onClick={() => navigate('/search')}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#EDE4D6', color: '#7A6855' }}>
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-5 lg:px-8 lg:py-8 space-y-8">

        {/* ── Profile badge / Quiz CTA ─────────────────────────────── */}
        {user && profile?.quiz_completed ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">{PROFILE_ICONS[profile.wine_profile]}</span>
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(107,0,53,0.10)', color: '#6B0035' }}
            >
              Para o perfil {PROFILE_LABELS[profile.wine_profile]}
            </span>
          </div>
        ) : user && !profile?.quiz_completed ? (
          <Link to="/onboarding" style={{ textDecoration: 'none' }}>
            <div className="rounded-2xl px-4 py-3 text-white"
                 style={{ background: 'linear-gradient(135deg, #6B0035 0%, #9B1B4D 100%)' }}>
              <p className="text-sm font-bold">🍷 Qual é o seu perfil de vinho?</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Faça o quiz e personalize sua experiência →
              </p>
            </div>
          </Link>
        ) : null}

        {/* ── Por País ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
              🌍 Por País
            </h2>
            <Link to="/regions"
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: '#6B0035', textDecoration: 'none' }}>
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loadingGeo ? (
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
                      className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                      style={{ width: 80, height: 80, textDecoration: 'none' }}>
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="w-full h-full object-cover"
                         onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                  ) : (
                    <div className="w-full h-full" style={{ background: '#6B0035' }} />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 60%)' }} />
                  <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white font-semibold text-[10px] text-center leading-tight line-clamp-2">
                    {c.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#B0A090' }}>Nenhum país disponível.</p>
          )}
        </section>

        {/* ── Por Região ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
              📍 Por Região
            </h2>
            <Link to="/regions"
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: '#6B0035', textDecoration: 'none' }}>
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loadingGeo ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse"
                     style={{ width: 100, height: 80, background: '#D5CFC5' }} />
              ))}
            </div>
          ) : regions.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {regions.map(r => (
                <Link key={r.id} to={`/region/${r.id}`}
                      className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                      style={{ width: 100, height: 80, textDecoration: 'none' }}>
                  {r.photo ? (
                    <img src={r.photo} alt={r.name} className="w-full h-full object-cover"
                         onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                  ) : (
                    <div className="w-full h-full" style={{ background: '#4A0024' }} />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.10) 60%)' }} />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <p className="text-white font-semibold text-[10px] leading-tight line-clamp-1">{r.name}</p>
                    {(r.parent as any)?.name && (
                      <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {(r.parent as any).name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#B0A090' }}>Nenhuma região disponível.</p>
          )}
        </section>

        {/* ── Coleções para você ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
              Coleções para você
            </h2>
            <Link to="/explore"
                  className="text-xs font-semibold flex items-center gap-0.5"
                  style={{ color: '#6B0035', textDecoration: 'none' }}>
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:hidden">
                {[1,2,3].map(i => (
                  <div key={i} className="flex-shrink-0 rounded-[18px] animate-pulse"
                       style={{ width: 200, height: 300, background: '#D5CFC5' }} />
                ))}
              </div>
              <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="rounded-[18px] animate-pulse" style={{ height: 300, background: '#D5CFC5' }} />
                ))}
              </div>
            </>
          ) : personalizedCollections.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll carousel */}
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide lg:hidden">
                {personalizedCollections.map((col) => {
                  const prog = getProgress(col.id);
                  return (
                    <div key={col.id} className="flex-shrink-0" style={{ width: 200 }}>
                      <CollectionCard
                        id={col.id}
                        title={col.title}
                        coverImage={col.photo}
                        description={col.tagline ?? ''}
                        contentType={col.content_type}
                        category={col.category}
                        country={(col.country as any)?.name}
                        region={(col.region as any)?.name}
                        subRegion={(col.sub_region as any)?.name}
                        progress={prog.pct}
                        totalItems={prog.total}
                        completedItems={prog.done}
                        previewPhotos={previewPhotosMap[col.id]}
                        variant="portrait"
                      />
                    </div>
                  );
                })}
              </div>
              {/* Desktop: CSS grid */}
              <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
                {personalizedCollections.map((col) => {
                  const prog = getProgress(col.id);
                  return (
                    <CollectionCard
                      key={col.id}
                      id={col.id}
                      title={col.title}
                      coverImage={col.photo}
                      description={col.tagline ?? ''}
                      contentType={col.content_type}
                      category={col.category}
                      country={(col.country as any)?.name}
                      region={(col.region as any)?.name}
                      subRegion={(col.sub_region as any)?.name}
                      progress={prog.pct}
                      totalItems={prog.total}
                      completedItems={prog.done}
                      previewPhotos={previewPhotosMap[col.id]}
                      variant="portrait"
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-sm rounded-2xl bg-white"
                 style={{ color: '#B0A090', border: '1px solid rgba(139,90,43,0.10)' }}>
              Nenhuma coleção disponível.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
