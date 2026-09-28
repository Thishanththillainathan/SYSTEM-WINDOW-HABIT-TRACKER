import React, { useState } from 'react';
import { Achievement, AchievementTab, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import { 
  Award, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Cpu, 
  Swords, 
  Crown, 
  Share2, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { ShareAchievementModal } from './ShareAchievementModal';

interface AchievementsViewProps {
  achievements: Achievement[];
  user: UserProfile;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ achievements, user }) => {
  const [activeTab, setActiveTab] = useState<AchievementTab>('weekly');
  const [selectedShare, setSelectedShare] = useState<Achievement | null>(null);

  const filteredAchievements = achievements.filter((a) => a.tab === activeTab);

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_#f59e0b]';
      case 'Epic':
        return 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_10px_#a855f7]';
      case 'Rare':
        return 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_10px_#3b82f6]';
      case 'Uncommon':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
            SYSTEM ACHIEVEMENTS & TROPHIES
          </h1>
          <p className="text-xs font-tech text-white/60">
            [MILESTONE BADGES] CONSISTENCY REWARDS & SHAREABLE CERTIFICATES
          </p>
        </div>

        {/* Weekly vs Monthly Tabs */}
        <div className="bg-white/5 p-1 rounded-lg border border-white/15 flex text-xs font-mono">
          <button
            onClick={() => {
              soundFx.playBlip(800);
              setActiveTab('weekly');
            }}
            className={`px-4 py-1.5 rounded transition ${
              activeTab === 'weekly'
                ? 'bg-white/12 border border-white/30 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            WEEKLY TROPHIES
          </button>
          <button
            onClick={() => {
              soundFx.playBlip(800);
              setActiveTab('monthly');
            }}
            className={`px-4 py-1.5 rounded transition ${
              activeTab === 'monthly'
                ? 'bg-white/12 border border-white/30 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            MONTHLY MILESTONES
          </button>
        </div>
      </div>

      {/* Grid of Achievements or Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.length === 0 ? (
          <div className="system-panel p-12 text-center space-y-3 font-mono text-xs rounded-xl border-white/15 col-span-2">
            <Award className="w-10 h-10 text-white/30 mx-auto" />
            <div className="text-base font-bold text-white font-orbitron">No trophies unlocked yet</div>
            <div className="text-xs text-white/50">Complete daily habits and main quests to unlock achievements.</div>
          </div>
        ) : (
          filteredAchievements.map((item) => {
          const percent = Math.min(100, Math.round((item.progress / item.maxProgress) * 100));

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition-all relative overflow-hidden ${
                item.earned
                  ? 'system-panel-glow border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                  : 'system-panel border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                      item.earned
                        ? 'bg-white/12 border-white/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-white/5 border-white/10 text-white/30'
                    }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-orbitron font-bold text-base text-white">
                        {item.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.2 rounded border font-bold ${getRarityBadge(
                          item.rarity
                        )}`}
                      >
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-rajdhani text-white/70 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Share Button if Earned */}
                {item.earned && (
                  <button
                    onClick={() => {
                      soundFx.playAchievement();
                      setSelectedShare(item);
                    }}
                    className="p-1.5 rounded bg-white/10 border border-white/30 text-white hover:bg-white/20 transition"
                    title="Share Achievement Card"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress or Earned Date */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-mono">
                {item.earned ? (
                  <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>UNLOCKED: {item.earnedDate || 'Recently'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-white/50">
                    <Lock className="w-3.5 h-3.5 text-white/40" />
                    <span>
                      PROGRESS: {item.progress} / {item.maxProgress} ({percent}%)
                    </span>
                  </div>
                )}
              </div>

              {!item.earned && (
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/15 mt-2">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* Share Achievement Modal Popup */}
      {selectedShare && (
        <ShareAchievementModal
          achievement={selectedShare}
          user={user}
          onClose={() => setSelectedShare(null)}
        />
      )}
    </div>
  );
};
