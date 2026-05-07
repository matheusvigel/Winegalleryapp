import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X, Search, Bookmark, MapPin, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PROFILE_LABELS, PROFILE_ICONS, type WineProfile } from '../../lib/profileConstants';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
} from '../../lib/pointsSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProfileData {
  wine_profile: WineProfile;
  total_points: number;
  user_level: string;
  display_name: string;
  quiz_completed: boolean;
}

interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
  category: string;
  country:    { name: string } | null;
  region:     { name: string } | null;
  sub_region: { name: string } | null;
}

interface ProfileRule {
  category: string;
  priority: number;
  visible: boolean;
}

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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines: 'Vinhos', Vinhos: 'Vinhos',
  wineries: 'Vinícolas', Vinícolas: 'Vinícolas',
  experiences: 'Experiências', Experiências: 'Experiências',
  grapes: 'Uvas', mix: 'Mix', brotherhoods: 'Confrarias',
};

// ── useIsDesktop ──────────────────────────────────────────────────────────────

function useIsDesktop() {
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setV(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return v;
}

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── ItemModal ─────────────────────────────────────────────────────────────────

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

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard navigation
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

  // Touch swipe
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
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px 16px 8px',
      }}>
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X className="w-4 h-4" style={{ color: '#fff' }} />
          </button>
          <div className="text-center">
            <p style={{ fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {collectionTitle}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{index + 1} de {items.length}</p>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Share2 className="w-4 h-4" style={{ color: '#fff' }} />
          </button>
        </div>

        {/* Progress segments */}
        <div className="flex gap-1.5 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); setLevel(0); }}
              style={{
                flex: 1, height: 2, borderRadius: 99,
                background: i === index ? '#fff' : 'rgba(255,255,255,0.30)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Photo ─────────────────────────────────────────────────────── */}
      <motion.div
        animate={{ height: photoHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setLevel(l => l === 0 ? 1 : 0)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={item.itemId}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            {isWine ? (
              <div style={{ width: '100%', height: '100%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 48px 16px' }}>
                <img
                  src={item.photo || FALLBACK}
                  alt={item.name}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.22))' }}
                  onError={imgFallback}
                />
              </div>
            ) : (
              <img
                src={item.photo || FALLBACK}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={imgFallback}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Prev/Next arrows on photo */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: 'absolute', left: 12, top: '30vh', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === 0 ? 0 : 1, pointerEvents: index === 0 ? 'none' : 'auto', zIndex: 15,
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
          <button
            onClick={next}
            style={{
              position: 'absolute', right: 12, top: '30vh', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === items.length - 1 ? 0 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', zIndex: 15,
            }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
        </>
      )}

      {/* ── Bottom sheet ──────────────────────────────────────────────── */}
      <motion.div
        animate={{ height: sheetHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
          <AnimatePresence mode="wait">
            {level === 0 ? (
              <motion.div
                key="level0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Type */}
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>
                  {item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola')}
                </p>
                {/* Name */}
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.375rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 4 }}>
                  {item.name}
                </h2>
                {/* SubName */}
                {item.subName && (
                  <p style={{ fontSize: 13, color: '#7A6855', marginBottom: 6 }}>{item.subName}</p>
                )}
                {/* Location */}
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#9B1B4D', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
                  </div>
                )}
                {/* Price */}
                {priceText && (
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#1C1209', marginBottom: 14 }}>{priceText}</p>
                )}
                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => onToggleFavorite(item.itemId)}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`,
                      background: state.favorite ? '#6B0035' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Bookmark style={{ width: 18, height: 18, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={() => onToggleTried(item.itemId)}
                    style={{
                      flex: 1, borderRadius: 16,
                      background: state.tried ? '#2D4A3E' : '#1F3B36',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      paddingTop: 14, paddingBottom: 14,
                      boxShadow: '0 4px 16px rgba(31,59,54,0.35)',
                    }}
                  >
                    {state.tried ? '✓ Adicionado à adega' : 'Adicionar à adega'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="level1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Tags pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {item.type && (
                    <span style={{ fontSize: 11, background: '#F5EEF4', color: '#7B1E5C', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
                      {item.type}
                    </span>
                  )}
                  {item.itemType === 'wine' && (
                    <span style={{ fontSize: 11, background: '#FFF8EC', color: '#B8820B', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
                      ★ Edição especial
                    </span>
                  )}
                </div>
                {/* SubName */}
                {item.subName && (
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>
                    {item.subName}
                  </p>
                )}
                {/* Name */}
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 6 }}>
                  {item.name}
                </h2>
                {/* Location */}
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#9B1B4D', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
                  </div>
                )}
                {/* Rating placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1209' }}>4.8</span>
                  <span style={{ fontSize: 14, color: '#B8820B' }}>🍷🍷🍷🍷🍷</span>
                  <span style={{ fontSize: 11, color: '#B0A090' }}>318 avaliações</span>
                </div>
                <div style={{ height: 1, background: 'rgba(139,90,43,0.12)', marginBottom: 12 }} />
                {/* Tasting note */}
                {(item.tastingNote || item.highlight) && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 8 }}>
                      Como é
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: '#5C5048', marginBottom: 14 }}>
                      {item.tastingNote || item.highlight}
                    </p>
                    <div style={{ height: 1, background: 'rgba(139,90,43,0.12)', marginBottom: 12 }} />
                  </>
                )}
                {/* Bottom row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    {item.subName && (
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1209' }}>{item.subName}</p>
                    )}
                    {priceText && (
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1209' }}>{priceText}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onToggleFavorite(item.itemId)}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`,
                      background: state.favorite ? '#6B0035' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Bookmark style={{ width: 16, height: 16, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={() => onToggleTried(item.itemId)}
                    style={{
                      borderRadius: 14, padding: '10px 18px',
                      background: state.tried ? '#2D4A3E' : '#1F3B36',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                    }}
                  >
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
  const isDesktop = useIsDesktop();

  const typeLabel = CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type;
  const geoChain  = [col.country?.name, col.region?.name, col.sub_region?.name].filter(Boolean).join(' › ');
  const pct       = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const itemLabel = (item: UnifiedItem) =>
    item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola');

  // ── Shared: photo background + collection info panel ─────────────────────
  const InfoPanel = ({ padding }: { padding: string }) => (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={col.photo || FALLBACK} alt={col.title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        onError={imgFallback}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.12) 100%)',
      }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding }}>
        {/* Type + category badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {typeLabel && (
            <span style={{
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
              textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99,
            }}>{typeLabel}</span>
          )}
          {col.category && (
            <span style={{
              background: 'rgba(184,130,11,0.28)', backdropFilter: 'blur(8px)',
              color: '#FFD97D', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
              textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99,
            }}>{col.category}</span>
          )}
        </div>

        {/* Italic label */}
        <p style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>Descubra</p>

        {/* Title */}
        <h1 style={{
          fontFamily: '"Fraunces",Georgia,serif',
          fontSize: isDesktop ? 'clamp(26px, 2.4vw, 42px)' : 'clamp(24px, 7vw, 34px)',
          fontWeight: 800, color: '#fff', textTransform: 'uppercase',
          letterSpacing: '-0.01em', lineHeight: 1.08, marginBottom: 8,
        }}>{col.title}</h1>

        {/* Tagline */}
        {col.tagline && (
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: isDesktop ? 3 : 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 14,
          }}>{col.tagline}</p>
        )}

        {/* Geo chain */}
        {geoChain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
            <MapPin style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.68)', fontWeight: 500 }}>{geoChain}</span>
          </div>
        )}

        {/* Progress bar */}
        {progress.total > 0 && (
          <div style={{ marginBottom: isDesktop ? 0 : 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Seu progresso</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: progress.done > 0 ? '#6BF5A0' : 'rgba(255,255,255,0.45)' }}>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #6BF5A0, #2DD4BF)',
                width: `${Math.max(pct, progress.done > 0 ? 4 : 0)}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}

        {/* Mobile-only: item counter + arrows */}
        {!isDesktop && items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, minWidth: 56 }}>
              {itemIndex + 1} — {items.length}
            </span>
            <button
              onClick={() => setItemIndex(i => Math.max(0, i - 1))}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: itemIndex === 0 ? 0.3 : 1,
              }}
            ><ChevronLeft style={{ width: 16, height: 16, color: '#fff' }} /></button>
            <button
              onClick={() => setItemIndex(i => Math.min(items.length - 1, i + 1))}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: itemIndex === items.length - 1 ? 0.3 : 1,
              }}
            ><ChevronRight style={{ width: 16, height: 16, color: '#fff' }} /></button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Shared: status badges overlay ────────────────────────────────────────
  const StatusBadges = ({ itemId }: { itemId: string }) => {
    const state = itemStates[itemId] ?? { tried: false, favorite: false };
    if (!state.tried && !state.favorite) return null;
    return (
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        {state.tried && (
          <span style={{ background: '#2D4A3E', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✓ Vivido</span>
        )}
        {state.favorite && (
          <span style={{ background: '#6B0035', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>♡ Salvo</span>
        )}
      </div>
    );
  };

  // ── DESKTOP layout ────────────────────────────────────────────────────────
  // Design: left info panel floats on top (z-index); behind it a full-width
  // horizontal card scroll — cards slide under the panel as user scrolls left.
  if (isDesktop) {
    const LEFT_W    = '40%';
    const CARD_W_DK = 280;
    const CARD_H_DK = 'calc(100vh - 64px - 80px)'; // nearly full height

    return (
      <div style={{
        height: 'calc(100vh - 64px)',
        scrollSnapAlign: 'start', flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ── Background canvas (warm gradient behind everything) ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #EDE4D6 0%, #E0D5C0 100%)',
        }} />

        {/* ── Horizontal card scroll — full width, sits behind left panel ── */}
        <div style={{
          position: 'absolute', inset: 0,
          overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', alignItems: 'center',
          gap: 20,
          paddingLeft: LEFT_W,   /* first card starts just after the left panel */
          paddingRight: 48,
          scrollbarWidth: 'none',
        }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60vw' }}>
              <p style={{ color: '#B0A090', fontSize: 14 }}>Nenhum item nesta coleção.</p>
            </div>
          ) : items.map((item, i) => {
            const isWine = item.itemType === 'wine';
            return (
              <div
                key={item.itemId}
                onClick={() => onItemClick(items, i)}
                style={{
                  width: CARD_W_DK, height: CARD_H_DK,
                  flexShrink: 0, borderRadius: 24, overflow: 'hidden',
                  cursor: 'pointer', background: '#fff',
                  boxShadow: '0 8px 40px rgba(28,18,9,0.14)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                className="hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
              >
                {/* Photo — flex:1 → fills all space above footer */}
                <div style={{
                  flex: 1, minHeight: 0,
                  background: isWine ? '#F5F0E8' : '#1C1209',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <img
                    src={item.photo || FALLBACK} alt={item.name}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: isWine ? 'contain' : 'cover',
                      padding: isWine ? '24px 32px' : 0,
                    }}
                    onError={imgFallback}
                  />
                  <StatusBadges itemId={item.itemId} />
                </div>
                {/* Info footer */}
                <div style={{ padding: '16px 20px 22px', flexShrink: 0, borderTop: '1px solid rgba(139,90,43,0.08)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 6 }}>
                    {itemLabel(item)}
                  </p>
                  <p style={{
                    fontFamily: '"Fraunces",Georgia,serif', fontSize: 17, fontWeight: 700,
                    color: '#1C1209', lineHeight: 1.2,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: item.subName ? 5 : 0,
                  }}>{item.name}</p>
                  {item.subName && (
                    <p style={{ fontSize: 13, color: '#7A6855', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.subName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Left info panel — overlaid, cards scroll behind it ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: LEFT_W, zIndex: 10,
          /* subtle right shadow to sell the depth effect */
          filter: 'drop-shadow(8px 0 24px rgba(0,0,0,0.18))',
        }}>
          <InfoPanel padding="0 44px 52px" />
        </div>

      </div>
    );
  }

  // ── MOBILE layout ─────────────────────────────────────────────────────────
  // Card proportions: ~9:16 feel — 144px wide × 232px tall
  const CARD_W   = 144;
  const CARD_H   = 232;   // ≈ 9:14 — feels like a story card
  const PHOTO_H  = CARD_H - 64; // 168px photo, 64px info footer

  return (
    <div style={{
      height: 'calc(100svh - 56px - 64px)',
      scrollSnapAlign: 'start', flexShrink: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Hero — 44% */}
      <div style={{ height: '44%', position: 'relative', flexShrink: 0 }}>
        <InfoPanel padding="0 18px 14px" />
      </div>

      {/* Cards carousel — fixed-size cards, vertically centered */}
      <div style={{
        flex: 1, minHeight: 0,
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.95) 0%, #0A0603 100%)',
        overflowX: 'auto', display: 'flex', gap: 10,
        padding: `0 14px`,
        scrollbarWidth: 'none',
        alignItems: 'center',   /* vertically center the fixed-height cards */
      }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>Nenhum item ainda</p>
          </div>
        ) : items.map((item, i) => {
          const isWine = item.itemType === 'wine';
          return (
            <div
              key={item.itemId}
              onClick={() => onItemClick(items, i)}
              style={{
                width: CARD_W, height: CARD_H, flexShrink: 0,
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: '#fff',
                boxShadow: i === itemIndex
                  ? '0 0 0 2px #fff, 0 4px 20px rgba(0,0,0,0.40)'
                  : '0 4px 16px rgba(0,0,0,0.30)',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              className="active:scale-95"
            >
              {/* Photo — object-cover fills the entire space */}
              <div style={{ height: PHOTO_H, flexShrink: 0, background: isWine ? '#F5F0E8' : '#1C1209', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={item.photo || FALLBACK} alt={item.name}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',   /* always fill — no empty space */
                    objectPosition: 'center top',
                  }}
                  onError={imgFallback}
                />
                <StatusBadges itemId={item.itemId} />
              </div>
              {/* Info footer — fixed 64px */}
              <div style={{ flex: 1, padding: '7px 10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 2 }}>
                  {itemLabel(item)}
                </p>
                <p style={{
                  fontFamily: '"Fraunces",Georgia,serif', fontSize: 11, fontWeight: 700, color: '#1C1209',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25,
                  marginBottom: item.subName ? 1 : 0,
                }}>{item.name}</p>
                {item.subName && (
                  <p style={{ fontSize: 9, color: '#7A6855', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.subName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ForYou() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [profileRules, setProfileRules] = useState<ProfileRule[]>([]);
  const [itemsByCollection, setItemsByCollection] = useState<Record<string, UnifiedItem[]>>({});
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ items: UnifiedItem[]; index: number; colTitle: string } | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: colItems }] = await Promise.all([
        supabase
          .from('collections')
          .select('id, title, tagline, photo, content_type, category, country:country_id(name), region:region_id(name), sub_region:sub_region_id(name)')
          .order('title'),
        supabase
          .from('collection_items')
          .select('collection_id, item_id, item_type, position')
          .order('collection_id')
          .order('position')
          .limit(2000),
      ]);

      setCollections((cols as CollectionRow[]) ?? []);

      const rawItems = (colItems ?? []) as { collection_id: string; item_id: string; item_type: string; position: number }[];

      // Group by collection
      const byColRaw: Record<string, { item_id: string; item_type: string; position: number }[]> = {};
      for (const row of rawItems) {
        if (!byColRaw[row.collection_id]) byColRaw[row.collection_id] = [];
        byColRaw[row.collection_id].push({ item_id: row.item_id, item_type: row.item_type, position: row.position });
      }

      const wineIds = rawItems.filter(r => r.item_type === 'wine').map(r => r.item_id);
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
      const wineryMap = new Map((wineryRows ?? []).map((r: any) => [r.id, r]));

      const byCol: Record<string, UnifiedItem[]> = {};
      for (const [colId, ciList] of Object.entries(byColRaw)) {
        const unified: UnifiedItem[] = ciList.flatMap(ci => {
          if (ci.item_type === 'wine') {
            const w = wineMap.get(ci.item_id) as any;
            if (!w) return [];
            return [{
              itemId: ci.item_id, itemType: 'wine' as ItemType, id: w.id, name: w.name, photo: w.photo ?? '',
              subName: (w.wineries as any)?.name ?? null,
              location: (w.wineries as any)?.region?.name ?? null,
              type: w.type ?? null, highlight: w.highlight ?? null, tastingNote: w.tasting_note ?? null,
              price_min: w.price_min ?? null, price_max: w.price_max ?? null,
            }];
          }
          if (ci.item_type === 'experience') {
            const e = expMap.get(ci.item_id) as any;
            if (!e) return [];
            return [{
              itemId: ci.item_id, itemType: 'experience' as ItemType, id: e.id, name: e.name, photo: e.photo ?? '',
              subName: (e.winery as any)?.name ?? null,
              location: (e.region as any)?.name ?? null,
              type: e.category ?? null, highlight: e.highlight ?? null, tastingNote: null,
              price_min: null, price_max: null,
            }];
          }
          if (ci.item_type === 'winery') {
            const w = wineryMap.get(ci.item_id) as any;
            if (!w) return [];
            return [{
              itemId: ci.item_id, itemType: 'winery' as ItemType, id: w.id, name: w.name, photo: w.photo ?? '',
              subName: null,
              location: (w.region as any)?.name ?? null,
              type: w.category ?? null, highlight: w.highlight ?? null, tastingNote: null,
              price_min: null, price_max: null,
            }];
          }
          return [];
        });
        byCol[colId] = unified;
      }
      setItemsByCollection(byCol);
      setLoading(false);
    };
    load();
  }, []);

  // ── Load user-specific data ────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { setProfile(null); setProfileRules([]); setCompletedIds(new Set()); setItemStates({}); return; }

    const loadUser = async () => {
      const [{ data: prof }, { data: progress }] = await Promise.all([
        supabase.from('user_profiles')
          .select('wine_profile, total_points, user_level, display_name, quiz_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('user_progress')
          .select('item_id, completed, is_favorite')
          .eq('user_id', user.id),
      ]);

      setProfile((prof as UserProfileData) ?? null);

      const states: Record<string, ItemState> = {};
      const cIds = new Set<string>();
      for (const p of (progress ?? []) as any[]) {
        states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false };
        if (p.completed) cIds.add(p.item_id);
      }
      setItemStates(states);
      setCompletedIds(cIds);

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

  // ── Personalized collections ───────────────────────────────────────────────

  const personalizedCollections = useMemo(() => {
    if (!profileRules.length) return collections;
    const ruleMap: Record<string, ProfileRule> = {};
    for (const r of profileRules) ruleMap[r.category] = r;
    const hidden = new Set(profileRules.filter(r => !r.visible).map(r => r.category));
    return [...collections]
      .filter(c => !hidden.has(c.category))
      .sort((a, b) => (ruleMap[a.category]?.priority ?? 99) - (ruleMap[b.category]?.priority ?? 99));
  }, [collections, profileRules]);

  // ── Progress helper ────────────────────────────────────────────────────────

  const getProgress = useCallback((colId: string): ColProgress => {
    const items = itemsByCollection[colId] ?? [];
    const done = items.filter(item => completedIds.has(item.itemId)).length;
    return { total: items.length, done };
  }, [itemsByCollection, completedIds]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleTried = useCallback(async (itemId: string) => {
    if (!user) return;
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const allItems = Object.values(itemsByCollection).flat();
    const found = allItems.find(i => i.itemId === itemId);
    const itemType = found?.itemType ?? 'wine';
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: !current.tried } }));
    setCompletedIds(prev => {
      const next = new Set(prev);
      current.tried ? next.delete(itemId) : next.add(itemId);
      return next;
    });
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

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ height: 'calc(100svh - 56px - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E3D9' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(107,0,53,0.15)', borderTopColor: '#6B0035' }} className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* ── Floating header (mobile only — desktop has info in left panel) ─── */}
      <div className="lg:hidden" style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 30,
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {/* Profile badge */}
        {user && profile?.quiz_completed ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(107,0,53,0.12)', borderRadius: 99,
            padding: '5px 12px', pointerEvents: 'auto',
          }}>
            <span style={{ fontSize: 14 }}>{PROFILE_ICONS[profile.wine_profile]}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B0035' }}>
              Para o perfil {PROFILE_LABELS[profile.wine_profile]}
            </span>
          </div>
        ) : (
          <div />
        )}
        {/* Search */}
        <button
          onClick={() => navigate('/search')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(233,227,217,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          <Search style={{ width: 16, height: 16, color: '#7A6855' }} />
        </button>
      </div>

      {/* ── Snap scroll container ───────────────────────────────────────────── */}
      <div style={{
        height: isDesktop ? 'calc(100vh - 64px)' : 'calc(100svh - 56px - 64px)',
        overflowY: personalizedCollections.length > 0 ? 'scroll' : 'hidden',
        scrollSnapType: 'y mandatory',
        background: '#000',
      }}>
        {personalizedCollections.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E3D9' }}>
            <p style={{ color: '#B0A090', fontSize: 14 }}>Nenhuma coleção disponível.</p>
          </div>
        ) : (
          personalizedCollections.map(col => (
            <ReelSlide
              key={col.id}
              col={col}
              items={itemsByCollection[col.id] ?? []}
              progress={getProgress(col.id)}
              itemStates={itemStates}
              onItemClick={(items, index) => setModalState({ items, index, colTitle: col.title })}
            />
          ))
        )}
      </div>

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
