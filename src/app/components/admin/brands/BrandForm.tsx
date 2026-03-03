import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchBrand, createBrand, updateBrand } from '../../../../lib/services/brandService';

const fields = [
  { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: Dom Pérignon' },
  { name: 'country', label: 'País', placeholder: 'Ex: França' },
  { name: 'region', label: 'Região', placeholder: 'Ex: Champagne' },
  { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição da marca...' },
  { name: 'image_url', label: 'URL da Imagem', type: 'url' as const, placeholder: 'https://...' },
];

export default function BrandForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<Record<string, string>>({ name: '', country: '', region: '', description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchBrand(id!).then(row => {
      if (row) setValues({ name: row.name, country: row.country ?? '', region: row.region ?? '', description: row.description ?? '', image_url: row.image_url ?? '' });
    });
  }, [id]);

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
        country: values.country || null,
        region: values.region || null,
        description: values.description || null,
        image_url: values.image_url || null,
      };
      if (isEdit) {
        await updateBrand(id!, payload);
      } else {
        await createBrand(payload);
      }
      navigate('/admin/brands');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar marca.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar Marca' : 'Nova Marca'}
      backTo="/admin/brands"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
