import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { Wine, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

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
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Entrar</h2>
          <p className="text-sm text-neutral-500 mb-6">Acesse sua conta para continuar</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
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
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Não tem conta?{' '}
              <Link to="/register" className="text-red-800 font-semibold hover:text-red-700">
                Criar conta
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
