import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLevelForPoints, type WineProfile } from '../../lib/profileConstants';

// ── Types ──────────────────────────────────────────────────────
type QuizOption = {
  id: string;
  letter: string;
  option_text: string;
  profile_key: WineProfile;
};

type BonusQuestion = {
  id: string;
  position: number;
  question: string;
  context: string | null;
  bonus_points: number;
  options: QuizOption[];
};

// ── Design tokens (matches Onboarding) ────────────────────────
const BG     = '#F5F0E8';
const WINE   = '#690037';
const VERDE  = '#2D3A3A';
const TEXT1  = '#1C1B1F';
const TEXT2  = '#5C5C5C';
const MUTED  = '#9B9B9B';
const CARD   = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

export default function QuizBonus() {
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [currentQ, setCurrentQ]   = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<QuizOption | null>(null);
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [{ data: bonusQs }, { data: answered }] = await Promise.all([
        supabase
          .from('quiz_questions')
          .select('*, options:quiz_options(*)')
          .gt('bonus_points', 0)
          .eq('active', true)
          .order('position'),
        supabase
          .from('quiz_bonus_answers')
          .select('question_id')
          .eq('user_id', user.id),
      ]);

      const answeredIds = new Set((answered ?? []).map((a: any) => a.question_id as string));

      const unanswered = (bonusQs ?? [])
        .filter((q: any) => !answeredIds.has(q.id))
        .map((q: any) => ({
          ...q,
          options: [...(q.options ?? [])].sort((a: QuizOption, b: QuizOption) =>
            a.letter.localeCompare(b.letter)
          ),
        }));

      setQuestions(unanswered);
      setLoading(false);
    };

    load();
  }, [user]);

  const selectOption = (opt: QuizOption) => {
    setSelectedOpt(opt);
    // Auto-advance after a short pause
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(async () => {
      await saveAnswer(opt);
    }, 400);
  };

  const saveAnswer = async (opt: QuizOption) => {
    if (!session?.user?.id || saving) return;
    const q = questions[currentQ];
    if (!q) return;

    setSaving(true);

    // 1. Save the bonus answer
    await supabase.from('quiz_bonus_answers').insert({
      user_id:      session.user.id,
      question_id:  q.id,
      option_id:    opt.id,
      profile_key:  opt.profile_key,
      points_earned: q.bonus_points,
    });

    // 2. Award the bonus points directly
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('total_points, user_level')
      .eq('user_id', session.user.id)
      .single();

    if (profile) {
      const newTotal = (profile.total_points ?? 0) + q.bonus_points;
      const newLevel = getLevelForPoints(newTotal);
      await supabase
        .from('user_profiles')
        .update({ total_points: newTotal, user_level: newLevel })
        .eq('user_id', session.user.id);

      // Log to points log
      await supabase.from('user_points_log').insert({
        user_id:     session.user.id,
        action_type: 'bonus_quiz',
        item_id:     q.id,
        item_type:   'quiz_question',
        points:      q.bonus_points,
      });
    }

    setTotalEarned(prev => prev + q.bonus_points);
    setSaving(false);

    // Advance to next question or finish
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedOpt(null);
    } else {
      setDone(true);
    }
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: MUTED }}>Carregando…</p>
      </div>
    );
  }

  // ── No questions available ─────────────────────────────────
  if (!loading && questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: TEXT1, marginBottom: 8, textAlign: 'center' }}>
          Tudo em dia!
        </h1>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.9rem', color: TEXT2, textAlign: 'center', marginBottom: 24, maxWidth: 300 }}>
          Você já respondeu todas as perguntas bônus disponíveis. Volte mais tarde para novas questões.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block', padding: '12px 28px',
            backgroundColor: WINE, color: '#FFF',
            borderRadius: 12, fontFamily: "'DM Sans'",
            fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none',
          }}
        >
          Ir para início
        </Link>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: TEXT1, marginBottom: 8, lineHeight: 1.2 }}>
            Quiz bônus completo!
          </h1>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.9rem', color: TEXT2, marginBottom: 24 }}>
            Você respondeu todas as perguntas disponíveis.
          </p>

          <div style={{
            backgroundColor: 'rgba(105,0,55,0.06)', border: '1px solid rgba(105,0,55,0.12)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Trophy size={28} color={WINE} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '1.1rem', fontWeight: 700, color: WINE }}>
                +{totalEarned} pontos bônus!
              </p>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '0.8rem', color: TEXT2 }}>
                Continue explorando para ganhar mais pontos.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', height: 52, backgroundColor: WINE, color: '#FFF',
              border: 'none', borderRadius: 12, fontFamily: "'DM Sans'",
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Ir para início <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────
  const q        = questions[currentQ];
  const totalQ   = questions.length;
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

        {/* Header: counter + bonus badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 24, alignItems: 'center' }}>
          <button
            onClick={() => currentQ > 0 && (setCurrentQ(c => c - 1), setSelectedOpt(null))}
            disabled={currentQ === 0}
            style={{ background: 'none', border: 'none', color: currentQ === 0 ? MUTED : TEXT2, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.85rem' }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.85rem', color: MUTED }}>
              {currentQ + 1} de {totalQ}
            </span>
            <div style={{ marginTop: 2, backgroundColor: 'rgba(105,0,55,0.08)', borderRadius: 99, padding: '2px 10px' }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 700, color: WINE }}>
                +{q.bonus_points} pts bônus
              </span>
            </div>
          </div>
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
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: 8 }}>
                {q.context}
              </p>
            )}
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: TEXT1, lineHeight: 1.35, marginBottom: 24 }}>
              {q.question}
            </h2>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map(opt => {
                const isSelected = selectedOpt?.id === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => !saving && !selectedOpt && selectOption(opt)}
                    disabled={saving || !!selectedOpt}
                    whileTap={{ scale: saving || selectedOpt ? 1 : 0.98 }}
                    style={{
                      width: '100%', padding: '14px 16px',
                      backgroundColor: isSelected ? 'rgba(105,0,55,0.06)' : CARD,
                      border: `1.5px solid ${isSelected ? WINE : BORDER}`,
                      borderRadius: 12, cursor: saving || selectedOpt ? 'not-allowed' : 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 0.15s ease',
                      opacity: selectedOpt && !isSelected ? 0.5 : 1,
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
                    <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.92rem', color: isSelected ? WINE : TEXT1, fontWeight: isSelected ? 500 : 400, lineHeight: 1.4 }}>
                      {opt.option_text}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
