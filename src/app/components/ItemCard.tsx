import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WineItem } from '../types';
import { getItemStatus, updateItemStatus } from '../utils/storage';
import { Heart, Check, Building2, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ItemCardProps {
  item: WineItem;
}

// ─── Fullscreen detail modal ────────────────────────────────────────────────
function ItemDetailModal({
  item,
  isOpen,
  onClose,
  status,
  onStatusChange,
}: {
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="rounded-t-3xl overflow-hidden flex flex-col"
            style={{ backgroundColor: '#141210', maxHeight: '92vh', border: '1px solid rgba(197,162,90,0.12)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Image section */}
            <div
              className="relative flex items-center justify-center"
              style={{ height: '55vw', minHeight: 220, maxHeight: 360, backgroundColor: '#1C1915' }}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <X size={16} color="rgba(226,212,186,0.8)" />
              </button>
              {/* Points badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(197,162,90,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(197,162,90,0.3)' }}
              >
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.7rem', fontWeight: 600, color: '#C5A25A' }}>
                  +{item.points} pts
                </span>
              </div>
            </div>

            {/* Gold separator */}
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(197,162,90,0.2), transparent)' }} />

            {/* Info section */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '20px 20px 32px' }}>
              {/* Type pills */}
              {(item.wineType || item.elaborationMethod) && (
                <div className="flex gap-2 flex-wrap" style={{ marginBottom: 14 }}>
                  {item.wineType && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.05em', color: 'rgba(226,212,186,0.7)', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {item.wineType}
                    </span>
                  )}
                  {item.elaborationMethod && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.05em', color: 'rgba(226,212,186,0.7)', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {item.elaborationMethod}
                    </span>
                  )}
                </div>
              )}

              {/* Title + Winery */}
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 600, color: '#E2D4BA', lineHeight: 1.2 }}>
                  {item.name}
                </h2>
                {item.brandName && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <Building2 size={12} color="rgba(226,212,186,0.3)" />
                    <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: '#8C8074' }}>
                      {item.brandName}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.82rem', color: '#8C8074', lineHeight: 1.65, marginBottom: 16 }}>
                {item.description}
              </p>

              {/* Points highlight */}
              <div
                className="flex items-center gap-2 rounded-xl"
                style={{ padding: '10px 14px', backgroundColor: 'rgba(197,162,90,0.08)', border: '1px solid rgba(197,162,90,0.18)', marginBottom: 16 }}
              >
                <Star size={14} color="#C5A25A" />
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', fontWeight: 500, color: '#C5A25A' }}>
                  Vale {item.points} pontos ao experimentar
                </span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onStatusChange('wishlist')}
                  className="flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm transition-colors"
                  style={{
                    padding: '13px 0',
                    fontFamily: "'DM Sans'",
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    backgroundColor: status === 'wishlist' ? '#8B1A36' : 'rgba(255,255,255,0.06)',
                    color: status === 'wishlist' ? '#E2D4BA' : 'rgba(226,212,186,0.6)',
                    border: status === 'wishlist' ? '1px solid rgba(139,26,54,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: status === 'wishlist' ? '0 4px 16px rgba(139,26,54,0.25)' : 'none',
                  }}
                >
                  <Heart size={16} fill={status === 'wishlist' ? 'currentColor' : 'none'} />
                  Quero provar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onStatusChange('completed')}
                  className="flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm transition-colors"
                  style={{
                    padding: '13px 0',
                    fontFamily: "'DM Sans'",
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    backgroundColor: status === 'completed' ? '#6B8F71' : 'rgba(255,255,255,0.06)',
                    color: status === 'completed' ? '#fff' : 'rgba(226,212,186,0.6)',
                    border: status === 'completed' ? '1px solid rgba(107,143,113,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: status === 'completed' ? '0 4px 16px rgba(107,143,113,0.25)' : 'none',
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

// ─── Item card ──────────────────────────────────────────────────────────────
export function ItemCard({ item }: ItemCardProps) {
  const [status, setStatus] = useState<'wishlist' | 'completed' | null>(null);
  const [ripple, setRipple] = useState<'wishlist' | 'completed' | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setStatus(getItemStatus(item.id));
  }, [item.id]);

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
        className="relative w-full overflow-hidden cursor-pointer select-none"
        style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#141210' }}
        onClick={() => setShowDetail(true)}
      >
        {/* ── Image area ───────────────────────────────────────── */}
        <div className="relative" style={{ height: '58vw', minHeight: 220, maxHeight: 300, backgroundColor: '#1C1915' }}>
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Top: type pills + points */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between">
            <div className="flex flex-wrap gap-1.5">
              {item.wineType && (
                <span style={{ padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.6rem', fontWeight: 500, color: 'rgba(226,212,186,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {item.wineType}
                </span>
              )}
              {item.elaborationMethod && (
                <span style={{ padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans'", fontSize: '0.6rem', fontWeight: 500, color: 'rgba(226,212,186,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {item.elaborationMethod}
                </span>
              )}
            </div>
            <div style={{ padding: '3px 8px', borderRadius: 99, backgroundColor: 'rgba(197,162,90,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(197,162,90,0.3)', flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.62rem', fontWeight: 600, color: '#C5A25A' }}>
                +{item.points} pts
              </span>
            </div>
          </div>

          {/* Right side action buttons */}
          <div
            className="absolute right-2 bottom-2 flex flex-col items-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Wishlist */}
            <div className="relative">
              <AnimatePresence>
                {ripple === 'wishlist' && (
                  <motion.div
                    key="r-w"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: '#8B1A36' }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handleStatusChange('wishlist')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: status === 'wishlist' ? '#8B1A36' : 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: status === 'wishlist' ? '1px solid rgba(139,26,54,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: status === 'wishlist' ? '0 2px 12px rgba(139,26,54,0.4)' : 'none',
                }}
              >
                <Heart size={15} color={status === 'wishlist' ? '#E2D4BA' : 'rgba(226,212,186,0.6)'} fill={status === 'wishlist' ? '#E2D4BA' : 'none'} />
              </motion.button>
            </div>

            {/* Completed */}
            <div className="relative">
              <AnimatePresence>
                {ripple === 'completed' && (
                  <motion.div
                    key="r-c"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: '#6B8F71' }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handleStatusChange('completed')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: status === 'completed' ? '#6B8F71' : 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: status === 'completed' ? '1px solid rgba(107,143,113,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: status === 'completed' ? '0 2px 12px rgba(107,143,113,0.4)' : 'none',
                }}
              >
                <Check size={15} color={status === 'completed' ? '#fff' : 'rgba(226,212,186,0.6)'} strokeWidth={status === 'completed' ? 2.5 : 2} />
              </motion.button>
            </div>
          </div>

          {/* Completed overlay */}
          <AnimatePresence>
            {status === 'completed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div style={{ backgroundColor: 'rgba(107,143,113,0.15)', backdropFilter: 'blur(4px)', borderRadius: '50%', padding: 16, border: '1px solid rgba(107,143,113,0.3)' }}>
                  <Check size={28} color="#6B8F71" strokeWidth={2.5} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Info panel ─────────────────────────────────────────── */}
        <div style={{ padding: '10px 12px 12px' }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.9rem', fontWeight: 500, color: '#C4B49A', lineHeight: 1.3 }}>
            {item.name}
          </h3>
          {item.brandName && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={10} color="#574E47" />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: '#574E47' }}>{item.brandName}</span>
            </div>
          )}
          <p style={{ margin: '5px 0 0', fontFamily: "'DM Sans'", fontSize: '0.68rem', color: '#574E47', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        </div>
      </div>

      <ItemDetailModal
        item={item}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        status={status}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
