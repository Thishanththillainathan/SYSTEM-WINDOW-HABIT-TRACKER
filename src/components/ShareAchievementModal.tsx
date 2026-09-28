import React, { useState } from 'react';
import { Achievement, UserProfile } from '../types';
import { X, Award, CheckCircle, Copy } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface ShareAchievementModalProps {
  achievement: Achievement;
  user: UserProfile;
  onClose: () => void;
}

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  achievement,
  user,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    soundFx.playBlip(1000);
    const text = `🏆 System Achievement Unlocked in System Window!\n"${achievement.name}" - ${achievement.description}\nHunter: ${user.username} (${user.rank}-Rank)\nLevel Up Your Life at System Window.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05020a]/85 backdrop-blur-md animate-window-open">
      <div className="system-panel-glow max-w-md w-full p-6 rounded-xl border-white/20 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] bg-white/5 backdrop-blur-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-white/50 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/12 border-2 border-white/30 shadow-[0_0_25px_rgba(168,85,247,0.5)] mx-auto">
            <Award className="w-8 h-8 text-purple-300 animate-pulse" />
          </div>

          <div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-1">
              SYSTEM ACHIEVED • {achievement.rarity.toUpperCase()} RARITY
            </span>
            <h3 className="font-orbitron font-bold text-xl text-white tracking-wide">
              {achievement.name}
            </h3>
            <p className="text-sm font-rajdhani text-white/70 mt-1">
              {achievement.description}
            </p>
          </div>

          {/* Card Mockup */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-left font-mono text-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-purple-300 text-[10px]">
              <span>SYSTEM WINDOW HUNTER CERTIFICATE</span>
              <span>RANK {user.rank}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-white/60">HUNTER:</span>
              <span className="text-white font-bold">{user.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">LEVEL / STREAK:</span>
              <span className="text-purple-300">LVL {user.level} • {user.streak}D Streak</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">DATE UNLOCKED:</span>
              <span className="text-emerald-400">{achievement.earnedDate || 'Today'}</span>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center space-x-2 rounded border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>SHARE ACHIEVEMENT CARD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
