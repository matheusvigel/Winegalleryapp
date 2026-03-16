import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE  = '#690037';
const VERDE = '#2D3A3A';
const LARANJA = '#F1BD85';
const TEXT1 = '#1C1B1F';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

type Country = {
  id: string; name: string; image_url: string;
  regionCount: number; collectionCount: number;
};

export default function RegionsView() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => setStats(getStats());
    window.addEventListener('statsUpdated', handleUpdate);
    return () => window.removeEventListener('statsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: regionRows }, { data: rcLinks }] = await Promise.all([
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id'),
        supabase.from('region_collections').select('region_id, collection_id'),
      ]);
      const regionCountMap: Record<string, number> = {};
      for (const r of regionRows ?? []) regionCountMap[r.country_id] = (regionCountMap[r.country_id] ?? 0) + 1;
      const regionToCountry: Record<string, string> = {};
      for (const r of regionRows ?? []) regionToCountry[r.id] = r.country_id;
      const colCountMap: Record<string, Set<string>> = {};
      for (const rc of rcLinks ?? []) {
        const cid = regionToCountry[rc.region_id];
        if (cid) { if (!colCountMap[cid]) colCountMap[cid] = new Set(); colCountMap[cid].add(rc.collection_id); }
      }
      setCountries((cts ?? []).map(c => ({
        ...c, regionCount: regionCountMap[c.id] ?? 0, collectionCount: colCountMap[c.id]?.size ?? 0,
      })));
      setLoading(false);
    };
    load();
  }, []);

  const pointsInLevel = stats.totalPoints % 100;
  const filtered = countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>

      {/* ── User level bar ───────────────────────────────────── */}
      {user && (
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Box sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1.75,
            backgroundColor: CARD,
            border: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{
                fontFamily: "'DM Sans'",
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: MUTED,
                mb: 0.6,
              }}>
                Nível {stats.level} em Regiões
              </Typography>
              <Box sx={{ position: 'relative', height: 4, borderRadius: 99, bgcolor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <Box sx={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pointsInLevel}%`,
                  backgroundColor: VERDE,
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }} />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '1.1rem', fontWeight: 700, color: VERDE, lineHeight: 1 }}>
                {pointsInLevel}
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.55rem', color: MUTED, letterSpacing: '0.06em' }}>
                /100 pts
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Search ───────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: user ? 1.5 : 2.5, pb: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: SURF,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          px: 2,
          py: 1.25,
          '&:focus-within': { borderColor: 'rgba(105,0,55,0.3)', bgcolor: CARD },
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}>
          <Search size={15} color={MUTED} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar países..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              flex: 1,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '0.875rem',
              color: TEXT1,
              caretColor: WINE,
            }}
          />
        </Box>
      </Box>

      {/* ── Country list ─────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={200} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.85rem', color: MUTED }}>Nenhum país encontrado.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {filtered.map(country => (
            <CardActionArea key={country.id} component={Link} to={`/country/${country.id}`}>
              <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img
                  src={country.image_url}
                  alt={country.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.20) 55%, rgba(0,0,0,0.04) 100%)' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5 }}>
                  <Typography sx={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.25rem', color: '#FFFFFF', lineHeight: 1, mb: 0.4 }}>
                    {country.name}
                  </Typography>
                  <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.73rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.03em' }}>
                    {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'} · {country.collectionCount} {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                  </Typography>
                  {user && (
                    <Box sx={{ mt: 1.5, position: 'relative', height: 2, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', backgroundColor: LARANJA, borderRadius: 99 }} />
                    </Box>
                  )}
                </Box>
              </Box>
            </CardActionArea>
          ))}
        </Box>
      )}
    </Box>
  );
}
