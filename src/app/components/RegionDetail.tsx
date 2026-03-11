import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ItemCard } from './ItemCard';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, WineItem } from '../types';
import { getProgress } from '../utils/storage';

const LEVEL_CONFIG = {
  essential: { label: 'Essencial', pill: 'bg-[#2D3A3A]/90 border-[#2D3A3A]/40', dot: 'bg-[#2D3A3A]', solid: 'bg-[#2D3A3A]' },
  escape: { label: 'Fugir do Óbvio', pill: 'bg-[#400264]/90 border-[#400264]/40', dot: 'bg-[#400264]', solid: 'bg-[#400264]' },
  icon: { label: 'Ícone', pill: 'bg-[#690037]/90 border-[#690037]/40', dot: 'bg-[#690037]', solid: 'bg-[#690037]' },
} as const;

type Level = keyof typeof LEVEL_CONFIG;
type SubRegion = { id: string; name: string; image_url: string; description: string };

// ─── Collection cover slide ────────────────────────────────────────────────────
function CollectionCoverSlide({
  collection,
  isFirst,
  regionName,
  countryName,
  countryId,
  onBack,
}: {
  collection: Collection;
  isFirst: boolean;
  regionName: string;
  countryName?: string;
  countryId?: string;
  onBack: () => void;
}) {
  const cfg = LEVEL_CONFIG[collection.level as Level] ?? LEVEL_CONFIG.essential;

  return (
    <div className="h-screen snap-start flex flex-col bg-[#f5f0e8] overflow-hidden">
      {/* Header — only on first collection */}
      {isFirst && (
        <div className="flex-shrink-0 px-5 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-neutral-600" />
            </motion.button>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-0.5 flex-wrap text-[11px] text-neutral-400">
                <Link to="/regions" className="hover:text-neutral-600 transition-colors">Regiões</Link>
                {countryName && countryId && (
                  <>
                    <ChevronRight size={10} className="flex-shrink-0" />
                    <Link to={`/country/${countryId}`} className="hover:text-neutral-600 transition-colors">{countryName}</Link>
                  </>
                )}
                <ChevronRight size={10} className="flex-shrink-0" />
                <span className="text-neutral-700 font-medium truncate">{regionName}</span>
              </div>
              <h1 className="font-gelica text-neutral-900 font-bold text-xl leading-tight truncate">{regionName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main content: split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: collection info */}
        <div className="w-[48%] flex flex-col px-5 pt-4 pb-6 overflow-hidden">
          <span className={`self-start px-3 py-1.5 rounded-xl text-[12px] font-bold text-white mb-4 ${cfg.solid}`}>
            {cfg.label}
          </span>
          <h2 className="font-gelica text-[22px] font-bold text-neutral-900 leading-tight mb-3">
            {collection.title}
          </h2>
          {collection.description && (
            <p className="text-neutral-600 text-[13px] leading-relaxed line-clamp-[8]">
              {collection.description}
            </p>
          )}
          {/* Ver vinhos CTA */}
          <div className="mt-auto flex flex-col items-start gap-1 pt-4">
            <span className="text-neutral-400 text-[10px] tracking-widest uppercase">Ver vinhos</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronDown size={18} className="text-neutral-400" />
            </motion.div>
          </div>
        </div>

        {/* Right: first card preview */}
        <div className="flex-1 flex items-center justify-start pl-2 pr-0 overflow-hidden">
          {collection.items.length > 0 ? (
            <div className="flex-shrink-0" style={{ width: 'min(220px, 58vw)' }}>
              <ItemCard item={collection.items[0]} />
            </div>
          ) : (
            <div
              className="flex-shrink-0 rounded-2xl border border-neutral-200 bg-white flex flex-col items-center justify-center gap-3"
              style={{ width: 'min(220px, 58vw)', height: 360 }}
            >
              <Layers size={32} className="text-neutral-300" />
              <p className="text-neutral-400 text-xs text-center px-3">Nenhum item ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Collection cards slide ────────────────────────────────────────────────────
function CollectionCardsSlide({
  collection,
  progress,
  hasNext,
  nextLabel,
}: {
  collection: Collection;
  progress: ReturnType<typeof getProgress>;
  hasNext: boolean;
  nextLabel?: string;
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
    <div className="h-screen snap-start flex flex-col bg-[#f5f0e8] overflow-hidden">
      {/* Compact header strip */}
      <div className="flex-shrink-0 px-5 pt-10 pb-3 flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold text-white ${cfg.solid}`}>
          {cfg.label}
        </span>
        <h3 className="text-neutral-800 text-sm font-semibold flex-1 line-clamp-1">{collection.title}</h3>
        <span className="text-[#A0621A] text-xs font-bold flex-shrink-0">{collection.totalPoints} pts</span>
      </div>

      {/* Carousel — takes all remaining vertical space, centers card vertically */}
      <div className="flex-1 flex items-center overflow-hidden">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
        >
          <div className="flex gap-3 px-5" style={{ width: 'max-content' }}>
            {collection.items.length > 0 ? (
              collection.items.map(item => (
                <div key={item.id} className="flex-shrink-0 snap-center" style={{ width: 'min(250px, 68vw)' }}>
                  <ItemCard item={item} />
                </div>
              ))
            ) : (
              <div
                className="flex-shrink-0 snap-center rounded-2xl border border-neutral-200 bg-white flex flex-col items-center justify-center gap-3"
                style={{ width: 'min(250px, 68vw)', height: 400 }}
              >
                <Layers size={36} className="text-neutral-300" />
                <p className="text-neutral-500 text-sm text-center px-4">Nenhum item nesta coleção ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: dots + progress + next indicator */}
      <div className="flex-shrink-0 px-5 pb-5 pt-3">
        {/* Navigation dots */}
        {collection.items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
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

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-neutral-500 text-xs">
            {completedCount} de {totalItems} {totalItems === 1 ? 'provado' : 'provados'}
          </span>
          <span className="text-[#A0621A] text-xs font-bold">{ptsEarned} pts</span>
        </div>
        <div className="h-1.5 bg-neutral-300 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${cfg.dot}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* Next collection indicator */}
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
                <ChevronDown size={16} className="text-neutral-400" />
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
  isFirst,
  onBack,
}: {
  subRegions: SubRegion[];
  regionName: string;
  countryName?: string;
  isFirst: boolean;
  onBack: () => void;
}) {
  const WINE  = '#690037';
  const TEXT1 = '#1C1B1F';
  const TEXT2 = '#5C5C5C';
  const MUTED = '#9B9B9B';
  const SURF  = '#F5F0E8';
  const BDR   = 'rgba(0,0,0,0.08)';

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#E9E3D9' }} className="snap-start">
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: `1px solid ${BDR}`, padding: '48px 20px 16px', flexShrink: 0 }}>
        {isFirst && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: SURF, border: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
            >
              <ArrowLeft size={17} color={TEXT2} />
            </motion.button>
            <div style={{ minWidth: 0 }}>
              {countryName && (
                <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: WINE }}>{countryName}</p>
              )}
              <h1 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.1rem', color: TEXT1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{regionName}</h1>
            </div>
          </div>
        )}
        <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: MUTED }}>
          Sub-regiões de {regionName}
        </p>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subRegions.map((sr, i) => (
          <motion.div
            key={sr.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
          >
            <Link to={`/region/${sr.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', border: `1px solid ${BDR}` }}>
                <div style={{ position: 'relative', height: 148, backgroundColor: SURF }}>
                  <img src={sr.image_url} alt={sr.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px' }}>
                    <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.2 }}>{sr.name}</h3>
                    {sr.description && (
                      <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {sr.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Footer row + progress bar */}
                <div style={{ padding: '10px 16px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE, fontWeight: 500 }}>Ver coleções</span>
                    <ChevronRight size={15} color={WINE} />
                  </div>
                  <div style={{ position: 'relative', height: 3, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', backgroundColor: '#F1BD85', borderRadius: 99 }} />
                  </div>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
    setLoading(true);
    setAllCollections([]);
    setSubRegions([]);
    setRegionName('');
    setCountryName(undefined);
    setCountryId(undefined);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    const load = async () => {
      const [{ data: region }, { data: subs }] = await Promise.all([
        supabase.from('regions').select('id, name, country_id').eq('id', regionId).single(),
        supabase.from('regions').select('id, name, image_url, description')
          .eq('parent_id', regionId).order('name'),
      ]);

      if (!region) { setLoading(false); return; }
      setRegionName(region.name);
      setCountryId(region.country_id);
      setSubRegions(subs ?? []);

      const { data: country } = await supabase
        .from('countries').select('name').eq('id', region.country_id).single();
      if (country) setCountryName(country.name);

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
          .from('wine_items').select('*, brands(name)').in('id', itemIds);
        for (const w of wines ?? []) {
          const brand = w.brands as { name: string } | null;
          itemMap[w.id] = {
            id: w.id, name: w.name, description: w.description,
            type: w.type, imageUrl: w.image_url, points: w.points, level: w.level,
            wineType: w.wine_type, elaborationMethod: w.elaboration_method,
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
      <div className="fixed inset-0 z-50 bg-[#f5f0e8] flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!regionName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <p className="text-neutral-400">Região não encontrada</p>
      </div>
    );
  }

  const hasSubRegions = subRegions.length > 0;
  const hasCollections = allCollections.length > 0;
  const showEmpty = !hasCollections && !hasSubRegions;
  const handleBack = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f0e8]">
      <div ref={scrollContainerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {/* Two slides per collection: cover + cards */}
        {allCollections.map((collection, index) => {
          const isLastCollection = index === allCollections.length - 1;
          const hasNextAfterCards = !isLastCollection || hasSubRegions;
          const nextLabel = isLastCollection && hasSubRegions ? 'Sub-regiões' : undefined;
          return [
            <CollectionCoverSlide
              key={`cover-${collection.id}`}
              collection={collection}
              isFirst={index === 0}
              regionName={regionName}
              countryName={countryName}
              countryId={countryId}
              onBack={handleBack}
            />,
            <CollectionCardsSlide
              key={`cards-${collection.id}`}
              collection={collection}
              progress={progress}
              hasNext={hasNextAfterCards}
              nextLabel={nextLabel}
            />,
          ];
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

        {/* Empty state */}
        {showEmpty && (
          <div className="h-screen snap-start relative flex flex-col items-center justify-center bg-[#f5f0e8]">
            <div className="px-5 pt-14 pb-6 absolute top-0 left-0 right-0">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  className="w-9 h-9 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center"
                >
                  <ArrowLeft size={18} className="text-neutral-600" />
                </motion.button>
                <div>
                  {countryName && (
                    <p className="text-[#A0621A] text-[11px] font-semibold uppercase tracking-widest">{countryName}</p>
                  )}
                  <h1 className="text-neutral-900 font-bold text-lg">{regionName}</h1>
                </div>
              </div>
            </div>
            <Layers size={48} className="text-neutral-300 mb-4" />
            <p className="text-neutral-400 text-sm">Nenhuma coleção cadastrada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
