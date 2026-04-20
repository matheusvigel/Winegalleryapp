import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight, MapPin, ExternalLink, Layers } from 'lucide-react';
import { PLACE_TYPES } from '../backoffice/pages/Places';

// ── Types ────────────────────────────────────────────────────────────────────

type Place = {
  id: string; name: string; photo: string | null;
  description: string | null; highlight: string | null;
  region_id: string | null; sub_region_id: string | null;
  type: string; sub_type: string | null;
  website: string | null; address: string | null; price_range: string | null;
};

type RegionRow = {
  id: string; name: string; level: string;
  parent: { id: string; name: string } | null;
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80';

const PRICE_COLORS: Record<string, string> = {
  '$':    'bg-emerald-100 text-emerald-700',
  '$$':   'bg-yellow-100  text-yellow-700',
  '$$$':  'bg-orange-100  text-orange-700',
  '$$$$': 'bg-red-100     text-red-700',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PlaceDetail() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();

  const [place, setPlace]       = useState<Place | null>(null);
  const [region, setRegion]     = useState<RegionRow | null>(null);
  const [subRegion, setSubRegion] = useState<RegionRow | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!placeId) return;
    setLoading(true);

    const load = async () => {
      const { data: p } = await supabase
        .from('places')
        .select('*')
        .eq('id', placeId)
        .maybeSingle();

      if (!p) { setLoading(false); return; }
      setPlace(p);

      const [{ data: reg }, { data: sub }] = await Promise.all([
        p.region_id
          ? supabase.from('regions')
              .select('id, name, level, parent:regions!parent_id(id, name)')
              .eq('id', p.region_id).maybeSingle()
          : Promise.resolve({ data: null }),
        p.sub_region_id
          ? supabase.from('regions')
              .select('id, name, level, parent:regions!parent_id(id, name)')
              .eq('id', p.sub_region_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setRegion((reg as unknown as RegionRow) ?? null);
      setSubRegion((sub as unknown as RegionRow) ?? null);
      setLoading(false);
    };

    load();
  }, [placeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Lugar não encontrado</p>
          <Link to="/explore" className="text-purple-600 hover:underline text-sm">Voltar para Explorar</Link>
        </div>
      </div>
    );
  }

  const typeMeta  = PLACE_TYPES.find(t => t.value === place.type);
  const displayRegion = subRegion ?? region;
  const parentRegion  = subRegion ? region : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <Link to="/explore" className="text-xs text-purple-600 font-medium hover:underline">Explorar</Link>
                {parentRegion && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <Link
                      to={`/region/${parentRegion.id}`}
                      className="text-xs text-purple-600 font-medium hover:underline truncate max-w-[80px]"
                    >
                      {parentRegion.name}
                    </Link>
                  </>
                )}
                {displayRegion && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <Link
                      to={`/region/${displayRegion.id}`}
                      className="text-xs text-purple-600 font-medium hover:underline truncate max-w-[80px]"
                    >
                      {displayRegion.name}
                    </Link>
                  </>
                )}
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate max-w-[100px]">{place.name}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{place.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 max-w-2xl mx-auto">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        {place.photo ? (
          <div className="relative h-64 mx-4 mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={place.photo}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {typeMeta && (
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {typeMeta.emoji} {typeMeta.label}
                  </span>
                )}
                {place.sub_type && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {place.sub_type}
                  </span>
                )}
                {place.price_range && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                    {place.price_range}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{place.name}</h2>
              {place.highlight && (
                <p className="text-white/75 text-sm mt-1 line-clamp-2">{place.highlight}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-4 mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                {typeMeta?.emoji ?? '📍'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{place.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {typeMeta && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {typeMeta.label}
                    </span>
                  )}
                  {place.sub_type && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">{place.sub_type}</span>
                  )}
                  {place.price_range && (
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${PRICE_COLORS[place.price_range] ?? 'bg-gray-100 text-gray-600'}`}>
                      {place.price_range}
                    </span>
                  )}
                </div>
                {place.highlight && (
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{place.highlight}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Info cards row ──────────────────────────────────────────── */}
        <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
          {displayRegion && (
            <Link
              to={`/region/${displayRegion.id}`}
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Região</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{displayRegion.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 group-hover:text-purple-600 transition-colors" />
            </Link>
          )}
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Site</p>
                <p className="text-sm font-semibold text-purple-600 truncate">Visitar</p>
              </div>
            </a>
          )}
        </div>

        {/* ── Address ─────────────────────────────────────────────────── */}
        {place.address && (
          <div className="mx-4 mb-5 bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">{place.address}</p>
          </div>
        )}

        {/* ── Description ─────────────────────────────────────────────── */}
        {place.description && (
          <div className="mx-4 mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sobre o lugar</p>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-gray-700 text-sm leading-relaxed">{place.description}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!place.description && !place.address && !place.website && !displayRegion && (
          <div className="mx-4 py-16 text-center">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Informações em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
