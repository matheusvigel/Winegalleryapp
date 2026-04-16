import { supabase } from './supabase';

// ── Storage key for persisting the Google AI key in the browser ───────────────
const LS_KEY = 'winegallery_gemini_key';

// Exported as getFalKey/saveFalKey to keep ImageUpload.tsx unchanged
export function getFalKey(): string {
  return (
    (import.meta.env.VITE_GEMINI_KEY as string | undefined) ||
    localStorage.getItem(LS_KEY) ||
    ''
  );
}

export function saveFalKey(key: string) {
  localStorage.setItem(LS_KEY, key.trim());
}

// ── Google Gemini model (Nano Banana) ─────────────────────────────────────────
// gemini-2.5-flash-image = Nano Banana (stable)
// gemini-3.1-flash-image-preview = Nano Banana 2 (newer preview)
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Watercolor prompt ─────────────────────────────────────────────────────────
const WATERCOLOR_PROMPT =
  'Transform this wine bottle into an elegant watercolor illustration art. ' +
  'Use a dark dramatic background (near black). Apply expressive, loose watercolor ' +
  'brushstrokes with soft painterly texture and translucent color layers. ' +
  'Preserve the bottle shape, label typography, brand name, and all label details accurately. ' +
  'Romantic, sophisticated fine-art wine illustration style — the same bottle, ' +
  'reimagined as a hand-painted watercolor artwork.';

// ── Helper: fetch any URL and return base64 + mimeType ───────────────────────
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível carregar a imagem (${res.status}).`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result = "data:<mimeType>;base64,<data>"
      const commaIdx = result.indexOf(',');
      const header   = result.slice(0, commaIdx);          // "data:image/jpeg;base64"
      const base64   = result.slice(commaIdx + 1);         // "<data>"
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(blob);
  });
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Sends an image to Google Gemini (Nano Banana) to generate a watercolor version,
 * then re-uploads the result to Supabase Storage for a permanent URL.
 *
 * @param imageUrl   Public URL of the source image (Supabase or external)
 * @param geminiKey  Google AI Studio API key (aistudio.google.com/app/apikey)
 * @param onStatus   Optional callback to report progress strings
 * @returns          Public Supabase Storage URL of the watercolor image
 */
export async function transformToWatercolor(
  imageUrl: string,
  geminiKey: string,
  onStatus?: (msg: string) => void,
): Promise<string> {
  if (!geminiKey) throw new Error('Chave da API Google AI não configurada.');

  // 1. Fetch source image and convert to base64
  onStatus?.('Carregando imagem…');
  const { base64, mimeType } = await imageUrlToBase64(imageUrl);

  // 2. Call Gemini image editing API
  onStatus?.('Enviando para o Nano Banana…');
  const body = {
    contents: [
      {
        parts: [
          { text: WATERCOLOR_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const apiRes = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(geminiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!apiRes.ok) {
    let detail = '';
    try {
      const json = await apiRes.json();
      detail = json?.error?.message ?? '';
    } catch { /* ignore */ }
    throw new Error(
      detail ||
      (apiRes.status === 400 ? 'Chave inválida ou modelo não disponível.' :
       apiRes.status === 403 ? 'Chave sem permissão para geração de imagens. Verifique no Google AI Studio.' :
       `Erro da API Google (${apiRes.status}).`)
    );
  }

  onStatus?.('Gerando aquarela…');
  const json = await apiRes.json();

  // 3. Extract base64 image from response
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: any) => p.inline_data?.mime_type?.startsWith('image/'));

  if (!imagePart) {
    // Sometimes the model returns only text (safety block, etc.)
    const textPart = parts.find((p: any) => p.text);
    throw new Error(textPart?.text ?? 'Nenhuma imagem foi gerada. Tente novamente.');
  }

  const resultBase64: string = imagePart.inline_data.data;
  const resultMime: string   = imagePart.inline_data.mime_type ?? 'image/png';
  const ext = resultMime.includes('jpeg') ? 'jpg' : 'png';

  // 4. Convert base64 → Blob → upload to Supabase Storage
  onStatus?.('Salvando versão aquarela…');
  const byteChars = atob(resultBase64);
  const byteArr   = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: resultMime });

  const path = `${crypto.randomUUID()}/watercolor.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('wine-images')
    .upload(path, blob, { contentType: resultMime });

  if (uploadErr) throw new Error(`Erro ao salvar: ${uploadErr.message}`);

  const { data } = supabase.storage.from('wine-images').getPublicUrl(path);
  return data.publicUrl;
}
