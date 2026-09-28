import React, { useState, useEffect } from 'react';
import { soundFx } from '../utils/sound';
import { 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  Radio,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenLogin, onOpenRegister, isAuthenticated }) => {
  const [rankCycle, setRankCycle] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('E');

  // Animate rank cycling (E -> D -> C -> B -> A -> S)
  useEffect(() => {
    const ranks: ('E' | 'D' | 'C' | 'B' | 'A' | 'S')[] = ['E', 'D', 'C', 'B', 'A', 'S'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % ranks.length;
      setRankCycle(ranks[idx]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleLaunch = () => {
    soundFx.playLevelUp();
    if (isAuthenticated) {
      onEnterApp();
    } else {
      onOpenLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#05020a] text-white flex flex-col justify-between selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Floating Radial Ambient Purple Light Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-800/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/12 border border-white/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Radio className="w-6 h-6 text-purple-300 animate-pulse" />
          </div>
          <span className="font-orbitron font-bold text-xl text-white tracking-wide">
            SYSTEM WINDOW
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider rounded border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition"
            >
              GO TO DASHBOARD
            </button>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-xs tracking-wider rounded border border-white/25 transition flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-purple-300" />
                <span>LOGIN</span>
              </button>
              <button
                onClick={onOpenRegister}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider rounded border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>REGISTER</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section with Animated Solo Leveling System Window Opening Prompt */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center space-y-8 my-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 font-mono text-xs animate-pulse">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>[SYSTEM NOTICE] A NEW SYSTEM HAS AWAKENED</span>
        </div>

        <h1 className="font-orbitron font-black text-4xl sm:text-6xl text-white tracking-tight leading-none">
          LEVEL UP YOUR LIFE LIKE A{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-300">
            SHADOW MONARCH
          </span>
        </h1>

        <p className="text-base sm:text-lg font-rajdhani text-white/70 max-w-2xl mx-auto">
          The ultimate dark-fantasy RPG habit tracker. Transform daily chores into Daily Quests, 
          master technical skills with session logs, and defeat high-stakes Boss Battles with HP gauges.
        </p>

        {/* Solo Leveling System Window Frame Video Graphic Mockup */}
        <div className="relative max-w-3xl mx-auto rounded-2xl p-0.5 bg-white/10 shadow-[0_0_50px_rgba(168,85,247,0.25)] animate-window-open">
          <div className="p-8 rounded-xl relative overflow-hidden text-left space-y-6 bg-white/5 backdrop-blur-2xl border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-white/12 border-2 border-white/30 flex items-center justify-center font-orbitron font-black text-2xl text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  {rankCycle}
                </div>
                <div>
                  <div className="font-orbitron font-bold text-lg text-white">
                    STATUS: UNBOUND MONARCH
                  </div>
                  <div className="text-xs font-mono text-purple-300">
                    [SYSTEM READY] LEVEL 14 • 12-DAY UNBROKEN STREAK
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-amber-300 font-bold hidden sm:block">
                RANK LOCK: {rankCycle}-RANK
              </div>
            </div>

            {/* Mock Holographic Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-center">
                <span className="text-white/50 text-[10px] block">STR (FITNESS)</span>
                <span className="text-white font-bold text-base">28 PTS</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-center">
                <span className="text-white/50 text-[10px]">INT (STUDY)</span>
                <span className="text-white font-bold text-base">34 PTS</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-center">
                <span className="text-white/50 text-[10px]">VIT (HEALTH)</span>
                <span className="text-white font-bold text-base">24 PTS</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-center">
                <span className="text-white/50 text-[10px]">WIS (MIND)</span>
                <span className="text-white font-bold text-base">20 PTS</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-center col-span-2 sm:col-span-1">
                <span className="text-white/50 text-[10px]">CHA (SOCIAL)</span>
                <span className="text-white font-bold text-base">18 PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-black text-sm tracking-widest flex items-center space-x-2 rounded border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.5)] transition"
            >
              <span>ENTER HUNTER DASHBOARD</span>
              <ArrowRight className="w-5 h-5 text-white stroke-[3]" />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-sm tracking-wider flex items-center space-x-2 rounded border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition"
              >
                <Lock className="w-5 h-5 text-purple-300" />
                <span>LOGIN TO SYSTEM</span>
              </button>
              <button
                onClick={onOpenRegister}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-black text-sm tracking-widest flex items-center space-x-2 rounded border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.5)] transition"
              >
                <span>REGISTER NEW HUNTER</span>
                <ArrowRight className="w-5 h-5 text-white stroke-[3]" />
              </button>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-white/5 backdrop-blur-xl p-5 rounded-xl border border-white/15 space-y-2">
            <div className="text-purple-300 font-orbitron font-bold text-sm">
              1. 20 DAILY QUEST SLOTS
            </div>
            <p className="text-xs font-rajdhani text-white/70">
              Glowing translucent white quest cards with EXP gain chimes, missed quest roll-overs, and customizable slot managers.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-5 rounded-xl border border-white/15 space-y-2">
            <div className="text-purple-300 font-orbitron font-bold text-sm">
              2. BOSS BATTLES WITH HP
            </div>
            <p className="text-xs font-rajdhani text-white/70">
              Confront high-stakes exams and deadlines with dynamic depleting HP gauges and multiplied System Point payouts.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-5 rounded-xl border border-white/15 space-y-2">
            <div className="text-purple-300 font-orbitron font-bold text-sm">
              3. REAL-LIFE REWARD SHOP
            </div>
            <p className="text-xs font-rajdhani text-white/70">
              Redeem earned System Points for customized real-life perks like takeout meals or gaming sessions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center font-mono text-xs text-white/50">
        SYSTEM WINDOW v2.4 • SOLO LEVELING HABIT ENGINE
      </footer>
    </div>
  );
};
