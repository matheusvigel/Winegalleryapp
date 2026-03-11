import { Collection } from '../types';
import { motion } from 'motion/react';

const CARD   = '#FFFFFF';
const SURF   = '#F5F0E8';
const VERDE  = '#2D3A3A';
const UVA    = '#400264';
const WINE   = '#690037';
const TEXT1  = '#1C1B1F';
const TEXT2  = '#5C5C5C';
const MUTED  = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

interface CollectionHeaderProps {
  collection: Collection;
  completedCount: number;
}

export function CollectionHeader({ collection, completedCount }: CollectionHeaderProps) {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'essential': return { label: 'Essencial',     color: VERDE, bg: `${VERDE}14`, border: `${VERDE}28` };
      case 'escape':    return { label: 'Fugir do Óbvio', color: UVA,   bg: `${UVA}14`,  border: `${UVA}28`  };
      case 'icon':      return { label: 'Ícone',          color: WINE,  bg: `${WINE}12`, border: `${WINE}28` };
      default:          return { label: level,            color: MUTED, bg: 'rgba(0,0,0,0.06)', border: BORDER };
    }
  };

  const levelCfg = getLevelConfig(collection.level);
  const totalItems = collection.items.length;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const pointsEarned = collection.items
    .slice(0, completedCount)
    .reduce((sum, item) => sum + item.points, 0);

  return (
    <div style={{ position: 'relative', height: 260, marginBottom: 24, overflow: 'hidden' }}>
      <img
        src={collection.coverImage}
        alt={collection.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.10) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
        {/* Level badge */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: levelCfg.color,
            backgroundColor: levelCfg.bg,
            border: `1px solid ${levelCfg.border}`,
            borderRadius: 99,
          }}>
            {levelCfg.label}
          </span>
        </div>

        <h2 style={{
          margin: '0 0 4px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>
          {collection.title}
        </h2>

        {collection.description && (
          <p style={{
            margin: '0 0 12px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {collection.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
            {collection.items.length} {collection.items.length === 1 ? 'item' : 'itens'}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
            {collection.totalPoints} pontos
          </span>
        </div>

        {/* Progress */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
          borderRadius: 8,
          padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)' }}>
              {completedCount} de {totalItems} completados
            </span>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 500, color: levelCfg.color }}>
              {pointsEarned} pts
            </span>
          </div>
          <div style={{ position: 'relative', height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: levelCfg.color, borderRadius: 99 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
