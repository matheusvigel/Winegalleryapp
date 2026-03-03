import { Link } from 'react-router';
import { MapPin, Award, Grape } from 'lucide-react';
import { motion } from 'motion/react';

interface NavigationTabsProps {
  activeTab: 'regions' | 'brands' | 'grapes';
}

export function NavigationTabs({ activeTab }: NavigationTabsProps) {
  const tabs = [
    { id: 'regions', label: 'Regiões', icon: MapPin, path: '/' },
    { id: 'brands', label: 'Grandes Marcas', icon: Award, path: '/brands' },
    { id: 'grapes', label: 'Uvas', icon: Grape, path: '/grapes' },
  ] as const;
  
  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
                isActive ? 'text-red-800' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
