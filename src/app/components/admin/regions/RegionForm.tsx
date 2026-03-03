import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchRegion, createRegion, updateRegion } from '../../../../lib/services/regionService';
import { fetchCountries, CountryRow } from '../../../../lib/services/countryService';

export default function RegionForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({ name: '', country_id: '', description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries().then(setCountries);
    if (isEdit) {
      fetchRegion(id!).then(row => {
        if (row) setValues({ name: row.name, country_id: row.country_id, description: row.description ?? '', image_url: row.image_url ?? '' });
      });
    }
  }, [id]);

  const fields = [
    { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: Bordeaux' },
    {
      name: 'country_id',
      label: 'País',
      type: 'select' as const,
      required: true,
      options: countries.map(c => ({ value: c.id, label: c.name })),
    },
    { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição da região...' },
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
        country_id: values.country_id,
        description: values.description || null,
        image_url: values.image_url || null,
      };
      if (isEdit) {
        await updateRegion(id!, payload);
      } else {
        await createRegion(payload);
      }
      navigate('/admin/regions');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar região.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar Região' : 'Nova Região'}
      backTo="/admin/regions"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
