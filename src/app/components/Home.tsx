import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

type Highlight = { id: string; type: string; entity_id: string; label: string | null };
type CollectionItem = { id: string; title: string; cover_image: string; content_type: string | null };
type Country = { id: string; name: string; image_url: string; regionCount: number; collectionCount: number };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines: 'Vinhos',
  wineries: 'Vinícolas',
  experiences: 'Experiências',
  grapes: 'Uvas',
  mix: 'Mix',
};

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => setStats(getStats());
    window.addEventListener('statsUpdated', handleUpdate);
    return () => window.removeEventListener('statsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [
        { data: cols },
        { data: cts },
        { data: regionRows },
        { data: rcLinks },
        { data: hls },
      ] = await Promise.all([
        supabase
          .from('collections')
          .select('id, title, cover_image, content_type')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id'),
        supabase.from('region_collections').select('region_id, collection_id'),
        supabase
          .from('highlights')
          .select('id, type, entity_id, label')
          .eq('active', true)
          .order('position'),
      ]);

      setCollections(cols ?? []);
      setHighlights(hls ?? []);

      const regionCountMap: Record<string, number> = {};
      for (const r of regionRows ?? []) {
        regionCountMap[r.country_id] = (regionCountMap[r.country_id] ?? 0) + 1;
      }
      const regionToCountry: Record<string, string> = {};
      for (const r of regionRows ?? []) regionToCountry[r.id] = r.country_id;
      const collectionCountMap: Record<string, Set<string>> = {};
      for (const rc of rcLinks ?? []) {
        const cid = regionToCountry[rc.region_id];
        if (cid) {
          if (!collectionCountMap[cid]) collectionCountMap[cid] = new Set();
          collectionCountMap[cid].add(rc.collection_id);
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
    <div className="min-h-screen bg-[#F0EBE0]">

      {/* ── Progresso / CTA ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-1">
        {user ? (
          <div className="flex items-center gap-3 bg-[#FAFAF7] rounded-2xl px-4 py-3 border border-black/[0.07]">
            <div className="flex-1">
              <p className="text-xs text-neutral-500 mb-1.5">
                Nível{' '}
                <span className="font-semibold text-[#1C1B1F]">{stats.level}</span>
              </p>
              <div className="w-full bg-black/8 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#5C1A3E] rounded-full transition-all duration-500"
                  style={{ width: `${pointsInLevel}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-neutral-500 tabular-nums">
              {pointsInLevel}<span className="text-neutral-300">/100</span>
            </span>
          </div>
        ) : (
          <Link to="/register" className="block">
            <div className="bg-[#5C1A3E] rounded-2xl px-5 py-5 text-center">
              <p className="font-gelica text-2xl text-white leading-tight mb-1">
                Comece sua jornada
              </p>
              <p className="text-[#C5A96D] text-sm">
                Crie sua conta e acumule pontos
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Destaques ───────────────────────────────────── */}
      {(highlights.length > 0 || loading) && (
        <div className="pt-6 pb-1">
          <h2 className="font-gelica text-[22px] text-[#1C1B1F] px-4 mb-3">
            Destaques
          </h2>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {loading
              ? [1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="min-w-[140px] h-44 bg-[#FAFAF7] rounded-2xl animate-pulse flex-shrink-0 border border-black/[0.05]"
                  />
                ))
              : highlights.map(h => (
                  <Link
                    key={h.id}
                    to={
                      h.type === 'country'
                        ? `/country/${h.entity_id}`
                        : h.type === 'region'
                        ? `/region/${h.entity_id}`
                        : '/'
                    }
                    className="flex-shrink-0"
                  >
                    <div className="min-w-[140px] h-44 bg-[#FAFAF7] rounded-2xl border border-black/[0.06] overflow-hidden flex flex-col">
                      <div className="flex-1 bg-neutral-100" />
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-[#1C1B1F] truncate">
                          {h.label ?? h.entity_id}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      )}

      {/* ── Últimas coleções ────────────────────────────── */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-gelica text-[22px] text-[#1C1B1F]">
            Últimas coleções
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="bg-[#FAFAF7] rounded-2xl aspect-square animate-pulse border border-black/[0.05]" />
                <div className="h-3 bg-neutral-200 rounded mt-2 w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collections.map(col => (
              <div key={col.id}>
                <div className="rounded-2xl overflow-hidden aspect-square relative bg-neutral-100 border border-black/[0.06]">
                  {col.cover_image && (
                    <img
                      src={col.cover_image}
                      alt={col.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {col.content_type && col.content_type !== 'mix' && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-semibold bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-[#1C1B1F] mt-1.5 truncate leading-snug">
                  {col.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Explore pelos países ─────────────────────────── */}
      <div className="pt-6 pb-6">
        <h2 className="font-gelica text-[22px] text-[#1C1B1F] px-4 mb-3">
          Explore pelos países
        </h2>

        {loading ? (
          <div className="flex flex-col gap-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {countries.map(country => (
              <Link key={country.id} to={`/country/${country.id}`}>
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={country.image_url}
                    alt={country.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-gelica text-2xl text-white font-semibold uppercase tracking-wide leading-tight">
                      {country.name}
                    </h3>
                    <p className="text-white/70 text-sm mt-0.5">
                      {country.regionCount}{' '}
                      {country.regionCount === 1 ? 'região' : 'regiões'} ·{' '}
                      {country.collectionCount}{' '}
                      {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                    </p>
                    {user && (
                      <div className="mt-2 bg-white/20 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-[#C5A96D] rounded-full"
                          style={{ width: '0%' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
