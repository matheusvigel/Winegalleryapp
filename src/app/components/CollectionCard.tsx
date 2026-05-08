import { Link } from 'react-router';

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
  /** 'portrait' = tall fixed-width card for horizontal carousels (default)
   *  'landscape' = full-width horizontal card for compact lists */
  variant?: 'portrait' | 'landscape';
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

const isWineType = (t?: string) => t === 'wines' || t === 'Vinhos';

export function CollectionCard({
  id, title, coverImage, description, contentType, category,
  progress = 0, totalItems = 0, completedItems = 0,
  country, region, subRegion,
  previewPhotos,
  variant = 'portrait',
}: CollectionCardProps) {
  const typeLabel  = contentType ? (CONTENT_TYPE_LABELS[contentType] ?? contentType) : null;
  const geoParts   = [country, region, subRegion].filter(Boolean);
  const geoString  = geoParts.join(' · ');
  const isWine     = isWineType(contentType);

  // ── Portrait card (tall, fixed-width, for horizontal carousels) ──────────────
  if (variant === 'portrait') {
    // For wine collections with preview bottles, use the first bottle photo as hero
    const heroImage = (isWine && previewPhotos && previewPhotos.length > 0)
      ? previewPhotos[0]
      : (coverImage || FALLBACK);

    return (
      <Link
        to={`/collection/${id}`}
        className="block w-full group"
        style={{ textDecoration: 'none' }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            height: 300,
            borderRadius: 18,
            background: isWine ? '#F0EBE0' : '#1C1209',
            boxShadow: '0 4px 20px rgba(28,18,9,0.14)',
          }}
        >
          {/* Image */}
          {isWine && previewPhotos && previewPhotos.length > 0 ? (
            /* Wine: bottles on cream bg */
            <>
              <div className="absolute inset-0 flex items-center justify-center px-6 pt-4 pb-16">
                <img
                  src={heroImage}
                  alt={title}
                  className="max-h-full max-w-full object-contain group-hover:scale-[1.04] transition-transform duration-500"
                  style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.20))' }}
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
              </div>
              {/* Gradient overlay at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '55%',
                  background: 'linear-gradient(to top, rgba(28,9,5,0.82) 0%, rgba(28,9,5,0.45) 55%, transparent 100%)',
                }}
              />
            </>
          ) : (
            /* Photo: full cover */
            <>
              <img
                src={coverImage || FALLBACK}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,4,2,0.88) 0%, rgba(10,4,2,0.40) 50%, rgba(10,4,2,0.10) 100%)' }}
              />
            </>
          )}

          {/* Type badge — top left */}
          {typeLabel && (
            <div className="absolute top-3 left-3">
              <span
                className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full"
                style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(6px)' }}
              >
                {typeLabel}
              </span>
            </div>
          )}

          {/* Progress badge — top right */}
          {completedItems > 0 && (
            <div className="absolute top-3 right-3">
              <span
                className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-full"
                style={{ background: 'rgba(45,74,62,0.88)', color: '#fff', backdropFilter: 'blur(6px)' }}
              >
                ✓ {completedItems}/{totalItems}
              </span>
            </div>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-4">
            {/* Category */}
            {category && (
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {category}
              </p>
            )}

            {/* Title */}
            <h3
              className="font-bold leading-snug mb-1"
              style={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: '1rem',
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>

            {/* Geo or description */}
            {(geoString || description) && (
              <p className="text-[11px] line-clamp-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
                {geoString || description}
              </p>
            )}

            {/* Progress bar */}
            {totalItems > 0 && progress > 0 && (
              <div className="mt-2">
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.20)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(progress, 4)}%`,
                      background: 'linear-gradient(90deg, #E8A0BF 0%, #fff 100%)',
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

  // ── Landscape card (full-width, for compact lists) ────────────────────────────

  return (
    <Link to={`/collection/${id}`} className="block group" style={{ textDecoration: 'none' }}>
      <div
        className="bg-white overflow-hidden transition-shadow duration-200 group-hover:shadow-md"
        style={{
          borderRadius: 14,
          border: '1px solid rgba(139,90,43,0.10)',
          boxShadow: '0 1px 4px rgba(28,18,9,0.05)',
        }}
      >
        <div className="flex" style={{ minHeight: 96 }}>
          {/* Thumbnail */}
          <div
            className="flex-shrink-0 relative overflow-hidden"
            style={{
              width: 96,
              background: isWine ? '#F5F0E8' : '#1C1209',
              borderRadius: '14px 0 0 14px',
            }}
          >
            {isWine && previewPhotos && previewPhotos.length > 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <img
                  src={previewPhotos[0]}
                  alt={title}
                  className="max-h-full max-w-full object-contain"
                  style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                />
              </div>
            ) : (
              <img
                src={coverImage || FALLBACK}
                alt={title}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#B0906A' }}>
                {typeLabel ?? 'Coleção'}{category ? ` · ${category}` : ''}
              </p>
              <h3
                className="font-bold leading-snug mb-0.5"
                style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: '0.92rem', color: '#1C1209' }}
              >
                {title}
              </h3>
              {description && (
                <p className="text-xs line-clamp-1 leading-relaxed" style={{ color: '#7A6855' }}>{description}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              {totalItems > 0 && (
                <span className="text-xs" style={{ color: '#B0A090' }}>
                  {completedItems > 0 ? `${completedItems}/${totalItems}` : `${totalItems} itens`}
                </span>
              )}
              {progress > 0 && (
                <span className="text-xs font-bold" style={{ color: '#6B0035' }}>{progress}%</span>
              )}
            </div>
            {totalItems > 0 && progress > 0 && (
              <div className="h-0.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(139,90,43,0.10)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(progress, 3)}%`, background: 'linear-gradient(90deg, #6B0035, #9B1B4D)' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
