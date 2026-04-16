import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight, Layers, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

type RegionRow = {
  id: string;
  name: string;
  photo: string | null;
  description: string | null;
  level: string;
  parent_id: string | null;
};

type CollectionRow = {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  category: string;
  content_type: string;
};

type ItemRow = {
  item_id: string;
  wines: {
    id: string;
    name: string;
    highlight: string | null;
    photo: string;
    type: string;
    wineries: { name: string } | null;
  } | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  'Essencial':      'bg-emerald-100 text-emerald-700',
  'Fugir do óbvio': 'bg-purple-100 text-purple-700',
  'Ícones':         'bg-amber-100 text-amber-700',
};

export default function RegionDetail() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [region, setRegion] = useState<RegionRow | null>(null);
  const [parent, setParent] = useState<RegionRow | null>(null);
  const [subRegions, setSubRegions] = useState<RegionRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [collectionItems, setCollectionItems] = useState<Record<string, ItemRow[]>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regionId) return;
    setLoading(true);

    const load = async () => {
      // 1. Load region
      const { data: reg } = await supabase
        .from('regions').select('id, name, photo, description, level, parent_id')
        .eq('id', regionId).maybeSingle();
      if (!reg) { setLoading(false); return; }
      setRegion(reg);

      // 2. Load parent (if any)
      if (reg.parent_id) {
        const { data: par } = await supabase
          .from('regions').select('id, name, photo, description, level, parent_id')
          .eq('id', reg.parent_id).maybeSingle();
        setParent(par ?? null);
      } else {
        setParent(null);
      }

      // 3. Load sub-regions
      const { data: subs } = await supabase
        .from('regions').select('id, name, photo, description, level, parent_id')
        .eq('parent_id', regionId).order('name');
      setSubRegions(subs ?? []);

      // 4. Load collections for this region
      const { data: cols } = await supabase
        .from('collections')
        .select('id, title, tagline, photo, category, content_type')
        .or(`region_id.eq.${regionId},country_id.eq.${regionId}`)
        .order('title');
      setCollections(cols ?? []);

      // 5. Load items for all collections
      const colIds = (cols ?? []).map(c => c.id);
      if (colIds.length > 0) {
        const { data: ciRows } = await supabase
          .from('collection_items')
          .select('item_id, collection_id, wines(id, name, highlight, photo, type, wineries(name))')
          .in('collection_id', colIds)
          .order('position');

        const byCol: Record<string, ItemRow[]> = {};
        for (const ci of ciRows ?? []) {
          const row = ci as unknown as ItemRow & { collection_id: string };
          if (!byCol[row.collection_id]) byCol[row.collection_id] = [];
          byCol[row.collection_id].push({ item_id: row.item_id, wines: row.wines });
        }
        setCollectionItems(byCol);

        // 6. Load user progress
        if (user) {
          const allItemIds = (ciRows ?? []).map((ci: { item_id: string }) => ci.item_id);
          if (allItemIds.length > 0) {
            const { data: prog } = await supabase
              .from('user_progress')
              .select('item_id')
              .eq('user_id', user.id)
              .eq('completed', true)
              .in('item_id', allItemIds);
            setCompletedIds(new Set((prog ?? []).map((p: { item_id: string }) => p.item_id)));
          }
        }
      }

      setLoading(false);
    };

    load();
  }, [regionId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Região não encontrada</p>
          <Link to="/" className="text-purple-600 hover:underline text-sm">Voltar para início</Link>
        </div>
      </div>
    );
  }

  const hasCollections = collections.length > 0;
  const hasSubRegions = subRegions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* Sticky header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 flex-wrap">
                <Link to="/explore" className="text-xs text-purple-600 font-medium hover:underline">Explorar</Link>
                {parent && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <Link to={`/region/${parent.id}`} className="text-xs text-purple-600 font-medium hover:underline truncate max-w-[100px]">{parent.name}</Link>
                  </>
                )}
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate max-w-[120px]">{region.name}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{region.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 max-w-2xl mx-auto">

        {/* Region hero */}
        {region.photo && (
          <div className="relative h-52 mx-4 mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img src={region.photo} alt={region.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80 font-medium uppercase tracking-wider">
                  {region.level === 'country' ? 'País' : region.level === 'sub-region' ? 'Sub-região' : 'Região'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{region.name}</h2>
              {region.description && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2">{region.description}</p>
              )}
            </div>
          </div>
        )}

        {!region.photo && region.description && (
          <div className="mx-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">{region.description}</p>
          </div>
        )}

        {/* Collections */}
        {hasCollections && (
          <div className="mb-6">
            <p className="mx-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Coleções
            </p>
            <div className="space-y-5">
              {collections.map((col) => {
                const items = collectionItems[col.id] ?? [];
                const completedCount = items.filter(it => completedIds.has(it.item_id)).length;
                const pct = items.length > 0 ? (completedCount / items.length) * 100 : 0;
                const categoryColor = CATEGORY_COLORS[col.category] ?? 'bg-gray-100 text-gray-600';

                return (
                  <div key={col.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Cover */}
                    {col.photo && (
                      <div className="relative h-40">
                        <img src={col.photo} alt={col.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${categoryColor}`}>
                            {col.category}
                          </span>
                          <h3 className="text-white font-bold text-base leading-tight">{col.title}</h3>
                          {col.tagline && (
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{col.tagline}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!col.photo && (
                      <div className="p-4 border-b border-gray-100">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${categoryColor}`}>
                          {col.category}
                        </span>
                        <h3 className="text-gray-900 font-bold text-base">{col.title}</h3>
                        {col.tagline && <p className="text-gray-500 text-xs mt-0.5">{col.tagline}</p>}
                      </div>
                    )}

                    {/* Progress */}
                    {user && items.length > 0 && (
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-gray-500">{completedCount} de {items.length} experimentados</span>
                          <span className="text-xs font-semibold text-purple-600">{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Items horizontal scroll */}
                    {items.length > 0 ? (
                      <div className="py-3">
                        <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                          {items.map((row) => {
                            const wine = row.wines;
                            if (!wine) return null;
                            const done = completedIds.has(row.item_id);
                            return (
                              <Link
                                key={row.item_id}
                                to={`/wine/${wine.id}`}
                                className="flex-shrink-0 w-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                              >
                                <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-50">
                                  <img
                                    src={wine.photo}
                                    alt={wine.name}
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&q=60'; }}
                                  />
                                  {done && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="px-2 py-2">
                                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{wine.name}</p>
                                  {wine.wineries && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{wine.wineries.name}</p>
                                  )}
                                  <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {wine.type}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <Layers className="w-8 h-8 text-gray-300" />
                        <p className="text-xs text-gray-400">Nenhum item cadastrado</p>
                      </div>
                    )}

                    <div className="px-4 pb-3">
                      <Link
                        to={`/collection/${col.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Ver coleção completa
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-regions */}
        {hasSubRegions && (
          <div className="px-4 pb-6">
            <p className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Sub-regiões de {region.name}
            </p>
            <div className="space-y-3">
              {subRegions.map((sr, i) => (
                <motion.div
                  key={sr.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.3 }}
                >
                  <Link to={`/region/${sr.id}`} className="block">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      {sr.photo ? (
                        <div className="relative h-36">
                          <img src={sr.photo} alt={sr.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                            <div>
                              <h3 className="text-white font-bold text-base">{sr.name}</h3>
                              {sr.description && (
                                <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{sr.description}</p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-4">
                          <div>
                            <h3 className="text-gray-900 font-semibold text-sm">{sr.name}</h3>
                            {sr.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{sr.description}</p>}
                          </div>
                          <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasCollections && !hasSubRegions && (
          <div className="px-4 py-20 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Nenhuma coleção cadastrada ainda para esta região.</p>
          </div>
        )}
      </div>
    </div>
  );
}
