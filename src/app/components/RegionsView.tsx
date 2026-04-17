import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

// In the new schema, countries = regions with level='country'.
// Regions  = regions with level='region',     parent_id = countryId.
// Sub-regs = regions with level='sub-region', parent_id = regionId.

type CountryRow = {
  id: string;
  name: string;
  photo: string | null;
  description: string | null;
  regionCount: number;
  collectionCount: number;
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

export default function RegionsView() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1. All country-level regions
      const { data: cts } = await supabase
        .from('regions')
        .select('id, name, photo, description')
        .eq('level', 'country')
        .order('name');

      if (!cts || cts.length === 0) { setLoading(false); return; }

      const countryIds = cts.map(c => c.id);

      // 2. Count child regions per country
      const { data: childRegs } = await supabase
        .from('regions')
        .select('parent_id')
        .in('parent_id', countryIds);

      const regionCountMap: Record<string, number> = {};
      for (const r of childRegs ?? []) {
        if (r.parent_id) regionCountMap[r.parent_id] = (regionCountMap[r.parent_id] ?? 0) + 1;
      }

      // 3. Count collections per country
      const { data: cols } = await supabase
        .from('collections')
        .select('country_id')
        .in('country_id', countryIds);

      const colCountMap: Record<string, number> = {};
      for (const c of cols ?? []) {
        if (c.country_id) colCountMap[c.country_id] = (colCountMap[c.country_id] ?? 0) + 1;
      }

      setCountries(cts.map(c => ({
        ...c,
        regionCount:     regionCountMap[c.id] ?? 0,
        collectionCount: colCountMap[c.id]   ?? 0,
      })));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Header / Search ─────────────────────────────────────── */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Regiões</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar países..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-500">Nenhum país encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((country, i) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <Link to={`/country/${country.id}`} className="block group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                    <div className="relative h-48">
                      {country.photo ? (
                        <img
                          src={country.photo}
                          alt={country.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-end justify-between">
                          <div>
                            <h2 className="text-white font-bold text-xl leading-tight mb-0.5">
                              {country.name}
                            </h2>
                            <p className="text-white/70 text-xs">
                              {country.regionCount > 0
                                ? `${country.regionCount} ${country.regionCount === 1 ? 'região' : 'regiões'}`
                                : ''
                              }
                              {country.regionCount > 0 && country.collectionCount > 0 ? ' · ' : ''}
                              {country.collectionCount > 0
                                ? `${country.collectionCount} ${country.collectionCount === 1 ? 'coleção' : 'coleções'}`
                                : ''
                              }
                            </p>
                          </div>
                          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                            <ChevronRight className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {country.description && (
                      <div className="px-4 py-3 border-t border-gray-50">
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                          {country.description}
                        </p>
                      </div>
                    )}
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
