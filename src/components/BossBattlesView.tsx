import React, { useState } from 'react';
import { BossBattle, BossSubtask, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import {
  Skull,
  Plus,
  ShieldAlert,
  Check,
  Clock,
  Zap,
  RotateCcw,
  Award,
  Flame,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BossBattlesViewProps {
  bosses: BossBattle[];
  setBosses: React.Dispatch<React.SetStateAction<BossBattle[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const BossBattlesView: React.FC<BossBattlesViewProps> = ({
  bosses,
  setBosses,
  user,
  setUser,
}) => {
  const [isAddBossModal, setIsAddBossModal] = useState(false);
  const [bossName, setBossName] = useState('');
  const [bossTitle, setBossTitle] = useState('');
  const [deadline, setDeadline] = useState('2026-10-15');
  const [rewardMult, setRewardMult] = useState(2.0);
  const [xpReward, setXpReward] = useState(600);
  const [pointsReward, setPointsReward] = useState(400);

  // Subtask inputs
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDamage, setSubtaskDamage] = useState(25);
  const [subtasks, setSubtasks] = useState<BossSubtask[]>([]);

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `bst-${Date.now()}`,
        title: subtaskTitle,
        damagePercent: subtaskDamage,
        completed: false,
        timeAllocation: '2 Hours',
      },
    ]);
    setSubtaskTitle('');
  };

  const handleCreateBoss = () => {
    if (!bossName.trim()) return;
    soundFx.playBlip(1100);

    const newBoss: BossBattle = {
      id: `boss-${Date.now()}`,
      name: bossName,
      title: bossTitle || 'Rank A Dungeon Monarch',
      deadline,
      maxHp: 100,
      currentHp: 100,
      rewardMultiplier: rewardMult,
      xpReward,
      pointsReward,
      status: 'IN_PROGRESS',
      subtasks,
    };

    setBosses((prev) => [newBoss, ...prev]);
    setBossName('');
    setBossTitle('');
    setSubtasks([]);
    setIsAddBossModal(false);
  };

  // Attack Boss (Complete Subtask)
  const attackBoss = (bossId: string, subtaskId: string) => {
    soundFx.playBossHit();

    setBosses((prev) =>
      prev.map((b) => {
        if (b.id === bossId) {
          const updatedSubtasks = b.subtasks.map((st) => {
            if (st.id === subtaskId) {
              return { ...st, completed: !st.completed };
            }
            return st;
          });

          // Calculate current HP based on uncompleted subtask damage
          const remainingHp = updatedSubtasks.reduce(
            (hp, st) => (st.completed ? hp - st.damagePercent : hp),
            100
          );
          const finalHp = Math.max(0, remainingHp);

          const isDefeated = finalHp === 0;

          if (isDefeated && b.status !== 'DEFEATED') {
            soundFx.playLevelUp();
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#ef4444', '#f59e0b', '#00d4ff'],
            });

            // Grant multiplied rewards
            setUser((u) => ({
              ...u,
              xp: u.xp + Math.round(b.xpReward * b.rewardMultiplier),
              points: u.points + Math.round(b.pointsReward * b.rewardMultiplier),
            }));

            return {
              ...b,
              currentHp: 0,
              status: 'DEFEATED',
              subtasks: updatedSubtasks,
            };
          }

          return {
            ...b,
            currentHp: finalHp,
            subtasks: updatedSubtasks,
          };
        }
        return b;
      })
    );
  };

  // Retry Boss Battle
  const handleRetryBoss = (bossId: string) => {
    soundFx.playBlip(900);
    setBosses((prev) =>
      prev.map((b) => {
        if (b.id === bossId) {
          return {
            ...b,
            currentHp: 100,
            status: 'IN_PROGRESS',
            subtasks: b.subtasks.map((st) => ({ ...st, completed: false })),
          };
        }
        return b;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
              DUNGEON BOSS BATTLES
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
              HIGH STAKES DEADLINES
            </span>
          </div>
          <p className="text-xs font-tech text-white/60">
            [DUNGEON MONARCH CONFRONTATION] COMPLETE MILESTONES TO DEPLETE BOSS HP GAUGE
          </p>
        </div>

        <button
          onClick={() => setIsAddBossModal(true)}
          className="hex-btn px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>CHALLENGE NEW BOSS</span>
        </button>
      </div>

      {/* Boss Cards Grid or Empty State */}
      <div className="space-y-6">
        {bosses.length === 0 ? (
          <div className="system-panel p-12 text-center space-y-3 font-mono text-xs rounded-xl border-white/15">
            <Skull className="w-10 h-10 text-white/30 mx-auto" />
            <div className="text-base font-bold text-white font-orbitron">No active boss battles or challenges</div>
            <div className="text-xs text-white/50">Challenge a boss with high-stakes deadlines to test your strength.</div>
            <button
              onClick={() => setIsAddBossModal(true)}
              className="hex-btn inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>CHALLENGE FIRST BOSS</span>
            </button>
          </div>
        ) : (
          bosses.map((boss) => {
          const isDefeated = boss.status === 'DEFEATED';
          const hpPercent = boss.currentHp;

          return (
            <div
              key={boss.id}
              className={`p-6 rounded-xl border transition relative overflow-hidden ${isDefeated
                  ? 'system-panel border-emerald-500/50'
                  : 'system-panel-glow border-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
                }`}
            >
              {/* Top Details */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 pb-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${isDefeated
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-white/15 border-white/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-md'
                      }`}
                  >
                    <Skull className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-orbitron font-bold text-xl text-white">
                        {boss.name}
                      </h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
                        {boss.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono text-white/60 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>DEADLINE: {boss.deadline}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-300 font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        <span>REWARD MULTIPLIER: {boss.rewardMultiplier}x</span>
                      </div>
                    </div>
                  </div>
                </div>

                {isDefeated ? (
                  <div className="px-4 py-2 rounded bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-orbitron font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    BOSS DEFEATED! ★
                  </div>
                ) : (
                  <button
                    onClick={() => handleRetryBoss(boss.id)}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET HP / RETRY</span>
                  </button>
                )}
              </div>

              {/* Dynamic HP Bar */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300 font-bold">BOSS HP GAUGE:</span>
                  <span className="text-white font-bold">
                    {boss.currentHp} / {boss.maxHp} HP ({hpPercent}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden border border-white/20 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isDefeated
                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                      }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* Subtasks Combat Breakdown */}
              <div className="mt-5 space-y-2">
                <div className="text-xs font-mono text-purple-300 font-bold">
                  ATTACK SUBTASKS (DEAL DAMAGE TO BOSS)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {boss.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => !isDefeated && attackBoss(boss.id, st.id)}
                      className={`p-3 rounded-lg border transition flex items-center justify-between font-mono text-xs cursor-pointer ${st.completed
                          ? 'glass-stat-box border-emerald-500/50 text-emerald-200 line-through'
                          : 'glass-stat-box text-white hover:border-white/40'
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${st.completed
                              ? 'bg-emerald-400 border-emerald-400 text-black'
                              : 'border-white/30 bg-white/10'
                            }`}
                        >
                          {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-rajdhani text-sm font-semibold">{st.title}</span>
                      </div>

                      <span className="text-purple-300 font-bold">-{st.damagePercent}% HP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Add Boss Modal */}
      {isAddBossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-lg w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              CHALLENGE NEW DUNGEON BOSS
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                BOSS CHALLENGE NAME
              </label>
              <input
                type="text"
                value={bossName}
                onChange={(e) => setBossName(e.target.value)}
                placeholder="e.g. Final Semester Exam / SaaS Release"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-white/70 mb-1">RANK / TITLE</label>
                <input
                  type="text"
                  value={bossTitle}
                  onChange={(e) => setBossTitle(e.target.value)}
                  placeholder="e.g. Rank S Overlord"
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white font-rajdhani focus:outline-none focus:border-white/50"
                />
              </div>
              <div>
                <label className="block text-white/70 mb-1">DEADLINE</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white focus:outline-none focus:border-white/50"
                />
              </div>
            </div>

            {/* Subtasks builder */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                ADD DAMAGE SUBTASKS
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Subtask milestone..."
                  className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-xs text-white font-rajdhani focus:outline-none focus:border-white/50"
                />
                <input
                  type="number"
                  value={subtaskDamage}
                  onChange={(e) => setSubtaskDamage(Number(e.target.value))}
                  placeholder="% HP Damage"
                  className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs hover:bg-white/20 transition"
                >
                  + Add
                </button>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="text-xs font-mono text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10 flex justify-between"
                  >
                    <span>• {st.title}</span>
                    <span className="text-purple-300">-{st.damagePercent}% HP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setIsAddBossModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoss}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                SUMMON BOSS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
