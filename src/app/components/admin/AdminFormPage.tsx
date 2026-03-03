import { Link } from 'react-router';
import { ChevronLeft, Loader2 } from 'lucide-react';

type FieldDef = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'url';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
};

type Props = {
  heading: string;
  backTo: string;
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  submitLabel?: string;
};

export default function AdminFormPage({
  heading,
  backTo,
  fields,
  values,
  onChange,
  onSubmit,
  saving,
  error,
  submitLabel = 'Salvar',
}: Props) {
  const inputBase =
    'w-full bg-neutral-800 text-white rounded-xl px-4 py-3 text-sm outline-none border-2 border-transparent focus:border-red-700 transition-colors placeholder:text-neutral-600';

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pt-2">
        <Link to={backTo} className="p-2 -ml-2 rounded-xl hover:bg-neutral-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-neutral-400" />
        </Link>
        <h1 className="text-xl font-bold text-white">{heading}</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/40 border border-red-800 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm text-neutral-400 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={e => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={field.rows ?? 3}
                className={`${inputBase} resize-none`}
              />
            ) : field.type === 'select' ? (
              <select
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={e => onChange(field.name, e.target.value)}
                required={field.required}
                className={inputBase}
              >
                <option value="">Selecione...</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'url' ? 'url' : 'text'}
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={e => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className={inputBase}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-red-800 hover:bg-red-700 disabled:bg-neutral-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Salvando...' : submitLabel}
        </button>
      </form>
    </div>
  );
}
