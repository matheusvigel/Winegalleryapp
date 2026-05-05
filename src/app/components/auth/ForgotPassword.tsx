import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const BG     = '#E9E3D9';
const CARD   = '#FFFFFF';
const SURF   = '#F5F0E8';
const WINE   = '#690037';
const TEXT1  = '#1C1B1F';
const MUTED  = '#9B9B9B';
const BORDER = 'rgba(0,0,0,0.08)';

function WineArchIcon({ size = 40 }: { size?: number }) {
  const h = Math.round((size * 76) / 54);
  return (
    <svg width={size} height={h} viewBox="0 0 54 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="wg-arch-forgot"><path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z"/></clipPath></defs>
      <circle cx="27" cy="1.5" r="1.5" fill="#2D3A3A"/>
      <path d="M2,76 L2,24 Q2,0 27,0 Q52,0 52,24 L52,76 Z" stroke="#2D3A3A" strokeWidth="2.2" fill="none"/>
      <g clipPath="url(#wg-arch-forgot)" stroke="#2D3A3A" strokeWidth="1.3" opacity="0.5">
        <line x1="-20" y1="60" x2="80" y2="-40"/><line x1="-20" y1="80" x2="80" y2="-20"/>
        <line x1="-20" y1="100" x2="80" y2="0"/><line x1="-20" y1="120" x2="80" y2="20"/>
        <line x1="-20" y1="0" x2="80" y2="100"/><line x1="-20" y1="20" x2="80" y2="120"/>
      </g>
      <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" stroke="#2D3A3A" strokeWidth="1.8" fill="none"/>
      <circle cx="18" cy="62" r="5.5" stroke="#2D3A3A" strokeWidth="1.6" fill="none"/>
      <circle cx="36" cy="62" r="5.5" stroke="#2D3A3A" strokeWidth="1.6" fill="none"/>
      <circle cx="27" cy="53" r="3.5" stroke="#2D3A3A" strokeWidth="1.4" fill="none"/>
    </svg>
  );
}

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError('Não foi possível enviar o email. Tente novamente.');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 16px',
    backgroundColor: SURF, border: `1px solid ${BORDER}`,
    borderRadius: 8, fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '0.875rem', color: TEXT1, outline: 'none',
    caretColor: WINE, boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px' }}>

        {/* Branding */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: 36 }}>
          <WineArchIcon size={40} />
          <h1 style={{ margin: '14px 0 4px', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.75rem', color: TEXT1, letterSpacing: '-0.01em', lineHeight: 1 }}>
            wine gallery
          </h1>
          <p style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '0.78rem', color: MUTED }}>
            Sua jornada pelo mundo do vinho
          </p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                    style={{ width: '100%', maxWidth: 360, backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {sent ? (
            /* ── Success state ───────────────────────────── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(45,74,62,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={28} color="#2D4A3E" />
              </div>
              <h2 style={{ margin: '0 0 8px', fontFamily: "'DM Sans'", fontSize: '1.05rem', fontWeight: 700, color: TEXT1 }}>
                Email enviado!
              </h2>
              <p style={{ margin: '0 0 20px', fontFamily: "'DM Sans'", fontSize: '0.82rem', color: MUTED, lineHeight: 1.5 }}>
                Se <strong style={{ color: TEXT1 }}>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p style={{ margin: '0 0 20px', fontFamily: "'DM Sans'", fontSize: '0.75rem', color: MUTED }}>
                Não recebeu? Verifique a pasta de spam ou
              </p>
              <button onClick={() => { setSent(false); setEmail(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: '0.82rem', fontWeight: 600, color: WINE }}>
                tente com outro email
              </button>
            </div>
          ) : (
            /* ── Form state ──────────────────────────────── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(105,0,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={18} color={WINE} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '1.05rem', fontWeight: 700, color: TEXT1 }}>
                    Recuperar senha
                  </h2>
                  <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.75rem', color: MUTED }}>
                    Enviaremos um link para o seu email
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(105,0,55,0.06)', border: '1px solid rgba(105,0,55,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: WINE }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: "'DM Sans'", fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>
                    Email
                  </label>
                  <input type="email" required autoFocus placeholder="seu@email.com"
                         value={email} onChange={e => setEmail(e.target.value)}
                         style={inputStyle}
                         onFocus={e => (e.target.style.borderColor = 'rgba(105,0,55,0.35)')}
                         onBlur={e => (e.target.style.borderColor = BORDER)} />
                </div>

                <button type="submit" disabled={loading}
                        style={{ marginTop: 4, width: '100%', height: 44, backgroundColor: loading ? 'rgba(105,0,55,0.4)' : WINE, color: '#fff', fontFamily: "'DM Sans'", fontSize: '0.875rem', fontWeight: 600, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s ease' }}>
                  {loading ? 'Enviando…' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans'", fontSize: '0.78rem', color: MUTED, textDecoration: 'none', fontWeight: 500 }}>
              <ArrowLeft size={13} /> Voltar para o login
            </Link>
          </div>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', padding: '0 0 28px' }}>
        <p style={{ margin: 0, fontFamily: "'DM Sans'", fontSize: '0.65rem', color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Beba com moderação
        </p>
      </div>
    </div>
  );
}
