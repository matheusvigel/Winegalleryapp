import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ItemCard } from './ItemCard';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, WineItem } from '../types';
import { getProgress } from '../utils/storage';

const LEVEL_CONFIG = {
  essential: { label: 'Essencial', pill: 'bg-[#2D3A3A] text-white', dot: 'bg-[#3d5050]' },
  escape: { label: 'Fugir do Óbvio', pill: 'bg-[#400264] text-white', dot: 'bg-[#5a0389]' },
  icon: { label: 'Ícone', pill: 'bg-[#690037] text-white', dot: 'bg-[#8a004a]' },
} as const;

type Level = keyof typeof LEVEL_CONFIG;
type SubRegion = { id: string; name: string; image_url: string; description: string };

// Height accounting for sticky Root header (h-14 = 56px)
const SLIDE_H = 'calc(100dvh - 56px)';

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({
  countryName,
  countryId,
  regionName,
  onBack,
}: {
  countryName?: string;
  countryId?: string;
  regionName: string;
  onBack: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-black/[0.07] border border-black/[0.08] flex items-center justify-center flex-shrink-0"
      >
        <ArrowLeft size={18} className="text-[#2D3A3A]" />
      </motion.button>
      <nav className="min-w-0 flex-1" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 flex-wrap">
          <li>
            <Link to="/regions" className="text-neutral-400 text-[10px] hover:text-neutral-600 transition-colors">
              Regiões
            </Link>
          </li>
          {countryName && countryId && (
            <>
              <li><ChevronRight size={9} className="text-neutral-300 flex-shrink-0" /></li>
              <li>
                <Link
                  to={`/country/${countryId}`}
                  className="text-[#F1BD85] text-[10px] font-medium hover:text-[#c49040] transition-colors"
                >
                  {countryName}
                </Link>
              </li>
            </>
          )}
          <li><ChevronRight size={9} className="text-neutral-300 flex-shrink-0" /></li>
          <li className="text-[#2D3A3A] text-[10px] font-medium truncate">{regionName}</li>
        </ol>
        <h1 className="font-gelica text-[#2D3A3A] font-bold text-xl leading-tight mt-0.5 truncate">
          {regionName}
        </h1>
      </nav>
    </div>
  );
}

// ─── Collection slide ──────────────────────────────────────────────────────────
function CollectionSlide({
  collection,
  progress,
  isFirst,
  hasNext,
  nextLabel,
  regionName,
  countryName,
  countryId,
  onBack,
}: {
  collection: Collection;
  progress: ReturnType<typeof getProgress>;
  isFirst: boolean;
  hasNext: boolean;
  nextLabel?: string;
  regionName: string;
  countryName?: string;
  countryId?: string;
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
    <div
      id={`collection-${collection.id}`}
      className="snap-start flex flex-col bg-[#F0EBE0] overflow-hidden"
      style={{ minHeight: SLIDE_H }}
    >
      {/* ── Breadcrumb / back — only on first slide ─── */}
      {isFirst ? (
        <Breadcrumb
          countryName={countryName}
          countryId={countryId}
          regionName={regionName}
          onBack={onBack}
        />
      ) : (
        <div className="h-5 flex-shrink-0" />
      )}

      {/* ── Cover image (contained card) ──────────────── */}
      {collection.coverImage && (
        <div
          className="mx-4 flex-shrink-0 rounded-2xl overflow-hidden border border-black/[0.05]"
          style={{ height: '30vw', maxHeight: 148, minHeight: 88 }}
        >
          <img
            src={collection.coverImage}
            alt={collection.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* ── Collection info ────────────────────────────── */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${cfg.pill}`}>
            {cfg.label}
          </span>
          <span className="text-[#F1BD85] text-xs font-bold">{collection.totalPoints} pts total</span>
        </div>
        <h2 className="font-gelica text-[#2D3A3A] text-[22px] font-bold leading-tight mb-2">
          {collection.title}
        </h2>
        <p className="text-neutral-600 text-[13px] leading-snug">
          {collection.description}
        </p>
      </div>

      {/* ── Carousel ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden min-h-0 py-2">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          <div className="flex gap-3 px-5" style={{ width: 'max-content' }}>
            {collection.items.length > 0 ? (
              collection.items.map(item => (
                <div key={item.id} className="w-[260px] flex-shrink-0 snap-center">
                  <ItemCard item={item} />
                </div>
              ))
            ) : (
              <div className="w-[260px] h-[360px] flex-shrink-0 snap-center rounded-2xl border border-black/[0.07] bg-black/[0.03] flex flex-col items-center justify-center gap-3">
                <Layers size={36} className="text-neutral-300" />
                <p className="text-neutral-400 text-sm text-center px-4">Nenhum item nesta coleção ainda</p>
              </div>
            )}
          </div>
        </div>

        {collection.items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {collection.items.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeItem ? `w-4 h-1.5 ${cfg.dot}` : 'w-1.5 h-1.5 bg-neutral-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Progress + next hint ───────────────────────── */}
      <div className="px-5 pb-24 flex-shrink-0 pt-2">
        <div className="bg-black/[0.04] rounded-2xl p-3 border border-black/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-xs">
              {completedCount} de {totalItems} {totalItems === 1 ? 'provado' : 'provados'}
            </span>
            <span className="text-[#F1BD85] text-xs font-bold">{ptsEarned} pts</span>
          </div>
          <div className="h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
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
              <span className="text-neutral-400 text-[11px] tracking-wide">
                {nextLabel ?? 'Próxima coleção'}
              </span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              >
                <ChevronDown size={18} className="text-neutral-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-regions slide ─────────────────────────────────────────────────────────
function SubRegionsSlide({
  subRegions,
  regionName,
  countryName,
  countryId,
  isFirst,
  hasNext,
  onBack,
}: {
  subRegions: SubRegion[];
  regionName: string;
  countryName?: string;
  countryId?: string;
  isFirst: boolean;
  hasNext: boolean;
  onBack: () => void;
}) {
  return (
    <div
      className="snap-start flex flex-col bg-[#F0EBE0]"
      style={{ minHeight: SLIDE_H }}
    >
      {/* Header */}
      <div className="flex-shrink-0">
        {isFirst && (
          <Breadcrumb
            countryName={countryName}
            countryId={countryId}
            regionName={regionName}
            onBack={onBack}
          />
        )}
        <div className="px-5 pb-3 border-b border-black/[0.07]" style={{ paddingTop: isFirst ? 0 : '20px' }}>
          <h2 className="font-gelica text-[#2D3A3A] text-lg font-semibold">
            Sub-regiões de {regionName}
          </h2>
        </div>
      </div>

      {/* Sub-region cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: '96px' }}>
        {subRegions.map((sr, i) => (
          <motion.div
            key={sr.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
          >
            <Link to={`/region/${sr.id}`}>
              <div className="bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm active:scale-[0.98] transition-transform">
                <div className="relative h-36">
                  {sr.image_url ? (
                    <img
                      src={sr.image_url}
                      alt={sr.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-gelica text-xl text-white font-semibold uppercase tracking-wide">
                      {sr.name}
                    </h3>
                    {sr.description && (
                      <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{sr.description}</p>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Ver coleções</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {hasNext && (
          <div className="flex flex-col items-center gap-1 pt-2">
            <span className="text-neutral-400 text-[11px] tracking-wide">Outras regiões</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            >
              <ChevronDown size={18} className="text-neutral-400" />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Other regions slide ───────────────────────────────────────────────────────
function OtherRegionsSlide({
  regions,
  countryName,
  countryId,
  regionName,
  isFirst,
  onBack,
}: {
  regions: SubRegion[];
  countryName?: string;
  countryId?: string;
  regionName: string;
  isFirst: boolean;
  onBack: () => void;
}) {
  if (regions.length === 0) return null;

  return (
    <div
      className="snap-start flex flex-col bg-[#F0EBE0]"
      style={{ minHeight: SLIDE_H }}
    >
      {/* Header */}
      <div className="flex-shrink-0">
        {isFirst && (
          <Breadcrumb
            countryName={countryName}
            countryId={countryId}
            regionName={regionName}
            onBack={onBack}
          />
        )}
        <div className="px-5 pb-3 border-b border-black/[0.07]" style={{ paddingTop: isFirst ? 0 : '20px' }}>
          <h2 className="font-gelica text-[#2D3A3A] text-lg font-semibold">
            Explore mais de {countryName ?? 'Brasil'}
          </h2>
          <p className="text-neutral-500 text-sm mt-0.5">Outras regiões e sub-regiões</p>
        </div>
      </div>

      {/* Region cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: '96px' }}>
        {regions.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
          >
            <Link to={`/region/${r.id}`}>
              <div className="bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm active:scale-[0.98] transition-transform">
                <div className="relative h-36">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-gelica text-xl text-white font-semibold uppercase tracking-wide">
                      {r.name}
                    </h3>
                    {r.description && (
                      <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{r.description}</p>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Ver coleções</span>
                  <ChevronRight size={18} className="text-neutral-300" />
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
  const [otherRegions, setOtherRegions] = useState<SubRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(getProgress());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = () => setProgress(getProgress());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);

  // Update URL hash as user scrolls through collections
  useEffect(() => {
    if (!allCollections.length || !scrollContainerRef.current) return;
    const root = scrollContainerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            window.history.replaceState(null, '', `${window.location.pathname}#${entry.target.id}`);
            break;
          }
        }
      },
      { threshold: 0.5, root }
    );

    allCollections.forEach(c => {
      const el = document.getElementById(`collection-${c.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [allCollections]);

  // Scroll to hash anchor on initial load
  useEffect(() => {
    if (!allCollections.length) return;
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, 80);
    }
  }, [allCollections]);

  useEffect(() => {
    if (!regionId) return;
    const load = async () => {
      const [{ data: region }, { data: subs }] = await Promise.all([
        supabase.from('regions').select('id, name, country_id').eq('id', regionId).single(),
        supabase.from('regions')
          .select('id, name, image_url, description')
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

      // Other regions of the same country (siblings + their children)
      const { data: others } = await supabase
        .from('regions')
        .select('id, name, image_url, description')
        .eq('country_id', region.country_id)
        .neq('id', regionId)
        .order('name');
      setOtherRegions(others ?? []);

      // Collections
      const { data: rcLinks } = await supabase
        .from('region_collections').select('collection_id').eq('region_id', regionId);
      const collectionIds = (rcLinks ?? []).map(r => r.collection_id);

      if (collectionIds.length === 0) { setLoading(false); return; }

      const { data: cols } = await supabase
        .from('collections').select('*').in('id', collectionIds);

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
      <div className="flex items-center justify-center bg-[#F0EBE0]" style={{ height: SLIDE_H }}>
        <p className="text-neutral-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!regionName) {
    return (
      <div className="flex items-center justify-center bg-[#F0EBE0]" style={{ height: SLIDE_H }}>
        <p className="text-neutral-500">Região não encontrada</p>
      </div>
    );
  }

  const hasSubRegions = subRegions.length > 0;
  const hasCollections = allCollections.length > 0;
  const hasOtherRegions = otherRegions.length > 0;
  const showEmpty = !hasCollections && !hasSubRegions;

  const handleBack = () => navigate(-1);

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-[#F0EBE0]"
      style={{ height: SLIDE_H }}
    >
      {/* Collection slides */}
      {allCollections.map((collection, index) => {
        const isLast = index === allCollections.length - 1;
        const nextLabel =
          isLast && hasSubRegions ? 'Sub-regiões' :
          isLast && hasOtherRegions ? 'Outras regiões' :
          undefined;
        return (
          <CollectionSlide
            key={collection.id}
            collection={collection}
            progress={progress}
            isFirst={index === 0}
            hasNext={!isLast || hasSubRegions || hasOtherRegions}
            nextLabel={nextLabel}
            regionName={regionName}
            countryName={countryName}
            countryId={countryId}
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
          countryId={countryId}
          isFirst={!hasCollections}
          hasNext={hasOtherRegions}
          onBack={handleBack}
        />
      )}

      {/* Other regions of the country */}
      {hasOtherRegions && (
        <OtherRegionsSlide
          regions={otherRegions}
          countryName={countryName}
          countryId={countryId}
          regionName={regionName}
          isFirst={!hasCollections && !hasSubRegions}
          onBack={handleBack}
        />
      )}

      {/* Empty state */}
      {showEmpty && (
        <div
          className="snap-start relative flex flex-col items-center justify-center bg-[#F0EBE0]"
          style={{ minHeight: SLIDE_H }}
        >
          <div className="absolute top-0 left-0 right-0">
            <Breadcrumb
              countryName={countryName}
              countryId={countryId}
              regionName={regionName}
              onBack={handleBack}
            />
          </div>
          <Layers size={48} className="text-neutral-300 mb-4" />
          <p className="text-neutral-400 text-sm">Nenhuma coleção cadastrada ainda</p>
        </div>
      )}
    </div>
  );
}
