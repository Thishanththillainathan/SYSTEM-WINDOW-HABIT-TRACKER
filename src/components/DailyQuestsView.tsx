import React, { useState } from 'react';
import { DailyQuestSlot, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import {
  CheckSquare,
  Plus,
  Settings,
  Clock,
  Zap,
  AlertTriangle,
  RotateCcw,
  Check,
  Trash2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyQuestsViewProps {
  dailyQuests: DailyQuestSlot[];
  setDailyQuests: React.Dispatch<React.SetStateAction<DailyQuestSlot[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const DailyQuestsView: React.FC<DailyQuestsViewProps> = ({
  dailyQuests,
  setDailyQuests,
  user,
  setUser,
}) => {
  const [isManageModal, setIsManageModal] = useState(false);
  const [isAddModal, setIsAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DailyQuestSlot['category']>('STR');
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newXpValue, setNewXpValue] = useState(15);
  const [enableMissedPenalty, setEnableMissedPenalty] = useState(false);
  const [recentXpToast, setRecentXpToast] = useState<{ id: string; amount: number } | null>(null);

  // Toggle Quest Complete
  const toggleComplete = (id: string) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextState = !q.completed;
          if (nextState) {
            // Play Quest Complete Chime & trigger small confetti
            soundFx.playQuestComplete();
            confetti({
              particleCount: 30,
              spread: 50,
              origin: { y: 0.7 },
              colors: ['#00d4ff', '#38bdf8'],
            });

            // Grant XP & Points to User
            setUser((u) => {
              const newXp = u.xp + q.xpValue;
              let newLevel = u.level;
              let nextXpLimit = u.xpToNextLevel;

              if (newXp >= u.xpToNextLevel) {
                newLevel += 1;
                nextXpLimit = Math.round(u.xpToNextLevel * 1.25);
                soundFx.playLevelUp();
              }

              return {
                ...u,
                xp: newXp,
                level: newLevel,
                xpToNextLevel: nextXpLimit,
                points: u.points + Math.round(q.xpValue * 0.5),
              };
            });

            // Show +XP Floating Popup
            setRecentXpToast({ id, amount: q.xpValue });
            setTimeout(() => setRecentXpToast(null), 1500);
          } else {
            soundFx.playBlip(600);
          }
          return { ...q, completed: nextState };
        }
        return q;
      })
    );
  };

  // Add new Slot
  const handleAddSlot = () => {
    if (!newTitle.trim()) return;
    soundFx.playBlip(1000);

    const slot: DailyQuestSlot = {
      id: `dq-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      time: newTime,
      xpValue: newXpValue,
      completed: false,
    };

    setDailyQuests((prev) => [...prev, slot]);
    setNewTitle('');
    setIsAddModal(false);
  };

  // Delete Slot
  const handleDeleteSlot = (id: string) => {
    soundFx.playBlip(550);
    setDailyQuests((prev) => prev.filter((q) => q.id !== id));
  };

  // Reset or Roll Over Daily Quests
  const handleEndOfDayRollover = () => {
    soundFx.playBlip(900);
    let penalty = 0;

    setDailyQuests((prev) =>
      prev.map((q) => {
        if (!q.completed && enableMissedPenalty) {
          penalty += 5;
          return { ...q, missed: true };
        }
        return { ...q, completed: false, missed: false };
      })
    );

    if (penalty > 0) {
      setUser((u) => ({
        ...u,
        xp: Math.max(0, u.xp - penalty),
      }));
    }
  };

  // Progress Calculations
  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalSlots = dailyQuests.length;
  const percent = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress Ring */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
              DAILY QUESTS
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
              {totalSlots} SLOTS ACTIVE
            </span>
          </div>
          <p className="text-xs font-tech text-white/60">
            [MANDATORY SYSTEM TASKS] MAINTAIN DAILY DISCIPLINE OR SUFFER EXP PENALTY
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddModal(true)}
            className="hex-btn px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1.5 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ ADD SLOT</span>
          </button>

          <button
            onClick={() => setIsManageModal(true)}
            className="px-3 py-2 rounded bg-white/5 border border-white/15 text-white hover:bg-white/10 text-xs font-mono flex items-center space-x-1 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>MANAGE SLOTS</span>
          </button>

          <button
            onClick={handleEndOfDayRollover}
            className="px-3 py-2 rounded bg-white/5 border border-amber-500/30 text-amber-300 hover:bg-white/10 text-xs font-mono flex items-center space-x-1 transition"
            title="Reset / Roll over day"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>END OF DAY RESET</span>
          </button>
        </div>
      </div>

      {/* Progress Header Ring & Summary Panel */}
      <div className="system-panel-glow p-4 rounded-xl border-white/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Circular Progress Indicator */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                className="text-white/10"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                className="text-purple-400 transition-all duration-500"
                fill="transparent"
                strokeDasharray={163.3}
                strokeDashoffset={163.3 - (163.3 * percent) / 100}
              />
            </svg>
            <span className="absolute font-orbitron font-bold text-sm text-purple-300">
              {percent}%
            </span>
          </div>

          <div>
            <h3 className="font-orbitron font-bold text-sm text-white">
              DAILY QUEST CLEARANCE PROGRESS
            </h3>
            <p className="text-xs font-mono text-white/70 mt-0.5">
              Completed <span className="text-purple-300 font-bold">{completedCount}</span> out of{' '}
              <span className="text-white font-bold">{totalSlots}</span> mandatory quest objectives.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-white/5 p-2.5 rounded-lg border border-white/10">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-white/70">TOTAL DAILY REWARD:</span>
          <span className="text-purple-300 font-bold">
            +{dailyQuests.reduce((acc, q) => acc + (q.completed ? q.xpValue : 0), 0)} XP
          </span>
        </div>
      </div>

      {/* Quest Cards Grid or Empty State */}
      {dailyQuests.length === 0 ? (
        <div className="system-panel p-12 text-center space-y-3 font-mono rounded-xl border-white/15">
          <CheckSquare className="w-10 h-10 text-white/30 mx-auto" />
          <div className="text-base font-bold text-white font-orbitron">No habits yet</div>
          <div className="text-xs text-white/50">Create your first habit to get started.</div>
          <button
            onClick={() => setIsAddModal(true)}
            className="hex-btn inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition shadow-[0_0_12px_rgba(168,85,247,0.3)]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ ADD FIRST HABIT</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {dailyQuests.map((slot, index) => {
            const isDone = slot.completed;

            return (
              <div
                key={slot.id}
                onClick={() => toggleComplete(slot.id)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${isDone
                    ? 'glass-stat-box border-purple-400/80 shadow-[0_0_18px_rgba(168,85,247,0.35)]'
                    : slot.missed
                      ? 'glass-stat-box border-rose-500/60'
                      : 'glass-stat-box hover:border-white/40'
                  }`}
              >
                {/* Floating +XP Toast Animation */}
                {recentXpToast?.id === slot.id && (
                  <div className="absolute top-2 right-2 bg-purple-500 text-white font-orbitron font-bold text-xs px-2 py-0.5 rounded shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-bounce z-10">
                    +{recentXpToast.amount} XP!
                  </div>
                )}

                <div className="flex items-start justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/15 border border-white/20 text-purple-300 font-bold">
                      {slot.category}
                    </span>
                  </div>

                  {/* Checkbox Trigger */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition border ${isDone
                        ? 'bg-purple-500 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                        : 'border-white/30 bg-white/10 group-hover:border-white/60'
                      }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-2.5">
                  <h4
                    className={`font-rajdhani font-semibold text-sm transition ${isDone ? 'text-white/50 line-through' : 'text-white'
                      }`}
                  >
                    {slot.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mt-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{slot.time || 'Flexible'}</span>
                    </div>
                    <span className="text-purple-300 font-bold">+{slot.xpValue} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      {isAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-md w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              ADD NEW DAILY QUEST SLOT
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                QUEST TASK TITLE
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 50 Burpees (Stamina)"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-white/70 mb-1">CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DailyQuestSlot['category'])}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white font-rajdhani focus:outline-none focus:border-purple-400"
                >
                  <option value="STR" className="bg-[#0e041c]">STR (Fitness)</option>
                  <option value="INT" className="bg-[#0e041c]">INT (Study/Code)</option>
                  <option value="VIT" className="bg-[#0e041c]">VIT (Health)</option>
                  <option value="WIS" className="bg-[#0e041c]">WIS (Mindfulness)</option>
                  <option value="CHA" className="bg-[#0e041c]">CHA (Social)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 mb-1">XP REWARD</label>
                <input
                  type="number"
                  value={newXpValue}
                  onChange={(e) => setNewXpValue(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                SCHEDULE TIME (OPTIONAL)
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="e.g. 08:30 AM or All Day"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
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
                onClick={handleAddSlot}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                CONFIRM SLOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Slots Modal */}
      {isManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-lg w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <h3 className="font-orbitron font-bold text-lg text-white">
                MANAGE & REORDER QUEST SLOTS
              </h3>
              <button
                onClick={() => setIsManageModal(false)}
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Missed Penalty */}
            <div className="flex items-center justify-between glass-panel-subtle p-3 rounded border border-white/15 text-xs font-mono">
              <div>
                <span className="text-purple-300 font-bold block">MISSED QUEST EXP PENALTY</span>
                <span className="text-white/50 text-[10px]">
                  Deduct 5 XP per incomplete task at end of day
                </span>
              </div>
              <button
                onClick={() => setEnableMissedPenalty(!enableMissedPenalty)}
                className={`px-3 py-1 rounded font-bold transition ${enableMissedPenalty
                    ? 'bg-rose-950/80 border border-rose-500 text-rose-300'
                    : 'bg-white/10 border border-white/20 text-white/50'
                  }`}
              >
                {enableMissedPenalty ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {dailyQuests.map((q) => (
                <div
                  key={q.id}
                  className="glass-stat-box p-2.5 rounded border border-white/15 flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-white font-rajdhani text-sm font-semibold truncate mr-2">
                    {q.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSlot(q.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-white/10 rounded transition"
                    title="Remove Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/15">
              <button
                onClick={() => setIsManageModal(false)}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron text-xs font-bold"
              >
                CLOSE MANAGE WINDOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
