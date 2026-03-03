import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { regions } from '../data/wineData';
import { getStats } from '../utils/storage';
import { Wine, Trophy, Target, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [stats, setStats] = useState(getStats());
  
  useEffect(() => {
    // Update stats when component mounts
    setStats(getStats());
    
    // Listen for storage changes
    const handleStorage = () => {
      setStats(getStats());
    };
    
    window.addEventListener('storage', handleStorage);
    // Also listen for custom event for same-tab updates
    window.addEventListener('statsUpdated', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('statsUpdated', handleStorage);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-neutral-50">
      {/* Header */}
      <header className="bg-red-900 text-white px-6 pt-8 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Wine size={32} />
            <h1 className="text-3xl font-bold">Wine Gallery</h1>
          </div>
          <p className="text-red-100">Sua jornada pelo mundo do vinho</p>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div className="max-w-lg mx-auto px-6 -mt-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex flex-col items-center">
              <Trophy className="text-yellow-600 mb-2" size={24} />
              <div className="text-2xl font-bold text-neutral-900">{stats.totalPoints}</div>
              <div className="text-xs text-neutral-600">Pontos</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.completedCount}</div>
              <div className="text-xs text-neutral-600">Vividas</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex flex-col items-center">
              <Target className="text-red-600 mb-2" size={24} />
              <div className="text-2xl font-bold text-neutral-900">{stats.wishlistCount}</div>
              <div className="text-xs text-neutral-600">Desejos</div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Level Badge */}
      <div className="max-w-lg mx-auto px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-red-800 to-red-900 text-white rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-200">Seu Nível</div>
              <div className="text-3xl font-bold">Nível {stats.level}</div>
              <div className="text-xs text-red-200 mt-1">
                {stats.totalPoints % 100}/100 pontos para o próximo nível
              </div>
            </div>
            <div className="text-5xl">🍷</div>
          </div>
          <div className="mt-3 bg-red-950/30 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-300 h-full transition-all duration-500"
              style={{ width: `${(stats.totalPoints % 100)}%` }}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Regions Section */}
      <div className="max-w-lg mx-auto px-6 pb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Regiões do Vinho</h2>
        
        <div className="space-y-4">
          {regions.map((region, index) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                to={`/region/${region.id}`}
                className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-40">
                  <img
                    src={region.imageUrl}
                    alt={region.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{region.name}</h3>
                    <p className="text-sm text-neutral-200">{region.country}</p>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-neutral-600">{region.description}</p>
                  <ChevronRight className="text-neutral-400 flex-shrink-0 ml-2" size={20} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
