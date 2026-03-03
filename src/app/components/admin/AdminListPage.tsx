import { Link } from 'react-router';
import { Plus, Pencil, Trash2, ChevronLeft, AlertCircle } from 'lucide-react';
import ImageWithFallback from '../ImageWithFallback';

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  badge?: string;
  badgeColor?: string;
};

type Props = {
  heading: string;
  backTo?: string;
  createTo: string;
  editTo: (id: string) => string;
  items: ListItem[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string, title: string) => void;
  emptyMessage?: string;
};

export default function AdminListPage({
  heading,
  backTo,
  createTo,
  editTo,
  items,
  loading,
  error,
  onDelete,
  emptyMessage = 'Nenhum item cadastrado ainda.',
}: Props) {
  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2">
          {backTo && (
            <Link to={backTo} className="p-2 -ml-2 rounded-xl hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </Link>
          )}
          <h1 className="text-xl font-bold text-white">{heading}</h1>
        </div>
        <Link
          to={createTo}
          className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/40 border border-red-800 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex gap-3 animate-pulse">
              <div className="w-14 h-14 bg-neutral-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-neutral-500 text-sm">{emptyMessage}</p>
          <Link
            to={createTo}
            className="inline-flex items-center gap-1.5 mt-4 bg-red-800 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeiro item
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3"
            >
              {item.imageUrl !== undefined && (
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                  <ImageWithFallback
                    src={item.imageUrl || ''}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${item.badgeColor || 'bg-neutral-700 text-neutral-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-neutral-500 text-xs mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={editTo(item.id)}
                  className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDelete(item.id, item.title)}
                  className="p-2 rounded-xl hover:bg-red-900/50 text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
