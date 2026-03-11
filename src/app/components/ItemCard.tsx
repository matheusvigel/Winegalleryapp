import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WineItem } from '../types';
import { getItemStatus, updateItemStatus } from '../utils/storage';
import { Heart, Check, Building2, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Design tokens
const C = {
  bg:       '#E9E3D9',
  card:     '#FFFFFF',
  text1:    '#1C1B1F',
  text2:    '#5C5C5C',
  muted:    '#9B9B9B',
  border:   'rgba(0,0,0,0.08)',
  wine:     '#690037',
  verde:    '#2D3A3A',
  laranja:  '#F1BD85',
  tagBg:    'rgba(0,0,0,0.065)',
  btnBg:    'rgba(0,0,0,0.07)',
} as const;

interface ItemCardProps { item: WineItem; }

// ─── Fullscreen detail modal ─────────────────────────────────────────────────
function ItemDetailModal({ item, isOpen, onClose, status, onStatusChange }: {
  item: WineItem;
  isOpen: boolean;
  onClose: () => void;
  status: 'wishlist' | 'completed' | null;
  onStatusChange: (s: 'wishlist' | 'completed') => void;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ backgroundColor: '#FFFFFF', borderRadius: '20px 20px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div style={{ position: 'relative', height: '52vw', minHeight: 200, maxHeight: 340, backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
              <button
                onClick={onClose}
                style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} color={C.text2} />
              </button>
              <div style={{ position: 'absolute', top: 14, left: 14, padding: '3px 10px', borderRadius: 99, backgroundColor: 'rgba(241,189,133,0.22)', border: '1px solid rgba(241,189,133,0.5)' }}>
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 600, color: '#A0621A' }}>+{item.points} pts</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

            {/* Info */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>
              {(item.wineType || item.elaborationMethod) && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {item.wineType && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 500, color: C.text2, backgroundColor: C.tagBg }}>
                      {item.wineType}
                    </span>
                  )}
                  {item.elaborationMethod && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 500, color: C.text2, backgroundColor: C.tagBg }}>
                      {item.elaborationMethod}
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '1.2rem', fontWeight: 700, color: C.text1, lineHeight: 1.2 }}>
                  {item.name}
                </h2>
                {item.brandName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <Building2 size={11} color={C.muted} />
                    <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: C.text2 }}>{item.brandName}</span>
                  </div>
                )}
              </div>

              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.85rem', color: C.text2, lineHeight: 1.65, marginBottom: 16 }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: 'rgba(241,189,133,0.12)', border: '1px solid rgba(241,189,133,0.35)', borderRadius: 10, marginBottom: 16 }}>
                <Star size={14} color="#A0621A" />
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', fontWeight: 500, color: '#A0621A' }}>
                  Vale {item.points} pontos ao experimentar
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onStatusChange('wishlist')}
                  style={{
                    padding: '13px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 500,
                    borderRadius: 12,
                    backgroundColor: status === 'wishlist' ? '#690037' : '#F5F0E8',
                    color: status === 'wishlist' ? '#FFFFFF' : C.text2,
                    border: status === 'wishlist' ? '1px solid #690037' : '1px solid rgba(0,0,0,0.10)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Heart size={16} fill={status === 'wishlist' ? '#FFFFFF' : 'none'} />
                  Quero provar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onStatusChange('completed')}
                  style={{
                    padding: '13px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 500,
                    borderRadius: 12,
                    backgroundColor: status === 'completed' ? '#2D3A3A' : '#F5F0E8',
                    color: status === 'completed' ? '#FFFFFF' : C.text2,
                    border: status === 'completed' ? '1px solid #2D3A3A' : '1px solid rgba(0,0,0,0.10)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Check size={16} strokeWidth={status === 'completed' ? 2.5 : 2} />
                  Já provei
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Item card ───────────────────────────────────────────────────────────────
export function ItemCard({ item }: ItemCardProps) {
  const [status, setStatus] = useState<'wishlist' | 'completed' | null>(null);
  const [ripple, setRipple] = useState<'wishlist' | 'completed' | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { setStatus(getItemStatus(item.id)); }, [item.id]);

  const handleStatusChange = (newStatus: 'wishlist' | 'completed') => {
    const finalStatus = status === newStatus ? null : newStatus;
    setStatus(finalStatus);
    setRipple(newStatus);
    setTimeout(() => setRipple(null), 600);
    updateItemStatus(item.id, finalStatus, item.points);
    window.dispatchEvent(new Event('statsUpdated'));
  };

  return (
    <>
      <div
        style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        onClick={() => setShowDetail(true)}
      >
        {/* Image area */}
        <div style={{ position: 'relative', height: '58vw', minHeight: 220, maxHeight: 300, backgroundColor: '#F5F0E8' }}>
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />

          {/* Tags + points */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {item.wineType && (
                <span style={{ padding: '3px 8px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.62rem', fontWeight: 500, color: C.text2, backgroundColor: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(6px)', border: '1px solid rgba(0,0,0,0.10)' }}>
                  {item.wineType}
                </span>
              )}
              {item.elaborationMethod && (
                <span style={{ padding: '3px 8px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.62rem', fontWeight: 500, color: C.text2, backgroundColor: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(6px)', border: '1px solid rgba(0,0,0,0.10)' }}>
                  {item.elaborationMethod}
                </span>
              )}
            </div>
            <div style={{ padding: '3px 9px', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(6px)', border: '1px solid rgba(241,189,133,0.5)', flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.62rem', fontWeight: 600, color: '#A0621A' }}>+{item.points} pts</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
            {/* Wishlist */}
            <div style={{ position: 'relative' }}>
              <AnimatePresence>
                {ripple === 'wishlist' && (
                  <motion.div key="rw" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#690037' }}
                    initial={{ scale: 1, opacity: 0.4 }} animate={{ scale: 2.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={() => handleStatusChange('wishlist')}
                style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.15s', border: 'none',
                  backgroundColor: status === 'wishlist' ? '#690037' : 'rgba(255,255,255,0.82)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
                }}
              >
                <Heart size={16} color={status === 'wishlist' ? '#FFFFFF' : C.text2} fill={status === 'wishlist' ? '#FFFFFF' : 'none'} />
              </motion.button>
            </div>

            {/* Completed */}
            <div style={{ position: 'relative' }}>
              <AnimatePresence>
                {ripple === 'completed' && (
                  <motion.div key="rc" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#2D3A3A' }}
                    initial={{ scale: 1, opacity: 0.4 }} animate={{ scale: 2.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={() => handleStatusChange('completed')}
                style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background-color 0.15s', border: 'none',
                  backgroundColor: status === 'completed' ? '#2D3A3A' : 'rgba(255,255,255,0.82)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
                }}
              >
                <Check size={16} color={status === 'completed' ? '#FFFFFF' : C.text2} strokeWidth={status === 'completed' ? 2.5 : 2} />
              </motion.button>
            </div>
          </div>

          {/* Completed overlay */}
          <AnimatePresence>
            {status === 'completed' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              >
                <div style={{ backgroundColor: 'rgba(45,58,58,0.15)', backdropFilter: 'blur(4px)', borderRadius: '50%', padding: 14, border: '1px solid rgba(45,58,58,0.25)' }}>
                  <Check size={28} color="#2D3A3A" strokeWidth={2.5} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info panel */}
        <div style={{ padding: '10px 12px 13px' }}>
          <h3 style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.88rem', fontWeight: 700, color: C.text1, lineHeight: 1.3 }}>
            {item.name}
          </h3>
          {item.brandName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Building2 size={10} color={C.muted} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', color: C.muted }}>{item.brandName}</span>
            </div>
          )}
          <p style={{ margin: '5px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: C.text2, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        </div>
      </div>

      <ItemDetailModal item={item} isOpen={showDetail} onClose={() => setShowDetail(false)} status={status} onStatusChange={handleStatusChange} />
    </>
  );
}
