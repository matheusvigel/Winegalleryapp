export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const pct = Math.round((achievement.progress / achievement.total) * 100);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
      achievement.unlocked
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-lg'
        : 'bg-gray-50 border-2 border-gray-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`text-5xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>

        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
            {achievement.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={achievement.unlocked ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                {achievement.progress} / {achievement.total}
              </span>
              <span className={achievement.unlocked ? 'text-yellow-600 font-bold' : 'text-gray-500'}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                    : 'bg-gray-300'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            DESBLOQUEADO
          </div>
        </div>
      )}
    </div>
  );
}
