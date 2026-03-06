import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Brand = { id: string; name: string; description: string; image_url: string; country: string; region: string | null };

export default function BrandsView() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('brands').select('id, name, description, image_url, country, region').order('name')
      .then(({ data }) => { setBrands(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-40 bg-neutral-200" />
                <div className="p-4 h-12 bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="text-center py-16 text-neutral-400 text-sm">Nenhuma vinícola cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {brands.map((brand, index) => (
              <motion.div key={brand.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                <Link to={`/brand/${brand.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40">
                      <img src={brand.image_url} alt={brand.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">{brand.name}</h3>
                        <p className="text-neutral-200 text-sm line-clamp-1">{brand.description}</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{brand.country}</p>
                        {brand.region && <p className="text-xs text-neutral-600">{brand.region}</p>}
                      </div>
                      <ChevronRight size={20} className="text-neutral-400" />
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
