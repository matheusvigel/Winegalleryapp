import { useState, useEffect } from 'react';
import { WineExperience } from '../types';
import { getExperienceStatus, updateExperienceStatus } from '../utils/storage';
import { Heart, Check, Wine, Lightbulb, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ExperienceCardProps {
  experience: WineExperience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const [status, setStatus] = useState<'wishlist' | 'completed' | null>(null);
  
  useEffect(() => {
    setStatus(getExperienceStatus(experience.id));
  }, [experience.id]);
  
  const handleStatusChange = (newStatus: 'wishlist' | 'completed' | null) => {
    const finalStatus = status === newStatus ? null : newStatus;
    setStatus(finalStatus);
    updateExperienceStatus(experience.id, finalStatus, experience.points);
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('statsUpdated'));
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'essential':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'escape':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'icon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
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
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wine':
        return <Wine size={16} />;
      case 'experience':
        return <Lightbulb size={16} />;
      case 'winery':
        return <Building2 size={16} />;
      default:
        return null;
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'wine':
        return 'Vinho';
      case 'experience':
        return 'Experiência';
      case 'winery':
        return 'Vinícola';
      default:
        return category;
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col">
      <div className="relative h-48 flex-shrink-0">
        <img
          src={experience.imageUrl}
          alt={experience.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Level Badge */}
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(experience.level)}`}>
            {getLevelLabel(experience.level)}
          </div>
        </div>
        
        {/* Points Badge */}
        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-red-800">+{experience.points} pts</span>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleStatusChange('wishlist')}
            className={`p-2 rounded-full transition-colors ${
              status === 'wishlist'
                ? 'bg-red-600 text-white'
                : 'bg-white/90 text-neutral-700 hover:bg-white'
            }`}
          >
            <Heart size={20} fill={status === 'wishlist' ? 'currentColor' : 'none'} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleStatusChange('completed')}
            className={`p-2 rounded-full transition-colors ${
              status === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-white/90 text-neutral-700 hover:bg-white'
            }`}
          >
            <Check size={20} />
          </motion.button>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-neutral-600">
            {getCategoryIcon(experience.category)}
          </div>
          <span className="text-xs text-neutral-500">{getCategoryLabel(experience.category)}</span>
        </div>
        
        <h3 className="text-lg font-bold text-neutral-900 mb-2">{experience.title}</h3>
        <p className="text-sm text-neutral-600 line-clamp-2">{experience.description}</p>
      </div>
    </div>
  );
}