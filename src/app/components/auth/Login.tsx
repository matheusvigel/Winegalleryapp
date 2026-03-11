import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

/* ── Arch icon re-used from Root (inlined for auth isolation) ───── */
function WineArchIcon({ size = 36 }: { size?: number }) {
  const h = Math.round((size * 68) / 52);
  return (
    <svg width={size} height={h} viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="wg-arch-login">
          <path d="M8,66 L8,23 Q8,6 26,6 Q44,6 44,23 L44,66 Z" />
        </clipPath>
      </defs>
      <path d="M3,68 L3,23 Q3,2 26,2 Q49,2 49,23 L49,68 Z" stroke="#C5A25A" strokeWidth="2" />
      <g clipPath="url(#wg-arch-login)" stroke="#C5A25A" strokeWidth="1.1" opacity="0.5">
        <line x1="-60" y1="74"  x2="120" y2="-106" />
        <line x1="-60" y1="90"  x2="120" y2="-90"  />
        <line x1="-60" y1="106" x2="120" y2="-74"  />
        <line x1="-60" y1="122" x2="120" y2="-58"  />
        <line x1="-40" y1="-62" x2="90" y2="68"  />
        <line x1="-40" y1="-46" x2="90" y2="84"  />
        <line x1="-40" y1="-30" x2="90" y2="100" />
      </g>
      <path d="M8,66 L8,23 Q8,6 26,6 Q44,6 44,23 L44,66 Z" stroke="#C5A25A" strokeWidth="1.6" />
      <circle cx="18" cy="57" r="5"   stroke="#C5A25A" strokeWidth="1.5" />
      <circle cx="34" cy="57" r="5"   stroke="#C5A25A" strokeWidth="1.5" />
      <circle cx="26" cy="49" r="3.5" stroke="#C5A25A" strokeWidth="1.3" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
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
    navigate('/profile');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 16px',
    backgroundColor: '#1C1915',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '0.875rem',
    color: '#E2D4BA',
    outline: 'none',
    caretColor: '#C5A25A',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0907',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,26,54,0.12) 0%, transparent 70%)',
    }}>

      {/* Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <WineArchIcon size={40} />
          <h1 style={{
            margin: '16px 0 4px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: '1.75rem',
            color: '#E2D4BA',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            wine gallery
          </h1>
          <p style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.78rem', color: '#574E47', letterSpacing: '0.04em' }}>
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
            backgroundColor: '#141210',
            borderRadius: 16,
            border: '1px solid rgba(197,162,90,0.14)',
            padding: '28px 24px',
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 500, color: '#E2D4BA' }}>
            Entrar
          </h2>
          <p style={{ margin: '0 0 22px', fontFamily: "'DM Sans'", fontSize: '0.78rem', color: '#574E47' }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div style={{ backgroundColor: 'rgba(139,26,54,0.12)', border: '1px solid rgba(139,26,54,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: '#C46B7F' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.06em', color: '#8C8074', marginBottom: 6 }}>
                EMAIL
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
                onFocus={e => (e.target.style.borderColor = 'rgba(197,162,90,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: "'DM Sans'", fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.06em', color: '#8C8074', marginBottom: 6 }}>
                SENHA
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
                  onFocus={e => (e.target.style.borderColor = 'rgba(197,162,90,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#574E47' }}
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
                backgroundColor: loading ? 'rgba(197,162,90,0.3)' : '#C5A25A',
                color: '#0B0907',
                fontFamily: "'DM Sans'",
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
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
            <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: '#574E47' }}>
              Não tem conta?{' '}
              <Link to="/register" style={{ color: '#C5A25A', fontWeight: 500, textDecoration: 'none' }}>
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '0 0 28px' }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.65rem', color: '#2A2218', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Beba com moderação
        </p>
      </div>
    </div>
  );
}
