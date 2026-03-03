import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { findGrape } from '../data/wineData';
import { CollectionHeader } from './CollectionHeader';
import { ItemCard } from './ItemCard';
import { ArrowLeft, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { getProgress } from '../utils/storage';

export default function GrapeDetail() {
  const { grapeId } = useParams<{ grapeId: string }>();
  const navigate = useNavigate();
  const grape = findGrape(grapeId!);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    const handleUpdate = () => setProgress(getProgress());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);

  if (!grape) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Uva não encontrada</p>
      </div>
    );
  }

  const grapeCollections = grape.collections;
  const filteredCollections = selectedLevel === 'all'
    ? grapeCollections
    : grapeCollections.filter(coll => coll.level === selectedLevel);

  const essentialCount = grapeCollections.filter(c => c.level === 'essential').length;
  const escapeCount = grapeCollections.filter(c => c.level === 'escape').length;
  const iconCount = grapeCollections.filter(c => c.level === 'icon').length;

  const getCollectionCompletedCount = (collectionId: string) => {
    const collection = grapeCollections.find(c => c.id === collectionId);
    if (!collection) return 0;
    return collection.items.filter(item =>
      progress.find(p => p.itemId === item.id)?.status === 'completed'
    ).length;
  };

  const typeLabel = grape.type === 'red' ? 'Uva Tinta' : 'Uva Branca';
  const typeBadgeClass = grape.type === 'red'
    ? 'bg-red-800 text-white'
    : 'bg-yellow-600 text-white';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="relative h-64">
        <img
          src={grape.imageUrl}
          alt={grape.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />

        <button
          onClick={() => navigate('/grapes')}
          className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-neutral-900" />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${typeBadgeClass}`}>
              {typeLabel}
            </span>
            <h1 className="text-3xl font-bold text-white mb-1">{grape.name}</h1>
            <p className="text-neutral-200 text-sm">{grape.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Characteristics */}
      <div className="max-w-lg mx-auto px-6 pt-6">
        <div className="bg-white rounded-xl p-4 shadow-md mb-2">
          <h3 className="text-sm font-semibold text-neutral-500 mb-1 uppercase tracking-wide">Características</h3>
          <p className="text-neutral-800 text-sm">{grape.characteristics}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-lg mx-auto px-6 py-4 sticky top-0 bg-neutral-50 z-10 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">Filtrar Coleções</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Badge
            variant={selectedLevel === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap bg-red-800 hover:bg-red-900"
            onClick={() => setSelectedLevel('all')}
          >
            Todas ({grapeCollections.length})
          </Badge>
          {essentialCount > 0 && (
            <Badge
              variant={selectedLevel === 'essential' ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'essential' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'}`}
              onClick={() => setSelectedLevel('essential')}
            >
              Essencial ({essentialCount})
            </Badge>
          )}
          {escapeCount > 0 && (
            <Badge
              variant={selectedLevel === 'escape' ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'escape' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'}`}
              onClick={() => setSelectedLevel('escape')}
            >
              Fugir do Óbvio ({escapeCount})
            </Badge>
          )}
          {iconCount > 0 && (
            <Badge
              variant={selectedLevel === 'icon' ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'icon' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'}`}
              onClick={() => setSelectedLevel('icon')}
            >
              Ícones ({iconCount})
            </Badge>
          )}
        </div>
      </div>

      {/* Collections List */}
      <div className="max-w-lg mx-auto px-6 pb-6">
        <div className="space-y-8">
          {filteredCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <CollectionHeader
                collection={collection}
                completedCount={getCollectionCompletedCount(collection.id)}
              />
              <div className="relative -mx-6">
                <div className="overflow-x-auto px-6 pb-4 scrollbar-hide">
                  <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {collection.items.map((item) => (
                      <div key={item.id} className="w-80 flex-shrink-0">
                        <ItemCard item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCollections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-600">Nenhuma coleção encontrada neste nível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
