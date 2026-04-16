import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Users, UserPlus, Globe, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface BrotherhoodRow {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  creator_id: string;
  is_private: boolean;
  member_count: number;
}

interface MemberRow {
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles: { display_name: string; avatar: string | null } | null;
}

export default function BrotherhoodDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [brotherhood, setBrotherhood] = useState<BrotherhoodRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [{ data: bh }, { data: rawMems }] = await Promise.all([
      supabase.from('user_brotherhoods').select('*').eq('id', id).maybeSingle(),
      supabase.from('brotherhood_members')
        .select('user_id, role, joined_at')
        .eq('brotherhood_id', id)
        .eq('brotherhood_type', 'user'),
    ]);
    setBrotherhood(bh as BrotherhoodRow | null);

    const memberRows = rawMems ?? [];
    const userIds = memberRows.map((m: { user_id: string }) => m.user_id);

    let profileMap: Record<string, { display_name: string; avatar: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar')
        .in('user_id', userIds);
      for (const p of profiles ?? []) {
        profileMap[p.user_id] = { display_name: p.display_name, avatar: p.avatar };
      }
    }

    const enriched: MemberRow[] = memberRows.map((m: { user_id: string; role: string; joined_at: string }) => ({
      ...m,
      user_profiles: profileMap[m.user_id] ?? null,
    }));

    setMembers(enriched);
    if (user) setIsMember(memberRows.some((m: { user_id: string }) => m.user_id === user.id));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id, user]);

  const handleJoin = async () => {
    if (!user || !id) { toast.error('Faça login para entrar na confraria'); return; }
    setJoining(true);
    const { error } = await supabase.from('brotherhood_members').insert({
      brotherhood_id: id,
      brotherhood_type: 'user',
      user_id: user.id,
      role: 'member',
    });
    if (error) {
      toast.error('Erro ao entrar na confraria');
    } else {
      // Update member_count
      await supabase.from('user_brotherhoods').update({ member_count: (brotherhood?.member_count ?? 0) + 1 }).eq('id', id);
      toast.success('Você entrou na confraria!');
      loadData();
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !id || !confirm('Tem certeza que deseja sair desta confraria?')) return;
    setJoining(true);
    await supabase.from('brotherhood_members').delete().eq('brotherhood_id', id).eq('user_id', user.id);
    await supabase.from('user_brotherhoods').update({ member_count: Math.max(0, (brotherhood?.member_count ?? 1) - 1) }).eq('id', id);
    toast.success('Você saiu da confraria');
    loadData();
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brotherhood) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confraria não encontrada</h2>
          <Link to="/brotherhoods" className="text-purple-600 hover:underline">Voltar para Confrarias</Link>
        </div>
      </div>
    );
  }

  const isCreator = brotherhood.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/brotherhoods" className="text-gray-600 hover:text-purple-600 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{brotherhood.name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Cover photo */}
        {brotherhood.photo && (
          <div className="rounded-3xl overflow-hidden mb-6 shadow-lg">
            <img src={brotherhood.photo} alt={brotherhood.name} className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
            {brotherhood.is_private
              ? <><Lock className="w-4 h-4" /><span>Privada</span></>
              : <><Globe className="w-4 h-4" /><span>Pública</span></>
            }
            <span>•</span>
            <span>{brotherhood.member_count} membros</span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{brotherhood.description}</p>

          {/* Actions */}
          <div className="flex gap-3">
            {!user ? (
              <Link to="/login" className="flex-1 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium">
                Entrar para participar
              </Link>
            ) : !isMember ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-60"
              >
                {joining ? 'Entrando...' : 'Entrar na Confraria'}
              </button>
            ) : (
              <>
                <button className="flex-1 bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" /> Convidar
                </button>
                {!isCreator && (
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium disabled:opacity-60"
                  >
                    Sair
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-md">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Membros ({members.length})</h2>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  {m.user_profiles?.avatar ? (
                    <img src={m.user_profiles.avatar} alt={m.user_profiles.display_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {(m.user_profiles?.display_name ?? 'U').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{m.user_profiles?.display_name ?? 'Usuário'}</div>
                  </div>
                  {m.role === 'admin' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
