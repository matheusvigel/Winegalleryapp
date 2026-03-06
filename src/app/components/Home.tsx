import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

type CollectionItem = { id: string; title: string; cover_image: string };
type Country = {
  id: string;
  name: string;
  image_url: string;
  regionCount: number;
  collectionCount: number;
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-orange-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => setStats(getStats());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const [
        { data: cols },
        { data: cts },
        { data: regionRows },
        { data: rcLinks },
      ] = await Promise.all([
        supabase.from('collections').select('id, title, cover_image').order('created_at', { ascending: false }).limit(6),
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id'),
        supabase.from('region_collections').select('region_id, collection_id'),
      ]);

      setCollections(cols ?? []);

      const regionCountMap: Record<string, number> = {};
      for (const r of regionRows ?? []) {
        regionCountMap[r.country_id] = (regionCountMap[r.country_id] ?? 0) + 1;
      }

      const regionToCountry: Record<string, string> = {};
      for (const r of regionRows ?? []) regionToCountry[r.id] = r.country_id;

      const collectionCountMap: Record<string, Set<string>> = {};
      for (const rc of rcLinks ?? []) {
        const countryId = regionToCountry[rc.region_id];
        if (countryId) {
          if (!collectionCountMap[countryId]) collectionCountMap[countryId] = new Set();
          collectionCountMap[countryId].add(rc.collection_id);
        }
      }

      setCountries(
        (cts ?? []).map(c => ({
          ...c,
          regionCount: regionCountMap[c.id] ?? 0,
          collectionCount: collectionCountMap[c.id]?.size ?? 0,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const pointsInLevel = stats.totalPoints % 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress widget (logged in) or CTA (logged out) */}
      {user ? (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-neutral-700">Nível {stats.level}</span>
            <ChevronRight size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-neutral-900">{pointsInLevel}/100</span>
            <div className="flex-1">
              <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${pointsInLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Link to="/register">
          <div className="mx-4 mt-4 mb-2 rounded-xl bg-[#8fa98f] px-5 py-5 flex items-center justify-center">
            <span className="text-base font-bold text-neutral-900">Crie sua conta e acumule pontos!</span>
          </div>
        </Link>
      )}

      {/* Últimas coleções */}
      <section className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          {collections[0] && (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={collections[0].cover_image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-xl font-bold text-neutral-900">Últimas coleções</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collections.map(col => (
              <div key={col.id}>
                <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200">
                  <img src={col.cover_image} alt={col.title} className="w-full h-full object-cover" />
                </div>
                <p className="mt-1.5 text-sm text-neutral-800">{col.title}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Explore pelos países */}
      <section className="pb-8">
        <h2 className="px-4 text-xl font-bold text-neutral-900 mb-3">Explore pelos países</h2>

        {loading ? (
          <div className="space-y-1">
            {[1, 2].map(i => <div key={i} className="h-52 bg-neutral-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {countries.map(country => (
              <Link key={country.id} to={`/country/${country.id}`}>
                <div className="relative h-52 overflow-hidden">
                  <img src={country.image_url} alt={country.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-black text-white uppercase text-lg tracking-wide leading-none mb-0.5">
                      {country.name}
                    </p>
                    <p className="text-white/80 text-sm">
                      {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'}
                    </p>
                    <p className="text-white/80 text-sm">
                      {country.collectionCount} {country.collectionCount === 1 ? 'Coleção' : 'Coleções'}
                    </p>
                    {user && (
                      <div className="mt-2">
                        <p className="text-white/70 text-xs mb-1">0/{country.collectionCount}</p>
                        <ProgressBar value={0} max={country.collectionCount} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
