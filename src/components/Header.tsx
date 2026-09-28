import React from 'react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import { 
  Volume2, 
  VolumeX, 
  UserCheck, 
  ShieldAlert, 
  Flame, 
  Coins, 
  Sparkles, 
  Lock, 
  Unlock,
  Radio,
  LogOut,
  LogIn
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onOpenAwakening: () => void;
  onToggleLanding: () => void;
  isLandingOpen: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  setUser,
  isMuted,
  setIsMuted,
  onOpenAwakening,
  onToggleLanding,
  isLandingOpen,
  onOpenAuth,
  onLogout,
  isAuthenticated,
}) => {
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
    if (!next) soundFx.playBlip(1200);
  };

  const toggleAccountStatus = () => {
    soundFx.playBlip(600);
    setUser((prev) => ({
      ...prev,
      accountStatus: prev.accountStatus === 'ACTIVE' ? 'SEALED' : 'ACTIVE',
    }));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/15 px-4 py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.5)] w-full">
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onToggleLanding}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-orbitron text-lg font-bold tracking-wider text-white text-glow">
                SYSTEM WINDOW
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
                v2.4
              </span>
            </div>
            <div className="text-xs text-white/60 font-tech tracking-wide">
              SOLO LEVELING HABIT ENGINE
            </div>
          </div>
        </div>

        {/* Center: Quick Hunter Stats Overview */}
        {!isLandingOpen && (
          <div className="hidden md:flex items-center space-x-4 bg-white/5 px-4 py-1.5 rounded-lg border border-white/15 text-xs font-mono backdrop-blur-md">
            <div className="flex items-center space-x-1.5 text-white">
              <span className="text-white/50">HUNTER:</span>
              <span className="font-bold text-white">{user.username}</span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center space-x-1 text-purple-300">
              <span className="text-white/50">RANK:</span>
              <span className="px-1.5 py-0.2 bg-purple-500/20 border border-purple-400/40 rounded font-bold text-purple-300">
                {user.rank}-RANK
              </span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center space-x-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400 animate-pulse" />
              <span>{user.streak}D STREAK</span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center space-x-1 text-purple-300 font-bold">
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              <span>{user.points} PTS</span>
            </div>
          </div>
        )}

        {/* Right: Interactive Controls */}
        <div className="flex items-center space-x-2">

          {/* Landing / App Toggle */}
          <button
            onClick={onToggleLanding}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-white/10 border border-white/20 text-white hover:bg-purple-900/30 hover:border-white/40 transition"
            title="Toggle Hero Landing Page"
          >
            {isLandingOpen ? 'Dashboard' : 'Hero Page'}
          </button>

          {/* Awakening Ceremony Onboarding Trigger */}
          <button
            onClick={onOpenAwakening}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 text-xs font-mono rounded bg-white/10 border border-white/20 text-white hover:bg-purple-900/30 hover:border-white/40 transition"
            title="Re-open Awakening Ceremony"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Awakening</span>
          </button>

          {/* Role Badge Indicator */}
          <div
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border flex items-center space-x-1 ${
              user.role === 'ADMIN'
                ? 'bg-purple-900/40 border-purple-400/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-white/10 border-white/20 text-white'
            }`}
          >
            {user.role === 'ADMIN' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span>ADMIN</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>CUSTOMER</span>
              </>
            )}
          </div>

          {/* Auth State Button */}
          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs font-mono rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition flex items-center space-x-1"
              title="Log out of System Window"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hex-btn px-3 py-1 bg-white/10 border border-white/25 text-white font-orbitron font-bold text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)] flex items-center space-x-1 hover:bg-purple-900/30"
            >
              <LogIn className="w-3.5 h-3.5 text-white" />
              <span>Login / Register</span>
            </button>
          )}

          {/* Sound Audio Synthesizer Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition ${
              isMuted
                ? 'bg-white/5 border-white/10 text-white/40'
                : 'bg-white/10 border-white/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
