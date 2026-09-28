import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { rankService, RankChallengeData } from '../services/rankService';
import { Shield, Target, Flame, AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface RankChallengeCardProps {
  user: UserProfile;
  onRefreshUser?: () => void;
}

export const RankChallengeCard: React.FC<RankChallengeCardProps> = ({ user, onRefreshUser }) => {
  const [challenge, setChallenge] = useState<RankChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChallenge = async () => {
    setLoading(true);
    const data = await rankService.fetchRankChallenge();
    setChallenge(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChallenge();
  }, [user.rank]);

  const currentRank = (challenge?.currentRank || user.rank || 'E').toUpperCase();
  const isMaxRank = currentRank === 'S' || challenge?.status === 'MAX_RANK';
  const targetRank = isMaxRank ? 'MAX RANK' : (challenge?.targetRank || 'D').toUpperCase();

  const baseDays = challenge?.baseRequiredDays || 90;
  const missedDays = challenge?.missedDays || 0;
  const completedDays = challenge?.completedDays || 0;
  const promotionDelayDays = challenge?.promotionDelayDays || missedDays; // EXACT RULE: 1 missed day = 1 day delay
  const adjustedRequiredDays = challenge?.adjustedRequiredDays || (baseDays + missedDays);

  const currentPromotionDate = challenge?.currentPromotionDate || 'N/A';
  const originalPromotionDate = challenge?.originalPromotionDate || 'N/A';

  const currentDayCount = Math.min(adjustedRequiredDays, completedDays + missedDays);
  const progressPercent = Math.min(100, Math.round((completedDays / adjustedRequiredDays) * 100));

  const formatDateLabel = (isoDateStr?: string) => {
    if (!isoDateStr || isoDateStr === 'N/A' || isoDateStr === 'MAX RANK REACHED') return isoDateStr || 'N/A';
    try {
      const d = new Date(isoDateStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoDateStr;
    }
  };

  return (
    <div className="system-panel p-5 rounded-2xl border-white/20 bg-[#0a0412]/85 backdrop-blur-xl space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] font-mono text-xs">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Shield className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-sm text-white tracking-wider flex items-center space-x-2">
              <span>90-DAY RANK PROMOTION CHALLENGE</span>
            </h3>
            <p className="text-[11px] text-purple-300/80 mt-0.5">
              Strict Rule: 1 Missed Scheduled Day = 1 Day Promotion Delay
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2.5 py-1 rounded bg-purple-500/25 border border-purple-400/40 font-orbitron font-bold text-xs text-white">
            {currentRank}-RANK → {targetRank}
          </span>
        </div>
      </div>

      {isMaxRank ? (
        <div className="p-6 rounded-xl bg-purple-950/30 border border-purple-400/40 text-center space-y-2">
          <div className="font-orbitron font-black text-2xl text-amber-300 tracking-wider">
            S-RANK
          </div>
          <div className="font-orbitron font-bold text-sm text-white">MAX RANK ACHIEVED</div>
          <p className="text-white/60 text-[11px]">
            You have attained the supreme Hunter status. All rank progression challenges are completed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Missed Days Banner Alert */}
          {missedDays > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between text-amber-300 text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">
                    {missedDays === 1 ? '⚠ 1 MISSED SCHEDULED DAY' : `⚠ ${missedDays} MISSED SCHEDULED DAYS`}
                  </span>
                  <span className="block text-[11px] text-amber-300/80">
                    {missedDays === 1
                      ? "You missed 1 scheduled day. Promotion target delayed by +1 day."
                      : `You missed ${missedDays} scheduled days. Promotion target delayed by +${missedDays} days.`}
                  </span>
                </div>
              </div>
              <span className="font-orbitron font-bold text-sm px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 whitespace-nowrap">
                +{missedDays} DAY DELAY
              </span>
            </div>
          )}

          {/* Progress Bar & Primary Counter */}
          <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-white/60">CHALLENGE PROGRESS:</span>
              <span className="font-orbitron font-bold text-white text-sm">
                {completedDays} / {adjustedRequiredDays} DAYS
              </span>
            </div>

            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/20 relative">
              <div
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,0.7)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/50 pt-0.5">
              <span>Current Status: Day {currentDayCount} of Challenge</span>
              <span className="text-purple-300 font-bold">{progressPercent}% Completed</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">CURRENT RANK</span>
              <span className="font-orbitron font-bold text-base text-white">{currentRank}-RANK</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">NEXT RANK</span>
              <span className="font-orbitron font-bold text-base text-purple-300">{targetRank}-RANK</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">COMPLETED</span>
              <span className="font-orbitron font-bold text-base text-emerald-400">{completedDays}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">MISSED</span>
              <span className="font-orbitron font-bold text-base text-rose-400">{missedDays}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">PROMOTION DELAY</span>
              <span className="font-orbitron font-bold text-base text-amber-300">+{promotionDelayDays} DAYS</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/50 text-[10px] block uppercase">ADJUSTED REQ</span>
              <span className="font-orbitron font-bold text-base text-purple-300">{adjustedRequiredDays} DAYS</span>
            </div>
          </div>

          {/* Promotion Target Date Banner */}
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-300" />
              <span className="text-white/70 text-xs">ESTIMATED PROMOTION TARGET DATE:</span>
            </div>

            <div className="flex items-center space-x-3">
              {missedDays > 0 && originalPromotionDate !== 'N/A' && (
                <span className="line-through text-white/40 text-xs">
                  {formatDateLabel(originalPromotionDate)}
                </span>
              )}
              <span className="font-orbitron font-bold text-emerald-300 text-sm">
                {formatDateLabel(currentPromotionDate)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
