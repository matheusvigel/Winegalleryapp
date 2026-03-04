import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
        supabase.from('regions').select('id, name, image_url, description')
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
      <div className="min-h-screen bg-neutral-50">
        <div className="h-64 bg-neutral-200 animate-pulse" />
        <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-neutral-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">País não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="relative h-64">
        <img src={country.image_url} alt={country.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <Link to="/" className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors">
          <ArrowLeft size={24} className="text-neutral-900" />
        </Link>
        <div className="absolute bottom-6 left-6 right-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white mb-2">{country.name}</h1>
            <p className="text-neutral-200 text-sm">{country.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Regions List */}
      <div className="max-w-lg mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Regiões de {country.name}</h2>
        {regions.length === 0 ? (
          <p className="text-center py-8 text-neutral-400 text-sm">Nenhuma região cadastrada para este país.</p>
        ) : (
          <div className="space-y-4">
            {regions.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={`/region/${region.id}`}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-32">
                      <img src={region.image_url} alt={region.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{region.name}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <p className="text-sm text-neutral-600 flex-1">{region.description}</p>
                      <ChevronRight size={20} className="text-neutral-400 ml-2 flex-shrink-0" />
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
