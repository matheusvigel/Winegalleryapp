import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { getStats, getProgress } from '../utils/storage';
import { getAllRegions } from '../data/wineData';
import { Trophy, CheckCircle, Heart, Wine, LogOut, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(getStats());
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    setStats(getStats());
    setProgress(getProgress());
    const handleStorage = () => { setStats(getStats()); setProgress(getProgress()); };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('statsUpdated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('statsUpdated', handleStorage);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const allRegions = getAllRegions();
  const allItems = allRegions.flatMap(region => region.collections.flatMap(c => c.items));

  const completedItems = progress
    .filter(p => p.status === 'completed')
    .map(p => allItems.find(e => e.id === p.itemId))
    .filter(Boolean);

  const wishlistItems = progress
    .filter(p => p.status === 'wishlist')
    .map(p => allItems.find(e => e.id === p.itemId))
    .filter(Boolean);

  const levelProgress = stats.totalPoints % 100;
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Sommelier';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0907', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #1A1410 0%, #0B0907 100%)',
        borderBottom: '1px solid rgba(197,162,90,0.1)',
        paddingTop: 24,
        paddingBottom: 28,
        paddingLeft: 20,
        paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'DM Sans'",
              fontSize: '0.8rem',
              color: '#8C8074',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'DM Sans'",
              fontSize: '0.8rem',
              color: '#574E47',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
              padding: 0,
            }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '1px solid rgba(197,162,90,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1C1915',
            flexShrink: 0,
            fontSize: '1.5rem',
          }}>
            🍷
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#E2D4BA',
              lineHeight: 1.2,
            }}>
              {displayName}
            </h1>
            <p style={{ margin: '3px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: '#C5A25A', letterSpacing: '0.06em' }}>
              Nível {stats.level} Sommelier
            </p>
            {user?.email && (
              <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.65rem', color: '#574E47' }}>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats card ───────────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginTop: -1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundColor: '#141210',
            borderRadius: 12,
            padding: '20px 20px',
            border: '1px solid rgba(197,162,90,0.14)',
            marginBottom: 20,
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} color="#C5A25A" />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8C8074' }}>
                Progresso
              </span>
            </div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#C5A25A', lineHeight: 1 }}>
              {stats.totalPoints}
            </span>
          </div>

          {/* Level + bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: '#8C8074' }}>Nível {stats.level}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: '#574E47' }}>{levelProgress}/100 pts</span>
            </div>
            <div style={{ position: 'relative', height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${levelProgress}%`,
                background: 'linear-gradient(to right, #8B1A36, #C5A25A)',
                borderRadius: 99,
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ textAlign: 'center', padding: '12px 0', backgroundColor: '#1C1915', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#6B8F71', lineHeight: 1 }}>
                {stats.completedCount}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: '#574E47', marginTop: 4, letterSpacing: '0.04em' }}>
                Vividas
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0', backgroundColor: '#1C1915', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#8B1A36', lineHeight: 1 }}>
                {stats.wishlistCount}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: '#574E47', marginTop: 4, letterSpacing: '0.04em' }}>
                Desejos
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Completed items ───────────────────────────────────── */}
      {completedItems.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={14} color="#6B8F71" />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.95rem', fontWeight: 500, color: '#E2D4BA' }}>
              Experiências Vividas
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.3 }}
                style={{
                  backgroundColor: '#141210',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, opacity: 0.9 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 500, color: '#C4B49A', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.68rem', color: '#574E47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.description}
                  </p>
                </div>
                <CheckCircle size={16} color="#6B8F71" style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wishlist items ────────────────────────────────────── */}
      {wishlistItems.length > 0 && (
        <div style={{ padding: '0 20px', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Heart size={14} color="#8B1A36" />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.95rem', fontWeight: 500, color: '#E2D4BA' }}>
              Lista de Desejos
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.3 }}
                style={{
                  backgroundColor: '#141210',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, opacity: 0.9 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 500, color: '#C4B49A', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.68rem', color: '#574E47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.description}
                  </p>
                </div>
                <Heart size={14} color="#8B1A36" fill="#8B1A36" style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {completedItems.length === 0 && wishlistItems.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Wine size={36} color="#2A2218" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.05rem', fontWeight: 500, color: '#574E47' }}>
            Comece sua jornada
          </h3>
          <p style={{ margin: '0 0 20px', fontFamily: "'DM Sans'", fontSize: '0.8rem', color: '#3D3530' }}>
            Explore as regiões e marque suas experiências
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              backgroundColor: 'rgba(197,162,90,0.12)',
              border: '1px solid rgba(197,162,90,0.25)',
              borderRadius: 99,
              fontFamily: "'DM Sans'",
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#C5A25A',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Explorar Regiões
          </Link>
        </div>
      )}
    </div>
  );
}
