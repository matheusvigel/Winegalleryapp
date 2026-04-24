import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight, MapPin, Layers, Wine } from 'lucide-react';
import { motion } from 'motion/react';

// In the live DB, "countries" are regions with level='country'.
// The /country/:countryId route passes the region UUID.
// Children (regions) have parent_id = countryId and level = 'region'.
// Collections link via country_id = countryId.

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
  photo: string;
  tagline: string | null;
  category: string;
  content_type: string;
};

type WineryRow = {
  id: string;
  name: string;
  photo: string | null;
  category: string;
  highlight: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  'Essencial':      'bg-emerald-100 text-emerald-700',
  'Fugir do óbvio': 'bg-purple-100 text-purple-700',
  'Ícones':         'bg-amber-100 text-amber-700',
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

export default function CountryDetail() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();

  const [country, setCountry]         = useState<RegionRow | null>(null);
  const [childRegions, setChildRegions] = useState<RegionRow[]>([]);
  const [subRegions, setSubRegions]   = useState<RegionRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [wineries, setWineries]       = useState<WineryRow[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!countryId) return;

    const load = async () => {
      // 1. Load the country
      const { data: ct } = await supabase
        .from('regions')
        .select('id, name, photo, description, level, parent_id')
        .eq('id', countryId)
        .maybeSingle();

      setCountry(ct ?? null);

      // 2. Child regions + collections in parallel
      const [{ data: children }, { data: cols }] = await Promise.all([
        supabase
          .from('regions')
          .select('id, name, photo, description, level, parent_id')
          .eq('parent_id', countryId)
          .eq('level', 'region')
          .order('position')
          .order('name'),
        supabase
          .from('collections')
          .select('id, title, photo, tagline, category, content_type')
          .eq('country_id', countryId)
          .order('category')
          .limit(12),
      ]);

      const regions = (children ?? []) as RegionRow[];
      setChildRegions(regions);
      setCollections(cols ?? []);

      // 3. Sub-regions + wineries in parallel (sub-regions need regionIds first)
      const regionIds = regions.map(r => r.id);
      const allRegionIds = [countryId, ...regionIds];

      const [subRes, winRes] = await Promise.all([
        regionIds.length > 0
          ? supabase
              .from('regions')
              .select('id, name, photo, description, level, parent_id')
              .in('parent_id', regionIds)
              .eq('level', 'sub-region')
              .order('position')
              .order('name')
          : Promise.resolve({ data: [] }),
        supabase
          .from('wineries')
          .select('id, name, photo, category, highlight')
          .in('region_id', allRegionIds)
          .order('name')
          .limit(40),
      ]);

      setSubRegions((subRes.data ?? []) as RegionRow[]);
      setWineries((winRes.data ?? []) as WineryRow[]);

      setLoading(false);
    };

    load();
  }, [countryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">País não encontrado</p>
          <Link to="/explore" className="text-purple-600 hover:underline text-sm">Voltar para Explorar</Link>
        </div>
      </div>
    );
  }

  // Group sub-regions by parent region name for the carousel header
  const regionNameById = Object.fromEntries(childRegions.map(r => [r.id, r.name]));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Sticky header ─────────────────────────────────────────── */}
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
              <div className="flex items-center gap-1 flex-wrap">
                <Link to="/explore" className="text-xs text-purple-600 font-medium hover:underline">Explorar</Link>
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{country.name}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{country.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 max-w-2xl mx-auto">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        {country.photo ? (
          <div className="relative h-52 mx-4 mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={country.photo}
              alt={country.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80 font-medium uppercase tracking-wider">País</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{country.name}</h2>
              {country.description && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2">{country.description}</p>
              )}
            </div>
          </div>
        ) : country.description ? (
          <div className="mx-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">{country.description}</p>
          </div>
        ) : null}

        {/* ── Regiões ───────────────────────────────────────────────── */}
        {childRegions.length > 0 && (
          <div className="mb-6">
            <p className="mx-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Regiões de {country.name}
            </p>
            <div className="space-y-3 px-4">
              {childRegions.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <Link to={`/region/${region.id}`} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                      {region.photo ? (
                        <div className="relative h-36">
                          <img
                            src={region.photo}
                            alt={region.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                            <div>
                              <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider mb-0.5 block">Região</span>
                              <h3 className="text-white font-bold text-base">{region.name}</h3>
                              {region.description && (
                                <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{region.description}</p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-4">
                          <div>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5 block">Região</span>
                            <h3 className="text-gray-900 font-semibold text-sm">{region.name}</h3>
                            {region.description && (
                              <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{region.description}</p>
                            )}
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

        {/* ── Sub-regiões (carrossel compacto) ─────────────────────── */}
        {subRegions.length > 0 && (
          <div className="mb-6">
            <p className="mx-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Sub-regiões
            </p>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
              {subRegions.map((sr, i) => (
                <motion.div
                  key={sr.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                  className="flex-shrink-0 w-40"
                >
                  <Link to={`/region/${sr.id}`} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                      <div className="relative h-24 bg-gradient-to-br from-purple-50 to-pink-50">
                        {sr.photo ? (
                          <img
                            src={sr.photo}
                            alt={sr.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-white font-semibold text-xs leading-tight line-clamp-2">{sr.name}</p>
                        </div>
                      </div>
                      {sr.parent_id && regionNameById[sr.parent_id] && (
                        <div className="px-2.5 py-1.5">
                          <p className="text-[10px] text-gray-400 truncate">{regionNameById[sr.parent_id]}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wineries ──────────────────────────────────────────────── */}
        {wineries.length > 0 && (
          <div className="mb-6">
            <p className="mx-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Vinícolas de {country.name}
            </p>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
              {wineries.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                  className="flex-shrink-0 w-40"
                >
                  <Link to={`/winery/${w.id}`} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                      <div className="h-28 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
                        {w.photo ? (
                          <img src={w.photo} alt={w.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                        ) : (
                          <Wine className="w-8 h-8 text-purple-300" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{w.name}</p>
                        {w.category && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{w.category}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Collections from this country ─────────────────────────── */}
        {collections.length > 0 && (
          <div className="mb-8">
            <p className="mx-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Coleções de {country.name}
            </p>
            <div className="space-y-4 px-4">
              {collections.map((col, i) => {
                const catColor = CATEGORY_COLORS[col.category] ?? 'bg-gray-100 text-gray-600';
                return (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                  >
                    <Link to={`/collection/${col.id}`} className="block group">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                        {col.photo ? (
                          <div className="relative h-36">
                            <img
                              src={col.photo}
                              alt={col.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5 ${catColor}`}>
                                {col.category}
                              </span>
                              <h3 className="text-white font-bold text-sm leading-tight">{col.title}</h3>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-4">
                            <div>
                              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${catColor}`}>
                                {col.category}
                              </span>
                              <h3 className="text-gray-900 font-semibold text-sm">{col.title}</h3>
                              {col.tagline && (
                                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{col.tagline}</p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {childRegions.length === 0 && subRegions.length === 0 && collections.length === 0 && wineries.length === 0 && (
          <div className="px-4 py-20 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Nenhum conteúdo cadastrado ainda para este país.</p>
          </div>
        )}
      </div>
    </div>
  );
}
