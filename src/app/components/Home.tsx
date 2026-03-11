import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
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

/* ── Section header with thin gold ornamental line ──────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        style={{
          width: 18,
          height: 1,
          display: 'block',
          background: 'linear-gradient(to right, transparent, #C5A25A)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.68rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#C5A25A',
        }}
      >
        {children}
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          display: 'block',
          background: 'linear-gradient(to right, rgba(197,162,90,0.3), transparent)',
        }}
      />
    </div>
  );
}

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
    <Box sx={{ bgcolor: '#0B0907', minHeight: '100vh' }}>

      {/* ── Progress / CTA ─────────────────────────────────────── */}
      {user ? (
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Box
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 2,
              background: 'linear-gradient(135deg, #1C1915 0%, #141210 100%)',
              border: '1px solid rgba(197,162,90,0.14)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#C5A25A',
                    mb: 0.25,
                  }}
                >
                  Sua Jornada
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    color: '#E2D4BA',
                  }}
                >
                  Nível <strong>{stats.level}</strong>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#C5A25A', lineHeight: 1 }}>
                  {stats.totalPoints}
                </Typography>
                <Typography sx={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.6rem', color: '#574E47', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  pontos
                </Typography>
              </Box>
            </Box>
            {/* Gold progress bar */}
            <Box sx={{ position: 'relative', height: 3, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${pointsInLevel}%`,
                  background: 'linear-gradient(to right, #8B1A36, #C5A25A)',
                  borderRadius: 99,
                  transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.6rem', color: '#574E47' }}>
                {pointsInLevel} pts
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.6rem', color: '#574E47' }}>
                100 pts p/ próx. nível
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Box
            sx={{
              borderRadius: 2.5,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(135deg, #1C1915 0%, #2A1F14 100%)',
              border: '1px solid rgba(197,162,90,0.2)',
            }}
          >
            <CardActionArea component={Link} to="/register" sx={{ px: 3, py: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  color: '#E2D4BA',
                  mb: 0.5,
                }}
              >
                Comece sua jornada vinícola
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '0.8rem',
                  color: '#8C8074',
                }}
              >
                Crie sua conta e acumule pontos explorando vinhos do mundo
              </Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 1.5, px: 2.5, py: 1, bgcolor: 'rgba(197,162,90,0.12)', border: '1px solid rgba(197,162,90,0.25)', borderRadius: 6 }}>
                <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 500, color: '#C5A25A' }}>
                  Criar conta gratuita
                </Typography>
              </Box>
            </CardActionArea>
          </Box>
        </Box>
      )}

      {/* ── Destaques ─────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
          <SectionLabel>Destaques</SectionLabel>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {highlights.map((h, i) => (
              <Box
                key={h.id}
                component={Link}
                to={h.route}
                sx={{
                  minWidth: 130,
                  maxWidth: 130,
                  flexShrink: 0,
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'block',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  animationDelay: `${i * 60}ms`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: 'rgba(197,162,90,0.25)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', height: 170, bgcolor: '#1C1915' }}>
                  {h.image_url && (
                    <img
                      src={h.image_url}
                      alt={h.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                    />
                  )}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Box sx={{ px: 1, py: 0.3, bgcolor: 'rgba(197,162,90,0.18)', border: '1px solid rgba(197,162,90,0.3)', borderRadius: 1, backdropFilter: 'blur(8px)' }}>
                      <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C5A25A' }}>
                        {HIGHLIGHT_TYPE_LABELS[h.type] ?? h.type}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                    <Typography sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.8rem', fontWeight: 500, color: '#E2D4BA', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {h.label}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Últimas coleções ───────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <SectionLabel>Últimas Coleções</SectionLabel>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[1, 2, 3, 4].map(i => (
              <Box key={i}>
                <Skeleton variant="rectangular" sx={{ borderRadius: 2, aspectRatio: '1', width: '100%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" sx={{ mt: 0.75, width: '70%', bgcolor: 'rgba(255,255,255,0.04)' }} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {collections.map((col, i) => (
              <Box key={col.id} sx={{ animationDelay: `${i * 50}ms` }}>
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: 'rgba(197,162,90,0.2)',
                    },
                  }}
                >
                  <CardActionArea>
                    <Box sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', bgcolor: '#1C1915' }}>
                      <img
                        src={col.cover_image}
                        alt={col.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.88 }}
                      />
                      {col.content_type && col.content_type !== 'mix' && (
                        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                          <Box sx={{ px: 1, py: 0.3, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, backdropFilter: 'blur(8px)' }}>
                            <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(226,212,186,0.85)' }}>
                              {CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardActionArea>
                </Box>
                <Typography
                  sx={{
                    mt: 0.875,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#C4B49A',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Explore pelos países ────────────────────────────────── */}
      <Box sx={{ pb: 5 }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 3 }}>
          <SectionLabel>Explore pelos Países</SectionLabel>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={200} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />)}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {countries.map(country => (
              <CardActionArea key={country.id} component={Link} to={`/country/${country.id}`}>
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  <img
                    src={country.image_url}
                    alt={country.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.75 }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.08) 100%)' }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5 }}>
                    <Typography
                      sx={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: '#E2D4BA',
                        lineHeight: 1,
                        mb: 0.4,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {country.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: '0.73rem',
                        color: 'rgba(226,212,186,0.5)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'} · {country.collectionCount} {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                    </Typography>
                    {user && (
                      <Box sx={{ mt: 1.5, position: 'relative', height: 2, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', background: 'linear-gradient(to right, #8B1A36, #C5A25A)', borderRadius: 99 }} />
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
