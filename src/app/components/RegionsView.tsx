import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { User } from 'lucide-react';
import { motion } from 'motion/react';
import { NavigationTabs } from './NavigationTabs';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Country = { id: string; name: string; image_url: string; description: string; regionCount: number };

export default function RegionsView() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: regions }] = await Promise.all([
        supabase.from('countries').select('id, name, image_url, description').order('name'),
        supabase.from('regions').select('id, country_id'),
      ]);
      const countMap: Record<string, number> = {};
      for (const r of regions ?? []) countMap[r.country_id] = (countMap[r.country_id] ?? 0) + 1;
      setCountries((cts ?? []).map(c => ({ ...c, regionCount: countMap[c.id] ?? 0 })));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-red-900 text-white px-6 py-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wine Gallery</h1>
            <p className="text-red-100 text-sm">Explore o mundo do vinho</p>
          </div>
          <Link to="/profile" className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
            <User size={24} />
          </Link>
        </div>
      </header>

      <NavigationTabs activeTab="regions" />

      <div className="max-w-lg mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-40 bg-neutral-200" />
                <div className="p-4 h-10 bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : countries.length === 0 ? (
          <p className="text-center py-16 text-neutral-400 text-sm">Nenhum país cadastrado.</p>
        ) : (
          <div className="space-y-4">
            {countries.map((country, index) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={`/country/${country.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40">
                      <img src={country.image_url} alt={country.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">{country.name}</h3>
                        <p className="text-neutral-200 text-sm">{country.description}</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'}
                      </span>
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
