// ── Wine profile constants shared across the app ─────────────

export type WineProfile = 'novato' | 'curioso' | 'desbravador' | 'curador' | 'expert';
export type UserLevel   = 'recem_chegado' | 'em_ascensao' | 'destaque' | 'embaixador';
export type UserType    = 'normal' | 'admin';

export const PROFILE_LABELS: Record<WineProfile, string> = {
  novato:       'O Novato',
  curioso:      'Entusiasta Curioso',
  desbravador:  'Entusiasta Desbravador',
  curador:      'Entusiasta Curador',
  expert:       'Enófilo Expert',
};

export const PROFILE_ARCHETYPES: Record<WineProfile, string> = {
  novato:       'Primeira taça',
  curioso:      'Picado pela abelha',
  desbravador:  'Litragem em ascensão',
  curador:      'Paladar lapidado',
  expert:       'Mestre da taça',
};

export const PROFILE_ICONS: Record<WineProfile, string> = {
  novato:       '🌱',
  curioso:      '🐝',
  desbravador:  '🧭',
  curador:      '📖',
  expert:       '🏛️',
};

export const PROFILE_TAGLINES: Record<WineProfile, string> = {
  novato:       'Quero desbravar esse mundo, mas ainda sou novato aqui!',
  curioso:      'A abelha me picou — agora cada taça me ensina algo novo.',
  desbravador:  'Minha litragem me trouxe até aqui — e a estrada é longa.',
  curador:      'Muita litragem me ensinou exatamente o que me agrada.',
  expert:       'Vinho é arte, ciência e cultura — e eu vivo isso.',
};

export const PROFILE_COLORS: Record<WineProfile, { bg: string; text: string; border: string }> = {
  novato:       { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  curioso:      { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200'  },
  desbravador:  { bg: 'bg-red-50',      text: 'text-red-800',     border: 'border-red-200'     },
  curador:      { bg: 'bg-rose-50',     text: 'text-rose-800',    border: 'border-rose-200'    },
  expert:       { bg: 'bg-neutral-900', text: 'text-white',       border: 'border-neutral-700' },
};

export const LEVEL_LABELS: Record<UserLevel, string> = {
  recem_chegado: 'Recém chegado',
  em_ascensao:   'Em ascensão',
  destaque:       'Destaque',
  embaixador:     'Embaixador',
};

export const LEVEL_POINTS: Record<UserLevel, { min: number; max: number | null }> = {
  recem_chegado: { min: 0,   max: 29  },
  em_ascensao:   { min: 30,  max: 99  },
  destaque:       { min: 100, max: 299 },
  embaixador:     { min: 300, max: null },
};

export const PROFILE_ORDER: WineProfile[] = [
  'novato', 'curioso', 'desbravador', 'curador', 'expert',
];

/** Returns the level for a given total points value */
export function getLevelForPoints(points: number): UserLevel {
  if (points >= 300) return 'embaixador';
  if (points >= 100) return 'destaque';
  if (points >= 30)  return 'em_ascensao';
  return 'recem_chegado';
}

/** Returns the next profile in the chain, or null if already Expert */
export function getNextProfile(current: WineProfile): WineProfile | null {
  const idx = PROFILE_ORDER.indexOf(current);
  return idx < PROFILE_ORDER.length - 1 ? PROFILE_ORDER[idx + 1] : null;
}

/** Points awarded per action type */
export const ACTION_POINTS: Record<string, number> = {
  tried:            1,
  favorite:         1,
  review:           3,
  photo:            3,
  brotherhood_join: 5,
  follow:           5,
};
