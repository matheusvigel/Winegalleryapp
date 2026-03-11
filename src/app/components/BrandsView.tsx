import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Brand = { id: string; name: string; description: string; image_url: string; country: string; region: string | null };

export default function BrandsView() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('brands').select('id, name, description, image_url, country, region').order('name')
      .then(({ data }) => { setBrands(data ?? []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0907' }}>
      <div style={{ padding: '20px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ backgroundColor: '#141210', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ height: 140, backgroundColor: '#1C1915' }} />
                <div style={{ padding: '14px 16px', height: 52, backgroundColor: '#141210' }} />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.85rem', color: '#574E47' }}>
            Nenhuma vinícola cadastrada.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
              >
                <Link to={`/brand/${brand.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    backgroundColor: '#141210',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(197,162,90,0.2)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}>
                    <div style={{ position: 'relative', height: 140 }}>
                      <img
                        src={brand.image_url}
                        alt={brand.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.80 }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px' }}>
                        <h3 style={{
                          margin: 0,
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          color: '#E2D4BA',
                          lineHeight: 1.2,
                        }}>
                          {brand.name}
                        </h3>
                        {brand.description && (
                          <p style={{
                            margin: '3px 0 0',
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            fontSize: '0.72rem',
                            color: 'rgba(226,212,186,0.5)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {brand.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.8rem', fontWeight: 500, color: '#8C8074' }}>
                          {brand.country}
                        </p>
                        {brand.region && (
                          <p style={{ margin: '1px 0 0', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.7rem', color: '#574E47' }}>
                            {brand.region}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} color="#574E47" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
