import React, { useState } from 'react';
import { UserProfile, DailyQuestSlot } from '../types';
import { soundFx } from '../utils/sound';
import { RankChallengeCard } from './RankChallengeCard';
import { 
  Shield, 
  Flame, 
  Sparkles, 
  Edit3, 
  Check, 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Zap,
  Plus
} from 'lucide-react';

interface StatusWindowProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  dailyQuests: DailyQuestSlot[];
}

export const StatusWindow: React.FC<StatusWindowProps> = ({ user, setUser, dailyQuests }) => {
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState(user.username);
  const [availableStatPoints, setAvailableStatPoints] = useState(3);

  // Trigger System Window opening scan-line text reveal animation
  const triggerOpenAnim = () => {
    soundFx.playBlip(1200);
    setIsOpeningAnim(true);
    setTimeout(() => setIsOpeningAnim(false), 800);
  };

  const handleSaveUsername = () => {
    soundFx.playBlip(900);
    setUser((prev) => ({
      ...prev,
      username: tempUsername || prev.username,
    }));
    setIsEditingName(false);
  };

  const allocateStat = (statName: keyof UserProfile['stats']) => {
    if (availableStatPoints <= 0) return;
    soundFx.playBlip(1100);
    setAvailableStatPoints((prev) => prev - 1);
    setUser((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statName]: prev.stats[statName] + 1,
      },
    }));
  };

  // Daily Completion calculation
  const completedDailyCount = dailyQuests.filter((dq) => dq.completed).length;
  const totalDailyCount = dailyQuests.length;
  const dailyPercent = totalDailyCount > 0 ? Math.round((completedDailyCount / totalDailyCount) * 100) : 0;

  // XP Progress %
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));

  return (
    <div className="space-y-6">
      {/* Header Notification Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
              STATUS WINDOW
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
              RANK-{user.rank}
            </span>
          </div>
          <p className="text-xs font-tech text-white/60">
            [SYSTEM OVERVIEW] OVERALL HUNTER PERFORMANCE & PHYSICAL MATRIX
          </p>
        </div>

        <button
          onClick={triggerOpenAnim}
          className="hex-btn px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>RE-SCAN SYSTEM</span>
        </button>
      </div>

      {/* Main Status Grid Card */}
      <div
        className={`system-panel-glow p-6 rounded-xl border-white/20 relative overflow-hidden transition-all duration-300 ${
          isOpeningAnim ? 'animate-window-open shadow-[0_0_50px_rgba(168,85,247,0.8)]' : ''
        }`}
      >
        {/* Holographic Scanline wipe */}
        <div className="animate-scanline" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Hunter Identity & Level */}
          <div className="space-y-5 lg:border-r border-white/15 lg:pr-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-white/15 border border-white/35 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md">
                  <span className="font-orbitron font-black text-3xl text-white text-glow">
                    {user.rank}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-mono text-purple-300">
                  LVL {user.level}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  {isEditingName ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="bg-white/15 border border-white/30 rounded px-2 py-0.5 text-sm text-white font-bold focus:outline-none"
                      />
                      <button
                        onClick={handleSaveUsername}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-orbitron font-bold text-lg text-white">
                        {user.username}
                      </h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-white/40 hover:text-purple-300 transition"
                        title="Edit Codename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs font-rajdhani text-purple-300 font-semibold mt-0.5">
                  {user.title}
                </div>
                <div className="text-[11px] font-mono text-white/50 mt-1">
                  Awakened: {user.awakeningDate}
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5 glass-stat-box p-3.5 rounded-lg border border-white/20">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/70">EXP GAUGE:</span>
                <span className="text-purple-300 font-bold">
                  {user.xp} / {user.xpToNextLevel} XP ({xpPercent}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/20">
                <div
                  className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Key Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="glass-stat-box p-3 rounded-lg border border-white/20">
                <div className="flex items-center space-x-1 text-white/70">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>CURRENT STREAK</span>
                </div>
                <div className="text-xl font-bold text-amber-300 mt-1">
                  {user.streak} Days
                </div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Best: {user.longestStreak} Days
                </div>
              </div>

              <div className="glass-stat-box p-3 rounded-lg border border-white/20">
                <div className="flex items-center space-x-1 text-white/70">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                  <span>DAILY DONE</span>
                </div>
                <div className="text-xl font-bold text-purple-300 mt-1">
                  {dailyPercent}%
                </div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  {completedDailyCount}/{totalDailyCount} Tasks
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Stat Bars Matrix */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <span className="font-orbitron font-bold text-sm text-white tracking-wider">
                HUNTER ATTRIBUTE MATRIX
              </span>
              {availableStatPoints > 0 && (
                <span className="text-xs font-mono text-amber-300 animate-pulse font-bold">
                  ★ {availableStatPoints} UNALLOCATED STAT POINTS
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* STR */}
              <div className="glass-stat-box p-3 rounded-lg border border-white/20 flex items-center justify-between">
                <div className="space-y-1 w-full mr-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 font-bold">STR (Fitness)</span>
                    <span className="text-white">{user.stats.STR} PTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                    <div
                      className="bg-rose-500 h-full rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      style={{ width: `${Math.min(100, (user.stats.STR / 40) * 100)}%` }}
                    />
                  </div>
                </div>
                {availableStatPoints > 0 && (
                  <button
                    onClick={() => allocateStat('STR')}
                    className="p-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white transition"
                    title="+1 STR"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* INT */}
              <div className="glass-stat-box p-3 rounded-lg border border-white/20 flex items-center justify-between">
                <div className="space-y-1 w-full mr-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-400 font-bold">INT (Study/Code)</span>
                    <span className="text-white">{user.stats.INT} PTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                    <div
                      className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      style={{ width: `${Math.min(100, (user.stats.INT / 40) * 100)}%` }}
                    />
                  </div>
                </div>
                {availableStatPoints > 0 && (
                  <button
                    onClick={() => allocateStat('INT')}
                    className="p-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white transition"
                    title="+1 INT"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* VIT */}
              <div className="glass-stat-box p-3 rounded-lg border border-white/20 flex items-center justify-between">
                <div className="space-y-1 w-full mr-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">VIT (Health)</span>
                    <span className="text-white">{user.stats.VIT} PTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                    <div
                      className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      style={{ width: `${Math.min(100, (user.stats.VIT / 40) * 100)}%` }}
                    />
                  </div>
                </div>
                {availableStatPoints > 0 && (
                  <button
                    onClick={() => allocateStat('VIT')}
                    className="p-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white transition"
                    title="+1 VIT"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* WIS */}
              <div className="glass-stat-box p-3 rounded-lg border border-white/20 flex items-center justify-between">
                <div className="space-y-1 w-full mr-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-purple-400 font-bold">WIS (Mindfulness)</span>
                    <span className="text-white">{user.stats.WIS} PTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                    <div
                      className="bg-purple-500 h-full rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                      style={{ width: `${Math.min(100, (user.stats.WIS / 40) * 100)}%` }}
                    />
                  </div>
                </div>
                {availableStatPoints > 0 && (
                  <button
                    onClick={() => allocateStat('WIS')}
                    className="p-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white transition"
                    title="+1 WIS"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* CHA */}
              <div className="glass-stat-box p-3 rounded-lg border border-white/20 flex items-center justify-between md:col-span-2">
                <div className="space-y-1 w-full mr-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 font-bold">CHA (Social & Leadership)</span>
                    <span className="text-white">{user.stats.CHA} PTS</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                    <div
                      className="bg-amber-500 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      style={{ width: `${Math.min(100, (user.stats.CHA / 40) * 100)}%` }}
                    />
                  </div>
                </div>
                {availableStatPoints > 0 && (
                  <button
                    onClick={() => allocateStat('CHA')}
                    className="p-1 rounded bg-white/15 hover:bg-white/25 border border-white/30 text-white transition"
                    title="+1 CHA"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 90-Day Rank Challenge Card */}
      <RankChallengeCard user={user} />

      {/* Dashboard Habits & Scheduled Tasks Overview / Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="system-panel p-5 rounded-xl border-white/20 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-white font-bold border-b border-white/15 pb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>DAILY HABITS TRACKER ({dailyQuests.length})</span>
            </div>
          </div>
          {dailyQuests.length === 0 ? (
            <div className="py-6 text-center space-y-1 font-mono">
              <div className="text-sm font-bold text-white font-orbitron">No habits yet</div>
              <div className="text-xs text-white/50">Create your first habit to get started.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
              {dailyQuests.slice(0, 4).map((q) => (
                <div key={q.id} className="p-2.5 rounded glass-stat-box border border-white/15 flex items-center justify-between">
                  <span className={q.completed ? 'line-through text-white/40' : 'text-white'}>{q.title}</span>
                  <span className="text-purple-300 font-bold">+{q.xpValue} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="system-panel p-5 rounded-xl border-white/20 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-white font-bold border-b border-white/15 pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>SCHEDULED TASKS ({dailyQuests.filter((q) => !q.completed).length})</span>
            </div>
          </div>
          {dailyQuests.filter((q) => !q.completed).length === 0 ? (
            <div className="py-6 text-center space-y-1 font-mono">
              <div className="text-sm font-bold text-white font-orbitron">No tasks scheduled</div>
              <div className="text-xs text-white/50">Add a task to begin your journey.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
              {dailyQuests.filter((q) => !q.completed).slice(0, 4).map((q) => (
                <div key={q.id} className="p-2.5 rounded glass-stat-box border border-white/15 flex items-center justify-between">
                  <span className="text-white">{q.title}</span>
                  <span className="text-purple-300 font-bold">{q.time || 'Flexible'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
