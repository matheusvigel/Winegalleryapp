import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

const BG    = '#E9E3D9';
const CARD  = '#FFFFFF';
const SURF  = '#F5F0E8';
const WINE  = '#690037';
const VERDE = '#2D3A3A';
const TEXT1 = '#1C1B1F';
const TEXT2 = '#5C5C5C';
const MUTED = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

function WineArchIcon({ size = 36 }: { size?: number }) {
  const h = Math.round((size * 76) / 54);
  return (
    <svg width={size} height={h} viewBox="0 0 54 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="wg-arch-login">
          <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" />
        </clipPath>
      </defs>
      <circle cx="27" cy="1.5" r="1.5" fill={VERDE} />
      <path d="M2,76 L2,24 Q2,0 27,0 Q52,0 52,24 L52,76 Z" stroke={VERDE} strokeWidth="2.2" fill="none" />
      <g clipPath="url(#wg-arch-login)" stroke={VERDE} strokeWidth="1.3" opacity="0.5">
        <line x1="-20" y1="60"  x2="80" y2="-40" />
        <line x1="-20" y1="80"  x2="80" y2="-20" />
        <line x1="-20" y1="100" x2="80" y2="0"   />
        <line x1="-20" y1="120" x2="80" y2="20"  />
        <line x1="-20" y1="140" x2="80" y2="40"  />
        <line x1="-20" y1="160" x2="80" y2="60"  />
        <line x1="-20" y1="0"   x2="80" y2="100" />
        <line x1="-20" y1="20"  x2="80" y2="120" />
        <line x1="-20" y1="40"  x2="80" y2="140" />
        <line x1="-20" y1="60"  x2="80" y2="160" />
        <line x1="-20" y1="80"  x2="80" y2="180" />
        <line x1="-20" y1="100" x2="80" y2="200" />
      </g>
      <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" stroke={VERDE} strokeWidth="1.8" fill="none" />
      <circle cx="18" cy="62" r="5.5" stroke={VERDE} strokeWidth="1.6" fill="none" />
      <circle cx="36" cy="62" r="5.5" stroke={VERDE} strokeWidth="1.6" fill="none" />
      <circle cx="27" cy="53" r="3.5" stroke={VERDE} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') ?? '/profile';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
      } else {
        setError('Email ou senha inválidos. Tente novamente.');
      }
      setLoading(false);
      return;
    }
    navigate(from, { replace: true });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 16px',
    backgroundColor: SURF,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '0.875rem',
    color: TEXT1,
    outline: 'none',
    caretColor: WINE,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: BG,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <WineArchIcon size={40} />
          <h1 style={{
            margin: '14px 0 4px',
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 700,
            fontSize: '1.75rem',
            color: TEXT1,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            wine gallery
          </h1>
          <p style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.78rem', color: MUTED }}>
            Sua jornada pelo mundo do vinho
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: CARD,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: '28px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontFamily: "'DM Sans'", fontSize: '1.1rem', fontWeight: 700, color: TEXT1, letterSpacing: '-0.02em' }}>
            Entrar
          </h2>
          <p style={{ margin: '0 0 22px', fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div style={{ backgroundColor: 'rgba(105,0,55,0.06)', border: '1px solid rgba(105,0,55,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(105,0,55,0.35)')}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(105,0,55,0.35)')}
                  onBlur={e => (e.target.style.borderColor = BORDER)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: MUTED }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                width: '100%',
                height: 44,
                backgroundColor: loading ? 'rgba(105,0,55,0.4)' : WINE,
                color: '#FFFFFF',
                fontFamily: "'DM Sans'",
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED }}>
              Não tem conta?{' '}
              <Link to="/register" style={{ color: WINE, fontWeight: 600, textDecoration: 'none' }}>
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '0 0 28px' }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Beba com moderação
        </p>
      </div>
    </div>
  );
}
