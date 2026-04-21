import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, Check, X, Trash2, Gift } from 'lucide-react';
import { PROFILE_LABELS, PROFILE_ICONS, type WineProfile } from '../../../lib/profileConstants';

type QuizOption = {
  id: string;
  letter: string;
  option_text: string;
  profile_key: WineProfile;
};

type QuizQuestion = {
  id: string;
  position: number;
  question: string;
  context: string | null;
  active: boolean;
  bonus_points: number;
  options: QuizOption[];
};

const PROFILES: WineProfile[] = ['novato', 'curioso', 'desbravador', 'curador', 'expert'];

// Auto-assign letter based on option index
function indexToLetter(i: number) {
  return String.fromCharCode(97 + i); // a, b, c, ...
}

export default function QuizAdmin() {
  const [questions, setQuestions]     = useState<QuizQuestion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null);
  const [editingQ, setEditingQ]       = useState<string | null>(null);
  const [editDraft, setEditDraft]     = useState('');
  const [error, setError]             = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQ, setNewQ]               = useState({ question: '', context: '', bonus_points: 0 });

  // Per-question inline new-option form state
  const [addingOptFor, setAddingOptFor]   = useState<string | null>(null);
  const [newOptText, setNewOptText]       = useState('');
  const [newOptProfile, setNewOptProfile] = useState<WineProfile>('novato');

  const load = async () => {
    setLoading(true);
    const { data: qs } = await supabase
      .from('quiz_questions')
      .select('*, options:quiz_options(*)')
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

  const activeCount = questions.filter(q => q.active).length;

  const toggleActive = async (q: QuizQuestion) => {
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
    const sorted = [...questions].sort((a, b) => a.position - b.position);
    const idx    = sorted.findIndex(x => x.id === q.id);
    const swap   = sorted[idx + dir];
    if (!swap) return;

    setSaving(q.id);
    await Promise.all([
      supabase.from('quiz_questions').update({ position: swap.position }).eq('id', q.id),
      supabase.from('quiz_questions').update({ position: q.position  }).eq('id', swap.id),
    ]);
    setQuestions(prev => prev.map(x => {
      if (x.id === q.id)    return { ...x, position: swap.position };
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

  const saveBonusPoints = async (q: QuizQuestion, val: number) => {
    setSaving(q.id + '-bonus');
    const { error } = await supabase
      .from('quiz_questions')
      .update({ bonus_points: val })
      .eq('id', q.id);
    if (!error) setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, bonus_points: val } : x));
    else setError(error.message);
    setSaving(null);
  };

  const updateOptionProfile = async (optId: string, qId: string, profile: WineProfile) => {
    setSaving(optId);
    const { error } = await supabase
      .from('quiz_options')
      .update({ profile_key: profile })
      .eq('id', optId);
    if (!error) {
      setQuestions(prev => prev.map(q => q.id === qId
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, profile_key: profile } : o) }
        : q
      ));
    } else setError(error.message);
    setSaving(null);
  };

  const updateOptionText = async (optId: string, qId: string, text: string) => {
    setSaving(optId);
    const { error } = await supabase
      .from('quiz_options')
      .update({ option_text: text })
      .eq('id', optId);
    if (!error) {
      setQuestions(prev => prev.map(q => q.id === qId
        ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, option_text: text } : o) }
        : q
      ));
    } else setError(error.message);
    setSaving(null);
  };

  const deleteOption = async (optId: string, qId: string) => {
    if (!window.confirm('Remover esta opção?')) return;
    setSaving(optId);
    const { error } = await supabase.from('quiz_options').delete().eq('id', optId);
    if (!error) {
      setQuestions(prev => prev.map(q => q.id === qId
        ? { ...q, options: q.options.filter(o => o.id !== optId) }
        : q
      ));
    } else setError(error.message);
    setSaving(null);
  };

  const addOption = async (qId: string) => {
    if (!newOptText.trim()) return;
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    const letter = indexToLetter(q.options.length);
    const { data, error } = await supabase
      .from('quiz_options')
      .insert({ question_id: qId, option_text: newOptText.trim(), profile_key: newOptProfile, letter })
      .select()
      .single();
    if (!error && data) {
      setQuestions(prev => prev.map(x => x.id === qId
        ? { ...x, options: [...x.options, data as QuizOption] }
        : x
      ));
      setNewOptText('');
      setNewOptProfile('novato');
      setAddingOptFor(null);
    } else if (error) setError(error.message);
  };

  const createQuestion = async () => {
    if (!newQ.question.trim()) return;
    const maxPos = questions.reduce((m, q) => Math.max(m, q.position), 0);
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        question:     newQ.question,
        context:      newQ.context || null,
        position:     maxPos + 1,
        active:       false,
        bonus_points: newQ.bonus_points,
      })
      .select()
      .single();
    if (!error && data) {
      setQuestions(prev => [...prev, { ...data, options: [] }]);
      setNewQ({ question: '', context: '', bonus_points: 0 });
      setShowNewForm(false);
    } else if (error) setError(error.message);
  };

  const sorted = [...questions].sort((a, b) => a.position - b.position);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Questionário de Onboarding</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {activeCount} pergunta{activeCount !== 1 ? 's' : ''} ativa{activeCount !== 1 ? 's' : ''} · Respostas com bônus notificam usuários automaticamente.
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
          <input
            type="text"
            value={newQ.question}
            onChange={e => setNewQ(f => ({ ...f, question: e.target.value }))}
            placeholder="Texto da pergunta…"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 bg-white"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={newQ.context}
              onChange={e => setNewQ(f => ({ ...f, context: e.target.value }))}
              placeholder="Contexto / cenário (opcional)"
              className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 bg-white"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Gift size={14} className="text-amber-500" />
              <input
                type="number"
                min={0}
                value={newQ.bonus_points}
                onChange={e => setNewQ(f => ({ ...f, bonus_points: Number(e.target.value) }))}
                placeholder="Bônus pts"
                className="w-24 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-purple-600 bg-white"
              />
            </div>
          </div>
          {newQ.bonus_points > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ✨ Esta pergunta será enviada como bônus para usuários que já completaram o quiz. Eles ganharão {newQ.bonus_points} pts ao responder.
            </p>
          )}
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
        <div className="space-y-4">
          {sorted.map((q, i) => (
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
                    disabled={i === sorted.length - 1 || saving === q.id}
                    className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Question text + context */}
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

                  {/* Bonus points inline */}
                  <div className="flex items-center gap-2 mt-2">
                    <Gift size={12} className="text-amber-400" />
                    <span className="text-xs text-neutral-400">Bônus:</span>
                    <BonusInput
                      value={q.bonus_points}
                      onSave={val => saveBonusPoints(q, val)}
                      saving={saving === q.id + '-bonus'}
                    />
                    <span className="text-xs text-neutral-400">pts</span>
                    {q.bonus_points > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        notifica usuários
                      </span>
                    )}
                  </div>
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
              <div className="border-t border-neutral-100 px-4 py-3 space-y-2">
                {q.options.map((opt, oi) => (
                  <OptionRow
                    key={opt.id}
                    opt={opt}
                    index={oi}
                    saving={saving === opt.id}
                    onProfileChange={p => updateOptionProfile(opt.id, q.id, p)}
                    onTextSave={t  => updateOptionText(opt.id, q.id, t)}
                    onDelete={() => deleteOption(opt.id, q.id)}
                  />
                ))}

                {/* Inline add option */}
                {addingOptFor === q.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-purple-500 w-5 shrink-0">
                      {indexToLetter(q.options.length)})
                    </span>
                    <input
                      autoFocus
                      value={newOptText}
                      onChange={e => setNewOptText(e.target.value)}
                      placeholder="Texto da resposta…"
                      className="flex-1 h-8 px-2.5 text-xs border border-purple-200 rounded-lg outline-none focus:border-purple-600 bg-white"
                      onKeyDown={e => { if (e.key === 'Enter') addOption(q.id); if (e.key === 'Escape') setAddingOptFor(null); }}
                    />
                    <select
                      value={newOptProfile}
                      onChange={e => setNewOptProfile(e.target.value as WineProfile)}
                      className="h-8 px-2 text-xs border border-neutral-200 rounded-lg outline-none focus:border-purple-600 bg-white"
                    >
                      {PROFILES.map(p => (
                        <option key={p} value={p}>{PROFILE_ICONS[p]} {PROFILE_LABELS[p]}</option>
                      ))}
                    </select>
                    <button onClick={() => addOption(q.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setAddingOptFor(null); setNewOptText(''); }} className="p-1.5 text-neutral-400 hover:bg-neutral-50 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingOptFor(q.id); setNewOptText(''); setNewOptProfile('novato'); }}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 mt-1 px-1 py-0.5"
                  >
                    <Plus size={12} /> Adicionar resposta
                  </button>
                )}
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-4xl mb-3">❓</p>
              <p className="text-sm">Nenhuma pergunta criada ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Como funciona</p>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• Perguntas ativas aparecem no quiz de onboarding em ordem de posição.</li>
          <li>• O perfil dominante é determinado por <strong>contagem simples</strong> — o perfil mais escolhido nas respostas ganha. Em empate, o mais iniciante prevalece.</li>
          <li>• Cada resposta deve ser atrelada a um perfil (novato → expert). Sem peso — é puro voto.</li>
          <li>• Perguntas com <strong>bônus &gt; 0</strong> são enviadas como notificação para usuários que já completaram o quiz. Ao responder, eles ganham os pontos bônus.</li>
        </ul>
      </div>
    </div>
  );
}

// ── Inline bonus points input ──────────────────────────────────────
function BonusInput({ value, onSave, saving }: { value: number; onSave: (v: number) => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onSave(Number(draft)); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(Number(draft)); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        className="w-14 h-6 px-1.5 text-xs border border-purple-300 rounded outline-none text-center"
      />
    );
  }
  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      disabled={saving}
      className={`text-xs font-semibold px-2 py-0.5 rounded border transition-colors ${
        value > 0 ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-neutral-200 text-neutral-500 bg-white'
      } hover:border-purple-300 disabled:opacity-50`}
    >
      {saving ? '…' : value}
    </button>
  );
}

// ── Editable option row ────────────────────────────────────────────
function OptionRow({
  opt, index, saving, onProfileChange, onTextSave, onDelete,
}: {
  opt: QuizOption;
  index: number;
  saving: boolean;
  onProfileChange: (p: WineProfile) => void;
  onTextSave: (t: string) => void;
  onDelete: () => void;
}) {
  const [editingText, setEditingText] = useState(false);
  const [draft, setDraft]             = useState(opt.option_text);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-purple-600 w-5 shrink-0">{indexToLetter(index)})</span>

      {editingText ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onTextSave(draft); setEditingText(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onTextSave(draft); setEditingText(false); } if (e.key === 'Escape') setEditingText(false); }}
          className="flex-1 h-7 px-2 text-xs border border-purple-200 rounded-lg outline-none focus:border-purple-600 bg-white"
        />
      ) : (
        <button
          onClick={() => { setDraft(opt.option_text); setEditingText(true); }}
          className="flex-1 text-xs text-neutral-700 text-left hover:text-purple-700 transition-colors"
        >
          {opt.option_text}
        </button>
      )}

      {/* Profile selector */}
      <select
        value={opt.profile_key}
        onChange={e => onProfileChange(e.target.value as WineProfile)}
        disabled={saving}
        className="h-7 px-2 text-xs border border-neutral-200 rounded-md outline-none focus:border-purple-600 bg-white disabled:opacity-50"
      >
        {(['novato', 'curioso', 'desbravador', 'curador', 'expert'] as WineProfile[]).map(p => (
          <option key={p} value={p}>{PROFILE_ICONS[p]} {PROFILE_LABELS[p]}</option>
        ))}
      </select>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={saving}
        className="p-1 text-neutral-300 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
