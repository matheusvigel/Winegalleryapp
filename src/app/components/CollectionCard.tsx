import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

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
  wines:       '🍷 Vinhos',
  wineries:    '🏛️ Vinícolas',
  experiences: '✨ Experiências',
  grapes:      '🍇 Uvas',
  mix:         '🌟 Mix',
};

export function CollectionCard({
  id, title, coverImage, description, contentType,
  progress = 0, totalItems = 0, completedItems = 0,
  region, country,
}: CollectionCardProps) {
  return (
    <Link to={`/collection/${id}`}>
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
        {/* Cover */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {contentType && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900">
                {CONTENT_TYPE_LABELS[contentType] ?? contentType}
              </span>
            </div>
          )}

          {progress > 0 && (
            <div className="absolute top-4 right-4">
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                {progress}%
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">{title}</h3>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between">
            {(region || country) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span>📍</span>
                <span>{[region, country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {totalItems > 0 && (
              <div className="text-sm font-medium text-purple-600 ml-auto">
                {completedItems}/{totalItems} completo
              </div>
            )}
          </div>

          {progress > 0 && (
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
