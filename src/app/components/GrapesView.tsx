import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Grape = { id: string; name: string; description: string; image_url: string; type: 'red' | 'white'; characteristics: string };

function GrapeSection({ grapes, title, accentColor, delayOffset = 0 }: { grapes: Grape[]; title: string; accentColor: string; delayOffset?: number }) {
  if (grapes.length === 0) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{
          width: 4,
          height: 16,
          backgroundColor: accentColor,
          borderRadius: 2,
          flexShrink: 0,
          opacity: 0.8,
        }} />
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1rem',
          fontWeight: 600,
          color: '#E2D4BA',
        }}>
          {title}
        </span>
        <span style={{
          marginLeft: 4,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: accentColor,
          backgroundColor: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          borderRadius: 99,
          padding: '2px 8px',
        }}>
          {grapes.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {grapes.map((grape, index) => (
          <motion.div
            key={grape.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (delayOffset + index) * 0.05, duration: 0.3 }}
          >
            <Link to={`/grape/${grape.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                backgroundColor: '#141210',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}30`}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                {/* Image */}
                <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                  <img
                    src={grape.image_url}
                    alt={grape.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.80 }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #141210)' }} />
                </div>
                {/* Content */}
                <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#E2D4BA',
                    lineHeight: 1.2,
                    marginBottom: 3,
                  }}>
                    {grape.name}
                  </h3>
                  {grape.description && (
                    <p style={{
                      margin: 0,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '0.72rem',
                      color: '#8C8074',
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
                  <ChevronRight size={15} color="#574E47" />
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

  const redGrapes = all.filter(g => g.type === 'red');
  const whiteGrapes = all.filter(g => g.type === 'white');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0907' }}>
      <div style={{ padding: '24px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ backgroundColor: '#141210', borderRadius: 10, height: 80, border: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : (
          <>
            <GrapeSection grapes={redGrapes} title="Uvas Tintas" accentColor="#8B1A36" delayOffset={0} />
            <GrapeSection grapes={whiteGrapes} title="Uvas Brancas" accentColor="#C5A25A" delayOffset={redGrapes.length} />
          </>
        )}
      </div>
    </div>
  );
}
