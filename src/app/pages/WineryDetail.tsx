import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight, MapPin, ExternalLink, Wine, Layers, Star } from 'lucide-react';
import { motion } from 'motion/react';

// ── Types ────────────────────────────────────────────────────────────────────

type Winery = {
  id: string;
  name: string;
  photo: string | null;
  region_id: string;
  sub_region_id: string | null;
  category: string;
  highlight: string | null;
  buy_link: string | null;
};

type WineRow = {
  id: string;
  name: string;
  photo: string | null;
  type: string;
  category: string;
  price_min: number | null;
  price_max: number | null;
  highlight: string | null;
};

type ExperienceRow = {
  id: string;
  name: string;
  photo: string | null;
  category: string;
  highlight: string | null;
};

type RegionRow = {
  id: string;
  name: string;
  level: string;
  parent: { id: string; name: string } | null;
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const CATEGORY_COLORS: Record<string, string> = {
  'Essencial':      'bg-emerald-100 text-emerald-700',
  'Fugir do óbvio': 'bg-purple-100 text-purple-700',
  'Ícones':         'bg-amber-100 text-amber-700',
};

const TYPE_COLORS: Record<string, string> = {
  'Tinto':      'bg-red-100 text-red-700',
  'Branco':     'bg-yellow-100 text-yellow-700',
  'Rosé':       'bg-pink-100 text-pink-700',
  'Espumante':  'bg-purple-100 text-purple-700',
  'Sobremesa':  'bg-amber-100 text-amber-700',
  'Laranja':    'bg-orange-100 text-orange-700',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function WineryDetail() {
  // support both /winery/:wineryId and /brand/:brandId
  const { wineryId, brandId } = useParams<{ wineryId?: string; brandId?: string }>();
  const resolvedId = wineryId ?? brandId;
  const navigate = useNavigate();

  const [winery, setWinery]         = useState<Winery | null>(null);
  const [wines, setWines]           = useState<WineRow[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [region, setRegion]         = useState<RegionRow | null>(null);
  const [subRegion, setSubRegion]   = useState<RegionRow | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'wines' | 'experiences'>('wines');

  useEffect(() => {
    if (!resolvedId) return;
    setLoading(true);

    const load = async () => {
      // 1. Load winery
      const { data: w } = await supabase
        .from('wineries')
        .select('id, name, photo, region_id, sub_region_id, category, highlight, buy_link')
        .eq('id', resolvedId)
        .maybeSingle();

      if (!w) { setLoading(false); return; }
      setWinery(w);

      // 2. Load wines + experiences from this winery in parallel
      const [{ data: wns }, { data: exps }] = await Promise.all([
        supabase
          .from('wines')
          .select('id, name, photo, type, category, price_min, price_max, highlight')
          .eq('winery_id', resolvedId)
          .order('name'),
        supabase
          .from('experiences')
          .select('id, name, photo, category, highlight')
          .eq('winery_id', resolvedId)
          .order('name'),
      ]);
      setWines(wns ?? []);
      setExperiences(exps ?? []);

      // 3. Load region info
      const regionPromise = w.region_id
        ? supabase
            .from('regions')
            .select('id, name, level, parent:regions!parent_id(id, name)')
            .eq('id', w.region_id)
            .maybeSingle()
        : Promise.resolve({ data: null });

      const subRegionPromise = w.sub_region_id
        ? supabase
            .from('regions')
            .select('id, name, level, parent:regions!parent_id(id, name)')
            .eq('id', w.sub_region_id)
            .maybeSingle()
        : Promise.resolve({ data: null });

      const [{ data: reg }, { data: sub }] = await Promise.all([regionPromise, subRegionPromise]);
      setRegion((reg as unknown as RegionRow) ?? null);
      setSubRegion((sub as unknown as RegionRow) ?? null);

      setLoading(false);
    };

    load();
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!winery) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Vinícola não encontrada</p>
          <Link to="/explore" className="text-purple-600 hover:underline text-sm">Voltar para Explorar</Link>
        </div>
      </div>
    );
  }

  const displayRegion = subRegion ?? region;
  const parentRegion = subRegion ? region : (region?.parent ? { id: (region.parent as any).id, name: (region.parent as any).name } : null);
  const categoryColor = CATEGORY_COLORS[winery.category] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
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
                {parentRegion && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <Link
                      to={region?.level === 'country' ? `/country/${region.id}` : `/region/${region?.id}`}
                      className="text-xs text-purple-600 font-medium hover:underline truncate max-w-[80px]"
                    >
                      {parentRegion.name}
                    </Link>
                  </>
                )}
                {displayRegion && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <Link
                      to={`/region/${displayRegion.id}`}
                      className="text-xs text-purple-600 font-medium hover:underline truncate max-w-[80px]"
                    >
                      {displayRegion.name}
                    </Link>
                  </>
                )}
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate max-w-[100px]">{winery.name}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{winery.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 max-w-2xl mx-auto">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        {winery.photo ? (
          <div className="relative h-56 mx-4 mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={winery.photo}
              alt={winery.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryColor}`}>
                  {winery.category}
                </span>
                {displayRegion && (
                  <span className="flex items-center gap-1 text-white/80 text-xs">
                    <MapPin className="w-3 h-3" />
                    {displayRegion.name}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{winery.name}</h2>
              {winery.highlight && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2">{winery.highlight}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-4 mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wine className="w-7 h-7 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{winery.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryColor}`}>
                    {winery.category}
                  </span>
                  {displayRegion && (
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin className="w-3 h-3" />
                      {displayRegion.name}
                    </span>
                  )}
                </div>
                {winery.highlight && (
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{winery.highlight}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Info row ───────────────────────────────────────────────────── */}
        <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
          {displayRegion && (
            <Link
              to={`/region/${displayRegion.id}`}
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Região</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{displayRegion.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 group-hover:text-purple-600 transition-colors" />
            </Link>
          )}
          {winery.buy_link && (
            <a
              href={winery.buy_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Site</p>
                <p className="text-sm font-semibold text-purple-600 truncate">Visitar</p>
              </div>
            </a>
          )}
        </div>

        {/* ── Tabs: Vinhos / Experiências ────────────────────────────────── */}
        <div className="mx-4 mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('wines')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'wines' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              Vinhos ({wines.length})
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'experiences' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Experiências ({experiences.length})
            </button>
          </div>
        </div>

        {/* ── Wines list ─────────────────────────────────────────────────── */}
        {activeTab === 'wines' && (
          <div className="mb-8">
            {wines.length === 0 ? (
              <div className="mx-4 py-12 text-center bg-white rounded-2xl border border-gray-100">
                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum vinho cadastrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3 px-4">
                {wines.map((wine, i) => {
                  const typeColor = TYPE_COLORS[wine.type] ?? 'bg-gray-100 text-gray-600';
                  const catColor  = CATEGORY_COLORS[wine.category] ?? 'bg-gray-100 text-gray-600';
                  const priceStr  = wine.price_min || wine.price_max
                    ? wine.price_min !== wine.price_max && wine.price_min && wine.price_max
                      ? `R$ ${wine.price_min.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} – R$ ${wine.price_max.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                      : `R$ ${(wine.price_min ?? wine.price_max)!.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    : null;
                  return (
                    <motion.div
                      key={wine.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.25 }}
                    >
                      <Link to={`/wine/${wine.id}`} className="block group">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow flex gap-3 p-3">
                          <div className="w-20 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex-shrink-0">
                            {wine.photo ? (
                              <img src={wine.photo} alt={wine.name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Wine className="w-8 h-8 text-purple-300" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="font-semibold text-gray-900 text-sm leading-tight mb-1.5 line-clamp-2">{wine.name}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{wine.type}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{wine.category}</span>
                            </div>
                            {priceStr && <p className="text-xs text-gray-500">{priceStr}</p>}
                            {wine.highlight && <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-snug">{wine.highlight}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 self-center flex-shrink-0 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Experiences list ───────────────────────────────────────────── */}
        {activeTab === 'experiences' && (
          <div className="mb-8">
            {experiences.length === 0 ? (
              <div className="mx-4 py-12 text-center bg-white rounded-2xl border border-gray-100">
                <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma experiência cadastrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3 px-4">
                {experiences.map((exp, i) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.25 }}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex gap-3 p-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 flex-shrink-0">
                        {exp.photo ? (
                          <img src={exp.photo} alt={exp.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Star className="w-7 h-7 text-amber-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="font-semibold text-gray-900 text-sm leading-tight mb-1.5">{exp.name}</p>
                        {exp.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{exp.category}</span>
                        )}
                        {exp.highlight && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-snug">{exp.highlight}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
