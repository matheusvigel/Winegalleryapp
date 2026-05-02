// Claude Vision — extract structured wine data from a label photo

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY as string | undefined;

export interface WineLabelData {
  wine_name:   string | null;
  winery_name: string | null;
  vintage:     string | null;
  wine_type:   string | null;
}

export async function extractWineLabel(file: File): Promise<WineLabelData> {
  if (!ANTHROPIC_KEY) throw new Error('VITE_ANTHROPIC_KEY not set');

  const base64 = await fileToBase64(file);
  const mediaType = normalizeMediaType(file.type);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: 'This is a wine bottle label. Respond with ONLY a JSON object — no explanation, no markdown:\n{"wine_name":"...","winery_name":"...","vintage":"...","wine_type":"..."}\nUse null for any field not visible. wine_type must be one of: Tinto, Branco, Rosé, Espumante, Fortificado, Laranja, Sobremesa.',
          },
        ],
      }],
    }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);

  const text: string = json?.content?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');

  return JSON.parse(match[0]) as WineLabelData;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeMediaType(type: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (type === 'image/png')  return 'image/png';
  if (type === 'image/gif')  return 'image/gif';
  if (type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}
