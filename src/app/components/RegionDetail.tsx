import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft, ChevronRight, X, MapPin, Share2, Bookmark, Wine as WineIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
} from '../../lib/pointsSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

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

type WineryRow = {
  id: string;
  name: string;
  photo: string | null;
  category: string;
  highlight: string | null;
};

type ItemType = 'wine' | 'experience' | 'winery';

interface UnifiedItem {
  itemId: string;
  itemType: ItemType;
  id: string;
  name: string;
  photo: string;
  subName: string | null;
  location: string | null;
  type: string | null;
  highlight: string | null;
  tastingNote: string | null;
  price_min: number | null;
  price_max: number | null;
}

type ItemState = { tried: boolean; favorite: boolean };

interface ColProgress {
  total: number;
  done: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── ItemModal (same logic as ForYou) ─────────────────────────────────────────

function ItemModal({
  items,
  initialIndex,
  collectionTitle,
  itemStates,
  onClose,
  onToggleTried,
  onToggleFavorite,
}: {
  items: UnifiedItem[];
  initialIndex: number;
  collectionTitle: string;
  itemStates: Record<string, ItemState>;
  onClose: () => void;
  onToggleTried: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [level, setLevel] = useState<0 | 1>(0);
  const touchStartX = useRef<number | null>(null);

  const item = items[index];
  const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
  const isWine = item.itemType === 'wine';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const prev = useCallback(() => { setIndex(i => Math.max(0, i - 1)); setLevel(0); }, []);
  const next = useCallback(() => { setIndex(i => Math.min(items.length - 1, i + 1)); setLevel(0); }, [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) { dx < 0 ? next() : prev(); setLevel(0); }
    touchStartX.current = null;
  };

  const photoHeight = level === 0 ? '60vh' : '38vh';
  const sheetHeight = level === 0 ? '40vh' : '62vh';

  const priceText = item.price_min != null
    ? `R$ ${item.price_min}${item.price_max && item.price_max !== item.price_min ? ` – R$ ${item.price_max}` : ''}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '16px 16px 8px' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X className="w-4 h-4" style={{ color: '#fff' }} />
          </button>
          <div className="text-center">
            <p style={{ fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}>{collectionTitle}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{index + 1} de {items.length}</p>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 className="w-4 h-4" style={{ color: '#fff' }} />
          </button>
        </div>
        {/* Progress segments */}
        <div className="flex gap-1.5 mt-3">
          {items.map((_, i) => (
            <button key={i} onClick={() => { setIndex(i); setLevel(0); }}
              style={{ flex: 1, height: 2, borderRadius: 99, background: i === index ? '#fff' : 'rgba(255,255,255,0.30)' }} />
          ))}
        </div>
      </div>

      {/* Photo */}
      <motion.div
        animate={{ height: photoHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setLevel(l => l === 0 ? 1 : 0)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={item.itemId} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }} style={{ width: '100%', height: '100%' }}>
            {isWine ? (
              <div style={{ width: '100%', height: '100%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 48px 16px' }}>
                <img src={item.photo || FALLBACK} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.22))' }} onError={imgFallback} />
              </div>
            ) : (
              <img src={item.photo || FALLBACK} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: 12, top: '30vh', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0 : 1, pointerEvents: index === 0 ? 'none' : 'auto', zIndex: 15 }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
          <button onClick={next} style={{ position: 'absolute', right: 12, top: '30vh', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === items.length - 1 ? 0 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', zIndex: 15 }}>
            <ChevronRight className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
        </>
      )}

      {/* Bottom sheet */}
      <motion.div
        animate={{ height: sheetHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FFFFFF', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.12)' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
          <AnimatePresence mode="wait">
            {level === 0 ? (
              <motion.div key="level0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>
                  {item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola')}
                </p>
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.375rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 4 }}>{item.name}</h2>
                {item.subName && <p style={{ fontSize: 13, color: '#7A6855', marginBottom: 6 }}>{item.subName}</p>}
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#9B1B4D', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
                  </div>
                )}
                {priceText && <p style={{ fontSize: 18, fontWeight: 700, color: '#1C1209', marginBottom: 14 }}>{priceText}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => onToggleFavorite(item.itemId)} style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`, background: state.favorite ? '#6B0035' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bookmark style={{ width: 18, height: 18, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button onClick={() => onToggleTried(item.itemId)} style={{ flex: 1, borderRadius: 16, background: state.tried ? '#2D4A3E' : '#1F3B36', color: '#fff', fontWeight: 700, fontSize: 14, paddingTop: 14, paddingBottom: 14, boxShadow: '0 4px 16px rgba(31,59,54,0.35)' }}>
                    {state.tried ? '✓ Adicionado à adega' : 'Adicionar à adega'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="level1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {item.type && <span style={{ fontSize: 11, background: '#F5EEF4', color: '#7B1E5C', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>{item.type}</span>}
                </div>
                {item.subName && <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>{item.subName}</p>}
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 6 }}>{item.name}</h2>
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#9B1B4D', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1209' }}>4.8</span>
                  <span style={{ fontSize: 14, color: '#B8820B' }}>🍷🍷🍷🍷🍷</span>
                  <span style={{ fontSize: 11, color: '#B0A090' }}>318 avaliações</span>
                </div>
                <div style={{ height: 1, background: 'rgba(139,90,43,0.12)', marginBottom: 12 }} />
                {(item.tastingNote || item.highlight) && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 8 }}>Como é</p>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: '#5C5048', marginBottom: 14 }}>{item.tastingNote || item.highlight}</p>
                    <div style={{ height: 1, background: 'rgba(139,90,43,0.12)', marginBottom: 12 }} />
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    {item.subName && <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1209' }}>{item.subName}</p>}
                    {priceText && <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1209' }}>{priceText}</p>}
                  </div>
                  <button onClick={() => onToggleFavorite(item.itemId)} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`, background: state.favorite ? '#6B0035' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bookmark style={{ width: 16, height: 16, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button onClick={() => onToggleTried(item.itemId)} style={{ borderRadius: 14, padding: '10px 18px', background: state.tried ? '#2D4A3E' : '#1F3B36', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {state.tried ? '✓ Na adega' : 'Adicionar à adega'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── ReelSlide ─────────────────────────────────────────────────────────────────

function ReelSlide({
  col,
  items,
  progress,
  itemStates,
  onItemClick,
}: {
  col: CollectionRow;
  items: UnifiedItem[];
  progress: ColProgress;
  itemStates: Record<string, ItemState>;
  onItemClick: (items: UnifiedItem[], index: number) => void;
}) {
  const [itemIndex, setItemIndex] = useState(0);
  const slideH = 'calc(100svh - 56px - 64px - 52px)'; // minus fixed region header too

  return (
    <div style={{ height: slideH, scrollSnapAlign: 'start', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
      {/* Hero 62% */}
      <div style={{ height: '62%', position: 'relative', overflow: 'hidden' }}>
        <img src={col.photo || FALLBACK} alt={col.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.10) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 16px' }}>
          <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.70)', marginBottom: 4 }}>Descubra</p>
          <h1 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 6 }}>
            {col.title}
          </h1>
          {col.tagline && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10 }}>
              {col.tagline}
            </p>
          )}
          {items.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 15, minWidth: 60 }}>{itemIndex + 1} — {items.length}</span>
              <button onClick={() => setItemIndex(i => Math.max(0, i - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: itemIndex === 0 ? 0.35 : 1 }}>
                <ChevronLeft style={{ width: 18, height: 18, color: '#fff' }} />
              </button>
              <button onClick={() => setItemIndex(i => Math.min(items.length - 1, i + 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: itemIndex === items.length - 1 ? 0.35 : 1 }}>
                <ChevronRight style={{ width: 18, height: 18, color: '#fff' }} />
              </button>
            </div>
          )}
          {progress.done > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(45,74,62,0.88)', borderRadius: 99, padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
              ✓ {progress.done} de {progress.total} já provados
            </div>
          )}
        </div>
      </div>

      {/* Carousel 38% */}
      <div style={{ height: '38%', background: 'linear-gradient(to bottom, rgba(10,6,3,0.92) 0%, rgba(10,6,3,0.98) 100%)', overflowX: 'auto', display: 'flex', gap: 12, padding: '12px 16px', scrollbarWidth: 'none' }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13 }}>Nenhum item ainda</p>
          </div>
        ) : items.map((item, i) => {
          const isTried = itemStates[item.itemId]?.tried ?? false;
          const isWine = item.itemType === 'wine';
          const isActive = i === itemIndex;
          return (
            <div key={item.itemId} onClick={() => onItemClick(items, i)} style={{ width: 110, flexShrink: 0, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', outline: isActive ? '2px solid rgba(255,255,255,0.70)' : 'none' }} className="active:scale-95">
              <div style={{ height: 130, background: isWine ? '#F5F0E8' : '#2A1A10', position: 'relative', overflow: 'hidden' }}>
                <img src={item.photo || FALLBACK} alt={item.name} style={{ width: '100%', height: '100%', objectFit: isWine ? 'contain' : 'cover', padding: isWine ? 8 : 0 }} onError={imgFallback} />
                {isTried && (
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: '#2D4A3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                )}
              </div>
              <div style={{ background: '#fff', padding: '6px 8px 8px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 2 }}>
                  {item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Exp.' : 'Vinícola')}
                </p>
                <p style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: 11, fontWeight: 700, color: '#1C1209', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                  {item.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function RegionDetail() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [region, setRegion] = useState<RegionRow | null>(null);
  const [parent, setParent] = useState<RegionRow | null>(null);
  const [subRegions, setSubRegions] = useState<RegionRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [wineries, setWineries] = useState<WineryRow[]>([]);
  const [itemsByCollection, setItemsByCollection] = useState<Record<string, UnifiedItem[]>>({});
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ items: UnifiedItem[]; index: number; colTitle: string } | null>(null);

  useEffect(() => {
    if (!regionId) return;
    setLoading(true);

    const load = async () => {
      const { data: reg } = await supabase
        .from('regions').select('id, name, photo, description, level, parent_id')
        .eq('id', regionId).maybeSingle();
      if (!reg) { setLoading(false); return; }
      setRegion(reg);

      if (reg.parent_id) {
        const { data: par } = await supabase
          .from('regions').select('id, name, photo, description, level, parent_id')
          .eq('id', reg.parent_id).maybeSingle();
        setParent(par ?? null);
      } else {
        setParent(null);
      }

      const [{ data: subs }, { data: wins }, { data: cols }] = await Promise.all([
        supabase.from('regions').select('id, name, photo, description, level, parent_id')
          .eq('parent_id', regionId).order('position').order('name'),
        supabase.from('wineries').select('id, name, photo, category, highlight')
          .or(`region_id.eq.${regionId},sub_region_id.eq.${regionId}`)
          .order('name').limit(40),
        supabase.from('collections')
          .select('id, title, tagline, photo, category, content_type')
          .or(`region_id.eq.${regionId},country_id.eq.${regionId},sub_region_id.eq.${regionId}`)
          .order('title'),
      ]);
      setSubRegions(subs ?? []);
      setWineries((wins ?? []) as WineryRow[]);
      setCollections(cols ?? []);

      const colIds = (cols ?? []).map((c: CollectionRow) => c.id);
      if (colIds.length > 0) {
        const { data: ciRows } = await supabase
          .from('collection_items')
          .select('item_id, collection_id, item_type, position')
          .in('collection_id', colIds)
          .order('position');

        const rawItems = (ciRows ?? []) as { item_id: string; collection_id: string; item_type: string; position: number }[];

        const wineIds = rawItems.filter(r => !r.item_type || r.item_type === 'wine').map(r => r.item_id);
        const expIds = rawItems.filter(r => r.item_type === 'experience').map(r => r.item_id);
        const wineryIds = rawItems.filter(r => r.item_type === 'winery').map(r => r.item_id);

        const [{ data: wineRows }, { data: expRows }, { data: wineryRows }] = await Promise.all([
          wineIds.length
            ? supabase.from('wines').select('id, name, photo, highlight, tasting_note, type, price_min, price_max, wineries(name, region:region_id(name))').in('id', wineIds)
            : Promise.resolve({ data: [] }),
          expIds.length
            ? supabase.from('experiences').select('id, name, photo, highlight, category, winery:winery_id(name), region:region_id(name)').in('id', expIds)
            : Promise.resolve({ data: [] }),
          wineryIds.length
            ? supabase.from('wineries').select('id, name, photo, highlight, category, region:region_id(name)').in('id', wineryIds)
            : Promise.resolve({ data: [] }),
        ]);

        const wineMap = new Map((wineRows ?? []).map((r: any) => [r.id, r]));
        const expMap = new Map((expRows ?? []).map((r: any) => [r.id, r]));
        const wineryMap2 = new Map((wineryRows ?? []).map((r: any) => [r.id, r]));

        const byColRaw: Record<string, { item_id: string; item_type: string }[]> = {};
        for (const ci of rawItems) {
          if (!byColRaw[ci.collection_id]) byColRaw[ci.collection_id] = [];
          byColRaw[ci.collection_id].push({ item_id: ci.item_id, item_type: ci.item_type });
        }

        const byCol: Record<string, UnifiedItem[]> = {};
        for (const [colId, ciList] of Object.entries(byColRaw)) {
          byCol[colId] = ciList.flatMap(ci => {
            const t = ci.item_type || 'wine';
            if (t === 'wine') {
              const w = wineMap.get(ci.item_id) as any;
              if (!w) return [];
              return [{ itemId: ci.item_id, itemType: 'wine' as ItemType, id: w.id, name: w.name, photo: w.photo ?? '', subName: (w.wineries as any)?.name ?? null, location: (w.wineries as any)?.region?.name ?? null, type: w.type ?? null, highlight: w.highlight ?? null, tastingNote: w.tasting_note ?? null, price_min: w.price_min ?? null, price_max: w.price_max ?? null }];
            }
            if (t === 'experience') {
              const e = expMap.get(ci.item_id) as any;
              if (!e) return [];
              return [{ itemId: ci.item_id, itemType: 'experience' as ItemType, id: e.id, name: e.name, photo: e.photo ?? '', subName: (e.winery as any)?.name ?? null, location: (e.region as any)?.name ?? null, type: e.category ?? null, highlight: e.highlight ?? null, tastingNote: null, price_min: null, price_max: null }];
            }
            if (t === 'winery') {
              const w = wineryMap2.get(ci.item_id) as any;
              if (!w) return [];
              return [{ itemId: ci.item_id, itemType: 'winery' as ItemType, id: w.id, name: w.name, photo: w.photo ?? '', subName: null, location: (w.region as any)?.name ?? null, type: w.category ?? null, highlight: w.highlight ?? null, tastingNote: null, price_min: null, price_max: null }];
            }
            return [];
          });
        }
        setItemsByCollection(byCol);

        if (user) {
          const allItemIds = rawItems.map(ci => ci.item_id);
          if (allItemIds.length > 0) {
            const { data: prog } = await supabase
              .from('user_progress')
              .select('item_id, completed, is_favorite')
              .eq('user_id', user.id)
              .in('item_id', allItemIds);
            const states: Record<string, ItemState> = {};
            const cIds = new Set<string>();
            for (const p of (prog ?? []) as any[]) {
              states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false };
              if (p.completed) cIds.add(p.item_id);
            }
            setItemStates(states);
            setCompletedIds(cIds);
          }
        }
      }

      setLoading(false);
    };

    load();
  }, [regionId, user]);

  const getProgress = useCallback((colId: string): ColProgress => {
    const items = itemsByCollection[colId] ?? [];
    const done = items.filter(item => completedIds.has(item.itemId)).length;
    return { total: items.length, done };
  }, [itemsByCollection, completedIds]);

  const toggleTried = useCallback(async (itemId: string) => {
    if (!user) return;
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const allItems = Object.values(itemsByCollection).flat();
    const found = allItems.find(i => i.itemId === itemId);
    const itemType = found?.itemType ?? 'wine';
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: !current.tried } }));
    setCompletedIds(prev => { const next = new Set(prev); current.tried ? next.delete(itemId) : next.add(itemId); return next; });
    await psToggleTried(user.id, itemId, itemType, current.tried);
  }, [user, itemStates, itemsByCollection]);

  const toggleFavorite = useCallback(async (itemId: string) => {
    if (!user) return;
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const allItems = Object.values(itemsByCollection).flat();
    const found = allItems.find(i => i.itemId === itemId);
    const itemType = found?.itemType ?? 'wine';
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, favorite: !current.favorite } }));
    await psToggleFavorite(user.id, itemId, itemType, current.favorite);
  }, [user, itemStates, itemsByCollection]);

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E3D9' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(107,0,53,0.15)', borderTopColor: '#6B0035' }} className="animate-spin" />
      </div>
    );
  }

  if (!region) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E3D9' }}>
        <div className="text-center">
          <p style={{ color: '#7A6855', marginBottom: 8 }}>Região não encontrada</p>
          <Link to="/" style={{ color: '#6B0035' }}>Voltar para início</Link>
        </div>
      </div>
    );
  }

  const hasCollections = collections.length > 0;
  const hasSubRegions = subRegions.length > 0;

  return (
    <>
      {/* ── Fixed region header ────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 40,
        background: 'rgba(233,227,217,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(139,90,43,0.12)',
      }}>
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(28,18,9,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft style={{ width: 20, height: 20, color: '#1C1209' }} />
          </button>
          <div>
            <p style={{ fontSize: 10, color: '#B0A090', lineHeight: 1 }}>
              Explorar{parent ? ` › ${parent.name}` : ''}
            </p>
            <h1 style={{ fontFamily: '"Fraunces",Georgia,serif', color: '#1C1209', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
              {region.name}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {hasCollections ? (
        /* Reels scroll */
        <div style={{
          marginTop: 56 + 52, // global header + region header
          height: 'calc(100svh - 56px - 64px - 52px)',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          background: '#000',
        }}>
          {collections.map(col => (
            <ReelSlide
              key={col.id}
              col={col}
              items={itemsByCollection[col.id] ?? []}
              progress={getProgress(col.id)}
              itemStates={itemStates}
              onItemClick={(items, index) => setModalState({ items, index, colTitle: col.title })}
            />
          ))}
        </div>
      ) : (
        /* Fallback: conventional layout */
        <div style={{ paddingTop: 56 + 52, minHeight: '100svh', background: '#E9E3D9' }}>
          {/* Region hero */}
          {region.photo && (
            <div style={{ margin: '16px 16px 0', borderRadius: 20, overflow: 'hidden', height: 200, position: 'relative' }}>
              <img src={region.photo} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.10) 60%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 16px' }}>
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{region.name}</h2>
                {region.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>{region.description}</p>}
              </div>
            </div>
          )}

          {/* Sub-regiões */}
          {hasSubRegions && (
            <div style={{ padding: '20px 16px 0' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0A090', marginBottom: 12 }}>
                Sub-regiões de {region.name}
              </p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {subRegions.map(sr => (
                  <Link key={sr.id} to={`/region/${sr.id}`} style={{ flexShrink: 0, width: 140, borderRadius: 16, overflow: 'hidden', textDecoration: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ height: 90, position: 'relative', background: '#E9E3D9' }}>
                      {sr.photo && <img src={sr.photo} alt={sr.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback} />}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 60%)' }} />
                      <p style={{ position: 'absolute', bottom: 8, left: 8, right: 8, fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{sr.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Vinícolas */}
          {wineries.length > 0 && (
            <div style={{ padding: '20px 16px 0' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0A090', marginBottom: 12 }}>
                Vinícolas de {region.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {wineries.map(w => (
                  <Link key={w.id} to={`/winery/${w.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 14, padding: 12, textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: '#E9E3D9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {w.photo ? <img src={w.photo} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback} /> : <WineIcon style={{ width: 20, height: 20, color: '#B0A090' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: 14, fontWeight: 700, color: '#1C1209', marginBottom: 2 }}>{w.name}</p>
                      {w.category && <span style={{ fontSize: 10, background: '#FFF8EC', color: '#B8820B', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>{w.category}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!hasCollections && !hasSubRegions && wineries.length === 0 && (
            <div style={{ padding: '80px 16px', textAlign: 'center' }}>
              <p style={{ color: '#B0A090', fontSize: 14 }}>Nenhuma coleção cadastrada ainda para esta região.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Item modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalState && (
          <ItemModal
            items={modalState.items}
            initialIndex={modalState.index}
            collectionTitle={modalState.colTitle}
            itemStates={itemStates}
            onClose={() => setModalState(null)}
            onToggleTried={toggleTried}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </>
  );
}
