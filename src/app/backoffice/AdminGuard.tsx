import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import { supabase } from '../../lib/supabase';

// Emergency fallback — these emails always get admin access even if DB check fails
const ADMIN_EMAILS_FALLBACK = ['matheus@wine-locals.com'];

type CheckState = 'loading' | 'allowed' | 'denied' | 'unauthenticated';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [check, setCheck] = useState<CheckState>('loading');

  useEffect(() => {
    if (loading) return;
    if (!session) { setCheck('unauthenticated'); return; }

    // Fast fallback: if email is in hardcoded list, allow immediately
    if (ADMIN_EMAILS_FALLBACK.includes(session.user.email ?? '')) {
      setCheck('allowed');
      return;
    }

    // DB check: look up user_type in user_profiles
    supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('[AdminGuard] DB error:', error.message);
          setCheck('denied');
          return;
        }
        setCheck(data?.user_type === 'admin' ? 'allowed' : 'denied');
      });
  }, [session, loading]);

  if (check === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Verificando acesso…</p>
      </div>
    );
  }

  if (check === 'unauthenticated') {
    return <Navigate to="/login?from=/admin" replace />;
  }

  if (check === 'denied') {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-sm w-full text-center">
          <p className="text-3xl mb-4">🔒</p>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Você não tem permissão para acessar o backoffice.<br />
            Entre em contato com o administrador do sistema.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors"
          >
            Voltar ao app
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
