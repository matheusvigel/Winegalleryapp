import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Country = { id: string; name: string; image_url: string; description: string };
type Collection = { id: string; title: string; cover_image: string };
type Region = { id: string; name: string; image_url: string; description: string };

export default function CountryDetail() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const regionsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countryId) return;
    const load = async () => {
      const [{ data: ct }, { data: regs }] = await Promise.all([
        supabase.from('countries').select('*').eq('id', countryId).single(),
        supabase.from('regions')
          .select('id, name, image_url, description')
          .eq('country_id', countryId)
          .is('parent_id', null)
          .order('name'),
      ]);

      setCountry(ct);
      const regionList = regs ?? [];
      setRegions(regionList);

      if (regionList.length > 0) {
        const regionIds = regionList.map(r => r.id);
        const { data: rcLinks } = await supabase
          .from('region_collections')
          .select('collection_id')
          .in('region_id', regionIds);

        const collectionIds = [...new Set((rcLinks ?? []).map(r => r.collection_id))];
        if (collectionIds.length > 0) {
          const { data: cols } = await supabase
            .from('collections')
            .select('id, title, cover_image')
            .in('id', collectionIds)
            .order('created_at', { ascending: false })
            .limit(6);
          setCollections(cols ?? []);
        }
      }

      setLoading(false);
    };
    load();
  }, [countryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-64 bg-neutral-200 animate-pulse" />
        <div className="px-4 pt-6 space-y-4">
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
    <div className="min-h-screen bg-white">
      {/* Hero image */}
      <div className="relative h-64">
        <img src={country.image_url} alt={country.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/65" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeft size={20} className="text-neutral-900" />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-3xl font-bold text-white">{country.name}</h1>
          {country.description && (
            <p className="text-white/80 text-sm mt-1">{country.description}</p>
          )}
        </div>
      </div>

      {/* Últimas coleções do País */}
      {collections.length > 0 && (
        <section className="px-4 pt-6 pb-5">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Últimas coleções<br />de {country.name}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {collections.map(col => (
              <div key={col.id}>
                <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200">
                  <img src={col.cover_image} alt={col.title} className="w-full h-full object-cover" />
                </div>
                <p className="mt-1.5 text-sm text-neutral-800">{col.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regiões do País */}
      {regions.length > 0 && (
        <section className="pb-8">
          <h2 className="px-4 text-xl font-bold text-neutral-900 mb-4">
            Regiões de {country.name}
          </h2>
          <div
            ref={regionsScrollRef}
            className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
          >
            {regions.map(region => (
              <Link key={region.id} to={`/region/${region.id}`} className="flex-shrink-0 w-48">
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <img src={region.image_url} alt={region.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm leading-tight">{region.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && regions.length === 0 && (
        <p className="text-center py-16 text-neutral-400 text-sm">Nenhum conteúdo cadastrado ainda.</p>
      )}
    </div>
  );
}
