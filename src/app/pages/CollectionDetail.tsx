import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronLeft, Share2, CheckCircle2, MapPin,
  X, ChevronRight, Bookmark, ShoppingBag, Loader2, Camera, Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CollectionCard } from '../components/CollectionCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
  saveReview as psSaveReview,
} from '../../lib/pointsSystem';
import { processAndUpload } from '../../lib/imageUtils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollectionRow {
  id: string; title: string; tagline: string | null; photo: string; content_type: string;
}

type ItemType = 'wine' | 'experience' | 'winery';

interface UnifiedItem {
  itemId: string; itemType: ItemType; id: string; name: string; photo: string;
  highlight: string | null; tastingNote: string | null; subName: string | null;
  location: string | null; type: string | null; position: number;
  price_min?: number | null; price_max?: number | null;
}

type ItemState = { tried: boolean; favorite: boolean; rating: number; notes: string; photoUrl: string };

interface OtherCollection {
  id: string; title: string; photo: string; tagline: string | null;
  content_type: string; totalItems: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

function imgFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).src = FALLBACK;
}

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

// ── Fullscreen Item Modal ──────────────────────────────────────────────────────

function ItemModal({
  items, initialIndex, collectionTitle, itemStates,
  onClose, onToggleTried, onToggleFavorite, onSaveReview,
}: {
  items: UnifiedItem[];
  initialIndex: number;
  collectionTitle: string;
  itemStates: Record<string, ItemState>;
  onClose: () => void;
  onToggleTried: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSaveReview: (itemId: string, review: { rating?: number; notes?: string; photoUrl?: string }) => Promise<void>;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const isDesktop = useIsDesktop();

  const [formOpen,     setFormOpen]     = useState(false);
  const [draftRating,  setDraftRating]  = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const item     = items[index];
  const state    = itemStates[item.itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' };
  const isWine   = item.itemType === 'wine';
  const typeLabel = item.type ?? (isWine ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola');
  const note     = item.tastingNote || item.highlight;
  const priceText = item.price_min != null
    ? `R$ ${item.price_min}${item.price_max && item.price_max !== item.price_min ? ` – R$ ${item.price_max}` : ''}`
    : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(items.length - 1, i + 1)), [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  useEffect(() => { setFormOpen(false); setSavingReview(false); }, [index]);

  const handleJaBebi = () => {
    if (!formOpen) {
      setDraftRating(state.rating || 0);
      setDraftComment(state.notes || '');
      setPhotoPreview(state.photoUrl || null);
      setPhotoFile(null);
    }
    setFormOpen(v => !v);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveReview = async () => {
    setSavingReview(true);
    try {
      let photoUrl = state.photoUrl || undefined;
      if (photoFile) photoUrl = await processAndUpload(photoFile);
      await onSaveReview(item.itemId, {
        rating:   draftRating || undefined,
        notes:    draftComment.trim() || undefined,
        photoUrl,
      });
      setFormOpen(false);
    } catch (err) {
      console.error('saveReview error', err);
    } finally {
      setSavingReview(false);
    }
  };

  const InfoContent = () => (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {typeLabel && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: '#F5EEF4', color: '#7B1E5C', padding: '4px 12px', borderRadius: 99 }}>{typeLabel}</span>
        )}
        {note && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#FFF8EC', color: '#B8820B', padding: '4px 12px', borderRadius: 99 }}>★ Destaque</span>
        )}
      </div>
      <h2 style={{ fontFamily: '"Fraunces",Georgia,serif', fontSize: isDesktop ? '1.5rem' : '1.35rem', fontWeight: 700, color: '#1C1209', lineHeight: 1.18, marginBottom: 4 }}>{item.name}</h2>
      {item.subName && <p style={{ fontSize: 13, color: '#7A6855', fontWeight: 500, marginBottom: 6 }}>{item.subName}</p>}
      {item.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: priceText ? 10 : 14 }}>
          <MapPin style={{ width: 11, height: 11, color: '#9B1B4D', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
        </div>
      )}
      {priceText && <p style={{ fontSize: 19, fontWeight: 700, color: '#1C1209', letterSpacing: '-0.01em', marginBottom: 14 }}>{priceText}</p>}
      {item.highlight && (
        <div style={{ background: 'linear-gradient(135deg, #FBF6F0 0%, #F5EDE0 100%)', borderLeft: '3px solid rgba(176,144,106,0.45)', borderRadius: '0 10px 10px 0', padding: '10px 14px', marginBottom: 18 }}>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: '#5C5048', fontStyle: 'italic', margin: 0 }}>{item.highlight}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <button
          onClick={() => onToggleFavorite(item.itemId)}
          title={state.favorite ? 'Remover dos salvos' : 'Salvar'}
          style={{ width: 48, flexShrink: 0, borderRadius: 14, border: `1.5px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.22)'}`, background: state.favorite ? '#6B0035' : 'rgba(107,0,53,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s' }}
        >
          <Bookmark style={{ width: 17, height: 17, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? '#fff' : 'none'} />
        </button>
        <button
          onClick={handleJaBebi}
          style={{ flex: 1, borderRadius: 14, background: state.tried ? (formOpen ? 'linear-gradient(135deg, #3D5A4E 0%, #2D4A3E 100%)' : 'linear-gradient(135deg, #2D4A3E 0%, #1F3B36 100%)') : 'linear-gradient(135deg, #1F3B36 0%, #152B22 100%)', color: state.tried ? '#6BF5A0' : '#fff', fontWeight: 700, fontSize: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: state.tried ? '0 4px 16px rgba(45,74,62,0.30)' : '0 4px 20px rgba(31,59,54,0.40)', transition: 'background 0.2s' }}
        >
          {state.tried
            ? <><CheckCircle2 style={{ width: 16, height: 16, color: '#6BF5A0' }} />Já bebi! {formOpen ? '▲' : '▼'}</>
            : <><CheckCircle2 style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.70)' }} />Já bebi?</>
          }
        </button>
        <button title="Comprar" style={{ width: 48, flexShrink: 0, borderRadius: 14, border: '1.5px solid rgba(28,18,9,0.15)', background: 'rgba(28,18,9,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag style={{ width: 17, height: 17, color: '#5C5048' }} />
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div key="review-form" initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 280 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: '#F8F4EF', borderRadius: 16, padding: '16px 16px 18px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6855', marginBottom: 12 }}>Sua experiência</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setDraftRating(n === draftRating ? 0 : n)} style={{ fontSize: 22, lineHeight: 1, padding: 0, background: 'none', border: 'none', opacity: n <= draftRating ? 1 : 0.22, transform: n <= draftRating ? 'scale(1.1)' : 'scale(1)', transition: 'opacity 0.15s, transform 0.15s' }} title={`${n} taça${n > 1 ? 's' : ''}`}>🍷</button>
                ))}
                {draftRating > 0 && <span style={{ fontSize: 11, color: '#7A6855', marginLeft: 4 }}>{['','Não gostei','Regular','Bom','Muito bom','Excepcional'][draftRating]}</span>}
              </div>
              <textarea value={draftComment} onChange={e => setDraftComment(e.target.value)} placeholder="Como foi sua experiência? (opcional)" rows={3} style={{ width: '100%', border: '1.5px solid rgba(139,90,43,0.18)', borderRadius: 10, padding: '9px 12px', fontSize: 13, resize: 'none', outline: 'none', background: '#fff', color: '#1C1209', fontFamily: 'inherit', lineHeight: 1.55, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button onClick={() => photoInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, border: '1.5px dashed rgba(107,0,53,0.28)', background: 'transparent', fontSize: 12, color: '#6B0035', fontWeight: 600 }}>
                  <Camera style={{ width: 13, height: 13 }} />{photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {photoPreview && (
                  <div style={{ position: 'relative' }}>
                    <img src={photoPreview} alt="preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.10)' }} />
                    <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#6B0035', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X style={{ width: 9, height: 9, color: '#fff' }} />
                    </button>
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => setFormOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#7A6855' }}>Cancelar</button>
                <button onClick={handleSaveReview} disabled={savingReview} style={{ flex: 2, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg, #2D4A3E, #1F3B36)', fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: savingReview ? 0.7 : 1 }}>
                  {savingReview ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Salvando…</> : <><CheckCircle2 style={{ width: 14, height: 14 }} />Confirmar</>}
                </button>
              </div>
              {state.tried && (
                <button onClick={() => { onToggleTried(item.itemId); setFormOpen(false); }} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', fontSize: 11, color: '#B0906A', textDecoration: 'underline', cursor: 'pointer' }}>
                  Remover marcação de "já bebi"
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.tried && !formOpen && (state.rating > 0 || state.notes || state.photoUrl) && (
        <div style={{ marginTop: 14, background: '#F0F7F4', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#2D4A3E' }}>Minha avaliação</p>
            <button onClick={handleJaBebi} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: '#2D4A3E' }}>
              <Pencil style={{ width: 11, height: 11 }} /><span style={{ fontSize: 11, fontWeight: 600 }}>Editar</span>
            </button>
          </div>
          {state.rating > 0 && (
            <div style={{ display: 'flex', gap: 3, marginBottom: state.notes || state.photoUrl ? 6 : 0 }}>
              {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 16, opacity: n <= state.rating ? 1 : 0.18 }}>🍷</span>)}
            </div>
          )}
          {state.notes && <p style={{ fontSize: 13, color: '#3D5A4E', lineHeight: 1.5, fontStyle: 'italic', marginBottom: state.photoUrl ? 8 : 0 }}>"{state.notes}"</p>}
          {state.photoUrl && <img src={state.photoUrl} alt="Minha foto" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />}
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(139,90,43,0.10)', margin: '22px 0 18px' }} />
      {item.tastingNote && item.tastingNote !== item.highlight && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 8 }}>Notas de degustação</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#5C5048' }}>{item.tastingNote}</p>
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 10 }}>Sobre este item</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Tipo', value: typeLabel },
            { label: isWine ? 'Vinícola' : 'Produtor', value: item.subName },
            { label: 'Região', value: item.location },
            { label: 'Preço', value: priceText },
          ].filter(r => r.value).map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(139,90,43,0.08)' }}>
              <span style={{ fontSize: 12, color: '#B0906A', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 12, color: '#1C1209', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const topBarDark = isWine;
  const TopBar = ({ inCard }: { inCard?: boolean }) => (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: inCard ? '14px 16px 10px' : '16px 16px 8px', background: topBarDark ? 'linear-gradient(to bottom, rgba(240,234,222,0.96) 0%, rgba(240,234,222,0) 100%)' : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: topBarDark ? 'rgba(28,18,9,0.10)' : 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', border: topBarDark ? '1px solid rgba(28,18,9,0.14)' : '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14, color: topBarDark ? '#1C1209' : '#fff' }} />
        </button>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: topBarDark ? '#1C1209' : '#fff', lineHeight: 1.3, opacity: 0.85 }}>{collectionTitle}</p>
          <p style={{ fontSize: 9, color: topBarDark ? 'rgba(28,18,9,0.55)' : 'rgba(255,255,255,0.60)', marginTop: 1 }}>{index + 1} de {items.length}</p>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: topBarDark ? 'rgba(28,18,9,0.10)' : 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', border: topBarDark ? '1px solid rgba(28,18,9,0.14)' : '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 style={{ width: 14, height: 14, color: topBarDark ? '#1C1209' : '#fff' }} />
        </button>
      </div>
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} style={{ flex: 1, height: 2, borderRadius: 99, background: i === index ? (topBarDark ? '#6B0035' : '#fff') : (topBarDark ? 'rgba(107,0,53,0.22)' : 'rgba(255,255,255,0.30)'), transition: 'background 0.2s' }} />
          ))}
        </div>
      )}
    </div>
  );

  const PhotoSlide = () => (
    <AnimatePresence mode="wait">
      <motion.div key={item.itemId} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2, ease: 'easeOut' }} style={{ width: '100%', height: '100%' }}>
        {isWine ? (
          <div style={{ width: '100%', height: '100%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 16px' }}>
            <img src={item.photo || FALLBACK} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.20))' }} onError={imgFallback} />
          </div>
        ) : (
          <img src={item.photo || FALLBACK} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={imgFallback} />
        )}
      </motion.div>
    </AnimatePresence>
  );

  if (isDesktop) {
    const CARD_W = 460;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,4,2,0.74)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: `calc(50% - ${CARD_W / 2}px - 60px)`, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.2 : 1, pointerEvents: index === 0 ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <ChevronLeft style={{ width: 22, height: 22, color: '#fff' }} />
        </button>
        <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.93, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} style={{ width: CARD_W, height: '88vh', maxHeight: 860, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.65)' }}>
          <div style={{ height: '54%', flexShrink: 0, position: 'relative', overflow: 'hidden', background: isWine ? '#F5F0E8' : '#1C1209' }}>
            <PhotoSlide />
            <TopBar inCard />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#FFFFFF', padding: '22px 28px 28px' }}>
            <InfoContent />
          </div>
        </motion.div>
        <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', left: `calc(50% + ${CARD_W / 2}px + 12px)`, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === items.length - 1 ? 0.2 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <ChevronRight style={{ width: 22, height: 22, color: '#fff' }} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: isWine ? '#F5F0E8' : '#0A0402', display: 'flex', flexDirection: 'column' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ height: '52svh', flexShrink: 0, position: 'relative', overflow: 'hidden', background: isWine ? '#F5F0E8' : '#0A0402' }}>
        <PhotoSlide />
        <TopBar />
        {items.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: topBarDark ? 'rgba(28,18,9,0.12)' : 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.2 : 1, pointerEvents: index === 0 ? 'none' : 'auto', zIndex: 15 }}>
              <ChevronLeft style={{ width: 18, height: 18, color: topBarDark ? '#1C1209' : '#fff' }} />
            </button>
            <button onClick={next} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: topBarDark ? 'rgba(28,18,9,0.12)' : 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === items.length - 1 ? 0.2 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', zIndex: 15 }}>
              <ChevronRight style={{ width: 18, height: 18, color: topBarDark ? '#1C1209' : '#fff' }} />
            </button>
          </>
        )}
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '22px 22px 0 0', boxShadow: '0 -6px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 3, borderRadius: 99, background: 'rgba(0,0,0,0.13)' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 22px 32px' }}>
          <InfoContent />
        </div>
      </div>
    </motion.div>
  );
}

// ── Compact card for the list ──────────────────────────────────────────────────

function CompactItemCard({
  item, state, onClick, onToggleTried, onToggleFavorite,
}: {
  item: UnifiedItem; state: ItemState; onClick: () => void;
  onToggleTried: (id: string) => void; onToggleFavorite: (id: string) => void;
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
              className="font-bold leading-snug line-clamp-3 mb-0.5"
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

          {/* CTA hint + action buttons */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold" style={{ color: '#690037' }}>Ver detalhes →</span>
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onToggleFavorite(item.itemId)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.22)'}`, background: state.favorite ? '#6B0035' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bookmark style={{ width: 12, height: 12, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? '#fff' : 'none'} />
              </button>
              <button
                onClick={() => onToggleTried(item.itemId)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: state.tried ? '#2D4A3E' : 'rgba(45,74,62,0.10)', border: `1.5px solid ${state.tried ? '#2D4A3E' : 'rgba(45,74,62,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle2 style={{ width: 12, height: 12, color: state.tried ? '#6BF5A0' : '#2D4A3E' }} />
              </button>
            </div>
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
          .from('user_progress').select('item_id, completed, is_favorite, rating, notes, photo_url')
          .eq('user_id', user.id).in('item_id', ids);
        if (progress) {
          const states: Record<string, ItemState> = {};
          (progress as any[]).forEach(p => {
            states[p.item_id] = { tried: p.completed ?? false, favorite: p.is_favorite ?? false, rating: p.rating ?? 0, notes: p.notes ?? '', photoUrl: p.photo_url ?? '' };
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
    const current = itemStates[itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' };
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, tried: !current.tried } }));
    await psToggleTried(user.id, itemId, getItemType(itemId), current.tried);
    if (!current.tried) toast.success('+1 ponto!', { description: 'Item marcado como experimentado ✓' });
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) { toast.error('Entre para favoritar'); return; }
    const current = itemStates[itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' };
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, favorite: !current.favorite } }));
    await psToggleFavorite(user.id, itemId, getItemType(itemId), current.favorite);
    if (!current.favorite) toast.success('+1 ponto!', { description: 'Adicionado aos favoritos ❤️' });
  };

  const saveReview = async (itemId: string, review: { rating?: number; notes?: string; photoUrl?: string }) => {
    if (!user) return;
    const current = itemStates[itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' };
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...current,
        tried: true,
        rating: review.rating ?? current.rating,
        notes: review.notes ?? current.notes,
        photoUrl: review.photoUrl ?? current.photoUrl,
      },
    }));
    const itemType = getItemType(itemId);
    if (!current.tried) await psToggleTried(user.id, itemId, itemType, false);
    await psSaveReview(user.id, itemId, itemType, review);
    toast.success('Avaliação salva!', { description: 'Sua experiência foi registrada 🎉' });
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
                    state={itemStates[item.itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' }}
                    onClick={() => setModalIndex(i)}
                    onToggleTried={toggleTried}
                    onToggleFavorite={toggleFavorite}
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
            onClose={() => setModalIndex(null)}
            onToggleTried={toggleTried}
            onToggleFavorite={toggleFavorite}
            onSaveReview={saveReview}
          />
        )}
      </AnimatePresence>
    </>
  );
}
