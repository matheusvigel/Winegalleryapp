import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';

const ADMIN_EMAILS = ['matheus@wine-locals.com'];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!ADMIN_EMAILS.includes(session.user.email ?? '')) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-3">🔒</p>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-sm text-neutral-500">Você não tem permissão para acessar o backoffice.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
