import React from 'react';
import { UserRole } from '../types';
import { soundFx } from '../utils/sound';
import { 
  User, 
  Calendar, 
  CheckSquare, 
  Target, 
  BrainCircuit, 
  Award, 
  Skull, 
  Gift, 
  ShieldAlert,
  ChevronRight,
  Gem,
  Database
} from 'lucide-react';

export type TabId = 
  | 'status' 
  | 'schedule' 
  | 'daily-quests' 
  | 'quests' 
  | 'skills' 
  | 'achievements' 
  | 'boss-battles' 
  | 'rewards' 
  | 'database'
  | 'admin';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  userRole: UserRole;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    { id: 'status' as TabId, label: '1. Status Window', icon: User, rankReq: 'Overview' },
    { id: 'schedule' as TabId, label: '2. Schedule', icon: Calendar, rankReq: 'Timeline' },
    { id: 'daily-quests' as TabId, label: '3. Daily Quests', icon: CheckSquare, rankReq: '20 Slots' },
    { id: 'quests' as TabId, label: '4. Quests', icon: Target, rankReq: 'Main Goals' },
    { id: 'skills' as TabId, label: '5. Skills', icon: BrainCircuit, rankReq: 'Mastery' },
    { id: 'achievements' as TabId, label: '6. Achievements', icon: Award, rankReq: 'Milestones' },
    { id: 'boss-battles' as TabId, label: '7. Boss Battles', icon: Skull, rankReq: 'High Stakes' },
    { id: 'rewards' as TabId, label: '8. Rewards', icon: Gift, rankReq: 'Shop' },
    { id: 'database' as TabId, label: '9. 🗄 Database', icon: Database, rankReq: 'Audit Log' },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({
      id: 'admin' as TabId,
      label: '11. Admin Panel',
      icon: ShieldAlert,
      rankReq: 'Gated',
    });
  }

  const handleSelectTab = (tabId: TabId) => {
    soundFx.playBlip(950);
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-md"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-[57px] left-0 z-30 h-[calc(100dvh-57px)] flex-shrink-0 w-64 bg-[#0a0412]/85 backdrop-blur-xl border-r border-white/15 p-3 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-mono text-purple-300/80 border-b border-white/10 pb-2">
            <span>SYSTEM HUD NAVIGATION</span>
            <span className="animate-pulse text-purple-400 font-bold">● ACTIVE</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAdminItem = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-mono text-xs transition-all relative group ${
                    isActive
                      ? 'bg-white/12 border border-white/30 text-white shadow-[0_0_18px_rgba(168,85,247,0.35)] font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {/* Left purple indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-purple-400 shadow-[0_0_10px_#a855f7]" />
                  )}

                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${
                      isActive 
                        ? 'text-purple-300' 
                        : 'text-white/50 group-hover:text-white'
                    }`} />
                    <span className="tracking-wide font-sans text-sm">{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/15">
                      {item.rankReq}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-purple-300 translate-x-0.5' : 'text-white/30 opacity-0 group-hover:opacity-100'
                    }`} />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Widget inside Sidebar */}
        <div className="system-panel p-3 rounded-lg border-white/15 text-xs text-white/70 font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white font-bold">
            <span>SYSTEM MATRIX</span>
            <span className="text-purple-300 font-bold">STABLE</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full w-[100%] rounded-full shadow-[0_0_10px_#a855f7]" />
          </div>
          <div className="text-[10px] text-white/50 text-center">
            Solo Leveling System Interface
          </div>
        </div>
      </aside>
    </>
  );
};
