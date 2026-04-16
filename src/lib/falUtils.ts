import { fal } from '@fal-ai/client';
import { supabase } from './supabase';

// ── Storage key for persisting the API key in the browser ────────────────────
const LS_KEY = 'winegallery_fal_key';

export function getFalKey(): string {
  return (
    (import.meta.env.VITE_FAL_KEY as string | undefined) ||
    localStorage.getItem(LS_KEY) ||
    ''
  );
}

export function saveFalKey(key: string) {
  localStorage.setItem(LS_KEY, key.trim());
}

// ── Watercolor prompt ─────────────────────────────────────────────────────────
const WATERCOLOR_PROMPT =
  'Transform this wine bottle into an elegant watercolor illustration art. ' +
  'Use a dark dramatic background (near black). Apply expressive, loose watercolor ' +
  'brushstrokes with soft painterly texture and translucent color layers. ' +
  'Preserve the bottle shape, label typography, brand name, and all label details accurately. ' +
  'Romantic, sophisticated fine-art wine illustration style — the same bottle, ' +
  'reimagined as a hand-painted watercolor artwork.';

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Sends an image to Nano Banana Pro (via fal.ai) to generate a watercolor version,
 * then re-uploads the result to Supabase Storage for a permanent URL.
 *
 * @param imageUrl   Public URL of the source image (Supabase or external)
 * @param falKey     fal.ai API key
 * @param onStatus   Optional callback to report progress strings
 * @returns          Public Supabase Storage URL of the watercolor image
 */
export async function transformToWatercolor(
  imageUrl: string,
  falKey: string,
  onStatus?: (msg: string) => void,
): Promise<string> {
  if (!falKey) throw new Error('Chave da API fal.ai não configurada.');

  fal.config({ credentials: falKey });

  onStatus?.('Enviando imagem para o modelo…');

  let outputUrl: string | undefined;

  try {
    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt: WATERCOLOR_PROMPT,
        image_urls: [imageUrl],
        output_format: 'png',
        resolution: '2K',
        num_images: 1,
      },
      logs: true,
      onQueueUpdate(update) {
        if (update.status === 'IN_PROGRESS') onStatus?.('Gerando aquarela…');
        if (update.status === 'IN_QUEUE')    onStatus?.('Na fila…');
      },
    });

    outputUrl = (result.data as any)?.images?.[0]?.url;
  } catch (err: any) {
    // Try to surface a readable message from the fal.ai error
    const msg =
      err?.body?.detail?.[0]?.msg ??
      err?.message ??
      'Erro na API fal.ai';
    throw new Error(msg);
  }

  if (!outputUrl) throw new Error('Nenhuma imagem retornada pela API.');

  // ── Re-upload to Supabase Storage for a permanent URL ─────────────────────
  onStatus?.('Salvando versão aquarela…');

  const fetchRes = await fetch(outputUrl);
  if (!fetchRes.ok) throw new Error('Não foi possível baixar a imagem gerada.');
  const blob = await fetchRes.blob();

  const path = `${crypto.randomUUID()}/watercolor.png`;
  const { error: uploadErr } = await supabase.storage
    .from('wine-images')
    .upload(path, blob, { contentType: 'image/png' });

  if (uploadErr) throw new Error(`Erro ao salvar: ${uploadErr.message}`);

  const { data } = supabase.storage.from('wine-images').getPublicUrl(path);
  return data.publicUrl;
}
