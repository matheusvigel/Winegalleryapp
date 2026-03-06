import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Brand = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  country: string;
  region: string | null;
};

export default function BrandsView() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('brands')
      .select('id, name, description, image_url, country, region')
      .order('name')
      .then(({ data }) => {
        setBrands(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F0EBE0]">
      <div className="px-4 pt-5 pb-6">
        <h1 className="font-gelica text-3xl text-[#2D3A3A] mb-5">Vinícolas</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-[#FAFAF7] rounded-2xl h-44 animate-pulse border border-black/[0.05]"
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="text-center py-16 text-neutral-400 text-sm">
            Nenhuma vinícola cadastrada.
          </p>
        ) : (
          <div className="space-y-3">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link to={`/brand/${brand.id}`}>
                  <div className="bg-[#FAFAF7] rounded-2xl overflow-hidden border border-black/[0.06]">
                    <div className="relative h-36">
                      <img
                        src={brand.image_url}
                        alt={brand.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-gelica text-xl text-white font-semibold uppercase tracking-wide">
                          {brand.name}
                        </h3>
                        {brand.description && (
                          <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                            {brand.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D3A3A]">{brand.country}</p>
                        {brand.region && (
                          <p className="text-xs text-neutral-500">{brand.region}</p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-neutral-300 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
