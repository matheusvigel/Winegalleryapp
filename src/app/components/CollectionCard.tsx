import { Link } from 'react-router';
import { MapPin } from 'lucide-react';

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
  previewPhotos?: string[];
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines:        'Vinhos',
  Vinhos:       'Vinhos',
  wineries:     'Vinícolas',
  Vinícolas:    'Vinícolas',
  experiences:  'Experiências',
  Experiências: 'Experiências',
  grapes:       'Uvas',
  mix:          'Mix',
  brotherhoods: 'Confrarias',
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const isWineType = (t?: string) =>
  t === 'wines' || t === 'Vinhos';

export function CollectionCard({
  id, title, coverImage, description, contentType, category,
  progress = 0, totalItems = 0, completedItems = 0,
  country, region, subRegion,
  previewPhotos,
}: CollectionCardProps) {
  const typeLabel  = contentType ? (CONTENT_TYPE_LABELS[contentType] ?? contentType) : null;
  const geoParts   = [country, region, subRegion].filter(Boolean);
  const geoString  = geoParts.join(' › ');
  const isWine     = isWineType(contentType);
  const hasPreview = previewPhotos && previewPhotos.length > 0;

  return (
    <Link to={`/collection/${id}`} className="block group">
      <div
        className="bg-white overflow-hidden transition-shadow duration-200 group-hover:shadow-md"
        style={{
          borderRadius: 16,
          border: '1px solid rgba(139,90,43,0.10)',
          boxShadow: '0 1px 4px rgba(28,18,9,0.05)',
        }}
      >
        {/* ── Image ────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 192,
            background: isWine ? '#F8F5F0' : '#1C1209',
          }}
        >
          {isWine && hasPreview ? (
            /* Wine: preview bottles side by side on cream bg */
            <div className="flex h-full items-center justify-center gap-2 px-4 py-3">
              {previewPhotos!.slice(0, 4).map((photo, i) => (
                <div
                  key={i}
                  className="flex-1 h-full flex items-center justify-center"
                  style={{ maxWidth: 80 }}
                >
                  <img
                    src={photo}
                    alt=""
                    className="max-h-full max-w-full object-contain drop-shadow-sm"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  />
                </div>
              ))}
              {/* Remaining count */}
              {totalItems > (previewPhotos?.length ?? 0) && (
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold"
                  style={{ width: 40, height: 52, background: '#EDE4D6', color: '#7A6855' }}
                >
                  +{totalItems - (previewPhotos?.length ?? 0)}
                </div>
              )}
            </div>
          ) : (
            /* Non-wine or no preview: cover photo */
            <>
              <img
                src={coverImage || FALLBACK}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </>
          )}

          {/* Progress badge */}
          {completedItems > 0 && (
            <div className="absolute top-3 right-3">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white rounded-full"
                style={{ background: 'rgba(45,74,62,0.90)', backdropFilter: 'blur(6px)' }}
              >
                ✓ {completedItems}/{totalItems}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-4">

          {/* Type label + category */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {typeLabel && (
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: '#B0906A' }}
              >
                {typeLabel}
              </span>
            )}
            {typeLabel && category && (
              <span style={{ color: '#D4C4B0', fontSize: 10 }}>·</span>
            )}
            {category && (
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: '#B0906A' }}
              >
                {category}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-bold leading-snug line-clamp-2 mb-1"
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              color: '#1C1209',
              fontSize: '1.05rem',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p
              className="text-sm line-clamp-2 leading-relaxed mb-2"
              style={{ color: '#7A6855' }}
            >
              {description}
            </p>
          )}

          {/* Geography */}
          {geoString && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#B0A090' }}>
              <MapPin className="w-3 h-3 shrink-0" style={{ color: '#9B1B4D' }} />
              <span className="truncate">{geoString}</span>
            </div>
          )}

          {/* Item count / progress */}
          {totalItems > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#B0A090' }}>
                  {completedItems > 0
                    ? `${completedItems} de ${totalItems} explorados`
                    : `${totalItems} ${typeLabel?.toLowerCase() ?? 'itens'}`}
                </span>
                {progress > 0 && (
                  <span className="text-xs font-bold" style={{ color: '#6B0035' }}>{progress}%</span>
                )}
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(139,90,43,0.10)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(progress, completedItems > 0 ? 3 : 0)}%`,
                    background: 'linear-gradient(90deg, #6B0035 0%, #9B1B4D 100%)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
