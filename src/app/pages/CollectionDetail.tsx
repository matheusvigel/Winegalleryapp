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
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const item  = items[index];
  const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
  const isWine = item.itemType === 'wine';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(items.length - 1, i + 1)), [items.length]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: isWine ? '#F5F0E8' : '#0D0905' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ background: isWine ? 'rgba(245,240,232,0.92)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isWine ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}
        >
          <X className="w-5 h-5" style={{ color: isWine ? '#1C1209' : '#fff' }} strokeWidth={2} />
        </button>

        <div className="text-center">
          <p className="text-sm font-bold leading-tight"
             style={{ fontFamily: '"Fraunces", Georgia, serif', color: isWine ? '#1C1209' : '#fff' }}>
            {collectionTitle}
          </p>
          <p className="text-xs" style={{ color: isWine ? '#9B8060' : 'rgba(255,255,255,0.65)' }}>
            {index + 1} de {items.length}
          </p>
        </div>

        <button
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isWine ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}
        >
          <Share2 className="w-4 h-4" style={{ color: isWine ? '#1C1209' : '#fff' }} />
        </button>
      </div>

      {/* ── Progress segments ──────────────────────────────────────── */}
      <div className="absolute top-[68px] left-0 right-0 z-10 flex gap-1.5 px-4">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              height: 3,
              background: i === index
                ? (isWine ? '#690037' : '#fff')
                : (isWine ? 'rgba(105,0,55,0.20)' : 'rgba(255,255,255,0.30)'),
            }}
          />
        ))}
      </div>

      {/* ── Main image ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.itemId}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 flex items-center justify-center"
          style={{ paddingTop: 88, paddingBottom: sheetOpen ? 0 : 88 }}
        >
          {isWine ? (
            <div className="h-full w-full flex items-center justify-center px-12 py-4">
              <img
                src={item.photo || FALLBACK}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
                style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.22))' }}
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
        </motion.div>
      </AnimatePresence>

      {/* ── Prev / Next arrows ─────────────────────────────────────── */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isWine ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              opacity: index === 0 ? 0 : 1,
              pointerEvents: index === 0 ? 'none' : 'auto',
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: isWine ? '#1C1209' : '#fff' }} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isWine ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              opacity: index === items.length - 1 ? 0 : 1,
              pointerEvents: index === items.length - 1 ? 'none' : 'auto',
            }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: isWine ? '#1C1209' : '#fff' }} />
          </button>
        </>
      )}

      {/* ── Bottom action bar (collapsed) ──────────────────────────── */}
      <AnimatePresence>
        {!sheetOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-5"
            style={{
              background: isWine
                ? 'linear-gradient(to top, rgba(245,240,232,1) 70%, rgba(245,240,232,0))'
                : 'linear-gradient(to top, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0))',
            }}
          >
            {/* Bookmark */}
            <button
              onClick={() => onToggleFavorite(item.itemId)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: state.favorite
                  ? '#690037'
                  : isWine ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Bookmark
                className="w-5 h-5"
                style={{ color: state.favorite ? '#fff' : isWine ? '#1C1209' : '#fff' }}
                fill={state.favorite ? 'white' : 'none'}
              />
            </button>

            {/* Open detail sheet */}
            <button
              onClick={() => setSheetOpen(true)}
              className="flex-1 ml-3 py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: state.tried ? '#2D4A3E' : '#690037',
                color: '#fff',
                boxShadow: state.tried
                  ? '0 4px 16px rgba(45,74,62,0.40)'
                  : '0 4px 16px rgba(105,0,55,0.45)',
              }}
            >
              {state.tried ? '✓ Já provei · Ver detalhes' : 'Ver detalhes'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail sheet (slides up) ───────────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 overflow-y-auto"
            style={{
              maxHeight: '72vh',
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            }}
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
            </div>

            {/* Sheet close */}
            <div className="flex items-center justify-between px-5 pt-1 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B0906A' }}>
                {item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola'}
              </span>
              <button onClick={() => setSheetOpen(false)} className="p-1">
                <X className="w-4 h-4" style={{ color: '#B0A090' }} />
              </button>
            </div>

            <div className="px-5 pb-8">
              {/* Name */}
              <h2
                className="font-bold leading-tight mb-1"
                style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: '1.5rem', color: '#1C1209', letterSpacing: '-0.02em' }}
              >
                {item.name}
              </h2>

              {item.subName && (
                <p className="text-base mb-1" style={{ color: '#7A6855' }}>{item.subName}</p>
              )}

              {item.location && (
                <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: '#9B1B4D' }}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{item.location}</span>
                </div>
              )}

              {/* Type badge */}
              {item.type && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: '#F5EEF4', color: '#7B1E5C' }}>
                    {item.type}
                  </span>
                </div>
              )}

              {/* Description */}
              {(item.highlight || item.tastingNote) && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#5C5048', lineHeight: 1.7 }}>
                  {item.highlight || item.tastingNote}
                </p>
              )}

              {/* Tasting note (if both exist) */}
              {item.tastingNote && item.highlight && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.08)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#9B8060' }}>Degustação</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A6855' }}>{item.tastingNote}</p>
                </div>
              )}

              {/* Why label */}
              {item.highlight && (
                <div className="rounded-2xl p-4 mb-5" style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.08)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#9B8060' }}>
                    {WHY_LABEL[item.itemType]}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A6855' }}>{item.highlight}</p>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => onToggleTried(item.itemId)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                  style={{
                    background: state.tried ? '#2D4A3E' : '#F0EAE1',
                    color:      state.tried ? '#fff' : '#5C5048',
                    boxShadow:  state.tried ? '0 3px 12px rgba(45,74,62,0.30)' : 'none',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  {state.tried ? 'Provado' : 'Já provei'}
                </button>

                <button
                  onClick={() => onToggleFavorite(item.itemId)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                  style={{
                    background: state.favorite ? '#690037' : '#F0EAE1',
                    color:      state.favorite ? '#fff' : '#5C5048',
                    boxShadow:  state.favorite ? '0 3px 12px rgba(105,0,55,0.30)' : 'none',
                  }}
                >
                  <Heart className="w-4 h-4" strokeWidth={2} fill={state.favorite ? 'white' : 'none'} />
                  {state.favorite ? 'Favoritado' : 'Favoritar'}
                </button>
              </div>

              {/* Review section */}
              <AnimatePresence>
                {user && state.tried && !state.review && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <AddReviewSection
                      itemId={item.itemId}
                      itemName={item.name}
                      onAddReview={onAddReview}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Existing review */}
              {state.review && (
                <div className="rounded-2xl p-4" style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.10)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: '#1C1209', fontFamily: '"Fraunces",Georgia,serif' }}>Sua Avaliação</span>
                    <span className="text-xs font-semibold" style={{ color: '#2D4A3E' }}>✓ Pontos ganhos</span>
                  </div>
                  {state.review.rating > 0 && (
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="text-lg" style={{ color: s <= state.review!.rating ? '#B8820B' : '#DDD0C0' }}>★</span>
                      ))}
                    </div>
                  )}
                  {state.review.photo && (
                    <img src={state.review.photo} alt="Review" className="w-full h-40 object-cover rounded-xl mb-2" />
                  )}
                  {state.review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: '#7A6855' }}>{state.review.comment}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                      totalItems={c.totalItems} completedItems={0} progress={0} />
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
