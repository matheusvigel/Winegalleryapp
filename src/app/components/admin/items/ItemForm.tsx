import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchItem, createItem, updateItem } from '../../../../lib/services/itemService';
import { fetchBrands, BrandRow } from '../../../../lib/services/brandService';

export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({
    name: '', description: '', type: 'wine', level: 'essential',
    points: '10', image_url: '', brand_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands().then(setBrands);
    if (isEdit) {
      fetchItem(id!).then(row => {
        if (row) setValues({
          name: row.name,
          description: row.description ?? '',
          type: row.type,
          level: row.level,
          points: String(row.points),
          image_url: row.image_url ?? '',
          brand_id: row.brand_id ?? '',
        });
      });
    }
  }, [id]);

  const fields = [
    { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: Château Margaux 2018' },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'wine', label: 'Vinho' },
        { value: 'winery', label: 'Vinícola' },
      ],
    },
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
    { name: 'points', label: 'Pontos', placeholder: '10', required: true },
    {
      name: 'brand_id',
      label: 'Marca (opcional)',
      type: 'select' as const,
      options: brands.map(b => ({ value: b.id, label: b.name })),
    },
    { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição do vinho ou vinícola...' },
    { name: 'image_url', label: 'URL da Imagem', type: 'url' as const, placeholder: 'https://...' },
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
        name: values.name,
        description: values.description || null,
        type: values.type as 'wine' | 'winery',
        level: values.level as 'essential' | 'escape' | 'icon',
        points: parseInt(values.points) || 10,
        image_url: values.image_url || null,
        brand_id: values.brand_id || null,
      };
      if (isEdit) {
        await updateItem(id!, payload);
      } else {
        await createItem(payload);
      }
      navigate('/admin/items');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar Item' : 'Novo Item'}
      backTo="/admin/items"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
