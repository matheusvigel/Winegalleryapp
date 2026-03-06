import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Country = {
  id: string;
  name: string;
  image_url: string;
  description: string;
  regionCount: number;
};

export default function RegionsView() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: regions }] = await Promise.all([
        supabase
          .from('countries')
          .select('id, name, image_url, description')
          .order('name'),
        supabase.from('regions').select('id, country_id'),
      ]);
      const countMap: Record<string, number> = {};
      for (const r of regions ?? [])
        countMap[r.country_id] = (countMap[r.country_id] ?? 0) + 1;
      setCountries(
        (cts ?? []).map(c => ({ ...c, regionCount: countMap[c.id] ?? 0 }))
      );
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0EBE0]">
      <div className="px-4 pt-5 pb-6">
        <h1 className="font-gelica text-3xl text-[#2D3A3A] mb-5">Regiões</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-[#FAFAF7] rounded-2xl h-44 animate-pulse border border-black/[0.05]"
              />
            ))}
          </div>
        ) : countries.length === 0 ? (
          <p className="text-center py-16 text-neutral-400 text-sm">
            Nenhum país cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {countries.map((country, index) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link to={`/country/${country.id}`}>
                  <div className="bg-[#FAFAF7] rounded-2xl overflow-hidden border border-black/[0.06]">
                    <div className="relative h-36">
                      <img
                        src={country.image_url}
                        alt={country.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-gelica text-xl text-white font-semibold uppercase tracking-wide">
                          {country.name}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <p className="text-sm text-neutral-500">
                        {country.description ||
                          `${country.regionCount} ${
                            country.regionCount === 1 ? 'região' : 'regiões'
                          }`}
                      </p>
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
