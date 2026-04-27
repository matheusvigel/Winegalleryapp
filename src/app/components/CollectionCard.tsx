import { Link } from 'react-router';
import { ChevronRight, MapPin } from 'lucide-react';

export interface CollectionCardProps {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  contentType?: string;
  category?: string;
  country?: string;
  region?: string;
  subRegion?: string;
  progress?: number;
  totalItems?: number;
  completedItems?: number;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines:        '🍷 Vinhos',
  Vinhos:       '🍷 Vinhos',
  wineries:     '🏛️ Vinícolas',
  Vinícolas:    '🏛️ Vinícolas',
  experiences:  '✨ Experiências',
  Experiências: '✨ Experiências',
  grapes:       '🍇 Uvas',
  mix:          '🌟 Mix',
  brotherhoods: '🤝 Confrarias',
};

// Category → { background, text, border }
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Essencial':      { bg: '#E8F0EC', text: '#2D4A3E', border: 'rgba(45,74,62,0.20)' },
  'Fugir do óbvio': { bg: '#F8EBF1', text: '#6B0035', border: 'rgba(107,0,53,0.20)' },
  'Ícones':         { bg: '#FBF3DC', text: '#7A4F07', border: 'rgba(184,130,11,0.25)' },
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

export function CollectionCard({
  id, title, coverImage, description, contentType, category,
  progress = 0, totalItems = 0, completedItems = 0,
  country, region, subRegion,
}: CollectionCardProps) {
  const typeLabel = contentType ? (CONTENT_TYPE_LABELS[contentType] ?? contentType) : null;
  const geoParts  = [country, region, subRegion].filter(Boolean);
  const geoString = geoParts.join(' › ');
  const catStyle  = category ? (CATEGORY_STYLES[category] ?? { bg: '#EDE4D6', text: '#7A6855', border: 'rgba(139,90,43,0.18)' }) : null;

  return (
    <Link to={`/collection/${id}`} className="block mb-4 group">
      <div
        className="bg-white overflow-hidden transition-shadow duration-200 group-hover:shadow-md"
        style={{
          borderRadius: '18px',
          border: '1px solid rgba(139,90,43,0.12)',
          boxShadow: '0 1px 4px rgba(28,18,9,0.06)',
        }}
      >
        {/* ── Cover image ──────────────────────────────────────────── */}
        <div className="relative h-48 overflow-hidden bg-cream-200">
          <img
            src={coverImage || FALLBACK}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
          {/* Gradient overlay — stronger at bottom for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Content-type pill — top-left */}
          {typeLabel && (
            <div className="absolute top-3 left-3">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '9999px',
                  color: '#1C1209',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                {typeLabel}
              </span>
            </div>
          )}

          {/* Progress badge — top-right */}
          {progress > 0 && (
            <div className="absolute top-3 right-3">
              <span
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold text-white"
                style={{ background: '#6B0035', borderRadius: '9999px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              >
                {progress}%
              </span>
            </div>
          )}

          {/* Category pill — bottom-left */}
          {category && catStyle && (
            <div className="absolute bottom-3 left-3">
              <span
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: catStyle.bg,
                  color: catStyle.text,
                  border: `1px solid ${catStyle.border}`,
                  borderRadius: '9999px',
                }}
              >
                {category}
              </span>
            </div>
          )}
        </div>

        {/* ── Card body ────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-4">

          {/* Title + chevron */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="font-bold text-[1.05rem] leading-snug line-clamp-2 flex-1"
              style={{ fontFamily: '"Fraunces", Georgia, serif', color: '#1C1209', letterSpacing: '-0.01em' }}
            >
              {title}
            </h3>
            <ChevronRight
              className="w-4 h-4 shrink-0 mt-1 transition-colors duration-150"
              style={{ color: '#B0A090' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6B0035')}
              onMouseLeave={e => (e.currentTarget.style.color = '#B0A090')}
            />
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm line-clamp-2 mb-2 leading-relaxed" style={{ color: '#7A6855' }}>
              {description}
            </p>
          )}

          {/* Geography */}
          {geoString && (
            <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#B0A090' }}>
              <MapPin className="w-3 h-3 shrink-0" style={{ color: '#9B1B4D' }} />
              <span className="truncate">{geoString}</span>
            </div>
          )}

          {/* Progress */}
          {totalItems > 0 && (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#B0A090' }}>{completedItems}/{totalItems} itens</span>
                <span className="text-xs font-bold" style={{ color: '#6B0035' }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,90,43,0.10)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(progress, completedItems > 0 ? 4 : 0)}%`,
                    background: 'linear-gradient(90deg, #6B0035 0%, #9B1B4D 100%)',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
