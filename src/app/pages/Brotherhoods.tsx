import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { Users, Plus, Globe, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Brotherhood {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  highlight: string;
  website: string | null;
}

interface UserBrotherhood {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  creator_id: string;
  is_private: boolean;
  member_count: number;
}

type Tab = 'catalog' | 'my' | 'discover';

export default function Brotherhoods() {
  const { user } = useAuth();
  const [brotherhoods, setBrotherhoods] = useState<Brotherhood[]>([]);
  const [userBrotherhoods, setUserBrotherhoods] = useState<UserBrotherhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', photo: '', isPrivate: false });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [{ data: catalog }, { data: userBhs }] = await Promise.all([
      supabase.from('brotherhoods').select('id, name, description, photo, highlight, website').order('name'),
      supabase.from('user_brotherhoods').select('id, name, description, photo, creator_id, is_private, member_count').order('name'),
    ]);
    setBrotherhoods((catalog as Brotherhood[]) ?? []);
    setUserBrotherhoods((userBhs as UserBrotherhood[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Faça login para criar uma confraria'); return; }
    setSaving(true);
    const { error } = await supabase.from('user_brotherhoods').insert({
      name: formData.name,
      description: formData.description,
      photo: formData.photo || null,
      creator_id: user.id,
      is_private: formData.isPrivate,
      member_count: 1,
    });
    if (error) {
      toast.error('Erro ao criar confraria');
    } else {
      toast.success('Confraria criada com sucesso!');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', photo: '', isPrivate: false });
      loadData();
    }
    setSaving(false);
  };

  const myBrotherhoods = userBrotherhoods.filter((b) => b.creator_id === user?.id);
  const discoverBrotherhoods = userBrotherhoods.filter((b) => !b.is_private && b.creator_id !== user?.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'catalog',  label: 'Catálogo'   },
    { key: 'my',       label: 'Minhas'      },
    { key: 'discover', label: 'Descobrir'   },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Confrarias
              </h1>
              <p className="text-sm text-gray-600">Conecte-se com entusiastas do vinho</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-24" />)}
          </div>
        ) : (
          <>
            {/* Catalog brotherhoods */}
            {activeTab === 'catalog' && (
              <div className="space-y-4">
                {brotherhoods.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Nenhuma confraria no catálogo</h3>
                    <p className="text-gray-600 text-sm">As confrarias oficiais aparecerão aqui após serem cadastradas.</p>
                  </div>
                ) : (
                  brotherhoods.map((b) => (
                    <Link key={b.id} to={`/brotherhoods/catalog/${b.id}`} className="block bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all">
                      <div className="flex items-start gap-4">
                        {b.photo ? (
                          <img src={b.photo} alt={b.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{b.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{b.highlight || b.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* My brotherhoods */}
            {activeTab === 'my' && (
              <div className="space-y-4">
                {myBrotherhoods.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Nenhuma confraria criada</h3>
                    <p className="text-gray-600 text-sm mb-4">Crie sua primeira confraria e convide amigos!</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium"
                    >
                      Criar Confraria
                    </button>
                  </div>
                ) : (
                  myBrotherhoods.map((b) => (
                    <Link key={b.id} to={`/brotherhoods/${b.id}`} className="block bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all">
                      <div className="flex items-start gap-4">
                        {b.photo ? (
                          <img src={b.photo} alt={b.name} className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-bold text-gray-900">{b.name}</h3>
                            {b.is_private ? <Lock className="w-4 h-4 text-gray-400" /> : <Globe className="w-4 h-4 text-gray-400" />}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-1">{b.description}</p>
                          <span className="text-xs text-gray-500">{b.member_count} membros</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Discover */}
            {activeTab === 'discover' && (
              <div className="space-y-4">
                {discoverBrotherhoods.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                    <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Nenhuma confraria pública</h3>
                    <p className="text-gray-600 text-sm">As confrarias criadas por outros usuários aparecerão aqui.</p>
                  </div>
                ) : (
                  discoverBrotherhoods.map((b) => (
                    <Link key={b.id} to={`/brotherhoods/${b.id}`} className="block bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all">
                      <div className="flex items-start gap-4">
                        {b.photo ? (
                          <img src={b.photo} alt={b.name} className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{b.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-1">{b.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{b.member_count} membros</span>
                            <Globe className="w-3 h-3" /><span>Pública</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Criar Confraria</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Ex: Amantes de Espumantes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  required rows={3} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                  placeholder="Descreva sua confraria..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL da Foto (opcional)</label>
                <input
                  type="url" value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="isPrivate" checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700">Confraria privada (somente por convite)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-60">
                  {saving ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
