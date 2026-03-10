import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

type Highlight = {
  id: string; type: string; entity_id: string; label: string;
  image_url: string; route: string;
};
type CollectionItem = {
  id: string; title: string; cover_image: string;
  content_type: string | null;
};
type Country = {
  id: string; name: string; image_url: string;
  regionCount: number; collectionCount: number;
};

const HIGHLIGHT_TYPE_LABELS: Record<string, string> = {
  collection: 'Coleção', country: 'País', region: 'Região', brand: 'Vinícola',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines: 'Vinhos', wineries: 'Vinícolas', experiences: 'Experiências',
  grapes: 'Uvas', mix: 'Mix',
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
        supabase.from('collections').select('id, title, cover_image, content_type')
          .order('created_at', { ascending: false }).limit(6),
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id, name, image_url'),
        supabase.from('region_collections').select('region_id, collection_id'),
        supabase.from('highlights').select('id, type, entity_id, label')
          .eq('active', true).order('position'),
      ]);

      setCollections(cols ?? []);

      // ── Build lookup maps ────────────────────────────────
      const regionToCountry: Record<string, string> = {};
      const regionById: Record<string, { name: string; image_url: string }> = {};
      const regionCountMap: Record<string, number> = {};
      for (const r of regionRows ?? []) {
        regionToCountry[r.id] = r.country_id;
        regionById[r.id] = { name: r.name, image_url: r.image_url };
        regionCountMap[r.country_id] = (regionCountMap[r.country_id] ?? 0) + 1;
      }

      const collectionToRegion: Record<string, string> = {};
      const collectionCountMap: Record<string, Set<string>> = {};
      for (const rc of rcLinks ?? []) {
        const cid = regionToCountry[rc.region_id];
        if (!collectionToRegion[rc.collection_id]) collectionToRegion[rc.collection_id] = rc.region_id;
        if (cid) {
          if (!collectionCountMap[cid]) collectionCountMap[cid] = new Set();
          collectionCountMap[cid].add(rc.collection_id);
        }
      }

      const countryById: Record<string, { name: string; image_url: string }> = {};
      for (const c of cts ?? []) countryById[c.id] = { name: c.name, image_url: c.image_url };

      setCountries((cts ?? []).map(c => ({
        ...c,
        regionCount: regionCountMap[c.id] ?? 0,
        collectionCount: collectionCountMap[c.id]?.size ?? 0,
      })));

      // ── Phase 2: fetch collection + brand images for highlights ──
      const hlList = hls ?? [];
      const collectionHlIds = hlList.filter(h => h.type === 'collection').map(h => h.entity_id);
      const brandHlIds = hlList.filter(h => h.type === 'brand').map(h => h.entity_id);

      const [{ data: hlCols }, { data: hlBrands }] = await Promise.all([
        collectionHlIds.length > 0
          ? supabase.from('collections').select('id, title, cover_image').in('id', collectionHlIds)
          : Promise.resolve({ data: [] as { id: string; title: string; cover_image: string }[] }),
        brandHlIds.length > 0
          ? supabase.from('brands').select('id, name, image_url').in('id', brandHlIds)
          : Promise.resolve({ data: [] as { id: string; name: string; image_url: string }[] }),
      ]);

      const collectionById: Record<string, { name: string; image_url: string }> = {};
      for (const c of hlCols ?? []) collectionById[c.id] = { name: c.title, image_url: c.cover_image };
      const brandById: Record<string, { name: string; image_url: string }> = {};
      for (const b of hlBrands ?? []) brandById[b.id] = { name: b.name, image_url: b.image_url };

      // ── Enrich highlights ────────────────────────────────
      setHighlights(hlList.map(h => {
        let entity: { name: string; image_url: string } | undefined;
        let route = '/';
        if (h.type === 'country') {
          entity = countryById[h.entity_id];
          route = `/country/${h.entity_id}`;
        } else if (h.type === 'region') {
          entity = regionById[h.entity_id];
          route = `/region/${h.entity_id}`;
        } else if (h.type === 'collection') {
          entity = collectionById[h.entity_id];
          const rid = collectionToRegion[h.entity_id];
          route = rid ? `/region/${rid}#collection-${h.entity_id}` : '/';
        } else if (h.type === 'brand') {
          entity = brandById[h.entity_id];
          route = `/brand/${h.entity_id}`;
        }
        return {
          id: h.id, type: h.type, entity_id: h.entity_id,
          label: entity?.name || h.label?.trim() || h.entity_id,
          image_url: entity?.image_url ?? '',
          route,
        };
      }));

      setLoading(false);
    };
    load();
  }, []);

  const pointsInLevel = stats.totalPoints % 100;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* ── Progress / CTA ─────────────────────────────────── */}
      {user ? (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Nível <strong>{stats.level}</strong>
            </Typography>
            <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
              {pointsInLevel}/100
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={pointsInLevel}
                sx={{ bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#E8572A' } }}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Card sx={{ bgcolor: '#6B8F71', border: 'none', borderRadius: 3 }}>
            <CardActionArea component={Link} to="/register" sx={{ px: 3, py: 2.5, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1C1B1F' }}>
                Crie sua conta e acumule pontos!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.55)', mt: 0.5 }}>
                Acompanhe seu progresso e personalize sua experiência
              </Typography>
            </CardActionArea>
          </Card>
        </Box>
      )}

      {/* ── Destaques ─────────────────────────────────────── */}
      {highlights.length > 0 && (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Destaques</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {highlights.map(h => (
              <Card key={h.id} sx={{ minWidth: 140, maxWidth: 140, flexShrink: 0, border: 'none', borderRadius: 3, overflow: 'hidden' }}>
                <CardActionArea component={Link} to={h.route}>
                  <Box sx={{ position: 'relative', height: 176, bgcolor: 'grey.300' }}>
                    {h.image_url && (
                      <img
                        src={h.image_url}
                        alt={h.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <Chip
                        label={HIGHLIGHT_TYPE_LABELS[h.type] ?? h.type}
                        size="small"
                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.6rem', height: 18, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', '& .MuiChip-label': { px: 1, py: 0 } }}
                      />
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: 'white', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {h.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Últimas coleções ───────────────────────────────── */}
      <Box sx={{ px: 2, pt: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          {!loading && collections[0] && (
            <Box sx={{ width: 40, height: 40, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0 }}>
              <img src={collections[0].cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          )}
          <Typography variant="subtitle1" fontWeight={700}>Últimas coleções</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[1, 2, 3, 4].map(i => (
              <Box key={i}>
                <Skeleton variant="rectangular" sx={{ borderRadius: 3, aspectRatio: '1', width: '100%' }} />
                <Skeleton variant="text" sx={{ mt: 0.75, width: '70%' }} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {collections.map(col => (
              <Box key={col.id}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', border: 'none' }}>
                  <CardActionArea>
                    <Box sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={col.cover_image}
                        alt={col.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {col.content_type && col.content_type !== 'mix' && (
                        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                          <Chip
                            label={CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type}
                            size="small"
                            sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '0.65rem', height: 20, backdropFilter: 'blur(4px)' }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
                <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 500, lineHeight: 1.3 }} noWrap>
                  {col.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Explore pelos países ────────────────────────────── */}
      <Box sx={{ pb: 4 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, mb: 1.5 }}>
          Explore pelos países
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={208} />)}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {countries.map(country => (
              <CardActionArea key={country.id} component={Link} to={`/country/${country.id}`}>
                <Box sx={{ position: 'relative', height: 208, overflow: 'hidden' }}>
                  <img
                    src={country.image_url}
                    alt={country.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: 'white', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                      {country.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>
                      {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'} · {country.collectionCount} {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                    </Typography>
                    {user && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={0}
                          sx={{ bgcolor: 'rgba(255,255,255,0.25)', height: 4, '& .MuiLinearProgress-bar': { bgcolor: '#E8572A' } }}
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
    </Box>
  );
}
