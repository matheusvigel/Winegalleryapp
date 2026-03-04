import { supabase } from './supabase';

const BUCKET = 'wine-images';
const MAX_SIDE = 1200;   // px — longer side of the main image
const THUMB_SIZE = 400;  // px — square thumbnail
const QUALITY = 0.85;
const THUMB_QUALITY = 0.80;

/** Loads a File into an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')); };
    img.src = url;
  });
}

/** Converts a canvas to a Blob. */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Falha ao converter canvas'))),
      type,
      quality,
    );
  });
}

/**
 * Processes a File:
 * - Resizes to MAX_SIDE (longest side) and converts to WebP
 * - Creates a THUMB_SIZE × THUMB_SIZE square thumbnail in WebP
 * - Uploads both to Supabase Storage
 * - Returns the public URL of the main image
 *   (thumbnail URL = mainUrl.replace('image.webp', 'thumb.webp'))
 */
export async function processAndUpload(file: File): Promise<string> {
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;

  // ── Main image ────────────────────────────────────────────────────────────
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const mainW = Math.round(w * scale);
  const mainH = Math.round(h * scale);

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = mainW;
  mainCanvas.height = mainH;
  mainCanvas.getContext('2d')!.drawImage(img, 0, 0, mainW, mainH);
  const mainBlob = await canvasToBlob(mainCanvas, 'image/webp', QUALITY);

  // ── Thumbnail (center-crop square) ────────────────────────────────────────
  const thumbScale = Math.max(THUMB_SIZE / w, THUMB_SIZE / h);
  const srcW = THUMB_SIZE / thumbScale;
  const srcH = THUMB_SIZE / thumbScale;
  const srcX = (w - srcW) / 2;
  const srcY = (h - srcH) / 2;

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = THUMB_SIZE;
  thumbCanvas.height = THUMB_SIZE;
  thumbCanvas.getContext('2d')!.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, THUMB_SIZE, THUMB_SIZE);
  const thumbBlob = await canvasToBlob(thumbCanvas, 'image/webp', THUMB_QUALITY);

  // ── Upload ────────────────────────────────────────────────────────────────
  const id = crypto.randomUUID();
  const mainPath = `${id}/image.webp`;
  const thumbPath = `${id}/thumb.webp`;

  const [main, thumb] = await Promise.all([
    supabase.storage.from(BUCKET).upload(mainPath, mainBlob, { contentType: 'image/webp' }),
    supabase.storage.from(BUCKET).upload(thumbPath, thumbBlob, { contentType: 'image/webp' }),
  ]);

  if (main.error) throw new Error(main.error.message);
  if (thumb.error) throw new Error(thumb.error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
  return data.publicUrl;
}

/** Derives the thumbnail URL from a main image URL produced by processAndUpload. */
export function thumbUrl(imageUrl: string): string {
  return imageUrl.replace('/image.webp', '/thumb.webp');
}
