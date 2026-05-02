import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';

const BG   = '#F5EDE0';
const WINE = '#6B0035';

// ── Wine arch icon (same as rest of app) ─────────────────────
function WineArchIcon() {
  return (
    <svg width={36} height={51} viewBox="0 0 54 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="cb-clip">
          <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" />
        </clipPath>
      </defs>
      <circle cx="27" cy="1.5" r="1.5" fill={WINE} />
      <path d="M2,76 L2,24 Q2,0 27,0 Q52,0 52,24 L52,76 Z" stroke={WINE} strokeWidth="2.2" fill="none" />
      <g clipPath="url(#cb-clip)" stroke={WINE} strokeWidth="1.3" opacity="0.45">
        <line x1="-20" y1="60"  x2="80" y2="-40" />
        <line x1="-20" y1="80"  x2="80" y2="-20" />
        <line x1="-20" y1="100" x2="80" y2="0" />
        <line x1="-20" y1="120" x2="80" y2="20" />
        <line x1="-20" y1="140" x2="80" y2="40" />
        <line x1="-20" y1="0"   x2="80" y2="100" />
        <line x1="-20" y1="20"  x2="80" y2="120" />
        <line x1="-20" y1="40"  x2="80" y2="140" />
      </g>
      <path d="M7,74 L7,24 Q7,4 27,4 Q47,4 47,24 L47,74 Z" stroke={WINE} strokeWidth="1.8" fill="none" />
      <circle cx="18" cy="62" r="5.5" stroke={WINE} strokeWidth="1.6" fill="none" />
      <circle cx="36" cy="62" r="5.5" stroke={WINE} strokeWidth="1.6" fill="none" />
      <circle cx="27" cy="53" r="3.5" stroke={WINE} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    // Supabase JS v2 automatically exchanges the code/token in the URL.
    // We just listen for the resulting SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled.current) return;

        if (event === 'PASSWORD_RECOVERY') {
          handled.current = true;
          navigate('/reset-password', { replace: true });
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          handled.current = true;

          // Check if user has already completed onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('quiz_completed')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.quiz_completed) {
            navigate('/', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        }
      }
    );

    // Also handle the case where the session is already available
    // (user landed here with a valid session already in storage)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (handled.current || !session) return;
      handled.current = true;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quiz_completed')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.quiz_completed) {
        navigate('/', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <WineArchIcon />
      <p
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.9rem',
          color: '#7A6855',
          margin: 0,
        }}
      >
        Confirmando sua conta…
      </p>
      {/* Subtle spinner */}
      <div
        style={{
          width: 24,
          height: 24,
          border: `2px solid rgba(107,0,53,0.15)`,
          borderTopColor: WINE,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
