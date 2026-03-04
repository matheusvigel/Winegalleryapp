import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { Globe, MapPin, BookOpen, Wine, Building2, Grape, ArrowRight } from 'lucide-react';

interface Counts {
  countries: number;
  regions: number;
  collections: number;
  wines: number;
  brands: number;
  grapes: number;
}

const cards = [
  { key: 'countries', label: 'Países', icon: Globe, to: '/admin/countries', color: 'bg-blue-50 text-blue-700' },
  { key: 'regions', label: 'Regiões', icon: MapPin, to: '/admin/regions', color: 'bg-green-50 text-green-700' },
  { key: 'collections', label: 'Coleções', icon: BookOpen, to: '/admin/collections', color: 'bg-purple-50 text-purple-700' },
  { key: 'wines', label: 'Vinhos', icon: Wine, to: '/admin/wines', color: 'bg-red-50 text-red-700' },
  { key: 'brands', label: 'Marcas', icon: Building2, to: '/admin/brands', color: 'bg-orange-50 text-orange-700' },
  { key: 'grapes', label: 'Uvas', icon: Grape, to: '/admin/grapes', color: 'bg-pink-50 text-pink-700' },
] as const;

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({ countries: 0, regions: 0, collections: 0, wines: 0, brands: 0, grapes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [c, r, col, w, b, g] = await Promise.all([
        supabase.from('countries').select('id', { count: 'exact', head: true }),
        supabase.from('regions').select('id', { count: 'exact', head: true }),
        supabase.from('collections').select('id', { count: 'exact', head: true }),
        supabase.from('wine_items').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('grapes').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        countries: c.count ?? 0,
        regions: r.count ?? 0,
        collections: col.count ?? 0,
        wines: w.count ?? 0,
        brands: b.count ?? 0,
        grapes: g.count ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Visão geral do conteúdo cadastrado</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(({ key, label, icon: Icon, to, color }) => (
          <Link
            key={key}
            to={to}
            className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <ArrowRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors mt-1" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {loading ? '—' : counts[key]}
            </p>
            <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-1">Acesso rápido</h2>
        <p className="text-xs text-neutral-500 mb-4">Selecione uma seção na barra lateral para gerenciar o conteúdo.</p>
        <div className="flex flex-wrap gap-2">
          {cards.map(({ key, label, to }) => (
            <Link
              key={key}
              to={to}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
