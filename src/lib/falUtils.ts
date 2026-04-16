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

// ── Google Gemini models (Nano Banana family) ─────────────────────────────────
// We try models in order until one returns an image.
// gemini-3.1-flash-image-preview = Nano Banana 2 (best, image editing)
// gemini-2.0-flash-exp           = Gemini 2.0 Flash Exp (proven for image editing)
const MODELS_TO_TRY = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.0-flash-exp',
];

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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
      const commaIdx = result.indexOf(',');
      const base64   = result.slice(commaIdx + 1);
      const mimeType = result.slice(0, commaIdx).match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(blob);
  });
}

// ── Extract image part from Gemini response ───────────────────────────────────
// The REST API returns camelCase: { inlineData: { mimeType, data } }
// The SDK / some versions return snake_case: { inline_data: { mime_type, data } }
// We handle both.
function extractImagePart(parts: any[]): { base64: string; mime: string } | null {
  for (const p of parts) {
    // camelCase (standard REST response)
    if (p.inlineData?.data) {
      return { base64: p.inlineData.data, mime: p.inlineData.mimeType ?? 'image/png' };
    }
    // snake_case (some SDK / proxy responses)
    if (p.inline_data?.data) {
      return { base64: p.inline_data.data, mime: p.inline_data.mime_type ?? 'image/png' };
    }
  }
  return null;
}

// ── Call one model, return parsed image or null ───────────────────────────────
async function callGemini(
  model: string,
  geminiKey: string,
  base64: string,
  mimeType: string,
): Promise<{ base64: string; mime: string } | null> {
  const body = {
    contents: [
      {
        parts: [
          { text: WATERCOLOR_PROMPT },
          {
            // Send in camelCase — matches Google's canonical JSON format
            inlineData: { mimeType, data: base64 },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const res = await fetch(`${BASE}/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? `HTTP ${res.status}`;
    // 400/404 = model not available → try next; 403 = key issue → stop
    if (res.status === 403) throw new Error(`Chave sem permissão: ${msg}`);
    console.warn(`[Gemini] ${model} → ${res.status}: ${msg}`);
    return null;
  }

  const json = await res.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];

  console.log(`[Gemini] ${model} response parts:`, parts.map(p => Object.keys(p)));

  return extractImagePart(parts);
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Sends an image to Google Gemini (Nano Banana) to generate a watercolor version,
 * then re-uploads the result to Supabase Storage for a permanent URL.
 */
export async function transformToWatercolor(
  imageUrl: string,
  geminiKey: string,
  onStatus?: (msg: string) => void,
): Promise<string> {
  if (!geminiKey) throw new Error('Chave da API Google AI não configurada.');

  // 1. Convert source image to base64
  onStatus?.('Carregando imagem…');
  const { base64, mimeType } = await imageUrlToBase64(imageUrl);

  // 2. Try each model until one returns an image
  onStatus?.('Enviando para o Nano Banana…');
  let imagePart: { base64: string; mime: string } | null = null;
  let lastError = '';

  for (const model of MODELS_TO_TRY) {
    onStatus?.(`Gerando aquarela (${model})…`);
    try {
      imagePart = await callGemini(model, geminiKey, base64, mimeType);
      if (imagePart) break;
    } catch (e: any) {
      lastError = e.message;
      // 403 = key problem, no point trying next model
      if (e.message.includes('permissão')) throw e;
    }
  }

  if (!imagePart) {
    throw new Error(
      lastError ||
      'Nenhum modelo disponível retornou uma imagem. ' +
      'Certifique-se de que sua chave do Google AI Studio tem acesso a modelos de geração de imagem.'
    );
  }

  // 3. base64 → Blob → upload to Supabase Storage
  onStatus?.('Salvando versão aquarela…');
  const ext       = imagePart.mime.includes('jpeg') ? 'jpg' : 'png';
  const byteChars = atob(imagePart.base64);
  const byteArr   = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: imagePart.mime });

  const path = `${crypto.randomUUID()}/watercolor.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('wine-images')
    .upload(path, blob, { contentType: imagePart.mime });

  if (uploadErr) throw new Error(`Erro ao salvar: ${uploadErr.message}`);

  const { data } = supabase.storage.from('wine-images').getPublicUrl(path);
  return data.publicUrl;
}
