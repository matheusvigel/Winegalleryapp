import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Trophy, CheckCircle, Heart, Wine, LogOut, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PROFILE_LABELS,
  PROFILE_ICONS,
  PROFILE_TAGLINES,
  PROFILE_ARCHETYPES,
  LEVEL_LABELS,
  LEVEL_POINTS,
  PROFILE_ORDER,
  getNextProfile,
  type WineProfile,
  type UserLevel,
} from '../../lib/profileConstants';

// ── Color palette ─────────────────────────────────────────────
const BG     = '#E9E3D9';
const CARD   = '#FFFFFF';
const SURF   = '#F5F0E8';
const WINE_C = '#690037';
const VERDE  = '#2D3A3A';
const LARANJA = '#F1BD85';
const TEXT1  = '#1C1B1F';
const TEXT2  = '#5C5C5C';
const MUTED  = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

// Profile gradient configs
const PROFILE_GRADIENTS: Record<WineProfile, string> = {
  novato:      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  curioso:     'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  desbravador: 'linear-gradient(135deg, #dc2626 0%, #9f1239 100%)',
  curador:     'linear-gradient(135deg, #9f1239 0%, #690037 100%)',
  expert:      'linear-gradient(135deg, #1c1b1f 0%, #374151 100%)',
};

interface UserProfileData {
  wine_profile: WineProfile;
  user_level: UserLevel;
  total_points: number;
  next_profile_count: number;
  profile_composition: Record<WineProfile, number> | null;
  quiz_completed: boolean;
  display_name: string | null;
}

interface RecentActivity {
  id: string;
  action_type: string;
  item_id: string | null;
  points: number;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  tried:            'Experimentou um item',
  favorite:         'Adicionou aos favoritos',
  review:           'Escreveu uma avaliação',
  photo:            'Adicionou uma foto',
  brotherhood_join: 'Entrou em uma confraria',
  follow:           'Seguiu um usuário',
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [triedCount, setTriedCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, activityRes, progressRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('wine_profile, user_level, total_points, next_profile_count, profile_composition, quiz_completed, display_name')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_points_log')
        .select('id, action_type, item_id, points, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('user_progress')
        .select('completed, is_favorite')
        .eq('user_id', user.id),
    ]);

    if (profileRes.data) {
      setProfileData(profileRes.data as UserProfileData);
    }
    if (activityRes.data) {
      setRecentActivity(activityRes.data as RecentActivity[]);
    }
    if (progressRes.data) {
      setTriedCount(progressRes.data.filter((p: any) => p.completed).length);
      setFavCount(progressRes.data.filter((p: any) => p.is_favorite).length);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profileData?.display_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Sommelier';

  // ── Level progress calculation ────────────────────────────────
  const totalPoints  = profileData?.total_points ?? 0;
  const currentLevel = (profileData?.user_level ?? 'recem_chegado') as UserLevel;
  const levelCfg     = LEVEL_POINTS[currentLevel];
  const levelMin     = levelCfg.min;
  const levelMax     = levelCfg.max;
  const levelProgress = levelMax
    ? Math.min(100, Math.round(((totalPoints - levelMin) / (levelMax - levelMin)) * 100))
    : 100;
  const ptsToNext = levelMax ? Math.max(0, levelMax + 1 - totalPoints) : 0;

  // ── Profile upgrade progress ──────────────────────────────────
  const currentProfile  = (profileData?.wine_profile ?? 'novato') as WineProfile;
  const nextProfile     = getNextProfile(currentProfile);
  const nextCount       = profileData?.next_profile_count ?? 0;
  const upgradeProgress = Math.min(100, Math.round((nextCount / 5) * 100));

  // ── Composition bars ──────────────────────────────────────────
  const composition = profileData?.profile_composition as Record<WineProfile, number> | null;
  const compTotal   = composition
    ? Object.values(composition).reduce((s, v) => s + v, 0)
    : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.85rem', color: MUTED }}>Carregando perfil…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 48 }}>

      {/* ── Profile Hero ──────────────────────────────────────────── */}
      <div style={{
        background: PROFILE_GRADIENTS[currentProfile],
        paddingTop: 24,
        paddingBottom: 32,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Sign out */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button
            onClick={handleSignOut}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans'", fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            flexShrink: 0,
          }}>
            {PROFILE_ICONS[currentProfile]}
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {displayName}
            </h1>
            <p style={{ margin: '3px 0 0', fontFamily: "'DM Sans'", fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              {PROFILE_LABELS[currentProfile]}
            </p>
            {user?.email && (
              <p style={{ margin: '1px 0 0', fontFamily: "'DM Sans'", fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Profile tagline */}
        <p style={{
          margin: '0 0 20px',
          fontFamily: "'DM Sans'",
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.8)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          "{PROFILE_TAGLINES[currentProfile]}"
        </p>

        {/* Points + level pill */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 99,
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Trophy size={13} color="rgba(255,255,255,0.9)" />
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
              {totalPoints} pts
            </span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 99,
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Star size={13} color="rgba(255,255,255,0.9)" />
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
              {LEVEL_LABELS[currentLevel]}
            </span>
          </div>
        </div>
      </div>

      {/* ── Level progress card ───────────────────────────────────── */}
      <div style={{ padding: '16px 20px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: CARD, borderRadius: 14, padding: '18px 20px', border: `1px solid ${BORDER}`, marginBottom: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={15} color={LARANJA} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
              Progresso de nível
            </span>
          </div>

          {/* Level bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, color: TEXT1 }}>
                {LEVEL_LABELS[currentLevel]}
              </span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: MUTED }}>
                {levelMax ? `${ptsToNext} pts para ${LEVEL_LABELS[(() => {
                  const levels: UserLevel[] = ['recem_chegado', 'em_ascensao', 'destaque', 'embaixador'];
                  const idx = levels.indexOf(currentLevel);
                  return idx < levels.length - 1 ? levels[idx + 1] : currentLevel;
                })()]}` : 'Nível máximo atingido!'}
              </span>
            </div>
            <div style={{ position: 'relative', height: 5, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: VERDE, borderRadius: 99 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.6rem', color: MUTED }}>{levelMin} pts</span>
              {levelMax && <span style={{ fontFamily: "'DM Sans'", fontSize: '0.6rem', color: MUTED }}>{levelMax} pts</span>}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            {[
              { label: 'Pontos', value: totalPoints, color: VERDE },
              { label: 'Vividas', value: triedCount, color: VERDE },
              { label: 'Favoritos', value: favCount, color: WINE_C },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 0', backgroundColor: SURF, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '0.62rem', color: MUTED, marginTop: 4, letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Profile upgrade progress ────────────────────────────── */}
        {nextProfile && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ backgroundColor: CARD, borderRadius: 14, padding: '18px 20px', border: `1px solid ${BORDER}`, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: '1rem' }}>{PROFILE_ICONS[currentProfile]}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Evolução de perfil
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, color: TEXT1 }}>
                    {PROFILE_ICONS[nextProfile]} Caminho para {PROFILE_LABELS[nextProfile]}
                  </span>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: MUTED }}>
                    {nextCount}/5
                  </span>
                </div>
                <div style={{ position: 'relative', height: 5, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${upgradeProgress}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: WINE_C, borderRadius: 99 }}
                  />
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.7rem', color: TEXT2, lineHeight: 1.5 }}>
              Experimente <strong>{5 - nextCount} {5 - nextCount === 1 ? 'item' : 'itens'}</strong> do perfil {PROFILE_LABELS[nextProfile]} para evoluir seu perfil.
            </p>
          </motion.div>
        )}

        {/* ── Profile composition ─────────────────────────────────── */}
        {composition && compTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ backgroundColor: CARD, borderRadius: 14, padding: '18px 20px', border: `1px solid ${BORDER}`, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Composição do paladar
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROFILE_ORDER.map((p, i) => {
                const val = composition[p] ?? 0;
                const pct = compTotal > 0 ? Math.round((val / compTotal) * 100) : 0;
                if (pct === 0) return null;

                const BAR_COLORS: Record<WineProfile, string> = {
                  novato:      '#f59e0b',
                  curioso:     '#f97316',
                  desbravador: '#dc2626',
                  curador:     '#9f1239',
                  expert:      '#1c1b1f',
                };

                return (
                  <div key={p}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', color: TEXT2 }}>
                        {PROFILE_ICONS[p]} {PROFILE_LABELS[p]}
                      </span>
                      <span style={{ fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 600, color: TEXT1 }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ position: 'relative', height: 4, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: BAR_COLORS[p], borderRadius: 99 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Quiz CTA (if not done) / Retake button ─────────────── */}
        {!profileData?.quiz_completed ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #690037 0%, #9f1239 100%)',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>🍇</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                Descubra seu perfil
              </p>
              <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans'", fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>
                Responda o quiz e descubra que tipo de apreciador de vinhos você é.
              </p>
              <Link
                to="/onboarding"
                style={{
                  display: 'inline-block',
                  padding: '7px 18px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 99,
                  fontFamily: "'DM Sans'",
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                Fazer o quiz →
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ backgroundColor: CARD, borderRadius: 14, padding: '14px 20px', border: `1px solid ${BORDER}`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div style={{ fontSize: '1.4rem' }}>🍇</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 600, color: TEXT1 }}>
                Refazer o quiz
              </p>
              <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.7rem', color: TEXT2 }}>
                Seu gosto mudou? Atualize seu perfil.
              </p>
            </div>
            <Link
              to="/onboarding?retake=true"
              style={{
                display: 'inline-block',
                padding: '7px 16px',
                backgroundColor: WINE_C,
                borderRadius: 99,
                fontFamily: "'DM Sans'",
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#fff',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Refazer →
            </Link>
          </motion.div>
        )}

        {/* ── Wine diary shortcut ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          style={{ marginBottom: 12 }}
        >
          <Link
            to="/wine-diary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backgroundColor: CARD,
              borderRadius: 14,
              padding: '16px 20px',
              border: `1px solid ${BORDER}`,
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #690037 0%, #9f1239 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wine size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.85rem', fontWeight: 700, color: TEXT1 }}>
                Meu Diário de Vinhos
              </p>
              <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans'", fontSize: '0.72rem', color: TEXT2 }}>
                {triedCount > 0 ? `${triedCount} vinho${triedCount !== 1 ? 's' : ''} provado${triedCount !== 1 ? 's' : ''}` : 'Registre os vinhos que você provou'}
              </p>
            </div>
            <TrendingUp size={16} color={MUTED} />
          </Link>
        </motion.div>

        {/* ── Recent activity ─────────────────────────────────────── */}
        {recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{ backgroundColor: CARD, borderRadius: 14, padding: '18px 20px', border: `1px solid ${BORDER}`, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Atividade recente
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentActivity.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: SURF,
                    border: `1px solid ${BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Wine size={14} color={WINE_C} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.75rem', fontWeight: 500, color: TEXT1, lineHeight: 1.3 }}>
                      {ACTION_LABELS[act.action_type] ?? act.action_type}
                    </p>
                    <p style={{ margin: '1px 0 0', fontFamily: "'DM Sans'", fontSize: '0.62rem', color: MUTED }}>
                      {new Date(act.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: "'DM Sans'",
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: VERDE,
                    background: `${VERDE}14`,
                    borderRadius: 99,
                    padding: '3px 9px',
                    flexShrink: 0,
                  }}>
                    +{act.points}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {triedCount === 0 && favCount === 0 && recentActivity.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ textAlign: 'center', padding: '36px 20px' }}
          >
            <Wine size={36} color={MUTED} style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ margin: '0 0 8px', fontFamily: "'DM Sans'", fontSize: '1rem', fontWeight: 600, color: TEXT1 }}>
              Comece sua jornada
            </h3>
            <p style={{ margin: '0 0 20px', fontFamily: "'DM Sans'", fontSize: '0.8rem', color: TEXT2 }}>
              Explore regiões, vinhos e experiências para ganhar pontos.
            </p>
            <Link
              to="/explore"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: WINE_C,
                borderRadius: 99,
                fontFamily: "'DM Sans'",
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#FFFFFF',
                textDecoration: 'none',
              }}
            >
              Explorar
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
