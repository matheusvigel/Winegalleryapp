import { Link } from 'react-router';
import { User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { grapes } from '../data/wineData';
import { NavigationTabs } from './NavigationTabs';
import { Badge } from './ui/badge';

export default function GrapesView() {
  const redGrapes = grapes.filter(g => g.type === 'red');
  const whiteGrapes = grapes.filter(g => g.type === 'white');
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-red-900 text-white px-6 py-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wine Gallery</h1>
            <p className="text-red-100 text-sm">Variedades de Uvas</p>
          </div>
          <Link
            to="/profile"
            className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <User size={24} />
          </Link>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <NavigationTabs activeTab="grapes" />
      
      {/* Grapes List */}
      <div className="max-w-lg mx-auto px-6 py-6">
        {/* Red Grapes */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            Uvas Tintas
            <Badge className="bg-red-600">
              {redGrapes.length}
            </Badge>
          </h2>
          
          <div className="space-y-4">
            {redGrapes.map((grape, index) => (
              <motion.div
                key={grape.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={`/grape/${grape.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-32">
                      <img
                        src={grape.imageUrl}
                        alt={grape.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{grape.name}</h3>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-900 mb-1">{grape.description}</p>
                        <p className="text-xs text-neutral-600">{grape.characteristics}</p>
                      </div>
                      <ChevronRight size={20} className="text-neutral-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* White Grapes */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            Uvas Brancas
            <Badge className="bg-yellow-600">
              {whiteGrapes.length}
            </Badge>
          </h2>
          
          <div className="space-y-4">
            {whiteGrapes.map((grape, index) => (
              <motion.div
                key={grape.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={`/grape/${grape.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-32">
                      <img
                        src={grape.imageUrl}
                        alt={grape.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{grape.name}</h3>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-900 mb-1">{grape.description}</p>
                        <p className="text-xs text-neutral-600">{grape.characteristics}</p>
                      </div>
                      <ChevronRight size={20} className="text-neutral-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
