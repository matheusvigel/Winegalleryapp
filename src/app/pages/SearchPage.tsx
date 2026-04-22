import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Search, X, Wine, MapPin, Building2, Sparkles, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

type ResultType = 'wine' | 'winery' | 'region' | 'collection' | 'place';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string | null;
  photo: string | null;
  href: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ICONS: Record<ResultType, React.ElementType> = {
  wine:       Wine,
  winery:     Building2,
  region:     MapPin,
  collection: Sparkles,
  place:      UtensilsCrossed,
};

const TYPE_LABELS: Record<ResultType, string> = {
  wine:       'Vinho',
  winery:     'Vinícola',
  region:     'Região',
  collection: 'Coleção',
  place:      'Lugar',
};

const TYPE_COLORS: Record<ResultType, string> = {
  wine:       'bg-purple-100 text-purple-700',
  winery:     'bg-emerald-100 text-emerald-700',
  region:     'bg-rose-100 text-rose-700',
  collection: 'bg-amber-100 text-amber-700',
  place:      'bg-sky-100 text-sky-700',
};

const FALLBACK = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&q=60';

const FILTER_TYPES: { key: ResultType | 'all'; label: string }[] = [
  { key: 'all',        label: 'Tudo'       },
  { key: 'wine',       label: '🍷 Vinhos'   },
  { key: 'winery',     label: '🏛️ Vinícolas' },
  { key: 'region',     label: '📍 Regiões'   },
  { key: 'collection', label: '✨ Coleções'  },
  { key: 'place',      label: '🍽️ Lugares'   },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<ResultType | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const q = debouncedQuery.trim();
    setLoading(true);

    const search = async () => {
      const ilike = `%${q}%`;

      const [
        { data: wines },
        { data: wineries },
        { data: regions },
        { data: collections },
        { data: places },
      ] = await Promise.all([
        supabase
          .from('wines')
          .select('id, name, photo, type, wineries(name)')
          .ilike('name', ilike)
          .limit(5),

        supabase
          .from('wineries')
          .select('id, name, photo, region:region_id(name)')
          .ilike('name', ilike)
          .limit(5),

        supabase
          .from('regions')
          .select('id, name, photo, level, parent:regions!parent_id(name)')
          .ilike('name', ilike)
          .in('level', ['region', 'sub-region'])
          .limit(5),

        supabase
          .from('collections')
          .select('id, title, photo, category')
          .ilike('title', ilike)
          .limit(5),

        supabase
          .from('places')
          .select('id, name, photo, type, sub_type')
          .ilike('name', ilike)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(wines ?? []).map((w: any): SearchResult => ({
          id:       w.id,
          type:     'wine',
          title:    w.name,
          subtitle: w.wineries?.name ?? w.type ?? null,
          photo:    w.photo || null,
          href:     `/wine/${w.id}`,
        })),
        ...(wineries ?? []).map((w: any): SearchResult => ({
          id:       w.id,
          type:     'winery',
          title:    w.name,
          subtitle: (w.region as any)?.name ?? null,
          photo:    w.photo || null,
          href:     `/winery/${w.id}`,
        })),
        ...(regions ?? []).map((r: any): SearchResult => ({
          id:       r.id,
          type:     'region',
          title:    r.name,
          subtitle: (r.parent as any)?.name ?? null,
          photo:    r.photo || null,
          href:     `/region/${r.id}`,
        })),
        ...(collections ?? []).map((c: any): SearchResult => ({
          id:       c.id,
          type:     'collection',
          title:    c.title,
          subtitle: c.category ?? null,
          photo:    c.photo || null,
          href:     `/collection/${c.id}`,
        })),
        ...(places ?? []).map((p: any): SearchResult => ({
          id:       p.id,
          type:     'place',
          title:    p.name,
          subtitle: p.sub_type ?? null,
          photo:    p.photo || null,
          href:     `/place/${p.id}`,
        })),
      ];

      setResults(mapped);
      setLoading(false);
    };

    search();
  }, [debouncedQuery]);

  const filtered = selectedType === 'all'
    ? results
    : results.filter(r => r.type === selectedType);


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar vinhos, vinícolas, regiões..."
              className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedType === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">

        {/* Empty state — no query */}
        {!query && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-500 font-medium mb-1">Encontre o que procura</p>
            <p className="text-gray-400 text-sm">Vinhos, vinícolas, regiões e coleções</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && query && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium mb-1">Nenhum resultado</p>
            <p className="text-gray-400 text-sm">Tente outros termos de busca</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {!loading && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {filtered.map((result, i) => {
                const Icon = ICONS[result.type];
                const typeColor = TYPE_COLORS[result.type];
                const typeLabel = TYPE_LABELS[result.type];

                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <Link to={result.href} className="block group">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {result.photo ? (
                            <img
                              src={result.photo}
                              alt={result.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-purple-400" />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight truncate mb-0.5">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-gray-500 text-xs truncate">{result.subtitle}</p>
                          )}
                          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {typeLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
