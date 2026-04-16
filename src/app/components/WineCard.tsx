import { Heart, Star, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';

export interface WineCardProps {
  id: string;
  name: string;
  imageUrl: string;
  brandName?: string;
  wineType?: string;
  region?: string;
  year?: number;
  rating?: number;
  tried?: boolean;
  favorite?: boolean;
}

export function WineCard({ id, name, imageUrl, brandName, wineType, region, year, rating, tried, favorite }: WineCardProps) {
  return (
    <Link to={`/wine/${id}`} className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-md hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative h-56 bg-white/50 backdrop-blur-sm p-4">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain drop-shadow-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';
            }}
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            {tried && (
              <div className="bg-green-500 text-white rounded-full p-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            {favorite && (
              <div className="bg-red-500 text-white rounded-full p-1.5">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-white/80 backdrop-blur-sm">
          <h3 className="font-semibold text-gray-900 text-sm mb-0.5 line-clamp-2">{name}</h3>
          {(brandName || wineType || year) && (
            <p className="text-xs text-gray-600 mb-1.5">
              {brandName}{(brandName && (wineType || year)) ? ' • ' : ''}{year ?? wineType}
            </p>
          )}
          <div className="flex items-center justify-between">
            {region && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>📍</span>
                <span className="truncate max-w-[90px]">{region}</span>
              </div>
            )}
            {rating && (
              <div className="flex items-center gap-0.5 text-xs ml-auto">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating}</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-2xl" />
      </div>
    </Link>
  );
}
