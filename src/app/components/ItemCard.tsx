import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WineItem } from '../types';
import { getItemStatus, updateItemStatus } from '../utils/storage';
import { Heart, Check, Building2, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ItemCardProps {
  item: WineItem;
}

// ─── Fullscreen detail modal ───────────────────────────────────────────────────
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
  // lock body scroll while open
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
          className="fixed inset-0 z-[200] bg-black/80 flex flex-col justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="bg-neutral-950 rounded-t-3xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Image section */}
            <div className="relative bg-neutral-100 flex items-center justify-center" style={{ height: '55vw', minHeight: 220, maxHeight: 380 }}>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center"
              >
                <X size={18} className="text-white" />
              </button>
              {/* Points badge */}
              <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-bold text-amber-300">+{item.points} pts</span>
              </div>
            </div>

            {/* Info section */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-4">
              {/* Type pills */}
              {(item.wineType || item.elaborationMethod) && (
                <div className="flex gap-2 flex-wrap">
                  {item.wineType && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-white/10 border border-white/15">
                      {item.wineType}
                    </span>
                  )}
                  {item.elaborationMethod && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-white/10 border border-white/15">
                      {item.elaborationMethod}
                    </span>
                  )}
                </div>
              )}

              {/* Title + Winery */}
              <div>
                <h2 className="text-white text-2xl font-bold leading-tight">{item.name}</h2>
                {item.brandName && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Building2 size={13} className="text-white/40 flex-shrink-0" />
                    <span className="text-white/50 text-sm">{item.brandName}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-white/65 text-[14px] leading-relaxed">{item.description}</p>

              {/* Points highlight */}
              <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
                <Star size={15} className="text-amber-400 flex-shrink-0" />
                <span className="text-amber-300 text-sm font-semibold">Vale {item.points} pontos ao experimentar</span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStatusChange('wishlist')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${
                    status === 'wishlist'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-white/10 text-white/80 border border-white/15'
                  }`}
                >
                  <Heart size={18} fill={status === 'wishlist' ? 'currentColor' : 'none'} />
                  Quero provar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStatusChange('completed')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${
                    status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/10 text-white/80 border border-white/15'
                  }`}
                >
                  <Check size={18} strokeWidth={status === 'completed' ? 3 : 2} />
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

// ─── Item card ─────────────────────────────────────────────────────────────────
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
        className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-neutral-900 cursor-pointer select-none"
        onClick={() => setShowDetail(true)}
      >
        {/* ── Image area ─────────────────────────────────────────── */}
        <div className="relative bg-neutral-100" style={{ height: '68vw', minHeight: 260, maxHeight: 360 }}>
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
                  {item.wineType}
                </span>
              )}
              {item.elaborationMethod && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
                  {item.elaborationMethod}
                </span>
              )}
            </div>
            <div className="bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex-shrink-0">
              <span className="text-[11px] font-bold text-amber-300">+{item.points} pts</span>
            </div>
          </div>

          {/* Right side action buttons — stopPropagation so card click doesn't open modal */}
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
                    className="absolute inset-0 rounded-full bg-rose-400"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handleStatusChange('wishlist')}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  status === 'wishlist'
                    ? 'bg-rose-500 shadow-rose-500/40'
                    : 'bg-black/35 backdrop-blur-md border border-white/20'
                }`}
              >
                <Heart size={18} className="text-white" fill={status === 'wishlist' ? 'currentColor' : 'none'} />
              </motion.button>
            </div>

            {/* Completed */}
            <div className="relative">
              <AnimatePresence>
                {ripple === 'completed' && (
                  <motion.div
                    key="r-c"
                    className="absolute inset-0 rounded-full bg-emerald-400"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handleStatusChange('completed')}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-500 shadow-emerald-500/40'
                    : 'bg-black/35 backdrop-blur-md border border-white/20'
                }`}
              >
                <Check size={18} className="text-white" strokeWidth={status === 'completed' ? 3 : 2} />
              </motion.button>
            </div>
          </div>

          {/* Completed overlay on image */}
          <AnimatePresence>
            {status === 'completed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-5 border border-emerald-400/30">
                  <Check size={32} className="text-emerald-400" strokeWidth={3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Info panel ────────────────────────────────────────── */}
        <div className="px-3 pt-2.5 pb-3">
          <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-2">
            {item.name}
          </h3>
          {item.brandName && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={10} className="text-white/40 flex-shrink-0" />
              <span className="text-white/45 text-[11px] leading-none">{item.brandName}</span>
            </div>
          )}
          <p className="text-white/55 text-[12px] leading-snug mt-1.5 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Fullscreen detail modal (portal) */}
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
