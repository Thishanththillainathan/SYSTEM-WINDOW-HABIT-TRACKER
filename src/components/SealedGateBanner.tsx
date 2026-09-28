import React from 'react';
import { Lock, Sparkles, ShieldAlert } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface SealedGateBannerProps {
  onReactivate: () => void;
}

export const SealedGateBanner: React.FC<SealedGateBannerProps> = ({ onReactivate }) => {
  return (
    <div className="system-panel-danger p-4 rounded-xl border-rose-500/80 mb-6 flex flex-wrap items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-500 text-rose-400">
          <Lock className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-orbitron font-bold text-base text-rose-300 text-glow-red">
              YOUR SYSTEM GATE HAS BEEN SEALED
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-500">
              READ-ONLY MODE
            </span>
          </div>
          <p className="text-xs font-rajdhani text-slate-300 mt-0.5">
            Subscription lapsed. Your Hunter progress & stat records are safely preserved, but editing is sealed until renewed.
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          soundFx.playLevelUp();
          onReactivate();
        }}
        className="hex-btn px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-orbitron font-bold text-xs shadow-[0_0_15px_#ff3250] transition"
      >
        UNSEAL SYSTEM GATE ($29/MO)
      </button>
    </div>
  );
};
