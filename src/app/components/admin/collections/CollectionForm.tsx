import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchCollection, createCollection, updateCollection } from '../../../../lib/services/collectionService';
import { fetchRegions, RegionRow } from '../../../../lib/services/regionService';
import { fetchBrands, BrandRow } from '../../../../lib/services/brandService';
import { fetchGrapes, GrapeRow } from '../../../../lib/services/grapeService';

export default function CollectionForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [grapes, setGrapes] = useState<GrapeRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({
    title: '', description: '', level: 'essential', cover_image: '',
    region_id: '', brand_id: '', grape_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchRegions(), fetchBrands(), fetchGrapes()]).then(([r, b, g]) => {
      setRegions(r);
      setBrands(b);
      setGrapes(g);
    });
    if (isEdit) {
      fetchCollection(id!).then(row => {
        if (row) setValues({
          title: row.title,
          description: row.description ?? '',
          level: row.level,
          cover_image: row.cover_image ?? '',
          region_id: row.region_id ?? '',
          brand_id: row.brand_id ?? '',
          grape_id: row.grape_id ?? '',
        });
      });
    }
  }, [id]);

  const fields = [
    { name: 'title', label: 'Título', required: true, placeholder: 'Ex: Os Grandes Châteaux' },
    {
      name: 'level',
      label: 'Nível',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'essential', label: 'Essencial' },
        { value: 'escape', label: 'Escape' },
        { value: 'icon', label: 'Icon' },
      ],
    },
    {
      name: 'region_id',
      label: 'Região (opcional)',
      type: 'select' as const,
      options: regions.map(r => ({ value: r.id, label: r.name })),
    },
    {
      name: 'brand_id',
      label: 'Marca (opcional)',
      type: 'select' as const,
      options: brands.map(b => ({ value: b.id, label: b.name })),
    },
    {
      name: 'grape_id',
      label: 'Uva (opcional)',
      type: 'select' as const,
      options: grapes.map(g => ({ value: g.id, label: g.name })),
    },
    { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição da coleção...' },
    { name: 'cover_image', label: 'URL da Imagem de Capa', type: 'url' as const, placeholder: 'https://...' },
  ];

  function handleChange(name: string, value: string) {
    setValues(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        level: values.level as 'essential' | 'escape' | 'icon',
        cover_image: values.cover_image || null,
        total_points: 0,
        region_id: values.region_id || null,
        brand_id: values.brand_id || null,
        grape_id: values.grape_id || null,
      };
      if (isEdit) {
        await updateCollection(id!, payload);
      } else {
        await createCollection(payload);
      }
      navigate('/admin/collections');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar coleção.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar Coleção' : 'Nova Coleção'}
      backTo="/admin/collections"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
