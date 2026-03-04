import { useRef, useState } from 'react';
import { processAndUpload } from '../../../lib/imageUtils';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }

    setUploading(true);
    setError('');
    setProgress('Processando...');

    try {
      setProgress('Convertendo para WebP...');
      const url = await processAndUpload(file);
      onChange(url);
      setProgress('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      // Friendly message for missing bucket
      if (msg.includes('Bucket not found') || msg.includes('bucket')) {
        setError('Bucket "wine-images" não encontrado no Supabase Storage. Crie-o primeiro.');
      } else {
        setError(`Erro no upload: ${msg}`);
      }
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`relative w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
          uploading
            ? 'border-neutral-300 bg-neutral-50 cursor-not-allowed'
            : value
            ? 'border-neutral-300 hover:border-red-400'
            : 'border-neutral-300 hover:border-red-400 bg-neutral-50'
        }`}
        style={{ minHeight: 140 }}
      >
        {value ? (
          <>
            {/* Preview */}
            <img
              src={value}
              alt="Preview"
              className="w-full h-40 object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Trocar imagem</span>
            </div>
            {/* Clear button */}
            {!uploading && (
              <button
                type="button"
                onClick={clear}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-36 gap-2 text-neutral-400 px-4">
            <ImagePlus size={28} />
            <p className="text-sm text-center">
              Clique ou arraste uma imagem
            </p>
            <p className="text-xs text-neutral-400">
              PNG, JPG, GIF → convertida para WebP
            </p>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="animate-spin text-red-800" />
            <p className="text-sm text-neutral-600">{progress}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {value && !uploading && (
        <p className="text-xs text-neutral-400 truncate" title={value}>
          {value}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
