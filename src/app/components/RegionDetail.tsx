import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ItemCard } from './ItemCard';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, WineItem } from '../types';
import { getProgress } from '../utils/storage';

const LEVEL_CONFIG = {
  essential: { label: 'Essencial', pill: 'bg-[#6b7c5a]/90 border-[#6b7c5a]/40', dot: 'bg-[#8a9e72]' },
  escape: { label: 'Fugir do Óbvio', pill: 'bg-[#3d5a7a]/90 border-[#3d5a7a]/40', dot: 'bg-[#4e7299]' },
  icon: { label: 'Ícone', pill: 'bg-[#7a2e2e]/90 border-[#7a2e2e]/40', dot: 'bg-[#a04040]' },
} as const;

type Level = keyof typeof LEVEL_CONFIG;

type SubRegion = { id: string; name: string; image_url: string; description: string };

// ─── Collection slide ──────────────────────────────────────────────────────────
function CollectionSlide({
  collection,
  progress,
  isFirst,
  hasNext,
  nextLabel,
  regionName,
  countryName,
  onBack,
}: {
  collection: Collection;
  progress: ReturnType<typeof getProgress>;
  isFirst: boolean;
  hasNext: boolean;
  nextLabel?: string;
  regionName: string;
  countryName?: string;
  onBack: () => void;
}) {
  const cfg = LEVEL_CONFIG[collection.level as Level] ?? LEVEL_CONFIG.essential;

  const completedItems = collection.items.filter(item =>
    progress.find(p => p.itemId === item.id && p.status === 'completed')
  );
  const completedCount = completedItems.length;
  const totalItems = collection.items.length;
  const progressPct = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const ptsEarned = completedItems.reduce((sum, item) => sum + item.points, 0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState(0);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || collection.items.length === 0) return;
    const cardWidth = el.scrollWidth / collection.items.length;
    setActiveItem(Math.round(el.scrollLeft / cardWidth));
  };

  return (
    <div className="relative h-screen snap-start flex flex-col overflow-hidden">
      <img
        src={collection.coverImage}
        alt={collection.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 via-40% to-black/85" />

      {isFirst && (
        <div className="absolute top-0 left-0 right-0 z-50 pt-8 pb-4 px-5 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/15 flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-white" />
            </motion.button>
            <div className="min-w-0">
              {countryName && (
                <p className="text-[#c5a96d] text-[11px] font-semibold uppercase tracking-widest">{countryName}</p>
              )}
              <h1 className="font-gelica text-white font-bold text-xl leading-tight truncate">{regionName}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full" style={{ paddingTop: isFirst ? '90px' : '60px' }}>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold text-white backdrop-blur-md border ${cfg.pill}`}>
              {cfg.label}
            </span>
            <span className="text-[#c5a96d] text-xs font-bold">{collection.totalPoints} pts total</span>
          </div>
          <h2 className="font-gelica text-[26px] font-bold text-white leading-tight mb-1">{collection.title}</h2>
          <p className="text-white/65 text-[13px] leading-snug line-clamp-2">{collection.description}</p>
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          >
            <div className="flex gap-3 px-5 py-2" style={{ width: 'max-content' }}>
              {collection.items.length > 0 ? (
                collection.items.map(item => (
                  <div key={item.id} className="w-[270px] flex-shrink-0 snap-center">
                    <ItemCard item={item} />
                  </div>
                ))
              ) : (
                <div className="w-[270px] h-[380px] flex-shrink-0 snap-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                  <Layers size={36} className="text-white/40" />
                  <p className="text-white/50 text-sm text-center px-4">Nenhum item nesta coleção ainda</p>
                </div>
              )}
            </div>
          </div>

          {collection.items.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {collection.items.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeItem ? `w-4 h-1.5 ${cfg.dot}` : 'w-1.5 h-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-4">
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-xs">
                {completedCount} de {totalItems} {totalItems === 1 ? 'provado' : 'provados'}
              </span>
              <span className="text-[#c5a96d] text-xs font-bold">{ptsEarned} pts</span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${cfg.dot}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          <AnimatePresence>
            {hasNext && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1 mt-3"
              >
                <span className="text-white/40 text-[11px] tracking-wide">
                  {nextLabel ?? 'Próxima coleção'}
                </span>
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                >
                  <ChevronDown size={18} className="text-white/40" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-regions slide ─────────────────────────────────────────────────────────
function SubRegionsSlide({
  subRegions,
  regionName,
  countryName,
  isFirst,
  onBack,
}: {
  subRegions: SubRegion[];
  regionName: string;
  countryName?: string;
  isFirst: boolean;
  onBack: () => void;
}) {
  return (
    <div className="relative h-screen snap-start flex flex-col overflow-hidden bg-neutral-50">
      {/* Header — matches CountryDetail header style */}
      <div
        className="bg-white border-b border-neutral-200 px-5 pb-4 flex-shrink-0"
        style={{ paddingTop: isFirst ? '48px' : '196px' }}
      >
        {isFirst && (
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-neutral-700" />
            </motion.button>
            <div className="min-w-0">
              {countryName && (
                <p className="text-[#c5a96d] text-[11px] font-semibold uppercase tracking-widest">{countryName}</p>
              )}
              <h1 className="text-neutral-900 font-bold text-lg leading-tight truncate">{regionName}</h1>
            </div>
          </div>
        )}

        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
          Sub-regiões de {regionName}
        </h2>
      </div>

      {/* Sub-region cards — same style as CountryDetail regions */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {subRegions.map((sr, i) => (
          <motion.div
            key={sr.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
          >
            <Link to={`/region/${sr.id}`}>
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-40">
                  <img
                    src={sr.image_url}
                    alt={sr.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{sr.name}</h3>
                    {sr.description && (
                      <p className="text-neutral-200 text-sm line-clamp-1">{sr.description}</p>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Ver coleções</span>
                  <ChevronRight size={20} className="text-neutral-400" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RegionDetail() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const [regionName, setRegionName] = useState('');
  const [countryName, setCountryName] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [subRegions, setSubRegions] = useState<SubRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    const handleUpdate = () => setProgress(getProgress());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!regionId) return;
    const load = async () => {
      // 1. Region + country + sub-regions (parallel)
      const [{ data: region }, { data: subs }] = await Promise.all([
        supabase.from('regions').select('id, name, country_id').eq('id', regionId).single(),
        supabase.from('regions').select('id, name, image_url, description')
          .eq('parent_id', regionId)
          .order('name'),
      ]);

      if (!region) { setLoading(false); return; }
      setRegionName(region.name);
      setCountryId(region.country_id);
      setSubRegions(subs ?? []);

      const { data: country } = await supabase
        .from('countries').select('name').eq('id', region.country_id).single();
      if (country) setCountryName(country.name);

      // 2. Collections for this region
      const { data: rcLinks } = await supabase
        .from('region_collections').select('collection_id').eq('region_id', regionId);
      const collectionIds = (rcLinks ?? []).map(r => r.collection_id);

      if (collectionIds.length === 0) { setLoading(false); return; }

      const { data: cols } = await supabase
        .from('collections').select('*').in('id', collectionIds);

      // 3. Items for all collections
      const { data: ciLinks } = await supabase
        .from('collection_items').select('collection_id, item_id').in('collection_id', collectionIds);
      const itemIds = [...new Set((ciLinks ?? []).map(ci => ci.item_id))];

      let itemMap: Record<string, WineItem> = {};
      if (itemIds.length > 0) {
        const { data: wines } = await supabase
          .from('wine_items')
          .select('*, brands(name)')
          .in('id', itemIds);
        for (const w of wines ?? []) {
          const brand = w.brands as { name: string } | null;
          itemMap[w.id] = {
            id: w.id, name: w.name, description: w.description,
            type: w.type, imageUrl: w.image_url, points: w.points, level: w.level,
            wineType: w.wine_type,
            elaborationMethod: w.elaboration_method,
            brandName: brand?.name ?? null,
          };
        }
      }

      // 4. Build Collection objects
      const colItemsMap: Record<string, WineItem[]> = {};
      for (const ci of ciLinks ?? []) {
        if (!colItemsMap[ci.collection_id]) colItemsMap[ci.collection_id] = [];
        if (itemMap[ci.item_id]) colItemsMap[ci.collection_id].push(itemMap[ci.item_id]);
      }

      const built: Collection[] = (cols ?? []).map(c => ({
        id: c.id, title: c.title, description: c.description,
        level: c.level, coverImage: c.cover_image, totalPoints: c.total_points,
        items: colItemsMap[c.id] ?? [],
      }));

      setAllCollections(built);
      setLoading(false);
    };
    load();
  }, [regionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!regionName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <p className="text-neutral-400">Região não encontrada</p>
      </div>
    );
  }

  const hasSubRegions = subRegions.length > 0;
  const hasCollections = allCollections.length > 0;
  const showEmpty = !hasCollections && !hasSubRegions;

  const handleBack = () => navigate(-1);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Snap scroll container */}
      <div className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {/* Collection slides */}
        {allCollections.map((collection, index) => {
          const isLast = index === allCollections.length - 1;
          const nextLabel = isLast && hasSubRegions ? 'Sub-regiões' : undefined;
          return (
            <CollectionSlide
              key={collection.id}
              collection={collection}
              progress={progress}
              isFirst={index === 0}
              hasNext={!isLast || hasSubRegions}
              nextLabel={nextLabel}
              regionName={regionName}
              countryName={countryName}
              onBack={handleBack}
            />
          );
        })}

        {/* Sub-regions slide */}
        {hasSubRegions && (
          <SubRegionsSlide
            subRegions={subRegions}
            regionName={regionName}
            countryName={countryName}
            isFirst={!hasCollections}
            onBack={handleBack}
          />
        )}

        {/* Empty state — no collections AND no sub-regions */}
        {showEmpty && (
          <div className="h-screen snap-start relative flex flex-col items-center justify-center bg-neutral-950">
            <div className="px-5 pt-14 pb-6 absolute top-0 left-0 right-0">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center"
                >
                  <ArrowLeft size={18} className="text-white" />
                </motion.button>
                <div>
                  {countryName && (
                    <p className="text-[#c5a96d] text-[11px] font-semibold uppercase tracking-widest">{countryName}</p>
                  )}
                  <h1 className="text-white font-bold text-lg">{regionName}</h1>
                </div>
              </div>
            </div>
            <Layers size={48} className="text-white/20 mb-4" />
            <p className="text-white/40 text-sm">Nenhuma coleção cadastrada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
