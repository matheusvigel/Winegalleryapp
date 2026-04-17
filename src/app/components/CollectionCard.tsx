import { Link } from 'react-router';
import { ChevronRight, MapPin } from 'lucide-react';

export interface CollectionCardProps {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  contentType?: string;
  progress?: number;
  totalItems?: number;
  completedItems?: number;
  region?: string;
  country?: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines:        '🍷 Vinhos',
  Vinhos:       '🍷 Vinhos',
  wineries:     '🏛️ Vinícolas',
  Vinícolas:    '🏛️ Vinícolas',
  experiences:  '✨ Experiências',
  Experiências: '✨ Experiências',
  grapes:       '🍇 Uvas',
  Uvas:         '🍇 Uvas',
  mix:          '🌟 Mix',
  brotherhoods: '🤝 Confrarias',
  Confrarias:   '🤝 Confrarias',
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

export function CollectionCard({
  id, title, coverImage, description, contentType,
  progress = 0, totalItems = 0, completedItems = 0,
  region, country,
}: CollectionCardProps) {
  const location = [region, country].filter(Boolean).join(', ');
  const typeLabel = contentType
    ? (CONTENT_TYPE_LABELS[contentType] ?? contentType)
    : null;

  return (
    <Link to={`/collection/${id}`} className="block mb-5 group">
      <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-neutral-100 group-hover:shadow-md transition-shadow duration-200">

        {/* ── Cover image ────────────────────────────────────── */}
        <div className="relative h-52 overflow-hidden bg-neutral-100">
          <img
            src={coverImage || FALLBACK}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK;
            }}
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Content-type pill — top-left */}
          {typeLabel && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-neutral-800 shadow-sm">
                {typeLabel}
              </span>
            </div>
          )}

          {/* Progress % badge — top-right */}
          {progress > 0 && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-3 py-1 bg-purple-600 rounded-full text-xs font-bold text-white shadow-sm">
                {progress}%
              </span>
            </div>
          )}
        </div>

        {/* ── Card body ──────────────────────────────────────── */}
        <div className="px-4 pt-3.5 pb-4">

          {/* Title + chevron */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-[1.05rem] text-neutral-900 leading-snug line-clamp-2 flex-1">
              {title}
            </h3>
            <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5 group-hover:text-purple-600 transition-colors" />
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Location + completion row */}
          <div className="flex items-center justify-between gap-2">
            {location ? (
              <div className="flex items-center gap-1.5 text-sm text-neutral-500 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            ) : (
              <span /> /* spacer */
            )}

            {totalItems > 0 && (
              <span className="text-sm font-semibold text-purple-600 shrink-0">
                {completedItems}/{totalItems} completo
              </span>
            )}
          </div>

          {/* Progress bar — always visible when totalItems > 0 */}
          {totalItems > 0 && (
            <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progress, completedItems > 0 ? 4 : 0)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
