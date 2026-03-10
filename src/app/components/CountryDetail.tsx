import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

type Country = { id: string; name: string; image_url: string; description: string };
type Collection = { id: string; title: string; cover_image: string; content_type: string | null };
type Region = { id: string; name: string; image_url: string; description: string };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  wines: 'Vinhos', wineries: 'Vinícolas', experiences: 'Experiências', grapes: 'Uvas', mix: 'Mix',
};

export default function CountryDetail() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryId) return;
    const load = async () => {
      const [{ data: ct }, { data: regs }] = await Promise.all([
        supabase.from('countries').select('*').eq('id', countryId).single(),
        supabase.from('regions').select('id, name, image_url, description')
          .eq('country_id', countryId).is('parent_id', null).order('name'),
      ]);
      setCountry(ct);
      const regionList = regs ?? [];
      setRegions(regionList);

      if (regionList.length > 0) {
        const { data: rcLinks } = await supabase
          .from('region_collections').select('collection_id').in('region_id', regionList.map(r => r.id));
        const ids = [...new Set((rcLinks ?? []).map(r => r.collection_id))];
        if (ids.length > 0) {
          const { data: cols } = await supabase
            .from('collections').select('id, title, cover_image, content_type')
            .in('id', ids).order('created_at', { ascending: false }).limit(6);
          setCollections(cols ?? []);
        }
      }
      setLoading(false);
    };
    load();
  }, [countryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!country) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <p className="text-neutral-500 text-sm">País não encontrado</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Compact header */}
      <div className="bg-white border-b border-neutral-200 px-5 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-neutral-700" />
          </motion.button>
          <div className="min-w-0">
            <p className="text-[#c5a96d] text-[11px] font-semibold uppercase tracking-widest">Países</p>
            <h1 className="text-neutral-900 font-bold text-lg leading-tight truncate">{country.name}</h1>
          </div>
        </div>
        {country.description && (
          <p className="text-neutral-500 text-[13px] leading-snug mt-2 ml-12">{country.description}</p>
        )}
      </div>

      <div className="px-4 py-4 space-y-8">
        {/* Collections */}
        {collections.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Coleções de {country.name}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {collections.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={col.cover_image}
                        alt={col.title}
                        className="w-full h-full object-cover"
                      />
                      {col.content_type && col.content_type !== 'mix' && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-semibold text-white bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full">
                            {CONTENT_TYPE_LABELS[col.content_type] ?? col.content_type}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="px-2.5 py-2 text-[13px] font-medium text-neutral-800 leading-tight line-clamp-2">
                      {col.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Regions */}
        {regions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Regiões de {country.name}
            </h2>
            <div className="space-y-3">
              {regions.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.3 }}
                >
                  <Link to={`/region/${region.id}`}>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-40">
                        <img
                          src={region.image_url}
                          alt={region.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white mb-1">{region.name}</h3>
                          {region.description && (
                            <p className="text-neutral-200 text-sm line-clamp-1">{region.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-neutral-500">Ver coleções</span>
                        <ChevronRight size={20} className="text-neutral-400" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {collections.length === 0 && regions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-sm">Nenhum conteúdo cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
