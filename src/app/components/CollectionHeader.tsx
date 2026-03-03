import { Collection } from '../types';
import { motion } from 'motion/react';
import { Progress } from './ui/progress';

interface CollectionHeaderProps {
  collection: Collection;
  completedCount: number;
}

export function CollectionHeader({ collection, completedCount }: CollectionHeaderProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'essential':
        return 'from-green-600 to-green-700';
      case 'escape':
        return 'from-blue-600 to-blue-700';
      case 'icon':
        return 'from-yellow-600 to-yellow-700';
      default:
        return 'from-neutral-600 to-neutral-700';
    }
  };
  
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'essential':
        return 'Essencial';
      case 'escape':
        return 'Fugir do Óbvio';
      case 'icon':
        return 'Ícone';
      default:
        return level;
    }
  };
  
  const totalItems = collection.items.length;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const pointsEarned = collection.items
    .slice(0, completedCount)
    .reduce((sum, item) => sum + item.points, 0);
  
  return (
    <div className="relative h-72 rounded-xl overflow-hidden mb-6 shadow-xl">
      <img
        src={collection.coverImage}
        alt={collection.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="mb-3">
          <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getLevelColor(collection.level)} shadow-lg`}>
            {getLevelLabel(collection.level)}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{collection.title}</h2>
        <p className="text-neutral-200 text-sm leading-relaxed mb-3">{collection.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-neutral-300 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400">★</span>
            <span>{collection.items.length} {collection.items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400">🏆</span>
            <span>{collection.totalPoints} pontos</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white">
              {completedCount} de {totalItems} completados
            </span>
            <span className="text-xs font-bold text-yellow-300">
              {pointsEarned} pts
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-white/20"
          />
        </div>
      </div>
    </div>
  );
}