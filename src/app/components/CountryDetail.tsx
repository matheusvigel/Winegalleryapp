import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

type Country = { id: string; name: string; image_url: string; description: string };
type Region = { id: string; name: string; image_url: string; description: string };

export default function CountryDetail() {
  const { countryId } = useParams<{ countryId: string }>();
  const [country, setCountry] = useState<Country | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryId) return;
    const load = async () => {
      const [{ data: ct }, { data: regs }] = await Promise.all([
        supabase.from('countries').select('*').eq('id', countryId).single(),
        supabase
          .from('regions')
          .select('id, name, image_url, description')
          .eq('country_id', countryId)
          .is('parent_id', null)
          .order('name'),
      ]);
      setCountry(ct);
      setRegions(regs ?? []);
      setLoading(false);
    };
    load();
  }, [countryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EBE0]">
        <div className="h-56 bg-neutral-200 animate-pulse" />
        <div className="px-4 py-5 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-[#FAFAF7] rounded-2xl animate-pulse border border-black/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EBE0]">
        <p className="text-neutral-500">País não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBE0]">
      {/* Breadcrumb */}
      <div className="px-4 py-3 flex items-center gap-1.5 text-xs text-neutral-400">
        <Link to="/regions" className="hover:text-[#690037] transition-colors">
          Regiões
        </Link>
        <ChevronRight size={12} />
        <span className="text-[#2D3A3A] font-medium">{country.name}</span>
      </div>

      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={country.image_url}
          alt={country.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-5"
        >
          <h1 className="font-gelica text-3xl text-white font-semibold uppercase tracking-wide leading-tight">
            {country.name}
          </h1>
          {country.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{country.description}</p>
          )}
        </motion.div>
      </div>

      {/* Regions */}
      <div className="px-4 pt-5 pb-6">
        <h2 className="font-gelica text-xl text-[#2D3A3A] mb-4">
          Regiões de {country.name}
        </h2>

        {regions.length === 0 ? (
          <p className="text-center py-8 text-neutral-400 text-sm">
            Nenhuma região cadastrada para este país.
          </p>
        ) : (
          <div className="space-y-3">
            {regions.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link to={`/region/${region.id}`}>
                  <div className="bg-[#FAFAF7] rounded-2xl overflow-hidden border border-black/[0.06]">
                    <div className="relative h-36">
                      <img
                        src={region.image_url}
                        alt={region.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-gelica text-xl text-white font-semibold uppercase tracking-wide">
                          {region.name}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <p className="text-sm text-neutral-500 flex-1 line-clamp-1">
                        {region.description || 'Ver coleções'}
                      </p>
                      <ChevronRight size={18} className="text-neutral-300 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
