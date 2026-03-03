import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AdminFormPage from '../AdminFormPage';
import { fetchGrape, createGrape, updateGrape } from '../../../../lib/services/grapeService';

const fields = [
  { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: Cabernet Sauvignon' },
  {
    name: 'type',
    label: 'Tipo',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'red', label: 'Uva Tinta' },
      { value: 'white', label: 'Uva Branca' },
    ],
  },
  { name: 'characteristics', label: 'Características', type: 'textarea' as const, placeholder: 'Corpo, taninos, notas aromáticas...' },
  { name: 'description', label: 'Descrição', type: 'textarea' as const, placeholder: 'Breve descrição da uva...' },
  { name: 'image_url', label: 'URL da Imagem', type: 'url' as const, placeholder: 'https://...' },
];

export default function GrapeForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<Record<string, string>>({ name: '', type: 'red', characteristics: '', description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchGrape(id!).then(row => {
      if (row) setValues({ name: row.name, type: row.type, characteristics: row.characteristics ?? '', description: row.description ?? '', image_url: row.image_url ?? '' });
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
        type: values.type as 'red' | 'white',
        characteristics: values.characteristics || null,
        description: values.description || null,
        image_url: values.image_url || null,
      };
      if (isEdit) {
        await updateGrape(id!, payload);
      } else {
        await createGrape(payload);
      }
      navigate('/admin/grapes');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar uva.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormPage
      heading={isEdit ? 'Editar Uva' : 'Nova Uva'}
      backTo="/admin/grapes"
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      saving={saving}
      error={error}
    />
  );
}
