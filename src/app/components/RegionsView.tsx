import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CardActionArea from '@mui/material/CardActionArea';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#111' }}>
      {user && (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Nível <strong>{stats.level}</strong> em <strong>Regiões</strong>
              </Typography>
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6">{pointsInLevel}/100</Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate" value={pointsInLevel}
                  sx={{ bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#E8572A' } }}
                />
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField
          fullWidth placeholder="Buscar países..."
          value={search} onChange={e => setSearch(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'grey.400', fontSize: 18 }} /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><MicIcon sx={{ color: 'grey.400', fontSize: 18 }} /></InputAdornment>,
              sx: { bgcolor: 'white', borderRadius: 6, '& fieldset': { border: 'none' } },
            },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={208} sx={{ bgcolor: 'grey.800' }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 8, color: 'grey.500' }}>Nenhum país encontrado.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {filtered.map(country => (
            <CardActionArea key={country.id} component={Link} to={`/country/${country.id}`}>
              <Box sx={{ position: 'relative', height: 208, overflow: 'hidden' }}>
                <img src={country.image_url} alt={country.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                    {country.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                    {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'} · {country.collectionCount} {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                  </Typography>
                  {user && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={0}
                        sx={{ bgcolor: 'rgba(255,255,255,0.22)', height: 4, '& .MuiLinearProgress-bar': { bgcolor: '#E8572A' } }}
                      />
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
