import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Globe, MapPin, Package, Wine, Grape, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type Counts = {
  countries: number;
  regions: number;
  collections: number;
  items: number;
  brands: number;
  grapes: number;
};

const sections = [
  { label: 'Países', key: 'countries' as const, to: '/admin/countries', icon: Globe, color: 'bg-blue-600' },
  { label: 'Regiões', key: 'regions' as const, to: '/admin/regions', icon: MapPin, color: 'bg-green-600' },
  { label: 'Coleções', key: 'collections' as const, to: '/admin/collections', icon: Package, color: 'bg-purple-600' },
  { label: 'Vinhos & Vinícolas', key: 'items' as const, to: '/admin/items', icon: Wine, color: 'bg-red-700' },
  { label: 'Marcas', key: 'brands' as const, to: '/admin/brands', icon: Wine, color: 'bg-orange-600' },
  { label: 'Uvas', key: 'grapes' as const, to: '/admin/grapes', icon: Grape, color: 'bg-violet-600' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tables = ['countries', 'regions', 'collections', 'wine_items', 'brands', 'grapes'] as const;
        const results = await Promise.all(
          tables.map(t => supabase.from(t).select('id', { count: 'exact', head: true }))
        );
        setCounts({
          countries: results[0].count ?? 0,
          regions: results[1].count ?? 0,
          collections: results[2].count ?? 0,
          items: results[3].count ?? 0,
          brands: results[4].count ?? 0,
          grapes: results[5].count ?? 0,
        });
      } catch (err) {
        setError('Não foi possível conectar ao Supabase. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-400 text-sm mt-1">Gerencie o catálogo do WineGallery</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-900/40 border border-yellow-700 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">Supabase não configurado</p>
            <p className="text-yellow-400/80 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {sections.map(section => (
          <Link
            key={section.key}
            to={section.to}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-neutral-600 transition-colors active:scale-95"
          >
            <div className={`w-10 h-10 ${section.color} rounded-xl flex items-center justify-center`}>
              <section.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs">{section.label}</p>
              {loading ? (
                <div className="h-6 w-8 bg-neutral-800 rounded animate-pulse mt-0.5" />
              ) : (
                <p className="text-2xl font-bold text-white">{counts?.[section.key] ?? '—'}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Ver todos</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <h2 className="text-sm font-semibold text-white mb-3">Próximos passos</h2>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">1.</span>
            <span>Configure o <code className="text-neutral-300 bg-neutral-800 px-1 rounded text-xs">.env.local</code> com suas credenciais do Supabase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">2.</span>
            <span>Execute as migrations em <code className="text-neutral-300 bg-neutral-800 px-1 rounded text-xs">supabase/migrations/</code> no SQL Editor do Supabase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">3.</span>
            <span>Adicione países, regiões, marcas e uvas usando os menus acima</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">4.</span>
            <span>Crie coleções e adicione vinhos/vinícolas ao catálogo</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
