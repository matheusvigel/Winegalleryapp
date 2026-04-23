import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  PROFILE_LABELS, PROFILE_ICONS, PROFILE_ARCHETYPES, PROFILE_TAGLINES,
  getLevelForPoints, PROFILE_ORDER,
  type WineProfile,
} from '../../../lib/profileConstants';

// ── Types ─────────────────────────────────────────────────────
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
  options: QuizOption[];
};

type Answer = {
  questionId: string;
  optionId:   string;
  profileKey: WineProfile;
};

// ── Profile calculation (pure frequency count) ────────────────
// Tiebreak: most beginner profile wins (novato > curioso > ... > expert)
function calculateProfile(answers: Answer[]): {
  dominant:    WineProfile;
  secondaries: WineProfile[];
  counts:      Record<WineProfile, number>;
} {
  const freq: Partial<Record<WineProfile, number>> = {};
  for (const a of answers) {
    freq[a.profileKey] = (freq[a.profileKey] ?? 0) + 1;
  }

  const maxCount = Math.max(...(Object.values(freq) as number[]));
  // PROFILE_ORDER goes novato → expert; find() returns first tie = most beginner
  const dominant = PROFILE_ORDER.find(p => (freq[p] ?? 0) === maxCount)!;
  const secondaries = PROFILE_ORDER.filter(p => p !== dominant && (freq[p] ?? 0) > 0);
  const counts = Object.fromEntries(
    PROFILE_ORDER.map(p => [p, freq[p] ?? 0])
  ) as Record<WineProfile, number>;

  return { dominant, secondaries, counts };
}

// ── Design tokens ─────────────────────────────────────────────
const BG     = '#F5F0E8';
const WINE   = '#690037';
const VERDE  = '#2D3A3A';
const TEXT1  = '#1C1B1F';
const TEXT2  = '#5C5C5C';
const MUTED  = '#9B9B9B';
const CARD   = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

// ── Component ────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRetake = searchParams.get('retake') === 'true';
  const { session } = useAuth();

  const [step, setStep]           = useState<'welcome' | 'quiz' | 'result'>('welcome');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [currentQ, setCurrentQ]   = useState(0);
  const [answers, setAnswers]     = useState<Answer[]>([]);
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState<ReturnType<typeof calculateProfile> | null>(null);
  const [completionPoints, setCompletionPoints] = useState(20);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

  // Fetch quiz_completion_points from app_settings
  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'quiz_completion_points')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setCompletionPoints(Number(data.value));
      });
  }, []);

  // Auto-start quiz when in retake mode — intentional [] since isRetake is
  // derived from the URL and never changes during this component's lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isRetake) fetchQuestions(); }, []);

  // Fetch active quiz questions
  const fetchQuestions = async () => {
    setLoadingQ(true);
    const { data } = await supabase
      .from('quiz_questions')
      .select('*, options:quiz_options(*)')
      .eq('active', true)
      .order('position');

    if (data) {
      setQuestions(data.map((q: any) => ({
        ...q,
        options: [...(q.options ?? [])].sort((a: QuizOption, b: QuizOption) =>
          a.letter.localeCompare(b.letter)
        ),
      })));
    }
    setLoadingQ(false);
    setStep('quiz');
  };

  const selectAnswer = (opt: QuizOption) => {
    const a: Answer = {
      questionId: questions[currentQ].id,
      optionId:   opt.id,
      profileKey: opt.profile_key,
    };

    setAnswers(prev => {
      const without = prev.filter(x => x.questionId !== a.questionId);
      return [...without, a];
    });

    // Auto-advance after short delay
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
      }
    }, 350);
  };

  const currentAnswer = answers.find(a => a.questionId === questions[currentQ]?.id);

  const finishQuiz = async () => {
    if (answers.length < questions.length) return;

    const calc = calculateProfile(answers);
    setResult(calc);
    setStep('result');

    if (!session?.user?.id) return;

    setSaving(true);
    const level = getLevelForPoints(completionPoints);

    await supabase
      .from('user_profiles')
      .update({
        wine_profile:   calc.dominant,
        user_level:     level,
        quiz_completed: true,
        total_points:   completionPoints,
      })
      .eq('user_id', session.user.id);

    setSaving(false);
  };

  const goToApp = () => {
    localStorage.removeItem('wine-gallery-onboarding');
    navigate(isRetake ? '/profile' : '/');
  };

  // ── STEP: WELCOME ─────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🍷</div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: TEXT1, marginBottom: 8, lineHeight: 1.2 }}>
            Bem-vindo ao<br />Wine Gallery
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '0.95rem', color: TEXT2, lineHeight: 1.7, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
            Vamos entender sua relação com o vinho para personalizar sua experiência. São apenas algumas perguntas rápidas.
          </p>

          {/* Points incentive */}
          <div style={{ backgroundColor: 'rgba(105,0,55,0.06)', border: `1px solid rgba(105,0,55,0.12)`, borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🎁</span>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '0.83rem', color: WINE, fontWeight: 500 }}>
              Complete o quiz e ganhe <strong>{completionPoints} pontos</strong> para começar sua jornada!
            </p>
          </div>

          <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 12 }}>
              Você vai descobrir seu perfil
            </p>
            {(['novato', 'curioso', 'desbravador', 'curador', 'expert'] as WineProfile[]).map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ fontSize: '1.2rem' }}>{PROFILE_ICONS[p]}</span>
                <div>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: '0.88rem', fontWeight: 600, color: TEXT1 }}>{PROFILE_LABELS[p]}</span>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED, marginLeft: 6 }}>· {PROFILE_ARCHETYPES[p]}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={fetchQuestions}
            disabled={loadingQ}
            style={{
              width: '100%', height: 52,
              backgroundColor: WINE, color: '#FFF',
              border: 'none', borderRadius: 12,
              fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 700,
              cursor: loadingQ ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loadingQ ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loadingQ ? 'Carregando…' : <>Descobrir meu perfil <ChevronRight size={18} /></>}
          </button>

          <button
            onClick={goToApp}
            style={{ marginTop: 12, width: '100%', height: 44, background: 'none', border: 'none', fontFamily: "'DM Sans'", fontSize: '0.88rem', color: MUTED, cursor: 'pointer' }}
          >
            Pular por agora
          </button>
        </motion.div>
      </div>
    );
  }

  // ── STEP: QUIZ ────────────────────────────────────────────
  if (step === 'quiz' && questions.length > 0) {
    const q      = questions[currentQ];
    const totalQ = questions.length;
    const progress = (currentQ / totalQ) * 100;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
        {/* Progress bar */}
        <div style={{ height: 4, backgroundColor: 'rgba(105,0,55,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: WINE, borderRadius: '0 4px 4px 0' }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 24px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
          {/* Counter + back */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 24, alignItems: 'center' }}>
            <button
              onClick={() => currentQ > 0 && setCurrentQ(c => c - 1)}
              disabled={currentQ === 0}
              style={{ background: 'none', border: 'none', color: currentQ === 0 ? MUTED : TEXT2, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans'", fontSize: '0.85rem' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.85rem', color: MUTED }}>
              {currentQ + 1} de {totalQ}
            </span>
            <div style={{ width: 80 }} />
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%' }}
            >
              {q.context && (
                <p style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: 8 }}>
                  {q.context}
                </p>
              )}
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: TEXT1, lineHeight: 1.35, marginBottom: 24 }}>
                {q.question}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map(opt => {
                  const isSelected = currentAnswer?.optionId === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => selectAnswer(opt)}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: isSelected ? 'rgba(105,0,55,0.06)' : CARD,
                        border: `1.5px solid ${isSelected ? WINE : BORDER}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: `1.5px solid ${isSelected ? WINE : 'rgba(0,0,0,0.12)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? WINE : 'transparent',
                        flexShrink: 0, transition: 'all 0.15s ease',
                      }}>
                        {isSelected
                          ? <Check size={14} color="#fff" />
                          : <span style={{ fontFamily: "'Fraunces', serif", fontSize: '0.85rem', fontWeight: 700, color: WINE }}>{opt.letter}</span>
                        }
                      </span>
                      <span style={{ fontFamily: "'DM Sans'", fontSize: '0.92rem', color: isSelected ? WINE : TEXT1, fontWeight: isSelected ? 500 : 400, lineHeight: 1.4 }}>
                        {opt.option_text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Next / Finish */}
              {currentAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 20 }}
                >
                  {currentQ < totalQ - 1 ? (
                    <button
                      onClick={() => setCurrentQ(c => c + 1)}
                      style={{
                        width: '100%', height: 50, backgroundColor: VERDE, color: '#FFF',
                        border: 'none', borderRadius: 12, fontFamily: "'DM Sans'",
                        fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      Próxima <ChevronRight size={16} />
                    </button>
                  ) : answers.length >= totalQ ? (
                    <button
                      onClick={finishQuiz}
                      disabled={saving}
                      style={{
                        width: '100%', height: 50, backgroundColor: WINE, color: '#FFF',
                        border: 'none', borderRadius: 12, fontFamily: "'DM Sans'",
                        fontSize: '0.95rem', fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? 'Calculando…' : 'Ver meu perfil 🍷'}
                    </button>
                  ) : null}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── STEP: RESULT ─────────────────────────────────────────
  if (step === 'result' && result) {
    const { dominant, secondaries, counts } = result;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}
        >
          {/* Profile hero */}
          <div style={{
            background: `linear-gradient(135deg, ${WINE}, #4A1A20)`,
            borderRadius: 20, padding: '32px 24px', marginBottom: 20, color: '#fff',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{PROFILE_ICONS[dominant]}</div>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.65, marginBottom: 4 }}>
              Seu perfil
            </p>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
              {PROFILE_LABELS[dominant]}
            </h1>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '0.82rem', opacity: 0.7, marginBottom: 16 }}>
              {PROFILE_ARCHETYPES[dominant]}
            </p>
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: '1rem', opacity: 0.9, lineHeight: 1.5 }}>
              "{PROFILE_TAGLINES[dominant]}"
            </p>
          </div>

          {/* Secondary profiles */}
          {secondaries.length > 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 12 }}>
                Você também tem características de
              </p>
              {secondaries.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,0.05)` }}>
                  <span style={{ fontSize: '1.4rem' }}>{PROFILE_ICONS[p]}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: '0.88rem', fontWeight: 600, color: TEXT1 }}>{PROFILE_LABELS[p]}</p>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: '0.76rem', color: MUTED }}>{PROFILE_ARCHETYPES[p]}</p>
                  </div>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 600, color: TEXT2 }}>
                    {counts[p]}×
                  </span>
                </div>
              ))}
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
                Sua jornada é multifacetada. Continue explorando e seu perfil vai evoluir taça a taça. 🍷
              </p>
            </div>
          )}

          {/* Points earned */}
          <div style={{
            backgroundColor: 'rgba(105,0,55,0.06)', border: '1px solid rgba(105,0,55,0.12)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.5rem' }}>🎁</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.88rem', fontWeight: 700, color: WINE }}>
                +{completionPoints} pontos conquistados!
              </p>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.76rem', color: TEXT2 }}>
                Bem-vindo à sua jornada no Wine Gallery.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={goToApp}
            style={{
              width: '100%', height: 52, backgroundColor: WINE, color: '#FFF',
              border: 'none', borderRadius: 12, fontFamily: "'DM Sans'",
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Começar minha jornada <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading fallback
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'DM Sans'", color: MUTED }}>Carregando…</p>
    </div>
  );
}
