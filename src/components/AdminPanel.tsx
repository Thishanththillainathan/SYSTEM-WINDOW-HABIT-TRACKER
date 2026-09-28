import React, { useState, useEffect } from 'react';
import { 
  AdminUserRecord, 
  SystemEconomyConfig, 
  SystemNotice, 
  UserProfile,
  UserActivityLog
} from '../types';
import { soundFx } from '../utils/sound';
import { API_BASE_URL, apiFetch } from '../config/api';
import { 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Sliders, 
  Megaphone, 
  Eye, 
  Search,
  CheckCircle,
  Activity,
  Calendar,
  Layers,
  BarChart3,
  Settings,
  UserCheck,
  LogOut,
  Clock,
  Flame,
  CheckSquare,
  ShieldCheck,
  Database,
  Radio
} from 'lucide-react';

export type AdminTabId = 
  | 'overview'
  | 'users'
  | 'user-activity'
  | 'habits'
  | 'schedules'
  | 'tasks'
  | 'analytics'
  | 'settings'
  | 'profile';

interface AdminPanelProps {
  user: UserProfile;
  adminUsers: AdminUserRecord[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUserRecord[]>>;
  economy: SystemEconomyConfig;
  setEconomy: React.Dispatch<React.SetStateAction<SystemEconomyConfig>>;
  notices: SystemNotice[];
  setNotices: React.Dispatch<React.SetStateAction<SystemNotice[]>>;
  onImpersonate: (userRecord: AdminUserRecord) => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  adminUsers,
  setAdminUsers,
  economy,
  setEconomy,
  notices,
  setNotices,
  onImpersonate,
  onLogout,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMsg, setNewNoticeMsg] = useState('');

  // Admin DB statistics state
  const [dbStats, setDbStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalHabits: number;
    totalScheduledTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalQuests: number;
    completedQuests: number;
    totalSkills: number;
    totalBosses: number;
    recentActivityCount: number;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    totalHabits: 0,
    totalScheduledTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalQuests: 0,
    completedQuests: 0,
    totalSkills: 0,
    totalBosses: 0,
    recentActivityCount: 0,
  });

  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [adminHabits, setAdminHabits] = useState<any[]>([]);
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Fetch real database statistics & activity logs on load
  useEffect(() => {
    if (user.role === 'ADMIN') {
      setLoadingData(true);
      Promise.all([
        apiFetch('/api/admin/stats').then((res) => (res.ok ? res.json() : null)),
        apiFetch('/api/admin/activities').then((res) => (res.ok ? res.json() : null)),
        apiFetch('/api/admin/users').then((res) => (res.ok ? res.json() : null)),
        apiFetch('/api/admin/habits').then((res) => (res.ok ? res.json() : null)),
        apiFetch('/api/admin/tasks').then((res) => (res.ok ? res.json() : null)),
      ])
        .then(([statsData, actData, usersData, habitsData, tasksData]) => {
          if (statsData?.stats) setDbStats(statsData.stats);
          if (actData?.activities) setActivities(actData.activities);
          if (usersData?.users) setAdminUsers(usersData.users);
          if (habitsData?.habits) setAdminHabits(habitsData.habits);
          if (tasksData?.tasks) setAdminTasks(tasksData.tasks);
        })
        .catch((err) => console.error('Error loading admin data:', err))
        .finally(() => setLoadingData(false));
    }
  }, [user.role, setAdminUsers]);

  // Enforce strict client-side role verification
  if (user.role !== 'ADMIN') {
    return (
      <div className="system-panel p-8 rounded-xl text-center space-y-4 font-mono max-w-xl mx-auto my-12 border-rose-500/40">
        <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto animate-bounce" />
        <h2 className="font-orbitron font-bold text-2xl text-rose-400 tracking-wider">
          ACCESS DENIED — ADMIN CLEARANCE REQUIRED
        </h2>
        <p className="text-xs text-white/70">
          Your current Hunter account does not hold System Administrator credentials. 
          Unauthorized access attempts to <code className="text-purple-300">/admin</code> are logged.
        </p>
      </div>
    );
  }

  const toggleUserAccess = async (id: string, currentStatus: string) => {
    soundFx.playBlip(900);
    const nextStatus = currentStatus === 'Active' ? 'Sealed' : 'Active';

    try {
      await apiFetch(`/api/admin/users/${id}/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: nextStatus === 'Active' ? 'ACTIVE' : 'SEALED' }),
      });
    } catch (err) {
      console.error('Error toggling access:', err);
    }

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
    );
  };

  const toggleUserRole = async (id: string, currentRole: string) => {
    soundFx.playBlip(1000);
    const nextRole = currentRole === 'admin' ? 'customer' : 'admin';

    try {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
    } catch (err) {
      console.error('Error toggling role:', err);
    }

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u))
    );
  };

  const handleBroadcastNotice = async () => {
    if (!newNoticeTitle.trim() || !newNoticeMsg.trim()) return;
    soundFx.playLevelUp();

    try {
      await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNoticeTitle, message: newNoticeMsg }),
      });
    } catch (err) {
      console.error('Broadcast error:', err);
    }

    const item: SystemNotice = {
      id: `not-${Date.now()}`,
      title: newNoticeTitle,
      message: newNoticeMsg,
      timestamp: new Date().toLocaleString(),
      type: 'INFO',
      active: true,
    };

    setNotices((prev) => [item, ...prev]);
    setNewNoticeTitle('');
    setNewNoticeMsg('');
  };

  const filteredUsers = adminUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navTabs: { id: AdminTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'user-activity', label: 'User Activity', icon: Activity },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'profile', label: 'Admin Profile', icon: UserCheck },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full min-h-0">
      {/* SEPARATE ADMIN SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-4 flex flex-col justify-between shrink-0 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <div className="space-y-4">
          {/* Sidebar Title Header */}
          <div className="border-b border-white/15 pb-3">
            <div className="flex items-center space-x-2 text-purple-300 font-orbitron font-bold text-sm tracking-wider">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>ADMIN CONTROL CENTER</span>
            </div>
            <p className="text-[10px] font-mono text-white/50 mt-1">
              [SYSTEM ROOT ACCESS LOGGED]
            </p>
          </div>

          {/* Tab Buttons */}
          <nav className="space-y-1.5 font-mono text-xs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playBlip(800);
                    setActiveAdminTab(tab.id);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all relative ${
                    isActive
                      ? 'bg-white/20 border border-white/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-white/40'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Logout Button */}
        <div className="border-t border-white/15 pt-3 mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-orbitron font-bold text-xs transition shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>ADMIN LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN CONTENT AREA */}
      <main className="flex-1 w-full space-y-6 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeAdminTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                  ADMIN OVERVIEW
                </h1>
                <p className="text-xs font-mono text-white/60">
                  REAL-TIME DATABASE SYSTEM METRICS & PERFORMANCE INDICATORS
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>SQLITE ACTIVE</span>
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>TOTAL USERS</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="font-orbitron font-bold text-3xl text-purple-300">
                  {dbStats.totalUsers || adminUsers.length}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{dbStats.activeUsers} Verified Active</span>
                </div>
              </div>

              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>TOTAL HABITS</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-orbitron font-bold text-3xl text-amber-300">
                  {dbStats.totalHabits}
                </div>
                <div className="text-[11px] text-white/40">Registered User Habits</div>
              </div>

              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>SCHEDULED TASKS</span>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-orbitron font-bold text-3xl text-emerald-300">
                  {dbStats.totalScheduledTasks}
                </div>
                <div className="text-[11px] text-emerald-400">
                  {dbStats.completedTasks} Done ({dbStats.pendingTasks} Pending)
                </div>
              </div>

              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>RECENT ACTIVITY LOGS</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="font-orbitron font-bold text-3xl text-blue-300">
                  {activities.length}
                </div>
                <div className="text-[11px] text-white/40">Logged Actions</div>
              </div>
            </div>

            {/* Quick Audit Trail Preview */}
            <div className="system-panel p-5 rounded-xl border-white/20 space-y-4">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <span className="font-orbitron font-bold text-sm text-white tracking-wider">
                  RECENT MEANINGFUL USER ACTIVITIES
                </span>
                <button
                  onClick={() => setActiveAdminTab('user-activity')}
                  className="text-xs font-mono text-purple-300 hover:underline"
                >
                  View All Activity →
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="text-center font-mono text-xs text-white/50 py-6">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5 font-mono text-xs">
                  {activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center space-x-2">
                          <span>{act.username}</span>
                          {(act as any).email && <span className="text-[10px] font-normal text-white/40">({(act as any).email})</span>}
                        </div>
                        <div className="text-purple-300 text-[11px]">{act.summary}</div>
                      </div>
                      <div className="text-right text-[11px] text-white/40">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Recently'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
              <div>
                <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                  USER MANAGEMENT
                </h1>
                <p className="text-xs font-mono text-white/60">
                  AUTHENTICATED USERS LIST & ACCESS CONTROL
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user email or name..."
                  className="bg-white/10 border border-white/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400 w-64"
                />
              </div>
            </div>

            <div className="system-panel p-5 rounded-xl border-white/20 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/15 text-white/60 text-[11px]">
                    <th className="py-3 px-3">USER / EMAIL</th>
                    <th className="py-3 px-3">ROLE</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">CREATED DATE</th>
                    <th className="py-3 px-3">LAST ACTIVITY</th>
                    <th className="py-3 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white font-sans text-sm">{u.username}</div>
                        <div className="text-white/50 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            (u.role || 'user') === 'admin'
                              ? 'bg-purple-950/80 border-purple-400/50 text-purple-300'
                              : 'bg-white/10 border-white/20 text-white/80'
                          }`}
                        >
                          {(u.role || 'user').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.status === 'Active' || (u.status as string) === 'verified'
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/60">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-3 text-white/50">{u.lastActive || 'Active now'}</td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => onImpersonate(u)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 text-[11px] transition"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => toggleUserAccess(u.id, u.status)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 text-[11px] transition"
                        >
                          {u.status === 'Active' ? 'Revoke' : 'Grant Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* USER ACTIVITY TAB */}
        {activeAdminTab === 'user-activity' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                USER ACTIVITY LOGS
              </h1>
              <p className="text-xs font-mono text-white/60">
                AUDIT TRAIL OF MEANINGFUL USER CUSTOMIZATIONS & SETUP CHANGES
              </p>
            </div>

            <div className="system-panel p-5 rounded-xl border-white/20">
              {activities.length === 0 ? (
                <div className="text-center font-mono text-xs text-white/50 py-10">
                  No user activity recorded in database logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-white/60 text-[11px]">
                        <th className="py-2.5 px-3">USER EMAIL / NAME</th>
                        <th className="py-2.5 px-3">ACTION</th>
                        <th className="py-2.5 px-3">SUMMARY</th>
                        <th className="py-2.5 px-3 text-right">DATE / TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {activities.map((act) => (
                        <tr key={act.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{act.username}</div>
                            {(act as any).email && <div className="text-white/40 text-[11px]">{(act as any).email}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold text-[10px]">
                              {act.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-white/80">{act.summary}</td>
                          <td className="py-3 px-3 text-right text-white/50 text-[11px]">
                            {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Recently'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HABITS TAB */}
        {activeAdminTab === 'habits' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                SYSTEM HABITS OVERVIEW
              </h1>
              <p className="text-xs font-mono text-white/60">
                SYSTEM-WIDE HABITS CREATED BY REGISTERED USERS
              </p>
            </div>

            <div className="system-panel p-5 rounded-xl border-white/20">
              {adminHabits.length === 0 ? (
                <div className="text-center font-mono text-xs text-white/50 py-10">
                  No habits created by users yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-white/60 text-[11px]">
                        <th className="py-2.5 px-3">HABIT NAME</th>
                        <th className="py-2.5 px-3">CATEGORY</th>
                        <th className="py-2.5 px-3">FREQUENCY</th>
                        <th className="py-2.5 px-3">USER</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">CREATED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {adminHabits.map((h) => (
                        <tr key={h.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-bold text-white">{h.name}</td>
                          <td className="py-3 px-3 text-purple-300">{h.category || 'General'}</td>
                          <td className="py-3 px-3 text-white/70">{h.frequency || 'Daily'}</td>
                          <td className="py-3 px-3 text-white/60">{h.user_email || 'User'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-white/50 text-[11px]">
                            {h.created_at ? new Date(h.created_at).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHEDULES TAB */}
        {activeAdminTab === 'schedules' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                SYSTEM SCHEDULES
              </h1>
              <p className="text-xs font-mono text-white/60">
                USER SCHEDULE TIMELINES & DATE-WISE TIME SLOTS
              </p>
            </div>

            <div className="system-panel p-5 rounded-xl border-white/20 text-center py-10 font-mono text-xs text-white/60">
              <Calendar className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-80" />
              <p>System schedule events and calendar entries across registered accounts.</p>
              <div className="mt-4 font-bold text-purple-300 text-sm">
                Total Schedule Event Slots: {dbStats.totalScheduledTasks}
              </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeAdminTab === 'tasks' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                SCHEDULED TASKS & TO-DOS
              </h1>
              <p className="text-xs font-mono text-white/60">
                DATE-WISE TASK ENTRIES CREATED BY USERS
              </p>
            </div>

            <div className="system-panel p-5 rounded-xl border-white/20">
              {adminTasks.length === 0 ? (
                <div className="text-center font-mono text-xs text-white/50 py-10">
                  No date-wise tasks created by users yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-white/60 text-[11px]">
                        <th className="py-2.5 px-3">TASK TITLE</th>
                        <th className="py-2.5 px-3">DATE & TIME</th>
                        <th className="py-2.5 px-3">PRIORITY</th>
                        <th className="py-2.5 px-3">USER</th>
                        <th className="py-2.5 px-3 text-right">COMPLETED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {adminTasks.map((t) => (
                        <tr key={t.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-bold text-white">{t.title}</td>
                          <td className="py-3 px-3 text-purple-300">
                            {t.task_date} {t.start_time ? `@ ${t.start_time}` : ''}
                          </td>
                          <td className="py-3 px-3 text-amber-300">{t.priority || 'MEDIUM'}</td>
                          <td className="py-3 px-3 text-white/60">{t.user_email || 'User'}</td>
                          <td className="py-3 px-3 text-right">
                            {t.is_completed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                                DONE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/20 text-white/60">
                                PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeAdminTab === 'analytics' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                PLATFORM ANALYTICS
              </h1>
              <p className="text-xs font-mono text-white/60">
                SYSTEM USAGE, ENGAGEMENT & TASK COMPLETION RATIOS
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <span className="text-xs text-white/60 block">TASK COMPLETION RATE</span>
                <div className="font-orbitron font-bold text-3xl text-emerald-400">
                  {dbStats.totalScheduledTasks > 0
                    ? Math.round((dbStats.completedTasks / dbStats.totalScheduledTasks) * 100)
                    : 0}%
                </div>
                <div className="text-[10px] text-white/40">
                  {dbStats.completedTasks} completed / {dbStats.totalScheduledTasks} total tasks
                </div>
              </div>

              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <span className="text-xs text-white/60 block">VERIFIED USER RATIO</span>
                <div className="font-orbitron font-bold text-3xl text-purple-300">
                  {dbStats.totalUsers > 0
                    ? Math.round((dbStats.activeUsers / dbStats.totalUsers) * 100)
                    : 100}%
                </div>
                <div className="text-[10px] text-white/40">
                  {dbStats.activeUsers} verified of {dbStats.totalUsers} accounts
                </div>
              </div>

              <div className="system-panel p-5 rounded-xl border-white/20 space-y-2">
                <span className="text-xs text-white/60 block">TOTAL LOGGED ACTIVITIES</span>
                <div className="font-orbitron font-bold text-3xl text-amber-300">
                  {activities.length}
                </div>
                <div className="text-[10px] text-white/40">Audit trail records in SQLite</div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {activeAdminTab === 'settings' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                SYSTEM SETTINGS
              </h1>
              <p className="text-xs font-mono text-white/60">
                IN-APP BROADCASTS, GAME ECONOMY MULTIPLIERS & SERVER HEALTH
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broadcast Announcement Tool */}
              <div className="system-panel p-5 rounded-xl border-white/20 space-y-4">
                <div className="flex items-center space-x-2 text-purple-300 font-orbitron font-bold text-sm border-b border-white/15 pb-2">
                  <Megaphone className="w-4 h-4" />
                  <span>BROADCAST IN-APP SYSTEM NOTICE</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-white/70 mb-1">NOTICE TITLE</label>
                    <input
                      type="text"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      placeholder="e.g. SYSTEM ANNOUNCEMENT: MAINTENANCE SCHEDULED"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">BROADCAST MESSAGE</label>
                    <textarea
                      value={newNoticeMsg}
                      onChange={(e) => setNewNoticeMsg(e.target.value)}
                      placeholder="Enter system notice text visible to all active users..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none h-20 focus:border-purple-400"
                    />
                  </div>

                  <button
                    onClick={handleBroadcastNotice}
                    className="hex-btn w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    PUSH SYSTEM NOTICE BROADCAST
                  </button>
                </div>
              </div>

              {/* Game Economy Rebalancing */}
              <div className="system-panel p-5 rounded-xl border-white/20 space-y-4">
                <div className="flex items-center space-x-2 text-purple-300 font-orbitron font-bold text-sm border-b border-white/15 pb-2">
                  <Sliders className="w-4 h-4" />
                  <span>GAME ECONOMY MULTIPLIERS</span>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-white/70 mb-1">
                      <span>GLOBAL XP MULTIPLIER:</span>
                      <span className="text-purple-300 font-bold">{economy.xpMultiplier}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={economy.xpMultiplier}
                      onChange={(e) =>
                        setEconomy((prev) => ({ ...prev, xpMultiplier: Number(e.target.value) }))
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-white/70 mb-1">
                      <span>STREAK BONUS MULTIPLIER:</span>
                      <span className="text-amber-300 font-bold">{economy.defaultStreakBonus}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.1"
                      value={economy.defaultStreakBonus}
                      onChange={(e) =>
                        setEconomy((prev) => ({ ...prev, defaultStreakBonus: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN PROFILE TAB */}
        {activeAdminTab === 'profile' && (
          <div className="space-y-6">
            <div className="border-b border-white/15 pb-3">
              <h1 className="font-orbitron font-bold text-2xl text-white text-glow tracking-wider">
                ADMIN PROFILE
              </h1>
              <p className="text-xs font-mono text-white/60">
                SYSTEM ADMINISTRATOR ACCOUNT DETAILS
              </p>
            </div>

            <div className="system-panel p-6 rounded-2xl border-white/20 max-w-xl space-y-4 font-mono text-xs">
              <div className="flex items-center space-x-4 border-b border-white/15 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-400/40 text-purple-300 flex items-center justify-center font-orbitron font-bold text-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  ADM
                </div>
                <div>
                  <h2 className="font-orbitron font-bold text-lg text-white">{user.username}</h2>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold">
                    ROOT CLEARANCE (S-RANK ADMIN)
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-white/80">
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/50">ADMIN EMAIL:</span>
                  <span className="font-bold text-white">{user.email || 'admin@sololeveling.app'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/50">ROLE:</span>
                  <span className="font-bold text-purple-300">ADMIN</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-white/50">STATUS:</span>
                  <span className="font-bold text-emerald-400">VERIFIED</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-white/50">SECURITY PROTOCOL:</span>
                  <span className="text-purple-300">BCRYPT + JWT COOKIE AUTHORIZATION</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
