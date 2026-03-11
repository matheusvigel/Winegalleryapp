import { Collection } from '../types';
import { motion } from 'motion/react';

interface CollectionHeaderProps {
  collection: Collection;
  completedCount: number;
}

export function CollectionHeader({ collection, completedCount }: CollectionHeaderProps) {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'essential': return { label: 'Essencial', color: '#6B8F71', bg: 'rgba(107,143,113,0.15)', border: 'rgba(107,143,113,0.3)' };
      case 'escape':    return { label: 'Fugir do Óbvio', color: '#4A7BA7', bg: 'rgba(74,123,167,0.15)', border: 'rgba(74,123,167,0.3)' };
      case 'icon':      return { label: 'Ícone', color: '#C5A25A', bg: 'rgba(197,162,90,0.15)', border: 'rgba(197,162,90,0.3)' };
      default:          return { label: level, color: '#8C8074', bg: 'rgba(140,128,116,0.15)', border: 'rgba(140,128,116,0.3)' };
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
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.65 }}
      />
      {/* Deep gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
        {/* Level badge */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.6rem',
            fontWeight: 500,
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
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.3rem',
          fontWeight: 600,
          color: '#E2D4BA',
          lineHeight: 1.25,
        }}>
          {collection.title}
        </h2>

        {collection.description && (
          <p style={{
            margin: '0 0 12px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.75rem',
            color: 'rgba(226,212,186,0.5)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(226,212,186,0.4)', letterSpacing: '0.04em' }}>
            {collection.items.length} {collection.items.length === 1 ? 'item' : 'itens'}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(226,212,186,0.2)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(226,212,186,0.4)', letterSpacing: '0.04em' }}>
            {collection.totalPoints} pontos
          </span>
        </div>

        {/* Progress */}
        <div style={{
          backgroundColor: 'rgba(11,9,7,0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: 8,
          padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(226,212,186,0.6)' }}>
              {completedCount} de {totalItems} completados
            </span>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 500, color: '#C5A25A' }}>
              {pointsEarned} pts
            </span>
          </div>
          <div style={{ position: 'relative', height: 2, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'linear-gradient(to right, #8B1A36, #C5A25A)', borderRadius: 99 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
