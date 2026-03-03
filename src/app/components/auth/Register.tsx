import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { Wine, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
      setLoading(false);
      return;
    }

    // Se não há sessão, o Supabase exige confirmação de email
    if (!data.session) {
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // Conta criada e sessão ativa — seguir para onboarding
    localStorage.removeItem('wine-gallery-onboarding');
    navigate('/onboarding');
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Confirme seu email</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta e depois faça login.
          </p>
          <Link
            to="/login"
            className="block w-full h-11 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg text-sm flex items-center justify-center transition-colors"
          >
            Ir para o login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col">
      {/* Top branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wine size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Wine Gallery</h1>
          <p className="text-red-200 mt-2 text-sm">Sua jornada pelo mundo do vinho</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7"
        >
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Criar conta</h2>
          <p className="text-sm text-neutral-500 mb-6">Comece sua jornada vinícola</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700" htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-neutral-300 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20 transition-all bg-neutral-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-neutral-300 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20 transition-all bg-neutral-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-neutral-300 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20 transition-all bg-neutral-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Já tem conta?{' '}
              <Link to="/login" className="text-red-800 font-semibold hover:text-red-700">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-red-300 text-xs">Beba com moderação</p>
      </div>
    </div>
  );
}
