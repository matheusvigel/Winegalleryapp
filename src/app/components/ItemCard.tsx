import { useState, useEffect } from 'react';
import { WineItem } from '../types';
import { getItemStatus, updateItemStatus } from '../utils/storage';
import { Heart, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ItemCardProps {
  item: WineItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const [status, setStatus] = useState<'wishlist' | 'completed' | null>(null);
  const [ripple, setRipple] = useState<'wishlist' | 'completed' | null>(null);

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
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 select-none">
      {/* Background image */}
      <img
        src={item.imageUrl}
        alt={item.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Cinematic gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-40% to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

      {/* Top row: wine_type + elaboration_method pills + points */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.wineType && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-white/15 backdrop-blur-md border border-white/20">
              {item.wineType}
            </span>
          )}
          {item.elaborationMethod && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-white/15 backdrop-blur-md border border-white/20">
              {item.elaborationMethod}
            </span>
          )}
        </div>
        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex-shrink-0">
          <span className="text-xs font-bold text-amber-300">+{item.points} pts</span>
        </div>
      </div>

      {/* Right side: TikTok-style action buttons */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        {/* Wishlist */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => handleStatusChange('wishlist')}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div className="relative">
            <AnimatePresence>
              {ripple === 'wishlist' && (
                <motion.div
                  key="ripple-w"
                  className="absolute inset-0 rounded-full bg-rose-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={status === 'wishlist' ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                status === 'wishlist'
                  ? 'bg-rose-500 shadow-rose-500/40'
                  : 'bg-white/15 backdrop-blur-md border border-white/20'
              }`}
            >
              <Heart
                size={22}
                className="text-white"
                fill={status === 'wishlist' ? 'currentColor' : 'none'}
              />
            </motion.div>
          </div>
          <span className="text-white/90 text-[11px] font-semibold drop-shadow-md">Quero</span>
        </motion.button>

        {/* Completed */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => handleStatusChange('completed')}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div className="relative">
            <AnimatePresence>
              {ripple === 'completed' && (
                <motion.div
                  key="ripple-c"
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={status === 'completed' ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                status === 'completed'
                  ? 'bg-emerald-500 shadow-emerald-500/40'
                  : 'bg-white/15 backdrop-blur-md border border-white/20'
              }`}
            >
              <Check size={22} className="text-white" strokeWidth={status === 'completed' ? 3 : 2} />
            </motion.div>
          </div>
          <span className="text-white/90 text-[11px] font-semibold drop-shadow-md">Provei</span>
        </motion.button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-14 p-4 z-10">
        <h3 className="text-[17px] font-bold text-white leading-tight drop-shadow-md">
          {item.name}
        </h3>

        {item.brandName && (
          <div className="flex items-center gap-1 mt-1 mb-1.5">
            <Building2 size={11} className="text-white/50 flex-shrink-0" />
            <span className="text-white/55 text-[12px] font-medium leading-none">
              {item.brandName}
            </span>
          </div>
        )}

        <p className="text-white/65 text-[13px] leading-snug line-clamp-2 mt-1.5">
          {item.description}
        </p>
      </div>

      {/* Completed overlay flash */}
      <AnimatePresence>
        {status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-6 border border-emerald-400/30">
              <Check size={40} className="text-emerald-400" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
