import React, { useState } from 'react';
import { RewardItem, RewardRedemption, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import {
  Gift,
  Coins,
  Plus,
  ShoppingBag,
  History,
  Tv,
  Utensils,
  Gamepad2,
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardsViewProps {
  rewards: RewardItem[];
  setRewards: React.Dispatch<React.SetStateAction<RewardItem[]>>;
  redemptions: RewardRedemption[];
  setRedemptions: React.Dispatch<React.SetStateAction<RewardRedemption[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  setRewards,
  redemptions,
  setRedemptions,
  user,
  setUser,
}) => {
  const [isAddModal, setIsAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState(100);
  const [newDesc, setNewDesc] = useState('');

  const handleRedeem = (reward: RewardItem) => {
    if (user.points < reward.cost) {
      soundFx.playBlip(400);
      alert('SYSTEM NOTICE: Insufficient System Points to redeem this reward.');
      return;
    }

    soundFx.playAchievement();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#eab308', '#00d4ff'],
    });

    // Deduct points
    setUser((u) => ({
      ...u,
      points: u.points - reward.cost,
    }));

    // Record Redemption History
    const log: RewardRedemption = {
      id: `red-${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      cost: reward.cost,
      redeemedAt: new Date().toLocaleString(),
    };

    setRedemptions((prev) => [log, ...prev]);
  };

  const handleAddReward = () => {
    if (!newTitle.trim()) return;
    soundFx.playBlip(1000);

    const item: RewardItem = {
      id: `rw-${Date.now()}`,
      title: newTitle,
      cost: newCost,
      icon: 'Gift',
      description: newDesc || 'Custom real-life reward item',
    };

    setRewards((prev) => [...prev, item]);
    setNewTitle('');
    setNewDesc('');
    setIsAddModal(false);
  };

  const streakMultiplier = user.streak >= 3 ? 1.5 : 1.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
              SYSTEM REWARD SHOP
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
              REAL-LIFE INCENTIVES
            </span>
          </div>
          <p className="text-xs font-tech text-white/60">
            [POINTS CURRENCY SHOP] SPEND EARNED SYSTEM POINTS ON GUILT-FREE REWARDS
          </p>
        </div>

        {/* Currency & Streak Multiplier Overview */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex items-center space-x-2 text-xs font-mono">
            <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-white/50 text-[10px]">AVAILABLE BALANCE</div>
              <div className="text-amber-300 font-bold text-base">{user.points} PTS</div>
            </div>
          </div>

          <button
            onClick={() => setIsAddModal(true)}
            className="hex-btn px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ ADD REWARD</span>
          </button>
        </div>
      </div>

      {/* Streak Bonus Multiplier Notice Banner */}
      <div className="system-panel p-4 rounded-xl border-white/15 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-white/10 border border-white/20 text-purple-300">
            <Flame className="w-5 h-5 animate-bounce text-amber-400" />
          </div>
          <div>
            <div className="font-bold text-purple-300 font-orbitron">
              STREAK BONUS MULTIPLIER: {streakMultiplier}x
            </div>
            <div className="text-white/70 text-[11px] mt-0.5">
              {user.streak >= 3
                ? `Active 3+ Day Streak bonus (+50% extra System Points earned on all quests!)`
                : `Maintain a 3-day streak to unlock 1.5x Point multiplier!`}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Grid or Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.length === 0 ? (
          <div className="system-panel p-12 text-center space-y-3 font-mono text-xs rounded-xl border-white/15 col-span-3">
            <Gift className="w-10 h-10 text-white/30 mx-auto" />
            <div className="text-base font-bold text-white font-orbitron">No rewards created yet</div>
            <div className="text-xs text-white/50">Set up custom real-life rewards to redeem with your earned System Points.</div>
            <button
              onClick={() => setIsAddModal(true)}
              className="hex-btn inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ ADD FIRST REWARD</span>
            </button>
          </div>
        ) : (
          rewards.map((rw) => {
            const canAfford = user.points >= rw.cost;

            return (
              <div
                key={rw.id}
                className={`p-5 rounded-xl border transition flex flex-col justify-between ${canAfford
                    ? 'system-panel-glow border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-white/5 border-white/10 opacity-70'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-purple-300">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="px-2.5 py-1 rounded bg-purple-500/20 border border-purple-400/50 text-purple-300 font-mono font-bold text-xs">
                      {rw.cost} PTS
                    </div>
                  </div>

                  <div>
                    <h3 className="font-orbitron font-bold text-base text-white">{rw.title}</h3>
                    <p className="text-xs font-rajdhani text-white/70 mt-1">{rw.description}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/15">
                  <button
                    onClick={() => handleRedeem(rw)}
                    disabled={!canAfford}
                    className={`w-full hex-btn py-2 font-orbitron font-bold text-xs tracking-wider transition ${canAfford
                        ? 'bg-white/10 hover:bg-white/20 border border-white/30 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                        : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                      }`}
                  >
                    {canAfford ? 'SPEND & REDEEM REWARD' : 'INSUFFICIENT POINTS'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Redemption History Log */}
      <div className="system-panel p-5 rounded-xl border-white/15 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-300 font-bold border-b border-white/15 pb-2">
          <History className="w-4 h-4" />
          <span>REAL-LIFE REDEMPTION HISTORY LOG</span>
        </div>

        {redemptions.length === 0 ? (
          <div className="text-center py-6 text-white/40 text-xs font-mono">
            NO REWARDS REDEEMED YET. EARN POINTS AND REWARD YOURSELF!
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {redemptions.map((red) => (
              <div
                key={red.id}
                className="bg-white/5 p-2.5 rounded border border-white/10 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white font-rajdhani text-sm">
                    {red.rewardTitle}
                  </span>
                </div>
                <div className="text-right text-[11px] text-white/50">
                  <span className="text-amber-300 font-bold mr-2">-{red.cost} PTS</span>
                  <span>{red.redeemedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reward Modal */}
      {isAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-md w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              CREATE CUSTOM REAL-LIFE REWARD
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">REWARD TITLE</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 1 Hour Gaming Session / Takeout Dinner"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">POINT COST</label>
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">DESCRIPTION</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Reward rules or terms..."
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none h-16 focus:border-purple-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setIsAddModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReward}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                ADD TO SHOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
