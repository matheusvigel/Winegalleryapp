import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getStats } from '../utils/storage';
import { Trophy, LogOut, CheckCircle2, Heart, Wine } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setStats(getStats());
    const handleStorage = () => setStats(getStats());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('statsUpdated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('statsUpdated', handleStorage);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const levelProgress = stats.totalPoints % 100;
  const displayName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sommelier';

  return (
    <div className="min-h-screen bg-[#F0EBE0]">
      {/* Profile header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-gelica text-3xl text-[#1C1B1F]">Perfil</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-[#5C1A3E] transition-colors text-sm"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FAFAF7] rounded-2xl p-5 border border-black/[0.06]"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-[#5C1A3E]/10 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
              🍷
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-gelica text-xl text-[#1C1B1F] truncate">{displayName}</h2>
              <p className="text-sm text-neutral-500">Nível {stats.level} · Sommelier</p>
              {user?.email && (
                <p className="text-xs text-neutral-400 mt-0.5 truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Progresso para nível {stats.level + 1}</span>
            <span className="tabular-nums">{levelProgress}/100 pts</span>
          </div>
          <div className="w-full bg-black/8 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-[#5C1A3E] rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Stats grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#FAFAF7] rounded-2xl p-4 border border-black/[0.06] text-center"
          >
            <Trophy size={22} className="text-[#C5A96D] mx-auto mb-2" />
            <div className="font-gelica text-2xl text-[#1C1B1F]">{stats.totalPoints}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Pontos</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#FAFAF7] rounded-2xl p-4 border border-black/[0.06] text-center"
          >
            <CheckCircle2 size={22} className="text-[#5C1A3E] mx-auto mb-2" />
            <div className="font-gelica text-2xl text-[#1C1B1F]">{stats.completedCount}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Vividas</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#FAFAF7] rounded-2xl p-4 border border-black/[0.06] text-center"
          >
            <Heart size={22} className="text-rose-400 mx-auto mb-2" />
            <div className="font-gelica text-2xl text-[#1C1B1F]">{stats.wishlistCount}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Desejos</div>
          </motion.div>
        </div>
      </div>

      {/* Empty state */}
      {stats.completedCount === 0 && stats.wishlistCount === 0 && (
        <div className="px-4 py-10 text-center">
          <Wine size={40} className="text-neutral-200 mx-auto mb-3" />
          <p className="font-gelica text-lg text-neutral-400 mb-1">
            Comece sua jornada
          </p>
          <p className="text-sm text-neutral-400">
            Explore as regiões e marque suas experiências
          </p>
        </div>
      )}
    </div>
  );
}
