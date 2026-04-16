import { useRef, useState } from 'react';
import { processAndUpload } from '../../../lib/imageUtils';
import { ImagePlus, X, Loader2, Link, Upload } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

type Mode = 'file' | 'url';

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [mode, setMode] = useState<Mode>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      setError('Selecione um arquivo de imagem.');
      return;
    }
    setUploading(true);
    setError('');
    const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
    setProgress(isHeic ? 'Convertendo HEIC...' : 'Processando...');
    try {
      setProgress('Enviando para o servidor...');
      const url = await processAndUpload(file);
      onChange(url);
      setProgress('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
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

  // ── External URL ───────────────────────────────────────────────────────────
  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      setError('');
      setUrlPreviewError(false);
      onChange(trimmed);
      setUrlInput('');
    } catch {
      setError('URL inválida. Use o formato https://...');
    }
  };

  // ── Clear ──────────────────────────────────────────────────────────────────
  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUrlInput('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Render: preview when a value is already set ────────────────────────────
  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 group">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => { onChange(''); setMode('file'); }}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-neutral-800 text-xs font-medium rounded-lg transition-colors"
            >
              Trocar imagem
            </button>
          </div>
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-neutral-400 truncate" title={value}>{value}</p>
      </div>
    );
  }

  // ── Render: no value — show mode toggle + upload/url UI ───────────────────
  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setMode('file'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'file' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Upload size={13} /> Arquivo
        </button>
        <button
          type="button"
          onClick={() => { setMode('url'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'url' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Link size={13} /> URL externa
        </button>
      </div>

      {/* File upload zone */}
      {mode === 'file' && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className={`relative w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
            uploading
              ? 'border-neutral-300 bg-neutral-50 cursor-not-allowed'
              : 'border-neutral-300 hover:border-purple-400 bg-neutral-50'
          }`}
          style={{ minHeight: 120 }}
        >
          <div className="flex flex-col items-center justify-center h-28 gap-2 text-neutral-400 px-4">
            <ImagePlus size={26} />
            <p className="text-sm text-center">Clique ou arraste uma imagem</p>
            <p className="text-xs text-neutral-400">PNG, JPG, GIF, HEIC → convertida para WebP</p>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
              <Loader2 size={22} className="animate-spin text-purple-600" />
              <p className="text-sm text-neutral-600">{progress}</p>
            </div>
          )}
        </div>
      )}

      {/* URL input */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlPreviewError(false); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
              placeholder="https://exemplo.com/imagem.jpg"
              className="flex-1 h-10 px-3 rounded-lg border border-neutral-300 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 bg-white"
            />
            <button
              type="button"
              onClick={applyUrl}
              disabled={!urlInput.trim()}
              className="px-4 h-10 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors shrink-0"
            >
              Usar
            </button>
          </div>
          {/* URL preview */}
          {urlInput && !urlPreviewError && (
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
              <img
                src={urlInput}
                alt="Preview"
                className="w-full h-32 object-cover"
                onError={() => setUrlPreviewError(true)}
              />
            </div>
          )}
          {urlInput && urlPreviewError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              Não foi possível carregar o preview. Verifique se a URL é pública e aponta para uma imagem.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
