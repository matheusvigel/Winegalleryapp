import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchCountry, createCountry, updateCountry } from '../../../../lib/services/countryService';

const fields = [
  { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: França' },
  { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição do país...' },
  { name: 'image_url', label: 'URL da Imagem', type: 'url' as const, placeholder: 'https://...' },
];

export default function CountryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<Record<string, string>>({ name: '', description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchCountry(id!).then(row => {
      if (row) setValues({ name: row.name, description: row.description ?? '', image_url: row.image_url ?? '' });
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
      if (isEdit) {
        await updateCountry(id!, { name: values.name, description: values.description || null, image_url: values.image_url || null });
      } else {
        await createCountry({ name: values.name, description: values.description || null, image_url: values.image_url || null });
      }
      navigate('/admin/countries');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar país.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar País' : 'Novo País'}
      backTo="/admin/countries"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
