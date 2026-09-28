import React, { useState } from 'react';
import { Skill, SkillPracticeSession, Rank } from '../types';
import { soundFx } from '../utils/sound';
import { 
  BrainCircuit, 
  Plus, 
  Clock, 
  Check, 
  Archive, 
  TrendingUp, 
  Award, 
  Trash2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SkillsViewProps {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ skills, setSkills }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || '');
  const [isAddSkillModal, setIsAddSkillModal] = useState(false);
  const [isAddSessionModal, setIsAddSessionModal] = useState(false);

  // Form states for new Skill
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Engineering');

  // Form states for new Session
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDetails, setSessionDetails] = useState('');
  const [sessionDuration, setSessionDuration] = useState(45);

  const activeSkills = skills.filter((s) => !s.isArchived);
  const currentSkill = skills.find((s) => s.id === selectedSkillId) || activeSkills[0];

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    soundFx.playBlip(1000);

    const newSkill: Skill = {
      id: `sk-${Date.now()}`,
      name: newSkillName,
      category: newSkillCategory,
      masteryPercentage: 10,
      rank: 'E',
      level: 1,
      isArchived: false,
      sessions: [],
      checkitems: [],
    };

    setSkills((prev) => [...prev, newSkill]);
    setSelectedSkillId(newSkill.id);
    setNewSkillName('');
    setIsAddSkillModal(false);
  };

  const handleAddSession = () => {
    if (!sessionTitle.trim() || !currentSkill) return;
    soundFx.playBlip(1100);

    const session: SkillPracticeSession = {
      id: `sess-${Date.now()}`,
      title: sessionTitle,
      details: sessionDetails,
      durationMinutes: sessionDuration,
      date: new Date().toISOString().split('T')[0],
      completed: true,
    };

    setSkills((prev) =>
      prev.map((s) => {
        if (s.id === currentSkill.id) {
          const nextLevel = s.level + 1;
          const nextMastery = Math.min(100, s.masteryPercentage + 5);
          let nextRank: Rank = s.rank;
          if (nextLevel >= 15) nextRank = 'S';
          else if (nextLevel >= 10) nextRank = 'A';
          else if (nextLevel >= 7) nextRank = 'B';
          else if (nextLevel >= 4) nextRank = 'C';
          else if (nextLevel >= 2) nextRank = 'D';

          soundFx.playQuestComplete();
          confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });

          return {
            ...s,
            level: nextLevel,
            masteryPercentage: nextMastery,
            rank: nextRank,
            sessions: [session, ...s.sessions],
          };
        }
        return s;
      })
    );

    setSessionTitle('');
    setSessionDetails('');
    setIsAddSessionModal(false);
  };

  const toggleCheckitem = (skillId: string, checkitemId: string) => {
    soundFx.playBlip(850);
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id === skillId) {
          const updatedItems = s.checkitems.map((ci) =>
            ci.id === checkitemId ? { ...ci, completed: !ci.completed } : ci
          );
          return { ...s, checkitems: updatedItems };
        }
        return s;
      })
    );
  };

  const handleArchiveSkill = (skillId: string) => {
    soundFx.playBlip(600);
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, isArchived: !s.isArchived } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
            SKILLS & ABILITY MASTERY
          </h1>
          <p className="text-xs font-tech text-white/60">
            [TECHNICAL SKILL TRACKER] PRACTICE LOGS, MINI CHECKLISTS & MASTERY RANKS
          </p>
        </div>

        <button
          onClick={() => setIsAddSkillModal(true)}
          className="hex-btn px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>+ ADD NEW SKILL</span>
        </button>
      </div>

      {/* Main Grid: Skill Tabs & Active Skill Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Skill Selector List */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-purple-300 font-bold px-1">
            ACTIVE SKILL ABILITIES ({activeSkills.length})
          </div>

          <div className="space-y-2">
            {activeSkills.map((sk) => {
              const isSelected = currentSkill?.id === sk.id;
              return (
                <div
                  key={sk.id}
                  onClick={() => {
                    soundFx.playBlip(800);
                    setSelectedSkillId(sk.id);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'glass-stat-box border-purple-400/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'glass-stat-box text-white/80 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-bold text-sm text-white">
                      {sk.name}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/15 border border-white/30 text-purple-300 font-bold">
                      {sk.rank}-RANK
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-white/50 mt-2">
                    <span>{sk.category}</span>
                    <span>LVL {sk.level} • {sk.masteryPercentage}% MASTERY</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/15 mt-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-400 h-full rounded-full shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                      style={{ width: `${sk.masteryPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Skill Details & Sub-Schedule */}
        {currentSkill ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="system-panel-glow p-5 rounded-xl border-white/20 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-orbitron font-bold text-xl text-white">
                      {currentSkill.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/15 border border-white/30 text-purple-300 font-bold">
                      RANK {currentSkill.rank}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white/50 mt-0.5">
                    Category: {currentSkill.category} • Level {currentSkill.level}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAddSessionModal(true)}
                    className="hex-btn px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  >
                    + LOG SESSION
                  </button>
                  <button
                    onClick={() => handleArchiveSkill(currentSkill.id)}
                    className="p-1.5 rounded bg-white/5 border border-white/15 text-white/50 hover:text-white"
                    title="Archive Skill"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mastery Progress */}
              <div className="glass-stat-box p-4 rounded-lg border border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/70">SKILL MASTERY LEVEL:</span>
                  <span className="text-purple-300 font-bold">{currentSkill.masteryPercentage}%</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/20">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                    style={{ width: `${currentSkill.masteryPercentage}%` }}
                  />
                </div>
              </div>

              {/* Practice Sessions Sub-Schedule */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                  <span>PRACTICE SESSIONS SUB-SCHEDULE</span>
                  <span>LOGGED: {currentSkill.sessions.length} SESSIONS</span>
                </div>

                <div className="space-y-2">
                  {currentSkill.sessions.length === 0 ? (
                    <div className="p-6 text-center text-white/40 text-xs font-mono bg-white/5 rounded-lg border border-white/10">
                      No practice sessions logged yet. Click "+ LOG SESSION" above to record practice time.
                    </div>
                  ) : (
                    currentSkill.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white font-rajdhani text-sm">
                            {sess.title}
                          </div>
                          <div className="text-white/50 text-[11px] mt-0.5">
                            {sess.details}
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-white/50">
                          <div className="text-amber-300 font-bold">{sess.durationMinutes} MINS</div>
                          <div>{sess.date}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 system-panel p-12 text-center space-y-3 font-mono text-xs rounded-xl border-white/15">
            <BrainCircuit className="w-10 h-10 text-white/30 mx-auto" />
            <div className="text-base font-bold text-white font-orbitron">No routines or skills added</div>
            <div className="text-xs text-white/50">Register your first routine/skill to begin tracking.</div>
            <button
              onClick={() => setIsAddSkillModal(true)}
              className="hex-btn inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ ADD ROUTINE / SKILL</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {isAddSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-md w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              REGISTER NEW SKILL ABILITY
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">SKILL NAME</label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Python & Machine Learning"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">CATEGORY</label>
              <input
                type="text"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                placeholder="e.g. Engineering, Music, Fitness"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setIsAddSkillModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                INITIALIZE SKILL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {isAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open">
          <div className="system-panel-glow max-w-md w-full p-5 rounded-xl border-white/30 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <h3 className="font-orbitron font-bold text-lg text-white text-glow">
              LOG PRACTICE SESSION: {currentSkill?.name}
            </h3>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">SESSION TITLE</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Session: Deep Learning & PyTorch"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">DETAILS & NOTES</label>
              <textarea
                value={sessionDetails}
                onChange={(e) => setSessionDetails(e.target.value)}
                placeholder="Specific topics covered or milestones achieved..."
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none h-16 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1">DURATION (MINUTES)</label>
              <input
                type="number"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setIsAddSessionModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSession}
                className="hex-btn px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs"
              >
                SAVE PRACTICE LOG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
