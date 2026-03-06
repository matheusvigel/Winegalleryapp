import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Grape = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  type: 'red' | 'white';
  characteristics: string;
};

function GrapeCard({ grape, index }: { grape: Grape; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
    >
      <Link to={`/grape/${grape.id}`}>
        <div className="bg-[#FAFAF7] rounded-2xl overflow-hidden border border-black/[0.06]">
          <div className="relative h-32">
            <img
              src={grape.image_url}
              alt={grape.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="font-gelica text-lg text-white font-semibold">{grape.name}</h3>
            </div>
          </div>
          <div className="px-4 py-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-600 line-clamp-2">{grape.description}</p>
              {grape.characteristics && (
                <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{grape.characteristics}</p>
              )}
            </div>
            <ChevronRight size={18} className="text-neutral-300 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GrapesView() {
  const [all, setAll] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('grapes')
      .select('id, name, description, image_url, type, characteristics')
      .order('name')
      .then(({ data }) => {
        setAll(data ?? []);
        setLoading(false);
      });
  }, []);

  const redGrapes = all.filter(g => g.type === 'red');
  const whiteGrapes = all.filter(g => g.type === 'white');

  return (
    <div className="min-h-screen bg-[#F0EBE0]">
      <div className="px-4 pt-5 pb-6">
        <h1 className="font-gelica text-3xl text-[#1C1B1F] mb-5">Uvas</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="bg-[#FAFAF7] rounded-2xl h-36 animate-pulse border border-black/[0.05]"
              />
            ))}
          </div>
        ) : all.length === 0 ? (
          <p className="text-center py-16 text-neutral-400 text-sm">
            Nenhuma uva cadastrada.
          </p>
        ) : (
          <>
            {redGrapes.length > 0 && (
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-gelica text-xl text-[#1C1B1F]">Uvas Tintas</h2>
                  <span className="text-xs font-semibold bg-[#5C1A3E]/10 text-[#5C1A3E] px-2 py-0.5 rounded-full">
                    {redGrapes.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {redGrapes.map((grape, i) => (
                    <GrapeCard key={grape.id} grape={grape} index={i} />
                  ))}
                </div>
              </div>
            )}

            {whiteGrapes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-gelica text-xl text-[#1C1B1F]">Uvas Brancas</h2>
                  <span className="text-xs font-semibold bg-[#C5A96D]/20 text-[#8a7240] px-2 py-0.5 rounded-full">
                    {whiteGrapes.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {whiteGrapes.map((grape, i) => (
                    <GrapeCard key={grape.id} grape={grape} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
