import { useState, useEffect } from 'react';

import { AchievementCard, type Achievement } from '../components/AchievementCard';
import { Trophy, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Static achievement definitions — unlocked based on user_stats
const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  { id: 'first_wine',    name: 'Primeiro Brinde',          description: 'Experimente seu primeiro vinho',                    icon: '🍷', total: 1  },
  { id: 'explorer_3',   name: 'Explorador de Terroirs',    description: 'Prove vinhos de 3 regiões diferentes',              icon: '🗺️', total: 3  },
  { id: 'collector_5',  name: 'Colecionador',              description: 'Complete 5 itens em qualquer coleção',              icon: '🏆', total: 5  },
  { id: 'adventurer_5', name: 'Aventureiro do Vinho',      description: 'Viva 5 experiências diferentes',                    icon: '⛰️', total: 5  },
  { id: 'sommelier_10', name: 'Sommelier em Formação',     description: 'Prove 10 vinhos diferentes',                        icon: '🥂', total: 10 },
  { id: 'explorer_5',   name: 'Grande Explorador',         description: 'Explore 5 regiões vinícolas',                       icon: '🌍', total: 5  },
];

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ winesTried: 0, experiencesLived: 0, regionsExplored: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        // Guest: show locked achievements with 0 progress
        setAchievements(ACHIEVEMENT_DEFS.map((d) => ({ ...d, unlocked: false, progress: 0 })));
        setLoading(false);
        return;
      }

      const [{ data: userStats }, { data: completedItems }] = await Promise.all([
        supabase.from('user_stats').select('total_points, completed_count').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_progress').select('item_id').eq('user_id', user.id).eq('completed', true),
      ]);

      const completed = completedItems?.length ?? 0;
      const pts = userStats?.total_points ?? 0;

      // For now use completed_count as proxy for wines tried
      const updatedStats = {
        winesTried: completed,
        experiencesLived: 0,
        regionsExplored: 0,
        totalPoints: pts,
      };
      setStats(updatedStats);

      // Map achievements to progress
      const mapped: Achievement[] = ACHIEVEMENT_DEFS.map((d) => {
        let progress = 0;
        if (d.id === 'first_wine' || d.id === 'sommelier_10') progress = Math.min(completed, d.total);
        else if (d.id === 'collector_5') progress = Math.min(completed, d.total);
        else progress = 0;
        return { ...d, progress, unlocked: progress >= d.total };
      });

      setAchievements(mapped);
      setLoading(false);
    };
    load();
  }, [user]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked   = achievements.filter((a) => !a.unlocked);
  const overallPct = achievements.length
    ? Math.round((unlocked.length / achievements.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Conquistas</h1>
          <p className="text-sm text-gray-600">Seu mapa de vivências no mundo do vinho</p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Stats card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8" />
            <div>
              <div className="text-3xl font-bold">{unlocked.length}/{achievements.length}</div>
              <div className="text-purple-100 text-sm">Conquistas Desbloqueadas</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-100">Progresso Geral</span>
              <span className="font-bold">{overallPct}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-purple-400/30">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.winesTried}</div>
              <div className="text-xs text-purple-200">Itens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
              <div className="text-xs text-purple-200">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unlocked.length}</div>
              <div className="text-xs text-purple-200">Conquistas</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-28" />)}
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Todas as Conquistas</h2>
            </div>

            <div className="space-y-4">
              {unlocked.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Desbloqueadas</h3>
                  {unlocked.map((a) => <AchievementCard key={a.id} achievement={a} />)}
                </div>
              )}
              {locked.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Em Progresso</h3>
                  {locked.map((a) => <AchievementCard key={a.id} achievement={a} />)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Continue explorando!</h3>
            <p className="text-sm text-gray-700">
              Cada vinho provado, experiência vivida e vinícola visitada te aproxima de novas conquistas.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
