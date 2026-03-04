import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ItemCard } from './ItemCard';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, WineItem } from '../types';
import { getProgress } from '../utils/storage';

const LEVEL_CONFIG = {
  essential: { label: 'Essencial', pill: 'bg-emerald-500/80 border-emerald-400/40', dot: 'bg-emerald-400' },
  escape: { label: 'Fugir do Óbvio', pill: 'bg-sky-500/80 border-sky-400/40', dot: 'bg-sky-400' },
  icon: { label: 'Ícone', pill: 'bg-amber-500/80 border-amber-400/40', dot: 'bg-amber-400' },
} as const;

type Level = keyof typeof LEVEL_CONFIG;

function CollectionSlide({
  collection,
  progress,
  isFirst,
  hasNext,
  regionName,
  countryName,
  onBack,
}: {
  collection: Collection;
  progress: ReturnType<typeof getProgress>;
  isFirst: boolean;
  hasNext: boolean;
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

  // Item carousel dot tracking
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
      {/* Background */}
      <img
        src={collection.coverImage}
        alt={collection.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 via-40% to-black/85" />

      {/* === FIXED-POSITION HEADER (only rendered inside first slide to avoid duplication) === */}
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 z-30 pt-12 pb-4 px-5 bg-gradient-to-b from-black/50 to-transparent">
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
                <p className="text-rose-300 text-[11px] font-medium uppercase tracking-wide">{countryName}</p>
              )}
              <h1 className="text-white font-bold text-lg leading-tight truncate">{regionName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* === SLIDE CONTENT === */}
      <div className="relative z-10 flex flex-col h-full" style={{ paddingTop: isFirst ? '96px' : '48px' }}>
        {/* Collection info */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold text-white backdrop-blur-md border ${cfg.pill}`}
            >
              {cfg.label}
            </span>
            <span className="text-amber-300 text-xs font-bold">{collection.totalPoints} pts total</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight mb-1">{collection.title}</h2>
          <p className="text-white/65 text-[13px] leading-snug line-clamp-2">{collection.description}</p>
        </div>

        {/* Items horizontal carousel */}
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
                  <p className="text-white/50 text-sm text-center px-4">
                    Nenhum item nesta coleção ainda
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Item dots */}
          {collection.items.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {collection.items.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeItem
                      ? `w-4 h-1.5 ${cfg.dot}`
                      : 'w-1.5 h-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-xs">
                {completedCount} de {totalItems} {totalItems === 1 ? 'provado' : 'provados'}
              </span>
              <span className="text-amber-300 text-xs font-bold">{ptsEarned} pts</span>
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

          {/* Scroll hint */}
          <AnimatePresence>
            {hasNext && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1 mt-3"
              >
                <span className="text-white/40 text-[11px] tracking-wide">Próxima coleção</span>
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

// ─── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border backdrop-blur-md ${
        active
          ? `${color} text-white border-transparent shadow-lg`
          : 'bg-white/10 text-white/70 border-white/15'
      }`}
    >
      {label}
    </motion.button>
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
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
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
      // 1. Region + country
      const { data: region } = await supabase
        .from('regions').select('id, name, country_id').eq('id', regionId).single();
      if (!region) { setLoading(false); return; }
      setRegionName(region.name);
      setCountryId(region.country_id);

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

  const regionCollections = allCollections;

  const essentialCount = regionCollections.filter(c => c.level === 'essential').length;
  const escapeCount = regionCollections.filter(c => c.level === 'escape').length;
  const iconCount = regionCollections.filter(c => c.level === 'icon').length;

  const filteredCollections =
    selectedLevel === 'all'
      ? regionCollections
      : regionCollections.filter(c => c.level === selectedLevel);

  const handleBack = () => {
    if (countryId) navigate(`/country/${countryId}`);
    else navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Filter bar — floats on top, always visible */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-3"
             style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 148px)' }}>
          <FilterPill
            label={`Todas (${regionCollections.length})`}
            active={selectedLevel === 'all'}
            color="bg-rose-800"
            onClick={() => setSelectedLevel('all')}
          />
          {essentialCount > 0 && (
            <FilterPill
              label={`Essencial (${essentialCount})`}
              active={selectedLevel === 'essential'}
              color="bg-emerald-600"
              onClick={() => setSelectedLevel('essential')}
            />
          )}
          {escapeCount > 0 && (
            <FilterPill
              label={`Fugir do Óbvio (${escapeCount})`}
              active={selectedLevel === 'escape'}
              color="bg-sky-600"
              onClick={() => setSelectedLevel('escape')}
            />
          )}
          {iconCount > 0 && (
            <FilterPill
              label={`Ícones (${iconCount})`}
              active={selectedLevel === 'icon'}
              color="bg-amber-600"
              onClick={() => setSelectedLevel('icon')}
            />
          )}
        </div>
      </div>

      {/* Snap scroll container */}
      <div className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection, index) => (
            <CollectionSlide
              key={collection.id}
              collection={collection}
              progress={progress}
              isFirst={index === 0}
              hasNext={index < filteredCollections.length - 1}
              regionName={regionName}
              countryName={countryName}
              onBack={handleBack}
            />
          ))
        ) : (
          /* Empty state — fullscreen */
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
                    <p className="text-rose-300 text-[11px] uppercase tracking-wide">{countryName}</p>
                  )}
                  <h1 className="text-white font-bold text-lg">{regionName}</h1>
                </div>
              </div>
            </div>
            <Layers size={48} className="text-white/20 mb-4" />
            <p className="text-white/40 text-sm">Nenhuma coleção neste filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
