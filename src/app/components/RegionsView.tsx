import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

type Country = {
  id: string;
  name: string;
  image_url: string;
  regionCount: number;
  collectionCount: number;
};

function OrangeBar({ value, max }: { value: number; max: number }) {
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

export default function RegionsView() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
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
      const [{ data: cts }, { data: regionRows }, { data: rcLinks }] = await Promise.all([
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id'),
        supabase.from('region_collections').select('region_id, collection_id'),
      ]);

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

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Progress card (logged in) */}
      {user && (
        <div className="px-4 pt-4 pb-3">
          <div className="bg-white rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-500">
                Nível {stats.level} em <span className="font-bold text-neutral-800">Regiões</span>
              </span>
              <span className="text-neutral-400 text-sm">›</span>
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
        </div>
      )}

      {/* Search bar */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar países..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-neutral-700 bg-transparent outline-none placeholder:text-neutral-400"
          />
          <Mic size={16} className="text-neutral-400 flex-shrink-0" />
        </div>
      </div>

      {/* Country cards */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-neutral-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-neutral-500 text-sm">Nenhum país encontrado.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map(country => (
            <Link key={country.id} to={`/country/${country.id}`}>
              <div className="relative h-52 overflow-hidden">
                <img src={country.image_url} alt={country.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
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
                      <OrangeBar value={0} max={country.collectionCount} />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
