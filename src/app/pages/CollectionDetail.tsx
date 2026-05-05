import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Share2, Heart, CheckCircle2, MapPin, Check } from 'lucide-react';
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
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
}

type ItemType = 'wine' | 'experience' | 'winery';

interface UnifiedItem {
  itemId: string;
  itemType: ItemType;
  id: string;
  name: string;
  photo: string;
  highlight: string | null;
  tastingNote: string | null;
  subName: string | null;
  location: string | null;
  type: string | null;
  position: number;
}

type ItemState = {
  tried: boolean;
  favorite: boolean;
  review?: { photo?: string; comment: string; rating: number };
};

interface OtherCollection {
  id: string;
  title: string;
  photo: string;
  tagline: string | null;
  content_type: string;
  totalItems: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const WHY_LABEL: Record<string, string> = {
  wine:       'Por que provar?',
  experience: 'Por que viver?',
  winery:     'Por que visitar?',
};

const WHY_EMOJI: Record<string, string> = {
  wine:       '🍷',
  experience: '✨',
  winery:     '🏛️',
};

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  state,
  user,
  onToggleTried,
  onToggleFavorite,
  onAddReview,
}: {
  item: UnifiedItem;
  state: ItemState;
  user: any;
  onToggleTried: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddReview: (id: string, review: { photo?: string; comment: string; rating: number }) => void;
}) {
  const isWine = item.itemType === 'wine';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white overflow-hidden"
      style={{
        borderRadius: 18,
        border: '1px solid rgba(139,90,43,0.10)',
        boxShadow: '0 2px 12px rgba(28,18,9,0.07)',
      }}
    >
      {/* ── Image — tall, dominant ────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          /* ~60vw height so image dominates on mobile, capped for desktop */
          height: 'min(60vw, 360px)',
          background: isWine ? '#F9F6F1' : '#1A1209',
        }}
      >
        {isWine ? (
          /* Wine bottle: cream background, bottle centred, fully visible */
          <div className="absolute inset-0 flex items-center justify-center px-12 py-6">
            <img
              src={item.photo || FALLBACK}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
              onError={imgFallback}
            />
          </div>
        ) : (
          <>
            <img
              src={item.photo || FALLBACK}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={imgFallback}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </>
        )}

        {/* Category badge — top left (like "Achados" in the reference) */}
        {item.type && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full"
              style={{
                background: 'rgba(255,255,255,0.93)',
                color: '#1C1209',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
              }}
            >
              {item.type}
            </span>
          </div>
        )}

        {/* Tried checkmark — top right (like the ✓ circle in the reference) */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => onToggleTried(item.itemId)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: state.tried
                ? 'rgba(45,74,62,0.92)'
                : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
            }}
          >
            <Check
              className="w-4 h-4"
              style={{ color: state.tried ? '#fff' : 'rgba(28,18,9,0.35)' }}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4">

        {/* Item type — uppercase label like "RESTAURANTE" in the reference */}
        <p
          className="text-[10px] font-bold tracking-widest uppercase mb-1"
          style={{ color: '#B0906A' }}
        >
          {item.itemType === 'wine' ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola'}
        </p>

        {/* Name — large serif */}
        <h2
          className="font-bold leading-tight mb-1"
          style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: '1.25rem',
            color: '#1C1209',
            letterSpacing: '-0.01em',
          }}
        >
          {item.name}
        </h2>

        {/* Sub-name (winery for wines) */}
        {item.subName && (
          <p className="text-sm mb-1" style={{ color: '#7A6855' }}>{item.subName}</p>
        )}

        {/* Location */}
        {item.location && (
          <div
            className="inline-flex items-center gap-1 text-xs mb-2.5 cursor-pointer"
            style={{ color: '#9B1B4D' }}
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="font-medium">{item.location}</span>
          </div>
        )}

        {/* Description / highlight */}
        {(item.highlight || item.tastingNote) && (
          <p
            className="text-sm leading-relaxed mb-3.5"
            style={{ color: '#5C5048', lineHeight: 1.65 }}
          >
            {item.highlight || item.tastingNote}
          </p>
        )}

        {/* ── Action buttons — like "Quero ir" + "Reservar" ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onToggleTried(item.itemId)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: state.tried ? '#2D4A3E' : '#F0EAE1',
              color:      state.tried ? '#FFFFFF' : '#5C5048',
              boxShadow:  state.tried ? '0 3px 10px rgba(45,74,62,0.28)' : 'none',
            }}
          >
            <CheckCircle2
              className="w-4 h-4"
              strokeWidth={2}
              style={{ fill: state.tried ? 'rgba(255,255,255,0.25)' : 'none' }}
            />
            {state.tried ? 'Provado' : 'Já provei'}
          </button>

          <button
            onClick={() => onToggleFavorite(item.itemId)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: state.favorite ? '#6B0035' : '#F0EAE1',
              color:      state.favorite ? '#FFFFFF' : '#5C5048',
              boxShadow:  state.favorite ? '0 3px 10px rgba(107,0,53,0.28)' : 'none',
            }}
          >
            <Heart
              className="w-4 h-4"
              strokeWidth={2}
              style={{ fill: state.favorite ? 'white' : 'none' }}
            />
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
              className="mt-3 overflow-hidden"
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
          <div
            className="mt-3 rounded-2xl p-4"
            style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.10)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: '#1C1209', fontFamily: '"Fraunces",Georgia,serif' }}>
                Sua Avaliação
              </span>
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

        {/* Why section */}
        {item.highlight && (
          <div
            className="mt-3 rounded-2xl p-4"
            style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{WHY_EMOJI[item.itemType]}</span>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#7A6855' }}>
                {WHY_LABEL[item.itemType]}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#7A6855' }}>{item.highlight}</p>
          </div>
        )}

        {/* Tasting note (only if also has highlight) */}
        {item.tastingNote && item.highlight && (
          <div
            className="mt-2 rounded-2xl p-4"
            style={{ background: '#F8F4EF', border: '1px solid rgba(139,90,43,0.08)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#7A6855' }}>
              Degustação
            </span>
            <p className="text-sm leading-relaxed" style={{ color: '#7A6855' }}>{item.tastingNote}</p>
          </div>
        )}
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // ── Data loading ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: col } = await supabase
        .from('collections')
        .select('id, title, tagline, photo, content_type')
        .eq('id', id)
        .maybeSingle();

      setCollection(col as CollectionRow | null);

      const { data: ciRows } = await supabase
        .from('collection_items')
        .select('item_id, item_type, position')
        .eq('collection_id', id)
        .order('position');

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
          return [{
            itemId: ci.item_id, itemType: 'wine',
            id: w.id, name: w.name, photo: w.photo ?? '',
            highlight: w.highlight ?? null, tastingNote: w.tasting_note ?? null,
            subName: w.wineries?.name ?? null,
            location: (w.wineries as any)?.region?.level !== 'country'
              ? ((w.wineries as any)?.region?.name ?? null) : null,
            type: w.type ?? null, position: ci.position,
          }];
        }
        if (type === 'experience') {
          const e = expMap.get(ci.item_id) as any;
          if (!e) return [];
          return [{
            itemId: ci.item_id, itemType: 'experience',
            id: e.id, name: e.name, photo: e.photo ?? '',
            highlight: e.highlight ?? null, tastingNote: null,
            subName: e.winery?.name ?? null, location: e.region?.name ?? null,
            type: e.category ?? null, position: ci.position,
          }];
        }
        if (type === 'winery') {
          const w = wineryMap.get(ci.item_id) as any;
          if (!w) return [];
          return [{
            itemId: ci.item_id, itemType: 'winery',
            id: w.id, name: w.name, photo: w.photo ?? '',
            highlight: w.highlight ?? null, tastingNote: null,
            subName: null, location: w.region?.name ?? null,
            type: w.category ?? null, position: ci.position,
          }];
        }
        return [];
      });

      setItems(unified);

      if (user && unified.length > 0) {
        const ids = unified.map(i => i.itemId);
        const { data: progress } = await supabase
          .from('user_progress')
          .select('item_id, completed, is_favorite')
          .eq('user_id', user.id)
          .in('item_id', ids);
        if (progress) {
          const states: Record<string, ItemState> = {};
          (progress as any[]).forEach(p => {
            states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false };
          });
          setItemStates(states);
        }
      }

      const { data: otherCols } = await supabase
        .from('collections')
        .select('id, title, tagline, photo, content_type')
        .neq('id', id)
        .order('title')
        .limit(4);

      if (otherCols && otherCols.length > 0) {
        const otherIds = (otherCols as CollectionRow[]).map(c => c.id);
        const { data: itemCounts } = await supabase
          .from('collection_items')
          .select('collection_id')
          .in('collection_id', otherIds);
        const countMap: Record<string, number> = {};
        (itemCounts ?? []).forEach((r: any) => {
          countMap[r.collection_id] = (countMap[r.collection_id] ?? 0) + 1;
        });
        setOtherCollections((otherCols as CollectionRow[]).map(c => ({
          ...c, totalItems: countMap[c.id] ?? 0,
        })));
      }

      setLoading(false);
    };

    load();
  }, [id, user]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const getItemType = (itemId: string) =>
    items.find(i => i.itemId === itemId)?.itemType ?? 'wine';

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

  const addReview = async (
    itemId: string,
    review: { photo?: string; comment: string; rating: number },
  ) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? { tried: false, favorite: false }), review },
    }));
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
      photos: review.photo ? [review.photo] : null,
      points_earned: totalPts,
    });
    if (totalPts > 0) toast.success(`+${totalPts} pontos!`, { description: 'Sua avaliação foi registrada 🎉' });
  };

  // ── States ────────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen" style={{ background: '#F2EBE1' }}>

      {/* ── Sticky top bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50"
           style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,90,43,0.10)' }}>
        <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center gap-2">
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

      <div className="max-w-3xl mx-auto">

        {/* ── Hero — big banner like the reference left panel ───────────────── */}
        <div className="relative overflow-hidden" style={{ height: 'min(56vw, 340px)' }}>
          <img
            src={collection.photo || FALLBACK}
            alt={collection.title}
            className="w-full h-full object-cover"
            onError={imgFallback}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

          {/* "Já vivi X/N" badge — top right, like the reference */}
          {items.length > 0 && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-white text-sm font-bold"
                   style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
                <span style={{ opacity: 0.7 }}>Já provei</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '1px 8px' }}>
                  {triedCount}/{items.length}
                </span>
              </div>
            </div>
          )}

          {/* Title + tagline at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
            <h1 className="text-2xl font-bold text-white leading-tight mb-1"
                style={{ fontFamily: '"Fraunces", Georgia, serif', letterSpacing: '-0.02em' }}>
              {collection.title}
            </h1>
            {collection.tagline && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.55 }}>
                {collection.tagline}
              </p>
            )}
          </div>
        </div>

        {/* ── Items ────────────────────────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-10 flex flex-col gap-5">

          {items.length > 0 ? (
            <>
              {/* Count bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B0906A' }}>
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
                {triedCount > 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#2D4A3E' }}>
                    ✓ {triedCount} provado{triedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {items.map(item => (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  state={itemStates[item.itemId] ?? { tried: false, favorite: false }}
                  user={user}
                  onToggleTried={toggleTried}
                  onToggleFavorite={toggleFavorite}
                  onAddReview={addReview}
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
              <p className="text-sm mb-4" style={{ color: '#B0A090' }}>
                Descubra outras coleções
              </p>
              <div className="flex flex-col gap-3">
                {otherCollections.map(c => (
                  <CollectionCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    coverImage={c.photo}
                    description={c.tagline ?? ''}
                    contentType={c.content_type}
                    totalItems={c.totalItems}
                    completedItems={0}
                    progress={0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
