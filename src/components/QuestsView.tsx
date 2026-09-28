import React, { useState } from 'react';
import { Quest, Rank, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import { 
  Target, 
  Plus, 
  CheckSquare, 
  Clock, 
  Award, 
  Archive, 
  Check, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestsViewProps {
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const QuestsView: React.FC<QuestsViewProps> = ({ quests, setQuests, user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'log'>('active');
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-10-31');
  const [difficulty, setDifficulty] = useState<Rank>('B');
  const [xpReward, setXpReward] = useState(250);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasksList, setSubtasksList] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasksList((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, title: subtaskInput.trim(), completed: false },
    ]);
    setSubtaskInput('');
  };

  const handleCreateQuest = () => {
    if (!title.trim()) return;
    soundFx.playBlip(1100);

    const q: Quest = {
      id: `q-${Date.now()}`,
      title,
      description,
      deadline,
      difficulty,
      xpReward,
      status: 'NOT_STARTED',
      accepted: false,
      subtasks: subtasksList,
    };

    setQuests((prev) => [q, ...prev]);
    setTitle('');
    setDescription('');
    setSubtasksList([]);
    setIsCreateModal(false);
  };

  // Accept Quest
  const handleAcceptQuest = (id: string) => {
    soundFx.playBlip(1200);
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return { ...q, accepted: true, status: 'IN_PROGRESS' };
        }
        return q;
      })
    );
  };

  // Abandon Quest
  const handleAbandonQuest = (id: string) => {
    soundFx.playBlip(500);
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return { ...q, accepted: false, status: 'FAILED' };
        }
        return q;
      })
    );
  };

  // Toggle Subtask
  const toggleSubtask = (questId: string, subtaskId: string) => {
    soundFx.playBlip(850);
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const updatedSubtasks = q.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allDone = updatedSubtasks.every((st) => st.completed);

          if (allDone && q.status !== 'COMPLETED') {
            soundFx.playQuestComplete();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

            // Reward User
            setUser((u) => ({
              ...u,
              xp: u.xp + q.xpReward,
              points: u.points + Math.round(q.xpReward * 0.8),
            }));

            return {
              ...q,
              subtasks: updatedSubtasks,
              status: 'COMPLETED',
              completedAt: new Date().toISOString().split('T')[0],
            };
          }

          return { ...q, subtasks: updatedSubtasks };
        }
        return q;
      })
    );
  };

  const activeQuests = quests.filter((q) => q.status !== 'COMPLETED' && q.status !== 'FAILED');
  const archivedQuests = quests.filter((q) => q.status === 'COMPLETED' || q.status === 'FAILED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
            SYSTEM QUEST MATRIX
          </h1>
          <p className="text-xs font-tech text-white/60">
            [MAJOR GOALS & PROJECTS] DEDICATED MILESTONE CAMPAIGNS (E-RANK TO S-RANK)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active vs Quest Log Archive Toggle */}
          <div className="bg-white/5 p-1 rounded-lg border border-white/15 flex text-xs font-mono">
            <button
              onClick={() => {
                soundFx.playBlip(800);
                setActiveTab('active');
              }}
              className={`px-3 py-1 rounded transition ${
                activeTab === 'active'
                  ? 'bg-white/12 border border-white/30 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ACTIVE QUESTS ({activeQuests.length})
            </button>
            <button
              onClick={() => {
                soundFx.playBlip(800);
                setActiveTab('log');
              }}
              className={`px-3 py-1 rounded transition flex items-center space-x-1 ${
                activeTab === 'log'
                  ? 'bg-white/12 border border-white/30 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>QUEST LOG ARCHIVE ({archivedQuests.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModal(true)}
            className="hex-btn px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>CREATE QUEST</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'active' ? (
        <div className="space-y-4">
          {activeQuests.length === 0 ? (
            <div className="system-panel p-12 text-center space-y-3 font-mono text-xs rounded-xl border-white/15">
              <Target className="w-10 h-10 text-white/30 mx-auto" />
              <div className="text-base font-bold text-white font-orbitron">No tasks scheduled</div>
              <div className="text-xs text-white/50">Add a task to begin your journey.</div>
              <button
                onClick={() => setIsCreateModal(true)}
                className="hex-btn inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ CREATE TASK</span>
              </button>
            </div>
          ) : (
            activeQuests.map((quest) => {
              const isExpanded = expandedQuestId === quest.id;
              const completedSubtasks = quest.subtasks.filter((st) => st.completed).length;
              const totalSubtasks = quest.subtasks.length;
              const progressPct =
                totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

              return (
                <div
                  key={quest.id}
                  className="system-panel-glow p-5 rounded-xl border-white/20 space-y-4 hover:border-white/40 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-xs font-orbitron font-bold bg-white/15 border border-white/30 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                          {quest.difficulty}-RANK
                        </span>
                        <h3 className="font-orbitron font-bold text-lg text-white">
                          {quest.title}
                        </h3>
                      </div>
                      <p className="text-xs font-rajdhani text-white/70">
                        {quest.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <div className="flex items-center space-x-1 text-white/70 glass-stat-box px-2.5 py-1 rounded border border-white/15">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>DUE: {quest.deadline}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-300 glass-stat-box px-2.5 py-1 rounded border border-amber-500/20">
                        <Award className="w-3.5 h-3.5" />
                        <span>+{quest.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Subtask Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-white/60">
                      <span>QUEST SUBTASK PROGRESS:</span>
                      <span className="text-purple-300 font-bold">
                        {completedSubtasks}/{totalSubtasks} DONE ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/20">
                      <div
                        className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Subtask Checklists & Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/15">
                    <button
                      onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                      className="text-xs font-mono text-purple-300 hover:underline flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide Subtasks' : 'View Subtasks'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center space-x-2">
                      {!quest.accepted ? (
                        <button
                          onClick={() => handleAcceptQuest(quest.id)}
                          className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs flex items-center space-x-1 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>ACCEPT QUEST</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAbandonQuest(quest.id)}
                          className="px-3 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-mono flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ABANDON QUEST</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Subtask List */}
                  {isExpanded && (
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 mt-2 font-mono text-xs">
                      {quest.subtasks.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => toggleSubtask(quest.id, st.id)}
                          className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white/10 transition"
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              st.completed
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'border-white/20 bg-white/5'
                            }`}
                          >
                            {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span
                            className={
                              st.completed ? 'text-white/40 line-through' : 'text-white'
                            }
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Quest Log History Archive */
        <div className="space-y-3">
          {archivedQuests.length === 0 ? (
            <div className="system-panel p-12 text-center text-white/50 font-mono text-xs rounded-xl border-white/15">
              QUEST LOG ARCHIVE IS EMPTY. COMPLETED QUESTS WILL ARCHIVE HERE.
            </div>
          ) : (
            archivedQuests.map((quest) => (
              <div
                key={quest.id}
                className="system-panel p-4 rounded-xl border-white/15 flex items-center justify-between text-xs font-mono opacity-80"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-purple-300">[{quest.difficulty}-RANK]</span>
                    <span className="font-orbitron font-bold text-sm text-white">{quest.title}</span>
                  </div>
                  <div className="text-white/50 text-[11px]">
                    Archived on: {quest.completedAt || 'Past Date'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded border font-bold ${
                      quest.status === 'COMPLETED'
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {quest.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Quest Modal */}
      {isCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-lg w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              CREATE NEW SYSTEM QUEST
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                QUEST CAMPAIGN TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Microservices Architecture"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                DESCRIPTION / SCOPE
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed objectives and requirements..."
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none h-20 focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="block text-white/70 mb-1">RANK DIFFICULTY</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Rank)}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white font-rajdhani focus:outline-none focus:border-purple-400"
                >
                  <option value="E" className="bg-[#0e041c]">E-Rank (Easy)</option>
                  <option value="D" className="bg-[#0e041c]">D-Rank</option>
                  <option value="C" className="bg-[#0e041c]">C-Rank</option>
                  <option value="B" className="bg-[#0e041c]">B-Rank</option>
                  <option value="A" className="bg-[#0e041c]">A-Rank</option>
                  <option value="S" className="bg-[#0e041c]">S-Rank (Epic)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 mb-1">XP REWARD</label>
                <input
                  type="number"
                  value={xpReward}
                  onChange={(e) => setXpReward(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-white/70 mb-1">DEADLINE</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Subtasks Builder */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">
                ADD SUBTASKS CHECKLIST
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Subtask objective..."
                  className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-xs text-white font-rajdhani focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded font-mono text-xs hover:bg-white/20 transition"
                >
                  + Add
                </button>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1">
                {subtasksList.map((st) => (
                  <div
                    key={st.id}
                    className="text-xs font-mono text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10"
                  >
                    • {st.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setIsCreateModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuest}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                DEPLOY QUEST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
