import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Heart, Share2, CheckCircle2, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddReviewSection } from '../components/AddReviewSection';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
}

interface ItemRow {
  item_id: string;
  wines: {
    id: string;
    name: string;
    highlight: string;
    photo: string;
    type: string;
    wineries: { name: string } | null;
  } | null;
}

type ItemState = { tried: boolean; favorite: boolean; review?: { photo?: string; comment: string; rating: number } };

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: col }, { data: its }] = await Promise.all([
        supabase.from('collections').select('id, title, tagline, photo, content_type').eq('id', id).maybeSingle(),
        supabase.from('collection_items')
          .select('item_id, wines(id, name, highlight, photo, type, wineries(name))')
          .eq('collection_id', id)
          .order('position'),
      ]);
      setCollection(col as CollectionRow | null);
      setItems((its as ItemRow[]) ?? []);

      if (user && its) {
        const itemIds = (its as ItemRow[]).map((i) => i.item_id);
        const { data: progress } = await supabase
          .from('user_progress')
          .select('item_id, completed, is_favorite')
          .eq('user_id', user.id)
          .in('item_id', itemIds);
        if (progress) {
          const states: Record<string, ItemState> = {};
          progress.forEach((p: { item_id: string; completed: boolean; is_favorite: boolean }) => {
            states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false };
          });
          setItemStates(states);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleTried = async (itemId: string) => {
    const current = itemStates[itemId] ?? { tried: false, favorite: false };
    const newTried = !current.tried;
    setItemStates((prev) => ({ ...prev, [itemId]: { ...current, tried: newTried } }));
    if (user) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, item_id: itemId, item_type: 'Vinhos', completed: newTried },
        { onConflict: 'user_id,item_id' }
      );
    }
  };

  const toggleFavorite = (itemId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? { tried: false, favorite: false }), favorite: !prev[itemId]?.favorite },
    }));
  };

  const addReview = (itemId: string, review: { photo?: string; comment: string; rating: number }) => {
    setItemStates((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { tried: false, favorite: false }), review } }));
  };

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

  const currentItemRow = items[selectedIndex];
  const currentItem = currentItemRow?.wines;
  const currentState = currentItem ? (itemStates[currentItemRow.item_id] ?? { tried: false, favorite: false }) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
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
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {items.map((row) => {
                    const item = row.wines;
                    if (!item) return null;
                    const state = itemStates[row.item_id] ?? { tried: false, favorite: false };
                    return (
                      <div key={row.item_id} className="flex-[0_0_100%] min-w-0">
                        <div className="relative h-[55vh] bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50">
                          <div className="h-full flex items-center justify-center p-8">
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain drop-shadow-2xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';
                              }}
                            />
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2">
                            {state.tried && <div className="bg-green-500 text-white rounded-full p-2 shadow-lg"><CheckCircle2 className="w-5 h-5" /></div>}
                            {state.favorite && <div className="bg-red-500 text-white rounded-full p-2 shadow-lg"><Heart className="w-5 h-5 fill-white" /></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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

            {/* Item details */}
            <div className="max-w-md mx-auto px-4 py-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentItem.name}</h1>
                {currentItem.wineries && <p className="text-lg text-gray-600 mb-1">{currentItem.wineries.name}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentItem.type && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {currentItem.type}
                    </span>
                  )}
                </div>
              </div>

              {user && currentState && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => toggleTried(currentItemRow.item_id)}
                    className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${currentState.tried ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${currentState.tried ? 'fill-white' : ''}`} />
                    <span className="text-sm">{currentState.tried ? 'Experimentado' : 'Marcar'}</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(currentItemRow.item_id)}
                    className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${currentState.favorite ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Heart className={`w-5 h-5 ${currentState.favorite ? 'fill-white' : ''}`} />
                    <span className="text-sm">{currentState.favorite ? 'Favoritado' : 'Favoritar'}</span>
                  </button>
                </div>
              )}

              <AnimatePresence>
                {user && currentState?.tried && !currentState.review && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                    <AddReviewSection itemId={currentItemRow.item_id} itemName={currentItem.name} onAddReview={addReview} />
                  </motion.div>
                )}
              </AnimatePresence>

              {currentItem.highlight && (
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🍷</span>
                    <h2 className="text-lg font-bold text-gray-900">Por que provar?</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{currentItem.highlight}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto px-4 py-6">
            <div className="relative h-64 rounded-3xl overflow-hidden mb-6 shadow-xl">
              <img
                src={collection.photo}
                alt={collection.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-2xl font-bold text-white mb-1">{collection.title}</h1>
                {collection.tagline && <p className="text-white/80 text-sm">{collection.tagline}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
