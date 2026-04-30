import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Heart, Share2, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
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

// ── Data types ─────────────────────────────────────────────────────────────────

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

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [items, setItems]           = useState<UnifiedItem[]>([]);
  const [otherCollections, setOtherCollections] = useState<OtherCollection[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});

  // Scroll to top whenever we enter a new collection
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop:      false,
    align:     'center',
    dragFree:  false,
    watchDrag: true,
  });

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

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
        .limit(5);

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
    if (!user) return;
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: !current.tried } }));
    await psToggleTried(user.id, itemId, getItemType(itemId), current.tried);
    if (!current.tried) toast.success('+1 ponto!', { description: 'Item marcado como experimentado ✓' });
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) return;
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

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDE0' }}>
        <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: '#6B0035', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDE0' }}>
        <div className="text-center">
          <p className="mb-2" style={{ color: '#7A6855' }}>Coleção não encontrada</p>
          <Link to="/" style={{ color: '#6B0035' }} className="hover:underline">Voltar para início</Link>
        </div>
      </div>
    );
  }

  const currentItem  = items[selectedIndex] ?? null;
  const currentState = currentItem ? (itemStates[currentItem.itemId] ?? { tried: false, favorite: false }) : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#F5EDE0' }}>

      {/* ── Fixed top bar ──────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50"
           style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,90,43,0.12)' }}>
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2">
          <Link
            to="/"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: '#F5EDE0' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#1C1209' }} />
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-bold truncate leading-tight"
               style={{ color: '#1C1209', fontFamily: '"Fraunces", Georgia, serif' }}>
              {collection.title}
            </p>
            {items.length > 0 && (
              <p className="text-[11px] leading-none mt-0.5" style={{ color: '#B0A090' }}>
                {selectedIndex + 1} de {items.length}
              </p>
            )}
          </div>

          <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F5EDE0' }}>
            <Share2 className="w-4 h-4" style={{ color: '#1C1209' }} />
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="pt-14">

        {items.length > 0 && currentItem ? (
          <>
            {/* ── Product header — ABOVE the image ─────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="max-w-md mx-auto px-4 pt-4 pb-3"
              >
                {/* Item type label */}
                {currentItem.type && (
                  <div className="mb-2">
                    <span className="chip"
                          style={{
                            background: currentItem.itemType === 'wine' ? '#F8EBF1' : currentItem.itemType === 'experience' ? '#FBF3DC' : '#E8F0EC',
                            color: currentItem.itemType === 'wine' ? '#6B0035' : currentItem.itemType === 'experience' ? '#7A4F07' : '#2D4A3E',
                          }}>
                      {currentItem.itemType === 'experience' ? `✨ ${currentItem.type}` : currentItem.type}
                    </span>
                  </div>
                )}

                {/* Item name */}
                <h1 className="text-2xl font-bold leading-tight mb-1"
                    style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209', letterSpacing: '-0.02em' }}>
                  {currentItem.name}
                </h1>

                {/* Sub-name (winery) */}
                {currentItem.subName && (
                  <p className="text-base mb-1" style={{ color: '#7A6855' }}>{currentItem.subName}</p>
                )}

                {/* Location */}
                {currentItem.location && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: '#B0A090' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9B1B4D' }} />
                    <span>{currentItem.location}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ── Image carousel ────────────────────────────────────────────── */}
            <div className="relative select-none">
              {/* Embla container */}
              <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                <div className="flex touch-pan-y">
                  {items.map((item) => {
                    const state  = itemStates[item.itemId] ?? { tried: false, favorite: false };
                    const isWine = item.itemType === 'wine';
                    return (
                      <div key={item.itemId} className="flex-[0_0_100%] min-w-0 px-4">
                        <div
                          className="relative overflow-hidden"
                          style={{
                            height: '52vw',
                            maxHeight: '340px',
                            minHeight: '200px',
                            borderRadius: '20px',
                            background: isWine
                              ? 'linear-gradient(135deg, #F8EBF1 0%, #FBF7F2 100%)'
                              : '#1C1209',
                          }}
                        >
                          {isWine ? (
                            <div className="h-full flex items-center justify-center p-6">
                              <img
                                src={item.photo || FALLBACK}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain drop-shadow-2xl"
                                onError={imgFallback}
                                draggable={false}
                              />
                            </div>
                          ) : (
                            <>
                              <img
                                src={item.photo || FALLBACK}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={imgFallback}
                                draggable={false}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            </>
                          )}

                          {/* Status badges */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            {state.tried && (
                              <div className="rounded-full p-1.5 shadow-md"
                                   style={{ background: '#2D4A3E' }}>
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {state.favorite && (
                              <div className="rounded-full p-1.5 shadow-md"
                                   style={{ background: '#6B0035' }}>
                                <Heart className="w-4 h-4 text-white fill-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Prev arrow ─────────────────────────────────────────────── */}
              {items.length > 1 && (
                <>
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    disabled={selectedIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: selectedIndex === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.92)',
                      boxShadow: selectedIndex === 0 ? 'none' : '0 2px 8px rgba(28,18,9,0.15)',
                      backdropFilter: 'blur(6px)',
                      opacity: selectedIndex === 0 ? 0 : 1,
                      pointerEvents: selectedIndex === 0 ? 'none' : 'auto',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: '#1C1209' }} />
                  </button>

                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    disabled={selectedIndex === items.length - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: selectedIndex === items.length - 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.92)',
                      boxShadow: selectedIndex === items.length - 1 ? 'none' : '0 2px 8px rgba(28,18,9,0.15)',
                      backdropFilter: 'blur(6px)',
                      opacity: selectedIndex === items.length - 1 ? 0 : 1,
                      pointerEvents: selectedIndex === items.length - 1 ? 'none' : 'auto',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: '#1C1209' }} />
                  </button>
                </>
              )}
            </div>

            {/* ── Dot indicators + swipe hint ──────────────────────────────── */}
            {items.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 mb-1">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      height: '6px',
                      width: i === selectedIndex ? '24px' : '6px',
                      background: i === selectedIndex ? '#6B0035' : 'rgba(139,90,43,0.25)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* ── Actions + details ────────────────────────────────────────── */}
            <div className="max-w-md mx-auto px-4 pt-5 pb-8">

              {/* Tried / Favorite */}
              {user && currentState && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => toggleTried(currentItem.itemId)}
                    className="py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: currentState.tried ? '#2D4A3E' : '#EDE4D6',
                      color:      currentState.tried ? '#FFFFFF' : '#7A6855',
                      boxShadow:  currentState.tried ? '0 2px 8px rgba(45,74,62,0.30)' : 'none',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ fill: currentState.tried ? 'white' : 'none' }} />
                    {currentState.tried ? 'Experimentado' : 'Marcar'}
                  </button>

                  <button
                    onClick={() => toggleFavorite(currentItem.itemId)}
                    className="py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: currentState.favorite ? '#6B0035' : '#EDE4D6',
                      color:      currentState.favorite ? '#FFFFFF' : '#7A6855',
                      boxShadow:  currentState.favorite ? '0 2px 8px rgba(107,0,53,0.30)' : 'none',
                    }}
                  >
                    <Heart className="w-4 h-4" style={{ fill: currentState.favorite ? 'white' : 'none' }} />
                    {currentState.favorite ? 'Favoritado' : 'Favoritar'}
                  </button>
                </div>
              )}

              {/* Review section */}
              <AnimatePresence>
                {user && currentState?.tried && !currentState.review && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <AddReviewSection
                      itemId={currentItem.itemId}
                      itemName={currentItem.name}
                      onAddReview={addReview}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Existing review */}
              {currentState?.review && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 mb-6"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(139,90,43,0.12)', boxShadow: '0 2px 8px rgba(28,18,9,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold" style={{ color: '#1C1209', fontFamily: '"Fraunces", Georgia, serif' }}>Sua Avaliação</h3>
                    <span className="text-xs font-semibold" style={{ color: '#2D4A3E' }}>✓ Pontos ganhos</span>
                  </div>
                  {currentState.review.rating > 0 && (
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="text-xl"
                              style={{ color: s <= currentState.review!.rating ? '#B8820B' : '#EDE4D6' }}>★</span>
                      ))}
                    </div>
                  )}
                  {currentState.review.photo && (
                    <img src={currentState.review.photo} alt="Review"
                         className="w-full h-44 object-cover rounded-xl mb-3" />
                  )}
                  {currentState.review.comment && (
                    <p className="leading-relaxed" style={{ color: '#7A6855' }}>{currentState.review.comment}</p>
                  )}
                </motion.div>
              )}

              {/* "Por que...?" */}
              {currentItem.highlight && (
                <div className="rounded-2xl p-5 mb-5"
                     style={{ background: '#FFFFFF', border: '1px solid rgba(139,90,43,0.12)', boxShadow: '0 2px 8px rgba(28,18,9,0.07)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{WHY_EMOJI[currentItem.itemType]}</span>
                    <h2 className="text-base font-bold"
                        style={{ color: '#1C1209', fontFamily: '"Fraunces", Georgia, serif' }}>
                      {WHY_LABEL[currentItem.itemType]}
                    </h2>
                  </div>
                  <p className="leading-relaxed text-sm" style={{ color: '#7A6855' }}>{currentItem.highlight}</p>
                </div>
              )}

              {/* Tasting note */}
              {currentItem.tastingNote && (
                <div className="rounded-2xl p-5 mb-6"
                     style={{ background: '#FBF7F2', border: '1px solid rgba(139,90,43,0.10)' }}>
                  <h2 className="text-base font-bold mb-3"
                      style={{ color: '#1C1209', fontFamily: '"Fraunces", Georgia, serif' }}>Descrição</h2>
                  <p className="leading-relaxed text-sm" style={{ color: '#7A6855' }}>{currentItem.tastingNote}</p>
                </div>
              )}

              {/* Continue Explorando */}
              {otherCollections.length > 0 && (
                <div className="pt-6 border-t pb-8" style={{ borderColor: 'rgba(139,90,43,0.12)' }}>
                  <h2 className="text-xl font-bold mb-1 section-title">Continue Explorando</h2>
                  <p className="text-sm mb-5" style={{ color: '#B0A090' }}>Descubra outras coleções que você vai adorar</p>
                  <div>
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
          </>
        ) : (
          /* Empty collection */
          <div className="max-w-md mx-auto px-4 py-6">
            <div className="relative h-64 rounded-3xl overflow-hidden mb-6"
                 style={{ boxShadow: '0 8px 24px rgba(28,18,9,0.12)' }}>
              <img src={collection.photo || FALLBACK} alt={collection.title}
                   className="w-full h-full object-cover" onError={imgFallback} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-2xl font-bold text-white mb-1"
                    style={{ fontFamily: '"Fraunces", Georgia, serif' }}>{collection.title}</h1>
                {collection.tagline && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>{collection.tagline}</p>
                )}
              </div>
            </div>
            <p className="text-center" style={{ color: '#B0A090' }}>Esta coleção ainda não tem itens.</p>
          </div>
        )}
      </div>
    </div>
  );
}
