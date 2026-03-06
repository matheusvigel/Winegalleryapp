import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getStats, getProgress } from '../utils/storage';
import { supabase } from '../../lib/supabase';
import { Trophy, CheckCircle2, BookmarkPlus } from 'lucide-react';

type HighlightCard = {
  id: string;
  type: string;
  entity_id: string;
  label: string;
  image_url: string;
};

type CountryCard = {
  id: string;
  name: string;
  image_url: string;
  regionCount: number;
  collectionCount: number;
  totalItems: number;
  completedItems: number;
};

function getLevelName(level: number): string {
  if (level <= 1) return 'Curioso';
  if (level <= 3) return 'Apreciador';
  if (level <= 6) return 'Conhecedor';
  if (level <= 10) return 'Explorador';
  if (level <= 20) return 'Sommelier';
  return 'Mestre do Vinho';
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [highlights, setHighlights] = useState<HighlightCard[]>([]);
  const [countries, setCountries] = useState<CountryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => setStats(getStats());
    window.addEventListener('statsUpdated', handleUpdate);
    return () => window.removeEventListener('statsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [
        { data: cts },
        { data: regionRows },
        { data: rcLinks },
        { data: hls },
        { data: collectionItems },
      ] = await Promise.all([
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id, name, image_url'),
        supabase.from('region_collections').select('region_id, collection_id'),
        supabase
          .from('highlights')
          .select('id, type, entity_id, label')
          .eq('active', true)
          .order('position'),
        supabase.from('collection_items').select('collection_id, item_id'),
      ]);

      // ── Build lookup maps ───────────────────────────────────
      const regionToCountry: Record<string, string> = {};
      const regionById: Record<string, { name: string; image_url: string }> = {};
      for (const r of regionRows ?? []) {
        regionToCountry[r.id] = r.country_id;
        regionById[r.id] = { name: r.name, image_url: r.image_url };
      }

      const collectionToCountry: Record<string, string> = {};
      const collectionSetPerCountry: Record<string, Set<string>> = {};
      const regionCountMap: Record<string, number> = {};
      for (const r of regionRows ?? []) {
        regionCountMap[r.country_id] = (regionCountMap[r.country_id] ?? 0) + 1;
      }
      for (const rc of rcLinks ?? []) {
        const cid = regionToCountry[rc.region_id];
        if (!cid) continue;
        collectionToCountry[rc.collection_id] = cid;
        if (!collectionSetPerCountry[cid]) collectionSetPerCountry[cid] = new Set();
        collectionSetPerCountry[cid].add(rc.collection_id);
      }

      // ── Per-country progress (item-level, from localStorage) ─
      const itemToCountry: Record<string, string> = {};
      const totalItemsPerCountry: Record<string, number> = {};
      for (const ci of collectionItems ?? []) {
        const cid = collectionToCountry[ci.collection_id];
        if (!cid) continue;
        itemToCountry[ci.item_id] = cid;
        totalItemsPerCountry[cid] = (totalItemsPerCountry[cid] ?? 0) + 1;
      }
      const completedPerCountry: Record<string, number> = {};
      for (const p of getProgress()) {
        if (p.status !== 'completed') continue;
        const cid = itemToCountry[p.itemId];
        if (cid) completedPerCountry[cid] = (completedPerCountry[cid] ?? 0) + 1;
      }

      // ── Countries — sorted by collectionCount DESC ───────────
      setCountries(
        (cts ?? [])
          .map(c => ({
            id: c.id,
            name: c.name,
            image_url: c.image_url,
            regionCount: regionCountMap[c.id] ?? 0,
            collectionCount: collectionSetPerCountry[c.id]?.size ?? 0,
            totalItems: totalItemsPerCountry[c.id] ?? 0,
            completedItems: completedPerCountry[c.id] ?? 0,
          }))
          .sort((a, b) => b.collectionCount - a.collectionCount)
      );

      // ── Enrich highlights with entity name + image ───────────
      const countryById: Record<string, { name: string; image_url: string }> = {};
      for (const c of cts ?? []) countryById[c.id] = { name: c.name, image_url: c.image_url };

      setHighlights(
        (hls ?? []).map(h => {
          const src =
            h.type === 'country'
              ? countryById[h.entity_id]
              : h.type === 'region'
              ? regionById[h.entity_id]
              : undefined;
          return {
            id: h.id,
            type: h.type,
            entity_id: h.entity_id,
            label: h.label ?? src?.name ?? h.entity_id,
            image_url: src?.image_url ?? '',
          };
        })
      );

      setLoading(false);
    };
    load();
  }, []);

  const displayName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sommelier';
  const pointsInLevel = stats.totalPoints % 100;

  return (
    <div className="min-h-screen bg-[#F0EBE0]">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-1">
        {user ? (
          <div className="bg-[#FAFAF7] rounded-3xl border border-black/[0.07] overflow-hidden">

            {/* Dark header */}
            <div className="bg-[#2D3A3A] px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white/50 text-[11px] mb-0.5">Bem-vindo de volta</p>
                  <h2 className="font-gelica text-white text-xl leading-tight truncate">
                    {displayName}
                  </h2>
                  <p className="text-[#F1BD85] text-xs mt-0.5">
                    {getLevelName(stats.level)}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-[#690037] rounded-2xl px-3.5 py-2 flex flex-col items-center">
                  <span className="text-white/60 text-[10px] uppercase tracking-wide leading-none mb-0.5">
                    Nível
                  </span>
                  <span className="font-gelica text-white text-2xl leading-none">
                    {stats.level}
                  </span>
                </div>
              </div>

              {/* XP progress */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-white/40">Próximo nível</span>
                  <span className="text-white/60 tabular-nums">
                    {pointsInLevel}
                    <span className="text-white/30">/100 XP</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F1BD85] to-[#e09650] rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(2, pointsInLevel)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-black/[0.06]">
              <div className="flex flex-col items-center py-3.5 gap-0.5">
                <Trophy size={14} className="text-[#F1BD85] mb-0.5" />
                <span className="font-semibold text-[#2D3A3A] text-[15px] tabular-nums">
                  {stats.totalPoints}
                </span>
                <span className="text-[10px] text-neutral-400">pontos</span>
              </div>
              <div className="flex flex-col items-center py-3.5 gap-0.5">
                <CheckCircle2 size={14} className="text-[#690037] mb-0.5" />
                <span className="font-semibold text-[#2D3A3A] text-[15px] tabular-nums">
                  {stats.completedCount}
                </span>
                <span className="text-[10px] text-neutral-400">concluídos</span>
              </div>
              <div className="flex flex-col items-center py-3.5 gap-0.5">
                <BookmarkPlus size={14} className="text-[#400264] mb-0.5" />
                <span className="font-semibold text-[#2D3A3A] text-[15px] tabular-nums">
                  {stats.wishlistCount}
                </span>
                <span className="text-[10px] text-neutral-400">na lista</span>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/register" className="block">
            <div className="bg-[#690037] rounded-3xl px-5 py-6 text-center">
              <p className="font-gelica text-2xl text-white leading-tight mb-1.5">
                Comece sua jornada
              </p>
              <p className="text-[#F1BD85] text-sm">
                Crie sua conta e explore o universo do vinho
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Destaques ───────────────────────────────────────── */}
      {(highlights.length > 0 || loading) && (
        <div className="pt-7 pb-1">
          <h2 className="font-gelica text-[22px] text-[#2D3A3A] px-4 mb-3">
            Destaques
          </h2>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {loading
              ? [1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="min-w-[140px] h-44 bg-black/[0.06] rounded-2xl animate-pulse flex-shrink-0"
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
                    className="flex-shrink-0 block"
                  >
                    <div className="w-[140px] h-44 rounded-2xl overflow-hidden relative bg-neutral-200">
                      {h.image_url && (
                        <img
                          src={h.image_url}
                          alt={h.label}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-[11px] font-semibold text-white leading-snug line-clamp-2">
                          {h.label}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      )}

      {/* ── Explore pelos países ─────────────────────────── */}
      <div className="pt-7 pb-8 px-4">
        <h2 className="font-gelica text-[22px] text-[#2D3A3A] mb-4">
          Explore pelos países
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 bg-black/[0.07] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {countries.map(country => {
              const progressPct =
                country.totalItems > 0
                  ? Math.round((country.completedItems / country.totalItems) * 100)
                  : 0;
              return (
                <Link key={country.id} to={`/country/${country.id}`}>
                  <div className="relative h-52 rounded-2xl overflow-hidden">
                    {country.image_url ? (
                      <img
                        src={country.image_url}
                        alt={country.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2D3A3A]/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                      <h3 className="font-gelica text-[22px] text-white font-semibold uppercase tracking-wide leading-tight">
                        {country.name}
                      </h3>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-white/60 text-xs">
                          {country.regionCount}{' '}
                          {country.regionCount === 1 ? 'região' : 'regiões'} ·{' '}
                          {country.collectionCount}{' '}
                          {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                        </p>
                        {progressPct > 0 && (
                          <span className="text-[#F1BD85] text-xs font-semibold tabular-nums">
                            {progressPct}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2 bg-white/20 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#F1BD85] rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
