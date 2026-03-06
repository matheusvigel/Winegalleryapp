import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { supabase } from '../../lib/supabase';

type Grape = { id: string; name: string; description: string; image_url: string; type: 'red' | 'white'; characteristics: string };

export default function GrapesView() {
  const [all, setAll] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('grapes').select('id, name, description, image_url, type, characteristics').order('name')
      .then(({ data }) => { setAll(data ?? []); setLoading(false); });
  }, []);

  const redGrapes = all.filter(g => g.type === 'red');
  const whiteGrapes = all.filter(g => g.type === 'white');

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-6 py-6">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-32 bg-neutral-200" />
                <div className="p-4 h-14 bg-neutral-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                Uvas Tintas
                <Badge className="bg-red-600">{redGrapes.length}</Badge>
              </h2>
              <div className="space-y-4">
                {redGrapes.map((grape, index) => (
                  <motion.div key={grape.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                    <Link to={`/grape/${grape.id}`}>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-32">
                          <img src={grape.image_url} alt={grape.name} className="w-full h-full object-cover" />
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

            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                Uvas Brancas
                <Badge className="bg-yellow-600">{whiteGrapes.length}</Badge>
              </h2>
              <div className="space-y-4">
                {whiteGrapes.map((grape, index) => (
                  <motion.div key={grape.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                    <Link to={`/grape/${grape.id}`}>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-32">
                          <img src={grape.image_url} alt={grape.name} className="w-full h-full object-cover" />
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
          </>
        )}
      </div>
    </div>
  );
}
