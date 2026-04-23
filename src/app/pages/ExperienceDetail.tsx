import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ChevronLeft, Share2, CheckCircle2, Heart, MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  toggleTried as psToggleTried,
  toggleFavorite as psToggleFavorite,
} from '../../lib/pointsSystem';

interface ExperienceRow {
  id: string;
  name: string;
  photo: string;
  category: string;
  highlight: string;
  buy_link: string | null;
  location_type: string;
  winery: { id: string; name: string } | null;
  region: { id: string; name: string } | null;
}

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80';

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [experience, setExperience] = useState<ExperienceRow | null>(null);
  const [loading, setLoading]       = useState(true);
  const [tried, setTried]           = useState(false);
  const [favorite, setFavorite]     = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data }, progressRes] = await Promise.all([
        supabase
          .from('experiences')
          .select('id, name, photo, category, highlight, buy_link, location_type, winery:winery_id(id, name), region:region_id(id, name)')
          .eq('id', id)
          .maybeSingle(),
        user
          ? supabase.from('user_progress').select('completed, is_favorite').eq('user_id', user.id).eq('item_id', id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setExperience(data as ExperienceRow | null);
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
    const result = await psToggleTried(user.id, id, 'experience', tried);
    if (result && !tried) {
      toast.success('+1 ponto!', { description: 'Experiência marcada como vivida ✨' });
    }
    setSaving(false);
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
    setFavorite(v => !v);
    const result = await psToggleFavorite(user.id, id, 'experience', favorite);
    if (result && !favorite) {
      toast.success('+1 ponto!', { description: 'Adicionado aos favoritos ❤️' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Experiência não encontrada</p>
          <Link to="/" className="text-purple-600 hover:underline">Voltar para início</Link>
        </div>
      </div>
    );
  }

  const winery = experience.winery as { id: string; name: string } | null;
  const region = experience.region as { id: string; name: string } | null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">

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

        {/* ── Cover image ────────────────────────────────────────────────── */}
        <div className="relative h-64 rounded-3xl overflow-hidden shadow-xl mb-6">
          <img
            src={experience.photo}
            alt={experience.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-2xl font-bold text-white leading-tight">{experience.name}</h1>
          </div>
        </div>

        {/* ── Tags row ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {experience.category && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              ✨ {experience.category}
            </span>
          )}
          {winery && (
            <Link
              to={`/winery/${winery.id}`}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              🏛️ {winery.name}
            </Link>
          )}
          {region && (
            <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {region.name}
            </span>
          )}
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
              {tried ? 'Vivida' : 'Já vivi'}
            </button>
            <button
              onClick={toggleFavorite}
              className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                favorite ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-white' : ''}`} />
              {favorite ? 'Favorita' : 'Favoritar'}
            </button>
          </div>
        )}

        {/* ── Buy / link ─────────────────────────────────────────────────── */}
        {experience.buy_link && (
          <a
            href={experience.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5 hover:shadow-md transition-shadow group"
          >
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Saiba mais</p>
              <p className="text-sm font-semibold text-purple-700">Acessar →</p>
            </div>
            <ExternalLink className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </a>
        )}

        {/* ── Why experience ─────────────────────────────────────────────── */}
        {experience.highlight && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl font-bold text-gray-900">Por que viver?</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{experience.highlight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
