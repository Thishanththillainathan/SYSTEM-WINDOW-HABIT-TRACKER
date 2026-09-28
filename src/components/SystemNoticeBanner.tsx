import React from 'react';
import { SystemNotice } from '../types';
import { Megaphone, X } from 'lucide-react';

interface SystemNoticeBannerProps {
  notices: SystemNotice[];
  onDismiss: (id: string) => void;
}

export const SystemNoticeBanner: React.FC<SystemNoticeBannerProps> = ({ notices, onDismiss }) => {
  const activeNotices = notices.filter((n) => n.active);

  if (activeNotices.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {activeNotices.map((notice) => (
        <div
          key={notice.id}
          className="system-panel-glow p-3.5 rounded-lg border-white/20 flex items-center justify-between gap-3 text-sm animate-window-open relative overflow-hidden bg-white/5 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
          
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-white/10 border border-white/20 text-purple-300 mt-0.5">
              <Megaphone className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-orbitron font-bold text-xs tracking-wider text-white">
                  {notice.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  {notice.timestamp}
                </span>
              </div>
              <p className="text-white/80 font-rajdhani text-sm mt-0.5">
                {notice.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => onDismiss(notice.id)}
            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
