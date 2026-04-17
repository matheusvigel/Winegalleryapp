import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { CollectionCard } from '../components/CollectionCard';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type FilterType = 'all' | 'Vinhos' | 'Experiências' | 'Vinícolas';

interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
}

interface RegionRow {
  id: string;
  name: string;
  photo: string | null;
  level: string;
  parent: { name: string } | null;
}

interface CountryRow {
  id: string;
  name: string;
  photo: string | null;
}

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',          label: 'Todas'          },
  { key: 'Vinhos',       label: '🍷 Vinhos'       },
  { key: 'Experiências', label: '✨ Experiências' },
  { key: 'Vinícolas',    label: '🏛️ Vinícolas'    },
];

export default function Explore() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: regs }, { data: cts }] = await Promise.all([
        supabase.from('collections').select('id, title, tagline, photo, content_type').order('title'),
        supabase.from('regions')
          .select('id, name, photo, level, parent:regions!parent_id(name)')
          .in('level', ['region', 'sub-region'])
          .not('photo', 'is', null)
          .limit(6),
        supabase.from('regions')
          .select('id, name, photo')
          .eq('level', 'country')
          .order('name'),
      ]);

      setCollections((cols as CollectionRow[]) ?? []);
      setRegions((regs as unknown as RegionRow[]) ?? []);
      setCountries((cts as CountryRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = collections.filter(c =>
    selectedFilter === 'all' || c.content_type === selectedFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 lg:hidden">Explorar</h1>

          {/* Search bar — navigates to /search */}
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl text-left mb-4 hover:bg-gray-200 transition-colors"
          >
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 text-sm">Buscar vinhos, vinícolas, regiões...</span>
          </button>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedFilter === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

        {/* ── Countries row ────────────────────────────────────────── */}
        {countries.length > 0 && selectedFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <h2 className="text-lg font-bold text-gray-900">Por País</h2>
              </div>
              <Link to="/regions" className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {countries.map((country) => (
                <Link
                  key={country.id}
                  to={`/country/${country.id}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden">
                    {country.photo ? (
                      <img
                        src={country.photo}
                        alt={country.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold leading-tight">
                      {country.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Regions grid ─────────────────────────────────────────── */}
        {regions.length > 0 && selectedFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Explorar por Região</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {regions.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                >
                  <Link
                    to={`/region/${region.id}`}
                    className="relative overflow-hidden rounded-2xl h-32 cursor-pointer group block"
                  >
                    {region.photo ? (
                      <img
                        src={region.photo}
                        alt={region.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm mb-0.5 leading-tight">{region.name}</h3>
                      {region.parent && (
                        <p className="text-white/70 text-[10px]">{region.parent.name}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Collections ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {selectedFilter === 'all' ? 'Todas as Coleções' : FILTERS.find(f => f.key === selectedFilter)?.label}
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-64" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(col => (
              <CollectionCard
                key={col.id}
                id={col.id}
                title={col.title}
                coverImage={col.photo}
                description={col.tagline ?? ''}
                contentType={col.content_type}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500">Nenhuma coleção encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
