import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Sparkles, TrendingUp, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';
import { CollectionCard } from './CollectionCard';
import { BottomNav } from './BottomNav';

interface CollectionRow {
  id: string;
  title: string;
  tagline: string | null;
  photo: string;
  content_type: string;
}

interface HighlightRow {
  id: string;
  type: string;
  entity_id: string;
  label: string;
  image_url: string;
  route: string;
}

interface CountryRow {
  id: string;
  name: string;
  photo: string;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = () => setStats(getStats());
    window.addEventListener('statsUpdated', h);
    return () => window.removeEventListener('statsUpdated', h);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: cols }, { data: hls }] = await Promise.all([
        supabase.from('regions').select('id, name, photo').eq('level', 'country').order('name').limit(4),
        supabase.from('collections').select('id, title, tagline, photo, content_type').order('title').limit(10),
        supabase.from('highlights').select('id, type, entity_id, label').eq('active', true).order('position').limit(6),
      ]);

      setCountries((cts as CountryRow[]) ?? []);
      setCollections((cols as CollectionRow[]) ?? []);

      // Resolve highlight labels and images
      const hlList = hls ?? [];
      const regionById: Record<string, { name: string; photo: string }> = {};
      for (const r of cts ?? []) regionById[r.id] = { name: r.name, photo: r.photo };

      const colIds = hlList.filter(h => h.type === 'collection').map(h => h.entity_id);
      const regIds = hlList.filter(h => h.type === 'region').map(h => h.entity_id);

      const [{ data: hlCols }, { data: hlRegs }] = await Promise.all([
        colIds.length ? supabase.from('collections').select('id, title, photo').in('id', colIds) : Promise.resolve({ data: [] }),
        regIds.length ? supabase.from('regions').select('id, name, photo').in('id', regIds) : Promise.resolve({ data: [] }),
      ]);

      const cById: Record<string, { name: string; photo: string }> = {};
      for (const c of hlCols ?? []) cById[c.id] = { name: c.title, photo: c.photo };
      for (const r of hlRegs ?? []) regionById[r.id] = { name: r.name, photo: r.photo };

      setHighlights(hlList.map(h => {
        let entity: { name: string; photo: string } | undefined;
        let route = '/explore';
        if (h.type === 'region') { entity = regionById[h.entity_id]; route = `/region/${h.entity_id}`; }
        else if (h.type === 'collection') { entity = cById[h.entity_id]; route = `/collection/${h.entity_id}`; }
        else if (h.type === 'winery') { route = `/explore`; }
        return { id: h.id, type: h.type, entity_id: h.entity_id, label: entity?.name || h.label || '', image_url: entity?.photo ?? '', route };
      }));

      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Wine Gallery
              </h1>
              <p className="text-sm text-gray-600">Colecione experiências no mundo do vinho</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-full">
                <span className="text-sm font-bold text-purple-700">{stats.completedCount} 🍷</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Welcome card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              {user ? (
                <>
                  <h2 className="text-xl font-bold mb-1">Bem-vindo de volta!</h2>
                  <p className="text-purple-100 text-sm">
                    Continue sua jornada no mundo do vinho. Você já registrou {stats.completedCount} itens.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-1">Bem-vindo ao Wine Gallery!</h2>
                  <p className="text-purple-100 text-sm">
                    Explore vinhos, experiências e vinícolas do mundo inteiro.
                  </p>
                </>
              )}
            </div>
          </div>

          {user ? (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-purple-400/30">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.completedCount}</div>
                <div className="text-xs text-purple-200">Completos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalPoints}</div>
                <div className="text-xs text-purple-200">Pontos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.level}</div>
                <div className="text-xs text-purple-200">Nível</div>
              </div>
            </div>
          ) : (
            <Link
              to="/register"
              className="block mt-4 text-center bg-white/20 hover:bg-white/30 transition-colors text-white font-semibold py-3 rounded-xl"
            >
              Criar conta gratuita →
            </Link>
          )}
        </div>

        {/* Highlights */}
        {(loading || highlights.length > 0) && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Destaques</h2>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3].map(i => (
                  <div key={i} className="min-w-[148px] h-48 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {highlights.map(h => (
                  <Link
                    key={h.id}
                    to={h.route}
                    className="min-w-[148px] flex-shrink-0 rounded-2xl overflow-hidden relative h-48 block group"
                  >
                    {h.image_url ? (
                      <img
                        src={h.image_url}
                        alt={h.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm line-clamp-2">{h.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explore by country */}
        {countries.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Explore o Mundo</h2>
              </div>
              <Link to="/explore" className="text-sm text-purple-600 font-medium flex items-center gap-1">
                Ver tudo <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {countries.map(c => (
                <Link
                  key={c.id}
                  to={`/region/${c.id}`}
                  className="relative overflow-hidden rounded-2xl h-28 block group"
                >
                  <img
                    src={c.photo}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-white font-semibold text-sm">{c.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Collections */}
        {collections.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Coleções</h2>
              </div>
              <Link to="/explore" className="text-sm text-purple-600 font-medium flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {collections.slice(0, 4).map(col => (
              <CollectionCard
                key={col.id}
                id={col.id}
                title={col.title}
                coverImage={col.photo}
                description={col.tagline ?? ''}
                contentType={col.content_type}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-64" />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
