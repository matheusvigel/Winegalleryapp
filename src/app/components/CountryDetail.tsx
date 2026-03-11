import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE  = '#690037';
const VERDE = '#2D3A3A';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

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
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>Carregando...</p>
      </div>
    );
  }

  if (!country) return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>País não encontrado</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: CARD,
        borderBottom: `1px solid ${BORDER}`,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 48,
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: SURF,
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={17} color={TEXT2} />
          </motion.button>
          <div style={{ minWidth: 0 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
              <Link to="/regions" style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', color: WINE, fontWeight: 500, textDecoration: 'none' }}>
                Regiões
              </Link>
              <ChevronRight size={10} color={MUTED} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', color: TEXT2, fontWeight: 500 }}>{country.name}</span>
            </div>
            <h1 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.2rem', color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {country.name}
            </h1>
          </div>
        </div>
        {country.description && (
          <p style={{ margin: '8px 0 0 48px', fontFamily: "'DM Sans'", fontSize: '0.8rem', color: TEXT2, lineHeight: 1.5 }}>
            {country.description}
          </p>
        )}
      </div>

      <div style={{ padding: '16px 16px 24px' }}>
        {/* ── Collections ─────────────────────────────────────── */}
        {collections.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
              Coleções de {country.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {collections.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <div style={{
                    backgroundColor: CARD,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', backgroundColor: SURF }}>
                      <img
                        src={col.cover_image}
                        alt={col.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {col.content_type && col.content_type !== 'mix' && (
                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <span style={{
                            fontFamily: "'DM Sans'",
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            padding: '2px 7px',
                            borderRadius: 99,
                          }}>
                            {CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type}
                          </span>
                        </div>
                      )}
                    </div>
                    <p style={{ margin: 0, padding: '8px 10px', fontFamily: "'DM Sans'", fontSize: '0.78rem', fontWeight: 500, color: TEXT1, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {col.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Regions ─────────────────────────────────────────── */}
        {regions.length > 0 && (
          <div>
            <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
              Regiões de {country.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regions.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <Link to={`/region/${region.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      backgroundColor: CARD,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: `1px solid ${BORDER}`,
                      transition: 'box-shadow 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                    >
                      <div style={{ position: 'relative', height: 140, backgroundColor: SURF }}>
                        <img
                          src={region.image_url}
                          alt={region.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          draggable={false}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px' }}>
                          <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.1rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                            {region.name}
                          </h3>
                          {region.description && (
                            <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {region.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE, fontWeight: 500 }}>Ver coleções</span>
                        <ChevronRight size={16} color={WINE} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {collections.length === 0 && regions.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>Nenhum conteúdo cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
