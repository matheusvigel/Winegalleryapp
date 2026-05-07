import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronLeft, Share2, Heart, CheckCircle2, MapPin,
  X, ChevronRight, Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AddReviewSection } from '../components/AddReviewSection';
import { CollectionCard } from '../components/CollectionCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
  awardPoints,
} from '../../lib/pointsSystem';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollectionRow {
  id: string; title: string; tagline: string | null; photo: string; content_type: string;
}

type ItemType = 'wine' | 'experience' | 'winery';

interface UnifiedItem {
  itemId: string; itemType: ItemType; id: string; name: string; photo: string;
  highlight: string | null; tastingNote: string | null; subName: string | null;
  location: string | null; type: string | null; position: number;
}

type ItemState = {
  tried: boolean; favorite: boolean;
  review?: { photo?: string; comment: string; rating: number };
};

interface OtherCollection {
  id: string; title: string; photo: string; tagline: string | null;
  content_type: string; totalItems: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const WHY_LABEL: Record<string, string> = {
  wine: 'Por que provar?', experience: 'Por que viver?', winery: 'Por que visitar?',
};

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── Fullscreen Item Modal ──────────────────────────────────────────────────────

function ItemModal({
  items, initialIndex, collectionTitle, itemStates,
  user, onClose, onToggleTried, onToggleFavorite, onAddReview,
}: {
  items: UnifiedItem[];
  initialIndex: number;
  collectionTitle: string;
  itemStates: Record<string, ItemState>;
  user: any;
  onClose: () => void;
  onToggleTried: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddReview: (id: string, r: { photo?: string; comment: string; rating: number }) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [level, setLevel] = useState<0 | 1>(0);
  const touchStartX = useRef<number | null>(null);

  const item  = items[index];
  const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
  const isWine = item.itemType === 'wine';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const prev = useCallback(() => { setIndex(i => Math.max(0, i - 1)); setLevel(0); }, []);
  const next = useCallback(() => { setIndex(i => Math.min(items.length - 1, i + 1)); setLevel(0); }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     onClose();
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
      {/* ── Top bar ────────────────────────────────────────────────── */}
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
            <button
              key={i}
              onClick={() => { setIndex(i); setLevel(0); }}
              style={{ flex: 1, height: 2, borderRadius: 99, background: i === index ? '#fff' : 'rgba(255,255,255,0.30)' }}
            />
          ))}
        </div>
      </div>

      {/* ── Photo (animates height by level) ──────────────────────── */}
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

      {/* ── Prev / Next arrows ─────────────────────────────────────── */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{ position: 'absolute', left: 12, top: '30vh', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0 : 1, pointerEvents: index === 0 ? 'none' : 'auto', zIndex: 15 }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
          <button
            onClick={next}
            style={{ position: 'absolute', right: 12, top: '30vh', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === items.length - 1 ? 0 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', zIndex: 15 }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: '#fff' }} />
          </button>
        </>
      )}

      {/* ── Bottom sheet (two levels) ──────────────────────────────── */}
      <motion.div
        animate={{ height: sheetHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FFFFFF', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
          <AnimatePresence mode="wait">
            {level === 0 ? (
              <motion.div key="level0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {/* Type */}
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>
                  {item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola')}
                </p>
                {/* Name */}
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.375rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 4 }}>
                  {item.name}
                </h2>
                {/* SubName */}
                {item.subName && <p style={{ fontSize: 13, color: '#7A6855', marginBottom: 6 }}>{item.subName}</p>}
                {/* Location */}
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#9B1B4D', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
                  </div>
                )}
                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => onToggleFavorite(item.itemId)}
                    style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`, background: state.favorite ? '#6B0035' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Bookmark style={{ width: 18, height: 18, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={() => onToggleTried(item.itemId)}
                    style={{ flex: 1, borderRadius: 16, background: state.tried ? '#2D4A3E' : '#1F3B36', color: '#fff', fontWeight: 700, fontSize: 14, paddingTop: 14, paddingBottom: 14, boxShadow: '0 4px 16px rgba(31,59,54,0.35)' }}
                  >
                    {state.tried ? '✓ Adicionado à adega' : 'Adicionar à adega'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="level1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {item.type && <span style={{ fontSize: 11, background: '#F5EEF4', color: '#7B1E5C', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>{item.type}</span>}
                  {item.itemType === 'wine' && item.tastingNote && (
                    <span style={{ fontSize: 11, background: '#FFF8EC', color: '#B8820B', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>★ Selecionado</span>
                  )}
                </div>
                {/* SubName */}
                {item.subName && <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 4 }}>{item.subName}</p>}
                {/* Name */}
                <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.2, marginBottom: 6 }}>{item.name}</h2>
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
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 8 }}>Como é</p>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: '#5C5048', marginBottom: 14 }}>{item.tastingNote || item.highlight}</p>
                    <div style={{ height: 1, background: 'rgba(139,90,43,0.12)', marginBottom: 12 }} />
                  </>
                )}
                {/* Review section (existing behavior) */}
                <AnimatePresence>
                  {user && state.tried && !state.review && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden" style={{ marginBottom: 12 }}>
                      <AddReviewSection itemId={item.itemId} itemName={item.name} onAddReview={onAddReview} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {state.review && (
                  <div style={{ borderRadius: 16, padding: 16, background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.10)', marginBottom: 14 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1209', fontFamily: '"Fraunces",Georgia,serif' }}>Sua Avaliação</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#2D4A3E' }}>✓ Pontos ganhos</span>
                    </div>
                    {state.review.rating > 0 && (
                      <div className="flex gap-0.5" style={{ marginBottom: 8 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 18, color: s <= state.review!.rating ? '#B8820B' : '#DDD0C0' }}>★</span>
                        ))}
                      </div>
                    )}
                    {state.review.comment && <p style={{ fontSize: 13, lineHeight: 1.6, color: '#7A6855' }}>{state.review.comment}</p>}
                  </div>
                )}
                {/* Bottom actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    {item.subName && <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1209' }}>{item.subName}</p>}
                  </div>
                  <button
                    onClick={() => onToggleFavorite(item.itemId)}
                    style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: `2px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.30)'}`, background: state.favorite ? '#6B0035' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Bookmark style={{ width: 16, height: 16, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={() => onToggleTried(item.itemId)}
                    style={{ borderRadius: 14, padding: '10px 18px', background: state.tried ? '#2D4A3E' : '#1F3B36', color: '#fff', fontWeight: 700, fontSize: 13 }}
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

// ── Compact card for the list ──────────────────────────────────────────────────

function CompactItemCard({
  item, state, onClick,
}: {
  item: UnifiedItem; state: ItemState; onClick: () => void;
}) {
  const isWine = item.itemType === 'wine';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform"
      style={{ borderRadius: 16, border: '1px solid rgba(139,90,43,0.10)', boxShadow: '0 1px 6px rgba(28,18,9,0.06)' }}
    >
      <div className="flex gap-0" style={{ minHeight: 100 }}>
        {/* Image — left side, portrait */}
        <div
          className="flex-shrink-0 relative overflow-hidden"
          style={{
            width: 100,
            background: isWine ? '#F5F0E8' : '#1A1209',
            borderRadius: '16px 0 0 16px',
          }}
        >
          {isWine ? (
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <img
                src={item.photo || FALLBACK}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
                style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))' }}
                onError={imgFallback}
              />
            </div>
          ) : (
            <img
              src={item.photo || FALLBACK}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={imgFallback}
            />
          )}

          {/* Tried badge */}
          {state.tried && (
            <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                 style={{ background: '#2D4A3E' }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Text — right side */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#B0906A' }}>
              {item.type ?? (item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola')}
            </p>
            <h3
              className="font-bold leading-snug line-clamp-2 mb-0.5"
              style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: '0.95rem', color: '#1C1209', letterSpacing: '-0.01em' }}
            >
              {item.name}
            </h3>
            {item.subName && (
              <p className="text-xs line-clamp-1" style={{ color: '#7A6855' }}>{item.subName}</p>
            )}
            {item.location && (
              <div className="flex items-center gap-1 mt-1" style={{ color: '#B0A090' }}>
                <MapPin className="w-3 h-3 shrink-0" style={{ color: '#9B1B4D' }} />
                <span className="text-xs truncate">{item.location}</span>
              </div>
            )}
          </div>

          {/* CTA hint */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold" style={{ color: '#690037' }}>
              Ver detalhes →
            </span>
            {state.favorite && (
              <Heart className="w-3.5 h-3.5" style={{ color: '#690037', fill: '#690037' }} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [collection, setCollection]             = useState<CollectionRow | null>(null);
  const [items, setItems]                       = useState<UnifiedItem[]>([]);
  const [otherCollections, setOtherCollections] = useState<OtherCollection[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [itemStates, setItemStates]             = useState<Record<string, ItemState>>({});
  const [modalIndex, setModalIndex]             = useState<number | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);

  // ── Data loading ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: col } = await supabase
        .from('collections').select('id, title, tagline, photo, content_type')
        .eq('id', id).maybeSingle();
      setCollection(col as CollectionRow | null);

      const { data: ciRows } = await supabase
        .from('collection_items').select('item_id, item_type, position')
        .eq('collection_id', id).order('position');

      const rawItems = (ciRows ?? []) as { item_id: string; item_type: string; position: number }[];
      const wineIds       = rawItems.filter(r => r.item_type === 'wine').map(r => r.item_id);
      const experienceIds = rawItems.filter(r => r.item_type === 'experience').map(r => r.item_id);
      const wineryIds     = rawItems.filter(r => r.item_type === 'winery').map(r => r.item_id);

      const [{ data: wineRows }, { data: expRows }, { data: wineryRows }] = await Promise.all([
        wineIds.length
          ? supabase.from('wines').select('id, name, photo, highlight, tasting_note, type, wineries(name, region:region_id(name, level))').in('id', wineIds)
          : Promise.resolve({ data: [] }),
        experienceIds.length
          ? supabase.from('experiences').select('id, name, photo, highlight, category, winery:winery_id(name), region:region_id(name)').in('id', experienceIds)
          : Promise.resolve({ data: [] }),
        wineryIds.length
          ? supabase.from('wineries').select('id, name, photo, highlight, category, region:region_id(name)').in('id', wineryIds)
          : Promise.resolve({ data: [] }),
      ]);

      const wineMap   = new Map((wineRows   ?? []).map((r: any) => [r.id, r]));
      const expMap    = new Map((expRows    ?? []).map((r: any) => [r.id, r]));
      const wineryMap = new Map((wineryRows ?? []).map((r: any) => [r.id, r]));

      const unified: UnifiedItem[] = rawItems.flatMap((ci) => {
        const type = ci.item_type as ItemType;
        if (type === 'wine') {
          const w = wineMap.get(ci.item_id) as any;
          if (!w) return [];
          return [{ itemId: ci.item_id, itemType: 'wine', id: w.id, name: w.name, photo: w.photo ?? '',
            highlight: w.highlight ?? null, tastingNote: w.tasting_note ?? null,
            subName: w.wineries?.name ?? null,
            location: (w.wineries as any)?.region?.level !== 'country' ? ((w.wineries as any)?.region?.name ?? null) : null,
            type: w.type ?? null, position: ci.position }];
        }
        if (type === 'experience') {
          const e = expMap.get(ci.item_id) as any;
          if (!e) return [];
          return [{ itemId: ci.item_id, itemType: 'experience', id: e.id, name: e.name, photo: e.photo ?? '',
            highlight: e.highlight ?? null, tastingNote: null, subName: e.winery?.name ?? null,
            location: e.region?.name ?? null, type: e.category ?? null, position: ci.position }];
        }
        if (type === 'winery') {
          const w = wineryMap.get(ci.item_id) as any;
          if (!w) return [];
          return [{ itemId: ci.item_id, itemType: 'winery', id: w.id, name: w.name, photo: w.photo ?? '',
            highlight: w.highlight ?? null, tastingNote: null, subName: null,
            location: w.region?.name ?? null, type: w.category ?? null, position: ci.position }];
        }
        return [];
      });

      setItems(unified);

      if (user && unified.length > 0) {
        const ids = unified.map(i => i.itemId);
        const { data: progress } = await supabase
          .from('user_progress').select('item_id, completed, is_favorite')
          .eq('user_id', user.id).in('item_id', ids);
        if (progress) {
          const states: Record<string, ItemState> = {};
          (progress as any[]).forEach(p => {
            states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false };
          });
          setItemStates(states);
        }
      }

      const { data: otherCols } = await supabase
        .from('collections').select('id, title, tagline, photo, content_type')
        .neq('id', id).order('title').limit(4);

      if (otherCols && otherCols.length > 0) {
        const otherIds = (otherCols as CollectionRow[]).map(c => c.id);
        const { data: itemCounts } = await supabase
          .from('collection_items').select('collection_id').in('collection_id', otherIds);
        const countMap: Record<string, number> = {};
        (itemCounts ?? []).forEach((r: any) => { countMap[r.collection_id] = (countMap[r.collection_id] ?? 0) + 1; });
        setOtherCollections((otherCols as CollectionRow[]).map(c => ({ ...c, totalItems: countMap[c.id] ?? 0 })));
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const getItemType = (itemId: string) => items.find(i => i.itemId === itemId)?.itemType ?? 'wine';

  const toggleTried = async (itemId: string) => {
    if (!user) { toast.error('Entre para marcar itens'); return; }
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: !current.tried } }));
    await psToggleTried(user.id, itemId, getItemType(itemId), current.tried);
    if (!current.tried) toast.success('+1 ponto!', { description: 'Item marcado como experimentado ✓' });
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) { toast.error('Entre para favoritar'); return; }
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, favorite: !current.favorite } }));
    await psToggleFavorite(user.id, itemId, getItemType(itemId), current.favorite);
    if (!current.favorite) toast.success('+1 ponto!', { description: 'Adicionado aos favoritos ❤️' });
  };

  const addReview = async (itemId: string, review: { photo?: string; comment: string; rating: number }) => {
    setItemStates(prev => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { tried: false, favorite: false }), review } }));
    if (!user) return;
    const itemType = getItemType(itemId);
    const hasReview = review.comment.trim() || review.rating > 0;
    const hasPhoto  = !!review.photo;
    let totalPts = 0;
    if (hasReview) { await awardPoints({ userId: user.id, action: 'review', itemId, itemType }); totalPts += 3; }
    if (hasPhoto)  { await awardPoints({ userId: user.id, action: 'photo',  itemId, itemType }); totalPts += 3; }
    await supabase.from('reviews').insert({
      user_id: user.id, item_id: itemId, item_type: itemType,
      rating: review.rating, comment: review.comment || null,
      photos: review.photo ? [review.photo] : null, points_earned: totalPts,
    });
    if (totalPts > 0) toast.success(`+${totalPts} pontos!`, { description: 'Avaliação registrada 🎉' });
  };

  // ── Loading / not found ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2EBE1' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
             style={{ borderColor: 'rgba(107,0,53,0.15)', borderTopColor: '#6B0035' }} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2EBE1' }}>
        <div className="text-center">
          <p className="mb-2" style={{ color: '#7A6855' }}>Coleção não encontrada</p>
          <Link to="/" style={{ color: '#6B0035' }}>Voltar para início</Link>
        </div>
      </div>
    );
  }

  const triedCount = Object.values(itemStates).filter(s => s.tried).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen" style={{ background: '#F2EBE1' }}>

        {/* ── Top bar ────────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40"
             style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,90,43,0.10)' }}>
          <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center gap-2">
            <Link to="/" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F2EBE1' }}>
              <ChevronLeft className="w-5 h-5" style={{ color: '#1C1209' }} />
            </Link>
            <div className="flex-1 min-w-0 text-center">
              <p className="text-sm font-bold truncate"
                 style={{ color: '#1C1209', fontFamily: '"Fraunces", Georgia, serif' }}>
                {collection.title}
              </p>
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F2EBE1' }}>
              <Share2 className="w-4 h-4" style={{ color: '#1C1209' }} />
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">

          {/* ── Hero banner ──────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden cursor-pointer"
            style={{ height: 'min(52vw, 320px)' }}
            onClick={() => items.length > 0 && setModalIndex(0)}
          >
            <img
              src={collection.photo || FALLBACK}
              alt={collection.title}
              className="w-full h-full object-cover"
              onError={imgFallback}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

            {/* "Já provei" badge */}
            {items.length > 0 && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl text-white text-sm font-bold"
                     style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
                  <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>Já provei</span>
                  <span className="font-bold">{triedCount}/{items.length}</span>
                </div>
              </div>
            )}

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <h1 className="text-2xl font-bold text-white leading-tight mb-1"
                  style={{ fontFamily: '"Fraunces", Georgia, serif', letterSpacing: '-0.02em' }}>
                {collection.title}
              </h1>
              {collection.tagline && (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.5 }}>
                  {collection.tagline}
                </p>
              )}
              {/* "Toque para explorar" hint */}
              {items.length > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Toque para explorar os itens →
                </p>
              )}
            </div>
          </div>

          {/* ── Item list ────────────────────────────────────────────────────── */}
          <div className="px-4 pt-5 pb-10 flex flex-col gap-3">
            {items.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B0906A' }}>
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                  {triedCount > 0 && (
                    <span className="text-xs font-semibold" style={{ color: '#2D4A3E' }}>
                      ✓ {triedCount} provado{triedCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {items.map((item, i) => (
                  <CompactItemCard
                    key={item.itemId}
                    item={item}
                    state={itemStates[item.itemId] ?? { tried: false, favorite: false }}
                    onClick={() => setModalIndex(i)}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-16">
                <p style={{ color: '#B0A090' }}>Esta coleção ainda não tem itens.</p>
              </div>
            )}

            {/* ── Continue Explorando ───────────────────────────────────────── */}
            {otherCollections.length > 0 && (
              <div className="pt-5 mt-2" style={{ borderTop: '1px solid rgba(139,90,43,0.10)' }}>
                <h2 className="text-xl font-bold mb-1"
                    style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209' }}>
                  Continue Explorando
                </h2>
                <p className="text-sm mb-4" style={{ color: '#B0A090' }}>Descubra outras coleções</p>
                <div className="flex flex-col gap-3">
                  {otherCollections.map(c => (
                    <CollectionCard key={c.id} id={c.id} title={c.title} coverImage={c.photo}
                      description={c.tagline ?? ''} contentType={c.content_type}
                      totalItems={c.totalItems} completedItems={0} progress={0}
                      variant="landscape" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fullscreen modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalIndex !== null && (
          <ItemModal
            items={items}
            initialIndex={modalIndex}
            collectionTitle={collection.title}
            itemStates={itemStates}
            user={user}
            onClose={() => setModalIndex(null)}
            onToggleTried={toggleTried}
            onToggleFavorite={toggleFavorite}
            onAddReview={addReview}
          />
        )}
      </AnimatePresence>
    </>
  );
}
