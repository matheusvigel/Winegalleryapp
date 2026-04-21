import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Save, RefreshCw, Info } from 'lucide-react';
import { PROFILE_LABELS, PROFILE_ICONS, PROFILE_ORDER, type WineProfile } from '../../../lib/profileConstants';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Essencial', 'Fugir do óbvio', 'Ícones'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_META: Record<Category, { emoji: string; description: string; color: string }> = {
  'Essencial':      { emoji: '🌿', description: 'Base do aprendizado — vinhos clássicos e acessíveis', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Fugir do óbvio': { emoji: '🧭', description: 'Descobertas inesperadas — terroirs alternativos', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Ícones':         { emoji: '👑', description: 'Referências máximas — vinhos que definem estilos', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

// ── Types ────────────────────────────────────────────────────────────────────

type Rule = {
  profile: WineProfile;
  category: Category;
  priority: number;   // 1 = first shown
  visible: boolean;
};

type RuleMap = Record<WineProfile, Record<Category, { priority: number; visible: boolean }>>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildEmptyMap(): RuleMap {
  const map = {} as RuleMap;
  for (const profile of PROFILE_ORDER) {
    map[profile] = {} as Record<Category, { priority: number; visible: boolean }>;
    CATEGORIES.forEach((cat, i) => {
      map[profile][cat] = { priority: i + 1, visible: true };
    });
  }
  return map;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfileRules() {
  const [rules, setRules]     = useState<RuleMap>(buildEmptyMap());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<WineProfile | null>(null);
  const [saved, setSaved]     = useState<WineProfile | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profile_content_rules')
      .select('profile, category, priority, visible');

    if (data && data.length > 0) {
      const map = buildEmptyMap();
      for (const row of data as Rule[]) {
        if (map[row.profile] && CATEGORIES.includes(row.category as Category)) {
          map[row.profile][row.category as Category] = {
            priority: row.priority,
            visible:  row.visible,
          };
        }
      }
      setRules(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const updateRule = (profile: WineProfile, category: Category, field: 'priority' | 'visible', value: number | boolean) => {
    setRules(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        [category]: { ...prev[profile][category], [field]: value },
      },
    }));
  };

  const saveProfile = async (profile: WineProfile) => {
    setSaving(profile);
    const upserts = CATEGORIES.map(cat => ({
      profile,
      category: cat,
      priority: rules[profile][cat].priority,
      visible:  rules[profile][cat].visible,
      updated_at: new Date().toISOString(),
    }));
    await supabase
      .from('profile_content_rules')
      .upsert(upserts, { onConflict: 'profile,category' });
    setSaving(null);
    setSaved(profile);
    setTimeout(() => setSaved(null), 2000);
  };

  const saveAll = async () => {
    setSaving('novato'); // visual indicator
    const upserts = PROFILE_ORDER.flatMap(profile =>
      CATEGORIES.map(cat => ({
        profile,
        category: cat,
        priority: rules[profile][cat].priority,
        visible:  rules[profile][cat].visible,
        updated_at: new Date().toISOString(),
      }))
    );
    await supabase
      .from('profile_content_rules')
      .upsert(upserts, { onConflict: 'profile,category' });
    setSaving(null);
  };

  // For a given profile, return categories sorted by priority
  const sortedCats = (profile: WineProfile) =>
    [...CATEGORIES].sort((a, b) => rules[profile][a].priority - rules[profile][b].priority);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Perfis & Conteúdo</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Defina a prioridade e visibilidade de cada categoria para cada perfil de usuário
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={!!saving}
          className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-60"
        >
          <Save size={15} />
          Salvar tudo
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Prioridade</strong> define a ordem em que as categorias aparecem para esse perfil (1 = primeiro).
          <strong> Visível</strong> controla se a categoria é exibida ao usuário desse perfil.
          As regras são aplicadas no Explorar e nas listagens de coleções.
        </p>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${meta.color}`}>
              <span>{meta.emoji}</span>
              <span>{cat}</span>
              <span className="opacity-60">— {meta.description}</span>
            </div>
          );
        })}
      </div>

      {/* Profile cards */}
      <div className="space-y-4">
        {PROFILE_ORDER.map(profile => {
          const isSaving = saving === profile;
          const wasSaved = saved === profile;
          const sorted = sortedCats(profile);

          return (
            <div
              key={profile}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
            >
              {/* Profile header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PROFILE_ICONS[profile]}</span>
                  <div>
                    <p className="font-semibold text-neutral-900">{PROFILE_LABELS[profile]}</p>
                    <p className="text-xs text-neutral-500">
                      Ordem de exibição: {sorted.map(c => CATEGORY_META[c].emoji + ' ' + c).join(' → ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => saveProfile(profile)}
                  disabled={!!saving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    wasSaved
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  {wasSaved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>

              {/* Category rules grid */}
              <div className="grid grid-cols-3 divide-x divide-neutral-100">
                {CATEGORIES.map(cat => {
                  const rule = rules[profile][cat];
                  const meta = CATEGORY_META[cat];
                  const rank = rule.priority;

                  return (
                    <div
                      key={cat}
                      className={`p-4 transition-opacity ${!rule.visible ? 'opacity-40' : ''}`}
                    >
                      {/* Category label */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-xs font-semibold text-neutral-700">{cat}</span>
                      </div>

                      {/* Priority selector */}
                      <div className="mb-3">
                        <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide mb-1.5">
                          Prioridade
                        </p>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateRule(profile, cat, 'priority', n)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
                                rank === n
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-purple-400'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visible toggle */}
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide mb-1.5">
                          Visível
                        </p>
                        <button
                          type="button"
                          onClick={() => updateRule(profile, cat, 'visible', !rule.visible)}
                          className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${
                            rule.visible ? 'bg-purple-600' : 'bg-neutral-300'
                          }`}
                        >
                          <span
                            className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                              rule.visible ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visual preview of the priority order */}
              <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide mb-2">Preview da ordenação</p>
                <div className="flex gap-2">
                  {[1, 2, 3].map(rank => {
                    const cat = CATEGORIES.find(c => rules[profile][c].priority === rank);
                    if (!cat) return null;
                    const meta = CATEGORY_META[cat];
                    const isHidden = !rules[profile][cat].visible;
                    return (
                      <div
                        key={rank}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          isHidden
                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through'
                            : meta.color
                        }`}
                      >
                        <span className="font-bold opacity-60">{rank}.</span>
                        <span>{meta.emoji}</span>
                        <span>{cat}</span>
                        {isHidden && <span className="opacity-60">(oculto)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
