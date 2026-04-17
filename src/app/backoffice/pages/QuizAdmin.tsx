import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
import { PROFILE_LABELS, PROFILE_ICONS, type WineProfile } from '../../../lib/profileConstants';

type QuizOption = {
  id: string;
  letter: string;
  option_text: string;
  profile_key: WineProfile;
  weight: number;
};

type QuizQuestion = {
  id: string;
  flow: 'situacoes' | 'habitos' | 'conexao';
  position: number;
  question: string;
  context: string | null;
  active: boolean;
  options: QuizOption[];
};

const FLOW_LABELS = {
  situacoes:  { label: 'Situações',  emoji: '🍽️' },
  habitos:    { label: 'Hábitos',    emoji: '🍷' },
  conexao:    { label: 'Conexão',    emoji: '💫' },
};

const PROFILES: WineProfile[] = ['novato', 'curioso', 'desbravador', 'curador', 'expert'];

export default function QuizAdmin() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [editingQ, setEditingQ]   = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [error, setError]         = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQ, setNewQ] = useState({ flow: 'situacoes' as QuizQuestion['flow'], question: '', context: '' });

  const load = async () => {
    setLoading(true);
    const { data: qs } = await supabase
      .from('quiz_questions')
      .select('*, options:quiz_options(*)')
      .order('flow')
      .order('position');
    if (qs) {
      setQuestions(qs.map((q: any) => ({
        ...q,
        options: [...(q.options ?? [])].sort((a: QuizOption, b: QuizOption) =>
          a.letter.localeCompare(b.letter)
        ),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activePerFlow = (flow: string) =>
    questions.filter(q => q.flow === flow && q.active).length;

  const toggleActive = async (q: QuizQuestion) => {
    // Max 5 active per flow — but we allow toggling off always
    if (!q.active && activePerFlow(q.flow) >= 5) {
      setError(`Já existem 5 perguntas ativas no fluxo "${FLOW_LABELS[q.flow].label}". Desative outra primeiro.`);
      return;
    }
    setSaving(q.id);
    const { error } = await supabase
      .from('quiz_questions')
      .update({ active: !q.active })
      .eq('id', q.id);
    if (!error) setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, active: !x.active } : x));
    else setError(error.message);
    setSaving(null);
  };

  const movePosition = async (q: QuizQuestion, dir: -1 | 1) => {
    const inFlow = questions.filter(x => x.flow === q.flow).sort((a, b) => a.position - b.position);
    const idx    = inFlow.findIndex(x => x.id === q.id);
    const swap   = inFlow[idx + dir];
    if (!swap) return;

    setSaving(q.id);
    await Promise.all([
      supabase.from('quiz_questions').update({ position: swap.position }).eq('id', q.id),
      supabase.from('quiz_questions').update({ position: q.position  }).eq('id', swap.id),
    ]);
    setQuestions(prev => prev.map(x => {
      if (x.id === q.id)   return { ...x, position: swap.position };
      if (x.id === swap.id) return { ...x, position: q.position   };
      return x;
    }));
    setSaving(null);
  };

  const saveEditQuestion = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from('quiz_questions')
      .update({ question: editDraft })
      .eq('id', id);
    if (!error) {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: editDraft } : q));
      setEditingQ(null);
    } else setError(error.message);
    setSaving(null);
  };

  const updateOptionProfile = async (optId: string, qId: string, profile: WineProfile, weight: number) => {
    setSaving(optId);
    const { error } = await supabase
      .from('quiz_options')
      .update({ profile_key: profile, weight })
      .eq('id', optId);
    if (!error) {
      setQuestions(prev => prev.map(q => q.id === qId
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, profile_key: profile, weight } : o) }
        : q
      ));
    } else setError(error.message);
    setSaving(null);
  };

  const createQuestion = async () => {
    if (!newQ.question.trim()) return;
    const maxPos = questions.filter(q => q.flow === newQ.flow)
      .reduce((m, q) => Math.max(m, q.position), 0);
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({ flow: newQ.flow, question: newQ.question, context: newQ.context || null, position: maxPos + 1, active: false })
      .select()
      .single();
    if (!error && data) {
      setQuestions(prev => [...prev, { ...data, options: [] }]);
      setNewQ({ flow: 'situacoes', question: '', context: '' });
      setShowNewForm(false);
    } else if (error) setError(error.message);
  };

  const grouped = (['situacoes', 'habitos', 'conexao'] as const).map(flow => ({
    flow,
    qs: questions.filter(q => q.flow === flow).sort((a, b) => a.position - b.position),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Questionário de Onboarding</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gerencie as perguntas do quiz de perfil. Máx. 5 ativas por fluxo.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
        >
          <Plus size={16} /> Nova Pergunta
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X size={14} /></button>
        </p>
      )}

      {/* New question form */}
      {showNewForm && (
        <div className="mb-6 bg-white border border-purple-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-neutral-900">Nova pergunta</h3>
          <div className="flex gap-3">
            <select
              value={newQ.flow}
              onChange={e => setNewQ(f => ({ ...f, flow: e.target.value as QuizQuestion['flow'] }))}
              className="h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 bg-white"
            >
              {Object.entries(FLOW_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newQ.context}
              onChange={e => setNewQ(f => ({ ...f, context: e.target.value }))}
              placeholder="Cenário (ex: em casa)"
              className="h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 flex-shrink-0 w-48 bg-white"
            />
          </div>
          <input
            type="text"
            value={newQ.question}
            onChange={e => setNewQ(f => ({ ...f, question: e.target.value }))}
            placeholder="Texto da pergunta…"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 bg-white"
          />
          <p className="text-xs text-neutral-400">
            Após criar a pergunta, adicione as 5 opções (a–e) diretamente no banco de dados ou edite manualmente.
          </p>
          <div className="flex gap-2">
            <button onClick={createQuestion} className="px-4 h-9 bg-purple-700 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors">
              Criar
            </button>
            <button onClick={() => setShowNewForm(false)} className="px-4 h-9 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-16 text-neutral-400 text-sm">Carregando…</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ flow, qs }) => (
            <div key={flow}>
              {/* Flow header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{FLOW_LABELS[flow].emoji}</span>
                <h2 className="text-base font-semibold text-neutral-900">Fluxo {FLOW_LABELS[flow].label}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activePerFlow(flow) >= 5 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {activePerFlow(flow)}/5 ativas
                </span>
              </div>

              <div className="space-y-3">
                {qs.map((q, i) => (
                  <div key={q.id} className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
                    q.active ? 'border-purple-200 shadow-sm' : 'border-neutral-200'
                  }`}>
                    {/* Question header */}
                    <div className="flex items-start gap-3 p-4">
                      {/* Position controls */}
                      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                        <button
                          onClick={() => movePosition(q, -1)}
                          disabled={i === 0 || saving === q.id}
                          className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="text-xs text-center text-neutral-400 font-mono">{q.position}</span>
                        <button
                          onClick={() => movePosition(q, 1)}
                          disabled={i === qs.length - 1 || saving === q.id}
                          className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Question text */}
                      <div className="flex-1 min-w-0">
                        {editingQ === q.id ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={editDraft}
                              onChange={e => setEditDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEditQuestion(q.id); if (e.key === 'Escape') setEditingQ(null); }}
                              className="flex-1 h-8 px-2.5 text-sm border border-purple-300 rounded-lg outline-none focus:border-purple-600 bg-white"
                            />
                            <button onClick={() => saveEditQuestion(q.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                            <button onClick={() => setEditingQ(null)} className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium text-neutral-900 flex-1">{q.question}</p>
                            <button
                              onClick={() => { setEditingQ(q.id); setEditDraft(q.question); }}
                              className="p-1 text-neutral-300 hover:text-blue-600 transition-colors shrink-0"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                        {q.context && (
                          <p className="text-xs text-neutral-400 mt-0.5">{q.context}</p>
                        )}
                      </div>

                      {/* Active toggle */}
                      <button
                        onClick={() => toggleActive(q)}
                        disabled={saving === q.id}
                        title={q.active ? 'Desativar' : 'Ativar'}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-colors shrink-0 disabled:opacity-50 ${
                          q.active
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {q.active ? <><Eye size={12} /> Ativa</> : <><EyeOff size={12} /> Inativa</>}
                      </button>
                    </div>

                    {/* Options */}
                    {q.options.length > 0 && (
                      <div className="border-t border-neutral-100 px-4 py-3 space-y-2">
                        {q.options.map(opt => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-purple-600 w-5 shrink-0">{opt.letter})</span>
                            <span className="text-xs text-neutral-600 flex-1">{opt.option_text}</span>
                            {/* Profile selector */}
                            <select
                              value={opt.profile_key}
                              onChange={e => {
                                const p = e.target.value as WineProfile;
                                const w = PROFILES.indexOf(p) + 1;
                                updateOptionProfile(opt.id, q.id, p, w);
                              }}
                              disabled={saving === opt.id}
                              className="h-7 px-2 text-xs border border-neutral-200 rounded-md outline-none focus:border-purple-600 bg-white disabled:opacity-50"
                            >
                              {PROFILES.map(p => (
                                <option key={p} value={p}>{PROFILE_ICONS[p]} {PROFILE_LABELS[p]}</option>
                              ))}
                            </select>
                            <span className="text-xs text-neutral-400 w-12 text-right">
                              peso {PROFILES.indexOf(opt.profile_key) + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Como funciona</p>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• O quiz sempre exibe as <strong>5 perguntas ativas</strong> de cada fluxo — recomendamos 1–2 por fluxo, totalizando 5.</li>
          <li>• A ordem dentro de cada fluxo é controlada pelas setas ↑↓.</li>
          <li>• Alterar o perfil de uma opção muda o mapeamento imediatamente para novos quiz completados.</li>
        </ul>
      </div>
    </div>
  );
}
