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

const CATEGORY_STYLES: Record<string, string> = {
  'Essencial':      'bg-emerald-100 text-emerald-700',
  'Fugir do óbvio': 'bg-purple-100 text-purple-700',
  'Ícones':         'bg-amber-100 text-amber-700',
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

export function CollectionCard({
  id, title, coverImage, description, contentType, category,
  progress = 0, totalItems = 0, completedItems = 0,
  country, region, subRegion,
}: CollectionCardProps) {
  const typeLabel = contentType
    ? (CONTENT_TYPE_LABELS[contentType] ?? contentType)
    : null;

  const geoParts = [country, region, subRegion].filter(Boolean);
  const geoString = geoParts.join(' › ');

  const categoryStyle = category ? (CATEGORY_STYLES[category] ?? 'bg-neutral-100 text-neutral-700') : null;

  return (
    <Link to={`/collection/${id}`} className="block mb-5 group">
      <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-neutral-100 group-hover:shadow-md transition-shadow duration-200">

        {/* ── Cover image ────────────────────────────────────── */}
        <div className="relative h-48 overflow-hidden bg-neutral-100">
          <img
            src={coverImage || FALLBACK}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK;
            }}
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

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

          {/* Category pill — bottom-left over gradient */}
          {category && categoryStyle && (
            <div className="absolute bottom-3 left-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${categoryStyle}`}>
                {category}
              </span>
            </div>
          )}
        </div>

        {/* ── Card body ──────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-4">

          {/* Title + chevron */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-[1.05rem] text-neutral-900 leading-snug line-clamp-2 flex-1">
              {title}
            </h3>
            <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5 group-hover:text-purple-600 transition-colors" />
          </div>

          {/* Description / tagline */}
          {description && (
            <p className="text-sm text-neutral-500 line-clamp-2 mb-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Geography breadcrumb */}
          {geoString && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">{geoString}</span>
            </div>
          )}

          {/* Progress section */}
          {totalItems > 0 && (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-500">{completedItems}/{totalItems} itens</span>
                <span className="text-xs font-semibold text-purple-600">{progress}%</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progress, completedItems > 0 ? 4 : 0)}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
