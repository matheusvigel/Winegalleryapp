import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { findRegion, findCountry } from '../data/wineData';
import { CollectionHeader } from './CollectionHeader';
import { ItemCard } from './ItemCard';
import { ArrowLeft, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { getProgress } from '../utils/storage';

export default function RegionDetail() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const region = findRegion(regionId!);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [progress, setProgress] = useState(getProgress());
  
  // Update progress when storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setProgress(getProgress());
    };
    
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);
  
  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Região não encontrada</p>
      </div>
    );
  }
  
  const country = findCountry(region.countryId);
  const regionCollections = region.collections;
  
  const filteredCollections = selectedLevel === 'all'
    ? regionCollections
    : regionCollections.filter(coll => coll.level === selectedLevel);
  
  const essentialCount = regionCollections.filter(c => c.level === 'essential').length;
  const escapeCount = regionCollections.filter(c => c.level === 'escape').length;
  const iconCount = regionCollections.filter(c => c.level === 'icon').length;
  
  // Function to get completed count for a collection
  const getCollectionCompletedCount = (collectionId: string) => {
    const collection = regionCollections.find(c => c.id === collectionId);
    if (!collection) return 0;
    
    const completedItems = collection.items.filter(item => {
      const itemProgress = progress.find(p => p.itemId === item.id);
      return itemProgress?.status === 'completed';
    });
    
    return completedItems.length;
  };
  
  const handleBack = () => {
    if (country) {
      navigate(`/country/${country.id}`);
    } else {
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="relative h-64">
        <img
          src={region.imageUrl}
          alt={region.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-neutral-900" />
        </button>
        
        {/* Region Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-300 text-sm mb-1">{country?.name}</p>
            <h1 className="text-3xl font-bold text-white mb-2">{region.name}</h1>
            <p className="text-neutral-200 text-sm">{region.description}</p>
          </motion.div>
        </div>
      </div>
      
      {/* Filter Section */}
      <div className="max-w-lg mx-auto px-6 py-6 sticky top-0 bg-neutral-50 z-10 border-b border-neutral-200">
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
            Todas ({regionCollections.length})
          </Badge>
          <Badge
            variant={selectedLevel === 'essential' ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'essential' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'}`}
            onClick={() => setSelectedLevel('essential')}
          >
            Essencial ({essentialCount})
          </Badge>
          <Badge
            variant={selectedLevel === 'escape' ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'escape' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'}`}
            onClick={() => setSelectedLevel('escape')}
          >
            Fugir do Óbvio ({escapeCount})
          </Badge>
          <Badge
            variant={selectedLevel === 'icon' ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap ${selectedLevel === 'icon' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'}`}
            onClick={() => setSelectedLevel('icon')}
          >
            Ícones ({iconCount})
          </Badge>
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
              
              {/* Horizontal Scroll Cards */}
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
