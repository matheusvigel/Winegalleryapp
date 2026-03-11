import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE  = '#690037';
const VERDE = '#2D3A3A';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

type Grape = { id: string; name: string; description: string; image_url: string; type: 'red' | 'white'; characteristics: string };

function GrapeSection({ grapes, title, accentColor, delayOffset = 0 }: { grapes: Grape[]; title: string; accentColor: string; delayOffset?: number }) {
  if (grapes.length === 0) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{
          width: 4,
          height: 16,
          backgroundColor: accentColor,
          borderRadius: 2,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.82rem',
          fontWeight: 700,
          color: TEXT1,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </span>
        <span style={{
          marginLeft: 4,
          fontFamily: "'DM Sans'",
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
          color: accentColor,
          backgroundColor: `${accentColor}14`,
          border: `1px solid ${accentColor}28`,
          borderRadius: 99,
          padding: '2px 8px',
        }}>
          {grapes.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {grapes.map((grape, index) => (
          <motion.div
            key={grape.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (delayOffset + index) * 0.04, duration: 0.3 }}
          >
            <Link to={`/grape/${grape.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                backgroundColor: CARD,
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
              >
                {/* Image */}
                <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0, backgroundColor: SURF }}>
                  <img
                    src={grape.image_url}
                    alt={grape.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                {/* Content */}
                <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontFamily: "'DM Sans'",
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: TEXT1,
                    lineHeight: 1.25,
                    marginBottom: 3,
                  }}>
                    {grape.name}
                  </h3>
                  {grape.description && (
                    <p style={{
                      margin: 0,
                      fontFamily: "'DM Sans'",
                      fontSize: '0.72rem',
                      color: TEXT2,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {grape.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
                  <ChevronRight size={15} color={MUTED} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function GrapesView() {
  const [all, setAll] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('grapes').select('id, name, description, image_url, type, characteristics').order('name')
      .then(({ data }) => { setAll(data ?? []); setLoading(false); });
  }, []);

  const redGrapes   = all.filter(g => g.type === 'red');
  const whiteGrapes = all.filter(g => g.type === 'white');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>
      <div style={{ padding: '24px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ backgroundColor: CARD, borderRadius: 12, height: 76, border: `1px solid ${BORDER}` }} />
            ))}
          </div>
        ) : (
          <>
            <GrapeSection grapes={redGrapes}   title="Uvas Tintas"  accentColor={WINE}  delayOffset={0} />
            <GrapeSection grapes={whiteGrapes} title="Uvas Brancas" accentColor={VERDE} delayOffset={redGrapes.length} />
          </>
        )}
      </div>
    </div>
  );
}
