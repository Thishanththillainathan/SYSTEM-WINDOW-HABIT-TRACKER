import React, { useState } from 'react';
import { UserProfile, UserStats } from '../types';
import { soundFx } from '../utils/sound';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AwakeningModalProps {
  user: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

export const AwakeningModal: React.FC<AwakeningModalProps> = ({ user, onSave, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [title, setTitle] = useState(user.title);
  const [classPreset, setClassPreset] = useState<'SHADOW' | 'KNIGHT' | 'ARCHMAGE' | 'BALANCED'>('SHADOW');
  const [stats, setStats] = useState<UserStats>({ ...user.stats });

  const presets = [
    {
      id: 'SHADOW' as const,
      name: 'Shadow Assassin',
      desc: 'High Focus on Physical Power & Coding Intellect',
      stats: { STR: 22, INT: 26, VIT: 16, WIS: 14, CHA: 12 },
    },
    {
      id: 'KNIGHT' as const,
      name: 'Iron Tank',
      desc: 'Maximum Physical Endurance & Health Conditioning',
      stats: { STR: 28, INT: 14, VIT: 30, WIS: 12, CHA: 10 },
    },
    {
      id: 'ARCHMAGE' as const,
      name: 'Grand Archmage',
      desc: 'Peak Study Capacity & Mindfulness Wisdom',
      stats: { STR: 12, INT: 32, VIT: 14, WIS: 24, CHA: 14 },
    },
    {
      id: 'BALANCED' as const,
      name: 'Monarch Awakening',
      desc: 'Balanced attribute matrix across all life categories',
      stats: { STR: 20, INT: 20, VIT: 20, WIS: 20, CHA: 20 },
    },
  ];

  const handleSelectPreset = (preset: typeof presets[0]) => {
    soundFx.playBlip(1100);
    setClassPreset(preset.id);
    setStats({ ...preset.stats });
  };

  const handleCompleteAwakening = () => {
    soundFx.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#c084fc', '#e9d5ff'],
    });

    onSave({
      ...user,
      username: username || 'Awakened Hunter',
      title: title || 'Shadow Monarch Apprentice',
      stats,
      hasCompletedOnboarding: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05020a]/85 backdrop-blur-md animate-window-open">
      <div className="system-panel-glow max-w-2xl w-full p-6 rounded-xl border-white/20 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] bg-white/5 backdrop-blur-2xl">
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4 mb-5">
          <div className="p-3 rounded-xl bg-white/12 border border-white/25 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-xl text-white tracking-wide">
              HUNTER AWAKENING CEREMONY
            </h2>
            <p className="text-xs font-mono text-purple-300/80">
              [SYSTEM NOTIFICATION] ALLOCATE INITIAL ATTRIBUTES & HUNTER IDENTITY
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Identity Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-purple-300 mb-1">
                HUNTER CODENAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Sung Jin-Woo"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-purple-300 mb-1">
                AWAKENED TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shadow Monarch"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Preset Class Selection */}
          <div>
            <label className="block text-xs font-mono text-purple-300 mb-2">
              SELECT HUNTER SPECIALIZATION MATRIX
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-lg border text-left transition relative overflow-hidden ${
                    classPreset === preset.id
                      ? 'bg-white/15 border-white/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-bold text-sm text-white">
                      {preset.name}
                    </span>
                    {classPreset === preset.id && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-xs font-rajdhani text-white/60 mt-1">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Attributes Matrix Preview */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <span className="block text-xs font-mono text-purple-300 mb-2">
              ATTRIBUTE POINTS MATRIX
            </span>
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block text-white/50 text-[10px]">STR</span>
                <span className="text-white font-bold text-sm">{stats.STR}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block text-white/50 text-[10px]">INT</span>
                <span className="text-white font-bold text-sm">{stats.INT}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block text-white/50 text-[10px]">VIT</span>
                <span className="text-white font-bold text-sm">{stats.VIT}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block text-white/50 text-[10px]">WIS</span>
                <span className="text-white font-bold text-sm">{stats.WIS}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/10">
                <span className="block text-white/50 text-[10px]">CHA</span>
                <span className="text-white font-bold text-sm">{stats.CHA}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white transition"
          >
            Skip for now
          </button>
          <button
            onClick={handleCompleteAwakening}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider rounded border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition"
          >
            INITIALIZE SYSTEM AWAKENING
          </button>
        </div>
      </div>
    </div>
  );
};
