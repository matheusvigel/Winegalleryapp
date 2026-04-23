import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ChevronLeft, Share2, CheckCircle2, Heart, Grape, Droplets, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
} from '../../lib/pointsSystem';

interface WineRow {
  id: string;
  name: string;
  photo: string;
  type: string;
  category: string | null;
  method: string | null;
  highlight: string;
  tasting_note: string | null;
  price_min: number | null;
  price_max: number | null;
  alcohol_pct: number | null;
  buy_link: string | null;
  wineries: { id: string; name: string; photo: string } | null;
}

interface GrapeRow {
  grape_id: string;
  percentage: number | null;
  grapes: { name: string; type: string } | null;
}

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';

function formatPrice(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max!);
}

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [wine, setWine]       = useState<WineRow | null>(null);
  const [grapes, setGrapes]   = useState<GrapeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tried, setTried]     = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data }, { data: wg }, progressRes] = await Promise.all([
        supabase
          .from('wines')
          .select('id, name, photo, type, category, method, highlight, tasting_note, price_min, price_max, alcohol_pct, buy_link, wineries(id, name, photo)')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('wine_grapes')
          .select('grape_id, percentage, grapes(name, type)')
          .eq('wine_id', id)
          .order('percentage', { ascending: false }),
        user
          ? supabase.from('user_progress').select('completed, is_favorite').eq('user_id', user.id).eq('item_id', id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setWine(data as WineRow | null);
      setGrapes((wg ?? []) as GrapeRow[]);
      if (progressRes.data) {
        setTried(progressRes.data.completed ?? false);
        setFavorite(progressRes.data.is_favorite ?? false);
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleTried = async () => {
    if (!user || !id) return;
    setSaving(true);
    setTried(v => !v);
    const result = await psToggleTried(user.id, id, 'wine', tried);
    if (result && !tried) {
      toast.success('+1 ponto!', { description: 'Vinho marcado como experimentado 🍷' });
    }
    setSaving(false);
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
    setFavorite(v => !v);
    const result = await psToggleFavorite(user.id, id, 'wine', favorite);
    if (result && !favorite) {
      toast.success('+1 ponto!', { description: 'Adicionado aos favoritos ❤️' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Vinho não encontrado</p>
          <Link to="/" className="text-purple-600 hover:underline">Voltar para início</Link>
        </div>
      </div>
    );
  }

  const priceLabel = formatPrice(wine.price_min, wine.price_max);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={-1 as any} className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <button className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
            <Share2 className="w-5 h-5 text-gray-900" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {/* ── Bottle image ───────────────────────────────────────────────── */}
        <div className="relative mb-6">
          <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 rounded-3xl p-8 shadow-xl">
            <div className="relative h-72">
              <img
                src={wine.photo}
                alt={wine.name}
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
            </div>
          </div>
        </div>

        {/* ── Title + winery ─────────────────────────────────────────────── */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{wine.name}</h1>
          {wine.wineries && (
            <Link
              to={`/winery/${wine.wineries.id}`}
              className="text-lg text-purple-700 font-medium hover:underline"
            >
              {wine.wineries.name}
            </Link>
          )}
          {wine.highlight && (
            <p className="text-sm text-gray-500 italic mt-1.5 leading-relaxed">{wine.highlight}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {wine.type && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {wine.type}
              </span>
            )}
            {wine.category && (
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                {wine.category}
              </span>
            )}
            {wine.alcohol_pct && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                {wine.alcohol_pct}% alc.
              </span>
            )}
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        {user && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={toggleTried}
              disabled={saving}
              className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                tried ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${tried ? 'fill-white' : ''}`} />
              {tried ? 'Experimentado' : 'Marcar como Provado'}
            </button>
            <button
              onClick={toggleFavorite}
              className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                favorite ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-white' : ''}`} />
              {favorite ? 'Favorito' : 'Favoritar'}
            </button>
          </div>
        )}

        {/* ── Price range ────────────────────────────────────────────────── */}
        {priceLabel && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Faixa de preço</p>
              <p className="text-xl font-bold text-gray-900">{priceLabel}</p>
            </div>
            {wine.buy_link && (
              <a
                href={wine.buy_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 transition-colors"
              >
                Comprar →
              </a>
            )}
          </div>
        )}

        {/* ── Grape composition ──────────────────────────────────────────── */}
        {grapes.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Grape className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-gray-900">Composição</h2>
            </div>
            <div className="space-y-2">
              {grapes.map(g => (
                <div key={g.grape_id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{g.grapes?.name}</span>
                    {g.grapes?.type && (
                      <span className="text-xs text-gray-400 ml-1.5">· {g.grapes.type}</span>
                    )}
                  </div>
                  {g.percentage && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${g.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{g.percentage}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Why taste ──────────────────────────────────────────────────── */}
        {wine.highlight && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🍷</span>
              <h2 className="text-xl font-bold text-gray-900">Por que provar?</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{wine.highlight}</p>
          </div>
        )}

        {/* ── Elaboration method ─────────────────────────────────────────── */}
        {wine.method && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Método de Elaboração</h2>
            </div>
            <p className="text-gray-700">{wine.method}</p>
          </div>
        )}

        {/* ── Tasting notes ──────────────────────────────────────────────── */}
        {wine.tasting_note && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white mb-5">
            <h2 className="text-lg font-bold mb-3">Notas de Degustação</h2>
            <p className="leading-relaxed">{wine.tasting_note}</p>
          </div>
        )}

        {/* ── Buy link (standalone, if no price shown) ───────────────────── */}
        {wine.buy_link && !priceLabel && (
          <a
            href={wine.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mb-5"
          >
            Comprar este vinho →
          </a>
        )}
      </div>
    </div>
  );
}
