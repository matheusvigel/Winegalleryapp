import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Heart, Share2, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddReviewSection } from '../components/AddReviewSection';
import { CollectionCard } from '../components/CollectionCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  itemId: string;      // collection_items.item_id
  itemType: ItemType;
  id: string;
  name: string;
  photo: string;
  highlight: string | null;
  tastingNote: string | null;   // wines: tasting_note
  subName: string | null;       // wines: winery name
  location: string | null;      // region name
  type: string | null;          // wine type or category
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

// ── Why-label by item/collection type ─────────────────────────────────────────

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

// ── Fallback image ─────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [otherCollections, setOtherCollections] = useState<OtherCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // ── Data loading ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      // 1. Collection header
      const { data: col } = await supabase
        .from('collections')
        .select('id, title, tagline, photo, content_type')
        .eq('id', id)
        .maybeSingle();

      setCollection(col as CollectionRow | null);

      // 2. Collection items (ordered)
      const { data: ciRows } = await supabase
        .from('collection_items')
        .select('item_id, item_type, position')
        .eq('collection_id', id)
        .order('position');

      const rawItems = (ciRows ?? []) as { item_id: string; item_type: string; position: number }[];

      // 3. Group by item_type
      const wineIds       = rawItems.filter(r => r.item_type === 'wine').map(r => r.item_id);
      const experienceIds = rawItems.filter(r => r.item_type === 'experience').map(r => r.item_id);
      const wineryIds     = rawItems.filter(r => r.item_type === 'winery').map(r => r.item_id);

      // 4. Fetch each type in parallel
      const [
        { data: wineRows },
        { data: expRows },
        { data: wineryRows },
      ] = await Promise.all([
        wineIds.length
          ? supabase
              .from('wines')
              .select('id, name, photo, highlight, tasting_note, type, wineries(name, region:region_id(name))')
              .in('id', wineIds)
          : Promise.resolve({ data: [] }),

        experienceIds.length
          ? supabase
              .from('experiences')
              .select('id, name, photo, highlight, category, winery:winery_id(name), region:region_id(name)')
              .in('id', experienceIds)
          : Promise.resolve({ data: [] }),

        wineryIds.length
          ? supabase
              .from('wineries')
              .select('id, name, photo, highlight, category, region:region_id(name)')
              .in('id', wineryIds)
          : Promise.resolve({ data: [] }),
      ]);

      // 5. Build lookup maps
      const wineMap   = new Map((wineRows   ?? []).map((r: any) => [r.id, r]));
      const expMap    = new Map((expRows    ?? []).map((r: any) => [r.id, r]));
      const wineryMap = new Map((wineryRows ?? []).map((r: any) => [r.id, r]));

      // 6. Reassemble in position order
      const unified: UnifiedItem[] = rawItems.flatMap((ci) => {
        const type = ci.item_type as ItemType;

        if (type === 'wine') {
          const w = wineMap.get(ci.item_id) as any;
          if (!w) return [];
          return [{
            itemId: ci.item_id,
            itemType: 'wine',
            id: w.id,
            name: w.name,
            photo: w.photo ?? '',
            highlight: w.highlight ?? null,
            tastingNote: w.tasting_note ?? null,
            subName: w.wineries?.name ?? null,
            location: (w.wineries as any)?.region?.name ?? null,
            type: w.type ?? null,
            position: ci.position,
          }];
        }

        if (type === 'experience') {
          const e = expMap.get(ci.item_id) as any;
          if (!e) return [];
          return [{
            itemId: ci.item_id,
            itemType: 'experience',
            id: e.id,
            name: e.name,
            photo: e.photo ?? '',
            highlight: e.highlight ?? null,
            tastingNote: null,
            subName: e.winery?.name ?? null,
            location: e.region?.name ?? null,
            type: e.category ?? null,
            position: ci.position,
          }];
        }

        if (type === 'winery') {
          const w = wineryMap.get(ci.item_id) as any;
          if (!w) return [];
          return [{
            itemId: ci.item_id,
            itemType: 'winery',
            id: w.id,
            name: w.name,
            photo: w.photo ?? '',
            highlight: w.highlight ?? null,
            tastingNote: null,
            subName: null,
            location: w.region?.name ?? null,
            type: w.category ?? null,
            position: ci.position,
          }];
        }

        return [];
      });

      setItems(unified);

      // 7. User progress for these items
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

      // 8. Other collections for "Continue Explorando"
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
          ...c,
          totalItems: countMap[c.id] ?? 0,
        })));
      }

      setLoading(false);
    };

    load();
  }, [id, user]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const toggleTried = async (itemId: string) => {
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const newTried = !current.tried;
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: newTried } }));
    if (user) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, item_id: itemId, item_type: 'wine', completed: newTried },
        { onConflict: 'user_id,item_id' }
      );
    }
  };

  const toggleFavorite = async (itemId: string) => {
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const newFav = !current.favorite;
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, favorite: newFav } }));
    if (user) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, item_id: itemId, item_type: 'wine', is_favorite: newFav },
        { onConflict: 'user_id,item_id' }
      );
    }
  };

  const addReview = (itemId: string, review: { photo?: string; comment: string; rating: number }) => {
    setItemStates(prev => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { tried: false, favorite: false }), review } }));
  };

  // ── Render: loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Coleção não encontrada</p>
          <Link to="/" className="text-purple-600 hover:underline">Voltar para início</Link>
        </div>
      </div>
    );
  }

  const currentItem = items[selectedIndex] ?? null;
  const currentState = currentItem
    ? (itemStates[currentItem.itemId] ?? { tried: false, favorite: false })
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </Link>
            <div className="flex-1 text-center px-4">
              <p className="text-sm font-semibold text-gray-900 truncate">{collection.title}</p>
              {items.length > 0 && (
                <p className="text-xs text-gray-500">{selectedIndex + 1} de {items.length}</p>
              )}
            </div>
            <button className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {items.length > 0 && currentItem ? (
          <>
            {/* ── Carousel ──────────────────────────────────────────────────── */}
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {items.map((item) => {
                    const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
                    const isWine = item.itemType === 'wine';
                    return (
                      <div key={item.itemId} className="flex-[0_0_100%] min-w-0">
                        <div className={`relative h-[55vh] ${isWine ? 'bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50' : 'bg-black'}`}>
                          {isWine ? (
                            /* Wine: centered bottle */
                            <div className="h-full flex items-center justify-center p-8">
                              <img
                                src={item.photo || FALLBACK}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain drop-shadow-2xl"
                                onError={imgFallback}
                              />
                            </div>
                          ) : (
                            /* Experience / Winery: full-width cover */
                            <>
                              <img
                                src={item.photo || FALLBACK}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={imgFallback}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </>
                          )}

                          {/* Status badges */}
                          <div className="absolute top-4 right-4 flex gap-2">
                            {state.tried && (
                              <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                            )}
                            {state.favorite && (
                              <div className="bg-red-500 text-white rounded-full p-2 shadow-lg">
                                <Heart className="w-5 h-5 fill-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nav arrows */}
              {items.length > 1 && (
                <>
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-opacity ${selectedIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-opacity ${selectedIndex === items.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all ${i === selectedIndex ? 'w-8 bg-white shadow-lg' : 'w-2 bg-white/50'}`}
                  />
                ))}
              </div>
            </div>

            {/* ── Item details ─────────────────────────────────────────────── */}
            <div className="max-w-md mx-auto px-4 py-6">

              {/* Name + sub-info */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentItem.name}</h1>
                {currentItem.subName && (
                  <p className="text-lg text-gray-600 mb-1">{currentItem.subName}</p>
                )}
                {currentItem.location && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{currentItem.location}, Brasil</span>
                  </div>
                )}
                {currentItem.type && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {currentItem.itemType === 'experience' ? `✨ ${currentItem.type}` : currentItem.type}
                    </span>
                  </div>
                )}
              </div>

              {/* Tried / Favorite — only for logged-in users */}
              {user && currentState && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => toggleTried(currentItem.itemId)}
                    className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      currentState.tried
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${currentState.tried ? 'fill-white' : ''}`} />
                    <span className="text-sm">{currentState.tried ? 'Experimentado' : 'Marcar'}</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(currentItem.itemId)}
                    className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      currentState.favorite
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${currentState.favorite ? 'fill-white' : ''}`} />
                    <span className="text-sm">{currentState.favorite ? 'Favoritado' : 'Favoritar'}</span>
                  </button>
                </div>
              )}

              {/* Review section — appears after marking tried */}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Sua Avaliação</h3>
                    <span className="text-sm text-green-600 font-medium">✓ Pontos ganhos</span>
                  </div>
                  {currentState.review.rating > 0 && (
                    <div className="flex gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xl ${s <= currentState.review!.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  )}
                  {currentState.review.photo && (
                    <img src={currentState.review.photo} alt="Review" className="w-full h-48 object-cover rounded-xl mb-3" />
                  )}
                  {currentState.review.comment && (
                    <p className="text-gray-700 leading-relaxed">{currentState.review.comment}</p>
                  )}
                </motion.div>
              )}

              {/* "Por que beber/viver/visitar?" */}
              {currentItem.highlight && (
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{WHY_EMOJI[currentItem.itemType]}</span>
                    <h2 className="text-lg font-bold text-gray-900">
                      {WHY_LABEL[currentItem.itemType]}
                    </h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{currentItem.highlight}</p>
                </div>
              )}

              {/* Descrição — wines: tasting_note */}
              {currentItem.tastingNote && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Descrição</h2>
                  <p className="text-gray-700 leading-relaxed">{currentItem.tastingNote}</p>
                </div>
              )}

              {/* Continue Explorando */}
              {otherCollections.length > 0 && (
                <div className="border-t border-gray-200 pt-8 pb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Continue Explorando</h2>
                  <p className="text-gray-600 mb-6 text-sm">Descubra outras coleções que você vai adorar</p>
                  <div className="space-y-0">
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
          /* Empty collection fallback */
          <div className="max-w-md mx-auto px-4 py-6">
            <div className="relative h-64 rounded-3xl overflow-hidden mb-6 shadow-xl">
              <img
                src={collection.photo || FALLBACK}
                alt={collection.title}
                className="w-full h-full object-cover"
                onError={imgFallback}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-2xl font-bold text-white mb-1">{collection.title}</h1>
                {collection.tagline && <p className="text-white/80 text-sm">{collection.tagline}</p>}
              </div>
            </div>
            <p className="text-center text-gray-500">Esta coleção ainda não tem itens.</p>
          </div>
        )}
      </div>
    </div>
  );
}
