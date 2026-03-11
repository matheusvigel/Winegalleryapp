import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { getStats, getProgress } from '../utils/storage';
import { getAllRegions } from '../data/wineData';
import { Trophy, CheckCircle, Heart, Wine, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE_C = '#690037';
const VERDE = '#2D3A3A';
const LARANJA = '#F1BD85';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

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
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        backgroundColor: CARD,
        borderBottom: `1px solid ${BORDER}`,
        paddingTop: 24,
        paddingBottom: 28,
        paddingLeft: 20,
        paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'DM Sans'",
              fontSize: '0.8rem',
              color: MUTED,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.2s',
            }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `2px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: SURF,
            flexShrink: 0,
            fontSize: '1.4rem',
          }}>
            🍷
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: "'DM Sans'",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: TEXT1,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              {displayName}
            </h1>
            <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: WINE_C, fontWeight: 500 }}>
              Nível {stats.level} Sommelier
            </p>
            {user?.email && (
              <p style={{ margin: '1px 0 0', fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED }}>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats card ───────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundColor: CARD,
            borderRadius: 14,
            padding: '20px',
            border: `1px solid ${BORDER}`,
            marginBottom: 16,
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={15} color={LARANJA} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Progresso
              </span>
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '1.5rem', fontWeight: 700, color: TEXT1, lineHeight: 1 }}>
              {stats.totalPoints} <span style={{ fontSize: '0.65rem', fontWeight: 500, color: MUTED }}>pts</span>
            </span>
          </div>

          {/* Level + bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: TEXT2 }}>Nível {stats.level}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: MUTED }}>{levelProgress}/100 pts</span>
            </div>
            <div style={{ position: 'relative', height: 4, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${levelProgress}%`,
                backgroundColor: VERDE,
                borderRadius: 99,
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            paddingTop: 16,
            borderTop: `1px solid ${BORDER}`,
          }}>
            <div style={{ textAlign: 'center', padding: '14px 0', backgroundColor: SURF, borderRadius: 10, border: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '1.75rem', fontWeight: 700, color: VERDE, lineHeight: 1 }}>
                {stats.completedCount}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED, marginTop: 4, letterSpacing: '0.04em' }}>
                Vividas
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px 0', backgroundColor: SURF, borderRadius: 10, border: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '1.75rem', fontWeight: 700, color: WINE_C, lineHeight: 1 }}>
                {stats.wishlistCount}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED, marginTop: 4, letterSpacing: '0.04em' }}>
                Desejos
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Completed items ───────────────────────────────────── */}
      {completedItems.length > 0 && (
        <div style={{ padding: '4px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle size={14} color={VERDE} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', fontWeight: 600, color: TEXT1 }}>
              Experiências Vividas
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                style={{
                  backgroundColor: CARD,
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, backgroundColor: SURF }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 600, color: TEXT1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.68rem', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.description}
                  </p>
                </div>
                <CheckCircle size={16} color={VERDE} style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wishlist items ────────────────────────────────────── */}
      {wishlistItems.length > 0 && (
        <div style={{ padding: '4px 20px', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Heart size={14} color={WINE_C} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', fontWeight: 600, color: TEXT1 }}>
              Lista de Desejos
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item?.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                style={{
                  backgroundColor: CARD,
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <img
                  src={item?.imageUrl}
                  alt={item?.name}
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, backgroundColor: SURF }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 600, color: TEXT1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.68rem', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item?.description}
                  </p>
                </div>
                <Heart size={14} color={WINE_C} fill={WINE_C} style={{ flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {completedItems.length === 0 && wishlistItems.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Wine size={36} color={MUTED} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px', fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 600, color: TEXT1 }}>
            Comece sua jornada
          </h3>
          <p style={{ margin: '0 0 20px', fontFamily: "'DM Sans'", fontSize: '0.8rem', color: TEXT2 }}>
            Explore as regiões e marque suas experiências
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              backgroundColor: WINE_C,
              borderRadius: 99,
              fontFamily: "'DM Sans'",
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            Explorar Regiões
          </Link>
        </div>
      )}
    </div>
  );
}
