import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../../lib/supabase';

type Country = { id: string; name: string; image_url: string; description: string };
type Collection = { id: string; title: string; cover_image: string; content_type: string | null };
type Region = { id: string; name: string; image_url: string; description: string };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines: 'Vinhos', wineries: 'Vinícolas', experiences: 'Experiências', grapes: 'Uvas', mix: 'Mix',
};

export default function CountryDetail() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryId) return;
    const load = async () => {
      const [{ data: ct }, { data: regs }] = await Promise.all([
        supabase.from('countries').select('*').eq('id', countryId).single(),
        supabase.from('regions').select('id, name, image_url, description')
          .eq('country_id', countryId).is('parent_id', null).order('name'),
      ]);
      setCountry(ct);
      const regionList = regs ?? [];
      setRegions(regionList);

      if (regionList.length > 0) {
        const { data: rcLinks } = await supabase
          .from('region_collections').select('collection_id').in('region_id', regionList.map(r => r.id));
        const ids = [...new Set((rcLinks ?? []).map(r => r.collection_id))];
        if (ids.length > 0) {
          const { data: cols } = await supabase
            .from('collections').select('id, title, cover_image, content_type')
            .in('id', ids).order('created_at', { ascending: false }).limit(6);
          setCollections(cols ?? []);
        }
      }
      setLoading(false);
    };
    load();
  }, [countryId]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Skeleton variant="rectangular" height={240} />
        <Box sx={{ px: 2, pt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" sx={{ aspectRatio: '1', borderRadius: 3 }} />)}
        </Box>
      </Box>
    );
  }

  if (!country) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Typography color="text.secondary">País não encontrado</Typography>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero */}
      <Box sx={{ position: 'relative', height: 240 }}>
        <img src={country.image_url} alt={country.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)' }} />
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>{country.name}</Typography>
          {country.description && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>{country.description}</Typography>
          )}
        </Box>
      </Box>

      {/* Collections */}
      {collections.length > 0 && (
        <Box sx={{ px: 2, pt: 3, pb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Coleções de {country.name}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {collections.map(col => (
              <Box key={col.id}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', border: 'none' }}>
                  <CardActionArea>
                    <Box sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                      <CardMedia component="img" image={col.cover_image} alt={col.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {col.content_type && col.content_type !== 'mix' && (
                        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                          <Chip label={CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type} size="small"
                            sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '0.65rem', height: 20, backdropFilter: 'blur(4px)' }} />
                        </Box>
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.75, lineHeight: 1.3 }} noWrap>{col.title}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Regions */}
      {regions.length > 0 && (
        <Box sx={{ pb: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, mb: 2 }}>Regiões de {country.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', px: 2, pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {regions.map(region => (
              <Box key={region.id} sx={{ flexShrink: 0, width: 160 }}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', border: 'none' }}>
                  <CardActionArea component={Link} to={`/region/${region.id}`}>
                    <Box sx={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                      <CardMedia component="img" image={region.image_url} alt={region.name} sx={{ height: '100%', objectFit: 'cover' }} />
                      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: 'white', lineHeight: 1.2, display: 'block' }}>
                          {region.name}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {collections.length === 0 && regions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" variant="body2">Nenhum conteúdo cadastrado ainda.</Typography>
        </Box>
      )}
    </Box>
  );
}
