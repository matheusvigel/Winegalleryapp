import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { CollectionCard } from '../components/CollectionCard';
import { Search, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PROFILE_LABELS, PROFILE_ICONS, type WineProfile } from '../../lib/profileConstants';

type FilterType = 'all' | 'Vinhos' | 'Experiências' | 'Vinícolas';

interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
  category: string;
  country: { name: string } | null;
  region: { name: string } | null;
  sub_region: { name: string } | null;
}

interface RegionRow {
  id: string;
  name: string;
  photo: string | null;
  level: string;
  parent: { name: string } | null;
}

interface CountryRow {
  id: string;
  name: string;
  photo: string | null;
}

interface ExploreExperienceRow {
  id: string;
  name: string;
  photo: string | null;
  category: string;
  highlight: string | null;
}

interface ProfileRule {
  category: string;
  priority: number;
  visible: boolean;
}

interface ItemRow {
  id: string;
  name: string;
  photo: string | null;
  type?: string;
  average_price?: number;
  category?: string;
  highlight?: string | null;
  winery?: { name: string } | null;
}

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',          label: 'Todas'          },
  { key: 'Vinhos',       label: '🍷 Vinhos'       },
  { key: 'Experiências', label: '✨ Experiências' },
  { key: 'Vinícolas',    label: '🏛️ Vinícolas'    },
];

// Sort collections by profile rules: hidden categories go last, then by priority
function sortByProfileRules(cols: CollectionRow[], rules: ProfileRule[]): CollectionRow[] {
  if (rules.length === 0) return cols;
  const ruleMap: Record<string, ProfileRule> = {};
  for (const r of rules) ruleMap[r.category] = r;

  return [...cols].sort((a, b) => {
    const ra = ruleMap[a.category];
    const rb = ruleMap[b.category];
    const visA = ra?.visible ?? true;
    const visB = rb?.visible ?? true;
    if (visA !== visB) return visA ? -1 : 1;
    const prioA = ra?.priority ?? 99;
    const prioB = rb?.priority ?? 99;
    return prioA - prioB;
  });
}

function ItemCard({ item, collections, filterType }: { item: ItemRow; collections: { id: string; title: string }[]; filterType: string }) {
  const route = filterType === 'Vinhos' ? `/wine/${item.id}` : filterType === 'Experiências' ? `/experience/${item.id}` : `/winery/${item.id}`;
  return (
    <Link to={route} className="flex gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex-shrink-0">
        {item.photo
          ? <img src={item.photo} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
          : <div className="w-full h-full flex items-center justify-center text-2xl">{filterType === 'Vinhos' ? '🍷' : filterType === 'Experiências' ? '✨' : '🏛️'}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
        {item.winery && <p className="text-xs text-gray-500 mt-0.5">{item.winery.name}</p>}
        {item.type && <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{item.type}</span>}
        {item.category && !item.type && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{item.category}</span>}
        {collections.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400">Em:</span>
            {collections.slice(0, 2).map(c => (
              <span key={c.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.title}</span>
            ))}
            {collections.length > 2 && (
              <span className="text-[10px] text-gray-400">+{collections.length - 2}</span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 self-center flex-shrink-0" />
    </Link>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [collections, setCollections]       = useState<CollectionRow[]>([]);
  const [regions, setRegions]               = useState<RegionRow[]>([]);
  const [countries, setCountries]           = useState<CountryRow[]>([]);
  const [experiences, setExperiences]       = useState<ExploreExperienceRow[]>([]);
  const [profileRules, setProfileRules]     = useState<ProfileRule[]>([]);
  const [userProfile, setUserProfile]       = useState<WineProfile | null>(null);
  const [loading, setLoading]               = useState(true);

  const [viewMode, setViewMode]     = useState<'collections' | 'items'>('collections');
  const [itemRows, setItemRows]     = useState<ItemRow[]>([]);
  const [itemColMap, setItemColMap] = useState<Record<string, { id: string; title: string }[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: regs }, { data: cts }, { data: exps }] = await Promise.all([
        supabase.from('collections').select('id, title, tagline, photo, content_type, category, country:country_id(name), region:region_id(name), sub_region:sub_region_id(name)').order('title'),
        supabase.from('regions')
          .select('id, name, photo, level, parent:regions!parent_id(name)')
          .in('level', ['region', 'sub-region'])
          .not('photo', 'is', null)
          .limit(6),
        supabase.from('regions')
          .select('id, name, photo')
          .eq('level', 'country')
          .order('name'),
        supabase.from('experiences')
          .select('id, name, photo, category, highlight')
          .is('winery_id', null)
          .order('name')
          .limit(12),
      ]);

      setCollections((cols as CollectionRow[]) ?? []);
      setRegions((regs as unknown as RegionRow[]) ?? []);
      setCountries((cts as CountryRow[]) ?? []);
      setExperiences((exps as ExploreExperienceRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Load profile rules when user is known
  useEffect(() => {
    if (!user) { setProfileRules([]); setUserProfile(null); return; }

    const loadProfile = async () => {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('wine_profile')
        .eq('user_id', user.id)
        .maybeSingle();

      const profile = prof?.wine_profile as WineProfile | null;
      setUserProfile(profile ?? null);

      if (profile) {
        const { data: rules } = await supabase
          .from('profile_content_rules')
          .select('category, priority, visible')
          .eq('profile', profile);
        setProfileRules((rules as ProfileRule[]) ?? []);
      }
    };
    loadProfile();
  }, [user]);

  // Reset viewMode when filter changes
  useEffect(() => { setViewMode('collections'); }, [selectedFilter]);

  // Load items when in items view
  useEffect(() => {
    if (viewMode !== 'items' || selectedFilter === 'all') return;
    const load = async () => {
      setItemsLoading(true);
      const typeCollections = collections.filter(c => c.content_type === selectedFilter);
      const colIds = typeCollections.map(c => c.id);
      const tableName = selectedFilter === 'Vinhos' ? 'wines' : selectedFilter === 'Experiências' ? 'experiences' : 'wineries';
      const selectStr = selectedFilter === 'Vinhos'
        ? 'id, name, photo, type, average_price, winery:winery_id(name)'
        : 'id, name, photo, category, highlight';
      const [{ data: items }, { data: colItems }] = await Promise.all([
        supabase.from(tableName).select(selectStr).order('name').limit(60),
        colIds.length > 0
          ? supabase.from('collection_items').select('item_id, collection_id').in('collection_id', colIds)
          : Promise.resolve({ data: [] }),
      ]);
      const colTitleMap = Object.fromEntries(typeCollections.map(c => [c.id, c.title]));
      const map: Record<string, { id: string; title: string }[]> = {};
      for (const ci of (colItems ?? []) as { item_id: string; collection_id: string }[]) {
        if (!map[ci.item_id]) map[ci.item_id] = [];
        const title = colTitleMap[ci.collection_id];
        if (title) map[ci.item_id].push({ id: ci.collection_id, title });
      }
      setItemRows((items ?? []) as ItemRow[]);
      setItemColMap(map);
      setItemsLoading(false);
    };
    load();
  }, [viewMode, selectedFilter, collections]);

  // Filter by content_type first, then sort/filter by profile rules
  const filtered = useMemo(() => {
    let cols = collections.filter(c =>
      selectedFilter === 'all' || c.content_type === selectedFilter
    );
    // Only apply profile rules when showing "all" — filtered tabs show everything
    if (selectedFilter === 'all' && profileRules.length > 0) {
      const hiddenCats = profileRules.filter(r => !r.visible).map(r => r.category);
      cols = cols.filter(c => !hiddenCats.includes(c.category));
      cols = sortByProfileRules(cols, profileRules);
    }
    return cols;
  }, [collections, selectedFilter, profileRules]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 lg:hidden">Explorar</h1>

          {/* Search bar — navigates to /search */}
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl text-left mb-4 hover:bg-gray-200 transition-colors"
          >
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 text-sm">Buscar vinhos, vinícolas, regiões...</span>
          </button>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedFilter === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

        {/* ── Profile banner (when rules are active) ───────────────── */}
        {user && userProfile && selectedFilter === 'all' && profileRules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl px-4 py-3"
          >
            <span className="text-2xl">{PROFILE_ICONS[userProfile]}</span>
            <div>
              <p className="text-xs text-purple-500 font-medium">Curado para o seu perfil</p>
              <p className="text-sm font-semibold text-gray-900">{PROFILE_LABELS[userProfile]}</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {[...profileRules]
                .filter(r => r.visible)
                .sort((a, b) => a.priority - b.priority)
                .map(r => (
                  <span
                    key={r.category}
                    className="text-[10px] bg-white border border-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full"
                  >
                    {r.priority}. {r.category}
                  </span>
                ))}
            </div>
          </motion.div>
        )}

        {/* ── Countries row ────────────────────────────────────────── */}
        {countries.length > 0 && selectedFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <h2 className="text-lg font-bold text-gray-900">Por País</h2>
              </div>
              <Link to="/regions" className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {countries.map((country) => (
                <Link
                  key={country.id}
                  to={`/country/${country.id}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden">
                    {country.photo ? (
                      <img
                        src={country.photo}
                        alt={country.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold leading-tight">
                      {country.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Regions grid ─────────────────────────────────────────── */}
        {regions.length > 0 && selectedFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Explorar por Região</h2>
              </div>
              <Link to="/regions" className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {regions.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                >
                  <Link
                    to={`/region/${region.id}`}
                    className="relative overflow-hidden rounded-2xl h-32 cursor-pointer group block"
                  >
                    {region.photo ? (
                      <img
                        src={region.photo}
                        alt={region.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm mb-0.5 leading-tight">{region.name}</h3>
                      {region.parent && (
                        <p className="text-white/70 text-[10px]">{region.parent.name}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Standalone Experiences ───────────────────────────────── */}
        {experiences.length > 0 && selectedFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Experiências & Acessórios</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {experiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                >
                  <Link
                    to={`/experience/${exp.id}`}
                    className="block relative overflow-hidden rounded-2xl h-36 group"
                  >
                    {exp.photo ? (
                      <img
                        src={exp.photo}
                        alt={exp.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      {exp.category && (
                        <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-0.5 block">
                          {exp.category}
                        </span>
                      )}
                      <h3 className="text-white font-semibold text-xs leading-tight">{exp.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Collections ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {selectedFilter === 'all' ? 'Todas as Coleções' : FILTERS.find(f => f.key === selectedFilter)?.label}
          </h2>

          {/* View mode toggle — only when a specific filter is active */}
          {selectedFilter !== 'all' && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode('collections')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'collections' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Por Coleções
              </button>
              <button
                onClick={() => setViewMode('items')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'items' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Individual
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-64" />
              ))}
            </div>
          ) : viewMode === 'items' && selectedFilter !== 'all' ? (
            itemsLoading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : itemRows.length > 0 ? (
              itemRows.map(item => (
                <ItemCard key={item.id} item={item} collections={itemColMap[item.id] ?? []} filterType={selectedFilter} />
              ))
            ) : (
              <div className="text-center py-12"><div className="text-6xl mb-4">🔍</div><p className="text-gray-500">Nenhum item encontrado</p></div>
            )
          ) : filtered.length > 0 ? (
            filtered.map(col => (
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
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500">Nenhuma coleção encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
