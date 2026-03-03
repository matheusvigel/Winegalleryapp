import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { getStats, getProgress } from '../utils/storage';
import { getAllRegions } from '../data/wineData';
import { ArrowLeft, Trophy, CheckCircle, Heart, Wine, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(getStats());
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    setStats(getStats());
    setProgress(getProgress());

    const handleStorage = () => {
      setStats(getStats());
      setProgress(getProgress());
    };

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

  // Get all items from all regions
  const allRegions = getAllRegions();
  const allItems = allRegions.flatMap(region =>
    region.collections.flatMap(c => c.items)
  );

  const completedItems = progress
    .filter(p => p.status === 'completed')
    .map(p => allItems.find(e => e.id === p.itemId))
    .filter(Boolean);

  const wishlistItems = progress
    .filter(p => p.status === 'wishlist')
    .map(p => allItems.find(e => e.id === p.itemId))
    .filter(Boolean);

  const levelProgress = (stats.totalPoints % 100);
  const nextLevelPoints = 100;

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sommelier';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-neutral-50">
      {/* Header */}
      <header className="bg-red-900 text-white px-6 pt-8 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-red-100 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Voltar</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-red-100 hover:text-white text-sm transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-red-800 rounded-full flex items-center justify-center text-4xl">
              🍷
            </div>
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-red-100">Nível {stats.level} Sommelier</p>
              {user?.email && (
                <p className="text-red-200 text-xs mt-0.5">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="max-w-lg mx-auto px-6 -mt-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-600" size={24} />
              <span className="font-bold text-lg text-neutral-900">Progresso</span>
            </div>
            <span className="text-2xl font-bold text-red-800">{stats.totalPoints}</span>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>Nível {stats.level}</span>
              <span>{levelProgress}/{nextLevelPoints} pts</span>
            </div>
            <Progress value={levelProgress} max={nextLevelPoints} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completedCount}</div>
              <div className="text-sm text-neutral-600">Experiências Vividas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.wishlistCount}</div>
              <div className="text-sm text-neutral-600">Na Lista de Desejos</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Completed Section */}
      {completedItems.length > 0 && (
        <div className="max-w-lg mx-auto px-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-neutral-900">Experiências Vividas</h2>
          </div>

          <div className="space-y-3">
            {completedItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-lg p-4 shadow-md flex items-center gap-4"
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900">{item?.name}</h3>
                  <p className="text-sm text-neutral-600">{item?.description}</p>
                </div>
                <div className="text-green-600 flex-shrink-0">
                  <CheckCircle size={24} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist Section */}
      {wishlistItems.length > 0 && (
        <div className="max-w-lg mx-auto px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-neutral-900">Lista de Desejos</h2>
          </div>

          <div className="space-y-3">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-lg p-4 shadow-md flex items-center gap-4"
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900">{item?.name}</h3>
                  <p className="text-sm text-neutral-600">{item?.description}</p>
                </div>
                <div className="text-red-600 flex-shrink-0">
                  <Heart size={24} fill="currentColor" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedItems.length === 0 && wishlistItems.length === 0 && (
        <div className="max-w-lg mx-auto px-6 py-12 text-center">
          <Wine size={48} className="text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-700 mb-2">
            Comece sua jornada
          </h3>
          <p className="text-neutral-600 mb-6">
            Explore as regiões e comece a marcar suas experiências
          </p>
          <Link
            to="/"
            className="inline-block bg-red-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors"
          >
            Explorar Regiões
          </Link>
        </div>
      )}
    </div>
  );
}
