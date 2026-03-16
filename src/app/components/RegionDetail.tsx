import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ItemCard } from './ItemCard';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { Collection, WineItem } from '../types';
import { getProgress } from '../utils/storage';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE  = '#690037';
const VERDE = '#2D3A3A';
const UVA   = '#400264';
const LARANJA = '#F1BD85';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  essential: { label: 'Essencial',      color: VERDE, bg: `${VERDE}14`, border: `${VERDE}28` },
  escape:    { label: 'Fugir do Óbvio', color: UVA,   bg: `${UVA}14`,  border: `${UVA}28`  },
  icon:      { label: 'Ícone',          color: WINE,  bg: `${WINE}12`, border: `${WINE}28` },
};

type SubRegion = { id: string; name: string; image_url: string; description: string };

export default function RegionDetail() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const [regionName, setRegionName] = useState('');
  const [countryName, setCountryName] = useState<string | undefined>(undefined);
  const [countryId, setCountryId] = useState<string | undefined>(undefined);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [subRegions, setSubRegions] = useState<SubRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    const handleUpdate = () => setProgress(getProgress());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('statsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('statsUpdated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!regionId) return;
    setLoading(true);
    setAllCollections([]);
    setSubRegions([]);
    setRegionName('');
    setCountryName(undefined);
    setCountryId(undefined);

    const load = async () => {
      const [{ data: region }, { data: subs }] = await Promise.all([
        supabase.from('regions').select('id, name, country_id, image_url').eq('id', regionId).single(),
        supabase.from('regions').select('id, name, image_url, description').eq('parent_id', regionId).order('name'),
      ]);

      if (!region) { setLoading(false); return; }
      setRegionName(region.name);
      setCountryId(region.country_id);
      setSubRegions(subs ?? []);

      const { data: country } = await supabase
        .from('countries').select('name').eq('id', region.country_id).single();
      if (country) setCountryName(country.name);

      const { data: rcLinks } = await supabase
        .from('region_collections').select('collection_id').eq('region_id', regionId);
      const collectionIds = (rcLinks ?? []).map(r => r.collection_id);

      if (collectionIds.length === 0) { setLoading(false); return; }

      const { data: cols } = await supabase.from('collections').select('*').in('id', collectionIds);

      const { data: ciLinks } = await supabase
        .from('collection_items').select('collection_id, item_id').in('collection_id', collectionIds);
      const itemIds = [...new Set((ciLinks ?? []).map(ci => ci.item_id))];

      let itemMap: Record<string, WineItem> = {};
      if (itemIds.length > 0) {
        const { data: wines } = await supabase
          .from('wine_items').select('*, brands(name)').in('id', itemIds);
        for (const w of wines ?? []) {
          const brand = w.brands as { name: string } | null;
          itemMap[w.id] = {
            id: w.id, name: w.name, description: w.description,
            type: w.type, imageUrl: w.image_url, points: w.points, level: w.level,
            wineType: w.wine_type, elaborationMethod: w.elaboration_method,
            brandName: brand?.name ?? null,
          };
        }
      }

      const colItemsMap: Record<string, WineItem[]> = {};
      for (const ci of ciLinks ?? []) {
        if (!colItemsMap[ci.collection_id]) colItemsMap[ci.collection_id] = [];
        if (itemMap[ci.item_id]) colItemsMap[ci.collection_id].push(itemMap[ci.item_id]);
      }

      const built: Collection[] = (cols ?? []).map(c => ({
        id: c.id, title: c.title, description: c.description,
        level: c.level, coverImage: c.cover_image, totalPoints: c.total_points,
        items: colItemsMap[c.id] ?? [],
      }));

      setAllCollections(built);
      setLoading(false);
    };
    load();
  }, [regionId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>Carregando...</p>
      </div>
    );
  }

  if (!regionName) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>Região não encontrada</p>
      </div>
    );
  }

  const hasCollections = allCollections.length > 0;
  const hasSubRegions = subRegions.length > 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>

      {/* ── Sticky header ────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: CARD,
        borderBottom: `1px solid ${BORDER}`,
        padding: '48px 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: SURF, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          >
            <ArrowLeft size={17} color={TEXT2} />
          </motion.button>
          <div style={{ minWidth: 0 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 1 }}>
              <Link to="/regions" style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: WINE, fontWeight: 500, textDecoration: 'none' }}>Regiões</Link>
              {countryName && countryId && (
                <>
                  <ChevronRight size={10} color={MUTED} style={{ flexShrink: 0 }} />
                  <Link to={`/country/${countryId}`} style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: WINE, fontWeight: 500, textDecoration: 'none' }}>{countryName}</Link>
                </>
              )}
              <ChevronRight size={10} color={MUTED} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: TEXT2, fontWeight: 500 }}>{regionName}</span>
            </div>
            <h1 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.15rem', color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {regionName}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Collections ──────────────────────────────────────── */}
      {hasCollections && allCollections.map((collection) => {
        const cfg = LEVEL_CONFIG[collection.level] ?? LEVEL_CONFIG.essential;
        const completedItems = collection.items.filter(item =>
          progress.find(p => p.itemId === item.id && p.status === 'completed')
        );
        const completedCount = completedItems.length;
        const totalItems = collection.items.length;
        const pct = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
        const ptsEarned = completedItems.reduce((sum, item) => sum + item.points, 0);

        return (
          <div key={collection.id} style={{ marginBottom: 8 }}>
            {/* Cover image with overlay */}
            <div style={{ position: 'relative', height: 200, overflow: 'hidden', backgroundColor: SURF }}>
              <img
                src={collection.coverImage}
                alt={collection.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.30) 60%, transparent 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
                {/* Level badge */}
                <span style={{
                  display: 'inline-block',
                  marginBottom: 6,
                  padding: '3px 10px',
                  fontFamily: "'DM Sans'",
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: cfg.color,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 99,
                }}>
                  {cfg.label}
                </span>
                <h2 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.25 }}>
                  {collection.title}
                </h2>
                {collection.description && (
                  <p style={{ margin: '3px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {collection.description}
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar + meta */}
            <div style={{ backgroundColor: CARD, borderBottom: `1px solid ${BORDER}`, padding: '10px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', color: MUTED }}>
                  {completedCount} de {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </span>
                <span style={{ fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 600, color: '#A0621A' }}>
                  {ptsEarned} / {collection.totalPoints} pts
                </span>
              </div>
              <div style={{ position: 'relative', height: 3, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: cfg.color, borderRadius: 99 }}
                />
              </div>
            </div>

            {/* Cards carousel */}
            <div style={{ backgroundColor: BG, paddingTop: 12, paddingBottom: 16 }}>
              {collection.items.length > 0 ? (
                <div style={{
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  paddingLeft: 16,
                  paddingRight: 16,
                  scrollbarWidth: 'none',
                }}>
                  {collection.items.map(item => (
                    <div key={item.id} style={{ flexShrink: 0, width: 200 }}>
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ margin: '0 16px', backgroundColor: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Layers size={24} color={MUTED} />
                  <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED }}>Nenhum item ainda</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Sub-regiões ───────────────────────────────────────── */}
      {hasSubRegions && (
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: MUTED }}>
            Sub-regiões de {regionName}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subRegions.map((sr, i) => (
              <motion.div
                key={sr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <Link to={`/region/${sr.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ backgroundColor: CARD, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                    <div style={{ position: 'relative', height: 148, backgroundColor: SURF }}>
                      <img src={sr.image_url} alt={sr.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px' }}>
                        <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.2 }}>{sr.name}</h3>
                        {sr.description && (
                          <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>
                            {sr.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '10px 16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE, fontWeight: 500 }}>Ver coleções</span>
                        <ChevronRight size={15} color={WINE} />
                      </div>
                      <div style={{ position: 'relative', height: 3, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', backgroundColor: LARANJA, borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!hasCollections && !hasSubRegions && (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <Layers size={40} color={MUTED} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontFamily: "'DM Sans'", fontSize: '0.875rem', color: MUTED }}>Nenhuma coleção cadastrada ainda.</p>
        </div>
      )}
    </div>
  );
}
