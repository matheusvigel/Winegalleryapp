import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X, Search, Bookmark, MapPin, Share2, Eye, CheckCircle2, ShoppingBag, Loader2, Camera, Star, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PROFILE_LABELS, PROFILE_ICONS, type WineProfile } from '../../lib/profileConstants';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
  saveReview as psSaveReview,
} from '../../lib/pointsSystem';
import { processAndUpload } from '../../lib/imageUtils';

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

type ItemState = { tried: boolean; favorite: boolean; rating: number; notes: string; photoUrl: string };

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
  onSaveReview,
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

  // ── Review form state ────────────────────────────────────────────────────
  const [formOpen,      setFormOpen]      = useState(false);
  const [draftRating,   setDraftRating]   = useState(0);
  const [draftComment,  setDraftComment]  = useState('');
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [photoFile,     setPhotoFile]     = useState<File | null>(null);
  const [savingReview,  setSavingReview]  = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const item  = items[index];
  const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
  const isWine = item.itemType === 'wine';
  const typeLabel = item.type ?? (isWine ? 'Vinho' : item.itemType === 'experience' ? 'Experiência' : 'Vinícola');
  const note  = item.tastingNote || item.highlight;
  const priceText = item.price_min != null
    ? `R$ ${item.price_min}${item.price_max && item.price_max !== item.price_min ? ` – R$ ${item.price_max}` : ''}`
    : null;

  // Lock body scroll
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

  // Reset form when item changes
  useEffect(() => {
    setFormOpen(false);
    setSavingReview(false);
  }, [index]);

  // ── Review form handlers ─────────────────────────────────────────────────
  const handleJaBebi = () => {
    // If already tried, toggle form (to view/edit). If not tried, open form.
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
      if (photoFile) {
        photoUrl = await processAndUpload(photoFile);
      }
      await onSaveReview(item.itemId, {
        rating:   draftRating || undefined,
        notes:    draftComment.trim() || undefined,
        photoUrl: photoUrl,
      });
      setFormOpen(false);
    } catch (err) {
      console.error('saveReview error', err);
    } finally {
      setSavingReview(false);
    }
  };

  // ── Shared: info panel content (used in both layouts) ──────────────────────
  const InfoContent = () => (
    <>
      {/* ── Type + badge row ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {typeLabel && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            background: '#F5EEF4', color: '#7B1E5C', padding: '4px 12px', borderRadius: 99,
          }}>{typeLabel}</span>
        )}
        {note && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: '#FFF8EC', color: '#B8820B',
            padding: '4px 12px', borderRadius: 99,
          }}>★ Destaque</span>
        )}
      </div>

      {/* ── Name ── */}
      <h2 style={{
        fontFamily: '"Fraunces",Georgia,serif',
        fontSize: isDesktop ? '1.5rem' : '1.35rem',
        fontWeight: 700, color: '#1C1209', lineHeight: 1.18, marginBottom: 4,
      }}>{item.name}</h2>

      {/* ── Winery / sub ── */}
      {item.subName && (
        <p style={{ fontSize: 13, color: '#7A6855', fontWeight: 500, marginBottom: 6 }}>{item.subName}</p>
      )}

      {/* ── Location ── */}
      {item.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: priceText ? 10 : 14 }}>
          <MapPin style={{ width: 11, height: 11, color: '#9B1B4D', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#9B1B4D', fontWeight: 500 }}>{item.location}</span>
        </div>
      )}

      {/* ── Price ── */}
      {priceText && (
        <p style={{ fontSize: 19, fontWeight: 700, color: '#1C1209', letterSpacing: '-0.01em', marginBottom: 14 }}>{priceText}</p>
      )}

      {/* ── Highlight quote ── */}
      {item.highlight && (
        <div style={{
          background: 'linear-gradient(135deg, #FBF6F0 0%, #F5EDE0 100%)',
          borderLeft: '3px solid rgba(176,144,106,0.45)',
          borderRadius: '0 10px 10px 0',
          padding: '10px 14px', marginBottom: 18,
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: '#5C5048', fontStyle: 'italic', margin: 0 }}>
            {item.highlight}
          </p>
        </div>
      )}

      {/* ── Action row ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {/* Salvar */}
        <button
          onClick={() => onToggleFavorite(item.itemId)}
          title={state.favorite ? 'Remover dos salvos' : 'Salvar'}
          style={{
            width: 48, flexShrink: 0, borderRadius: 14,
            border: `1.5px solid ${state.favorite ? '#6B0035' : 'rgba(107,0,53,0.22)'}`,
            background: state.favorite ? '#6B0035' : 'rgba(107,0,53,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.18s',
          }}
        >
          <Bookmark style={{ width: 17, height: 17, color: state.favorite ? '#fff' : '#6B0035' }} fill={state.favorite ? '#fff' : 'none'} />
        </button>

        {/* Já bebi — opens/closes the review form */}
        <button
          onClick={handleJaBebi}
          style={{
            flex: 1, borderRadius: 14,
            background: state.tried
              ? (formOpen ? 'linear-gradient(135deg, #3D5A4E 0%, #2D4A3E 100%)' : 'linear-gradient(135deg, #2D4A3E 0%, #1F3B36 100%)')
              : 'linear-gradient(135deg, #1F3B36 0%, #152B22 100%)',
            color: state.tried ? '#6BF5A0' : '#fff',
            fontWeight: 700, fontSize: 14,
            padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: state.tried ? '0 4px 16px rgba(45,74,62,0.30)' : '0 4px 20px rgba(31,59,54,0.40)',
            transition: 'background 0.2s',
          }}
        >
          {state.tried
            ? <><CheckCircle2 style={{ width: 16, height: 16, color: '#6BF5A0' }} />Já bebi! {formOpen ? '▲' : '▼'}</>
            : <><CheckCircle2 style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.70)' }} />Já bebi?</>
          }
        </button>

        {/* Comprar */}
        <button title="Comprar" style={{
          width: 48, flexShrink: 0, borderRadius: 14,
          border: '1.5px solid rgba(28,18,9,0.15)',
          background: 'rgba(28,18,9,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShoppingBag style={{ width: 17, height: 17, color: '#5C5048' }} />
        </button>
      </div>

      {/* ══ Review form (expands below action row) ══════════════════════════ */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="review-form"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: '#F8F4EF', borderRadius: 16, padding: '16px 16px 18px' }}>
              {/* Section title */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6855', marginBottom: 12 }}>
                Sua experiência
              </p>

              {/* Rating — wine glasses 1-5 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDraftRating(n === draftRating ? 0 : n)}
                    style={{
                      fontSize: 22, lineHeight: 1, padding: 0, background: 'none', border: 'none',
                      opacity: n <= draftRating ? 1 : 0.22,
                      transform: n <= draftRating ? 'scale(1.1)' : 'scale(1)',
                      transition: 'opacity 0.15s, transform 0.15s',
                    }}
                    title={`${n} taça${n > 1 ? 's' : ''}`}
                  >🍷</button>
                ))}
                {draftRating > 0 && (
                  <span style={{ fontSize: 11, color: '#7A6855', marginLeft: 4 }}>
                    {['', 'Não gostei', 'Regular', 'Bom', 'Muito bom', 'Excepcional'][draftRating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              <textarea
                value={draftComment}
                onChange={e => setDraftComment(e.target.value)}
                placeholder="Como foi sua experiência? (opcional)"
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid rgba(139,90,43,0.18)', borderRadius: 10,
                  padding: '9px 12px', fontSize: 13, resize: 'none', outline: 'none',
                  background: '#fff', color: '#1C1209', fontFamily: 'inherit',
                  lineHeight: 1.55,
                  boxSizing: 'border-box',
                }}
              />

              {/* Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 13px', borderRadius: 8,
                    border: '1.5px dashed rgba(107,0,53,0.28)',
                    background: 'transparent', fontSize: 12, color: '#6B0035', fontWeight: 600,
                  }}
                >
                  <Camera style={{ width: 13, height: 13 }} />
                  {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {photoPreview && (
                  <div style={{ position: 'relative' }}>
                    <img src={photoPreview} alt="preview"
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.10)' }} />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#6B0035', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X style={{ width: 9, height: 9, color: '#fff' }} />
                    </button>
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
              </div>

              {/* Form actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => setFormOpen(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    border: '1.5px solid rgba(0,0,0,0.10)', background: 'transparent',
                    fontSize: 13, fontWeight: 600, color: '#7A6855',
                  }}
                >Cancelar</button>
                <button
                  onClick={handleSaveReview}
                  disabled={savingReview}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #2D4A3E, #1F3B36)',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: savingReview ? 0.7 : 1,
                  }}
                >
                  {savingReview
                    ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Salvando…</>
                    : <><CheckCircle2 style={{ width: 14, height: 14 }} />Confirmar</>
                  }
                </button>
              </div>

              {/* Remove (un-try) */}
              {state.tried && (
                <button
                  onClick={() => { onToggleTried(item.itemId); setFormOpen(false); }}
                  style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', fontSize: 11, color: '#B0906A', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Remover marcação de "já bebi"
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Saved review display (when tried + has review + form closed) ══════ */}
      {state.tried && !formOpen && (state.rating > 0 || state.notes || state.photoUrl) && (
        <div style={{ marginTop: 14, background: '#F0F7F4', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#2D4A3E' }}>
              Minha avaliação
            </p>
            <button onClick={handleJaBebi} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: '#2D4A3E' }}>
              <Pencil style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Editar</span>
            </button>
          </div>
          {state.rating > 0 && (
            <div style={{ display: 'flex', gap: 3, marginBottom: state.notes || state.photoUrl ? 6 : 0 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize: 16, opacity: n <= state.rating ? 1 : 0.18 }}>🍷</span>
              ))}
            </div>
          )}
          {state.notes && (
            <p style={{ fontSize: 13, color: '#3D5A4E', lineHeight: 1.5, fontStyle: 'italic', marginBottom: state.photoUrl ? 8 : 0 }}>
              "{state.notes}"
            </p>
          )}
          {state.photoUrl && (
            <img src={state.photoUrl} alt="Minha foto"
              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
          )}
        </div>
      )}

      {/* ══ Extended details section (always scrollable below) ════════════ */}
      <div style={{ height: 1, background: 'rgba(139,90,43,0.10)', margin: '22px 0 18px' }} />

      {/* Full tasting note (shown only if different from the highlight) */}
      {item.tastingNote && item.tastingNote !== item.highlight && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 8 }}>
            Notas de degustação
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#5C5048' }}>{item.tastingNote}</p>
        </div>
      )}

      {/* Details grid */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 10 }}>
          Sobre este item
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Tipo',     value: typeLabel     },
            { label: isWine ? 'Vinícola' : 'Produtor', value: item.subName },
            { label: 'Região',   value: item.location  },
            { label: 'Preço',    value: priceText      },
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

  // ── Top bar (shared, adapts contrast to photo background) ────────────────
  // For wine items the photo bg is cream — use dark text; otherwise white.
  const topBarDark = isWine;
  const TopBar = ({ inCard }: { inCard?: boolean }) => (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      padding: inCard ? '14px 16px 10px' : '16px 16px 8px',
      background: topBarDark
        ? 'linear-gradient(to bottom, rgba(240,234,222,0.96) 0%, rgba(240,234,222,0) 100%)'
        : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onClose}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: topBarDark ? 'rgba(28,18,9,0.10)' : 'rgba(0,0,0,0.32)',
            backdropFilter: 'blur(8px)',
            border: topBarDark ? '1px solid rgba(28,18,9,0.14)' : '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X style={{ width: 14, height: 14, color: topBarDark ? '#1C1209' : '#fff' }} />
        </button>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: topBarDark ? '#1C1209' : '#fff', lineHeight: 1.3, opacity: 0.85 }}>
            {collectionTitle}
          </p>
          <p style={{ fontSize: 9, color: topBarDark ? 'rgba(28,18,9,0.55)' : 'rgba(255,255,255,0.60)', marginTop: 1 }}>
            {index + 1} de {items.length}
          </p>
        </div>
        <button
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: topBarDark ? 'rgba(28,18,9,0.10)' : 'rgba(0,0,0,0.32)',
            backdropFilter: 'blur(8px)',
            border: topBarDark ? '1px solid rgba(28,18,9,0.14)' : '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Share2 style={{ width: 14, height: 14, color: topBarDark ? '#1C1209' : '#fff' }} />
        </button>
      </div>
      {/* Progress segments */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                flex: 1, height: 2, borderRadius: 99,
                background: i === index
                  ? (topBarDark ? '#6B0035' : '#fff')
                  : (topBarDark ? 'rgba(107,0,53,0.22)' : 'rgba(255,255,255,0.30)'),
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ── Photo slide animation ───────────────────────────────────────────────
  const PhotoSlide = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.itemId}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        {isWine ? (
          <div style={{ width: '100%', height: '100%', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 16px' }}>
            <img
              src={item.photo || FALLBACK} alt={item.name}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.20))' }}
              onError={imgFallback}
            />
          </div>
        ) : (
          <img src={item.photo || FALLBACK} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={imgFallback}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  // ══════════════════════════════════════════════════════════════════════
  // DESKTOP — centered portrait overlay
  // ══════════════════════════════════════════════════════════════════════
  if (isDesktop) {
    const CARD_W = 460;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,4,2,0.74)',
          backdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* ← Prev arrow */}
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          style={{
            position: 'absolute', left: `calc(50% - ${CARD_W / 2}px - 60px)`,
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: index === 0 ? 0.2 : 1,
            pointerEvents: index === 0 ? 'none' : 'auto',
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronLeft style={{ width: 22, height: 22, color: '#fff' }} />
        </button>

        {/* Portrait card */}
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.93, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            width: CARD_W,
            height: '88vh', maxHeight: 860,
            borderRadius: 24, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
          }}
        >
          {/* ── Photo area ─── */}
          <div style={{
            height: '54%', flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: isWine ? '#F5F0E8' : '#1C1209',
          }}>
            <PhotoSlide />
            <TopBar inCard />
          </div>

          {/* ── Info panel ─── */}
          <div style={{
            flex: 1, overflowY: 'auto', background: '#FFFFFF',
            padding: '22px 28px 28px',
          }}>
            <InfoContent />
          </div>
        </motion.div>

        {/* → Next arrow */}
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          style={{
            position: 'absolute', left: `calc(50% + ${CARD_W / 2}px + 12px)`,
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: index === items.length - 1 ? 0.2 : 1,
            pointerEvents: index === items.length - 1 ? 'none' : 'auto',
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronRight style={{ width: 22, height: 22, color: '#fff' }} />
        </button>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MOBILE — full-screen with bottom sheet
  // ══════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: isWine ? '#F5F0E8' : '#0A0402', display: 'flex', flexDirection: 'column' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Photo */}
      <div style={{ height: '52svh', flexShrink: 0, position: 'relative', overflow: 'hidden', background: isWine ? '#F5F0E8' : '#0A0402' }}>
        <PhotoSlide />
        <TopBar />
        {/* Side arrows */}
        {items.length > 1 && (
          <>
            <button onClick={prev} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: topBarDark ? 'rgba(28,18,9,0.12)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === 0 ? 0.2 : 1, pointerEvents: index === 0 ? 'none' : 'auto', zIndex: 15,
            }}>
              <ChevronLeft style={{ width: 18, height: 18, color: topBarDark ? '#1C1209' : '#fff' }} />
            </button>
            <button onClick={next} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: topBarDark ? 'rgba(28,18,9,0.12)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === items.length - 1 ? 0.2 : 1, pointerEvents: index === items.length - 1 ? 'none' : 'auto', zIndex: 15,
            }}>
              <ChevronRight style={{ width: 18, height: 18, color: topBarDark ? '#1C1209' : '#fff' }} />
            </button>
          </>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{
        flex: 1, background: '#fff',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -6px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Handle */}
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

// ── ReelSlide ─────────────────────────────────────────────────────────────────

function ReelSlide({
  col,
  items,
  progress,
  itemStates,
  onItemClick,
  onToggleTried,
  onToggleFavorite,
}: {
  col: CollectionRow;
  items: UnifiedItem[];
  progress: ColProgress;
  itemStates: Record<string, ItemState>;
  onItemClick: (items: UnifiedItem[], index: number) => void;
  onToggleTried: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
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

        {/* Progress bar — desktop only; mobile renders it between hero and cards */}
        {isDesktop && progress.total > 0 && (
          <div>
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

  // ── Shared: status badge (top-left) ─────────────────────────────────────
  const StatusBadge = ({ itemId }: { itemId: string }) => {
    const state = itemStates[itemId] ?? { tried: false, favorite: false };
    if (!state.tried) return null;
    return (
      <div style={{ position: 'absolute', top: 8, left: 8 }}>
        <span style={{ background: 'rgba(45,74,62,0.88)', backdropFilter: 'blur(4px)', color: '#6BF5A0', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✓ Já bebi</span>
      </div>
    );
  };

  // ── Shared: action button strip (right side of photo) ────────────────────
  const CardActions = ({
    item, compact, onViewMore,
  }: {
    item: UnifiedItem;
    compact: boolean;
    onViewMore: () => void;
  }) => {
    const state = itemStates[item.itemId] ?? { tried: false, favorite: false };
    const sz = compact ? 30 : 36;
    const ic = compact ? 13 : 15;
    const gap = compact ? 6 : 8;
    const btn = (active: boolean, activeColor: string): React.CSSProperties => ({
      width: sz, height: sz, borderRadius: '50%', flexShrink: 0,
      background: active ? activeColor : 'rgba(0,0,0,0.50)',
      backdropFilter: 'blur(8px)',
      border: active ? `1.5px solid rgba(255,255,255,0.35)` : '1.5px solid rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'background 0.18s, transform 0.12s',
    });
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', right: compact ? 7 : 10,
          top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap,
          alignItems: 'center', zIndex: 5,
        }}
      >
        {/* Ver mais */}
        <button title="Ver mais" onClick={onViewMore} style={btn(false, '')}>
          <Eye style={{ width: ic, height: ic, color: '#fff' }} />
        </button>
        {/* Já bebi */}
        <button
          title={state.tried ? 'Remover' : 'Já bebi'}
          onClick={() => onToggleTried(item.itemId)}
          style={btn(state.tried, '#2D4A3E')}
        >
          <CheckCircle2 style={{ width: ic, height: ic, color: state.tried ? '#6BF5A0' : '#fff' }} />
        </button>
        {/* Salvar */}
        <button
          title={state.favorite ? 'Remover dos salvos' : 'Salvar'}
          onClick={() => onToggleFavorite(item.itemId)}
          style={btn(state.favorite, '#6B0035')}
        >
          <Bookmark style={{ width: ic, height: ic, color: state.favorite ? '#FFB3CB' : '#fff' }} fill={state.favorite ? '#FFB3CB' : 'none'} />
        </button>
        {/* Comprar */}
        <button title="Comprar" style={btn(false, '')}>
          <ShoppingBag style={{ width: ic, height: ic, color: '#fff' }} />
        </button>
      </div>
    );
  };

  // ── DESKTOP layout ────────────────────────────────────────────────────────
  // Design: left info panel floats on top (z-index); behind it a full-width
  // horizontal card scroll — cards slide under the panel as user scrolls left.
  if (isDesktop) {
    const LEFT_W    = '38%';
    const CARD_W_DK = 240;
    // Tall portrait card: at most 540px, at least 420px, ideally 58% of viewport
    const CARD_H_DK = 'clamp(420px, 58vh, 540px)';

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
          gap: 18,
          paddingLeft: `calc(${LEFT_W} + 28px)`,  /* gap between panel edge and first card */
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
                style={{
                  width: CARD_W_DK, height: CARD_H_DK,
                  flexShrink: 0, borderRadius: 20, overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 8px 32px rgba(28,18,9,0.16)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                className="hover:scale-[1.02] hover:shadow-2xl"
              >
                {/* Photo — flex:1 fills all space above footer, click opens modal */}
                <div
                  onClick={() => onItemClick(items, i)}
                  style={{
                    flex: 1, minHeight: 0,
                    background: isWine ? '#F5F0E8' : '#1C1209',
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  }}
                >
                  <img
                    src={item.photo || FALLBACK} alt={item.name}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: isWine ? 'contain' : 'cover',
                      padding: isWine ? '12px 0' : 0,
                    }}
                    onError={imgFallback}
                  />
                  <StatusBadge itemId={item.itemId} />
                  <CardActions
                    item={item}
                    compact={false}
                    onViewMore={() => onItemClick(items, i)}
                  />
                </div>
                {/* Info footer */}
                <div style={{ padding: '14px 16px 18px', flexShrink: 0, borderTop: '1px solid rgba(139,90,43,0.08)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 5 }}>
                    {itemLabel(item)}
                  </p>
                  <p style={{
                    fontFamily: '"Fraunces",Georgia,serif', fontSize: 15, fontWeight: 700,
                    color: '#1C1209', lineHeight: 1.2,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: item.subName ? 4 : 0,
                  }}>{item.name}</p>
                  {item.subName && (
                    <p style={{ fontSize: 12, color: '#7A6855' }}>
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
          filter: 'drop-shadow(8px 0 24px rgba(0,0,0,0.18))',
        }}>
          <InfoPanel padding="0 44px 52px" />
        </div>

      </div>
    );
  }

  // ── MOBILE layout ─────────────────────────────────────────────────────────
  // Cards fill the carousel height via aspectRatio:'5/7' so they always
  // look proportional regardless of phone size.
  return (
    <div style={{
      height: 'calc(100svh - 56px - 64px)',
      scrollSnapAlign: 'start', flexShrink: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Hero — 42% */}
      <div style={{ height: '42%', position: 'relative', flexShrink: 0 }}>
        <InfoPanel padding="0 18px 14px" />
      </div>

      {/* Progress separator — sits between hero and cards */}
      {progress.total > 0 && (
        <div style={{ flexShrink: 0, padding: '8px 16px 6px', background: '#EDE4D6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#7A6855' }}>Seu progresso</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: pct > 0 ? '#2D4A3E' : '#B0A090' }}>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 99, background: 'rgba(107,0,53,0.12)' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #6B0035, #9B1B4D)',
              width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Cards carousel — cards stretch to full area height, 5:7 aspect ratio */}
      <div style={{
        flex: 1, minHeight: 0,
        background: 'linear-gradient(to bottom, #EDE4D6 0%, #E2D5BE 100%)',
        overflowX: 'auto', display: 'flex', gap: 12,
        padding: '12px 16px',
        scrollbarWidth: 'none',
        alignItems: 'stretch',
      }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: '#B0A090', fontSize: 13 }}>Nenhum item ainda</p>
          </div>
        ) : items.map((item, i) => {
          const isWine = item.itemType === 'wine';
          return (
            <div
              key={item.itemId}
              style={{
                aspectRatio: '5 / 7',
                flexShrink: 0,
                borderRadius: 18, overflow: 'hidden',
                background: '#fff',
                boxShadow: i === itemIndex
                  ? '0 0 0 2px #6B0035, 0 6px 24px rgba(28,18,9,0.22)'
                  : '0 4px 16px rgba(28,18,9,0.12)',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Photo area — click opens modal */}
              <div
                onClick={() => onItemClick(items, i)}
                style={{ flex: 1, minHeight: 0, background: isWine ? '#F5F0E8' : '#1C1209', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
              >
                <img
                  src={item.photo || FALLBACK} alt={item.name}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: isWine ? 'contain' : 'cover',
                    objectPosition: 'center center',
                    padding: isWine ? '8px 0' : 0,
                  }}
                  onError={imgFallback}
                />
                <StatusBadge itemId={item.itemId} />
                <CardActions
                  item={item}
                  compact={true}
                  onViewMore={() => onItemClick(items, i)}
                />
              </div>
              {/* Info footer — min height */}
              <div style={{ minHeight: 68, flexShrink: 0, padding: '8px 11px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#B0906A', marginBottom: 2 }}>
                  {itemLabel(item)}
                </p>
                <p style={{
                  fontFamily: '"Fraunces",Georgia,serif', fontSize: 12, fontWeight: 700, color: '#1C1209',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25,
                  marginBottom: item.subName ? 2 : 0,
                }}>{item.name}</p>
                {item.subName && (
                  <p style={{ fontSize: 10, color: '#7A6855' }}>
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
          .select('item_id, completed, is_favorite, rating, notes, photo_url')
          .eq('user_id', user.id),
      ]);

      setProfile((prof as UserProfileData) ?? null);

      const states: Record<string, ItemState> = {};
      const cIds = new Set<string>();
      for (const p of (progress ?? []) as any[]) {
        states[p.item_id] = {
          tried: p.completed ?? false,
          favorite: p.is_favorite ?? false,
          rating: p.rating ?? 0,
          notes: p.notes ?? '',
          photoUrl: p.photo_url ?? '',
        };
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
    const current = itemStates[itemId] ?? { tried: false, favorite: false, rating: 0, notes: '', photoUrl: '' };
    const allItems = Object.values(itemsByCollection).flat();
    const found = allItems.find(i => i.itemId === itemId);
    const itemType = found?.itemType ?? 'wine';
    setItemStates(prev => ({ ...prev, [itemId]: { ...current, favorite: !current.favorite } }));
    await psToggleFavorite(user.id, itemId, itemType, current.favorite);
  }, [user, itemStates, itemsByCollection]);

  const saveReview = useCallback(async (
    itemId: string,
    review: { rating?: number; notes?: string; photoUrl?: string },
  ) => {
    if (!user) return;
    const allItems = Object.values(itemsByCollection).flat();
    const found = allItems.find(i => i.itemId === itemId);
    const itemType = found?.itemType ?? 'wine';
    // Mark tried + update local state
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
    setCompletedIds(prev => { const n = new Set(prev); n.add(itemId); return n; });
    if (!current.tried) await psToggleTried(user.id, itemId, itemType, false);
    await psSaveReview(user.id, itemId, itemType, review);
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
              onToggleTried={toggleTried}
              onToggleFavorite={toggleFavorite}
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
            onSaveReview={saveReview}
          />
        )}
      </AnimatePresence>
    </>
  );
}
