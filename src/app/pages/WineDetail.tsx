import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ChevronLeft, Heart, Share2, CheckCircle2 } from 'lucide-react';
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
  average_price: number | null;
  buy_link: string | null;
  wineries: { name: string; photo: string } | null;
}

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [wine, setWine] = useState<WineRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tried, setTried] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from('wines')
        .select('*, wineries(name, photo)')
        .eq('id', id)
        .maybeSingle();
      setWine(data as WineRow | null);

      if (user) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('completed, is_favorite')
          .eq('user_id', user.id)
          .eq('item_id', id)
          .maybeSingle();
        if (progress) {
          setTried(progress.completed ?? false);
          setFavorite(progress.is_favorite ?? false);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleTried = async () => {
    if (!user || !id) return;
    setSaving(true);
    const newTried = !tried;
    setTried(newTried); // optimistic
    const result = await psToggleTried(user.id, id, 'wine', tried);
    if (result && !tried) {
      toast.success('+1 ponto!', { description: 'Vinho marcado como experimentado 🍷' });
    }
    setSaving(false);
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
    const newFav = !favorite;
    setFavorite(newFav); // optimistic
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
          <p className="text-gray-600 mb-2">Item não encontrado</p>
          <Link to="/" className="text-purple-600 hover:underline">Voltar para início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </Link>
            <button className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Image */}
        <div className="relative mb-6">
          <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 rounded-3xl p-8 shadow-xl">
            <div className="relative h-72">
              <img
                src={wine.photo}
                alt={wine.name}
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';
                }}
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{wine.name}</h1>
              {wine.wineries && <p className="text-lg text-gray-600">{wine.wineries.name}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Actions */}
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

        {/* Highlight */}
        {wine.highlight && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🍷</span>
              <h2 className="text-xl font-bold text-gray-900">Por que provar?</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{wine.highlight}</p>
          </div>
        )}

        {/* Method */}
        {wine.method && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Método de Elaboração</h2>
            <p className="text-gray-700">{wine.method}</p>
          </div>
        )}

        {/* Tasting notes */}
        {wine.tasting_note && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white mb-6">
            <h2 className="text-lg font-bold mb-3">Notas de Degustação</h2>
            <p className="leading-relaxed">{wine.tasting_note}</p>
          </div>
        )}

        {/* Buy link */}
        {wine.buy_link && (
          <a
            href={wine.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mb-6"
          >
            Comprar este vinho →
          </a>
        )}

        {wine.average_price && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Preço médio</p>
            <p className="text-2xl font-bold text-gray-900">
              {wine.average_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
