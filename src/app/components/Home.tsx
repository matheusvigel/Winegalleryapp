import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/storage';
import { supabase } from '../../lib/supabase';

const BG     = '#E9E3D9';
const CARD   = '#FFFFFF';
const SURF   = '#F5F0E8';
const WINE   = '#690037';
const VERDE  = '#2D3A3A';
const LARANJA = '#F1BD85';
const TEXT1  = '#1C1B1F';
const TEXT2  = '#5C5C5C';
const MUTED  = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

type Highlight = { id: string; type: string; entity_id: string; label: string; image_url: string; route: string };
type Country = { id: string; name: string; image_url: string; regionCount: number; collectionCount: number };

const HL_LABELS: Record<string, string> = { collection: 'Coleção', country: 'País', region: 'Região', brand: 'Vinícola' };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontFamily: "'DM Sans'",
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: MUTED,
      mb: 1.75,
    }}>
      {children}
    </Typography>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(getStats());
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = () => setStats(getStats());
    window.addEventListener('statsUpdated', h);
    return () => window.removeEventListener('statsUpdated', h);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: cts }, { data: regionRows }, { data: rcLinks }, { data: hls }] = await Promise.all([
        supabase.from('countries').select('id, name, image_url').order('name'),
        supabase.from('regions').select('id, country_id, name, image_url'),
        supabase.from('region_collections').select('region_id, collection_id'),
        supabase.from('highlights').select('id, type, entity_id, label').eq('active', true).order('position'),
      ]);

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
        if (cid) { if (!collectionCountMap[cid]) collectionCountMap[cid] = new Set(); collectionCountMap[cid].add(rc.collection_id); }
      }
      const countryById: Record<string, { name: string; image_url: string }> = {};
      for (const c of cts ?? []) countryById[c.id] = { name: c.name, image_url: c.image_url };
      setCountries((cts ?? []).map(c => ({ ...c, regionCount: regionCountMap[c.id] ?? 0, collectionCount: collectionCountMap[c.id]?.size ?? 0 })));

      const hlList = hls ?? [];
      const colIds = hlList.filter(h => h.type === 'collection').map(h => h.entity_id);
      const brandIds = hlList.filter(h => h.type === 'brand').map(h => h.entity_id);
      const [{ data: hlCols }, { data: hlBrands }] = await Promise.all([
        colIds.length > 0 ? supabase.from('collections').select('id, title, cover_image').in('id', colIds) : Promise.resolve({ data: [] as { id: string; title: string; cover_image: string }[] }),
        brandIds.length > 0 ? supabase.from('brands').select('id, name, image_url').in('id', brandIds) : Promise.resolve({ data: [] as { id: string; name: string; image_url: string }[] }),
      ]);
      const cById: Record<string, { name: string; image_url: string }> = {};
      for (const c of hlCols ?? []) cById[c.id] = { name: c.title, image_url: c.cover_image };
      const bById: Record<string, { name: string; image_url: string }> = {};
      for (const b of hlBrands ?? []) bById[b.id] = { name: b.name, image_url: b.image_url };

      setHighlights(hlList.map(h => {
        let entity: { name: string; image_url: string } | undefined;
        let route = '/';
        if (h.type === 'country') { entity = countryById[h.entity_id]; route = `/country/${h.entity_id}`; }
        else if (h.type === 'region') { entity = regionById[h.entity_id]; route = `/region/${h.entity_id}`; }
        else if (h.type === 'collection') { entity = cById[h.entity_id]; const rid = collectionToRegion[h.entity_id]; route = rid ? `/region/${rid}#collection-${h.entity_id}` : '/'; }
        else if (h.type === 'brand') { entity = bById[h.entity_id]; route = `/brand/${h.entity_id}`; }
        return { id: h.id, type: h.type, entity_id: h.entity_id, label: entity?.name || h.label?.trim() || h.entity_id, image_url: entity?.image_url ?? '', route };
      }));
      setLoading(false);
    };
    load();
  }, []);

  const pointsInLevel = stats.totalPoints % 100;

  return (
    <Box sx={{ bgcolor: BG, minHeight: '100vh' }}>

      {/* ── Sua Jornada / CTA ─────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        {user ? (
          /* Logged in: journey card → clickable → profile */
          <Box
            component={Link}
            to="/profile"
            sx={{
              display: 'block',
              textDecoration: 'none',
              bgcolor: CARD,
              borderRadius: 2.5,
              border: `1px solid ${BORDER}`,
              px: 2.5,
              py: 2,
              transition: 'box-shadow 0.2s ease',
              '&:hover': { boxShadow: '0 4px 18px rgba(0,0,0,0.09)' },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, mb: 0.25 }}>
                  Sua Jornada
                </Typography>
                <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 600, color: TEXT1 }}>
                  Nível <strong style={{ color: WINE }}>{stats.level}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '1.5rem', fontWeight: 700, color: TEXT1, lineHeight: 1 }}>
                    {stats.totalPoints}
                  </Typography>
                  <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.6rem', color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    pontos
                  </Typography>
                </Box>
                <ChevronRight size={16} color={MUTED} />
              </Box>
            </Box>
            <Box sx={{ position: 'relative', height: 5, borderRadius: 99, bgcolor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pointsInLevel}%`, bgcolor: VERDE, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.62rem', color: MUTED }}>{pointsInLevel} / 100 pts</Typography>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.62rem', color: MUTED }}>Próx. nível</Typography>
            </Box>
          </Box>
        ) : (
          /* Guest: CTA card */
          <Box sx={{ bgcolor: CARD, borderRadius: 2.5, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <CardActionArea component={Link} to="/register" sx={{ px: 2.5, py: 2.5 }}>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 700, color: TEXT1, mb: 0.5 }}>
                Comece sua jornada vinícola
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', color: TEXT2, mb: 2 }}>
                Crie sua conta e acumule pontos explorando vinhos do mundo
              </Typography>
              <Box sx={{ display: 'inline-flex', px: 2, py: 0.875, bgcolor: WINE, borderRadius: 6 }}>
                <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', fontWeight: 500, color: '#fff' }}>
                  Criar conta gratuita
                </Typography>
              </Box>
            </CardActionArea>
          </Box>
        )}
      </Box>

      {/* ── Destaques ─────────────────────────────────────────── */}
      {(loading || highlights.length > 0) && (
        <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
          <SectionTitle>Destaques</SectionTitle>
          {loading ? (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[1,2,3].map(i => (
                <Skeleton key={i} variant="rectangular" sx={{ minWidth: 160, height: 210, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.07)' }} />
              ))}
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}>
              {highlights.map(h => (
                <Box
                  key={h.id}
                  component={Link}
                  to={h.route}
                  sx={{
                    minWidth: 155,
                    maxWidth: 155,
                    flexShrink: 0,
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    border: `1px solid ${BORDER}`,
                    bgcolor: CARD,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box sx={{ position: 'relative', height: 195, bgcolor: SURF }}>
                    {h.image_url && (
                      <img src={h.image_url} alt={h.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <Box sx={{ px: 1, py: 0.35, bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 1 }}>
                        <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT2 }}>
                          {HL_LABELS[h.type] ?? h.type}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1.5 }}>
                      <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {h.label}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Navegue pelas regiões e países ────────────────────── */}
      <Box sx={{ px: 2.5, pt: 3, pb: 4 }}>
        <SectionTitle>Navegue pelas regiões e países</SectionTitle>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {[1,2,3].map(i => (
              <Box key={i} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${BORDER}`, bgcolor: CARD }}>
                <Skeleton variant="rectangular" height={148} sx={{ bgcolor: 'rgba(0,0,0,0.07)' }} />
                <Box sx={{ p: 1.5 }}>
                  <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} />
                  <Skeleton variant="rectangular" height={3} sx={{ borderRadius: 99, mt: 1, bgcolor: 'rgba(0,0,0,0.05)' }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {countries.map((country, i) => (
              <Box
                key={country.id}
                component={Link}
                to={`/country/${country.id}`}
                sx={{
                  display: 'block',
                  textDecoration: 'none',
                  bgcolor: CARD,
                  borderRadius: 1.75,
                  overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: '0 4px 18px rgba(0,0,0,0.10)' },
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative', height: 148, bgcolor: SURF }}>
                  <img src={country.image_url} alt={country.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
                    <Typography sx={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                      {country.name}
                    </Typography>
                    <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                      {country.regionCount} {country.regionCount === 1 ? 'região' : 'regiões'} · {country.collectionCount} {country.collectionCount === 1 ? 'coleção' : 'coleções'}
                    </Typography>
                  </Box>
                </Box>
                {/* Footer: "Ver regiões" + progress bar */}
                <Box sx={{ px: 2, pt: 1.25, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE, fontWeight: 500 }}>
                      Ver regiões
                    </Typography>
                    <ChevronRight size={15} color={WINE} />
                  </Box>
                  <Box sx={{ position: 'relative', height: 3, borderRadius: 99, bgcolor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', bgcolor: LARANJA, borderRadius: 99 }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
