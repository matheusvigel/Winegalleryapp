import { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { CollectionCard } from '../components/CollectionCard';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router';

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
  parent: { name: string } | null;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cols }, { data: regs }] = await Promise.all([
        supabase.from('collections').select('id, title, tagline, photo, content_type').order('title'),
        supabase.from('regions')
          .select('id, name, photo, parent:regions!parent_id(name)')
          .eq('level', 'region')
          .limit(6),
      ]);
      setCollections((cols as CollectionRow[]) ?? []);
      setRegions((regs as unknown as RegionRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = collections.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tagline ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      selectedFilter === 'all' || c.content_type === selectedFilter;
    return matchSearch && matchFilter;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all',        label: 'Todas'          },
    { key: 'Vinhos',     label: '🍷 Vinhos'       },
    { key: 'Experiências', label: '✨ Experiências' },
    { key: 'Vinícolas',  label: '🏛️ Vinícolas'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Explorar</h1>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar coleções, regiões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

      <div className="max-w-md mx-auto px-4 py-6">
        {regions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Explore por Região</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {regions.map((region) => (
                <Link
                  key={region.id}
                  to={`/region/${region.id}`}
                  className="relative overflow-hidden rounded-2xl h-32 cursor-pointer group block"
                >
                  {region.photo ? (
                    <img
                      src={region.photo}
                      alt={region.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-sm mb-0.5">{region.name}</h3>
                    {region.parent && (
                      <p className="text-white/80 text-xs">{region.parent.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {searchQuery ? 'Resultados' : 'Todas as Coleções'}
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-64" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((col) => (
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

      <BottomNav />
    </div>
  );
}
